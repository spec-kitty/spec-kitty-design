#!/usr/bin/env node
/**
 * Lockstep prerelease bump across the PUBLISHABLE package set (REL2, #363, FR-003/FR-010/FR-011).
 *
 * WHY THE PUBLISHABLE SET AND NOT THE BUILDABLE ONE. `@spec-kitty/react` has no `build` target — it
 * ships generated wrappers as committed source — so it is absent from `release-graph.mjs --projects`.
 * It is still published, and it peer-depends on `@spec-kitty/elements`. Bumping only the three
 * buildable packages would leave react at the old version pointing at a range the new elements no
 * longer satisfies. Lockstep means the set that gets published, not the set that gets compiled.
 *
 * WHY PEER RANGES ARE REWRITTEN. Measured with semver 7.7.4:
 *
 *     semver.satisfies('1.1.0-rc.1', '^1.0.0')       -> false
 *     semver.satisfies('1.1.0-rc.1', '^1.1.0-rc.0')  -> true
 *
 * All four packages peer-depend on each other at `^1.0.0` (styles->tokens, elements->{styles,
 * tokens}, react->elements). A bump that rewrote `version` alone would publish an rc set whose
 * members cannot resolve each other: `npm publish` would report success and every consumer would
 * get unmet peers. That is a successful publish of broken artifacts — the exact
 * green-over-a-broken-result shape this repository keeps finding.
 *
 * The rewritten range is `^<major>.<minor>.<patch>-rc.0`, which admits every later rc in the line
 * AND the eventual final release, so it does not churn on each rc.
 *
 * FAILS CLOSED. An empty set, a divergent starting version, or a post-condition that does not
 * resolve are all refusals, never warnings.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { publishable } from './release-graph.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = '@spec-kitty/';
const PRERELEASE_ID = 'rc';
const RANGE_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'];

/** The range that admits every rc in `next`'s line, and the eventual final. */
export function admittingRange(next, id = PRERELEASE_ID) {
  return `^${semver.major(next)}.${semver.minor(next)}.${semver.patch(next)}-${id}.0`;
}

/**
 * PURE. Decide the bump from a package list; touches no disk. `pkgs` is `release-graph`'s shape:
 * `{ dir, name, version, ... }` plus whatever manifest fields the caller attached.
 *
 * Returns `{ problems, current, next, range, names }`. A non-empty `problems` means refuse.
 */
export function planBump(pkgs, { id = PRERELEASE_ID } = {}) {
  if (!Array.isArray(pkgs) || pkgs.length === 0) {
    return { problems: ['refusing to bump an empty publishable set'], next: null, range: null, names: [] };
  }
  const problems = [];
  const names = pkgs.map((p) => p.name);

  const bad = pkgs.filter((p) => !semver.valid(p.version));
  if (bad.length > 0) {
    problems.push(`not valid semver: ${bad.map((p) => `${p.name}@${p.version}`).join(', ')}`);
    return { problems, next: null, range: null, names };
  }

  const distinct = [...new Set(pkgs.map((p) => p.version))];
  if (distinct.length !== 1) {
    problems.push(
      `publishable versions have diverged, so there is no lockstep to continue: ` +
        pkgs.map((p) => `${p.name}@${p.version}`).join(', '),
    );
    return { problems, next: null, range: null, names };
  }

  const current = distinct[0];
  // Already on a prerelease -> advance it. On a release -> open the next minor's prerelease line.
  const next = semver.prerelease(current)
    ? semver.inc(current, 'prerelease', id)
    : semver.inc(current, 'preminor', id);
  if (!next) {
    problems.push(`could not compute a prerelease after ${current}`);
    return { problems, current, next: null, range: null, names };
  }
  return { problems, current, next, range: admittingRange(next, id), names };
}

/**
 * PURE. Rewrite one manifest object for the bump. Returns `{ manifest, rewrites }` where
 * `rewrites` names every intra-scope range that changed — printed, so the effect is visible
 * rather than implied.
 */
export function rewriteManifest(manifest, next, range) {
  const out = { ...manifest, version: next };
  const rewrites = [];
  for (const field of RANGE_FIELDS) {
    if (!out[field]) continue;
    const updated = { ...out[field] };
    for (const [dep, spec] of Object.entries(updated)) {
      if (!dep.startsWith(SCOPE)) continue;
      if (spec === range) continue;
      rewrites.push(`${manifest.name}: ${field}.${dep} ${spec} -> ${range}`);
      updated[dep] = range;
    }
    out[field] = updated;
  }
  return { manifest: out, rewrites };
}

/**
 * PURE. The post-condition: after the bump, every intra-scope range must actually be satisfied by
 * the new version. Computed with semver — never by re-reading the strings we just wrote, which
 * would assert our own output against itself.
 */
export function unresolvedRanges(manifests, next) {
  const problems = [];
  for (const m of manifests) {
    for (const field of RANGE_FIELDS) {
      for (const [dep, spec] of Object.entries(m[field] ?? {})) {
        if (!dep.startsWith(SCOPE)) continue;
        if (!semver.satisfies(next, spec)) {
          problems.push(`${m.name}: ${field}.${dep} range "${spec}" is not satisfied by ${next}`);
        }
      }
    }
  }
  return problems;
}

function manifestPath(dir) {
  return join(ROOT, 'packages', dir, 'package.json');
}

function readManifest(dir) {
  return JSON.parse(readFileSync(manifestPath(dir), 'utf8'));
}

function refuse(problems) {
  console.error('\n❌ refusing to bump:');
  for (const p of problems) console.error(`   - ${p}`);
  process.exit(1);
}

