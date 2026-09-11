# Tasks: CLI Auth Proof Hardening

**Input**: `spec.md`, `plan.md` (both committed)
**Branch**: `mission/cli-auth-proof-hardening` (single_branch topology — this mission's WP
executes directly on this branch; no worktree, per `spec-kitty`'s own `single_branch` contract)

Per `plan.md`'s Implementation Concern Map, this mission is **one bounded Work Package and one
PR**. IC-01 (#417's breakpoint alignment + family sweep) and IC-02 (#418's derived DOM inventory)
touch disjoint files, but both are small, neither is independently more valuable to ship alone
than together, and the mission brief itself calls for exactly one bounded WP.

## Subtask Index

| ID | Description | WP | Parallel |
|----|---|----|----|
| T001 | `cli-auth.stories.ts`: change `.sk-cli-auth-pattern`'s narrow-width `@media` step from `max-width: 390px` to `max-width: 480px`, with a comment recording the deliberate mirror of `sk-boundary-page.css`'s own `480px` step | WP01 | |
| T002 | Sweep the five other named pattern families (`team-overview`, `mission-kanban`(+ten-lane), `repository-dossier`, `work-explorer`, `work-package-views`, `mission-reading`) for the same story-local-breakpoint-disagrees-with-composed-frame defect; record the finding (read-only — no divergence found) | WP01 | |
| T003 | `scripts/check-pattern-composition.mjs`: add a run-as-CLI guard (measured defect: importing the module for its exports ran the full CLI pass and could call `process.exit()`); export `tokensOwnedClasses()`, `localClassesIn()`, `knownElementTags()`, `bemBlockRoots()`, `skPrimitivesIn()` — the derived primitives #418's DOM arm needs, reusable by future pattern specs | WP01 | |
| T004 | `sk-cli-auth-pattern.spec.ts`: replace the five-name regex denylist with a derived enumeration using T003's exports; assert every `sk`-prefixed tag/class in the rendered markup is a known custom element, an owned styles/tokens class, a story-local class, or a BEM root of one of those | WP01 | |
| T005 | Execute the red-first proof: plant a fabricated `<sk-auth-panel class="sk-consent-row">` into the rendered markup, confirm the derived check fails and names both, revert, confirm green again — record real command output | WP01 | |

T001/T002 (#417) and T003/T004/T005 (#418) touch disjoint files and have no data dependency on
each other, but are sequenced within one WP per the mission brief's "exactly one bounded WP."

## Work Package WP01 — CLI-auth proof hardening: breakpoint alignment + derived composition inventory (single WP, single PR)

**Priority**: P1 for both User Story 1 (#417) and User Story 2 (#418) — both were filed by the
same pre-merge gate pass on #409 and both are explicitly named as "about to be copied four more
times" by in-flight sibling missions.

**Independent test**: read `cli-auth.stories.ts`'s narrow-width rule (expect `480px` + mirror
comment); run `sk-cli-auth-pattern.spec.ts` for real against a built Storybook (expect green,
including the new derived-inventory assertions); execute the red-first plant/revert proof for the
derived check and record both outputs.
