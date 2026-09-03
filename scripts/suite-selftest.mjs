#!/usr/bin/env node
/**
 * The mutation harness (#71, FR-008, NFR-002).
 *
 * ADR-11 Confirmation #1 demands red-first *demonstrated, not asserted*. "Committed
 * evidence" is satisfied by a commit message containing a paste — which is exactly how
 * #70's NFR-003 degraded. This re-derives the red on every CI run.
 *
 * For each entry in mutations.json: copy the repo to a temp dir (node_modules SYMLINKED —
 * it is 1.2 GB and this runs fifteen times), apply one string replacement, run the suite,
 * and assert the NAMED test failed while every other behaviour test survived.
 *
 * EIGHT numbered guards plus a not-green-baseline check, each of which exists because it
 * was demonstrated failing during the post-plan spike. Guard 4 is the one that will
 * actually fire. (An earlier docstring said TEN, and said the self-check file held ten
 * entries when it held seven — stale numbers in prose, in the harness whose thesis is that
 * exactly that goes unnoticed. A pre-merge lens counted them.)
 *
 * Usage: node scripts/suite-selftest.mjs [--selftest]
 *   --selftest runs mutations.selftest.json: deliberately-bad entries, each of which must be
 *   REJECTED by the guard it NAMES — rejection by a different guard is a failure, because it
 *   means the guard under test never ran. Without this the harness re-derives the mutations
 *   while nothing re-derives the guards.
 *
 *   The list must cover every verdict this script can emit; that is asserted below. Note the
 *   honest limit: EMITTABLE is a hand-maintained literal, so a NEW verdict string added
 *   without touching it is still unexercised — the assertion catches a missing entry for a
 *   KNOWN verdict, not a new one. Guards 6, 7 and 8 exit before the loop and have no entry
 *   at all; guard 7 is disabled in selftest mode because the ids there name guards, not
 *   behaviours, which is defensible but means it is unproven here.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const selftestMode = process.argv.includes('--selftest');
const LIST = selftestMode ? 'mutations.selftest.json' : 'mutations.json';
const repo = process.cwd();

const list = JSON.parse(readFileSync(LIST, 'utf8'));
const mutations = list.mutations ?? [];
// APPLICABLE behaviours only, matching floor-reporter.mjs:121.
//
// The two consumers of behaviours.json disagreed about what `applicable` means: the floor
// reporter has always filtered on it, and this file did not — so a behaviour declared
// inapplicable satisfied the reporter and then failed guard 7 here, demanding a mutation for a
// behaviour that by definition has no test to mutate. #75 WP04 surfaced it by declaring SC-016
// (generation determinism) inapplicable; the disagreement predates that and would have bitten
// whoever used the flag first.
//
// `applicable: false` is not an escape hatch: config-contract.test.ts asserts the applicable set
// equals ADR-11's list exactly, so an entry cannot be quietly demoted to dodge a mutation, and
// the same test asserts SC-016 is present and carries a reason.
const registry = JSON.parse(readFileSync('behaviours.json', 'utf8')).behaviours.filter(
  (b) => b.applicable !== false
);
const behaviours = registry.map((b) => b.id);
/** Every (behaviour, subject) pair the registry declares. Guard 7 compares against these. */
const behaviourPairs = registry.flatMap((b) =>
  (b.subjects ?? [{ file: null }]).map((s) => `${b.id}@${s.file ?? '*'}`)
);

/**
 * Every verdict this script can emit must have a self-check entry.
 *
 * Guards 6, 7, 8 and guard 5's inverted arm had none, and guard 7 was additionally disabled
 * in selftest mode — so the guard binding the two registries was the one guard the
 * self-check provably never exercised. Asserting the SET closes the class: adding a guard
 * without a self-check entry now fails here rather than being noticed by a reader.
 */
const EMITTABLE = ['pattern', 'ambiguous', 'noop', 'absent', 'green', 'collateral'];
if (selftestMode) {
  const covered = new Set(mutations.map((m) => m.expectRejectedBy));
  const missing = EMITTABLE.filter((v) => !covered.has(v));
  if (missing.length) {
    console.error(`❌ ${LIST} has no entry exercising: ${missing.join(', ')}`);
    console.error('   Every verdict this harness can emit needs one, or the guard is unproven.');
    process.exit(1);
  }
}

