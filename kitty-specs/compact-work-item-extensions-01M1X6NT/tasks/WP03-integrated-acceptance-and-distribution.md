---
work_package_id: WP03
title: Integrated acceptance and distribution
dependencies:
- WP02
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
- FR-019
- FR-020
- FR-021
- FR-022
- FR-023
- FR-024
- FR-025
- FR-026
- FR-027
- FR-028
- FR-029
- FR-030
- FR-031
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
- C-011
- C-012
- C-013
- C-014
- C-015
- C-016
- C-017
planning_base_branch: mission/compact-work-item-extensions
merge_target_branch: mission/compact-work-item-extensions
branch_strategy: Planning artifacts for this mission were generated on mission/compact-work-item-extensions. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/compact-work-item-extensions unless the human explicitly redirects the landing branch.
subtasks:
- T013
- T014
- T015
- T016
- T017
- T018
phase: Phase 3 - integrated acceptance and distribution
history:
- at: '2026-09-07T00:00:00Z'
  actor: codex
  action: Prompt authored for issue #212
agent_profile: frontend-freddy
authoritative_surface: apps/storybook/src/tests/sk-compact-work-item-extensions.spec.ts
create_intent:
- apps/storybook/src/tests/sk-compact-work-item-extensions.spec.ts
execution_mode: code_change
owned_files:
- mutations.json
- expected-docs.json
- expected-parts.json
- expected-stories.json
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src/**
- packages/react/.wrapper-floor
- packages/react/type-tests/wrappers.type-test.tsx
- apps/storybook/src/tests/sk-compact-work-item-extensions.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/**
- docs/design-system/using-react.md
- docs/design-system/changelog.md
priority: P1
role: implementer
tags:
- integration
- generated-artifacts
- exact-head-gates
task_type: implement
tracker_refs:
- '#212'
- '#208'
---

# Work Package Prompt: WP03 — Integrated acceptance and distribution

## Do this first: governed Codex context

Begin only after WP02 is approved. Load `frontend-freddy` through the installed Spec Kitty resolver
and load implementation-scoped charter context. Read `AGENTS.md`, `CLAUDE.md`, issue #212,
`spec.md`, corrected `plan.md`, ADR-9/10/11 and the current component-authoring recipe in full. Use
the Spec Kitty runtime CLI for action, status, evidence and verdict changes; never hand-edit runtime
events/status/meta files.

Use Codex subagents only. Never invoke Claude, `spec-kitty dispatch`, an Op, a review driver or a
git worktree. Work in the fresh primary clone on `mission/compact-work-item-extensions`. Verify the
approved WP02 tree is clean before changing the sole-owned integration files. The outer programme
orchestrator owns GitHub writes, pushes needed for CI artifact exchange, PR comments, merge and
issue/epic closeout.

## Outcome and independent review boundary

Turn the approved authored surfaces into one coherent, distributable, fully evidenced mission:

- persist exactly four SC-010 property-before-upgrade arms and one SC-013 arm removing only
  `part="supporting"` from WP01/WP02's measured handoffs;
- generate exact manifest, React wrappers, Vue declarations and size report; prove the four new
  React props have exact public types;
- update shared docs/parts/story ratchets by rebased per-element deltas;
- prove the T10 composition and the entire acceptance matrix in Chromium, Firefox and WebKit;
- establish only intentional new Ubuntu visual baselines and retain every legacy baseline;
- rebase on the final train, rerun generation and the complete repository gate surface, then
  prepare exact-head CI and four-lens Codex evidence.

WP03 must not redesign WP01/WP02 authored product sources. If a focused failure proves a genuine
source defect, return it to the owning WP's implement/review loop rather than silently taking
ownership. WP03 is independently reviewable for its verdict from integrated tests, reproducible
generated outputs, a clean full gate and exact traceability. No WP—including WP03—may transition to
`done` until T016/T017 have completed the coherent full Storybook, axe, visual and final gate surface.

## Hard boundaries

- Do not add a component, Work Package card, Kanban state, semantic card/tone, notice behavior,
  route, fetch, drag/drop, timer, claim expiry, liveness/trust inference, status mapping, progress
  arithmetic, relative-time formatter or Markdown parser.
- Do not edit generated files by hand. Regenerate from approved authored sources in dependency
  order and review the generated diff. Add no host `tabindex` forwarding and do not worsen #154.
- Keep behavior subject sets unchanged. Add no ADR-11 SC-011 subject and no slot-misroute mutation.
  SC-010 covers only property-before-upgrade preservation for `layout`, `size`, `shape`, `pulsing`;
  SC-013 removes only `part="supporting"`. Reflection, unsupported-layout fail-open, projection,
  image naming/crop, pulse preferences, geometry and inline semantics remain direct tests.
- Keep the strict axe conjunction and every negative shape from WP02. Do not alter axe rules,
  empty-root/per-host guards or the global content selector.
- Never accept changed legacy visual snapshots. Never update baselines locally to hide failure;
  Ubuntu CI pixels are authoritative and require artifact inspection plus an exact-head rerun.
- Never merge or push to `train/elements-first`/`main`. Any push or rebase invalidates both CI and
  adversarial evidence and requires both again on the new SHA.

## T013 — Persist only the proven ADR-11 arms

Review WP01/WP02's exact red-first source-break records and confirm each names its intended test,
focused failure, restored green and zero unexplained collateral. Do not manually replay them in
WP03. Add exactly five non-inert entries to `mutations.json`, preserving the demonstrated subject,
source file and unambiguous `from`/`to`:

1. SC-010 action-row `layout` property-before-upgrade preservation;
2. SC-010 status-indicator `pulsing` property-before-upgrade preservation;
3. SC-010 entity-marker `size` property-before-upgrade preservation;
4. SC-010 entity-marker `shape` property-before-upgrade preservation;
5. SC-013 removal only of action-row `part="supporting"`.

Do not add to `behaviours.json`: all three elements are already subjects of their applicable rows,
and their subject sets do not expand.

Run the complete mutation harness and guard self-test:

```bash
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
```

`node scripts/suite-selftest.mjs` is the sole final re-derivation of all five new reds; its own
`--selftest` proves the harness guards. No mutation may be muted, weakened, reclassified or given an
unexplained collateral allowance. Reflection, unsupported-layout fail-open, supporting projection/
source order, entity image projection/naming, pulse preferences and inline semantics stay outside
the registry. Mission success criterion SC-011 is the axe proof, not the ADR fallback row.

Requirements: FR-005, FR-013–FR-015, FR-020, FR-029; NFR-005; C-015; SC-002, SC-004–SC-005,
SC-010; NI-003–NI-008.

## T014 — Red-first generated consumer and ratchet integration

First extend `packages/react/type-tests/wrappers.type-test.tsx` and prove it reds against the stale
generated declarations. Add positive JSX/property uses and negative `@ts-expect-error` cases for:

- `SkActionRow` `layout?: 'card'` and an unsupported string;
- `SkEntityMarker` independent `size?: 'sm'` and `shape?: 'circle'` plus unsupported strings;
- `SkStatusIndicator` `pulsing?: boolean` and a non-boolean value.

Assert the inferred public types are exact unions/boolean and never `any`. Do not add a host
`tabindex` prop or forwarding behavior. Preserve the existing action-row callback type and exact
activation event contract through the wrapper.

Regenerate in dependency order, never by editing outputs:

```bash
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
node scripts/build-styles-only-markup.mjs
npx nx run elements:analyze --skip-nx-cache
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
npx nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache
node scripts/measure-elements-sizes.mjs
npx nx run react:typecheck
```

Turn the type cases green. Update `expected-docs.json` by exact per-element deltas only:
action-row attributes 3→4, entity-marker 1→3 and status-indicator 1→2. Add only action-row
`supporting` to `expected-parts.json`. Register every new authored story exactly once in
`expected-stories.json`. Recompute current global totals from the rebased files; do not copy plan-
time counts. Update `using-react.md` and the design-system changelog for the additive API and
generation ownership.

Requirements: FR-001, FR-005, FR-013–FR-015, FR-020, FR-027–FR-029; NFR-004, NFR-006, NFR-009;
C-008, C-010, C-013, C-015; SC-001, SC-008; NI-010.

## T015 — Three-browser integrated acceptance

Create `apps/storybook/src/tests/sk-compact-work-item-extensions.spec.ts` against stable story ids.
Write focused failing assertions before any integration correction, then cover the complete matrix
under Chromium, Firefox and WebKit:

### Action row and T10 composition

- DOM/accessibility order matches marker, title, reference, tags, metadata, supporting, then
  sibling controls; no CSS reorder or nested trigger;
- static/selectable/selected, missing marker/tags/supporting/controls, live/stale supplied
  supporting text and nested native/custom controls;
- exactly one existing event for pointer, Enter and Space, exact `{ id }` and flags, key-repeat
  suppression, zero nested-control row events, no controlled-selection mutation and no tab stop for
  non-selectable/blank-id rows;
- both row/card layouts at 220px, an intermediate width and 360px, including long title/unbroken
  reference: no collision, clipped focus indicator or page-level horizontal overflow.

### Marker, pulse and inline empty state

- initials/icon/image, default/sm, square/circle full 2×2 geometry, portrait/landscape cover crop,
  long/whitespace labels, exactly one supported meaningful name and retained decorative behavior;
- pulse attribute/property toggles, marker-only animation, unchanged text, no-marker behavior,
  multiple-host independence and every existing tone;
- real `page.emulateMedia({ reducedMotion: 'reduce' })` proof of no animation plus a differential
  pulse-on versus pulse-off static marker emphasis, and forced-colors proof of a differential,
  author-owned non-color observable such as border/outline style or width; UA color remapping or
  unchanged current styling alone is not evidence;
- inline empty short/long supplied copy, native passive semantics, dark/light/forced colors,
  220/intermediate/360px wrapping and zero invented role/live region/action/fallback or overflow.

Also exercise the T10 composition in default dark and `.sk-light`. T11 is boundary context only and
must not widen this child. Run:

```bash
npx playwright test apps/storybook/src/tests/sk-compact-work-item-extensions.spec.ts \
  --project=chromium --project=firefox --project=webkit
```

Requirements: FR-001–FR-029; NFR-002–NFR-008; C-001–C-015, C-017; SC-001–SC-009;
NI-001–NI-012. FR-030–FR-031, C-016, NI-013 and mission SC-011 belong to T016's axe-gate proof,
not this UI acceptance suite.

## T016 — Axe and CI-authoritative visual baselines

Build Storybook, run the gate self-test, then axe every ratcheted affected story:

```bash
node scripts/build-storybook-with-budget.mjs
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
```

Require a non-empty successfully loaded root and zero WCAG 2.1 AA violations. Confirm the loaded
meaningful marker-image fixture passes. Confirm independent negatives for wrong local name, missing
registered constructor, non-`:defined` or non-instance host, missing authored shadow internals,
counterfeit unregistered open-shadow marker, blank label, wrong marker role, marker/host `aria-label`
mismatch, `aria-hidden`, descendant image, indirect slot image, nonempty alt, broken image, zero-
intrinsic image, hidden image, zero rectangle, nonpaintable image and legacy empty-alt shapes all
fail through the same exported verdict used by readiness and final assertion.

Add only new-state cases to `visual.spec.ts`: integrated T10 dark/light, narrow/long card, marker
axis/image crop, pulse off/on and reduced-motion fallback, inline short/long dark/light/forced-color
states. Make pulse screenshots deterministic by emulating reduced motion or disabling only the
animation after T015 has independently proved behavior. Existing default baseline names and pixels
must not change.

Use #208's approved qualitative reference: T10 Mission kanban in Stitch project
[`13081441628826430456`](https://stitch.withgoogle.com/projects/13081441628826430456), screen ID
`ac34a994f4eb4c058d0744bf757713ab`. At execution time, attempt live access and record the date plus
the exact accessible/authenticated or unavailable/unauthenticated outcome. Compare candidate dark,
light and narrow screenshots against every observable approved T10 intent and every binding #212
clause. If the remote is still inaccessible, preserve the access evidence and use #212 plus the
authoritative current-train fixtures and tokens for the bounded qualitative review; do not block when
that contract is sufficient. Never invent dimensions or claim pixel fidelity.

The programme orchestrator pushes the candidate head so CI can produce authoritative Ubuntu pixels.
Retrieve and inspect the `visual-regression-diffs` artifact through that orchestrator. Add only
intentional new `sk-compact-work-item-extensions-*` PNGs, rerun the affected local visual spec, then
have the orchestrator push the baseline commit and rerun CI on that exact new head. A legacy diff is
a compatibility defect to fix, not a baseline to accept. Prepare the candidate dark/light/narrow
screenshots, visual diff, dated Stitch access outcome, qualitative comparison and explicit no-pixel-
fidelity statement for the orchestrator to attach to the PR.

```bash
PW_INCLUDE_VISUAL=1 npx playwright test \
  apps/storybook/src/tests/visual.spec.ts --project=chromium
```

Requirements: FR-028–FR-031; NFR-001, NFR-004, NFR-007–NFR-009; SC-006–SC-009, SC-011;
NI-001, NI-008–NI-013.

## T017 — Final train rebase, regeneration and complete local gates

Ask the programme orchestrator to fetch the latest `origin/train/elements-first`; rebase the
mission branch in the primary clone. Never rebase a worktree. Resolve against the train's current
tokens/contracts. Any rebase invalidates all earlier final evidence.

After rebase, rerun the T014 generation sequence, recompute ratchet totals, build before measuring
sizes, commit every legitimate generated delta and require an empty generation diff. Immediately
after generation, explicitly regenerate/analyze the manifest, prove its committed bytes are current,
and build Storybook before any focused Playwright, visual or axe command:

```bash
npx nx run elements:analyze --skip-nx-cache
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/build-storybook-with-budget.mjs
```

Re-derive the unique `--sk-*` references from the rebased authored CSS for action row, status
indicator, entity marker and inline empty state. Require set equality with the element `Token
dependencies:` JSDoc maintained by WP01/WP02 and the inline modifier contract in
`using-components.md`; record missing/stale/duplicate sets as failures. Reconcile only through the
existing comments/docs and owned CSS—never by adding a token file or inventing a token.

Then run focused tests followed by the current commands in rebased `CLAUDE.md`, the recipe and CI
workflow. At minimum:

```bash
npx vitest run --project browser \
  fixtures/elements-behaviour/src/sk-action-row.test.ts \
  fixtures/elements-behaviour/src/sk-entity-marker.test.ts \
  fixtures/elements-behaviour/src/sk-status-indicator.test.ts
npx nx run react:typecheck
npx playwright test apps/storybook/src/tests/sk-empty-state-inline.spec.ts \
  --project=chromium --project=firefox --project=webkit
npx playwright test apps/storybook/src/tests/sk-compact-work-item-extensions.spec.ts \
  --project=chromium --project=firefox --project=webkit
PW_INCLUDE_VISUAL=1 npx playwright test \
  apps/storybook/src/tests/visual.spec.ts --project=chromium
npm run test
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-styles-only-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-react-wrappers.mjs --selftest
node scripts/build-vue-types.mjs --check
node scripts/check-vue-template-types.mjs
node scripts/check-manifest-content.mjs
node scripts/check-manifest-content.mjs --selftest
node scripts/check-component-public-contract.mjs --selftest
node scripts/check-component-public-contract.mjs \
  --manifest packages/elements/custom-elements.json \
  --tag sk-action-row=controls,marker,metadata,reference,row,supporting,tags,title,trigger \
  --tag sk-entity-marker=content,marker \
  --tag sk-status-indicator=marker,status,text
node scripts/check-component-token-literals.mjs --selftest
node scripts/check-component-token-literals.mjs \
  packages/styles/src/action-row/sk-action-row.css \
  packages/styles/src/status-indicator/sk-status-indicator.css \
  packages/styles/src/entity-marker/sk-entity-marker.css \
  packages/styles/src/empty-state/sk-empty-state.css
node scripts/check-no-css-in-source.mjs
node scripts/check-adopted-css-boundaries.mjs --selftest
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-elements-entries.mjs --selftest
node scripts/check-elements-entries.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/check-story-theme-wrapper.mjs
node scripts/check-gate-wiring.mjs --selftest
node scripts/check-gate-wiring.mjs
node scripts/check-gate-wiring-defeats.mjs
node scripts/typecheck-all.mjs
npm run quality:all
node scripts/measure-elements-sizes.mjs --check
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
node scripts/check-release-graph.mjs --selftest
node scripts/check-release-graph.mjs
node scripts/check-vue-packed-types.mjs
node scripts/check-offline-load.mjs --selftest
node scripts/check-offline-load.mjs
npm run security:lockfile-check
bash scripts/npm-audit-gate.sh
bash scripts/check-action-pins.sh
```

Use current workflow commands where they supersede this minimum. Do not skip, mute, delete,
weaken or reclassify a gate. Run every NI-001–NI-013 audit explicitly and attach exact command/
observable evidence to all acceptance criteria through supported Spec Kitty commands. Confirm only
WP03-owned integration files changed in this package, all generated outputs reproduce, and the
worktree is clean after committed results.

## T018 — Exact-head CI and Codex adversarial-gate preparation

Give the outer orchestrator a self-contained final evidence bundle containing:

- final mission head SHA and final train base SHA;
- every focused/full local command with counts/result and all FR/NFR/C/NI/SC dispositions;
- generated-drift, size, mutation, Storybook, axe, three-browser and Ubuntu visual evidence;
- CI-authoritative baseline artifact inspection and proof no legacy baseline changed;
- the approved #208 T10 Stitch project URL/screen ID, dated live-access outcome, dark/light/narrow
  candidate screenshots, visual diff, clause-by-clause qualitative disposition and an explicit
  statement that no pixel-fidelity claim is made; when remote access failed, preserve that evidence
  and name #212 plus current-train fixtures/tokens as the bounded fallback authority;
- final set-equality evidence for each changed CSS surface and its documented `--sk-*` dependency
  list, with no new token file;
- explicit absence of forbidden components, state, tones, semantics, host focus, token literals and
  weakened gate logic.

The orchestrator pushes and waits for green CI on that exact SHA. It separately loads
`architect-alphonso`, `reviewer-renata`, `debugger-debbie` and `randy-reducer` through the Spec
Kitty resolver, loads review-scoped charter context, and dispatches four read-only Codex subagents.
No Claude and no Spec Kitty Ops. Every finding names severity, file/line, explanation and
recommendation; the aggregate PR comment names the exact head SHA and records folded or numbered-
issue deferred disposition. Any rebase or later push reruns CI and all four lenses.

This worker prepares evidence and folds source-owner feedback through the proper WP loop. The
orchestrator alone opens/updates the `Refs #212`, `part of #208` PR to `train/elements-first`,
squash-merges only a qualifying exact head, closes #212 and checks only #212 in #208. Nobody merges
the train to `main`. The orchestrator attaches the prepared T10 screenshots, visual diff and access/
comparison record to the PR. Intermediate `approved` verdicts are not `done`: permit WP01, WP02 and
WP03 to transition to `done` only after T016's full Storybook/axe/visual proof and T017's final gates
are green for the coherent mission.

## Review handoff

Submit WP03 for independent Spec Kitty review before mission acceptance. Approval requires all
three WPs' coherent contract, full requirement/invariant traceability, reconciled token-dependency
lists, a clean rebased full gate, complete Storybook/axe/visual and T10 qualitative evidence,
reproducible generated artifacts and a complete exact-head handoff. Fold every rejection and rerun
affected gates. Only then may all three WPs transition from intermediate `approved` verdicts to
`done`. The outer orchestrator performs final pre-merge adversarial review and GitHub closeout only
after Spec Kitty acceptance.

## Activity Log

- 2026-09-07 — Authored during the Spec Kitty tasks phase; implementation unclaimed.
