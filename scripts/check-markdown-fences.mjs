#!/usr/bin/env node
/**
 * MARKDOWN CODE-FENCE INTEGRITY over the repository's published Markdown (#456).
 *
 * WHY THIS EXISTS. A commit on PR #457 (d2c7c1ab) applied a snippet with an unanchored global
 * substitution and inserted it at 143 sites instead of 1 in `docs/design-system/using-components.md`
 * — before every opening fence in the file. Each injected ```js block then met the file's own next
 * opener (```html, ```css). CommonMark forbids an info string on a closing fence (spec 0.31.2 §4.5,
 * Example 147), so that line did not close anything: it became CODE CONTENT, and the injected block
 * ran on through the following example to that example's bare closer. Every block still closed;
 * no prose became code. What shipped was 142 duplicated snippets, each fused with the example after
 * it into one block — the theme-bootstrap `<head>` example, the chart, form and footer docs among
 * them — with the example's language label rendered as a literal line of code.
 *
 * All 15 CI jobs stayed green. Nothing here parsed Markdown: `lint-code` was ESLint, Stylelint and
 * HTMLHint, and the specs that read that file slice a named heading and assert substrings are
 * PRESENT, which an insertion cannot break. Review lenses caught it by reading the diff.
 *
 * WHAT IT ASSERTS. This scans fences the way CommonMark defines them — backtick AND tilde fences,
 * the opener's length, closers that must be the same character, at least as long and carry no info
 * string, and indentation measured from the enclosing list item or blockquote (a line indented 4+
 * columns past its container is never a fence). Per file it rejects:
 *   1. SWALLOWED OPENER — inside an open code block, a line that would itself open a block of the
 *      same character and at least the same length, carrying an info string. It cannot close the
 *      block (closers carry no info string), so it is rendered as code. This is the #457 signature.
 *      Legitimate nesting is not affected: a ````-fence around ```js examples, or ```html inside a
 *      ~~~ block, is a shorter or different fence and is ignored, as CommonMark itself ignores it.
 *   2. UNTERMINATED BLOCK — a block still open at end of file. CommonMark closes it silently there;
 *      it is valid, and it is essentially never intended.
 *
 * WHAT IT DOES NOT ASSERT (stated so nobody trusts it for them): it is not a Markdown linter and not
 * a renderer. It does not detect duplicated content, a block that closes early, or prose moved into
 * or out of a block by an edit that leaves the fence structure well-formed. A code block cut off
 * because its list item ended is valid CommonMark and not flagged. HTML blocks are not modelled.
 * List detection is the common subset (bullets `- * +`, ordered `1.` `1)`), enough for this repo.
 *
 * SCOPE. Every tracked `*.md`, plus `llms.txt` and `llms-full.txt` (the repo's declared LLM
 * surfaces, which are Markdown by content), EXCEPT `kitty-specs/`: those are frozen Spec Kitty
 * mission records that CLAUDE.md forbids hand-editing, so a gate over them could only be satisfied
 * by an allowlist. Scope is resolved with `git ls-files` so generated and untracked output is not
 * read. The count is printed, and an empty set is refused.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SELF), '..');
const EXCLUDED_PREFIXES = ['kitty-specs/'];
const EXTRA_FILES = ['llms.txt', 'llms-full.txt'];

const FENCE_OPEN = /^(`{3,}|~{3,})(.*)$/;
const LIST_ITEM = /^([-*+]|\d{1,9}[.)])( {1,4}|$)/;

/** Leading whitespace in columns, tabs to the next multiple of 4, as CommonMark counts them. */
function indentOf(line) {
  let col = 0;
  for (const ch of line) {
    if (ch === ' ') col += 1;
    else if (ch === '\t') col += 4 - (col % 4);
    else break;
  }
  return col;
}

/** Strips up to `depth` blockquote markers; returns the rest and how many were actually present. */
function stripQuotes(line, depth = Infinity) {
  let rest = line;
  let found = 0;
  while (found < depth) {
    const m = /^ {0,3}> ?/.exec(rest);
    if (!m) break;
    rest = rest.slice(m[0].length);
    found += 1;
  }
  return { rest, found };
}

/**
 * Scans one Markdown source. Returns the findings and, for analysis, which lines are code-fence
 * lines (opener, content or closer). `disable` switches off one rule — used only by the self-test's
 * mutation proof, which must show that removing a rule turns a probe red.
 */
