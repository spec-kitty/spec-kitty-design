---
work_package_id: WP03
title: The file:// consumer, proven by interception, and the SRI hash
dependencies:
- WP01
requirement_refs:
- FR-005
planning_base_branch: mission/elements-first-release
merge_target_branch: mission/elements-first-release
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-release. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-release unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 2 - Gate
history:
- timestamp: '2026-09-04T21:23:41Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/check-offline-load.mjs
create_intent:
- scripts/check-offline-load.mjs
- scripts/build-elements-integrity.mjs
- packages/elements/INTEGRITY.json
execution_mode: code_change
owned_files:
- scripts/check-offline-load.mjs
- scripts/build-elements-integrity.mjs
- packages/elements/INTEGRITY.json
tags: []
tracker_refs:
- '#80'
---

# WP03 — The no-build consumer, and what they execute

ADR-10 §2's second distribution entry is the classic-script bundle: `packages/elements/dist/elements.js`,
built `--format=iife` with Lit bundled in. It is built on every release and dropped from the publish
set (WP01 fixes that). This WP proves it works where it is meant to work.

## What to build

`scripts/check-offline-load.mjs` — a Playwright chromium probe that writes a `file://` page
referencing the built IIFE and `tokens.css` by relative path, intercepts **every** request, loads
it, and asserts the custom elements upgraded, are styled, and that the intercepted request count is
**zero**.

`scripts/build-elements-integrity.mjs` — generates the SRI hash (sha384, base64) for the bundle into
a committed `INTEGRITY.json`, with a `--check` mode that re-derives and diffs. Same contract as
`SIZES.md`: the artifact is generated, committed, and re-derived by CI, never transcribed.

## What will bite

**This criterion currently passes by accident, and that is the whole risk.** The only network
dependency in the graph is `tokens.css`'s Google Fonts `@import` — and it is **invalid and dropped**,
because it sits at line 162 while `:root {` opens at line 3. Measured in Chromium:

```
parsed rules: {"total":32,"imports":0,"first":"CSSStyleRule"}
=> @import was DROPPED by the parser
```

The route watching `fonts.googleapis.com` never fired. So a probe written today goes green **having
proven nothing**, and stays green right up until someone repositions that `@import`.

**Therefore: red-first, against a deliberately network-dependent fixture.** Plant a page that does
fetch something, watch the probe red, then remove it. A green observed on the current tree is not
evidence that the probe can see anything.

**Build before you measure.** `nx` serves `build` from cache, so a `--check` can compare a stale
`dist/` against a hash derived from that same stale `dist/` — self-consistent and wrong. Pass
`--skip-nx-cache`. This repo has been bitten by it twice (#140, #143).
