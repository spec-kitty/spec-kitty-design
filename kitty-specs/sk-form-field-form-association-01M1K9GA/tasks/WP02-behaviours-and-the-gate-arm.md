---
work_package_id: WP02
title: Four behaviours with a real subject, and a gate arm that cannot be evaded
dependencies:
- WP01
requirement_refs:
- FR-003
- FR-004
- FR-009
- FR-016
- NFR-004
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
- T008
- T009
phase: Phase 2 - Verification
history:
- timestamp: '2026-09-03T12:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: tests/node/config-contract.test.ts
create_intent:
- fixtures/elements-behaviour/src/sk-form-input.test.ts
- tests/browser/registered-elements.test.ts
execution_mode: code_change
owned_files:
- fixtures/elements-behaviour/src/sk-form-input.test.ts
- fixtures/elements-behaviour/tsconfig.json
- tests/browser/registered-elements.test.ts
- behaviours.json
- mutations.json
- mutations.selftest.json
- expected-parts.json
- tests/node/config-contract.test.ts
- suite-budget.json
tags: []
tracker_refs: []
---

# WP02 — SC-002…SC-005 against a real element

SC-002 through SC-005 were written **for this mission's subject** and have only ever had the
synthetic fixture. This is where they get a real one — and where FR-005, FR-006, SC-207 and
SC-208 are actually witnessed, since WP01's gates are structural.

## Subtasks

- **T005** — `fixtures/elements-behaviour/src/sk-form-input.test.ts`. Each id asserts the thing
  its criterion names, not a proxy:

  - **`[SC-002]`** — three witnesses, all proven to red under mutation: the `FormData` entry, a
    spy on `ElementInternals.prototype.setFormValue` capturing the exact value, and
    `expect(el.querySelector('[name]')).toBeNull()` ruling out **arrangement A** — which ADR-9 §4
    records as *also* passing, so without that third witness the criterion does not witness form
    association at all. Re-read the entry after a property change.
  - **`[SC-003]`** — the control's **computed accessible description**, resolved within its own
    root. `toHaveAccessibleDescription` works across the shadow boundary (a lens expected it to
    fail; it does not) and needs `"types": ["vitest/globals", "@vitest/browser/matchers"]` in
    `fixtures/elements-behaviour/tsconfig.json` or typecheck fails TS2339.
  - **`[SC-004]`** — seeded **non-empty**. `formResetCallback() { this.value = ''; }` passed the
    old assertion because the initial value was always `''`, which is both the correct restored
    value and what a blanking regression produces.
  - **`[SC-005]`** — the anchor is the **direct `formDisabledCallback` call**; "toggle" means the
    property. Measured: `setAttribute('disabled','')` and an ancestor `fieldset.disabled` both
    fire the callback and leave the mutation **inert** (the UA excludes a disabled form-associated
    element unaided); `el.disabled = true` stays observable but never fires the callback.

  **Also here, because nothing else owns them**: **SC-207** — `label` produces a *named form
  control in the accessibility tree*, via the browser lane's role/name query, explicitly not
  `querySelector('[aria-label=…]')`; **SC-208** — two instances in one form, distinct names and
  values in one `FormData`, neither adding a light-DOM id on upgrade; and a literal
  `::part(<name>)` reference per declared part, since `check-part-ratchet.mjs` scans test
  sources and WP04 owns no test file.

  **Intra-file collateral is the trap.** A lens's first `[SC-005]` test asserted the *enabled*
  FormData entry before disabling, and SC-002's mutation redded it — twice.

- **T006** — Registry and mutations: four `(id, subject)` pairs, four mutations, anchors in the
  element file.

- **T007** — **`mutations.selftest.json` in the same commit.** Its four `redTest` entries carry no
  `subject`, so `inSubject()` is vacuously true and they match their id in *any* file. The moment
  this WP's file carries `[SC-002]`, the syntax-error probe stops producing an absent named test
  — measured `❌ guard4-syntax-error expected "absent", got "green"`, 1 of 8 failing. Adding
  `"subject": "fixtures/elements-behaviour/src/behaviours.test.ts"` to those entries restores 8/8.
  (Three carry `SC-002`; `guard5-inverted-collateral` carries `SC-006` — all four need it.)

- **T008** — The FR-009 arm in `config-contract.test.ts`: *any element declaring
  `static formAssociated` must be a subject of SC-002…SC-005.*

  **Manifest-derived, keyed on the member NAME.** Source-text sees nothing when the flag is
  inherited; `hasOwnProperty` is `false` on the subclass; `default === "true"` is evaded by
  `static get formAssociated()`. Post-hoc assignment evades the manifest entirely, so
  `tests/browser/registered-elements.test.ts` asserts
  `customElements.get(tag).formAssociated === true` for **every** registered tag — runtime truth
  is the only unevadable source and the node lane has no `customElements`. That file is named
  here because a per-element subject file is the wrong home for an all-tags loop.

  **Red-first proof required**, including that moving the declaration to a superclass still reds
  it. A declared-but-unbacked arm is worse than none.

- **T009** — **`suite-budget.json` and the SC-013 decision, together.** If these elements become
  SC-013 subjects — which `spec.md` forces by moving `expected-parts.json` in the same PR, and
  which the `sk-card`/`sk-nav-pill` precedent establishes — then guard 7 requires a mutation per
  pair and the totals are **29 → 39 mutations, 23 → 33 pairs**, not the 37/31 an earlier draft
  planned. Decide it explicitly here and reconcile the numbers, or record why the parts ratchet
  without SC-013 subjecthood is compatible with the spec.

  Measure the ceiling **on this commit**: it asserts at the end of every run and is wired into
  CI, so it reds at whichever commit pushes the set over. Local reference: 29/39 = 57.2s;
  a 37-mutation prototype = 80.7s, chromium-only (the harness spawns vitest with `CI: ''`). The
  25s `ceilingSeconds` is a **different** measurement — `npm run test`, both lanes, two browsers
  — kept separate so a regression can be attributed.

## Definition of Done

- `npx vitest run` green, 0 skipped, both lanes non-empty.
- `node scripts/suite-selftest.mjs` green at the reconciled count, every mutation named-red, no
  collateral. `--selftest` **8/8**.
- The FR-009 arm reds when the flag moves to a superclass — demonstrated, not argued.
- `check-part-ratchet.mjs` green at the count `expected-parts.json` declares.
