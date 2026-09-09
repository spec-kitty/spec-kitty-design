# Research: Mission Reading pattern stories

## Decision summary

The approved M1–M8 Mission Reading family can be proven as a single Storybook pattern module built entirely from current public design-system surfaces. The mission adds no package, token, custom element, framework wrapper, router, or application service. One deeply frozen fixture supplies every repeated Mission, git, catalogue, document, artifact, Ops, observed, and reported-live value; small pure projections validate and select what each story renders.

The cohesive delivery unit is one work package. Splitting the fixture, projections, render functions, browser assertions, documentation, and exact-head visual baselines across PRs would create temporary duplicate sources and shared-file collisions while violating the one-fixture truth contract. One work package still preserves the repository's one-work-package/one-PR policy.

## Evidence reviewed

- GitHub issue #265 and epic #263 bind the public-surface composition, truth boundaries, required M1–M8 states, resilience matrix, and non-goals.
- The complete approved Mission Reading corpus was reviewed: `README.md`, `DESIGN.md`, `BACKEND-CAPABILITY-MAP.md`, `MVP-ISSUE-AUDIT.md`, `SCREEN-MATRIX.md`, every review record, nine HTML artifacts, ten PNGs, and their artifact manifests under `/home/jeroennouws/dev/team-kitty-missions/ux_redesign/mission-reading/`.
- The live design train was re-fetched at `86058d912313360d78cdbcf66cbc4b034389a7b4`. It contains #254, #256, and #264, including the controlled compact-navigation seam and `.sk-context-nav__unavailable` anatomy. The only open train PR at mission start was unrelated #285.
- Team Kitty `main` was rechecked at `df5dd312019d683716976fe7833c30d8a3f0e0cb`. Its current `rendered_repo.py` still supplies bounded children only for Research, Contracts, Checklists, and Other artifacts; Ops remains terminal; pushed time still requires a branch-head SHA match; and the Mission route still separates committed fragments, extras, Ops, observed moments, and live content.
- Issue #255 remains open with no active PR. #265 may proceed in parallel by rebasing and regenerating shared artifacts; no #255 branch code is copied.
- ADR-9 limits styling to tokens, declared parts, and documented custom properties; patterns must not reach into shadow roots. ADR-10 preserves native light-DOM semantics and generated-artifact boundaries. ADR-11 requires real-browser behavior evidence for owned interaction. The current authoring recipe supplies the generation and full-gate order.
- `scripts/check-pattern-composition.mjs` already enforces the correct pattern directory and rejects shadow-root reach-through and duplicated component CSS. Existing `team-overview` and `work-package-views` patterns establish immutable fixture, pure projection, inline token-only layout, Storybook, browser-test, story-ratchet, visual-baseline, and documentation conventions.

## Binding interpretation of the approved family

- `factual` means committed content tied to the one supplied planning SHA and branch. `observed` means a separately labelled activity projection with its own lag claim. `reported-live` means presence data with its own freshness claim. No projection may join live presence to a Work Package.
- A matching branch-head marker is the only source of pushed time. Absence of that marker means no pushed time is rendered.
- Loading reserves the reviewed document geometry and exposes a stable polite status plus `aria-busy`; it invents no document title, facts, count, owner, action, or timestamp. Placeholder geometry is pattern-owned and hidden from assistive technology. No published skeleton or spinner is created.
- Available destinations are native anchors. Unavailable destinations use the landed non-anchor context-navigation anatomy with no child list, current state, URL, click behavior, button role, or tab stop.
- Other artifacts are a bounded supplied list of four native links in the present fixture and zero rows/children/actions in the absent fixture. Ops is a terminal destination and its sole present row exposes only Invocation, Action, and Status.
- The older dark-first design limitation does not waive issue #265's newer explicit `LightMode` proof. Light mode is a design-system verification variant, not a new Team Kitty product approval.

## Architecture and file placement

- Author one new `packages/elements/src/patterns/mission-reading.stories.ts` module. It may own fixture-only page layout CSS, but every declaration uses an existing `--sk-*` token and every class follows `sk-mission-reading-pattern__*` BEM naming.
- Import only public element modules and compose styles-only public classes in light DOM. Do not add an element barrel export because this is a Storybook pattern, not published runtime API.
- Add focused browser coverage in `apps/storybook/src/tests/sk-mission-reading-pattern.spec.ts`, register all story IDs in `expected-stories.json`, add exact visual cases to `apps/storybook/src/tests/visual.spec.ts`, and update `docs/design-system/using-components.md` with the consumer/library seam.
- Use the existing `sk-app-shell` controlled `presentation="compact"`, `open`, `compactTrigger`, and `sk-app-shell-dismiss` contract. Story code may control fixture presentation and respond to dismissal; it must not implement routing or persist state.
- Regenerate only through repository tooling. Element manifest, React wrapper, Vue declaration, and size outputs should remain byte-stable unless the final train rebase contains unrelated upstream regeneration.

## Alternatives rejected

| Alternative | Rejected because |
|---|---|
| Publish `sk-mission-reader` or a page element | Moves application composition and truth policy into the library, contrary to #265. |
| Add artifact/Ops/truth-band/tier-badge/loading components | Each shape is a one-page composition from existing elements and native semantics; a new contract would freeze Team Kitty vocabulary or behavior. |
| Copy the approved HTML/CSS verbatim | Duplicates component CSS, bypasses public surfaces, includes obsolete local component-like classes, and fails the composition boundary. |
| Reuse temporary work from #255 | #255 has no landed public contract; coordination is by train rebase and regeneration only. |
| Add a router or state store to make links functional | Stories need native hrefs and recorded navigation intent only; application routing is expressly excluded. |
| Derive a single page-wide freshness value | Collapses factual, observed, and reported-live claims into a false shared truth boundary. |
| Split the family across several work packages | The same fixture, story module, tests, visual registry, and documentation would overlap across PRs and temporarily violate the one-source fixture invariant. |

## Risks and mitigations

- **Dense story surface:** use named render options over duplicated story markup, and keep route-state projections pure and exhaustively asserted.
- **Responsive drawer misuse:** exercise the shipped controlled seam at 861/860/859px and 390px, including closed-tree suppression, Escape dismissal, and focus return.
- **Visual drift from approved screens:** preserve the reviewed information hierarchy and geometry while using current public contracts; compare exact-final-head baselines, not copied CSS.
- **A11y regressions hidden by screenshots:** add DOM/accessibility, link/tab-order, heading, busy-region, table-overflow, and axe coverage for every story.
- **Train movement or #255 overlap:** fetch/rebase immediately before final verification, regenerate all derived artifacts, rerun the full gate, and review the exact new head.

## Open questions

None. The issue contract resolves the only apparent conflict: the source design is dark-first, while this design-system proof must also ship a valid `LightMode` story.
