---
affected_files: []
cycle_number: 1
mission_slug: work-package-view-pattern-stories-01M1YNPC
reproduction_command:
reviewed_at: '2026-09-07T22:37:44Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — Reviewer Renata

Exact implementation tree reviewed: `b6f5aaded1135feb8443942a8358d8a7645a01cf`.

## Finding 1

- Severity: HIGH
- File: `apps/storybook/src/tests/sk-work-package-view-patterns.spec.ts:237`
- File: `apps/storybook/src/tests/sk-work-package-view-patterns.spec.ts:345`
- Explanation: The focused suite does not execute the binding keyboard walkthrough. The narrow selector case uses Playwright `selectOption()`, which bypasses native keyboard/typeahead behavior, while the containment case calls `focus()` directly on isolated targets. There is no sequential Tab traversal through the overview controls or the detail breadcrumb/content path, no assertion of the exact focus-stop sequence, and no composition-level proof that passive check bullets or shadow descendants do not introduce duplicate stops. This leaves issue #214 FR-015, NFR-004, and SC-006 without the required executable evidence across Chromium, Firefox, and WebKit.
- Recommendation: Add red-first focused Playwright coverage that starts from the document/body and advances by keyboard through the expected overview and detail focus sequence in all three engines. Assert each expected active element, absence of unintended stops, and visible/non-clipped focus geometry. Operate the native lane select by keyboard/typeahead rather than `selectOption()`, assert exactly one lane-choice intent, and confirm controlled visible/selected inputs do not mutate until rerendered.
- Disposition: must_fix_before_approval

## Finding 2

- Severity: HIGH
- File: `apps/storybook/src/tests/sk-work-package-view-patterns.spec.ts:345`
- Explanation: The test titled `desktop, equivalent 200%-zoom width, and narrow views...` substitutes a 640px viewport for a 1280px route at 200% browser zoom. It never changes browser zoom, verifies the CSS viewport/device-scale transition at a fixed physical width, or measures the composed route under actual 200% zoom. Issue #214 and SC-007 explicitly require evidence at `200% browser zoom`; equivalent viewport emulation alone does not establish that gate.
- Recommendation: Record exact-head 100%→200% browser-zoom evidence with the established repository procedure at fixed physical width (or add an equally non-vacuous automated seam). Verify the expected CSS viewport/device-scale transition, zero document-level horizontal overflow, locally reachable board/code overflow, and unclipped focus at 200%, for representative T10 and T11 route states. Keep the existing desktop/narrow viewport cases as complementary coverage.
- Disposition: must_fix_before_approval

## Reviewed concern dispositions

- Separate base-eight and scale-fifty arrays: accepted. Both are fixture-owned within the one recursively frozen root graph; selectors consume supplied records and do not fabricate records.
- Controlled default selection outside the root fixture: accepted. `meta.args` is explicit Storybook consumer input and both theme stories share it; activation does not mutate it.
- CI-Ubuntu visual provenance: accepted. Exactly 19 new #214 PNGs were added, their SHA-256 multiset matches the first CI artifact byte-for-byte, every image was visually inspected, and no legacy PNG changed.

## WP anti-pattern checklist

1. Dead code: PASS — every new exported story helper is called by the discovered Storybook module/renderers and excluded from CSF story indexing.
2. Synthetic-fixture test: PASS — the focused suite exercises built Storybook output and native/public behavior; source-string checks are supplemental.
3. Silent empty return: PASS — no new silent empty return or catch-and-pass production path.
4. FR coverage: FAIL — FR-015 and its NFR/SC keyboard evidence are incomplete (Finding 1).
5. Frozen surface: PASS — no prohibited generated/public element/token surface or legacy visual baseline was modified.
6. Locked decision: PASS — no forbidden page element, router/state/fetch/timer/parser/trust inference, shadow reach-through, or copied component CSS was found.
7. Shared-file ownership: N/A — the mission has one WP and the shared Storybook files are explicitly WP01-owned.
8. Production fragility: PASS — selector throws are deterministic, documented fail-closed validation of invalid fixture identifiers.
