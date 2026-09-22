---
work_package_id: WP01
title: Native unavailable context-navigation entries
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
planning_base_branch: train/elements-first
merge_target_branch: train/elements-first
branch_strategy: Planning artifacts for this mission were generated on train/elements-first. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into train/elements-first unless the human explicitly redirects the landing branch.
base_branch: train/elements-first
base_commit: 22f0b3e893352efcc9f146037f78180f78edafb5
created_at: '2026-09-08T00:00:00+02:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - unavailable context-navigation extension
history:
- at: '2026-09-08T00:00:00+02:00'
  actor: system
  action: Prompt authored through the Spec Kitty tasks phase for issue 264
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/context-nav/
create_intent:
- packages/styles/src/context-nav/sk-context-nav-unavailable-mixed.html
- packages/styles/src/context-nav/sk-context-nav-unavailable-all.html
- packages/styles/src/context-nav/sk-context-nav-unavailable-parent.html
- packages/styles/src/context-nav/sk-context-nav-unavailable-long.html
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/context-nav/**
- apps/storybook/src/tests/sk-context-nav.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/*context-nav*
- expected-stories.json
- docs/design-system/using-components.md
- packages/elements/SIZES.md
role: implementer
tags:
- styles-only
- native-semantics
- accessibility
task_type: implement
tracker_refs:
- https://github.com/spec-kitty/spec-kitty-design/issues/264
---

# Work Package Prompt: WP01 — Native unavailable context-navigation entries

## Required agent and profile

Use Codex only. Never invoke Claude, Claude Code, Hermes, `/tk`, or legacy Team Kitty
transports. Load the `frontend-freddy` profile through the current Spec Kitty doctrine/profile
surface before implementation. Review must be a distinct reviewer-profile pass through the
Spec Kitty review surface against a committed SHA.

## Objective

Extend the existing styles-only `.sk-context-nav` family with exactly two public selectors:
`.sk-context-nav__unavailable` for native non-anchor unavailable content and
`.sk-context-nav__annotation` for optional visible consumer text. Done means the extension
can coexist with available, current, and nested anchors; creates no interaction or false current
state; remains contained and legible across required resilience modes; and ships with canonical
HTML, generated exports, Storybook, browser/visual evidence, documentation, and clean repository
gates.

Read this mission's `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`,
`contracts/context-nav-unavailable.md`, issue #264, merged #262, ADR-9/10/11, the checkout
instructions, charter, and current component-authoring recipe before source changes. The spec is
binding.

## Public surface and non-goals

Canonical anatomy is a `span.sk-context-nav__unavailable[aria-disabled="true"]` inside the
existing native `li.sk-context-nav__item`. It contains a
`span.sk-context-nav__label` and may contain a
`span.sk-context-nav__annotation` with consumer-supplied text. It is not an anchor, button,
custom element, or application state object.

Unavailable content has no `href`, handler, button role, `tabindex`, tab stop, hover/active
treatment, pointer cursor, or focus treatment. Only real `.sk-context-nav__link[href]` anchors may
carry `aria-current`. Do not generate annotation text, children, a fallback current item, counts,
reasons, routing, disclosure, loading, retry, pending, focus management, or application behavior.
Do not alter `sk-context-sidebar`, `sk-app-shell`, `sk-nav-pill`, existing context-nav defaults,
tokens, manifest, React/Vue output, or product vocabulary.

## Subtasks

### T001 — Refresh, baseline, and red contract

1. Fetch `origin/train/elements-first`; ensure #262's merge and `.sk-context-nav` exist in the lane.
2. Record the exact train/lane base and pre-change hashes for token definitions,
   `custom-elements.json`, React sources, `vue.d.ts`, behavior/mutation registries, neighboring
   component sources, and existing context-nav fixtures.
3. Extend `apps/storybook/src/tests/sk-context-nav.spec.ts` first. Assert the two missing selectors,
   exact native fixture semantics, required story IDs, distribution/docs coverage, forbidden
   surfaces, real browser interaction invariants, accessibility tree, containment, and themes.
4. Run the smallest focused command and record the intended red caused only by the absent extension.

### T002 — Authored CSS and canonical fixtures

1. Add only `.sk-context-nav__unavailable` and `.sk-context-nav__annotation` to the existing CSS.
   Use existing semantic tokens and logical properties; no raw design values or token additions.
2. Keep the unavailable selector completely outside link pseudo-state selectors. Do not add
   `cursor: pointer`, focusability, generated content, or animation. Give it a visibly static shape
   and muted semantic foreground while visible annotation/native disabled state prevents colour-only
   communication.
3. Ensure label and annotation can wrap without clipping or inline/document overflow at 240px and
   390px. Preserve full text, RTL mirroring, forced-colour legibility, and adjacent real-link focus.
4. Author generic fixtures for mixed available/current/nested/unavailable entries; an unavailable
   entry without annotation; an all-unavailable/no-current catalogue; an unavailable parent with no
   children beside an available parent with real children; and long natural/unbroken text.
5. Fixtures use native `nav`, headings, `ul`, `li`, `a[href]`, and `span` only as appropriate.
   Unavailable rows have `aria-disabled="true"` and no `href`, role, handler, or `tabindex`.

### T003 — Generation, stories, ratchets, and documentation

1. Run `node scripts/build-styles-only-markup.mjs`; never hand-edit the generated context-nav
   `index.ts`, then run its check mode.
2. Add separately addressable axe-enabled Storybook routes for mixed, annotation-free,
   all-unavailable, unavailable-parent, long content/narrow, forced colours, RTL, and real
   `LightMode`. Reuse generated fixture constants rather than copying canonical markup.
3. Update `expected-stories.json` and current context-nav visual registration/baselines according to
   repository policy. Visual evidence must be captured from the final rebased head.
4. Extend `docs/design-system/using-components.md` with exact anatomy, optional consumer text,
   disabled-anchor prohibition, all-unavailable/no-current and unavailable-parent rules, consumer
   ownership, and the ADR-10 styles-only rationale.
5. Prove no custom element, wrapper, token, behavior/mutation subject, package, or Team Kitty
   vocabulary entered the public surface.

### T004 — Focused browser contract

Prove in Chromium and Firefox:

- named native navigation and list/listitem order remain intact; unavailable content exposes
  `aria-disabled` but no link/button role, URL, activation handler, or tab stop;
- sequential focus visits adjacent real links exactly once and unavailable hover, trusted
  mouse-down, click, and focus attempts produce no presentation/state change or activation;
- `aria-current` exists only on real links; mixed states preserve #256 cues; an all-unavailable
  fixture has no current item; an unavailable parent has no nested list;
- complete long label/annotation text is contained at 240px and a 390px viewport, browser zoom
  200%/400%, and RTL without page-level horizontal overflow;
- real `.sk-light` resolves different semantic colours, forced colours preserves legibility and
  state, reduced motion sees no owned transition, and axe reports zero violations.

Viewport resizing and CSS `zoom` do not substitute for required actual browser zoom evidence.

### T005 — Rebase and complete exact-head verification

Immediately before final gates, fetch and rebase onto current `origin/train/elements-first`.
Regenerate derived output from authored source and inspect every diff. Run the component recipe and
every repository-required quality, type, build, Storybook, axe, Chromium/Firefox/WebKit browser,
visual-regression, mutation/selftest, composition-boundary, generated-artifact, package/release,
offline, and security gate. Record exact commands, versions, SHA, results, and honest host or CI
limitations. Do not claim commands that did not complete. Confirm all frozen surfaces remain
byte-identical except separately identified train movement.

### T006 — Exact-head review and PR handoff

Run a distinct Codex reviewer-profile pass through the Spec Kitty review surface and all mandatory
charter lenses against the committed final SHA. Record findings and dispositions. Fix every
confirmed finding; any content change, rebase, or push invalidates and repeats affected visual,
gate, and review evidence.

Open exactly one PR targeting `train/elements-first` whose body uses `Refs #264`, never closes
#263, and names the exact evidence SHA. Do not widen or modify PR #262.

## Completion evidence

Return the final lane/head SHA, origin-train base, authored/generated inventory, frozen-surface hash
comparison, red-first result, complete exact-command verification matrix, browser and real-zoom
observations, reviewed final-head visual evidence, review cycles/findings/remediations, and PR URL.
