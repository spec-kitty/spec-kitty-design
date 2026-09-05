---
work_package_id: WP03
title: React and final verification closure
dependencies:
- WP02
requirement_refs:
- C-006
- C-010
- FR-012
- FR-019
- FR-021
- FR-024
- NFR-002
- NFR-004
- NFR-009
- NFR-010
planning_base_branch: mission/flow-health-transition-matrix
merge_target_branch: mission/flow-health-transition-matrix
branch_strategy: Planning artifacts for this mission were generated on mission/flow-health-transition-matrix. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/flow-health-transition-matrix unless the human explicitly redirects the landing branch.
subtasks:
- T012
phase: Phase 3 - React and final verification closure
history:
- timestamp: '2026-09-04T17:40:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks ownership recovery
agent_profile: frontend-freddy
authoritative_surface: fixtures/react-consumer/src/
create_intent:
- fixtures/react-consumer/src/sk-transition-matrix.test.tsx
execution_mode: code_change
owned_files:
- fixtures/react-consumer/src/sk-transition-matrix.test.tsx
- packages/react/type-tests/wrappers.type-test.tsx
- behaviours.json
- mutations.json
- suite-budget.json
priority: P1
role: implementer
tags: []
task_type: implement
tracker_refs:
- '#149'
- '#144'
- '#125'
---

# WP03 — React and final verification closure

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and
behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `codex`

If the profile cannot be loaded, run `spec-kitty agent profile show frontend-freddy` and apply the
resolved identity, boundaries, and initialization before continuing.

---

## Objective

Close the dedicated React consumer and type evidence after WP02 has generated
`SkTransitionMatrix`: prove structured-property identity/update/removal delivery and typed event
delivery without attributes or `any`, register only the applicable React ADR pairs with non-inert
sandboxed mutations, record local suite timing, and rerun every locally runnable production gate.
The reproducible local guard-4 selftest hang is recorded without a pass claim; it remains mandatory
in final CI. WP03 can then be reviewed and integrated without circularly requiring the rebase or CI
that occur only after all WPs are approved. Post-WP03 mission wrap-up owns consolidation, and the one
draft mission PR owns CI-authoritative baseline, suite-budget, WebKit and final exact-SHA gates.

Run this WP only after WP02 is approved:

```sh
spec-kitty agent action implement WP03 --agent codex
```

## Context

WP02 owns and generates the element, manifest, React wrapper, stories, and element behavior
evidence. This package exists because three required authored/conditional surfaces were not in
WP02's initialized ownership: the distinct React browser subject, the existing React type-test
surface, and `suite-budget.json`. Changing initialized ownership would bypass the guard; this
dependent package gives those files a fresh, explicit ownership boundary instead.

The React browser subject is not a second feature implementation. It consumes only the generated
public wrapper from WP02. The two shared registry files are necessary support for registering and
mutation-backing that distinct subject. All generated React files remain WP02-owned and are never
hand-edited here.

### Branch strategy

- WP03 depends on WP02 and is serial with it. Use only the workspace and branch emitted by the
  runtime action.
- `behaviours.json` and `mutations.json` overlap WP02 intentionally; this keeps the three packages
  in one writer lane while preserving an independently reviewable WP03 diff.
- Merge the reviewed WP03 result back into `mission/flow-health-transition-matrix`; do not push or
  open a WP-specific PR.
- Do not rebase during WP03. Only after WP03 approval and integration, mission wrap-up rebases and
  regenerates the whole shared lane, then the workflow opens one draft mission PR from
  `mission/flow-health-transition-matrix` to `train/elements-first` with `Refs #149`. Do not push,
  rebase, open, or merge it from this WP implementation step. That PR first generates nine
  CI-authoritative visual actuals; the approved bytes are committed as baselines to the same PR and
  final CI reruns. The later exact-head gate requires the guard selftest, WebKit, visual suite,
  mutation budget, Storybook timing below 180 seconds, SHA-pinned full squad, and one maintainer
  approval on the same head SHA; a later push invalidates those records. Merging the train into
  `main` remains operator-only.

## Scope and requirement trace

WP03 directly covers FR-012, FR-019, FR-021, FR-024, NFR-002, NFR-004, NFR-009, NFR-010,
C-006, and C-010. Its independent acceptance boundary is the dedicated React contract plus the
complete pre-PR local gate. The draft mission PR owns the later CI/final-gate boundary. The
frontmatter paths are the maximum write scope.

