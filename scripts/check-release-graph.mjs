#!/usr/bin/env node
/**
 * The release path, exercised on a pull request (#80, FR-003, FR-004).
 *
 * WHY THIS EXISTS. `.github/workflows/release.yml` triggers on `push: tags: ['v*.*.*']` and
 * nothing else, so no pull request has ever run it. That is not a hypothetical gap — the
 * `cp packages/html-js/src/nav-pill/sk-nav-pill.js` step #73 deleted would have hard-failed the
 * next release, and it was found by a lens READING the file. Three hand-written package lists
 * drifted apart in the same file for the same reason. This script is the thing that runs.
 *
 * IT ASSERTS TARBALLS, NEVER EXIT CODES, and that is the whole design. Measured:
 *
 *     $ cd packages/elements && npm publish --dry-run; echo $?
 *     npm warn publish Skipping workspace @spec-kitty/elements, marked as private
 *     0
 *
 * So #80's revised exit criterion — "npm publish --dry-run passes for every package in the new
 * graph" — was ALREADY satisfied, by two packages that published nothing. A gate reading exit
 * codes here is green over an empty set. Every check below reads packed contents instead.
 *
 * THE CHECKS ARE PURE FUNCTIONS over a {packages, tarballs} model, so `--selftest` can feed them
 * synthetic failures. A gate observed green on a healthy tree has demonstrated nothing about what
 * it can see; the probes are the evidence, the way build-react-wrappers.mjs --selftest is.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { publishable, buildable, all } from './release-graph.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW = '.github/workflows/release.yml';

/**
 * Packages deliberately kept unpublishable. EMPTY, and that is the point: a package acquiring
 * `private: true` must acquire an entry here in the same commit, so the exclusion is a decision
 * someone wrote down rather than a flag someone set. Re-adding `private: true` to elements or
 * react without touching this list reds the gate — SC-005.
 */
const EXPECTED_PRIVATE = [];

/** Things that must never reach a consumer's node_modules (ADR-5 contents audit). */
const FORBIDDEN = [
  { re: /\.map$/, why: 'sourcemap' },
  { re: /\.(test|spec)\.[cm]?[jt]sx?$/, why: 'test file' },
  { re: /(^|\/)tsconfig[^/]*\.json$/, why: 'build config' },
  { re: /\.tsbuildinfo$/, why: 'incremental build state' },
  { re: /(^|\/)\.(env|npmrc|eslintrc)/, why: 'dev dotfile' },
];

/* ─────────────────────────── the checks, as pure functions ─────────────────────────── */

/** SC-001 — nothing is silently excluded from the release. */
export function checkNothingSilentlyPrivate(packages, expectedPrivate) {
  const problems = [];
  const unexpected = packages.filter((p) => p.private && !expectedPrivate.includes(p.name));
  for (const p of unexpected) {
    problems.push(
      `${p.name} is marked "private": true and is not in EXPECTED_PRIVATE, so the release would ` +
        `skip it WITHOUT FAILING (npm publish exits 0 on a private package). Either publish it or ` +
        `record why it is excluded.`,
    );
  }
  const stale = expectedPrivate.filter((n) => !packages.some((p) => p.name === n && p.private));
  for (const n of stale) {
    problems.push(`EXPECTED_PRIVATE lists ${n}, which is not private (or does not exist) — stale entry.`);
  }
  return problems;
}

/** SC-001 — every publishable package actually produces a tarball with files in it. */
export function checkTarballsNonEmpty(tarballs) {
  const problems = [];
  if (tarballs.length === 0) {
    problems.push('no tarballs were produced at all — refusing to report green over an empty set');
    return problems;
  }
  for (const t of tarballs) {
    if (!t.files || t.files.length === 0) {
      problems.push(`${t.name} packed ZERO files — a published empty package is worse than none`);
    }
  }
  return problems;
}

