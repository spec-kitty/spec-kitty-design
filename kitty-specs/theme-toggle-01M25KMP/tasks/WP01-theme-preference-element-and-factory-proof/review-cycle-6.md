---
affected_files: []
cycle_number: 6
mission_slug: theme-toggle-01M25KMP
reproduction_command:
reviewed_at: '2026-09-10T19:39:27Z'
reviewer_agent: codex
wp_id: WP01
---

# Pre-accept adversarial review — pass 4

- Reviewed head: `61d2a5f150900517454262c79fc59083d4c3d0bb`
- Base: `7032cf7792a83ee20d9fd70ddcfb28a057c72884`
- Independent read-only Codex lenses: `architect-alphonso`, `debugger-debbie`,
  `designer-dagmar`, and Randy Reducer
- Verdict: **reject**
- High: 0
- Medium: 3

## Medium 1 — listenerless media-query result throws

The plan requires System mode to tolerate absent listener APIs. `SkThemeToggle.#startListening`
instead falls through from a missing modern `addEventListener` to an unconditional legacy
`addListener`; cleanup similarly assumes `removeListener`. Independent Chromium probes with a
valid `{ matches: false }` media-query result but neither listener API rejected `updateComplete`
and emitted an uncaught `addListener is not a function` error.

Required disposition: feature-detect complete modern and legacy add/remove pairs, record the
installed mechanism only after successful installation, and treat a listenerless result as a
static System source. Add red-first browser lifecycle coverage and the applicable ADR-11 behavior
registration/mutation so this boundary cannot silently regress.

## Medium 2 — generated manifest publishes a nonexistent story helper

The Custom Elements Manifest analyzer includes `theme-story-environment.ts`, then rewrites its
module path to `./dist/index.js`. The generated manifest therefore declares `isolateThemeStory`
and helper-local variables as public while neither the authored package barrel nor the built root
module exports the helper. TypeScript also emits a declaration for the story-only module without
corresponding JavaScript.

Required disposition: keep the helper internal by excluding or relocating it through authoritative
generator/build configuration, regenerate all derived surfaces, and add a negative/public-parity
probe that fails if story-only helpers enter the manifest or an advertised JS export does not
exist. Do not expose the helper publicly as a workaround.

## Medium 3 — 200% zoom evidence proves only device density

The current narrow proof and the story labelled Zoom200 both retain a 390 CSS-pixel viewport; the
latter only adds `deviceScaleFactor: 2`. Independent comparison showed identical CSS viewport,
`visualViewport.scale === 1`, and identical element bounds. That is a HiDPI/raster-density check,
not browser zoom, so it does not satisfy FR-010/SC-005 or the repository's headed-Chrome UI-zoom
precedent.

Required disposition: capture genuine 100%/200% browser-zoom evidence on the exact product tree,
showing the effective CSS viewport reduction while physical window size remains fixed. Verify all
three choices, visible keyboard focus, selection/root state, containment, and no overlap/clipping;
record screenshots/metrics and independent visual inspection. Retain or relabel the DPR test only
as supplemental HiDPI evidence.

## Verified closures and lows

- The shared resolver/bootstrap contract, SSR boundary, root resolution, storage failure paths,
  modern/legacy listener paths, overlapping story cleanup, native three-state semantics,
  keyboard operation, forced colors, exact luminance/AA contrast, no-JS behavior, generic Factory
  boundary, and #93/#14 scope all remain otherwise green.
- The bounded axe retry correctly rethrows non-sentinel and exhausted errors and preserves the
  exact empty-violations assertion.
- Low/deferred: consolidate repeated axe helpers and repeated theme literals only in a separate
  characterized refactor; preserve independent black-box test literals. The generated Op catalog
  recommendation names Claude despite Codex transport, but no Claude tool or seat was invoked and
  generated state must not be hand-edited.
