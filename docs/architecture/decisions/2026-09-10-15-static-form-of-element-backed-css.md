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
T1–T6 are Django-rendered shells, which is how the majority of named consumers take this library.

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
`node .../measurement/<construct>/run.mjs`. Per construct kind: `outcomes.declared.json` (the
success bar, committed in its own commit **before** any probe script or result existed),
`shadow.html`, `exemplar.html`, `run.mjs` and `result.json`.

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

### 1. Host-attribute variant axis — **generated static form**, and only in the two-element form

A static equivalent exists and was demonstrated equal on every one of the fourteen pre-declared
outcomes, in both engines — **but only when the host is preserved as a separate wrapper element.**

Two static exemplars were measured against the same built sheet:

| Variant | Shape | Result |
|---|---|---|
| **A — collapsed** | `:host` and `.sk-app-shell` become ONE element; `:host([presentation="X"]) .sk-app-shell` becomes `.sk-app-shell.sk-app-shell--X`. This is the intuitive "host-attribute axis becomes a root-class modifier" transform the question names. | **4 of 14 outcomes diverge**, in both engines |
| **B — wrapper** | `:host` becomes a separate `.sk-app-shell-host` element carrying `container-type` and the modifier class, wrapping an unchanged `.sk-app-shell` root. | **14 of 14 equal**, in both engines |

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

Measured values, chromium (firefox identical on every row):

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

**What the static path gets:** a generated `.sk-app-shell-host` / `.sk-app-shell-host--<axis>`
wrapper pair, emitted alongside the static markup and the light-DOM sheet, and gated equal to the
shadow form. **Not** a single-element root-class modifier.

### 2. Host-owned `container-type` — **generated static form**, and only in the two-element form

The same ruling, for the same reason, on the same evidence shape: thirteen pre-declared outcomes,
variant B equal on all thirteen in both engines, variant A diverging on four.

Measured values, chromium (firefox identical):

| Outcome | State | Shadow form | Static A (collapsed) | Static B (wrapper) |
|---|---|---|---|---|
| O1 | row 360px, `flex-wrap` | `wrap` | `nowrap` ✗ | `wrap` ✓ |
| O3 | row 360px, `.sk-action-row__trigger` `grid-template-columns` | `26.5156px 299.484px` | `26.5156px 0px` ✗ | `26.5156px 299.484px` ✓ |
| O10 | **composed**: outer container 1200px, row 360px, `flex-wrap` | `wrap` | `nowrap` ✗ | `wrap` ✓ |
| O12 | **composed**: outer container 320px, row 700px, `flex-wrap` | `nowrap` | `wrap` ✗ | `nowrap` ✓ |

Note which outcomes did *not* diverge for variant A: `grid-template-areas` on
`.sk-action-row__trigger` matched at every width, because the trigger is a **descendant** of the
container and therefore still queries it correctly. Only the container element's own rules break.
That is what makes this defect so quiet — most of the sheet keeps working.

**What the static path gets:** a generated `.sk-action-row-host` wrapper carrying
`container-type: inline-size` around an unchanged `.sk-action-row` root, gated equal.
`container-type` must **not** be moved onto the root class.

### 3. `::slotted()` child rule — **shadow-only**

The appearance is reproducible; **the cascade position is not**, and a gate holding the two forms
equal — which is what candidate (a) is — therefore cannot hold.

Six pre-declared outcomes, both engines. Four are equal for both static rewrites measured:

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
from the inner tree **regardless of specificity**. So in the shadow form the consumer's bare
`img` selector — the weakest selector there is — beats the library. Rewritten as a document rule,
`.sk-entity-marker__content > img` is an ordinary (0,1,1) selector and *beats* that same consumer
rule. The two forms cannot be declared equal: the shadow form always yields to the page, and the
static form yields only when the page outbids it. This is a one-way cascade property of the shadow
boundary, and there is no document-context selector that reproduces "always lose to the outer
tree."

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
| Host-attribute variant axis | **generated static form**, two-element wrapper only | `measurement/host-attribute-axis/result.json` |
| Host-owned `container-type` | **generated static form**, two-element wrapper only | `measurement/host-container-type/result.json` |
| `::slotted()` child rule | **shadow-only** | `measurement/slotted-child-rule/result.json` |

