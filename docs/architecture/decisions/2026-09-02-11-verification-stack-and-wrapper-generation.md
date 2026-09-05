# ADR 11 (2026-09-02): Verification Stack for Elements, and Generated Wrappers

**Date:** 2026-09-02
**Status:** Proposed
**Deciders:** MOES-Media (operator session, 2026-09-02 — lifted the charter's unit-test prohibition and selected the runner)
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

1. **Form association** — a native `<form>` submit produces the expected `FormData` entry; `setValidity` blocks submission and the message reaches the accessibility tree; form reset restores the initial value; a disabled control is excluded from submission.
2. **Event contract** — fires exactly once; the documented `detail` shape; `composed` and `bubbles` as documented; where the event is declared cancelable, `preventDefault()` demonstrably prevents.
3. **Property before upgrade** — a property assigned before the element definition loads is still applied on upgrade. Invisible to every other gate, and load-bearing for the no-build dashboard where script order is not controlled.
4. **Slot contract** — content is assigned to the intended slot; fallback content appears when the slot is empty.
5. **Focus and keyboard** — documented keys act (Escape closes), focus returns to the invoking element, and state attributes such as `aria-expanded` track the real state.
6. **Styling API** — every `::part()` the manifest declares is present and targetable from outside. This is the regression an internal rename causes, and nothing else in the pipeline detects it.
7. **Style adoption** — the element adopts a constructed stylesheet and injects no `<style>` element, so a consumer CSP without `style-src` cannot silently strip its styling.
8. **Registry guard** — a second `define` of the same tag warns and no-ops rather than throwing.
9. **Generation determinism** (Node lane) — regenerating wrappers from an unchanged manifest is a no-op, and drift fails CI.

Explicitly **not** wanted: "it renders" assertions; shadow-DOM snapshot comparisons, which are brittle and duplicate the visual baselines; tests of Lit's own reactivity; assertions on internal class names.

### Gate repairs this ADR requires

Neither is optional, because the new suite inherits the same pipeline:

* `run-axe-storybook.js` must fail on a story load error and assert a non-empty render root, instead of warning and continuing.
* `ci-quality.yml`'s `components` path filter must gain every new package directory in the same PR that creates it.

### Wrapper generation — decided in principle, generator deferred

The framework-target schema `research/001` §163 asked for: a target package is valid when it is generated from `custom-elements.json`, adds no markup, CSS or behaviour of its own, passes the conformance matrix unmodified, and fails CI when its output drifts from the manifest. A target is published only when a consumer exists.

**The generator itself is deferred to SP-6.** One correction worth recording, because ADR-8 blurred it: `@lit/react` is a runtime `createComponent()` helper called once per component by hand — it is not a generator, and it cannot satisfy the drift criterion on its own. A manifest-driven generator (`@wc-toolkit/react-wrappers` or equivalent) is a separate dependency and a separate decision.

A second correction to ADR-8's rationale, which does not change the operator's decision that React leads: React 19 scores 16/16 on Custom Elements Everywhere for both basic and advanced interop, as does Angular. A React wrapper buys JSX-level types, typed refs and SSR attribute handling — real ergonomics, but not interop. Size the wrapper mission accordingly.

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
None of today's fourteen elements takes an object prop, so nothing is broken — but `.prop` is the
binding the documentation recommends *for non-strings*, and the first element with an object prop
breaks Nuxt silently.

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
* Evidence: `scripts/run-axe-storybook.js:102`, `.github/workflows/ci-quality.yml` (`components` filter; `gate` skipped-tolerance), `packages/angular/src/lib/*/**.spec.ts`, `playwright.config.ts`.
