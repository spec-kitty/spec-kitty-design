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

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { publishable } from './release-graph.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = '@spec-kitty/';
const PRERELEASE_ID = 'rc';
// `devDependencies` is load-bearing, not an afterthought: ALL FIVE workspace consumers
// (apps/storybook, fixtures/{elements-behaviour,vite-consumer,react-consumer,vue-consumer})
// declare `@spec-kitty/*` there and nowhere else. Omitting it made every consumer rewrite a no-op,
// so the bump wrote four bumped packages, left every consumer pinned at a range the new versions
// no longer satisfy, and `npm install --package-lock-only` died with E404 — the whole rc publish
// failing at its last step. Measured by running the real command, which is the only thing that
// shows it: `--selftest` and `--dry-run` both reported success.
const RANGE_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/**
 * PURE. Is this module being RUN, rather than imported?
 *
 * WHY THIS EXISTS, learned the hard way. `main()` used to run at module scope, so merely
 * importing this file to inspect an export EXECUTED A REAL BUMP: four manifests, five workspace
 * consumers and the lockfile rewritten in a live working tree, by an `import` statement. Two
 * review lenses flagged it as a hazard on the previous pass and I left it as a residual; it then
 * did exactly that to me while I was investigating something unrelated.
 *
 * `release-graph.mjs:151` already guards its CLI this way — this copies an in-repo pattern rather
 * than inventing one, and it is a named predicate rather than an inline condition so it can be
 * probed instead of merely believed.
 */
