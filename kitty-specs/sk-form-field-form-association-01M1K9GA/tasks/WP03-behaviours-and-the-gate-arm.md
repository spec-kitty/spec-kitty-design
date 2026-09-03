---
work_package_id: WP03
title: Four behaviours with a real subject, and a gate arm that cannot be evaded
dependencies:
- WP02
requirement_refs:
- FR-003
- FR-004
- FR-009
- FR-016
planning_base_branch: mission/sk-form-field-form-association
merge_target_branch: mission/sk-form-field-form-association
branch_strategy: Planning artifacts for this mission were generated on mission/sk-form-field-form-association. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/sk-form-field-form-association unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
- T010
phase: Phase 3 - Verification
history:
- timestamp: '2026-09-03T11:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: tests/node/config-contract.test.ts
create_intent:
- fixtures/elements-behaviour/src/sk-form-input.test.ts
execution_mode: code_change
owned_files:
- fixtures/elements-behaviour/src/sk-form-input.test.ts
- fixtures/elements-behaviour/tsconfig.json
- behaviours.json
- mutations.json
- mutations.selftest.json
- tests/node/config-contract.test.ts
- suite-budget.json
tags: []
tracker_refs: []
---

# WP03 — SC-002…SC-005 against a real element

SC-002 through SC-005 were written **for this mission's subject** and have only ever had the
synthetic fixture. This is where they get a real one.

## Subtasks

- **T007** — `fixtures/elements-behaviour/src/sk-form-input.test.ts`, four ids, each asserting the
  thing its criterion names rather than a proxy for it:

  - **`[SC-002]`** — the value arrives through `internals.setFormValue`, not merely in the
    `FormData`. Three witnesses are available and a lens verified all three red under mutation:
    the FormData entry, a spy on `ElementInternals.prototype.setFormValue` capturing the exact
    value, and `expect(el.querySelector('[name]')).toBeNull()` ruling out arrangement A — which
    ADR-9 §4 records as *also* passing, so without that third witness the criterion does not
    witness form association at all. Re-read the entry after a property change.
  - **`[SC-003]`** — the message is the control's **computed accessible description**, resolved
    within its own root. `toHaveAccessibleDescription` works across the shadow boundary (a lens
    expected it to fail and it does not) — it needs
    `"types": ["vitest/globals", "@vitest/browser/matchers"]` in
    `fixtures/elements-behaviour/tsconfig.json` or typecheck fails TS2339.
  - **`[SC-004]`** — seeded **non-empty**. The repo has already paid for this once:
    `formResetCallback() { this.value = ''; }` passed the old assertion because the initial value
    was always `''`, which is both the correct restored value and what any blanking regression
    produces.
  - **`[SC-005]`** — the anchor is the **direct `formDisabledCallback` call**, and "toggle" means
    the property. Measured: `setAttribute('disabled','')` and an ancestor `fieldset.disabled`
    both fire the callback and leave the mutation **inert**, because the UA excludes a disabled
    form-associated element unaided; `el.disabled = true` keeps it observable but does not fire
    the callback at all.

  **Intra-file collateral is the trap here.** A lens's first `[SC-005]` test asserted the *enabled*
  FormData entry before disabling, and SC-002's mutation redded it — twice. Each test depends only
  on its own behaviour.

- **T008** — Registry and mutations: four `(id, subject)` pairs, four mutations, anchors in the
  element file (not the base — see WP02 T004).

- **T009** — **`mutations.selftest.json` in the same commit.** Its `guard4`/`guard5` entries carry
  `redTest` but no `subject`, so `inSubject()` is vacuously true and they match `[SC-002]` in
  *any* file. The moment this WP's file carries `[SC-002]`, the syntax-error probe stops producing
  an absent named test — measured `❌ guard4-syntax-error expected "absent", got "green"`, 1 of 8
  self-checks failing on a pristine tree plus these tests. Adding
  `"subject": "fixtures/elements-behaviour/src/behaviours.test.ts"` to the four `redTest` entries
  restores 8/8. This is an ENFORCED CI step and the first draft of the plan did not name it.

- **T010** — The FR-009 arm in `config-contract.test.ts`: *any element declaring
  `static formAssociated` must be a subject of SC-002, SC-003, SC-004 and SC-005.*

  **Manifest-derived, keyed on the member NAME.** A source-text regex sees nothing when the flag
  is inherited; `hasOwnProperty` is `false` on the subclass (both measured). Keying on
  `default === "true"` is evaded by `static get formAssociated()`, which records the member with
  no `default`. Post-hoc assignment
  (`(SkFormInput as …).formAssociated = true`) evades the manifest entirely, so a browser-lane
  companion asserts `customElements.get(tag).formAssociated === true` for every registered tag —
  runtime truth is the only unevadable source, and the node lane has no `customElements`.

  **Red-first proof required**, and specifically the proof that moving the declaration to a
  superclass still reds it. A declared-but-unbacked arm is worse than none.

- **T010b** — `suite-budget.json`, measured on **this** commit, not at the end of the mission: the
  ceiling asserts at the end of every run and is wired into CI, so it reds at whichever commit
  pushes the set over. Local reference: 29 mutations / 39 tests = 57.2s; a 37/47 prototype = 80.7s,
  chromium-only (the harness spawns vitest with `CI: ''`). The 25s `ceilingSeconds` is a
  *different* measurement — `npm run test`, both lanes, two browsers under CI — and the two are
  kept separate so a regression can be attributed.

## Definition of Done

- `npx vitest run` green, 0 skipped; the floor reports both lanes non-empty.
- `node scripts/suite-selftest.mjs` green at the new count, every mutation named, no collateral.
- `node scripts/suite-selftest.mjs --selftest` **8/8**.
- The FR-009 arm reds when the flag moves to a superclass, demonstrated.
