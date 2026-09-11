# Research: Site Footer Compact Mode

**Mission**: `site-footer-compact-mode-01M268NS` · issue #354 [TKF2] · epic #352
**Date**: 2026-09-10 · **Phase**: 0 (evidence for [`plan.md`](./plan.md))

Every finding below was read from this checkout (`mission/site-footer-compact-mode`, base
`train/elements-first`) or from the read-only Family 6 corpus, at the commits named. Nothing here is
carried over from the issue text without being checked; where the issue, the spec or the mission brief
disagrees with the repository, the disagreement is named and the repository wins.

---

## R1 — What `scripts/build-element-markup.mjs` emits, exactly

Read in full. The generator globs `packages/elements/src/*/sk-*.markup.ts`, asserts the module's import
graph is leaf-safe **before** evaluating it (`assertLeafImports`, lines 168-199, driven by esbuild's
metafile rather than a regex), imports each module from its own `file:` URL, and requires three exports
resolved by convention from the directory name:

* `<camel>StaticHtml` — a function taking an **options object** (lines 276-284);
* `<SCREAMING>_VARIANTS` — absence is a hard error, not an empty map (lines 291-300);
* `<SCREAMING>_AXES` — same (lines 313-323).

It then builds the emission set (lines 371-375):

```js
const forms = [
  [`Sk${comp}HTML`, {}],
  ...Object.keys(variantMap).map((v) => [`Sk${comp}${pascal(v)}HTML`, { variant: v }]),
  ...Object.entries(axes).map(([suffix, opts]) => [`Sk${comp}${suffix}HTML`, opts]),
];
```

and writes two files:

| File | Content | Line |
|---|---|---|
| `packages/styles/src/<name>/sk-<name>.html` | a three-line comment header plus **`call({}, 'the base form')` only** | 359-363 |
| `packages/styles/src/<name>/index.ts` | one `export const <Name> = <JSON.stringify(html)>;` per `forms` entry, in order | 376-380 |

**Consequences that decide D-1:**

1. **Neither a `_VARIANTS` key nor an `_AXES` suffix ever reaches the `.html` file.** Adding either
   leaves `sk-site-footer.html` byte-identical, provided the base form's own output does not change.
   This is the mechanical basis of the backward-compatibility guarantee in plan D-10.
2. **The emitted export name is the same either way.** `{ compact: … }` as a variant and
   `{ Compact: … }` as an axis both PascalCase to `SkSiteFooterCompactHTML`. The two declarations differ
   only in the options object the generator passes: `{ variant: 'compact' }` versus the axis's own
   object. So the variant-vs-axis choice cannot be argued from generated identifiers; it has to be
   argued from API semantics.
3. **The generator guards its own output**: duplicate names across `_VARIANTS` and `_AXES` are refused
   by name (lines 394-404), and every emitted identifier is checked against the identifier grammar in
   **both** modes (lines 406-415) — because `--check` is a byte comparison and cannot tell valid
   TypeScript from invalid.
4. `staticHtml` is called with **one** argument at both call sites (`call(opts)`, line 347), so a
   `content` second parameter is unused for this component.

### Repository precedent for the variant/axis distinction

| Module | `_VARIANTS` | `_AXES` | What the repo says |
|---|---|---|---|
| `sk-pill-tag.markup.ts` | four colours | shapes + status tones, both **derived** | axes are the non-colour knobs |
| `sk-feature-card.markup.ts` | three root border modifiers | accents, derived from `FEATURE_CARD_ACCENTS` | accents are an **inner** class |
| `sk-ribbon-card.markup.ts` | border colours | `WithRibbon`, ribbon colours | line 37: *"Ribbon colour modifiers — an INNER class, so an axis rather than a variant"* |
| `sk-section-banner.markup.ts` | three tones | `{}` | — |
| `sk-grid.markup.ts` | `cols-2/3/4` | — | — |
| **`sk-check-bullet.markup.ts`** | **`{}`** (line 26) | **`{ Pending: { state: 'pending' } }`** (line 46) | line 53: *"Omit for the backward-compatible complete presentation"* |

