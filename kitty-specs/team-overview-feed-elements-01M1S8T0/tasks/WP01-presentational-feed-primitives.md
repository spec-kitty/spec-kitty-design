---
work_package_id: WP01
title: Presentational feed primitives
dependencies: []
requirement_refs:
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- FR-001
- FR-002
- FR-003
- FR-004
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
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
planning_base_branch: mission/team-overview-feed-elements
merge_target_branch: mission/team-overview-feed-elements
branch_strategy: Planning artifacts for this mission were generated on mission/team-overview-feed-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/team-overview-feed-elements unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - Presentational feed primitives
history:
- timestamp: '2026-09-05T17:25:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/section-header/
create_intent:
- packages/styles/src/section-header/sk-section-header.css
- packages/styles/src/status-indicator/sk-status-indicator.css
- packages/styles/src/entity-marker/sk-entity-marker.css
- packages/elements/src/section-header/sk-section-header.ts
- packages/elements/src/section-header/sk-section-header.stories.ts
- packages/elements/src/status-indicator/sk-status-indicator.ts
- packages/elements/src/status-indicator/sk-status-indicator.stories.ts
- packages/elements/src/entity-marker/sk-entity-marker.ts
- packages/elements/src/entity-marker/sk-entity-marker.stories.ts
- fixtures/elements-behaviour/src/sk-section-header.test.ts
- fixtures/elements-behaviour/src/sk-status-indicator.test.ts
- fixtures/elements-behaviour/src/sk-entity-marker.test.ts
execution_mode: code_change
owned_files:
- packages/styles/src/section-header/**
- packages/styles/src/status-indicator/**
- packages/styles/src/entity-marker/**
- packages/styles/package.json
- packages/elements/src/section-header/**
- packages/elements/src/status-indicator/**
- packages/elements/src/entity-marker/**
- packages/elements/src/index.ts
- packages/elements/src/elements.ts
- fixtures/elements-behaviour/src/sk-section-header.test.ts
- fixtures/elements-behaviour/src/sk-status-indicator.test.ts
- fixtures/elements-behaviour/src/sk-entity-marker.test.ts
- apps/storybook/src/tests/elements-load.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/*section-header*.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/*status-indicator*.png
- apps/storybook/src/tests/visual.spec.ts-snapshots/*entity-marker*.png
- docs/design-system/using-components.md
- docs/design-system/changelog.md
- behaviours.json
- mutations.json
- expected-docs.json
- expected-parts.json
- expected-stories.json
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src/**
- packages/react/.wrapper-floor
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#146'
- '#144'
- '#125'
- '#76'
- '#79'
---

# WP01 — Presentational feed primitives

## Do this first: load the profile

Load `frontend-freddy` through `spk-doctrine-profile-load` and apply the resolved implementation
identity/context. Use Codex only. Then obtain the runtime-owned workspace with:

```sh
spec-kitty agent action implement WP01 --agent codex --mission team-overview-feed-elements-01M1S8T0
```

## Objective

Deliver `sk-section-header`, `sk-status-indicator` and `sk-entity-marker` as complete, independently
reviewable presentational elements. Each must have token-only CSS, a declared host display, an open
shadow root, exact public slots/properties/parts, required stories, non-vacuous browser evidence,
ADR-11 part/style mutation pairs, generated CSS/CEM/React/Vue/size artifacts and synchronized docs.

## Context and boundaries

- Consumers author their own native heading and `ul > li`; these elements claim neither.
- `status-indicator` receives presentation tone and visible text. It never infers labels or imports
  product vocabulary.
- `entity-marker` receives the mark and optional accessible label. It never fetches identity or
  creates initials.
- No `.markup.ts`, static `.html`, styles-layer component barrel, token, dependency, package-lock,
  action-row, application code or sibling mission source belongs in this WP.
- The landed `sk-button`/`sk-pill-tag` may appear in a story composition only and remain unchanged.
- Shared registry/generated files overlap later WPs deliberately; all execute on this one lane.

### T001 — Establish compile-safe red-first contracts

1. Add minimal registered element and token-only CSS scaffolds that compile, adopt their generated
   named sheets and render labelled non-empty roots. Generate the three CSS JS/declaration pairs.
2. Create one browser fixture per element. Begin from externally observable assertions, not shadow
   snapshots or “it renders”:
   - section-header assigns each named slot, preserves consumer heading tag/level, generates no
     heading of its own and collapses empty optional regions without invented copy;
   - status-indicator covers the exact six-tone set, visible text, unknown-tone neutral degradation,
     theme-specific contrast, recovery/info/danger distinction, and a `tone` property assigned before
     definition surviving late upgrade;
   - entity-marker covers meaningful non-empty label, whitespace/absent decorative mode and exact
     slotted mark preservation, with a `label` property assigned before definition surviving late
     upgrade into the same accessible mode;
3. Add literal external selectors plus computed-style assertions for every planned part. Each
   `::part(name)` literal occurs only in the actual selector, never a message/comment.
4. Run the fixtures against the compile-safe scaffolds and record intended named failures only.
   Missing imports, parser failures, blank roots or unregistered tags are not red-first evidence.

Focused validation:

```sh
npx vitest run --project browser fixtures/elements-behaviour/src/sk-section-header.test.ts fixtures/elements-behaviour/src/sk-status-indicator.test.ts fixtures/elements-behaviour/src/sk-entity-marker.test.ts --reporter=default
node scripts/typecheck-all.mjs
```

### T002 — Implement the three public contracts

1. Implement `sk-section-header` with slots `eyebrow`, `title`, `description`, `metadata`, `action`
   and parts `header`, `eyebrow`, `title`, `description`, `metadata`, `action`. The title wrapper has
   no heading role; the slotted native heading owns document outline.
2. Implement `sk-status-indicator` with typed/reflected `tone`, slots `marker` and default visible
   text, and parts `status`, `marker`, `text`. Unknown tone warns/degrades to neutral without losing
   text. Use existing token pairs and make recovery distinct from info and danger in both themes.
3. Implement `sk-entity-marker` with documented `label`, default mark slot and parts `marker`,
   `content`. Trim label for mode: meaningful marks receive a real accessible name; empty marks are
   hidden and do not expose an unnamed image role.
4. Document every token dependency and every slot/part/property in consumer-facing JSDoc. Keep
   implementation rationale in line comments rather than published API descriptions.
5. Export/register the tags through `packages/elements/src/index.ts` and `elements.ts`, and add CSS
   subpath exports to `packages/styles/package.json`.

### T003 — Stories, registries, generation and docs

1. Add the exact stories from `plan.md`: section header `Default`, `WithMetadataAndAction`,
   `LongContent`, `LightMode`; status `Default`, `AllTones`, `LongText`, `LightMode`; entity marker
   `Initials`, `MeaningfulIcon`, `Decorative`, `LightMode`. Every `LightMode` uses `.sk-light` and
   has `a11y.disable: false`.
2. Add exact `expected-docs.json`, `expected-parts.json` and `expected-stories.json` rows, deriving
   totals from the actual additions rather than copying a stale train count.
3. Register section-header for SC-013 and SC-014. Register status-indicator and entity-marker for
   SC-010 as well. Add one unique late-upgrade property mutation for status tone and one for entity
   label, in addition to each subject's non-root part removal, `static styles = []`, and
   `static styles = [new CSSStyleSheet()]`. WP01 therefore contributes 11 of the mission's 19 arms.
4. Demonstrate every mutation red-first through the harness-owned sandbox and return the checkout
   to green. Do not mutate tests or leave broken source committed.
5. Regenerate CSS modules, CEM with `--skip-nx-cache`, all React wrappers, Vue declarations and
   `SIZES.md` after building tokens/styles/elements. Never hand-edit generated files.
6. Add the three components' contract/usage notes and changelog entry. State explicitly that
   consumers own headings/list markup/status copy/identity lookup.

### T004 — Focused gate and review handoff

Run the three fixtures, generator/drift checks, manifest/parts/story/theme/type/style gates,
`npm run test`, the complete mutation harness, Storybook build/axe and the relevant Playwright
behavior probes. The visual cases must execute as diagnostic/expected-red before authoritative PR
baselines exist; do not call them accepted or write local baseline bytes. Confirm no authored static
forms, list roles, application imports, token or dependency changes entered the diff. Commit only the
declared files with a conventional message, record exact SHA/test/mutation counts, and submit WP01
for independent review. Do not rebase, push, open a PR or self-approve.

## Definition of Done

- [ ] All three elements implement exactly their public slots/properties/parts and no domain logic.
- [ ] Native heading/list ownership and marker/status accessibility are asserted non-vacuously.
- [ ] Each subject has SC-013 plus two SC-014 red-first arms; status tone and entity label each have
  one attributable SC-010 late-upgrade arm, for 11 WP01 arms and 19 mission arms in total.
- [ ] Required stories, docs and generated outputs are complete and drift-clean.
- [ ] Focused/full runnable gates pass on the exact WP01 SHA and an independent reviewer approves it.
- [ ] No excluded source, rebase, push, PR, main, publish or deploy action occurred.

## Reviewer guidance

Reject render-only tests, hardcoded CSS, missing part targets, one-arm SC-014 coverage, invented
heading/status/identity semantics, static markup, list roles, generated-file hand edits or changes to
landed #79 sources. Verify every claimed red would fail for the named contract rather than a compile
or blank-render side effect.
