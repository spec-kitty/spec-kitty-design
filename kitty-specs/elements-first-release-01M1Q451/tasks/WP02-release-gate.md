---
work_package_id: WP02
title: The PR-time release gate, asserted on tarballs
dependencies:
- WP01
requirement_refs:
- FR-003
- FR-004
planning_base_branch: mission/elements-first-release
merge_target_branch: mission/elements-first-release
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-release. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-release unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 2 - Gate
history:
- timestamp: '2026-09-04T21:23:41Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/check-release-graph.mjs
create_intent:
- scripts/check-release-graph.mjs
execution_mode: code_change
owned_files:
- scripts/check-release-graph.mjs
- scripts/check-gate-wiring.mjs
- .github/workflows/ci-quality.yml
tags: []
tracker_refs:
- '#80'
---

# WP02 — The gate that makes the release path exercisable

`release.yml` runs **only** on `push: tags: ['v*.*.*']`. No pull request has ever executed it. That
is not a theoretical gap: the `cp packages/html-js/src/nav-pill/sk-nav-pill.js` step #73 removed
would have hard-failed the next release, and it was found by a lens *reading* the file.

## What to build

`scripts/check-release-graph.mjs`, run on every PR, asserting:

1. the derived set is **non-empty** (SC-003)
2. every package in it packs, and **none** is skipped as private (SC-001)
3. every path in each package's `exports` map resolves to a file inside **that package's own**
   tarball (SC-002)
4. no tarball contains a sourcemap, a test file, or a dev-only dotfile (SC-010)
5. `release.yml` consumes the derived list rather than any hand-written one (SC-004)

Use `npm pack --dry-run --json`, which returns the file list without writing a tarball and hits no
registry. Add a `--selftest` mode with probes, the pattern `build-react-wrappers.mjs` already ships.

## What will bite

**`exports` wildcards.** `"./dist/*": "./dist/*"` cannot be resolved literally against a file list.
Expand the pattern — and **a pattern that matches zero files must fail.** This is the empty-set rule
one level down, and it is the single most likely place for this gate to certify absence in exactly
the shape it exists to prevent.

**`check-gate-wiring.mjs` is hard-coded to one job name.** `const JOB = 'test'`. A new job is
invisible to the script whose entire purpose is noticing a job that cannot block a merge. Generalise
it to a list and add the new job — otherwise this gate can go red without blocking anything, which
is worse than not having it.

**Do not put the job behind the `changes` filter.** A packaging-only PR — one that edits a `files`
array or an `exports` map — is precisely the PR this gate exists for. A filtered job would skip on
it. Unconditional, and in `gate`'s `needs`.

**Prove it reds.** For SC-005, reverting any single packaging fact — re-adding `private: true`,
dropping a package from the publish set, emptying a `files` array — must turn it red. A gate
observed green on a healthy tree has demonstrated nothing.
