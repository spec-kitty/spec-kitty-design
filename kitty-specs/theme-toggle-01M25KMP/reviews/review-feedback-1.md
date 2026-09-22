# WP01 review feedback — cycle 1

Reviewed exact HEAD: `ab7d4d5a2d055eddf6ef09e227eb9b9062827b58`

Reviewer transport/profile: fresh read-only Codex / `reviewer-renata`

Verdict: **REJECT** — four Medium evidence gaps must be remediated before a fresh review.

## Medium findings

1. **ADR-11 public-event contract is incomplete.** `sk-theme-toggle.ts` emits
   `sk-theme-change` with `bubbles: true` and `composed: true`, but its test does not assert
   those propagation flags and `sk-theme-toggle` is absent from the SC-006/SC-007/SC-008
   subject lists and matching mutation coverage. Add discriminating once-only delivery,
   exact-detail, and bubbling/composed tests, behavior registrations, and mutations. SC-009 is
   not applicable because the event is non-cancelable and owns no preventable default action.

2. **The pre-paint bootstrap has no browser integration proof.** The current Node VM proves
   resolver parity and a documentation string proves example ordering, but no real consumer
   fixture executes the generated classic script in `<head>` before an actual stylesheet.
   Add a browser fixture/proof for valid, missing, invalid, throwing-storage, and System inputs,
   observing root state at the pre-stylesheet boundary.

3. **The legacy `MediaQueryList` path is unexercised.** Add a legacy-only fake exposing
   `addListener`/`removeListener`, then prove live System updates, leaving-System cleanup,
   disconnect cleanup, and reconnect without listener accumulation.

4. **Forced-colors proof is not discriminating for system-color deferral.** It proves the
   control remains operable, but would stay green if authored colors were forced through.
   Assert automatic forced-color adjustment and a system-controlled computed presentation so
   `forced-color-adjust: none` or equivalent authored-color forcing makes the test red.

## Low finding

- Refresh the operator log from `implementation / doing` to the real remediation lane and record
  this review cycle, exact reviewed HEAD, findings, and disposition.

## Environmental note

One attempted Playwright run was invalid because local `reuseExistingServer` attached to an
unrelated checkout's Storybook process on port 6006. Do not cite those timeouts as product
evidence. Final local browser runs must use an isolated server/port where possible; CI remains
authoritative for the repository's hard-coded-port and WebKit lanes.
