#!/usr/bin/env node
/**
 * Pack the derived publish set into tarball FILES — the bytes that get attested and published. REL3 (#364).
 *
 *   node scripts/pack-derived-set.mjs            pack every publishable package into dist-tarballs/
 *   node scripts/pack-derived-set.mjs --list     validate dist-tarballs/ and print one tarball path per
 *                                                line, in topological order (the prod loop's input)
 *                                                — ABSOLUTE paths: npm reads a relative `dist-tarballs/x.tgz`
 *                                                as a GitHub `owner/repo` shorthand and fails with a git error
 *   node scripts/pack-derived-set.mjs --selftest run the probe table
 *
 * WHY FILES. Both publish paths used to run `npm publish` inside the package directory, so npm packed
 * in memory and no tarball ever existed to attest. An attestation over a SEPARATELY packed tarball
 * would certify bytes nobody published. So packing is its own step: this script writes the tarballs,
 * `actions/attest-build-provenance` attests exactly those files, and both publish paths publish exactly
 * those files. `verify-published-integrity.mjs` then proves the registry holds the same bytes.
 *
 * THE DIRECTORY IS FIXED, NOT CONFIGURABLE. The attest step's `subject-path` names `dist-tarballs/*.tgz`
 * literally, and the publish paths read from the same place. An override (an env var, a flag) would let
 * a publish read tarballs from somewhere the attestation never looked. `readPacked()` also refuses any
 * `.tgz` in the directory that `packed.json` does not list, so the attested glob and the published set
 * cannot differ.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishable } from './release-graph.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PACK_DIR_NAME = 'dist-tarballs';
export const MANIFEST = 'packed.json';
const KNOWN_ARGV = new Set(['--list', '--selftest']);

/** npm's integrity string for a file: `sha512-` + base64 of its SHA-512. Computed here, never trusted from npm. */
export function sha512Integrity(file) {
  return `sha512-${createHash('sha512').update(readFileSync(file)).digest('base64')}`;
}

/** Run `npm pack --json` in a directory and return its single parsed record. Throws on anything else. */
function npmPack(cwd, destination) {
  const r = spawnSync('npm', ['pack', '--json', '--pack-destination', destination], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`npm pack in ${cwd} exited ${r.status}:\n${r.stderr}`);
  let parsed;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    throw new Error(`npm pack in ${cwd} did not print JSON:\n${r.stdout.slice(0, 400)}`);
  }
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error(`npm pack in ${cwd} reported ${Array.isArray(parsed) ? parsed.length : 'no'} tarballs, expected exactly 1`);
  }
  return parsed[0];
}

/**
 * Pack the derived set. PURE over `root` apart from the npm call, which is injectable so the probes
 * can drive it without a registry or a real pack.
 */
export function packSet({ root = ROOT, pack = npmPack } = {}) {
  // publishable() takes the packages/ directory, not the repo root.
  const set = publishable(join(root, 'packages')); // throws on an empty set
  const outDir = join(root, PACK_DIR_NAME);
  // A PRE-EXISTING DIRECTORY IS REFUSED, NOT REUSED. A stale tarball left in it would match the attest
  // glob and be attested alongside the real set; a stale packed.json would name the wrong bytes.
  if (existsSync(outDir) && readdirSync(outDir).length > 0) {
    throw new Error(`${PACK_DIR_NAME}/ already exists and is not empty — refusing to mix a new pack with old tarballs`);
  }
  mkdirSync(outDir, { recursive: true });
  const entries = [];
  for (const p of set) {
    const rec = pack(join(root, 'packages', p.dir), outDir);
    if (rec.name !== p.name) throw new Error(`packing packages/${p.dir} produced ${rec.name}, expected ${p.name}`);
    if (rec.version !== p.version) {
      throw new Error(`packing ${p.name} produced version ${rec.version}, but its package.json says ${p.version}`);
    }
    const file = join(outDir, rec.filename);
    if (!existsSync(file)) throw new Error(`npm pack reported ${rec.filename} but no such file is in ${PACK_DIR_NAME}/`);
    const integrity = sha512Integrity(file);
    if (integrity !== rec.integrity) {
      throw new Error(`${rec.filename}: npm reported ${rec.integrity} but the file on disk is ${integrity}`);
    }
    entries.push({ name: p.name, version: p.version, dir: p.dir, file: rec.filename, integrity });
  }
  writeFileSync(join(outDir, MANIFEST), `${JSON.stringify({ schemaVersion: 1, entries }, null, 2)}\n`);
  return { outDir, entries };
}

