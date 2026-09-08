# Pre-merge mutation-budget ruling

Status: **AUTHORIZED — narrow Tier-C gate-maintenance expansion**

The exact #270 candidate at `831e6f3746fc7cef36ce0df4b89d9f3c0c3b9e5d`
completed a green 471-assertion Chromium baseline, resolved 41 mutated sources
with zero full-suite fallbacks, and produced every one of 210 named reds. GitHub
Actions run `34277267835` failed only because the measured 1084.5 seconds exceeded
the inherited 1059.7-second mutation ceiling.

The immediately preceding #254 exact-set authority, run `34267427722`, completed
the same 210 mutations and 471 assertions in 1052.1 seconds. #270 adds no behavior
assertion, registry pair, mutation, or mutated source. The 3.1% same-set spread is
runner variance, not a product or mutation-coverage defect.

The programme owner therefore authorizes `suite-budget.json` as one additional
WP01/lane-owned Tier-C evidence artifact. Record both CI measurements and apply
the file's established `1.5213 × worst observed` floor: `1084.5 × 1.5213 =
1649.8` seconds. No other ownership or public surface expands. This intentional
process-only deviation is required to make the repository-mandated gate
deterministic; it does not alter the styles-only segmented-choice contract.

The correction must be committed to the same one-WP/one-PR branch, rerun through
all PR checks, and independently reviewed at the new exact head. A rerun of the
old ceiling is not accepted as remediation.
