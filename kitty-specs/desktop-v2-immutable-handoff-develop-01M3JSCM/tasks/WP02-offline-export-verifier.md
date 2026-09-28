---
work_package_id: WP02
title: Deterministic offline exporter and contract verifier
dependencies:
- WP01
requirement_refs:
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- C-001
- C-004
planning_base_branch: develop
merge_target_branch: develop
branch_strategy: Planning artifacts for this mission were generated on develop. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into develop unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
- T008
phase: Phase 2 - Export and verification
history:
- timestamp: '2026-09-28T01:27:00Z'
  agent: planner-priti
  action: Authored for issue 470 replacement on develop
agent_profile: node-norris
authoritative_surface: scripts/export-desktop-v2-handoff.mjs
create_intent:
- scripts/export-desktop-v2-handoff.mjs
- scripts/verify-desktop-v2-handoff.mjs
- tests/node/desktop-v2-handoff.test.ts
execution_mode: code_change
owned_files:
- scripts/export-desktop-v2-handoff.mjs
- scripts/verify-desktop-v2-handoff.mjs
- tests/node/desktop-v2-handoff.test.ts
- .github/workflows/ci-quality.yml
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#470'
---

# WP02 — Deterministic offline exporter and verifier

Start after WP01's SHA-independent contract and evidence mappings are approved through Spec Kitty review in the same mission. Consume the checked, rights-cleared source/asset closure at an explicit full committed Git SHA. Read exported bytes from Git blobs at that SHA, or reject any dirty included path before reading the working tree; protect against time-of-check/time-of-use mutation by checking again or relying solely on immutable blobs. Export a portable directory under a caller-selected output path with a post-source schema-versioned manifest, normalized relative paths, per-file byte sizes and SHA-256 digests, license/source-map references and a canonical digest over sorted payload/contract bytes. Neither the source contract nor the manifest hashes itself. Same committed SHA and contract inputs produce byte-identical output without host timestamps, checkout paths, registry access or runtime network requests. An unchanged full `tokens.css` export is blocked by unresolved Swansea URLs; a verified scoped derivative excluding them needs a source map. Falling Sky OTF's embedded SIL OFL is valid evidence.

Implement T005–T008. The copied verifier has explicit internal-integrity and approved-source modes. Internal mode rejects changed/missing/extra files, path traversal, symlinks, duplicate/case-colliding paths, and mismatched manifest/contract/file digests, but cannot authenticate a coordinated replacement. Approved-source mode additionally requires caller-supplied, independently pinned expected source SHA and artifact digest, and rejects a coordinated manifest+contract+payload rehash. A failure names the path or field. Tests must include dirty included-file and mid-export mutation probes, same-S byte repeatability, ordinary tamper, coordinated rehash (internal may pass; pinned mode must fail), rights and path failures. Wire `contracts/desktop-v2/**` into the existing `components` path filter and run contract/export checks in relevant existing quality jobs in `.github/workflows/ci-quality.yml`; do not add a new harness.

Run all seven gate categories at the actual reviewed PR head: `npm run quality:all`, `npm test` plus focused contract/export tests, `npx nx run-many --target=build --projects=tokens,styles,elements,react`, `npx nx run storybook:storybook:build`, `node scripts/run-axe-storybook.js`, `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` with positive test count, and two exports plus copied offline verification against independent pins. Preserve per-story axe outcomes and story→visual-test→snapshot mapping with tested SHA in PR evidence outside the source contract. If CI skips a gate, provide exact-head manual evidence. Submit WP02 for independent review. After both WPs are approved, consolidate one mission PR to `develop`. A later focused mission freezes stable post-merge S, repeats required gates, and produces the final handoff artifact and S-labelled reports after S.
