# Tier B post-tasks review

Date: 2026-09-07

Mission: `repository-dossier-compact-navigation-shell-01M1Y3FY`

Scope: specification, plan, task topology, ownership, verification, and live issue #254 traceability

Reviewers: three independent read-only Codex seats (architecture/API; verification/acceptance; scope/workflow/distribution)

## Initial verdict

BLOCK. One cohesive WP was independently confirmed as the correct topology, but the task set was not ready to finalize until the findings below were resolved.

## Findings and resolutions

1. **High — effective-open behavior was underspecified.** Escape, inertness, and focus behavior could have run from `open` alone even when the axis was absent, unknown, or above the compact threshold. Resolved by defining effective open as recognized compact presentation + observed app-shell inline size `<=860px` + controlled `open === true`, and requiring event/no-event tests across all combinations.
2. **High — dismissal focus intent had no deterministic expiry.** A rejected request could survive until an unrelated later route close and steal focus. Resolved by defining consumer acceptance during the synchronous dispatch turn, presenting the result at the first post-dispatch render, and clearing pending intent after that render whether accepted or rejected.
3. **High — responsive ARIA ownership was contradictory.** A consumer trigger outside compact presentation could remain visibly expanded above 860px while the controlled target was unavailable. Resolved by requiring the consumer trigger inside `compact-header` and in the same light-DOM root as the navigation target. Trigger and drawer now leave presentation together above the threshold; the shell never mutates consumer ARIA.
4. **Medium — the threshold coordinate system was ambiguous.** CSS used a container query while prose/tests often said viewport. Resolved by naming the app-shell inline container as normative, retaining full-width viewport fixtures, and adding a constrained-shell-in-wider-viewport fixture so behavior and CSS cannot accidentally diverge.
5. **High — size output was outside WP ownership.** `packages/elements/SIZES.md` is now explicit owned generated output.
6. **High — approved visual inputs were not resolvable.** Exact immutable absolute paths and SHA-256 values for D1, D2, and D4–D8 are now in `research/source-register.csv`; WP01 records comparison evidence without modifying those sources.
7. **Medium — static-markup wording conflicted with the existing distribution.** `sk-app-shell` has no authored markup module. Spec/plan/WP now require the repository-wide generator to pass without inventing a new app-shell markup surface and qualify generated output by applicability.
8. **High — 400% zoom was required by the programme but absent from the spec.** The requirement is now explicitly identified as programme-level and synchronized through spec, plan, data model, research, and WP01 alongside issue #254's 200% requirement.
9. **High — final verification used categories instead of deterministic commands/evidence.** WP01 now contains the exact generation, focused browser, full suite, conformance, mutation, release, and size commands, browser prerequisites, and a durable exact-SHA evidence path.
10. **Low — behavior IDs could be confused with mission success criteria.** Every registry reference is qualified as an ADR-11 ID; mission success criteria retain their separate namespace.

## Live-state recheck

After the reviewers completed, the orchestrator independently re-read live issue #254 because one read-only review sandbox could not reach `api.github.com`. The issue remained open, had zero comments, and reported `updatedAt=2026-09-07T13:35:55Z`. Its complete body was compared with the amended artifacts; no live criterion or non-goal was missing.

## Final review disposition

PASS after amendment, subject to the canonical Spec Kitty task validator/finalizer succeeding on these exact artifacts. One WP remains justified because the new element API, rendering state, CSS threshold, accessibility behavior, generated wrappers/types, stories, and behavior/mutation registrations are one backward-compatible public contract and cannot safely ship independently.
