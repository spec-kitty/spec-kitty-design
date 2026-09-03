---
work_package_id: WP01
title: Teach the axe gate to see inside open shadow roots
dependencies:
- WP02
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
create_intent:
- packages/elements/src/__fixtures__/**
execution_mode: code_change
owned_files:
- scripts/run-axe-storybook.js
- packages/elements/src/__fixtures__/**
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

A squad confirmed there is no *sixth* site. `:170` (`root.childElementCount === 0 && root.textContent.trim() === ''`) is a fifth light-DOM-only predicate but needs **no change**: the shadow host is itself a light-DOM child of the render root, so it never false-fails a shadow-only story. Named here so nobody applying "make all traversal shadow-aware" wonders whether it was missed. Today a shadow-only element fails at `:207` with *"story wrappers mounted but the component did not"*, and burns the full 8s `RENDER_TIMEOUT_MS` first because the wait never satisfies.

## The trap inside the fix

Every traversal helper must check `n.shadowRoot` **before** walking `n.childNodes`. A squad's first attempt descended into *children's* shadow roots but not the node's own, and rejected a correctly-rendered element with `component host(s) rendered nothing: sk-thing`. Adding that base case flipped all ten test shapes to the correct verdict in both DOMs.

`:311` says *"If you change one, change both."* #69 broke exactly that pairing and a squad caught it. The wait predicate and the assertion change together, or not at all.

## Subtasks

- **T001** — Add flat-tree traversal and apply it at all four sites. **Base case: check `n.shadowRoot` before walking `n.childNodes`, and walk BOTH** — a squad's first attempt descended into children's shadow roots but not the node's own and rejected a correctly-rendered element; walking the shadow root *instead of* children breaks case 9. Sharing one selector constant is **not sufficient** any more: after this change the drift lives in the *traversal*, and the two sites cross separate serialization boundaries (`:271` vs `:318`). Hoist the traversal into one stringified source injected at both call sites — and note the lesson from #102, where an `eval`-based hoist made `waitForFunction` throw into that same swallowing catch and silently disabled the wait. Pass it as data, not code.
- **T002** — Author throwaway fixture stories under `packages/elements/src/__fixtures__/` (this WP owns that path; `packages/elements/` exists because WP02 ran first). **Eleven cases, not eight** — the extra three are shapes a real #72 component hits:
  1. shadow-only element renders → PASS
  2-7. the six NFR-002 shapes as the **entire content** of an open shadow root → FAIL
  8. empty `sk-*` block beside a text-bearing sibling in the same shadow root → FAIL
  9. **slotted content**: `<sk-x>text</sk-x>` with shadow `<div><slot></slot></div>` → **PASS**. A literal reading of "shadow root *before* child nodes" that walks the shadow root *instead of* childNodes makes the light-DOM text invisible and fails a correct element. Nearly every migrated component takes children.
  10. **slot with nothing assigned and nothing else in the shadow root** → FAIL.
  11. **nested host**: an `sk-*` host inside another element's shadow root → the empty case must FAIL. `hostsByTag`/`hostsByClass` use `root.querySelectorAll('*')`, which crosses no boundary; the traversal must recurse arbitrarily, and all eight original cases sit at depth 1.
- **T003** — Capture the before/after per-story baseline over the existing 74 stories, port-normalised.

## Definition of Done

- [x] All four sites pierce open shadow roots (FR-007).
- [x] **Eight demonstrated cases** with exit codes: shadow-only element passes; the six NFR-002 shapes each fail *inside a shadow root*; the empty-block-beside-text case fails naming the block (SC-005).
- [x] The same six shapes still fail in **light DOM** — the list runs twice (NFR-002).
- [x] Per-story result lines over the 74 existing stories are identical before and after, after normalising `127.0.0.1:\d+` (NFR-003, SC-006).
- [x] The wait predicate and the assertion are equivalent, proven **mechanically, not in prose**. This DoD line was previously prose-satisfiable *and undetectable*: `waitForFunction` at `:312-316` has `.catch(() => {})` at `:320` and `:327` runs the assertion regardless, so an implementer who pierces the three assertion sites and leaves the wait light-DOM-only gets the **correct verdict on all eleven cases, on the light-DOM re-run, and on all 74 stories**. The only symptom is +8s (`RENDER_TIMEOUT_MS`) per shadow story. That is exactly the site #69 broke. Guard it by asserting the shadow-only fixture's wait **resolves** (instrument the swallowing catch) or that its per-story wall time is well under `RENDER_TIMEOUT_MS`.
- [x] The eleven cases land as a **permanent gate self-test**, not a transcript. Both branches of the old wording were bad: six fixtures deliberately fail `assertStoryRendered`, which throws — left inside Storybook's `packages/**` glob they make the a11y job permanently red; deleted, they destroy the only evidence and leave four newly shadow-aware sites with zero standing regression guard. Land them as fixture HTML plus a node harness driving `assertStoryRendered` directly, **outside** Storybook's story glob, wired into CI by WP02. C-003 is untouched because these are not catalogue stories.

## Notes

**Do not** add #104's stylesheet-coverage arm here. Measured: `document.styleSheets.length === 0` while `shadowRoot.adoptedStyleSheets.length === 1`, so that check would fail every element story. Whichever of #104 / this mission lands second must account for the other.

**Settled, do not re-investigate:** axe itself pierces open shadow roots (nested targets `["#v","button"]` for shadow-only content), so there is no green-by-emptiness below the mount assertion.
