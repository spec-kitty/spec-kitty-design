---
work_package_id: WP01
title: CLI Auth Pattern Proof
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
- FR-019
- FR-020
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
planning_base_branch: mission/cli-auth-pattern-stories
merge_target_branch: mission/cli-auth-pattern-stories
branch_strategy: Planning artifacts for this mission were generated on mission/cli-auth-pattern-stories. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/cli-auth-pattern-stories unless the human explicitly redirects the landing branch.
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
history: []
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/patterns/
create_intent:
- packages/elements/src/patterns/cli-auth.fixture.ts
- packages/elements/src/patterns/cli-auth.stories.ts
- apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts
- tests/node/cli-auth-no-literal.test.ts
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/patterns/cli-auth.fixture.ts
- packages/elements/src/patterns/cli-auth.stories.ts
- apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-cli-auth-*.png
- tests/node/cli-auth-no-literal.test.ts
- expected-stories.json
- docs/design-system/using-components.md
role: implementer
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 — CLI Auth Pattern Proof

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `codex`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

Ship one Storybook-only CLI-auth pattern family — code entry, authorization decision, terminal success/denial, and terminal error — proving Family 5's honest security-boundary anatomy composes entirely from public `@spec-kitty/tokens`/`@spec-kitty/styles`/`@spec-kitty/elements` surfaces plus native semantic HTML, with the dependent parts (Deny's tone, the terminal frame, and Story 1's contrast/target-size verification) finalized only once `#320`, `#303`, and `#321` respectively land on `train/elements-first`.

## Context

Read `kitty-specs/cli-auth-pattern-stories-01M25STS/spec.md`, `research.md`, `data-model.md`, and `plan.md` in full before starting. Recheck issue `#329`, epic `#319`, and dependency issues `#320`, `#321`, `#303` (including their branches/PRs, if any exist by the time you implement) and the current `origin/train/elements-first` head before starting and again immediately before final verification.

This is one bounded work package because the four stories share one fixture-truth convention, one composition/inventory gate pass, and one documentation update — splitting them would create an unreviewable partial PR and duplicate the fixture source, exactly as the repository's other pattern-story missions (`repository-dossier-pattern-stories-01M22WFQ`, `mission-reading-pattern-stories-01M21HSX`, `work-package-view-pattern-stories-01M1YNPC`) already establish as precedent. Three of the four required stories depend in part on sibling missions not yet on the train (`#320` for Story 2's Deny tone, `#321` for Story 1's contrast/target-size verification, `#303` for the terminal frame both Stories 3 and 4 need); the plan's Implementation Concern Map orders IC-01 through IC-05 as independently completable now, and IC-06 as the single, clearly separated finalization step that starts only once the corresponding dependency lands.

**The single most important non-goal**: do not fork `#320`'s danger-secondary button tone or `#303`'s boundary-page anatomy locally to manufacture a passing state ahead of their landing. If a dependency has not landed when you reach its subtask, leave that part of the story/test deliberately red (documented as pending, not as broken), and report it — do not invent a substitute.

## Subtask T001: Establish the failing contract

**Purpose**: Create the focused Storybook Playwright suite before the story implementation exists, so its initial failure is caused by the missing story/surface, not by test infrastructure.

**Steps**:
1. Create `apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts` following the shape of `sk-repository-dossier-pattern.spec.ts` and `sk-mission-reading-pattern.spec.ts`.
2. Write assertions (initially failing) for: the four story names exist and render non-empty roots; only public/native tags appear (no forbidden custom tags, no private-root reach); the code-entry label/description association and `aria-invalid` branch; Story 2's fact-list/scope/Approve-Deny DOM order; Stories 3/4's no-fabricated-action invariant.
3. Run the suite once and confirm it fails for the expected reason (missing story exports), not a syntax or config error.

**Files**: `apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts` (new, ~150 lines by the end of the WP; start with the skeleton and story-existence assertions only).
**Validation**: `npx playwright test apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts` fails with "story not found" style errors, not a crash.

## Subtask T002: Build immutable fixtures for all four states

**Purpose**: Establish one frozen source per story for every repeated label, fact, scope, status, and action value, per `data-model.md`'s fixture entities.

