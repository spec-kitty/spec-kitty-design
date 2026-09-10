# Adding a component

> **Rewritten for the elements-first architecture (#72).** This document previously told you
> to run `nx g @nx/angular:component` and to export `Default`, `Mobile`, `Desktop` stories.
> `packages/angular` was deleted in #102, ADR-8 moved behaviour into custom elements, and the
> required theme variant is `LightMode`. Two pre-merge lenses flagged that this file was the
> only doc a new implementer would open and that it was actively wrong.
>
> **Updated again for the React wrapper (#76).** #75 added a fourth package, `packages/react`,
> whose contents are generated; made property and method JSDoc into enforced published API; and
> added eight gates a component must pass that this page did not name. The Angular references
> above are history, kept because they explain what changed — nothing in this repo targets
> Angular.

Components live in **four** packages, and you author in three of them:

| package | holds | you edit it | published |
|---|---|---|---|
| `packages/tokens` | `--sk-*` custom properties — the only place a colour is written | yes | yes |
| `packages/styles` | the `.css` source of record, plus **generated** static HTML | yes | yes |
| `packages/elements` | the custom element, and the **authored** markup module | yes | not yet (#80) |
| `packages/react` | **generated** React wrappers | **never** | not yet (#80) |

`packages/react/src/` is generated from `custom-elements.json` by
`scripts/build-react-wrappers.mjs` and committed. Do not hand-edit it: `--check` regenerates and
fails on any drift, on a file the generator no longer emits, and on a shrunken output set. You
do not add anything there for a new component — get the manifest right and the wrapper follows.

`packages/elements/vue.d.ts` is generated from the same manifest by
`scripts/build-vue-types.mjs` and committed. It includes observed attributes plus fields explicitly
marked `x-spec-kitty-property-only` by the manifest plugin. Do not hand-edit it: the generator
parses its own output and reconciles every emitted component and prop before `--check` compares
bytes.

> **This page used to say "There are no wrappers. ADR-8 confirmation #1 requires that none
> exist." That was true when written, and no ADR was violated by its stopping being true.**
> ADR-8 lists **four** validation criteria, unordered. #1 is *"one component ships … into three
> consumption paths … with **no wrapper package in existence**"*; #2 is *"a generated React
> wrapper of that same component passes the conformance matrix … and CI fails if the generated
> output drifts"*. What sequences them is the programme, not the ADR:
> `docs/architecture/elements-first-programme.md` assigns #1 to batch M6 (whose exit records
> "no wrapper in existence") and #2 to M9. #75 was M9. So the old sentence froze a milestone
> rather than stating a rule — and an earlier draft of *this* correction said the ADR itself
> sequenced them, which it does not.

## Steps

### 1. Author the CSS in `packages/styles`

**Give the host a box.** A custom element's UA default is `display: inline`, and `max-width`,
`width`, `margin` and vertical padding do not apply to a non-replaced inline box — so a
consumer's `style="max-width: 640px"` on your element is silently inert. Declare
`:host { display: … }` in the component's `.css`, and make it agree with the static form's own
display: `sk-section-banner` shipped `:host { display: inline-flex }` against a static
`display: flex` for one commit, and the two consumption paths rendered differently.

`:host` is accepted by `check-adopted-css-boundaries.mjs`, and a `:host { display: … }` rule
specifically is inert in the static path, where the root element IS the `.sk-<name>` div. #77 found
five committed stories whose `max-width` had never done anything.

**That "the root element IS the `.sk-<name>` div" collapse is true for `display`, and false for
three other things `:host` can carry.** ADR-15 measured all three against the real elements. Read
it before you write any `:host` rule that is not `display`.

| What you are about to write on `:host` | What the static path gets |
|---|---|
| `display: …` | The collapse holds. `.sk-<name>` restates it; nothing else is needed. |
| `container-type: inline-size` | **Not a collapse.** The static form is GENERATED (#309) and gated equal to the shadow form (#310), and it keeps the host as a **separate wrapper element**, carrying your sheet's whole `:host` declaration set. Declare `container-type` on `:host` and `scripts/build-static-form-css.mjs` picks your sheet up automatically — that one declaration IS the derivation. Do not tell anyone the static path can move `container-type` onto `.sk-<name>`. |
| `:host([attr="X"]) .sk-<name>…` gating an `@container` block | Same — the axis becomes `.sk-<name>-host--X`, on that same wrapper, not a modifier on the root class. |
| `:host(:is(…))`, `:host(:not(…))`, or a bare `:host([attr])` styling the host itself | Same family. The generator handles all four shapes and **asserts the rewrite's specificity equals the source's, per selector** — `sk-app-shell.css`'s last rule, `:host(:is([presentation="compact"], [presentation="rail-preserving"])) …[hidden]`, is load-bearing at (0,4,0) and its rewrite is (0,4,0). What it will NOT rewrite it refuses loudly: a `~=`/`^=` operator, a case-sensitivity flag, or a value that is not a lowercase BEM modifier all fail the build rather than emitting a class that silently never matches. |
| `::slotted(x)` | **Shadow-only.** No generated static form, now or planned. #311 owns backfilling the per-sheet instruction. |

**The rule behind the first two rows: an element is never its own query container.** A container
query styles a container's DESCENDANTS. In the shadow form the host establishes the container and
`.sk-<name>` is a descendant of it, so `.sk-<name>`'s own rules respond to the host's width.
Collapse the two onto one element and that element has to look further up — so it answers some
outer ancestor of your consumer's page, or nothing at all. Its *descendants* keep working, which
is why the failure is quiet: most of the sheet still behaves.

`packages/styles/src/page-header/sk-page-header.css` already had to reason about this — it uses
`@media` rather than `@container` for its stickiness rules, because the element being restyled is
the host itself.

**What a static consumer authors.** For a host-owned `container-type` or a host-attribute axis:
the two-element markup — `<div class="sk-<name>-host"><div class="sk-<name>">…</div></div>` — plus
the generated sheet, `@spec-kitty/styles/<name>/static/sk-<name>.static.css`, linked **instead of**
`sk-<name>.css` rather than in addition to it. For `::slotted(x)`: their own descendant rule in
their own stylesheet, because that kind is shadow-only and has no generated form. Say so in your
component's CSS header comment, the way `sk-app-shell.css`, `sk-action-row.css` and
`sk-entity-marker.css` now do.

**And say what the static form does NOT reproduce.** ADR-15's 2026-09-11 amendment (#375) is a
ruled limit, not an open question: `:host` declarations sit in the inner tree and beat nothing —
any document rule matching your element wins over them at any weight, in any order. On
`.sk-<name>-host` they are ordinary document declarations. Measured, both engines:
`sk-action-row { display: flex }` at (0,0,1) beats `:host`, and `div { display: flex }` at the
same (0,0,1) loses to `.sk-action-row-host`. Your instruction block owes a consumer the boundary —
**strictly higher specificity than the generated rule declaring the property, or the same
specificity in a later stylesheet** — stated generically and computed from the rule actually
emitted, never transcribed as a constant. The generated sheet's own header does this for you; do
not contradict it.

**Only four sheets carry `container-type` at all** — `sk-app-shell`, `sk-action-row`,
`sk-copy-field` and `sk-page-header` — and this whole section is about them. A host-attribute
axis in a sheet with no container (`sk-metric`, `sk-transition-matrix`, `sk-nav-pill-drawer`,
`sk-form-input`, `sk-form-textarea`) collapses onto the root class perfectly safely, and adding a
wrapper there would be an unmeasured layout change for no reason.

**The wrapper carries your sheet's WHOLE `:host` declaration set — never `container-type`
alone, and never a list copied from another component.** ADR-15 measured both failure
directions. Drop `width: 100%` from `sk-app-shell`'s wrapper and, as an item of a 300px flex
row, the component computes `width: 0px` against the real element's `300px` in both engines —
size containment means a wrapper with no width of its own contributes nothing to intrinsic
sizing. (In a grid track it measures correctly, so a page that only ever uses grid will not
show you this.) Copy that same list onto `sk-action-row`, whose `:host` declares no `width`,
and you have added a declaration the element never had. Read the sheet's own `:host`.

**And `display: contents` on the wrapper deletes the container.** `container-type` needs a
principal box; `display: contents` removes it. It looks like a harmless tidy-up of a div that
"does nothing" and it silently reverts the whole thing. (Stated from the spec — ADR-15 did not
probe it.)

**`::slotted()` has one further consequence a static rewrite cannot reproduce, so do not promise
it does.** A declaration from the outer tree beats a `::slotted()` declaration from the inner tree
**regardless of specificity and regardless of stylesheet order** — a consumer's bare `img { … }`
always overrides your `::slotted(img)`. Rewritten as a document rule, `.sk-<name>__content > img`
is an ordinary selector competing on ordinary terms.

**State the tie boundary in your instruction, not just "outbid it".** ADR-15 measured all three
regimes at both document positions, chromium and firefox identical, against a (0,1,1) rewrite:

| Consumer's rule | Consumer sheet last | Consumer sheet first |
|---|---|---|
| loses on specificity | diverges | diverges |
| **ties** | equal | **diverges** |
| strictly outbids | equal | equal |

A consumer needs *strictly higher* specificity to override the static rule reliably. At a tie —
what scoping with one wrapper class produces — the winner is stylesheet order, which a bundler
often decides. The element form would have yielded unconditionally. Compute the boundary from
your own rewrite's specificity; do not transcribe `(0,1,1)` from `sk-entity-marker`.

If your rule genuinely serves both paths, use the paired spelling this repo already established in
#78 — `.sk-<name>__y, ::slotted(.sk-<name>__y)` — one selector list, nothing written twice. It is
valid in both contexts (measured: the `::slotted()` branch does not invalidate the list, the #143
hazard), and it fixes duplication, not cascade position.


`packages/styles/src/<name>/sk-<name>.css`. This is the source of record and the only file
stylelint's `--sk-*` rule can see.

**Never write a theme selector here.** `:root[data-theme="light"] .sk-x` and `.sk-light .sk-x`
both cross a shadow boundary, so both are **inert** once the CSS is adopted by an element —
silently, with no error and no warning, producing a `LightMode` story that renders dark
styling. #72 found and repaired exactly that in `sk-card.css`.

Light-mode variance goes in **tokens**, because a custom property inherits through a shadow
boundary and a selector does not. Reuse the tint family — `--sk-surface-tint-*`,
`--sk-on-tint-*`, `--sk-border-tint-*` — rather than inventing a component-named token.
`:host-context()` is not an escape hatch: Baseline limited, Chromium-only.

### Forced-colors and reduced-motion baselines (#176)

**Reduced-motion has no working precedent to copy the effect of.** A block at
`packages/styles/src/transition-matrix/sk-transition-matrix.css:237` looks like one but isn't:
it guards `scroll-behavior`, and no component in this repo sets `scroll-behavior: smooth`, so it
disables nothing. #176 is what establishes the first real guard — `packages/styles/src/disclosure/sk-disclosure.css`
and `packages/styles/src/skip-link/sk-skip-link.css` are the working examples. The **shape** to
copy: `@media (prefers-reduced-motion: reduce)` scoped to the exact selector and the exact
transitioning property your component owns — never a wildcard over the component's own subtree.

**Forced-colors is genuinely new territory** — no `forced-colors` block existed anywhere in the
repo before #176. What follows was corrected once already, at #176's own pre-merge gate: an
earlier revision of this section named the wrong recolor mechanism. Read the correction, not just
the rule, or the next component will re-derive the wrong reason for the right-looking code.

- A plain `border` already survives `forced-colors: active` with **zero** author CSS — the
  browser remaps border colors to a system color automatically. `background`/`background-color`
  do **not** survive; they flatten to `Canvas`, and both are explicitly policed by stylelint's
  `declaration-strict-value` regardless. `box-shadow` also does **not** survive — it computes
  away entirely under forced-colors, so a focus ring built from `box-shadow` alone disappears.
  Use `outline` for focus rings; it is preserved/remapped automatically the same way `border` is.
- **A `<summary>` (like `<a>`) recolors under forced-colors intrinsically — this is a
  link-element-specific mapping to the `LinkText` system color, not a general rule that "content
  glyphs get recolored automatically".** An earlier revision of this section claimed the latter;
  isolated measurement disproves it: a bare, unstyled `<details><summary>` recolors identically
  with no CSS at all, and the actual measured colors (`rgb(255,255,0)` dark scheme /
  `rgb(0,0,159)` light scheme) are `LinkText`, not `CanvasText` (which is white/black). What IS
  still true and still load-bearing: a `background`-drawn marker/icon gets **none** of this
  automatic treatment, and forcing it to survive with `forced-color-adjust: none` freezes it at
  its **authored** color, which is frequently invisible against the forced-colors background —
  measured dark-grey-on-black in one probe. Never set `forced-color-adjust: none` on an
  affordance that must remain visible; use a content- or border-drawn technique instead, and
  verify the actual recolor mechanism for the specific element you're styling rather than
  assuming this `<summary>`-specific mapping generalizes to other elements.
  See `packages/styles/src/disclosure/sk-disclosure.css` for the worked example and its comments.
- **A CSS Generated Content glyph is part of the accessible name unless you say otherwise.**
  Measured in-engine: `.sk-disclosure__summary::before { content: '▸'; }` made the CDP
  accessibility tree report `"▸ Deployment history"` for the whole summary — every disclosure
  announced the decorative marker before its own label. Fix: `content: '▸' / '';` — CSS Generated
  Content's alt-text syntax (a second string after `/`) replaces what the glyph contributes to the
  accessible name, independent of what it paints. Use this for any `content`-drawn decorative
  glyph on a labelled control.
- `stylelint`'s `declaration-strict-value` polices `/color/` as a substring match (`border-color`,
  `outline-color`, plain `color`) plus the literal properties `background`/`background-color`. It
  does **not** police the `border`/`outline` **shorthand** forms at all, regardless of value — a
  hardcoded, non-token color in shorthand form passes identically to a compliant one. That is a
  gate being blind, not a gate being satisfied, and an earlier revision of this section
  recommended exactly that shorthand-to-dodge-the-policed-list trick. **Use the LONGHAND
  `-color` properties instead** (`border-left-color`, `outline-color`), and add the specific
  system-color keywords you use to `stylelint.config.mjs`'s `ignoreValues` — the single,
  additive, reviewable source of truth the gate then positively certifies against, rather than a property
  family it never inspects. `packages/styles/src/skip-link/sk-skip-link.css` and
  `packages/styles/src/data-table/sk-data-table.css` both use this pattern — copy it rather than
  re-deriving a new one per component.

### 2. Author the markup ONCE, in `packages/elements`

**Only if the component has a static form.** The module is optional — the generator derives its
work set by glob from the elements that have one, and #72 and #73 both declined it.

The count moves every batch, so it is deliberately not stated here —
`git ls-files 'packages/elements/src/*/*.markup.ts'` is the answer. It was eight of twelve when
#79's batch landed. (This paragraph used to end "`sk-card` is the only one today", which had
gone stale three batches before a lens caught it — on the one page a new implementer opens.)

It is evaluated **in a bare Node process** by the generator, from its own file URL. So it may
import a **leaf** — a module with no imports of its own, like
`packages/elements/src/status-indicator/status-tones.ts` — and nothing else. A bare specifier and a
non-leaf target are both refused **before** the module is evaluated, by name and naming the file
that holds the import: `build-element-markup.mjs` reads each import list from esbuild's metafile.

That is a gate rather than a convention on purpose. `import { css } from 'lit'` added to a leaf
leaves the generator *green* — some browser-facing modules survive evaluation in Node by accident —
and `import './define.js'` fails with `customElements is not defined` blamed on the markup module
rather than on the file that gained the import. Both were measured while #216 landed.

Import a leaf when the value is a **shared vocabulary** — a list a second component must agree
with. Before #216 this module was a strict leaf (it was evaluated from a `data:` URL, which has no
module base, so nothing resolved), and the only way to consume a vocabulary was to restate it and
pin the copy with an equality test. `sk-card`'s status axis was that copy;
`CARD_STATUSES = Object.fromEntries(STATUS_TONES.map(...))` is what replaced it. A restatement is
no longer the pattern to follow: nothing forces the *next* component to write its assertion, and
nothing detects that it did not.

**Keep the equality assertion anyway, and re-aim it.** Assert that the derived map's keys equal the
vocabulary, in order. Against two lists that assertion held them together; against a derivation it
constrains the *expression*, which is now the only authored thing that can be wrong — a rogue entry
appended inside the `Object.fromEntries` argument type-checks, regenerates, and passes every static
gate in this repo.

**Composing another component's stylesheet.** A component may adopt a sheet it does not author:
`sk-blog-card` does `static styles = [cardSheet, sheet]` so one box is styled by both `sk-card`
and `sk-blog-card` rather than nesting a real `<sk-card>` a shadow root deeper. Two rules if you
do this:

- **Import the sheet by relative path**, never through the package barrel. `check-adopted-css-boundaries.mjs`
  derives the adopted set from those import specifiers and now REJECTS a `static styles` entry it
  cannot trace to one — a sheet the gate cannot see is a sheet ADR-9 Confirmation #1 does not
  cover.
- **The foreign sheet goes first**, and the static path must import the two sheets in the same
  order. The element and the story are two consumption paths of one component; if their cascades
  differ, the component has diverged from itself. Nothing computes a difference today (the two
  sheets deliberately share no declaration), so this is a convention held by an identity-and-order
  assertion, not by a computed style.

`packages/elements/src/<name>/sk-<name>.markup.ts` must export:

- `<NAME>_VARIANTS` — the variant → modifier map the generator derives its exports from;
- `<NAME>_AXES` — the **other** axes, as a map of export-name-suffix to the options producing it
  (`{ Inset: { inset: true } }` for card, **`{}`** for a component with none). Not optional:
  `build-element-markup.mjs` exits with a named error if it is missing;
- `<name>StaticHtml(opts, content?)` — the server-rendered form. **An options object, not
  positionals.** The generator calls `staticHtml({}, content)` and `staticHtml(opts)`;
- `<name>Classes(variant?, …)` — the BEM class list. Not required by the generator; it is the
  element's own render helper.

**The two entry points have deliberately different failure policies, and collapsing them is a
regression this repo has already had — and reverted.** `<name>Classes` **warns and degrades** to
the base class on an unknown variant. The throwing version was tried and measured: Lit rejects
`updateComplete`, `render()` never returns a tree, and `<sk-card variant="typo">` paints an empty
shadow root with no `<slot>` — so the element silently eats its own light-DOM children. `<name>StaticHtml` **throws**, because it runs at build time where a bad variant must not
reach committed output. `sk-card.markup.ts` says so at the definition, and a test in
`fixtures/elements-behaviour/src/sk-card.test.ts` pins it.

> An earlier version of this page fixed the signature at `(variant, inset, content)` and
> attributed the throw to `Classes`. Both were wrong: `inset` is a **card** axis, which is why
> `_AXES` exists (#115/#121), and the throw belongs to `StaticHtml`. Following the old text
> reintroduced a bug #72 had fixed, and the generator would have committed base-class-only HTML
> for every variant while reporting success.

ADR-10 §3: *the element's template is the sole authored source.* `sk-<name>.html` and
`packages/styles/src/<name>/index.ts` are **generated** from this module by
`node scripts/build-element-markup.mjs`, and CI fails if they drift. Do not hand-edit them,
and do not hand-write markup in a story — render from the generated exports.

### 3. Write the element

`packages/elements/src/<name>/sk-<name>.ts`:

- `static styles = [sheet]` from the generated `sk-<name>.css.js` — never `css\`\`` in the
  `.ts`, which `scripts/check-no-css-in-source.mjs` enforces;
- register through `define()` (ADR-10 §5), and carry an **`@element sk-<name>`** JSDoc — the
  manifest analyzer cannot follow the guarded helper, and `check-manifest-content.mjs` fails
  without it;
- declare every `::part()` with `@csspart`, and **terminate the tag before any prose** — the
  description is published API and swallows the rest of the docblock otherwise;
- declare `@slot` for every slot you render. The analyzer will **not** infer one from a
  `<slot>` in the template — `sk-card` shipped without it and nothing noticed until #75;
- type every event: **`@fires {CustomEvent<{ open: boolean }>} sk-<name>-toggle - …`**. Without
  the `{Type}` the manifest records `type: None` and the generated React handler receives a bare
  `CustomEvent` with no detail. #75's plan called that gap the sharpest argument for a wrapper
  package before measuring that it was one line of our own JSDoc;
- **document every public reactive property and public method.** This is not style: the analyzer
  copies each description into `custom-elements.json`, `normalise-manifest.mjs` propagates it
  onto the attribute, and the React generator copies it into the prop docs a consumer reads in
  their editor. `scripts/check-manifest-content.mjs` **refuses** a manifest where any public
  attribute or method has no description, so an undocumented property fails CI;
- export it from `src/index.ts` and side-effect import it in `src/elements.ts`.

**Write the doc comments for a consumer, and keep rationale in `//`.** Everything in a `/** */`
above a public member is published verbatim — into the manifest, into IDE hovers, and into the
React wrapper. #75 had to move four members' prose out after it shipped, including an
809-character review narrative that referenced a getter the wrapper no longer emits. A `//`
comment reaches none of those surfaces, so it is the right home for *why*; the doc comment is
for *what*.

### 4. Record the component in the three ratchets

**Four** files hold the component's surface. None is discoverable from the code:

| file | what to add | what refuses you |
|---|---|---|
| `expected-parts.json` | every `@csspart` **and bump `total`**, in the same PR as a test targeting it. The test must live in `fixtures/**/src/**/*.test.ts` or `tests/**/*.test.ts` — the ratchet scans nowhere else | `check-part-ratchet.mjs` — shrink-only, and it compares `total` |
| `expected-docs.json` | a row with the element's attribute and method counts, **and bump `total`** | `check-manifest-content.mjs` — **exact** equality, so adding a documented property without updating this fails too |
| `behaviours.json` | a **subject** entry on the ids the component owns, plus a matching `mutations.json` entry naming the same subject file — only if it owns behaviour (step 6) | `floor-reporter.mjs` arm 5 and `suite-selftest.mjs` guard 7 — **once declared** |
| `expected-inert-theme-wrappers.json` | nothing, if you write `class="sk-light"`. If you FIX one of the remaining inert `data-theme="light"` wrappers, lower `count` in the same commit | `check-story-theme-wrapper.mjs` — shrink-only, and it fails if you fix one without lowering the count |

**The first two always. `behaviours.json` only when the component owns behaviour, and `expected-inert-theme-wrappers.json` only when you retire one of the remaining inert wrappers.** Nothing detects that
a new component *should* have a behaviour entry — declaring one creates the obligation, and
omitting it is silently green. That is a real gap, not a shortcut: step 6 is where you decide,
and the decision is yours to get right.

And if the component brings a new **package** rather than a new element, that project needs a
`typecheck` target, a `scope:` tag and a `lint` target, or it sits outside `typecheck-all.mjs`
and ESLint's module boundaries entirely. #126 shipped a package with none of the three and #129
had to fix it.

The parts ratchet is shrink-only: parts may be removed, never added silently, and the test must
land in the same PR as the entry. The docs ratchet is **exact** in both directions, because
removing a documented property is an API change and should be a deliberate line rather than a
number that quietly drops.

### 5. Stories

`packages/elements/src/<name>/sk-<name>.stories.ts`, plus the styles-layer story if the
component has a static form. Required variant: **`LightMode`**, wrapped in
`class="sk-light"` — **not** `data-theme="light"`, which activates nothing on a wrapper
because the token block anchors on `:root[data-theme="light"], .sk-light` and `:root` only
matches `<html>` (#93).

Verify LightMode actually renders light styling. Do not assume it: assert the computed value
under both themes and require them to differ.

### 6. Behaviour tests, if it owns behaviour

If the component has form association, events, focus or keyboard handling, add ids to
`behaviours.json` and tests to `fixtures/elements-behaviour/`. Read that fixture's mutation
contract first — every anchor must be unique, single-occurrence and non-inert, with an entry
in `mutations.json`, or `scripts/suite-selftest.mjs` fails the build.

A purely presentational component owns none of them and adds nothing there.

**Import the element modules the test exercises, never `@spec-kitty/elements`.** Since #225 the
mutation harness runs each arm against the test files Vitest's dependency graph says the mutated
source can reach, and one import of the package barrel — static or dynamic — puts every element
module in that test's graph, which is what made the filter inert for the whole of its first day.
Take named symbols from the module that authors them (`buttonStaticHtml` from
`button/sk-button.markup.js`, `STATUS_TONES` from `status-indicator/status-tones.js`), and add a
side-effect import for each element whose tag the file instantiates.

This is **enforced**, not requested: `scripts/check-behaviour-fixture-imports.mjs` fails on any
quoted `@spec-kitty/elements` specifier under `fixtures/elements-behaviour/src/`. `suite-budget.json`'s
`selftestCeilingSeconds` is derived from how few files each arm runs, so one such import makes the
committed ceiling stop describing the suite it bounds. A claim *about* the barrel belongs in
`tests/browser/`, which already imports it and which the gate does not scan.

`suite-selftest.mjs` guard 9 rejects, before any arm runs, a mutation whose `subject` is absent
from the selection its source resolved to — the case where the filter and `mutations.json`
disagree about which file carries the named test.

The registry's applicable id set is pinned by `tests/node/config-contract.test.ts`, which asserts
it equals ADR-11's required-behaviours list exactly — read the list there rather than trusting a
count here. This sentence used to carry one ("fifteen ids, fourteen applicable") and went stale the
moment #196/#204 added two. One entry is declared inapplicable (SC-023,
generation determinism), because ADR-11 states it as a CI-gate
obligation — `build-react-wrappers.mjs --check` discharges it — and it is in the file so the
registry mirrors the ADR's list rather than being silently short of it. You will not add a
subject for it.

Two of the sixteen are newer than the rest and are easy to miss when they apply to you (#196,
#204, added 2026-09-07):

- **SC-016, delegate/rendered-control correspondence.** If your element derives any part of its
  reported validity from an object other than the control the user interacts with — a detached
  probe, a hidden mirror, a re-derived `ValidityState` — you own this id, and the test asserts the
  two agree for the same intended state rather than merely that the host reports the right flag.
  `sk-form-input` is the only element with such a delegate today; ADR-14 records why it has one.
- **SC-017, responsive threshold.** If your component's behaviour changes below a documented
  viewport width or height, you own this id. The test asserts the shipped stylesheet declares the
  threshold at its documented figure **and** that the behaviour changes at it live, and the
  mutation goes against the **generated** `sk-<name>.css.js` — the `test` job never builds, so an
  arm against the authored `.css` is semantically inert.

### 7. Run the gates

Every command below was run against this repo when this list was written. A recipe naming a
script that has since been renamed is worse than one naming none, so if any of these fails to
resolve, fix the list rather than working around it.

```bash
# 1. regenerate every committed artifact, then let the drift checks compare
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze                 # rewrites custom-elements.json
node scripts/build-react-wrappers.mjs       # rewrites packages/react/src
node scripts/build-vue-types.mjs            # rewrites packages/elements/vue.d.ts

# 2. build, then measure — measure-elements-sizes READS dist/ and does not build it
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs        # WRITES packages/elements/SIZES.md — commit it

# 3. the drift checks
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
node scripts/build-react-wrappers.mjs --check
node scripts/build-vue-types.mjs --check
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/measure-elements-sizes.mjs --check

# 4. the content and hygiene gates
node scripts/check-manifest-content.mjs
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs            # no NEW inert `data-theme="light"` wrapper
node scripts/check-story-theme-wrapper.mjs --selftest # the gate's own probe table
node scripts/typecheck-all.mjs
npm run quality:all                           # ESLint, Stylelint, HTMLHint — all ENFORCED,
                                              # and named in no other step below

# 5. the gates' own probe tables, and the wiring that keeps them running
node scripts/build-react-wrappers.mjs --selftest
node scripts/check-manifest-content.mjs --selftest
node scripts/check-gate-wiring.mjs

# 6. COMMIT WHAT BLOCKS 1-2 REGENERATED, then confirm nothing is left over.
#    Blocks 1 and 3 are self-confirming: block 3 compares against what block 1 just wrote, so
#    they can never disagree locally. The real signal is an unstaged generated file — which CI
#    sees as drift. Generated-and-committed: the .css.js/.css.d.ts modules, the styles-layer
#    sk-<name>.html and index.ts, custom-elements.json, packages/react/src/**,
#    packages/elements/vue.d.ts, and SIZES.md.
git add -A && git status --porcelain   # must be empty before you open the PR

# 7. the suites
npm run test
node scripts/suite-selftest.mjs             # full baseline + dependency-affected suite/mutation
npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js
```

**On `measure-elements-sizes.mjs`:** it reads `packages/elements/dist/` and does **not** build
it. Running it without building first records the bytes of whatever `dist/` is on disk, and the
symptom is CI reporting different numbers for the same commit — which looks like
non-reproducibility and is not. Build first.

### 8. Visual baseline

Baselines are **CI-authoritative** — local font metrics differ. Take them from the
`visual-regression-diffs` artifact rather than from a local run.

## Rules

- No hardcoded values — only `--sk-*` tokens (stylelint enforces it).
- No theme selectors in component CSS. Tokens, always.
- No markup authored twice. Generated artifacts are exempt and must be regenerable.
- a11y addon enabled (`a11y: { disable: false }`).
- Never embed mascot illustrations in component files.

## Adding a token

New tokens go in **both** blocks of `packages/tokens/src/tokens.css` (the `:root` default and
the `:root[data-theme="light"], .sk-light` override) and require
`npx nx run tokens:catalogue` — the catalogue is a published artifact, and
`scripts/check-token-breaking-changes.sh` is blind to anything missing from it.