Hard exclusions:

- no direct checkout edit under `packages/react/src/**` or to the WP01-owned wrapper generator. The
  required red breaks run only in `suite-selftest.mjs`'s harness-owned temporary copy/sandbox and
  may target generated-wrapper/generator anchors there;
- no component, CSS, story, manifest, docs, ratchet, package, lockfile, token, ADR, Team Kitty, or
  sibling component edit;
- no registry pair for ADR SC-009, SC-011, SC-012, or SC-015;
- no budget change justified by a local timing. The initial WP03 approval leaves
  `suite-budget.json` byte-identical; only draft-PR CI may trigger the conditional return pass.

### T012: Close React evidence, sandboxed mutations, local timing, and pre-PR gate

**Purpose:** Make the generated wrapper contract and final production readiness independently
reviewable without widening an initialized work package.

**Steps:**

1. Create `fixtures/react-consumer/src/sk-transition-matrix.test.tsx` as the distinct React browser
   subject. Use readonly column/route fixtures and prove:
   - the same arrays reach the element before definition and survive upgrade;
   - rerendering replaces both property identities;
   - omitting previously supplied arrays resets each property to a fresh frozen empty array;
   - neither array is serialized as an attribute;
   - one wrapper listener receives one sentinel `sk-transition-matrix-select` event with exact
     `{ routeId }` detail.
2. Extend `packages/react/type-tests/wrappers.type-test.tsx` with positive coverage for all seven
   wrapper props and the typed callback. Add `@ts-expect-error` negatives for invalid tone, count,
   copy, and event-detail shapes; no explicit or inferred `any` is allowed.
3. In `behaviours.json`, register the distinct React subject only for ADR SC-006 listener delivery
   and ADR SC-010 structured-property delivery/reset. In `mutations.json`, add one unique surgical
   production-source mutation per new `(behavior id, subject file)` pair. Do not duplicate WP02's
   element pairs or invent mission-SC registry labels.
4. Establish red-first evidence without editing out-of-scope checkout files. Define each surgical
   mutation in `mutations.json`, pin it to the already generated wrapper/generator delivery or
   listener anchor, and drive it only with `node scripts/suite-selftest.mjs`. The harness must apply
   the break in its own temporary copy/sandbox, capture the exact intended named React-subject
   failure, discard the sandbox, and rerun the checkout green. Directly patching
   `packages/react/src/**` or `scripts/build-react-wrappers.mjs`—even temporarily—is prohibited by
   WP03 ownership. Run the main mutation harness and its selftest after both pairs are registered.
5. Run the focused commands below. A missing module, blank render, parser failure, or suite-wide
   compile error is not valid red-first evidence.
6. Run the mutation-adding suite locally with portable elapsed-time reporting, and record the exact
   WP03 SHA, mutation count, browser-test count, elapsed time, command, and green result. This proves
   execution for WP review but is explicitly non-authoritative for `suite-budget.json`; leave the
   budget byte-identical during the initial WP03 implementation/review.
7. Run every locally runnable component gate at the resulting WP03 head, with functional
   Playwright explicitly qualified to Chromium and Firefox. Attempt
   `node scripts/suite-selftest.mjs --selftest`; if the already reproduced guard-4 hang recurs,
   record the last completed guard and bounded timeout without claiming a pass. Do not install
   WebKit system libraries. Inspect the aggregate current-base diff, confirm excluded scope is
   absent, and run `git diff --check`. Do not rebase or claim final CI evidence from this WP.

**Files:**

- `fixtures/react-consumer/src/sk-transition-matrix.test.tsx` (new, distinct registry subject)
- `packages/react/type-tests/wrappers.type-test.tsx`
- `behaviours.json` (React SC-006/SC-010 pairs only)
- `mutations.json` (one non-inert mutation per new React pair)
- `suite-budget.json` (unchanged for initial WP03 approval; conditional only on a fresh WP03 return
  pass backed by the draft-PR CI evidence)

**Focused validation:**

The scoped single-file Vitest command deliberately uses the default reporter; the custom suite
floor applies only to the complete `npm run test` run in the T011 gate.

```sh
npx vitest run --project browser fixtures/react-consumer/src/sk-transition-matrix.test.tsx --reporter=default
node scripts/typecheck-all.mjs
/usr/bin/time -p node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
git diff --check
```

