# Research: Public Header Styles

**Mission**: `public-header-styles-01M268NK` · **Phase**: plan (Phase 0) · **Date**: 2026-09-10
**Author**: architect-alphonso, programme orchestrator session `ea037606`

Every finding below was measured in the checkout at
`/home/jeroennouws/dev/spec-kitty-design-missions/353` (branch `mission/public-header-styles`, off
`train/elements-first`) or in the read-only corpus at
`/home/jeroennouws/dev/team-kitty-missions/ux_redesign/families/06-account-front-door/`. Where a
governing document and the repository disagree, **the repository wins** and the divergence is
recorded as such.

---

## R-1 — The target-size precedent (settles the spec's `[NEEDS DECISION]`)

**Question.** How does a family meet a 44px target floor over a control it does not own, without
styling that control's internals?

**Answer: two existing sheets already do it, identically.**

`packages/styles/src/confirm-dialog/sk-confirm-dialog.css:165-174` states the problem in its own
comment and answers it:

```css
/* NFR-001: every interactive control here is at least 44x44px. `.sk-button` does not
   guarantee that on its own (its `sm` size is deliberately smaller), so this component pins
   its own minimums on the two controls it renders, regardless of which `.sk-button` size
   modifier (if any) the consumer's classes end up carrying. */
.sk-confirm-dialog__confirm,
.sk-confirm-dialog__cancel {
  /* --sk-space-9 is 3rem/48px — the closest token at or above the 44px NFR-001 floor. */
  min-inline-size: var(--sk-space-9);
  min-block-size: var(--sk-space-9);
}
```

The floor sits on the **dialog family's own BEM classes**. `grep` over that sheet finds no rule
whose selector names `.sk-button`, `.sk-button--sm`, a `::part()`, or a shadow-root internal.

`packages/styles/src/context-nav/sk-context-nav.css:44-56` is the same idiom with the detail that
makes it work on an anchor:

```css
.sk-context-nav__link {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  …
  min-block-size: var(--sk-space-9);
```

`display: flex` (or `inline-flex`) is load-bearing: `min-block-size` is inert on a non-replaced
inline box, which is what an unstyled `<a>` is. `apps/storybook/src/tests/sk-context-nav.spec.ts:924-935`
asserts the resulting boxes are `>= 44` in both dimensions at 390px and 1280px.

**Consequence.** `.sk-public-header` owns `.sk-public-header__action` — its own class, a documented
composition slot — and pins the floor there. Recorded in `spec.md`'s "Resolved decision" section,
committed `d24aadb`.

---

## R-2 — `.sk-button--sm` in the library is 32px, not 44px (corpus vs. repository)

`packages/styles/src/button/sk-button.css:73-76`:

```css
.sk-button--sm {
  padding: var(--sk-space-2) var(--sk-space-5);
  font-size: var(--sk-text-sm);
}
```

With `.sk-button`'s `line-height: 1` (line 22) and `border: 1px solid transparent` (line 17), the
computed block-size is 8 + 8 + 14 + 1 + 1 = **32 CSS px**.

The Family 6 screens *appear* to clear 44px because each screen's own inline `<style>` block
re-declares `.sk-button--sm{min-height:calc(var(--sk-space-8) + var(--sk-space-1))}` — 2.5rem +
0.25rem = 2.75rem = exactly 44px. **That override exists only in the screens**, not in
`packages/styles/src/button/sk-button.css`.

**Divergence recorded.** The corpus is not evidence that the library's small button meets the floor.
The header family must supply the floor itself (R-1). `spec.md` estimated ≈30px; the measured
figure including borders is 32px. Neither changes the conclusion.

---

## R-3 — The evidenced anatomy, and the count

Measured across `ux_redesign/families/06-account-front-door/screens/` — 24 screen files, of which
**23 carry the `topnav` anatomy**. The exception is `P24-password-maintenance-dark.html`, which uses
authenticated `sk-app-shell` chrome (`compact-header` / `personal-bar` / `account-menu`) and has zero
occurrences of `topnav`, `topnav-inner` or `nav-actions`. The issue's "23 of 24" is exact.

Tree shape, identical on all 23:

