# Implementation Plan: Site Footer Compact Mode

**Branch**: `mission/site-footer-compact-mode` | **Date**: 2026-09-10 | **Spec**: [`spec.md`](./spec.md)
**Input**: Feature specification from `kitty-specs/site-footer-compact-mode-01M268NS/spec.md` (commit `7e06136`)
**Mission**: `site-footer-compact-mode-01M268NS` · issue `spec-kitty/spec-kitty-design#354` [TKF2] · epic #352 · target `train/elements-first`
**Evidence base**: [`research.md`](./research.md) — the generator's emission contract, the Family 6 corpus anatomy, the ratchet arithmetic, and the CI path-filter finding, each measured against this checkout rather than assumed.

## Summary

`sk-site-footer` gains a second, compact presentation of the **same** element, selected by one new
public reactive property `presentation="compact"`, rendered from the **same** authored markup module,
and generated into the **same** static artifacts by the **same** generator. The compact presentation
renders a two-part row — a consumer-supplied brand/tagline/legal text block, and a consumer-supplied
region of real native `<a>` links — with no `<nav>`, no heading, no `<ul>`, and no `<hr>`. Zero links
therefore produces no scaffolding at all, structurally, in both consumption paths, with no
slot-derived conditional and no `slotchange` handler.

The compact presentation is declared to the generator as a **non-variant AXIS**, not a variant. It
introduces **no** `container-type`, **no** `@container`, and **no** `:host([attr])` selector, so it
does **not** trigger ADR-15's kind-1/kind-2 machinery and therefore does **not** depend on #309 or
#310. Responsive stacking reuses the sheet's **existing** `@media (max-width: 640px)` threshold, so
no new documented threshold is introduced.

Delivery is exactly one Work Package and one PR, per C-012 and the issue.

## Technical Context

