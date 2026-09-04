---
work_package_id: WP05
title: The runbook, the changelog, and the limits of a dry run
dependencies:
- WP01
- WP02
- WP03
requirement_refs:
- FR-006
- FR-007
- FR-008
planning_base_branch: mission/elements-first-release
merge_target_branch: mission/elements-first-release
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-release. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-release unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 3 - Surfaces
history:
- timestamp: '2026-09-04T21:23:41Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: docs/release-runbook.md
create_intent:
- docs/release-runbook.md
- CHANGELOG.md
execution_mode: code_change
owned_files:
- docs/release-runbook.md
- CHANGELOG.md
tags: []
tracker_refs:
- '#80'
---

# WP05 — The handoff

This mission prepares a release the operator performs. This WP is the part they read.

## What to write

`docs/release-runbook.md`, stating the post-merge sequence in order — **land the train on `main`,
tag, the workflow publishes** — with the tag as the trigger, not the merge. Mark clearly which steps
are the operator's: creating the `@spec-kitty` npm org, adding `NPM_TOKEN` (the secret name
`release.yml` already expects), and pushing the tag.

`CHANGELOG.md` for 1.0.0. Version stays 1.0.0 (C-003): nothing was ever installed, so there is no
compatibility window and no deprecation cycle.

The single-version policy (FR-007): `customElements.define` is global and **throws** on a duplicate
tag, so two majors of `@spec-kitty/elements` on one page is a hard runtime failure, not a degraded
experience. State it where a consumer will read it before they hit it.

## What will bite

**Do not write the runbook as though a dry run proved publishability.** It does not.
`npm publish --dry-run` short-circuits before `ensureProvenanceGeneration` — measured by running it
with a full GitHub Actions environment faked, and provenance was never exercised. So a dry run proves
**packing, not publishing**: not provenance, not auth, not registry acceptance. #80's revised exit
criterion calls it "proving the rebuilt pipeline end to end", and that phrase will be read literally
unless the runbook says otherwise.

**Record the install sizes from a real `npm pack`** (NFR-004), regenerated rather than transcribed.
For reference at planning time, `@spec-kitty/tokens` packs 3.9 MB / 5.6 MB unpacked across 37 files,
of which `assets/logo.png` is 1.48 MB — a consumer installing a CSS file pulls all of it. Whether
that changes is fork 3 on #80; state the number either way.