```
header.topnav > div.container.topnav-inner > ( a.logo > span.brand-context ,
                                               nav.nav-actions > [0–2 a.sk-button] + details.theme-picker )
```

Local CSS, byte-identical in every screen that carries it (e.g. `P4-login-default-dark.html:572-576`):

```css
.topnav{background:var(--sk-surface-page);border-bottom:var(--sk-border-width-1) solid var(--sk-border-default)}
.topnav-inner{display:flex;align-items:center;justify-content:space-between;gap:var(--sk-space-4);min-height:calc(var(--sk-space-10) + var(--sk-space-4));padding-block:var(--sk-space-3)}
.logo{display:inline-flex;align-items:center;min-height:var(--sk-space-9);font-size:var(--sk-text-xl);gap:var(--sk-space-3)}
.brand-context{font-family:var(--sk-font-reference);font-size:var(--sk-text-sm);font-weight:var(--sk-weight-normal);color:var(--sk-fg-muted);padding-left:var(--sk-space-4);border-left:var(--sk-border-width-1) solid var(--sk-border-strong)}
.nav-actions{display:flex;align-items:center;gap:var(--sk-space-4)}
```

plus the co-applied page container (`P4:561`) and the sole wrap rule (`P4:720`):

```css
.container{max-width:calc(var(--sk-space-12)*10);margin-inline:auto;padding-inline:var(--sk-space-8)}
@media(max-width:600px){ .container{padding-inline:var(--sk-space-4)} .nav-actions{gap:var(--sk-space-2)} .logo{font-size:var(--sk-text-lg)} .topnav-inner{flex-wrap:wrap} … }
```

Action-count distribution:

| Shape | Screens | n |
|---|---|---|
| two actions (Sign in + Start free) + theme control | P1, P16–P19, P21, P22 | 7 |
| one action (`Sign in`) + theme control | P2, P3, P6–P15, P23 | 13 |
| one action (`Start free`) + theme control | P4, P5 | 2 |
| zero link actions — theme control only | P20 | 1 |
| no `topnav` | P24 | 1 |

Further measured facts:

- **`aria-current` is used nowhere in the corpus.** The family styles its presence anyway, because
  the issue names current-location indication as required evidence; the corpus simply has no
  route-current screen.
- `<nav>` accessible names are `"Account and appearance"` (22 screens) and `"Appearance"` (P20).
  Both are consumer strings; the family selects neither.
- `span.brand-context` is present on all 23, always with the same text. A consumer string.
- **No `position: sticky` on any `.topnav`.** The only sticky rules in the corpus are in P24 — a
  dormant `:host([sticky])` rule for the imported `sk-page-header` element (the attribute is never
  set) and the authenticated `.personal-bar` rail. Nothing to carry over, and sticky is a stated
  non-goal.
- **Local theme-control classes to avoid verbatim**: `theme-picker`, `theme-toggle`,
  `theme-options`, and the `data-theme-choice` attribute (SC-011).
- **`data-od-id` attributes are review scaffolding**, not product API (epic shared constraint 6).
  They must not be copied into the fixtures.

---

## R-4 — `ci-quality.yml`'s `components` filter is a glob, not a directory list

