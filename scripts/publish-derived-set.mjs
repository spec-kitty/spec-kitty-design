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
 * THE AUTHORITY FOR `latest` IS THE REF TYPE, NOT A FLAG. A workflow author cannot opt into the
 * prod channel by passing something — the only way to publish `latest` is for GitHub to report
 * `GITHUB_REF_TYPE=tag`, which the rc stream (a branch push) can never produce. This follows the
 * rule an earlier review pass produced and which this mission keeps relearning: a guard must key
 * on something the shipped environment emits, never on something the caller types.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
  try {
    return resolve(argv1) === resolve(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

export function unknownArgv(argv) {
  return argv.filter((a) => a.startsWith('-') && !KNOWN_ARGV.has(a));
}

/**
 * THE DECISION, as a pure function so the probe table can drive it.
 *
 * `refType` is GITHUB_REF_TYPE as the runner reports it — 'tag' or 'branch'. Everything else,
 * including undefined, is treated as not-a-tag: a missing signal is not permission.
 */
export function decidePublish({ tag, refType }) {
  if (typeof tag !== 'string' || tag.trim() === '') {
    return { ok: false, why: 'no dist-tag supplied; refusing to let npm default to `latest`' };
  }
  const t = tag.trim();
  if (/\s/.test(t)) {
    return { ok: false, why: `dist-tag ${JSON.stringify(t)} contains whitespace; npm would misparse it` };
  }
  if (t === 'latest' && refType !== 'tag') {
    return {
      ok: false,
      why:
        'refusing to publish dist-tag `latest` from a non-tag ref ' +
        `(GITHUB_REF_TYPE=${JSON.stringify(refType ?? '(unset)')}). Claiming the prod channel from a ` +
        'prerelease stream is irreversible; only a tag-triggered release may write `latest`.',
    };
  }
  return { ok: true, tag: t };
}

/** EPUBLISHCONFLICT is a resumption ONLY on a re-run. On attempt 1 it means the name+version is on
 *  the registry and this workflow did not put it there — which is a fact worth stopping for. */
export function classifyFailure(output, attempt) {
  const conflict = /code (EPUBLISHCONFLICT|E409)/.test(String(output ?? ''));
  if (conflict && Number(attempt) > 1) return 'resumption';
  if (conflict) return 'unexpected-conflict';
  return 'failure';
}

function main({ dryRun }) {
  const decision = decidePublish({ tag: process.env.DIST_TAG, refType: process.env.GITHUB_REF_TYPE });
  if (!decision.ok) {
    console.error(`::error::${decision.why}`);
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
      const out = execFileSync('npm', ['publish', '--tag', tag], { cwd, encoding: 'utf8', stdio: 'pipe' });
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

/* ────────────────────────────── --selftest ────────────────────────────── */

const PROBES = [
  ['refuses an empty dist-tag', () => decidePublish({ tag: '', refType: 'branch' }).ok === false],
  ['refuses a missing dist-tag', () => decidePublish({ tag: undefined, refType: 'branch' }).ok === false],
  ['refuses a whitespace-only dist-tag', () => decidePublish({ tag: '   ', refType: 'branch' }).ok === false],
  ['refuses a dist-tag containing whitespace', () => decidePublish({ tag: 'rc 1', refType: 'branch' }).ok === false],
  ['refuses `latest` on a branch ref', () => decidePublish({ tag: 'latest', refType: 'branch' }).ok === false],
  ['refuses `latest` when the ref type is unset', () => decidePublish({ tag: 'latest', refType: undefined }).ok === false],
  ['refuses `latest` when the ref type is a lookalike', () => decidePublish({ tag: 'latest', refType: 'tags' }).ok === false],
  ['refuses ` latest ` (padded) on a branch ref', () => decidePublish({ tag: ' latest ', refType: 'branch' }).ok === false],
  ['ALLOWS `latest` on a tag ref (prod)', () => decidePublish({ tag: 'latest', refType: 'tag' }).ok === true],
  ['allows `rc` on a branch ref', () => decidePublish({ tag: 'rc', refType: 'branch' }).ok === true],
  ['allows `next` on a branch ref', () => decidePublish({ tag: 'next', refType: 'branch' }).ok === true],
  ['trims the returned tag', () => decidePublish({ tag: '  rc  ', refType: 'branch' }).tag === 'rc'],
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

// The floor lives OUTSIDE the table, so a table that silently emptied cannot report green.
const PROBE_FLOOR = 21;

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
  console.log(`\n✅ All ${PROBES.length} publish-derived-set probes behaved as recorded.`);
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
