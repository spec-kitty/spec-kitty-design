# ADR 15 (2026-09-10): The Static Form of Element-Backed CSS

**Date:** 2026-09-10
**Status:** Proposed. The ruling below is measured, but its adoption into implementation is gated
on the Family 4 product verdict that issue #301 records as still pending; ratification is the
operator's, not this record's.
**Deciders:** None recorded for the decision itself. Written under the operator's delegated-trust
authorization to file the Family 4 programme at ready-for-Lynn, and under the Opus rereview 04
`approve` verdict of 2026-09-10 that issue #301 cites as its provenance. No product verdict on
Family 4 is recorded anywhere, and none is cited here as evidence.
**Technical Story:** Issue #301 ([TKT1], Gap G0 of the Family 4 component-gap audit), under epic
#300. Mission `static-form-of-element-backed-css-01M248TF`.

---

## Context and Problem Statement

Three shipped CSS constructs are legitimate shadow-DOM authoring patterns — none is a defect under
the boundary rule `scripts/check-adopted-css-boundaries.mjs` enforces, whose own self-test table
accepts `:host`, `:host([attr]) <descendant>` and `::slotted(...)` compounds as owned — but none
had a demonstrated equivalent for a consumer that cannot use a shadow root at all. Family 4's
T1–T6 are Django-rendered shells. That the server-rendered path carries the majority of this
library's named consumers is ADR-10 §3's finding, not a new claim here — it names the docsite, the
marketing pages, the slidedecks and the Django UI as that majority, and made static markup
generated output rather than droppable for exactly that reason.

| # | Construct kind | Measured in | The construct |
|---|---|---|---|
| 1 | Host-attribute variant axis inside a host-owned `@container` | `packages/styles/src/app-shell/sk-app-shell.css` | `:host([presentation="compact"])` rules inside `@container (max-inline-size: 860px)`, and `:host([presentation="rail-preserving"])` rules inside `@container (max-inline-size: 1100px)` |
| 2 | Host-owned `container-type` | `packages/styles/src/action-row/sk-action-row.css` | `:host { container-type: inline-size }` (line 4) is the sole container establishing `@container (max-width: 400px)`, the file's only reflow rule |
| 3 | `::slotted()` child rule | `packages/styles/src/entity-marker/sk-entity-marker.css` | `::slotted(img)` is the only image-targeting rule in the file |

**The question.** Does the repository adopt (a) a declared, generated static form for these
construct kinds, with a gate holding the generated static form and the shadow form equal — or (b)
a stated rule that they are shadow-only, with the recipe, the ADRs and each affected component's
docs corrected to say so and to say what a static consumer must author instead?

ADR-10 §3 already ratified the shape of the answer for *markup*: the element's template is the sole
authored source and the static `.html` is generated build output, regenerable and never
hand-edited. This record extends that reasoning to the *CSS* half, which ADR-10 §3 did not cover.
It contradicts neither ADR-9 nor ADR-10 and therefore carries no amendment to either: ADR-9 §3's
"no selector may cross the shadow boundary" is untouched, and ADR-10 §3's generated-artifact
contract is the model this record follows.

### The observed failure mode (FR-009 — reported evidence, not re-measured here)

Issue #301 reports that Family 4's T3 and T4 canvases copied the
`:host([presentation="compact"])` block verbatim into a document stylesheet, where it matches
nothing, so the compact axis silently did not exist and the family hand-authored replacements.

**This is reported evidence from #301, attributed and not independently reproduced.** Those
canvases live in the planning repo (`ux_redesign/families/04-teams-membership`), which is not part
of this repository and was not reachable from the mission's workspace. It is named here because it
is the failure that motivated the question — not as a measurement this record made. What this
record *did* measure, first-hand and below, is why a naive copy of that kind fails even when the
`:host` half is correctly rewritten.

## Decision Drivers

