---
work_package_id: WP01
title: Section-navigation strip contract
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
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
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
planning_base_branch: mission/connector-section-navigation
merge_target_branch: mission/connector-section-navigation
branch_strategy: Planning artifacts for this mission were generated on mission/connector-section-navigation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/connector-section-navigation unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - Implementation
history:
- timestamp: '2026-09-10T18:40:00Z'
  agent: claude
  action: Prompt authored during design phase (spec -> plan -> tasks)
authoritative_surface: packages/styles/src/section-nav/
create_intent:
- packages/styles/src/section-nav/sk-section-nav.css
- packages/styles/src/section-nav/sk-section-nav-default.html
- packages/styles/src/section-nav/sk-section-nav-two-route.html
- packages/styles/src/section-nav/sk-section-nav-one-route.html
- packages/styles/src/section-nav/sk-section-nav-many-routes.html
- packages/styles/src/section-nav/sk-section-nav-no-current.html
- packages/styles/src/section-nav/sk-section-nav-long-labels.html
- packages/styles/src/section-nav/sk-section-nav-html.stories.ts
- packages/styles/src/section-nav/index.ts
- apps/storybook/src/tests/sk-section-nav.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/section-nav/**
- packages/styles/src/index.ts
- packages/styles/package.json
- apps/storybook/src/tests/sk-section-nav.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/*section-nav*
- expected-stories.json
- docs/design-system/using-components.md
- packages/elements/SIZES.md
role: implementer
tags:
- styles-only
- native-semantics
- accessibility
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Section-navigation strip contract

## Goal

Publish exactly the `.sk-section-nav` styles-only family — a root class on a consumer-authored
native `<nav>` and a `__link` class on its native `<a>` children — presenting a horizontal strip of
sibling, same-level route links. No custom element is registered, no ARIA tab role is used
anywhere, and the family owns zero JavaScript behaviour. This generalizes the repeated local
`.detail-tabs` CSS Family 3's `C6`-`C9a` product-evidence screens each hand-roll for their own
sibling installation routes (issue #337, part of epic #335).

## Scope (see spec.md for the full, numbered contract)

**In scope** — FR-001 through FR-018, NFR-001 through NFR-005, all binding per spec.md:

- One coherent `.sk-section-nav`/`.sk-section-nav__link` class pair, styles-only, no custom element,
  no tab roles (FR-001).
- Zero library-owned inference: nav label, hrefs, link text, order, permission-gated presence, and
  `aria-current` are all exclusively consumer-supplied (FR-002).
- Every anchor stays a real, unwrapped `<a href>` with no family-owned listener — modified-click,
  copy-link, open-in-new-tab, visited, and browser-history behaviour all keep working natively
  (FR-003).
- Rest/hover/active/focus-visible/current-location states each distinguishable by more than colour;
  `:visited` is explicitly NOT required to differ from `:link` (FR-004).
- Local horizontal overflow containment only — the strip is its own scroll container; the document
  never scrolls horizontally because of this family (FR-005).
- A focused link scrolls fully into view without its focus indicator being clipped (FR-006).
- One, two, three, and many (6+) routes; first/middle/last/absent current; permission-supplied
  subsets — with zero reserved space, placeholder, or affordance for an omitted route (FR-007).
- Long, unbroken labels remain fully accessible and contained, including in a narrow (~320px) host
  (FR-008).
- Logical CSS properties throughout for correct RTL mirroring (FR-009).
- 44×44 CSS-pixel minimum target via `--sk-space-9` — never an un-tokened `44px` literal (FR-010).
- `forced-colors: active` preserves the current-location and focus distinction via `border`/
  `outline` recolor, never a `background`-only mechanism (FR-011).
- `prefers-reduced-motion: reduce` disables exactly any transition the family owns; no transition is
  added solely to satisfy this requirement (FR-012).
- Zero hardcoded copy anywhere in CSS, generated markup, or stories — every user-visible string is
  consumer-supplied (FR-013, #286).
- Tests explicitly assert the ABSENCE of `tablist`/`tab`/`tabpanel` roles and of any arrow-key or
  roving-`tabindex` script — a real requirement, not an incidental check (FR-014).
- Accessibility-tree checks: exactly one named navigation landmark, native links only, and the
  reported current state matches exactly what the consumer supplied (FR-015).
- Keyboard/pointer checks: sequential Tab reaches every link once in DOM order; native activation
  behaves as the unmodified browser default (FR-016).
- Storybook stories, canonical HTML exemplars, and the generated TypeScript barrel via
  `scripts/build-styles-only-markup.mjs` for every required state; generated output is never
  hand-edited (FR-017).
- Public documentation of the native structure, the full ownership boundary, the styles-only
  rationale, and the non-goal boundary against `.sk-context-nav`/`sk-nav-pill`/`.sk-breadcrumbs`/
  `.sk-segmented-choice`; every cited story is registered in `expected-stories.json` (FR-018).

**Out of scope / binding non-goals** — C-001 through C-013 (router; tab widget; tabs/panels
relationship; roving tabindex/arrow-key model; responsive drawer; context/sidebar navigation;
primary/global navigation; breadcrumbs; route discovery; permission logic; hidden-route
placeholders; counters/badges; copy defaults). See spec.md's Constraints table for the exact,
binding wording of each.

## Reference material (read before writing any code)

- `spec.md` — the full FR/NFR/C table and the Terminology section resolving "section navigation"
  vs. `.sk-context-nav`/`sk-nav-pill`/`.sk-breadcrumbs`/`.sk-segmented-choice`.
- `plan.md` — real file paths, the Implementation Concern Map (IC-01–IC-04), the public CSS/markup
  design, the browser/accessibility matrix, and the full Verification ladder (every gate command).
- `research.md` and `contracts/section-nav.md` — the decisions (R-001–R-008) and the exact class
  surface/state contract.
- `packages/styles/src/context-nav/sk-context-nav.css` and
  `packages/styles/src/context-nav/sk-context-nav-html.stories.ts` — direct precedent for
  `aria-current` selector shape, forced-colors block shape, and generated-barrel story wiring.
- `docs/contributing/adding-a-component.md` — the full component recipe, especially §"Forced-colors
  and reduced-motion baselines" and the ratchet table in §4 (only `expected-stories.json` applies to
  this styles-only family — do not touch `expected-parts.json`, `expected-docs.json`, or
  `behaviours.json`/`mutations.json`).
- `docs/contributing/running-quality-checks.md` — local gate parity with CI.
- `/home/jeroennouws/dev/team-kitty-missions/ux_redesign/families/03-connectors/screens/
  C6-installation-detail-dark.html` (and `C7`/`C8`/`C9a`) — the `.detail-tabs` shape this mission
  generalizes. Read-only evidence: extract the shape, never copy the CSS or any Connectors-specific
  word into the library.

## Acceptance

- The focused Playwright module (`apps/storybook/src/tests/sk-section-nav.spec.ts`) passes on
  Chromium and Firefox (WebKit where locally available).
- The built Storybook story set for `sk-section-nav` is non-empty, ratcheted in
  `expected-stories.json`, and axe-clean across every required state.
- `scripts/build-styles-only-markup.mjs --check` is clean; `custom-elements.json`,
  `packages/react/src/**`, and `packages/elements/vue.d.ts` are byte-for-byte unchanged
  (`git diff --exit-code`).
- Every gate in plan.md's Verification ladder passes on the exact reviewed SHA, and
  `git status --porcelain` is empty after the final commit.
- A separate reviewer seat has approved the diff independently (never self-approved), and the
  programme's Tier-C pre-merge squad has run on the exact implementation SHA.
- One PR is opened into `train/elements-first` with `Closes #337` and `Refs #335` (never a closing
  keyword on #335 itself), noting that merges auto-deploy production and that Family 3 is not yet
  Lynn-approved. The PR is handed off without merging — the operator merges.
