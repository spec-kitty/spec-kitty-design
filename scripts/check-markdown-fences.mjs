#!/usr/bin/env node
/**
 * MARKDOWN CODE-FENCE INTEGRITY over the repository's published Markdown (#456).
 *
 * WHY THIS EXISTS. A commit on PR #457 (d2c7c1ab) applied a snippet with an unanchored global
 * substitution: the pattern it replaced was a bare ```, so a copy of the snippet was spliced in
 * before almost every fence line of `docs/design-system/using-components.md` — closers as well as
 * openers — leaving 143 copies. Measured with the reference parser:
 *   - A labelled opener cannot close a block, because CommonMark forbids an info string on a closing
 *     fence (spec 0.31.2 §4.5, Example 147). 140 of them met an open block and became CODE CONTENT:
 *     70 were the file's own example labels — every labelled opener it still had (57 ```html, 6
 *     ```css, 1 ```bash and all six of its ```js openers) — and 70 were the injected snippets' own
 *     ```js labels. Each is identified by the line
 *     after it: an injected label is followed by the snippet, an original by its own example; the
 *     canonical handler example, which starts with the same line, is told apart by the old guard on
 *     its third line. 69 blocks ended up holding two snippet copies with the example sandwiched
 *     between them and two stray language labels shown as code.
 *   - Code became prose. The file's one BARE opener, around the derived
 *     `--sk-layout-page-header-sticky-scroll-margin` formula, instead CLOSED an injected block, so the
 *     formula's four lines rendered as a paragraph and a bulleted list: its `+` operators became
 *     bullets.
 *   - Every block closed, and no prose became code.
 * Earlier accounts in this PR's history (commit messages, and earlier versions of this header and
 * its CI comment) are superseded by the above. Among their errors: that blocks "never closed"; that
 * ~1,650 lines of prose rendered as code; that the file's openers were "consumed as closers" (the
 * count of 70 was right; the mechanism was not, since no closer can carry a label); that 142
 * snippets each fused with the following example; and that all 140 swallowed lines were the file's
 * own ```html/```css openers.
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
 * the source at the position the parser reports. Where a check needs to know whether a content line
 * sits where a fence would count, it asks the parser too (see `wouldOpen`): two successive hand
 * measurements of that got it wrong, first on tabs and then on a blockquote's optional space. Only
 * the public API is used.
 *
 * .mdx files are parsed with the MDX grammar instead — micromark with the mdxjs extension, read
 * through mdast-util-from-markdown and mdast-util-mdx, all exact-pinned devDependencies. It is the
 * grammar Storybook compiles .mdx with, and it differs from CommonMark exactly where this gate looks:
 * indented code is off, so a fence may open or close at any indentation, and JSX/ESM replace HTML
 * blocks, so a fence straight after a JSX tag is a fence while one inside a `{/* ... * /}` comment or
 * a template literal is not a block at all. The same two rules run on its code blocks. A hand
 * approximation of MDX was tried first and failed in both directions under review (PR #457), the
 * same way the hand CommonMark parser had. An .mdx file the grammar cannot parse fails Storybook's
 * build too, and is reported rather than passed.
 *
 * WHAT IT REJECTS, per file:
 *   1. SWALLOWED OPENER — inside a fenced code block, a content line that would itself open a block of
 *      the same character and at least the same length, carrying an info string (a backtick fence's
 *      info string may not contain a backtick), indented at most 3 columns within its container. It
 *      cannot close the block (closers carry no info string), so it renders as code and two blocks
 *      fuse. This is the #457 signature. Legitimate nesting is unaffected: a ````-fence around ```js
 *      examples, or ```html inside a ~~~ block, is a shorter or different fence, as the parser
 *      itself reads it.
 *   2. UNCLOSED BLOCK — a fenced block that does not end with its own closing fence. CommonMark
 *      closes it silently wherever it runs out: at the end of the file, or where its list item or
 *      blockquote ends. Both are valid and both are essentially never intended — they render the
 *      same, so neither is special-cased (R3, PR #457: an earlier "only before end of file" rule
 *      reported `> ```js` / `> x` and passed the same forgotten closer followed by prose).
 *
 * WHAT IT DOES NOT ASSERT (stated so nobody trusts it for them): it is not a Markdown linter and not
 * a renderer. It does not detect duplicated content, a block that closes early, or prose moved into
 * or out of a block by an edit that leaves the fence structure well-formed. GitHub renders GFM, a superset of CommonMark whose fenced-code rules are identical; the GFM extensions
 * (tables, task lists, strikethrough, autolinks) do not open or close code blocks.
 *
 * SCOPE. Every tracked `*.md`, plus `llms.txt` and `llms-full.txt` (the repo's declared LLM
 * surfaces, which are Markdown by content), plus the Storybook `*.mdx` docs pages (published docs:
 * `getting-started.mdx` alone has 12 fences), parsed as MDX (above). EXCEPT `kitty-specs/`: those
 * are frozen Spec Kitty mission records that CLAUDE.md forbids hand-editing, so a gate over them could only be satisfied
 * by an allowlist. Scope is resolved with `git ls-files` so generated and untracked output is not
 * read. The count is printed, and an empty set is refused.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { parse as micromarkParse, postprocess, preprocess } from 'micromark';
import { mdxjs } from 'micromark-extension-mdxjs';

const SELF = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SELF), '..');
const EXCLUDED_PREFIXES = ['kitty-specs/'];
const EXTRA_FILES = ['llms.txt', 'llms-full.txt', '*.mdx'];

// commonmark.js ships CommonJS with no default ESM export.
const { Parser } = createRequire(import.meta.url)('commonmark');

const FENCE = /^(`{3,}|~{3,})(.*)$/;
/** Blank in CommonMark's sense (§2.1): spaces and tabs only — a no-break space is content. */
const isBlank = (line) => /^[ \t]*$/.test(line);
/** A backtick fence's info string may not contain a backtick (§4.5); such a line opens nothing. */
const canOpen = (run, info) => !(run[0] === '`' && info.includes('`'));

