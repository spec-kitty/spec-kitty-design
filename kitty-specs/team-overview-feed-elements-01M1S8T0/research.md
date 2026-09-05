# Research: Team overview feed elements

## Scope and question

Issue #146 asks for four reusable feed primitives—`section-header`, `action-row`,
`status-indicator` and `entity-marker`—from the approved Team overview design. The research question
is how to preserve the visual row grammar and action behavior without moving list semantics,
application selection, data shaping or a clock into shadow-root components.

## Evidence baseline

- `origin/train/elements-first` was fetched and resolved to
  `dcf7af26ff8f14d0d8b5a8e45c7eb9d64201e053` before mission creation.
- Issue #79 is closed and its landed sources on that train expose `sk-button` as a real button/link
  primitive and `sk-pill-tag` as independent tone/shape axes. This mission reuses those contracts.
- Issue #92 demonstrates that a custom-element host inserted between `ul` and `li` breaks native
  list ancestry; `display: contents` does not repair the accessibility tree reliably.
- ADR-9 requires open shadow roots, tokens/parts/custom properties as the styling API and no
  selector that crosses the shadow boundary.
- ADR-10 requires linted CSS to generate constructed sheets, one authored markup source, guarded
  element registration and regenerated committed artifacts.
- ADR-11 requires tests for applicable event, upgrade, slot, part and style-adoption behavior; a
  passing screenshot or render-only assertion is insufficient.
- The #76 component recipe enumerates the generated CSS, markup, CEM, React, Vue, size, type,
  hygiene, test, mutation, axe and Storybook gates that a component change must run.
- The approved screenshot shows repeated consumer sections (`IN FLIGHT`, `ADMITTED REPOS`,
  `RECENT ACTIVITY`) and rows with a compact yellow marker, primary name, monospace repository,
  semantic pills and right-aligned supplied age. The same grammar appears with different content.

## Decisions

### D-001 — Native list semantics stay entirely consumer-owned

The library will not add `sk-section-list`, render `ul`/`li` inside shadow DOM, or assign list roles
to a custom-element host. Consumers author `ul > li > sk-action-row`. This is the only shape that
preserves real list ancestry and lets the application decide whether a group is a list at all.

Rejected:

- A shadow-root list wrapper repeats the #92 failure at a different tag.
- `display: contents` repairs layout, not dependable accessibility-tree ancestry.
- ARIA `list`/`listitem` roles imitate semantics the consumer can express natively and couple a row
  primitive to one parent context.

### D-002 — All four elements are projections, not aggregates

Each element renders supplied strings or slotted content. None accepts a feed array, sorts rows,
deduplicates equal events, derives freshness, reads time, chooses a route or changes application
selection. The only emitted intent is the action-row activation request.

### D-003 — Use a real primary trigger and a sibling controls region

When an action row is selectable and has a non-empty stable ID, its marker/title/reference/tags/
metadata content is presented by one real internal button-like primary trigger. The trailing-controls
slot is a sibling, not a descendant of that trigger. This obtains native Enter/Space behavior and
keeps links/buttons/`sk-button` independently operable without invalid nested interactive content or
double activation. A non-selectable/invalid-ID row renders no false button affordance.

The row exposes a consumer-owned `selected` value but never mutates it. Primary activation emits
exactly one typed `CustomEvent<{ id: string }>` named `sk-action-row-activate` with `bubbles: true`,
`composed: true` and `cancelable: false`. This binding operator ruling matches the controlled
contract: no application default action lives in the element, so ADR-11 SC-009 is inapplicable and
the mission does not manufacture a flag-only cancellation claim.

### D-004 — Slot vocabulary is domain-neutral

- `sk-section-header`: `eyebrow`, `title`, `description`, `metadata`, `action`.
- `sk-action-row`: `marker`, `title`, `reference`, `tags`, `metadata`, `controls`.
- `sk-status-indicator`: `marker` and the default visible-text slot.
- `sk-entity-marker`: the default mark slot.

The section title is a slotted native heading so the consumer owns document outline level. No slot
or property names a WP, mission, repository, git branch or relative time.

### D-005 — Marker accessibility has one unambiguous input

`sk-entity-marker` uses a documented `label` string. A non-empty label makes the visual mark
meaningful and named; no label (including whitespace) makes it decorative and hidden. A second
`decorative` boolean is rejected because it creates contradictory combinations (`decorative` plus
label, meaningful without label) that need precedence rules and can ship unnamed image semantics.
The component never generates initials or fetches identity.

### D-006 — Status tone is presentation, visible text is meaning

`sk-status-indicator` accepts exactly `neutral | info | success | attention | danger | recovery`.
The default slot is the visible consumer-owned meaning. Tone can style the marker and supporting
treatment but never inject text or infer a tone from supplied words. Recovery uses a treatment
distinct from both information blue and danger red.

### D-007 — No static forms for this mission

These primitives are defined by consumer slot composition and, for action-row, a live intent event.
Publishing option-heavy string builders would create a second projection vocabulary and encourage a
static row outside the native-list contract. Author only Lit templates; generate CSS modules,
manifest, React wrappers, Vue declarations and size evidence. No `.markup.ts`, generated static
`.html`, or styles-layer barrel is created for the four components.