/** Guard 8 — an empty list makes the loop body never run and prints "all mutations red". */
if (mutations.length === 0) {
  console.error(`❌ ${LIST} declares no mutations — refusing to report green over an empty set.`);
  process.exit(1);
}

/** Guard 7 — ids ⊇ behaviours, and every mutation names a known behaviour. */
if (!selftestMode) {
  const ids = new Set(mutations.map((m) => `${m.id}@${m.subject ?? '*'}`));
  const uncovered = behaviourPairs.filter((b) => !ids.has(b));
  const unknown = [...ids].filter((i) => !behaviourPairs.includes(i));
  if (uncovered.length || unknown.length) {
    console.error('❌ mutations.json and behaviours.json disagree:');
    for (const b of uncovered) console.error(`   behaviour ${b} has no mutation — its red-first claim is unproven`);
    for (const i of unknown) console.error(`   mutation ${i} names no declared behaviour`);
    process.exit(1);
  }
}

function runSuite(dir, project) {
  try {
    const out = execFileSync('npx', ['vitest', 'run', '--project', project, '--reporter=json'], {
      cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '' },
    });
    return JSON.parse(out.slice(out.indexOf('{')));
  } catch (err) {
    const out = String(err.stdout ?? '');
    const i = out.indexOf('{');
    if (i < 0) return { testResults: [], __noReport: true, __stderr: String(err.stderr ?? '').slice(-800) };
    try { return JSON.parse(out.slice(i)); } catch { return { testResults: [], __noReport: true }; }
  }
}

/** Every assertion in the report, flattened. */
// The module FILE travels with each test. Behaviour ids are no longer unique across the
// suite — `sk-nav-pill` and the synthetic fixture both carry [SC-006] — so an id-only match
// would let a mutation red the fixture's test and be credited for the element's.
const allTests = (report) =>
  (report.testResults ?? []).flatMap((f) => (f.assertionResults ?? []).map((a) => ({
    name: a.fullName ?? a.title ?? '', status: a.status, file: f.name ?? '',
  })));

function prepare() {
  const dir = mkdtempSync(join(tmpdir(), 'suite-selftest-'));
  for (const entry of ['fixtures', 'packages', 'scripts', 'tests', 'vitest.config.mts',
                       'behaviours.json', 'package.json', 'tsconfig.base.json', 'tsconfig.json']) {
    if (existsSync(join(repo, entry))) cpSync(join(repo, entry), join(dir, entry), { recursive: true });
  }
  // SYMLINKED, never copied: node_modules is 1.2 GB and this runs once per mutation.
  symlinkSync(join(repo, 'node_modules'), join(dir, 'node_modules'), 'dir');
  return dir;
}

const budget = JSON.parse(readFileSync('suite-budget.json', 'utf8'));
const harnessStarted = Date.now();

