---
work_package_id: WP01
title: The manifest is consumer documentation now — make it worth reading
dependencies: []
requirement_refs:
- FR-007
planning_base_branch: mission/react-wrapper-generation
merge_target_branch: mission/react-wrapper-generation
branch_strategy: Planning artifacts for this mission were generated on mission/react-wrapper-generation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/react-wrapper-generation unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - Input
history:
- timestamp: '2026-09-03T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/custom-elements.json
create_intent: []
execution_mode: code_change
owned_files:
- packages/elements/src/card/sk-card.ts
- packages/elements/src/nav-pill/sk-nav-pill.ts
- packages/elements/src/form-input/sk-form-input.ts
- packages/elements/src/form-textarea/sk-form-textarea.ts
- packages/elements/src/form-control-base.ts
- packages/elements/custom-elements.json
tags: []
tracker_refs: []
---

# WP01 — The manifest is the generator's only input, and it is now consumer documentation

Sequenced FIRST because fixing it changes every generated file downstream.

**This WP does not depend on the generator, and must not.** The post-tasks squad found the
first draft declared `dependencies: []` while its Definition of Done grepped output only WP02
produces — circular, and unclosable without a throwaway generator nobody reviews. Every
criterion below is therefore asserted **against the manifest**, which is the better gate anyway:
it survives SC-305 concluding that no wrapper package ships at all.

## Subtasks

- **T001** — **Give the attributes descriptions. Read this before estimating it.**

  A lens measured the actual path and the obvious plan does not work:

  * The generator reads **`attributes[].description`**, not `members[].description`.
  * The analyzer propagates a field's JSDoc onto its attribute **only for own fields, never
    inherited ones**.
  * So **16 of the 24** `/** undefined */` blocks are backed by fields that already carry
    JSDoc, on `FormControlBase`. `invalid` has a 173-character description and still renders
    `/** undefined */`.

  Writing one line per property on the base class clears **8 of 24**. The remaining 16 need a
  redeclaration in each subclass carrying duplicate prose — three files, nothing syncing them.

  **That is a standing-cost decision and it is FORKED to the operator on #75.** Do T001's
  unambiguous half now: the 8 own-field attributes (`placeholder`, `type`, `rows`, `inset`,
  `variant`, `sk-nav-pill`'s `label` and `open`). Hold the 16 until the fork is answered.
  Do not silently soften the criterion to match whichever half got done — that is the move this
  programme keeps catching.

- **T002** — **Move published rationale out of `/** */`. Four members, not two, and the one the
  first draft named was the wrong one.**

  | member | line | chars | reaches |
  |---|---:|---:|---|
  | `error` | `form-control-base.ts:97` | 303 | prop docs |
  | `setCustomError` | `:110` | 809 | class-level `## Methods` bullet |
  | `invalid` | — | 173 | manifest → IDE hovers |
  | `errorMessage` | — | 206 | manifest → IDE hovers |

  The first draft quoted *"a lens found the only lever a consumer HAD…"* as the `error` prop's
  documentation. It is `setCustomError`'s. Editing the member the draft named would have left
  the quoted text in place.

  Note the convention claim honestly while you are in there: `//`-for-rationale is real and is
  held to in the five element files, but `form-control-base.ts` is **9 blocks for 9**. It is one
  non-compliant file, not two slips.

- **T003** — **`sk-card` declares no `@slot` and renders one.** Add it.

  The spec's fact-1 paragraph has been corrected: a lens injected the slot into the manifest and
  regenerated — the only diff is six lines of class-level JSDoc, because `children` comes from
  `Pick<React.AllHTMLAttributes<HTMLElement>, "children" | …>` either way. **Zero type
  consequence.** FR-007's own text never claimed one and needs no edit; the sentence that was
  wrong was in §"What the manifest actually contains today", and it is already fixed.

- **T004 (NEW) — Type the event in the JSDoc. One line, and it closes S3 end-to-end.**

  ```
  @fires {CustomEvent<{ open: boolean }>} sk-nav-pill-toggle - …
  ```

  `sk-nav-pill.ts:42` has no `{Type}`, so the manifest carries `type: None`, so the wrapper emits
  `onSkNavPillToggle?: (event: CustomEvent) => void` and drops the documented
  `detail: { open: boolean }`. A lens verified the whole chain: the analyzer honours
  `@fires {Type}`, and the generator honours `events[].type.text`.

  This inverts the plan's sharpest finding. The lost event typing was **our JSDoc**, not the
  generator's limit — which matters for SC-305, because it removes the strongest argument that
  an off-the-shelf wrapper is inadequate.

  **Do not reach for `stronglyTypedEvents: true`.** Measured: it emits
  `TypedEvent<SkNavPillElement, E = Event>`, typing `.target` while downgrading the parameter
  from `CustomEvent` to `Event`. Worse than the default.

## Definition of Done

Asserted against `packages/elements/custom-elements.json`, in the node lane — **not** by grep
over generated wrappers, which this WP does not produce:

- `check-manifest-content.mjs` requires a non-empty `description` on every **attribute** of
  every `tagName`-bearing declaration, with the 16 inherited ones listed as an explicit,
  dated, fork-referenced exemption if the fork is still open. An exemption list is acceptable;
  a silently-narrowed criterion is not.
- The manifest's `sk-nav-pill-toggle` event carries `type.text === "CustomEvent<{ open: boolean }>"`.
- `sk-card`'s declaration carries a slot.
- No `/** */` above a **public** member in `packages/elements/src` contains squad-review
  narrative; the four in the table are moved. Record the before/after character counts.
- `npx nx run elements:analyze` regenerates cleanly and the manifest `git diff --exit-code`
  step is green.
