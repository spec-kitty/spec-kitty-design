#!/usr/bin/env node
/**
 * Report the dist-tags the registry now serves for every publishable package. REL3 (#364).
 *
 *   node scripts/report-dist-tags.mjs            report, and fail if any read fails
 *   node scripts/report-dist-tags.mjs --selftest run the probe table
 *
 * WHY A SCRIPT. Both release workflows ended with ~30 lines of shell that held NODE_AUTH_TOKEN —
 * the only shell step allowed to. The gate could bound how MANY such steps there were, but not
 * what they did: appending `env | curl -d @- …` to the report step passed every rule, because the
 * exfiltration never names the variable (REL3 pass 4, reducer). Shell that holds a credential is
 * surface; a script is one exact step with probes. That is also REL2's finding, one layer on: the
 * prod publish loop was moved into `publish-latest.mjs` for the same reason.
 *
 * WHAT IT ASSERTS, which is the point of the step:
 *   - the set is DERIVED (release-graph), never passed in, and an empty set is refused;
 *   - `npm dist-tag ls` is read per package with its EXIT STATUS captured on its own line and
 *     stderr kept OUT of the success test. The original shell wrote `OUT="$(… 2>&1)" || true`,
 *     which folded an E404/E401 body into $OUT — so an auth failure passed the emptiness check as
 *     a non-empty "reading", and `|| true` discarded the status;
 *   - an EMPTY reading is a FAILED read on this registry, not an absent tag. `npm view <pkg>
 *     dist-tags` returns exit 0 with zero bytes against GitHub Packages (REL2; re-measured with
 *     controls 2026-09-20 — a VERSIONED `npm view <pkg>@<ver> dist.integrity` does work, so the
 *     zero-byte behaviour is specific to the unversioned queries a report would use), which is the
 *     whole reason this family of checks exists.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { publishable } from './release-graph.mjs';
import { isDirectInvocation } from './lib/direct-invocation.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KNOWN_ARGV = new Set(['--selftest']);

/** One `npm dist-tag ls <name>`: status, stdout and stderr kept separate. */
export function npmDistTagLs(name) {
  const r = spawnSync('npm', ['dist-tag', 'ls', name], { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (r.error) return { status: -1, stdout: '', stderr: r.error.message };
  return { status: r.status, stdout: String(r.stdout ?? ''), stderr: String(r.stderr ?? '') };
}

/**
 * Read every publishable package's dist-tags. `run` is injectable so the probes drive failure
 * without a registry. Returns the per-package readings; throws naming every package that failed.
 */
export function reportDistTags({ root = ROOT, run = npmDistTagLs, log = console.log } = {}) {
  const pkgs = publishable(join(root, 'packages')); // throws on an empty set
  const readings = [];
  const failed = [];
  for (const p of pkgs) {
    log(`=== ${p.name} ===`);
    const { status, stdout, stderr } = run(p.name);
    log(stdout.trimEnd());
    if (status !== 0) {
      log(`::error::${p.name}: npm dist-tag ls exited ${status}`);
      for (const line of stderr.trim().split('\n').filter(Boolean)) log(`    ${line}`);
      failed.push(p.name);
      continue;
    }
    if (stdout.replace(/\s/g, '') === '') {
      // An empty read is a FAILED read on this registry, not an absent tag.
      log(`::error::${p.name} returned an empty dist-tag listing — that is a failed read, not an absent tag`);
      failed.push(p.name);
      continue;
    }
    readings.push({ name: p.name, tags: stdout.trim().split('\n').filter(Boolean) });
  }
  if (failed.length) throw new Error(`could not confirm dist-tags for: ${failed.join(' ')}`);
  return readings;
}

/* ────────────────────────────── --selftest ────────────────────────────── */

function fixture(names = ['@spec-kitty/tokens', '@spec-kitty/styles']) {
  const root = mkdtempSync(join(tmpdir(), 'disttag-set-'));
  for (const name of names) {
    const dir = name.split('/').pop();
    mkdirSync(join(root, 'packages', dir), { recursive: true });
    writeFileSync(join(root, 'packages', dir, 'package.json'), JSON.stringify({ name, version: '1.0.0' }));
  }
  return root;
}

const quiet = () => {};
const ok = (out = 'latest: 1.0.0') => () => ({ status: 0, stdout: `${out}\n`, stderr: '' });

/** Run the REAL CLI in a fixture root with a stub `npm` that logs its argv. */
function cliProbe({ npmBody, names }) {
  const root = fixture(names);
  const bin = mkdtempSync(join(tmpdir(), 'disttag-cli-'));
  try {
    mkdirSync(join(root, 'scripts', 'lib'), { recursive: true });
    for (const f of ['report-dist-tags.mjs', 'release-graph.mjs', 'pack-derived-set.mjs', 'lib/direct-invocation.mjs']) {
      writeFileSync(join(root, 'scripts', f), readFileSync(join(dirname(fileURLToPath(import.meta.url)), f)));
    }
    writeFileSync(join(bin, 'npm'), `#!/bin/sh\necho "$*" >> "${join(bin, 'npm.log')}"\n${npmBody}\n`, { mode: 0o755 });
    const r = spawnSync(process.execPath, [join(root, 'scripts', 'report-dist-tags.mjs')], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });
    const calls = existsSync(join(bin, 'npm.log')) ? readFileSync(join(bin, 'npm.log'), 'utf8').trim().split('\n') : [];
    return { status: r.status, stdout: r.stdout, stderr: r.stderr, npm: calls };
  } finally {
    rmSync(bin, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
}

function selftest() {
  const root = fixture();
  const call = (opts) => {
    try {
      return { ok: true, value: reportDistTags({ root, log: quiet, ...opts }) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
  const PROBES = [
    ['every package reading a tag passes (control)', () => { const r = call({ run: ok() }); return r.ok && r.value.length === 2; }],
    ['a non-zero exit fails, naming the package', () => { const r = call({ run: () => ({ status: 1, stdout: '', stderr: 'npm error code E401' }) }); return !r.ok && /@spec-kitty\/tokens/.test(r.error) && /@spec-kitty\/styles/.test(r.error); }],
    // THE VERDICT, not just the logging (REL3 pass 5, reducer): a mutant that kept the error line but
    // only failed on an empty reading passed 15/15, and then accepted a FAILED read that printed a tag.
    ['a non-zero exit fails even when it printed a tag', () => { const r = call({ run: () => ({ status: 1, stdout: 'latest: 1.0.0\n', stderr: 'npm error code E401' }) }); return !r.ok && /@spec-kitty\/tokens/.test(r.error); }],
    ['a non-zero exit is not counted as a reading', () => { const r = call({ run: (n) => (n === '@spec-kitty/styles' ? { status: 1, stdout: 'latest: 1.0.0\n', stderr: 'x' } : ok()()) }); return !r.ok && /styles/.test(r.error); }],
    ['an EMPTY reading at exit 0 fails — the founding defect of this gate family', () => { const r = call({ run: () => ({ status: 0, stdout: '', stderr: '' }) }); return !r.ok; }],
    ['a whitespace-only reading at exit 0 fails', () => { const r = call({ run: () => ({ status: 0, stdout: '  \n\t\n', stderr: '' }) }); return !r.ok; }],
    ['an error body on STDERR does not count as a reading', () => { const r = call({ run: () => ({ status: 0, stdout: '', stderr: 'npm error code E404\nnot found' }) }); return !r.ok; }],
    ['one failing package among several is named, and only it', () => { const r = call({ run: (n) => (n === '@spec-kitty/styles' ? { status: 7, stdout: '', stderr: 'boom' } : ok()()) }); return !r.ok && /styles/.test(r.error) && !/tokens/.test(r.error); }],
    ['every package is read, not just the first', () => { const seen = []; call({ run: (n) => { seen.push(n); return ok()(); } }); return seen.length === 2 && seen.includes('@spec-kitty/tokens') && seen.includes('@spec-kitty/styles'); }],
    ['a failing package does not stop the others being read', () => { const seen = []; call({ run: (n) => { seen.push(n); return { status: 1, stdout: '', stderr: 'x' }; } }); return seen.length === 2; }],
    ['the set is DERIVED: an all-private set is refused before any read', () => {
      const r2 = fixture([]);
      mkdirSync(join(r2, 'packages', 'p'), { recursive: true });
      writeFileSync(join(r2, 'packages', 'p', 'package.json'), JSON.stringify({ name: '@x/p', version: '1.0.0', private: true }));
      const seen = [];
      try { reportDistTags({ root: r2, log: quiet, run: (n) => { seen.push(n); return ok()(); } }); return false; } catch (e) { return seen.length === 0 && /EMPTY/.test(e.message); } finally { rmSync(r2, { recursive: true, force: true }); }
    }],
    ['the stderr of a failed read is surfaced, not swallowed', () => { const lines = []; try { reportDistTags({ root, log: (l) => lines.push(l), run: () => ({ status: 1, stdout: '', stderr: 'npm error code E401' }) }); } catch { /* expected */ } return lines.some((l) => /E401/.test(l)); }],
    ['the real reader spawns exactly `npm dist-tag ls <name>`', () => { const r = cliProbe({ npmBody: "echo 'latest: 1.0.0'" }); return r.status === 0 && r.npm.length === 2 && r.npm.every((c) => /^dist-tag ls @spec-kitty\//.test(c)); }],
    ['the CLI exits 1 when a read fails', () => { const r = cliProbe({ npmBody: "echo 'npm error code E401' >&2; exit 1" }); return r.status === 1 && /could not confirm dist-tags/.test(r.stderr + r.stdout); }],
    ['the CLI exits 1 on an empty reading at exit 0', () => { const r = cliProbe({ npmBody: 'exit 0' }); return r.status === 1 && /failed read, not an absent tag/.test(r.stdout + r.stderr); }],
    // SPAWNED: these fail if the real argv refusal or the import guard goes.
    ['an unknown argument exits 2', () => spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--nope'], { encoding: 'utf8' }).status === 2],
    ['importing the module reads nothing', () => { const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(import.meta.url)})`], { encoding: 'utf8' }); return r.status === 0 && `${r.stdout}${r.stderr}`.trim() === ''; }],
  ];
  const PROBE_FLOOR = 17;
  let bad = 0;
  for (const [what, fn] of PROBES) {
    let good = false;
    try {
      good = fn() === true;
    } catch (e) {
      console.error(`  probe threw: ${what} — ${e.message}`);
    }
    console.log(`${good ? '✅' : '❌'} ${what}`);
    if (!good) bad++;
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
  console.log(`\n✅ All ${PROBES.length} dist-tag report probes behaved as recorded.`);
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  const stray = process.argv.slice(2).filter((a) => !KNOWN_ARGV.has(a));
  if (stray.length) {
    console.error(`::error::unrecognised argument(s): ${stray.join(' ')}. Known: ${[...KNOWN_ARGV].join(' ')}`);
    process.exit(2);
  }
  if (process.argv.includes('--selftest')) {
    selftest();
  } else {
    try {
      const readings = reportDistTags();
      console.log(`✅ dist-tags confirmed for ${readings.length} package(s).`);
    } catch (e) {
      console.error(`::error::${e.message}`);
      process.exit(1);
    }
  }
}
