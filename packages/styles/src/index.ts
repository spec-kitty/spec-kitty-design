// The package entry point. ONE LINE PER COMPONENT DIRECTORY, and `export *` rather than a named
// list, which is the whole point.
//
// This file used to name every export by hand — twelve blocks, 61 names. Each per-component
// `index.ts` is GENERATED from that component's markup module, and nothing regenerated or
// checked this file: `build-element-markup.mjs --check` compares only the per-component
// `sk-<c>.html` and `index.ts`, and no script referenced this path at all. So adding a variant
// regenerated the component barrel with `--check` green while the published entry point
// silently omitted the new export.
//
// That was not hypothetical. When a lens found this, `SkGridGap4HTML` — emitted by
// `grid/index.ts` ever since #77 derived GRID_AXES from GRID_GAPS — was already missing here,
// and every gate was green. `export *` removes the class by construction; the gate that keeps
// it closed is filed as #156.
//
// Safe because every per-component barrel exports only `Sk*HTML` consts, verified collision-free
// across all of them.
export * from './blog-card/index';
export * from './button/index';
export * from './card/index';
export * from './check-bullet/index';
export * from './feature-card/index';
export * from './form-field/index';
export * from './grid/index';
export * from './nav-pill/index';
export * from './pill-tag/index';
export * from './ribbon-card/index';
export * from './section-banner/index';
export * from './site-footer/index';
export * from './stub/index';
