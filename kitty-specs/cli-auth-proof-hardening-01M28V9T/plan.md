# Implementation Plan: CLI Auth Proof Hardening

**Branch**: `mission/cli-auth-proof-hardening` | **Date**: 2026-09-11 | **Spec**: `kitty-specs/cli-auth-proof-hardening-01M28V9T/spec.md`
**Input**: Feature specification from `kitty-specs/cli-auth-proof-hardening-01M28V9T/spec.md`

## Summary

Harden two deferred findings from the CLI-auth pattern proof (#329/#409): (1) align the story-local `.sk-cli-auth-pattern` narrow-width breakpoint in `packages/elements/src/patterns/cli-auth.stories.ts` from `390px` to `480px` so it matches the `sk-boundary-page` frame it composes for stories 3-4 (FR-001), verified against the five other named pattern families for the same defect (FR-002 — measured: none found, see Research below); and (2) replace the five-name regex denylist in `apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts`'s composition-inventory test with a derived enumeration — every `sk`-prefixed tag/class actually present in the rendered DOM checked against the generated Custom Elements Manifest and `check-pattern-composition.mjs`'s exported `ownedClasses()` (FR-003 through FR-006). No new component, no new custom element, no production code path touched — this is test/story hardening inside the existing pattern-proof surface.

## Technical Context

**Language/Version**: TypeScript (esbuild-transpiled, Node 22.22.2), Lit web components, Playwright test specs.
**Primary Dependencies**: `@storybook/web-components`, `lit`, `@playwright/test`, `axe-playwright`, `esbuild`, `postcss` (already used by `check-pattern-composition.mjs` for its `ownedClasses()` derivation). No new dependency is introduced.
**Storage**: N/A (static design-system package; no runtime data).
**Testing**: Playwright spec (`apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts`) against a built Storybook static bundle; `npm run quality:lint` (`nx run-many --target=lint --all`, never `nx run storybook:lint`); direct execution of `scripts/check-pattern-composition.mjs` where relevant.
**Target Platform**: Browser-rendered web components (Chromium/Firefox/WebKit via Playwright), consumed as static CSS/HTML/JS packages.
**Project Type**: Single monorepo, npm workspaces + Nx (`packages/tokens`, `packages/styles`, `packages/elements`, `apps/storybook`).
**Performance Goals**: N/A beyond NFR-001 (deterministic, non-flaky Playwright spec).
**Constraints**: See spec.md's Constraints table (C-001 through C-006) — do not touch `visual.spec.ts`; baselines are CI-authoritative; no hand-edited generated artifacts; `sk-boundary-page-form-card` composition is out of scope; single bounded WP; never `nx run storybook:lint`.
**Scale/Scope**: Two files touched in the primary change (`cli-auth.stories.ts`, `sk-cli-auth-pattern.spec.ts`); one new exported helper reused from `scripts/check-pattern-composition.mjs`.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Testing Standards** — satisfied by design: FR-006 requires a red-first proof (planted `<sk-auth-panel>`, executed, reverted) for the new derived check, matching the charter's "demonstrated to fail before it passes" requirement, and the charter's "no snapshot-only tests" bar is respected — the DOM inventory check asserts membership, not a markup snapshot.
- **Quality Gates** — CSS/SCSS-only-tokens gate is not implicated (no new CSS values are introduced; `480px` already exists verbatim in `sk-boundary-page.css`). Conventional commits via commitlint apply to every commit this mission makes (see Constraints C-006's sibling note on scope-enum; unscoped `docs:`/`elements:`/`storybook:` per `commitlint.config.cjs`'s closed enum — no `specs`/`spec`/`patterns`/`test` scope exists).
- **Branch Strategy / Review Policy** — this WP stops short of PR/merge per the mission brief; the adversarial squad and operator merge happen outside this agent's remit. No violation to justify.
- No Charter Check violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this mission)

```
kitty-specs/cli-auth-proof-hardening-01M28V9T/
├── plan.md              # This file
├── research.md          # Phase 0 output — manifest provenance + family sweep evidence
├── data-model.md         # Phase 1 output — the two derived-set entities the new check reads
├── quickstart.md         # Phase 1 output — how to run the red-first proof manually
├── contracts/            # Phase 1 output — the derived-check's input/output contract
└── tasks.md              # Phase 2 output (/spec-kitty.tasks — not produced by /spec-kitty.plan)
```

### Source Code (repository root)

