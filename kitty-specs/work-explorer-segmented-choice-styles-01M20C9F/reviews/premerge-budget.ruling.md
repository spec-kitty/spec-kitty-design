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

The same review found that the generated segmented-choice barrel falsely
attributed #270's component-specific ownership rationale to ADR-10. Because the
barrel is generated and generated output must never be hand-edited,
`scripts/build-styles-only-markup.mjs` is also added to WP01 and lane ownership
solely to encode the #270 citation at the canonical source. The generator keeps
the existing form-field exception and every other ADR-10 citation unchanged.
This narrow correction creates no new generator, export, component, or public
API surface.

The correction must be committed to the same one-WP/one-PR branch, rerun through
all PR checks, and independently reviewed at the new exact head. A rerun of the
old ceiling is not accepted as remediation.
