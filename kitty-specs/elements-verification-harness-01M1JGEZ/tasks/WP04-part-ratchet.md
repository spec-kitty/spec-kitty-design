---
work_package_id: WP04
title: The ::part() shrink-only ratchet
dependencies:
- WP03
requirement_refs:
- FR-007
planning_base_branch: mission/elements-verification-harness
merge_target_branch: mission/elements-verification-harness
branch_strategy: Planning artifacts for this mission were generated on mission/elements-verification-harness. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-verification-harness unless the human explicitly redirects the landing branch.
subtasks:
- T011
phase: Phase 2 - Behaviours
history:
- timestamp: '2026-09-03T02:30:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/check-part-ratchet.mjs
create_intent:
- scripts/check-part-ratchet.mjs
- expected-parts.json
execution_mode: code_change
owned_files:
- scripts/check-part-ratchet.mjs
- expected-parts.json
tags: []
tracker_refs: []
---

# WP04 — The `::part()` shrink-only ratchet

SC-013 says every manifest-declared `::part()` must be present and targetable, with the
expected list **derived from `custom-elements.json`** rather than hardcoded. That is the
right mechanism — it is what #72–#74 inherit — and today it is **vacuous**:

```
elements: 1   declared cssParts: 0
```

A derived list over zero parts is a green assertion over nothing. C-007 promised an
anti-vacuity guard and neither spec nor plan said what it was. This is it.

## Subtask

- **T011** — A committed `expected-parts.json` holding the count (starting at **0**) and
  the per-element part names. `scripts/check-part-ratchet.mjs` fails when the manifest
  declares **more** parts than the file records, without the file being updated in the same
  PR. Shrink-only: removing a part is allowed and updates the file; adding one without
  updating it — and therefore without a test — is impossible.

  This is the same shape as `check-manifest-content.mjs`'s floor: derive from the source of
  truth, refuse to pass vacuously.

## Definition of Done

- [ ] `check-part-ratchet.mjs` runs in `lint-code` (WP06 wires it).
- [ ] **Red-first, today**: add a `@csspart` JSDoc to `sk-stub`, regenerate the manifest,
      and the ratchet fails naming the undeclared part. Green when `expected-parts.json` is
      updated. Committed as the demonstration, not narrated.
- [ ] The check fails if `custom-elements.json` is missing or unreadable, rather than
      treating absence as zero parts.
