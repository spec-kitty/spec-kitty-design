# Repository Dossier implementation evidence

This ledger records the correction candidate that followed independent Codex review cycles 1 and 2. The
PR and child-issue closeout record the final tested commit because a commit cannot contain its own
hash. All UI values below come from immutable story fixtures; none are observations of Team Kitty
application state.

## Approved-screen comparison

The generated Chromium baselines were compared side-by-side with the approved dark artifacts in
`/home/jeroennouws/dev/team-kitty-missions/ux_redesign/repository-dossier/screens/`.

| State                    | Comparison result                                                                                                                                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1 populated             | Pass — three-region desktop shell, exact git context, three Mission rows, supplied progress, document links, and setup hierarchy are preserved through current public contracts and current tokens.                                                                                              |
| D2 narrow                | Pass — compact identity/trigger, 16px content gutters, one-column row reflow, closed-drawer omission, open-drawer focus, and content order preserve the approved intent at 390px.                                                                                                                |
| D4 cross-branch          | Pass — #1042 shows feature and release copies, #1017 shows feature and main copies plus the supplied merged fact, #998 shows its feature copy, and merged #1017 is absent from both navigation renderings.                                                                                       |
| D5 terminal              | Pass — the terminal explanation is distinct and no commit, Mission, progress, document, copy, or setup action is rendered.                                                                                                                                                                       |
| D6 snapshot disagreement | Pass — one warning remains attached only to #998 and repeats the exact supplied repository SHA.                                                                                                                                                                                                  |
| D7 indexing              | Pass — pending copy is distinct, no completed facts appear, and the stable polite notice receives its message once after insertion.                                                                                                                                                              |
| D8 completed empty       | Pass — the exact commit, explicit empty result, repository documents, and setup guidance remain; zero-count Mission/progress surrogates do not appear.                                                                                                                                           |
| Cross-screen family      | Pass — repository identity, layout hierarchy, status language, current navigation ownership, native semantics, and completed/terminal/pending distinctions remain consistent. Light, forced-color, reduced-motion, long-data, 860/861 seam, tracker-resilience, progress-input, and CSS-zoom stress baselines use the same composition. |

The Storybook visual command regenerated only the affected Dossier baselines and passed 18/18.
The focused behavioral command then passed 35/35 applicable Chromium/Firefox cases with one
expected Firefox skip for the explicitly Chromium-owned CSS-zoom stress.

The 860 px baseline exposes the compact header and 16 px local content gutters while keeping the
personal rail, desktop context sidebar, and closed compact drawer inert. The 861 px baseline
exposes the two desktop navigation regions, hides the compact regions, and restores 24 px local
gutters. The tracker-resilience baseline renders the safe HTTPS destination as a native anchor,
the unsafe `javascript:` destination as a static pill, and the absent destination as no tracker
surface. These three additions were inspected individually and against the complete Dossier family.

Real keyboard sequences in Chromium and Firefox begin from the document body and prove the closed
drawer is skipped by Tab order, Shift+Tab continuity, Space/Enter compact-trigger operation, native
document and Mission link activation, and Space/Enter operation of both copy buttons. Computed
focus outlines and expanded outline geometry remain inside the 390 px viewport or open drawer.

## Genuine browser UI zoom

A production Storybook build was served in a `1200 × 800` Xvfb display. X11/XTEST focused the real
headed browser window and sent `Ctrl+0` followed by native `Ctrl+Shift+=` chords. The physical
window stayed fixed. No CSS zoom, viewport resize, device-scale override, CDP emulation, pinch, or
page-scale emulation was used. Chromium 151 used five/eight chords; Firefox 153 used ten/sixteen.

| Browser                | UI zoom | DPR | CSS viewport | visual scale | document client / scroll | root right | command right | focused trigger     | Result |
| ---------------------- | ------: | --: | -----------: | -----------: | -----------------------: | ---------: | ------------: | ------------------- | ------ |
| Chromium 151.0.7922.34 |    200% |   2 |    600 × 356 |            1 |                592 / 592 |      592.5 |         558.5 | Yes, native outline | Pass   |
| Chromium 151.0.7922.34 |    400% |   4 |    300 × 178 |            1 |                296 / 296 |     296.25 |        262.25 | Yes, native outline | Pass   |
| Firefox 153.0          |    200% |   2 |    595 × 353 |            1 |                595 / 595 |        595 |           561 | Yes, native outline | Pass   |
| Firefox 153.0          |    400% |   4 |    298 × 176 |            1 |                298 / 298 |      297.5 |         263.5 | Yes, native outline | Pass   |

At every level the exact `spec-kitty charter interview` value remained unchanged, the root and
copy control stayed within the document, and page-level horizontal overflow was absent. Firefox's
browser chrome visibly reported 200% and 400%; the focused trigger remained visible at both.

## Direct mutation probes

No new ADR-11 behavior ID was invented for a Storybook fixture. Instead, five isolated
substitutions were applied to the extracted fixture/projection source, each against the then-current
direct fixture suite with the default reporter. Each produced exactly its named red. A sixth
renderer mutation forced every safe tracker destination down the static branch, rebuilt Storybook,
and made the focused native-anchor assertion red. Authored source was restored before the final
direct fixture suite passed 20/20:

| Probe                                                  | Named red                                            |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Omit `Object.freeze(value)` from the recursive freezer | recursively frozen fixture assertion                 |
| Freeze the caller inside `projectRepositoryDossier`    | caller-owned fixture remains mutable assertion       |
| Put merged #1017 back into D4 navigation               | exact unmerged navigation destinations assertion     |
| Accept every parsed tracker protocol                   | unsafe `javascript:` destination rejection assertion |
| Change D1 supplied progress from 62% to 5%             | exact total/percent fixture assertion                |
| Force a safe tracker destination down the static branch | rendered safe native-anchor assertion                |

## Consolidated gate result

The consolidated candidate completed the repository gate surface before independent review:

- `npm test`: 48 files and 582 tests passed; both required lanes were non-empty.
- `node scripts/measure-suite-time.mjs`: 582 tests passed in 15.3 seconds against a 40-second ceiling.
- `node scripts/build-storybook-with-budget.mjs`: production Storybook built in 9.31 seconds against a 180-second ceiling.
- Focused Playwright: 35 applicable Chromium/Firefox cases passed with one intended Firefox skip; all 18 Dossier visual baselines passed in Chromium.
- Full Playwright: 1,078 cases passed with 44 intended skips; the four port/demo assembly failures were rerun under the repository's native assembled surface and passed 4/4.
- `node scripts/gate-selftest.mjs`: all 50 render-assertion shapes passed; `node scripts/run-axe-storybook.js`: all 561 rendered stories had zero WCAG 2.1 AA violations.
- `node scripts/suite-selftest.mjs`: all 237 mutations produced their named red against a green 548-assertion baseline in 937.3 seconds; `--selftest` passed all 10 guards in 67 seconds.
- Quality, five-project typecheck, generated React/Vue/CSS/markup/story/manifest/part gates, composition boundaries, workflow/ADR gates, security, lockfile, pinned Actions, release graph, packed Vue declarations, size report, and offline loading all passed.

The PR and child-issue closeout record the immutable reviewed SHA. The final train fetch, rebase
decision, and affected-gate rerun happen again immediately before merge.

## Known environment boundary

The host Playwright WebKit executable cannot start because the workstation lacks `libgtk-4-1`,
`libicu74`, `libjpeg-turbo8`, `gstreamer1.0-libav`, and related runtime libraries. Issue #255 binds
behavior evidence to Chromium and Firefox, both of which pass. The unavailable WebKit runtime is
recorded rather than reported as executed.