```
packages/
├── elements/
│   ├── custom-elements.json                          # generated CEM — read, never hand-edited
│   └── src/patterns/
│       ├── cli-auth.stories.ts                        # FR-001: breakpoint change (line ~106)
│       ├── team-overview.stories.ts                    # FR-002: sweep target (720px — verified consistent)
│       ├── mission-kanban.stories.ts                    # FR-002: sweep target (no local width breakpoint)
│       ├── repository-dossier.stories.ts                # FR-002: sweep target (@container 720px — verified consistent)
│       ├── work-explorer.stories.ts                     # FR-002: sweep target (no local width breakpoint)
│       ├── work-package-views.stories.ts                # FR-002: sweep target (no local width breakpoint)
│       └── mission-reading.stories.ts                    # FR-002: sweep target (no local width breakpoint)
└── styles/src/boundary-page/sk-boundary-page.css        # source of truth for the 480px breakpoint (read-only)

apps/storybook/src/tests/
└── sk-cli-auth-pattern.spec.ts                           # FR-003-FR-006: denylist -> derived enumeration
                                                            # (visual.spec.ts in this same dir is OUT OF SCOPE — C-001)

scripts/
└── check-pattern-composition.mjs                         # FR-005: source of the reused `ownedClasses()` export
```

**Structure Decision**: Single-project monorepo layout, unchanged. This mission adds no new package, app, or directory — it edits one pattern story file and one Playwright spec file, and reuses (imports) an already-exported function from an existing gate script rather than duplicating its logic. This keeps FR-005 ("reusable at gate level") honest: the derived enumeration lives once, in `check-pattern-composition.mjs`, and the spec file consumes it.

## Complexity Tracking

*No Charter Check violations — table not needed.*

## Implementation Concern Map

### IC-01 — Story-local frame breakpoint alignment

- **Purpose**: Fix #417 — eliminate the 390px/480px breakpoint disagreement between `cli-auth.stories.ts`'s local frame and the `sk-boundary-page` frame it composes, and confirm (by reading, not assuming) whether the same disagreement exists in the five other named pattern families.
- **Relevant requirements**: FR-001, FR-002, SC-001, SC-002, C-002, C-004.
- **Affected surfaces**: `packages/elements/src/patterns/cli-auth.stories.ts` (the only file changed). `team-overview.stories.ts`, `mission-kanban.stories.ts`, `repository-dossier.stories.ts`, `work-explorer.stories.ts`, `work-package-views.stories.ts`, `mission-reading.stories.ts` (read-only verification — see research.md; none compose `sk-boundary-page`, and the two that do declare a local width breakpoint — team-overview at 720px, repository-dossier's `@container` at 720px — already agree with the 720px breakpoint baked into the public components they compose, `sk-page-header.css`/`sk-context-sidebar.css`/`sk-personal-rail.css`).
- **Sequencing/depends-on**: None — independent of IC-02.
- **Risks**: Changing the breakpoint value shifts cli-auth's narrow-viewport rendering, which the visual-regression suite baselines at 390px. Per C-002, this mission does not run `--update-snapshots`; it names the affected story IDs so CI can harvest new baselines.

### IC-02 — Composition-proof DOM inventory becomes derived

- **Purpose**: Fix #418 — replace the five-name regex denylist with an enumeration of every `sk`-prefixed tag/class actually present in the rendered DOM, checked against the generated Custom Elements Manifest and the existing `ownedClasses()` styles-derivation, so an unlisted invented primitive cannot pass. Verify the manifest's provenance (generated + CI-gated) before depending on it (FR-004), and prove the new check can fail (FR-006).
- **Relevant requirements**: FR-003, FR-004, FR-005, FR-006, NFR-001, SC-003, SC-004, SC-005, C-001, C-003, C-005.
- **Affected surfaces**: `apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts` (the "source is Storybook-only composition..." test, ~line 133-153); `scripts/check-pattern-composition.mjs` (already exports `ownedClasses()` — reused, not duplicated; no change expected unless the reuse surfaces a gap, in which case the change is additive, e.g. exporting one more small helper).
- **Sequencing/depends-on**: None — independent of IC-01. Both concerns fold into the mission's single work package per C-005.
- **Risks**: The manifest is generated per-run via `cem analyze`/`nx run elements:analyze` and is drift-gated in CI, but the mission's own checkout must have a fresh, un-drifted manifest for the new check to be meaningful locally — verified in research.md by actually running `npx nx run elements:analyze --skip-nx-cache` and diffing (real command executed, not assumed). Must not hand-edit `custom-elements.json` (C-003) if regeneration is ever needed.
