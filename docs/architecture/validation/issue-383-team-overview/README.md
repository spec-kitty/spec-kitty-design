# Issue #383 — current Team Overview pattern evidence

This record validates the Team Overview Storybook refresh against the Family 1 TO1 and TO2
contracts. The package remains story composition: it adds no Team Overview component, controller,
relay client, clock, permission system, or mutation API.

The evidence was transplanted without merge commits onto
`train/elements-first@d3263e9488f7df85a537a927d417729eacc75f12`. The refreshed product story and
fixture surface is commit `1f4339ba`; corrective browser-zoom proof is commit `d9e6baa3`. The
earlier independent approval at lane `1d1dba2e` remains in the mission trail, and the rewritten
exact head requires a fresh independent review before publication.

## Current reviewed surface

- TO1: `Default`, `AlternateRetention`, `LightMode`, and `LongContent` project one immutable
  TeamMoment/repository response. Retention input derives the strip, total, at-most-two distinct
  in-flight Mission references, and at-most-six passive recent rows. Repository facts are not
  freshness-qualified.
- TO2: `FirstRun` exposes exactly six immutable server-response fixtures behind a native select.
  The selector is labelled design-review scaffolding outside the product contract. Routes and
  admission/member actions remain fixture- and authorization-gated.
- `CopyOutcomes` exercises copied, manual, and failed outcomes through the public `sk-copy-field`
  contract with supplied messages and focus retention.
- Every product-visible and accessibility string comes from the fixtures. The CSF title and story
  export names are Storybook registration metadata, not product copy.

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
  - Real 200% browser zoom is a fresh DPR-2 Playwright context at 720x512 CSS pixels, derived by
    halving the normal 1440x1024 story viewport. The test proves the public compact-shell exposure
    transition, zero document/root/control overflow, visible focus, and a 44px trigger. Its CSS
    `zoom` sibling is deliberately labelled supplemental magnification stress.
  - A deliberate unchanged-780px mutation fails the 720px viewport assertion, so the real-zoom
    mechanism is load-bearing rather than descriptive.
- Current inventory: `expected-stories.json`
- Visual matrix and 19 Linux/Chromium baselines: `apps/storybook/src/tests/visual.spec.ts`
- Human inspection record: `visual-inspection.md`