let failures = 0;
const report = (ok, id, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${String(id).padEnd(26)} ${msg}`);
};

// ── Baseline ────────────────────────────────────────────────────────────────────────
const baseDir = prepare();
const baseline = runSuite(baseDir, 'browser');
const baseTests = allTests(baseline);
/** Guard 6 — a zero-test run reports "passed". Executed count, not exit code. */
if (baseTests.length === 0) {
  console.error('❌ baseline executed 0 tests — a zero-test lane reports passed, so exit code proves nothing.');
  rmSync(baseDir, { recursive: true, force: true });
  process.exit(1);
}
if (baseTests.some((t) => t.status === 'failed')) {
  console.error('❌ baseline is not green; fix the suite before trusting any mutation.');
  rmSync(baseDir, { recursive: true, force: true });
  process.exit(1);
}
rmSync(baseDir, { recursive: true, force: true });
console.log(`baseline: ${baseTests.length} test(s), all passing\n`);

// ── Mutations ───────────────────────────────────────────────────────────────────────
for (const m of mutations) {
  const expectGuard = m.expectRejectedBy; // selftest mode only
  const dir = prepare();
  const target = join(dir, m.file);
  let verdict = null;

  try {
    const before = existsSync(target) ? readFileSync(target, 'utf8') : null;

    if (before === null) {
      verdict = ['pattern', `file not found: ${m.file}`];
    } else {
      const occurrences = before.split(m.from).length - 1;
      /** Guard 1 — a mutation that applies nothing leaves the test green. */
      if (occurrences === 0) verdict = ['pattern', `PATTERN NOT FOUND — the mutation would apply nothing`];
      /** Guard 2 — String.replace(string) replaces only the first occurrence. */
      else if (occurrences > 1) verdict = ['ambiguous', `pattern occurs ${occurrences}× — replace() would change only the first`];
      else {
        const after = before.replace(m.from, m.to);
        /** Guard 3 — a replacement that changes nothing. */
        if (after === before) verdict = ['noop', 'replacement is a no-op'];
        else {
          writeFileSync(target, after);
          const res = runSuite(dir, 'browser');
          const tests = allTests(res);
          // In --selftest mode the id names a GUARD, not a behaviour, so there is no
          // "named test" to find. The entry declares which behaviour test it should red
          // via `redTest`, so guards 4 and 5 can still be exercised honestly.
          const key = selftestMode ? (m.redTest ?? '__none__') : m.id;
          // `subject` narrows the match to one test file. Optional: entries predating the
          // subject dimension match on the id alone, exactly as before.
          const inSubject = (t) => !m.subject || t.file.endsWith(m.subject);
          const isNamed = (t) => t.name.includes(`[${key}]`) && inSubject(t);
          const named = tests.filter(isNamed);
          const others = tests.filter((t) => !isNamed(t) && /\[SC-\d+\]/.test(t.name));

          /** Guard 4 — THE ONE THAT FIRES. A syntax-breaking mutation exits non-zero with
           *  the named test ABSENT from the report; an exit-code assertion reads that as
           *  success. Require the named test to be PRESENT and FAILED. */
          const where = m.subject ? `[${key}] in ${m.subject}` : `[${key}]`;
          if (named.length === 0) verdict = ['absent', `named test ${where} is ABSENT from the report — red for the wrong reason`];
          else if (!named.some((t) => t.status === 'failed')) verdict = ['green', `named test ${where} still PASSED — the mutation is semantically inert`];
          /** Guard 5 — collateral bound: the mutation must be surgical.
           *
           * A mutation may DECLARE broad collateral (`expectCollateral`), for a subject
           * whose blast radius is inherently wide — a compiler flag, say. That is not an
           * exemption: the guard INVERTS, and the harness then requires other tests to
           * fail. A declared expectation that does not hold is still a failure. */
          else {
            const collateral = others.filter((t) => t.status === 'failed');
            if (m.expectCollateral && collateral.length === 0)
              verdict = ['collateral', `declared expectCollateral but no other behaviour test failed — the mutation is narrower than claimed`];
            else if (!m.expectCollateral && collateral.length > 0)
              verdict = ['collateral', `other behaviour test(s) also failed: ${collateral.map((t) => t.name.match(/\[SC-\d+\]/)?.[0]).join(' ')}`];
          }
        }
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  if (selftestMode) {
    // Each bad entry must be rejected BY THE GUARD IT NAMES — not merely rejected.
    const got = verdict?.[0] ?? null;
    report(got === expectGuard, m.id, got === expectGuard
      ? `rejected by guard "${expectGuard}" as expected`
      : `expected rejection by "${expectGuard}", got ${got ? `"${got}"` : 'ACCEPTED'}`);
  } else {
    report(!verdict, m.id, verdict ? verdict[1] : `${m.arm} — named test went red, no collateral`);
  }
}

if (failures) {
  console.error(`\n❌ ${failures} of ${mutations.length} ${selftestMode ? 'guard self-check' : 'mutation'}(s) did not behave as specified.`);
  process.exit(1);
}
const elapsed = Math.round(((Date.now() - harnessStarted) / 1000) * 10) / 10;
console.log(
  `\n✅ All ${mutations.length} ${selftestMode ? 'guard self-checks passed' : 'mutations produced their named red, with a green baseline'}.` +
    `  (${elapsed}s, ceiling ${budget.selftestCeilingSeconds}s)`
);
// The harness runs one full suite per mutation and is where this job's time actually goes.
// `selftestCeilingSeconds` was described in suite-budget.json as an enforced ceiling and was
// read by nothing — an inert key documented as a gate, which is the class this mission
// exists to close, introduced by its own fold. Found at the second gate pass.
if (elapsed > budget.selftestCeilingSeconds) {
  console.error(
    `❌ the harness took ${elapsed}s, over its committed ceiling of ${budget.selftestCeilingSeconds}s.\n` +
      `   Raise it deliberately in suite-budget.json with the run that justifies it.`
  );
  process.exit(1);
}