**Language/Version**: TypeScript 5.x (NodeNext, `.js` specifiers over `.ts` sources), CSS with `--sk-*` custom properties only, Node 22.x for the generators.
**Primary Dependencies**: `lit` (element), `esbuild` (the markup generator's transformer), `@custom-elements-manifest/analyzer` (via `nx run elements:analyze`), Vitest browser mode on the Playwright provider (behaviour lane), Playwright (cross-browser/a11y/visual lane), Storybook 10.
**Storage**: N/A — this is a presentational component. There is no persistence, no data model, and therefore **no `data-model.md`**; see "Artifacts this plan deliberately does not create".
**Testing**: Extend `fixtures/elements-behaviour/src/sk-site-footer.test.ts` in place (Vitest browser mode); add two new Playwright specs under `apps/storybook/src/tests/`. No line-coverage threshold — the bar is ADR-11's required-behaviours list, visual conformance and accessibility (charter).
**Target Platform**: Chromium + Firefox (Playwright projects); WebKit is configured but is ADR-10's already-recorded gap on this host. Both consumption paths: the custom element, and the generated no-JavaScript static HTML.
**Project Type**: Monorepo, four packages (`tokens` → `styles` → `elements` → `react`), one-directional dependency boundary (CLAUDE.md hard rule 2).
**Performance Goals**: N/A. The only size-shaped obligation is NFR-010: `packages/elements/SIZES.md` must reflect a real build.
**Constraints**: C-001 tokens only; C-002 BEM; C-003 no theme selector in component CSS; C-006 no clock-derived or pinned year; C-007 generated artifacts are generator-owned; C-008 the markup module stays leaf-safe; C-010 no unguarded container-query axis.
**Scale/Scope**: One element, one sheet, one authored markup module, two story files, one behaviour fixture, two new Playwright specs, two ratchet files.

## Charter Check

*GATE: passes before Phase 0 and re-checked after the design below.*

| Charter / CLAUDE.md hard rule | How this plan satisfies it | Where it is proved |
|---|---|---|
| Tokens first — no raw `rgba()`, `#hex`, `Npx` in component CSS | Every value the compact rules add is a `var(--sk-*)` reference or a `calc()` over them (the corpus's own idiom). `stylelint`'s `declaration-strict-value` polices `/color/`, `background`, `background-color`, `font-family`, `padding`, `margin`, `border-radius` (`stylelint.config.mjs:22-64`); C-001 additionally binds the properties stylelint does **not** police (`gap`, `min-block-size`, `min-inline-size`). | `npm run quality:all` (SC-010) + review against C-001 |
| One-directional dependency boundary | No new import crosses a package edge. The compact branch lives in the same two files that already exist under `packages/elements/src/site-footer/` and the same sheet under `packages/styles/src/site-footer/`. | `nx run-many --target=lint --all` (module boundaries) |
| Semantic pairing of surface/foreground tokens | The compact presentation sets **no** new ink. It reuses `.sk-site-footer__wordmark`, `__tagline`, `__legal`, `__link` verbatim, all of which already use semantic `--sk-fg-*` tokens. | `every ink meets AA in BOTH themes` (existing test, unchanged) |
| BEM naming `sk-block__element--modifier`, block prefix always `sk-` | New names: `.sk-site-footer--compact` (block modifier), `.sk-site-footer__row`, `.sk-site-footer__meta` (block elements), `.sk-site-footer__link--compact` (element modifier). No new block prefix (C-002). | `stylelint` `selector-class-pattern` |
| Conventional commits, lowercase subject, allowed scopes | Implementation commits use `feat(elements):` / `feat(styles):` / `test(elements):` / `chore(elements):`. The plan artifacts commit as `chore(spec):`, the anchored commitlint exemption verified in `commitlint.config.cjs`. `docs(spec)` / `docs(specs)` are **not** valid scopes and red `lint-code`. | `commitlint` on the PR |
| Every story has a `LightMode` variant wrapped in `class="sk-light"`, never `data-theme="light"` | Both new story sets ship a light-theme story with `class="sk-light"` (C-004). `expected-inert-theme-wrappers.json` is not touched: none is added, none is fixed. | `check-story-theme-wrapper.mjs` (+ `--selftest`) |
| Don't break the demo pages | `apps/demo/blog-demo.html` renders the **full** presentation. This change is purely additive to the full path, so the demo's markup and its relative paths are untouched. | `git diff` shows no `apps/demo/**` change; `smoke.spec.ts` |

**Charter Check result: PASS.** No violation requires justification, so the Complexity Tracking table
below is empty by design rather than unfilled.

---

# Part 1 — The public API shape (the mission's central decision)

The issue and the spec both delegate this choice to PLAN. It is decided here, with evidence.

## D-1 — Compact is a non-variant **AXIS**, not a `_VARIANTS` entry, and not a bare property

### What the generator actually emits, read from `scripts/build-element-markup.mjs`

The generator (`scripts/build-element-markup.mjs:371-380`) builds its emission set as:

```js
const forms = [
  [`Sk${comp}HTML`, {}],
  ...Object.keys(variantMap).map((v) => [`Sk${comp}${pascal(v)}HTML`, { variant: v }]),
  ...Object.entries(axes).map(([suffix, opts]) => [`Sk${comp}${suffix}HTML`, opts]),
];
```

and then emits **two** files per component:

* `packages/styles/src/<name>/sk-<name>.html` — **the base form only**: `call({}, 'the base form')`
  at line 362. A `_VARIANTS` key or an `_AXES` suffix **never** reaches this file.
* `packages/styles/src/<name>/index.ts` — one `export const <Name> = <JSON string>;` line per entry in
  `forms`, in that order (line 379).

So the two declarations differ in exactly one respect — **the options object the generator passes**:

| Declaration | Export name emitted | Call the generator makes |
|---|---|---|
| `SITE_FOOTER_VARIANTS = { compact: 'sk-site-footer--compact' }` | `SkSiteFooterCompactHTML` | `siteFooterStaticHtml({ variant: 'compact' })` |
| `SITE_FOOTER_AXES = { Compact: { presentation: 'compact' } }` | `SkSiteFooterCompactHTML` | `siteFooterStaticHtml({ presentation: 'compact' })` |

**The emitted export name is identical either way.** The choice is therefore about API semantics, not
about generated identifiers, and it must be argued on semantics.

### The decision, and why

**Compact is declared as an `_AXES` entry. `SITE_FOOTER_VARIANTS` stays `{}`.**

Three reasons, each grounded in this repository rather than in taste:

1. **Every `_VARIANTS` map in this repo is same-structure/different-modifier.** `PILL_TAG_VARIANTS`
   (colours), `FEATURE_CARD_VARIANTS` (border colours), `SECTION_BANNER_VARIANTS` (tones),
   `GRID_VARIANTS` (column counts), `RIBBON_CARD_VARIANTS` (border colours) all render the **same
   children** and swap one root modifier class. `sk-ribbon-card.markup.ts:37` states the discriminator
   in the repo's own words — *"Ribbon colour modifiers — an INNER class, so an axis rather than a
   variant"* — i.e. `_VARIANTS` is reserved for the thing the root class's own modifier expresses, and
   anything else is an axis. The compact presentation changes the **rendered structure**: no `<nav>`,
   no heading, no `<ul>`, no `<hr>`, a different box order. That is not a variant of the same tree.

2. **`sk-check-bullet` is the exact in-repo precedent, and it chose the axis.**
   `packages/elements/src/check-bullet/sk-check-bullet.markup.ts` keeps
   `CHECK_BULLET_VARIANTS = {}` (line 26) while declaring a structure-affecting, backward-compatible
   added presentation as `CHECK_BULLET_AXES = { Pending: { state: 'pending' } }` (line 46) — even
   though its modifier `sk-check-bullet--pending` **is** a root-block modifier. Its own option doc
   states the backward-compatibility contract this mission needs verbatim: *"Omit for the
   backward-compatible complete presentation"* (line 53). Following that precedent costs nothing and
   keeps the two components' shapes legible together.

3. **`variant` is a reserved word in the generator's contract, and spending it here forecloses a real
   future.** The generator hardwires the option key to `variant` for `_VARIANTS`, and the recipe fixes
   `<name>Classes(variant?)`'s failure policy as *warn-and-degrade to the base class* against
   `<name>StaticHtml`'s *throw* (`docs/contributing/adding-a-component.md:266-272`). Spending `variant`
   on a structural presentation would leave a genuine future colour/shape variant of the footer with
   nowhere to go, and would make the base-class degradation path mean "render a different anatomy",
   which it does not mean anywhere else in this repo.

**Alternative considered and rejected: a bare property with no `_AXES` entry.** That would leave the
compact presentation with **no generated static form at all** — the generator emits only what
`_VARIANTS`/`_AXES` declare. FR-008 and User Story 1 make the no-JavaScript static form the reason
this mission exists, so a shape that does not reach `index.ts` fails the mission's primary user story.
Rejected on that ground alone.

### What the generator will emit for this choice, by name

Declared:

```ts
export const SITE_FOOTER_VARIANTS = {} as const;                 // unchanged

export const SITE_FOOTER_AXES = {
  Compact:        { presentation: 'compact', links: PLACEHOLDER_COMPACT_LINKS },
  CompactNoLinks: { presentation: 'compact' },
} as const satisfies Record<string, SiteFooterStaticOptions>;
```

Emitted by `scripts/build-element-markup.mjs`, exactly:

| Artifact | What changes |
|---|---|
| `packages/styles/src/site-footer/sk-site-footer.html` | **Nothing.** The file is `call({}, 'the base form')` only. Byte-identical. |
| `packages/styles/src/site-footer/index.ts` — `export const SkSiteFooterHTML` | **Byte-identical.** Same `staticHtml({})` call, same full branch. |
| `packages/styles/src/site-footer/index.ts` — new line 2 | `export const SkSiteFooterCompactHTML = "…";` (compact, with placeholder links) |
| `packages/styles/src/site-footer/index.ts` — new line 3 | `export const SkSiteFooterCompactNoLinksHTML = "…";` (compact, zero links) |

The second axis is deliberate: it makes the **zero-links** case of FR-005 a *generated, `--check`-gated
artifact* rather than only a test fixture, so the "no empty `<ul>`/`<nav>`/heading" claim is proved by
committed output that CI regenerates, not by a hand-written string.

**Collision check (the generator's own guard, lines 394-404):** `SITE_FOOTER_VARIANTS` is empty, so
there is no `_VARIANTS` key that PascalCases onto `Compact` or `CompactNoLinks`. Both names pass the
identifier regex at line 407. No duplicate is possible.

## D-2 — What `siteFooterStaticHtml`'s options object gains

```ts
export interface SiteFooterStaticOptions {
  wordmark?: string;
  tagline?: string;
  headingOne?: string;    // full presentation only; ignored when presentation === 'compact'
  headingTwo?: string;    // full presentation only; ignored when presentation === 'compact'
  legal?: string;
  /** Which presentation to render. Omit for the full three-column footer. */
  presentation?: SiteFooterPresentation;          // NEW  — 'full' | 'compact'
  /** The compact presentation's links, in the consumer's own order. Ignored when full. */
  links?: readonly SiteFooterLink[];              // NEW
}

export interface SiteFooterLink {                 // NEW
  /** The link's visible text. The library authors none. */
  label: string;
  /** The link's destination. The library authors none. */
  href: string;
}
```

**`links` is deliberately NOT in `DEFAULTS`.** `siteFooterStaticHtml` merges `{ ...DEFAULTS, ...opts }`,
so anything in `DEFAULTS` reaches a consumer who omitted it. A default link would put a
library-authored label and destination into a consumer's real footer, which FR-010 and C-005 forbid.
The placeholder links live in the `_AXES` entry, where they reach only the generated demo artifact —
the same discipline `PLACEHOLDER_ITEMS` already uses for the full form. Consequence:
`siteFooterStaticHtml({ presentation: 'compact' })` renders **zero** links, which is exactly the
`CompactNoLinks` axis.

`DEFAULTS` gains **nothing**. `wordmark`, `tagline` and `legal` already carry demo placeholders and are
reused by the compact branch unchanged, so the generated compact artifact demonstrates its structure
with no new literal and no new year.

## D-3 — The element's public surface

**Exactly one new public reactive property, and one new slot.**

```ts
static properties = {
  wordmark:     { type: String, reflect: true },   // unchanged
  tagline:      { type: String, reflect: true },   // unchanged
  legal:        { type: String, reflect: true },   // unchanged
  headingOne:   { type: String, reflect: true },   // unchanged
  headingTwo:   { type: String, reflect: true },   // unchanged
  presentation: { type: String, reflect: true },   // NEW
};

/**
 * Which presentation to render. Omit for the full three-column footer; set `compact` for the
 * one-row footer. An unsupported value renders the full footer.
 */
declare presentation: 'full' | 'compact' | undefined;
```

```
@slot compact-links - the compact presentation's links, as native `<a>` elements
```

**Name and typing follow two measured in-repo precedents, not a guess.** `presentation` is already
this repository's word for "which presentation of this element", on **two** elements:
`sk-app-shell` publishes `'compact' | 'rail-preserving'` (asserted end-to-end at
`fixtures/vue-consumer/src/types.test-d.ts:45-50`, including a `@ts-expect-error` on `'wide'`), and
`sk-action-row` publishes `'presentation'?: 'flush' | undefined` with the doc *"Optional
container-owned presentation. Only `flush` is supported; invalid values use the bordered row"*
(`packages/elements/vue.d.ts:36-37`). Declaring a **string-literal union** rather than bare `string`
is what makes the generated React and Vue surfaces carry the vocabulary; declaring it bare would
silently publish `string`.

The two precedents differ on whether the default value is a member of the union — `sk-action-row`
omits it (`'flush' | undefined`), `sk-check-bullet` includes it (`'complete' | 'pending' | undefined`).
**This plan includes it** (`'full' | 'compact' | undefined`), following `sk-check-bullet`, because that
is the closer analogue: like check-bullet, the footer's presentations are a named record with a default
member (`SITE_FOOTER_PRESENTATIONS`), and letting a consumer write `presentation="full"` explicitly
costs nothing and reads better in a template that computes the value. Recorded so a reviewer sees the
alternative was weighed rather than missed.

**No hyphen in the property name.** `presentation` lowercases to `presentation`, which round-trips as a
JS key — the constraint `sk-site-footer.ts:36-41` records this repo paying for twice
(`column-one-heading` → `headingOne`, `thumbnailAlt` → `alt`, `ribbonColour` → `accent`). The slot name
keeps its hyphen, because a slot name is a string and not a property key (the element's own docblock
already records that distinction).

**No new `::part()`.** Adding one costs an `expected-parts.json` entry, a `total` bump, and a same-PR
literal `::part(<name>)` case, and `check-part-ratchet.mjs:68-72` rejects an unlisted part outright.
Nothing in FR-001…FR-013 or NFR-001…NFR-011 requires a new part: the compact presentation reuses
`part="footer"` and `part="legal"`, and renders neither `part="grid"` nor `part="divider"`. A part is
published API under ADR-9 §2 ("Adding a part is an API addition; removing or renaming one is a breaking
change") and should be added when a consumer needs one, not speculatively. **Decision: none is added.**

## D-4 — The compact anatomy, and the Terms-anchor problem

### The defect, restated exactly

`legal` is bound through `text()` (`sk-site-footer.markup.ts:71-72`) in the static path and as a Lit
text binding in the element path. Both escape `<` to `&lt;`. A consumer who writes
`legal="© 2026 Example · <a href='/terms/'>Terms</a>"` gets the literal characters on screen. There is
no property on the component today that can carry a live anchor, and there must not be one that carries
raw markup — that is the injection hole.

### What the corpus actually repeats

Read directly from `ux_redesign/families/06-account-front-door/screens/` (23 of the 24 screens carry a
byte-identical footer; `P24-password-maintenance-dark.html` carries none, which matches the issue):

```html
<footer class="pagefoot"><div class="container row-between">
  <div>
    <p class="footer-name">Spec-driven development, made visible.</p>
    <p>Free private beta &middot; © Spec Kitty 2026</p>
  </div>
  <a class="text-link" href="/terms/">Terms</a>
</div></footer>
```

`.row-between` is `display:flex; align-items:center; justify-content:space-between; gap:…`, and its one
breakpoint is `@media(max-width:600px){ .pagefoot .row-between{align-items:flex-start} }` over a base
`flex-wrap:wrap`.

**There is no `<nav>`, no heading, no `<ul>`, and no `<li>` anywhere in it.** The Terms link is a bare
`<a>` **sibling** of the text block — not nested inside the legal line. The legal line contains the
year as ordinary consumer text. **Repository/corpus wins over the spec's Key Entities wording**, which
describes the corpus's `.footer-name` as a wordmark plus a descriptive line: the corpus has one
brand-ish `<p>` and no wordmark node. The design below satisfies the spec's FR-002 (a brand/tagline
block) **and** the corpus, by rendering the wordmark only when the consumer supplies one — the corpus
consumer simply omits `wordmark` and gets the corpus anatomy exactly.

### The shape

```html
<footer part="footer" class="sk-site-footer sk-site-footer--compact">
  <div class="sk-site-footer__row">
    <div class="sk-site-footer__meta">
      <div class="sk-site-footer__brand">                       <!-- only when wordmark is set -->
        <span class="sk-site-footer__wordmark">…</span>
      </div>
      <p class="sk-site-footer__tagline">…</p>                  <!-- only when tagline is set -->
      <p part="legal" class="sk-site-footer__legal">…</p>       <!-- only when legal is non-blank -->
    </div>
    <slot name="compact-links"></slot>                          <!-- element path -->
  </div>
</footer>
```

The static path emits the identical tree with the slot replaced by the consumer's links:

```html
<a class="sk-site-footer__link sk-site-footer__link--compact" href="…">…</a>
```

### How a consumer supplies zero, one, or several Terms-style links

**Element path** — the consumer writes real DOM. Nothing is parsed, nothing is interpolated, nothing is
escaped, because no string ever carries markup:

```html
<sk-site-footer presentation="compact" tagline="…" legal="© 2026 Example · Free private beta">
  <a slot="compact-links" class="sk-site-footer__link sk-site-footer__link--compact"
     href="/terms/">Terms</a>
</sk-site-footer>
```

Zero links: omit the children. Several: write several, in the order wanted; DOM order is render order
and focus order.

**Static path** — the consumer passes structured values, and the module escapes them at the only two
boundaries that exist:

```ts
siteFooterStaticHtml({
  presentation: 'compact',
  legal: '© 2026 Example · Free private beta',
  links: [{ label: 'Terms', href: '/terms/' }],
});
```

`label` goes through `text()`; `href` goes through `attr()` (which is `text()` plus the quote
characters, `sk-site-footer.markup.ts:73`). **No markup-bearing string is ever accepted**, so there is
no injection hole: a consumer cannot smuggle a tag through `label`, and cannot break out of the
attribute through `href`. The library supplies no label, no destination, no count, no `rel`, no
`target`, and no year.

### The #77 ruling — where this sits, stated as a decision

The operator's #77 ruling, recorded in `sk-site-footer.markup.ts:9-15`, has three clauses. Two are
preserved **unchanged** and are the load-bearing ones:

* *the element owns the whole structure* — it does, in both presentations; the `<footer>`, the row, the
  meta block and the boxes are all the element's;
* *content arrives as PROPERTIES* — the brand, tagline and legal line are properties, and structured
  data stays off the attribute boundary (`links` is a build-time TypeScript argument to a static
  helper, never an attribute, so the React `ssrSafe` string-only constraint the ruling reasons from is
  untouched).

The third clause is *"only the link LISTS are slotted, as `<li>` elements directly inside the
element-owned `<ul>`"*.

> **[DECISION D-4a] The compact link region is not a list, so the ruling's list clause has no subject
> here, and the compact presentation slots bare `<a>` elements rather than `<li>` elements. This is
> named as an extension of #77 rather than taken silently.**
>
> **Evidence**: the anatomy #77 governs is the full presentation's two headed navigation columns, each
> genuinely a list. The compact region the corpus repeats 23 times is one inline anchor beside a meta
> line — no `<ul>`, no `<li>`, no heading, no landmark (verified above against the corpus HTML).
>
> **Why it matters technically, not just aesthetically**: wrapping one-to-three inline links in an
> element-owned `<ul>` re-creates the exact defect FR-005 exists to forbid. The element cannot know
> synchronously whether a slot has assigned nodes, and this component's own source
> (`sk-site-footer.ts:70-74`) records a lens's measurement of what deriving structure from
> `slotchange` costs: *"`updateComplete` resolved `true` while the tree was still going to change."*
> Keeping the `<ul>` therefore forces either that measured defect back into the component, or a
> redundant second property whose only job is to say "I have links". Slotting the anchors directly
> makes zero-links render **nothing**, with no predicate at all.
>
> **What is preserved**: the anchors are still *directly assigned* nodes, which is the property #77's
> reasoning turned on. Nothing about structured data on an attribute boundary changes.
>
> **If the operator reads this clause as binding on any link region**, the fallback is L1 below; it is
> recorded so the alternative is costed rather than merely mentioned. This is flagged in the report to
> the mission lead as the one place the ruling is extended.

**Rejected alternative L1 (literal `<ul>`/`<li>` compliance).** Element-owned
`<nav aria-label="{linksLabel}"><ul><slot name="compact-links"></slot></ul></nav>`, gated on a second
new property `linksLabel`. Rejected because it (a) adds a second public property and therefore a second
`expected-docs.json` count change, (b) adds a landmark and a label the corpus does not have, (c) leaves
a defined-but-bad degenerate state (`linksLabel` set, zero items → a labelled empty list), and (d) buys
nothing FR-004 asks for. Cost recorded; not chosen.

## D-5 — No empty landmarks, in both paths

**Mechanism: there is nothing to be empty.** The compact presentation renders **no** `<nav>`, **no**
heading, and **no** `<ul>` under any input. The link region is a bare `<slot>` in the element path (a
slot with no assigned nodes and no fallback content contributes nothing to the accessibility tree and
paints nothing) and an empty string in the static path. This is a structural guarantee, not a
conditional — it cannot regress by a property being set wrongly.

The three conditionals that do exist are all property-driven and read synchronously during `render()`,
which is the discipline `sk-site-footer.ts:70-74` already establishes and which the spec's Edge Cases
section already blesses:

| Node | Rendered when | Same rule in the static path? |
|---|---|---|
| `.sk-site-footer__brand` + `__wordmark` | `wordmark` is set | yes |
| `.sk-site-footer__tagline` | `tagline` is set | yes |
| `[part="legal"]` | `(legal ?? '').trim()` is non-empty | yes |
| `<hr part="divider">` | **never, in compact** | yes — never |

The divider is not merely conditional in compact; it does not exist. US1 acceptance scenario 2 ("any
divider that exists solely to separate the legal line is also omitted") is therefore satisfied
structurally, and asserted as an absence.

**How it is asserted** (all in `fixtures/elements-behaviour/src/sk-site-footer.test.ts`, extended in
place):

* `compact renders no landmark, no heading and no list — at zero, one and several links`:
  for each of the three cases, over **both** the element's shadow tree **and** the static string
  parsed into a document: `querySelectorAll('nav, ul, ol, li, h1, h2, h3, h4, h5, h6, hr').length === 0`.
* `compact draws no divider, with or without a legal line`: `partOf(el, 'divider') === null` in both.
* Accessibility-tree confirmation is the axe pass over the required compact stories (SC-006/NFR-004),
  where a story that fails to load counts as a violation rather than a pass.

## D-6 — Element ↔ static equivalence

**The assertion, named**: a new case in `fixtures/elements-behaviour/src/sk-site-footer.test.ts` called
**`[FR-007] the compact element and the compact static form are the same component`**.

It runs in Vitest **browser mode on the Playwright provider** — one engine, one page, one layout pass,
which is exactly ADR-15's *"equivalence is a within-engine property, and any gate must compare
shadow-vs-static inside one engine and never against a literal transcribed from this record"*.

For each of three fixtures (zero links, one link, three links), with identical `wordmark`/`tagline`/
`legal`/link content, at a fixed container width, with `installTokenSheet()` and
`adoptSheetIntoDocument()` already available in the file:

1. **Semantic structure.** Serialise both trees to a normalised signature —
   `tagName + sorted class list + part attribute`, depth-first, with the element path's `<slot>`
   replaced by its `assignedElements()` (the flat tree). Assert the two signatures are `toEqual`.
   This is not a shadow-DOM snapshot comparison of the kind ADR-11 rules out: it is a derived,
   cross-path equality between two renderings of one component, not a golden file.
2. **Computed presentation.** For every corresponding node pair in that walk, compare
   `getBoundingClientRect()` width/height/x/y **relative to each root**, and the computed
   `display`, `flex-direction`, `justify-content` and `align-items` of the row. Compare the two
   measured values against each other — never against a number written in this plan.
3. **Landmark absence** in both, per D-5.

Both paths work with no JavaScript on the static side by construction (the static side is a string of
HTML plus the document-loaded sheet), and User Story 1's independent test is additionally covered by
the styles-layer Storybook stories, which render `SkSiteFooterCompactHTML` with no element script.

## D-7 — No clock

`C-006` and the module's own header (`sk-site-footer.markup.ts:42-49`) forbid any generated or
render-time year. The compact branch:

* derives nothing from `Date`, and adds no `Date` reference to either file;
* adds **nothing** to `DEFAULTS`, so no new placeholder can carry a year;
* renders `legal` as consumer-supplied text, verbatim, with no parsing, validation or transformation —
  a consumer's "© 2026" or "© 2030" is text, and the library never inspects it;
* emits placeholder link labels and `href`s in the `_AXES` entry that contain **no** digits at all
  (labels are word-only; `href` is `#`).

**How it is asserted.** The existing test `the generated form does not read the clock` currently checks
`PLACEHOLDER_LEGAL` and `siteFooterStaticHtml()` — the base form only. It is **extended in place** to
cover every form the generator emits:

```
for (const form of [siteFooterStaticHtml(), ...Object.values(SITE_FOOTER_AXES).map(siteFooterStaticHtml)])
  expect(form, 'no four-digit year may reach any generated markup').not.toMatch(/\d{4}/);
```

Deriving the list from `SITE_FOOTER_AXES` rather than typing it out is the point: a future axis is
covered without anyone remembering to add it — the same "derive, do not restate" discipline
`adding-a-component.md:234-238` requires of vocabulary assertions.

## D-8 — Responsive stacking, and the #309/#310 question

**Mechanism: a plain `@media` breakpoint, reusing the sheet's existing 640px figure. No
`container-type`, no `@container`, no `:host([attr])` selector anywhere.**

The compact modifier is applied as an **ordinary root-block BEM class**, by both paths, from one shared
helper in the markup module:

```ts
export function siteFooterClasses(presentation?: string): string {
  return ['sk-site-footer', siteFooterPresentation(presentation).modifier].filter(Boolean).join(' ');
}
```

The element writes `class=${siteFooterClasses(this.presentation)}` on its own `<footer>`; the static
form writes the same string. So every compact rule is a **bare class selector** that matches identically
in a shadow root and in a document. That is precisely the idiom the existing sheet already uses — it
contains no `:host([attr])` rule at all today — and it is the idiom `sk-check-bullet` uses for its own
added presentation.

**Does this trigger #309/#310? No, and the reason is stated three ways so it cannot be misread:**

1. **ADR-15's rows 1 and 2 are about a host-owned container.** Row 1 is *"a host-attribute variant axis
   **inside a host-owned `@container`**"* and the ADR calls the qualifier binding. Row 2 is
   *"host-owned `container-type`"*. `packages/styles/src/site-footer/sk-site-footer.css` declares
   `container-type` **nowhere**; its only `:host` rule is `display: block`, which the recipe's table
   (`adding-a-component.md:67`) records as the one case where the host/root collapse holds.
2. **ADR-15 names the exempt population explicitly.** *"A host-attribute axis in a sheet with no
   `container-type` is a different thing and is **not** ruled on here … the collapsed transform is
   sound for them"*, and the recipe repeats it at line 92-95: *"A host-attribute axis in a sheet with
   no container … collapses onto the root class perfectly safely, and adding a wrapper there would be
   an unmeasured layout change for no reason."* `sk-site-footer` is not among the four sheets that
   carry `container-type` (`sk-app-shell`, `sk-action-row`, `sk-copy-field`, `sk-page-header`).
3. **This plan does not even use the host-attribute form.** It writes no `:host([presentation])`
   selector of any kind — not the descendant form, not the bare form, not `:host(:is(…))`. The
   recipe's row 4 hazard (`adding-a-component.md:70`, the four `:host(...)` shapes #309 owns) is
   therefore not reachable. There is nothing for a static rewrite to get wrong, because there is no
   host-scoped rule to rewrite.

**Conclusion for C-010: the conditional dependency on #309 and #310 does NOT fire.** No dependency is
recorded, and no unguarded static/shadow divergence is hand-authored. This is the shape C-010 names as
the one that "avoids the dependency", chosen deliberately for that reason.

**The threshold.** The compact row stacks at the sheet's **existing** `@media (max-width: 640px)`
block:

```css
@media (max-width: 640px) {
  .sk-site-footer__grid { grid-template-columns: 1fr; gap: var(--sk-space-8); }   /* unchanged */
  .sk-site-footer__row  { flex-direction: column; align-items: flex-start; }      /* added */
}
```

**No new documented threshold is introduced**, which is why ADR-11 item 11 / SC-017 is **not** newly
declared for this component — see D-12 for the reasoning and the honest statement of the judgement.
NFR-011 is still discharged: the live transition is asserted at 639px/641px in Playwright.

**RTL (FR-013).** Stacking uses flex direction and `align-items`, both writing-mode aware. The compact
rules author no `left`/`right`, no `margin-left`/`margin-right`, no `text-align`, and no physical
offset of any kind. `justify-content: space-between` mirrors automatically under `dir="rtl"`. The
padding shorthand's two values are vertical/horizontal and are direction-agnostic.

## D-9 — Forced colours and reduced motion

Both are answered by the same decision: **the compact presentation authors no `background`, no
`box-shadow`, no `transition`, no `animation`, and no `color` declaration at all.** It is layout only.

| Recipe rule (`adding-a-component.md:150-203`) | Consequence here |
|---|---|
| A plain `border` survives `forced-colors: active` with **zero** author CSS | `.sk-site-footer { border-top: 1px solid var(--sk-border-default) }` already exists and is untouched. NFR-003's "with zero authored CSS beyond what already exists" is satisfied by adding nothing. |
| `background` / `box-shadow` do **not** survive | Neither is authored by any compact rule. |
| `<a>` recolors to `LinkText` intrinsically | The compact links are native `<a>`; their underline is drawn with `text-decoration-*` (already in the sheet), not a background, so it survives. |
| Use `outline` for focus rings, never `box-shadow` | No focus ring is authored at all — see below. |
| Use LONGHAND `-color` properties, and add any system-color keyword to `stylelint.config.mjs`'s `ignoreValues` | **No system-color keyword is used, so `stylelint.config.mjs` needs no change.** Stated either way, as required. For the record, `ignoreValues` already carries `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `LinkText`, `GrayText` (`stylelint.config.mjs:22-64`). |
| Reduced motion: `@media (prefers-reduced-motion: reduce)` scoped to the exact selector and the exact transitioning property | **The compact presentation adds no transitioning property, so the obligation does not fire.** |

> **[DECISION D-9a] No focus-ring CSS is authored, and no reduced-motion guard is added to the
> pre-existing `.sk-site-footer__link` transition.**
>
> Both would reach the **frozen** full presentation, because `.sk-site-footer__link` is shared by both
> presentations and its anchors live in the light DOM in both. FR-009 and US4 require the existing
> contract's behaviour and visual baselines to be unchanged, and NFR-008 makes that a gated claim.
> The compact links therefore keep the UA's own `:focus-visible` ring, which is visible, is preserved
> and remapped under forced-colors exactly as `border`/`outline` are, and is what the full
> presentation ships today — so the two presentations stay consistent.
>
> This is recorded as a decision, not an omission. NFR-006 and NFR-003 are discharged by **asserting**
> the UA indicator rather than by authoring one: the Playwright specs assert
> `getComputedStyle(link).outlineStyle !== 'none'` on focus under both normal and `forced-colors:
> active`, and assert that no ancestor of a focused compact link sets `overflow: hidden` or a fixed
> block size that could clip it. An authored focus ring for `.sk-site-footer__link` — which would
> improve both presentations — is a separate, deliberate change to a frozen contract and belongs in
> its own issue, not smuggled into a backward-compatible extension.

**Target size (NFR-002, 44 CSS px in both dimensions at 390px).** This is the one place the compact
presentation needs a rule that reaches the anchors, and the anchors are light-DOM nodes in **both**
paths. A descendant selector from the sheet (`.sk-site-footer--compact .sk-site-footer__link`) would
match in the static path and **not** in the element path, where the root class sits inside the shadow
root and the anchor does not descend from it — a real element/static divergence and an NFR-007 failure.
The answer is the trade #77 already named: a **light-DOM class on the anchor**, which the sheet reaches
identically from the document in both paths.

```css
/* Layout only. NO `color:` — see the derived coloured-leaf check in the AA test. */
.sk-site-footer__link--compact {
  display: inline-flex;
  align-items: center;
  min-block-size: calc(var(--sk-space-8) + var(--sk-space-1));   /* 40 + 4 = 44px */
  min-inline-size: calc(var(--sk-space-8) + var(--sk-space-1));
  padding-inline: var(--sk-space-2);
}
```

The `calc()` idiom is the corpus's own (`.text-link` uses `calc(var(--sk-space-8) + var(--sk-space-1))`),
and `--sk-space-8: 2.5rem /* 40px */` + `--sk-space-1: 0.25rem /* 4px */` = 44px, read from
`packages/tokens/src/tokens.css:234-241`. **The implementer must re-verify that arithmetic against the
token file at implementation time and against the computed box in Playwright — not against this
paragraph.** Consumers write both classes (`sk-site-footer__link sk-site-footer__link--compact`); the
static helper emits both automatically; every story shows both.

> **Hard constraint for the implementer**: none of `.sk-site-footer--compact`,
> `.sk-site-footer__row`, `.sk-site-footer__meta`, `.sk-site-footer__link--compact`, nor the added
> line inside the `@media (max-width: 640px)` block may contain a `color:` declaration. The existing
> AA test derives the set of coloured leaves by scanning `skSiteFooterSheet.cssRules` for `color:` and
> extracting `\.sk-site-footer__([a-z-]+)` (`sk-site-footer.test.ts:190-200`); a `color:` on any new
> element name — or anywhere inside a media block that also names one — makes that test demand a
> measurement case for a leaf that has no distinct ink. Keeping the compact rules colour-free means
> the existing AA test passes untouched, which is itself part of the backward-compatibility proof.

## D-10 — Backward compatibility, and the gate that proves it

FR-009/US4/NFR-008 are a hard requirement. Each guarantee below is structural, and each names its gate.

| What must not change | Why it cannot | Gate that proves it |
|---|---|---|
| `packages/styles/src/site-footer/sk-site-footer.html` | The generator writes only `call({}, 'the base form')` into it (`build-element-markup.mjs:362`). Axes never reach it, and the full branch of `siteFooterStaticHtml` is not edited. | `node scripts/build-element-markup.mjs --check` — byte comparison; **expect zero diff on this file** |
| `SkSiteFooterHTML` in `packages/styles/src/index.ts` | Same base call, same full branch. The two new exports are appended after it, in `forms` order. | Same `--check`; plus `git diff` on `index.ts` must be **additive only** |
| The full presentation's shadow tree, classes and parts | `render()` returns the **existing template literal, unedited**, on the `full` branch. The compact branch is a separate private method. Nothing in `#column()` or the full path is touched. | Existing tests `text is a PROPERTY and the link items are SLOTTED`, `the divider is drawn only when there is a legal line to divide`, `[SC-013]`, `[SC-014]`, `every ink meets AA in BOTH themes` — all unchanged and all must still pass |
| The full presentation's stories and their ids | `Default`, `WithoutLegal`, `LightMode` (elements) and `Default`, `LightMode` (styles) keep their export names, their render functions and their wrappers. New stories are new exports. | `expected-stories.json` (shrink-only, existing ids still declared) + `run-axe-storybook.js` |
| The full presentation's **pixels** | No existing CSS rule is edited. Every added rule is scoped to a class the full presentation never carries (`--compact`, `__row`, `__meta`, `__link--compact`), and the one line added inside the existing 640px block targets `.sk-site-footer__row`, which the full presentation does not render. | **CI's `visual-regression` job / the `visual-regression-diffs` artifact** — the authoritative gate for NFR-008. Baselines are CI-authoritative (`adding-a-component.md:466-469`); **never** run a local `--update-snapshots` |
| `custom-elements.json`'s existing `sk-site-footer` members | Only additions: one attribute, one property, one slot. No member is renamed or removed. | `git diff --exit-code -- packages/elements/custom-elements.json` after `nx run elements:analyze`, plus `check-manifest-content.mjs`'s exact-equality row |
| `packages/react/src/SkSiteFooter.{js,d.ts}` and `packages/elements/vue.d.ts` | Regenerated from the manifest; gain one prop each. Existing props unchanged. | `build-react-wrappers.mjs --check`, `build-vue-types.mjs --check` |

One additional, cheap, *new* assertion is added so this claim is held by a test and not only by review:
**`[FR-009] the full presentation's static form is untouched by the compact branch`** — asserts
`siteFooterStaticHtml()` contains exactly two `<nav`, exactly one `<hr`, and **does not contain** the
string `sk-site-footer--compact`. It reds immediately if the compact branch ever leaks into the base
form.

**The mixed-property case (spec Edge Case).** Structurally answered rather than left undefined: when
`presentation === 'compact'`, the element renders neither `<nav>`, so `headingOne`/`headingTwo` are not
read and nodes assigned to `column-one`/`column-two` have no slot to land in and are not displayed.
Symmetrically, `links`/`compact-links` are not read in the full presentation. Both directions are
pinned by a test case, `compact ignores the full presentation's headings and column slots, and vice
versa`.

## D-11 — Exact file inventory

**Authored (hand-edited by the implementer):**

| Path | New/Modified | Owner / what enforces it |
|---|---|---|
| `packages/elements/src/site-footer/sk-site-footer.markup.ts` | Modified | Authored source (ADR-10 §3, CLAUDE.md §2). Drives `build-element-markup.mjs`. Must stay leaf-safe (C-008) — it adds **no import**. |
| `packages/elements/src/site-footer/sk-site-footer.ts` | Modified | Authored element. `check-no-css-in-source.mjs`, `check-manifest-content.mjs` (every new public member needs a consumer-facing `/** */`, C-009), `check-elements-entries.mjs` |
| `packages/styles/src/site-footer/sk-site-footer.css` | Modified | CSS source of record (the only file stylelint's `--sk-*` rule can see). `stylelint`, `check-element-css-hygiene.mjs`, `check-adopted-css-boundaries.mjs` |
| `packages/elements/src/site-footer/sk-site-footer.stories.ts` | Modified — 7 new exports | `run-axe-storybook.js`, `check-story-theme-wrapper.mjs`, CI `visual-regression` |
| `packages/styles/src/site-footer/sk-site-footer.stories.ts` | Modified — 2 new exports | same |
| `fixtures/elements-behaviour/src/sk-site-footer.test.ts` | Modified **in place** | `npm run test`, `suite-selftest.mjs`. Extended, never replaced (SC-011). Deliberately **not** a new fixture file — see the Risks table on `suite-budget.json` |
| `apps/storybook/src/tests/sk-site-footer-compact.spec.ts` | **New** | Playwright: overflow, target size, narrow stack at the live threshold, RTL, keyboard order |
| `apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts` | **New** | Playwright, following the repo's own naming convention (`sk-copy-field-forced-colors.spec.ts`, `sk-notice-forced-colors.spec.ts`) |
| `fixtures/vue-consumer/src/types.test-d.ts` | Modified — 2 lines | Proves the generated Vue types carry the literal union, mirroring the existing `sk-app-shell` lines 45-50. `typecheck-all.mjs` |
| `expected-docs.json` | Modified | `check-manifest-content.mjs` — **exact** equality |
| `expected-stories.json` | Modified | `run-axe-storybook.js` — shrink-only, plus an internal `declared.length === total` consistency check |

**Generated (never hand-edited; regenerated and committed — C-007):**

| Path | Generator | Expected change |
|---|---|---|
| `packages/elements/src/site-footer/sk-site-footer.css.js` | `scripts/build-elements-css.mjs` | the new rules, inlined into the constructed sheet |
| `packages/elements/src/site-footer/sk-site-footer.css.d.ts` | same | none |
| `packages/styles/src/site-footer/sk-site-footer.html` | `scripts/build-element-markup.mjs` | **none — byte-identical** |
| `packages/styles/src/site-footer/index.ts` | same | **two appended export lines**; the existing line unchanged |
| `packages/elements/custom-elements.json` | `npx nx run elements:analyze` (+ `normalise-manifest.mjs`) | one attribute, one slot, one member on the existing declaration |
| `packages/react/src/SkSiteFooter.js` and `SkSiteFooter.d.ts` | `scripts/build-react-wrappers.mjs` | one prop. **Note: the wrapper is flat (`packages/react/src/SkSiteFooter.*`), not `packages/react/src/site-footer/**` as the mission brief and the spec's SC-004 state. The repository wins — verified by `ls packages/react/src/ \| grep -i footer`.** |
| `packages/elements/vue.d.ts` | `scripts/build-vue-types.mjs` | one prop in the `'sk-site-footer'` block (currently `vue.d.ts:723-734`) |
| `packages/elements/SIZES.md` | `scripts/measure-elements-sizes.mjs` | new byte figures + a new SRI hash. **`measure-elements-sizes.mjs` READS `packages/elements/dist/` and does NOT build it** — run `npx nx run-many --target=build --projects=tokens,styles,elements` first or it records the bytes of a stale `dist/`. |

**Ratchet files NOT touched, and why** — see D-12.

**Files this mission must not touch**: `docs/architecture/decisions/**` (the run prompt forbids writing
an ADR outside #67), `docs/architecture/validation/**`, `docs/learnings/**`, `apps/demo/**`,
`ux_redesign/**` (read-only corpus), and the sibling mission checkouts `../353` and `../355`.

## D-12 — Ratchet obligations, re-derived against the actual API choice

Every number below was read from the file in this checkout, not carried over from the spec's first pass.

| Ratchet file | Obliged? | Exact change | Gate | Evidence |
|---|---|---|---|---|
| `expected-docs.json` | **YES** | `sk-site-footer.attributes` **5 → 6**; top-level `total` **133 → 134**. `properties` stays `0`, `methods` stays `0`. | `scripts/check-manifest-content.mjs` — **exact equality per element and on the global total** | Current row is `expected-docs.json:173-177` (`5/0/0`); `total: 133` at line 46. `presentation` is a reflected String property, so the analyzer lists it in `decl.attributes[]` like the other five. `properties` counts only members stamped `x-spec-kitty-property-only` (i.e. `attribute: false`), which `presentation` is not. `methods` counts public methods; the compact branch adds only `#private` ones, which the gate excludes. **A new `@slot` affects this file not at all** — `check-manifest-content.mjs` never reads `decl.slots`. `presentation` must carry a non-empty consumer-facing description or the gate fails on `attr.description`. |
| `expected-parts.json` | **NO** | none | `scripts/check-part-ratchet.mjs` | D-3 adds no `::part()`. The current entry is `["divider","footer","grid","legal"]` (`expected-parts.json:205-210`), `total: 141`. Per-element the gate is **closed**, not shrink-only: any manifest part not listed fails immediately, so this stays untouched only because no part is added. The existing `[SC-013]` test keeps its `expect(cases.length).toBe(4)` assertion unchanged. |
| `behaviours.json` | **NO** | none | `suite-selftest.mjs` guard 7 (exact, bidirectional set match on `(SC-id, subject-file)` pairs) | `sk-site-footer` is already a declared subject for **SC-013** (`behaviours.json:564-566`) and **SC-014** (`:677-679`), both pointing at the same fixture file this mission extends. Adding test cases to an already-declared subject creates **no** new pair. No new SC id is claimed — see the SC-017 note below. |
| `mutations.json` | **NO** | none | `suite-selftest.mjs` guards 7 and 9 | The three existing `sk-site-footer` arms (`mutations.json:641-659`) still red-first correctly: the SC-013 arm strips `part="divider"` from the element source and the two SC-014 arms empty/replace `static styles = [sheet];`, none of which this plan edits. A new `::part()` would have obliged nothing here either (SC-013's obligation is per-element, not per-part) — the per-part obligation lives entirely in `expected-parts.json`. |
| `expected-stories.json` | **YES** | Add the new element-layer ids to `byElement["sk-site-footer"]` (currently 2 ids, `:488-491`) and add a **new** key `"sk-site-footer (static path)"` for the styles-layer ids, following the existing `"sk-card (static path)"` precedent (`:176`). Raise `total` (currently `505`, `:660`) by the number of ids added. | `scripts/run-axe-storybook.js` — shrink-only on growth, **but** it also asserts `declared.length === expected.total`, so the total must move with the list | The file's own `$comment` (`:32`) states the governing principle: *"THE SCOPE IS THE ELEMENTS, PLUS ANY STORY A MISSION HAS NAMED AS ACCEPTANCE EVIDENCE … a story cited as proof is ratcheted in the same commit that cites it."* SC-006 names the compact stories as acceptance evidence, including the static ones, so both layers are ratcheted here. |
| `expected-inert-theme-wrappers.json` | **NO** | none | `scripts/check-story-theme-wrapper.mjs` (+ `--selftest`) | `count: 2`, and the file names no `sk-site-footer` entry — the component already writes `class="sk-light"` correctly. This mission adds none (C-004) and fixes none, so the count must **not** move; the gate fails in both directions. |

**Story ids — derivation, not transcription.** Storybook derives an id from `meta.title` plus the
kebab-cased export name: `Elements/SkSiteFooter` → `elements-sksitefooter--<export>`, and
`Components/SiteFooter (HTML)` → `components-sitefooter-html--<export>` (compare the in-file precedent
`components-sksegmentedchoice-html--default`, `expected-stories.json:597`). **The implementer must read
the exact ids out of `apps/storybook/storybook-static/index.json` after the Storybook build and paste
those**, not hand-derive them from this paragraph. `run-axe-storybook.js` reads the same file
(`loadStoryManifest()`), so a mismatch fails by name.

**Planned story set** (nine stories; the narrow-viewport, zoom and forced-colors cases are Playwright
*conditions* over these stories, not additional stories):

| Layer / file | Export | Covers |
|---|---|---|
| elements | `Compact` | Family 6 one-link shape, default dark, consumer-supplied year in `legal` |
| elements | `CompactNoLinks` | FR-005 zero links |
| elements | `CompactSeveralLinks` | FR-004 several links, consumer order |
| elements | `CompactWithoutLegal` | no legal line, no divider |
| elements | `CompactLongContent` | NFR-001 / FR-011 max-length localized strings |
| elements | `CompactRtl` | FR-013, `dir="rtl"` ancestor |
| elements | `CompactLightMode` | C-004 / NFR-005, `class="sk-light"` |
| styles | `Compact` | FR-008 no-JavaScript static form, rendered from `SkSiteFooterCompactHTML` |
| styles | `CompactLightMode` | C-004 on the static path |

## D-13 — `.github/workflows/ci-quality.yml` path filters: the finding

**Finding: no filter change is required by this mission, and none should be made. The filter does have
a real gap, and it is named here rather than left to be discovered.**

The only path-filtered job is `changes` (dorny/paths-filter, `ci-quality.yml:48-121`). Its `components`
filter (`:65-110`) lists, among others: `expected-stories.json`, `expected-parts.json`,
`behaviours.json`, `mutations.json`, `mutations.selftest.json`, `suite-budget.json`, `packages/**`,
`apps/storybook/**`, `fixtures/**`, `scripts/**`, `playwright.config.ts`.

| Path this mission touches | Matched by | Verdict |
|---|---|---|
| `packages/elements/src/site-footer/**` | `packages/**` | covered |
| `packages/styles/src/site-footer/**` | `packages/**` | covered |
| `packages/react/src/SkSiteFooter.*`, `packages/elements/vue.d.ts`, `packages/elements/SIZES.md`, `packages/elements/custom-elements.json` | `packages/**` | covered |
| `fixtures/elements-behaviour/**`, `fixtures/vue-consumer/**` | `fixtures/**` | covered |
| `apps/storybook/src/tests/**` | `apps/storybook/**` | covered |
| `expected-stories.json` | listed explicitly | covered |
| **`expected-docs.json`** | **nothing** | **not in any filter branch** |

`expected-docs.json` (and `expected-inert-theme-wrappers.json`) appear nowhere in the workflow's filter
block. A PR touching **only** one of them would compute `components == 'false'` and skip
`storybook-build` and its dependents (`a11y`, `visual-regression`, `playwright`, `lighthouse`).

**Why this is not a live gap for this mission, and why the filter must not be edited here:**

1. The gates that actually read those two files — `check-manifest-content.mjs` and
   `check-story-theme-wrapper.mjs` — run inside `lint-code`, which carries **no** `needs:` and **no**
   `if:` and therefore runs unconditionally on every PR. The ratchets are never bypassed.
2. This mission's diff always co-touches `packages/elements/src/site-footer/**`, so `components` is
   `true` regardless.
3. A `paths-filter` entry is evaluated against the **PR head ref**, so a filter entry a PR adds cannot
   be evidenced by that same PR's own run — the change would be unprovable in the PR that makes it.
4. C-012 binds this mission to one bounded Work Package. Widening a shared CI filter is a different
   change with a different blast radius.

**Recommended follow-up (not this mission):** file a `[ci]` issue to add `expected-docs.json` and
`expected-inert-theme-wrappers.json` to the `components` filter, with a probe branch that changes only
one of them. Recorded here so the finding is not lost.

## D-14 — Work-package shape: exactly one WP, one PR

The issue and C-012 mandate it. It also happens to be structurally correct, and the seam is named
rather than denied.

**The seam that exists.** The Playwright accessibility/axis specs (`sk-site-footer-compact.spec.ts`,
`sk-site-footer-compact-forced-colors.spec.ts`) are the one part of the change with no compile-time
dependency on the rest.

**Why it still cannot split.** The gates are computed over the whole tree in one run, and three of them
are *same-commit* obligations by construction:

* `check-manifest-content.mjs` compares `expected-docs.json` to the **committed** manifest with exact
  equality. The moment `presentation` lands in `custom-elements.json`, the row must already say `6` —
  so the element change, the manifest regeneration and the ratchet edit are one commit or CI is red.
* `run-axe-storybook.js` asserts every id declared in `expected-stories.json` is present in the
  **built** Storybook. Declaring an id before the story exists reds; shipping the story without
  declaring it leaves the axe evidence NFR-004 requires unratcheted. Stories and ratchet land together.
* The Playwright specs assert against those same story ids, so they cannot precede them; and
  `build-element-markup.mjs --check` fails against any tree where the authored module and the committed
  `index.ts` disagree, so the authored change and its generated fan-out cannot be separated at all.

**Delivery**: one branch `mission/site-footer-compact-mode`, cut from the latest `train/elements-first`,
one PR into `train/elements-first`, body using **`Refs #354`** and **`Refs #352`** — never `Closes`,
because GitHub honours closing keywords only on merges into the default branch and this PR targets the
train (`elements-first-run-prompt.md` §5). The squad point-cut is **pre-merge only** (tier C, C-011).

### Implementation Concern Map

> Concerns are not work packages. This mission has exactly one WP; the concerns below exist to order
> the work inside it and to make the dependencies between the authored and generated halves explicit.

**IC-01 — Authored contract (markup module + element)**
- **Purpose**: establish the single authored source for the compact presentation and its public API.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-006, FR-010, C-005, C-006, C-008, C-009.
- **Affected surfaces**: `packages/elements/src/site-footer/sk-site-footer.markup.ts`, `sk-site-footer.ts`.
- **Sequencing/depends-on**: none. Everything else is downstream of it.
- **Risks**: the markup module must stay leaf-safe — `assertLeafImports` refuses a bare specifier or a non-leaf target *before* evaluation and exits, so an accidental import fails the generator with a named error rather than a type error.

**IC-02 — Presentation (the sheet)**
- **Purpose**: the compact layout, its narrow stacking, and the light-DOM target-size rule.
- **Relevant requirements**: FR-011, FR-012, FR-013, NFR-001, NFR-002, NFR-003, NFR-005, C-001, C-002, C-003.
- **Affected surfaces**: `packages/styles/src/site-footer/sk-site-footer.css`.
- **Sequencing/depends-on**: IC-01 (the class names come from the markup module's `SITE_FOOTER_CLASSES` / `siteFooterClasses`).
- **Risks**: the colour-free constraint (D-9); modifier rule ordering after the base rule; no `container-type`, ever.

**IC-03 — Generated fan-out**
- **Purpose**: regenerate and commit every derived artifact so no `--check` can drift.
- **Relevant requirements**: FR-007, FR-008, FR-009, NFR-009, NFR-010, C-007.
- **Affected surfaces**: the eight generated paths in D-11.
- **Sequencing/depends-on**: IC-01, IC-02.
- **Risks**: `SIZES.md` measured against a stale `dist/`; nx serving a cached artifact to a `--check`.

**IC-04 — Evidence (stories, behaviour cases, Playwright specs, ratchets)**
- **Purpose**: make every acceptance claim a gate rather than a review opinion.
- **Relevant requirements**: FR-005, FR-007, NFR-004, NFR-006, NFR-007, NFR-008, NFR-011, SC-001…SC-014.
- **Affected surfaces**: the two story files, the behaviour fixture, the two new Playwright specs, `expected-docs.json`, `expected-stories.json`, `fixtures/vue-consumer/src/types.test-d.ts`.
- **Sequencing/depends-on**: IC-03 (story ids come from the built Storybook index; the static stories render generated exports).
- **Risks**: story ids transcribed rather than read from `index.json`; a local `--update-snapshots`.

## D-15 — Verification plan (the exact sequence, in order)

Derived from `docs/contributing/adding-a-component.md` §7 and this repo's real scripts, and reordered
where §7's numbering allows it. Every command below resolves in this checkout.

```bash
# 0. Start from a real base. Long design phases go stale; re-fetch before implementing.
git fetch origin && git log --oneline -1 origin/train/elements-first

# 1. Regenerate every committed artifact from the authored source
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze --skip-nx-cache      # rewrites packages/elements/custom-elements.json
node scripts/build-react-wrappers.mjs            # rewrites packages/react/src/SkSiteFooter.{js,d.ts}
node scripts/build-vue-types.mjs                 # rewrites packages/elements/vue.d.ts

# 2. BUILD, then measure — measure-elements-sizes.mjs READS dist/ and does not build it
npx nx run-many --target=build --projects=tokens,styles,elements --skip-nx-cache
node scripts/measure-elements-sizes.mjs          # WRITES packages/elements/SIZES.md — commit it

# 3. The drift checks (SC-004, SC-005, NFR-009, NFR-010)
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check    # expect: sk-site-footer.html byte-identical
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check

# 4. Content and hygiene gates (SC-001, SC-002, SC-010, SC-014)
node scripts/check-manifest-content.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/check-behaviour-fixture-imports.mjs
node scripts/typecheck-all.mjs
npm run quality:all            # ESLint (nx run-many --target=lint --all), Stylelint, HTMLHint

# 5. The gates' own probe tables, and the wiring that keeps them running
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
node scripts/check-gate-wiring.mjs

# 6. Confirm nothing is left unstaged — an unstaged generated file is what CI sees as drift
git add -A && git status --porcelain     # must be empty before opening the PR

# 7. The suites (SC-011, SC-013)
npm run test                             # vitest run — includes the browser-mode behaviour lane
node scripts/suite-selftest.mjs          # full baseline + dependency-affected suite/mutation arms

# 8. Storybook, axe, Playwright (SC-003, SC-006, SC-007, SC-008, SC-009, NFR-004)
npx nx run storybook:storybook:build --skip-nx-cache
node scripts/run-axe-storybook.js
#    Read the exact new story ids out of the build BEFORE editing expected-stories.json:
node -e "console.log(Object.keys(require('./apps/storybook/storybook-static/index.json').entries).filter(i=>i.includes('sitefooter')).join('\n'))"
npx playwright test apps/storybook/src/tests/sk-site-footer-compact.spec.ts
npx playwright test apps/storybook/src/tests/sk-site-footer-compact-forced-colors.spec.ts
npx playwright test                      # the whole lane, to catch collateral

# 9. Visual regression — CI-AUTHORITATIVE. Do NOT run --update-snapshots locally.
#    Read the result from CI's `visual-regression-diffs` artifact on the PR (NFR-008, SC-012).
```

**Step 9 is not optional and is not local.** `adding-a-component.md:466-469` makes baselines
CI-authoritative because local font metrics differ. If a compact story needs a **new** baseline, harvest
the PNG from the CI run's artifact; never generate one on the workstation.

## D-16 — Implementation constraints the implementer must be told

These four are named because each has cost this repository real time before.

1. **Playwright's port 6006 is shared, and `reuseExistingServer` is on locally.**
   `playwright.config.ts` (at the **repo root**, not under `apps/storybook/` — the mission brief says
   otherwise and the repository wins) sets
   `webServer.command: 'npx http-server apps/storybook/storybook-static --port 6006 --silent'`,
   `url: 'http://localhost:6006'`, and `reuseExistingServer: !process.env['CI']`. Sibling mission
   checkouts under the same parent directory (`../353`, `../355`) may already be serving **their** build
   on 6006, and Playwright will silently attach to it — producing failures or passes that describe
   another mission's Storybook. **Before any Playwright run: `ss -ltnp | grep 6006` (or `lsof -i :6006`)
   and confirm nothing else holds the port; if something does, stop it or set `CI=1` to force a fresh
   server.** A green run against a sibling's build is worse than a red one.
2. **Build before `measure-elements-sizes.mjs`.** It reads `packages/elements/dist/` and does not build
   it. Running it against a stale `dist/` records the wrong bytes, and the symptom is CI reporting
   different numbers for the same commit — which looks like non-reproducibility and is not.
3. **Use `--skip-nx-cache` wherever nx is involved in a `--check` comparison.** A cached `analyze` or
   `build` output makes a `--check` compare a stale artifact against itself and report green over a
   change it never saw. The `--skip-nx-cache` flags in §D-15 steps 1, 2 and 8 are there for that.
4. **Never commit a compressed or gzipped byte figure, and treat `SIZES.md` as CI's.** `SIZES.md`
   carries a `min+gzip` column and an SRI hash, and records in its own text that *"esbuild writes
   module-path comments into the bundle, so a checkout whose `node_modules` resolves through a
   different path (a symlink, a pnpm store, a bind mount) produces a different byte count and therefore
   a different hash. The figure here is CI's."* zlib output also differs between workstation and CI.
   Regenerate it as §D-15 step 2 says, inspect `git diff packages/elements/SIZES.md` and confirm the
   delta is a plausible small increase from the added CSS and markup — but if the local figures move in
   ways a few hundred added bytes cannot explain, that is a node_modules-layout artifact, and CI's
   figure is the one that stands. Never hand-edit the file.

Two more, specific to this component:

5. **Extend `fixtures/elements-behaviour/src/sk-site-footer.test.ts` in place; do not add a new fixture
   file.** `suite-budget.json`'s `selftestCeilingSeconds` is derived from how few files each mutation
   arm runs (`adding-a-component.md:370-374`), and a new file in the arm's dependency-graph selection
   moves that. Extending the existing subject file changes no `(SC-id, subject)` pair and leaves guards
   7 and 9 satisfied.
6. **Import the element modules the test exercises, never `@spec-kitty/elements`.**
   `scripts/check-behaviour-fixture-imports.mjs` fails on any quoted `@spec-kitty/elements` specifier
   under `fixtures/elements-behaviour/src/`. The existing file already does this correctly; new imports
   (e.g. `SITE_FOOTER_AXES` from `site-footer/sk-site-footer.markup.js`) must follow the same form.

## D-17 — Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| R1 | A `color:` declaration slips into a new compact rule and the existing AA test demands a measurement case for a leaf with no distinct ink. | Stated as a hard constraint in D-9 and in IC-02's risks. `npm run test` reds immediately with a named message, so this fails fast rather than late. |
| R2 | The 44px target floor is derived from token arithmetic that turns out wrong (a token's value changes, or `calc()` resolves differently at the story's root font size). | The Playwright spec asserts the **computed** `getBoundingClientRect()` at 390px, not the CSS. The plan's arithmetic is explicitly labelled as something to re-verify against `packages/tokens/src/tokens.css`, not to trust. |
| R3 | A local visual-regression run creates or updates a baseline with workstation font metrics. | `--update-snapshots` is forbidden by the plan and by the recipe; the sequence in D-15 routes step 9 to CI's artifact. `visual.spec.ts` is `testIgnore`d locally unless `PW_INCLUDE_VISUAL` is set, which is itself a guard. |
| R4 | Playwright silently reuses a sibling mission's Storybook on port 6006. | D-16 constraint 1: check the port before every run; `CI=1` forces a fresh server. |
| R5 | `expected-docs.json`'s `total` is bumped without the per-element row, or vice versa. | The gate checks **both** (`check-manifest-content.mjs` per-element rows *and* the summed `total`), so a half-edit is red. The exact figures are written out in D-12: `5 → 6` and `133 → 134`. |
| R6 | Story ids are hand-derived and do not match Storybook's own index, reding `run-axe-storybook.js` by name. | D-15 step 8 reads the ids out of `storybook-static/index.json` before the ratchet is edited. |
| R7 | The compact branch leaks into the base static form, silently changing `sk-site-footer.html` or `SkSiteFooterHTML`. | The new `[FR-009]` test asserts the base form's exact anatomy and the absence of `sk-site-footer--compact`; `build-element-markup.mjs --check` is a byte comparison over the committed file. |
| R8 | A reviewer reads the compact `presentation` attribute as ADR-15 kind 1 and asks for the #309 wrapper. | D-8 answers it three ways, and the decisive fact is checkable in one command: `grep -n 'container-type\|@container\|:host(' packages/styles/src/site-footer/sk-site-footer.css` returns only `:host { display: block }`. |
| R9 | The base of the branch has moved and an unrelated PR has already changed one of the ratchet totals, so `133 → 134` is stale by the time the PR opens. | D-15 step 0 re-fetches; the implementer re-reads `expected-docs.json`'s live `total` and applies **+1** to whatever it says, rather than writing the literal `134` from this plan. |
| R10 | `nx` serves a cached `analyze` output and `git diff --exit-code -- custom-elements.json` passes over a manifest that was never regenerated. | `--skip-nx-cache` on the analyze and build steps (D-16 constraint 3). |
| R11 | The extension of #77 in D-4a is read as an unauthorized departure. | It is written as a named decision with its evidence, its rejected alternative and its cost, and is escalated in the report to the mission lead rather than buried. If the operator rules the list clause binding on any link region, L1 is the recorded fallback and the change is contained to the element's private compact method, the static helper's compact branch, one extra property, and the `expected-docs.json` row (`6 → 7`, `total +2`). |

## D-18 — The issue's non-goals, restated as plan boundaries

The following are **out of scope** and any diff touching them is a defect in this Work Package:

* **No second footer component.** One element, one tag, one sheet, one markup module (FR-001).
* **No change to the full three-column contract** — not its markup, not its classes, not its parts, not
  its stories, not its pixels, not its `aria-label` derivation, not its link transition, not its
  divider rule (FR-009, NFR-008).
* **No ADR** is written or amended. If a genuine architectural gap appears, it is posted to the issue.
* **No #309/#310 work.** No generated host wrapper, no `.sk-site-footer-host` class, no
  `container-type` anywhere. D-8 makes the dependency not fire; it is not deferred, it is absent.
* **No i18n and no English default.** The library authors no brand, tagline, legal text, link label,
  link destination, year, `rel` or `target` (FR-010, C-005, #286). `render()` gains no user-visible
  literal.
* **No date arithmetic** of any kind (C-006).
* **No new `::part()`** and no new behaviour id (D-3, D-12).
* **No CI path-filter edit** (D-13), **no `stylelint.config.mjs` edit** (D-9), **no `suite-budget.json`
  edit**.
* **No authored focus ring and no reduced-motion guard on the shared link rule** (D-9a) — both are
  changes to the frozen contract and belong to their own issue.
* **No touching `../353` or `../355`**, and no edits to `ux_redesign/**`, which is a read-only corpus.

## Complexity Tracking

*Empty by design: the Charter Check above passes with no violation, so nothing requires justification.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_ | | |

## Artifacts this plan deliberately does not create

* **`data-model.md` — genuinely not applicable.** `sk-site-footer` is a presentational component with
  no persistence, no schema, no migration and no server contract. Its entire "data model" is the
  options object and property list written out in D-2 and D-3, which belong with the API decision they
  serve rather than in a separate document that would restate them. Recorded here explicitly rather
  than shipped as a placeholder.
* **`quickstart.md`** — the consumption examples are in D-4, and the repository's own recipe
  (`docs/contributing/adding-a-component.md`) is the authoritative how-to. A mission-local copy would be
  a second copy of a procedure, which this repo has recorded as a source of drift.
* **`contracts/`** — no network or service contract exists in this mission.
* **`research.md` IS created**, because the evidence behind D-1, D-4, D-8 and D-12 is measured against
  this checkout and is worth keeping separable from the decisions it supports.

## Unresolved decisions requiring an operator ruling

**None.** The one item that could have become one — a container-query-based responsiveness mechanism
pulling in #309/#310's unbuilt machinery — is **avoided by design** (D-8) rather than deferred, which
is what C-010 asks for. The API shape was explicitly delegated to PLAN by both the issue and the spec
and is decided in D-1…D-5 with evidence.

**One decision is flagged for the mission lead's awareness, not blocked on it**: **D-4a**, the extension
of the #77 ruling's "link lists are slotted as `<li>` inside the element-owned `<ul>`" clause to permit
bare slotted `<a>` elements for a link region that is not a list. It is named as a decision with its
evidence, its rejected alternative (L1) and L1's cost, per the mission brief's instruction to say so
explicitly rather than depart quietly.