export function scanMarkdown(text, { disable = null } = {}) {
  const lines = text.split('\n');
  const findings = [];
  const inCode = new Array(lines.length).fill(false);
  const listCols = [];
  let fence = null;

  const tryOpen = (content, col, depth, i) => {
    const m = FENCE_OPEN.exec(content);
    if (!m) return false;
    const [, run, info] = m;
    if (run[0] === '`' && info.includes('`')) return false;
    fence = { char: run[0], len: run.length, col, depth, line: i + 1, text: content.trim() };
    inCode[i] = true;
    return true;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];

    if (fence) {
      const { rest, found } = stripQuotes(raw, fence.depth);
      const blank = rest.trim() === '';
      const indent = indentOf(rest);
      // The block's container ended (a lazy quote line, or a dedent out of its list item). Code is
      // never a lazy continuation, so CommonMark closes the block here; fall through to re-read it.
      if (found < fence.depth || (!blank && indent < fence.col)) {
        fence = null;
      } else {
        inCode[i] = true;
        const rel = indent - fence.col;
        const body = rest.trimStart();
        if (rel <= 3) {
          const closer = new RegExp(`^\\${fence.char}{${fence.len},}\\s*$`);
          if (closer.test(body)) {
            fence = null;
            continue;
          }
          const m = FENCE_OPEN.exec(body);
          if (m && m[1][0] === fence.char && m[1].length >= fence.len && m[2].trim() !== ''
            && disable !== 'swallowed') {
            findings.push({
              rule: 'swallowed-opener',
              line: i + 1,
              message: `line ${i + 1} "${body.trim()}" would open a block, but the block opened at ` +
                `line ${fence.line} ("${fence.text}") is still open, and a closing fence cannot ` +
                'carry an info string — so it renders as code and the two blocks fuse',
            });
          }
        }
        continue;
      }
    }

    const { rest, found: depth } = stripQuotes(raw);
    if (rest.trim() === '') continue;
    const indent = indentOf(rest);
    while (listCols.length > 0 && listCols[listCols.length - 1] > indent) listCols.pop();
    let col = listCols.length > 0 ? listCols[listCols.length - 1] : 0;
    if (indent - col >= 4) continue; // indented code or a paragraph continuation — never a fence
    let content = rest.slice(rest.length - rest.trimStart().length);

    const item = LIST_ITEM.exec(content);
    if (item) {
      const markerEnd = indent + item[1].length + Math.max(item[2].length, 1);
      listCols.push(markerEnd);
      col = markerEnd;
      content = content.slice(item[0].length);
      if (content.trim() === '') continue;
    }
    tryOpen(content.trimStart(), col, depth, i);
  }

  if (fence && disable !== 'unterminated') {
    findings.push({
      rule: 'unterminated',
      line: fence.line,
      message: `the block opened at line ${fence.line} ("${fence.text}") is never closed — the ` +
        'rest of the file renders as code',
    });
  }
  return { findings, inCode };
}

/** The gate's file set, relative to `root`. Throws with a diagnosis rather than a stack trace. */
export function resolveScope(root) {
  const r = spawnSync('git', ['ls-files', '-z', '--', '*.md', ...EXTRA_FILES], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`git ls-files failed in ${root}: ${(r.stderr || '').trim() || `exit ${r.status}`}`);
  }
  return r.stdout.split('\0').filter((f) => f && !EXCLUDED_PREFIXES.some((p) => f.startsWith(p)));
}

/** Runs the gate over `root` and returns the process exit code. */
export function runGate(root, { disable = null, log = console.log, error = console.error } = {}) {
  let files;
  try {
    files = resolveScope(root);
  } catch (e) {
    error(`❌ markdown fence integrity: ${e.message}`);
    return 1;
  }
  if (files.length === 0) {
    error('❌ markdown fence integrity: zero files in scope — refusing to pass over an empty set.');
    return 1;
  }
  let failed = 0;
  for (const file of files) {
    const { findings } = scanMarkdown(readFileSync(join(root, file), 'utf8'), { disable });
    if (findings.length === 0) continue;
    failed += 1;
    error(`❌ ${file}: ${findings.length} finding(s)`);
    for (const f of findings.slice(0, 10)) error(`   [${f.rule}] ${f.message}`);
    if (findings.length > 10) error(`   … and ${findings.length - 10} more`);
  }
  if (failed > 0) {
    error(`\n❌ markdown fence integrity: ${failed} of ${files.length} file(s) failed.`);
    return 1;
  }
  log(`✅ markdown fence integrity: ${files.length} file(s), no swallowed openers, no unterminated blocks.`);
  return 0;
}

const F = '```';
const T = '~~~';
const md = (...lines) => `${lines.join('\n')}\n`;

/**
 * Probe table. Every fixture is a real git work tree, so scope resolution, the `kitty-specs/`
 * exclusion, nested directories and the CLI exit code are all exercised — not just the scanner.
 * `expect` is the exit code; `rule` names the single rule a RED probe depends on.
 */