/**
 * Read and FULLY re-validate a packed set before anything is published from it:
 *   - the manifest parses and lists at least one entry;
 *   - its names, versions and order equal the derived set right now (so a pack from before the bump,
 *     or from a different tree, is refused);
 *   - every listed file exists and still hashes to its recorded integrity;
 *   - the directory holds no `.tgz` the manifest does not list (the attest glob would have covered it).
 */
export function readPacked({ root = ROOT } = {}) {
  const outDir = join(root, PACK_DIR_NAME);
  const path = join(outDir, MANIFEST);
  if (!existsSync(path)) throw new Error(`${PACK_DIR_NAME}/${MANIFEST} is missing — run scripts/pack-derived-set.mjs first`);
  const m = JSON.parse(readFileSync(path, 'utf8'));
  const entries = m?.entries;
  if (!Array.isArray(entries) || entries.length === 0) throw new Error(`${MANIFEST} lists no tarballs — refusing an empty set`);
  const set = publishable(join(root, 'packages'));
  const want = set.map((p) => `${p.name}@${p.version}`).join(' ');
  const got = entries.map((e) => `${e.name}@${e.version}`).join(' ');
  if (want !== got) throw new Error(`${MANIFEST} does not match the derived set:\n  packed:  ${got}\n  derived: ${want}`);
  for (const e of entries) {
    // A BARE FILE NAME, never a path: `../outside.tgz` would publish a file the attest glob never saw.
    if (typeof e.file !== 'string' || !/^[A-Za-z0-9._-]+\.tgz$/.test(e.file) || e.file.startsWith('.')) {
      throw new Error(`${MANIFEST} lists ${JSON.stringify(e.file)}, which is not a plain tarball name inside ${PACK_DIR_NAME}/`);
    }
    const file = join(outDir, e.file);
    if (!existsSync(file)) throw new Error(`${e.file} is listed in ${MANIFEST} but missing`);
    const now = sha512Integrity(file);
    if (now !== e.integrity) throw new Error(`${e.file} changed after packing: recorded ${e.integrity}, now ${now}`);
  }
  const listed = new Set(entries.map((e) => e.file));
  const stray = readdirSync(outDir).filter((f) => f.endsWith('.tgz') && !listed.has(f));
  if (stray.length) throw new Error(`${PACK_DIR_NAME}/ holds tarballs ${MANIFEST} does not list: ${stray.join(', ')}`);
  return { outDir, entries };
}

import { isDirectInvocation } from './lib/direct-invocation.mjs';
export { isDirectInvocation };

/* ────────────────────────────── --selftest ────────────────────────────── */

/** A throwaway repo root holding the given packages, each with a package.json and a README to pack. */
function fixtureRoot(pkgs) {
  const root = mkdtempSync(join(tmpdir(), 'pack-set-'));
  for (const { dir, name, version = '1.0.0', priv = false } of pkgs) {
    mkdirSync(join(root, 'packages', dir), { recursive: true });
    writeFileSync(join(root, 'packages', dir, 'package.json'), JSON.stringify({ name, version, private: priv }));
    writeFileSync(join(root, 'packages', dir, 'project.json'), JSON.stringify({ name: dir, targets: {} }));
    writeFileSync(join(root, 'packages', dir, 'README.md'), `# ${name}\n`);
  }
  return root;
}