/**
 * Whether content line `index` (0-based) of the block opened at `startLine` sits where a fence would
 * count — at most 3 columns into its container. Asked of the PARSER rather than measured here: a
 * copy of the opener's run, written with this line's own container prefix, is inserted just before
 * it, and the block must then close on that copy. Tabs (which the parser leaves raw in its content),
 * a blockquote's optional space (present on one line, absent on the next) and nested list items all
 * resolve by the spec's own rules. Two hand measurements of this failed in turn (R1 T1 on tabs, then
 * R4's fuzzer on `>` without a space, PR #457).
 */
function wouldOpen(lines, startLine, index, contentLine, run, mdx) {
  const src = lines[index];
  const prefix = src.slice(0, src.length - contentLine.trimStart().length);
  const variant = [...lines.slice(0, index), prefix + run, ...lines.slice(index)].join('\n');
  let blocks;
  try {
    blocks = fencedBlocks(variant, mdx);
  } catch {
    // The original parsed and the variant does not. Code content is opaque to the parser, so the
    // inserted line must have CLOSED the block, exposing former content as markup — which is exactly
    // "this line would open a block" (R4 N11, PR #457: the throw used to escape and end the run).
    return true;
  }
  const block = blocks.find((b) => b.startLine === startLine);
  return Boolean(block) && block.endLine === index + 1;
}

/**
 * The fenced code blocks of `text`, as its renderer parses them: CommonMark for Markdown, the MDX
 * grammar (micromark with mdxjs — what Storybook compiles .mdx with) for MDX. Each block has its
 * opener's position, its last line, its content lines, and whether its own closing fence ends it.
 * MDX differs where it matters here: indented code is off, so a fence may be indented any amount,
 * and JSX/ESM replace HTML blocks, so fences inside JSX comments or expressions are not blocks.
 */
function fencedBlocks(text, mdx) {
  const lines = text.split(/\r\n|\r|\n/);
  const blocks = [];
  if (mdx) {
    const tree = fromMarkdown(text, { extensions: [mdxjs()], mdastExtensions: [mdxFromMarkdown()] });
    const nodes = [];
    (function walk(node) {
      if (node.type === 'code') nodes.push(node);
      (node.children || []).forEach(walk);
    })(tree);
    // Closed by its own fence, from the parser's own TOKENS: micromark emits one codeFencedFence
    // for the opener and a second only for a real closer. Reading the last line instead took three
    // rounds of review to get wrong three ways — a content line reading `> ```` (R3 T1), the next
    // block's opener counted into the span (R2 N-1), `>` characters that were code (R1 N1) — so it
    // is not read at all (R1, PR #457).
    const fencesAt = new Map();
    let open = null;
    for (const [kind, token] of postprocess(micromarkParse({ extensions: [mdxjs()] }).document().write(preprocess()(text, undefined, true)))) {
      if (token.type === 'codeFenced') {
        if (kind === 'enter') open = { line: token.start.line, fences: 0 };
        else { fencesAt.set(open.line, open.fences); open = null; }
      } else if (token.type === 'codeFencedFence' && kind === 'enter' && open) open.fences += 1;
    }
    for (const node of nodes) {
      const { start, end } = node.position;
      if (!fencesAt.has(start.line)) {
        throw new Error(`micromark and mdast disagree about the code block at line ${start.line}`);
      }
      blocks.push({
        startLine: start.line, startCol: start.column, endLine: end.line,
        content: node.value === '' ? [] : node.value.split('\n'), closed: fencesAt.get(start.line) === 2,
      });
    }
    return blocks;
  }
  const walker = new Parser().parse(text).walker();
  for (let step = walker.next(); step; step = walker.next()) {
    const { node, entering } = step;
    if (!entering || node.type !== 'code_block' || node.info === null) continue; // null: indented code
    const [[startLine, startCol], [endLine]] = node.sourcepos;
    const content = node.literal === '' ? [] : node.literal.split('\n').slice(0, -1);
    // Closed by a fence: the block spans its opener, its content and exactly one closing line.
    blocks.push({ startLine, startCol, endLine, content, closed: endLine - startLine + 1 === content.length + 2 });
  }
  return blocks;
}

/**
 * Scans one Markdown source. Returns the findings and, for analysis, which lines belong to a fenced
 * code block (opener, content or closer). `mdx` parses with the MDX grammar instead of CommonMark.
 * `disable` names ONE rule to switch off — used only by the self-test's mutation proof.
 */
