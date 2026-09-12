# Research: Team Overview current-main pattern refresh

## Authority read

- Epic #381 and child #383, including the retirement requirement for #150.
- Family 1 programme handoff, screen matrix, TO1/TO2 prompt finales, correction rounds, and
  authority/copy/implementation review evidence.
- ADR-9, ADR-10, ADR-11 and the repository component-authoring, visual, voice, and quality rules.
- Refreshed `train/elements-first@d3263e9488f7df85a537a927d417729eacc75f12` Team Overview
  stories/tests/snapshots and landed Team Overview, Mission Reading, and Mission Kanban missions.

## Findings

1. The six current story IDs certify #150's Delivery return, Flow health, inventory, operational
   dashboard, and page-wide sync claims. They must be replaced, not extended.
2. The current public `sk-copy-field` contract accepts supplied label/success/manual/failure copy
   and emits a frozen `sk-copy-field-result` detail. The story must consume that contract and must
   not implement clipboard policy.
3. `sk-app-shell` exposes a controlled compact presentation and dismiss intent. Storybook may own
   its open state and focus return as consumer scaffolding.
4. Repository Dossier establishes a non-published adjacent fixture module plus direct tests in
   `fixtures/elements-behaviour`; no new package export is required.
5. TO1 authority supplies classified TeamMoment/repository facts. The design library may validate
   and project them, but it may not classify truth, calculate relative time, poll, or fetch.
6. TO2 authority defines exactly six response states. `role`, `privacy`, `canManage`, completed and
   current steps, commands, and routes are inputs, not inferred product policy.
7. Responsive, zoom, RTL, forced-colors, and reduced-motion evidence can reuse the six discovered
   entries through browser environment/viewport changes; duplicate product stories are unnecessary.

## Resolved delivery choices

- Keep six stable current entries: `Default`, `AlternateRetention`, `FirstRun`, `LightMode`,
  `LongContent`, and `CopyOutcomes`.
- Put all six TO2 responses behind one clearly labelled, native Storybook-only fixture selector.
- Keep activity rows non-interactive and render only safe supplied routes for the allowed locations.
- Validate immutable inputs with pure fixture projections, then test rendered semantics and public
  events against built Storybook.
