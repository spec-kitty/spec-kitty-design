---
affected_files: []
cycle_number: 1
mission_slug: flow-health-transition-matrix-01M1PGNJ
reproduction_command:
reviewed_at: '2026-09-04T23:22:31Z'
reviewer_agent: user
wp_id: WP02
---

---
affected_files:
  - packages/elements/src/transition-matrix/sk-transition-matrix.ts
  - packages/elements/src/transition-matrix/sk-transition-matrix.stories.ts
  - fixtures/elements-behaviour/src/sk-transition-matrix.test.ts
  - apps/storybook/src/tests/sk-transition-matrix.spec.ts
  - kitty-specs/flow-health-transition-matrix-01M1PGNJ/tasks/WP02-complete-controlled-transition-matrix-and-release-evidence.md
cycle_number: 1
mission_slug: flow-health-transition-matrix-01M1PGNJ
reproduction_command: "npx playwright test apps/storybook/src/tests/sk-transition-matrix.spec.ts --grep 'non-selectable.*zero interaction residue'"
reviewed_at: '2026-09-04T23:20:59Z'
reviewer_agent: codex
wp_id: WP02
---

# WP02 review feedback — cycle 1

Reviewed commit: `05daf38b4c3343eb43a3cddd3cb8c24d41b7dc43`

Comparison base: approved WP01 commit `b7a20a96ab3f7a3f436ace41bc05b58f3488b073`

## Blocking findings

### 1. HIGH — Default dark and LightMode do not preserve equivalent content, and theme variance is unproved

`packages/elements/src/transition-matrix/sk-transition-matrix.stories.ts:71-73` renders `Default`
from the compact two-column/two-route fixture. `LightMode` instead renders the six-route/four-column
approved fixture at lines 142-150. The two required theme stories therefore do not expose the same
content or relationships as required by NFR-005. The only LightMode assertion at
`apps/storybook/src/tests/sk-transition-matrix.spec.ts:51-55` checks that the story is non-empty and
axe-clean; it neither compares the dark/light DOM relationships nor proves that a paired computed
token-driven colour actually differs. This leaves NFR-005, SC-011, and T008 step 4 unproved.

Remediation:

1. Make the required Default-dark and `.sk-light` stories use equivalent data, copy, selection, and
   interaction configuration while retaining exactly the nine authorised story exports.
2. Add a focused dark/light test that compares content and table relationships and asserts at least
   one paired computed token-driven colour differs across the shadow boundary.
3. Rerun the exact Chromium and Firefox component specs plus the Storybook axe gate.

### 2. HIGH — Magnitude cells are not connected to route totals, and group bodies are not labelled by their visible heading

`packages/elements/src/transition-matrix/sk-transition-matrix.ts:227-234` gives each magnitude cell
only route/column `headers`; it creates no id for the route total and no `aria-describedby`
connection from the magnitude to that total. Lines 246-247 duplicate group text into a `tbody`
`aria-label`, but the visible group heading has no id and the body is not `aria-labelledby` by that
heading. The plan requires both relationships at `plan.md:193-199`, and T007 steps 4-5 require
route-total descriptions and labelled groups.

The current tests are vacuous for these requirements: `fixtures/elements-behaviour/src/sk-transition-matrix.test.ts:200-217`
only counts `td[headers]`, while lines 219-245 only prove that the ids already present in `headers`
resolve. They stay green when both missing relationships are absent.

Remediation:

1. Give each derived route-total cell a component-owned id and connect every magnitude cell in that
   route to it through the planned accessible description without weakening route/column headers.
2. Give each visible group heading a component-owned id and label its contiguous `tbody` with that
   heading.
3. Assert the exact relationships in the real element DOM, including uniqueness and resolution
   across multiple component instances, then record the required named header/group source-break red
   and restored green evidence.

### 3. HIGH — The mandatory NI-09 command has no matching test and zero interaction residue is not proved

The acceptance-matrix command

```sh
npx playwright test apps/storybook/src/tests/sk-transition-matrix.spec.ts --grep 'non-selectable.*zero interaction residue'
```

exits 1 with `Error: No tests found`. The closest test is named `non-selectable selected data is the
disabled-interaction analogue` at `apps/storybook/src/tests/sk-transition-matrix.spec.ts:96-108`.
It checks hover background/border, tab stops, prompt, and cursor only. It does not use real
pointer-down plus Enter/Space input and prove zero events, zero pressed state, no focus acquisition,
and no focus/active style delta. A separate browser-fixture test checks click/Enter/Space and event
count, but the deterministic NI-09 command cannot select it and no one test proves the full invariant.

Remediation:

1. Add or rename the Playwright test so the exact NI-09 command selects a non-empty test.
2. In that selected test, exercise the non-selectable selected row with real pointer, focus, Enter,
   and Space input and prove every NI-09 absence: tab stop, hint, event, hover/focus/active delta,
   pressed marker/treatment, and pointer cursor.
