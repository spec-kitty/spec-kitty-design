#!/usr/bin/env node
/**
 * MARKDOWN CODE-FENCE INTEGRITY over the repository's published Markdown (#456).
 *
 * WHY THIS EXISTS. A commit on PR #457 (d2c7c1ab) applied a snippet with an unanchored global
 * substitution: the pattern it replaced was a bare ```, so a copy of the snippet was spliced in
 * before almost every fence line of `docs/design-system/using-components.md` — closers as well as
 * openers — leaving 143 copies. Measured with the reference parser:
 *   - An example's labelled opener (```html, ```css) cannot close a block, because CommonMark forbids
 *     an info string on a closing fence (spec 0.31.2 §4.5, Example 147). Each one met an injected
 *     block, became CODE CONTENT, and fused into it: 140 swallowed openers. 69 blocks ended up
 *     holding two snippet copies with the example sandwiched between them and two stray language
 *     labels shown as code.
 *   - Code became prose. The file's one BARE opener, around the derived
 *     `--sk-layout-page-header-sticky-scroll-margin` formula, instead CLOSED an injected block, so the
 *     formula's four lines rendered as a paragraph and a bulleted list: its `+` operators became
 *     bullets.
 *   - Every block closed, and no prose became code.
 * All 15 CI jobs stayed green. Nothing here parsed Markdown: `lint-code` was ESLint, Stylelint and
 * HTMLHint, and the specs that read that file slice a named heading and assert substrings are
 * PRESENT, which an insertion cannot break. Review lenses caught it by reading the diff.
 *
 * HOW IT PARSES. With jgm's `commonmark.js` — the CommonMark reference implementation, pinned as a
 * devDependency — not with rules of its own. Three earlier versions of this file carried a hand
 * parser, and in three consecutive review rounds differential testing against this same library
 * found a new class of document the hand parser misread in the fail-OPEN direction (CRLF, tabs,
 * HTML blocks, lazy continuation, then nested containers such as `- > ```js`). Every container,
 * line-ending, tab and HTML rule is now the spec's own. What remains here is only the two checks
 * below, computed from the parser's code blocks, with the fence character and length read back from
 * the source at the position the parser reports. One private field is read, `_fenceOffset`, because
 * the public API has no equivalent; the gate refuses to run without it, so the exact-pinned version
 * can only be upgraded by someone who re-derives the rule that uses it.
 *
 * WHAT IT REJECTS, per file:
 *   1. SWALLOWED OPENER — inside a fenced code block, a content line that would itself open a block of
 *      the same character and at least the same length, carrying an info string (a backtick fence's
 *      info string may not contain a backtick), indented at most 3 columns within its container. It cannot close the block (closers carry no info
 *      string), so it renders as code and two blocks fuse. This is the #457 signature. Legitimate
 *      nesting is unaffected: a ````-fence around ```js examples, or ```html inside a ~~~ block, is a
 *      shorter or different fence, as CommonMark itself reads it.
 *   2. UNTERMINATED BLOCK — a fenced block with no closing fence, after which the file holds nothing
 *      but blank lines. CommonMark closes it silently; it is valid, and it is essentially never
 *      intended. Deliberately stricter than "the block's last line is the file's last line": a quoted
 *      callout whose closer was forgotten is reported even when a trailing blank line ends the quote.
 *
 * WHAT IT DOES NOT ASSERT (stated so nobody trusts it for them): it is not a Markdown linter and not
 * a renderer. It does not detect duplicated content, a block that closes early, or prose moved into
 * or out of a block by an edit that leaves the fence structure well-formed. A fenced block ended by
 * its CONTAINER (a list item or blockquote that ends) is valid CommonMark and not flagged. GitHub
 * renders GFM, a superset of CommonMark whose fenced-code rules are identical; the GFM extensions
 * (tables, task lists, strikethrough, autolinks) do not open or close code blocks.
 *
 * SCOPE. Every tracked `*.md`, plus `llms.txt` and `llms-full.txt` (the repo's declared LLM
 * surfaces, which are Markdown by content), EXCEPT `kitty-specs/`: those are frozen Spec Kitty
 * mission records that CLAUDE.md forbids hand-editing, so a gate over them could only be satisfied
 * by an allowlist. Scope is resolved with `git ls-files` so generated and untracked output is not
 * read. The count is printed, and an empty set is refused.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SELF), '..');
const EXCLUDED_PREFIXES = ['kitty-specs/'];
const EXTRA_FILES = ['llms.txt', 'llms-full.txt'];

// commonmark.js ships CommonJS with no default ESM export.
const { Parser } = createRequire(import.meta.url)('commonmark');

const FENCE = /^(`{3,}|~{3,})(.*)$/;
/** Leading whitespace in columns, tabs to the next multiple of 4. */
function columnsOf(line) {
  let col = 0;
  for (const ch of line) {
    if (ch === ' ') col += 1;
    else if (ch === '\t') col += 4 - (col % 4);
    else break;
  }
  return col;
}
const isBlank = (line) => line.trim() === '';
/** A backtick fence's info string may not contain a backtick (§4.5); such a line opens nothing. */
const canOpen = (run, info) => !(run[0] === '`' && info.includes('`'));

