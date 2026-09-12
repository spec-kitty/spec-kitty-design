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
 *   If `baseRef` is given, it is used literally (useful for a one-off historical check).
 *   If omitted, the base is computed as `git merge-base HEAD origin/train/elements-first` — the
 *   commit this branch actually forked from RIGHT NOW, recomputed fresh on every run. This is
 *   deliberately NOT a hardcoded historical SHA: a hardcoded base survives exactly until the
 *   branch is next rebased onto a moved train, at which point every OTHER change the rebase
 *   brings in (a sibling PR that also touches this file, adding whole new tests) reads as a
 *   "violation" too, because it is compared against a base that predates it. Diffing from the
 *   merge-base instead isolates exactly this branch's own contribution, no matter how many times
 *   it is rebased.
 *
 *   If `origin/train/elements-first` cannot be resolved (no such remote-tracking ref — e.g. a
 *   shallow or main-only clone), this is a LOUD failure (exit 2), not a silent substitution. An
 *   earlier revision fell back to a hardcoded historical SHA (`38f7e6fa`) here, via a bare
 *   `catch { return FALLBACK_BASE }` with no notice printed at all. That SHA was a real commit —
 *   reachable from the train at the time, but ONLY through the mission branch that introduced
 *   this file, never through `main`. #362/#434 hit the identical shape one layer up (a workflow
 *   anchored to a commit only a soon-to-be-squash-merged branch carried) and it reddened CI for
 *   every PR the moment that branch was deleted, discovered only by an unrelated PR that happened
 *   to trip it. This script is not CI-wired (#435), so a silent wrong fallback here would surface
 *   even later: a human runs it by hand, gets a plausible-looking result, and trusts a diff
 *   against a base that predates every real change in the file — precisely because git does not
 *   reliably error on a dereference of an unreachable-but-not-yet-GC'd object, so the wrong
 *   comparison can still "succeed". Pass a `baseRef` explicitly when the default cannot be
 *   resolved; the caller then decides what "before" means, instead of the script silently
 *   guessing.
 * Exit 0  — invariant holds (including the trivial case: file identical to baseRef).
 * Exit 1  — invariant VIOLATED — a change beyond the sanctioned substitution was found.
 * Exit 2  — verification_error — git itself failed (wrong ref, not a git repo, default base
 *           could not be resolved, etc.).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = 'apps/storybook/src/tests/visual.spec.ts';
const FLOOR_SHAPE = /test\.info\(\)\.config\.projects\.map/;
const TRAIN_REF = 'origin/train/elements-first';

/**
 * `git merge-base HEAD <TRAIN_REF>`. Throws — loudly, carrying the underlying git error — if
 * `TRAIN_REF` cannot be resolved, rather than silently substituting a hardcoded base. See the
 * file header for why a fallback here is exactly the #362/#434 defect class and why it was
 * deleted rather than re-anchored to an immutable tag.
 */
export function resolveDefaultBase() {
  try {
    return execFileSync('git', ['merge-base', 'HEAD', TRAIN_REF], { encoding: 'utf8' }).trim();
  } catch (err) {
    throw new Error(
      `cannot resolve default base: \`git merge-base HEAD ${TRAIN_REF}\` failed — ${String(err.message).trim()}. ` +
        'Pass a base ref explicitly: node scripts/verify-visual-spec-zero-drift.mjs <baseRef>',
    );
  }
}

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

// Run-as-CLI guard (same convention as check-adr-index.mjs and the other scripts in this mission) — cheap consistency even though nothing currently imports this module's exports.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
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

    // ── PART B: resolveDefaultBase()'s LOUD-FAILURE behaviour (#435) ──────────────────────────
    //
    // Part A above exercises checkBlocks/parseHunkBlocks in-process — real code, but not the
    // resolveDefaultBase() path this file's own defect (a silent hardcoded-SHA fallback) lived
    // in. That function shells out to git and its answer depends on which refs the CURRENT repo
    // happens to carry, so it cannot be probed by calling it directly without controlling the
    // repo it runs against. These probes spawn THIS SAME FILE as a real subprocess against
    // scratch git repos that do/don't carry `origin/train/elements-first` — the actual CLI path
    // end to end, not a reimplementation of it (the #434 mistake this mission was warned about).
    const SELF = fileURLToPath(import.meta.url);
    const scratch = mkdtempSync(join(tmpdir(), 'ni001-selftest-'));
    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: 'selftest', GIT_AUTHOR_EMAIL: 'selftest@example.invalid',
      GIT_COMMITTER_NAME: 'selftest', GIT_COMMITTER_EMAIL: 'selftest@example.invalid',
    };
    const git = (repo, args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', env: gitEnv });
    let subprocessBad = 0;
    let subprocessTotal = 0;
    const subprocessProbe = (note, repo, args, check) => {
      subprocessTotal++;
      let result;
      try {
        const out = execFileSync('node', [SELF, ...args], { cwd: repo, encoding: 'utf8', env: gitEnv });
        result = { code: 0, out };
      } catch (err) {
        result = { code: err.status ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
      }
      if (!check(result)) {
        console.error(`  ✗ ${note}: got exit ${result.code}, output:\n${result.out.split('\n').map((l) => `      ${l}`).join('\n')}`);
        subprocessBad++;
      }
    };
    try {
      // A repo with NO `origin/train/elements-first` ref at all — a main-only or shallow clone,
      // exactly the shape #362/#434 and this script's own docstring describe.
      const noTrainRepo = join(scratch, 'no-train-ref');
      mkdirSync(noTrainRepo);
      git(noTrainRepo, ['init', '-q']);
      writeFileSync(join(noTrainRepo, 'x.txt'), 'x\n');
      git(noTrainRepo, ['add', '.']);
      git(noTrainRepo, ['commit', '-q', '-m', 'init']);

      subprocessProbe(
        'no baseRef, unresolvable origin/train/elements-first -> LOUD exit 2, no silent fallback',
        noTrainRepo,
        [],
        ({ code, out }) => code === 2 && /cannot resolve default base/.test(out) && /origin\/train\/elements-first/.test(out),
      );

      const headSha = git(noTrainRepo, ['rev-parse', 'HEAD']).trim();
      subprocessProbe(
        'explicit baseRef bypasses resolveDefaultBase entirely -> still runs (exit 0)',
        noTrainRepo,
        [headSha],
        ({ code, out }) => code === 0 && /byte-identical/.test(out),
      );
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }

    // Floor OUTSIDE the tables (same shape as check-develop-ruleset-parity.mjs's PROBE_FLOOR):
    // a probe count silently shrinking to zero must itself be caught.
    const FLOOR = 8;
    const total = PROBES.length + subprocessTotal;
    if (total < FLOOR) {
      console.error(`\n❌ the probe set has shrunk: ${total} probe(s) against a floor of ${FLOOR}.`);
      process.exit(1);
    }

    if (bad || subprocessBad) {
      console.error(`\n❌ ${bad + subprocessBad} of ${total} probe(s) did not behave as recorded.`);
      process.exit(1);
    }
    console.log(`✅ All ${total} NI-001 probes behaved as recorded (${PROBES.length} block-level, ${subprocessTotal} resolveDefaultBase subprocess probes).`);
    process.exit(0);
  }

  let baseRef;
  try {
    baseRef = process.argv[2] || resolveDefaultBase();
  } catch (err) {
    console.error(`verification_error: ${err.message}`);
    process.exit(2);
  }
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
}
