// The package entry point: one line per component directory THAT HAS an `index.ts`.
// `export *` rather than a named list, which is the whole point.
//
// The exact directory/export COUNT is deliberately not stated here — this comment's own
// history is two prior lenses catching a stale count (it once undercounted CSS-only
// directories by one, naming only `form-input`/`form-textarea` when `transition-matrix` is
// also CSS-only). A number that must be hand-recomputed every time a directory is added is
// exactly the kind of drift this file already exists to close the OTHER half of. The set of
// CSS-only directories (no `index.ts`, so no line below) is derived by
// `scripts/build-styles-only-markup.mjs`'s own `stylesOnly()` logic — read that script for
// the current, authoritative list rather than trusting a number here.
//
// This file used to name every export by hand — 13 statements, 60 names, becoming 62 here
// (gaining exactly `SkGridGap4HTML` and `SkButtonLinkHTML`; nothing was lost). An earlier
// revision of this comment said "twelve blocks, 61 names", which was wrong on both counts —
// a stale hand count inside the comment whose entire subject is hand counts going stale. Two
// lenses called it. Each per-component
// `index.ts` is GENERATED from that component's markup module, and nothing regenerated or
// checked this file: `build-element-markup.mjs --check` compares only the per-component
// `sk-<c>.html` and `index.ts`, and no script referenced this path at all. So adding a variant
// regenerated the component barrel with `--check` green while the published entry point
// silently omitted the new export.
//
// That was not hypothetical. When a lens found this, `SkGridGap4HTML` — emitted by
// `grid/index.ts` ever since #77 derived GRID_AXES from GRID_GAPS — was already missing here,
// and every gate was green. `export *` removes the per-NAME half of the drift by construction:
// a new export in a component barrel now reaches the entry point automatically. The per-DIRECTORY
// half is NOT closed — the list below is still hand-maintained, so a component that gains its
// first `index.ts` is silently omitted until someone adds a line. That is what #156's gate must
// assert, and saying "by construction" next to "the gate is filed" overstated it.
//
// One more asymmetry worth knowing: `export *` closes drift only in the ADD direction. A name
// DISAPPEARING from a component barrel now leaves the entry point silently, where the explicit
// list would have failed to compile. Also #156.
//
// Safe because every per-component barrel exports only `Sk*HTML` consts, verified collision-free
// across all of them.
export * from './blog-card/index';
export * from './breadcrumbs/index';
export * from './button/index';
export * from './card/index';
export * from './check-bullet/index';
export * from './data-table/index';
export * from './disclosure/index';
export * from './empty-state/index';
export * from './event-timeline/index';
export * from './facts/index';
export * from './feature-card/index';
export * from './form-field/index';
export * from './form-select/index';
export * from './grid/index';
export * from './nav-pill/index';
export * from './pill-tag/index';
export * from './progress/index';
export * from './prose/index';
export * from './ribbon-card/index';
export * from './section-banner/index';
export * from './site-footer/index';
export * from './skip-link/index';
export * from './stub/index';
export * from './workflow-board/index';
export * from './workflow-lane/index';
