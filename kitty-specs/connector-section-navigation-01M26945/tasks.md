# Tasks: Connector section navigation

**Input**: `spec.md`, `research.md`, `data-model.md`, `plan.md`, `quickstart.md`, and
`contracts/section-nav.md`
**Planning base / merge target**: `mission/connector-section-navigation` (topology `single_branch`
— planning and the single implementation Work Package both land on this branch; there is no
separate lane branch). Implementation's single PR targets `train/elements-first`.

## Work-package topology

Exactly one Work Package and one PR, per issue #337's own instruction. `.sk-section-nav` is one
styles-layer public contract: the authored CSS, canonical native HTML fixtures, generated
TypeScript barrel, public exports, Storybook stories, accessibility/behaviour evidence, story
ratchet entries, and consumer documentation must land together. None is independently releasable
without exposing either an incomplete or an unverified public API. Shared repository generators and
gates validate that contract; they are not separate architectural deliverables (see plan.md's
Complexity Tracking).

## Subtask index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Fetch/reconcile the latest train, record baseline bytes for the element manifest/React/Vue outputs (expected unchanged), and author the focused failing Playwright acceptance contract first — landmark/link semantics, absence of `tablist`/`tab` roles and arrow-key script, `aria-current` fidelity, native-behaviour preservation, non-colour-alone states, containment/overflow/focus, target geometry, RTL, forced colors, reduced motion, zoom — so the missing stylesheet/stories fail for the intended reasons (FR-001–FR-018; NFR-001–NFR-005; C-001–C-013). | WP01 | No |
| T002 | Author the token-only `.sk-section-nav` stylesheet and the canonical native `.html` fixtures — default 3-route administrator shape (current=middle), 2-route member/permission-subset shape, 1-route, many-route (6+, forces local overflow), no-current, and long-labels — with no JavaScript, no tab roles, and no reserved space for an omitted route (FR-001–FR-012; NFR-002; NFR-005; C-001–C-013). | WP01 | No |
| T003 | Generate the styles-only TypeScript barrel via `scripts/build-styles-only-markup.mjs`, wire the root/subpath exports in `packages/styles/src/index.ts` and `packages/styles/package.json`, and author the axe-enabled Storybook catalogue — administrator/member shapes, first/middle/last/absent current, one route, many routes, long labels, narrow/local-overflow, default dark, real `LightMode`, forced colors, reduced motion, 200% zoom, short viewport, RTL — ratcheting every story id in `expected-stories.json` in the same commit (FR-017; NFR-003; NFR-004). | WP01 | No |
| T004 | Turn the focused contract green in Chromium and Firefox (WebKit where locally available): one named landmark with native links and zero `tablist`/`tab`/`tabpanel` roles; no arrow-key/roving-`tabindex` script; `aria-current` fidelity across first/middle/last/absent/explicit-`false`; no intercepted native link behaviour; non-colour-alone rest/hover/active/focus-visible/current states; local-only horizontal overflow with document `scrollWidth === clientWidth`; a scrolled-into-view, unclipped focus indicator for an off-screen-at-rest link; the 44px target floor; RTL mirroring; forced-colors current/focus distinction via border/outline; reduced-motion transition removal (FR-001–FR-016; NFR-001; NFR-005; SC-001–SC-004). | WP01 | No |
| T005 | Document the public native structure, the full consumer-ownership boundary (label, hrefs, labels, order, permission-gated presence, `aria-current`), the styles-only rationale, and the explicit non-goal boundary against `.sk-context-nav`, `sk-nav-pill`, `.sk-breadcrumbs`, and `.sk-segmented-choice` in `docs/design-system/using-components.md`; confirm no provider-specific (Connectors) vocabulary entered the package (FR-013, FR-018; C-001–C-013; SC-006). | WP01 | No |
| T006 | Regenerate every shared artifact from source after a real build (tokens/styles builds, `measure-elements-sizes.mjs`), run the full drift/content/hygiene/lint/typecheck ladder from `docs/contributing/adding-a-component.md` §7, confirm `custom-elements.json`/React/Vue outputs are byte-for-byte unchanged, run `npm run test`, `node scripts/suite-selftest.mjs`, the Storybook build, and `node scripts/run-axe-storybook.js`; execute and record every acceptance criterion on one committed SHA (all requirements; NFR-003; NFR-004). | WP01 | No |
| T007 | Immediately before independent review and PR delivery: fetch/rebase onto current `origin/train/elements-first`, regenerate and rerun affected/full gates on the exact SHA; complete independent reviewer-seat review and the programme's Tier-C pre-merge squad; remediate every finding and repeat review after any push; open one PR into `train/elements-first` with `Closes #337` and `Refs #335` (never a closing keyword on #335 itself), noting the merges-auto-deploy-production fact and that Family 3 is not yet Lynn-approved; hand off without merging (FR-017, FR-018; NFR-001–NFR-005; C-001–C-013). | WP01 | No |

