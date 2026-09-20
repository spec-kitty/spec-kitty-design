#!/usr/bin/env node
/**
 * Publish the ATTESTED tarballs to the prod channel (`latest`) — REL3 (#364). release.yml only.
 *
 *   node scripts/publish-latest.mjs            publish every tarball in dist-tarballs/ under `latest`
 *   node scripts/publish-latest.mjs --selftest run the effect probes (spawned child + stub npm)
 *
 * WHY A SCRIPT, NOT THE INLINE LOOP IT REPLACES. The prod publish was a shell `for` loop, and REL3 review
 * defeated every rule written over its text: a second `--tag` (npm takes the last), `FILES+=" x.tgz"`,
 * `read … FILES`, `printf -v file`, a repack inside the step. That is REL2's lesson again — pattern-
 * matching shell does not converge — so the publish is executed code, gated as one exact, unconditional
 * step, and its behaviour is probed by running it.
 *
 * WHY NOT publish-derived-set.mjs. That script refuses `latest` unconditionally, by construction (REL2):
 * the rc payload must have no path to the prod channel. This one publishes ONLY `latest` and runs only
 * from the tag-triggered release.yml: check-release-graph.mjs refuses it anywhere else, and the script
 * itself refuses unless the run is a vX.Y.Z tag push of release.yml.
 *
 * Semantics carried over unchanged from the loop: topological order; an already-published version is a
 * SKIP only on a re-run (GITHUB_RUN_ATTEMPT > 1) and an error on the first attempt; any other failure
 * HALTS, because every later package may depend on the one that failed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishable } from './release-graph.mjs';
import { readPacked, sha512Integrity, PACK_DIR_NAME, MANIFEST } from './pack-derived-set.mjs';
import { isDirectInvocation } from './lib/direct-invocation.mjs';
import { classifyFailure } from './publish-derived-set.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TAG = 'latest';
const KNOWN_ARGV = new Set(['--selftest']);

function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

/**
 * ONLY A VERSION-TAG PUSH OF release.yml MAY PUBLISH `latest` (REL3 review: a branch-triggered job
 * running this script passed every gate). Defence in depth: check-release-graph.mjs is the primary
 * fence (it refuses this script outside release.yml's `release` job, and release.yml's step is an exact,
 * unconditional run, so no prefix can forge these variables there). These are the runner's values.
 */
// Not exported: its only callers are `main()` and the probe table in this file. An export with no
// importer invites one (REL3 pass 4, reducer).
function prodRunProblem(env) {
  if (env.GITHUB_REF_TYPE !== 'tag') return `GITHUB_REF_TYPE is ${JSON.stringify(env.GITHUB_REF_TYPE)}, not "tag"`;
  if (!/^refs\/tags\/v\d+\.\d+\.\d+$/.test(env.GITHUB_REF ?? '')) return `GITHUB_REF ${JSON.stringify(env.GITHUB_REF)} is not a vX.Y.Z tag`;
  if (!String(env.GITHUB_WORKFLOW_REF ?? '').startsWith('spec-kitty/spec-kitty-design/.github/workflows/release.yml@refs/tags/')) {
    return `GITHUB_WORKFLOW_REF ${JSON.stringify(env.GITHUB_WORKFLOW_REF)} is not release.yml on a tag`;
  }
  return null;
}

