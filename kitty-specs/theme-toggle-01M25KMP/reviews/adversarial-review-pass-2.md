# Pre-accept adversarial review — pass 2

- Reviewed head: `5f5a800eb60bbf435a451904eabcd49caf7eb7bf`
- Base: `38659c7426f57c2723a9a80556dc205cc9a2be41`
- Seat: Codex / `architect-alphonso`
- Verdict: **reject**

## Findings

### Medium — global theme-state cleanup remains order-dependent

`packages/elements/src/theme-toggle/theme-story-environment.ts:54` restores each story session's
captured root `data-theme`, root `color-scheme`, and storage snapshot unconditionally. When two
theme-mutating story sessions coexist, cleaning the older session first can therefore overwrite
the active newer session, while cleaning the newer session later can restore the older session's
intermediate snapshot instead of the true document baseline.

The exact built story reproduced this failure: independently isolated Light and Dark canvases left
the Dark control connected after Light cleanup, but root/storage changed from `dark`/`dark` to
`light`/`system`; final Dark cleanup left storage at `light` instead of the original `system`.
The current sentinel regression proves control/listener ownership only, not global state ownership.

Required disposition: introduce document-global, order-independent session ownership that reapplies
the most recent remaining session and restores the true baseline only after the final session ends.
Add two-session regressions for both cleanup orders, asserting the surviving root theme,
`color-scheme`, storage, listener ownership, and final baseline. This blocks acceptance.

### Low — durable operator evidence is stale

`docs/architecture/validation/issue-323-theme-toggle/operator-log.md` still records the preceding
base, validation head, and review lane.

Disposition: accepted; refresh as part of final evidence recording.

### Low — component catalogue count is stale

`docs/design-system/using-components.md` says the catalogue contains 30 elements and omits
`sk-confirm-dialog`, while generated entries and the changelog report 31.

Disposition: accepted; correct the touched catalogue during the final evidence refresh.

### Low — existing declaration-packaging debt has one new manifestation

`packages/elements/src/index.ts` exports `skThemeToggleSheet`, while the existing elements build
does not copy generated stylesheet declaration modules into `dist`.

Disposition: deferred as pre-existing package-wide build debt. The release-graph gates remain green;
expanding issue #323 into a package-build redesign would violate its bounded scope.

