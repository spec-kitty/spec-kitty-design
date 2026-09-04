#!/usr/bin/env node
/**
 * Light-mode stories must activate light mode (#93, #77).
 *
 * `@spec-kitty/tokens` anchors its light block on `:root[data-theme="light"], .sk-light`, and
 * `:root` only ever matches <html>. So `<div data-theme="light">` around a story activates
 * NOTHING: the story renders the DARK palette on a light background, looks plausible in a
 * screenshot, and passes every gate. axe does not flag it — the contrast it measures is the
 * dark palette's, which is fine. #77 found two stories in this state and neither had ever
 * been correct.
 *
 * WHY A GATE AND NOT A NOTE. Before #77 the rule was written in three documents — CLAUDE.md,
 * docs/contributing/adding-a-component.md and the authoring skill — and the class had still
 * recurred across ten story files. A process rule defers the next occurrence; a gate closes it.
 *
 * WHY REPO-WIDE WITH A SHRINK-ONLY COUNT, and not a directory scope.
 *
 * The first version of this gate scanned `packages/elements/**` only, on the theory that each
 * batch mission would widen it as it converted components. A pass-2 lens showed that model had
 * already failed twice before it was written: `sk-stub` and `sk-nav-pill` are both MIGRATED
 * elements, and both still have an offending styles-layer story. Migrating a component does
 * not move its styles-layer story into the scanned directory, so a directory scope keeps
 * missing exactly the files it exists to catch — and `docs/contributing/adding-a-component.md`
 * tells authors to fix "the styles-layer story", which the gate could not see.
 *
 * So it scans every story file and ratchets on the COUNT, which is the pattern this repo
 * already uses for `expected-parts.json` and `packages/react/.wrapper-floor`: the number may
 * fall and may never rise. A new offender fails immediately, wherever it lands, and the ten
 * known ones can be retired one mission at a time without an allowlist to rot.
 *
 * Usage: node scripts/check-story-theme-wrapper.mjs [--selftest]
 */
import { globSync, readFileSync, writeFileSync } from 'node:fs';

const SCAN = 'packages/**/*.stories.ts';
const FLOOR_FILE = 'expected-inert-theme-wrappers.json';

/**
 * Matches the MARKUP form on a tag opener.
 *
 * Deliberately tolerant where a browser is tolerant, because the first version was not and its
 * own probe table certified coverage it did not have:
 *   - `["']?` — HTML permits single-quoted and unquoted attribute values, and the first regex
 *     required double quotes while a probe row labelled "single quotes" carried a double-quoted
 *     payload. Three lenses caught that row independently.
 *   - `i` — `DATA-THEME` is the same attribute.
 *   - no per-line split — a prettier-wrapped opener puts the attribute on its own line, and
 *     the first version scanned line by line so it could not see one. Note `[^>]*` already
 *     spans newlines: a negated character class matches `\n`. An intermediate draft "improved"
 *     this to `[\s\S]*?` and immediately produced two false positives — with `>` no longer
 *     excluded, an earlier tag opener paired with a later `data-theme="light"` inside a
 *     COMMENT explaining this very rule. `[^>]*` is what makes the anchor mean anything.
 *
 * `<\w+` anchors to a tag opener so the many `//` and `*` comments that NAME this attribute —
 * including the ones explaining this rule — are not flagged.
 */
const BAD = /<\w+[^>]*\bdata-theme\s*=\s*["']?light\b/gi;

export function offenders(files) {
  const out = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(BAD)) {
      out.push(`${f}:${src.slice(0, m.index).split('\n').length}`);
    }
  }
  return out.sort();
}

