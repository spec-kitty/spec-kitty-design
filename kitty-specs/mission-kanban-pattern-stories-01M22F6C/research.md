# Research: Mission Kanban K1–K6 pattern stories

**Mission:** `mission-kanban-pattern-stories-01M22F6C`  
**Binding issue:** [#278](https://github.com/spec-kitty/spec-kitty-design/issues/278), child of
[#276](https://github.com/spec-kitty/spec-kitty-design/issues/276)  
**Research date:** 2026-09-09  
**Train inspected:** `train/elements-first@fb424e83c827a586038d7a2a977b946b193192fb`  
**Application evidence pin:** Team Kitty `main@29f62da0c40edc74e37803923598d2150dce9697`

Evidence is registered in
[`kitty-specs/mission-kanban-pattern-stories-01M22F6C/research/source-register.csv`](./research/source-register.csv).
Individual findings are cross-referenced by `E-*` identifiers in
[`kitty-specs/mission-kanban-pattern-stories-01M22F6C/research/evidence-log.csv`](./research/evidence-log.csv).

## Research question and scope

How can #278 reproduce the approved Mission Kanban K1–K6 family with the current public design
system while keeping every Team Kitty behavior and data decision consumer-owned?

The answer is a Storybook-only pattern composition: one deeply immutable display fixture, pure
validation/projection/render helpers, public element and styles-layer surfaces, pattern-local
token-based layout, focused browser/accessibility tests, and explicit visual baselines. It does
not publish or register `sk-mission-kanban`, add a package export, or add application behavior.
[E-001, E-002, E-020]

This research is limited to #276–#278. Work Package Detail and Repository Ops Timeline remain
outside this mission; no artifact, source, or public contract from those adjacent programmes is
absorbed. [E-001]

## Executive conclusion

Proceed without a new ADR and without a new public component. Add one excluded Storybook module
under `packages/elements/src/patterns/`, following the existing Work Package Views and Team
Overview pattern precedent. Keep the domain fixture inside the `*.stories.ts` module because
`packages/elements/tsconfig.lib.json` excludes stories from the published build; an ordinary
helper module in that directory would be emitted as library output. Export fixture and pure
helpers only for direct test import, and list them in CSF `excludeStories`. [E-020, E-021]

The train already contains every required public seam:

- `sk-app-shell[presentation="compact"]` for the desktop/compact shell and consumer-owned drawer;
- existing personal/context navigation, page-header, breadcrumbs, nav/status surfaces;
- native `.sk-disclosure` plus `.sk-checkbox-choice-group` for the ten detailed filters;
- `.sk-workflow-board` / `.sk-workflow-lane` over native named sections and ordered lists;
- `sk-action-row layout="card" href="..."` for a real native-link card, with independent
  tracker controls outside the primary link;
- `sk-notice` for the snapshot-behind-log message;
- `.sk-empty-state--inline` for honest empty lanes; and
- `sk-status-indicator`/the action-row supporting slot for supplied exact-lane and observed
  activity labels. [E-012, E-013, E-014, E-015, E-016, E-017]

No token, component, wrapper, manifest entry, or public API is needed. Pattern-local CSS may place
these public surfaces but must use authoritative `--sk-*` tokens for design values and must pass
`scripts/check-pattern-composition.mjs`: no private-root access, copied owned classes, unscoped
element restyling, or runtime CSS injection. [E-018, E-019, E-020]

## Authority and conflict resolution

Evidence is applied in this order:

1. Live #278 is the binding feature contract: exact K1–K6 states, one immutable fixture, public
   composition, semantics, tests, ownership boundaries, and non-goals.
2. Live epic #276 fixes the programme seam: Team Kitty owns lanes, reduction/filtering inputs,
   URLs, counts, snapshots, observations, and claims; the library owns presentation and evidence.
3. The durable UX workbench at
   `/home/jeroennouws/dev/team-kitty-missions/ux_redesign/mission-kanban` is the approved visual and
   content authority. Its capability map bounds what the application supplies; its HTML and PNGs
   supply exact fixture content and visual hierarchy.
4. Team Kitty source at `29f62da` is used only to verify the existing five-stage reduction. It
   confirms `planned`, `claimed`, `in_progress`, `for_review`, `in_review`, `approved`, `done`,
   `blocked`, and `canceled`; the UX evidence adds `genesis` to the ten-lane filter fixture.
5. Accepted ADR-9/10/11, the charter, and the current authoring recipe govern public styling,
   native semantics, story-only distribution, and non-vacuous browser/visual verification.
6. Merged predecessor issues and current source define their public contracts. The current source
   wins over old screenshots where the contract has subsequently become stricter.

One material conflict is resolved explicitly: the approved desktop HTML puts the accessible
region/name/tabindex triad on every board, but #278 and the current #209 board contract require it
only when the rendered board genuinely overflows. Therefore K2 (and any measured overflowing
long/zoom state) carries the triad; a fitting desktop K1 omits it. This preserves the visual intent
while avoiding a dead tab stop. [E-009, E-012]

## Verified state model

The application renderer at `29f62da` declares five columns in this order:
`planned`, `doing`, `for_review`, `approved`, `done`. Its exact mapping is:

| Detailed committed lane | Rendered stage |
|---|---|
| `planned` | Planned |
| `claimed` | Doing |
| `in_progress` | Doing |
| `for_review` | For review |
| `in_review` | For review |
| `approved` | Approved |
| `done` | Done |
| `blocked` | Planned |
| `canceled` | Done |

The K1 fixture adds `genesis` with count zero. Because there is no committed Genesis card in the
approved family, no new application mapping is needed to render K1–K6. The story fixture may
record its filter option without claiming a projected stage for an absent card. A guard must reject
any non-empty work-package lane without an explicit stage mapping. [E-003, E-004, E-010]

The fifteen approved Work Packages produce detailed counts
`0,2,1,3,2,1,1,4,1,0` in the order Genesis, Planned, Claimed, In progress, For review, In review,
Approved, Done, Blocked, Canceled. The projected stage counts are Planned 3, Doing 4, For review
3, Approved 1, Done 4. K3 selects only `in_review` and `blocked`, so its fixed story projection is
two Work Packages in two rendered stages: WP10 under For review and WP05 under Planned. [E-004,
E-006]

## Decisions and rationale

### R-01 — One story-only pattern module; no product artifact

**Decision.** Author `packages/elements/src/patterns/mission-kanban.stories.ts` with types, one
deeply frozen root fixture, pure guards/projections, render helpers, and user-facing stories. Add
focused tests under `apps/storybook/src/tests/` and visual cases to the established visual suite.
Do not export the module from `packages/elements/src/index.ts`, create a matching element folder,
or modify the manifest/React/Vue/public package surface. [E-001, E-020, E-021]

**Why.** #278 says pattern stories and explicitly rejects a published page element. The existing
pattern modules prove that exported test seams can remain inside a CSF file excluded from package
compilation. This is also the smallest boundary on Team Kitty-shaped fixture data. [E-020]

### R-02 — One immutable fixture with exact supplied claims

**Decision.** The root fixture records stage definitions, ten detailed lane options, fifteen
Work Packages, route strings, mission/repository labels, one commit/branch context, snapshot copy,
one observed overlay, and the reported-live panel rows. Freeze every nested object/array and expose
only `DeepReadonly` inputs. All counts and displayed subsets are pure projections used by the
stories and tests, never mutable state or a published engine. [E-003, E-004, E-005, E-007]

**Why.** A single source is the only way to demonstrate that the exact committed lane remains on
each card while the board reduces to five scan stages. It also prevents K4 from inventing a second
commit and K5 from moving WP03 to its observed target lane. [E-007, E-008]

**Guard invariants.** Reject duplicate IDs, duplicate stage order, unknown non-empty lane mappings,
inconsistent explicit route ownership, a selected filter not in the ten-lane set, or a Work Package
appearing in more than one stage. Assert fixture immutability before and after every render.

### R-03 — K1/K2 preserve five-stage geometry and exact native semantics

**Decision.** Render the board with native `<section aria-labelledby>` lanes, headings, and direct
`<ol>/<li>` relationships. K1 shows all five stages in source order and the exact 15-card counts.
K2 renders the same data inside the compact shell at 390 CSS px; the board scroller alone owns the
horizontal overflow, is named/focusable because it genuinely overflows, and exposes one full lane
plus a glimpse of the next. The document itself must not scroll horizontally. [E-005, E-009,
E-012, E-013]

**Why.** #209 and ADR-10 preserve native section/list relationships. `sk-app-shell` already owns
the below-860 compact seam; duplicating a breakpoint or shell would create a second contract.
[E-012, E-016]

### R-04 — K3 is a fixed controlled story, not a filtering feature

**Decision.** Compose `<details class="sk-disclosure" open>` around a real fieldset/legend and ten
label/input checkbox choices using `.sk-checkbox-choice-group`. Mark `in_review` and `blocked`
checked from the fixture. Render separate existing Apply and Clear controls, with Storybook spies
or inert story callbacks only. The fixed K3 render helper projects the two selected lanes from the
same fixture; it does not react to checkbox changes, maintain query parameters, or persist state.
[E-006, E-014]

**Why.** #277 owns presentation and browser-native checkbox behavior while consumers own checked
state, counts, filtering, Apply/Clear, persistence, and query parameters. #278 requires the
approved state, not a filtering engine. [E-014]

### R-05 — Every card is a real route and carries only supplied facts

**Decision.** Each Work Package `<li>` contains `sk-action-row` in `layout="card"` and native-route
mode via a non-blank fixture `href`. Use the WP id as the primary link name; show the exact
committed lane and supplied agent profile; expose supplied tracker references as independent
controls outside the primary anchor. Do not set `selectable` or listen for
`sk-action-row-activate`. [E-004, E-015]

**Why.** Team Kitty supplies WP id/link, committed lane, profile presentation, and tracker refs but
does not supply human title, owner, reason, estimate, priority, or percentage. #272 is landed and
route mode is a real anchor that preserves native Enter/modified-click/context-menu behavior and
emits no custom activation event. [E-003, E-015]

### R-06 — K4/K5 maintain separate truth tiers

**Decision.** K4 inserts one attention `sk-notice` beside the same commit context used by K1; its
message says the saved status summary and mission history disagree at this same commit. It does
not render another SHA or calculate freshness. K5 keeps WP03's committed `in_progress` label and
Doing-stage placement, then adds the supplied `lynn → for_review, not yet pushed` observation in
the action-row supporting slot with an explicit Observed label. The reported-live panel remains a
separate labelled section. [E-007, E-008, E-017]

**Why.** Snapshot mismatch, observed activity, and reported-live presence are different evidence
classes in the approved decision report. Combining them would make an unpushed observation look
committed. No clock, polling, stale threshold, comparison algorithm, or state mutation belongs in
this library fixture. [E-003, E-008]

### R-07 — K6 keeps five honest empty stages

**Decision.** Derive K6 from the same root fixture with an empty Work Package input. Retain all
five named stage sections, each with count zero, an empty ordered list, and sibling
`.sk-empty-state--inline` copy: “No work packages in this stage.” The reported-live region uses the
approved “No live activity reported.” copy. Add no action or CTA. [E-009, E-013]

### R-08 — Pattern layout uses public seams and tokens only

**Decision.** Inline pattern-local placement CSS may style only `.sk-mission-kanban-pattern*`
classes and scoped native descendants. It must use `--sk-*` tokens for colour, spacing, sizing,
motion, shadow, and typography. It must not select owned library classes in CSS, reach a shadow
root, use an unscoped `sk-*` selector, inject CSS at runtime, or duplicate component styles.
[E-018, E-019]

**Why.** ADR-9 limits component customization to tokens/parts/documented properties. The
repository's pattern-composition gate specifically covers the story directory and fails these
forms. Public library classes are used in markup, not reimplemented in pattern CSS. [E-018]

### R-09 — Separately addressable stories and non-vacuous verification

**Decision.** Ratchet the six named K stories plus explicit `LightMode`, long-content,
forced-colors, and reduced-motion evidence stories. The last four may reuse K1/K2/K5 fixture
projections; they remain separately addressable so axe and visual/test gates cannot silently lose
them. The LightMode root must use `class="sk-light"`. [E-019, E-021, E-022]

**Required checks.** Add direct fixture/projection tests; a built-Storybook Playwright suite for
native structure, exact lane/stage/card order and counts, route roles/destinations, disclosure and
checkbox keyboard behavior, conditional scroller semantics, tab/focus containment, K4/K5 truth
tier separation, empty lanes, long labels, 390px layout, calibrated 200% zoom, forced colors,
reduced motion, and accessibility snapshots; axe with zero violations for every ratcheted story;
and targeted K1–K6/theme/forced-colors visual baselines. Run the repository lint/type/build/story
ratchets and ensure every legacy baseline remains unchanged. [E-009, E-011, E-021, E-022]

## Story matrix for planning

| Story | Fixture projection | Load-bearing proof |
|---|---|---|
| K1 populated desktop dark | all 15 WPs | five stages; 3/4/3/1/4; exact committed lane on every native-link card |
| K2 populated narrow dark | K1 at 390px compact shell | local board overflow; named/focusable scroller; no document overflow |
| K3 detailed filters dark | `in_review` + `blocked` | ten native checkboxes; two checked; 2/15; separate Apply/Clear; WP05/WP10 only |
| K4 snapshot behind log | K1 + snapshot record | one attention notice alongside the unchanged commit context |
| K5 observed overlay | K1 + WP03 observation | WP03 remains Doing/`in_progress`; observation is supporting content, not committed state |
| K6 empty board | no WPs | five zero-count lanes, empty lists, honest empty copy, no CTA |
| LightMode | K1 with `.sk-light` | inherited token-theme compatibility |
| Long content | K1 with supplied long labels/routes | local wrapping; no clipped route/focus/document overflow |
| Forced colors | K4/K5 representative | boundaries, labels, route focus, notice and observed distinction survive hue remapping |
| Reduced motion | K5 representative | all content remains present and no component-owned animation is required |

## Non-goals carried into planning

No published `sk-mission-kanban`; app import; custom checkbox; filtering/query engine; router or
route construction service; timers, polling, fetch, backend adapter, or store; lane mutation,
drag/drop, claim/release, Apply/Clear behavior, snapshot comparison, freshness inference, or
progress arithmetic; and no inferred human title, blocked reason, description, owner, date,
estimate, priority, or status. #210/#211 remain read predecessors but add no progress bar or
single-select lane switch to this approved K1–K6 family. [E-001, E-003, E-016]

## Open questions and risks

1. **Visual calibration, not product ambiguity.** The exact gap/padding proportions must be tuned
   against the durable PNGs using existing tokens. No raw value may be introduced merely to match
   a screenshot.
2. **System-font baseline variance.** The immediately preceding #277 mission demonstrated stable
   cross-host `system-ui` metric differences. CI-produced Linux baselines are authoritative, but
   every promoted baseline must be visually inspected against the approved UX hierarchy.
3. **Story count is derived at implementation.** The current ratchet total is 381. Planning should
   enumerate final normalized story ids from the built Storybook index rather than treating the
   provisional ten-story matrix as an immutable count.
4. **`genesis` has no card in approved evidence.** Keep it as the required zero-count filter choice;
   do not invent a stage placement unless future supplied data requires one.

None of these requires operator input before specification or planning.
