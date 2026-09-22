---
work_package_id: WP01
title: A markup module evaluates from a real module URL and imports the one tone vocabulary
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
- NFR-001
- NFR-002
- C-003
- C-004
planning_base_branch: mission/markup-vocabulary-import-and-ratchet-corrections
merge_target_branch: mission/markup-vocabulary-import-and-ratchet-corrections
branch_strategy: Planning artifacts for this mission were generated on mission/markup-vocabulary-import-and-ratchet-corrections. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/markup-vocabulary-import-and-ratchet-corrections unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - the generator and its consumer
history:
- at: '2026-09-06T22:10:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: ''
authoritative_surface: scripts/build-element-markup.mjs
create_intent:
- packages/elements/src/status-indicator/status-tones.ts
owned_files:
- scripts/build-element-markup.mjs
- packages/elements/src/status-indicator/status-tones.ts
- packages/elements/src/status-indicator/sk-status-indicator.ts
- packages/elements/src/card/sk-card.markup.ts
- packages/elements/src/card/sk-card.ts
- fixtures/elements-behaviour/src/sk-card.test.ts
execution_mode: planning_artifact
model: ''
tags: []
tracker_refs:
- '216'
---

# Work Package Prompt: WP01 – One authored vocabulary, imported

Closes #216. See `plan.md` §1 for the pre-fix measurements and §2 for the design.

## T001 — the vocabulary becomes a leaf

Move `StatusIndicatorTone` and the frozen `STATUS_TONES` into a new
`packages/elements/src/status-indicator/status-tones.ts` with **no imports of its own**, and
re-export both from `sk-status-indicator.ts` so the package barrel, the fixtures, the stories and
`sk-notice` are untouched. Record in the new file why it is a leaf: the element reaches `lit` and,
through `define.js`, `customElements` at module scope, so a generator-evaluated module cannot
import it.

## T002 — FR-001, FR-002: evaluate from a real module URL

In `scripts/build-element-markup.mjs`, replace the `data:` import with
`await import(pathToFileURL(src).href)`, and install two `module.registerHooks` hooks once at
module scope: a `resolve` that retargets a relative `.js` specifier with no file behind it onto
its `.ts` sibling, and a `load` that runs the already-pinned `esbuild.transformSync` over any
`file:` URL ending `.ts`. Everything else falls through to `nextResolve`/`nextLoad`.

## T003 — FR-003: the failure stays named

Replace the leaf-module error with one that names the markup file, the underlying message, and the
constraint that actually remains: a markup module may import a leaf vocabulary module, and may not
reach a module that needs a browser. Demonstrate it red-first against a scratch markup module with
an unresolvable import; record the output verbatim; remove the scratch module.

## T004 — FR-005: `sk-card` derives its statuses

`sk-card.markup.ts` imports `STATUS_TONES` and builds `CARD_STATUSES` from it. Keep `CardStatus`
a union (alias it to `StatusIndicatorTone`) so `isCardStatus`'s predicate still narrows. Rewrite
the comment that explains why the map was a copy — it is now a derivation, and the reason it can be
is the generator change.

## T005 — FR-006: the parity test goes

Remove the order-sensitive `Object.keys(CARD_STATUSES)` ↔ `STATUS_TONES` case from
`fixtures/elements-behaviour/src/sk-card.test.ts`. Keep its second assertion — every modifier is
this block's BEM family — standing on its own, because the derivation does not constrain the
template literal.

## T006 — FR-007: `sk-notice`, measured

Check `sk-notice` against the same standard: does it restate the vocabulary anywhere, and does it
carry a parity assertion? Report the finding either way rather than assuming the sequencing note in
#216 still holds.

## T007 — FR-008, NFR-001, NFR-002: the proof

Regenerate every markup artifact cache-free and show the tree unchanged; run `--check`; run the
behaviour fixture and the type tests; regenerate the manifest, React wrappers and Vue types and show
no drift. Separately, confirm whether `build-vue-types.mjs` still forces `sk-card.ts`'s
`declare status:` line to spell the union inline, and record the answer.
