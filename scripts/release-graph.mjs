#!/usr/bin/env node
/**
 * THE publishable package set (#80, FR-002). One source, consumed by every step that needs it.
 *
 * WHY DERIVED AND NOT LISTED. release.yml carried THREE hand-written package lists — a build
 * `--projects=tokens,styles,elements`, two `npm publish` steps naming `tokens` and `styles`, and
 * a contents audit looping `for pkg in tokens styles` — and they disagreed. `elements` was built
 * on every release and then dropped; `react` was neither built nor published. Nothing could see
 * that, because release.yml runs only on a `v*.*.*` tag and no PR has ever executed it.
 *
 * A gate that reconciles three hand-written lists has to be kept in step with three hand-written
 * lists. So there is one list now, and it is computed.
 *
 * TWO FACETS, NOT ONE, and the difference is the thing a hand-written list hid. `@spec-kitty/react`
 * is publishable but has NO `build` target: it declares `files: ["src/"]` and ships the generated
 * wrappers as committed source (its nx target is `wrappers`, which regenerates them). Feeding it to
 * `nx run-many --target=build` would fail. So `publishable` and `buildable` are derived separately
 * from the same scan, and `buildable` is `publishable` narrowed to those that declare the target —
 * never a second hand-maintained list.
 *
 * FAILS CLOSED. Every accessor refuses an empty result. `npm publish` on a private package exits 0
 * with only a warning, and `for pkg in $(empty)` succeeds silently, so an empty set is the exact
 * shape in which this whole surface reports green having done nothing.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES = join(ROOT, 'packages');

/**
 * Every package directory, publishable or not. Sorted, so all output is deterministic.
 *
 * `root` is injectable ONLY so the gate can point the real accessors at a fixture tree. Three
 * lenses independently found that the empty-set refusal below was untested: the probe fed a
 * synthetic `() => []` to the checker, so deleting BOTH `throw` blocks here left the selftest
 * printing 14/14 green. A guard whose test does not call it is a comment.
 */
function scan(root = PACKAGES) {
  const PACKAGES = root;
  if (!existsSync(PACKAGES)) throw new Error(`no packages/ directory at ${PACKAGES}`);
  const dirs = readdirSync(PACKAGES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  if (dirs.length === 0) throw new Error('packages/ contains no directories');

  return dirs.map((dir) => {
    const pkgPath = join(PACKAGES, dir, 'package.json');
    if (!existsSync(pkgPath)) throw new Error(`packages/${dir} has no package.json`);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const projPath = join(PACKAGES, dir, 'project.json');
    // A package with no project.json has no nx targets at all, which is a legitimate shape
    // (nothing to build) rather than an error. `targets` is then empty and `buildable` excludes it.
    const targets = existsSync(projPath)
      ? Object.keys(JSON.parse(readFileSync(projPath, 'utf8')).targets ?? {})
      : [];
    const project = existsSync(projPath)
      ? JSON.parse(readFileSync(projPath, 'utf8')).name ?? dir
      : dir;
    return {
      dir,
      project,
      name: pkg.name,
      version: pkg.version,
      // TRUTHINESS, not `=== true`. npm's own test is truthy:
      // libnpmpublish's caller does `if (workspace && manifest.private)`, so `"private": "true"`
      // (a string), `1`, or any truthy value makes npm skip the package with a warning and exit
      // 0. `=== true` classified that as publishable, and the gate certified green while npm
      // published nothing — the mission's founding defect, reopened by one character. A lens
      // demonstrated it live.
      private: Boolean(pkg.private),
      privateRaw: pkg.private,
      targets,
      peerDependencies: pkg.peerDependencies,
      dependencies: pkg.dependencies,
    };
  });
}

/**
 * Order the set so a package is published AFTER everything it depends on.
 *
 * ADR-2's topology is strictly one-directional: tokens <- styles <- elements <- react. A plain
 * `readdirSync().sort()` publishes in the EXACT REVERSE of that — `elements` first, declaring
 * peers on `@spec-kitty/styles` and `@spec-kitty/tokens` that are not on the registry yet, so
 * during the window an install resolves peers that 404. The hand-written list this replaced
 * happened to encode the right order (`tokens,styles,elements`) and deriving it alphabetically
 * threw that away — a lens caught it.
 *
 * Derived from the declared peer/dependency edges rather than hard-coded, so adding a package
 * orders itself. Cycles are impossible in a DAG this shape, but the guard is here rather than
 * assumed: a cycle would otherwise silently truncate the output, which is an empty-set defect
 * wearing a different hat.
 */
function topological(set) {
  const byName = new Map(set.map((p) => [p.name, p]));
  const deps = (p) =>
    Object.keys({ ...(p.peerDependencies ?? {}), ...(p.dependencies ?? {}) }).filter((d) => byName.has(d));
  const out = [];
  const state = new Map(); // name -> 'visiting' | 'done'
  const visit = (p) => {
    const st = state.get(p.name);
    if (st === 'done') return;
    if (st === 'visiting') throw new Error(`dependency cycle in the package graph at ${p.name}`);
    state.set(p.name, 'visiting');
    for (const d of deps(p)) visit(byName.get(d));
    state.set(p.name, 'done');
    out.push(p);
  };
  for (const p of set) visit(p);
  if (out.length !== set.length) {
    throw new Error(`topological sort dropped packages: ${set.length} in, ${out.length} out`);
  }
  return out;
}

/** Packages that npm will actually publish: everything not marked private, in dependency order. */
export function publishable(root) {
  const all = scan(root);
  const set = topological(all.filter((p) => !p.private));
  if (set.length === 0) {
    throw new Error(
      'the publishable set is EMPTY — every package under packages/ is marked private. ' +
        'Refusing rather than reporting green over nothing.',
    );
  }
  return set;
}

/** Publishable packages that declare a `build` target. A strict subset, never a separate list. */
export function buildable(root) {
  const set = publishable(root).filter((p) => p.targets.includes('build'));
  if (set.length === 0) {
    throw new Error(
      'no publishable package declares a `build` target — refusing to emit an empty --projects list',
    );
  }
  return set;
}

/** Everything, including private packages. For gates that need to report on what was excluded. */
export function all(root) {
  return scan(root);
}

// Run-as-CLI detection by resolved path. An `endsWith(basename)` check would also fire when this
// module is imported by any file that happens to share its basename, which is the sort of thing
// that works until it does not.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode === '--projects') {
    // `nx run-many --target=build --projects=<this>`
    process.stdout.write(buildable().map((p) => p.project).join(',') + '\n');
  } else if (mode === '--dirs') {
    // shell loops: `for pkg in $(node scripts/release-graph.mjs --dirs)`
    process.stdout.write(publishable().map((p) => p.dir).join(' ') + '\n');
  } else if (mode === '--json') {
    process.stdout.write(JSON.stringify({ publishable: publishable(), buildable: buildable(), all: all() }, null, 2) + '\n');
  } else {
    process.stderr.write('usage: release-graph.mjs --projects | --dirs | --json\n');
    process.exit(2);
  }
}