/** A fake `npm pack`: writes deterministic bytes as the tarball and reports their real integrity. */
const fakePack = (mutate = (r) => r) => (cwd, dest) => {
  const pj = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
  const filename = `${pj.name.replace('@', '').replace('/', '-')}-${pj.version}.tgz`;
  writeFileSync(join(dest, filename), `tarball:${pj.name}@${pj.version}`);
  return mutate({ name: pj.name, version: pj.version, filename, integrity: sha512Integrity(join(dest, filename)) });
};

const TWO = [
  { dir: 'tokens', name: '@spec-kitty/tokens' },
  { dir: 'styles', name: '@spec-kitty/styles' },
];

const withRoot = (pkgs, fn) => {
  const root = fixtureRoot(pkgs);
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};
const throws = (fn, re) => {
  try {
    fn();
    return false;
  } catch (e) {
    return re.test(e.message);
  }
};

const PROBES = [
  ['packs every package in the derived set and records each (control)', () => withRoot(TWO, (root) => packSet({ root, pack: fakePack() }).entries.length === 2)],
  ['the recorded integrity is the file\'s own SHA-512', () => withRoot(TWO, (root) => { const { outDir, entries } = packSet({ root, pack: fakePack() }); return entries.every((e) => e.integrity === sha512Integrity(join(outDir, e.file))); })],
  ['an npm-reported integrity that differs from the file is refused', () => withRoot(TWO, (root) => throws(() => packSet({ root, pack: fakePack((r) => ({ ...r, integrity: 'sha512-AAAA' })) }), /on disk is/))],
  ['a tarball npm reports but did not write is refused', () => withRoot(TWO, (root) => throws(() => packSet({ root, pack: (cwd, dest) => ({ ...fakePack()(cwd, dest), filename: 'ghost.tgz' }) }), /no such file/))],
  ['a pack that produces the wrong package name is refused', () => withRoot(TWO, (root) => throws(() => packSet({ root, pack: fakePack((r) => ({ ...r, name: '@x/y' })) }), /expected @spec-kitty/))],
  ['a pack whose version differs from package.json is refused', () => withRoot(TWO, (root) => throws(() => packSet({ root, pack: fakePack((r) => ({ ...r, version: '9.9.9' })) }), /package\.json says/))],
  ['an empty derived set is refused', () => withRoot([{ dir: 'tokens', name: '@spec-kitty/tokens', priv: true }], (root) => throws(() => packSet({ root, pack: fakePack() }), /EMPTY/))],
  ['a non-empty dist-tarballs/ is refused rather than reused', () => withRoot(TWO, (root) => { mkdirSync(join(root, PACK_DIR_NAME)); writeFileSync(join(root, PACK_DIR_NAME, 'old.tgz'), 'x'); return throws(() => packSet({ root, pack: fakePack() }), /not empty/); })],
  ['readPacked accepts what packSet wrote (control)', () => withRoot(TWO, (root) => { packSet({ root, pack: fakePack() }); return readPacked({ root }).entries.length === 2; })],
  ['readPacked refuses a missing manifest', () => withRoot(TWO, (root) => throws(() => readPacked({ root }), /missing/))],
  ['readPacked refuses a tarball changed after packing', () => withRoot(TWO, (root) => { const { outDir, entries } = packSet({ root, pack: fakePack() }); writeFileSync(join(outDir, entries[0].file), 'tampered'); return throws(() => readPacked({ root }), /changed after packing/); })],
  ['readPacked refuses a tarball the manifest does not list (the attest glob would cover it)', () => withRoot(TWO, (root) => { const { outDir } = packSet({ root, pack: fakePack() }); writeFileSync(join(outDir, 'extra.tgz'), 'x'); return throws(() => readPacked({ root }), /does not list/); })],
  ['readPacked refuses a pack from before the version bump', () => withRoot(TWO, (root) => { packSet({ root, pack: fakePack() }); const f = join(root, 'packages/tokens/package.json'); writeFileSync(f, JSON.stringify({ ...JSON.parse(readFileSync(f, 'utf8')), version: '1.1.0-rc.3' })); return throws(() => readPacked({ root }), /does not match the derived set/); })],
  ['readPacked refuses a manifest whose order differs from the topological set', () => withRoot(TWO, (root) => { const { outDir } = packSet({ root, pack: fakePack() }); const p = join(outDir, MANIFEST); const m = JSON.parse(readFileSync(p, 'utf8')); m.entries.reverse(); writeFileSync(p, JSON.stringify(m)); return throws(() => readPacked({ root }), /does not match/); })],
  ['readPacked refuses a manifest entry that points outside dist-tarballs/', () => withRoot(TWO, (root) => { const { outDir } = packSet({ root, pack: fakePack() }); writeFileSync(join(root, 'outside.tgz'), 'x'); const p = join(outDir, MANIFEST); const m = JSON.parse(readFileSync(p, 'utf8')); m.entries[0].file = '../outside.tgz'; m.entries[0].integrity = sha512Integrity(join(root, 'outside.tgz')); writeFileSync(p, JSON.stringify(m)); return throws(() => readPacked({ root }), /not a plain tarball name/); })],
  ['readPacked refuses an empty entry list', () => withRoot(TWO, (root) => { mkdirSync(join(root, PACK_DIR_NAME)); writeFileSync(join(root, PACK_DIR_NAME, MANIFEST), JSON.stringify({ entries: [] })); return throws(() => readPacked({ root }), /no tarballs/); })],
  // SPAWNED, not a Set lookup: the probe must fail if the real argv refusal or the import guard goes.
  ['an unknown argument exits 2 before anything is packed', () => childLeavesNoPack([fileURLToPath(import.meta.url), '--nope'], (r) => r.status === 2)],
  ['importing the module packs nothing', () => childLeavesNoPack(['--input-type=module', '-e', `await import(${JSON.stringify(import.meta.url)})`], (r) => r.status === 0 && `${r.stdout}${r.stderr}`.trim() === '')],
];

