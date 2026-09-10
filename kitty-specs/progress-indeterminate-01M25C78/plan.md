# Implementation Plan: `.sk-progress--indeterminate`

**Branch**: `mission/progress-indeterminate` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/progress-indeterminate-01M25C78/spec.md`,
`research.md`, `data-model.md` (all authored earlier in this mission).

## Summary

Extend the existing styles-only `packages/styles/src/progress/` family (#210) with a
`.sk-progress--indeterminate` root-class modifier: one new CSS rule block plus an authored,
token-driven `@keyframes` animation on the existing vendor pseudo-element surface
(`::-webkit-progress-bar`/`::-webkit-progress-value`/`::-moz-progress-bar`), and five to seven new
authored `.html` fixtures whose `<progress class="sk-progress__bar">` carries no `value` attribute.
No new package, no new directory, no custom element, no shadow root, no ADR-15 dependency (measured,
not assumed — see Charter Check). The package's export wiring (`packages/styles/src/index.ts`,
`packages/styles/package.json`'s `./progress/*` subpath) already covers this directory from #210;
nothing there needs to change. One existing test file needs a scoped edit so its
value/max/percentage-consistency check continues to police only determinate fixtures. This is one
cohesive, PR-sized work package, matching #306's own "one bounded Work Package and one PR" delivery
line.

## Technical Context

**Language/Version**: CSS (authored, `--sk-*` tokens including `--sk-motion-*`) / HTML (authored
fixtures) / TypeScript (generated barrel only) — no JavaScript is introduced.
**Primary Dependencies**: `@spec-kitty/tokens` (existing surface/foreground/border/space/radius/motion
tokens only — no new token category). Storybook 10.x (`@storybook/web-components`). Playwright +
axe for accessibility-tree, reduced-motion, forced-colors, and structural assertions.
**Storage**: N/A.
**Testing**: Extends `apps/storybook/src/tests/sk-progress.spec.ts` in place (same file, new
`describe` blocks for the indeterminate stories) rather than adding a sibling file, since the
fixture-parsing helpers (`readFixtures`, `parseFixture`) are shared infrastructure this mission must
correct in place (FR-014) — splitting the indeterminate assertions into a new file while leaving the
shared helpers' bug in the old one would fix nothing. Runs through the existing, unfiltered
`playwright` CI job (three engines) plus the standing `run-axe-storybook.js`/`visual.spec.ts`
(chromium-only) gates.
**Target Platform**: Evergreen browsers via Storybook static build; Chromium/Firefox/WebKit via
Playwright's three configured projects (`playwright.config.ts`), exercised together only by the
`playwright` CI job — never locally for WebKit (this host cannot launch it).
**Project Type**: In-place extension of an existing monorepo package directory
(`packages/styles/src/progress/`); no new package, no new Nx project, no new export-map entry (the
`./progress/*` subpath and the barrel re-export already exist from #210 — confirmed by direct read of
`packages/styles/src/index.ts:57` and `packages/styles/package.json:45`).
**Performance Goals**: N/A beyond the charter's static-presentational-component baseline; no new
token file growth beyond reusing existing `--sk-motion-*` entries.
**Constraints**: No custom element (C-001), no calculation/state/timers (C-002), no
indeterminate-to-determinate transition (C-003), no shared cue primitive with `sk-button`/#305
(C-004), no general-purpose spinner (C-005), independent of #301/ADR-15 (C-006, measured below),
`LightMode` uses `class="sk-light"` (C-007), one WP/one PR (C-008), no new token category absent a
demonstrated gap (C-009).
**Scale/Scope**: One CSS file edited (not created), five to seven new fixtures, one generated
artifact re-run (`index.ts`, no shape change to the generation script itself), one existing test file
edited in place, one story file edited to add exports, one documentation update. No other package
touched. No migration.

## Charter Check

*GATE: re-checked here for Phase 1 design; `research.md` already satisfies Phase 0.*

| Charter clause | How this plan satisfies it |
|---|---|
| Every component requires a Storybook story covering default, interactive states, responsive breakpoints | New exports on the existing `sk-progress-html.stories.ts` covering indeterminate-with-label, without-meta, with-meta, narrow, long-label, forced-colors, plus the existing default-dark/`LightMode` treatments applied to at least one indeterminate fixture |
| axe-core zero WCAG 2.1 AA violations, both default and LightMode | `run-axe-storybook.js` runs unconditionally against every emitted story, including the new indeterminate ones — no opt-in step |
| Visual diff against reference screenshots | `visual.spec.ts` gains new chromium-only baseline entries for the indeterminate stories, matching the repository's existing chromium-only VR policy (not extended to firefox/webkit — see Gate Matrix row 18) |
| Component documents its token dependencies | `sk-progress.css`'s header comment gains the indeterminate rule's token dependencies (`--sk-motion-*`), and `docs/design-system/using-components.md`'s progress entry (if one exists) is updated to note the new modifier |
| ADR-11 required-behaviours list, only where the component owns behaviour | This component owns none — unchanged from #210's own R-01 finding; the indeterminate modifier adds no property, event, or focus/keyboard handling. `behaviours.json`/`mutations.json` gain no entry |
| CSS uses only `--sk-*` tokens, no hardcoded value outside the token file | NFR-001; the animation's duration/easing come from `--sk-motion-*`, colours from existing surface/accent tokens, matching R-08's finding that no token gap exists |
| ADR-15 (static form of element-backed CSS) | **Does not apply — confirmed, not assumed.** `git grep -nE ':host|::slotted|container-type|::part' packages/styles/src/progress/sk-progress.css` returns zero matches before and must return zero matches after this mission's changes (SC-013). This component has no shadow root; ADR-15 rules exclusively on shadow-DOM CSS constructs |
| No custom element, no `::part()`, no behaviour registry entry (C-001) | This mission edits an existing styles-only directory in place; it does not create a `packages/elements/src/progress/` directory, and none is required for `build-styles-only-markup.mjs`'s directory-shape discovery to keep working |
| Cross-mission pairing decision (#305/#306) resolved before either freezes its own contract | Resolved in `spec.md`'s "Cross-Mission Decision" section and `research.md` R-00: two independent cues. This mission's own contract is unaffected by the ruling and needs no design change as a result of it — the ruling only constrains what #305 may later build |

No charter violation requires justification. Complexity Tracking is not filled.

## Project Structure

### Documentation (this mission)

```
kitty-specs/progress-indeterminate-01M25C78/
├── spec.md              # this mission's outcome, requirements, and the TKT5/TKT6 ruling
├── plan.md              # this file
├── research.md          # R-00 through R-07, evidence-backed
├── data-model.md         # extended markup/attribute contract, fixture matrix
├── research/
│   ├── evidence-log.csv
│   └── source-register.csv
└── tasks/                # authored in the tasks phase
```

### Source Code (repository root)

```
packages/styles/src/progress/
├── sk-progress.css                    # EDITED — new .sk-progress--indeterminate rule block,
│                                       # new @keyframes, extended forced-colors block
├── index.ts                           # GENERATED — re-run via build-styles-only-markup.mjs,
│                                       # gains new fixture exports; no hand-edit
├── sk-progress-html.stories.ts        # EDITED — new story exports for the indeterminate fixtures
├── sk-progress-indeterminate.html                     # NEW — indeterminate with label, no meta
├── sk-progress-indeterminate-with-meta.html           # NEW — indeterminate with non-percentage meta
├── sk-progress-indeterminate-narrow.html              # NEW — indeterminate + --narrow
├── sk-progress-indeterminate-long-label.html          # NEW — indeterminate + long label
└── sk-progress-indeterminate-forced-colors.html       # NEW — indeterminate, forced-colors story
apps/storybook/src/tests/
└── sk-progress.spec.ts                # EDITED — scope the existing percentage-consistency test to
                                        # determinate fixtures only; add new describe blocks for the
                                        # indeterminate structural/a11y/reduced-motion/forced-colors
                                        # assertions (FR-002 through FR-010, FR-014)
```

No file outside `packages/styles/src/progress/` and `apps/storybook/src/tests/sk-progress.spec.ts`
is touched. `packages/styles/src/index.ts` and `packages/styles/package.json` are **not** edited —
their `progress` wiring already exists from #210 (confirmed above).

## Markup and generation flow

1. Author the five new `.html` fixtures under `packages/styles/src/progress/`, each with
   `<progress class="sk-progress__bar" id="...">`  and **no `value` attribute anywhere in the source
   file** — this is asserted at the source-file level, not only at the rendered-DOM level, so a
   template-engine artifact that injects an empty `value=""` cannot slip through undetected.
2. Run `node scripts/build-styles-only-markup.mjs` to regenerate `packages/styles/src/progress/index.ts`.
   The generator's directory-shape discovery needs no change: it already includes this directory
   (from #210), and it re-derives its export list from every `.html` file present, which now
   includes the five new ones.
3. Run `node scripts/build-styles-only-markup.mjs --check` to confirm no drift between the committed
   barrel and a fresh regeneration.
4. Add the corresponding story exports to `sk-progress-html.stories.ts`, importing the new generated
   constants — never hand-writing the HTML in the story file (unchanged convention from the
   determinate stories).

## CSS strategy — the indeterminate rule, motion, and forced-colors

**The modifier is additive, root-scoped, exactly like `--compact`/`--narrow`:**

```css
/*
 * Indeterminate: the same native <progress>, with no `value` attribute. The
 * activity look is an AUTHORED animation on the reset vendor pseudo-elements —
 * never a reliance on the browser's own default indeterminate paint, which
 * (a) cannot be stopped by prefers-reduced-motion on its own, since it is not
 * an author-controlled `animation`, and (b) is exactly the cross-engine
 * divergence #306 names as the dominant risk.
 */
