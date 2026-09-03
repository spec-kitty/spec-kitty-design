---
work_package_id: WP01
title: Teach the axe gate to see inside open shadow roots
dependencies: []
requirement_refs:
- FR-007
- NFR-002
- NFR-003
- C-002
planning_base_branch: mission/elements-package-foundation
merge_target_branch: mission/elements-package-foundation
branch_strategy: Planning artifacts for this mission were generated on mission/elements-package-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-package-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - Gate
history:
- timestamp: '2026-09-03T00:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/run-axe-storybook.js
create_intent: []
execution_mode: code_change
owned_files:
- scripts/run-axe-storybook.js
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 – Teach the axe gate to see inside open shadow roots

Implements IC-05. **Sequenced first and depends on nothing.**

## Why this is first

An earlier plan draft had this depend on the package scaffold "for a real element to test against". That was wrong twice: the scaffold WP creates only config, and the true relation is a **cycle** — the gate cannot be red-first tested without a shadow element, and a shadow element cannot pass CI without the gate fix. `lit@3.3.3` already resolves and Storybook already globs `packages/**/*.stories.@(ts|tsx)`, so this WP defines its own throwaway shadow-only Lit elements inside fixture stories. That is also the only way to exercise all six NFR-002 shapes as *the entire content of an open shadow root* without leaving permanent stories that breach C-003.

## Four blind sites, not one

`scripts/run-axe-storybook.js` reasons about DOM content at four places, all light-DOM-only:

| line | site |
|---|---|
| `:207` | root existential check (`hasOwnContent(root)`) |
| `:258` | per-host content check |
| `:240-248` | host enumeration (`hostsByTag` / `hostsByClass`) |
| `:312-316` | the `waitForFunction` predicate |

A squad confirmed there is **no fifth site**. Today a shadow-only element fails at `:207` with *"story wrappers mounted but the component did not"*, and burns the full 8s `RENDER_TIMEOUT_MS` first because the wait never satisfies.

## The trap inside the fix

Every traversal helper must check `n.shadowRoot` **before** walking `n.childNodes`. A squad's first attempt descended into *children's* shadow roots but not the node's own, and rejected a correctly-rendered element with `component host(s) rendered nothing: sk-thing`. Adding that base case flipped all ten test shapes to the correct verdict in both DOMs.

`:311` says *"If you change one, change both."* #69 broke exactly that pairing and a squad caught it. The wait predicate and the assertion change together, or not at all.

## Subtasks

- **T001** — Add flat-tree traversal (shadow root before child nodes) and apply it at all four sites. Keep the wait predicate and the assertion sharing one selector constant, as they do today.
- **T002** — Author throwaway fixture stories: one correctly-rendering shadow-only element, plus the six NFR-002 shapes as the entire content of an open shadow root, plus an empty `sk-*` block beside a text-bearing sibling in the same shadow root.
- **T003** — Capture the before/after per-story baseline over the existing 74 stories, port-normalised.

## Definition of Done

- [ ] All four sites pierce open shadow roots (FR-007).
- [ ] **Eight demonstrated cases** with exit codes: shadow-only element passes; the six NFR-002 shapes each fail *inside a shadow root*; the empty-block-beside-text case fails naming the block (SC-005).
- [ ] The same six shapes still fail in **light DOM** — the list runs twice (NFR-002).
- [ ] Per-story result lines over the 74 existing stories are identical before and after, after normalising `127.0.0.1:\d+` (NFR-003, SC-006).
- [ ] The wait predicate and the assertion are still equivalent; state how that was checked.
- [ ] Fixture stories are removed or clearly marked throwaway — they must not become permanent catalogue entries (C-003).

## Notes

**Do not** add #104's stylesheet-coverage arm here. Measured: `document.styleSheets.length === 0` while `shadowRoot.adoptedStyleSheets.length === 1`, so that check would fail every element story. Whichever of #104 / this mission lands second must account for the other.

**Settled, do not re-investigate:** axe itself pierces open shadow roots (nested targets `["#v","button"]` for shadow-only content), so there is no green-by-emptiness below the mount assertion.
