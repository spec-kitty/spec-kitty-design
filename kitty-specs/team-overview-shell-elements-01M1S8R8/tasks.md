# Tasks: Team overview shell elements

**Mission:** `team-overview-shell-elements-01M1S8R8`
**Planning and merge target:** `mission/team-overview-shell-elements`
**PR target after mission consolidation:** `train/elements-first` with `Refs #145`

This mission uses one strict serial dependency chain. Spec Kitty may materialize one lane per WP;
the four packages are independently reviewable, but
their approved results are consolidated by Spec Kitty before one final PR. Do not open a partial
WP PR, rebase or rewrite the lane after execution starts, merge to `main`, publish or deploy.

## Subtask index

| ID | Work | WP |
|---|---|---|
| T001 | Add failing app-shell and personal-rail behavior probes | WP01 |
| T002 | Add the two shell-width tokens and generate their catalogue | WP01 |
| T003 | Implement and locally generate `sk-app-shell` | WP01 |
| T004 | Implement and locally generate `sk-personal-rail` | WP01 |
| T005 | Run focused WP01 checks and record exact evidence | WP01 |
| T006 | Add failing context-sidebar and page-header behavior probes | WP02 |
| T007 | Implement and locally generate `sk-context-sidebar` | WP02 |
| T008 | Implement and locally generate `sk-page-header` | WP02 |
| T009 | Run focused WP02 checks and record exact evidence | WP02 |
| T010 | Add direct failing icon-button accessibility, focus and geometry probes | WP03 |
| T011 | Implement the narrow existing-button extension and regenerate local derivatives | WP03 |
| T012 | Run focused #79 compatibility and WP03 checks | WP03 |
| T013 | Integrate public entries, exports and exact ratchets | WP04 |
| T014 | Register and kill all 15 new SC-010/SC-013/SC-014 mutation arms | WP04 |
| T015 | Regenerate CEM, React, Vue and size artifacts in canonical order | WP04 |
| T016 | Add docs, Storybook layout/axe evidence and executable local visual diagnostics | WP04 |
| T017 | Run the complete aggregate-lane gate and prepare the clean WP04 handoff | WP04 |

## Work packages

### WP01 — Shell geometry and personal rail

Build the two foundation elements and their semantic width tokens. The independent review proves
slot order, landmark naming, bottom identity grouping, responsive reachability and adopted-style
identity without touching shared entries or registries.

- **Dependencies:** none
- **Requirements:** FR-001–FR-006, FR-011, FR-015; NFR-002–NFR-005; C-001–C-006
- **Independent test:** focused fixture tests prove 56px/240px token-backed shell columns, stable
  slot order, all documented parts, a labelled personal navigation landmark, one consumer-owned
  account location, native event pass-through, narrow reflow and exact stylesheet identity.
- **Prompt:** [WP01-shell-geometry-and-personal-rail.md](tasks/WP01-shell-geometry-and-personal-rail.md)

### WP02 — Context sidebar and page header

Build the remaining slot-only elements on WP01's composition contract. The independent review
proves the labelled complementary region, accessible truncation, consumer heading preservation,
verbatim sync copy and width-safe metadata reflow.

- **Dependencies:** WP01
- **Requirements:** FR-007–FR-011, FR-015; NFR-001–NFR-005; C-001–C-007
- **Independent test:** focused fixture tests prove all slots/parts and landmarks, preserve a long
  supplied accessible label, keep a supplied heading level, perform no clock work and keep actions
  reachable in narrow layout.
- **Prompt:** [WP02-context-sidebar-and-page-header.md](tasks/WP02-context-sidebar-and-page-header.md)

### WP03 — Accessible icon-size button extension

Extend only the landed #79 button seam. The independent review covers both native branches,
computed accessible naming, host focus delegation, square geometry and every existing button path.

- **Dependencies:** WP02 (serial-lane ordering only; implementation depends directly on landed #79)
- **Requirements:** FR-012–FR-014, FR-016–FR-017; NFR-001, NFR-002, NFR-004; C-001–C-006
- **Independent test:** direct red-first probes demonstrate a 40px named inner `BUTTON` and `A`,
  missing/blank-label policy, host-to-control focus, focus-visible styling, consumer glyph
  projection and unchanged tone/small/disabled/static behavior.
- **Prompt:** [WP03-accessible-icon-button-extension.md](tasks/WP03-accessible-icon-button-extension.md)

### WP04 — Generated integration and exact gate closure

Own every shared registry, entry, generated aggregate, documentation and end-to-end evidence file.
This package makes the four independently reviewed additions one aggregate lane state and is the
only package allowed to edit collision-prone shared artifacts. Latest-train refresh, consolidation
and exact-PR gates remain mission wrap-up work after WP04 approval.

- **Dependencies:** WP01, WP02, WP03
- **Requirements:** FR-001–FR-017; NFR-001–NFR-008; C-001–C-010
- **Independent test:** stable generated outputs regenerate byte-identically; all 15 new
  SC-010/SC-013/SC-014 arms
  are killed only by their named tests; Storybook layout checks pass at 390/414/1280/1440px; axe,
  full-browser, static, type, security, release and offline gates pass on a clean exact SHA. New
  visual cases reach non-empty targets locally; CI-authoritative PNG approval remains wrap-up work.
  Final exact-head acceptance evidence is recorded externally under the SK-178 waiver so a tracked
  acceptance auto-commit cannot invalidate the SHA it claims to certify.
- **Prompt:** [WP04-generated-integration-and-gate-closure.md](tasks/WP04-generated-integration-and-gate-closure.md)

## Dependency graph

```text
WP01 shell + personal rail
  -> WP02 context sidebar + page header
      -> WP03 existing button extension
          -> WP04 shared generation + full gate
```

There are no parallel claims and no overlapping authored-file owners. `packages/styles/src/index.ts`
remains unchanged because the four new slot-only elements have no meaningful static form.