After these focused checks, rerun every runnable command from WP02's T011 gate, including explicit
Chromium and Firefox functional Playwright. The guard selftest remains a documented diagnostic if
the local guard-4 hang recurs. This local evidence must name the exact resulting WP03 head SHA, not
WP02's earlier baseline. After the targeted commit, run:

```sh
git diff --exit-code
git diff --cached --exit-code
test -z "$(git ls-files --others --exclude-standard -- . ':(exclude).worktrees/**')"
```

The active Spec Kitty `.worktrees/` directory is runtime state: preserve it, never stage it, and do
not count it as mission drift in this checkout-level check.

## Mission wrap-up handoff after WP03 approval *(not WP03 execution)*

1. Rebase the integrated shared branch on current `train/elements-first`, regenerate all shared
   artifacts and rerun every runnable local gate.
2. Open exactly one draft `Refs #149` PR. Record its CI URL, exact SHA, mutation/test counts,
   elapsed time and variance-aware margin. A needed budget change returns to a fresh WP03
   implementer on this same PR and repeats affected review; a second PR is prohibited.
3. Harvest all nine visual actual PNGs from that PR's CI artifact, compare those exact bytes with
   clean-v4, commit approved bytes as baselines to the same PR, and rerun final CI. Never use a
   local capture or local `--update-snapshots` as authority.
4. At the resulting exact head, require `node scripts/suite-selftest.mjs --selftest`, unqualified
   `npx playwright test` including WebKit, and
   `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium`
   against all nine committed baselines to pass with the mutation budget and every hard gate. Record
   Storybook duration below 180 seconds, run the full SHA-pinned squad, and require a maintainer
   approval on the current head. Any corrective push makes older CI, squad, timing and approval
   records stale. No agent merges the train into `main`.

## Definition of Done

- [ ] The dedicated React subject proves initial identity, upgrade survival, reference replacement,
  fresh frozen empty-array removal reset, absence of array attributes, and one typed sentinel event.
- [ ] React types accept all seven props and typed callback, reject invalid values under
  `@ts-expect-error`, and contain no explicit or inferred `any`.
- [ ] Only React ADR SC-006 and SC-010 pairs are added by this WP, and each has a unique non-inert
  mutation re-derived by the main suite selftest in a temporary sandbox; no generated wrapper or
  generator is directly edited in the checkout.
- [ ] Initial WP03 evidence records local SHA/counts/elapsed time and leaves `suite-budget.json`
  unchanged; WP03 approval does not depend on PR-triggered CI. A reproduced local guard-4 selftest
  hang is recorded without being reported as green.
- [ ] Every runnable WP02 T011 command passes locally at the exact WP03 head after WP03's changes,
  including qualified Chromium and Firefox functional Playwright, and the three post-commit
  clean-state commands exit zero outside the preserved active `.worktrees/` directory. WebKit and
  an exact guard-selftest pass remain mandatory final-CI gates.
- [ ] The diff contains no generated React hand edit or other excluded scope.
- [ ] No rebase, push, PR or CI-only result is required to approve initial WP03. Its closeout hands
  the one-draft-PR mutation-budget, nine-baseline, guard-selftest, WebKit, final visual, Storybook-
  timing, squad and current-head maintainer-approval obligations to the separate mission-wrap-up
  section without marking them done. A later CI-required budget edit returns as a fresh WP03 pass.

## Risks

- **Types pass while runtime drops arrays:** assert real property identity before/after upgrade and
  across rerender/removal in the dedicated browser subject.
- **Registry pair is inert:** require a unique production-source mutation and exact named red for
  each React pair.
- **Budget is raised from a workstation timing:** initial WP03 leaves it unchanged; require the
  draft-PR CI URL, SHA, counts, elapsed time, and variance-aware justification before a fresh WP03
  return pass may change it.
- **Generated wrapper is patched directly:** reject the WP. Red breaks must be harness-owned
  temporary-copy mutations; real defects return to WP01/WP02's authored source ownership.

## Reviewer Guidance

Review this package as a verification boundary. Confirm the fixture imports the generated public
wrapper and exercises a real DOM custom element, not a mock. Verify property identities and fresh
frozen resets, inspect the callback detail type, and break each registered React behavior at its
production anchor through the harness sandbox to see the named subject fail. Reject any direct
generated-wrapper/generator checkout edit, any registry pair beyond SC-006/SC-010, any locally
justified budget increase, rebase during WP03, or any WP-specific/second PR. WP03 itself is
approvable on local counts/timing plus every runnable local gate, with the reproduced guard-4 hang
recorded as a blocker rather than a pass. Separately confirm mission wrap-up harvests all nine
baseline bytes from the one draft PR and that guard selftest, WebKit, visual regression, timing,
squad and maintainer approval are pinned to its final post-CI head.