No `[P]` task is honest here: T001 creates the red contract; T002 supplies the source it targets;
T003 requires the final fixtures; T004 requires runnable stories; T005 documents the stable public
API; T006/T007 require the complete exact-head delta. Every subtask is sequential within the one
Work Package.

## Work package

### WP01 — Section-navigation strip contract

- **Goal**: publish exactly the `.sk-section-nav` family (root + `__link`) on consumer-authored
  native `<nav>`/`<a>` markup — a horizontal strip of sibling, same-level route links generalized
  from Family 3's repeated `.detail-tabs` CSS — with no custom element, no tab roles, and no owned
  JavaScript behaviour.
- **Priority**: P1 — it is the complete outcome of #337 and the public dependency TKC3 consumes
  after merge.
- **Independent test**: the focused Playwright module passes on Chromium and Firefox (and WebKit in
  the repository's full suite where available); the built story set is ratcheted, non-empty,
  axe-clean, and theme-correct; the generated barrel/export/release checks pass; RTL/forced-colors/
  reduced-motion/zoom evidence is recorded; and the element manifest/React/Vue outputs remain
  byte-for-byte unchanged.
- **Included subtasks**: T001–T007.
- **Dependencies**: current train tokens/styles only. `.sk-context-nav` (#256/#264) is direct
  procedural precedent, not a source prerequisite — no code or export from it is consumed. No other
  Family 3 child mission is a source prerequisite for this one.
- **Owned surfaces**: `packages/styles/src/section-nav/**`, `packages/styles/src/index.ts`,
  `packages/styles/package.json`, `apps/storybook/src/tests/sk-section-nav.spec.ts`,
  `expected-stories.json`, `docs/design-system/using-components.md`, and regenerated shared outputs
  required by the current component recipe.
- **Risks**: shared generated outputs can collide with concurrent Wave A/#335-sibling work (rebase
  before final evidence); a `background`-only or `box-shadow`-only current/focus cue would silently
  fail forced colors (use `border`/`outline`, per plan.md's IC-01); an off-screen-focus test that
  only checks `document.activeElement` rather than geometry would pass even if the outline were
  clipped; WebKit or true browser-UI zoom may be host-limited.

## Requirement and invariant coverage

- T001–T003 cover FR-001–FR-018, NFR-002–NFR-004, and C-001–C-013 in source/distribution form.
- T004 covers FR-001–FR-016, NFR-001, NFR-005, SC-001–SC-004 in real browsers.
- T005 covers FR-013, FR-018, C-001–C-013, SC-006 in public guidance and ratchets.
- T006/T007 cover every requirement on the final rebased SHA and prove SC-005.

All FR-001–FR-018, NFR-001–NFR-005, and C-001–C-013 are mapped. Success criteria are WP acceptance
outcomes rather than requirement refs, matching the `.sk-context-nav` precedent's own disposition.

## MVP and delivery boundary

The whole WP is the MVP. The implementer completes the WP and the independent-review loop on this
same `mission/connector-section-navigation` branch (single_branch topology — no separate lane
branch is cut). This mission opens exactly one PR into `train/elements-first` with `Closes #337`
and `Refs #335`; the programme orchestrator, not this WP, controls Family 3's overall sequencing and
issue close-out.
