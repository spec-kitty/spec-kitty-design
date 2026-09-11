#!/usr/bin/env node
/**
 * scripts/check-develop-ruleset-parity.mjs — full-parameter comparison between the live
 * `develop` ruleset and the committed artifact (REL1, #362, FR-001/NFR-004/SC-001;
 * data-model.md's DevelopRulesetArtifact, contracts/promotion-script.contract.md).
 *
 * `diffRulesetParity(live, artifact)` compares EVERY parameter at every nesting level,
 * ignoring only the eight named response-only fields GitHub's API adds to a response that
 * never appear in a POST/PATCH body (`id`, `node_id`, `_links`, `current_user_can_bypass`,
 * `created_at`, `updated_at`, `source`, `source_type`) and the three named, documented
 * differences (`name`, `conditions.ref_name.include`,
 * `rules[type=pull_request].parameters.allowed_merge_methods`) — every other mismatch, at any
 * depth, is reported.
 *
 * CLI:
 *   node scripts/check-develop-ruleset-parity.mjs --selftest
 *   node scripts/check-develop-ruleset-parity.mjs --check [--ruleset-id <id>]
 *     (id also read from $DEVELOP_RULESET_ID; unset -> exit 0 with a notice before the
 *     BOOTSTRAP_DEADLINE below, exit 1 after it (M9) — the live ruleset does not exist until
 *     the orchestrator applies it post-merge, but that state must not stay silently green
 *     forever.)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTIFACT_PATH = resolve(__dirname, '..', '.github', 'rulesets', 'develop-ruleset.json');
// "Also" item (pre-merge squad, PR #429): env-driven, not a second hardcoded literal — the
// one INTENTIONALLY hardcoded literal in this mission is `assertSingleRepoScope`'s security
// invariant in scripts/promote-develop.mjs, which must stay literal (an env var there would
// let the App-scope guard be satisfied by manipulating the environment, defeating its point).
// This script is not a security boundary — it only fetches a ruleset for whatever repo the
// job runs in — so it reads `GITHUB_REPOSITORY` the same way promote-develop.mjs's `cliRun`
// does, falling back to the literal only for a bare local invocation with no env set.
const REPO = process.env.GITHUB_REPOSITORY || 'spec-kitty/spec-kitty-design';

// M9 (pre-merge squad, PR #429): a dated floor. Before this, an unset DEVELOP_RULESET_ID made
// `--check` print a notice and exit 0 FOREVER — including long after the orchestrator's
// bootstrap window has passed, silently comparing nothing on every nightly run with no signal
// that anything is wrong. Three weeks (matching the mission's own bootstrap sequence's
// expected cadence — cut develop, apply the ruleset, flip the enable switch, all one
// orchestrator sitting) is generous slack; past it, an unset id is itself the failure being
// reported, not a normal pre-bootstrap state.
const BOOTSTRAP_DEADLINE = new Date('2026-10-03T00:00:00Z');

/** Pure. Extracted so `--selftest` can probe the dated-floor logic itself without waiting for
 *  the actual calendar date to pass. */
export function isPastBootstrapDeadline(now) {
  return now.getTime() > BOOTSTRAP_DEADLINE.getTime();
}

const IGNORED_TOP_LEVEL_FIELDS = new Set([
  'id',
  'node_id',
  '_links',
  'current_user_can_bypass',
  'created_at',
  'updated_at',
  'source',
  'source_type',
]);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Deep-diff two values, recording every mismatched path. `rules` arrays are matched by their
 *  `type` field (not array index/order), since a ruleset's own rule ordering is not meaningful. */
/** Paths treated as opaque — never recursed into, and therefore never able to produce a
 *  per-element diff that the top-level filter below would fail to catch. `conditions.ref_name
 *  .include` differs by necessity between any two rulesets targeting different branches;
 *  `allowed_merge_methods` is develop's one intentional, documented narrowing (data-model.md). */
const OPAQUE_PATHS = new Set(['conditions.ref_name.include', 'rules[type=pull_request].parameters.allowed_merge_methods']);

function deepDiff(pathPrefix, a, b, diffs) {
  if (OPAQUE_PATHS.has(pathPrefix)) return;
  if (a === b) return;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      diffs.push({ path: pathPrefix, live: a, artifact: b });
      return;
    }
    if (pathPrefix === 'rules') {
      const byType = (arr) => Object.fromEntries((arr ?? []).map((r) => [r.type, r]));
      const liveByType = byType(a);
      const artByType = byType(b);
      const allTypes = new Set([...Object.keys(liveByType), ...Object.keys(artByType)]);
      for (const type of allTypes) {
        const path = `rules[type=${type}]`;
        if (!(type in liveByType)) {
          diffs.push({ path, live: undefined, artifact: artByType[type] });
        } else if (!(type in artByType)) {
          diffs.push({ path, live: liveByType[type], artifact: undefined });
        } else {
          deepDiff(path, liveByType[type], artByType[type], diffs);
        }
      }
      return;
    }
    if (a.length !== b.length) {
      diffs.push({ path: pathPrefix, live: a, artifact: b });
      return;
    }
    a.forEach((item, i) => deepDiff(`${pathPrefix}[${i}]`, item, b[i], diffs));
    return;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      if (!pathPrefix && IGNORED_TOP_LEVEL_FIELDS.has(key)) continue;
      const path = pathPrefix ? `${pathPrefix}.${key}` : key;
      deepDiff(path, a[key], b[key], diffs);
    }
    return;
  }

  diffs.push({ path: pathPrefix, live: a, artifact: b });
}