Every `_VARIANTS` map in the repository renders the **same children** and swaps one root modifier.
`sk-check-bullet` is the only prior case of a **structure-affecting, backward-compatible added
presentation**, and it chose the axis even though its modifier (`sk-check-bullet--pending`) is a
root-block modifier. It also demonstrates the shared-helper pattern the compact presentation copies:
`checkBulletClasses(state)` returns the root class list, and **both** the element and the static form
call it, so one bare class selector serves both paths and no `:host([attr])` rule is needed.

---

## R2 — The Family 6 corpus anatomy (read-only)

Source: `/home/jeroennouws/dev/team-kitty-missions/ux_redesign/families/06-account-front-door/screens/`.

**Verified counts.** 24 screens (P1–P24). **23 carry a footer.** The single exception is
`P24-password-maintenance-dark.html`, which contains no `<footer>`, no `pagefoot`, no `footer-name`
and no `/terms/` — it also carries no `topnav`, i.e. it is an embedded screen state rather than a full
page shell. This confirms the issue's and the spec's "23 of 24, P24 excepted" claim exactly.

**One anatomy, byte-identical across all 23** (only the per-screen `data-od-id` values differ):

```html
<footer class="pagefoot"><div class="container row-between">
  <div>
    <p class="footer-name">Spec-driven development, made visible.</p>
    <p>Free private beta &middot; © Spec Kitty 2026</p>
  </div>
  <a class="text-link" href="/terms/">Terms</a>
</div></footer>
```

Representative occurrences: `P1-landing-desktop-dark.html:858`, `P4-login-default-dark.html:918`,
`P16-terms-published-dark.html:948`. No screen deviates.

**The CSS**, inline in each screen (there is no shared stylesheet in the corpus):

```css
.pagefoot{padding-block:var(--sk-space-7);color:var(--sk-fg-muted);font-size:var(--sk-text-xs);
          border-top:var(--sk-border-width-1) solid var(--sk-border-default)}
.pagefoot .row-between{flex-wrap:wrap}
.footer-name{color:var(--sk-fg-body);font-family:var(--sk-font-display);
             font-size:var(--sk-text-base);margin-bottom:var(--sk-space-2)}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:var(--sk-space-4)}
.text-link{display:inline-flex;align-items:center;gap:var(--sk-space-2);
           min-height:calc(var(--sk-space-8) + var(--sk-space-1));color:var(--sk-fg-body);
           font-size:var(--sk-text-sm);text-decoration:underline;
           text-underline-offset:var(--sk-space-1);text-decoration-thickness:var(--sk-border-width-1)}
```

Its only breakpoint: `@media(max-width:600px){ .pagefoot .row-between{align-items:flex-start} }`.

**Findings that decide plan D-4 and D-9:**

* **No `<nav>`, no heading, no `<ul>`, no `<li>` anywhere in the footer.** The link is a bare `<a>`
  **sibling** of the text block, not nested inside the legal line. This is the direct evidence for
  decision D-4a: the compact link region is not a list, so wrapping it in an element-owned `<ul>` would
  be inventing structure the corpus does not have, and would re-create the empty-landmark problem
  FR-005 exists to forbid.
* **No wordmark node.** The `.footer-name` paragraph is a *tagline*, styled in the display font. The
  spec's Key Entities section describes it as "one consumer-supplied name/wordmark plus one descriptive
  line", which does not match the corpus. **Corpus wins on anatomy; the spec's FR-002 still binds.**
  The plan satisfies both by rendering `wordmark` only when supplied, so a corpus-shaped consumer omits
  it and gets the corpus tree exactly, while a consumer who wants a wordmark gets FR-002's block.
* **The legal line contains the year as ordinary text** ("© Spec Kitty 2026"), supplied by the page.
  Nothing computes it. This is exactly what C-006 requires and what the library must keep doing.
* **The corpus's own 44px idiom is `calc(var(--sk-space-8) + var(--sk-space-1))`** — the arithmetic the
  plan reuses for NFR-002. Against `packages/tokens/src/tokens.css:234-241` (`--sk-space-8: 2.5rem`
  = 40px, `--sk-space-1: 0.25rem` = 4px) that is 44px. **To be re-verified in-engine, not trusted.**
