# Mission Specification: CLI Auth Proof Hardening

**Mission Branch**: `mission/cli-auth-proof-hardening`
**Created**: 2026-09-11
**Status**: Draft
**Input**: Two deferred findings from epic #319's CLI-auth pattern proof (#329, merged as PR #409): #417 (story-local page frame restates `sk-boundary-page`'s geometry at a different breakpoint) and #418 (the composition proof's DOM inventory arm is a denylist that cannot fail for an unlisted name). A third issue, #422 (200% zoom emulation in `visual.spec.ts`), is explicitly OUT OF SCOPE for this mission — a sibling mission owns that file and has not merged; #422 joins a future increment.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Story-local frame stops diverging from the public frame it composes (Priority: P1)

A design-system maintainer reading `cli-auth.stories.ts` and `sk-boundary-page.css` side by side should see one gutter regime for the pattern family, not two. Today the story-local `.sk-cli-auth-pattern` wrapper (composed by stories 1-2, code entry / authorization decision) narrows its padding at `max-width: 390px`, while `sk-boundary-page` (composed by stories 3-4, the terminal states) narrows at `max-width: 480px`. Between 391px and 480px the two halves of one pattern family run different gutter regimes, and that band is sampled by nothing — the visual baselines are 390/780/1440 and the geometry assertions test 390 and desktop.

**Why this priority**: Filed by `architect-alphonso` at the #409 pre-merge gate in both passes; the issue states four sibling pattern missions are in flight against this same frame-plus-local-style shape, and whatever is decided here is about to be copied four more times.

**Independent Test**: Can be fully tested by reading `cli-auth.stories.ts`'s narrow-breakpoint media query and confirming it declares `480px` (matching `sk-boundary-page.css:318`) with a comment recording the deliberate mirroring, and by re-running the pattern-family sweep to confirm no other family's story-local frame disagrees with the public frame it composes.

**Acceptance Scenarios**:

1. **Given** `cli-auth.stories.ts`'s `patternStyles` narrow-width rule, **When** the file is read, **Then** its `@media` query narrows at `max-width: 480px` (not `390px`), and a comment records that this deliberately mirrors `sk-boundary-page`'s own `480px` step so a future respacing of the composed frame does not silently diverge again.
2. **Given** the six pattern families the issue names as sharing this story-frame shape, **When** each family's story-local breakpoints are checked against the public component(s) it composes, **Then** either every other family is already consistent (documented as such, no code change) or any family found to disagree is fixed in the same work package — this round's operator directive is "no more deferrals."
3. **Given** the fix changes `cli-auth.stories.ts`'s rendered CSS at narrow width, **When** the mission reports results, **Then** it names which visual baselines are expected to move and why, without ever running `--update-snapshots` locally (baselines are CI-authoritative).

---

### User Story 2 - Composition proof's DOM inventory arm becomes derived, not a denylist (Priority: P1)

`apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts` asserts the rendered markup does not match a five-name regex denylist (`auth-card|scope-chip|form-action-row|sk-terminal-frame|sk-boundary-stage`) plus no `customElements.define(`. A newly invented `<sk-auth-panel>` (or any other unlisted `sk-`-prefixed tag or class) passes this check untouched. The CSS arm of the same proof does not have this defect — `scripts/check-pattern-composition.mjs`'s `ownedClasses()` computes the owned-class set from `packages/styles/src/**/sk-*.css`, so it is derived from source rather than hand-enumerated.

**Why this priority**: Filed by `architect-alphonso` at the same gate; the issue explicitly asks for this to live at gate level (reusable), since four more pattern missions are in flight and will otherwise copy the denylist shape.

**Independent Test**: Can be fully tested by planting a fabricated `<sk-auth-panel>` element into the story's rendered markup, running the spec, and observing the derived check fail by name — then reverting the plant and observing the same check pass. This is a red-first proof that must be executed, not reasoned about.

**Acceptance Scenarios**:

1. **Given** the rendered DOM of every CLI-auth story, **When** every `sk-`-prefixed tag name and every `sk-`-prefixed class name in that DOM is collected, **Then** each one is either a known custom element (drawn from `packages/elements/custom-elements.json`, the generated Custom Elements Manifest) or an owned styles class (drawn from `ownedClasses()`, the same derivation `check-pattern-composition.mjs`'s CSS arm already uses) — with no name accepted by construction.
2. **Given** the custom-elements manifest is the ground truth for "known custom element," **When** the manifest's provenance is checked, **Then** it is confirmed generated (`cem analyze` via `nx run elements:analyze`) and drift/content-gated in CI (`.github/workflows/ci-quality.yml`'s "[ENFORCED] Custom Elements Manifest is current" step, plus `check-manifest-content.mjs`'s anti-vacuity floor) — not hand-maintained — before the mission depends on it.
3. **Given** a fabricated `<sk-auth-panel>` planted into the rendered markup, **When** the derived inventory check runs, **Then** it fails and names `sk-auth-panel` specifically; the plant is then reverted and the suite passes again. Both runs are executed, not reasoned about, and both outputs are recorded in the mission report.
4. **Given** four more pattern missions are in flight and will otherwise copy the denylist shape, **When** the derived check is implemented, **Then** it is placed so other pattern spec files can reuse it (e.g. as an exported helper alongside or reusing `check-pattern-composition.mjs`'s `ownedClasses()`), not re-implemented per spec file.

---

### Edge Cases

- What happens when a class is bound to an element only via a computed/interpolated `class=${...}` attribute rather than a literal string? (`classTagBindings()` in `check-pattern-composition.mjs` already states this resolves to nothing and is treated as unresolved — the new DOM-derived check must not silently pass an unresolved name.)
- How does the derived check treat a class or tag that is genuinely public but new (e.g. a same-mission addition to `packages/styles`)? It must pass, because it is present in the freshly-computed `ownedClasses()`/manifest sets, not a stale snapshot.
- How does the family-wide sweep treat a pattern family with no local `@media` breakpoint at all? It is not a candidate for this divergence (nothing to disagree with) and is recorded as consistent-by-construction.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Align cli-auth story frame's narrow breakpoint to 480px | As a design-system maintainer, I want `cli-auth.stories.ts`'s story-local `.sk-cli-auth-pattern` narrow-width rule to narrow at `max-width: 480px` (matching `sk-boundary-page.css`), with a comment recording the deliberate mirror, so that both halves of the pattern family share one gutter regime and the 391-480px band stops being unsampled. | High | Open |
| FR-002 | Sweep sibling pattern families for the same divergence | As a design-system maintainer, I want the five other pattern families the issue names checked for the same "story-local breakpoint disagrees with the public frame it composes" defect, and fixed in this work package if found, so that a sweep discovered mid-mission is finished rather than deferred (operator directive: no more deferrals). | High | Open |
| FR-003 | Replace the DOM inventory denylist with a derived enumeration | As a design-system maintainer, I want `sk-cli-auth-pattern.spec.ts`'s inventory arm to collect every `sk`-prefixed tag/class actually present in the rendered DOM and assert each one is either a known custom element or an owned styles class, so that an unlisted invented primitive (e.g. `<sk-auth-panel>`) cannot silently pass. | High | Open |
| FR-004 | Verify the custom-elements manifest's provenance before depending on it | As a design-system maintainer, I want to confirm `packages/elements/custom-elements.json` is generated and CI-gated (not hand-maintained) before treating it as ground truth for "known custom element," so the new check's foundation is itself verified rather than assumed. | High | Open |
| FR-005 | Make the derived DOM check reusable at gate level | As a design-system maintainer, I want the derived tag/class enumeration implemented so other in-flight pattern missions can reuse it rather than re-copying a denylist, so the fix holds for the whole pattern family line, not just cli-auth. | Medium | Open |
| FR-006 | Prove the derived check can fail | As a design-system maintainer, I want a red-first proof executed against the new derived check — a fabricated `<sk-auth-panel>` planted into rendered output, confirmed caught by name, then reverted — so the fix is demonstrated rather than asserted. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No new flakiness in the Playwright spec | The modified `sk-cli-auth-pattern.spec.ts` must continue to pass deterministically across repeated real (non-reasoned-about) runs against a freshly built Storybook static bundle. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Do not touch `visual.spec.ts` | A sibling mission owns `apps/storybook/src/tests/visual.spec.ts` and has not merged. This mission must not edit that file; #422 (200% zoom emulation) joins this mission as a later, separate increment once that sibling lands. | Technical | High | Open |
| C-002 | Baselines are CI-authoritative | If FR-001's breakpoint change shifts cli-auth visual baselines, this mission must not run `--update-snapshots` locally. It records which baselines are expected to move and why; the operator harvests them from CI. | Technical | High | Open |
| C-003 | No hand-editing generated artifacts | `packages/elements/custom-elements.json`, React wrappers, static HTML, ratchet files (`expected-*.json`, `mutations*.json`, `suite-budget.json`) are never hand-edited. If a gate demands regeneration, it is regenerated via its real command. | Technical | High | Open |
| C-004 | Out of scope: composing `sk-boundary-page-form-card` | The larger option in #417 (composing the form-card anatomy across sibling families) is explicitly out of scope; only the breakpoint alignment (and sweep-discovered equivalents) is in scope. | Business | Medium | Open |
| C-005 | Single bounded work package | This mission finalizes with exactly one work package covering #417 and #418 together, per the mission brief. | Technical | Medium | Open |
| C-006 | Never run `nx run storybook:lint` | That target is aliased to `storybook dev --port 6006` in this repo and never exits. Lint runs via `npm run quality:lint`. | Technical | Medium | Open |

### Key Entities *(include if feature involves data)*

- **Story-local page frame**: The `patternStyles` `<style>` block a pattern's `.stories.ts` file authors for itself, scoping layout/geometry constants that may restate a composed public component's own geometry.
- **Owned-class set**: The set of CSS class names any `packages/styles/src/**/sk-*.css` sheet declares rules for, computed by `ownedClasses()` in `scripts/check-pattern-composition.mjs`.
- **Custom Elements Manifest**: `packages/elements/custom-elements.json`, the generated (via `cem analyze`) and CI drift/content-gated inventory of every real custom element the `elements` package registers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `cli-auth.stories.ts`'s narrow-width media query reads `max-width: 480px` and carries a comment naming `sk-boundary-page` as the mirrored source.
- **SC-002**: The mission report states, for each of the five other named pattern families, whether its story-local frame agrees with the public component(s) it composes — with either "consistent, no change" or a fix, for all five.
- **SC-003**: `sk-cli-auth-pattern.spec.ts`'s inventory arm no longer contains the five-name regex denylist; it instead computes the DOM's `sk`-prefixed tag/class set and checks membership against the manifest-derived element set and `ownedClasses()`.
- **SC-004**: A real (executed, not reasoned-about) run demonstrates the new inventory check failing on a planted `<sk-auth-panel>` and naming it, followed by a real run demonstrating the check passing once the plant is reverted.
- **SC-005**: `npm run quality:lint`, the Playwright spec (built Storybook, real command), and `node scripts/check-pattern-composition.mjs` (if invoked directly) all run for real with real recorded output in the mission report.
