---
work_package_id: WP03
title: The fourteen required behaviours
dependencies:
- WP01
- WP02
requirement_refs:
- FR-007
planning_base_branch: mission/elements-verification-harness
merge_target_branch: mission/elements-verification-harness
branch_strategy: Planning artifacts for this mission were generated on mission/elements-verification-harness. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-verification-harness unless the human explicitly redirects the landing branch.
subtasks:
- T003
- T008
- T009
- T010
phase: Phase 2 - Behaviours
history:
- timestamp: '2026-09-03T02:30:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: fixtures/elements-behaviour/src/
create_intent:
- fixtures/elements-behaviour/src/behaviours.test.ts
- fixtures/elements-behaviour/src/elements-owned.test.ts
- behaviours.json
execution_mode: code_change
owned_files:
- fixtures/elements-behaviour/src/behaviours.test.ts
- fixtures/elements-behaviour/src/elements-owned.test.ts
- behaviours.json
tags: []
tracker_refs: []
---

# WP03 — The fourteen required behaviours

The browser-lane tests. Keyed by `behaviours.json` **id**, never by test title — WP05's
mutation list matches on id, and a rename here must not break it.

## The fourteen

Form association 4 (SC-002 FormData · SC-003 `setValidity` blocks and reaches the a11y
tree · SC-004 reset restores · SC-005 disabled excluded) · event contract 4 (SC-006 fires
exactly once, `toHaveBeenCalledTimes(1)` — `toHaveBeenCalled()` passes on 1 **and** on 2 ·
SC-007 `detail` shape · SC-008 `composed`/`bubbles` · SC-009 `preventDefault` prevents) ·
SC-010 property before upgrade · SC-011 slot and fallback · SC-012 focus and keyboard ·
SC-013 `::part()` · SC-014 style adoption · SC-015 registry guard.

The charter enumerates **fifteen**. The fifteenth is generation determinism, deferred to
#75 — its subject does not exist, and the artifacts that do already have enforced drift
checks in `lint-code`.

## Two criteria carry corrections you must not undo

- **SC-014 is IDENTITY, not bytes.** `CSSStyleSheet` has **no `cssText`** — measured,
  `undefined`. The only read-back, `cssRules[].cssText`, is CSSOM-normalised: comments
  stripped, shorthands collapsed, `#010203` → `rgb(1, 2, 3)`, and normalised
  **differently per engine** on a lane that runs two. Assert
  `shadowRoot.adoptedStyleSheets[0] === Ctor.styles[0]` — measured `true` against the
  repo's real shape — **and** `shadowRoot.querySelectorAll('style').length === 0`, which
  is ADR-11 item 7's second half and was silently dropped from an earlier draft. Byte
  provenance is already closed one layer up by `build-elements-css.mjs --check`.

- **SC-010 is repo-owned and currently fails.** With `useDefineForClassFields` unset,
  esbuild emits native class fields and Lit's accessor is shadowed:
  *"The following properties … will not trigger updates as expected because they are set
  using class fields."* WP01/T005 fixes it at the base tsconfig. If this test is green
  before WP01 lands, something is wrong with the lane, not with the element.

## Subtasks

- **T003** — `behaviours.json`, the id registry: id, charter clause, SC id, applicability.
  **Fourteen** entries, each added *in the same commit as its test*, so WP01's
  per-behaviour floor arm never goes red mid-sequence. Owned here rather than in WP01
  because this WP owns the behaviours; one file, one owner. Tests are keyed by **id**,
  never by title, so WP05's mutation list does not break when a test is renamed.

- **T008** — The eleven fixture-owned behaviours.
- **T009** — The **two** elements-owned behaviours: SC-014 (style adoption) and SC-015
  (registry guard), whose subject is `packages/elements/src` reached through WP01's alias.
  Mutating these requires **redirecting the alias**, not editing the copied fixture — flag
  for WP05's guard 10.

  **SC-013 is NOT one of them.** `packages/elements/src` contains no `part=` and no
  `@csspart`, and the manifest declares zero `cssParts` — verified. So an elements-owned
  `::part()` mutation has no pattern, WP05's guard 1 fires by construction, and its guard 7
  set-equality becomes unsatisfiable. SC-013's test is **fixture-owned** against the ≥2
  parts WP02 ships. The manifest-derived arm is WP04's ratchet, honestly vacuous at zero.

  This WP also **adds the remaining thirteen entries to `behaviours.json`**, each in the
  same commit as its test, so the floor's per-behaviour arm never goes red mid-sequence.
  It removes WP01's seed id and seed test when the real coverage lands.
- **T010** — SC-015 needs three assertions, not one. `expect(() => define(tag, Ctor))
  .not.toThrow()` is satisfied by an **empty function body** — a helper that registers
  nothing passes it perfectly. Assert: a different-constructor redefine warns; the
  **original** constructor is still what `customElements.get(tag)` returns; and a
  same-constructor redefine is **silent** (`define.ts` only warns when the constructor
  differs).

## Definition of Done

- [ ] Every id in `behaviours.json` has exactly ONE covering test, and the floor agrees.
      WP01's seed test and its registry entry are removed here.
- [ ] No "it renders" assertion, no shadow-DOM snapshot, no test of Lit's own reactivity,
      no assertion on internal class names (C-003).
- [ ] SC-006 uses `toHaveBeenCalledTimes(1)`.
- [ ] SC-014 asserts identity **and** zero `<style>`.
- [ ] SC-015 asserts all three arms.
- [ ] Every test carries its `behaviours.json` id.
