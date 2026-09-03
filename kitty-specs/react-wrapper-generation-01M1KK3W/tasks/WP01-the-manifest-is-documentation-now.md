---
work_package_id: WP01
title: The manifest is consumer documentation now — make it worth reading
dependencies: []
requirement_refs:
- FR-007
planning_base_branch: mission/react-wrapper-generation
merge_target_branch: mission/react-wrapper-generation
branch_strategy: Planning artifacts for this mission were generated on mission/react-wrapper-generation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/react-wrapper-generation unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - Input
history:
- timestamp: '2026-09-03T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: packages/elements/custom-elements.json
create_intent: []
execution_mode: code_change
owned_files:
- packages/elements/src/card/sk-card.ts
- packages/elements/src/nav-pill/sk-nav-pill.ts
- packages/elements/src/form-input/sk-form-input.ts
- packages/elements/src/form-textarea/sk-form-textarea.ts
- packages/elements/src/form-control-base.ts
- packages/elements/custom-elements.json
tags: []
tracker_refs: []
---

# WP01 — The manifest is the generator's only input, and it is now consumer documentation

Sequenced FIRST because fixing it changes every generated file downstream.

The spike ran `@wc-toolkit/react-wrappers` against the real manifest. Three of its six findings
are about what the manifest carries, not about the generator.

## Subtasks

- **T001** — **Twenty-four `/** undefined */` blocks reach consumer-facing types.**

  | file | count |
  |---|---:|
  | `SkFormInput.d.ts` | 10 |
  | `SkFormTextarea.d.ts` | 10 |
  | `SkNavPill.d.ts` | 2 |
  | `SkCard.d.ts` | 2 |

  The elements' reactive properties carry no JSDoc, so the manifest has no `description`, so the
  generated prop documentation says the literal word `undefined` in a React consumer's editor.
  Add one short line per public property. **Short** — C-005 applies with double force now: the
  analyzer copies it verbatim, and it lands in IDE hovers AND in the wrapper.

- **T002** — **Move two review narratives out of `/** */`.** `SkFormInput.d.ts` currently
  documents the `error` prop with:

  > *"This exists because a lens found the only lever a consumer HAD was `el.invalid = true` …
  > the story would render red, axe would pass, and nothing would notice."*

  That is squad-review narrative — right for a maintainer, wrong in a consumer's tooltip. The
  surrounding convention is that rationale goes in `//`; `error` and `setCustomError` slipped.
  Keep the reasoning, move it.

- **T003** — **`sk-card` declares no `@slot` and renders one.** Add it.

  **Correcting the spec's stated reason.** FR-007 implies a type-level consequence; the spike
  shows there is none — `SkCard.d.ts` gets `children` from
  `Pick<React.AllHTMLAttributes<HTMLElement>, "children" | …>`, not from the manifest's slot
  list. The cost is documentation only. Still worth fixing; the spec is corrected rather than
  left implying something measurably untrue.

## Definition of Done

- Zero `undefined` descriptions in the regenerated wrappers, asserted by grep over the output.
- No squad-review narrative in any `/** */` above an export in `packages/elements/src`.
- `npx nx run elements:analyze` regenerates cleanly and `check-manifest-content.mjs` is green.
- Published prose per declaration stays short — record the before/after character counts.
