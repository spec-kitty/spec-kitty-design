#!/usr/bin/env node
/**
 * Every element reaches BOTH distribution entries (ADR-10 §2).
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
 * Usage: node scripts/check-elements-entries.mjs
 */
import { readFileSync, globSync } from 'node:fs';
import { basename } from 'node:path';

const SRC = 'packages/elements/src';
const ENTRIES = [
  {
    file: `${SRC}/elements.ts`,
    what: 'the IIFE entry',
    // Side-effect import: registration is the point, there is nothing to name.
    expected: (name) => `import './${name}/sk-${name}.js';`,
    why: 'without it the self-contained browser build does not register the element, and only a no-bundler consumer notices',
  },
  {
    file: `${SRC}/index.ts`,
    what: 'the ESM entry',
    expected: (name, cls) => `from './${name}/sk-${name}.js'`,
    why: 'without it a bundler consumer cannot import the class, and the element is unregistered unless something else pulls it in',
  },
];

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

const problems = [];
for (const { file, what, expected, why } of ENTRIES) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    problems.push(`${file} is missing — ${what} cannot be checked`);
    continue;
  }
  for (const name of elements) {
    if (!text.includes(expected(name))) {
      problems.push(`<sk-${name}> is absent from ${file} (${what}) — ${why}`);
    }
  }
}

if (problems.length) {
  console.error('❌ An element does not reach every distribution entry (ADR-10 §2):');
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}

console.log(
  `✅ All ${elements.length} element(s) reach both distribution entries: ${elements.join(', ')}.`
);
