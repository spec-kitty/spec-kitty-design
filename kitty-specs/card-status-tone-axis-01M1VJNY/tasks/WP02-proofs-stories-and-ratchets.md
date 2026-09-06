---
work_package_id: WP02
title: The proofs — behaviour tests, stories, type reach and ratchets
dependencies:
- WP01
requirement_refs:
- FR-002
- FR-003
- FR-010
- FR-011
- FR-012
- FR-013
- C-001
- C-005
- C-006
planning_base_branch: mission/card-status-tone-axis
merge_target_branch: mission/card-status-tone-axis
branch_strategy: Planning artifacts for this mission were generated on mission/card-status-tone-axis. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/card-status-tone-axis unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
- T010
- T011
phase: Phase 2 - the proofs
history:
- at: '2026-09-06T12:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: fixtures/elements-behaviour/src/sk-card.test.ts
create_intent: []
execution_mode: planning_artifact
model: ''
owned_files:
- fixtures/elements-behaviour/src/sk-card.test.ts
- packages/elements/src/card/sk-card.stories.ts
- packages/styles/src/card/sk-card-html.stories.ts
- packages/react/type-tests/wrappers.type-test.tsx
- behaviours.json
- mutations.json
- expected-docs.json
- expected-stories.json
role: implementer
tags: []
task_type: feature
tracker_refs:
- spec-kitty/spec-kitty-design#177
---

# Work Package Prompt: WP02 – The proofs

## Goal

Prove, by tests and stories rather than by comments, that the axis fails open, that the vocabulary
cannot fork, that the two axes are independent, that the status card is reproducible by
composition, that meaning survives without colour, and that the widened union reaches the generated
React wrapper without `any`.

## What to build

1. **Behaviour tests (T007)** in `fixtures/elements-behaviour/src/sk-card.test.ts`:
   - **One vocabulary**: `Object.keys(CARD_STATUSES)` deep-equals the exported `STATUS_TONES`,
     membership **and order**. This is what makes the leaf module's restatement a derivation.
   - **Fail open**, extending the existing `[SC-013]` test so it also mounts
     `<sk-card status="…">` with an unknown value and targets `::part(card)` from outside: the part
     is present, the class list is exactly `sk-card`, the slot survives with its assigned node, and
     exactly **one** `console.warn` names the offending value.
   - **Prototype-chain keys** degrade on the render path and throw on the authoring path.
   - **Orthogonality**: `variant="purple" status="attention"` puts both modifiers on one node, and
     the computed surface differs from a purple-only card.
   - **`[SC-010]`**: `status` assigned as a property *before* the definition upgrades survives and
     **reflects** to the attribute.
   - **Both themes**: the status surface resolves differently under `.sk-light`, proving the light
     variance crosses the shadow boundary as a value, not a selector.

2. **Registry (T008).** `behaviours.json`: add `sk-card` as a subject of **SC-010** (it now owns a
   reflected reactive property). `mutations.json`: two red-first arms —
   - `reflect: true` → `reflect: false` on `status`, reds `[SC-010]@sk-card`;
   - the status fail-open branch replaced by a `throw`, reds `[SC-013]@sk-card` — the card blanks
     its shadow root and `::part(card)` stops being targetable, which is exactly the regression the
     policy exists to prevent.
   Verify both with `node scripts/suite-selftest.mjs`.

3. **Stories (T009)** in `packages/elements/src/card/sk-card.stories.ts`:
   - `Default` (no status), one story per tone or one `AllStatuses` grid — plus the required
     per-tone coverage, `StatusWithVariant` (orthogonality), `UnknownStatus` (fail-open),
     `Greyscale` (desaturated, proving meaning survives without colour), `ForcedColors`
     (documented baseline), and **`LightMode`** covering every tone wrapped in `class="sk-light"`
     — never `data-theme` (#93).
   - **`StatusCardComposition`** — the mission's proof: `sk-card[status]` +
     `sk-status-indicator[tone]` + `<dl class="sk-facts">` + `<details class="sk-disclosure">`,
     with the `<dl>` and `<details>` in **light DOM**. Do not modify `.sk-facts` / `.sk-disclosure`.
   - Static-path stories in `packages/styles/src/card/sk-card-html.stories.ts` render from the
     **generated** exports, never hand-written markup.

4. **Type reach (T010)** in `packages/react/type-tests/wrappers.type-test.tsx`: `<SkCard
   status="danger" />` compiles; `@ts-expect-error` on `<SkCard status="failed" />`, which is
   red-first by construction (an unused directive is itself an error, so the test cannot rot into a
   no-op if the union widens to `any` or `string`). Add an explicit mutual-assignability proof
   between `SkCardProps['status']` and the tone union.

5. **Ratchets (T011).** `expected-docs.json`: `sk-card` attributes 2 → 3 and bump `total` (the
   check is **exact**). `expected-stories.json`: opt `sk-card` in with the built story ids and bump
   `total` — verify each id against the built Storybook index before committing.
   `expected-parts.json` is unchanged: no new part.

## Definition of done

- `npm test` green; `node scripts/suite-selftest.mjs` green with both new arms reporting red-first.
- `node scripts/check-manifest-content.mjs`, `check-part-ratchet.mjs`,
  `check-story-theme-wrapper.mjs`, `check-gate-wiring.mjs` pass.
- `npx nx run storybook:storybook:build --skip-nx-cache && node scripts/run-axe-storybook.js`
  reports zero violations.
- `git status --porcelain` empty.