### D-008 — Existing tokens are sufficient until measured otherwise

The train already carries card/page surfaces, border/focus tokens, semantic accent colors and
paired tint/on-tint families, typography, spacing and radius tokens needed by the reference. The
mission plans no token or dependency change. If contrast or layout measurement proves a missing
semantic value, implementation stops for a scope decision rather than hiding a raw value or growing
the token namespace opportunistically.

### D-009 — Three serial WPs share one execution lane

WP01 adds the three purely presentational elements and their direct conformance evidence. WP02 adds
the action row, controlled event behavior, nested-control isolation and its dedicated behavior
evidence. WP03 regenerates/validates all shared outputs and closes React runtime/type evidence plus
the full local gate. Their manifest, wrapper, Vue, size, ratchet, behavior and mutation writes
overlap, so they form `WP01 -> WP02 -> WP03` in one lane and one mission PR.

### D-010 — Rebase the clean target before Spec Kitty merges the frozen lane

Spec Kitty 3.2.6rc4 records a planning commit for lane allocation and freezes it after execution
starts. Rebasing a reused lane mid-mission would rewrite that ancestor and leave stale provenance.
Therefore all three WPs run without a train refresh. After WP03 approval, freeze the lane, fetch
latest `origin/train/elements-first`, and rebase the clean planning target before asking Spec Kitty
to merge the lane into it. Regenerate and commit shared outputs on that merged head, then run every
local, conformance, CI and review gate with no later rebase. If train moves again, stop and explicitly
rebaseline the wrap-up sequence rather than rewriting an already-gated head.

The token catalogue embeds a generation timestamp. It is not a repeatable byte-for-byte drift
check: leave it unchanged when token sources do not change, or regenerate it once when the rebased
train requires that output and include it in the generation commit before repeatable checks. Issue
#112 is still open at planning time, so wrap-up reruns the conformance surfaces actually present on
the rebased train (including `elements-load.spec.ts`) and adopts #112's canonical matrix only if that
contract has landed by then; this mission does not invent an early Svelte or matrix surface.

### D-011 — Tier C has no post-tasks squad

Issue #146 classifies this mission as Tier C: the required three-lens adversarial squad runs at the
pre-merge point-cut after rebase-before-merge, regeneration and full local validation. Every lens is
profile-loaded and SHA-pinned. A later push invalidates its evidence. The mission does not invent a
post-spec, post-plan or post-tasks gate.

## Required behavior registration

The implementation plan must map existing ADR-11 registry IDs rather than minting mission-local
IDs:

- All four elements: SC-013 for every declared part and SC-014 with separate adopted-sheet length
  and identity mutations. Slot projection is tested directly; SC-011 is not claimed because these
  projection primitives intentionally provide no content fallback.
- `sk-action-row`: SC-006 (exactly once), SC-007 (`{ id }` detail), SC-008 (bubbling/composed) and
  SC-010 (consumer properties assigned before definition survive upgrade), in addition to
  slot/part/style behavior. SC-009 is not claimed because the event is non-cancelable and the
  controlled element owns no preventable default.
- Generated React action row: a dedicated SC-006 runtime subject plus compile-time positive and
  `@ts-expect-error` detail checks. Any additional React mutation must use a declared subject pair
  and remain collateral-clean.
- SC-012 is not claimed: its registry contract is specifically Escape-close, focus return and
  `aria-expanded`, none of which this row owns. Native Enter/Space activation is held under the
  event exactly-once behavior and direct functional tests.

## Risks and mitigations

1. **Interactive-descendant conflict** — putting links/buttons inside a button is invalid and can
   flatten accessibility semantics. Keep trailing controls as a sibling and test native plus
   `sk-button` controls.
2. **False cancellation semantics** — do not set a cancelable flag or claim SC-009 when there is no
   element-owned preventable default. Assert the binding non-cancelable flag and unchanged controlled
   state explicitly.
3. **Ratchet vacuity** — every part/story/docs entry must be added with a real test, and SC-014 must
   have both length and identity mutations for each element.
4. **Generated artifact collision** — all WPs use one lane; after approval, rebase the clean target,
   merge the frozen lane with Spec Kitty, then regenerate complete outputs on that exact tree.
5. **Narrow-row collision** — long references and several pills can starve metadata. Use a 320px
   fixture and assert computed bounding boxes/overflow rather than relying on a screenshot alone.
6. **Theme false positive** — wrap `LightMode` in `.sk-light`, assert surfaces differ, and measure
   contrast in both themes.
7. **Train drift** — rebase the clean target before lane merge and never after exact-head evidence
   begins. All generators, tests, CI, visual baselines, squad and maintainer evidence must refer to
   the same post-merge SHA; a later train move requires an explicit wrap-up rebaseline.

## Open questions

No product decision is open. Implementation may choose exact public part names and internal CSS
layout only within the contracts above; any need for a new token, dependency, static form, list role
or application-owned state is a scope decision and blocks that widening.
