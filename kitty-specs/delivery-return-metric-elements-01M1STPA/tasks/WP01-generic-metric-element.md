---
work_package_id: WP01
title: Generic metric element
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-013
- FR-016
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
planning_base_branch: mission/delivery-return-metric-elements
merge_target_branch: mission/delivery-return-metric-elements
branch_strategy: Planning artifacts for this mission were generated on mission/delivery-return-metric-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/delivery-return-metric-elements unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - Metric prerequisite
history: []
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/metric/
create_intent:
- packages/styles/src/metric/sk-metric.css
- packages/elements/src/metric/sk-metric.ts
- packages/elements/src/metric/sk-metric.stories.ts
- packages/elements/src/metric/sk-metric.css.js
- packages/elements/src/metric/sk-metric.css.d.ts
- fixtures/elements-behaviour/src/sk-metric.test.ts
execution_mode: code_change
owned_files:
- packages/styles/src/metric/sk-metric.css
- packages/elements/src/metric/sk-metric.ts
- packages/elements/src/metric/sk-metric.stories.ts
- packages/elements/src/metric/sk-metric.css.js
- packages/elements/src/metric/sk-metric.css.d.ts
- fixtures/elements-behaviour/src/sk-metric.test.ts
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#147'
- '#144'
---

# WP01 — Generic metric element

## Do this first

Load the `frontend-freddy` profile through the profile-load skill and use Codex as the implementation agent. Then enter only the workspace returned by:

```sh
spec-kitty agent action implement WP01 --agent codex --mission delivery-return-metric-elements-01M1STPA
```

Do not invoke Claude or Claude-backed tooling.

## Objective

Implement the independently reviewable `sk-metric` prerequisite: one generic label/value presentation with optional `sk-pill-tag` annotation, bounded neutral/info/success/attention tone, compact density, isolated native semantics, fail-closed invalid data, five documented parts, and an exact named constructed stylesheet. Values are opaque supplied text; no domain computation is permitted.

## Public contract

Five scalar properties and observed attributes only:

| Property | Attribute | Type/default |
|---|---|---|
| `label` | `label` | `string`, `''` |
| `displayValue` | `display-value` | `string`, `''` |
| `annotation` | `annotation` | `string`, `''` |
| `tone` | `tone` | literal union `neutral/info/success/attention`, `'neutral'` |
| `compact` | `compact` | boolean, `false` |

There are no methods, events, or slots. The exact parts are `metric`, `label`, `value`, `annotation`, and `empty-state`. Keep the public `tone` field's manifest-facing type self-contained; do not expose only a local alias that a generated declaration could reference without importing.

Valid `label` and `displayValue` are nonblank strings and are rendered byte-for-byte. Invalid required values or an unsupported tone render `Metric unavailable.` in `part="empty-state"`; do not trim/rewrite valid content or partially render the metric.

Use one native `<dl>` with `<dt>` label and `<dd>` value. The component is not a heading. If annotation is present, render an actual `sk-pill-tag` after the value and use this presentation mapping only: neutral → default, info → purple, success → green, attention → yellow. Annotation omission produces no tag/empty chrome.

## Scope and requirements

Allowed writes are exactly the six `owned_files` in frontmatter. Shared package entries, ratchets, manifest, React/Vue artifacts, package exports, `SIZES.md`, Playwright files, docs, changelogs, behaviors, and mutations belong to WP03.

This WP covers FR-001–FR-005, FR-013, and the metric half of FR-016. It satisfies the element-local portion of NFR-001–NFR-004 and preserves C-001–C-007.

### T001 — Red-first focused contract

1. Create `fixtures/elements-behaviour/src/sk-metric.test.ts` with direct local imports, not package-barrel imports.
2. Assert exact opaque preservation for `€1,840`, `91%`, a large tabular string, and nonnumeric content. Do not snapshot shadow markup.
3. Assert one native definition relationship, absence of a heading role, and omission of annotation markup when `annotation === ''`.
4. Assert each tone creates the intended generic presentation and actual `SK-PILL-TAG` composition; never assert private BEM classes as public API.
5. Assert `compact` does not alter label/value/annotation text or semantic relationship.
6. Assert missing/blank required content and unsupported tone fail closed to the generic status without partial primary values.
7. Target all five literal selectors through external `sk-metric::part(name)` rules and verify they resolve to present shadow nodes.
8. Compare `shadowRoot.adoptedStyleSheets[0]` with the named `skMetricSheet` module export by identity and require zero shadow `<style>` elements.
9. Execute every row of this fixed reversal matrix against production source. Capture the named failing assertion and command exit nonzero, restore the exact source, rerun that assertion green, and record both outputs before commit. Do not add mutation-registry entries.