/** Run a node child against the real tree and assert it left no dist-tarballs/ behind (cleaning up if it did). */
function childLeavesNoPack(args, ok) {
  const out = join(ROOT, PACK_DIR_NAME);
  if (existsSync(out)) throw new Error(`${PACK_DIR_NAME}/ already exists — this probe needs a clean tree`);
  try {
    const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
    return ok(r) && !existsSync(out);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}
const PROBE_FLOOR = 18;

function selftest() {
  let bad = 0;
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
  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  if (PROBES.length < PROBE_FLOOR) {
    console.error(`\n❌ only ${PROBES.length} probes — the floor is ${PROBE_FLOOR}`);
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} pack probes behaved as recorded.`);
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  const stray = process.argv.slice(2).filter((a) => !KNOWN_ARGV.has(a));
  if (stray.length) {
    console.error(`::error::unrecognised argument(s): ${stray.join(' ')}. Known: ${[...KNOWN_ARGV].join(' ')}`);
    process.exit(2);
  }
  try {
    if (process.argv.includes('--selftest')) selftest();
    else if (process.argv.includes('--list')) {
      const { outDir, entries } = readPacked();
      for (const e of entries) console.log(join(outDir, e.file));
    } else {
      const { entries } = packSet();
      for (const e of entries) console.log(`packed ${e.name}@${e.version} → ${PACK_DIR_NAME}/${e.file} ${e.integrity}`);
      console.log(`✅ packed ${entries.length} tarball(s) into ${PACK_DIR_NAME}/ for attestation and publish.`);
    }
  } catch (e) {
    console.error(`::error::${e.message}`);
    process.exit(1);
  }
}
