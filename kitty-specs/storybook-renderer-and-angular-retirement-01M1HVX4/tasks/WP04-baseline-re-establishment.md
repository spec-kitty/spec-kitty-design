---
work_package_id: WP04
title: Re-establish the visual baseline set
dependencies:
- WP03
requirement_refs:
- FR-009
- C-004
planning_base_branch: mission/storybook-renderer-and-angular-retirement
merge_target_branch: mission/storybook-renderer-and-angular-retirement
branch_strategy: Planning artifacts for this mission were generated on mission/storybook-renderer-and-angular-retirement. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/storybook-renderer-and-angular-retirement unless the human explicitly redirects the landing branch.
subtasks:
- T011
- T012
- T013
phase: Phase 4 - Baselines
history:
- timestamp: '2026-09-02T20:20:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: apps/storybook/src/tests/
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/**
tags: []
tracker_refs: []
---

# Work Package Prompt: WP04 – Re-establish the visual baseline set

Implements IC-04.

## Context

`apps/storybook/src/tests/visual.spec.ts-snapshots/` holds **7** baselines; **4** are Angular-keyed and die with the Angular stories. ADR-13 is explicit that the remaining 3 should be **re-shot rather than assumed stable**, because Vite and webpack can differ on CSS injection order.

## Subtasks

- **T011** — Remove the 4 Angular-keyed baseline PNGs **and the four test bodies that assert them** — `visual.spec.ts:25-33, 40-45, 52-62`, which navigate to `…-angular--…` story ids. Deleting only the PNGs leaves four tests that hang on a 20s `waitForSelector` and fail (FR-009).
- **T011b** — **Add `waitForSelector` to the three HTML tests** (`visual.spec.ts:35-38, 47-50, 64-67`) before re-shooting. They currently screenshot after `waitForLoadState('domcontentloaded')` alone — the file says at `:21-23` that this is exactly why the blank frames went unnoticed. Re-shooting without this races the Vite mount and can re-commit a blank PNG that then passes forever.
- **T012** — Re-shoot the remaining 3 under the new builder, with `CI=1` or a freshly-killed port 6006 (`playwright.config.ts:16` sets `reuseExistingServer: !CI` against a hardcoded port, so a local re-shoot can silently screenshot a *stale* `storybook-static`).

  **The diff logic here is inverted from the usual case and the earlier draft had it backwards.** All three surviving baselines are the *same blank frame*:

  ```
  f642335856be21c8fb251d2dce35c383  4257  sk-feature-card-html-default-chromium-linux.png
  f642335856be21c8fb251d2dce35c383  4257  sk-ribbon-card-html-with-ribbon-chromium-linux.png
  f642335856be21c8fb251d2dce35c383  4257  sk-stub-html-default-chromium-linux.png
  ```

  Three different components, one identical image — because the gate skipped these stories and the tests never waited for a mount (`visual.spec.ts:5-23`, tracked as **#88**). So a **no-diff is the failure signal**; these must change from blank to real content. Explain any baseline that does *not* change.
- **T013** — *(deleted — it instructed applying a rule to an empty set; no `LightMode` baseline exists. C-004's disposition is stated at mission level in `plan.md`'s Charter Check and must be repeated in the PR.)*

## The `LightMode` constraint (C-004)

**OPERATOR DECISION (2026-09-02): `LightMode` is scoped OUT of this mission. #93 owns it.** Do not certify "LightMode intact"; do not fix the selector here. State the exclusion explicitly in the PR. Ledger: `DM-01M1HXC6WQC90NK940WN2BXR9K`.

**Scope note, verified in this checkout: there is no `LightMode` baseline.** The 7 files are `sk-feature-card-{angular,html}-default`, `sk-ribbon-card-angular-default`, `sk-ribbon-card-{angular,html}-with-ribbon`, and `sk-stub-{angular,html}-default`. The 4 to retire are the `-angular-` ones; the 3 survivors are `sk-feature-card-html-default`, `sk-ribbon-card-html-with-ribbon`, `sk-stub-html-default`.

So C-004 does **not** bite on the baseline set. It bites on the mission's **exit criterion** — #69 requires "`LightMode` variants intact", and that is what must not be certified while #93 is open. If a `LightMode` baseline is ever added, the rule below applies to it.

**Do not re-shoot a `LightMode` baseline while #93 is open, and do not certify "LightMode intact" on the strength of a green visual suite that contains no LightMode baseline at all.**

ADR-13's confirmation #3 requires `LightMode` variants to "render correctly with `data-theme="light"` reaching the component". #93 reports that every `LightMode` story renders **dark**, because the selector is `:root[data-theme="light"]` and `:root` only matches `<html>`, while the stories set the attribute on a wrapping `<div>`. ADR-13's own spike saw a `color-contrast` violation on `LightMode` and called it pre-existing.

Re-shooting would freeze that defect into the reference set — the opposite of what FR-009 is for. The operator has now decided this: `LightMode` is out of scope for #69 and #93 owns the fix.

## Definition of Done

- [ ] No baseline exists without a live story (FR-009).
- [ ] Every retained baseline was re-shot under the new builder, not carried across — say so per baseline.
- [ ] The three new PNGs have **three distinct md5s**, none equal to `f642335856be21c8fb251d2dce35c383`. A repeat of that hash means a blank frame was re-committed.
- [ ] The four Angular test bodies and the Angular smoke test are gone; the Playwright suite passes.
- [ ] Every diff is explained; none silently accepted.
- [ ] The PR states explicitly that `LightMode` is **excluded** from this mission's exit criteria per the operator decision, that #93 remains open, and that ADR-13 confirmation #3 is therefore not claimed. A green visual suite must not be presented as evidence of `LightMode` correctness.
