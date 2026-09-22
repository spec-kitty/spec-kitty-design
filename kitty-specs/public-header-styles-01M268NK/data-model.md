# Data Model: Public Header Styles

**Mission**: `public-header-styles-01M268NK` · **Phase**: plan (Phase 1) · **Date**: 2026-09-10

## This mission has no data model.

This is a positive statement, not an unfilled template. `sk-public-header` is a **styles-only CSS
family**: one authored stylesheet plus a set of static HTML exemplars. It ships:

- no persistent store, database, schema, migration or serialization format;
- no runtime state — no JavaScript at all, so nothing to hold state *in*;
- no element, so no reactive properties, no observed attributes, no `custom-elements.json` entry,
  no `ElementInternals`, no form association, no events;
- no `::part()` and no documented per-component custom property, so no published styling API beyond
  the `--sk-*` tokens every family already inherits;
- no configuration file, no build-time input other than the `.html` fixtures the barrel is generated
  from.

Every value the header displays — brand string, action labels, `href`s, `aria-label`s,
`aria-current`, authentication and route state, theme state, translated strings — is **supplied by
the consumer per render** and owned by Team Kitty (spec C-006, C-010, FR-008). The family selects
none of them and stores none of them.

## What stands in its place

The nearest thing to a "model" here is the **composition contract**: the fixed set of BEM classes a
consumer applies to their own semantic HTML, and the element each class belongs on. That is
enumerated once, in [`plan.md` §4.2](./plan.md), and restated for consumers in
`docs/design-system/using-components.md`'s `## Public header` section. It is not duplicated here —
two copies of one contract drift, which is the failure mode `spec.md` itself records for ADR-10's
two competing styles-only rationales.

For reference, the six classes and their host elements:

| Class | Element | Required |
|---|---|---|
| `sk-public-header` | `<header>` | yes |
| `sk-public-header__inner` | `<div>` | yes |
| `sk-public-header__brand` | `<a href>` | yes |
| `sk-public-header__brand-context` | `<span>` inside the brand | no |
| `sk-public-header__actions` | `<nav aria-label>` | no — absent, never empty |
| `sk-public-header__action` | each `<a>`/`<button>`/composed element in the region | yes, when an action exists |

The authoritative machine-readable form of this contract is the exact-selector-inventory assertion
in `apps/storybook/src/tests/sk-public-header.spec.ts`, which fails if the stylesheet's class set
differs from that list in either direction.

## Precedent for recording it this way

`spec.md`'s "Key Entities" section already says this in the same terms — *"Composition-contract
elements (this family has no data model; these are the anatomy pieces a consumer instantiates)"* —
and `sk-context-nav` (#256), the nearest sibling family, shipped with no data model artifact at all.
This file exists so the absence is a recorded finding rather than a missing document.
