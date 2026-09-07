---
work_package_id: WP03
title: Integrated catalogue, visual, and acceptance evidence
dependencies:
- WP01
- WP02
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
planning_base_branch: mission/work-package-detail-primitives
merge_target_branch: mission/work-package-detail-primitives
branch_strategy: Planning artifacts for this mission were generated on mission/work-package-detail-primitives. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/work-package-detail-primitives unless the human explicitly redirects the landing branch.
subtasks:
- T013
- T014
- T015
- T016
- T017
- T018
phase: Phase 3 - Integration and verification
history:
- at: '2026-09-07T11:53:49Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/elements/custom-elements.json
create_intent:
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-breadcrumbs-default-dark-chromium-linux.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-prose-prompt-dark-chromium-linux.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-event-timeline-default-dark-chromium-linux.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-check-bullet-state-mixed-chromium-linux.png
- docs/architecture/validation/issue-213-work-package-detail-zoom/README.md
execution_mode: code_change
model: ''
owned_files:
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src/**
- fixtures/react-consumer/src/wrappers.test.tsx
- expected-stories.json
- docs/design-system/using-components.md
- docs/design-system/changelog.md
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-breadcrumbs-*
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-prose-*
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-event-timeline-*
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-check-bullet-state-*
- docs/architecture/validation/issue-213-work-package-detail-zoom/**
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – Integrated catalogue, visual, and acceptance evidence

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `codex`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

Integrate WP01/WP02 into the current catalogue, regenerate every shared output, document the public boundary, and produce exact, reproducible evidence for all #213 states. End with a clean latest-train head ready for independent WP review, Spec Kitty acceptance, exact-head CI, and the mandatory four-lens PR gate.

## Context

WP01 and WP02 must both be approved. Read all mission artifacts, their review events, the issue contract, current train, ADR-9/10/11, the recipe, and the full gate list in CLAUDE.md. #212 is running concurrently and touches shared generated files; this WP owns the final rebase/regeneration response and must preserve both missions' authored sources.

Stay in the same primary clone. Do not run an action that allocates a worktree. Transition with `spec-kitty agent tasks move-task WP03 --to doing --mission 01M1XTPW`, resolve profile/context, and perform all mutation/rebase/CI commands to completion rather than treating long-running gates as stuck.

## Branch Strategy

- **Strategy**: single mission branch in fresh primary checkout; no worktree
- **Planning base branch**: `mission/work-package-detail-primitives`
- **Merge target branch**: `mission/work-package-detail-primitives`
- **External PR target**: `train/elements-first`

Before the final evidence, fetch/rebase `origin/train/elements-first`, regenerate shared outputs from the combined tree, and force-push only with `--force-with-lease` when the rebase makes it necessary. Any rebase or later push invalidates both CI and adversarial evidence.

## Subtasks & Detailed Guidance

### Subtask T013 – Regenerate catalogue and prove wrapper typing

- **Purpose**: Carry the authored state extension through the one-way package graph without manual generated edits.
- **Steps**:
  1. Run generators in recipe order: element CSS, element markup, styles-only markup, element manifest analysis, React wrappers, and Vue declarations.
  2. Build tokens/styles/elements before running `measure-elements-sizes.mjs`; commit the resulting `SIZES.md` only after the current build.
  3. Update `fixtures/react-consumer/src/wrappers.test.tsx` with a positive `<SkCheckBullet state="complete|pending">` compile surface and an `@ts-expect-error` unsupported state. The negative must fail compilation if the generated union widens to string.
  4. Confirm `custom-elements.json` documents `state`, its exact union and description; confirm `expected-docs.json` from WP02 matches the manifest total.
  5. Confirm the generated React declaration derives state from `SkCheckBulletElement["state"]`; never hand-special-case the wrapper output.
  6. Run every `--check`/selftest/content gate for CEM, wrapper, Vue, markup, CSS, size, and docs.
- **Files**: global generated outputs plus React consumer type fixture.
- **Validation**: clean generation twice, exact check output, typecheck-all, focused React consumer tests.
- **Parallel?**: No; generation must be serialized.

### Subtask T014 – Document the public recipes and boundaries

- **Purpose**: Make native structure and ownership discoverable without exposing mission narrative as API docs.
- **Steps**:
  1. Add concise sections to `docs/design-system/using-components.md` for `.sk-breadcrumbs`, `.sk-prose`, `.sk-event-timeline`, and `sk-check-bullet[state]` with usable markup.
  2. State timeline-versus-`.sk-data-table`, passive empty-state-versus-announced `sk-notice`, sanitizer/Markdown/heading ownership, event order/trust/time ownership, and listitem/non-checkbox semantics.
  3. Document exact token dependencies used by each new class family and the changed element, aligned with story component descriptions.
  4. Add a changelog entry naming the additive public surfaces and backward-compatible state default; do not claim release/publish/version work.
  5. Keep Team Kitty-specific application terms out of reusable API descriptions except where the issue/changelog provenance needs a reference.
  6. Verify all snippets use public exports/classes and valid native structure.
- **Files**: using-components and changelog only.
- **Validation**: markdown links/snippets manually checked against package exports; quality gates remain green.
- **Parallel?**: Yes after WP02 API settles; can proceed while generation is running only if no shared command writes docs.

### Subtask T015 – Complete integrated semantic and browser evidence

- **Purpose**: Demonstrate the required state matrix across themes, widths, assistive semantics, and engines.
- **Steps**:
  1. Re-run WP01's Storybook browser suite against all final stories and extend assertions only in its owning WP if a review reopens WP01; do not silently edit outside ownership.
  2. Prove breadcrumb one/three/six/current/focus/long/narrow behavior, prose headings/lists/links/code/table/absence/narrow containment, and timeline one/two/twenty/order/long/marker/unavailable/narrow behavior.
  3. Prove check-bullet complete/pending/mixed/long/empty/fifty states, exact list counts, hidden state text in the accessibility tree, and absence of checkbox/toggle behavior.
  4. At narrow viewports compare `document.documentElement.scrollWidth` to client width, allowing only explicitly tested local scrollers to exceed their client width. Separately repeat the repository's established #211 actual Chromium page-zoom procedure at 100% and 200% through the desktop UI (no CSS `zoom`, viewport-only resize, device-scale override, CDP page-scale, or pinch emulation). Record physical-window and CSS-viewport sizes, device pixel ratio, and visual viewport scale before/after; at both levels require no page overflow, visible focused breadcrumb link, readable/contained prose and code, attached timeline metadata, and distinct complete/pending checklist state.
  5. Reconfirm four explicit default-dark versus actual `.sk-light` computed-style comparisons, one per new/changed story family: breadcrumb link ink, prose body ink, timeline metadata ink, and check-bullet icon ink. Require every pair to differ and every LightMode wrapper to be present; record the exact computed values so an inert theme cannot pass through snapshots or axe alone.
  6. Emulate forced colors in Chromium, prove the media query is active, and require concrete rendered observables: a focused breadcrumb link has nonzero visible outline geometry, breadcrumb separator and timeline dot/connector geometry remain nonzero and visibly system-painted, prose/code boundaries remain visible, and complete/pending retain distinct glyphs with visible system-resolved icon color. Source-rule presence or a narrative appeal to native recoloring cannot substitute for these measurements. Add targeted CSS only where the rendered contract fails. Emulate reduced motion only where a real transition exists.
  7. Run Chromium and Firefox on host; run WebKit through the repository's supported official Playwright container if host system libraries are missing. Report exact test/file counts for each engine.
  8. Build Storybook immediately before axe; require every ratcheted story ID to render and zero WCAG 2.1 AA violations.
- **Files**: verification generally reuses WP01/WP02 tests and stories; no unowned mutation.
- **Validation**: exact engine counts, zero axe, no console/page errors, no missing stories.
- **Parallel?**: No after final stories/generation.

### Subtask T016 – Add and inspect targeted visual evidence

- **Purpose**: Pin intentional T11 appearance without accepting locally rendered or unrelated baseline churn.
- **Steps**:
  1. Add targeted cases to `apps/storybook/src/tests/visual.spec.ts` for a minimal complete matrix: default dark and LightMode where not already covered, narrow/long overflow, timeline scale/metadata, and mixed check-bullet state.
  2. Keep case count proportionate; do not snapshot every equivalent story or touch any legacy baseline.
  3. Run the target visual suite locally only to ensure every case reaches comparison and fails solely for absent Linux baselines.
  4. Push/open the train PR when local nonvisual gates are green, let CI generate `visual-regression-diffs`, download the exact-head artifact, and verify candidate names equal the new case set.
  5. Inspect each candidate image, with particular attention to T11 default/light/narrow, long code containment, event metadata attachment, and complete/pending distinction. Reject clipping, collision, false empty states, or page overflow.
  6. Copy only approved Linux candidate PNGs into the snapshot directory, commit them, rerun the visual suite, and then rerun CI because the head changed.
  7. Capture and inspect actual-browser 100%/200% desktop-UI screenshots for representative breadcrumb/prose/timeline/checklist states, and record the exact-head environment, method, measurements, observations, and image SHA-256 values under `docs/architecture/validation/issue-213-work-package-detail-zoom/`, following #211's evidence shape. These are zoom evidence, not substitutions for CI-authoritative visual-regression baselines.
- **Files**: visual spec, only new `sk-breadcrumbs-*`, `sk-prose-*`, `sk-event-timeline-*`, `sk-check-bullet-state-*` Linux PNGs, and issue-213 actual-zoom validation evidence.
- **Validation**: expected new-case count equals new files; exact target suite green after baselines; `git diff --name-only` shows no legacy PNG changes; zoom record proves an actual 2× CSS-viewport/DPR change with matching 100%/200% captures and hashes.
- **Parallel?**: No; depends on rendered final stories and CI artifact.

### Subtask T017 – Rebase and execute the full quality matrix

- **Purpose**: Establish final evidence on the actual combined train, not a stale base or cached generated tree.
- **Steps**:
  1. Before rebase, ensure all useful changes are conventionally committed and reread the spec/current context as required by the high-risk git doctrine.
  2. Fetch and rebase on the latest `origin/train/elements-first`. Resolve authored conflicts semantically and shared generated conflicts by regenerating; never choose one generated side by hand.
  3. Re-run the complete recipe: all generators, builds, size measure/check, drift/content/boundary/hygiene/ratchet/type gates, `npm run quality:all`, gate selftests/wiring, `npm run test`, full `node scripts/suite-selftest.mjs`, Storybook build, axe, relevant full Playwright, and targeted visuals.
  4. Require one complete green mutation run. A timeout/flaky engine is diagnosed and rerun until the gate itself succeeds; no waiver, skipped arm, ceiling weakening, or reclassification.
  5. Verify git has no generated drift. Run commitlint from current train base through head.
  6. Push/re-push mission branch and require CI green on the exact current SHA. Any new commit restarts CI and the pre-merge squad.
- **Files**: global generated outputs may legitimately change after rebase within this WP's owned set; source conflict resolutions must preserve prior WP contracts and trigger their review evidence refresh if material.
- **Validation**: a command/evidence table with exit codes, exact tests/arms/stories/engines, head SHA, and run URL.
- **Parallel?**: No; this is the serial final gate.

### Subtask T018 – Record acceptance and exact-head handoff

- **Purpose**: Make the mission auditable and ready for the gates outside implementation.
- **Steps**:
  1. Use supported Spec Kitty acceptance-verdict/negative-invariant commands to record each SC/constraint outcome; do not hand-edit acceptance matrices or runtime events.
  2. Record Stitch availability honestly: issue contract/current tokens were authoritative because only the account shell was accessible; cite visual Storybook/CI evidence without claiming unseen pixel identity.
  3. Update `expected-stories.json` for every acceptance-evidence story exactly once, using the latest post-rebase total rather than a stale planned number.
  4. Safe-commit owned files, mark T013–T018 done, commit a reviewer profile update, move WP03 to `for_review`, and wait for the synchronous pre-review gate.
  5. After independent WP approval, run `spec-kitty accept --mission 01M1XTPW`; fix every failed invariant rather than bypassing it.
  6. Prepare the PR body with `Refs #213` and `part of #208`, the exact test table, issue exit-criteria mapping, and no closing keyword.
  7. Hand off to the exact-head four-lens Codex-only adversarial gate. Every finding needs severity, file:line, explanation, recommendation, and folded/deferred-numbered disposition.
- **Files**: expected story ratchet and CLI-managed mission evidence; PR text is external evidence.
- **Validation**: Spec Kitty acceptance passes, all WPs approved/done as required, no unresolved finding, PR base/head correct.
- **Parallel?**: No.

## Test Strategy

- Run focused suites first and full gates only after both authored concerns settle.
- Build immediately before size measurement and Storybook axe/browser work.
- Use generated-output `--check` plus clean git status to prevent self-confirming regeneration.
- Require exact story-ID ratchets, exact manifest docs count, surgical mutation reds, one full green mutation suite, and a compile-time React negative.
- Use Linux CI artifacts for visual baselines and inspect images before committing.
- Re-run all affected evidence after any rebase/push; SHA pinning is part of the contract.

## Definition of Done

- T013–T018 are CLI-recorded done and WP03 receives an independent approve verdict.
- Manifest, React/Vue outputs, size report, and every drift/content/ratchet gate are current.
- React accepts only complete/pending for the generated state prop.
- Documentation covers all public native recipes, token dependencies, and ownership/non-goals.
- Full semantic/theme/forced-colors/zoom/scale/cross-browser/axe/visual matrix is green with exact counts.
- One full mutation run and guard self-tests are green without gate changes.
- Branch is rebased on latest train, clean, conventionally committed, and exact-head CI evidence exists.
- Spec Kitty accept passes and PR/gate handoff names the same head SHA.

## Risks & Mitigations

- **Concurrent train collision**: fetch/rebase late and regenerate combined outputs.
- **Self-confirming drift checks**: commit generated bytes, then rerun checks and require clean status.
- **Local visual mismatch**: baselines come only from exact-head Linux artifact.
- **Stale review/CI**: compare PR `headRefOid` to every evidence SHA immediately before merge.
- **Flaky long gate**: diagnose exact arm/engine; do not skip, mute, weaken, or call it blocked after one failure.
- **Mission artifact drift**: acceptance and status changes go only through supported CLI seams.

## Reviewer Guidance

- Load reviewer-renata and audit the aggregate diff from the current train merge base.
- Trace all FRs and SCs to real source/tests/artifacts; reject story-title-only evidence or a visual case that never reached comparison.
- Re-run representative generators, type negative, native semantic checks, axe, mutation arms, and visual target.
- Verify no legacy baseline, long-lived branch, token namespace, unrelated issue, or app behavior changed.
- Ensure the final pre-merge four-lens gate is separate from this WP review and later pinned to the actual PR head.

## Activity Log

- 2026-09-07T11:53:49Z – system – Prompt created.
