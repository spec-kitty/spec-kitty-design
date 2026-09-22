#!/usr/bin/env node
/**
 * Every element reaches BOTH distribution entries (ADR-10 §2), and reaches them at RUNTIME.
 *
 * `packages/elements/src/elements.ts` — the IIFE entry — was a hand-maintained list of
 * side-effect imports, and `src/index.ts` a hand-maintained list of named exports. #73 added
 * `sk-nav-pill` to the second and not the first, and everything stayed green: the vitest lane
 * resolves `@spec-kitty/elements` to `src/index.ts`, the manifest analyzer reads source, the
 * a11y gate loads Storybook's own module graph. Only the deployed demo — a real page loading
 * the real self-contained bundle with no bundler — went quiet, and it took a Playwright
 * failure to notice.
 *
 * That is the hand-maintained-list defect this repo removed from the CSS pipeline in #71 and
 * from the markup generator in #72, surviving in the one file where nothing derived anything.
 *
 * PARSED, NOT MATCHED AS TEXT — and this took three tries, each defeated by the same class
 * of thing it was written to catch.
 *
 *   1. `text.includes(...)` over raw source. A commented-out import passed green, and
 *      commenting an import out to bisect a build failure is the single most likely way this
 *      defect actually recurs.
 *   2. A regex over esbuild's TRANSFORMED output. That fixed comments and `export type` —
 *      but esbuild's transform defaults to `legalComments: "inline"`, so `/*! … *\/`,
 *      `/* @license … *\/` and `//! …` survive verbatim; and a specifier sitting inside a
 *      STRING or template literal still matched. Still a regex over a grammar, in the same
 *      commit that replaced the CSS gate's regex with a real AST for exactly that reason.
 *   3. This one: esbuild's own METAFILE import list, which is what the bundler resolved.
 *      A comment of any flavour contributes nothing, an erased `export type` contributes
 *      nothing, and a string containing an import statement is a string.
 *
 * `external: ['*']` keeps it to the entry's own import list rather than walking the graph.
 *
 * `--selftest` runs the committed probe table below against a temporary entry file instead of
 * the repository. The sibling CSS gate got one in the same fold; this one did not, and a lens
 * immediately falsified two of the six forms its commit message claimed to have probed. Prose
 * probes are unrunnable, which is the whole point.
 *
 * Usage: node scripts/check-elements-entries.mjs [--selftest]
 */
import { readFileSync, globSync } from 'node:fs';
import { basename } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as esbuild from 'esbuild';

const SRC = 'packages/elements/src';
const selftest = process.argv.includes('--selftest');