**Steps**:
1. Create `packages/elements/src/patterns/cli-auth.fixture.ts` exporting readonly, recursively frozen fixtures: code-entry default, code-entry invalid; authorization decision (client, account, redirect, ordered scopes, Approve/Deny labels); terminal-outcome success (no action), terminal-outcome denied (no action); terminal-error with no action, terminal-error with one supplied real-route action.
2. Add a recursive deep-freeze helper (follow `repository-dossier.fixture.ts`'s precedent) and list any non-story exports in the eventual `meta.excludeStories`.
3. Add a focused unit assertion that every fixture is frozen (mutation attempts throw or are silently rejected per the existing precedent's pattern) and that the action-count invariant holds: terminal fixtures carry zero or exactly one action, never more.

**Files**: `packages/elements/src/patterns/cli-auth.fixture.ts` (new, ~120 lines).
**Validation**: fixtures import cleanly in both the story module and the test module with no circular import; freeze assertions pass.

## Subtask T003: Compose Story 1 — code entry (fully composable now)

**Purpose**: Prove the labelled input + description + primary submit anatomy from the current, unchanged `.sk-input`/`sk-form-input` public contract.

**Steps**:
1. In `packages/elements/src/patterns/cli-auth.stories.ts`, compose Story 1 (default and invalid variants) using one native `<form>`, a labelled `<sk-form-input>` (or the static `.sk-input` exemplar, whichever the current train exposes as the element-backed form), a description, and one `sk-button` primary submit — all strings from the T002 fixture.
2. Wire the invalid variant's `aria-invalid="true"` and description association from the fixture's error field.
3. Add the `LightMode` variant (`class="sk-light"`, never `data-theme="light"`).
4. Turn the T001 assertions for Story 1 green: label/description association, `aria-invalid` branch, keyboard order (input then submit, matching DOM order).

**Files**: `packages/elements/src/patterns/cli-auth.stories.ts` (new, this subtask's portion ~80 lines).
**Validation**: Story 1's default and invalid variants render in Storybook with no console errors; the T001 assertions scoped to Story 1 pass.

## Subtask T004: Compose Story 2 — facts, scopes, and Approve (non-Deny anatomy)

**Purpose**: Prove the client/account/redirect fact list and scope labels compose from `.sk-facts` and `sk-pill-tag`, and that Approve composes the existing `sk-button` primary tone, with DOM order already fixed as Approve-then-Deny.

**Steps**:
1. Compose Story 2's facts through `.sk-facts` (native `<dl>`) in fixture order, and each scope as one `sk-pill-tag` (non-status variant) in fixture order.
2. Add Approve as `sk-button` primary and Deny as a plain `sk-button` secondary **explicitly commented as pending `#320`'s danger-secondary tone** — never a locally styled danger button. Both live in one native `<form>`, DOM order Approve-then-Deny.
3. Add the `LightMode` variant.
4. Turn the T001 assertions for Story 2's fact list, scope order, and DOM order green; leave any assertion specifically about the danger-secondary tone red and clearly marked `// pending #320` in the test file.

**Files**: `packages/elements/src/patterns/cli-auth.stories.ts` (this subtask's portion ~90 lines); `sk-cli-auth-pattern.spec.ts` (Story 2 assertions).
**Validation**: facts and scopes render exactly the fixture's values in order; Approve/Deny DOM order assertion passes; the tone-specific assertion is the only intentionally red item, and it is documented as such in the test file and in the PR description.

## Subtask T005: Compose Stories 3 and 4 — terminal fixtures, shells, and no-invented-recovery assertions

**Purpose**: Prove the terminal-outcome and terminal-error action rules independently of the frame that will render them, and stand up red-first shells against `sk-boundary-page` so IC-06 has a known-failing baseline to turn green once `#303` lands.

**Steps**:
1. Add Story 3 (success, denied) and Story 4 (no-action, with-action) shells in `cli-auth.stories.ts`, importing `sk-boundary-page` from `@spec-kitty/elements`/`@spec-kitty/styles` at its documented public entry point. If `#303` has not landed, this import fails or the shell is a clearly marked `// TODO(#303): compose sk-boundary-page once public` stub — do not substitute a local frame under any name.
2. Add the action-count assertions to `sk-cli-auth-pattern.spec.ts`: zero actions render for the no-action fixtures; exactly one, sourced only from the fixture, renders for the with-action fixture.
3. Add the `LightMode` variant intent for both stories (to be completed once the frame exists).
4. Record in the WP's running notes (or a `// TODO(#303)` block) exactly which acceptance clauses (FR-003, FR-004) remain unverifiable until `#303` lands.

**Files**: `packages/elements/src/patterns/cli-auth.fixture.ts` (terminal fixtures, if not already complete from T002); `cli-auth.stories.ts` (Story 3/4 shells); `sk-cli-auth-pattern.spec.ts` (action-count assertions).
**Validation**: the action-count assertions pass against the fixtures directly (they do not require the frame to exist); the story-render assertions fail cleanly and legibly if `#303` is absent, never silently.

## Subtask T006: Composition/inventory proof and no-literal assertion

**Purpose**: Confirm the existing `scripts/check-pattern-composition.mjs` gate covers `packages/elements/src/patterns/cli-auth.*` unmodified, and add the component-scoped no-literal grep assertion.

**Steps**:
1. Run `node scripts/check-pattern-composition.mjs` locally against the tree with T002–T005's files in place; confirm it reports the new fixture/story files as scanned (its `SCAN` glob is `packages/elements/src/patterns/**/*.{ts,tsx,js,mjs,cjs,css}` — no code change to the gate is expected or permitted by this WP).
2. Run `node scripts/check-pattern-composition.mjs --selftest` and confirm it still passes with the new files present.
3. Add `tests/node/cli-auth-no-literal.test.ts`: for each fixture copy string in `cli-auth.fixture.ts`, assert it does not appear as a source-level string literal inside `packages/styles/src/button/sk-button.css`+`.stories.ts` markup module, `packages/elements/src/form-input/` (and `packages/styles/src/form-field/`), `packages/elements/src/card/` (or the card surface actually composed), `packages/styles/src/pill-tag/`, and — once its source exists — `sk-boundary-page`'s own files. Follow the DoD shape `#320`'s own issue names ("grep-style assertion consistent with #286's DoD pattern").
4. If `#303`'s source does not exist yet, scope the assertion to the elements that do exist and add a `// TODO(#303)` marking the deferred coverage — do not report the assertion as covering a component absent from the tree.

**Files**: `tests/node/cli-auth-no-literal.test.ts` (new, ~90 lines). No change to `scripts/check-pattern-composition.mjs`.
**Validation**: `node scripts/check-pattern-composition.mjs` and its `--selftest` both pass; the no-literal test passes for every element it currently covers.

## Subtask T007: Register stories and document the ownership boundary

**Purpose**: Register every exported story ID in the existing story ratchet and document, for a consumer, which behaviors remain theirs.

**Steps**:
1. Add every exported story ID from `cli-auth.stories.ts` to `expected-stories.json` in its established format; list non-story exports in `meta.excludeStories`.
2. Add a short "CLI auth pattern" section to `docs/design-system/using-components.md` naming the four stories, the public surfaces each composes, and explicitly the consumer-owned behaviors: route, permission, session, validation, submission, confirmation, copy, localization, and terminal-state selection (FR-019).
3. State in that section, plainly, that Deny's tone and the terminal frame are sourced from `#320` and `#303` respectively, and name them by issue number so a reader can check their status.

**Files**: `expected-stories.json` (edit); `docs/design-system/using-components.md` (edit, +~40 lines).
**Validation**: `node scripts/run-axe-storybook.js`-style story discovery finds every registered ID; the documentation section reads correctly in the built docs.

## Subtask T008: Add system resilience proofs for the non-dependent stories

**Purpose**: Prove Story 1 and Story 2's non-Deny anatomy at 390 px, 200%/400% zoom, forced colors, and reduced motion — the states that do not require `#320`/`#303` to be meaningful.

**Steps**:
1. Add or extend story variants / test modes for 390 px containment (equal gutters, no page-level horizontal overflow, unclipped submit/Approve/Deny actions) for Stories 1 and 2.
2. Add forced-colors assertions: the input boundary, both button tones (Approve now, Deny once landed), and scope pill-tags remain visible and distinguishable with no color-only meaning.
3. Add a reduced-motion assertion that the pattern introduces no motion of its own (assert, do not assume, per `docs/contributing/adding-a-component.md`'s stated precedent).
4. Add heading-order and target-size-floor assertions for Story 1 and Story 2's Approve action (Deny's target-size assertion is added but may stay red pending `#320`, since the button shape itself does not change under `#320`, only its tone — verify empirically before assuming either way).

**Files**: `apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts` (extend); `cli-auth.stories.ts` (any additional narrow/zoom/forced-colors story variants needed).
**Validation**: all added assertions pass for Stories 1 and 2; any assertion genuinely blocked on `#320`/`#303` is marked and isolated, not mixed into a passing assertion.

## Subtask T009: Run the non-dependent gate suite

**Purpose**: Verify everything completable without `#320`/`#321`/`#303` passes cleanly before starting the dependent finalization step.

**Steps**:
1. Run `npm run quality:all`, `npx nx run tokens:catalogue`, `npx nx run styles:build`, `npx nx run elements:build`, `npx nx run elements:analyze`, `node scripts/build-react-wrappers.mjs --check`.
2. Run `npx nx run storybook:storybook:build` and `node scripts/run-axe-storybook.js`.
3. Run `npx playwright test apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts` and `node scripts/check-pattern-composition.mjs`.
4. Fix any failure caused by this WP's own authored code. Any failure caused solely by a missing dependency (`#320`/`#303`) is expected, documented, and left for T010/T011 — do not work around it locally.

**Files**: none new; this is a verification-only subtask.
**Validation**: every command above passes, except assertions explicitly and individually marked as pending `#320`/`#303`.

## Subtask T010: Dependent finalization — consume `#320`, `#321`, and `#303` once landed

**Purpose**: Finalize Story 2's Deny action and Stories 3/4's `sk-boundary-page` composition against whichever public contract those missions actually shipped, and re-verify Story 1's contrast/target-size clauses against `#321`'s landed fix.

**Steps**:
1. Recheck `#320`, `#321`, and `#303` for a landed state on `origin/train/elements-first` (merged PR, or a branch ready to rebase onto). Treat each independently — do not block work on one dependency behind another.
2. For each dependency that has landed: rebase this WP's lane onto the train commit that carries it; consume its actual public API (do not assume a class/attribute name beyond what its own issue committed to); turn the corresponding T001/T004/T005/T008 red assertions green; remove the `// pending`/`// TODO(#303)` markers for that dependency only.
3. For each dependency that has NOT landed by 2026-09-15: leave its assertions red and documented, and prepare the honest dependency report described in the Definition of Done below — do not extend this subtask indefinitely waiting for it.
4. Regenerate every derived artifact from source (manifest, React wrapper, Vue types, CSS modules, story index, size report) — never hand-edit.

**Files**: `cli-auth.stories.ts`, `sk-cli-auth-pattern.spec.ts`, `tests/node/cli-auth-no-literal.test.ts` (remove TODO markers for landed dependencies only).
**Validation**: for each landed dependency, its previously-red assertions are now green; for each still-pending dependency, its assertions remain clearly red and documented, not silently skipped or deleted.

## Subtask T011: Rebase, visual evidence, and exact-head handoff

**Purpose**: Produce CI-harvested visual baselines from the exact final rebased head and hand off a clean lane with an honest dependency report.

**Steps**:
1. Fetch `origin`, recheck all three dependencies and target movement one final time, and rebase onto current `origin/train/elements-first`.
2. Register the required visual cases in `apps/storybook/src/tests/visual.spec.ts` for every story that is fully composed (dark + LightMode + 390 px + forced-colors + 200% zoom, per FR-016); do not register a visual case for a story still blocked on a missing dependency.
3. Run the full local gate set: lint/type/build, package graph, `npm run quality:commitlint` (scope `storybook`), manifest/wrapper/Vue/CSS-module generation checks, ratchets, sizes, security, and every command from T009 on the rebased head.
4. Push and let CI harvest the `visual-regression-diffs` artifact; never run `--update-snapshots` locally.
5. Write the requirement-evidence map, final head SHA, commands/results, and — if any of `#320`/`#321`/`#303` did not land — a one-paragraph honest dependency report naming exactly which issue(s) remain outstanding and which stories/assertions are affected, for the PR body and for independent review.

**Files**: `apps/storybook/src/tests/visual.spec.ts` (edit); `apps/storybook/src/tests/visual.spec.ts-snapshots/sk-cli-auth-*.png` (generated by CI only).
**Validation**: the lane is clean on the exact final rebased head; every fully-composed story has a reviewed visual baseline; the dependency report (if needed) is accurate and specific, never vague ("some dependencies pending").

## Definition of Done

This WP has two valid closing states, and both are legitimate — the mission does not fail by reaching the second one:

- **Full completion**: all four stories are fully composed and verified, `#320`, `#321`, and `#303` have all landed and are consumed through their real public contracts, every FR/NFR/C in `requirement_refs` is backed by executable or reviewable evidence on one final SHA, and the full repository gate set (T009 + T011) passes with zero red assertions.
- **Honest partial completion** (only if `#303` and/or `#320`/`#321` miss 2026-09-15): Stories 1 and 2's non-Deny anatomy are fully composed, verified, and gate-clean; Story 2's Deny and/or Stories 3/4 remain documented as blocked on the named issue(s); the PR body states exactly which dependency is missing and which acceptance clauses are consequently unmet; no substitute frame or forked tone was shipped in place of the missing surface.

In either state:
- No new custom element, no `auth-card`/`scope-chip`/`form-action-row` component, and no Team Kitty application behavior exists in the diff.
- `check-pattern-composition.mjs` passes unmodified over the new fixture directory.
- The no-literal assertion passes for every element it currently covers.
- Every user-visible string in all four stories traces to exactly one fixture field.
- The lane is clean and ready for the repository's independent pre-merge review squad (Tier C per the issue).

## Risks

- **A dependency lands with a different API shape than assumed.** Mitigated by T010's instruction to consume the actual shipped contract rather than an assumed class/attribute name, and by keeping fixture fields (T002) generic label/text/href pairs rather than pre-bound to a guessed API.
- **`#303` misses the deadline entirely.** Mitigated by the two-state Definition of Done above — this WP does not silently ship a local frame to avoid an honest partial-completion report.
- **Visual baselines captured before the final dependency rebase describe pre-dependency code.** Mitigated by T011 sequencing baseline registration strictly after the final rebase, and by never running `--update-snapshots` locally.
- **The no-literal assertion under-covers `sk-boundary-page` before `#303` exists.** Mitigated by T006's explicit `// TODO(#303)` marker and by re-running the assertion's full scope in T010 once that source lands.
- **Scope creep into exhaustive A1–A12 fixture parity.** Mitigated by this WP's fixed subtask list; additional client/scope combinations are an explicit post-2026-09-15 follow-up per the issue, not part of this WP.

## Reviewer Guidance

Verify, on the exact final SHA:
- Deny's tone (if `#320` landed) is `#320`'s actual public class/attribute, not a locally forked danger style, and the story's inline `<style>` (if any) contains no rule targeting a library-owned class (`check-pattern-composition.mjs` R3).
- The terminal stories (if `#303` landed) compose `sk-boundary-page`'s documented public seam only — no `.shadowRoot`/`.renderRoot`/`attachShadow` reach, no undeclared `::part()` (`check-pattern-composition.mjs` R1/R2).
- Every fixture copy string is genuinely absent from the composed elements' own source (T006's assertion actually runs against the strings in `cli-auth.fixture.ts`, not a stale copy).
- If the honest-partial-completion path was taken, the PR body's dependency report is accurate against the actual state of `#320`/`#321`/`#303` at review time, not stale from when T010 last ran.
- DOM order for Story 2 is genuinely Approve-then-Deny in the rendered markup, not just visually reordered with CSS.
- LightMode is asserted by computed style, not merely rendered (`docs/contributing/adding-a-component.md`'s explicit warning).

## Implementation Command

```
spec-kitty agent action implement WP01 --agent codex
```
