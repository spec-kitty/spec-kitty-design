# Repository Dossier implementation evidence

This ledger records the correction candidate that followed independent Codex review cycle 1. The
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
| Cross-screen family      | Pass — repository identity, layout hierarchy, status language, current navigation ownership, native semantics, and completed/terminal/pending distinctions remain consistent. Light, forced-color, reduced-motion, long-data, threshold, and CSS-zoom stress baselines use the same composition. |

The Storybook visual command regenerated only the affected Dossier baselines and passed 15/15.
The focused behavioral command then passed 29/29 applicable Chromium/Firefox cases with one
expected Firefox skip for the explicitly Chromium-owned CSS-zoom stress.

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
18-test direct fixture suite with the default reporter. Each produced exactly its named red. The
authored source was restored before the merge-consistency invariant brought the final suite to
19/19:

| Probe                                                  | Named red                                            |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Omit `Object.freeze(value)` from the recursive freezer | recursively frozen fixture assertion                 |
| Freeze the caller inside `projectRepositoryDossier`    | caller-owned fixture remains mutable assertion       |
| Put merged #1017 back into D4 navigation               | exact unmerged navigation destinations assertion     |
| Accept every parsed tracker protocol                   | unsafe `javascript:` destination rejection assertion |
| Change D1 supplied progress from 62% to 5%             | exact total/percent fixture assertion                |

## Known environment boundary

The host Playwright WebKit executable cannot start because the workstation lacks `libgtk-4-1`,
`libicu74`, `libjpeg-turbo8`, `gstreamer1.0-libav`, and related runtime libraries. Issue #255 binds
behavior evidence to Chromium and Firefox, both of which pass. The unavailable WebKit runtime is
recorded rather than reported as executed.
