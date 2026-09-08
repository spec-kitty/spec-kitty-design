# WP01 Randy correction — cycle 8 disposition

**Rejected SHA:** `5afbec3f16dcb424ee4cbd0c72676935df64fab4`

**Correction checkpoint:** `59ff6df3f6363561ade0649428f2899d7f138fd4`

**Disposition:** both substantive Randy findings are addressed by one bounded child commit; this
record does not approve the correction checkpoint.

## Exact corrections

### Unknown-presentation warning history

- Removed private `#lastUnknownPresentation` state and its assignment/reset bookkeeping.
- Used Lit's `changed.get('presentation')` as the previous committed presentation.
- Preserved the existing public converter, reflected attribute/property behavior, warning text, and
  unknown-value fail-open legacy layout.
- Strengthened the authored test so identical assignment without a real Lit transition does not
  duplicate-warn, different invalid values warn, and returning through valid or omitted state then
  to invalid warns again.

### Genuine short/tall Storybook viewports

- Removed the story helper's fake inner height argument and its inline `height`/`overflow` styles.
- Added source-local custom viewport options for exact `390px` x `320px` and `390px` x `900px`
  sizes.
- Bound `CompactShortViewport` and `CompactTallViewport` with
  `globals: { viewport: { value, isRotated: false } }` and
  `parameters: { viewport: { options } }`, matching the installed Storybook 10.6.0 type contract.
- Preserved the two existing story IDs and replaced duplicated short-height coverage with a matrix
  that consumes each ID at its real page viewport. It proves page/frame/shell dimensions, absence
  of fake inline height/overflow, horizontal containment, and short-only internal drawer scrolling.

The generated CEM removes only the deleted private field. `SIZES.md` is the Node 24.20.0-derived
ledger for the smaller element source; a fresh no-cache build and check mode proved it is current,
so recovery added no derived correction.

## Red and green results

- **Warning red:** with only a temporary reset-history mutant applied, the strengthened focused
  Vitest run completed **1 failed / 29 skipped**; the mutant was restored before the production
  fix.
- **Viewport red:** the correct isolated pre-fix Storybook build completed the two-story Chromium
  run with **2 failed**, receiving fake inline heights `320px` and `900px` instead of the required
  empty values. The first default-port story-lookup failure is infrastructure evidence only and is
  deliberately not claimed as semantic red-first.
- **Prior green:** focused authored Vitest **33/33**; exact two-story Chromium/Firefox **4/4**;
  complete focused app-shell Chromium/Firefox **48/48**; Storybook build 8.43 seconds; expected
  stories **334/334** and axe **443/443** with zero WCAG 2.1 AA violations; mutation selftest
  baseline **471/471**, **128** registry pairs, and **10/10** guard probes.
- **Recovery green on checkpoint HEAD:** `git diff 5afbec3...HEAD --check`; focused warning Vitest
  **1 passed / 29 skipped**; deterministic uncached CEM twice with no tracked drift and no
  `#lastUnknownPresentation`; Node 24.20.0 no-cache elements build plus exact `SIZES.md` check;
  built Storybook index IDs and emitted module metadata for both viewport stories.

## Scope and mutation decision

The checkpoint changes only the two reviewed seams, their focused authored tests, and the CEM/size
outputs derived from the element source. No mission contract, public API, converter, CSS, consumer
ownership, unrelated snapshot, registry, or application behavior changes.

Behavior/mutation metadata remains unchanged because the runtime correction deletes a redundant
branch rather than adding behavior, and the Storybook viewport configuration is non-behavioral
metadata. The authored warning-transition and real-viewport tests retain the behavior envelope; no
static-story mutation arm or new ADR-11 classification is warranted.

## Remaining gate

This evidence is not self-approval. The orchestrator must run a fresh exact-successor-SHA full gate
and obtain all four independent Codex lens reports against that unchanged SHA. Any later tip change
invalidates those pinned results. Integration, acceptance, merge, GitHub updates, and remote
operations remain outside this disposition.