* A ruling four gated child missions (#302, #304, #305, #307) are waiting on, so none of them
  freezes a static API by guessing.
* Evidence that is a measurement, not an assertion: a static exemplar demonstrated equal to the
  shadow form on the train ref, or a recorded negative measurement naming the mechanism that
  blocks equality (#301's acceptance bar; spec FR-008).
* The measurement has to hold for **real package consumption**, not for source examples.
* Whatever is decided must be checkable by a gate rather than by review alone — the standard
  ADR-9 and ADR-11 already set.

## The measurement

Committed under
`kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/`, re-runnable with
`node .../measurement/<construct>/run.mjs`. Per construct kind: `shadow.html`, `exemplar.html`,
`run.mjs`, `result.json`, and **two** declaration files, both committed before the probe run they
govern —

* `outcomes.declared.json`, the cycle-1 bar, never amended (`git log` on it shows one commit);
* `outcomes.declared.cycle-2.json`, which **adds** outcomes rather than rewriting any, and carries
  the errata correcting two cycle-1 outcome *labels* without touching their measured values.

**The bar is the union of the two files, and every count in this record is that union: 22 outcomes
for the host-attribute axis, 20 for the host-owned `container-type`, 10 for `::slotted()`.**
`result.json`'s `declared_outcome_sources` and `declared_outcome_count` are authoritative. Anything
downstream that inherits "the probe table" — #309 and #310 in particular — inherits **both files**:
the cycle-1 set alone does not contain the outcomes that reject an abbreviated wrapper, so a gate
built on it would accept the very form §1 rejects.

**What each side of the comparison is.**

* **Shadow side** — the real shipped custom element, loaded from the Storybook build's
  `elements-dist/elements.js` (ADR-10 §2's self-contained classic script), adopting its own
  shipped sheet. Each probe additionally cross-checks its controlled page against the real
  Storybook story of the same component and records the comparison, so the controlled page is
  *shown* faithful rather than assumed: for `sk-app-shell` the story
  `elements-skappshell--compact-860` and the controlled page agreed exactly
  (`grid-template-columns: 860px`, compact header `display: block`, at an 860px shell in both).
* **Static side** — a throwaway exemplar reproducing the element's flattened DOM, linking the
  real built CSS **through the package's own export map**: the probe server resolves
  `@spec-kitty/styles/<name>/sk-<name>.css` with `import.meta.resolve` and serves whatever file
  that returns. Every `resolved_to` path is recorded in the result record.

Chromium 151 and Firefox 153. **WebKit could not be measured** — `webkit.launch()` fails on this
host with "Host system is missing dependencies to run browsers". That is ADR-10's already-recorded
WebKit gap, unchanged and not newly introduced here.

### Real package consumption, and what #161 does and does not block (FR-004)

Measured with a real build (`rm -rf packages/styles/dist packages/tokens/dist`, then
`npx nx run tokens:build --skip-nx-cache && npx nx run styles:build --skip-nx-cache`), resolved
through the actual npm-workspace symlink `node_modules/@spec-kitty/styles → packages/styles`:

* **The per-component subpath exports resolve to real files.**
  `@spec-kitty/styles/app-shell/sk-app-shell.css`,
  `@spec-kitty/styles/action-row/sk-action-row.css` and
  `@spec-kitty/styles/entity-marker/sk-entity-marker.css` each resolve, through Node's own export
  map, to a file that exists after the build. This is the path a server-rendered consumer actually
  uses, and it is the path every measurement below was performed against.
* **The root package import is broken — for a different reason than #161 states.** #161's title
  and text say `main`/`exports` "point at a path the build never emits" and that the compiler
  never produces a `dist/src/` level. That is **false at this head**: `main` is `./dist/src/index.js`
  and the build emits exactly that file. What actually breaks a strict-ESM consumer is that the
  emitted entry re-exports its siblings *without file extensions* (`export * from './blog-card/index'`),
  which Node's ESM resolver refuses:

  ```
  import('@spec-kitty/styles')
    -> ERR_MODULE_NOT_FOUND: Cannot find module '.../packages/styles/dist/src/blog-card/index'
       imported from .../packages/styles/dist/src/index.js
  ```

  A bundler with extensionless resolution would likely tolerate it; a bare Node ESM `import` does
  not.

**Therefore #161 does not make this question unmeasurable.** It is a precisely scoped limitation
of the root barrel, owned by #161, and no construct measured here needs the root import to work.
The symptom #161 reports is real; its stated cause is wrong, and #161 should be corrected on that
point rather than treated as a blocker here.

## Decision Outcome

**The ruling differs per construct kind. It is not one global answer.**

### 1. Host-attribute variant axis **inside a host-owned `@container`** — generated static form, and only in the two-element form

**Read the qualifier as binding.** This verdict is about a host-attribute axis whose rules sit
inside an `@container` block the host itself establishes. A host-attribute axis in a sheet with no
`container-type` is a different thing and is **not** ruled on here: `sk-metric`,
`sk-transition-matrix`, `sk-nav-pill-drawer`, `sk-form-input` and `sk-form-textarea` all carry
`:host([attr])` rules with no container anywhere, the collapsed transform is sound for them, and
inserting a wrapper would be an unmeasured layout change made for no reason. Only four sheets in
`packages/styles/src` declare `container-type` at all — see "Which sheets this ruling reaches".

A static equivalent exists and was demonstrated equal on every one of the twenty-two pre-declared
outcomes, in both engines — **but only when the host is preserved as a separate wrapper element.**

Two static exemplars were measured against the same built sheet:

| Variant | Shape | Result |
|---|---|---|
| **A — collapsed** | `:host` and `.sk-app-shell` become ONE element; `:host([presentation="X"]) .sk-app-shell` becomes `.sk-app-shell.sk-app-shell--X`. This is the intuitive "host-attribute axis becomes a root-class modifier" transform the question names. | **8 of 22 outcomes diverge**, in both engines |
| **B — wrapper** | `:host` becomes a separate `.sk-app-shell-host` element carrying the sheet's **complete `:host` declaration set** and the modifier class, wrapping an unchanged `.sk-app-shell` root. | **22 of 22 equal**, in both engines |
| **B-abbrev** | The same wrapper carrying **only** `container-type: inline-size` — the shape an earlier draft of this record prescribed in prose. | **2 of 22 diverge** (O15/O16), in both engines |

**The mechanism that kills variant A, named:** *an element is never its own query container.* A
container query styles a container's DESCENDANTS. In the shadow form the host establishes the
container and `.sk-app-shell` is a descendant of it, so `.sk-app-shell`'s own
`grid-template-columns` responds to the host's width. Collapse the two onto one element and that
element must look further up for a container — so it answers to some outer ancestor, or to nothing
at all. Descendant rules keep working; the rules on the container element itself silently stop.

This repository already knew half of this. `packages/styles/src/page-header/sk-page-header.css`
records it in its own header comment — "this sheet declares `container-type: inline-size` on
`:host`, and a container query can style only that container's DESCENDANTS. The element being made
non-sticky is the host itself, so a container query cannot reach it" — and uses `@media` there for
exactly that reason. What was not previously recorded is that the same rule is what makes the
obvious static transform wrong.

Measured values, chromium. Firefox produced byte-identical values on every row of this table;
that is a property of `sk-app-shell`'s integer-pixel tracks, not a general one — see "Comparing
within one engine" below.

| Outcome | State | Shadow form | Static A (collapsed) | Static B (wrapper) |
|---|---|---|---|---|
| O1 | shell 800px, `presentation=compact` | `800px` | `56px 240px 504px` ✗ | `800px` ✓ |
| O7 | shell 1000px, `presentation=rail-preserving` | `56px 944px` | `56px 240px 704px` ✗ | `56px 944px` ✓ |
| O11 | **composed**: outer container 1400px, shell 800px, compact | `800px` | `56px 240px 504px` ✗ | `800px` ✓ |
| O13 | **composed**: outer container 500px, shell 1200px, compact | `56px 240px 904px` | `1200px` ✗ | `56px 240px 904px` ✓ |

O13 is the sharpest: a 1200px-wide shell that the real element correctly leaves at three columns
is **compacted anyway** by the collapsed static form, because it is answering a 500px ancestor it
should never have been asking. O11 is the same defect in the other direction. The composed case
is not a corner: it is any static consumer whose page already uses a container query.

**The defect is not confined to the host-attribute rules.** This sheet also carries an
*unconditional* `@container (max-width: 720px) { .sk-app-shell { grid-template-columns:
minmax(0, 1fr) } }`, which no `presentation` attribute gates. Measured with no `presentation`
attribute set at all (O19-O21, both engines): at a 600px shell the real element and the wrapper
both compute `600px`, and the collapsed form computes `56px 240px 304px` — it never sees the
breakpoint. At 760px, above it, all three agree (`56px 240px 464px`). At a 700px
`rail-preserving` shell where both the unconditional and the host-attribute rules apply (O22):
`56px 644px` for the element and the wrapper, `56px 240px 404px` for the collapsed form. So the
collapse breaks a sheet's plain container queries too, not only its host-gated ones.

**What the static path gets:** a generated `.sk-app-shell-host` / `.sk-app-shell-host--<axis>`
wrapper pair, emitted alongside the static markup and the light-DOM sheet, and gated equal to the
shadow form. **Not** a single-element root-class modifier.

**Which `:host(...)` forms this rewrite covers.** The transform above is stated for
`:host([attr="X"]) <descendant>`, which is the shape `sk-app-shell`'s axis rules mostly take — but
**not all of them, and not all of the library's.** `sk-app-shell.css` itself ends with
`:host(:is([presentation="compact"], [presentation="rail-preserving"])) .sk-app-shell__compact-navigation[hidden]`,
which is load-bearing: at (0,4,0) it is what beats the `@container`-gated `display: block` at
(0,3,0), so a generator that skipped it would leave a closed drawer visible. Elsewhere in the
library the same construct kind also appears as `:host(:not([invalid])) …` (`sk-form-input`,
`sk-form-textarea`) and as a **bare** `:host([sticky]) { position: sticky }` styling the host
itself rather than a descendant (`sk-page-header`). #309 owns handling all four shapes; this record
names them so none is discovered late.

**The wrapper carries the component's COMPLETE `:host` declaration set — not `container-type`
alone.** This is stated generically on purpose: the rule is "whatever that component's `:host`
declared, moved to the wrapper", never a fixed property list, because the right list differs per
component and a copied one goes wrong in both directions. For `sk-app-shell` the set is
`display: block; width: 100%; min-width: 0; container-type: inline-size`. Measured (O15/O16, both
engines), with the component as an item of a 300px flex row:

| Wrapper rule | `.sk-app-shell` `width` | `grid-template-columns` |
|---|---|---|
| the real element (`:host`) | `300px` | `300px` |
| wrapper with the complete `:host` set | `300px` ✓ | `300px` ✓ |
| wrapper with `container-type: inline-size` only | **`0px`** ✗ | **`0px`** ✗ |

The component vanishes. `container-type: inline-size` implies size containment, so a wrapper with
no width of its own contributes nothing to intrinsic sizing and the flex item resolves to zero.
As a control, the same abbreviated wrapper in a 300px **grid track** measures `300px` and passes
(O17/O18) — which is why an outcome table built only on block and grid layouts, as the cycle-1
table was, cannot see this at all.

The converse error is just as real, and `sk-action-row` is the case that shows it: its `:host`
declares no `width`, so the abbreviated wrapper happens to pass every one of its twenty outcomes
(§2). A prescription that hardcoded app-shell's four properties would have added `width: 100%`
where the element never had it. Hence: whatever `:host` declared, per component.

### 2. Host-owned `container-type` — **generated static form**, and only in the two-element form

The same ruling, for the same reason, on the same evidence shape: **twenty** pre-declared
outcomes, variant B equal on all twenty in both engines, variant A diverging on six.

Measured values, chromium. **Every verdict below is identical in firefox; the sub-pixel numbers
are not** — this component's grid tracks resolve from font metrics, so O3 reads
`26.5156px 299.484px` in chromium and `26.5167px 299.483px` in firefox for the same passing
comparison. See "Comparing within one engine" below before building a gate on these strings.

| Outcome | State | Shadow form | Static A (collapsed) | Static B (wrapper) |
|---|---|---|---|---|
| O1 | row 360px, `flex-wrap` | `wrap` | `nowrap` ✗ | `wrap` ✓ |
| O3 | row 360px, `.sk-action-row__trigger` `grid-template-columns` | `26.5156px 299.484px` | `26.5156px 0px` ✗ | `26.5156px 299.484px` ✓ |
| O10 | **composed**: outer container 1200px, row 360px, `flex-wrap` | `wrap` | `nowrap` ✗ | `wrap` ✓ |
| O12 | **composed**: outer container 320px, row 700px, `flex-wrap` | `nowrap` | `wrap` ✗ | `nowrap` ✓ |

Note which outcomes did *not* diverge for variant A at these widths: `grid-template-areas` on
`.sk-action-row__trigger` matched, because the trigger is a **descendant** of the container and
therefore still queries it correctly. Only the container element's own rules break at first
glance. That is what makes this defect so quiet — most of the sheet keeps working.

It does not stay quiet at the boundary. `@container (max-width: 400px)` is inclusive, and the
360/500 pair straddles it without ever touching it. Measured exactly there (O17-O20, both
engines): at **400px** the element and the wrapper compute `flex-wrap: wrap` and the collapsed
form computes `nowrap`; at **401px** the element and the wrapper keep the three-column trigger
areas while the collapsed form has already dropped to the two-column stack. So the trigger
diverges too — the cycle-1 widths simply never asked it at a width where it could.

**What the static path gets:** a generated `.sk-action-row-host` wrapper around an unchanged
`.sk-action-row` root, gated equal, carrying — as in §1 — **this component's complete `:host`
declaration set**, which here is `display: block; min-width: 0; container-type: inline-size`.
`container-type` must **not** be moved onto the root class.

For this component, and only by coincidence of its own `:host`, the abbreviated wrapper also
passes: 20 of 20 declared outcomes, both engines, including the flex-item case that breaks
`sk-app-shell`. The reason is that `sk-action-row`'s `:host` declares no `width`, so there is
nothing to lose — the real element measures `0px` in a 300px flex row too (O14), and all three
forms agree. This is the second half of §1's argument for a generic prescription rather than a
copied property list, and it is why the generator must read each component's own `:host` rather
than apply a template.

### 3. `::slotted()` child rule — **shadow-only**

The appearance is reproducible; **the cascade position is not**, and a gate holding the two forms
equal — which is what candidate (a) is — therefore cannot hold.

Ten pre-declared outcomes, both engines. The four appearance outcomes are equal for both static
rewrites measured:

| Outcome | Shadow `::slotted(img)` | Static `.sk-entity-marker__content > img` |
|---|---|---|
| O1 `display` | `block` | `block` ✓ |
| O2 `inline-size` | `32px` | `32px` ✓ |
| O3 `block-size` | `32px` | `32px` ✓ |
| O4 `object-fit` | `cover` | `cover` ✓ |

The fifth is the negative measurement:

| Outcome | Consumer's own rule | Shadow | Static |
|---|---|---|---|
| O5 | `img { object-fit: contain }` — specificity (0,0,1) | **`contain`** | **`cover`** ✗ |
| O6 | `.page-scope img { object-fit: contain }` — specificity (0,1,1) | `contain` | `contain` ✓ |

**The mechanism, named:** a declaration from the outer tree wins over a `::slotted()` declaration
from the inner tree **regardless of specificity, and regardless of stylesheet order**. So in the
shadow form the consumer's bare `img` selector — the weakest selector there is — beats the
library, always. Rewritten as a document rule, `.sk-entity-marker__content > img` is an ordinary
(0,1,1) selector competing on ordinary terms, and it wins or loses like any other.

The full matrix, measured against all three specificity regimes at both document positions
(O5-O10; chromium and firefox identical on every cell, these being keyword values). "Static" is
the descendant rewrite:

| Consumer's own rule | Consumer sheet LAST | Consumer sheet FIRST |
|---|---|---|
| `img` (0,0,1) — **loses** to the static rule | shadow `contain` / static `cover` — **diverge** | shadow `contain` / static `cover` — **diverge** |
| `.page-scope img` (0,1,1) — **ties** the static rule | shadow `contain` / static `contain` — equal | shadow `contain` / static **`cover`** — **diverge** |
| `.page-scope.theme img` (0,2,1) — **outbids** the static rule | equal | equal |

So the correct statement is three-way, not two-way: the shadow form always yields to the page; the
static form yields **only when the consumer strictly outbids it on specificity**. At a **tie** the
result depends on stylesheet order, which a consumer using a bundler often does not control — and
a tie is not an exotic case, it is what scoping with a single wrapper class produces. A cycle-1
draft of this record concluded "the static form yields only when the page outbids it" from the
`order=last` column alone; the `order=first` column falsifies it, and the sentence is corrected
here rather than left standing.

There is no document-context selector that reproduces "always lose to the outer tree, at any
weight, in any order."

Two further first-hand observations, recorded because they bound the ruling:

* **The repository's existing paired-spelling convention is valid and works.** `sk-blog-card`,
  `sk-feature-card`, `sk-ribbon-card` and `sk-site-footer` already ship one selector list serving
  both paths (`.sk-x__y, ::slotted(.sk-x__y)`, the #78 fix). Adopting
  `.sk-entity-marker__content > img, ::slotted(img)` into a real shadow root confirmed the list is
  **not** invalidated by the `::slotted()` branch (the #143 hazard) — one rule parsed, selector
  text preserved, and the slotted node picked the declaration up, in both engines. Measured as
  variant B of this probe, it produced values identical to the plain descendant rewrite, including
  the same O5 divergence: it fixes authoring duplication, not cascade position.
* The naive rewrite named in the question — `::slotted(x)` → `.sk-<name> > x` — is structurally
  wrong for this component regardless: the `<slot>` sits inside `.sk-entity-marker__content`, so a
  slotted node renders as a child of *that*, not of `.sk-entity-marker`.

**What the static path gets:** no generated, equality-gated static form. A static consumer authors
the descendant rule themselves — or takes the paired-spelling rule the sheet already ships for
components that use it — and is told, in the component's own docs, that the resulting rule sits at
ordinary document specificity and will *not* reproduce the shadow form's automatic deference to
the consumer's own stylesheet.

### Summary

| Construct kind | Verdict | Evidence |
|---|---|---|
| Host-attribute variant axis **inside a host-owned `@container`** | **generated static form**, two-element wrapper only, the wrapper carrying the sheet's complete `:host` set | `measurement/host-attribute-axis/result.json` (22 outcomes) |
| Host-owned `container-type` | **generated static form**, two-element wrapper only, same wrapper rule | `measurement/host-container-type/result.json` (20 outcomes) |
| `::slotted()` child rule | **shadow-only** | `measurement/slotted-child-rule/result.json` (10 outcomes) |
| `::part()` reached from **another sheet** — a fourth surface, found during this mission and outside #301's question | **shadow-only** for now; the decision is #314's, not this record's | `packages/styles/src/metric/sk-metric.css:67`, read against `sk-pill-tag`'s `@csspart tag` |

A host-attribute axis in a sheet with **no** `container-type` is outside all four rows: the
collapsed transform is sound there, and this record makes no claim about it.

### Which sheets this ruling reaches

`container-type` appears in exactly four sheets under `packages/styles/src`, and all four are in
scope for rows 1 and 2:

| Sheet | Kind 1 | Kind 2 | Kind 3 | Note |
|---|---|---|---|---|
| `sk-app-shell.css` | yes | yes | — | this record's kind-1 exemplar |
| `sk-action-row.css` | — | yes | — | this record's kind-2 exemplar |
| `sk-copy-field.css` | — | yes | — | `:host { container-type: inline-size }` with `@container (max-inline-size: 20rem)`. Not measured here; the ruling applies to it unchanged, because the mechanism is a property of CSS containment and not of the component |
| `sk-page-header.css` | yes | yes | yes | **all three kinds at once** — see below |

**`sk-page-header` is the mixed case, and it needs saying explicitly.** It carries
`:host { container-type: inline-size }` (kind 2), a bare `:host([sticky]) { position: sticky }`
styling the host itself (kind 1, in the bare form §1 names), and `::slotted(*)` (kind 3, owned by
#311). The three verdicts apply **independently and simultaneously**: its kind-1 and kind-2 rules
get the generated wrapper, its `::slotted()` rules do not and get a written instruction instead.
Nothing about carrying three construct kinds merges their verdicts, and a generator that treats a
sheet as having one kind will get this component wrong. Its own header comment already records
the reason it uses `@media` rather than `@container` for the sticky rules — the same
container-cannot-query-itself fact this record generalises.

### Comparing within one engine

Every table in this record prints **chromium** values. Firefox agrees on every *verdict* — all 52
declared outcomes across the three construct kinds reach the same equal/diverge answer in both
engines — but **it does not always agree on the value**. `sk-app-shell`'s tracks resolve to
integers and are byte-identical across engines; `sk-action-row`'s resolve from font metrics and
are not. For the same *passing* comparison, O3 reads `26.5156px 299.484px` in chromium and
`26.5167px 299.483px` in firefox, and O4 reads `26.5156px 328.703px 58.7812px` against
`26.5167px 332.967px 58.7833px`.

**So equivalence is a within-engine property, and any gate must compare shadow-vs-static inside
one engine and never against a literal transcribed from this record.** A gate hardcoding the
chromium strings printed above would report a false red on firefox for the *correct* wrapper. This
is stated here and in #310 because the natural way to read a printed table is to treat it as the
expected value, and here it is not one — it is one engine's rendering of a comparison whose
result, not whose digits, is what generalises.

## Which gated children may freeze a static API, and in what form (FR-003)

* **#302 — [TKT2] `sk-pill-tag` status-tone axis.** **May freeze the tone axis now — but not
  "unconditionally", and the qualifier is not in this component's own sheet.**
  `sk-pill-tag.css`'s only `:host` rule is `display: inline-flex`, which its own comment records
  as matching the static form's display and being "inert in a document"; the sheet uses no
  `container-type` and no `::slotted()`. A tone axis there is an ordinary `.sk-pill-tag--<tone>`
  root-class modifier and does not depend on rows 1-3 of the ruling at all.

  **What that check missed:** another sheet styles this component through `::part()`.
  `packages/styles/src/metric/sk-metric.css:67` carries
  `.sk-metric__annotation sk-pill-tag::part(tag)` with six declarations — `box-sizing`,
  `max-width`, `padding-block`, `padding-inline`, `overflow-wrap`, `white-space` — and no paired
  static spelling. In the element path it reaches the pill-tag's root through the shadow boundary;
  in a static composition, where a consumer writes `<span class="sk-pill-tag">` directly inside
  `.sk-metric__annotation` and there is no shadow host, it matches nothing and all six are
  silently absent. Wrapping and overflow therefore diverge between paths for a pill-tag inside a
  metric annotation. #302 may freeze the tone axis; it must **not** freeze a claim that the static
  pill-tag composes into `sk-metric` equivalently. **#314 owns that decision.**
* **#304 — [TKT4] `sk-entity-marker` size, border and image axis.** **Split.** The size and border
  axes are ordinary root-class modifiers (`.sk-entity-marker--sm`, `.sk-entity-marker--circle`) and
  may be frozen as a static API now. The **image axis may not be frozen as an equality-gated
  static API** — it is construct kind 3, ruled shadow-only above. It may be frozen as a documented
  *authoring instruction* (the paired-spelling rule), and that instruction **must state the tie
  boundary explicitly**, and must state it **generically rather than by transcribing a number**:
  a consumer overriding the static rule needs specificity **strictly higher than that of the
  rewrite they are overriding**, computed from the rewrite actually shipped. For the bare
  `.sk-entity-marker__content > img` that is (0,1,1); combine it with a size or shape modifier —
  `.sk-entity-marker--sm .sk-entity-marker__content > img` — and the boundary moves to (0,2,1),
  which matters here precisely because #304 freezes those modifiers alongside the image axis. At
  an equal-specificity selector the winner is whichever stylesheet comes last, where the element
  form would have yielded unconditionally. An instruction saying only "outbid it on specificity" is safe when followed
  literally and silently wrong at the tie, which is the ordinary case.
* **#305 — [TKT5] `.sk-button` busy axis.** **May freeze a static API now, unconditionally.** Same
  basis as #302: `sk-button.css`'s only `:host` rule is `display: inline-flex`, explicitly "inert
  in the static path". A busy axis is a root-class modifier plus ARIA on the control.
* **#307 — [TKT7] static `.sk-action-row` form with trailing controls.** **May freeze a static
  API, in the two-element wrapper form only.** This is construct kind 2. The frozen static contract
  is `<div class="sk-action-row-host"><div class="sk-action-row">…</div></div>`, where the outer
  element carries **`sk-action-row.css`'s complete `:host` declaration set** — today
  `display: block; min-width: 0; container-type: inline-size`. Freeze it as "the `:host` set",
  not as a copied property list: if that sheet's `:host` gains a declaration the wrapper owes it
  too, and #310 is the gate that will say so. #307 must **not** freeze a single-element form that
  puts `container-type` on `.sk-action-row`; O1/O3/O10/O12/O17/O20 above are what that costs, and
  the failure is silent.

  **The wrapper's CSS does not ship yet, and #307 must freeze the markup and the CSS together.**
  `grep -rn "sk-action-row-host" packages/` today returns only this mission's comments. The sheet
  a server-rendered consumer links — `@spec-kitty/styles/action-row/sk-action-row.css` — declares
  the container on `:host`, which is inert in a document; nothing in it defines
  `.sk-action-row-host`. #309 is what will emit that rule, and #309 is unbuilt. So a consumer who
  copies the markup above and links the published sheet gets **no container at all**, and
  `@container (max-width: 400px)` never fires — which is #301's originally reported failure mode,
  reproduced by following this guidance. Until #309 lands, the frozen contract is the markup
  **plus** this block, authored by the consumer in their own stylesheet:

  ```css
  /* Until @spec-kitty/styles ships it (#309): the container the element gets from :host. */
  .sk-action-row-host {
    display: block;
    min-width: 0;
    container-type: inline-size;
  }
  ```

  When #309 lands, that block becomes redundant rather than wrong, and #310 is what will hold the
  generated rule equal to the one written here.

## Relationship to #239, which this record does not decide (FR-005)

#239 asks the **inverse** question: whether a shadow-DOM element may consume a light-DOM
primitive's stylesheet (`.sk-data-table`), and by what mechanism. This record asks what static
equivalent a shadow element's **own private CSS** should have. The two share a subject — the shadow
boundary as a stylesheet boundary — and nothing else: #239 is about a sheet crossing *inward* into
a root that did not author it; this is about a sheet authored for a root being made usable
*outside* any root.

**Nothing here answers #239, and #239 must not be read as answered by it.** The one thing this
record contributes to #239's file is the O5/O6 measurement above: outer-tree declarations beat
inner-tree `::slotted()` declarations regardless of specificity, which is a cascade fact #239 will
have to reason about whichever mechanism it chooses. It does not select that mechanism.

## Consequences

### Positive

* The four gated children can act, and two of them (#302, #305) turn out not to have been gated by
  this at all — measured, not assumed.
* The static form for construct kinds 1 and 2 is now specified precisely enough to generate and to
  gate, including the part that is counter-intuitive (the wrapper element).
* The failure mode #301 reported is explained rather than merely repeated: a hand-copied static
  translation of a host-owned container query fails *even when the `:host` rewrite is correct*,
  because collapsing the host onto the root removes the container the descendants were querying.

### Negative

* Construct kinds 1 and 2 now require a static markup contract with **one more element than the
  element's own rendered tree has**. That is a real cost: `build-element-markup.mjs`'s generated
  `.html` must emit the wrapper, and a consumer who omits it gets a silently non-responsive
  component.
* **The converse cost is a migration hazard, and it lands on people who already shipped.** A
  consumer who *adds* the wrapper to markup they already have moves the element their own page
  positions: grid-area and flex-item placement, `>` child combinators, and `:nth-child()` now
  address `.sk-app-shell-host` / `.sk-action-row-host`, not `.sk-app-shell` / `.sk-action-row`.
  #301 reports that Family 4 already hand-authored static `.sk-app-shell` markup — exactly the
  population this wrapper displaces — so the generated form arriving is a breaking change for
  them and needs releasing as one, not slipping in.
* **`display: contents` on the wrapper deletes the container silently.** This is the "remove the
  redundant div" instinct a template author acts on when a wrapper looks like it does nothing,
  and it is the one edit that reverts the whole fix without leaving a trace. **Stated from the
  specification, not measured here:** `container-type` needs a principal box to establish a
  containment context, and `display: contents` removes the element's box, so the container ceases
  to exist and every `@container` rule in the sheet falls back to the next ancestor container or
  to none — the same end state as the collapsed transform §1 rejects, reached a different way. It
  is called out because it is plausible and cheap to warn about; the probe for it belongs in
  #310's table, not among this record's measured claims.
* Measured layout contexts are **block, a 300px flex row, and a 300px grid track**. Float, table
  and table-cell, and an inline formatting context are neither measured nor warned about.
  #309/#310 should widen this rather than assume the three generalise.
* No generator and no gate exist yet. Until the issues filed below land, the ruling for kinds 1
  and 2 is a specification, not an enforced artifact — and this record says so rather than
  implying the static form already ships.
* `::slotted()` gets no generated equivalent, so every component using it owes its consumers a
  hand-written instruction. Six sheets still owe one — `sk-context-sidebar`, `sk-personal-rail`,
  `sk-section-header`, `sk-notice`, `sk-page-header` and `sk-nav-pill-drawer`. That debt is
  **owned by #311**, not left to be noticed later; see "Filed follow-up work" below.

### Neutral

* WebKit is unverified, as ADR-10 already records for this class of claim.
* The measurement scripts are mission-scoped evidence, not a permanent suite. Making the
  equivalence permanent is exactly the gate work filed below.

## Confirmation

* `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/<construct>/run.mjs`
  reproduces every value in this record against the same train ref. The pre-declared bar is
  **both** `outcomes.declared.json` **and** `outcomes.declared.cycle-2.json` in each directory —
  22, 20 and 10 outcomes respectively — each committed before the probe run it governs, and
  neither rewritten afterwards. Comparisons are within one engine; see "Comparing within one
  engine" above.
* Permanent enforcement of the kind-1 and kind-2 rulings is deliberately **not** in this record's
  mission, which #301 bounds to one Work Package. It is filed as its own work:

  * **#309 — [build] generate the light-DOM static form** for the host-attribute axis and the
    host-owned `container-type`, extending `scripts/build-elements-css.mjs` /
    `scripts/build-element-markup.mjs`. Its probe table is
    both declaration files in `measurement/host-attribute-axis/` (**22** declared outcomes) and
    `measurement/host-container-type/` (**20**), including every composed case, the flex-item
    case, the unconditional-`@container` case and the exact-breakpoint cases. Inheriting only
    `outcomes.declared.json` would accept the abbreviated wrapper §1 rejects, since B-abbrev's
    only failures (O15/O16) are cycle-2 outcomes.
  * **#310 — [ci] gate the generated static form equal to the shadow form**, extending or
    paralleling `scripts/check-adopted-css-boundaries.mjs`. Its probe table is the same union of
    both declaration files, with the **collapsed** static forms and the **abbreviated**
    `sk-app-shell` wrapper recorded as red probes it must reject, and the complete-`:host`
    wrappers as the green probes it must accept. It compares within one engine.

  * **#311 — [styles] backfill the shadow-only `::slotted()` static-consumer instruction** into
    the six sheets that still owe one: `sk-context-sidebar`, `sk-personal-rail`,
    `sk-section-header`, `sk-notice`, `sk-page-header`, `sk-nav-pill-drawer`. It enumerates every
    sheet under `packages/styles/src/` containing `::slotted`, classifies each as owed, already
    discharged, or exempt-with-reason, and requires a check that refuses both the empty set and
    silent regrowth.

  * **#314 — [styles] decide the static form of cross-sheet `::part()` styling**, the fourth
    surface named in the Summary. `sk-metric.css:67` styles `sk-pill-tag` through `::part(tag)`
    with six declarations and no static spelling, and `sk-pill-tag` declares `tag` as a
    manifest-recorded public part. `expected-parts.json` records **134 parts across 28
    elements** under `scripts/check-part-ratchet.mjs` (a raw grep for the string `@csspart`
    across the element sources returns 141 occurrences, at least one of which is a maintainer
    comment mentioning the tag rather than a tag; the ratchet's manifest-derived 134 is the
    governed figure). The static question has
    never been asked of any of them. This record does not answer it and changes no sheet.

  None of #309, #310, #311 or #314 is built here. #309 and #310 name the composed cases
  explicitly, because those are the only outcomes that separate a correct static form from one
  that agrees by coincidence.

**Where issue #301's acceptance item 7 is discharged.** That item — "each affected component's
docs say what a static consumer must author instead" — applies to construct kind 3, the one ruled
shadow-only. It is discharged **in two places, and neither is a promise**: `sk-entity-marker`, the
component this record measured, carries the instruction in this record's own PR; the remaining six
sheets are owned by **#311**, with their rules enumerated per file and an acceptance bar of the
same shape as #309's and #310's. Six sheets were left outside this PR because they sit outside the
Work Package's declared file ownership, not because the debt is optional.

## More Information

* Issue #301 (this ruling's brief), epic #300, and the gated children #302, #304, #305, #307.
* #161 — owns the root-barrel defect described above, including the correction to its own stated
  cause.
* #239 — the inverse question, untouched here.
* ADR-9 §3 (no selector crosses the shadow boundary) and ADR-10 §3 (the element's template is the
  sole authored source; static forms are generated output) are the two records this one extends.
* `packages/styles/src/page-header/sk-page-header.css` — the in-repo precedent for the
  container-cannot-query-itself rule.