const NAMED_DIFFERENCES = new Set(['name', 'conditions.ref_name.include']);
const NAMED_PREFIX_DIFFERENCES = ['rules[type=pull_request].parameters.allowed_merge_methods'];

/**
 * Compares EVERY parameter, at every nesting level (data-model.md's DevelopRulesetArtifact
 * section). Returns `[]` only when the full structures match except the three named,
 * documented differences.
 */
export function diffRulesetParity(live, artifact) {
  const diffs = [];
  deepDiff('', live, artifact, diffs);
  return diffs.filter((d) => {
    if (NAMED_DIFFERENCES.has(d.path)) return false;
    if (NAMED_PREFIX_DIFFERENCES.some((prefix) => d.path === prefix || d.path.startsWith(`${prefix}[`))) {
      return false;
    }
    return true;
  });
}

// ── CLI: --check ──────────────────────────────────────────────────────────────────────

function getArg(args, flag) {
  const idx = args.indexOf(flag);
  return idx === -1 ? undefined : args[idx + 1];
}

function cliCheck(args) {
  // M9 (pre-merge squad, PR #429): no `--input` fixture seam here. It was reachable from
  // production (`--check --input <file>`) but nothing in `--selftest` used it — every probe
  // calls `diffRulesetParity` directly, in-process, against synthetic fixtures. A
  // production-reachable seam nothing exercises is exactly the defect class
  // `check-gate-wiring-defeats.mjs`'s own header comment describes closing. Manual
  // verification against a fixture (WP report) now calls `diffRulesetParity`/constructs the
  // `--check` inputs from a one-off `node -e`, not through this CLI.
  const id = getArg(args, '--ruleset-id') ?? process.env.DEVELOP_RULESET_ID;
  if (!id) {
    if (isPastBootstrapDeadline(new Date())) {
      console.error(
        `::error::DEVELOP_RULESET_ID is still unset as of ${new Date().toISOString()}, past the ` +
          `${BOOTSTRAP_DEADLINE.toISOString()} bootstrap deadline (M9) — this is no longer the ` +
          'expected pre-bootstrap state; the orchestrator sequence in quickstart.md was either ' +
          'never run or never recorded the ruleset id in branch-model.md. Failing rather than ' +
          'silently comparing nothing forever.',
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      '::notice::DEVELOP_RULESET_ID is not set (no --ruleset-id given either) — the develop ' +
        'ruleset has not been applied yet, or its id has not been recorded in ' +
        'docs/architecture/branch-model.md. Nothing to check; this is expected before the ' +
        "orchestrator's post-merge bootstrap sequence (quickstart.md), and only before " +
        `${BOOTSTRAP_DEADLINE.toISOString()}.`,
    );
    return;
  }
  const live = JSON.parse(execFileSync('gh', ['api', `repos/${REPO}/rulesets/${id}`], { encoding: 'utf8' }));
  const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf8'));
  const diffs = diffRulesetParity(live, artifact);
  if (diffs.length) {
    console.error(`::error::the live develop ruleset (id ${id}) has drifted from the committed artifact:`);
    for (const d of diffs) {
      console.error(`   ${d.path}: live=${JSON.stringify(d.live)} artifact=${JSON.stringify(d.artifact)}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`✅ the live develop ruleset (id ${id}) matches the committed artifact.`);
}

// ── --selftest: floor-outside-the-table, same shape as promote-develop.mjs's (research.md R8) ──

function baseArtifact() {
  return JSON.parse(readFileSync(ARTIFACT_PATH, 'utf8'));
}

/** A "live" fixture shaped like GitHub's response: the artifact plus the response-only fields
 *  a POST/PATCH body never carries, and the two structural differences a real develop ruleset
 *  legitimately has relative to the committed artifact (name, ref include). */
function liveShapedFrom(artifact) {
  const live = JSON.parse(JSON.stringify(artifact));
  live.id = 999;
  live.node_id = 'RS_test';
  live._links = { self: { href: 'https://api.github.com/x' } };
  live.current_user_can_bypass = 'never';
  live.created_at = '2026-09-11T00:00:00Z';
  live.updated_at = '2026-09-11T00:00:00Z';
  live.source = { type: 'Repository', id: 1 };
  live.source_type = 'Repository';
  return live;
}

function runProbes() {
  const results = [];
  const record = (n, name, expect, ok, detail) => results.push({ n, name, expect, ok, detail });

  const artifact = baseArtifact();

  // Probe 1 — same fixture (plus response-only fields and the two documented differences,
  // which is exactly what a real live ruleset looks like relative to the artifact) -> [].
  {
    const live = liveShapedFrom(artifact);
    const diffs = diffRulesetParity(live, artifact);
    record(1, 'same-shaped fixture (response-only fields + documented differences only) -> []', 'pass', diffs.length === 0, diffs);
  }

  // Probe 2 — a genuinely different fixture -> non-empty, naming the field.
  {
    const live = liveShapedFrom(artifact);
    const prRule = live.rules.find((r) => r.type === 'pull_request');
    prRule.parameters.required_approving_review_count = 1;
    const diffs = diffRulesetParity(live, artifact);
    const flagged = diffs.some((d) => d.path.includes('required_approving_review_count'));
    record(2, 'different fixture (required_approving_review_count) -> non-empty, field named', 'fail', diffs.length > 0 && flagged, diffs);
  }

  // Probe 3 — a fixture that reintroduces a bypass actor (C-005) must be caught.
  {
    const live = liveShapedFrom(artifact);
    live.bypass_actors = [{ actor_id: 1, actor_type: 'Team', bypass_mode: 'always' }];
    const diffs = diffRulesetParity(live, artifact);
    const flagged = diffs.some((d) => d.path === 'bypass_actors');
    record(3, 'bypass actor reintroduced -> caught', 'fail', diffs.length > 0 && flagged, diffs);
  }

  // Probe 4 — a fixture missing code_scanning entirely must be caught.
  {
    const live = liveShapedFrom(artifact);
    live.rules = live.rules.filter((r) => r.type !== 'code_scanning');
    const diffs = diffRulesetParity(live, artifact);
    const flagged = diffs.some((d) => d.path === 'rules[type=code_scanning]');
    record(4, 'code_scanning rule missing entirely -> caught', 'fail', diffs.length > 0 && flagged, diffs);
  }

  // Probe 5 — the three named differences (name, ref include, allowed_merge_methods), even
  // when ALL THREE differ from the artifact, are correctly tolerated -> [].
  {
    const live = liveShapedFrom(artifact);
    live.name = 'main-is-safe';
    live.conditions.ref_name.include = ['~DEFAULT_BRANCH'];
    live.rules.find((r) => r.type === 'pull_request').parameters.allowed_merge_methods = ['squash', 'rebase'];
    const diffs = diffRulesetParity(live, artifact);
    record(5, 'the three named differences, all three present at once -> still []', 'pass', diffs.length === 0, diffs);
  }

  // Probe 6 — M9's dated floor: before the deadline, unset id is tolerated; after it, it must
  // NOT be (a bare `Date.now()` comparison used inline, un-probed, would drift silently).
  {
    const beforeDeadline = !isPastBootstrapDeadline(new Date('2026-09-12T00:00:00Z'));
    const afterDeadline = isPastBootstrapDeadline(new Date('2027-01-01T00:00:00Z'));
    record(6, 'the dated bootstrap floor tolerates unset before the deadline, refuses after it', 'pass', beforeDeadline && afterDeadline, {
      beforeDeadline,
      afterDeadline,
    });
  }

  return results;
}

const PROBE_FLOOR = 6;

function selftest() {
  const results = runProbes();

  if (results.length < PROBE_FLOOR) {
    console.error(
      `❌ the probe table has shrunk: ${results.length} probe(s) against a floor of ${PROBE_FLOOR}.`,
    );
    process.exitCode = 1;
    return;
  }

  const expectedPass = results.filter((r) => r.expect === 'pass');
  const expectedFail = results.filter((r) => r.expect === 'fail');
  if (expectedPass.length === 0 || expectedFail.length === 0) {
    console.error(
      'Refusing to report green over a degenerate probe set: ' +
        `${expectedPass.length} expect-pass, ${expectedFail.length} expect-fail.`,
    );
    process.exitCode = 1;
    return;
  }

  const matched = results.filter((r) => r.ok);
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} probe ${r.n} (expect: ${r.expect}): ${r.name}`);
  }
  if (matched.length !== results.length) {
    console.error(`\n❌ ${results.length - matched.length} of ${results.length} probes did not match:`);
    for (const r of results) {
      if (!r.ok) console.error(`   probe ${r.n}: ${r.name} — ${JSON.stringify(r.detail)}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `\n✅ ${results.length}/${results.length} probes matched (${expectedPass.length} expect-pass, ` +
      `${expectedFail.length} expect-fail).`,
  );
}

// ── Entry point ────────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) {
    selftest();
    return;
  }
  if (args.includes('--check')) {
    cliCheck(args);
    return;
  }
  console.error('usage: node scripts/check-develop-ruleset-parity.mjs <--selftest|--check> [--ruleset-id <id>]');
  process.exitCode = 1;
}

main();
