#!/usr/bin/env node
/**
 * NI-001 (visual-evidence-gate-integrity, WP01): zero pixel-affecting drift in
 * `apps/storybook/src/tests/visual.spec.ts` relative to the mission's pre-mission base.
 *
 * WP01's record claims, in several places, that its edits to this file never change what a
 * screenshot assertion actually tests — only whether the assertion is hard or soft, plus a
 * handful of inserted `#401` floor-assertion lines. That claim was originally backed only by
 * prose and a one-off `difflib` script run by hand. This formalizes it into something that can
 * actually fail on a future edit that sneaks a real change (a different locator, story id,
 * viewport, or threshold) past a reviewer skimming a large diff as "just more soft conversions".
 *
 * METHOD. Diff the working tree's copy of the file against `git show <baseRef>:<file>` with
 * `git diff -U0` (zero context lines, so every hunk is exactly the changed material). Within
 * each hunk, group consecutive `-` lines and the `+` lines that follow them into one block.
 * A block is ALLOWED only if:
 *   - it is a pure insertion (no `-` lines) whose every added line matches the known #401
 *     floor-assertion shape (`test.info().config.projects.map` + `toContain('chromium'/…)`), or
 *   - it is a 1:1 replacement (equal counts of `-`/`+` lines) where every removed line equals
 *     its corresponding added line after replacing every `expect(` with `expect.soft(`.
 * Anything else — a pure deletion, an unequal-count block, or a replacement whose lines differ
 * by more than that one substitution — is a VIOLATION.
 *
 * Usage: node scripts/verify-visual-spec-zero-drift.mjs [baseRef]
 *   baseRef defaults to 38f7e6fa, the commit this mission branched from.
 * Exit 0  — invariant holds (including the trivial case: file identical to baseRef).
 * Exit 1  — invariant VIOLATED — a change beyond the sanctioned substitution was found.
 * Exit 2  — verification_error — git itself failed (wrong ref, not a git repo, etc.).
 */
import { execFileSync } from 'node:child_process';

const FILE = 'apps/storybook/src/tests/visual.spec.ts';
const FLOOR_SHAPE = /test\.info\(\)\.config\.projects\.map/;

function gitDiff(baseRef) {
  return execFileSync('git', ['diff', '--no-color', '-U0', baseRef, '--', FILE], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Parse a `-U0` unified diff body into `{ removed: string[], added: string[] }` blocks. */
export function parseHunkBlocks(patchText) {
  const lines = patchText.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].startsWith('@@')) { i++; continue; }
    i++;
    while (i < lines.length && !lines[i].startsWith('@@') && !lines[i].startsWith('diff ')) {
      const removed = [];
      while (i < lines.length && lines[i].startsWith('-') && !lines[i].startsWith('---')) {
        removed.push(lines[i].slice(1));
        i++;
      }
      const added = [];
      while (i < lines.length && lines[i].startsWith('+') && !lines[i].startsWith('+++')) {
        added.push(lines[i].slice(1));
        i++;
      }
      if (removed.length === 0 && added.length === 0) {
        if (i < lines.length && !lines[i].startsWith('@@') && !lines[i].startsWith('diff ')) i++;
        else break;
        continue;
      }
      blocks.push({ removed, added });
    }
  }
  return blocks;
}

/** `{ ok: boolean, violations: string[] }` for one patch's set of hunk blocks. */
export function checkBlocks(blocks) {
  const violations = [];
  for (const { removed, added } of blocks) {
    if (removed.length === 0) {
      const bad = added.filter((l) => !FLOOR_SHAPE.test(l));
      if (bad.length) {
        violations.push(`pure insertion not matching the known #401 floor shape:\n    + ${bad.join('\n    + ')}`);
      }
      continue;
    }
    if (added.length === 0) {
      violations.push(`pure deletion (nothing added to replace it):\n    - ${removed.join('\n    - ')}`);
      continue;
    }
    if (removed.length !== added.length) {
      violations.push(
        `unequal removed(${removed.length})/added(${added.length}) block, not a clean 1:1 substitution:\n` +
          `    - ${removed.join('\n    - ')}\n    + ${added.join('\n    + ')}`,
      );
      continue;
    }
    for (let k = 0; k < removed.length; k++) {
      const transformed = removed[k].split('expect(').join('expect.soft(');
      if (transformed !== added[k]) {
        violations.push(`line changed beyond expect( -> expect.soft(:\n    - ${removed[k]}\n    + ${added[k]}`);
      }
    }
  }
  return { ok: violations.length === 0, violations };
}

if (process.argv.includes('--selftest')) {
  const PROBES = [
    [
      'a clean expect->expect.soft substitution',
      '@@ -1 +1 @@\n-  await expect(root).toHaveScreenshot(\'a.png\', {});\n+  await expect.soft(root).toHaveScreenshot(\'a.png\', {});\n',
      true,
    ],
    [
      'a clean floor-line pure insertion',
      "@@ -0,0 +1 @@\n+expect(test.info().config.projects.map((project) => project.name), 'x').toContain('chromium');\n",
      true,
    ],
    [
      'VIOLATION: a locator argument silently changed alongside the substitution',
      '@@ -1 +1 @@\n-  await expect(root).toHaveScreenshot(\'a.png\', {});\n+  await expect.soft(other).toHaveScreenshot(\'a.png\', {});\n',
      false,
    ],
    [
      'VIOLATION: a threshold silently changed alongside the substitution',
      '@@ -1 +1 @@\n-  await expect(root).toHaveScreenshot(\'a.png\', { threshold: 0.02 });\n+  await expect.soft(root).toHaveScreenshot(\'a.png\', { threshold: 0.2 });\n',
      false,
    ],
    [
      'VIOLATION: a pure deletion',
      '@@ -1 +0,0 @@\n-  await expect.soft(root).toHaveScreenshot(\'a.png\', {});\n',
      false,
    ],
    [
      'VIOLATION: a pure insertion that is NOT the floor shape',
      "@@ -0,0 +1 @@\n+  await expect(root).toHaveScreenshot('sneaked-in.png', {});\n",
      false,
    ],
  ];
  let bad = 0;
  for (const [note, patch, expectOk] of PROBES) {
    const { ok } = checkBlocks(parseHunkBlocks(patch));
    if (ok !== expectOk) {
      console.error(`  ✗ ${note}: expected ok=${expectOk}, got ok=${ok}`);
      bad++;
    }
  }
  if (bad) {
    console.error(`\n❌ ${bad} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(`✅ All ${PROBES.length} NI-001 probes behaved as recorded.`);
  process.exit(0);
}

const baseRef = process.argv[2] || '38f7e6fa';
let patch;
try {
  patch = gitDiff(baseRef);
} catch (err) {
  console.error(`verification_error: git diff against ${baseRef} failed — ${err.message}`);
  process.exit(2);
}

if (!patch.trim()) {
  console.log(`OK: ${FILE} is byte-identical to ${baseRef} — no drift is possible.`);
  process.exit(0);
}

const { ok, violations } = checkBlocks(parseHunkBlocks(patch));
if (!ok) {
  console.error(
    `❌ NI-001 VIOLATED: ${violations.length} change(s) in ${FILE} relative to ${baseRef} go ` +
      'beyond the sanctioned expect( -> expect.soft( substitution / #401 floor insertions:',
  );
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log(
  `✅ NI-001 holds: every changed line in ${FILE} relative to ${baseRef} is exactly ` +
    'expect( -> expect.soft(, or a recognized #401 floor-assertion insertion. No pure deletions.',
);
process.exit(0);
