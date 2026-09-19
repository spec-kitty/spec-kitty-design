#!/usr/bin/env node
/**
 * Prove the registry holds exactly the bytes that were attested. REL3 (#364).
 *
 *   node scripts/verify-published-integrity.mjs            check every entry in dist-tarballs/packed.json
 *   node scripts/verify-published-integrity.mjs --selftest run the probe table
 *
 * The attestation certifies the tarball FILES in dist-tarballs/. Publishing those files should put the
 * same bytes on the registry, but "should" is not evidence: a publish that repacked, a registry that
 * rewrote, or a step that published something else would leave a valid attestation over bytes nobody
 * can install. So after publishing, each name@version is DOWNLOADED again — `npm pack <spec> --json`,
 * the path REL4 measured to work against GitHub Packages (`npm view` returns exit 0 with zero bytes
 * there) — and its SHA-512 is recomputed and compared with the attested one.
 *
 * A just-published version can take a moment to become readable, so a download is retried a bounded
 * number of times. A mismatch is never retried: bytes that differ do not converge.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPacked, sha512Integrity, packSet, isDirectInvocation } from './pack-derived-set.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KNOWN_ARGV = new Set(['--selftest']);

/** Download name@version with `npm pack` into `dest`; return the file path. Throws on any failure. */
function npmFetch(spec, dest) {
  const r = spawnSync('npm', ['pack', spec, '--json', '--pack-destination', dest], {
    cwd: ROOT, // the root .npmrc maps @spec-kitty to GitHub Packages
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`npm pack ${spec} exited ${r.status}: ${String(r.stderr).trim().split('\n').pop()}`);
  const rec = JSON.parse(r.stdout)?.[0];
  if (!rec?.filename) throw new Error(`npm pack ${spec} reported no tarball`);
  const file = join(dest, rec.filename);
  if (!existsSync(file)) throw new Error(`npm pack ${spec} reported ${rec.filename} but wrote no such file`);
  return file;
}

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/**
 * Check every packed entry against the registry. `fetch`, `attempts` and `delayMs` are injectable so the
 * probes can drive failure and retry without a registry. Returns the per-entry results; throws on the
 * first entry that cannot be confirmed.
 */
export function verifyPublished({ root = ROOT, fetch = npmFetch, attempts = 6, delayMs = 10_000, log = console.log } = {}) {
  const { entries } = readPacked({ root }); // re-validates the local files and refuses an empty set
  const results = [];
  for (const e of entries) {
    const spec = `${e.name}@${e.version}`;
    let file;
    let lastError;
    for (let i = 1; i <= attempts; i++) {
      const dest = mkdtempSync(join(tmpdir(), 'verify-pub-'));
      try {
        file = fetch(spec, dest);
        const got = sha512Integrity(file);
        if (got !== e.integrity) {
          // NOT retried: different bytes will not become the same bytes.
          throw Object.assign(new Error(`${spec}: the registry serves ${got}, but the attested tarball is ${e.integrity}`), { final: true });
        }
        results.push({ spec, integrity: got, attempt: i });
        log(`✅ ${spec} on the registry matches the attested tarball (${got.slice(0, 22)}…)`);
        lastError = undefined;
        break;
      } catch (err) {
        if (err.final) throw err;
        lastError = err;
        if (i < attempts) {
          log(`  ${spec}: not readable yet (attempt ${i}/${attempts}: ${err.message}) — retrying`);
          sleepSync(delayMs);
        }
      } finally {
        rmSync(dest, { recursive: true, force: true });
      }
    }
    if (lastError) throw new Error(`${spec}: could not read the published tarball after ${attempts} attempts — ${lastError.message}`);
  }
  return results;
}

/* ────────────────────────────── --selftest ────────────────────────────── */

async function fixture() {
  const h = sha512Integrity;
  const root = mkdtempSync(join(tmpdir(), 'verify-set-'));
  for (const [dir, name] of [['tokens', '@spec-kitty/tokens'], ['styles', '@spec-kitty/styles']]) {
    mkdirSync(join(root, 'packages', dir), { recursive: true });
    writeFileSync(join(root, 'packages', dir, 'package.json'), JSON.stringify({ name, version: '1.0.0' }));
  }
  const fakePack = (cwd, dest) => {
    const pj = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
    const filename = `${pj.name.replace('@', '').replace('/', '-')}-${pj.version}.tgz`;
    writeFileSync(join(dest, filename), `bytes:${pj.name}`);
    return { name: pj.name, version: pj.version, filename, integrity: h(join(dest, filename)) };
  };
  packSet({ root, pack: fakePack });
  return root;
}

/** A fake registry: serves the attested bytes, or other bytes, or fails `failFirst` times first. */
const registry = ({ bytes = (spec) => `bytes:${spec.replace(/@1\.0\.0$/, '')}`, failFirst = 0, calls = [] } = {}) => {
  let n = 0;
  return (spec, dest) => {
    calls.push(spec);
    n++;
    if (n <= failFirst) throw new Error('E404 Not Found');
    const f = join(dest, 'got.tgz');
    writeFileSync(f, bytes(spec));
    return f;
  };
};
const quiet = () => {};

async function selftest() {
  const root = await fixture();
  const run = (opts) => {
    try {
      return { ok: true, value: verifyPublished({ root, delayMs: 0, log: quiet, ...opts }) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
  const PROBES = [
    ['every entry matching the attested bytes passes (control)', () => { const r = run({ fetch: registry() }); return r.ok && r.value.length === 2; }],
    ['a registry serving different bytes is refused', () => { const r = run({ fetch: registry({ bytes: () => 'other' }) }); return !r.ok && /attested tarball is/.test(r.error); }],
    ['a mismatch is NOT retried (bytes do not converge)', () => { const calls = []; run({ fetch: registry({ bytes: () => 'other', calls }) }); return calls.length === 1; }],
    ['a version not yet readable is retried, then passes', () => { const r = run({ fetch: registry({ failFirst: 2 }), attempts: 4 }); return r.ok && r.value[0].attempt === 3; }],
    ['a version never readable fails after the bounded attempts', () => { const calls = []; const r = run({ fetch: registry({ failFirst: 99, calls }), attempts: 3 }); return !r.ok && calls.length === 3 && /after 3 attempts/.test(r.error); }],
    ['a missing packed.json is refused before any download', () => { const calls = []; const empty = mkdtempSync(join(tmpdir(), 'verify-empty-')); try { verifyPublished({ root: empty, fetch: registry({ calls }), log: quiet }); return false; } catch (e) { return calls.length === 0 && /missing|no packages/.test(e.message); } finally { rmSync(empty, { recursive: true, force: true }); } }],
    ['every attested entry is checked, not just the first', () => { const calls = []; run({ fetch: registry({ calls }) }); return calls.length === 2; }],
    // SPAWNED, not a Set lookup: these fail if the real argv refusal or the import guard goes.
    ['an unknown argument exits 2', () => spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--nope'], { encoding: 'utf8' }).status === 2],
    ['importing the module verifies nothing', () => { const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(import.meta.url)})`], { encoding: 'utf8' }); return r.status === 0 && `${r.stdout}${r.stderr}`.trim() === ''; }],
  ];
  const PROBE_FLOOR = 9;
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
  rmSync(root, { recursive: true, force: true });
  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  if (PROBES.length < PROBE_FLOOR) {
    console.error(`\n❌ only ${PROBES.length} probes — the floor is ${PROBE_FLOOR}`);
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} verify probes behaved as recorded.`);
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  const stray = process.argv.slice(2).filter((a) => !KNOWN_ARGV.has(a));
  if (stray.length) {
    console.error(`::error::unrecognised argument(s): ${stray.join(' ')}. Known: ${[...KNOWN_ARGV].join(' ')}`);
    process.exit(2);
  }
  if (process.argv.includes('--selftest')) {
    await selftest();
  } else {
    try {
      const results = verifyPublished();
      console.log(`✅ ${results.length} published tarball(s) match the attested bytes.`);
    } catch (e) {
      console.error(`::error::${e.message}`);
      process.exit(1);
    }
  }
}