* **No `dir` or RTL handling exists anywhere in the corpus** — zero matches for `dir="rtl"` or `[dir=`.
  So FR-013 has no corpus precedent to copy and must be satisfied by construction: logical/flex
  properties only, no physical offsets.

---

## R3 — ADR-15 and the #309/#310 question

ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`, **Proposed**,
adoption gated on #301's still-pending Family 4 verdict) rules **per construct kind**:

| Kind | Construct | Verdict |
|---|---|---|
| 1 | host-attribute variant axis **inside a host-owned `@container`** | generated static form, **two-element wrapper only**, wrapper carrying the sheet's complete `:host` set (#309/#310) |
| 2 | host-owned `container-type` | same |
| 3 | `::slotted()` child rule | **shadow-only**; no equality gate is possible, because outer-tree declarations beat inner-tree `::slotted()` regardless of specificity and order |
| 4 | cross-sheet `::part()` | shadow-only for now; **#314** owns the decision |

**The exemption that applies to `sk-site-footer`, quoted from the ADR:**

> "A host-attribute axis in a sheet with no `container-type` is a different thing and is **not** ruled
> on here: `sk-metric`, `sk-transition-matrix`, `sk-nav-pill-drawer`, `sk-form-input` and
> `sk-form-textarea` all carry `:host([attr])` rules with no container anywhere, the collapsed transform
> is sound for them, and inserting a wrapper would be an unmeasured layout change made for no reason."

and, in the "Which sheets this ruling reaches" section:

> "`container-type` appears in exactly four sheets under `packages/styles/src` … `sk-app-shell.css`,
> `sk-action-row.css`, `sk-copy-field.css`, `sk-page-header.css`."

`sk-site-footer.css` is not among them. Verified directly:

```
$ grep -n 'container-type\|@container\|:host(' packages/styles/src/site-footer/sk-site-footer.css
(no matches)
$ grep -n ':host' packages/styles/src/site-footer/sk-site-footer.css
6::host {
```

— the sheet's only `:host` rule is `display: block`, which `docs/contributing/adding-a-component.md:67`
records as the single case where the host/root collapse holds. Its only breakpoint is a plain
`@media (max-width: 640px)` (line 52).

**Therefore C-010's conditional dependency does not fire.** The plan goes further than the exemption
requires: it writes no `:host([attr])` rule of any kind, applying the compact modifier as an ordinary
root-block class from a shared helper that both paths call — so there is no host-scoped rule for a
static rewrite to get wrong, and the recipe's row-4 hazard (`:host(:is(…))`, `:host(:not(…))`, bare
`:host([attr])`, the four shapes #309 owns) is unreachable.

**What ADR-15 still binds this mission to**: its measurement discipline. *"Equivalence is a
within-engine property, and any gate must compare shadow-vs-static inside one engine and never against
a literal transcribed from this record."* The plan's FR-007 assertion (D-6) compares the element and the
static form against **each other**, in one Vitest browser-mode page, never against a number written
down.

**One `::slotted()` note.** The compact link region deliberately adds **no** `::slotted()` rule. The
anchors carry a light-DOM class (`sk-site-footer__link sk-site-footer__link--compact`) and are styled by
the same document-loaded sheet in both paths, which is the trade #77 already named and which avoids
adding a new kind-3 construct with its attendant #311-shaped documentation debt. ADR-15 records
`sk-site-footer` as already discharging its `::slotted()` obligation through the #78 paired-spelling
convention; nothing here changes that.

---

## R4 — Ratchet arithmetic, read from the files

All six ratchets live at the repository root.

| File | Shape | Current `sk-site-footer` state | Enforcement |
|---|---|---|---|
| `expected-docs.json` | `{$comment, total, elements}` | `:173-177` → `{"attributes": 5, "properties": 0, "methods": 0}`; `total: 133` (`:46`) | `check-manifest-content.mjs` — **exact** per element *and* on the summed total |
| `expected-parts.json` | `{$comment, total, byElement}` | `:205-210` → `["divider","footer","grid","legal"]`; `total: 141` (`:45`) | `check-part-ratchet.mjs` — shrink-only on the global total, but **closed per element**: an unlisted manifest part fails immediately |
| `behaviours.json` | `{$comment, behaviours}`, no total | subject of **SC-013** (`:564-566`) and **SC-014** (`:677-679`), both → `fixtures/elements-behaviour/src/sk-site-footer.test.ts` | `suite-selftest.mjs` guard 7 — exact, bidirectional set match on `(SC-id, subject)` pairs |
| `mutations.json` | `{$comment, mutations}`, no total | three arms at `:641-659` (one SC-013 stripping `part="divider"`, two SC-014 against `static styles = [sheet];`) | `suite-selftest.mjs` guards 7 and 9 |
| `expected-stories.json` | `{$comment, byElement, total}` | `:488-491` → two ids; `total: 505` (`:660`) | `run-axe-storybook.js` — shrink-only on growth, plus an internal `declared.length === total` check |
| `expected-inert-theme-wrappers.json` | `{$comment, count}` | no `sk-site-footer` entry; `count: 2` | `check-story-theme-wrapper.mjs` — fails in **both** directions |

### How `expected-docs.json`'s numbers are actually computed

`scripts/check-manifest-content.mjs`'s `auditDocumentedSurface` walks
`manifest.modules[].declarations[]` for declarations carrying a `tagName`:

* **attributes** — every entry of `decl.attributes[]`, unconditionally. `reflect` is **never read**.
* **properties** — only members stamped `x-spec-kitty-property-only: true`, which
  `scripts/normalise-manifest.mjs` proves from the TS source for a field declared
  `@property({ attribute: false })`. A property that is neither an attribute nor `attribute: false` is
  uncounted *and* undescribed by this gate.
* **methods** — `kind === 'method'`, not `private`/`protected`, name not starting with `#`. (The
  element's existing `#column` is correctly excluded.)
* **total** — the sum of every element's three counts across the whole file; verified arithmetically to
  equal `133` today.
* **`@slot` is never referenced** anywhere in the gate. A new slot changes nothing here.

**Consequence for this mission's chosen shape (one reflected String property `presentation`, one new
slot, no new part, no new public method):**

