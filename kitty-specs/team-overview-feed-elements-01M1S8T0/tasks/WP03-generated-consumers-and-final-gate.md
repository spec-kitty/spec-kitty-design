---
work_package_id: WP03
title: Generated consumers and complete local gate
dependencies:
- WP02
requirement_refs:
- C-006
- C-007
- C-009
- C-010
- C-011
- C-012
- C-013
- FR-019
- FR-020
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
planning_base_branch: mission/team-overview-feed-elements
merge_target_branch: mission/team-overview-feed-elements
branch_strategy: Planning artifacts for this mission were generated on mission/team-overview-feed-elements. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/team-overview-feed-elements unless the human explicitly redirects the landing branch.
subtasks:
- T010
- T011
- T012
phase: Phase 3 - Generated consumers and complete local gate
history:
- timestamp: '2026-09-05T17:25:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
agent_profile: frontend-freddy
authoritative_surface: fixtures/react-consumer/src/
create_intent:
- fixtures/react-consumer/src/sk-action-row.test.tsx
execution_mode: code_change
owned_files:
- fixtures/react-consumer/src/sk-action-row.test.tsx
- packages/react/type-tests/wrappers.type-test.tsx
- behaviours.json
- mutations.json
- packages/elements/custom-elements.json
- packages/elements/vue.d.ts
- packages/elements/SIZES.md
- packages/react/src/**
- packages/react/.wrapper-floor
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#146'
- '#144'
- '#125'
- '#76'
- '#79'
- '#92'
- '#112'
---

# WP03 — Generated consumers and complete local gate

## Do this first: load the profile

After WP02 approval, load `frontend-freddy` through `spk-doctrine-profile-load`, apply its resolved
implementation context, and use only the existing serial lane returned by:

```sh
spec-kitty agent action implement WP03 --agent codex --mission team-overview-feed-elements-01M1S8T0
```

Use Codex only. Do not rebase the active lane.

## Objective

Close the generated React action-row runtime/type contract, register its one applicable behavior
pair with a sandboxed mutation, regenerate every shared artifact and run the complete locally
runnable production gate. Reconcile the governed acceptance, issue and analysis artifacts, then hand
the clean approved mission to post-WP wrap-up without circularly claiming the final train
rebase/merge, PR CI, CI-authoritative baseline, Tier-C squad, external acceptance/waiver, maintainer
approval or merge.

## Context and boundaries

- WP01/WP02 own authored elements, CSS, stories, docs and element behavior. WP03 consumes their
  generated public surface; it does not refactor those sources.
- `packages/react/src/**`, CEM, Vue declarations and SIZES remain generator-owned. A mutation may
  target a generated wrapper only inside the harness's disposable copy.
- Vue exposes generated tag/prop declarations. The generator does not emit typed event handlers, so
  WP03 makes no such claim.
- No token, dependency, lockfile, budget, application, sibling component or generated hand edit.
- No rebase, push, PR, local-baseline blessing, squad, self-approval, merge, main, publish or deploy.
- WP03 may update only pending/current evidence in the three governed mission artifacts it owns; it
  may not mark #146 fixed, record final acceptance, or claim a train/CI/squad/approval result.

### T010 — Generated React runtime/type evidence

1. Regenerate the wrappers from the final WP02 manifest, then create
   `fixtures/react-consumer/src/sk-action-row.test.tsx` using `@spec-kitty/react` only.
2. Prove one `onSkActionRowActivate` listener receives one sentinel event with exact frozen
   `{ id: 'sentinel-row' }` detail and preserves its identity. Assert the wrapper neither changes the
   detail nor duplicates subscription under React StrictMode.
3. Extend `packages/react/type-tests/wrappers.type-test.tsx` with valid `rowId`, `selectable`,
   `selected` and callback use. Add `@ts-expect-error` negatives for invalid prop types and
   `event.detail.rowId`/another nonexistent key so `any` cannot pass silently.
4. Register `react-action-row` only as an SC-006 subject. Add a unique mutation that removes the
   generated wrapper's event listener and drive it through the mutation harness's temporary copy.
   Require the named React test alone to red; never patch generated checkout files manually.
5. Run the dedicated browser fixture, all typechecks, wrapper check/selftest and full mutation
   harness. Record exact red/green evidence and final WP03 SHA.

### T011 — Complete local pre-PR gate

1. Regenerate every output in `plan.md` from the complete lane tree, including existing components'
   shared CEM/React/Vue/SIZES artifacts. Build before size measurement and run CEM analyze with
   `--skip-nx-cache`.
2. Run every command in `plan.md`'s complete local final gate, including unqualified full tests,
   CEM re-analysis/diff, wrapper/gate selftests, demo assembly, measured suite, mutation harness and
   its `--selftest`, Storybook/axe, unqualified Playwright, derived release graph, packed Vue,
   offline probes, security checks, and per-commit plus range commitlint against the fetched train
   baseline. No skipped check is green evidence.
3. Confirm generated drift is empty, `git diff --check` passes, and the post-commit worktree has no
   tracked/untracked mission drift other than Spec Kitty's active `.worktrees/` runtime state.
4. Inspect the aggregate base diff: exactly four authored component directories; no section-list,
   list role, static form, app state/import, clock, token/dependency/lockfile, sibling authored source,
   main/publish/deploy change.
5. Record exact command/count/duration/results for reviewer handoff. Run visual cases only as
   diagnostic/expected-red before the PR and do not commit or bless local baselines. The explicit
   `PW_INCLUDE_VISUAL=1 ... visual.spec.ts --project=chromium` command becomes required green only
   after approved Linux Chromium baseline bytes are committed during wrap-up.
6. Submit WP03 for independent review. Its approval authorizes only the orchestrator's ordered
   rebase-before-Spec-Kitty-merge wrap-up, not a rebase/push/PR/merge by this WP worker.

### T012 — Governed matrix and analysis reconciliation

1. Update `acceptance-matrix.json` only with evidence that exists at the WP03 SHA. Keep PR CI,
   authoritative visual, squad, external acceptance/waiver, maintainer and train-merge criteria
   pending; no local diagnostic screenshot may satisfy them.
2. Update `issue-matrix.json` through the supported verdict seam when available: #76, #79 and #92
   stay verified; #112 and parent #125 stay deferred; #144 stays the deferred parent epic; #146
   remains `in-mission` until every final external gate passes and the authorized train merge is
   complete. Never use a closing keyword in the PR.
3. Regenerate `analysis-report.md` through the canonical analysis command from the reconciled spec,
   plan and tasks. Its metadata hashes, prose, requirement count, 19-mutation total, issue rows and
   named analyzed SHA must agree. Commit its result conventionally; an analyzer-generated invalid
   subject is repaired before handoff.
4. Confirm every acceptance/issue row has a terminal owner even when its present verdict is pending.
   Submit these artifacts with WP03 for independent review; later exact-head evidence belongs to
   mission wrap-up and invalidates earlier report SHAs when written.

Focused commands before the plan's full gate:

```sh
npx vitest run --project browser fixtures/react-consumer/src/sk-action-row.test.tsx --reporter=default
node scripts/typecheck-all.mjs
node scripts/build-react-wrappers.mjs --check
node scripts/build-react-wrappers.mjs --selftest
node scripts/suite-selftest.mjs
git diff --check
```

## Mission wrap-up handoff after WP03 approval

1. Freeze the approved serial lane. Fetch `origin/train/elements-first`, record its exact SHA as the
   SK-179 hold, and rebase the clean planning target `mission/team-overview-feed-elements` onto that
   SHA before any lane integration. If an authored conflict touches another mission's component,
   stop; generated conflicts are resolved only after authored sources reconcile.
2. Use Spec Kitty to merge the frozen lane into that rebased target.
3. Regenerate every shared artifact once, commit the generated result, rerun the complete local gate
   on that exact head and push the small linear branch. Do not rebase after lane consolidation.
   Re-fetch before each external gate; if train differs from the held SHA, mark the mission BLOCKED.
   SK-179 provides no truthful post-consolidation rebase/rebaseline path.
4. Leave the timestamp-bearing token catalogue unchanged when token sources are unchanged. If
   rebased current train requires it, regenerate it once in the generation commit; do not demand a
   second byte-identical catalogue run. Reinspect issue #112/current train and run the canonical
   conformance surfaces actually present there, always including `elements-load.spec.ts` and only
   adopting #112's matrix commands if they have landed.
5. Open/update exactly one draft PR into `train/elements-first` with `Refs #146`.
6. Harvest CI-generated Linux Chromium visual actuals, compare with the approved screenshot and
   commit only approved artifact bytes; rerun final CI including
   `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium`.
   Record Storybook duration strictly below 180 seconds.
7. On that exact head dispatch three distinct profile-loaded Codex lenses for the Tier-C pre-merge
   gate and resolve/disposition every finding. Any push invalidates the lens evidence.
8. Invoke the external acceptance writer only after the branch is otherwise frozen. It must attest
   the same SHA without committing or pushing. If SK-178 still makes the writer mutate the branch,
   stop and obtain an explicit operator/maintainer waiver recorded against the reviewed SHA; do not
   run it and attach earlier reviews to its new head.
9. Require one maintainer approval on that same exact SHA. Any push invalidates acceptance and
   approval; a train advance blocks the mission under step 3.
10. Merge only into the train after explicit operator authorization. Never touch main, publish or
    deploy.

## Definition of Done

- [ ] Generated React runtime delivers one exact typed detail under StrictMode and type tests reject
  invalid props/detail without `any`.
- [ ] `react-action-row` has exactly one applicable SC-006 pair and a non-inert sandboxed mutation.
- [ ] Every generated artifact is current and every local gate in plan.md passes at exact WP03 SHA.
- [ ] Aggregate scope audit is clean and worktree has no uncommitted deliverable drift.
- [ ] Acceptance, issue and analysis artifacts are truthful at WP03 SHA, with every external gate
  still pending and every row assigned to a terminal owner.
- [ ] Independent reviewer approves WP03 without relying on later PR/CI/squad/maintainer evidence.
- [ ] Wrap-up obligations are handed off truthfully; no forbidden external action occurred.

## Reviewer guidance

Reject direct generated edits, event tests that dispatch against the element while bypassing the
wrapper listener, missing StrictMode duplicate protection, untyped detail, a mutation that reds the
wrong subject, skipped gates, stale CEM cache, local baseline authority, premature final-rebase/CI
claims or any scope outside generated-consumer/final-gate closure.