export function isDirectInvocation(argv1, moduleUrl) {
  if (!argv1 || !moduleUrl) return false;
  try {
    return resolve(argv1) === resolve(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

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
 * PURE. Parse `npm dist-tag ls` output for the prerelease tag.
 *
 * `npm view` DOES NOT WORK against GitHub Packages — measured: `npm view <pkg> versions --json`,
 * `... version --json` and `... dist-tags --json` all return **exit 0 with zero bytes**, while
 * `npm dist-tag ls`, the raw packument and the GitHub REST API all return the data. So the version
 * source is `dist-tag ls`, and an EMPTY body is treated as a FAILURE rather than as "no tags":
 * on this registry a successful-looking empty response is exactly what a broken read looks like.
 */
export function parseDistTags(out, id = PRERELEASE_ID) {
  if (typeof out !== 'string' || out.trim() === '') {
    return {
      problem:
        'empty dist-tag listing — this registry returns exit 0 with no body on some queries, so an ' +
        'empty read is a failed read, not an absent tag',
    };
  }
  const m = new RegExp(`^${id}:\\s*(\\S+)\\s*$`, 'm').exec(out);
  return { version: m ? m[1] : null };
}

/**
 * PURE. The next version, given what is COMMITTED and what is already PUBLISHED under the
 * prerelease tag (`null` when nothing is published yet).
 *
 * Takes whichever is higher. Deriving purely from the registry would be wrong when someone has
 * bumped the committed line ahead; deriving purely from the committed version is what made the rc
 * stream republish the same version on every run and die on EPUBLISHCONFLICT.
 */
export function planNext(committed, publishedPrerelease, id = PRERELEASE_ID) {
  const fromCommitted = semver.prerelease(committed)
    ? semver.inc(committed, 'prerelease', id)
    : semver.inc(committed, 'preminor', id);
  if (!publishedPrerelease) return fromCommitted;
  const fromPublished = semver.inc(publishedPrerelease, 'prerelease', id);
  return semver.gt(fromPublished, fromCommitted) ? fromPublished : fromCommitted;
}

/**
 * The published prerelease for one package, or `null` if the package has never been published.
 *
 * FAILS CLOSED on anything else. A registry that cannot be read must REFUSE, never silently fall
 * back to the committed version — that fallback is precisely how the same version gets published
 * twice.
 */
function readPublishedPrerelease(name) {
  let out;
  try {
    out = execFileSync('npm', ['dist-tag', 'ls', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const err = `${e.stdout ?? ''}${e.stderr ?? ''}${e.message ?? ''}`;
    // Never published at all is a legitimate "no prior version" — the first publish must work.
    if (/E404|404 Not Found|is not in this registry|code E404/.test(err)) return null;
    throw new Error(`could not read published versions for ${name}: ${err.trim().split('\n').slice(-3).join(' | ')}`);
  }
  const parsed = parseDistTags(out);
  if (parsed.problem) throw new Error(`${name}: ${parsed.problem}`);
  return parsed.version;
}

/**
 * PURE. Rewrite one manifest object for the bump. Returns `{ manifest, rewrites }` where
 * `rewrites` names every intra-scope range that changed — printed, so the effect is visible
 * rather than implied.
 */
export function rewriteManifest(manifest, next, range, { setVersion = true } = {}) {
  const out = setVersion ? { ...manifest, version: next } : { ...manifest };
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
 * PURE. The post-condition: every intra-scope range must be satisfied by the version the depended-on
 * package ACTUALLY carries after the rewrite.
 *
 * `versions` is a Map of package name -> the version now written for it.
 *
 * It took a Map rather than a single `next` because checking against the INTENDED version validated
 * a variable instead of the files. Measured: with `version: next` removed from `rewriteManifest`,
 * every manifest stayed at 1.0.0 while its peers were rewritten to `^1.1.0-rc.0` — an unresolvable
 * set — and all 13 probes still reported green, because `semver.satisfies(next, spec)` compared the
 * intent to itself. Keying on the written version is what makes this a post-condition rather than a
 * restatement.
 */
export function unresolvedRanges(manifests, versions) {
  const problems = [];
  for (const m of manifests) {
    for (const field of RANGE_FIELDS) {
      for (const [dep, spec] of Object.entries(m[field] ?? {})) {
        if (!dep.startsWith(SCOPE)) continue;
        const actual = versions.get(dep);
        // A scoped dep that is not one of ours to publish is out of scope for this check.
        if (actual === undefined) continue;
        if (!semver.satisfies(actual, spec)) {
          problems.push(`${m.name}: ${field}.${dep} range "${spec}" is not satisfied by ${dep}@${actual}`);
        }
      }
    }
  }
  return problems;
}

function packageManifestPath(dir) {
  return join(ROOT, 'packages', dir, 'package.json');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Every workspace member's manifest path, from the root `workspaces` globs.
 *
 * WHY THIS EXISTS. The bump used to rewrite ranges only under `packages/`, and five workspace
 * consumers outside it pin the scope — `apps/storybook` (3), `fixtures/{elements-behaviour,
 * vite-consumer}` at `^1.0.0`, and `fixtures/{react-consumer,vue-consumer}` at `*`. Once the
 * packages moved to a prerelease, none of those ranges matched (measured: `1.1.0-rc.0` satisfies
 * neither `^1.0.0` NOR `*` — a bare `*` excludes prereleases just as a caret does), the workspace
 * links stopped resolving, npm fell through to the registry and `npm install --package-lock-only`
 * died with E404. The whole bump failed, so the rc stream could never publish anything.
 *
 * Two review lenses reported this as three consumers; it is five. The `*` pair was missed by both.
 */
function workspaceManifestPaths() {
  const root = readJson(join(ROOT, 'package.json'));
  const globs = Array.isArray(root.workspaces) ? root.workspaces : [];
  const out = [];
  for (const glob of globs) {
    const m = /^(.+)\/\*$/.exec(glob);
    if (!m) continue;
    const base = join(ROOT, m[1]);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const p = join(base, entry.name, 'package.json');
      if (existsSync(p)) out.push(p);
    }
  }
  if (out.length === 0) {
    throw new Error('no workspace manifests found — refusing to bump over an empty workspace');
  }
  return out;
}

function refuse(problems) {
  console.error('\n❌ refusing to bump:');
  for (const p of problems) console.error(`   - ${p}`);
  process.exit(1);
}

function main({ dryRun, fromRegistry }) {
  const pkgs = publishable(join(ROOT, 'packages'));
  const withManifests = pkgs.map((p) => ({
    ...p,
    path: packageManifestPath(p.dir),
    manifest: readJson(packageManifestPath(p.dir)),
  }));

  let plan = planBump(withManifests);
  if (plan.problems.length > 0) refuse(plan.problems);

  // `--from-registry`: derive the next version from what is already published, not from the
  // committed manifests. Nothing commits the bump back, so without this every run recomputes the
  // same version and the second publish dies on EPUBLISHCONFLICT — the rc line could never
  // advance past its first release.
  if (fromRegistry) {
    let highest = null;
    try {
      for (const p of withManifests) {
        const v = readPublishedPrerelease(p.manifest.name);
        if (v && (!highest || semver.gt(v, highest))) highest = v;
      }
    } catch (e) {
      refuse([e.message, 'refusing to guess a version from the committed manifests instead']);
    }
    const next = planNext(plan.current, highest, PRERELEASE_ID);
    plan = { ...plan, next, range: admittingRange(next, PRERELEASE_ID) };
    console.log(`registry: highest published ${PRERELEASE_ID} = ${highest ?? '(none published yet)'}`);
  }

  const rewrittenAll = [];

  // 1. The publishable set: new version AND rewritten intra-scope ranges.
  const results = withManifests.map((p) => {
    const { manifest, rewrites } = rewriteManifest(p.manifest, plan.next, plan.range);
    rewrittenAll.push(...rewrites);
    return { path: p.path, manifest };
  });

  // 2. Every OTHER workspace member: ranges only, never a version bump — they are not published.
  //    Skipping these is what made the bump fail outright (see workspaceManifestPaths).
  const publishedPaths = new Set(results.map((r) => r.path));
  for (const wsPath of workspaceManifestPaths()) {
    if (publishedPaths.has(wsPath)) continue;
    const { manifest, rewrites } = rewriteManifest(readJson(wsPath), plan.next, plan.range, {
      setVersion: false,
    });
    if (rewrites.length === 0) continue;
    rewrittenAll.push(...rewrites);
    results.push({ path: wsPath, manifest });
  }

  // Keyed on what each package will ACTUALLY carry, not on what we meant to write.
  const writtenVersions = new Map(
    results.filter((r) => plan.names.includes(r.manifest.name)).map((r) => [r.manifest.name, r.manifest.version]),
  );
  const unresolved = unresolvedRanges(results.map((r) => r.manifest), writtenVersions);
  if (unresolved.length > 0) refuse(unresolved);

  console.log(`bumping ${plan.names.length} publishable package(s): ${plan.current} -> ${plan.next}`);
  for (const r of rewrittenAll) console.log(`  ${r}`);
  if (rewrittenAll.length === 0) console.log('  (no intra-scope ranges needed rewriting)');

  if (dryRun) {
    console.log('\n(--dry-run: nothing written)');
    return;
  }

  for (const r of results) {
    writeFileSync(r.path, `${JSON.stringify(r.manifest, null, 2)}\n`);
  }
  // ONCE, and only after every manifest is on disk. This is an npm workspace with a single root
  // lockfile; regenerating per package would resolve against manifests that are still half-bumped.
  // Captured rather than inherited, so a failure can be REPORTED. With `stdio: 'inherit'` the
  // throw surfaced as a raw Node Error with `stdout: null, stderr: null` — a stack trace that
  // tells an operator nothing about what npm actually objected to.
  try {
    execFileSync('npm', ['install', '--package-lock-only'], { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    const detail = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim();
    refuse([
      'npm install --package-lock-only failed after the manifests were written, so the workspace',
      'is now half-bumped. npm said:',
      ...(detail ? detail.split('\n').slice(-12) : ['(no output captured)']),
    ]);
  }
  console.log(`\n✅ ${plan.names.length} package(s) at ${plan.next}; lockfile regenerated.`);
}

// ── --selftest ────────────────────────────────────────────────────────────────────────────────
// Probes drive the PURE functions with fixtures and assert computed outcomes. Floor lives outside
// the table.
//
// GUARDED THE SAME WAY `main()` IS, and for a worse reason. This block used to test only
// `process.argv`, which is the IMPORTER's argv: any process that imported this module while `--
// selftest` happened to be on its command line ran the probe table instead of its own code, and
// the `process.exit(0)` below then killed it — reporting success for assertions that never ran.
// `main()`'s version of this bug corrupts a tree noisily; this one manufactures a green, which is
// the direction that actually gets believed. Demonstrated by a lens: an importer intending exit 3
// exited 0 with none of its own code executed.
if (isDirectInvocation(process.argv[1], import.meta.url) && process.argv.includes('--selftest')) {
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
      'the post-condition CATCHES a stale range (left at ^1.0.0)',
      () =>
        unresolvedRanges(
          [{ name: '@spec-kitty/styles', peerDependencies: { '@spec-kitty/tokens': '^1.0.0' } }],
          new Map([['@spec-kitty/tokens', '1.1.0-rc.0']]),
        ).length > 0,
    ],
    [
      'the post-condition passes once the ranges are rewritten',
      () =>
        unresolvedRanges(
          [{ name: '@spec-kitty/styles', peerDependencies: { '@spec-kitty/tokens': '^1.1.0-rc.0' } }],
          new Map([['@spec-kitty/tokens', '1.1.0-rc.0']]),
        ).length === 0,
    ],
    [
      'THE MUTANT THIS KEYING EXISTS FOR: ranges rewritten but the DEP never bumped -> caught',
      () =>
        unresolvedRanges(
          [{ name: '@spec-kitty/styles', peerDependencies: { '@spec-kitty/tokens': '^1.1.0-rc.0' } }],
          new Map([['@spec-kitty/tokens', '1.0.0']]),
        ).length > 0,
    ],
    [
      'a scoped dep that is not ours to publish is left alone',
      () =>
        unresolvedRanges(
          [{ name: 'x', devDependencies: { '@spec-kitty/nope': '^9.9.9' } }],
          new Map([['@spec-kitty/tokens', '1.1.0-rc.0']]),
        ).length === 0,
    ],
    [
      'a bare `*` does NOT admit a prerelease — why the fixtures had to be rewritten too',
      () => semver.satisfies('1.1.0-rc.0', '*') === false,
    ],
    [
      'THE HAZARD THIS CLOSES: an import is not a direct invocation, so it cannot bump',
      () => isDirectInvocation('/somewhere/else/other-script.mjs', import.meta.url) === false,
    ],
    [
      'running the file itself IS a direct invocation',
      () => isDirectInvocation(fileURLToPath(import.meta.url), import.meta.url) === true,
    ],
    [
      'isDirectInvocation is defensive about missing argv/url rather than throwing',
      () => isDirectInvocation(undefined, import.meta.url) === false && isDirectInvocation('/x', undefined) === false,
    ],
    [
      'the admitting range pins the .0 floor as the rc advances, so peers do not churn every rc',
      () =>
        admittingRange('1.1.0-rc.7') === '^1.1.0-rc.0' &&
        semver.satisfies('1.1.0-rc.7', admittingRange('1.1.0-rc.7')) &&
        semver.satisfies('1.1.0', admittingRange('1.1.0-rc.7')),
    ],
    [
      'planNext: nothing published yet -> open the next minor prerelease from the committed version',
      () => planNext('1.0.0', null) === '1.1.0-rc.0',
    ],
    [
      'THE BLOCKER THIS CLOSES: an already-published rc advances instead of repeating',
      () => planNext('1.0.0', '1.1.0-rc.0') === '1.1.0-rc.1',
    ],
    [
      'planNext: a committed version moved AHEAD of the registry wins',
      () => planNext('1.2.0', '1.1.0-rc.3') === '1.3.0-rc.0',
    ],
    [
      'parseDistTags finds the rc pointer',
      () => parseDistTags('latest: 2.0.0\nrc: 1.1.0-rc.4\n').version === '1.1.0-rc.4',
    ],
    [
      'parseDistTags: a package with tags but no rc yet is null, not an error',
      () => {
        const r = parseDistTags('latest: 2.0.0\n');
        return r.version === null && r.problem === undefined;
      },
    ],
    [
      'THE REGISTRY TRAP: an EMPTY read is a failure, never "no tags" (npm view returns exit 0 + 0 bytes on GHP)',
      () => typeof parseDistTags('').problem === 'string' && typeof parseDistTags('   ').problem === 'string',
    ],
    [
      'rewriteManifest with setVersion:false rewrites ranges but leaves version alone',
      () => {
        const { manifest } = rewriteManifest(
          { name: 'apps/storybook', version: '0.0.0', devDependencies: { '@spec-kitty/tokens': '*' } },
          '1.1.0-rc.0',
          admittingRange('1.1.0-rc.0'),
          { setVersion: false },
        );
        return manifest.version === '0.0.0' && manifest.devDependencies['@spec-kitty/tokens'] === '^1.1.0-rc.0';
      },
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

  // 17, counted from the table rather than from a diagnostic. I set this to 18 believing I had
  // added five probes to thirteen; one of the five replaced an existing entry rather than adding
  // to it. The floor caught the error instead of me — which is the whole reason it is not derived
  // from PROBES.length.
  // 27, taken from the table's own reported count rather than from arithmetic. Two of the three
  // times I have set this constant tonight the number was wrong, and each time the floor caught
  // it — which is the argument for not deriving it from PROBES.length.
  const PROBE_FLOOR = 27;
  if (PROBES.length < PROBE_FLOOR) {
    console.error(`\n❌ the probe table has shrunk: ${PROBES.length} against a floor of ${PROBE_FLOOR}.`);
    process.exit(1);
  }
  if (bad > 0) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  // NO `process.exit(0)` ON THE SUCCESS PATH — but only because the `main()` guard below now
  // excludes `--selftest` explicitly. Removing this exit WITHOUT that change made control fall
  // straight through into `main()`, and `--selftest` performed a real bump of all four manifests
  // plus the lockfile. Caught immediately, on my own working tree; the two lines are one mechanism
  // and must be read together.
  console.log(`\n✅ All ${PROBES.length} bump-prerelease probes behaved as recorded.`);
}

// GUARDED TWICE. `isDirectInvocation` stops an `import` from running a real bump — see its own
// comment. `!--selftest` stops the probe table above from falling through into one: the selftest
// block no longer exits, so without this conjunct `--selftest` bumps every manifest in the
// repository and regenerates the lockfile. A checking mode must never mutate the thing it checks.
if (isDirectInvocation(process.argv[1], import.meta.url) && !process.argv.includes('--selftest')) {
  main({
    dryRun: process.argv.includes('--dry-run'),
    fromRegistry: process.argv.includes('--from-registry'),
  });
}
