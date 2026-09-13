#!/usr/bin/env node
/**
 * Publish the derived package set — the refusal lives HERE, in executed code.
 *
 * WHY THIS FILE EXISTS. The rc stream must never write dist-tag `latest`: the first publish of a
 * package with no existing versions claims the prod channel, and that cannot be undone. Three
 * review passes tried to enforce that by pattern-matching the workflow's inline shell, and three
 * review passes defeated it:
 *
 *   pass 2  `npm publish` with `--tag "$TAG"` deleted            -> green (no guard at all)
 *   pass 3  a FULL-LINE comment mentioning `--tag`               -> green (stripped, then fixed)
 *   pass 3  a TRAILING same-line comment mentioning `--tag`      -> green (stripping was line-anchored)
 *   pass 3  `TAG=latest` reassigned after the input-derived line -> green (all three regexes satisfied)
 *
 * The last one is the argument for this file. It keeps `TAG="${{ inputs.dist-tag }}"`, keeps
 * `npm publish --tag "$TAG"`, never writes the literal `--tag latest`, and publishes `latest`
 * anyway. Every guard was green. Adding a sixth regex buys a pass-4 evasion; the class only closes
 * by construction (DIRECTIVE_043), and that means the refusal has to run at publish time over the
 * value actually in hand, not over the text somebody typed.
 *
 * THE AUTHORITY FOR `latest` IS THE RUNNER'S EVENT FILE. Two earlier versions of this guard keyed
 * on environment variables and both fell: `GITHUB_REF_TYPE` alone to a one-line
 * `run: GITHUB_REF_TYPE=tag node …` (pure POSIX — the platform's refusal to let a workflow override
 * `GITHUB_*` never applied, because nothing was overridden), and adding `GITHUB_REF` only raised
 * the price to two assignments on the same line. Both are authored text in the very file being
 * guarded, which is what the design claimed not to depend on. `latest` now additionally requires
 * the ref recorded in `GITHUB_EVENT_PATH`'s runner-written JSON to agree — so a spoof means forging
 * a file on the runner, not typing a word in the workflow. Any disagreement, or an unreadable
 * event file, is a refusal.
 *
 * AND THE DECISION IS BRANDED. `publishAll()` accepts only a token minted by `decidePublish`,
 * because pass 4 deleted one line from `main()` — the call itself — and published four packages
 * under `latest` from a branch while every probe table stayed green. A thoroughly probed pure
 * function whose CALL nothing probes is not a guard. The probe table below therefore ends with
 * EFFECT probes that spawn this file as a child process against a stub `npm` and count
 * invocations: those cannot be satisfied by a bypassed `main()`.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// `publishable()` already returns the set in topological order (tokens <- styles <- elements <-
// react), which is exactly what the halting behaviour below depends on. Reusing it rather than
// re-deriving is the same fail-closed accessor the workflow's own resolve step uses.
import { publishable } from './release-graph.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Tokens this script understands. Anything else is refused rather than ignored — an unrecognised
 *  flag used to fall through to the destructive default in the sibling bump script. */
const KNOWN_ARGV = new Set(['--dry-run', '--selftest', '--']);