`.github/workflows/ci-quality.yml:80` is `- 'packages/**'`, and the comment at lines 73–79 records
that the hand-written two-entry list was **deliberately replaced** with that glob, naming the exact
failure mode a per-directory list produces ("a new packages/<anything>/ matches no filter,
storybook-build skips, and a11y/visual/playwright skip on `needs` with the gate accepting all four
as legitimate").

`docs/architecture/elements-first-run-prompt.md:182` still instructs the opposite ("A PR that
touches a new package directory must also extend `ci-quality.yml`'s `components` path filter").
**Stale. The workflow wins.** No filter edit is required for this mission, and adding one would
reintroduce the allow-list shape the comment removed.

Every path this mission touches already matches: `packages/**` (80), `apps/storybook/**` (81),
`scripts/**` (102), `expected-stories.json` (66).

---

## R-5 — ADR-15 does not reach this family

ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`, Status:
**Proposed**, adoption gated on the #301 verdict) translates three **shadow-DOM-authored** constructs
— host-owned `container-type`, `:host([attr])` gating an `@container`, and `::slotted()` — into a
static form. Its "Which sheets this ruling reaches" table (lines 366–376) enumerates exactly four
sheets, all element-backed: `sk-app-shell.css`, `sk-action-row.css`, `sk-copy-field.css`,
`sk-page-header.css`. `docs/contributing/adding-a-component.md:91-95` states the same bound and adds
that "a host-attribute axis in a sheet with **no** container … collapses onto the root class
perfectly safely".

`sk-public-header` has no element, no `:host` rule and no shadow root, so there is no host-authored
construct for ADR-15 to translate, and it imposes no host-wrapper obligation here.

Verified independently: `grep -rl container-type packages/styles/src` returns `sk-copy-field.css`,
`sk-action-row.css`, `sk-confirm-dialog.css`, `sk-app-shell.css`, `sk-page-header.css`. None of the
six styles-only families (`form-field`, `context-nav`, `segmented-choice`, `prose`, `skip-link`,
and the #176 set) declares one.

**But ADR-15's underlying rule still argues against a container query here**: *"an element is never
its own query container"* (`adding-a-component.md:73-78`). A header that established its own
containment context and queried it would make its reflow depend on a containment context a
consumer's layout can change. `flex-wrap` needs none of that.

---

## R-6 — A media query would create an undischargeable SC-017 obligation

`adding-a-component.md:397-401` (ADR-11's responsive-threshold behaviour, SC-017): *"If your
component's behaviour changes below a documented viewport width or height, you own this id. The test
asserts the shipped stylesheet declares the threshold at its documented figure **and** that the
behaviour changes at it live, and the mutation goes against the **generated** `sk-<name>.css.js` —
the `test` job never builds, so an arm against the authored `.css` is semantically inert."*

There is no generated `sk-public-header.css.js`: `scripts/build-elements-css.mjs:34` derives its
work set from the **elements**, and this family has no element. So declaring a viewport threshold
would create an obligation this family cannot discharge in the form the recipe requires.

`flex-wrap: wrap` declares no threshold, so the obligation does not arise — not as a dodge, but
because a continuously-reflowing row genuinely has no threshold.

---

## R-7 — The reduced-motion guard must not be written over nothing

`adding-a-component.md:152-158`: `packages/styles/src/transition-matrix/sk-transition-matrix.css:237`
*"looks like [a working reduced-motion precedent] but isn't: it guards `scroll-behavior`, and no
component in this repo sets `scroll-behavior: smooth`, so it disables nothing."* The working
examples are `sk-disclosure.css` and `sk-skip-link.css:61-65`, and the **shape** to copy is a guard
scoped to the exact selector and the exact transitioning property the component owns.

`sk-context-nav.css` declares no motion at all and writes no guard; its spec asserts both the
source-level absence (`sk-context-nav.spec.ts:270`) and the computed `transitionDuration === '0s'`
under emulation (lines 1077–1095).

**Consequence.** `sk-public-header.css` declares no `transition`/`animation` and therefore writes no
`prefers-reduced-motion` block. NFR-008's assertion is scoped to the family's **own** boxes — never
to `.sk-public-header__action`, which may be a `.sk-button` carrying its own transition
(`sk-button.css:23-26`); asserting `0s` there would be a trap that pushes the implementer toward
writing `.sk-button { transition: none }` in our sheet, i.e. the reach-through C-007 forbids.

---

## R-8 — The forced-colours rules, and what the gate can and cannot see

From `adding-a-component.md:160-203`, all measured at #176's own gate:

- `border` survives `forced-colors: active` with zero author CSS. `background`/`background-color`
  do **not** (they flatten to `Canvas`). `box-shadow` does **not** — it computes away entirely, so
  a focus ring built from `box-shadow` disappears. **Use `outline` for focus rings.**
- `stylelint`'s `declaration-strict-value` polices `/color/` as a substring plus the literal
  `background`/`background-color`. **It does not police the `border`/`outline` shorthands at all**,
  regardless of value — "a gate being blind, not a gate being satisfied". Author **longhand**
  `-color` properties.
- The system-colour keywords are certified via `stylelint.config.mjs`'s `ignoreValues`, and
  `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonText`, `LinkText`, `GrayText` are
  **already present** (`stylelint.config.mjs:52-58`). **No config edit is needed** for this mission
  provided it confines itself to that set.
- The config states its own limitation (lines 44–51): `ignoreValues` has **no media-query scoping**,
  so `border-inline-start-color: CanvasText` passes everywhere the rule applies, not only inside a
  `forced-colors` block, and *"reviewers must still confirm these keywords appear only inside a
  `forced-colors` media block"*. This plan converts that reviewer obligation into a machine check
  for this one sheet, in the mission's own Playwright source-contract assertions.
- An `<a>`/`<summary>` recolors to `LinkText` intrinsically; that mapping is **link-element
  specific** and does not generalize. Never `forced-color-adjust: none` on an affordance that must
  remain visible.

`sk-context-nav.css:195-213` is the worked example of a small, correct `forced-colors` block.

---

## R-9 — The generated barrel carries a rationale citation, and ours would be wrong

`scripts/build-styles-only-markup.mjs:110-119` writes a per-component ADR citation into the
generated `index.ts` and encodes the rule in its own comment: ADR-10's class ruling is the citation
for every styles-only component **except** `form-field` (#141) and `segmented-choice` (#270), and
*"Do not attribute either component-specific rationale to ADR-10's general class ruling."*

`spec.md`'s "Styles-only rationale (why no custom element)" section establishes that
`sk-public-header` follows the `form-field`-shaped reasoning — an explicitly recorded scope decision
— **not** ADR-10's class ruling, none of whose four structural reasons (unbroken
`<dl>`/`<table>`/`<li>` chains; cross-root ID references; a document-scoped `href="#…"`; UA-owned
`<details>` state) applies to `<header>`/`<nav>`/`<a>`.

ADR-10 reinforces the separation:
`docs/architecture/decisions/2026-09-02-10-distribution-and-canonical-markup.md:110-111` —
*"`#141` stays attached to `form-field` alone; it is not the citation for the class ruling above,
which #176 established on its own evidence."*

**Consequence.** The generator gains a `public-header` branch citing #353, mirroring the existing
`segmented-choice` → `'See #270.'` branch. This is a precedented one-line change, not a new
decision.

---

## R-10 — Two shared files have no gate at all

`packages/styles/src/index.ts` re-exports one line per component directory **that has an
`index.ts`**, and its own header comment records that the per-DIRECTORY half is hand-maintained:
*"a component that gains its first `index.ts` is silently omitted until someone adds a line. That
is what #156's gate must assert"* — i.e. the gate is **filed, not built**.

`packages/styles/package.json`'s `exports` map likewise has no generator. `nx run styles:build`
copies `**/*.{html,css}` from `src` to `dist` (`packages/styles/project.json`), so `dist` will
contain the files; without the `exports` entry no consumer can address them.

**Neither omission is caught by any repository gate.** `sk-context-nav.spec.ts:420-423` asserts both
for its own family, which is the pattern this mission must copy. Recorded as risk R-07.

---

## R-11 — `npm run test` does not run Playwright

`package.json`'s `test` script is `vitest run`. The Playwright specs live in
`apps/storybook/src/tests` and are run by `npx playwright test` — which is what `ci-quality.yml`'s
`playwright` job invokes (line 506) over the **whole** `testDir`, deliberately, so a newly added
spec cannot silently never execute (`playwright.config.ts`'s own comment).

`spec.md`'s SC-004 says the new spec "passes under `npm run test`". **Wrong command name; the
repository wins.** SC-004 is correct in every other particular.

`visual.spec.ts` is excluded from the default run and opted back in with `PW_INCLUDE_VISUAL=1`
(`playwright.config.ts`), which is how the `visual-regression` job runs it chromium-only
(`ci-quality.yml:475`).

---

## R-12 — Story ratchet mechanics

`expected-stories.json` currently has `total: 505` across 48 `byElement` keys.
`scripts/run-axe-storybook.js:614-660` flattens `byElement`, **requires `total` to equal the
flattened length**, and fails by name on any declared id missing from the built Storybook index. The
file's `$comment` array records, mission by mission, what was opted in and why — including the
scope principle #219 established: *"THE SCOPE IS THE ELEMENTS, PLUS ANY STORY A MISSION HAS NAMED AS
ACCEPTANCE EVIDENCE … a story cited as proof is ratcheted in the same commit that cites it."*
Every story in this mission's evidence list is therefore in scope for the ratchet.

The `$comment` array also records that #176's gate **deleted** three `ForcedColorsBaseline` stories
that were byte-identical re-renders of a sibling asserting a media state the axe harness never
enters, rather than ratcheting them. That is why this plan's story set has no separate `DefaultDark`
export beside `Default`.

---

## R-13 — Registries this family stays out of, and the proof for each

| Registry | In? | Why |
|---|---|---|
| `expected-parts.json` | no | shrink-only `::part()` ratchet; no shadow root, no parts |
| `expected-docs.json` | no | **exact** equality over element attribute/method counts; no element, no row |
| `behaviours.json` / `mutations.json` | no | ADR-11's list is applicability-gated — *"every item below **that applies to it**"* (`…-11-…md:54`). None of the eleven items applies to a component with no element, no shadow root and no JS. `sk-context-nav.spec.ts:409-417` is the precedent assertion: grep the registries, require zero matches |
| `expected-inert-theme-wrappers.json` | no | shrink-only; moves only when an inert `data-theme="light"` wrapper is *fixed*. We author `class="sk-light"` from the start |
| `custom-elements.json`, `packages/react/src`, `vue.d.ts` | no | all generated from `packages/elements/src`, to which this family adds nothing |
| `expected-stories.json` | **yes** | R-12 |

---

## R-14 — Environment hazards measured in this ecosystem

1. **Port 6006 is shared across sibling mission checkouts.** `playwright.config.ts` hardcodes
   `baseURL: 'http://localhost:6006'` and `webServer.reuseExistingServer: !process.env['CI']`. A
   sibling checkout (`…/354`, `…/355`) already serving its own `storybook-static` will be silently
   reused, producing a green run against another mission's build or a red run against code this
   branch does not contain. Check the port before every run; `CI=1` forces a fresh server.
2. **`scripts/measure-elements-sizes.mjs` reads `dist/` and does not build it**
   (`adding-a-component.md:461-464`). Its symptom is CI reporting different numbers for the same
   commit, *"which looks like non-reproducibility and is not."* This family ships nothing into
   `packages/elements/dist`, so `--check` should be unaffected; drift means a stale local `dist/`
   or that this Work Package touched the elements package.
3. **Nx serves cached artifacts to `--check` comparisons.** A cached build compared against itself
   reports green. Pass `--skip-nx-cache` on any `nx` invocation whose output feeds a drift check or
   a gate.

---

## R-15 — Tokens the family will draw on

All exist today in `packages/tokens/src/tokens.css`; **no new token is needed and none should be
added** (adding one requires edits to both blocks plus `npx nx run tokens:catalogue`, and this
family has no value the palette lacks).

Spacing `--sk-space-1…-10` (234–244; `--sk-space-9` = 3rem/48px is the 44px floor token, 242) ·
border widths `--sk-border-width-1/-2/-4` (199–205) · radii `--sk-radius-sm/-pill` (286–290) ·
type `--sk-text-xs/-sm/-base/-lg/-xl` (218–223), weights `--sk-weight-normal/-medium/-semibold`
(227–229), families `--sk-font-sans` (208) and `--sk-font-reference` (210, the corpus's
`brand-context` face) · surfaces/foregrounds `--sk-surface-page`, `--sk-surface-pill`,
`--sk-fg-default`, `--sk-fg-body`, `--sk-fg-muted`, `--sk-border-default`, `--sk-border-strong`,
`--sk-border-focus`, `--sk-color-accent`.

The usage doc must list the sheet's **actual** `var(--sk-*)` set, and the mission's Playwright spec
must assert that list equals the stylesheet's — the equality check at
`sk-context-nav.spec.ts:444-448`. That is the mechanism that stops the doc going stale.