/**
 * SC-002 — every `exports` target resolves to a file inside that package's OWN tarball.
 *
 * `npm pack` does not resolve entry points, so a package can pack cleanly while its `exports` map
 * points at files that were never included. That is a 404 at `import`, discovered by a consumer.
 *
 * WILDCARDS ARE WHERE THIS GETS SUBTLE. `"./dist/*": "./dist/*"` cannot be compared literally to a
 * file list. It is expanded to a prefix/suffix match — and A PATTERN MATCHING ZERO FILES IS A
 * FAILURE, not a pass. That is the empty-set rule one level down, and it is the likeliest place
 * for this gate to certify absence in exactly the shape it exists to prevent.
 */
export function checkExportsResolve(tarballs) {
  const problems = [];
  for (const t of tarballs) {
    const targets = collectExportTargets(t.exports);
    // A package with an `exports` map that yields no targets has a map that says nothing.
    if (t.exports && targets.length === 0) {
      problems.push(`${t.name} has an "exports" map from which no target path could be read`);
    }
    for (const target of targets) {
      const clean = target.replace(/^\.\//, '');
      if (clean.includes('*')) {
        const [pre, post] = clean.split('*');
        const hits = t.files.filter((f) => f.startsWith(pre) && f.endsWith(post ?? ''));
        if (hits.length === 0) {
          problems.push(
            `${t.name}: exports pattern "${target}" matches ZERO files in the tarball — ` +
              `a wildcard over nothing is not a working entry point`,
          );
        }
      } else if (!t.files.includes(clean)) {
        problems.push(`${t.name}: exports target "${target}" is not in the tarball`);
      }
    }
  }
  return problems;
}

/**
 * FR-010 — every component directory is reachable by subpath.
 *
 * checkExportsResolve catches a BROKEN export. It cannot catch a MISSING one: @spec-kitty/styles
 * shipped subpaths for 3 of its 15 component directories and every one of the three resolved, so
 * the map was simultaneously correct and twelve entries short. The same shape as the hand-written
 * barrel in packages/styles/src/index.ts, where #77 found SkGridGap4HTML simply absent.
 *
 * Directory-per-component is this package's layout, so the source tree is the authority for what
 * the map should contain.
 */
export function checkSubpathCoverage(componentDirs, exportKeys, pkgName) {
  const problems = [];
  if (componentDirs.length === 0) {
    return [`${pkgName}: no component directories found — refusing to certify coverage over nothing`];
  }
  for (const dir of componentDirs) {
    if (!exportKeys.some((k) => k === `./${dir}/*` || k === `./${dir}`)) {
      problems.push(`${pkgName}: component "${dir}" has no subpath export — its CSS is unreachable`);
    }
  }
  return problems;
}

/** SC-010 — no sourcemaps, tests, or dev files reach a consumer. */
export function checkForbiddenContents(tarballs) {
  const problems = [];
  for (const t of tarballs) {
    for (const f of t.files) {
      const hit = FORBIDDEN.find((p) => p.re.test(f));
      if (hit) problems.push(`${t.name} ships ${hit.why}: ${f}`);
    }
  }
  return problems;
}

/**
 * SC-004 — release.yml consumes the derived list and contains no hand-written package enumeration.
 *
 * Checking that the derived list is USED is not enough; the failure mode being prevented is a
 * second list living beside it. So this also refuses any `run:` block in the release job that
 * names two or more known packages literally.
 */
export function checkWorkflowUsesDerivedSet(workflowText, packageNames, packageDirs) {
  const problems = [];
  const wf = parse(workflowText);
  const steps = wf?.jobs?.release?.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    return ['release.yml has no release job steps to check'];
  }
  const runs = steps.map((s) => ({ name: s.name ?? '(unnamed)', run: typeof s.run === 'string' ? s.run : '' }));
  const joined = runs.map((r) => r.run).join('\n');

  if (!joined.includes('release-graph.mjs')) {
    problems.push('release.yml never invokes scripts/release-graph.mjs — the derived set is not used');
  }
  for (const key of ['outputs.projects', 'outputs.dirs']) {
    if (!joined.includes(key)) {
      problems.push(`release.yml does not consume steps.graph.${key}`);
    }
  }
  // A hand-written enumeration is two or more package identifiers in one run block.
  //
  // LOOKAROUNDS, not a trailing character class. The first draft used `([\s,"'/]|$)` and the
  // selftest caught it: in `for p in tokens styles; do`, `styles` is followed by `;`, so only one
  // of the two names matched and the `>= 2` test never fired. Enumerating the delimiters that may
  // follow a package name in shell is a losing game — `;` `)` `&` `|` `"` all qualify. Negate the
  // characters that may NOT, instead.
  //
  // The lookbehind also stops `@spec-kitty/tokens` from being counted twice, once for the full
  // name and once for the bare `tokens` inside it: that `tokens` is preceded by `/`.
  const ids = [...packageNames, ...packageDirs];
  for (const r of runs) {
    if (r.run.includes('release-graph.mjs')) continue; // the deriving step names nothing
    // Shell comments are prose; a package named in one is documentation, not a second list.
    const code = r.run.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    const named = [...new Set(ids.filter((id) => new RegExp(`(?<![\\w@/-])${escapeRe(id)}(?![\\w/-])`).test(code)))];
    if (named.length >= 2) {
      problems.push(
        `release.yml step "${r.name}" names ${named.length} packages literally (${named.join(', ')}) — ` +
          `that is a second list beside the derived one, which is how the three lists drifted apart`,
      );
    }
  }
  return problems;
}

