# Implementation Plan: sk-confirm-dialog — native-dialog destructive confirmation element

**Branch**: `mission/confirm-dialog-element` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/confirm-dialog-element-01M248TN/spec.md`

## Branch contract (repeated per `/spec-kitty.plan` protocol)

- Current branch at plan start: `mission/confirm-dialog-element`
- Planning/base branch: `mission/confirm-dialog-element`
- Merge target for completed changes: `mission/confirm-dialog-element` (single_branch topology — this mission has no separate coordination branch; the PR back to `train/elements-first` per issue #308 happens from this branch directly)
- `branch_matches_target`: true

## Summary

Add one new Lit custom element, `sk-confirm-dialog`, wrapping the native `<dialog>` opened via `showModal()`. Every user-visible string (title, body, confirm label, cancel label) is a required, consumer-supplied attribute/property with **no fallback text** — the strictest reading of #286 available, since this component is authored while #286 is open. The element exposes exactly two actions (confirm, cancel), composes the existing `.sk-button` contract for the confirm control, and reports the outcome through exactly one mechanism: the platform's own `close` event, read via `HTMLDialogElement.returnValue` (`'confirm' | 'cancel'`). Every path that is not an explicit confirm activation — Escape, backdrop dismissal, or a programmatic close with no explicit value — resolves as `'cancel'`. The element performs no mutation, request, or navigation; it is a pure report. No static (server-rendered) twin is generated for this mission — that question is explicitly deferred to open issue #301's ruling — but the stylesheet is authored so that ruling can be applied later without rework.

## Technical Context

**Language/Version**: TypeScript, compiled through the existing `packages/elements` Lit toolchain (same Node/TS toolchain versions as every other migrated element — no new language or version introduced).
**Primary Dependencies**: `lit` (already a dependency of `@spec-kitty/elements`; no new runtime dependency). Composes the existing `.sk-button` styles/behavior contract (issues #79/#153) for the confirm and cancel controls; no new npm package.
**Storage**: N/A — a presentational/behavioral element with no persisted state. `returnValue` and open/closed state live only on the `<dialog>` element itself while it exists.
**Testing**: Vitest browser mode on the Playwright provider for element behavior (ADR-11's required-behaviours list, via `fixtures/elements-behaviour/`); Storybook + `scripts/run-axe-storybook.js` for accessibility; Playwright for cross-browser and CI-authoritative visual-regression baselines. No new test runner or framework.
**Target Platform**: Modern evergreen browsers with native `<dialog>` + `showModal()` support (Baseline widely available: Chrome, Firefox, Safari — matching the charter's existing cross-browser smoke-test requirement). No IE/legacy support; native `<dialog>` polyfills are explicitly out of scope.
**Project Type**: Single library component, following this repo's existing `packages/<pkg>/src/<name>/` layout — not a web/mobile split.
**Performance Goals**: None beyond standard browser rendering (charter: "No runtime performance targets beyond standard browser rendering — these are static/presentational components, not application logic"). No animation budget beyond what reduced-motion suppresses (FR-011).
**Constraints**: No new npm dependency. Tokens-only CSS (C-006). Zero WCAG 2.1 AA violations (NFR-003). `packages/react/src` regenerated, never hand-edited (C-007). One Work Package, one PR (C-001). No Team/membership/invitation/bearer-link/session model (FR-015). `packages/styles/package.json`'s hand-maintained `exports` map must gain a `./confirm-dialog/*` subpath entry in the same PR that adds `packages/styles/src/confirm-dialog/`, or `scripts/check-release-graph.mjs`'s `checkSubpathCoverage` fails CI (C-010). No repo-wide "no literal text in render()" gate exists yet (that is open issue #286's own deliverable, not this mission's); this mission instead ships one component-scoped, red-first-demonstrated test proving `sk-confirm-dialog` itself carries no bare user-visible text node (FR-018) — verified against `scripts/` at `train/elements-first@2b59c8c`: nothing there inspects rendered text; `check-component-token-literals.mjs` polices CSS design-value literals, an unrelated concern.
**Scale/Scope**: One new custom element (`sk-confirm-dialog`); one new `packages/styles/src/confirm-dialog/` directory holding the authored CSS only (no generated static HTML — see Project Structure); an estimated 6 documented attributes (title, body/message, confirm-label, cancel-label, initial-focus, backdrop-dismiss — exact set finalized in tasks) and roughly 5-7 `::part()`s (dialog, header/title, body, actions, confirm, cancel — exact set finalized in tasks), comparable in size to `sk-notice`'s 5 attributes / 7 parts (#178).

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Charter file present at `.kittify/charter/charter.md` (generated 2026-05-01, not resynced since the elements-first migration — the Angular bundle-size benchmark it names is stale per CLAUDE.md §1, "Angular is not a target"; this plan does not treat that stale figure as a gate).

| Charter gate | Applies? | Assessment |
|---|---|---|
| Storybook story: default + all interactive states + responsive breakpoints | Yes | Planned: Closed, open-short-body, open-long-body (scrolling), very-different-length labels, wrapping title, dark default, `LightMode`, reduced-motion, forced-colors, RTL/logical layout, 200% zoom, narrow width (per #308's "Required stories and tests"). |
| axe-core zero WCAG 2.1 AA violations, load failure = failure | Yes | Planned: `run-axe-storybook.js` over every story above; accessible name from title, description from body verified. |
| Visual diff / reference screenshots | Yes (superseded by CI-authoritative visual-regression baselines, per repo convention since the Claude Design tmp/ reference predates elements-first) | Planned: Playwright visual baselines, harvested from CI per `design-repo-visual-baselines-are-ci-authoritative` convention, not local `--update-snapshots`. |
| Token dependency documentation | Yes | Planned: JSDoc token-dependency list on the element class, same pattern as `sk-notice`. |
| ADR-11 required-behaviours list, red-first | Yes | Applicable ids for this element: SC-005 (focus/keyboard: Escape closes, focus returns, state attributes track real state), SC-006/007/008 (event contract: `close` fires once with the documented `returnValue`, composed/bubbles as documented — note `close` is not cancelable, so SC-009 is not claimed), SC-013 (every declared `::part()` targetable), SC-014 (style adoption, no injected `<style>`), SC-015 (registry guard). SC-002/003/004 (form association) do **not** apply — this element is not form-associated. SC-016 (delegate/rendered-control correspondence) does not apply — no detached probe. SC-017 (responsive threshold) does not apply unless a documented viewport breakpoint is introduced for narrow-width layout; tasks phase decides whether the narrow-width behavior crosses a *documented threshold* (claiming SC-017) or is fluid CSS with no breakpoint (not claiming it) — declaring a subject creates the obligation, per the recipe, so this is decided deliberately in tasks, not defaulted. |
| CSS/SCSS `--sk-*` tokens only | Yes | Planned: stylelint `declaration-strict-value` enforcement, same as every other component; no raw literals. |
| Conventional commits via commitlint | Yes | Scope `elements` (and `styles` for the CSS-only commit, if split) per this repo's enum — no `specs`/`adr` scope exists; spec-phase commits use `docs:` unscoped. |
| Maintainer approval on component/token-layer PRs | Yes | Applies at PR review time, outside this mission's scope (design-phase only). |
| Adversarial squad — tier and cadence | Yes | Issue #308 states **Squad tier: C — pre-merge** for this mission. Per the charter's Review Policy, tier-C is pre-merge only (no post-spec/post-plan/post-tasks point-cuts required); this design-phase mission does not need to arrange a squad pass before handing off to implementation. |
| Deployment/versioning constraints | Yes | A new public custom element and its attributes are an additive API surface; no `--sk-*` token rename occurs, so no major version bump is implied by this mission alone. |

No Charter Check violations requiring justification. Complexity Tracking table below is empty.

## Project Structure

### Documentation (this mission)

```
kitty-specs/confirm-dialog-element-01M248TN/
├── spec.md               # Mission specification (committed)
├── plan.md               # This file
├── research.md           # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output — public-contract description (not a REST/GraphQL API)
├── checklists/requirements.md
└── tasks/                # /spec-kitty.tasks output (not created by this command)
```

### Source Code (repository root)

```
packages/elements/src/confirm-dialog/
├── sk-confirm-dialog.ts            # the Lit element (authored)
└── sk-confirm-dialog.stories.ts    # Storybook stories (authored)

packages/styles/src/confirm-dialog/
└── sk-confirm-dialog.css           # CSS source of record (authored)
# No sk-confirm-dialog.markup.ts, no generated sk-confirm-dialog.html / index.ts:
# this element has no server-rendered static form for the INTERACTIVE dialog
# (showModal() has no static equivalent — same shape as sk-notice, #178). The
# STYLESHEET's own static-authorability question (a generated twin for a
# consumer-rendered <dialog>) is explicitly deferred to #301 and not resolved
# by this mission — see FR-016 and research.md's open-question entry.

fixtures/elements-behaviour/src/
└── sk-confirm-dialog.test.ts       # ADR-11 required-behaviours tests

packages/react/src/                 # regenerated by build-react-wrappers.mjs — never hand-edited
packages/elements/vue.d.ts          # regenerated by build-vue-types.mjs — never hand-edited
packages/elements/custom-elements.json   # regenerated by `nx run elements:analyze`
packages/elements/SIZES.md          # regenerated by measure-elements-sizes.mjs

packages/styles/package.json        # HAND-EDIT (not generated): add "./confirm-dialog/*":
                                     # "./dist/confirm-dialog/*" to `exports`, in the same PR as
                                     # packages/styles/src/confirm-dialog/. check-release-graph.mjs's
                                     # checkSubpathCoverage fails CI otherwise (C-010).

# Ratchets updated in the same PR (not authored source, but hand-maintained registries):
expected-parts.json
expected-docs.json
behaviours.json
mutations.json
```

**Structure Decision**: Single-project library layout, matching every existing migrated element (`sk-card`, `sk-nav-pill`, `sk-form-input`, `sk-form-textarea`, `sk-stub`, and the styles-only-CSS elements like `sk-notice`, `sk-copy-field`). No new package, no web/mobile split. `sk-notice` (#178) is the closest structural precedent: a behavior-owning element with no server-rendered static form, consuming existing token/tone infrastructure rather than inventing new CSS categories.

## Complexity Tracking

*Fill ONLY if Charter Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |

## Implementation Concern Map

> One Work Package is mandatory (C-001, issue #308: "one bounded Work Package and one PR"). This
> map exists only to help `/spec-kitty.tasks` sequence the single WP's internal task order — it
> does **not** imply multiple WPs, and `/spec-kitty.tasks` must not split it into more than one.

### IC-01 — Element behavior and public contract

- **Purpose**: Author `sk-confirm-dialog` itself — the Lit element wrapping native `<dialog>`, its required no-default string properties, the two-action model, the single `close`/`returnValue` reporting mechanism, dismissal-is-cancellation handling, documented/overridable initial focus, and focus-return-to-invoker.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-005, FR-006, FR-007, FR-008, FR-009, FR-013, FR-015, FR-017.
- **Affected surfaces**: `packages/elements/src/confirm-dialog/sk-confirm-dialog.ts`.
- **Sequencing/depends-on**: none — this is the foundation the other concerns render, style, and test.
- **Risks**: Getting "dismissal is cancellation" wrong for the backdrop-click case (native `<dialog>` does not auto-close on backdrop click; the element must implement and test this itself). Missing that a programmatic `close()` call with no argument must resolve as `'cancel'`, not an invented default.

### IC-02 — Stylesheet, layout, and platform-preference baselines

- **Purpose**: Author the CSS source of record: layout, scrolling long body, action-group reachability at narrow widths and 200% zoom, `prefers-reduced-motion` suppression, `forced-colors` distinguishability, tokens-only values, RTL/logical properties, and the documented static-twin deferral to #301.
- **Relevant requirements**: FR-004, FR-010, FR-011, FR-012, FR-016, NFR-001, NFR-002, NFR-004.
- **Affected surfaces**: `packages/styles/src/confirm-dialog/sk-confirm-dialog.css`.
- **Sequencing/depends-on**: IC-01 (the element's shadow structure/parts must exist for the CSS to target).
- **Risks**: `sk-form-field`/`sk-card` history in ADR-9/ADR-10 of theme selectors and hardcoded `rgba()` silently failing across the shadow boundary — avoid entirely by using tokens exclusively, per the recipe's worked examples (`sk-disclosure`, `sk-skip-link`).

### IC-03 — Stories, docs, ratchets, and behavior/mutation tests

- **Purpose**: Register the component everywhere the recipe requires: Storybook stories (all required states including `LightMode`), `expected-parts.json`/`expected-docs.json` ratchet entries, `behaviours.json` subject + `mutations.json` red-first arm, the ADR-11 behavior test file plus the component-scoped no-literal-text test (FR-018, unmarked — no ADR-11 id, per the `sk-notice` precedent), generated-artifact regeneration (`custom-elements.json`, React wrappers, Vue types, `SIZES.md`), the `packages/styles/package.json` exports subpath hand-edit (C-010), and the Team-deletion-absence audit (FR-014).
- **Relevant requirements**: FR-014, FR-018, NFR-003, NFR-005, C-006, C-007, C-008, C-010.
- **Affected surfaces**: `packages/elements/src/confirm-dialog/sk-confirm-dialog.stories.ts`, `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts`, `expected-parts.json`, `expected-docs.json`, `behaviours.json`, `mutations.json`, `packages/react/src/**` (generated), `packages/elements/vue.d.ts` (generated), `packages/elements/custom-elements.json` (generated), `packages/elements/SIZES.md` (generated), `packages/styles/package.json` (hand-edited).
- **Sequencing/depends-on**: IC-01, IC-02 (parts/attributes/CSS must be final before their ratchet counts and story states are authored).
- **Risks**: Forgetting a ratchet file entirely is silently green (the recipe's own warning: "Nothing detects that a new component *should* have a behaviour entry"). Under-claiming ADR-11 ids (e.g., skipping SC-013/014/015) or over-claiming ones that don't apply (SC-002-004, SC-009, SC-016) are both reviewable mistakes named explicitly in the Charter Check table above. Forgetting the `packages/styles/package.json` exports entry is NOT silently green — `check-release-graph.mjs` fails CI — but it is still easy to omit from the PR since it is a hand-edit one directory away from the new CSS. Conflating FR-018's component-scoped test with #286's (not-yet-built) repo-wide gate would be scope theft from an open issue owned elsewhere.