function main({ dryRun }) {
  const pkgs = publishable(join(ROOT, 'packages'));
  const withManifests = pkgs.map((p) => ({ ...p, manifest: readManifest(p.dir) }));

  const plan = planBump(withManifests);
  if (plan.problems.length > 0) refuse(plan.problems);

  const rewrittenAll = [];
  const results = withManifests.map((p) => {
    const { manifest, rewrites } = rewriteManifest(p.manifest, plan.next, plan.range);
    rewrittenAll.push(...rewrites);
    return { ...p, manifest };
  });

  const unresolved = unresolvedRanges(results.map((r) => r.manifest), plan.next);
  if (unresolved.length > 0) refuse(unresolved);

  console.log(`bumping ${plan.names.length} publishable package(s): ${plan.current} -> ${plan.next}`);
  for (const r of rewrittenAll) console.log(`  ${r}`);
  if (rewrittenAll.length === 0) console.log('  (no intra-scope ranges needed rewriting)');

  if (dryRun) {
    console.log('\n(--dry-run: nothing written)');
    return;
  }

  for (const r of results) {
    writeFileSync(manifestPath(r.dir), `${JSON.stringify(r.manifest, null, 2)}\n`);
  }
  // ONCE, and only after every manifest is on disk. This is an npm workspace with a single root
  // lockfile; regenerating per package would resolve against manifests that are still half-bumped.
  execFileSync('npm', ['install', '--package-lock-only'], { cwd: ROOT, stdio: 'inherit' });
  console.log(`\n✅ ${plan.names.length} package(s) at ${plan.next}; lockfile regenerated.`);
}

// ── --selftest ────────────────────────────────────────────────────────────────────────────────
// Probes drive the PURE functions with fixtures and assert computed outcomes. Floor lives outside
// the table.
if (process.argv.includes('--selftest')) {
  const pkg = (name, version, peers) => ({
    name,
    version,
    dir: name.replace(SCOPE, ''),
    ...(peers ? { peerDependencies: peers } : {}),
  });

  const PROBES = [
    [
      'a release line opens the next minor prerelease',
      () => planBump([pkg('a', '1.0.0'), pkg('b', '1.0.0')]).next === '1.1.0-rc.0',
    ],
    [
      'an existing prerelease advances rather than reopening',
      () => planBump([pkg('a', '1.1.0-rc.0'), pkg('b', '1.1.0-rc.0')]).next === '1.1.0-rc.1',
    ],
    [
      'THE REFUSAL THIS EXISTS FOR: divergent versions have no lockstep to continue',
      () => planBump([pkg('a', '1.0.0'), pkg('b', '1.0.1')]).problems.length > 0,
    ],
    ['an empty set is refused', () => planBump([]).problems.length > 0],
    ['a non-semver version is refused', () => planBump([pkg('a', 'not-a-version')]).problems.length > 0],
    [
      'the admitting range accepts the bumped version',
      () => semver.satisfies('1.1.0-rc.0', admittingRange('1.1.0-rc.0')),
    ],
    [
      'the admitting range still accepts a LATER rc, so it does not churn',
      () => semver.satisfies('1.1.0-rc.7', admittingRange('1.1.0-rc.0')),
    ],
    [
      'the admitting range accepts the eventual final release',
      () => semver.satisfies('1.1.0', admittingRange('1.1.0-rc.0')),
    ],
    [
      'THE DEFECT THIS PREVENTS: the OLD caret range does NOT accept the prerelease',
      () => semver.satisfies('1.1.0-rc.1', '^1.0.0') === false,
    ],
    [
      'rewriteManifest moves an intra-scope peer onto the admitting range',
      () => {
        const { manifest } = rewriteManifest(
          { name: '@spec-kitty/styles', version: '1.0.0', peerDependencies: { '@spec-kitty/tokens': '^1.0.0' } },
          '1.1.0-rc.0',
          admittingRange('1.1.0-rc.0'),
        );
        return manifest.peerDependencies['@spec-kitty/tokens'] === '^1.1.0-rc.0';
      },
    ],
    [
      'rewriteManifest leaves third-party ranges alone',
      () => {
        const { manifest } = rewriteManifest(
          { name: 'x', version: '1.0.0', peerDependencies: { lit: '^3.0.0' } },
          '1.1.0-rc.0',
          admittingRange('1.1.0-rc.0'),
        );
        return manifest.peerDependencies.lit === '^3.0.0';
      },
    ],
    [
      'the post-condition CATCHES a version-only bump (ranges left at ^1.0.0)',
      () =>
        unresolvedRanges(
          [{ name: '@spec-kitty/styles', peerDependencies: { '@spec-kitty/tokens': '^1.0.0' } }],
          '1.1.0-rc.0',
        ).length > 0,
    ],
    [
      'the post-condition passes once the ranges are rewritten',
      () =>
        unresolvedRanges(
          [{ name: '@spec-kitty/styles', peerDependencies: { '@spec-kitty/tokens': '^1.1.0-rc.0' } }],
          '1.1.0-rc.0',
        ).length === 0,
    ],
  ];

  let bad = 0;
  for (const [note, fn] of PROBES) {
    let ok = false;
    try {
      ok = fn() === true;
    } catch (e) {
      ok = false;
      console.error(`      threw: ${e.message}`);
    }
    if (ok) console.log(`  ✓ ${note}`);
    else {
      console.error(`  ✗ ${note}`);
      bad++;
    }
  }

  const PROBE_FLOOR = 13;
  if (PROBES.length < PROBE_FLOOR) {
    console.error(`\n❌ the probe table has shrunk: ${PROBES.length} against a floor of ${PROBE_FLOOR}.`);
    process.exit(1);
  }
  if (bad > 0) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} bump-prerelease probes behaved as recorded.`);
  process.exit(0);
}

main({ dryRun: process.argv.includes('--dry-run') });