## Which gated children may freeze a static API, and in what form (FR-003)

* **#302 — [TKT2] `sk-pill-tag` status-tone axis.** **May freeze a static API now, unconditionally.**
  `sk-pill-tag.css`'s only `:host` rule is `display: inline-flex`, which its own comment records
  as matching the static form's display and being "inert in a document"; the sheet uses no
  `container-type` and no `::slotted()`. A tone axis there is an ordinary `.sk-pill-tag--<tone>`
  root-class modifier and does not depend on this ruling at all.
* **#304 — [TKT4] `sk-entity-marker` size, border and image axis.** **Split.** The size and border
  axes are ordinary root-class modifiers (`.sk-entity-marker--sm`, `.sk-entity-marker--circle`) and
  may be frozen as a static API now. The **image axis may not be frozen as an equality-gated
  static API** — it is construct kind 3, ruled shadow-only above. It may be frozen as a documented
  *authoring instruction* (the paired-spelling rule), which must state that its cascade position
  differs from the shadow form's.
* **#305 — [TKT5] `.sk-button` busy axis.** **May freeze a static API now, unconditionally.** Same
  basis as #302: `sk-button.css`'s only `:host` rule is `display: inline-flex`, explicitly "inert
  in the static path". A busy axis is a root-class modifier plus ARIA on the control.
* **#307 — [TKT7] static `.sk-action-row` form with trailing controls.** **May freeze a static
  API, in the two-element wrapper form only.** This is construct kind 2. The frozen static contract
  is `<div class="sk-action-row-host"><div class="sk-action-row">…</div></div>`, with
  `container-type: inline-size` on the outer element. #307 must **not** freeze a single-element
  form that puts `container-type` on `.sk-action-row`; O1/O3/O10/O12 above are what that costs, and
  the failure is silent.

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
* No generator and no gate exist yet. Until the issues filed below land, the ruling for kinds 1
  and 2 is a specification, not an enforced artifact — and this record says so rather than
  implying the static form already ships.
* `::slotted()` gets no generated equivalent, so every component using it owes its consumers a
  hand-written instruction.

### Neutral

* WebKit is unverified, as ADR-10 already records for this class of claim.
* The measurement scripts are mission-scoped evidence, not a permanent suite. Making the
  equivalence permanent is exactly the gate work filed below.

## Confirmation

* `kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/<construct>/run.mjs`
  reproduces every value in this record against the same train ref. `outcomes.declared.json` in
  each directory is the pre-declared bar, committed before the probes existed.
* Permanent enforcement of the kind-1 and kind-2 rulings is deliberately **not** in this record's
  mission, which #301 bounds to one Work Package. It is filed as its own work:

  * **#309 — [build] generate the light-DOM static form** for the host-attribute axis and the
    host-owned `container-type`, extending `scripts/build-elements-css.mjs` /
    `scripts/build-element-markup.mjs`. Its probe table is
    `measurement/host-attribute-axis/` (14 declared outcomes) and
    `measurement/host-container-type/` (13), including every composed case.
  * **#310 — [ci] gate the generated static form equal to the shadow form**, extending or
    paralleling `scripts/check-adopted-css-boundaries.mjs`. Its probe table is the same outcome
    set, with the **collapsed** static forms recorded as the red probes it must reject and the
    **wrapper** forms as the green probes it must accept.

  Neither is built here. Both name the composed cases explicitly, because those are the only
  outcomes that separate a correct static form from one that agrees by coincidence.

## More Information

* Issue #301 (this ruling's brief), epic #300, and the gated children #302, #304, #305, #307.
* #161 — owns the root-barrel defect described above, including the correction to its own stated
  cause.
* #239 — the inverse question, untouched here.
* ADR-9 §3 (no selector crosses the shadow boundary) and ADR-10 §3 (the element's template is the
  sole authored source; static forms are generated output) are the two records this one extends.
* `packages/styles/src/page-header/sk-page-header.css` — the in-repo precedent for the
  container-cannot-query-itself rule.
