#!/usr/bin/env node
/**
 * MARKDOWN FENCE BALANCE over docs/**.md (#456).
 *
 * WHY THIS EXISTS. A commit on PR #457 inserted one code snippet at 143 sites instead of 1 in
 * `docs/design-system/using-components.md`: an unanchored global substitution put a copy before
 * every code fence in the file, including the theme-bootstrap `<head>` example, the chart docs,
 * the form docs and the site-footer docs. The file went 2,633 -> 4,891 lines. 70 existing
 * openers (```html, ```css) were consumed as the CLOSERS of the injected blocks, so per
 * CommonMark the blocks never closed and ~1,650 lines of consumer-facing prose -- the usage
 * contracts for every component in this design system, not just the one being edited -- rendered
 * as code.
 *
 * All 15 CI jobs stayed green. Nothing in this repository parses Markdown: `lint-code` is
 * ESLint, Stylelint and HTMLHint, and the specs that read this file slice a named `## ` heading
 * and assert substrings are PRESENT -- which an insertion cannot break. Three independent review
 * lenses caught it by reading the diff; no automated check could have. `gate: success` over that
 * document certified only that nothing which inspects it looks at prose.
 *
 * WHAT IT ASSERTS, per file:
 *   1. fences pair -- an even number of ``` markers, so no file ends inside a code block;
 *   2. every CLOSER is bare -- an info string (```js) in a closing position means a preceding
 *      opener was swallowed, which is the precise signature of the defect above.
 * Openers may carry an info string; that is normal and not checked further.
 *
 * Deliberately not a Markdown linter. It checks the one structural property whose violation is
 * invisible to every other gate here and silently corrupts published output.
 */
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FENCE = /^\s*```/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (path.endsWith('.md')) yield path;
  }
}

/** @returns {{file: string, reason: string, detail: string[]}[]} */
function checkTree(root) {
  const failures = [];
  for (const file of walk(root)) {
    const fences = [];
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (FENCE.test(line)) fences.push({ line: i + 1, text: line.trim() });
      });
    if (fences.length % 2 !== 0) {
      const last = fences[fences.length - 1];
      failures.push({
        file,
        reason: `${fences.length} fence markers — odd, so the file ends inside a code block`,
        detail: [`last fence at line ${last.line}: ${last.text}`],
      });
      continue;
    }
    const badClosers = fences.filter((f, i) => i % 2 === 1 && f.text !== '```');
    if (badClosers.length > 0) {
      failures.push({
        file,
        reason:
          `${badClosers.length} closing fence(s) carry an info string — an opener was consumed ` +
          'as a closer, so the block structure is inverted from there on',
        detail: badClosers.slice(0, 10).map((f) => `line ${f.line}: ${f.text}`),
      });
    }
  }
  return failures;
}

/**
 * Red-first probes. Each fixture is a whole docs tree, and every RED case is the clean case plus
 * exactly one mutation, so a probe that passes for the wrong reason shows up as the control
 * failing too.
 */
function selftest() {
  const clean = ['# Title', '', 'Prose.', '', '```html', '<p>hi</p>', '```', '', 'More prose.', ''].join('\n');
  const cases = [
    { name: 'clean tree passes (control)', body: clean, expect: 0 },
    {
      name: 'unterminated block is caught',
      body: clean.replace('```\n\nMore prose.', '\nMore prose.'),
      expect: 1,
    },
    {
      name: 'info string in closing position is caught (the #457 signature)',
      body: ['# Title', '', '```js', 'const a = 1;', '```html', '<p>hi</p>', '```', ''].join('\n'),
      expect: 1,
    },
    { name: 'a file with no fences at all passes', body: '# Title\n\nJust prose.\n', expect: 0 },
    {
      name: 'nested-looking indented fences still pair',
      body: ['# Title', '', '- item:', '', '  ```css', '  a { color: red; }', '  ```', ''].join('\n'),
      expect: 0,
    },
  ];

  let failed = 0;
  for (const c of cases) {
    const root = mkdtempSync(join(tmpdir(), 'fence-probe-'));
    writeFileSync(join(root, 'probe.md'), c.body);
    const got = checkTree(root).length;
    const ok = got === c.expect;
    if (!ok) failed += 1;
    console.log(`${ok ? '✅' : '❌'} ${c.name} (expected ${c.expect} failure(s), got ${got})`);
  }
  if (failed > 0) {
    console.error(`\n❌ markdown fence gate self-test: ${failed} of ${cases.length} probes failed.`);
    process.exit(1);
  }
  console.log(`\n✅ markdown fence gate self-test: ${cases.length}/${cases.length} probes hold.`);
}

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  const failures = checkTree('docs');
  const total = [...walk('docs')].length;
  if (total === 0) {
    console.error('❌ markdown fence balance: zero files matched — refusing to pass over an empty set.');
    process.exit(1);
  }
  for (const f of failures) {
    console.error(`❌ ${f.file}: ${f.reason}.`);
    for (const d of f.detail) console.error(`   ${d}`);
  }
  if (failures.length > 0) {
    console.error(`\n❌ markdown fence balance: ${failures.length} of ${total} file(s) failed.`);
    process.exit(1);
  }
  console.log(`✅ markdown fence balance: ${total} file(s), every fence paired, every closer bare.`);
}
