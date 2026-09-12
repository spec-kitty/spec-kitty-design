# Issue #383 — current Team Overview pattern evidence

This record validates the Team Overview Storybook refresh against the Family 1 TO1 and TO2
contracts. The package remains story composition: it adds no Team Overview component, controller,
relay client, clock, permission system, or mutation API.

The evidence is based without merge commits on
`train/elements-first@57fe4ce7a752d2fcbce19e963a7c833acf951473`. The pre-rewrite safety ref is
`refs/safety/issue-383-pre-57fe-c5c057fc`; the route, authorization, compact-navigation,
single-tree, and media evidence correction is commit `48580637`. Three fresh independent lenses
passed corrected pre-publication head `f9ddc9db` with no findings; the earlier Spec Kitty approval
also remains in the canonical mission trail.

## Current reviewed surface

- TO1: `Default`, `AlternateRetention`, `LightMode`, and `LongContent` project one immutable
  TeamMoment/repository response. Retention input derives the strip, total, at-most-two distinct
  in-flight Mission references, and at-most-six passive recent rows. Repository facts are not
  freshness-qualified.
- TO2: `FirstRun` exposes exactly six immutable server-response fixtures behind a native select.
  The selector is labelled design-review scaffolding outside the product contract. Routes and
  admission/member actions remain fixture- and authorization-gated. Exactly one selected response
  tree exists in document DOM; it has a stable fixture-derived compact-navigation ID whose trigger
  controls the navigation in that same tree.
- `CopyOutcomes` exercises copied, manual, and failed outcomes through the public `sk-copy-field`
  contract with supplied messages and focus retention.
- Every product-visible and accessibility string comes from the fixtures. The CSF title and story
  export names are Storybook registration metadata, not product copy.
- Reviewed route kinds correspond only to their matching Overview, Work, Connectors, Members,
  repository, Mission, or exact release destination. Repository and Mission evidence follows the
  authoritative Team Kitty shapes `/repos/<owner>/<repo>/` and
  `/repos/<owner>/<repo>/m/<mission>/`; the former one-segment and `/missions/` inventions are
  rejected. Unsafe populated destinations degrade to the supplied label as passive text; forged
  privileged first-run destinations fail closed and never render as actions.

## Ownership boundary

Team Kitty retains routes, permissions, relay reads, polling, clocks, retention, truth/state
classification, TeamMoment/onboarding logic, copy/i18n, clipboard policy, and mutations. The
stories consume public element, native semantic, and static-form surfaces only. Activity is
passive, and the fixture selector never saves, advances setup, polls, or mutates product state.

## Historical migration

Issue #150's Delivery return, Flow health, work-package inventory, operational-dashboard,
evidence-route, and page-wide sync stories are historical/deprecated. Their six story IDs,
visual cases, and eleven PNG baselines are removed rather than presented as current product
evidence. See the mission's `contracts/team-overview-pattern-migration.md` for consumer guidance.

## Proof map

- Fixture invariants: `fixtures/elements-behaviour/src/pattern-team-overview.test.ts`
- Browser semantics, interactions, media, viewport, axe, and role guards:
  `apps/storybook/src/tests/sk-team-overview-pattern.spec.ts`
  - At the 390px compact state, selecting every response proves exactly one fixture and compact
    navigation are mounted, and the focused selector's trigger `aria-controls` resolves to that
    same response tree's navigation using document/light-DOM queries only.
  - Member and private-response checks are document-wide: no unselected sibling can retain a
    privileged Members, admission, repository, or Mission action.
  - Forced-colors evidence asserts active emulation plus the populated Velocity cell's actual
    `forced-color-adjust`, system-color background, and bordered boundary. Reduced-motion evidence
    injects competing transition and smooth-scroll declarations and proves the pattern's media
    suppression wins. Deleting either media block makes its dedicated test fail.
  - Real 200% browser zoom is a fresh DPR-2 Playwright context at 720x512 CSS pixels, derived by
    halving the normal 1440x1024 story viewport. The test proves the public compact-shell exposure
    transition, zero document/root/control overflow, visible focus, and a 44px trigger. Its CSS
    `zoom` sibling is deliberately labelled supplemental magnification stress.
  - A deliberate unchanged-780px mutation fails the 720px viewport assertion, so the real-zoom
    mechanism is load-bearing rather than descriptive.
- Current inventory: `expected-stories.json`
- Visual matrix and 21 Linux/Chromium baselines: `apps/storybook/src/tests/visual.spec.ts`
- Human inspection record: `visual-inspection.md`

## Corrective gate record

- `npm run quality:all` and all five typecheck projects pass.
- Full Vitest passes 59 files/845 tests with zero skipped, including 37 Team Overview fixture tests.
- Focused Playwright passes 16/16 Chromium. The pinned Noble three-engine run executes 48 cases:
  46 pass and only the two expected non-Chromium forced-colors cases skip.
- Axe finds all 654 declared story IDs, renders 810/810 built stories, and reports zero WCAG 2.1 AA
  violations.
- Composition passes 47 self-probes and 18 fixture files/339 CSS rules/20 tags/142 parts;
  visual-softness passes 51 files.
- All 21 owned visual cases passed in the version-matched Noble Chromium image before publication.
  The first hosted run then exposed only the known Ubuntu font/raster split. Its retry-stable 21
  actuals were manifest-mapped, representative states inspected, and adopted as the
  CI-authoritative bytes; exact artifact provenance and hashes are in `visual-inspection.md`.