if (selftest) {
  // Each probe is an `elements.ts` body. `present` says whether sk-widget should count as
  // reaching the entry. Every "absent" form here defeated an earlier version of this gate.
  const PROBES = [
    ["import './widget/sk-widget.js';", true, 'the real thing'],
    ['import "./widget/sk-widget.js";', true, 'double quotes'],
    ["import './widget/sk-widget.js'; // trailing comment", true, 'code plus a comment'],
    ["export { SkWidget } from './widget/sk-widget.js';", true, 'a value re-export'],
    ["// import './widget/sk-widget.js';", false, 'commented out — defeated version 1'],
    ["// TODO: import './widget/sk-widget.js';", false, 'TODO comment'],
    ["/* import './widget/sk-widget.js'; */", false, 'block comment'],
    ["/*! import './widget/sk-widget.js'; */", false, 'LEGAL comment — defeated version 2'],
    ["/* @license import './widget/sk-widget.js'; */", false, 'license comment — defeated version 2'],
    ["//! import './widget/sk-widget.js';", false, 'legal line comment — defeated version 2'],
    [`export const usage = 'import "./widget/sk-widget.js"';`, false, 'string literal — defeated version 2'],
    ['export const usage = `import "./widget/sk-widget.js"`;', false, 'template literal — defeated version 2'],
    ["export type { SkWidget } from './widget/sk-widget.js';", false, 'export type — ERASED at build'],
    ['export const nothing = 1;', false, 'absent entirely'],
  ];
  const dir = mkdtempSync(join(tmpdir(), 'entries-selftest-'));
  let bad = 0;
  try {
    for (const [body, present, note] of PROBES) {
      const f = join(dir, 'probe.ts');
      // A second, real import so the "resolves ZERO imports" arm does not mask the result.
      writeFileSync(f, `import './other/sk-other.js';\n${body}\n`);
      const got = runtimeSpecifiers(f).has('./widget/sk-widget.js');
      const ok = got === present;
      if (!ok) bad += 1;
      console.log(`${ok ? '✅' : '❌'} ${present ? 'present' : 'absent '}  ${body.slice(0, 56).padEnd(58)} ${note}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const absent = PROBES.filter(([, p]) => !p).length;
  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  // A table that never expects "absent" would pass with the gate stubbed out.
  if (absent < 8 || absent === PROBES.length) {
    console.error(
      `\n❌ Degenerate probe table: ${absent} absent-form(s). Every defeated form this gate has\n` +
        '   ever had must stay in the table — that is the only thing keeping them closed.'
    );
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} probes behaved as recorded (${absent} absent, ${PROBES.length - absent} present).`);
  process.exit(0);
}


const elements = globSync(`${SRC}/**/sk-*.ts`, {})
  .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
  .map((f) => basename(f).replace(/^sk-/, '').replace(/\.ts$/, ''))
  .sort();

if (elements.length === 0) {
  console.error(
    `❌ Refusing to report green over an empty set: no sk-<name>.ts found under ${SRC}.`
  );
  process.exit(1);
}

/** The specifiers an entry actually resolves, from esbuild's metafile. */
function runtimeSpecifiers(file) {
  const result = esbuild.buildSync({
    entryPoints: [file],
    bundle: true,
    write: false,
    metafile: true,
    format: 'esm',
    // Nothing is followed: we want THIS file's import list, not the module graph.
    external: ['*'],
    packages: 'external',
  });
  // `external: ['*']` means the entry is the ONLY input, so its key does not have to be
  // guessed — metafile keys are cwd-relative and a file outside cwd would not match `file`.
  const inputs = Object.values(result.metafile.inputs);
  if (inputs.length !== 1) {
    throw new Error(`expected exactly one metafile input for ${file}, got ${inputs.length}`);
  }
  return new Set((inputs[0].imports ?? []).map((i) => i.path));
}

const ENTRIES = [
  {
    file: `${SRC}/elements.ts`,
    what: 'the IIFE entry',
    why: 'without it the self-contained browser build does not register the element, and only a no-bundler consumer notices',
  },
  {
    file: `${SRC}/index.ts`,
    what: 'the ESM entry',
    why: 'without it a bundler consumer cannot import the class, and the element is unregistered unless something else pulls it in',
  },
];

const problems = [];
for (const { file, what, why } of ENTRIES) {
  let specifiers;
  try {
    specifiers = runtimeSpecifiers(file);
  } catch (err) {
    problems.push(
      `${file} (${what}) could not be parsed — ${String(err?.message ?? err).split('\n')[0]}`
    );
    continue;
  }
  // A parse that yields no imports at all is not a pass: it is the same silence, one level up.
  if (specifiers.size === 0) {
    problems.push(`${file} (${what}) resolves ZERO runtime imports — it registers nothing`);
    continue;
  }
  for (const name of elements) {
    if (!specifiers.has(`./${name}/sk-${name}.js`)) {
      problems.push(`<sk-${name}> is absent from ${file} (${what}) — ${why}`);
    }
  }
}

if (problems.length) {
  console.error('❌ An element does not reach every distribution entry (ADR-10 §2):');
  for (const p of problems) console.error(`   ${p}`);
  console.error(
    '\n   Checked against the imports esbuild actually RESOLVES, so a commented-out line and\n' +
      "   an erased `export type` both count as absent — which is what they are at runtime."
  );
  process.exit(1);
}

console.log(
  `✅ All ${elements.length} element(s) reach both distribution entries at runtime: ${elements.join(', ')}.`
);
