# Tasks: Team activity truth-region pattern stories

**Input**: `spec.md`, `plan.md`, issue #382, epic #381, and the binding Family 1 handoff
**Planning base / merge target**: `train/elements-first@0a232a01a17627de6f1553ad0948b8b2f6f4f286`
**Delivery**: exactly one Work Package and one PR; never merge automatically

One cohesive package owns the excluded Storybook fixture/projection/render module, its exact
built-story contract, the story ratchet, and its visual inventory/baselines. Splitting these
surfaces would leave an unratcheted or unverified state matrix and would introduce overlapping
writes to the shared inventories.

## Subtask Index

| ID | Description | WP | Depends on | Parallel |
|---|---|---|---|---|
| T001 | Confirm exact train/public-surface/story/visual baseline and add/run the focused built-story test red against the absent Team Activity family. | WP01 | None | No |
| T002 | Author one recursively frozen consumer fixture, fail-closed truth guards, and pure frozen L1–L5/TL1/OA1/DM1 projections. | WP01 | T001 | No |
| T003 | Render L1–L5 with native region/list/time/status semantics, a dedicated bare L5 branch, public elements, and token-only pattern-local CSS. | WP01 | T002 | No |
| T004 | Render TL1 with independent repository truth boundaries, including populated, quiet, degraded, and gap states without an aggregate freshness claim. | WP01 | T003 | No |
| T005 | Render OA1 populated/retained-degraded/quiet/loading and DM1 identifier-only under the canonical observed/retention boundary. | WP01 | T003 | No |
| T006 | Add same-fixture LightMode plus narrow, intermediate, long-content, RTL, forced-colors, and reduced-motion stories and play/source invariants. | WP01 | T004–T005 | No |
| T007 | Complete focused Chromium/Firefox/WebKit semantic, fixture-guard, axe, accessibility-tree, keyboard, viewport/zoom/overflow, theme, forced-colors, and reduced-motion proof. | WP01 | T006 | No |
| T008 | Update exact story/visual ratchets, generate and inspect Chromium/Linux baselines, run the full required local gate set, prove generated/public delta zero, and prepare the exact head for independent review/PR. | WP01 | T007 | No |

No subtask is parallel-safe inside WP01: T002–T006 share one source module and T007–T008 consume
that exact built output plus shared inventories. Independent review runs on another seat after the
author's head is frozen.

## Work Packages

### WP01 — Team activity pattern and proof

- **Goal**: deliver the complete truthful L1–L5/TL1/OA1/DM1 Storybook family from immutable
  supplied data, public surfaces, native semantics, and executable resilience evidence.
- **Independent test**: all eighteen planned stories are discovered and non-empty; the focused
  three-browser suite proves truth inclusion/exclusion, semantic relationships, fixture guards,
  viewport/media resilience and zero overflow; axe and visual regression are green; no runtime
  component/public/generated surface changes.
- **Included subtasks**: T001–T008.
- **Dependencies**: closed #145/#146, #176/#178/#213, #254/#256/#264, #273/#274/#275 already
  present on the exact planning base. Open #286 constrains all copy to fixture inputs.
- **Owned files**: the Team Activity story module, its focused test, the exact story ratchet, the
  shared visual inventory, and new `team-activity-*.png` snapshots only.
- **Forbidden scope**: tokens, public barrels, custom-elements manifest, wrappers, existing
  components/styles, app integration, Team Kitty imports/logic, Mission-strip implementation,
  Topics UI, or any sibling #383 artifact.

## Requirement coverage

| Coverage | Tasks |
|---|---|
| FR-001–FR-002 pattern/immutable source | T001–T002, T008 |
| FR-003–FR-007 repository L1–L5 | T002–T003, T007 |
| FR-008 TL1 | T002, T004, T007 |
| FR-009–FR-010 OA1 | T002, T005, T007 |
| FR-011 DM1 | T002, T005, T007 |
| FR-012–FR-014 truth/copy/public boundary | T002–T008 |
| FR-015–FR-019 story, semantics, guard, resilience, visual proof | T006–T008 |
| NFR-001–NFR-007 | T002, T006–T008 |
| C-001–C-007 | all tasks, with explicit no-delta audit in T008 |

## Delivery note

The Frontend Freddy implementer owns authorship and local evidence only. A distinct reviewer owns
approval. The PR targets `train/elements-first`, references #382 and #381, and remains unmerged.