| Coherent group | Temporary production-source reversal | Required named assertion that must turn red |
|---|---|---|
| Opaque supplied content | Replace the `displayValue` text binding with a digits-only transformation | `preserves every supplied display-value byte` |
| Native definition semantics | Replace the `<dl>/<dt>/<dd>` relationship with generic `<div>` nodes | `exposes one native definition relationship without a heading` |
| Annotation/pill composition | Replace the actual `sk-pill-tag` node with a plain span | `composes the existing pill tag and omits absent annotation chrome` |
| Fail-closed validation and tone | Allow an unsupported tone through the valid render path | `fails closed for invalid required content or tone` |
| Public parts and constructed stylesheet | Remove `part="value"` from the valid template | `targets all five public parts and adopts only skMetricSheet` |

### T002 — Element and styles

1. Author `packages/styles/src/metric/sk-metric.css` as the single style source. Use existing semantic tokens only, BEM family `sk-metric`, and `:host { display: block; }`.
2. Implement the approved eyebrow/supplied strong tabular-value hierarchy, compact density, generic tone modifiers, annotation spacing, and unavailable state.
3. Do not add theme/ancestor selectors. Default and `.sk-light` differences arrive only through inherited tokens.
4. Implement `SkMetric` with consumer-facing class/property JSDoc, exact `@element`/`@csspart` tags, existing guarded `define()`, and the generated sheet.
5. Import/register the existing `sk-pill-tag` through the repository's direct component pattern; do not reimplement its HTML/CSS or add a package dependency.
6. Document exact token dependencies in the class JSDoc, matching distinct CSS references.
7. Run `node scripts/build-elements-css.mjs` to create only the local `.css.js` and `.css.d.ts` generated pair, then inspect their named export. No other generated output is in WP scope.

### T003 — Stories

Create `packages/elements/src/metric/sk-metric.stories.ts` with title `Elements/SkMetric` and exactly these exports:

- `Default`
- `WithAnnotation`
- `Tones`
- `Compact`
- `LongContent`
- `LightMode`

Use generic labels/values. `LightMode` must wrap the rendered target with `class="sk-light"` and render equivalent content. Do not add a Storybook-only state class, component-local raw design value, Team Kitty noun, or static HTML story.

### T004 — Focused proof and review handoff

Run focused non-heavy verification only:

```sh
node scripts/build-elements-css.mjs
node scripts/build-elements-css.mjs --check
npx vitest run --project browser fixtures/elements-behaviour/src/sk-metric.test.ts --reporter=default
npx nx run elements:typecheck
npx nx run elements:lint
npm run quality:stylelint
git diff --check
```

If Storybook can build without contending with another browser fleet, a build-only smoke is allowed; do not run axe, visual Playwright, `npm run test`, or `suite-selftest.mjs` in this WP. WP03 owns full gates.

Use Spec Kitty's targeted commit/review flow. Require a clean worktree after the focused commit, and do not push or open a PR.

## Definition of Done

- [ ] All five public properties/attributes have exact consumer-facing documentation and no Team Kitty vocabulary.
- [ ] Values are rendered verbatim and invalid required data fails closed without partial evidence.
- [ ] Definition semantics are correct; no heading ownership is invented.
- [ ] Optional annotation composes a real `sk-pill-tag` and is absent when not supplied.
- [ ] Compact/tone affect presentation only and use existing tokens.
- [ ] Five parts are present/targetable and the named sheet is adopted with zero `<style>` nodes.
- [ ] Exactly six required metric stories exist, including a real `.sk-light` variant.
- [ ] Direct red reversals and all focused commands are recorded green after restoration.
- [ ] The diff contains only `owned_files`, one focused commit, no push, and no PR.

## Risks

- **Domain formatting leaks in:** keep the API string-only and tests adversarial with currency/percentage-looking text.
- **Annotation duplicates pill-tag:** inspect for an actual nested custom element, not merely a similar rounded span.
- **Definition semantics become headings:** preserve consumer ownership of section headings.
- **Generated alias breaks later:** keep public literal union self-contained at the analyzer boundary.
- **Token gap tempts a raw value:** stop and escalate; WP01 has no token authority.

## Reviewer guidance

Reject if any changed file is outside frontmatter, if the annotation is not an actual `sk-pill-tag`, if display content is parsed/normalized, if the component owns an event/selection/action, if semantics depend on surrounding layout, if a public part is untested, if a static markup source is added, or if focused evidence lacks a real red reversal. Approval is for WP01 only and grants no PR/merge authority.

## Activity Log

> **CRITICAL**: Activity log entries MUST be in chronological order (oldest first, newest last).

- 2026-09-06T00:00:00Z – system – Planning prompt finalized; implementation has not started.
