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
 * WHY THIS EXISTS AS A GATE AND NOT AS A NOTE. Before #77 the rule was written down in three
 * places — CLAUDE.md, docs/contributing/adding-a-component.md and the authoring skill — and
 * the class had still recurred across ten story files. A process rule defers the next
 * occurrence; a gate closes the class.
 *
 * SCOPE, AND WHY IT IS NARROW. Ten styles-layer stories still carry the inert form. They are
 * #78/#79's to convert, and a repo-wide gate could not land today without either failing on
 * work this mission does not own or carrying an allowlist that would rot. So the scan is
 * scoped to the ELEMENTS package, where it returns zero hits today and fails closed for every
 * future migration. Each batch mission widens SCAN as it converts its components — that
 * widening is the point, and a mission that converts a directory without adding it here has
 * left the gate behind.
 *
 * Usage: node scripts/check-story-theme-wrapper.mjs [--selftest]
 */
import { globSync, readFileSync } from 'node:fs';

const SCAN = ['packages/elements/src/**/*.stories.ts'];

// The MARKUP form only. `data-theme="light"` appears legitimately in prose — every corrected
// story carries a comment naming the attribute as the thing not to use — so matching the bare
// attribute would flag the documentation of the fix. Requiring the tag opener immediately
// before it matches what a browser would act on.
const BAD = /<\w+[^>]*\bdata-theme\s*=\s*"light"/;

export function offenders(files) {
  const out = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    src.split('\n').forEach((line, i) => {
      if (BAD.test(line)) out.push(`${f}:${i + 1}`);
    });
  }
  return out;
}

if (process.argv.includes('--selftest')) {
  // Probe the REGEX, not a paraphrase of it. A gate whose evidence is a prose claim in a PR
  // body is the shape this repo has already watched degrade.
  const PROBES = [
    ['the inert wrapper', '<div data-theme="light" style="background: x">', true],
    ['single quotes in a template literal', "<section data-theme=\"light\">", true],
    ['spaced attribute', '<div  data-theme = "light" >', true],
    ['the CORRECT form', '<div class="sk-light" style="background: x">', false],
    ['a comment explaining the rule', ' * `class="sk-light"`, not `data-theme="light"` — see #93', false],
    ['a comment naming the selector', " * anchors light on `:root[data-theme=\"light\"], .sk-light`", false],
    ['dark theme, which is not this rule', '<div data-theme="dark">', false],
  ];
  let bad = 0;
  let mustCatch = 0;
  for (const [note, line, shouldFlag] of PROBES) {
    const flagged = BAD.test(line);
    if (shouldFlag) mustCatch++;
    if (flagged !== shouldFlag) {
      console.error(`  ✗ ${note}: expected ${shouldFlag ? 'a flag' : 'no flag'}, got the opposite`);
      bad++;
    }
  }
  // An empty or all-negative table would pass vacuously.
  if (mustCatch < 3) {
    console.error(`❌ degenerate probe table: only ${mustCatch} must-catch rows.`);
    process.exit(1);
  }
  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(`✅ All ${PROBES.length} probes behaved as recorded (${mustCatch} must-catch).`);
  process.exit(0);
}

const files = SCAN.flatMap((g) => globSync(g, {}));
// REFUSE AN EMPTY SET. A glob that stops matching — a directory rename, a stories convention
// change — would otherwise print a green line over nothing, which is this programme's named
// defect class and the reason every other gate here carries this floor.
if (files.length === 0) {
  console.error(
    `❌ no story files matched ${SCAN.join(', ')} — refusing to report green over nothing.\n` +
      '   Either the glob has drifted or the elements package has no stories; both are bugs.'
  );
  process.exit(1);
}

const found = offenders(files);
if (found.length) {
  console.error('❌ Story wrappers use `data-theme="light"`, which activates nothing:');
  for (const f of found) console.error(`   ${f}`);
  console.error(
    '\n   The token package anchors light on `:root[data-theme="light"], .sk-light`, and\n' +
      '   `:root` only matches <html>. Use `class="sk-light"` on the wrapper instead (#93).'
  );
  process.exit(1);
}
console.log(`✅ ${files.length} element story file(s) activate light mode correctly.`);
