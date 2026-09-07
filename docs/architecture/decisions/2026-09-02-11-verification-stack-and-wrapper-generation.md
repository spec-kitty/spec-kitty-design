# ADR 11 (2026-09-02): Verification Stack for Elements, and Generated Wrappers

**Date:** 2026-09-02
**Status:** Accepted (ratified by the operator, 2026-09-06 — the #200 ruling). This replaces a split status that held the ADR as a whole Proposed while the wrapper prop-name invariant subsection added 2026-09-06 stood ratified under its own #189 operator override, independent of that overall status. With the whole record Accepted there is nothing for that subsection's ratification to be independent of, so it is subsumed and the split is retired rather than left layered under the new status. #189 is undisturbed below as the authorization for *writing* that amendment outside #67 — a different act from ratifying it, and the one that is still doing work.
**Deciders:** MOES-Media (operator session, 2026-09-02 — lifted the charter's unit-test prohibition and selected the runner); the wrapper prop-name invariant subsection was ratified by the operator on 2026-09-06, in the session that dispatched the #189 mission, filed as issue #189 rather than decided in the #187 mission, as an explicit override of the "ADRs are written only in #67" rule — #176 set the precedent for ADR-10
**Technical Story:** ADR-8 constraint — a screenshot and an axe scan cannot see a broken `setFormValue`; `research/001` §163 (no schema for a valid framework target); charter amendment O5

---

## Context and Problem Statement

ADR-8 moves markup, behaviour, events, focus management and form participation out of per-framework packages and into `@spec-kitty/elements`. The repository has no way to verify any of that.

Verified 2026-09-02:

* **No test runner exists.** No `vitest`, `jest`, `karma`, `@web/test-runner` or `@testing-library/*` in `devDependencies`; no `test` target in any `project.json`. Eight `*.spec.ts` files under `packages/angular/src/lib/` are never executed by anything.
* **The charter prohibited one**, in three separate answers: *"No unit-test framework — quality signal is visual conformance and accessibility audit, not line coverage."*
* **The two gates that do exist certify things they cannot see.** `scripts/run-axe-storybook.js:102` catches a per-story load failure, emits `console.warn('⚠ … could not load')`, and continues; the process exits non-zero only when `totalViolations > 0`. A story that fails to load — or renders an empty, never-upgraded custom element — contributes zero violations and passes. Separately, `ci-quality.yml`'s `changes` filter lists only `packages/angular/**`, `packages/html-js/**` and `apps/storybook/**`, and the `gate` job treats `skipped` as acceptable, so a PR touching only `packages/elements/**` would skip a11y, visual regression and Playwright entirely and merge green.

Both gaps have the same shape: a check that passes on absence. That is tolerable for static markup and fatal for elements that own behaviour.

## Decision Drivers

* The subject under test is the platform: shadow roots, `adoptedStyleSheets`, `ElementInternals`, form association, focus order, `::part()`. A simulated DOM tests something other than what ships.
* Engine differences are the risk, not an edge case — kitty-desktop runs on WebKitGTK, and `adoptedStyleSheets` support decides whether Lit injects a `<style>` element that that app's CSP then blocks.
* There is a second, browserless subject: the manifest analyzer, the wrapper generator and its drift check, the token-catalogue script, `render-diagrams.js`.
* Playwright is already wired twice — `@playwright/test` with a root `playwright.config.ts` for visual baselines, and `playwright` + `axe-playwright` in the axe script. A second browser stack would double the CI install, the cache and the flake surface.
* The operator's constraint on scope: tests must assert behaviour that can silently break. "It renders" is explicitly not wanted, and is the exact degenerate form the hollow axe gate already demonstrates.
* Storybook's builder is unsettled (ADR-13 / SP-2). The verification choice must not depend on that outcome.

## Considered Options

* **Option A**: Vitest in browser mode, Playwright provider, plus a Node project in the same config.
* **Option B**: `@web/test-runner` + `@open-wc/testing`, with a separate runner for the Node-side tooling.
* **Option C**: Cypress component testing.
* **Option D**: Playwright alone, driving a static harness page.

## Decision Outcome

**Chosen option: Option A — Vitest, browser mode on the Playwright provider, with a Node project alongside; Playwright retained for the outer layer.**

Two layers, one browser engine stack:

| Layer | Tool | Subject |
|---|---|---|
| Element behaviour | Vitest browser mode (Playwright provider) | events, form association, focus, slots, upgrade order, style adoption, registry guard |
| Build tooling | Vitest node project, same config | manifest analysis, wrapper generation, drift check, token catalogue |
| Cross-browser, visual, a11y | Playwright (already present) | visual baselines, axe, engine parity before a release tag |

The deciding factor over Option B is the Node lane: `@web/test-runner` cannot test the generator, so choosing it means running two runners anyway. Option B remains the more conservative, more web-components-idiomatic choice and is the fallback if browser mode proves unstable in CI — the required-behaviours list below is runner-agnostic and would port unchanged. Option C is rejected for adding a second browser stack with the weakest WebKit story, on a library whose hardest facts are engine differences. Option D is rejected as a component-level tool: it is retained for exactly the outer layer it already serves.

### Required behaviours

A component is not done when it renders. It is done when every item below that applies to it has a test. This list is the gate — there is **no coverage threshold**, then or now.

Items 1-9 and 11 are each a standalone behaviour with a surgical mutation of its own. **Item 10 is not, and the difference is worth naming rather than leaving to be rediscovered:** it is a cross-cutting invariant over two sources, so it is violated by any defect that breaks either of them, and the mutation that proves it necessarily shares its red with the item whose mechanism it rides on. Adding it was an operator decision (#196), taken with that property measured and on the table; a future entry of the same shape should be recognised as such before it is minted, not after.

1. **Form association** — a native `<form>` submit produces the expected `FormData` entry; `setValidity` blocks submission and the message reaches the accessibility tree; form reset restores the initial value; a disabled control is excluded from submission.
2. **Event contract** — fires exactly once; the documented `detail` shape; `composed` and `bubbles` as documented; where the event is declared cancelable, `preventDefault()` demonstrably prevents.
3. **Property before upgrade** — a property assigned before the element definition loads is still applied on upgrade. Invisible to every other gate, and load-bearing for the no-build dashboard where script order is not controlled.
4. **Slot contract** — content is assigned to the intended slot; fallback content appears when the slot is empty.
5. **Focus and keyboard** — documented keys act (Escape closes), focus returns to the invoking element, and state attributes such as `aria-expanded` track the real state.
6. **Styling API** — every `::part()` the manifest declares is present and targetable from outside. This is the regression an internal rename causes, and nothing else in the pipeline detects it.
7. **Style adoption** — the element adopts a constructed stylesheet and injects no `<style>` element, so a consumer CSP without `style-src` cannot silently strip its styling.
8. **Registry guard** — a second `define` of the same tag warns and no-ops rather than throwing.
9. **Generation determinism** (Node lane) — regenerating wrappers from an unchanged manifest is a no-op, and drift fails CI.
10. **Delegate/rendered-control correspondence** — where an element derives any part of its reported validity from an object other than the control the user interacts with, a test asserts the two agree for the same intended state: at mount, after a post-mount change, and after two constrained properties change in the *same* update — and that neither invents a constraint the element never declared. Added 2026-09-07 (#196); see "The two entries this list was missing" below for the three measured bugs it is written from.
11. **Responsive threshold** — where a documented viewport threshold changes an element's behaviour, a test asserts that the shipped stylesheet declares that threshold at its documented figure; and, for every threshold the test lane's own viewport can cross, that the behaviour it gates actually changes at it live. Thresholds written as separate blocks are asserted separately, so each can fail alone. The live clause is scoped to what the lane can reach on purpose, and a threshold covered by declaration alone says so where it is declared — `sk-page-header`'s height threshold is the current instance. Added 2026-09-07 (#204); see the same section.

Explicitly **not** wanted: "it renders" assertions; shadow-DOM snapshot comparisons, which are brittle and duplicate the visual baselines; tests of Lit's own reactivity; assertions on internal class names.

### Gate repairs this ADR requires

Neither is optional, because the new suite inherits the same pipeline:

* `run-axe-storybook.js` must fail on a story load error and assert a non-empty render root, instead of warning and continuing.
* `ci-quality.yml`'s `components` path filter must gain every new package directory in the same PR that creates it.

### Wrapper generation — decided in principle, generator deferred

The framework-target schema `research/001` §163 asked for: a target package is valid when it is generated from `custom-elements.json`, adds no markup, CSS or behaviour of its own, passes the conformance matrix unmodified, and fails CI when its output drifts from the manifest. A target is published only when a consumer exists.

**The generator itself is deferred to SP-6.** One correction worth recording, because ADR-8 blurred it: `@lit/react` is a runtime `createComponent()` helper called once per component by hand — it is not a generator, and it cannot satisfy the drift criterion on its own. A manifest-driven generator (`@wc-toolkit/react-wrappers` or equivalent) is a separate dependency and a separate decision.

A second correction to ADR-8's rationale, which does not change the operator's decision that React leads: React 19 scores 16/16 on Custom Elements Everywhere for both basic and advanced interop, as does Angular. A React wrapper buys JSX-level types, typed refs and SSR attribute handling — real ergonomics, but not interop. Size the wrapper mission accordingly.

### The wrapper prop-name invariant this ADR omitted (#189)

**Operator override, recorded for the record.** ADRs are ordinarily written only in #67, which is
closed. Issue #189 was filed rather than decided — it was raised by the pre-merge gate on #187
("Filed rather than decided, per the operator ruling") specifically because the generator-contract
question it names is architectural and #187's own mission is not the place to rule on it. The
operator authorized amending ADR-11 for #189 the same way it authorized amending ADR-10 for #176:
this section exists under that specific, recorded authorization, not by this loop's own extension
of the "#67 only" rule to a case it happened to find convenient.

**The invariant this ADR should always have stated.** The generated React wrapper preserves the
manifest's **deliverable** field set — every public, settable field that has either an observed
attribute or the `x-spec-kitty-property-only` marker becomes exactly one prop, no more, no fewer,
and a missing, extra or misspelled field among these is a real defect the consistency gate must
catch. **A public, settable field with neither is not a defect — it is a sanctioned exclusion,**
recorded per-tag in `EXPECTED_NON_PROP_FIELDS` (`build-react-wrappers.mjs:123`) and asserted as its
own set (`:783-793`) precisely so a field that stops being deliverable starts failing instead of
silently vanishing. `sk-form-input.errorMessage` is the worked example: it is `state: true` in Lit,
observes no attribute, appears **zero** times in the generated `SkFormInput.d.ts`, and that absence
is the *correct*, gate-verified outcome, not something the invariant above should be read to
forbid. An earlier draft of this paragraph said "no more, no fewer" without this carve-out, which a
reader could mistake for "the gate treats `errorMessage`'s absence as a defect" — it is the opposite.

Among deliverable fields, the wrapper does **not** preserve casing unconditionally: for a small,
fixed set of well-known HTML-attribute-shaped names, the emitted prop follows React's own JSX
naming convention instead of the Lit field's literal spelling — `readonly` emits as `readOnly`,
`autocomplete` as `autoComplete`, `inputmode` as `inputMode`, and further entries besides —
measured directly against the installed `@wc-toolkit/react-wrappers@1.2.7` bundle (the only version
this repo has installed, pinned exactly at `package.json:49`) at authoring time: **17** total, of
which **12** actually change the name (by the table's own `name` column — the other 5,
`className`/`exportparts`/`key`/`part`/`ref`, already equal their emitted prop). Not the nineteen
issue #189 estimated; counts of an unversioned-in-this-repo internal table are not stable across
dependency versions, which is exactly why the gate reads it live rather than recording a number
here. This was true of `@wc-toolkit/react-wrappers` from the day #75 selected it (ADR-11 deferred
the generator choice itself to that mission — see the "Wrapper generation" section above); ADR-11
simply never recorded the casing behaviour that selection carried with it, because no element had
yet declared a field whose name collided with that table until `sk-form-input` did (#180, then
corrected by #187 — see below).

**The table is a package internal, not a contract this repo controls.** The rename table
(`MAPPED_PROPS` in `node_modules/@wc-toolkit/react-wrappers/dist/index.js`) is not exported by the
package. `scripts/build-react-wrappers.mjs` therefore cannot `import` it and cannot assert against
it the way it asserts against `custom-elements.json`. Two approaches were tried, in order, and the
second is the one that ships:

1. **#180 (first pass)**: a hand-copied 3-entry map (`readonly`/`autocomplete`/`inputmode`) mirroring
   three rows of the real table, later replaced by a version that folded both the expected and
   emitted prop-name sets to lower-case before comparing. Two defects, both found at review rather
   than by the gate itself: a hand-mirrored subset reds the very next element that declares a field
   outside it (`sk-form-textarea` declaring `maxlength` was the concrete example raised), and folding
   both sides means the comparison no longer asserts casing **at all** — a generator regression that
   emitted `readonly` where `readOnly` was required would print green.
2. **#187 (second pass, current)**: `loadReactPropRenameMap()` reads the real `MAPPED_PROPS` array
   out of the **installed** bundle by pattern-matching its literal source, builds a
   lower-cased-field-name → exact-JSX-prop-name map from every entry it finds, and the per-element
   comparison asserts **exact** casing (`JSON.stringify` equality, not folded) against that map. If
   the read or parse fails — a future major version of the dependency restructuring the bundle, say
   — it falls back to the original 3-entry map from #180, **with a loud `console.warn`** naming the
   failure, rather than silently degrading to a fold. An exact comparison with narrower coverage is
   still a real assertion; a folded one is not.

This is a **deliberate, fail-closed coupling to a package internal**, not a design this ADR
recommends casually. It is accepted here specifically because: the alternative (a hand-kept mirror)
goes stale the day the dependency adds a row, the table itself is small and stable (a fixed list of
well-known global HTML attributes, not something `@wc-toolkit/react-wrappers` churns), and the
failure mode when the coupling breaks is a loud warning plus a narrower-but-still-exact fallback —
never a silent pass **over the fields the fallback still covers**. The qualifier matters: the
fallback is the original 3-entry map, so with it active a generator regression renaming a field
outside that 3-entry set (`maxlength`, say) compares equal to itself and prints green — the
`console.warn` is a human-facing signal, not something that reds the gate on its own. "Fail loud"
describes the read failure, not every casing regression the narrower fallback can no longer see. A
future case that wants to assert against some other dependency's undocumented internal should be
held to the same shape regardless: read the installed artifact, compare exactly, and warn loud (not
fold, not silently trust a hand-copied mirror) when the read itself fails.

**One packaging detail worth naming rather than assuming.** The gate reads `dist/index.js`, the
package's ESM build, but the generator this gate is verifying actually *runs* through `require()`
(`build-react-wrappers.mjs:497`), which Node resolves via the package's `exports.require` to
`dist/index.cjs` — a different file. Measured, not assumed: the two builds' `MAPPED_PROPS` arrays
are byte-identical in `1.2.7`, so there is no live divergence today, but the section's whole safety
argument is "read the installed artifact." The artifact actually executing and the artifact the
gate reads are two files this repo trusts to be emitted from one source, not (yet) the same file —
a future build step that let them drift would be a packaging bug in the dependency, invisible to
this gate, rather than a caught drift.

**The worked example — `sk-form-input`.** It is the first, and to date only, element in this
repository to declare a field whose name matches an entry in `MAPPED_PROPS`. Its three affected
fields:

| Lit field (manifest / attribute) | Emitted React prop |
|---|---|
| `readonly` | `readOnly` |
| `autocomplete` | `autoComplete` |
| `inputmode` | `inputMode` |

**What a future element author must know, before naming a field.** A lowercase, HTML-attribute-
shaped field name that happens to appear in `MAPPED_PROPS` will emit camelCase in the generated
React wrapper regardless of how the manifest or the Lit class spells it. **This is unenforced
guidance, not a mechanism** — no script reads any `contract.md`, so nothing catches an author who
never writes the disclosure down, and the gate's own behaviour points the other way from what
"invisible until the gate runs" would suggest: when the rename table covers the field, the gate
stays green and never tells the author anything happened. The obligation has already failed once,
on the single worked example — `sk-form-input`'s own contract doc first asserted the *opposite*
casing behaviour during its mission's squad fold-in, corrected only once `build-react-wrappers.mjs`
was run against the real manifest and failed its own consistency check (see that contract doc's
"React wrapper contract (delta)" section, `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/
contracts/sk-form-input.contract.md`). So the disclosure obligation stated here is worth recording
as policy, but a future author should not read it as something the gate will remind them of if they
forget it.

**A cheap mechanism exists, undeployed.** `wantExact !== want` at `build-react-wrappers.mjs:669-671`
is exactly the predicate "this element hit the rename table" — true precisely when some field's
expected emitted name differs from its manifest spelling. A `console.warn` there, naming the
affected fields, would flag the moment an author's element first crosses this table, at generation
time rather than at contract-doc-review time. Recorded as a real, low-cost option; not implemented
here — a `build-react-wrappers.mjs` change is a gate-behaviour change and, per this mission's own
scope, not this docs mission's call to make unilaterally (see the consolidation verdict below for
the same boundary applied to a related question).

**That contract doc's prose is stale, and filed rather than fixed inline** (#191): it still
describes the #180 folded-comparison gate ("the consistency check now folds both … to lower-case …
rather than carrying any rename table of its own"), which #187 superseded with the exact-comparison,
real-table-reading gate described above, *and* it asserts "every rename in the generator's own
(un-exported) table is CASE-ONLY" — false for exactly the `for`/`class` rows discussed below. This
ADR does not correct that file — amending a mission's already-closed contract doc is out of this
mission's scope, C-001 — so both corrections are recorded in #191, the same way ADR-10 filed #173
rather than leave a stale instruction unowned.

**Should `REACT_PROPS` and the rename table be one mechanism?** #189's third point names a real
overlap, measurable rather than merely "adjacent": `REACT_PROPS` (`build-react-wrappers.mjs:93-105`,
the generator-supplied prop exclusion set — 12 entries: `className`, `exportparts`, `htmlFor`,
`key`, `part`, `ref`, `tabIndex`, `style`, `slot`, `id`, `children`, `dangerouslySetInnerHTML`) and
`MAPPED_PROPS`'s 17 emitted prop names share **7** entries — `className`, `exportparts`, `htmlFor`,
`key`, `part`, `ref`, `tabIndex` — **58%** of `REACT_PROPS`. Four of those seven
(`exportparts`/`key`/`part`/`ref`) are identity rows in the gate's own rename map, present purely to
be excluded, never to be renamed; the other three (`className`/`htmlFor`/`tabIndex`) are exactly the
rows a colliding field would hit. `REACT_PROPS` and the rename table are two different mechanisms in
the same file, applied at two different points: `emittedProps()` filters a `.d.ts`'s declared props
by `REACT_PROPS` *before* a prop is even classified as a value or a handler; the per-element loop
applies the rename table *afterward*, when comparing the survivors against the manifest. The
concrete collision: a manifest field whose renamed form matches a `REACT_PROPS` entry —
`tabindex` renaming to `tabIndex`, which **is** in `REACT_PROPS` — would have its renamed form
filtered out of `emittedProps()`'s result before the rename-table comparison runs, producing a
"props do not match the manifest" failure that never names the real cause.

**`for`/`class` are not the theoretical half of that collision for the reason an earlier draft of
this ADR gave — reserved words are legal JavaScript property names.** `class X { for = 1; class =
2; }` parses and both fields are settable; nothing here would stop a Lit class from declaring one.

For `for`, the real, more interesting reason nobody has hit it: **the gate's own lookup key is not
the generator's.** `loadReactPropRenameMap()` keys its map on `entry.fieldName.toLowerCase()`
(`build-react-wrappers.mjs:172`) — for the `for`→`htmlFor` row that key is `"htmlfor"`, not `"for"`.
The generator itself matches differently: `@wc-toolkit/react-wrappers/dist/index.js` looks up
`MAPPED_PROPS.find(x => x.name === attribute.name)` (its own `:1001`, `:1060`) — a lookup by the
table's `name` column, which for this row **is** the literal string `"for"`. The two keys agree on
the table's other 15 rows — the 11 case-only renames and the 4 pure-identity rows, where the
manifest field's lower-cased spelling and the table's `name` column coincide — and diverge on
`for`: a manifest field literally named `for` would be renamed by the generator but not predicted
by this gate, and nobody has hit it to notice. (`class` is a further divergence, by a different
mechanism, discussed on its own below — it is not one of these 15, but its own key-agreement story
does not mirror `for`'s either, so it is not folded into this "14 vs 1" framing.)

`class` is a different, less-verified case, worth recording as such rather than folding into the
same claim: its row's `name` column is `"className"`, not `"class"` — the literal HTML attribute
name lives in a third column, `originalName: "class"`, that neither the gate nor the `addAttribute`
lookup above reads. The generator's source shows a separate `attributeMapping`/keyword-exception
path (`getMappedAttribute`, `throwKeywordException`) that a manifest attribute literally named
`class` may go through instead — this ADR did not trace that path fully, and does not claim the same
key-mismatch mechanism applies to `class` as verified above for `for`. What is verified is only that
this repo's gate has no code that reads `originalName` at all, so if the generator does treat a
literal `class` attribute specially via that column, this gate would not know to expect it.

**Verdict: not worth consolidating now.** Two reasons, independent of scope:

1. **No element has hit either collision yet.** `tabindex` is a real, plausible future field name (a
   focus-order override is a defensible thing for an interactive element's manifest to expose); `for`
   and `class`, now confirmed legal, are less plausible but no longer merely theoretical. Nothing in
   this repository declares any of them today. Consolidating now would be preventive maintenance on
   a gate that has never actually produced the confusing message it is accused of — a real cost
   against a speculative one.
2. **The two mechanisms serve genuinely different questions**, and folding them risks conflating
   "excluded from comparison" with "renamed within comparison." `REACT_PROPS` answers "does the
   generator supply this prop itself, independent of the manifest"; the rename table answers "does
   the manifest's field survive with a different spelling." A merged mechanism would need to encode
   both questions in one structure, which is a more subtle bug surface to introduce than the
   confusing-message problem it would fix. The cheaper fix, if and when an element does declare a
   colliding field, is a better error message: detect that a `want` entry's renamed form is in
   `REACT_PROPS` and say so directly ("field X renames to Y, which the generator supplies itself and
   excludes from comparison") rather than restructuring how exclusion and renaming interact.

**This verdict is a recommendation for the operator to weigh, not a change this mission makes** —
consolidating `REACT_PROPS` and the rename table is a code change to `scripts/build-react-wrappers.mjs`
that alters gate behaviour, and this docs mission's brief is explicit that such a change is not its
call to make unilaterally, independent of whether reason 1 or 2 above turns out to be right. If a
future mission or the operator judges otherwise — including simply disagreeing with either reason —
that is a legitimate reversal of this verdict, but it is that code change, requiring its own review,
not something this ADR amendment authorizes by having discussed it.

### The two entries this list was missing (#196, #204)

**Operator ruling, 2026-09-07, recorded for the record.** This ADR has been `Accepted` since the
#200 ruling, so amending it needs its authorization written down where a reader looks, the way
#176 did for ADR-10 and #189 did for the wrapper prop-name subsection above. The ruling: *"Rule both
now. Add both entries in a single ADR-11 amendment: a required behaviour for probe/rendered-control
correspondence (#196), and an id that lets a responsive threshold carry a mutation (#204)."* Chosen
over a propose-and-batch process and over keeping the list operator-only case by case, on the stated
reasoning that the two missions that hit this boundary had already measured what their entries need
to say — and that this was the **fifth** time a mission reached it (#140, #143, #77, #177, #178),
each time stalling. The ruling also fixed the bar: *"Both entries must be falsifiable in the way
ADR-11 requires — each with a red-first mutation, not a prose obligation. An entry no arm can fail
is the defect this list exists to prevent."*

#### Item 10, written from three measured bugs rather than from the abstraction

ADR-14 records the mechanism: `sk-form-input` merges five UA constraint flags from a permanently
detached probe `<input>` rather than from the rendered control, and records that its mitigation is
*"narrow and empirical — three specific, tested synchronization rules … not a structural guarantee
that a fourth such bug cannot exist."* The three bugs, all measured during #180's development:

1. **Read before write.** Reading the rendered control's `.validity` from `willUpdate()` reads the
   *previous* render. `pattern="[a-z]+"`, then `el.value = '123'` — the host reported valid and a
   real `form.requestSubmit()` succeeded with `123` in `FormData`.
2. **`?? ''` compiled an absent constraint into a present one.** `control.pattern = this.pattern ??
   ''` compiles to the HTML pattern algorithm's `^(?:)$`, which matches only the empty string, so a
   plain, unconstrained `"x"` reported `patternMismatch: true`.
3. **Assignment order.** A same-update `type` `number`→`text` with `value` `'123'`→`'abc'` under
   `pattern="\d+"`, assigned value-then-type, silently sanitized the probe's value to `''`; the
   merge reported no flags while the rendered control genuinely mismatched `\d+`.

Items 1 and 2 are one source disagreeing with the intended state; item 3 is the two live sources
disagreeing with each other. All three are observable as **one** assertion — the flags the host
reports against the flags the rendered control itself computes — which is what item 10 requires and
what `[SC-003][SC-016] the probe and the rendered control agree for the same intended state` now
asserts, across all three shapes plus the negative case item 2 needs.

**The three bugs are the floor, not the ceiling.** Written from them, the entry would have tested
only `pattern`, and a pre-merge lens showed what that leaves open: the other four delegated flags —
`rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `typeMismatch` — were asserted *false* in every
case, which they would have been anyway, so a sync defect landing on `min`/`max`/`step`/`type`
instead of `pattern` (bug 2's shape, one attribute over) would have passed every assertion. That is
exactly the fourth-of-the-same-shape ADR-14 says it cannot rule out, and it was reachable through
the entry as first drafted. The test now drives all five flags true in some case.

`badInput` is deliberately **outside** the correspondence claim. ADR-14 records it as the one flag
with two writers, and the second of them fires precisely where the rendered control legitimately
reports nothing — a property-assigned value the UA sanitizes away raises `badInput` on no real
control. Asserting correspondence there would assert the opposite of the shipped design.

**The red, demonstrated rather than asserted.** `mutations.json` carries the arm as SC-016 — the
type-before-value reversal, ADR-14's own "clearest instance" — re-keyed from SC-003, where it had
been filed for want of an id:

```
FAIL |browser (chromium)| fixtures/elements-behaviour/src/sk-form-input.test.ts >
  [SC-003][SC-016] the probe and the rendered control agree for the same intended state
AssertionError: after a same-update type and value change:
  expected { patternMismatch: false, …(4) } to deeply equal { patternMismatch: true, …(4) }

FAIL |browser (chromium)| fixtures/elements-behaviour/src/sk-form-input.test.ts >
  [SC-003][SC-016] a `type` change and a `value` change in the SAME update validate against
  the NEW type — the probe-ordering fix
AssertionError: text "abc" against \d+ must mismatch: expected false to be true
```

Both tests carry the id, so guard 5 sees no collateral; the second is the host-side assertion that
already existed for this defect and the first is the correspondence assertion this item adds.

#### What the machinery resisted, and what was done about it

Worth recording because it is a real property of this list rather than an implementation detail: a
correspondence entry is **not independently breakable**. It is violated by any defect that breaks
either source, so `scripts/suite-selftest.mjs`'s guard 5 — which requires a mutation to be surgical
— sees it as collateral. Measured before the entry was written: with the assertion in place, **four**
existing `sk-form-input` arms red it — the merged-flag loop, the probe's `value` sync, the
`pattern` forwarding, and the type-before-value ordering. The last became this item's own arm and
the third was re-sited (below), which leaves two reaching the correspondence test as arms of
another id.

Two ways to express that were available. Marking those arms `expectCollateral: true` would have
removed guard 5's blast-radius bound from three surgical arms in order to make room for one new id,
and was rejected on that ground. What shipped instead names the shared claim on the **test**: a test
name may carry more than one id — `[SC-002][SC-003] a readonly control still submits but is barred
from constraint validation` has been in that file since #180 — and both guard 4 and guard 5 read the
marker, so a test marked `[SC-003][SC-016]` is *named* for both and neither arm becomes collateral.
The one arm that could not be handled that way, SC-013's constraint-forwarding arm, was re-sited
from `pattern` to `inputmode`: with item 10 in force, dropping `pattern` from the rendered control is
a correspondence defect as well as a forwarding one, while `inputmode` reaches no validity at all.
That is a like-for-like exchange — the `[SC-013]` test asserts six forwarded attributes and the arm
drops one of them either way — and the `pattern` case is not left unwatched: it is measured red by
the item 10 test. Measured once, by hand, and **not** mechanized: no committed arm applies "drop
`pattern` forwarding" and asserts it reds `[SC-016]`, because such an arm would red the `[SC-013]`
test too. A pre-merge lens named that, and it is filed as **#236** rather than fixed
here — an arm for it needs guard 5 to be able to read a declared entanglement, which is a
gate-behaviour change this amendment's ruling does not authorize.

#### Item 11, and the constraint that made it necessary

`sk-page-header` (#182) returns a sticky header to normal flow below 720px of width and below 480px
of height, in two deliberately separate `@media` blocks so either can fail alone. Both thresholds
had real tests and **no** re-derived red, for a reason that is structural rather than an oversight:
`scripts/suite-selftest.mjs`'s guard 7 is set equality — `uncovered` rejects a declared pair with no
mutation and `unknown` rejects a mutation naming no declared pair — and
`tests/node/config-contract.test.ts` pins `behaviours.json`'s applicable set to this list exactly. So
a breakpoint could not carry a mutation until this list named one. Verified against both files on
this branch, not taken from the issue.

The arms mutate the **generated** `packages/elements/src/page-header/sk-page-header.css.js`. That is
forced: the `test` job never builds, so an arm against the authored `.css` would be semantically
inert; `SC-010`'s existing arm against generated `packages/react/src/SkTransitionMatrix.js` is the
precedent. Two arms, one per threshold, and the height arm reds only the sheet-reading assertion —
which is the measured proof that the two blocks fail independently, the property #182 wrote them
separately to obtain.

```
# the width arm
AssertionError: stickiness must be dropped inside (max-width: 720px):
  expected undefined to be 'static'
AssertionError: below the documented width a sticky header must return to normal flow:
  expected 'sticky' to be 'static'

# the height arm — one red, in the sheet-reading test alone
AssertionError: stickiness must be dropped inside (max-height: 480px):
  expected undefined to be 'static'
```

Its live assertion is driven by the `sticky` **attribute**, not the property, so that the existing
SC-010 arm — which flips `reflect` on that property — does not red it for a reason that has nothing
to do with a threshold.

Two blind spots a pre-merge lens found in the first draft, both closed, both the same shape as item
10's own subject — a *declared* state diverging from the *computed* one. Reading the two documented
blocks says nothing about a **third**: a spurious `@media (max-width: 1200px)` unsticking the header
far too early satisfies every declaration assertion, and the live check cannot see it either,
because the lane sits at 414px where the bogus rule and the real one agree. The test now asserts the
set of conditions that unstick the host is *exactly* the two documented ones. And `declarationIn`
matches a rule by its exact selector text, so a later, differently-worded rule restoring the
elevation inside the same block would leave it reporting the original value; the live half now
measures the computed `box-shadow` rather than reading it. The height threshold keeps only its
declaration arm, because no live measurement of it is available in this lane.

### The fourth-target extension cost — MEASURED (#81, ADR-8 confirmation #4)

ADR-8's confirmation criterion #4 is the claim this programme rests on: that adding a framework
target is additive and cheap. #81 required it be measured, with the target chosen and written down
*before* the work so the result could not be shaped by what turned out easy.

**Target: Vue 3, declared on #81 at 2026-09-04T22:53:20Z**, deliberately as the harder of the two
candidates — Solid compiles element creation directly and would have flattered the result.

**Measured elapsed — two figures, because one of them alone is misleading.**

| | |
|---|---|
| declaration → first working commit | **~8 minutes** |
| declaration → green on CI | **~6h32m**, across three CI defects and their fixes |

The first number is the cost of *writing* the target. The second is the cost of *landing* it, and a
lens was right that reporting only the first is the shaping #81 exists to prevent. What the extra
six hours actually bought is worth naming, because it is not generator cost and a fifth target would
not pay it again in the same shape:

1. a browser-lane test used a **dynamic** import, which Vite's scanner cannot see, so the dependency
   was discovered mid-run and hung webkit — the job ran to GitHub's 360-minute default and was
   cancelled. The test needed no DOM and now lives in the node lane.
2. the fixture imported `@spec-kitty/elements/elements.js`, a subpath the vitest alias does not
   cover, resolving to a `dist/` the `test` job never builds.
3. the fixture asserted `adoptedStyleSheets.length`, which is SC-014's contract, so a mutation
   reddened two tests and the harness refused the collateral.

All three are **harness-integration** cost, not framework cost: the price of adding a fixture to an
unfamiliar lane. Against the one-day timebox both figures pass, and #81's diagnostic — *"if it takes
a week, the generator is not finished"* — is answered either way.

**Result: no package.** Vue 3 uses the elements directly, including `v-model`. Measured in a real
Vue render (`fixtures/vue-consumer/`), not read from documentation: elements upgrade, a plain `:`
binding takes the DOM-property route, `.prop` stays reactive across updates, `v-model` binds both
directions on a form element, the real `sk-nav-pill-toggle` event reaches a Vue handler, and
`@input` from `sk-form-input` retargets to the host with its value already synced.

None of that needed a wrapper — the same conclusion this ADR already records for React 19, that a
wrapper buys ergonomics rather than interop, arrived at independently for a second framework.

The fixture resolves `@spec-kitty/elements` through the vitest alias to **source**, not to the built
bundle: the `test` job never builds. It does not assert `adoptedStyleSheets`, because that is
SC-014's contract and asserting it here broke mutation attribution. Both are recorded because an
earlier revision of this paragraph claimed the opposite of each.

What the target *did* need was a generator emitting one `.d.ts` from the same
`custom-elements.json` the React generator reads, and one documentation page. For comparison,
`build-react-wrappers.mjs` is 843 lines and produces a published package, because React below 19
set every prop as an attribute and non-string values never reached the element.

**The prediction, correctly scoped — my first account of it over-corrected.** I predicted the cost
would be `compilerOptions.isCustomElement` configuration, and recorded that as *wrong*. A lens
pointed out it was substantially **right**: that configuration is required for Single File
Components, the default and dominant Vue authoring mode, which this ADR's own documentation page
leads with.

What is actually false is a narrower sub-claim — that Vue warns on every unregistered-looking
`<sk-*>` tag. It does not, on the runtime-compiler path, where the full build defaults
`isCustomElement` to `tag => !!customElements.get(tag)`. That is a property of the full build's
`compileToFunction` and has held since Vue **3.3**, not 3.5 as first recorded:

| tag | registered | Vue warnings |
|---|---|---|
| `sk-button` | yes | **0** |
| `not-registered-el` | no | 1 |
| `NotAThing` | no | 1 |
| `blahtag` | no | 1 |

Vue was confirmed to be in dev mode first — a production build strips warnings entirely and would
have produced the same silence for an unrelated reason. Two of these four rows are asserted in
`fixtures/vue-consumer/`; the other two were probes.

So the discriminator is the registry, not the hyphen, and on that path the real requirement is
**import order** rather than configuration. But reaching that path needs an explicit
`vue: 'vue/dist/vue.esm-bundler.js'` alias — `vue`'s own exports resolve to a runtime-only build
with no compiler — so most consumers are not on it, and the prediction holds for the ones who
are not.

**What this does and does not establish.** It is one target, measured once, by someone who already
knew the codebase — a floor on the cost, not an average, and an unfamiliar maintainer would take
longer. It says nothing about a framework with poor custom-element support; Vue and React both
score well on Custom Elements Everywhere, and a target that scored badly is where the additive
claim would actually be tested. It says nothing about **SSR**, which is where the React generator has all its machinery
(`ssrSafe`, `"use client"`, a deferred element import, attribute-only first render). The Vue result
is a client-side render only. Measured afterwards with `@vue/server-renderer`: string, number and
boolean `.prop` bindings serialise as attributes, but an **object** `.prop` is dropped entirely.
`sk-transition-matrix` now takes readonly arrays through `.prop`, so this is an active SSR
limitation: structured data must be assigned during client hydration. Supporting that input during
SSR needs a separate serialization design; the client-side Vue declaration does not solve it.

And it does **not** establish the schema's third clause. `research/001` §163 reads in full: *"a
target package is valid when it is generated from `custom-elements.json`, adds no markup, CSS or
behaviour of its own, **passes the conformance matrix unmodified**, and fails CI when its output
drifts from the manifest."* A lens caught an earlier version of this paragraph quoting clause one
and concluding the schema held — while the conformance matrix was never run for Vue. `react-wrapper`
is a declared subject in `behaviours.json` for SC-002 (form association) and SC-006 (event
contract), with mutations behind both; `vue` appears in neither file, and SC-401/402/403 sit outside
the declared id range, so the mutation harness requires nothing of them. The **mutation harness** therefore requires nothing of the Vue
fixture. (An earlier version of this paragraph said deleting the fixture outright would leave every
gate green. That was true when written and is not now: the fold added
`scripts/check-vue-template-types.mjs`, an ENFORCED step that reads `Good.vue`, so removing the
fixture reds `lint-code`. Two lenses caught the sentence outliving its own commit.)

What this establishes, then, is narrower than "the schema held": for a modern framework the manifest
is sufficient to produce a working, type-checked target, and clauses one, two and four of the schema
were met. Clause three was not attempted, and a fifth target should either register conformance
subjects or say the same thing here.

### Consequences

#### Positive

* Behaviour that no screenshot or axe scan can see becomes verifiable, in the engines that actually ship it.
* One browser stack, one config, two lanes. **Amended by #71:** "no second install in CI"
  was wrong. There is no cross-job browser cache in `ci-quality.yml` — `a11y`,
  `visual-regression` and `playwright` each run their own `playwright install`, and the new
  `test` job does too. The claim that holds is *no second browser STACK*: one engine family,
  installed per job like every other browser job here. Measured cost: webkit 4.8 s,
  chromium 11.7 s to download, plus the `--with-deps` apt transaction.
* The required-behaviours list is portable — a runner change does not invalidate the standard.
* Repairing the axe gate makes every existing a11y result meaningful for the first time.

#### Negative

* Vitest browser mode is the younger of the two credible options; Option B is the documented fallback.
* CI time grows. The charter's Storybook budget (NFR-003, under three minutes) does not
  cover a test suite, and a new budget has to be set rather than assumed. **Set by #71** in
  `suite-budget.json`: a ceiling the `test` job asserts rather than a number recorded in
  prose, covering the suite only. The mutation harness runs fifteen more suites and is a
  separate step — a ceiling that mixed them could not tell you which had regressed.
  Where this budget ultimately belongs is an open operator question: the charter's
  Performance Benchmarks would be the natural home, but `charter.md` and `charter.yaml`
  currently contradict each other and ADR-11's own citation for how amendments happen
  ("never by hand (CLAUDE.md §7)") does not check out — §7 is "Don't break the demo pages."
* The eight orphaned Angular `*.spec.ts` files are removed with `packages/angular` rather than ported; nothing is lost, because nothing ran them.

#### Neutral

* This ADR does not select the wrapper generator, and does not settle Storybook's builder.

### Confirmation

1. A deliberately broken `setFormValue` and a deliberately mis-fired event each fail CI — demonstrated red before green, not asserted.
2. A story that fails to load fails the axe gate instead of passing it.
3. A PR touching only `packages/elements/**` runs a11y, visual regression and Playwright rather than skipping them.
4. `npm run test` covers both lanes from one config.

## More Information

* Amended by O5, the charter amendment lifting the unit-test prohibition in `languages_frameworks`, `testing_requirements` and `quality_gates`. Charter changes go through `spec-kitty charter interview → generate → sync`, never by hand (CLAUDE.md §7).
* Related: ADR-8 (base layer), ADR-9 (styling API — items 6 and 7 verify what it declares), ADR-13 (Storybook builder), SP-1 (gate repair), SP-6 (generator selection).
* Amended by #189 (operator override, same precedent as ADR-10's #176): the wrapper prop-name invariant, omitted from this ADR's original "Wrapper generation" section — see that section's "The wrapper prop-name invariant this ADR omitted (#189)" subsection.
* Raises: #236 — item 10's entanglement with item 1 is expressed by naming both ids on one test, which no script can read back; and the `pattern`-forwarding case it now covers rests on a one-time manual measurement rather than on a committed arm.
* Amended by the #196/#204 operator ruling of 2026-09-07: required behaviours 10 (delegate/rendered-control correspondence) and 11 (responsive threshold) — see "The two entries this list was missing (#196, #204)". This is the first amendment made while the record is `Accepted` rather than `Proposed`, which is why the authorization is recorded there in full.
* Evidence: `scripts/run-axe-storybook.js:102`, `.github/workflows/ci-quality.yml` (`components` filter; `gate` skipped-tolerance), `packages/angular/src/lib/*/**.spec.ts`, `playwright.config.ts`, `scripts/build-react-wrappers.mjs` (`REACT_PROPS`, `loadReactPropRenameMap`, per-element prop comparison), `kitty-specs/form-input-constraints-and-datalist-01M1S94Y/contracts/sk-form-input.contract.md` ("React wrapper contract (delta)").