* `expected-docs.json`: `sk-site-footer.attributes` **5 → 6**, `total` **133 → 134**. `presentation`
  must carry a non-empty consumer-facing `/** */` description or the gate fails on `attr.description`.
* `expected-parts.json`, `behaviours.json`, `mutations.json`, `expected-inert-theme-wrappers.json`:
  **unchanged**.
* `expected-stories.json`: grows by the number of new story ids, with `total` moved by the same amount.
  The file's own `$comment` (`:32`) states the governing principle — *"THE SCOPE IS THE ELEMENTS, PLUS
  ANY STORY A MISSION HAS NAMED AS ACCEPTANCE EVIDENCE … a story cited as proof is ratcheted in the same
  commit that cites it"* — and shows the key convention for the static layer:
  `"sk-card (static path)": ["components-card--statuses-greyscale"]` (`:176`).

### `check-part-ratchet.mjs`'s test discovery, quoted

```js
const testSources = [...globSync('fixtures/**/src/**/*.test.ts', {}), ...globSync('tests/**/*.test.ts', {})]
  .filter((f) => statSync(f).isFile()).map((f) => readFileSync(f, 'utf8')).join('\n');
…
if (!testSources.includes(`::part(${part})`)) { problems.push(…) }
```

A flat literal-string scan of the concatenated corpus, not scoped per element. Only
`fixtures/**/src/**/*.test.ts` and `tests/**/*.test.ts` are scanned. This is why adding a `::part()`
is a same-PR obligation — and why the plan adds none.

### One stale-prose note, deliberately not "fixed"

