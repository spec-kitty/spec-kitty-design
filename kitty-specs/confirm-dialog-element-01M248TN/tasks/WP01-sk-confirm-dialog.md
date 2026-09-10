---
work_package_id: WP01
title: sk-confirm-dialog end to end
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- FR-014
- FR-015
- FR-016
- FR-017
- FR-018
planning_base_branch: mission/confirm-dialog-element
merge_target_branch: mission/confirm-dialog-element
branch_strategy: Planning artifacts for this mission were generated on mission/confirm-dialog-element. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/confirm-dialog-element unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
- T012
- T013
- T014
phase: Phase 1 - The mission's only Work Package
history:
- at: '2026-09-10T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/elements/src/confirm-dialog/
create_intent:
- packages/elements/src/confirm-dialog/sk-confirm-dialog.ts
- packages/elements/src/confirm-dialog/sk-confirm-dialog.stories.ts
- packages/styles/src/confirm-dialog/sk-confirm-dialog.css
- fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/confirm-dialog/**
- packages/styles/src/confirm-dialog/**
- packages/styles/package.json
- fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts
- expected-parts.json
- expected-docs.json
- behaviours.json
- mutations.json
- packages/react/src/**
- packages/elements/vue.d.ts
- packages/elements/custom-elements.json
- packages/elements/SIZES.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – sk-confirm-dialog end to end

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or
any user-defined profile), and behave according to its guidance before parsing the rest of this
prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for
this work package's `task_type` and `authoritative_surface`.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via
  `spec-kitty agent tasks status` or the Activity Log below).
- **You must address all feedback** before your work is complete. Feedback items are your
  implementation TODO list.
- **Report progress**: As you address each feedback item, update the Activity Log explaining what
  you changed.

---

## Review Feedback

*(none yet — this is the first pass)*

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `<div>`, `<dialog>`
Use language identifiers in code blocks: `python`, `bash`, `ts`

---

## Objectives & Success Criteria

Ship `sk-confirm-dialog`, a bounded, single-purpose confirmation element wrapping the native
`<dialog>` (opened via `showModal()`), as ONE Work Package and ONE PR back onto
`train/elements-first` (per issue #308 and epic #300). This is the mission's only Work Package —
every functional requirement in `spec.md` (FR-001 through FR-018) belongs to it.

Success is:

1. Every string a consumer must supply (title, body, confirm label, cancel label) has **no
   fallback text anywhere** — omitting one warns and renders nothing substituted, never English or
   any other literal (FR-001, FR-017, FR-018).
2. Exactly two actions (confirm, cancel); the confirm control composes `.sk-button` and the
   consumer picks its tone (FR-003, FR-004).
3. The element performs no mutation, request, or navigation — ever (FR-005).
4. Exactly one reporting mechanism: the native `close` event, read via
   `HTMLDialogElement.returnValue` (`'confirm' | 'cancel'`) (FR-006).
5. Every non-confirm close path — cancel click, Escape, backdrop dismissal (if enabled),
   programmatic close with no explicit value — resolves `'cancel'` (FR-007).
6. Initial focus lands on a documented, consumer-overridable target (default: cancel); focus
   returns to the invoker on close (FR-008, FR-009).
7. Long bodies scroll without clipping the action group, including at narrow widths and 200%
   zoom; reduced motion suppresses animation; forced-colors keeps surfaces distinguishable
   (FR-010, FR-011, FR-012).
8. No story, doc, or fixture in this WP ever presents whole-Team deletion as an available flow
   (FR-014).
9. The static-twin question for the stylesheet is recorded as deferred to #301, not invented
   (FR-016).
10. A component-scoped, red-first-demonstrated automated test proves zero bare user-visible text
    nodes in `render()` (FR-018) — without becoming a repo-wide gate (that is #286's own,
    separate, not-yet-built deliverable).
11. `packages/styles/package.json` gains the `./confirm-dialog/*` exports entry (C-010).
12. Every ratchet (`expected-parts.json`, `expected-docs.json`, `behaviours.json`,
    `mutations.json`) is updated in this same PR, and every generated artifact
    (`custom-elements.json`, `packages/react/src/**`, `packages/elements/vue.d.ts`,
    `packages/elements/SIZES.md`) is regenerated and committed.
13. `docs/contributing/adding-a-component.md` §7's full gate list passes, and
    `git status --porcelain` is empty after regeneration.

## Context & Constraints

- **Read first, in this order**: `.kittify/charter/charter.md`; `docs/contributing/adding-a-component.md`
  (the recipe — several of its gates reject exactly what a first attempt looks like);
  `docs/architecture/decisions/2026-09-02-9-shadow-dom-and-styling-api.md` (ADR-9);
  `docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md` (ADR-10);
  `docs/architecture/decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md` (ADR-11);
  this mission's `spec.md`, `plan.md`, `data-model.md`, `research.md`,
  `contracts/sk-confirm-dialog.md`, and `quickstart.md`.
- **Pattern element**: `packages/elements/src/notice/sk-notice.ts` and its paired
  `packages/styles/src/notice/sk-notice.css` — the closest structural precedent (behavior-owning
  element, no server-rendered static form, an unmarked non-ADR-11 test alongside its declared
  ADR-11 ids).
- **Source issue**: `gh issue view 308 --repo spec-kitty/spec-kitty-design` — read the COMPLETE
  live issue; do not rely solely on this prompt's paraphrase. Also read #300 (epic, shared
  constraints), #286 (open — copy/i18n, binding), #301 (open — static-form decision, this WP's
  FR-016 deferral target), #178 (closed — sk-notice, the pattern element), #257 (closed —
  sk-copy-field, a contrasted precedent for the event-vs-native-close decision).
- **Team deletion is a hard prohibition**: whole-Team deletion is blocked on Team Kitty SaaS
  issue 1432 (not a design-repo issue). No story, exemplar, doc string, or fixture in this WP may
  present it as an available flow. Legitimate examples: membership removal, leave, bearer-link
  revoke.
- **Do not invent a static twin.** The stylesheet's own static-authorability question is deferred
  to #301 per FR-016 — do not generate `sk-confirm-dialog.html`/`index.ts` or author a
  `sk-confirm-dialog.markup.ts`. This element (its interactive form) also has no static
  equivalent — `showModal()` has none — same shape as `sk-notice`.
- **Do not conflate FR-018 with #286.** Write exactly one component-scoped test. Do not add a
  probe table, an empty-set floor, or scan any file outside this component. That is #286's
  deliverable, filed separately and still open.
- **Tokens-first.** No raw `rgba()`/hex/`Npx` literals in `sk-confirm-dialog.css` — everything
  through `var(--sk-*)`.
- **Never hand-edit generated files**: `packages/react/src/**`, `packages/elements/vue.d.ts`,
  `packages/elements/custom-elements.json`, `packages/elements/SIZES.md`. Regenerate them with
  their scripts (T012).
- **This is a single WP by mandate**, not by sizing convenience — see `tasks.md`'s "Work Package
  count" note. If, partway through, this genuinely cannot be delivered as one PR, STOP and report
  rather than splitting the WP unilaterally.

## Branch Strategy

- **Strategy**: single_branch — this mission has no separate coordination branch. Work and commit
  directly on the mission branch.
- **Planning base branch**: `mission/confirm-dialog-element`
- **Merge target branch**: `mission/confirm-dialog-element` (the PR back to `train/elements-first`
  happens from this branch per issue #308's "Branch: cut ... from the latest `train/elements-first`;
  PR back into the train.")

> These fields are populated automatically by `spec-kitty agent mission tasks`. Do NOT change
> them manually unless you are certain the branch topology has changed.

## Subtasks & Detailed Guidance

### Subtask T001 – Author `sk-confirm-dialog.ts` skeleton

- **Purpose**: Establish the element's public surface: a `LitElement` wrapping a native
  `<dialog>` in its shadow root, with every required string as a no-default reactive property.
- **Steps**:
  1. Create `packages/elements/src/confirm-dialog/sk-confirm-dialog.ts`.
  2. Declare reactive properties for the four required strings (finalize exact attribute names —
     `contracts/sk-confirm-dialog.md` illustrates `dialog-title`, `message`, `confirm-label`,
     `cancel-label`; check whether `dialog-title` vs. a plain `title`-shaped attribute collides
     with the global HTML `title` tooltip attribute before choosing — it does, so do not name the
     property/attribute `title`). None of the four may declare a default value in the `declare`
     JSDoc or in Lit's `properties` map — omission must fall through to T004's warn-and-render-empty
     path, not to any string literal.
  3. Declare `initialFocus` (`'confirm' | 'cancel'`, default `'cancel'`) and a backdrop-dismissal
     boolean toggle (name and default finalized here — document the choice in the class JSDoc and
     carry it into T014's doc reconciliation).
  4. Render a `<dialog>` in the shadow root with `part="dialog"` (or your finalized part name),
     a title/heading node wired as the accessible name source, a body node wired as the
     accessible description source (`aria-describedby` within the same shadow root — cross-root
     ID references do not resolve, ADR-9 §4), and an actions region with confirm/cancel controls.
  5. Confirm control composes the existing `.sk-button` sheet/contract (see `packages/elements/src/button/`
     for the pattern of composing another component's stylesheet — import the sheet by relative
     path per `check-adopted-css-boundaries.mjs`'s rule, foreign sheet first, same order in both
     consumption paths).
  6. Register via `define()` (ADR-10 §5) and export from `src/index.ts`; side-effect import in
     `src/elements.ts`.
  7. Class-level JSDoc: `@element sk-confirm-dialog`, `@csspart` for every declared part
     (terminate the tag before any prose), `@fires` is NOT needed for a custom event (there isn't
     one — T002 uses the platform's own `close`), token-dependency list (which `--sk-*` vars the
     CSS uses, populated once T005 is final).
  8. Document every public reactive property and public method — `check-manifest-content.mjs`
     refuses an undocumented one.
- **Files**: `packages/elements/src/confirm-dialog/sk-confirm-dialog.ts` (new); `packages/elements/src/index.ts`;
  `packages/elements/src/elements.ts`.
- **Parallel?**: No — foundation for everything else.
- **Notes**: `static styles = [sheet]` from the generated `sk-confirm-dialog.css.js` — never
  `css\`\`` in the `.ts` (`check-no-css-in-source.mjs`). This file does not exist until T005's CSS
  is authored and built once — sequence accordingly (author T001's structure first, then T005's
  CSS against real part names, then come back and wire `static styles`).

### Subtask T002 – Implement the single reporting mechanism

- **Purpose**: Every close path reports through exactly one platform mechanism: `close` +
  `returnValue`.
- **Steps**:
  1. Before the dialog can be shown, ensure `returnValue` is set (or defaults) to `'cancel'` —
     the safe default that Escape and an unset programmatic `close()` fall through to.
  2. Confirm control's click/Enter/Space handler calls `dialogEl.close('confirm')`.
  3. Cancel control's handler calls `dialogEl.close('cancel')` (redundant with the default, but
     explicit — do not rely on falling through here, since a future change to the default must
     not silently change the cancel button's own behavior).
  4. Backdrop dismissal (if the toggle is on): attach a `click` listener on the `<dialog>` element
     itself (not its content wrapper); if `event.target === dialogEl` (i.e., the click landed on
     the dialog's own backdrop-adjacent box, not inside the content), call `dialogEl.close()` with
     no argument, relying on the already-defaulted `'cancel'`.
  5. Escape: native `<dialog>` already fires `cancel` then `close` with `returnValue` unchanged —
     verify in a real browser (not jsdom) that this leaves `returnValue` at whatever it was before
     Escape was pressed, and make sure nothing in your own code has set it to `'confirm'`
     prematurely (e.g., don't set `returnValue = 'confirm'` speculatively anywhere before the
     confirm control is actually activated).
  6. Do NOT add a second custom event for this. If you find yourself wanting one, re-read
     `research.md`'s "Decision: single reporting mechanism" section — the answer is native `close`.
- **Files**: `packages/elements/src/confirm-dialog/sk-confirm-dialog.ts`.
- **Parallel?**: No — depends on T001's structure.
- **Notes**: This is FR-006/FR-007's crux and the part most likely to be silently wrong (an
  invented `'confirm'` default, or backdrop dismissal accidentally resolving as confirm because
  the click handler doesn't distinguish target). T008's behavior tests must exercise every path
  in the table in `contracts/sk-confirm-dialog.md`.

### Subtask T003 – Focus management

- **Purpose**: Documented, overridable initial focus; guaranteed focus return to the invoker.
- **Steps**:
  1. On `showModal()` (or in an `updated()`/`firstUpdated()` hook triggered by opening), move
     focus to the element named by `initialFocus` (default: the cancel control).
  2. Capture `document.activeElement` (or the real invoking element, if passed explicitly) at
     open time; on every close path (T002's four+ branches), restore focus to it.
  3. Verify state attributes (e.g., an `open` reflected attribute, if you add one) track the
     dialog's real open/closed state — ADR-11 SC-005 requires state attributes to track reality,
     not just documented keys to act.
- **Files**: `packages/elements/src/confirm-dialog/sk-confirm-dialog.ts`.
- **Parallel?**: No — depends on T001/T002.
- **Notes**: "Focus returns to the invoker" must hold even when the invoker is a button inside a
  list that re-renders between open and close — capture a reference, not a selector re-queried
  later.

### Subtask T004 – No-defaults enforcement (FR-001, FR-017)

- **Purpose**: An omitted required string renders with nothing substituted and warns.
- **Steps**:
  1. For each of the four required strings, if the value is `undefined`/empty at render time,
     render the corresponding slot/node as empty (no text child) rather than substituting any
     literal — English or otherwise.
  2. Emit exactly one `console.warn` per omitted property per render cycle it stays omitted
     (avoid a warning storm on every re-render if nothing changed — dedupe if needed), naming
     which property is missing.
  3. Verify this does NOT throw and does NOT blank the entire shadow root (the `<name>Classes`
     warn-and-degrade precedent from `adding-a-component.md`, not the `<name>StaticHtml` throw
     precedent — this element renders at runtime, not at build time, so it must degrade
     gracefully).
- **Files**: `packages/elements/src/confirm-dialog/sk-confirm-dialog.ts`.
- **Parallel?**: No — part of the same render logic as T001.
- **Notes**: This is the sharpest-reviewed line in the whole issue. Do not let a "helpful"
  placeholder like `"(no title)"` or `"Untitled"` slip in anywhere — that IS the #286 defect this
  component exists to avoid.

### Subtask T005 – Author the stylesheet

- **Purpose**: `packages/styles/src/confirm-dialog/sk-confirm-dialog.css` — the CSS source of
  record, tokens-only.
- **Steps**:
  1. `:host { display: ... }` — declare it; a custom element defaults to `inline`.
  2. Style the dialog surface, border, and backdrop using `--sk-surface-*`/`--sk-border-*`/
     `--sk-on-*` token pairs (semantic pairing, ADR/CLAUDE.md §3).
  3. Long body: make the body region scroll (`overflow-y: auto` or similar) while the action
     group (footer) stays outside the scroll container and always visible — test at narrow
     widths and simulate 200% zoom.
  4. `@media (prefers-reduced-motion: reduce)`: suppress any entrance/exit transition, scoped to
     the exact selector and property you actually animate (per the recipe's forced-colors/
     reduced-motion section — no wildcard).
  5. `@media (forced-colors: active)`: ensure the dialog surface, its boundary, and the backdrop
     remain distinguishable. Use `border`/`outline` (auto-remapped) rather than `box-shadow` for
     any focus ring; if you need a border-color literal for a system color, use the LONGHAND
     `border-*-color` property and add the keyword to `stylelint.config.mjs`'s `ignoreValues` —
     never dodge the gate via the `border`/`outline` shorthand.
  6. RTL/logical properties: use `margin-inline-*`, `padding-inline-*`, `inset-inline-*` etc.,
     not physical `left`/`right`.
  7. Interactive targets (confirm, cancel, and any backdrop affordance) at least 44×44px.
  8. No theme selector (`:root[data-theme="light"]`, `.sk-light .sk-x`) inside this file — both
     are inert across the shadow boundary (ADR-9 §3). Theme variance goes through tokens only.
- **Files**: `packages/styles/src/confirm-dialog/sk-confirm-dialog.css` (new).
- **Parallel?**: `[P]` with T001-T004 in the sense of a different file, but sequence part-name
  selectors against T001's final `part` attribute names before finishing this file.
- **Notes**: Do NOT create `sk-confirm-dialog.markup.ts`, and do not expect
  `build-element-markup.mjs` to generate `sk-confirm-dialog.html`/`index.ts` for this component —
  see FR-016/research.md. `packages/styles/src/notice/` (CSS only, no generated HTML) is the
  precedent to copy.

### Subtask T006 – Styles package exports entry (C-010)

- **Purpose**: Make the new CSS reachable by an installing consumer.
- **Steps**:
  1. Open `packages/styles/package.json`.
  2. Add `"./confirm-dialog/*": "./dist/confirm-dialog/*"` to the `exports` map, in alphabetical
     position (matching the existing convention — between `"./copy-field/*"` and `"./data-table/*"`).
  3. Do not touch `exports["."]` (the root entry) — that is open issue #161's separate, pre-existing
     defect; not this WP's to fix.
- **Files**: `packages/styles/package.json`.
- **Parallel?**: `[P]` with T005 (adjacent but distinct concern).
- **Notes**: Verify with `node scripts/check-release-graph.mjs` (T013) — `checkSubpathCoverage`
  fails with `component "confirm-dialog" has no subpath export — its CSS is unreachable` if this
  is missed. This is easy to forget because `adding-a-component.md`'s own recipe does not mention
  it explicitly.

### Subtask T007 – Storybook stories

- **Purpose**: Every required state from issue #308's own "Required stories and tests" list.
- **Steps**: Create `packages/elements/src/confirm-dialog/sk-confirm-dialog.stories.ts` with (at
  minimum) these named exports/stories:
  1. `Closed` (the dialog element present but not open — verifies nothing renders unexpectedly).
  2. `OpenShortBody`.
  3. `OpenLongScrollingBody` (proves T005's scroll behavior; action group must remain visible in
     the story's rendered viewport).
  4. `DifferentLengthLabels` (very short cancel label vs. a long confirm label, or vice versa).
  5. `WrappingTitle` (a title long enough to wrap to two+ lines).
  6. `Default` (dark, the repo's default background).
  7. `LightMode` — wrapped in `class="sk-light"` (NOT `data-theme="light"`, which activates
     nothing on a wrapper, #93). Assert computed values differ between the two themes when you
     write T008's behavior tests, or when manually verifying — don't just assume the class works.
  8. `ReducedMotion` (or a documented parameter toggling `prefers-reduced-motion`).
  9. `ForcedColors` (or documented baseline).
  10. `RTL` (a story rendered with `dir="rtl"` on an ancestor, proving logical-property layout).
  11. `NarrowWidth` / `Zoom200` — narrow viewport and/or simulated 200% zoom, proving no clipping.
  12. Every story supplies real, non-empty strings for all four required props (per FR-001) EXCEPT
      one dedicated story (e.g., `MissingConfirmLabel`) that deliberately omits one, to visually
      demonstrate T004's warn-and-render-empty behavior for reviewers.
- **Files**: `packages/elements/src/confirm-dialog/sk-confirm-dialog.stories.ts` (new).
- **Parallel?**: No — needs T001 (element) and T005 (CSS) substantially done.
- **Notes**: Title taxonomy: pick the closest existing root (`Components/`) per CLAUDE.md §6.
  Do not hand-write markup in a story — render from the element's own tag with attributes, since
  there is no generated static markup module for this component (FR-016/T005's note).

### Subtask T008 – ADR-11 behavior tests

- **Purpose**: Prove the required-behaviours list this element actually owns, red-first.
- **Steps**:
  1. Create `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts`.
  2. **Import named symbols from the element module directly** (e.g.
     `import '../../../packages/elements/src/confirm-dialog/sk-confirm-dialog.js'` or the
     resolved equivalent) — never `import ... from '@spec-kitty/elements'`, which
     `check-behaviour-fixture-imports.mjs` rejects and which would put every element in this
     test's dependency graph.
  3. **SC-005** (focus/keyboard): Escape closes as cancel; focus returns to the invoker; a state
     attribute (if you added one, e.g. `open`) tracks real open/closed state.
  4. **SC-006/007/008** (event contract): `close` fires exactly once per close; `returnValue` has
     the documented `'confirm'|'cancel'` shape for every path in `contracts/sk-confirm-dialog.md`'s
     table. Do NOT claim SC-009 — `close` is not cancelable.
  5. **SC-013** (parts): every declared `::part()` is present and targetable from outside the
     shadow root. Add each part to `expected-parts.json` in T010, in the SAME PR as this test.
  6. **SC-014** (style adoption): `shadowRoot.adoptedStyleSheets.length === 1` (or however many
     sheets you compose, e.g., 2 if you compose `.sk-button`'s sheet — assert identity AND order,
     per the recipe's "foreign sheet first" rule if applicable) and zero injected `<style>`
     elements.
  7. **SC-015** (registry guard): a second `define()` of `sk-confirm-dialog` warns and no-ops
     rather than throwing.
  8. **SC-017** (responsive threshold) — ONLY if T005's narrow-width layout uses a documented
     breakpoint rather than fluid CSS. If you claim it: assert the shipped (generated)
     `sk-confirm-dialog.css.js` declares the documented figure, AND that behavior changes at it
     live. If you do NOT introduce a breakpoint, do not claim this id — declaring a subject
     creates the obligation.
  9. For each claimed id, write the mutation arm demonstrated red-first (see T010).
- **Files**: `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` (new).
- **Parallel?**: No — needs T001-T004 substantially complete.
- **Notes**: SC-002/003/004 (form association) and SC-016 (delegate/rendered-control
  correspondence) do NOT apply to this element — do not claim them (see `research.md`'s
  applicability table and `plan.md`'s Charter Check).

### Subtask T009 – Component-scoped "no literal text" test (FR-018)

- **Purpose**: A red-first-demonstrated, UNMARKED (no `[SC-NNN]`) test proving `sk-confirm-dialog`'s
  `render()` emits zero bare user-visible text nodes beyond the exact supplied strings.
- **Steps**:
  1. In the same `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` file, add a test (or
     small group of tests) that renders the element with all four strings supplied and asserts
     the full set of visible text content in the shadow root equals exactly those four strings
     (plus whatever the confirm/cancel controls' own accessible content is — which comes from the
     supplied labels, not a literal).
  2. Add the omitted-string cases (one test per omitted string, or a parametrized loop) asserting
     no substituted literal appears — this rides on T004's implementation.
  3. Demonstrate this test is red before T004's fix lands (temporarily hardcode a fallback string
     in T004's code, confirm the test catches it, then remove the hardcode) — the standard
     red-first discipline this repo requires everywhere.
  4. This test carries NO `[SC-NNN]` marker — do not invent one. Follow `sk-notice`'s
     unmarked-re-announcement-test precedent exactly (see `behaviours.json`'s own `$comment` for
     that precedent, and `research.md`'s "Decision: component-scoped 'no literal text' test").
  5. Do NOT add a probe table, an empty-set floor, or scan any file/component other than
     `sk-confirm-dialog`. That generalization is issue #286's own deliverable.
- **Files**: `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` (same file as T008).
- **Parallel?**: Can be written alongside T008 in the same file.
- **Notes**: This is a mission-defining requirement — a reviewer will look here first.

### Subtask T010 – Register the ratchets

- **Purpose**: The four hand-maintained registries the recipe requires.
- **Steps**:
  1. `expected-parts.json`: add every `::part()` T001/T005 declared, bump `total`, in the same PR
     as T008's SC-013 test that targets each one from outside.
  2. `expected-docs.json`: add a row with `sk-confirm-dialog`'s final attribute/property/method
     counts, bump `total` (exact equality both directions).
  3. `behaviours.json`: add `sk-confirm-dialog` as a subject for every ADR-11 id it actually
     claims (SC-005/006/007/008/013/014/015, plus SC-017 only if claimed), each entry naming
     `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` as the subject file.
  4. `mutations.json`: add one red-first-demonstrated mutation arm per claimed (id, subject) pair.
  5. Re-read `behaviours.json`'s own `$comment` block before editing — it records the exact
     convention every prior element followed (including the unmarked-test precedent T009 relies
     on) and is the single source `floor-reporter.mjs`/`suite-selftest.mjs` check against.
- **Files**: `expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`.
- **Parallel?**: No — needs the FINAL part/attribute/id sets from T001-T009; do this last among
  the authoring subtasks.
- **Notes**: "Nothing detects that a new component *should* have a behaviour entry — declaring
  one creates the obligation, and omitting it is silently green." Get this right; it is not
  caught by any other gate.

### Subtask T011 – Team-deletion absence audit (FR-014)

- **Purpose**: Prove, not just assert, that nothing in this WP presents whole-Team deletion as an
  available flow.
- **Steps**:
  1. `grep -rniE "team.{0,20}(delet|remov)" packages/elements/src/confirm-dialog packages/styles/src/confirm-dialog fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts kitty-specs/confirm-dialog-element-01M248TN` (adjust the pattern to catch reasonable variants).
  2. Confirm every match, if any, is membership removal, leave-team, or bearer-link revoke
     framing — not whole-Team deletion.
  3. If a story or doc string uses a destructive exemplar at all, prefer one of the three
     legitimate examples explicitly (e.g., "Remove member", "Leave team", "Revoke link") rather
     than a generic "Delete" that could be misread.
- **Files**: read-only audit over everything T001-T010 produced; fix any violation found in the
  offending file.
- **Parallel?**: No — depends on T007-T010 existing.
- **Notes**: This is a hard prohibition, not a style preference — Team Kitty SaaS #1432 is the
  reason.

### Subtask T012 – Regenerate generated artifacts

- **Purpose**: Every generated file reflects the final element/CSS, committed and drift-checked.
- **Steps** (run in this order, per `adding-a-component.md` §7):
  1. `node scripts/build-elements-css.mjs`
  2. `node scripts/build-element-markup.mjs` (should be a no-op for this component — no
     `.markup.ts` exists; confirms it doesn't try to generate anything for confirm-dialog)
  3. `npx nx run elements:analyze` (rewrites `custom-elements.json`)
  4. `node scripts/build-react-wrappers.mjs`
  5. `node scripts/build-vue-types.mjs`
  6. `npx nx run-many --target=build --projects=tokens,styles,elements`
  7. `node scripts/measure-elements-sizes.mjs` (writes `packages/elements/SIZES.md` — commit it)
  8. Drift checks: `--check` variants of steps 1, 2, 4, 5; `git diff --exit-code -- packages/elements/custom-elements.json`; `node scripts/measure-elements-sizes.mjs --check`.
- **Files**: `packages/elements/custom-elements.json`, `packages/react/src/**`,
  `packages/elements/vue.d.ts`, `packages/elements/SIZES.md` (all generated — commit, never
  hand-edit).
- **Parallel?**: No — must run after T001-T010 are stable.
- **Notes**: `measure-elements-sizes.mjs` reads `dist/` and does NOT build it — build first (step 6)
  or you'll record stale bytes.

### Subtask T013 – Full gate run

- **Purpose**: Every gate the recipe names, green, before this WP is considered done.
- **Steps**: Run the complete list from `docs/contributing/adding-a-component.md` §7:
  `check-manifest-content.mjs`, `check-no-css-in-source.mjs`, `check-elements-entries.mjs`,
  `check-adopted-css-boundaries.mjs`, `check-element-css-hygiene.mjs`, `check-part-ratchet.mjs`,
  `check-story-theme-wrapper.mjs` (+ `--selftest`), `typecheck-all.mjs`, `npm run quality:all`
  (ESLint, Stylelint, HTMLHint), `build-react-wrappers.mjs --selftest`,
  `check-manifest-content.mjs --selftest`, `check-gate-wiring.mjs`, `npm run test`,
  `node scripts/suite-selftest.mjs`, `npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js`,
  and `node scripts/check-release-graph.mjs` (verifies T006's exports entry). Fix everything red
  until this whole list is green. Finish with `git add -A && git status --porcelain` — must be
  empty.
- **Files**: none new — verification only.
- **Parallel?**: No — final gate.
- **Notes**: `stylelint` needs `packages/tokens/dist/token-catalogue.json` — run
  `npx nx run tokens:catalogue` first if any token was touched (it should not be, for this
  component).

### Subtask T014 – Documentation reconciliation

- **Purpose**: Keep this mission's own planning artifacts (`contracts/sk-confirm-dialog.md`,
  `quickstart.md`) truthful against what actually shipped.
- **Steps**:
  1. If T001's final attribute names differ from the illustrative ones in
     `contracts/sk-confirm-dialog.md`/`quickstart.md` (e.g., `dialog-title` became something
     else), update those two files to match.
  2. Confirm the element's own class-level JSDoc states the static-twin deferral to #301 (mirrors
     FR-016) and names the single reporting mechanism (mirrors FR-006), so a reader of the code
     alone gets the same answer as a reader of the spec.
  3. Confirm the token-dependency list in the class JSDoc (T001) is accurate against the final
     `sk-confirm-dialog.css` (T005).
- **Files**: `packages/elements/src/confirm-dialog/sk-confirm-dialog.ts` (JSDoc only),
  `kitty-specs/confirm-dialog-element-01M248TN/contracts/sk-confirm-dialog.md`,
  `kitty-specs/confirm-dialog-element-01M248TN/quickstart.md`.
- **Parallel?**: No — last step, after everything else is final.
- **Notes**: Per this repo's `wp-task-files-are-frozen-plans` convention, do NOT edit this WP
  prompt file itself once implementation starts — only the contract/research surfaces named above
  track changes.

## Test Strategy

- Unit/behavior: Vitest browser mode (Playwright provider), via
  `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` (T008, T009).
- Accessibility: `scripts/run-axe-storybook.js` over every story from T007 — zero WCAG 2.1 AA
  violations; a story that fails to load is a failure, not a pass.
- Visual regression: Playwright baselines — CI-authoritative; do not rely on a local
  `--update-snapshots` run (see this repo's own convention on that point).
- Release graph: `node scripts/check-release-graph.mjs` (verifies T006).
- Full command list: `docs/contributing/adding-a-component.md` §7 (T013).

## Risks & Mitigations

- **Backdrop-dismissal wiring** is the easiest place to get FR-007 wrong (native `<dialog>` has no
  built-in backdrop-close behavior) — mitigate with the explicit `event.target === dialogEl` check
  in T002 and a dedicated behavior test in T008.
- **An invented default string** anywhere in T001/T004 is the single most heavily reviewed defect
  class in this mission — mitigate with T009's red-first test and a manual final read of every
  template literal in `render()`.
- **Missing the `packages/styles/package.json` exports entry** (T006) fails CI via
  `check-release-graph.mjs` but is not caught by the component recipe itself — mitigate by running
  T013's full gate list, not just the recipe's own checklist.
- **Conflating T009 with #286's repo-wide gate** would be scope theft from an issue this mission
  does not own — mitigate by keeping T009 scoped to exactly one component with no probe table.
- **Any Team-deletion framing slipping into a story/doc exemplar** — mitigate with T011's explicit
  grep audit as a dedicated subtask, not an afterthought.

## Review Guidance

- Verify FR-001/FR-017/FR-018 first: read every template literal in `render()` and confirm none
  is user-visible copy with no consumer source.
- Verify the reporting-mechanism table in `contracts/sk-confirm-dialog.md` against T008's actual
  test assertions, path by path.
- Verify `behaviours.json`/`mutations.json` claim exactly the applicable ADR-11 ids from
  `research.md`'s table — neither more nor fewer.
- Verify `packages/styles/package.json` gained the `./confirm-dialog/*` entry and
  `check-release-graph.mjs` passes.
- Run T011's grep yourself, independently, before approving.
- Confirm no story/doc mentions a generated static HTML twin for this component, and that the
  static-twin deferral to #301 is stated somewhere a reader would find it (element JSDoc or the
  stories file's docs).

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-10T00:00:00Z – system – Prompt created.
