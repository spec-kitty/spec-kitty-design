#!/usr/bin/env node
/**
 * MARKDOWN CODE-FENCE INTEGRITY over the repository's published Markdown (#456).
 *
 * WHY THIS EXISTS. A commit on PR #457 (d2c7c1ab) applied a snippet with an unanchored global
 * substitution: the pattern it replaced was a bare ```, so a copy of the snippet was spliced in
 * before almost every fence line of `docs/design-system/using-components.md` — closers as well as
 * openers — leaving 143 copies. Measured with the reference parser (commonmark.js 0.31.2):
 *   - An example's labelled opener (```html, ```css) cannot close a block, because CommonMark forbids
 *     an info string on a closing fence (§4.5, Example 147). Each one met an injected block, became
 *     CODE CONTENT, and fused into it: 140 swallowed openers. 69 blocks ended up holding two snippet
 *     copies with the example sandwiched between them and two stray language labels shown as code.
 *   - Code became prose. The file's one BARE opener, around the derived
 *     `--sk-layout-page-header-sticky-scroll-margin` formula, instead CLOSED an injected block, so the
 *     formula's four lines rendered as a paragraph and a bulleted list: its `+` operators became
 *     bullets.
 *   - Every block closed, and no prose became code.
 * The theme-bootstrap `<head>` example and the chart, form and footer docs were among those damaged.
 *
 * All 15 CI jobs stayed green. Nothing here parsed Markdown: `lint-code` was ESLint, Stylelint and
 * HTMLHint, and the specs that read that file slice a named heading and assert substrings are
 * PRESENT, which an insertion cannot break. Review lenses caught it by reading the diff.
 *
 * WHAT IT ASSERTS. This scans fences the way CommonMark defines them — backtick AND tilde fences,
 * the opener's length, closers that must be the same character, at least as long and carry no info
 * string; LF, CRLF or bare-CR line endings; tabs expanded to CommonMark's 4-column stops; indentation measured
 * from the enclosing list item or blockquote (a line indented 4+ columns past its container is never
 * a fence); and HTML blocks (all seven start conditions of §4.6), whose contents are not Markdown.
 * Per file it rejects:
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
 * because its list item ended is valid CommonMark and not flagged. Its block model is a subset of
 * CommonMark's — lists (including lazy continuation and the paragraph-interrupt rules), blockquotes,
 * HTML blocks, paragraphs, ATX headings and thematic breaks; link reference definitions, setext
 * headings and tables are read as paragraphs — and where a subset is wrong it can be wrong in EITHER
 * direction: a misread container can hide a real signature as easily as invent a false one.
 * Measured (PR #457) against jgm's reference `commonmark.js` 0.31.2, line by line: every tracked
 * `.md` in this repository (1,172 files including kitty-specs/), three reviewers' edge corpora, and
 * 120,000 generated documents from two independent fuzzers — zero disagreements, where the previous
 * version of this file disagreed on 1.07%. Re-run that comparison before trusting it on a construct
 * this repository does not yet use.
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
const LIST_ITEM = /^([-*+]|(\d{1,9})[.)])( +|$)/;
const THEMATIC_BREAK = /^(?:(?:\*[ ]*){3,}|(?:-[ ]*){3,}|(?:_[ ]*){3,})$/;
const ATX_HEADING = /^#{1,6}(?:\s|$)/;

// CommonMark 0.31.2 §4.6, the seven HTML-block start conditions. `end: null` ends at a blank line.
const BLOCK_TAGS = 'address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|' +
  'details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|' +
  'header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|' +
  'search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul';
const ATTR = String.raw`(?:\s+[A-Za-z_:][\w.:-]*(?:\s*=\s*(?:[^\s"'=<>\x60]+|'[^']*'|"[^"]*"))?)`;
const HTML_BLOCKS = [
  { start: /^<(?:pre|script|style|textarea)(?:\s|>|$)/i, end: /<\/(?:pre|script|style|textarea)>/i },
  { start: /^<!--/, end: /-->/ },
  { start: /^<\?/, end: /\?>/ },
  { start: /^<![A-Za-z]/, end: />/ },
  { start: /^<!\[CDATA\[/, end: /\]\]>/ },
  { start: new RegExp(`^</?(?:${BLOCK_TAGS})(?:\\s|/?>|$)`, 'i'), end: null },
  {
    start: new RegExp(`^(?:<[A-Za-z][A-Za-z0-9-]*${ATTR}*\\s*/?>|</[A-Za-z][A-Za-z0-9-]*\\s*>)\\s*$`),
    end: null,
    cannotInterruptParagraph: true,
  },
];

/** Tabs to the next multiple of 4 columns, as CommonMark counts them. */
function expandTabs(line) {
  if (!line.includes('\t')) return line;
  let out = '';
  for (const ch of line) out += ch === '\t' ? ' '.repeat(4 - (out.length % 4)) : ch;
  return out;
}

/** Leading whitespace in columns, tabs to the next multiple of 4. Tabs are already expanded on
 * the normal path; counting them here too keeps the "tabs" mutation equal to the pre-fix code. */
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
function stripQuotes(line, depth = Infinity, disable = null) {
  if (disable === 'quotes') return { rest: line, found: 0 };
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

/** Whether `content` (container prefixes already stripped, at most 3 columns past its container)
 * starts a block. Anything else, after an open paragraph, is a continuation of that paragraph. */
function startsBlock(content, inOwnContainer, paragraphOpen, disable) {
  const open = FENCE_OPEN.exec(content);
  if (open && !(open[1][0] === '`' && open[2].includes('`'))) return true;
  if (THEMATIC_BREAK.test(content) || ATX_HEADING.test(content)) return true;
  const item = disable === 'lists' ? null : LIST_ITEM.exec(content);
  if (item && canStartItem(item, content, inOwnContainer)) return true;
  if (disable === 'html') return false;
  return HTML_BLOCKS.some((b) => b.start.test(content) && !(b.cannotInterruptParagraph && paragraphOpen));
}

/** A list item may interrupt a paragraph only if it is non-empty and, if ordered, starts at 1. */
function canStartItem(item, content, inOwnContainer) {
  if (!inOwnContainer) return true;
  const rest = content.slice(item[0].length);
  return rest.trim() !== '' && (item[2] === undefined || item[2] === '1');
}

/**
 * Scans one Markdown source. Returns the findings and, for analysis, which lines are code-fence
 * lines (opener, content or closer). `disable` names ONE rule or behaviour to switch off — used only
 * by the self-test's mutation proof, which must show that removing it changes a probe's verdict.
 */
export function scanMarkdown(text, { disable = null } = {}) {
  const lines = text.split(disable === 'crlf' ? '\n' : /\r\n|\r|\n/); // CommonMark §2.1 line endings
  // The empty element after a trailing newline is not a line. Read as one, it has no quote marker,
  // so a block open inside a blockquote was "closed by its container" before the end-of-file check
  // could report it (R1 N2, PR #457).
  const count = lines.length > 1 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
  const findings = [];
  const inCode = new Array(lines.length).fill(false);
  const listCols = [];
  let fence = null;
  let html = null;
  let paragraph = false;

  // Container check shared by fences and HTML blocks: a lazy quote line or a dedent out of the
  // list item ends the block. Code is never a lazy continuation, so CommonMark closes it there.
  const containerEnded = (block, found, rest) =>
    found < block.depth || (rest.trim() !== '' && indentOf(rest) < block.col);

  for (let i = 0; i < count; i += 1) {
    const raw = disable === 'tabs' ? lines[i] : expandTabs(lines[i]);

    if (fence) {
      const { rest, found } = stripQuotes(raw, fence.depth, disable);
      if (containerEnded(fence, found, rest)) {
        fence = null;
      } else {
        inCode[i] = true;
        const rel = indentOf(rest) - fence.col;
        const body = rest.trimStart();
        if (rel <= 3) {
          if (new RegExp(`^\\${fence.char}{${fence.len},}\\s*$`).test(body)) {
            fence = null;
            continue;
          }
          const m = FENCE_OPEN.exec(body);
          if (m && m[1][0] === fence.char && m[1].length >= fence.len && m[2].trim() !== ''
            && !(fence.char === '`' && m[2].includes('`')) && disable !== 'swallowed') {
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

    if (html) {
      const { rest, found } = stripQuotes(raw, html.depth, disable);
      if (containerEnded(html, found, rest)) {
        html = null;
      } else if (html.end === null) {
        if (rest.trim() === '') html = null;
        continue;
      } else {
        if (html.end.test(rest)) html = null;
        continue;
      }
    }

    const { rest, found: depth } = stripQuotes(raw, Infinity, disable);
    const blank = rest.trim() === '';
    const indent = indentOf(rest);
    let content = rest.trimStart();
    // WHICH OPEN LIST ITEMS DOES THIS LINE CONTINUE? This follows commonmark.js's incorporateLine.
    // An item at this line's quote depth continues if the line is blank or indented to its content
    // column. An item outside a deeper quote continues if the quote marker sits at or right of that
    // column (an empty `>` left of it ends the item). An item inside a quote this line has left
    // does not continue (R1 N3/G3: the stack used to leak across a blockquote boundary).
    const rawIndent = indentOf(raw);
    const continues = (e) => (e.depth === depth ? blank || indent >= e.col : e.depth < depth && rawIndent >= e.col);
    let matched = 0;
    while (matched < listCols.length && continues(listCols[matched])) matched += 1;
    if (blank) {
      listCols.length = matched;
      paragraph = false;
      continue;
    }
    // A `>` beyond the paragraph's own depth opened a new blockquote, which ends that paragraph.
    if (paragraph && depth > paragraph.depth) paragraph = false;
    // The paragraph-interrupt restrictions (an ordered item must start at 1, an item must be
    // non-empty) apply only while the line is still inside the paragraph's own container. A line
    // that has fallen out of it is judged against the container it did reach, where they do not
    // apply — but indented code and HTML block type 7 still cannot start while a paragraph is open.
    const inOwnContainer = paragraph && depth === paragraph.depth && matched >= paragraph.items;
    const deepest = listCols[matched - 1];
    let col = deepest && deepest.depth === depth ? deepest.col : 0;
    const starts = indent - col <= 3 && startsBlock(content, inOwnContainer, Boolean(paragraph), disable);
    if (!starts) {
      // LAZY CONTINUATION (R2 G-2, R4 N3): a paragraph line that does not start a block keeps every
      // container open, including the ones it failed to continue. Closing them here made a fence
      // later in the same item read as indented code, which let the #457 signature through.
      if (paragraph && disable !== 'lazy') continue;
      listCols.length = matched;
      if (indent - col >= 4) continue; // indented code (no paragraph is open)
      paragraph = ATX_HEADING.test(content) ? false : { depth, items: listCols.length };
      continue;
    }
    const hadParagraph = Boolean(paragraph);
    listCols.length = matched;
    paragraph = false;

    if (THEMATIC_BREAK.test(content)) continue;
    const item = disable === 'lists' ? null : LIST_ITEM.exec(content);
    const itemContent = item ? content.slice(item[0].length) : '';
    if (item && canStartItem(item, content, inOwnContainer)) {
      // Five or more spaces after the marker: the item's content starts one space in, and what
      // follows is an indented code block, never a fence (CommonMark §5.2, rule 2).
      const spaces = item[3].length;
      col = indent + item[1].length + (spaces >= 1 && spaces <= 4 ? spaces : 1);
      listCols.push({ col, depth });
      content = itemContent.trimStart();
      paragraph = false;
      if (content === '' || spaces >= 5) continue;
    }

    const open = FENCE_OPEN.exec(content);
    if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
      fence = { char: open[1][0], len: open[1].length, col, depth, line: i + 1, text: content.trim() };
      inCode[i] = true;
      paragraph = false;
      continue;
    }
    if (disable !== 'html') {
      const kind = HTML_BLOCKS.find((b) => b.start.test(content) && !(b.cannotInterruptParagraph && hadParagraph));
      if (kind) {
        paragraph = false;
        if (kind.end === null || !kind.end.test(content)) html = { end: kind.end, col, depth };
        continue;
      }
    }
    paragraph = ATX_HEADING.test(content) ? false : { depth, items: listCols.length };
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
  { name: 'the #457 signature with CRLF line endings is caught', files: { 'docs/a.md': crlf(...SIGNATURE, '', 'prose') }, expect: 1, needs: ['swallowed', 'crlf'] },
  { name: 'the #457 signature with bare-CR line endings is caught', files: { 'docs/a.md': `${[...SIGNATURE, '', 'prose'].join('\r')}\r` }, expect: 1, needs: ['swallowed', 'crlf'] },
  { name: 'the #457 signature after a tab following ">" is caught', files: { 'docs/a.md': md(...SIGNATURE.map((l) => `>\t${l}`)) }, expect: 1, needs: ['swallowed', 'tabs'] },
  { name: 'the #457 signature after a tab following a list marker is caught', files: { 'docs/a.md': md(`-\t${F}js`, '    x', `    ${F}html`, '    y', `    ${F}`) }, expect: 1, needs: ['swallowed', 'tabs'] },
  // These two open the signature with a BARE fence on purpose: with HTML unmodelled, that fence
  // closes the phantom block the fence-like line opened, and the rest pairs cleanly — which is
  // how R3 made the #457 signature pass green (PR #457). A `js`-labelled opener would red anyway.
  {
    name: 'a fence line inside an HTML comment does not mask a later #457 signature',
    files: { 'docs/a.md': md('<!--', F + 'js', '-->', '', F, 'x', F + 'html', 'y', F) },
    expect: 1,
    needs: ['swallowed', 'html'],
  },
  {
    name: 'a fence line inside <pre> does not mask a later #457 signature',
    files: { 'docs/a.md': md('<pre>', F + 'js', '</pre>', '', F, 'x', F + 'html', 'y', F) },
    expect: 1,
    needs: ['swallowed', 'html'],
  },
  { name: 'the #457 signature inside a blockquote is caught', files: { 'docs/a.md': md('> note', '>', ...SIGNATURE.map((l) => `> ${l}`)) }, expect: 1, needs: ['swallowed', 'quotes'] },
  {
    name: 'the #457 signature in a list item with a 4-column fence is caught',
    files: { 'docs/a.md': md('- item', '', ...SIGNATURE.map((l) => `    ${l}`)) },
    expect: 1,
    needs: ['swallowed', 'lists'],
  },
  {
    name: 'an unterminated block inside a blockquote at end of file is caught',
    files: { 'docs/a.md': md('> **Note**', '>', '> ' + F + 'bash', '> npm install', '>', '> Then run the build.') },
    expect: 1,
    needs: ['unterminated', 'quotes'],
  },
  {
    name: 'the #457 signature after a lazy continuation line in a list item is caught',
    // 5 columns in: a fence only while the item (content column 2) is still open. Had the lazy line
    // closed the item, this would be indented code and the signature would pass green.
    files: { 'docs/a.md': md('- item', 'lazy continuation', '', ...SIGNATURE.map((l) => `     ${l}`)) },
    expect: 1,
    needs: ['swallowed', 'lazy'],
  },
  { name: 'an unterminated backtick block is caught', files: { 'docs/a.md': md('# T', '', F + 'js', 'x', '', 'prose that is now code') }, expect: 1, needs: ['unterminated'] },
  { name: 'an unterminated tilde block is caught', files: { 'docs/a.md': md('# T', '', T + 'js', 'x', '', 'prose') }, expect: 1, needs: ['unterminated'] },
  { name: 'an unterminated block with CRLF line endings is caught', files: { 'docs/a.md': crlf('# T', '', F + 'js', 'x', '', 'prose') }, expect: 1, needs: ['unterminated', 'crlf'] },
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
  for (const rule of ['swallowed', 'unterminated', 'crlf', 'tabs', 'html', 'quotes', 'lists', 'lazy']) {
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