`expected-docs.json`'s `$comment` (`:27`) describes the footer's attributes as *"wordmark, tagline,
legal, column-one-heading and column-two-heading"*. The live element declares `headingOne`/`headingTwo`
(observed as `headingone`/`headingtwo`) — `sk-site-footer.ts:42-43` records that the hyphenated names
were **rejected by the wrapper gate** and renamed. The enforced count (5) is correct; only the
changelog prose is stale. It is named here so nobody cites it as the real attribute names, and it is
**not** edited: these `$comment` blocks are append-only changelogs, and correcting one is not this
mission's scope.

---

## R5 — CI wiring

`.github/workflows/ci-quality.yml` triggers on `pull_request`/`push` to `[main, 'train/**']` plus a
nightly cron. The **only** path-filtered job is `changes` (dorny/paths-filter, `:48-121`), producing
`tokens`, `components`, `docs`, `ci`, `doctrine`.

`components` (`:65-110`) lists `expected-stories.json`, `expected-parts.json`, `behaviours.json`,
`mutations.json`, `mutations.selftest.json`, `suite-budget.json`, `tsconfig.base.json`, `packages/**`,
`apps/storybook/**`, `apps/demo/**`, `fixtures/**`, `scripts/**`, `.github/workflows/ci-quality.yml`,
`playwright.config.ts`, `nx.json`, `package.json`, `package-lock.json`.

Only five jobs are gated on it: `storybook-build` (`:395`) and, chained off it, `a11y`,
`visual-regression`, `playwright`, `lighthouse`. `security`, `workflow-pin-check`, `lint-code`, `test`,
`release-gate`, `gate` and `lint-feedback` run **unconditionally** — the file says so about itself:

> "UNCONDITIONAL — no `if:`. FR-003: `nx affected --target=test` prints 'No tasks were run' and EXITS 0,
> so a job wired to it is green forever if the target is misnamed or the affected computation misses."

**The gap.** `expected-docs.json` and `expected-inert-theme-wrappers.json` appear in **no** filter
branch. A PR touching only one of them computes `components == 'false'` and skips the Storybook chain.
It is not an enforcement hole — `check-manifest-content.mjs` and `check-story-theme-wrapper.mjs` run in
the unconditional `lint-code` job — but it is a real omission. It does not affect this mission, whose
diff always co-touches `packages/elements/src/site-footer/**`. Recorded as a follow-up candidate in
plan D-13, deliberately not fixed here: a `paths-filter` entry is evaluated against the PR **head ref**,
so a PR cannot evidence a filter entry it adds, and C-012 binds this mission to one bounded WP.

Other workflows: `docs-diagrams.yml` (filtered to `docs/architecture/assets/**`), `pr-preview.yml`
(unfiltered, every PR), `release.yml` (tags only), `storybook-deploy.yml` (`main` only; note its path
list covers `packages/styles/**` but **not** `packages/elements/**` — unrelated to this mission, noted
in passing).

**`playwright.config.ts` is at the repository root**, not under `apps/storybook/` as the mission brief
states — the repository wins. `testDir: 'apps/storybook/src/tests'`, `webServer.command:
'npx http-server apps/storybook/storybook-static --port 6006 --silent'`, `baseURL:
'http://localhost:6006'`, `reuseExistingServer: !process.env['CI']`, projects `chromium`/`firefox`/
`webkit` (firefox pinning `accessibility.tabfocus: 7` for Tab-order determinism), and
`testIgnore: PW_INCLUDE_VISUAL ? [] : ['**/visual.spec.ts']`. Snapshots live in
`apps/storybook/src/tests/visual.spec.ts-snapshots/`.

**`npm run quality:all`** = `nx run-many --target=lint --all` → `stylelint 'packages/**/*.css'
'packages/**/*.scss'` → `htmlhint 'packages/styles/src/**/*.html' 'apps/demo/**/*.html' 'audit/*.html'`.
**`npm run test`** = `vitest run`.

**`stylelint.config.mjs:22-64`** polices `['/color/', 'background', 'background-color', 'font-family',
'padding', 'margin', 'border-radius']` with `ignoreValues` already containing `Canvas`, `CanvasText`,
`Highlight`, `HighlightText`, `ButtonText`, `LinkText`, `GrayText`. It does **not** police `gap`,
`min-block-size`, `min-inline-size`, `grid-template-columns` or `display` — so C-001 (tokens
everywhere) is stricter than the gate there, and the compact rules must satisfy C-001 by review as well
as stylelint.