## Activity Log

- 2026-09-05T01:26:40Z – codex – shell_pid=2459900 – T012 React contract at lane SHA ca04c501bf: created a distinct real-browser subject using the generated public SkTransitionMatrix wrapper. It proves original readonly columns/routes identity before definition and after a test-owned real HTMLElement upgrade, replacement identities on rerender, omission resets both to distinct fresh frozen empty arrays, zero columns/routes attributes throughout, and one typed sentinel selection event. React typecheck positively covers all seven props plus contextual callback detail and uses @ts-expect-error negatives for invalid tone, numeric-count shape, copy, and event-detail shape; no explicit/inferred any escape. Added only React ADR SC-006 and SC-010 subject pairs. Harness-only sandbox mutations are exact: SC-006 replaces the generated useEventListener block with void props.onSkTransitionMatrixSelect; SC-010 replaces useProperties(ref, columns, columns, frozen-empty-reset) with void columns. The first 64-arm run exposed element-SC-010 collateral in the initial production-element-dependent test; the subject was corrected to isolate wrapper delivery through a test-owned browser custom-element upgrade. Exact-head rerun at ca04c50: baseline 152/152; both new named subjects red for the intended listener/property assertions with no collateral; all 64/64 mutations red and restored through deleted harness sandboxes; 196.9s harness time (real 196.93s), ceiling 360s; checkout stayed clean.
- 2026-09-05T01:26:57Z – codex – shell_pid=2459900 – Exact-head closeout at ca04c501bf: focused React browser 2/2; typecheck 4/4 projects; full Vitest 17 files and 181/181 tests (node 29, Chromium browser 152), zero skips; ordered CSS/markup/CEM/React/build/size generation and all drift, 25 wrapper probes, 14 manifest probes, 14 entry probes, 33-part ratchet, 31 adopted-sheet probes, CSS hygiene, no-CSS-source, theme, gate wiring, size, quality and diff gates green. Guard selftest no longer reproduced the historical hang: under a 120s safety wrapper it passed all 8/8 guards in 60.6s; final unwrapped CI command remains mandatory. Storybook Vite build 3.96s; axe 127/127 nonempty stories with zero WCAG 2.1 AA violations; functional Playwright Chromium 11/11 and Firefox 11/11. Local WebKit probe failed only at launch for missing libgtk-4-1, libicu74, libjpeg-turbo8 and gstreamer1.0-libav; no libraries installed and final CI remains mandatory. Visual diagnostic produced nine nonblank transition-matrix actual PNGs (390x643 narrow; 1232x217 light; seven 1280-wide captures) and failed exactly because the nine authoritative baselines are absent; three older component baselines also show pre-existing local font/metric drift. Local snapshot stubs and test output were moved to /tmp/wp03-visual-ca04c50-wLofaN and no PNG remains in the checkout. suite-budget.json stayed byte-identical at SHA-256 c2182aaf5049fe0414196b54f2fdc2c7e62b6e2efe33cd3b196901729ec938d5. Baseline recorder red is pre-existing evidence plumbing, not a product failure: it recorded runner pytest and test <gate-coverage-junit> with no JUnit XML artifact produced for this TS/React scope. No generated React/generator, excluded surface, rebase, push, PR, merge, publish or deploy.
- 2026-09-05T01:26:58Z – codex – shell_pid=2459900 – Mutation wording clarification: the exact SC-010 sandbox source anchor is useProperties(ref, "columns", columns, () => Object.freeze([])); and its replacement is void columns;. The prior activity note's comma-separated prose did not preserve the source quotes; this note records the literal anchor. The harness deleted every temporary sandbox and the committed generated wrapper remained unedited.
- 2026-09-05T01:28:20Z – codex – shell_pid=2459900 – SHA correction: the exact WP03 implementation head is ca04c503671f1d2730383e87a07ae0b2e8b78deb (short ca04c50). Earlier notes and the for-review reason accidentally appended 1bf to the short SHA as ca04c501bf; that string does not resolve. The post-commit generation, 181-test, 64-mutation, 8-guard, Storybook, axe and Chromium/Firefox evidence was executed at the actual committed head ca04c503671f1d2730383e87a07ae0b2e8b78deb.