const PROBES = [
  { name: 'clean control passes', files: { 'docs/a.md': md('# T', '', F + 'html', '<p>hi</p>', F, '', 'prose') }, expect: 0 },
  {
    name: 'the #457 signature is caught with an EVEN fence count (parity alone would pass it)',
    files: { 'docs/a.md': md(F + 'js', 'snippet', F + 'html', '<head>', F, '', 'prose', '', F + 'js', 'snippet', F + 'css', 'a{}', F) },
    expect: 1,
    rule: 'swallowed',
  },
  {
    name: 'the #457 signature written with tildes is caught',
    files: { 'docs/a.md': md(T + 'js', 'snippet', T + 'html', '<head>', T, '', 'prose') },
    expect: 1,
    rule: 'swallowed',
  },
  { name: 'an unterminated backtick block is caught', files: { 'docs/a.md': md('# T', '', F + 'js', 'x', '', 'prose that is now code') }, expect: 1, rule: 'unterminated' },
  { name: 'an unterminated tilde block is caught', files: { 'docs/a.md': md('# T', '', T + 'js', 'x', '', 'prose') }, expect: 1, rule: 'unterminated' },
  { name: 'a defect in a nested directory is found', files: { 'docs/a.md': md('ok'), 'docs/deep/er/b.md': md(F + 'js', 'x', F + 'html', 'y', F) }, expect: 1, rule: 'swallowed' },
  { name: 'README.md at the root is in scope', files: { 'README.md': md(F + 'js', 'x') }, expect: 1, rule: 'unterminated' },
  { name: 'llms.txt is in scope despite its extension', files: { 'docs/a.md': md('ok'), 'llms.txt': md(F + 'js', 'x') }, expect: 1, rule: 'unterminated' },
  { name: 'kitty-specs/ is excluded (frozen mission records)', files: { 'docs/a.md': md('ok'), 'kitty-specs/m/tasks/WP01.md': md(F + 'js', 'x') }, expect: 0 },
  { name: 'an empty scope is refused, not passed', files: { 'kitty-specs/only.md': md('ok') }, expect: 1 },
  { name: 'VALID: a 4-backtick fence documenting 3-backtick examples', files: { 'docs/a.md': md('````md', F + 'js', 'x', F, '````') }, expect: 0 },
  { name: 'VALID: a tilde fence containing backtick fence lines', files: { 'docs/a.md': md(T + 'md', F + 'html', 'x', F, T) }, expect: 0 },
  { name: 'VALID: a backtick fence containing tilde fence lines', files: { 'docs/a.md': md(F + 'md', T + 'html', 'x', T, F) }, expect: 0 },
  { name: 'VALID: a closer longer than its opener', files: { 'docs/a.md': md(F + 'js', 'x', '`````', '', 'prose') }, expect: 0 },
  { name: 'VALID: an indented code block containing literal fence lines', files: { 'docs/a.md': md('prose', '', '    ' + F + 'js', '    x', '    ' + F + 'html', '', 'prose') }, expect: 0 },
  { name: 'VALID: fences inside a list item and a nested list item', files: { 'docs/a.md': md('- item', '', '  ' + F + 'css', '  a{}', '  ' + F, '', '  1. nested', '', '     ' + F + 'js', '     x', '     ' + F) }, expect: 0 },
  { name: 'VALID: a fence inside a blockquote', files: { 'docs/a.md': md('> quote', '>', '> ' + F + 'js', '> x', '> ' + F) }, expect: 0 },
  { name: 'VALID: inline code spans are not fences', files: { 'docs/a.md': md('use `x` or ' + F + 'inline' + F + ' here') }, expect: 0 },
];

function git(root, ...args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
}

function withFixture(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'fence-probe-'));
  try {
    git(root, 'init', '-q');
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), body);
    }
    git(root, 'add', '-A');
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function selftest() {
  const quiet = { log: () => {}, error: () => {} };
  let failed = 0;
  for (const p of PROBES) {
    const [got, cli] = withFixture(p.files, (root) => [
      runGate(root, quiet),
      spawnSync(process.execPath, [SELF, '--root', root], { encoding: 'utf8' }).status,
    ]);
    const ok = got === p.expect && cli === p.expect;
    if (!ok) failed += 1;
    console.log(`${ok ? '✅' : '❌'} ${p.name} (expected exit ${p.expect}; in-process ${got}, CLI ${cli})`);
  }

  // MUTATION PROOF. A probe table can pass for the wrong reason: the first version of this file
  // had its only swallowed-opener probe caught by the parity rule, so the defect-detecting rule
  // could be deleted with the self-test still 5/5 (R1, PR #457). Here each rule is switched off in
  // turn, and every probe that names it must then PASS — i.e. that rule, and only that rule, is
  // what made it red.
  for (const rule of ['swallowed', 'unterminated']) {
    const dependent = PROBES.filter((p) => p.rule === rule);
    if (dependent.length === 0) {
      console.log(`❌ mutation: no probe depends on rule "${rule}"`);
      failed += 1;
      continue;
    }
    for (const p of dependent) {
      const got = withFixture(p.files, (root) => runGate(root, { ...quiet, disable: rule }));
      const ok = got === 0;
      if (!ok) failed += 1;
      console.log(`${ok ? '✅' : '❌'} mutation: with "${rule}" disabled, "${p.name}" goes green (exit ${got})`);
    }
  }

  const total = PROBES.length + PROBES.filter((p) => p.rule).length;
  if (failed > 0) {
    console.error(`\n❌ markdown fence gate self-test: ${failed} of ${total} checks failed.`);
    process.exit(1);
  }
  console.log(`\n✅ markdown fence gate self-test: ${total}/${total} checks hold.`);
}

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  if (process.argv.includes('--selftest')) {
    selftest();
  } else {
    const at = process.argv.indexOf('--root');
    process.exit(runGate(at > -1 ? resolve(process.argv[at + 1]) : REPO_ROOT));
  }
}
