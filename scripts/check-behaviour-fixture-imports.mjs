#!/usr/bin/env node
/**
 * The behaviour fixture may not reach @spec-kitty/elements through the package barrel (#225).
 *
 * The mutation harness runs each arm against the test files Vitest's dependency graph says the
 * mutated source can reach. That filter landed in `e83ec64` and was INERT for its whole first
 * day, because 20 of the 23 `fixtures/elements-behaviour` tests opened with
 * `import '@spec-kitty/elements'` — a side-effect import of a barrel that re-exports every
 * element. The graph was not wrong: `sk-button.test.ts` really did depend on `sk-notice.ts`, so
 * an element source honestly resolved to 30 of the 36 browser test files and every arm ran
 * almost the whole suite.
 *
 * #225 made the imports honest and the selection fell to 9.8 files per element source. The
 * committed `selftestCeilingSeconds` is derived from that number. ONE barrel import puts its
 * file back into EVERY element arm's selection, and enough of them return the cost to
 * O(arms x elements) — the exponent the ceiling's whole history is about.
 *
 * WHY A GATE AND NOT A NOTE. `docs/contributing/adding-a-component.md` describes the rule, and
 * the first violation existed before the ink dried: PR #241's `sk-time-series-chart.test.ts` was
 * written against the old convention and measured at 31s of added cost, "and a permanent one on
 * every arm added after it". A documented rule that nothing re-derives is the defect class
 * `suite-budget.json` records against itself five times; this is the same shape, so it gets the
 * same treatment as every other rule in this repository that matters.
 *
 * WHY A BLANKET BAN AND NOT AN ALLOWLIST. An earlier draft of #225 kept six in-body
 * `await import('@spec-kitty/elements')` calls and claimed they proved "the class the barrel
 * exports IS the registered constructor". They did not — all six are `[SC-010]` late-upgrade
 * tests that subclass the export and assert pre-upgrade property survival; none compares it to
 * `customElements.get(tag)`. They were deep-imported instead. So the fixture now has zero barrel
 * references and needs no exception list to rot. A claim ABOUT the barrel belongs in
 * `tests/browser/`, which this gate does not scan and which already imports it.
 *
 * Usage: node scripts/check-behaviour-fixture-imports.mjs [--selftest]
 */