export function scanMarkdown(source, { disable = null, mdx = false, limit = Infinity } = {}) {
  // GitHub's cmark-gfm (and C cmark) skip a leading UTF-8 byte-order mark; commonmark.js keeps it,
  // which turns a fence on line 1 into paragraph text. Strip it, so the gate reads what GitHub
  // renders (R4 N6, PR #457).
  const text = source.replace(/^\uFEFF/, '');
  // The parsers' own line endings (§2.1), so their line numbers index this array.
  const lines = text.split(/\r\n|\r|\n/);
  const findings = [];
  const inCode = new Array(lines.length).fill(false);
  // The `mdx` mutation parses an .mdx file as CommonMark — the approximation this replaced.
  const asMdx = mdx && disable !== 'mdx';
  let blocks;
  try {
    blocks = fencedBlocks(text, asMdx);
  } catch (e) {
    // An .mdx file the MDX grammar rejects fails Storybook's build as well; it cannot be checked.
    findings.push({ rule: 'mdx-parse-error', line: e.line ?? 1, message: `MDX cannot parse this file: ${e.message.split('\n')[0]}` });
    return { findings, inCode };
  }
  // Lines of one block share its containers, so a candidate's answer depends only on its prefix.
  const opensAt = new Map();
  for (const { startLine, startCol, endLine, content, closed } of blocks) {
    // A failing file needs only as many findings as are printed; each can cost a re-parse.
    if (findings.length >= limit) break;
    // The start column is the fence's first character, whatever container prefixes precede it.
    const opener = FENCE.exec(lines[startLine - 1].slice(startCol - 1));
    // The parser reported a fenced block whose start column does not hold a fence. That has never
    // happened (0 times over every tracked file and the review fuzzers); if it ever does, the
    // parser and this reading of it disagree, and skipping would pass the file unexamined.
    if (!opener) {
      throw new Error(`the parser reported a fenced block at ${startLine}:${startCol} with no fence there`);
    }
    const [, run] = opener;
    for (let l = startLine; l <= endLine; l += 1) inCode[l - 1] = true;

    content.forEach((line, k) => {
      const m = FENCE.exec(line.trimStart());
      if (!m || disable === 'swallowed') return;
      const [, inner, info] = m;
      if (inner[0] !== run[0] || inner.length < run.length || info.trim() === '' || !canOpen(inner, info)) return;
      const src = lines[startLine + k];
      const key = `${startLine}\u0000${src.slice(0, src.length - line.trimStart().length)}`;
      if (!opensAt.has(key)) opensAt.set(key, wouldOpen(lines, startLine, startLine + k, line, run, asMdx));
      if (!opensAt.get(key)) return;
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

    if (!closed && disable !== 'unterminated') {
      const atEnd = lines.slice(endLine).every(isBlank);
      findings.push({
        rule: 'unterminated',
        line: startLine,
        message: `the block opened at line ${startLine} ("${opener[0].trim()}") never reaches a closing ` +
          (atEnd ? 'fence — the rest of the file renders as code'
            : `fence — it runs on as code until line ${endLine}, where its list item or blockquote ends`),
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
    let findings;
    try {
      findings = scanMarkdown(readFileSync(join(root, file), 'utf8'), { disable, mdx: file.endsWith('.mdx'), limit: 11 }).findings;
    } catch (e) {
      // Name the file and keep going: one unexpected throw must not leave every later file unread.
      findings = [{ rule: 'gate-error', message: `the gate could not scan this file: ${e.message.split('\n')[0]}` }];
    }
    if (findings.length === 0) continue;
    failed += 1;
    error(`❌ ${file}: ${findings.length > 10 ? 'more than 10' : findings.length} finding(s)`);
    for (const f of findings.slice(0, 10)) error(`   [${f.rule}] ${f.message}`);
    if (findings.length > 10) error('   … stopped after 10');
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
 * `expect` is the exit code. `needs` lists the rule a RED probe depends on: the mutation proof
 * disables each rule in turn and requires the probe to go GREEN, which is what shows that this rule
 * — not another one that happens to fire first — is what made it red. `findings`, where given, is
 * the exact [rule, line, message fragment] list the scanner must report for the LAST file, which
 * an exit code cannot show (a finding reported on the wrong line still exits 1). `output`, where
 * given, lists fragments the run must print (a file named in an error, for instance).
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
  { name: 'the #457 signature after a UTF-8 byte-order mark is caught', files: { 'docs/a.md': `\uFEFF${md(...SIGNATURE)}` }, expect: 1, needs: ['swallowed'] },
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
  { name: 'an unclosed block ended by its blockquote, prose after, is caught', files: { 'docs/a.md': md('> ' + F + 'js', '> x', '', 'prose after the quote') }, expect: 1, needs: ['unterminated'] },
  { name: 'an unclosed block ended by its list item, more after, is caught', files: { 'docs/a.md': md('- a', '', '  ' + F + 'js', '  x', 'dedented prose', '', F + 'js', 'y', F) }, expect: 1, needs: ['unterminated'] },
  // A TAB before the swallowed line, after a container narrower than a tab stop (R1 T1). The parser
  // leaves that tab raw in its content; measured there it looked 4 columns deep and hid the opener.
  { name: 'the #457 signature tab-indented in a 2-column list item is caught', files: { 'docs/a.md': md('- item', '', '  ' + F + 'js', '  x', '  \t' + F + 'html', '  y', '  ' + F) }, expect: 1, needs: ['swallowed'], findings: [['swallowed-opener', 5, 'html']] },
  { name: 'the #457 signature tab-indented in a 3-column list item is caught', files: { 'docs/a.md': md('1. step', '', '   ' + F + 'js', '   x', '   \t' + F + 'html', '   y', '   ' + F) }, expect: 1, needs: ['swallowed'] },
  { name: 'the #457 signature tab-indented after "> " is caught', files: { 'docs/a.md': md('> ' + F + 'js', '> x', '> \t' + F + 'html', '> y', '> ' + F) }, expect: 1, needs: ['swallowed'] },
  // R1 M1: each of these kills a source mutant that survived the round-4 battery.
  { name: 'a swallowed opener indented 3 spaces is caught, on its own line', files: { 'docs/a.md': md(F + 'js', 'x', '   ' + F + 'html', 'y', F) }, expect: 1, needs: ['swallowed'], findings: [['swallowed-opener', 3, 'html']] },
  { name: 'a tilde opener whose info holds a backtick is still an opener, so it is swallowed', files: { 'docs/a.md': md('~~~js', 'x', '~~~a`b', 'y', '~~~') }, expect: 1, needs: ['swallowed'] },
  { name: 'an unclosed quoted block followed by a whitespace-only line is caught', files: { 'docs/a.md': '> ' + F + 'js\n> x\n   \n' }, expect: 1, needs: ['unterminated'], findings: [['unterminated', 1, 'rest of the file']] },
  { name: 'an unclosed quoted block followed by one line of prose is caught, at its container', files: { 'docs/a.md': md('> ' + F + 'js', '> x', 'prose') }, expect: 1, needs: ['unterminated'], findings: [['unterminated', 1, 'blockquote ends']] },
  // R3 Q2: the optional space after `>` is absent on the opener and present on the swallowed line.
  { name: 'the #457 signature under ">" with no space is caught', files: { 'docs/a.md': md('>' + F + 'js', '>    ' + F + 'html', '>x', '>' + F) }, expect: 1, needs: ['swallowed'], findings: [['swallowed-opener', 2, 'html']] },
  // R1 round 5: the re-check must examine the candidate's OWN block, not the file's first one, and
  // insert the opener's own run, not a fixed 3-character one — every earlier signature probe was the
  // first block and used 3-character fences, so both mutants survived.
  { name: 'the #457 signature after a clean first block is caught', files: { 'docs/a.md': md(F + 'bash', 'npm ci', F, '', 'prose', '', ...SIGNATURE) }, expect: 1, needs: ['swallowed'], findings: [['swallowed-opener', 9, 'html']] },
  { name: 'the #457 signature with 4-backtick fences is caught', files: { 'docs/a.md': md('````js', 'x', '````html', 'y', '````') }, expect: 1, needs: ['swallowed'], findings: [['swallowed-opener', 3, 'html']] },
  { name: 'the #457 signature with 4-tilde fences is caught', files: { 'docs/a.md': md('~~~~js', 'x', '~~~~html', 'y', '~~~~') }, expect: 1, needs: ['swallowed'] },
  // R3 S2: two candidates in one block with DIFFERENT prefixes need different answers; a memo key
  // without the prefix answers line 3 from line 2 and misses it.
  { name: 'a memoised re-check keys on the line\'s own prefix', files: { 'docs/a.md': md(F + 'md', '    ' + F + 'html', F + 'css', F) }, expect: 1, needs: ['swallowed'], findings: [['swallowed-opener', 3, 'css']] },
  // R1 round 6: a candidate rightly rejected must not answer for a later one in another block or
  // with another prefix — a constant key, a start-line-only key, and a prefix-only key each pass a
  // real signature green.
  { name: 'a rejected candidate does not answer for a later real one', files: { 'docs/a.md': md(F + 'md', '    ' + F + 'html', F + 'css', 'a{}', F) }, expect: 1, needs: ['swallowed'], findings: [['swallowed-opener', 3, 'css']] },
  {
    name: 'two blocks sharing a candidate prefix are answered separately',
    files: { 'docs/a.md': md(F + 'md', '      ' + F + 'html', F, '', '1.  step', '', '    ' + F + 'js', '    snippet', '      ' + F + 'html', '    <head>', '    ' + F) },
    expect: 1,
    needs: ['swallowed'],
    findings: [['swallowed-opener', 9, 'html']],
  },
  { name: 'an unterminated backtick block is caught', files: { 'docs/a.md': md('# T', '', F + 'js', 'x', '', 'prose that is now code') }, expect: 1, needs: ['unterminated'] },
  { name: 'an unterminated tilde block is caught', files: { 'docs/a.md': md('# T', '', T + 'js', 'x', '', 'prose') }, expect: 1, needs: ['unterminated'] },
  { name: 'an unterminated block with CRLF line endings is caught', files: { 'docs/a.md': crlf('# T', '', F + 'js', 'x', '', 'prose') }, expect: 1, needs: ['unterminated'] },
  { name: 'a defect in a nested directory is found', files: { 'docs/a.md': md('ok'), 'docs/deep/er/b.md': md(F + 'js', 'x', F + 'html', 'y', F) }, expect: 1, needs: ['swallowed'] },
  { name: 'README.md at the root is in scope', files: { 'README.md': md(F + 'js', 'x') }, expect: 1, needs: ['unterminated'] },
  { name: 'llms.txt is in scope despite its extension', files: { 'docs/a.md': md('ok'), 'llms.txt': md(F + 'js', 'x') }, expect: 1, needs: ['unterminated'] },
  { name: 'a Storybook .mdx docs page is in scope', files: { 'docs/a.md': md('ok'), 'apps/storybook/src/stories/x.mdx': md("import { Meta } from '@storybook/blocks';", '', ...SIGNATURE) }, expect: 1, needs: ['swallowed'] },
  // .mdx is parsed with the MDX grammar. Each RED probe below needs "mdx": parsed as CommonMark (the
  // mutation), the construct is indented code, HTML or content, and the defect passes green.
  { name: 'in .mdx, a 4-space-indented #457 signature is caught', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('text', '', ...SIGNATURE.map((l) => `    ${l}`)) }, expect: 1, needs: ['swallowed', 'mdx'] },
  { name: 'in .mdx, the #457 signature directly after a JSX tag is caught', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('<Canvas>', ...SIGNATURE, '</Canvas>') }, expect: 1, needs: ['swallowed', 'mdx'], findings: [['swallowed-opener', 4, 'html']] },
  {
    name: 'in .mdx, an indented bare fence closes the block early and the page runs on as code',
    files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md(F + 'js', 'const a = 1;', '    ' + F, '', 'Explanation paragraph.', '', F, '', '## Next section', '', 'Consumer-facing prose.') },
    expect: 1,
    needs: ['unterminated', 'mdx'],
  },
  { name: 'in .mdx, an indented bare fence that makes MDX fuse the next blocks is caught', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md(F + 'md', '    ' + F, F, 'x', F + 'html', 'y', F) }, expect: 1, needs: ['swallowed', 'mdx'] },
  // R1 round 6: a docs page teaching nested fences — valid .md, and in MDX the outer block closes at
  // the indented inner closer, so everything after it, `## Theming` included, renders as code.
  {
    name: 'in .mdx, a nested-fence lesson that MDX closes early is caught',
    files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('## Steps', '', F + 'md', '1. Install:', '', '    ' + F + 'bash', '    npm ci', '    ' + F, F, '', '## Theming', '', 'Prose.') },
    expect: 1,
    needs: ['mdx'],
    findings: [['swallowed-opener', 6, 'bash'], ['unterminated', 9, 'rest of the file']],
  },
  { name: 'in .mdx, an indented fence on a list-marker line is caught', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('# T', '', '-     ' + F + 'js', '      x') }, expect: 1, needs: ['unterminated', 'mdx'] },
  { name: 'in .mdx, an indented fence inside a quote is caught', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('# T', '', '>     ' + F + 'js', '>     x') }, expect: 1, needs: ['unterminated', 'mdx'], findings: [['unterminated', 3, 'never reaches']] },
  // R3 T1: a content line reading `> ``` ` must not pass for the block's own closer.
  { name: 'in .mdx, a quoted-looking content line is not taken for the closer (end of file)', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': F + 'md\n> ' + F }, expect: 1, needs: ['unterminated'] },
  { name: 'in .mdx, a quoted-looking content line is not taken for the closer (mid-file)', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('- item', '', '  ' + F + 'md', '  > ' + F, 'prose after') }, expect: 1, needs: ['unterminated'], findings: [['unterminated', 3, 'list item or blockquote']] },
  { name: 'VALID: in .mdx, a block holding one blank line is closed', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md(F, '', F, '', 'prose', '', '      ' + F + 'html', '', '      ' + F) }, expect: 0 },
  // R2 N-1: a list-item block that lost its closer runs into the next line, a quoted block's opener.
  { name: 'in .mdx, the next block\'s opener is not taken for this block\'s closer', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('- x', '  ~~~', '  code', '> ~~~', '> quoted prose', '> ~~~') }, expect: 1, needs: ['unterminated'], findings: [['unterminated', 2, 'never reaches']] },
  // R4 N11: re-parsing this file's variant used to throw out of the run, unnamed, and skip every
  // later file — here docs/z.md, which carries a real defect of its own.
  { name: 'a variant MDX cannot parse counts as an opener, and later files are still read', files: { 'docs/z.md': md(...SIGNATURE), 'apps/a.mdx': "export const meta = { title: 'X' };\n\n<div title=\"t\">\n       ```{.x}\n const a = 1;\n````ts\n   ```ts\n~~~~\n```\n   ``` js title=\"a.js\"\n\n~~~~~js\n    ``` a b\n\n```\n</div>\n\nA line ending in a tag <Kbd>k</Kbd>.\n>~~~tsx\n>   ~~~\n" }, expect: 1, needs: ['swallowed'], findings: [['swallowed-opener', 6, 'ts'], ['swallowed-opener', 7, 'ts'], ['swallowed-opener', 13, 'a b']] },
  // R1 round 7: closure comes from micromark's tokens, and each of these kills a way of reading it
  // off the last line instead (all verified against Storybook's render; no final newline on purpose).
  { name: 'VALID: in .mdx, a closed block inside a quote', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('> ' + F + 'js', '> x', '> ' + F, '', 'After.') }, expect: 0 },
  { name: 'in .mdx, a quoted callout whose closer is quoted one level too deep is caught', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('> **Example**', '>', '> ' + F + 'md', '> > Quoted note', '> > ' + F, '', 'Next section.') }, expect: 1, needs: ['unterminated'], findings: [['unterminated', 3, 'never reaches']] },
  { name: 'in .mdx, a closer shorter than its opener does not close', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': '````md\nx\n' + F }, expect: 1, needs: ['unterminated'] },
  { name: 'in .mdx, a last line with an info string does not close', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': F + 'js\nx\n' + F + 'a`b' }, expect: 1, needs: ['unterminated'] },
  { name: 'in .mdx, an opener on the last line closes nothing', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': 'text\n\n' + F }, expect: 1, needs: ['unterminated'] },
  { name: 'in .mdx, a closer of the other character does not close', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': F + 'js\nx\n~~~' }, expect: 1, needs: ['unterminated'] },
  // R4 round 8: a file that cannot even be read is NAMED, and the files after it are still scanned.
  { name: 'an unreadable file is named and later files are still read', files: { 'docs/a.md': { symlink: 'nowhere.md' }, 'docs/z.md': md(...SIGNATURE) }, expect: 1, findings: [['swallowed-opener', 3, 'html']], output: ['docs/a.md', 'gate-error', 'docs/z.md'] },
  { name: 'an .mdx file MDX cannot parse is reported, not passed', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('<Canvas>', '', 'unclosed JSX') }, expect: 1 },
  { name: 'VALID: in .mdx, a 4-backtick block holding 3-backtick example lines', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('````md', '    ' + F + 'js', '    ' + F, '````') }, expect: 0 },
  { name: 'VALID: in .mdx, a fence after a JSX tag and a blank line', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('<Canvas>', '', F + 'js', 'x', F, '', '</Canvas>') }, expect: 0 },
  // R4 N10: MDX renders no code block for these, so neither may the gate.
  { name: 'VALID: in .mdx, a #457 signature inside a JSX comment is not a block', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('{/*', ...SIGNATURE, '*/}') }, expect: 0 },
  { name: 'VALID: in .mdx, fence lines inside a JSX template literal are not a block', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md("import { Source } from '@storybook/blocks';", '', '<Source', '  language="md"', '  code={`', '    ~~~js', '    const a = 1;', '    ~~~', '  `}', '/>') }, expect: 0 },
  { name: 'VALID: in .mdx, inline code that starts a line is not a fence', files: { 'docs/a.md': md('ok'), 'apps/x.mdx': md('# T', '', F + 'ts`` is inline code.', '', 'More.') }, expect: 0 },
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
  { name: 'VALID: a labelled fence line indented 4+ inside a block is content', files: { 'docs/a.md': md(F + 'md', '    ' + F + 'html', F) }, expect: 0 },
  { name: 'VALID: an empty ">" line left of a list item ends the item', files: { 'docs/a.md': md('  - nested', '>', '\t' + F + 'js') }, expect: 0 },
  // R1 M1: the first pins the backtick-info rule; the closed-block pair keep the unclosed rule from
  // flagging a block that its own fence does close, inside a container.
  { name: 'VALID: a closed block inside a blockquote, then prose', files: { 'docs/a.md': md('> ' + F + 'js', '> x', '> ' + F, '', 'prose after the quote') }, expect: 0 },
  { name: 'VALID: a closed block inside a list item, then dedented prose', files: { 'docs/a.md': md('- a', '', '  ' + F + 'js', '  x', '  ' + F, 'dedented prose') }, expect: 0 },
  { name: 'VALID: a backtick run whose info string holds a backtick is inline code, not a fence', files: { 'docs/a.md': md(F + 'ts`` is inline code, not a fence.', '', 'More prose.') }, expect: 0 },
  { name: 'VALID: under an indented opener, a labelled line 4 columns into the container is content', files: { 'docs/a.md': md('  ' + F + 'md', '    ' + F + 'html', '  ' + F) }, expect: 0 },
  { name: 'VALID: a tab-indented tilde line inside a tilde block, 4 columns in, is content', files: { 'docs/a.md': md(T, '\t' + T + 'js', T) }, expect: 0 },
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
      if (typeof body === 'object') symlinkSync(body.symlink, join(root, path));
      else writeFileSync(join(root, path), body);
    }
    git(root, 'add', '-A');
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const codeNodes = (tree) => {
  const out = [];
  (function walk(n) {
    if (n.type === 'code') {
      const { start, end } = n.position;
      out.push([start.line, start.column, end.line, end.column, n.lang ?? null, n.meta ?? null, n.value]);
    }
    (n.children || []).forEach(walk);
  })(tree);
  return JSON.stringify(out);
};

/** Storybook's own parse, through its PUBLIC loader entry, captured as the mdast it compiles. */
async function storybookCodeNodes(source, loader = null) {
  // The loader is a parameter so the self-test can prove this adapter with substitute loaders,
  // without Storybook (R3 V2, PR #457).
  loader ??= (await import('@storybook/addon-docs/mdx-loader')).default;
  let captured = null;
  let calledBack = false;
  const error = console.error;
  console.error = () => {};
  try {
    await new Promise((done, fail) => {
      // Storybook's loader is `async`, so a throw before its callback is a REJECTED PROMISE; without
      // this catch it escaped as a raw stack instead of the labelled contract error (R3 V1).
      Promise.resolve(loader.call({
        async: () => (err) => { calledBack = true; return err ? fail(err) : done(); },
        getOptions: () => ({ mdxCompileOptions: { remarkPlugins: [() => (tree) => { captured = codeNodes(tree); }] } }),
        resourcePath: 'fence-gate-sentinel.mdx',
      }, source)).catch(fail);
    });
  } catch (e) {
    // Failing BEFORE the callback is the loader breaking, not the document being rejected.
    if (!calledBack) throw new Error(`mdx-loader failed before calling back (${String(e?.message ?? e).split('\n')[0]}) — its contract changed`);
    return { nodes: captured ?? 'REJECTED', pluginRan: captured !== null };
  } finally {
    console.error = error;
  }
  // `pluginRan` is evidence the comparison is against STORYBOOK's parse: a stand-in that returns
  // code nodes without running the plugin (the pinned parser itself, say) cannot supply it.
  return { nodes: captured ?? 'NOT CAPTURED', pluginRan: captured !== null };
}

function pinnedCodeNodes(source, { withMdx = true } = {}) {
  try {
    return codeNodes(fromMarkdown(source, withMdx ? { extensions: [mdxjs()], mdastExtensions: [mdxFromMarkdown()] } : {}));
  } catch {
    return 'REJECTED';
  }
}

/**
 * DRIFT SENTINEL (R3 T2, PR #457). The gate parses .mdx with pinned micromark packages; Storybook
 * renders it with its OWN bundled copy of that grammar, which moves whenever Storybook is upgraded.
 * Every tracked .mdx page and every .mdx probe fixture must produce identical code blocks in both —
 * positions, language, meta and content. A CONTROL runs the same corpus through the pinned parser
 * with the MDX extension removed, and must differ somewhere: otherwise the corpus exercises nothing
 * MDX-specific, and a green sentinel would prove nothing.
 */
function sentinelCorpus() {
  const pages = resolveScope(REPO_ROOT).filter((f) => f.endsWith('.mdx'))
    .map((file) => [file, readFileSync(join(REPO_ROOT, file), 'utf8')]);
  const fixtures = [];
  for (const p of PROBES) {
    for (const [file, body] of Object.entries(p.files)) {
      if (file.endsWith('.mdx') && typeof body === 'string') fixtures.push([`${p.name} :: ${file}`, body]);
    }
  }
  return { pages, fixtures };
}

/**
 * The sentinel's decision, with its parsers and corpus injected so the self-test can prove it FIRES
 * without touching Storybook (R1 S1, PR #457; the self-test must not depend on the loader, R3 U1).
 * It fails on: an empty corpus; no tracked page when `requirePages`; any document whose Storybook
 * side shows no evidence the capture plugin ran; any disagreement; and a control that never differs.
 */
async function driftSentinel({ storybook = storybookCodeNodes, pinned = pinnedCodeNodes, corpus = sentinelCorpus(),
  requirePages = true, log = console.log } = {}) {
  const docs = [...corpus.pages, ...corpus.fixtures];
  let failed = 0;
  let controlDiffers = 0;
  if (docs.length === 0) { log('❌ drift sentinel: the corpus is empty — refusing to pass over nothing'); failed += 1; }
  if (requirePages && corpus.pages.length === 0) { log('❌ drift sentinel: no tracked .mdx page was read'); failed += 1; }
  for (const [label, body] of docs) {
    const theirs = await storybook(body);
    const ours = pinned(body);
    if (theirs?.nodes !== 'REJECTED' && theirs?.pluginRan !== true) {
      failed += 1;
      log(`❌ Storybook's mdx-loader compiled ${label} without running the capture plugin — its contract changed`);
      continue;
    }
    if (theirs.nodes !== ours) {
      failed += 1;
      if (theirs.nodes === 'REJECTED') {
        log(`❌ Storybook's mdx-loader rejects ${label}, which the pinned parser accepts — the loader's ` +
          'contract or Storybook\'s MDX grammar changed; check what the loader now requires');
      } else {
        log(`❌ drift: Storybook and the pinned MDX parser disagree on ${label}`);
        log(`   storybook ${String(theirs.nodes).slice(0, 200)}`);
        log(`   pinned    ${String(ours).slice(0, 200)}`);
      }
    }
    if (pinned(body, { withMdx: false }) !== theirs.nodes) controlDiffers += 1;
  }
  if (docs.length > 0 && controlDiffers === 0) {
    log('❌ drift sentinel: the control never differs — the corpus exercises nothing MDX-specific');
    failed += 1;
  }
  if (failed > 0) {
    log('   Remedy for real drift: re-pin micromark, micromark-extension-mdxjs, mdast-util-from-markdown ' +
      'and mdast-util-mdx to the grammar @storybook/addon-docs bundles, then re-run this step.');
  }
  log(`${failed === 0 ? '✅' : '❌'} drift sentinel: ${docs.length} .mdx documents (${corpus.pages.length} tracked ` +
    `pages), control (no MDX extension) differs on ${controlDiffers}`);
  return failed === 0 ? 0 : 1;
}