/**
 * Scans one Markdown source. Returns the findings and, for analysis, which lines belong to a fenced
 * code block (opener, content or closer). `disable` names ONE rule to switch off — used only by the
 * self-test's mutation proof, which must show that removing a rule changes a probe's verdict.
 */
export function scanMarkdown(text, { disable = null } = {}) {
  // The parser's own line endings (§2.1), so its line numbers index this array.
  const lines = text.split(/\r\n|\r|\n/);
  const findings = [];
  const inCode = new Array(lines.length).fill(false);
  const walker = new Parser().parse(text).walker();
  for (let step = walker.next(); step; step = walker.next()) {
    const { node, entering } = step;
    if (!entering || node.type !== 'code_block' || node.info === null) continue; // null: indented code
    const [[startLine, startCol], [endLine]] = node.sourcepos;
    // The start column is the fence's first character, whatever container prefixes precede it.
    const opener = FENCE.exec(lines[startLine - 1].slice(startCol - 1));
    if (!opener) continue;
    const [, run] = opener;
    for (let l = startLine; l <= endLine; l += 1) inCode[l - 1] = true;

    // The opener's indentation within its container. The parser strips up to that many spaces from
    // each content line, so a line's indentation within the CONTAINER is its remaining leading
    // columns plus this — unless nothing is left, when it was at most this. `_fenceOffset` is the one
    // private field used: the public API has no equivalent. It is checked, not assumed, so an
    // upgrade that renames it stops this gate instead of quietly weakening it.
    const offset = node._fenceOffset;
    if (!Number.isInteger(offset)) {
      throw new Error('commonmark.js no longer exposes _fenceOffset — re-derive the swallowed-opener indentation rule');
    }
    const content = node.literal === '' ? [] : node.literal.split('\n').slice(0, -1);
    content.forEach((line, k) => {
      const lead = columnsOf(line);
      const m = FENCE.exec(line.trimStart());
      if (!m || disable === 'swallowed' || (lead > 0 && lead + offset > 3)) return;
      const [, inner, info] = m;
      if (inner[0] !== run[0] || inner.length < run.length || info.trim() === '' || !canOpen(inner, info)) return;
      const at = startLine + 1 + k;
      findings.push({
        rule: 'swallowed-opener',
        line: at,
        message: `line ${at} "${line.trim()}" would open a block, but the block opened at line ` +
          `${startLine} ("${opener[0].trim()}") is still open, and a closing fence cannot carry an ` +
          'info string — so it renders as code and the two blocks fuse' +
          // A BARE opener is often a closer that lost its partner: the cause is usually above it.
          (opener[2].trim() === '' ? `. Line ${startLine} is a bare fence — check the fence above it` : ''),
      });
    });

    // Closed by a fence: the block spans its opener, its content and exactly one closing line.
    const closed = endLine - startLine + 1 === content.length + 2;
    const runsToEnd = lines.slice(endLine).every(isBlank);
    if (!closed && runsToEnd && disable !== 'unterminated') {
      findings.push({
        rule: 'unterminated',
        line: startLine,
        message: `the block opened at line ${startLine} ("${opener[0].trim()}") is never closed — the ` +
          'rest of the file renders as code',
      });
    }
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
const crlf = (...lines) => `${lines.join('\r\n')}\r\n`;
const SIGNATURE = [F + 'js', 'snippet', F + 'html', '<head>', F];

/**
 * Probe table. Every fixture is a real git work tree, so scope resolution, the `kitty-specs/`
 * exclusion, nested directories and the CLI exit code are all exercised — not just the scanner.
 * `expect` is the exit code. `needs` lists every rule or behaviour a RED probe depends on: the
 * mutation proof disables each one in turn and requires the probe to go GREEN, which is what shows
 * that this rule — not another one that happens to fire first — is what made it red.
 */
const PROBES = [
  { name: 'clean control passes', files: { 'docs/a.md': md('# T', '', F + 'html', '<p>hi</p>', F, '', 'prose') }, expect: 0 },
  {
    name: 'the #457 signature is caught with an EVEN fence count (parity alone would pass it)',
    files: { 'docs/a.md': md(...SIGNATURE, '', 'prose', '', F + 'js', 'snippet', F + 'css', 'a{}', F) },
    expect: 1,
    needs: ['swallowed'],
  },
  { name: 'the #457 signature written with tildes is caught', files: { 'docs/a.md': md(T + 'js', 'snippet', T + 'html', '<head>', T, '', 'prose') }, expect: 1, needs: ['swallowed'] },
  { name: 'the #457 signature with CRLF line endings is caught', files: { 'docs/a.md': crlf(...SIGNATURE, '', 'prose') }, expect: 1, needs: ['swallowed'] },
  { name: 'the #457 signature with bare-CR line endings is caught', files: { 'docs/a.md': `${[...SIGNATURE, '', 'prose'].join('\r')}\r` }, expect: 1, needs: ['swallowed'] },
  { name: 'the #457 signature after a tab following ">" is caught', files: { 'docs/a.md': md(...SIGNATURE.map((l) => `>\t${l}`)) }, expect: 1, needs: ['swallowed'] },
  { name: 'the #457 signature after a tab following a list marker is caught', files: { 'docs/a.md': md(`-\t${F}js`, '    x', `    ${F}html`, '    y', `    ${F}`) }, expect: 1, needs: ['swallowed'] },
  // These two open the signature with a BARE fence on purpose: with HTML unmodelled, that fence
  // closes the phantom block the fence-like line opened, and the rest pairs cleanly — which is
  // how R3 made the #457 signature pass green (PR #457). A `js`-labelled opener would red anyway.
  {
    name: 'a fence line inside an HTML comment does not mask a later #457 signature',
    files: { 'docs/a.md': md('<!--', F + 'js', '-->', '', F, 'x', F + 'html', 'y', F) },
    expect: 1,
    needs: ['swallowed'],
  },
  {
    name: 'a fence line inside <pre> does not mask a later #457 signature',
    files: { 'docs/a.md': md('<pre>', F + 'js', '</pre>', '', F, 'x', F + 'html', 'y', F) },
    expect: 1,
    needs: ['swallowed'],
  },
  { name: 'the #457 signature inside a blockquote is caught', files: { 'docs/a.md': md('> note', '>', ...SIGNATURE.map((l) => `> ${l}`)) }, expect: 1, needs: ['swallowed'] },
  {
    name: 'the #457 signature in a list item with a 4-column fence is caught',
    files: { 'docs/a.md': md('- item', '', ...SIGNATURE.map((l) => `    ${l}`)) },
    expect: 1,
    needs: ['swallowed'],
  },
  {
    name: 'an unterminated block inside a blockquote at end of file is caught',
    files: { 'docs/a.md': md('> **Note**', '>', '> ' + F + 'bash', '> npm install', '>', '> Then run the build.') },
    expect: 1,
    needs: ['unterminated'],
  },
  {
    name: 'the #457 signature after a lazy continuation line in a list item is caught',
    // 5 columns in: a fence only while the item (content column 2) is still open. Had the lazy line
    // closed the item, this would be indented code and the signature would pass green.
    files: { 'docs/a.md': md('- item', 'lazy continuation', '', ...SIGNATURE.map((l) => `     ${l}`)) },
    expect: 1,
    needs: ['swallowed'],
  },
  // Nested containers — the class that made the hand parser unmaintainable (R3 N1, R4 N5, PR #457).
  { name: 'the #457 signature in a quote on a list item\'s marker line is caught', files: { 'docs/a.md': md(...SIGNATURE.map((l, k) => (k === 0 ? `- > ${l}` : `  > ${l}`))) }, expect: 1, needs: ['swallowed'] },
  { name: 'the #457 signature after two list markers on one line is caught', files: { 'docs/a.md': md(...SIGNATURE.map((l, k) => (k === 0 ? `- 1. ${l}` : `     ${l}`))) }, expect: 1, needs: ['swallowed'] },
  {
    name: 'the #457 signature in a quoted example inside a nested list item is caught',
    files: { 'docs/a.md': md('- Outer step', '  - Inner step, with a quoted example:', '', ...SIGNATURE.map((l) => `    > ${l}`)) },
    expect: 1,
    needs: ['swallowed'],
  },
  { name: 'an unclosed block in a quote followed only by blank lines is caught', files: { 'docs/a.md': md('> ' + F + 'js', '> x', '', '') }, expect: 1, needs: ['unterminated'] },
  { name: 'an unterminated backtick block is caught', files: { 'docs/a.md': md('# T', '', F + 'js', 'x', '', 'prose that is now code') }, expect: 1, needs: ['unterminated'] },
  { name: 'an unterminated tilde block is caught', files: { 'docs/a.md': md('# T', '', T + 'js', 'x', '', 'prose') }, expect: 1, needs: ['unterminated'] },
  { name: 'an unterminated block with CRLF line endings is caught', files: { 'docs/a.md': crlf('# T', '', F + 'js', 'x', '', 'prose') }, expect: 1, needs: ['unterminated'] },
  { name: 'a defect in a nested directory is found', files: { 'docs/a.md': md('ok'), 'docs/deep/er/b.md': md(F + 'js', 'x', F + 'html', 'y', F) }, expect: 1, needs: ['swallowed'] },
  { name: 'README.md at the root is in scope', files: { 'README.md': md(F + 'js', 'x') }, expect: 1, needs: ['unterminated'] },
  { name: 'llms.txt is in scope despite its extension', files: { 'docs/a.md': md('ok'), 'llms.txt': md(F + 'js', 'x') }, expect: 1, needs: ['unterminated'] },
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
  { name: 'VALID: a lone fence line inside an HTML comment', files: { 'docs/a.md': md('<!--', F + 'js', '-->', '', 'prose') }, expect: 0 },
  { name: 'VALID: "2." inside a paragraph is not a list item', files: { 'docs/a.md': md('para', '2. not a list', '   ' + F + 'js', 'x', F) }, expect: 0 },
  { name: 'VALID: "* * *" is a thematic break, not a list item', files: { 'docs/a.md': md('* * *', '', F + 'js', 'x', F) }, expect: 0 },
  { name: 'VALID: a fence-like line 5+ spaces after a list marker is indented code', files: { 'docs/a.md': md('-     ' + F + 'js', '      x', '      ' + F + 'html') }, expect: 0 },
  { name: 'VALID: "- - -" is a thematic break, so a 4-space fence line after it is indented code', files: { 'docs/a.md': md('- - -', '', '    ' + F + 'js', '    literal') }, expect: 0 },
  { name: 'VALID: a list item does not reach into a following blockquote', files: { 'docs/a.md': md('- item', '', '>     ' + F + 'js', '>     ' + F + 'html', '>     x') }, expect: 0 },
  { name: 'VALID: "2)" inside a paragraph is not a list item', files: { 'docs/a.md': md('Paragraph text', '2) ' + F + 'js', '   still paragraph text.') }, expect: 0 },
  // These two are VALID probes that a source-level deletion turns RED (R1's surviving mutants):
  // without the container close, the dedented prose stays code and the next opener is "swallowed";
  // without the 4-column limit, an indented labelled line inside a block reads as an opener.
  { name: 'VALID: a block in a list item ends when the item does', files: { 'docs/a.md': md('- a', '', '  ' + F + 'js', '  x', 'dedented prose', '', F + 'js', 'y', F) }, expect: 0 },
  { name: 'VALID: a labelled fence line indented 4+ inside a block is content', files: { 'docs/a.md': md(F + 'md', '    ' + F + 'html', F) }, expect: 0 },
  { name: 'VALID: an empty ">" line left of a list item ends the item', files: { 'docs/a.md': md('  - nested', '>', '\t' + F + 'js') }, expect: 0 },
  // R1 M1: each pins a behaviour whose removal the reference comparison showed to be costly.
  { name: 'VALID: a block inside a blockquote ends when the quote does', files: { 'docs/a.md': md('> ' + F + 'js', '> x', '', 'prose after the quote') }, expect: 0 },
  { name: 'VALID: a backtick run whose info string holds a backtick is inline code, not a fence', files: { 'docs/a.md': md(F + 'ts`` is inline code, not a fence.', '', 'More prose.') }, expect: 0 },
  { name: 'VALID: under an indented opener, a labelled line 4 columns into the container is content', files: { 'docs/a.md': md('  ' + F + 'md', '    ' + F + 'html', '  ' + F) }, expect: 0 },
  { name: 'VALID: a line that could never open a block is not a swallowed opener', files: { 'docs/a.md': md(F + 'js', F + 'ab`c', F) }, expect: 0 },
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
  let checks = 0;
  for (const p of PROBES) {
    const [got, cli] = withFixture(p.files, (root) => [
      runGate(root, quiet),
      spawnSync(process.execPath, [SELF, '--root', root], { encoding: 'utf8' }).status,
    ]);
    const ok = got === p.expect && cli === p.expect;
    checks += 1;
    if (!ok) failed += 1;
    console.log(`${ok ? '✅' : '❌'} ${p.name} (expected exit ${p.expect}; in-process ${got}, CLI ${cli})`);
  }

  // MUTATION PROOF. A probe table can pass for the wrong reason: the first version of this file
  // had its only swallowed-opener probe caught by the parity rule, so the defect-detecting rule
  // could be deleted with the self-test still 5/5 (R1, PR #457). Here each rule and each parsing
  // behaviour is switched off in turn, and every probe that names it must then PASS.
  for (const rule of ['swallowed', 'unterminated']) {
    const dependent = PROBES.filter((p) => p.needs?.includes(rule));
    checks += 1;
    if (dependent.length === 0) {
      console.log(`❌ mutation: no probe depends on "${rule}"`);
      failed += 1;
      continue;
    }
    for (const p of dependent) {
      const got = withFixture(p.files, (root) => runGate(root, { ...quiet, disable: rule }));
      const ok = got === 0;
      checks += 1;
      if (!ok) failed += 1;
      console.log(`${ok ? '✅' : '❌'} mutation: with "${rule}" disabled, "${p.name}" goes green (exit ${got})`);
    }
  }

  if (failed > 0) {
    console.error(`\n❌ markdown fence gate self-test: ${failed} of ${checks} checks failed.`);
    process.exit(1);
  }
  console.log(`\n✅ markdown fence gate self-test: ${checks}/${checks} checks hold.`);
}

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  if (process.argv.includes('--selftest')) {
    selftest();
  } else {
    const at = process.argv.indexOf('--root');
    process.exit(runGate(at > -1 ? resolve(process.argv[at + 1]) : REPO_ROOT));
  }
}
