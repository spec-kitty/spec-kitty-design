# Exact-base and corrective evidence

The retained Team Overview mission history is based directly on
`train/elements-first@57fe4ce7a752d2fcbce19e963a7c833acf951473`, with no merge commit. Before
rewriting, safety ref `refs/safety/issue-383-pre-57fe-c5c057fc` was created at
`c5c057fc71b0330178508f7887a9da99617b669a`. The autosquash rebase from `b38b40e7` completed
without conflicts.

## Current commit provenance

- `9e86e443`: preserve the canonical Team Overview mission trail.
- `3fb13f50`: refresh current workspace fixture and story evidence.
- `aed5644a`: replace historical Team Overview pattern tests and inventory.
- `2b4d7af2`: reconcile earlier exact-base evidence.
- `fe664e03`: prove real browser zoom.
- `4925e90f`: record the real-zoom evidence.
- `32873e68`: refresh the 19 current baselines on the then-current train.
- `8793a7a9`: harden route-kind authorization and passive fallback; ensure stable compact-navigation
  identity; and render only one selected TO2 authorization response in document DOM.
- `48580637`: align repository/Mission route evidence with Team Kitty authority, make both media
  blocks independently load-bearing, and add two inspected media baselines.
- The final documentation commit reconciles this file, matrices, model, and validation records on
  the exact `57fe4ce7` base.

The old #150 visual cases were removed only from the Team Overview-owned block. Every target-side
visual/composition/zoom guardrail and unrelated baseline remains inherited from `57fe4ce7`.
`expected-stories.json` retains the target's aggregate total of 654 and replaces only the six
historical Team Overview IDs with six current IDs.

## Pre-publication corrections

- `safeTeamOverviewHref` maps each route kind to only its reviewed destination shape and keeps the
  latest-release destination exact. Forged Members-kind/Connectors-path and
  Connectors-kind/Members-path inputs are rejected directly and by `projectFirstRunResponse`.
- Repository and Mission routes follow the pinned Team Kitty `apps/web/repo_dossier_urls.py` and
  TO1 screen shapes: `/repos/<owner>/<repo>/` and `/repos/<owner>/<repo>/m/<mission>/`. Normal and
  long fixtures preserve that owner/repository boundary; old one-segment and `/missions/` shapes
  are rejected rather than inferred.
- Populated fixtures separate projection from route rendering: missing, unsafe, or mismatched
  destinations preserve their consumer-supplied labels as passive text rather than throwing or
  disappearing. First-run authorization remains fail-closed, so forged privileged routes cannot
  become actionable.
- The TO2 review surface mounts exactly one selected response projection. A story-only Lit outlet
  replaces that response on selection and restores focus to the selector; unselected responses have
  no hidden document DOM. Sequential browser checks cover all six responses, assert one fixture and
  one compact-navigation ID each time, resolve `aria-controls` within the selected tree, and search
  the whole document for unauthorized member/private actions without shadow traversal.
- The route renderer remains Team-Overview-specific story evidence and is absent from package
  barrels. No runtime component API, generic exported helper, wrapper, manifest entry, workflow, or
  configuration changes.
- Forced-colors and reduced-motion checks activate each media query independently and inspect
  computed light-DOM behavior. The former verifies the system-color cell boundary; the latter uses
  an injected competing transition/smooth-scroll rule to prove suppression wins.

## Exact-base validation

- Quality: `npm run quality:all` passes (only inherited warnings).
- Type safety: `node scripts/typecheck-all.mjs` passes all five declared projects.
- Behaviour: `npx vitest run` passes 59 files and 845 tests with zero skipped; the Team Overview
  fixture contributes 37 tests.
- Composition/theme: 47 composition self-probes pass; repository composition covers 18 fixture
  files, 339 CSS rules, 20 tags, and the 142-part ratchet. Visual-softness passes 51 spec files;
  theme-story audit covers 76 story files with only the two known inherited inert stories.
- Storybook: a clean `npx nx run storybook:storybook:build` completes successfully.
- Focused browser: 16/16 Chromium tests pass. The isolated-port pinned Playwright 1.62.1 Noble run
  executes 48 cases across Chromium, Firefox, and WebKit: 46 pass and the two non-Chromium
  forced-colors cases skip as designed.
- Accessibility: all 50 gate self-test shapes classify correctly; all 654 declared story IDs are
  present; 810/810 built stories render; axe reports zero WCAG 2.1 AA violations.
- Visual: the 21 owned Team Overview cases pass 21/21 in the version-matched Noble Chromium image.
  The 19 earlier hashes remain exact; the two new, inspected forced-colors and reduced-motion PNGs
  match the additional SHA-256 entries in `visual-inspection.md`.
- Generated/release: React/style/Vue/generated-CSS/theme-bootstrap/markup/static-form/export,
  release-graph, size, and SRI checks pass and produce no tracked diff.

## Adversarial proof

Six apply-patch mutations were run and exactly restored before the final gates:

1. Replacing the stable panel-derived compact-navigation ID with the shared team initials made the
   earlier six-mounted switcher guard fail: expected six unique IDs, received one.
2. Mapping the Members route kind to the Connectors destination pattern made the full Vitest suite
   fail 10 tests: the canonical Members path was rejected, forged Members became safe, rendered-DOM
   action leakage was detected, and valid first-run fixtures failed projection.
3. Reintroducing the five unselected response trees as hidden siblings made the current TO2
   switcher guard fail immediately: expected one document fixture, received six. This is the
   authorization regression the final guard permanently detects.
4. Restoring the invented one-segment repository and `/missions/` regex made full Vitest fail five
   assertions: four authoritative normal/long routes were rejected and one forbidden old route was
   accepted.
5. Changing the forced-colors populated-cell adjustment from `none` to `auto` failed its dedicated
   computed-style test with exactly that mismatch.
6. Removing reduced-motion `!important` suppression let the injected probe win and failed with
   computed smooth scrolling instead of auto.

All six mutations were restored exactly. The final focused, cross-browser, unit, axe, and visual
runs use only the restored single-response implementation.

## Visual environment note

An exploratory visual run in the local `sk383-playwright-dejavu` image failed all 19 snapshots
because that image deliberately substitutes fonts and does not match the baseline environment. No
baseline was accepted there. The version-matched `sk383-playwright:1.62.1` Noble image passes all 19
exact committed images; the DejaVu Noble image remains useful for the font-independent three-engine
semantic/interaction slice.

At final correction head `48580637`, the version-matched image passes the expanded 21/21 owned set,
and the DejaVu image passes 46 semantic/interaction cases across three engines with the two expected
forced-colors skips.

## Lifecycle note

WP01 remains `approved` because the original independent approval is real and retained in the
canonical event trail. Spec Kitty exposes an `approved -> planned` edge only as a review-rejection
transition requiring rejection feedback. No rejection exists here, so this correction does not
fabricate one. `status.json` and `status.events.jsonl` remain untouched and canonical. The separate
one-line `mission-events.jsonl` compatibility log records only this actual WP01 correction
invocation; it does not claim a lane transition or invent earlier events. The corrected exact head
is ready for fresh independent publication review.