/** Proves the sentinel can fire, with injected parsers — no Storybook involved. */
async function sentinelSelftest() {
  const { fixtures } = sentinelCorpus();
  const agrees = async (src) => ({ nodes: pinnedCodeNodes(src), pluginRan: true });
  const plain = { pages: [], fixtures: [['plain', md('# T', '', F + 'js', 'x', F)]] };
  const cases = [
    ['agreeing parsers pass', { storybook: agrees }, 0],
    ['a drifted Storybook side fails', { storybook: async (src) => ({ nodes: pinnedCodeNodes(src).replace(/\[(\d+),(\d+)/, (m, l, c) => `[${l},${+c + 1}`), pluginRan: true }) }, 1],
    ['a capture plugin that never ran fails', { storybook: async (src) => ({ nodes: pinnedCodeNodes(src), pluginRan: false }) }, 1],
    ['the pinned parser standing in for Storybook fails', { storybook: async (src) => pinnedCodeNodes(src) }, 1],
    ['Storybook rejecting what the pinned parser accepts fails', { storybook: async () => ({ nodes: 'REJECTED', pluginRan: false }) }, 1],
    ['a corpus with nothing MDX-specific fails its control', { storybook: agrees, corpus: plain }, 1],
    ['an empty corpus fails', { storybook: agrees, corpus: { pages: [], fixtures: [] } }, 1],
  ];
  let failed = 0;
  for (const [name, opts, expect] of cases) {
    const got = await driftSentinel({ corpus: { pages: [], fixtures }, requirePages: false, log: () => {}, ...opts });
    const ok = got === expect;
    if (!ok) failed += 1;
    console.log(`${ok ? '✅' : '❌'} drift sentinel: ${name} (expected exit ${expect}, got ${got})`);
  }
  const noPages = await driftSentinel({ storybook: agrees, corpus: { pages: [], fixtures }, requirePages: true, log: () => {} });
  if (noPages !== 1) failed += 1;
  console.log(`${noPages === 1 ? '✅' : '❌'} drift sentinel: no tracked page fails when pages are required (got ${noPages})`);

  // The loader ADAPTER, with substitute loaders (R3 V2): a broken loader must surface as a labelled
  // contract error, and a rejecting or plugin-skipping one as a result the sentinel fails on.
  const src = md(F + 'js', 'x', F);
  const adapter = [
    ['a loader that throws synchronously', function () { throw new TypeError('boom'); }, 'before calling back'],
    ['a loader that rejects before calling back', async function () { throw new TypeError('boom'); }, 'before calling back'],
    ['a loader that reports an error', function () { this.async()(new Error('nope')); }, { nodes: 'REJECTED', pluginRan: false }],
    ['a loader that never runs the plugin', function () { this.async()(); }, { nodes: 'NOT CAPTURED', pluginRan: false }],
  ];
  for (const [name, loader, want] of adapter) {
    let got;
    try {
      got = await storybookCodeNodes(src, loader);
    } catch (e) {
      got = e.message;
    }
    const ok = typeof want === 'string' ? typeof got === 'string' && got.includes(want) : JSON.stringify(got) === JSON.stringify(want);
    if (!ok) failed += 1;
    console.log(`${ok ? '✅' : '❌'} drift sentinel adapter: ${name} (got ${JSON.stringify(got).slice(0, 90)})`);
  }
  // The CI step relies on the DEFAULT of requirePages (R1 round 9): pin it by not passing it.
  const byDefault = await driftSentinel({ storybook: agrees, corpus: { pages: [], fixtures }, log: () => {} });
  if (byDefault !== 1) failed += 1;
  console.log(`${byDefault === 1 ? '✅' : '❌'} drift sentinel: by default, no tracked page fails (got ${byDefault})`);

  // An unknown flag is refused with exit 2 instead of falling through to the gate (R1 C1).
  let flags = 0;
  for (const flag of ['--no-such-flag', '--drift-sentinal']) {
    const status = spawnSync(process.execPath, [SELF, flag], { encoding: 'utf8' }).status;
    const ok = status === 2;
    if (!ok) failed += 1;
    flags += 1;
    console.log(`${ok ? '✅' : '❌'} CLI: the unknown flag ${flag} is refused with exit 2 (got ${status})`);
  }
  return { checks: cases.length + 1 + adapter.length + 1 + flags, failed };
}

async function selftest() {
  const quiet = { log: () => {}, error: () => {} };
  let failed = 0;
  let checks = 0;
  for (const p of PROBES) {
    const said = [];
    const [got, cli] = withFixture(p.files, (root) => [
      runGate(root, { log: () => {}, error: (m) => said.push(m) }),
      spawnSync(process.execPath, [SELF, '--root', root], { encoding: 'utf8' }).status,
    ]);
    let ok = got === p.expect && cli === p.expect;
    let detail = '';
    for (const fragment of p.output ?? []) {
      if (!said.some((m) => m.includes(fragment))) {
        ok = false;
        detail += `; output lacks "${fragment}"`;
      }
    }
    if (p.findings) {
      // Findings are asserted on the fixture's LAST file, parsed as its extension says.
      const [path, body] = Object.entries(p.files).at(-1);
      const actual = scanMarkdown(body, { mdx: path.endsWith('.mdx') }).findings;
      const match = actual.length === p.findings.length && p.findings.every(([rule, line, fragment], i) =>
        actual[i].rule === rule && actual[i].line === line && actual[i].message.includes(fragment));
      if (!match) {
        ok = false;
        detail = `; findings ${JSON.stringify(actual.map((f) => [f.rule, f.line]))}`;
      }
    }
    checks += 1;
    if (!ok) failed += 1;
    console.log(`${ok ? '✅' : '❌'} ${p.name} (expected exit ${p.expect}; in-process ${got}, CLI ${cli}${detail})`);
  }

  // MUTATION PROOF. A probe table can pass for the wrong reason: the first version of this file
  // had its only swallowed-opener probe caught by the parity rule, so the defect-detecting rule
  // could be deleted with the self-test still 5/5 (R1, PR #457). Here each rule is switched off in
  // turn, and every probe that names it must then PASS.
  for (const rule of ['swallowed', 'unterminated', 'mdx']) {
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

  const sentinel = await sentinelSelftest();
  checks += sentinel.checks;
  failed += sentinel.failed;

  if (failed > 0) {
    console.error(`\n❌ markdown fence gate self-test: ${failed} of ${checks} checks failed.`);
    process.exit(1);
  }
  console.log(`\n✅ markdown fence gate self-test: ${checks}/${checks} checks hold.`);
}

/** Flags the CLI accepts. Anything else is refused, not ignored (R1 C1, PR #457): an unknown flag
 * used to fall through to the plain gate, so renaming `--drift-sentinel` in this file but not in CI
 * would have turned the sentinel's CI step into a second, passing run of the gate. */
const KNOWN_FLAGS = new Set(['--selftest', '--drift-sentinel', '--root']);

if (process.argv[1] && resolve(process.argv[1]) === SELF) {
  const unknown = process.argv.slice(2).filter((a, i, all) => a.startsWith('--') && !KNOWN_FLAGS.has(a) && all[i - 1] !== '--root');
  if (unknown.length > 0) {
    console.error(`❌ unknown flag(s): ${unknown.join(' ')} — expected one of ${[...KNOWN_FLAGS].join(', ')}`);
    process.exit(2);
  }
  if (process.argv.includes('--selftest')) {
    await selftest();
  } else if (process.argv.includes('--drift-sentinel')) {
    // Its own CI step, AFTER the gate (R3 U1): a Storybook loader breakage must not stop the job
    // before the fence scan has given the PR its verdict.
    process.exit(await driftSentinel());
  } else {
    const at = process.argv.indexOf('--root');
    process.exit(runGate(at > -1 ? resolve(process.argv[at + 1]) : REPO_ROOT));
  }
}
