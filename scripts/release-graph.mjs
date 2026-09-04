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

/** Every package directory, publishable or not. Sorted, so all output is deterministic. */
function scan() {
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
      private: pkg.private === true,
      targets,
    };
  });
}

/** Packages that npm will actually publish: everything not marked private. */
export function publishable() {
  const all = scan();
  const set = all.filter((p) => !p.private);
  if (set.length === 0) {
    throw new Error(
      'the publishable set is EMPTY — every package under packages/ is marked private. ' +
        'Refusing rather than reporting green over nothing.',
    );
  }
  return set;
}

/** Publishable packages that declare a `build` target. A strict subset, never a separate list. */
export function buildable() {
  const set = publishable().filter((p) => p.targets.includes('build'));
  if (set.length === 0) {
    throw new Error(
      'no publishable package declares a `build` target — refusing to emit an empty --projects list',
    );
  }
  return set;
}

/** Everything, including private packages. For gates that need to report on what was excluded. */
export function all() {
  return scan();
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