export function isDirectInvocation(argv1, moduleUrl) {
  if (!argv1 || !moduleUrl) return false;
  // realpath BOTH SIDES. Plain `resolve` made an invocation through a symlink compare unequal, so
  // the module went inert and `--selftest` printed nothing and exited 0 — a fail-open entry point
  // in the one file whose whole thesis is fail-closed, and indistinguishable from a green run.
  const real = (x) => {
    try {
      return realpathSync(x);
    } catch {
      return resolve(x);
    }
  };
  try {
    return real(argv1) === real(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

export function unknownArgv(argv) {
  // NO `startsWith('-')` PREDICATE. It structurally could not see a bare word, so a plain
  // `selftest` — the sixth spelling this file's own docstring enumerates — still fell through
  // to the destructive default and mutated the tree while five dash-prefixed variants were
  // correctly refused. The probes pinned exactly the half that worked. Anything not in
  // KNOWN_ARGV is refused now, positional or not.
  return argv.filter((a) => !KNOWN_ARGV.has(a));
}

/**
 * THE DECISION — a pure function, so the probe table can drive it — AND THE ONLY MINT FOR AN
 * AUTHORIZATION. `publishAll()` accepts nothing but a token produced here, so `main()` cannot
 * construct permission it did not obtain: the bypass is unrepresentable, not merely discouraged.
 *
 * `refType`/`ref` are GITHUB_REF_TYPE and GITHUB_REF as the runner reports them. Anything that is
 * not a tag — including undefined — is treated as not-a-tag: a missing signal is not permission.
 *
 * WHY THE BRAND: review deleted ONE LINE from `main()` (the `decidePublish(...)` call, replaced by
 * a hand-built `{ ok: true, tag: 'latest' }`), left `decidePublish` byte-identical, and published
 * four packages under `latest` from a branch ref while all three probe tables reported green. The
 * function was exhaustively probed; its CALL was probed by nothing. A symbol no other module can
 * forge is what closes that, and the effect probes below are what prove it stays closed.
 */
const AUTHORIZED = Symbol('publish-authorized');

/**
 * The ref as the RUNNER recorded it, from the event JSON it writes before the job starts.
 * Returns null on anything unreadable — a missing signal is never permission.
 *
 * Injectable (`pathOverride`) so the probe table can drive it without touching the environment.
 */
export function readEventRef(pathOverride) {
  const p = pathOverride ?? process.env.GITHUB_EVENT_PATH;
  if (typeof p !== 'string' || p === '') return null;
  try {
    const ev = JSON.parse(readFileSync(p, 'utf8'));
    return typeof ev?.ref === 'string' ? ev.ref : null;
  } catch {
    return null;
  }
}

export function decidePublish({ tag, refType, ref, eventPath }) {
  if (typeof tag !== 'string' || tag.trim() === '') {
    return { ok: false, why: 'no dist-tag supplied; refusing to let npm default to `latest`' };
  }
  const t = tag.trim();
  if (/\s/.test(t)) {
    return { ok: false, why: `dist-tag ${JSON.stringify(t)} contains whitespace; npm would misparse it` };
  }
  // AN UNEVALUATED WORKFLOW EXPRESSION IS NOT A TAG. `dist-tag: ${{ vars.RC_CHANNEL }}` reaches
  // here verbatim when the variable is unset, and `${{...}}` is a perfectly valid npm tag string.
  if (t.includes('${{') || t.includes('}}')) {
    return { ok: false, why: `dist-tag ${JSON.stringify(t)} is an unevaluated workflow expression` };
  }
  if (t === 'latest') {
    // THE AUTHORITY IS THE RUNNER-WRITTEN EVENT FILE, not an environment variable.
    //
    // Env vars were the wrong source and review proved it twice. `GITHUB_REF_TYPE` alone fell to a
    // one-line `run: GITHUB_REF_TYPE=tag node …` — pure POSIX, no Actions semantics involved, so
    // the platform's own refusal to let a workflow override `GITHUB_*` never even applied. Adding
    // `GITHUB_REF` as a second signal only raised the price to two assignments on the same line.
    // Both are still *authored text in the file being guarded*, which is precisely what the design
    // claimed not to depend on.
    //
    // `GITHUB_EVENT_PATH` points at JSON the RUNNER writes before the job starts. A workflow can
    // point the variable elsewhere, but then the file it names will not contain a matching event —
    // and this refuses on any disagreement, including an unreadable or absent file. So a spoof now
    // requires forging a file on the runner rather than typing a word in the workflow.
    //
    // The env vars are still required to agree. Three sources, one of them outside the file's
    // reach, and any disagreement is a refusal.
    const eventRef = readEventRef(eventPath);
    const refSaysTag = typeof ref === 'string' && ref.startsWith('refs/tags/');
    const eventSaysTag = typeof eventRef === 'string' && eventRef.startsWith('refs/tags/');
    if (refType !== 'tag' || !refSaysTag || !eventSaysTag || eventRef !== ref) {
      return {
        ok: false,
        why:
          'refusing to publish dist-tag `latest`: the three ref signals do not all agree on a tag ' +
          `(GITHUB_REF_TYPE=${JSON.stringify(refType ?? '(unset)')}, ` +
          `GITHUB_REF=${JSON.stringify(ref ?? '(unset)')}, ` +
          `event file ref=${JSON.stringify(eventRef ?? '(unreadable)')}). Claiming the prod channel ` +
          'from a prerelease stream is irreversible; only a genuine tag-triggered release may write ' +
          '`latest`, and the event file is the runner\'s word for that rather than the workflow\'s.',
      };
    }
  }
  return { ok: true, tag: t, [AUTHORIZED]: true };
}

/** EPUBLISHCONFLICT is a resumption ONLY on a re-run. On attempt 1 it means the name+version is on
 *  the registry and this workflow did not put it there — which is a fact worth stopping for. */
export function classifyFailure(output, attempt) {
  const conflict = /code (EPUBLISHCONFLICT|E409)/.test(String(output ?? ''));
  if (conflict && Number(attempt) > 1) return 'resumption';
  if (conflict) return 'unexpected-conflict';
  return 'failure';
}

/**
 * The executor. REFUSES ANY DECISION IT DID NOT RECEIVE FROM `decidePublish`.
 *
 * This is the half that makes the guard structural. A caller cannot hand it `{ok: true}` — the
 * brand is a module-private Symbol — so there is no one-line edit that turns an unauthorized
 * publish into an authorized one.
 */
function publishAll(decision, { dryRun }) {
  if (!decision || decision[AUTHORIZED] !== true) {
    console.error('::error::publish attempted without an authorization from decidePublish() — refusing');
    process.exit(1);
  }
  const tag = decision.tag;

  // DERIVED, never listed — and asserted non-empty. A green line over zero packages is the
  // founding defect of this whole gate family.
  const pkgs = publishable();
  if (!Array.isArray(pkgs) || pkgs.length === 0) {
    console.error('::error::empty publish set reached the publish loop');
    process.exit(1);
  }
  console.log(`publishing ${pkgs.length} package(s) under dist-tag \`${tag}\`, in topological order:`);
  for (const p of pkgs) console.log(`  ${p.name}`);

  if (dryRun) {
    console.log('\n(--dry-run: nothing published)');
    return;
  }

  const attempt = process.env.GITHUB_RUN_ATTEMPT ?? '1';
  for (const p of pkgs) {
    const cwd = join(ROOT, 'packages', p.dir);
    console.log(`\n=== publishing ${p.name} under ${tag} ===`);
    try {
      // BOTH STREAMS. `execFileSync` returns stdout only, and npm writes its publish notices to
      // stderr — so the success path logged almost nothing, in the one place where the log IS the
      // evidence. maxBuffer is raised explicitly: the 1 MB default turns a chatty publish into an
      // ENOBUFS throw that would be misreported as a publish failure.
      const r = spawnSync('npm', ['publish', '--tag', tag], { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      if (r.error) throw r.error;
      const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
      if (r.status !== 0) throw Object.assign(new Error(`npm publish exited ${r.status}`), { stdout: r.stdout, stderr: r.stderr });
      console.log(out);
    } catch (e) {
      const out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
      console.log(out);
      const kind = classifyFailure(out, attempt);
      if (kind === 'resumption') {
        console.log(`::warning::${p.name} is already published at this version — treating as resumption`);
        continue;
      }
      if (kind === 'unexpected-conflict') {
        console.error(`::error::${p.name} reports an existing version on the FIRST attempt.`);
        console.error('Nothing under this scope should already hold it, so this is not a resumption.');
        console.error('Verify ownership before re-running: npm view <name>@<version> _npmUser.name');
      }
      // HALT, do not accumulate. The set is published in topological order precisely so a package
      // goes out after everything it depends on. Continuing past a real failure spends that
      // guarantee in the only case it was for: if `tokens` fails, its three dependents publish
      // anyway (npm publish does not resolve peers, so all three succeed) and every consumer
      // install then hard-fails E404 on a peer that does not exist. Those versions are permanent.
      console.error(`::error::halting — every package after ${p.name} in the derived set may depend on it`);
      process.exit(1);
    }
  }
  console.log(`\n✅ published ${pkgs.length} package(s) under \`${tag}\`.`);
}

function main({ dryRun }) {
  // NOT FROM A WORKSTATION. Before this guard, `node scripts/publish-derived-set.mjs` with no
  // arguments published all four packages for real from a laptop — the destructive action was the
  // default for ZERO arguments, which is the same shape the sibling bump script was just fixed for.
  // The inline loop this replaced could only ever run inside a workflow; the extraction quietly
  // removed that property, so it is restored explicitly.
  if (process.env.GITHUB_ACTIONS !== 'true' && !dryRun) {
    console.error('::error::refusing to publish outside GitHub Actions (GITHUB_ACTIONS is not "true").');
    console.error('For a local check use --dry-run, which resolves and prints the set without publishing.');
    process.exit(1);
  }
  // ...AND `--dry-run` IS NOT A RELEASE. Appending it to the workflow step turned the whole release
  // into a no-op that every gate reported green — the "green line over zero inputs" defect, one
  // level up from the empty-set floor below.
  if (dryRun && process.env.GITHUB_ACTIONS === 'true') {
    console.error('::error::--dry-run inside GitHub Actions would report a green release having published nothing');
    process.exit(1);
  }
  const decision = decidePublish({
    tag: process.env.DIST_TAG,
    refType: process.env.GITHUB_REF_TYPE,
    ref: process.env.GITHUB_REF,
  });
  if (!decision.ok) {
    console.error(`::error::${decision.why}`);
    process.exit(1);
  }
  publishAll(decision, { dryRun });
}

/* ────────────────────────────── --selftest ────────────────────────────── */

/** Write a runner-shaped event file for a probe, and clean it up. */
function withRawEventFile(body, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'pds-ev-'));
  const f = join(dir, 'event.json');
  writeFileSync(f, body);
  try {
    return fn(f);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const withEventFile = (ref, fn) => withRawEventFile(JSON.stringify({ ref }), fn);

const PROBES = [
  ['refuses an empty dist-tag', () => decidePublish({ tag: '', refType: 'branch' }).ok === false],
  ['refuses a missing dist-tag', () => decidePublish({ tag: undefined, refType: 'branch' }).ok === false],
  ['refuses a whitespace-only dist-tag', () => decidePublish({ tag: '   ', refType: 'branch' }).ok === false],
  ['refuses a dist-tag containing whitespace', () => decidePublish({ tag: 'rc 1', refType: 'branch' }).ok === false],
  ['refuses `latest` on a branch ref', () => decidePublish({ tag: 'latest', refType: 'branch', ref: 'refs/heads/develop' }).ok === false],
  ['refuses `latest` when the ref type is unset', () => decidePublish({ tag: 'latest', refType: undefined, ref: undefined }).ok === false],
  ['refuses `latest` when the ref type is a lookalike', () => decidePublish({ tag: 'latest', refType: 'tags', ref: 'refs/tags/v1' }).ok === false],
  ['refuses ` latest ` (padded) on a branch ref', () => decidePublish({ tag: ' latest ', refType: 'branch', ref: 'refs/heads/develop' }).ok === false],
  // THE TWO SIGNALS MUST AGREE: forging either one alone is refused.
  ['refuses `latest` when REF_TYPE says tag but REF says a branch', () => decidePublish({ tag: 'latest', refType: 'tag', ref: 'refs/heads/develop' }).ok === false],
  ['refuses `latest` when REF says a tag but REF_TYPE says branch', () => decidePublish({ tag: 'latest', refType: 'branch', ref: 'refs/tags/v1.2.3' }).ok === false],
  ['refuses `latest` when REF is unset even if REF_TYPE says tag', () => decidePublish({ tag: 'latest', refType: 'tag', ref: undefined }).ok === false],
  ['refuses an unevaluated workflow expression as a dist-tag', () => decidePublish({ tag: '${{ vars.RC_CHANNEL }}', refType: 'branch', ref: 'refs/heads/develop' }).ok === false],
  // THE EVENT FILE IS THE THIRD SIGNAL, and the only one the guarded workflow cannot author.
  // These write real temp files rather than stubbing the reader, so the parse path is exercised.
  ['ALLOWS `latest` when all three signals agree on a tag (prod)', () => withEventFile('refs/tags/v1.2.3', (ep) => decidePublish({ tag: 'latest', refType: 'tag', ref: 'refs/tags/v1.2.3', eventPath: ep }).ok === true)],
  ['refuses `latest` when the env says tag but the EVENT FILE says a branch', () => withEventFile('refs/heads/develop', (ep) => decidePublish({ tag: 'latest', refType: 'tag', ref: 'refs/tags/v1.2.3', eventPath: ep }).ok === false)],
  ['refuses `latest` when the event file names a DIFFERENT tag than GITHUB_REF', () => withEventFile('refs/tags/v9.9.9', (ep) => decidePublish({ tag: 'latest', refType: 'tag', ref: 'refs/tags/v1.2.3', eventPath: ep }).ok === false)],
  ['refuses `latest` when the event file is missing', () => decidePublish({ tag: 'latest', refType: 'tag', ref: 'refs/tags/v1.2.3', eventPath: '/nonexistent/event.json' }).ok === false],
  ['refuses `latest` when the event file is unparseable', () => withRawEventFile('not json at all', (ep) => decidePublish({ tag: 'latest', refType: 'tag', ref: 'refs/tags/v1.2.3', eventPath: ep }).ok === false)],
  ['readEventRef returns null for an absent path', () => readEventRef(undefined) === null || typeof process.env.GITHUB_EVENT_PATH === 'string'],
  ['readEventRef reads the ref from real JSON', () => withEventFile('refs/tags/v2', (ep) => readEventRef(ep) === 'refs/tags/v2')],
  ['`rc` is unaffected by the event file (no tag authority needed)', () => withEventFile('refs/heads/develop', (ep) => decidePublish({ tag: 'rc', refType: 'branch', ref: 'refs/heads/develop', eventPath: ep }).ok === true)],
  ['an authorization carries the private brand', () => Object.getOwnPropertySymbols(decidePublish({ tag: 'rc', refType: 'branch', ref: 'refs/heads/develop' })).length === 1],
  ['a hand-built decision carries no brand', () => Object.getOwnPropertySymbols({ ok: true, tag: 'latest' }).length === 0],
  ['allows `rc` on a branch ref', () => decidePublish({ tag: 'rc', refType: 'branch', ref: 'refs/heads/develop' }).ok === true],
  ['allows `next` on a branch ref', () => decidePublish({ tag: 'next', refType: 'branch', ref: 'refs/heads/develop' }).ok === true],
  ['trims the returned tag', () => decidePublish({ tag: '  rc  ', refType: 'branch', ref: 'refs/heads/develop' }).tag === 'rc'],
  ['EPUBLISHCONFLICT on attempt 1 is NOT a resumption', () => classifyFailure('npm error code EPUBLISHCONFLICT', '1') === 'unexpected-conflict'],
  ['EPUBLISHCONFLICT on attempt 2 IS a resumption', () => classifyFailure('npm error code EPUBLISHCONFLICT', '2') === 'resumption'],
  ['E409 on attempt 2 is a resumption', () => classifyFailure('npm error code E409', '2') === 'resumption'],
  ['an unrelated failure is never a resumption', () => classifyFailure('npm error code E401 Unauthorized', '3') === 'failure'],
  ['empty output is never a resumption', () => classifyFailure('', '2') === 'failure'],
  ['unknown argv is refused', () => unknownArgv(['--selftest', '--nope']).length === 1],
  ['a misspelt --selftest is refused rather than ignored', () => unknownArgv(['--self-test']).length === 1],
  ['known argv passes', () => unknownArgv(['--dry-run', '--selftest']).length === 0],
  ['importing does not publish', () => isDirectInvocation('/some/other.mjs', import.meta.url) === false],
];

/**
 * EFFECT PROBES — the ones that survive a bypassed `main()`.
 *
 * Every probe above drives a pure function. Review proved that is not enough: deleting the
 * `decidePublish(...)` call from `main()` left all of them green while the script published four
 * packages under `latest` from a branch ref. So these spawn THIS FILE as a child process with a
 * stub `npm` first on PATH, and assert on what npm was actually asked to do. A `main()` that skips
 * the decision fails them, because they count invocations rather than inspecting a return value.
 */
function effectProbes() {
  const dir = mkdtempSync(join(tmpdir(), 'pds-effect-'));
  const log = join(dir, 'npm.log');
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'npm'), `#!/bin/sh\necho "npm $*" >> "${log}"\nexit 0\n`, { mode: 0o755 });

  const run = (env) => {
    writeFileSync(log, '');
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_ACTIONS: 'true', ...env },
    });
    const calls = readFileSync(log, 'utf8').trim();
    return { status: r.status, calls: calls === '' ? [] : calls.split('\n'), out: `${r.stdout}${r.stderr}` };
  };

  const cases = [
    [
      'EFFECT: `latest` from a branch ref invokes npm ZERO times and exits non-zero',
      () => {
        const r = run({ DIST_TAG: 'latest', GITHUB_REF_TYPE: 'branch', GITHUB_REF: 'refs/heads/develop' });
        return r.status !== 0 && r.calls.length === 0;
      },
    ],
    [
      'EFFECT: `latest` with a FORGED GITHUB_REF_TYPE but a branch GITHUB_REF still invokes npm zero times',
      () => {
        const r = run({ DIST_TAG: 'latest', GITHUB_REF_TYPE: 'tag', GITHUB_REF: 'refs/heads/develop' });
        return r.status !== 0 && r.calls.length === 0;
      },
    ],
    [
      'EFFECT: an unset dist-tag invokes npm zero times',
      () => {
        const r = run({ DIST_TAG: '', GITHUB_REF_TYPE: 'branch', GITHUB_REF: 'refs/heads/develop' });
        return r.status !== 0 && r.calls.length === 0;
      },
    ],
    [
      'EFFECT: `rc` from a branch ref publishes the whole derived set, every call carrying --tag rc',
      () => {
        const r = run({ DIST_TAG: 'rc', GITHUB_REF_TYPE: 'branch', GITHUB_REF: 'refs/heads/develop' });
        return (
          r.status === 0 &&
          r.calls.length === publishable().length &&
          r.calls.every((c) => c.includes('publish') && c.includes('--tag rc'))
        );
      },
    ],
    [
      'EFFECT: no npm call ever omits --tag',
      () => {
        const r = run({ DIST_TAG: 'rc', GITHUB_REF_TYPE: 'branch', GITHUB_REF: 'refs/heads/develop' });
        return r.calls.length > 0 && r.calls.every((c) => /--tag\s+\S+/.test(c));
      },
    ],
    [
      // Debbie pass 4, G10: replacing the halt with `continue` was invisible to all 21 probes,
      // while the file spends five lines explaining that continuing past a failed `tokens` makes
      // its three dependents publish against a peer that does not exist — permanently.
      'EFFECT: a failing publish HALTS the set rather than continuing past it',
      () => {
        writeFileSync(join(bin, 'npm'), `#!/bin/sh\necho "npm $*" >> "${log}"\ncase "$PWD" in *tokens) exit 1;; esac\nexit 0\n`, { mode: 0o755 });
        const r = run({ DIST_TAG: 'rc', GITHUB_REF_TYPE: 'branch', GITHUB_REF: 'refs/heads/develop' });
        writeFileSync(join(bin, 'npm'), `#!/bin/sh\necho "npm $*" >> "${log}"\nexit 0\n`, { mode: 0o755 });
        // tokens is first in topological order: exactly one call, then a halt.
        return r.status !== 0 && r.calls.length === 1;
      },
    ],
    [
      'EFFECT: refuses to publish outside GitHub Actions',
      () => {
        writeFileSync(log, '');
        const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, DIST_TAG: 'rc', GITHUB_REF_TYPE: 'branch' };
        delete env.GITHUB_ACTIONS;
        const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { encoding: 'utf8', env });
        return r.status !== 0 && readFileSync(log, 'utf8').trim() === '';
      },
    ],
    [
      'EFFECT: --dry-run inside GitHub Actions is refused rather than reported as a release',
      () => {
        const r = run({ DIST_TAG: 'rc', GITHUB_REF_TYPE: 'branch', GITHUB_REF: 'refs/heads/develop' });
        writeFileSync(log, '');
        const d = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--dry-run'], {
          encoding: 'utf8',
          env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_ACTIONS: 'true', DIST_TAG: 'rc' },
        });
        return r.status === 0 && d.status !== 0 && readFileSync(log, 'utf8').trim() === '';
      },
    ],
  ];

  let bad = 0;
  for (const [what, fn] of cases) {
    let ok = false;
    try {
      ok = fn() === true;
    } catch (e) {
      console.error(`  effect probe threw: ${what} — ${e.message}`);
    }
    console.log(`${ok ? '✅' : '❌'} ${what}`);
    if (!ok) bad++;
  }
  rmSync(dir, { recursive: true, force: true });
  return { bad, total: cases.length };
}

// The floor lives OUTSIDE the table, so a table that silently emptied cannot report green.
const PROBE_FLOOR = 34;
// Effect probes have their own floor: they are the only ones a bypassed `main()` cannot satisfy.
const EFFECT_FLOOR = 8;

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
  console.log('\n── effect probes (spawned child + stub npm; a bypassed main() fails these) ──');
  const eff = effectProbes();
  if (eff.bad) {
    console.error(`\n❌ ${eff.bad} of ${eff.total} EFFECT probe(s) failed — the decision is not reaching the publish.`);
    process.exit(1);
  }
  if (eff.total < EFFECT_FLOOR) {
    console.error(`\n❌ only ${eff.total} effect probes — the floor is ${EFFECT_FLOOR}`);
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} decision probes and ${eff.total} effect probes behaved as recorded.`);
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  const stray = unknownArgv(process.argv.slice(2));
  if (stray.length > 0) {
    console.error(`::error::unrecognised argument(s): ${stray.join(' ')}`);
    console.error(`Known: ${[...KNOWN_ARGV].join(' ')}. Refusing rather than falling through to a publish.`);
    process.exit(2);
  }
  if (process.argv.includes('--selftest')) selftest();
  else main({ dryRun: process.argv.includes('--dry-run') });
}