/** NFR-001 — the derived accessors refuse an empty set rather than returning one. */
export function checkGraphFailsClosed(accessors) {
  const problems = [];
  for (const [name, fn] of Object.entries(accessors)) {
    let threw = false;
    try {
      const v = fn();
      if (Array.isArray(v) && v.length === 0) {
        problems.push(`release-graph.${name}() returned an EMPTY array instead of throwing`);
      }
    } catch {
      threw = true;
    }
    if (threw) continue;
  }
  return problems;
}

/* ─────────────────────────────────── helpers ─────────────────────────────────── */

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Every string leaf of an `exports` map, whatever its condition nesting. */
export function collectExportTargets(exp) {
  const out = [];
  const walk = (node) => {
    if (typeof node === 'string') out.push(node);
    else if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(exp);
  return out;
}

/** `npm pack --dry-run --json` for one package — file list without writing a tarball, no registry. */
function packOne(pkg) {
  const dir = join(ROOT, 'packages', pkg.dir);
  const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const parsed = JSON.parse(raw);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  return {
    name: pkg.name,
    dir: pkg.dir,
    files: (entry.files ?? []).map((f) => f.path),
    size: entry.size,
    unpackedSize: entry.unpackedSize,
    exports: manifest.exports,
  };
}

/* ─────────────────────────────────── selftest ─────────────────────────────────── */

const PROBES = [
  {
    what: 'a package marked private with no EXPECTED_PRIVATE entry',
    run: () => checkNothingSilentlyPrivate([{ name: '@x/a', private: true }], []),
  },
  {
    what: 'an EXPECTED_PRIVATE entry for a package that is not private',
    run: () => checkNothingSilentlyPrivate([{ name: '@x/a', private: false }], ['@x/a']),
  },
  {
    what: 'no tarballs at all',
    run: () => checkTarballsNonEmpty([]),
  },
  {
    what: 'a tarball with zero files',
    run: () => checkTarballsNonEmpty([{ name: '@x/a', files: [] }]),
  },
  {
    what: 'an exports target absent from the tarball',
    run: () => checkExportsResolve([{ name: '@x/a', files: ['dist/index.js'], exports: { '.': './dist/missing.js' } }]),
  },
  {
    what: 'an exports WILDCARD matching zero files',
    run: () => checkExportsResolve([{ name: '@x/a', files: ['dist/index.js'], exports: { './css/*': './css/*' } }]),
  },
  {
    what: 'an exports target hidden inside a conditions object',
    run: () => checkExportsResolve([{ name: '@x/a', files: ['dist/index.js'], exports: { '.': { types: './dist/nope.d.ts', default: './dist/index.js' } } }]),
  },
  {
    what: 'a component directory with no subpath export',
    run: () => checkSubpathCoverage(['button', 'card'], ['.', './button/*'], '@x/styles'),
  },
  {
    what: 'subpath coverage asserted over zero component directories',
    run: () => checkSubpathCoverage([], ['.'], '@x/styles'),
  },
  {
    what: 'a sourcemap in the tarball',
    run: () => checkForbiddenContents([{ name: '@x/a', files: ['dist/index.js', 'dist/index.js.map'] }]),
  },
  {
    what: 'a test file in the tarball',
    run: () => checkForbiddenContents([{ name: '@x/a', files: ['src/thing.test.ts'] }]),
  },
  {
    what: 'a workflow that never calls release-graph.mjs',
    run: () => checkWorkflowUsesDerivedSet('jobs:\n  release:\n    steps:\n      - run: npm publish\n', ['@x/a'], ['a']),
  },
  {
    what: 'a workflow with a hand-written package enumeration beside the derived set',
    run: () =>
      checkWorkflowUsesDerivedSet(
        'jobs:\n  release:\n    steps:\n      - run: node scripts/release-graph.mjs --dirs\n' +
          '      - run: echo "${{ steps.graph.outputs.projects }} ${{ steps.graph.outputs.dirs }}"\n' +
          '      - run: for p in tokens styles; do echo $p; done\n',
        ['@spec-kitty/tokens', '@spec-kitty/styles'],
        ['tokens', 'styles'],
      ),
  },
  {
    what: 'a graph accessor that returns an empty array instead of throwing',
    run: () => checkGraphFailsClosed({ publishable: () => [] }),
  },
];

function selftest() {
  let failed = 0;
  for (const probe of PROBES) {
    const problems = probe.run();
    if (problems.length === 0) {
      console.log(`❌ probe did NOT trip: ${probe.what}`);
      failed++;
    } else {
      console.log(`✅ ${probe.what} — rejected (${problems.length})`);
    }
  }
  if (failed) {
    console.error(`\n❌ ${failed} of ${PROBES.length} probes failed to trip. The gate cannot see what it claims to.`);
    process.exit(1);
  }
  // The floor is asserted, not implied: a probe list that silently emptied would print nothing
  // and exit 0, which is the defect this script is about.
  if (PROBES.length < 14) {
    console.error(`❌ only ${PROBES.length} probes — the selftest floor is 14`);
    process.exit(1);
  }
  console.log(`\n✅ all ${PROBES.length} probes tripped the gate.`);
}

/* ──────────────────────────────────── main ──────────────────────────────────── */

function main() {
  const pkgs = all();
  const pub = publishable();
  const build = buildable();

  console.log(`packages:    ${pkgs.map((p) => p.dir).join(', ')}`);
  console.log(`publishable: ${pub.map((p) => p.name).join(', ')}`);
  console.log(`buildable:   ${build.map((p) => p.project).join(', ')}`);

  const tarballs = pub.map(packOne);
  for (const t of tarballs) {
    console.log(`  ${t.name}: ${t.files.length} files, ${(t.size / 1024).toFixed(1)} KB packed`);
  }

  const problems = [
    ...checkNothingSilentlyPrivate(pkgs, EXPECTED_PRIVATE),
    ...checkTarballsNonEmpty(tarballs),
    ...checkExportsResolve(tarballs),
    ...checkForbiddenContents(tarballs),
    ...checkSubpathCoverage(
      readdirSync(join(ROOT, 'packages/styles/src'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort(),
      Object.keys(JSON.parse(readFileSync(join(ROOT, 'packages/styles/package.json'), 'utf8')).exports ?? {}),
      '@spec-kitty/styles',
    ),
    ...checkWorkflowUsesDerivedSet(readFileSync(join(ROOT, WORKFLOW), 'utf8'), pkgs.map((p) => p.name), pkgs.map((p) => p.dir)),
    ...checkGraphFailsClosed({ publishable, buildable }),
  ];

  if (problems.length) {
    console.error(`\n❌ ${problems.length} release-graph problem(s):\n`);
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log(`\n✅ release graph is coherent: ${pub.length} publishable packages, all packing, all exports resolving.`);
}

if (process.argv.includes('--selftest')) selftest();
else main();