.sk-progress--indeterminate .sk-progress__bar::-webkit-progress-value,
.sk-progress--indeterminate .sk-progress__bar::-moz-progress-bar {
  /* explicit width/background-size + a sliding gradient, animated via
     @keyframes sk-progress-indeterminate-sweep, timed and eased from
     --sk-motion-duration-* / --sk-motion-easing-* tokens */
}

@keyframes sk-progress-indeterminate-sweep { /* token-driven sweep, authored here */ }

@media (prefers-reduced-motion: reduce) {
  .sk-progress--indeterminate .sk-progress__bar::-webkit-progress-value,
  .sk-progress--indeterminate .sk-progress__bar::-moz-progress-bar {
    animation: none;
    /* a fixed, partial-looking background-position/size so the frozen frame
       is neither the Complete (full) nor Zero (empty) determinate visual —
       this is the concrete mechanism NFR-005 and Story 3's acceptance
       scenarios measure */
  }
}
```

The exact keyframe shape (sweep width, timing function, the specific fixed frame under reduced
motion) is an implementation-phase measurement against real Chromium/Firefox/WebKit rendering —
research.md R-05 names this as the mission's one carried-forward execution risk, not a solved detail.
This plan fixes the *technique* (authored animation on the existing vendor pseudo-element surface,
token-driven, explicitly disabled-but-still-visible under reduced motion) so implementation does not
have to re-derive the direction, only measure the specific values.

**Forced-colors** extends the existing block to also assert legibility across the animation cycle
(research.md R-06): the existing `Highlight` override on the fill pseudo-elements already applies
regardless of `animation-name`, since `background-color` is what's overridden and the override does
not depend on the animation running — but this must be *measured* at more than one point in the
cycle (or with the animation paused) rather than assumed to hold from the determinate case's
single-frame proof.

## Test-file strategy (FR-014, C-006 verification)

`apps/storybook/src/tests/sk-progress.spec.ts` is edited in place:

1. **Scope the existing "every maintained fixture keeps its visible meta text consistent" test** to
   exclude fixtures whose name matches an agreed `Indeterminate` naming convention (e.g. filter
   `readFixtures()`'s result before the percentage assertion, or split into
   `readDeterminateFixtures()`/`readIndeterminateFixtures()` helpers sharing the same underlying
   parse). This is a targeted filter, not a loosened assertion — every existing determinate fixture
   must still be checked exactly as before (SC-010).
2. **Add a parallel indeterminate consistency check**: every indeterminate fixture has no `value`
   attribute at all (source-text assertion, matching R-02's "structurally absent" requirement) and,
   where `__meta` is present, its text does not match `\d+%`.
3. **Add accessibility-tree assertions** for an indeterminate story: role is the platform's native
   progress-indicator role, accessible name matches the label, no numeric value is exposed via
   `page.evaluate` reading `HTMLProgressElement.value`/`position` (an indeterminate `<progress>`'s
   `.position` IDL property returns `-1` per the HTML spec — asserting this directly is a clean,
   engine-agnostic way to confirm indeterminate state at the DOM level without depending on any
   particular ARIA string).
4. **Add a reduced-motion test**: emulate `prefers-reduced-motion: reduce`, read the computed
   `animation-name` (or `animation-play-state`) on the fill pseudo-element via
   `getComputedStyle`/CDP as needed, and compare the frozen frame's `background-position`/equivalent
   measurement against both the Complete and Zero determinate fixtures' fill extents to confirm it is
   neither.
5. **Add a forced-colors test sampling two points in the animation cycle**, per R-06.
6. **Add narrow/long-label overflow tests** for the indeterminate fixtures, mirroring the existing
   determinate long-label/large-total tests' shape exactly (same `page.setViewportSize` +
   `scrollWidth`/`clientWidth` comparison).
7. **Add a CSS source-guard extension**: alongside the existing "no CSS-generated arithmetic" test,
   add a five-line assertion that `sk-progress.css` contains no `content:` declaration carrying
   literal text — the narrow guard `research.md` R-07 substitutes for a component-scoped #286
   no-literal test, given this family has no `render()` to protect in the first place.

Pytest-style "before/after" verification for SC-010: run `npx playwright test
apps/storybook/src/tests/sk-progress.spec.ts` before making any change (all determinate tests pass,
zero indeterminate tests exist yet) and again after (all determinate tests still pass unchanged, all
new indeterminate tests pass) — the same before/after discipline `adding-a-component.md`'s red-first
convention expects, applied here to a modification of a shared file rather than a wholly new one.

## Accessibility and overflow observables

Unchanged in mechanism from #210: native role/name/value derivation, `for`/`id` association, no
invented ARIA. New for indeterminate: the `.position === -1` IDL check (above) as the
engine-agnostic proof of indeterminate state, and the explicit absence of any numeric
`aria-valuenow` in the accessibility tree (verified via Playwright's accessibility snapshot API,
matching the existing determinate test's pattern of querying `getByRole('progressbar', { name })`).

## Documentation

`sk-progress.css`'s own header comment is extended (not replaced) to document the indeterminate
modifier's markup shape and the "no shared cue with sk-button" boundary, linking to `spec.md`'s
Cross-Mission Decision section so a future reader of the CSS file does not have to rediscover the
ruling from a GitHub issue. If `docs/design-system/using-components.md` documents `sk-progress`
already, its entry gains the indeterminate variant; if it does not yet document `sk-progress` at all,
this mission does not create that documentation from scratch (out of scope — #210's own
responsibility, not reopened here).

## Gate Matrix

Every gate below is either run, or explicitly explained as not applicable, following #210's own
plan's structure for this same component family.

| # | Gate | Command | Applies? | Why / why not |
|---|---|---|---|---|
| 1 | Focused Playwright spec (edited in place) | `npx playwright test apps/storybook/src/tests/sk-progress.spec.ts --project=chromium --project=firefox` (after `npx nx run storybook:storybook:build`) | **Yes — run first, locally** | Fastest, most specific feedback; WebKit leg deferred to CI (gate 17) since it cannot launch on this host |
| 2 | Typecheck | `node scripts/typecheck-all.mjs` | Yes | The generated `index.ts` and edited `.stories.ts`/`.spec.ts` files must stay green |
| 3 | Lint (ESLint + Stylelint + HTMLHint) | `npm run quality:all` | Yes | NFR-001 (token-only CSS, including the new `@keyframes`/`--sk-motion-*` usage); HTMLHint covers the five new `.html` fixtures |
| 4 | Styles-only barrel generation + drift check | `node scripts/build-styles-only-markup.mjs` then `--check` | Yes | Must be re-run after adding the five new fixtures; the committed `index.ts` must match a fresh regeneration exactly |
| 5 | Element markup generation/drift, manifest analyzer, React/Vue wrapper generation, element-only ratchets (`expected-parts.json`, `expected-docs.json`, `behaviours.json`/`mutations.json`) | — | **No** | Unchanged from #210's own plan: no element, no shadow root, no manifest entry exists or is created |
| 6 | `check-adopted-css-boundaries.mjs` | `node scripts/check-adopted-css-boundaries.mjs` | Yes, but expected no-op for this file | Confirms `sk-progress.css` still carries no `:host`/adopted-sheet construct after this mission's edit — the ADR-15-independence check made executable (SC-013) |
| 7 | `check-story-theme-wrapper.mjs` | `node scripts/check-story-theme-wrapper.mjs` | Yes | Confirms any new `LightMode`-style story added for an indeterminate fixture uses `class="sk-light"`, not `data-theme="light"` (C-007) |
| 8 | `scripts/check-release-graph.mjs` | `node scripts/check-release-graph.mjs` | Yes, but expected no-op | `./progress/*` subpath export already exists from #210; this gate confirms it remains intact, not that a new one is added |
| 9 | Storybook build | `npx nx run storybook:storybook:build` | Yes | Required before gates 1, 10, and 11 |
| 10 | axe-core over all stories | `node scripts/run-axe-storybook.js` | Yes | NFR-002/SC-004; runs unconditionally, including the new indeterminate stories |
| 11 | Playwright full suite, cross-browser (**the mechanism for NFR-003/SC-008**) | `npx playwright test` (chromium/firefox/webkit, unfiltered, per `playwright.config.ts`) — **only fully executable in CI** | Yes, **CI-authoritative for WebKit** | This is the sole CI job that launches WebKit (`--with-deps` installs all three engines); local execution here runs `--project=chromium --project=firefox` only, which is not treated as satisfying the three-engine requirement on its own |
| 12 | Visual regression (`visual.spec.ts`) | `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium` | Yes, chromium-only, CI-authoritative | New baseline entries for the indeterminate stories, chromium-only, matching the repository's already-recorded VR policy — **no** firefox/webkit baseline is added (SC-014) |
| 13 | `npm run quality:all` (final aggregate) | `npm run quality:all` | Yes | Final aggregate check before commit |
| 14 | `git status --porcelain` empty after regeneration | `git add -A && git status --porcelain` | Yes | Confirms gate 4's regenerated `index.ts` is committed and nothing else drifted |
| 15 | `node scripts/check-gate-wiring.mjs` | `node scripts/check-gate-wiring.mjs` | Yes | Cheap, catches accidental workflow drift from a concurrent sibling mission (#301/#302/#304/#308 all run in parallel worktrees) |
| 16 | `bash scripts/npm-audit-gate.sh`, `npm run security:lockfile-check`, `bash scripts/check-action-pins.sh` | as named | Yes, but incidental | No dependency, lockfile, or workflow file is touched by this mission |

## Rebase / regenerate / rerun requirements before final review

1. **Rebase onto the current mission branch tip and, at PR time, onto `train/elements-first`'s
   current head** before the final gate pass — per this repo's own recorded lesson (re-fetch main
   before implementing), a long design phase can go stale while sibling missions land. #306's own
   dispatch brief warns the same train head may move before implementation starts.
2. **Regenerate in dependency order** after any rebase or CSS/HTML edit: gate 4's plain run before
   its own `--check`, before gates 2/3/9.
3. **Rerun the full gate matrix** after any regeneration.
4. **Re-run the pre-merge adversarial squad against the final head SHA** before requesting review —
   #306's own front matter states squad tier C (pre-merge only); no earlier point-cut squad is
   required, but the pre-merge gate is never skipped.
5. **Re-verify the WebKit leg on CI specifically**, not merely trust a green local chromium+firefox
   run — this is the one gate in this matrix whose authoritative execution never happens on this
   workstation.
6. **Confirm no determinate fixture, story, or test outcome changed** (SC-010) as an explicit
   before/after diff of `sk-progress.spec.ts`'s determinate-only test results, not merely "the suite
   is green" (a scoping bug in step 1 of the Test-file strategy could silently stop testing a
   determinate fixture rather than testing it correctly, and a bare green run would not distinguish
   the two).
7. **Confirm `git grep` over `sk-progress.css` still shows zero `:host`/`::slotted`/`container-type`/
   `::part` occurrences** (SC-013) as a final ADR-15-independence re-check, not only a plan-time
   assertion.

## Work package shape

**One work package.** #306 states "one bounded Work Package and one PR" as its own delivery
constraint, and this plan found no internal seam that benefits from splitting: the CSS rule, its
animation, the five fixtures, the generated barrel, the story exports, and the single edited test
file are all interdependent (the test file needs the fixtures to exist; the fixtures need the CSS
rule to render meaningfully; the barrel needs both). One PR into `train/elements-first`, gated by the
matrix above.

## Complexity Tracking

Not applicable — no Charter Check violation exists for this mission.

## Implementation Concern Map

### IC-01 — CSS: the indeterminate rule, authored animation, and extended forced-colors block

Author `.sk-progress--indeterminate`'s rule block and `@keyframes` in `sk-progress.css`, token-driven
throughout (`--sk-motion-*` for duration/easing, existing surface/accent tokens for color), with the
reduced-motion override producing a fixed, neither-full-nor-empty frame. Extend the forced-colors
block's applicability (no new override needed if the existing `Highlight` rule already applies
regardless of `animation-name` — confirmed during implementation, not assumed here). Covers FR-001,
FR-002, FR-007, FR-008, FR-009, NFR-001, NFR-005.

### IC-02 — Fixtures and generated wiring

Author the five new `.html` fixtures (with label; without meta; with non-percentage meta; combined
with `--narrow`; combined with a long label; plus a forced-colors variant if not already covered by
one of the above), each with no `value` attribute on `<progress>`. Regenerate `index.ts` via
`build-styles-only-markup.mjs` and verify with `--check`. Add the corresponding story exports.
Covers FR-003, FR-004, FR-005, FR-006, FR-010, FR-012, FR-015, FR-016.

### IC-03 — Test-file edit: scope the existing check, add the new ones

Edit `apps/storybook/src/tests/sk-progress.spec.ts` per the Test-file strategy above: scope the
percentage-consistency test to determinate fixtures, add the indeterminate structural/no-value/
no-percentage-meta check, add accessibility-tree assertions (role, name, `.position === -1`, no
invented ARIA), add the reduced-motion frozen-frame comparison, add the multi-sample forced-colors
check, add narrow/long-label overflow checks, and add the CSS `content:`-literal source guard.
Covers FR-011, FR-013, FR-014, NFR-002, NFR-003, NFR-004, and the R-07 narrow-guard substitute for a
component-scoped #286 test.

### IC-04 — Verification: local chromium+firefox, CI-authoritative webkit and visual baselines

Run the full Gate Matrix locally wherever the host can execute it (all gates except the WebKit leg of
gate 11 and the CI-authoritative status of gate 12), then push and confirm the `playwright` CI job is
green across all three engines and the `visual-regression` job's new chromium baselines are accepted,
before presenting the mission as review-ready. Covers SC-008, SC-013, SC-014, and the plan's own
"Rebase / regenerate / rerun" checklist.