import { cpSync, globSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCAN = 'fixtures/elements-behaviour/src/**/*.{ts,tsx}';
const BARREL = '@spec-kitty/elements';

/**
 * Comments are stripped before matching, so the many comments that NAME this rule — including
 * the ones in this file's own subject directory — do not flag. String and template literals are
 * NOT stripped, because the thing being detected IS a quoted specifier.
 *
 * A regex cannot do this: a `//` sequence inside a string literal, and a block-comment closer
 * inside a template literal, each defeat one. So this is a small state walk instead. It is the
 * same reason
 * check-story-theme-wrapper.mjs anchors on a tag opener rather than trusting a bare match.
 */
export function stripComments(source) {
  let out = '';
  let i = 0;
  let state = 'code';
  let quote = '';
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (state === 'code') {
      if (c === '/' && next === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && next === '*') { state = 'block'; i += 2; continue; }
      if (c === "'" || c === '"' || c === '`') { state = 'string'; quote = c; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (state === 'line') {
      if (c === '\n') { state = 'code'; out += c; }
      i++; continue;
    }
    if (state === 'block') {
      if (c === '*' && next === '/') { state = 'code'; i += 2; continue; }
      // Keep newlines so reported line numbers stay true.
      if (c === '\n') out += c;
      i++; continue;
    }
    // state === 'string'
    if (c === '\\') { out += c + (next ?? ''); i += 2; continue; }
    out += c;
    if (c === quote) state = 'code';
    i++;
  }
  return out;
}

/** A quoted module specifier naming the barrel, or any subpath of it. */
const SPECIFIER = /(['"])@spec-kitty\/elements(?:\/[^'"]*)?\1/g;

export function barrelReferences(source) {
  const stripped = stripComments(source);
  const hits = [];
  for (const match of stripped.matchAll(SPECIFIER)) {
    hits.push({
      line: stripped.slice(0, match.index).split('\n').length,
      text: match[0],
    });
  }
  return hits;
}

export function offenders(files, read = (f) => readFileSync(f, 'utf8')) {
  return files
    .map((file) => ({ file, hits: barrelReferences(read(file)) }))
    .filter(({ hits }) => hits.length > 0);
}

if (process.argv.includes('--selftest')) {
  const PROBES = [
    ['a side-effect barrel import — the form that made the filter inert', "import '@spec-kitty/elements';", true],
    ['a named barrel import', "import { SkButton } from '@spec-kitty/elements';", true],
    ['a TYPE-only barrel import, which still creates the graph edge for Vite', "import type { SkCard } from '@spec-kitty/elements';", true],
    ['a default barrel import', 'import elements from "@spec-kitty/elements";', true],
    ['a multi-line named import', "import {\n  SkNavPill,\n  SkNotice,\n} from '@spec-kitty/elements';", true],
    ['an in-body dynamic import — the form the earlier draft kept', "const { SkCard } = await import('@spec-kitty/elements');", true],
    ['a dynamic import of a SUBPATH', "await import('@spec-kitty/elements/elements.js');", true],
    ['double-quoted, because the specifier quote style is free', 'await import("@spec-kitty/elements");', true],
    ['require, in case a .ts file ever reaches for it', "require('@spec-kitty/elements');", true],
    ['the CORRECT deep import', "import '../../../packages/elements/src/button/sk-button.js';", false],
    ['the CORRECT deep dynamic import', "const { SkCard } = await import('../../../packages/elements/src/card/sk-card.js');", false],
    ['a LINE comment naming the rule', "// never import '@spec-kitty/elements' here — see #225", false],
    ['a BLOCK comment naming the rule', "/* the barrel is '@spec-kitty/elements' and this file must not reach it */", false],
    ['a JSDoc block naming the rule', "/**\n * `import '@spec-kitty/elements'` puts every element in this file's graph.\n */", false],
    // The three shapes a naive stripper gets wrong, kept as rows because each was a real defect
    // in a draft of this file rather than an imagined one.
    ['a `//` inside a STRING, which a line-comment stripper would run past', "const note = '// see #225';\nimport '@spec-kitty/elements';", true],
    ['a block-comment closer inside a TEMPLATE literal', "const t = `a */ b`;\nimport '@spec-kitty/elements';", true],
    ['an escaped quote, which does not close a specifier', "const note = 'x \\'@spec-kitty/elements\\' y';", false],
    ['a real import AFTER a comment that mentions the rule', "// see #225: no '@spec-kitty/elements'\nimport '@spec-kitty/elements';", true],
    ['a comment AFTER a correct deep import', "import '../../../packages/elements/src/card/sk-card.js'; // not '@spec-kitty/elements'", false],
    ['@spec-kitty/react, which this rule is not about', "import { SkButton } from '@spec-kitty/react';", false],
    ['@spec-kitty/tokens, likewise', "import css from '@spec-kitty/tokens/tokens.css?raw';", false],
    ['a package whose name merely STARTS with the barrel name', "import x from '@spec-kitty/elements-extra';", false],
  ];
  let bad = 0;
  let mustCatch = 0;
  for (const [note, text, shouldFlag] of PROBES) {
    const flagged = barrelReferences(text).length > 0;
    if (shouldFlag) mustCatch++;
    if (flagged !== shouldFlag) {
      console.error(`  ✗ ${note}: expected ${shouldFlag ? 'a flag' : 'no flag'}, got the opposite`);
      bad++;
    }
  }
  if (mustCatch === 0) {
    console.error('❌ the probe table flags nothing — a self-check that cannot fail proves nothing.');
    process.exit(1);
  }

  /**
   * END-TO-END, because a probe table certifies the REGEX and not the GATE.
   *
   * #193 shipped a probe table that passed while the check it described could not see the files
   * it scanned. So this plants the offending import into a COPY of the real fixture, runs the
   * real scan over the real glob, and requires exactly that file back — and then requires the
   * untouched copy to be clean, so a scan that flags everything cannot pass either.
   */
  const sandbox = mkdtempSync(join(tmpdir(), 'fixture-imports-selftest-'));
  let e2e = 0;
  try {
    cpSync('fixtures/elements-behaviour/src', join(sandbox, 'src'), { recursive: true });
    const scan = () => globSync(join(sandbox, 'src/**/*.{ts,tsx}')).filter((f) => f.endsWith('.test.ts'));
    const files = scan();
    if (files.length === 0) {
      console.error('  ✗ end-to-end: the sandbox copy scanned zero files');
      e2e++;
    }
    const clean = offenders(files);
    if (clean.length > 0) {
      console.error(`  ✗ end-to-end: the untouched copy flagged ${clean.length} file(s) — the scan is over-broad`);
      e2e++;
    }
    const victim = files.find((f) => f.endsWith('sk-button.test.ts')) ?? files[0];
    writeFileSync(victim, `import '${BARREL}';\n${readFileSync(victim, 'utf8')}`);
    const planted = offenders(scan());
    if (planted.length !== 1 || planted[0].file !== victim) {
      console.error(
        `  ✗ end-to-end: planting a barrel import in ${victim} produced ` +
          `${planted.length} offender(s) instead of exactly that one`
      );
      e2e++;
    }
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }

  if (bad || e2e) {
    console.error(`\n❌ ${bad} probe row(s) and ${e2e} end-to-end arm(s) did not behave as specified.`);
    process.exit(1);
  }
  console.log(
    `✅ ${PROBES.length} probe row(s) (${mustCatch} of which must flag) and the end-to-end ` +
      `plant-and-detect arm behave as specified.`
  );
  process.exit(0);
}

const files = globSync(SCAN).filter((file) => file.endsWith('.test.ts') || file.endsWith('.test.tsx'));

/** A gate over an empty set reports green having checked nothing. */
if (files.length === 0) {
  console.error(`❌ ${SCAN} matched no test file — refusing to pass over an empty set.`);
  process.exit(1);
}

const bad = offenders(files);
if (bad.length > 0) {
  console.error('❌ the behaviour fixture reaches @spec-kitty/elements through the package barrel:');
  for (const { file, hits } of bad) {
    for (const hit of hits) console.error(`   ${file}:${hit.line}  ${hit.text}`);
  }
  console.error(
    '\n   The barrel re-exports every element, so one such import puts EVERY element module in\n' +
      "   this file's dependency graph — and the mutation harness selects each arm's tests from\n" +
      '   that graph. The file then runs in every element arm, and the committed\n' +
      '   selftestCeilingSeconds no longer describes the suite it bounds.\n\n' +
      '   Import the element modules this file exercises instead:\n' +
      "     import '../../../packages/elements/src/button/sk-button.js';\n" +
      "     import { buttonStaticHtml } from '../../../packages/elements/src/button/sk-button.markup.js';\n\n" +
      '   A claim ABOUT the barrel belongs in tests/browser/, which already imports it and which\n' +
      '   this gate does not scan. See docs/contributing/adding-a-component.md and #225.'
  );
  process.exit(1);
}
console.log(
  `✅ ${files.length} behaviour fixture test file(s) import element modules directly; ` +
    'none reaches the package barrel.'
);
