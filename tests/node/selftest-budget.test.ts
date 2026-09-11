import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { computeSelftestCeilingSeconds } from '../../scripts/lib/selftest-budget.mjs';

/**
 * The mutation harness's wall-clock ceiling is now a function of arm count, not a constant
 * (#419, #408 — scripts/lib/selftest-budget.mjs). This proves the committed model, real and
 * unmodified from suite-budget.json, does what it is supposed to: accept the runner variance
 * this repository has actually measured, and reject a genuinely slower run. It runs in
 * milliseconds — the ~27-minute full mutation harness is not required to check this arithmetic,
 * only to exercise the guards and selection logic this mission does not touch.
 */

const budget = JSON.parse(readFileSync(new URL('../../suite-budget.json', import.meta.url), 'utf8'));

// Eight real CI runs on train/elements-first, byte-identical 272-mutation / 47-source inputs,
// gathered for #419/#408 (every one: "impact graph: 47 source(s), 0 full-suite fallback(s)").
const REAL_272_ARM_RUNS = [
  { run: 34561511046, seconds: 1637.2 },
  { run: 34592445070, seconds: 1645.1 },
  { run: 34595310707, seconds: 1949.7, note: 'breached the old flat 1649.8s ceiling' },
  { run: 34606532461, seconds: 1346.6 },
  { run: 34618855795, seconds: 1645.5 },
  { run: 34623594612, seconds: 1690.0, note: 'breached the old flat 1649.8s ceiling' },
  { run: 34632185898, seconds: 1627.9 },
  { run: 34637284298, seconds: 1605.3 },
];

// The `--selftest` guard self-check step from the same eight CI runs (10 entries in
// mutations.selftest.json). Only six rows: the two runs above that breached the old ceiling on
// the prior step never reached this one (CI stops the job on the failing step).
const REAL_10_ARM_RUNS = [
  { run: 34561511046, seconds: 113.8 },
  { run: 34592445070, seconds: 113.6 },
  { run: 34606532461, seconds: 103.6 },
  { run: 34618855795, seconds: 115.0 },
  { run: 34632185898, seconds: 116.3 },
  { run: 34637284298, seconds: 112.5 },
];

test('the committed model is present and shaped as this module expects', () => {
  expect(budget.selftestBudget).toBeTruthy();
  expect(typeof budget.selftestBudget.fixedSeconds).toBe('number');
  expect(typeof budget.selftestBudget.perArmSeconds).toBe('number');
  // The flat constant this model replaced must be gone, not left stale beside the new one.
  expect(budget.selftestCeilingSeconds).toBeUndefined();
});

test('every real 272-arm CI observation passes under the committed model', () => {
  const ceiling = computeSelftestCeilingSeconds(budget.selftestBudget, 272);
  for (const { run, seconds } of REAL_272_ARM_RUNS) {
    expect(seconds, `run ${run} (${seconds}s) should be under the ${ceiling}s ceiling`).toBeLessThan(ceiling);
  }
});

test('every real 10-arm guard-self-check CI observation passes under the committed model', () => {
  const ceiling = computeSelftestCeilingSeconds(budget.selftestBudget, 10);
  for (const { run, seconds } of REAL_10_ARM_RUNS) {
    expect(seconds, `run ${run} (${seconds}s) should be under the ${ceiling}s ceiling`).toBeLessThan(ceiling);
  }
});

test('the old flat 1649.8s ceiling would have rejected two of the eight real runs (the defect this replaces)', () => {
  const OLD_FLAT_CEILING = 1649.8;
  const breaches = REAL_272_ARM_RUNS.filter(({ seconds }) => seconds > OLD_FLAT_CEILING);
  expect(breaches.map((b) => b.run)).toEqual([34595310707, 34623594612]);
});

test('a synthetic 2x-worst-case total genuinely fails the new gate', () => {
  const worstReal272 = Math.max(...REAL_272_ARM_RUNS.map((r) => r.seconds));
  const ceiling = computeSelftestCeilingSeconds(budget.selftestBudget, 272);
  const syntheticSlowRun = worstReal272 * 2;
  expect(syntheticSlowRun).toBeGreaterThan(ceiling);
});

test('the ceiling scales with arm count — the corpus-growth defect (#408) cannot recur by construction', () => {
  const ceiling10 = computeSelftestCeilingSeconds(budget.selftestBudget, 10);
  const ceiling210 = computeSelftestCeilingSeconds(budget.selftestBudget, 210);
  const ceiling272 = computeSelftestCeilingSeconds(budget.selftestBudget, 272);
  expect(ceiling10).toBeLessThan(ceiling210);
  expect(ceiling210).toBeLessThan(ceiling272);
  // Growing the corpus from 210 (the count the old 1649.8s ceiling was calibrated for) to 272
  // moves the ceiling up automatically, by exactly perArmSeconds per added arm.
  const delta = ceiling272 - ceiling210;
  expect(delta).toBeCloseTo(budget.selftestBudget.perArmSeconds * (272 - 210), 6);
});

test('each fitted bucket keeps its own worst observation strictly under the ceiling, by construction', () => {
  const { fittedFrom } = budget.selftestBudget;
  const ceilingAtGuardCount = computeSelftestCeilingSeconds(budget.selftestBudget, fittedFrom.guardSelfCheckArmCount);
  const ceilingAtMainCount = computeSelftestCeilingSeconds(budget.selftestBudget, fittedFrom.mainArmCount);
  expect(fittedFrom.guardSelfCheckWorstSeconds).toBeLessThan(ceilingAtGuardCount);
  expect(fittedFrom.mainWorstSeconds).toBeLessThan(ceilingAtMainCount);
});

test('fails closed on a missing selftestBudget rather than silently passing every run', () => {
  expect(() => computeSelftestCeilingSeconds(undefined, 272)).toThrow(/missing or not an object/);
  expect(() => computeSelftestCeilingSeconds(null, 272)).toThrow(/missing or not an object/);
});

test('fails closed on a malformed field rather than computing NaN/Infinity', () => {
  expect(() => computeSelftestCeilingSeconds({ fixedSeconds: 'x', perArmSeconds: 1 }, 272)).toThrow(
    /fixedSeconds/
  );
  expect(() => computeSelftestCeilingSeconds({ fixedSeconds: 1, perArmSeconds: -1 }, 272)).toThrow(
    /perArmSeconds/
  );
  expect(() => computeSelftestCeilingSeconds({ fixedSeconds: 1, perArmSeconds: 1 }, -1)).toThrow(
    /armCount/
  );
  expect(() => computeSelftestCeilingSeconds({ fixedSeconds: 1, perArmSeconds: 1 }, 1.5)).toThrow(
    /armCount/
  );
});
