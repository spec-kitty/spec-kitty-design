/**
 * The mutation harness's wall-clock ceiling, as a function of arm count (#419, #408).
 *
 * `selftestCeilingSeconds` used to be a flat number. It was raised five times — 180 → 240 →
 * 360 → 560 → 881.9 → 1405.5 → 1649.8s — and every raise was re-breached, because a flat
 * ceiling cannot survive corpus growth: total elapsed scales with arm count and the ceiling
 * does not, so the gate reds by construction whenever the corpus grows past whichever count it
 * was last calibrated for (#408). #419 additionally measured that the same 272-arm corpus, on
 * byte-identical inputs, spans 1346.6s–1949.7s across eight real CI runs — a 603s/44.8% spread
 * that straddles any single flat number, independent of growth.
 *
 * This module computes the ceiling as `fixedSeconds + perArmSeconds × armCount` instead, so it
 * scales with the corpus automatically. `fixedSeconds` is the harness's baseline-suite-run
 * overhead (paid once, not per arm); `perArmSeconds` is the marginal cost of one more mutation
 * arm. Both are fit in `suite-budget.json`'s `selftestBudget` object from real CI data at the
 * harness's two real invocations (the 10-arm `--selftest` guard-check and the full-corpus main
 * run) — see that file's `$comment` history for the derivation and its two-point-extrapolation
 * caveat.
 *
 * Deliberately pure and side-effect free: no I/O, no process access, so it can be tested in
 * milliseconds instead of the ~27 minutes a full mutation run costs (#419's report explicitly
 * asks for a gate that can be proven to fail without needing that).
 */

/**
 * @param {unknown} selftestBudget the `suite-budget.json#selftestBudget` object.
 * @param {number} armCount `mutations.length` for the run being checked.
 * @returns {number} the ceiling in seconds.
 * @throws {Error} if `selftestBudget` is missing or malformed, or `armCount` is not a positive
 *   integer — fail closed rather than silently passing every run (#334's `missingBehaviourSubjects`
 *   class of defect, applied here: an unchecked shape assumption becomes a gate that never fires).
 */
export function computeSelftestCeilingSeconds(selftestBudget, armCount) {
  if (selftestBudget === null || typeof selftestBudget !== 'object') {
    throw new Error(
      'suite-budget.json#selftestBudget is missing or not an object — refusing to compute a ceiling.'
    );
  }
  const { fixedSeconds, perArmSeconds } = selftestBudget;
  for (const [name, value] of [['fixedSeconds', fixedSeconds], ['perArmSeconds', perArmSeconds]]) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(
        `suite-budget.json#selftestBudget.${name} is ${JSON.stringify(value)} — ` +
          'expected a finite number >= 0.'
      );
    }
  }
  if (!Number.isInteger(armCount) || armCount < 0) {
    throw new Error(`armCount must be a non-negative integer, got ${JSON.stringify(armCount)}.`);
  }
  return fixedSeconds + perArmSeconds * armCount;
}