3. Run the exact NI-09 command and require a green test count, then mutation-break the absence guard
   and record the intended named red/restoration/green evidence.

### 4. HIGH — Required non-registry red-first evidence is asserted but not recorded

T006 requires each non-registry acceptance source break to record its command, exact source
before/after, intended named failing test, red output, restoration SHA/diff, and green rerun
(`WP02-complete-controlled-transition-matrix-and-release-evidence.md:336-342`). T010 imposes the
same explicit record for the 50-WP and hover/focus/pressed mutations at lines 592-624. FR-021 and
NFR-009 make those durable records acceptance requirements.

The only record is the one-line activity claim at
`WP02-complete-controlled-transition-matrix-and-release-evidence.md:840`: it says manual
reds/restores proved the behaviours, but supplies no commands, exact mutations, failing outputs,
restoration SHA/diffs, or per-arm green reruns. The registered mutation harness is healthy—this
review independently observed all 62 registered mutations produce their named red—but it does not
substitute for the separately required totals, ratio/max, validation, legend, controlled-selection,
non-selectable, header/group, 50-WP, selectable-state, and sticky-owner records.

Remediation:

1. Persist the complete per-arm evidence required by T006/T010 for every non-registry behavior,
   including exact command, source anchor before/after, named red assertion/output, byte-for-byte or
   SHA/diff restoration proof, and green rerun.
2. Ensure the repaired theme, semantic-table, and NI-09 tests are included in the corresponding
   source-break evidence.
3. Record evidence through the governed WP workflow; do not hand-edit status/event logs.

## WP anti-pattern checklist

1. **Dead code — PASS.** The element is registered and exported through the package entry points;
   its generated CEM/CSS/React/index/size outputs and stories have live production/build consumers.
2. **Synthetic-fixture test — PASS.** Focused behavior tests mount the real package element and the
   Playwright tests exercise built Storybook stories, not a local implementation copy.
3. **Silent empty return — PASS.** `validateMatrix()`'s null result is the specified fail-closed
   invalid/empty state; no caught exception is silently converted to empty success.
4. **FR coverage — FAIL.** Findings 1-4 leave NFR-005/SC-011, T007 accessibility relationships,
   NI-09/NFR-002, and FR-021/NFR-009 incomplete.
5. **Frozen surface — PASS.** No package/lock/token/ADR/sibling authored component source changed;
   the prohibited legacy `fixtures/react-consumer/src/wrappers.test.tsx` is byte-identical.
6. **Locked decisions — PASS.** The public surface remains seven properties/five attributes/two
   property-only arrays, selection is controlled, and the event is bubbling/composed/non-cancelable
   with no inventory/current-total input or cancellation path.
7. **Shared-file ownership — PASS with coordination.** Generated and registry overlaps follow the
   amended serial WP02/WP03 contract; WP03 remains untouched and planned.
8. **Production fragility — PASS.** New failure behavior is deterministic input validation or
   build/test fail-loud handling, not a transient runtime dependency.

## Independent verification at the reviewed SHA

Green:

- focused browser behavior: 28/28
- component Playwright: Chromium 10/10; Firefox 10/10
- full Vitest: 16 files, 179/179; both suite-floor lanes non-empty
- main mutation harness: baseline 150; all 62 registered mutations produced their named red with a
  green baseline in 194.8 seconds (360-second ceiling)
- Storybook build; axe 127/127 rendered stories with zero WCAG 2.1 AA violations
- typecheck (4 projects), quality, token/CSS/entry/manifest/part/theme/gate/size checks and their
  applicable selftests; generated React check and 25-probe selftest; build of tokens/styles/elements
- exactly nine transition-matrix stories, ten public parts, seven public properties, five
  attributes, two property-only arrays, and the generated typed event surface
- `git diff --check`; no tracked or staged lane drift

Red or explicitly deferred:

- NI-09 exact command: exit 1, `Error: No tests found` — blocking finding 3
- WebKit component run: exit 1 only because local `libgtk-4-1`, `libicu74`, `libjpeg-turbo8`, and
  `gstreamer1.0-libav` are unavailable; under reconciliation commit `baf0e3e`, this remains a named
  final-CI obligation and is not treated as a local pass or as a WP02 blocker
- local guard-selftest guard-4 hang and the nine CI-authoritative visual baseline bytes remain the
  documented post-WP03/final-CI handoff; neither is reported green here

Fresh diagnostic screenshots were written only under `/tmp`. The approved dark component is
nonblank and visually close to clean-v4: exact 6x4/62 fixture, totals, five tone colours, group,
legend, copy, proportional bars, and no adjacent Current/open-WPs panel. The narrow view scrolls
horizontally with sticky route ownership as specified. This diagnostic is not baseline approval.