---

## R6 — In-repo idioms the implementation should copy rather than re-derive

* **Forced-colors Playwright spec**: `apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts`
  (23 lines) — `page.emulateMedia({ forcedColors: 'active' })`, then `getComputedStyle(...).borderTopStyle`
  and `.outlineStyle` asserted `not.toBe('none')`. `sk-notice-forced-colors.spec.ts` is the second
  example. This is the exact shape SC-009 names.
* **Compact-presentation behavioural spec**: `apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts`
  (1007 lines) — the deepest behavioural spec in the repo. Its useful transferable idioms are the
  `story(name)` URL helper, the `load(page, name, viewport)` helper that awaits
  `customElements.whenDefined` **and** `updateComplete`, exact-boundary pairs asserted on both sides of
  a threshold (`860`/`861`), and per-viewport assertions rather than per-viewport stories.
  `sk-site-footer`'s compact presentation is far smaller and must **not** grow a spec of that size;
  what it takes is the boundary-pair discipline for NFR-011 (639px/641px).
* **`presentation` is already this repo's word for it, on two elements.** `sk-app-shell` publishes
  `'compact' | 'rail-preserving'` — asserted end-to-end at `fixtures/vue-consumer/src/types.test-d.ts:45-50`
  with a `@ts-expect-error` negative on `'wide'`. `sk-action-row` publishes
  `'presentation'?: 'flush' | undefined` with the doc *"Optional container-owned presentation. Only
  `flush` is supported; invalid values use the bordered row"* (`packages/elements/vue.d.ts:36-37`).
  Both carry a **string-literal union** into the generated Vue and React surfaces, which is the pattern
  this mission mirrors for `Footer['presentation']`. They differ on whether the default is a union
  member; `sk-check-bullet` includes it (`'complete' | 'pending' | undefined`) and the plan follows
  check-bullet.
* **`sk-check-bullet`'s shared-class-helper pattern** (R1) is the model for `siteFooterClasses()`.
* **Deriving an assertion rather than restating it** — `sk-site-footer.test.ts:186-200` already derives
  the set of coloured leaves from the sheet's own rules and fails if the sheet colours something no case
  measures. The extended no-clock assertion follows the same discipline by iterating
  `Object.values(SITE_FOOTER_AXES)` rather than listing the forms by hand.

---

## R7 — Claims checked and found sound; disagreements found and named

**Checked and sound** (no repository-vs-issue conflict): `SITE_FOOTER_VARIANTS = {}` and
`SITE_FOOTER_AXES = {}` today; two navigation columns always rendered; `legal` bound as escaped text so
it cannot carry a live `<a>`; the divider conditional on the `legal` property read synchronously; the
placeholder carrying no year; 23 of 24 Family 6 screens carrying the footer with P24 excepted.

**Disagreements found, repository wins in each case:**

| Claim | Source | Repository |
|---|---|---|
| React wrappers live at `packages/react/src/site-footer/**` | mission brief; spec SC-004 / C-007 / NFR-009 | `packages/react/src/SkSiteFooter.js` and `SkSiteFooter.d.ts` — **flat**, no per-component directory |
| `playwright.config.ts` is at `apps/storybook/playwright.config.ts` | mission brief | repository root, with `testDir: 'apps/storybook/src/tests'` |
| The compact block is "one brand/wordmark plus a descriptive line" | spec Key Entities | the corpus has one tagline-ish `<p class="footer-name">` and **no** wordmark node (R2) |
| `expected-docs.json`'s footer attributes are `column-one-heading` / `column-two-heading` | `expected-docs.json:27` (`$comment`) | `headingOne` / `headingTwo`; the hyphenated names were rejected by the wrapper gate (`sk-site-footer.ts:36-43`). Count is correct; prose is stale and is left alone (R4) |

None of these changes a requirement; each changes a path or a fact the implementer would otherwise get
wrong, so each is written into the plan at the point of use.