function main() {
  if (process.env.GITHUB_ACTIONS !== 'true') fail('refusing to publish outside GitHub Actions (GITHUB_ACTIONS is not "true")');
  const why = prodRunProblem(process.env);
  if (why) fail(`refusing to publish \`latest\`: ${why}. Only a version-tag push of release.yml may.`);
  // A MANIFEST MAY NOT CHOOSE THE CHANNEL. A top-level `tag` beats `--tag` (libnpmpublish:
  // `manifest.tag || defaultTag`); `publishConfig.tag` is refused as insurance.
  const overriding = publishable().filter((p) => (typeof p.tag === 'string' && p.tag.trim()) || (typeof p.publishConfig?.tag === 'string' && p.publishConfig.tag.trim()));
  if (overriding.length) fail(`${overriding.map((p) => p.name).join(', ')} declare a dist-tag in package.json; the workflow sets the channel`);
  let packed;
  try {
    packed = readPacked(); // names, versions, order, every file's hash, no stray tarball
  } catch (e) {
    fail(`${e.message} — publishing only the attested tarballs in ${PACK_DIR_NAME}/`);
  }
  const attempt = process.env.GITHUB_RUN_ATTEMPT ?? '1';
  console.log(`publishing ${packed.entries.length} attested tarball(s) under \`${TAG}\`, in topological order`);
  for (const entry of packed.entries) {
    const tarball = join(packed.outDir, entry.file);
    console.log(`\n=== publishing ${entry.name}@${entry.version} from ${PACK_DIR_NAME}/${entry.file} ===`);
    const r = spawnSync('npm', ['publish', tarball, '--tag', TAG], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
    console.log(out);
    if (!r.error && r.status === 0) continue;
    const kind = classifyFailure(out, attempt);
    if (kind === 'resumption') {
      console.log(`::warning::${entry.name}@${entry.version} is already published — skipping (run attempt ${attempt})`);
      continue;
    }
    if (kind === 'unexpected-conflict') {
      console.error(`::error::${entry.name}@${entry.version} already exists on the FIRST attempt — this run did not put it there. Verify ownership before re-running.`);
    }
    console.error(`::error::halting — every package after ${entry.name} in the derived set may depend on it.`);
    console.error('Packages published before the failure remain; fix the cause and re-run this tag — the retry skips them.');
    process.exit(1);
  }
  console.log(`\n✅ published ${packed.entries.length} attested tarball(s) under \`${TAG}\`.`);
}

/* ────────────────────────────── --selftest ────────────────────────────── */

/**
 * A FIXTURE REPO IN A TEMP DIRECTORY, not the real one (REL3 pass 5, architect). These probes run the
 * CLI with a complete forged prod environment, so the only thing between them and a real publish was
 * a stubbed `npm` on PATH; they also wrote `dist-tarballs/` into the working tree and rewrote a
 * tracked `package.json`, which a crash between the write and the restore would have left behind. The
 * fixture root carries its own copy of this script and its imports, so `ROOT` resolves there, and its
 * own packages — nothing tracked is touched, and there is no `.npmrc` pointing at a real registry.
 */
function withFixtureRepo(fn) {
  const root = mkdtempSync(join(tmpdir(), 'pub-latest-repo-'));
  try {
    mkdirSync(join(root, 'scripts', 'lib'), { recursive: true });
    const here = dirname(fileURLToPath(import.meta.url));
    for (const f of ['publish-latest.mjs', 'publish-derived-set.mjs', 'pack-derived-set.mjs', 'release-graph.mjs', 'lib/direct-invocation.mjs']) {
      writeFileSync(join(root, 'scripts', f), readFileSync(join(here, f)));
    }
    // styles depends on tokens, so the derived set has a real topological order to preserve.
    for (const [dir, name, deps] of [
      ['tokens', '@spec-kitty/tokens', {}],
      ['styles', '@spec-kitty/styles', { '@spec-kitty/tokens': '1.0.0' }],
    ]) {
      mkdirSync(join(root, 'packages', dir), { recursive: true });
      writeFileSync(join(root, 'packages', dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', dependencies: deps }, null, 2));
    }
    const out = join(root, PACK_DIR_NAME);
    mkdirSync(out);
    const entries = publishable(join(root, 'packages')).map((p) => {
      const file = `${p.name.replace('@', '').replace('/', '-')}-${p.version}.tgz`;
      writeFileSync(join(out, file), `fixture:${p.name}`);
      return { name: p.name, version: p.version, dir: p.dir, file, integrity: sha512Integrity(join(out, file)) };
    });
    writeFileSync(join(out, MANIFEST), JSON.stringify({ schemaVersion: 1, entries }));
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const PROD_ENV = {
  GITHUB_ACTIONS: 'true',
  GITHUB_REF_TYPE: 'tag',
  GITHUB_REF: 'refs/tags/v1.2.3',
  GITHUB_WORKFLOW_REF: 'spec-kitty/spec-kitty-design/.github/workflows/release.yml@refs/tags/v1.2.3',
};

function selftest() {
  let FIX = ROOT; // the fixture repo, for the duration of the probe run
  const dir = mkdtempSync(join(tmpdir(), 'pub-latest-'));
  const log = join(dir, 'npm.log');
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  const stub = (body) => writeFileSync(join(bin, 'npm'), `#!/bin/sh\necho "npm $* cwd=$PWD" >> "${log}"\n${body}\n`, { mode: 0o755 });
  const run = (env = {}, args = []) => {
    writeFileSync(log, '');
    const r = spawnSync(process.execPath, [join(FIX, 'scripts', 'publish-latest.mjs'), ...args], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ...PROD_ENV, GITHUB_RUN_ATTEMPT: '1', ...env },
    });
    const calls = readFileSync(log, 'utf8').trim();
    return { status: r.status, calls: calls === '' ? [] : calls.split('\n'), out: `${r.stdout}${r.stderr}` };
  };
  const want = () => publishable(join(FIX, 'packages')).map((p) => `${PACK_DIR_NAME}/${p.name.replace('@', '').replace('/', '-')}-${p.version}.tgz`);
  const PROBES = [
    ['publishes every attested tarball in topological order (control)', () => { stub('exit 0'); const r = run(); const w = want(); return r.status === 0 && r.calls.length === w.length && r.calls.every((c, i) => c.includes(w[i])); }],
    ['every call carries exactly one `--tag`, and it is `latest`', () => { stub('exit 0'); const r = run(); return r.calls.length > 0 && r.calls.every((c) => (c.match(/--tag/g) ?? []).length === 1 && / --tag latest /.test(`${c} `)); }],
    ['no publish runs with a package directory as its working directory', () => { stub('exit 0'); const r = run(); return r.calls.length > 0 && r.calls.every((c) => !/cwd=\S*\/packages(\/|$)/.test(c)); }],
    ['a failing publish halts the set (tokens first, one call, non-zero)', () => { stub('case "$*" in *spec-kitty-tokens-*) exit 1;; esac\nexit 0'); const r = run(); return r.status !== 0 && r.calls.length === 1; }],
    ['a conflict on the FIRST attempt is an error, not a skip', () => { stub('echo "npm error code EPUBLISHCONFLICT" >&2\nexit 1'); const r = run({ GITHUB_RUN_ATTEMPT: '1' }); return r.status !== 0 && r.calls.length === 1; }],
    ['a conflict on a RE-RUN is a skip, and the set completes', () => { stub('echo "npm error code EPUBLISHCONFLICT" >&2\nexit 1'); const r = run({ GITHUB_RUN_ATTEMPT: '2' }); return r.status === 0 && r.calls.length === want().length; }],
    ['a tarball changed after attestation is refused before any npm call', () => { stub('exit 0'); const f = join(FIX, PACK_DIR_NAME, want()[0].split('/')[1]); const orig = readFileSync(f); try { writeFileSync(f, 'swapped'); const r = run(); return r.status !== 0 && r.calls.length === 0; } finally { writeFileSync(f, orig); } }],
    ['an unattested extra tarball is refused before any npm call', () => { stub('exit 0'); const x = join(FIX, PACK_DIR_NAME, 'smuggled-1.0.0.tgz'); try { writeFileSync(x, 'x'); const r = run(); return r.status !== 0 && r.calls.length === 0; } finally { rmSync(x, { force: true }); } }],
    ['a manifest `publishConfig.tag` is refused before any npm call', () => { stub('exit 0'); const f = join(FIX, 'packages/tokens/package.json'); const o = readFileSync(f, 'utf8'); const j = JSON.parse(o); if (j.publishConfig?.tag !== undefined) return false; try { writeFileSync(f, `${JSON.stringify({ ...j, publishConfig: { ...(j.publishConfig ?? {}), tag: 'next' } }, null, 2)}\n`); const r = run(); return r.status !== 0 && r.calls.length === 0; } finally { writeFileSync(f, o); } }],
    ['refuses a BRANCH-triggered run (the develop rc stream, a nightly)', () => { stub('exit 0'); const r = run({ GITHUB_REF_TYPE: 'branch' }); return r.status !== 0 && r.calls.length === 0; }],
    ['refuses a tag that is not vX.Y.Z', () => { stub('exit 0'); const r = run({ GITHUB_REF: 'refs/tags/parity-anchor/rel2' }); return r.status !== 0 && r.calls.length === 0; }],
    ['refuses a tag push of any workflow other than release.yml', () => { stub('exit 0'); const r = run({ GITHUB_WORKFLOW_REF: 'spec-kitty/spec-kitty-design/.github/workflows/nightly.yml@refs/tags/v1.2.3' }); return r.status !== 0 && r.calls.length === 0; }],
    ['a manifest top-level `tag` is refused before any npm call', () => { stub('exit 0'); const f = join(FIX, 'packages/tokens/package.json'); const o = readFileSync(f, 'utf8'); const j = JSON.parse(o); if (j.tag !== undefined) return false; try { writeFileSync(f, `${JSON.stringify({ ...j, tag: 'next' }, null, 2)}\n`); const r = run(); return r.status !== 0 && r.calls.length === 0; } finally { writeFileSync(f, o); } }],
    ['refuses to publish outside GitHub Actions', () => { stub('exit 0'); const r = run({ GITHUB_ACTIONS: '' }); return r.status !== 0 && r.calls.length === 0; }],
    ['an unknown argument exits 2 before any npm call', () => { stub('exit 0'); const r = run({}, ['--nope']); return r.status === 2 && r.calls.length === 0; }],
    ['importing the module publishes nothing', () => { stub('exit 0'); writeFileSync(log, ''); const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(import.meta.url)})`], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_ACTIONS: 'true' } }); return r.status === 0 && readFileSync(log, 'utf8').trim() === ''; }],
  ];
  const FLOOR = 16;
  let bad = 0;
  try {
    withFixtureRepo((fixtureRoot) => {
      FIX = fixtureRoot;
      for (const [what, fn] of PROBES) {
        let ok = false;
        try {
          ok = fn() === true;
        } catch (e) {
          console.error(`  probe threw: ${what} — ${e.message}`);
        }
        console.log(`${ok ? '✅' : '❌'} ${what}`);
        if (!ok) bad++;
      }
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  if (PROBES.length < FLOOR) {
    console.error(`\n❌ only ${PROBES.length} probes — the floor is ${FLOOR}`);
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} prod-publish effect probes behaved as recorded.`);
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  const stray = process.argv.slice(2).filter((a) => !KNOWN_ARGV.has(a));
  if (stray.length) {
    console.error(`::error::unrecognised argument(s): ${stray.join(' ')}. Known: ${[...KNOWN_ARGV].join(' ')}`);
    process.exit(2);
  }
  if (process.argv.includes('--selftest')) selftest();
  else main();
}