if (process.argv.includes('--selftest')) {
  const PROBES = [
    ['the inert wrapper, double quoted', '<div data-theme="light" style="background: x">', true],
    ['SINGLE quoted — the form the first regex missed', "<div data-theme='light'>", true],
    ['UNQUOTED — also legal HTML', '<div data-theme=light>', true],
    ['uppercase attribute', '<DIV DATA-THEME="LIGHT">', true],
    ['a prettier-wrapped opener across lines', '<div\n  data-theme="light"\n  style="x"\n>', true],
    ['the CORRECT form', '<div class="sk-light" style="background: x">', false],
    ['a comment explaining the rule', ' * `class="sk-light"`, not `data-theme="light"` — see #93', false],
    ['a comment naming the selector', ' * anchors light on `:root[data-theme="light"], .sk-light`', false],
    // The false positive an intermediate draft actually produced: a correct wrapper earlier in
    // the file, and a comment about the rule later. With `>` not excluded these paired up.
    [
      'a correct wrapper followed later by a comment about the rule',
      '<div class="sk-light">x</div>\n// use class="sk-light", never data-theme="light"',
      false,
    ],
    ['dark theme, which is not this rule', '<div data-theme="dark">', false],
  ];
  let bad = 0;
  let mustCatch = 0;
  for (const [note, text, shouldFlag] of PROBES) {
    BAD.lastIndex = 0;
    const flagged = BAD.test(text);
    if (shouldFlag) mustCatch++;
    if (flagged !== shouldFlag) {
      console.error(`  ✗ ${note}: expected ${shouldFlag ? 'a flag' : 'no flag'}, got the opposite`);
      bad++;
    }
  }

  // PROBE THE READER, NOT ONLY THE REGEX. The first version tested `BAD` directly and never
  // called offenders(), so a broken read, loop or line-number path would have self-tested green
  // — a gate self-test that cannot see its own reporting code.
  const tmp = `${process.env['TMPDIR'] ?? '/tmp'}/theme-probe-${process.pid}.stories.ts`;
  writeFileSync(tmp, 'const a = 1;\nexport const X = `<div data-theme="light">y</div>`;\n');
  const got = offenders([tmp]);
  if (got.length !== 1 || !got[0].endsWith(':2')) {
    console.error(`  ✗ offenders() did not report the offender at line 2 — got ${JSON.stringify(got)}`);
    bad++;
  }
  const clean = offenders([]);
  if (clean.length !== 0) {
    console.error('  ✗ offenders([]) is not empty');
    bad++;
  }

  if (mustCatch < 4) {
    console.error(`❌ degenerate probe table: only ${mustCatch} must-catch rows.`);
    process.exit(1);
  }
  if (bad) {
    console.error(`\n❌ ${bad} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(`✅ All ${PROBES.length} regex probes plus 2 reader probes behaved as recorded (${mustCatch} must-catch).`);
  process.exit(0);
}

const files = globSync(SCAN, {});
// REFUSE AN EMPTY SET — a glob that stops matching would print a green line over nothing.
if (files.length === 0) {
  console.error(
    `❌ no story files matched ${SCAN} — refusing to report green over nothing.\n` +
      '   The glob has drifted, or the packages have moved.'
  );
  process.exit(1);
}

const found = offenders(files);
const floor = JSON.parse(readFileSync(FLOOR_FILE, 'utf8'));
const allowed = floor.count;
if (!Number.isInteger(allowed) || allowed < 0) {
  console.error(`❌ ${FLOOR_FILE} must record a non-negative integer count (read ${JSON.stringify(allowed)}).`);
  process.exit(1);
}

if (found.length > allowed) {
  console.error(
    `❌ ${found.length} story wrapper(s) use \`data-theme="light"\`, which activates nothing — ` +
      `the recorded count is ${allowed}:`
  );
  for (const f of found) console.error(`   ${f}`);
  console.error(
    '\n   The token package anchors light on `:root[data-theme="light"], .sk-light`, and\n' +
      '   `:root` only matches <html>. Use `class="sk-light"` on the wrapper instead (#93).'
  );
  process.exit(1);
}

if (found.length < allowed) {
  console.error(
    `❌ ${found.length} offender(s) remain but ${FLOOR_FILE} still records ${allowed}.\n` +
      `   This ratchet is shrink-only and does not lower itself: edit the count to ${found.length}\n` +
      '   in the same commit that fixed them, so the improvement is a deliberate line in the diff.'
  );
  process.exit(1);
}

console.log(
  `✅ ${files.length} story file(s) scanned; ${found.length} known inert theme wrapper(s), none new.`
);
