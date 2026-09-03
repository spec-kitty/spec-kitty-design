# Mission Specification: sk-nav-pill Behaviour Element

**Mission:** `sk-nav-pill-behaviour-element-01M1K3N7` · **Issue:** #73 · part of epic #66
**Branch:** `mission/sk-nav-pill-behaviour-element` off `train/elements-first`
**Squad tier:** C — pre-merge only, 3 lenses
**Governing decisions:** ADR-8 (base layer), ADR-9 (shadow DOM and styling API), ADR-10 (§1 CSS pipeline, §3 canonical markup, §5 guarded `define`), ADR-11 (verification stack)

## Why this mission exists

`skToggleDrawer` is the entire JavaScript surface of the current catalogue: twelve lines in
`packages/styles/src/nav-pill/sk-nav-pill.js`. It is also the clearest example of the coupling
the elements-first programme exists to remove. To use it a consumer must:

1. place an element with the literal id `sk-nav-drawer` somewhere in **their** document;
2. wire `onclick="skToggleDrawer(this)"` on a button they author;
3. assign the import to `window` first, because an inline handler cannot see a module scope;
4. duplicate every nav item — once in the desktop row, once inside the drawer.

All four are visible in `apps/demo/dashboard-demo.html` today (`:497-498`, `:540`, `:529-533`
and `:569-574`), and in the Storybook story (`sk-nav-pill.stories.ts:94`, `:119`). The helper
returns `false` and does nothing if the id is missing — a silent no-op, which is the failure
mode this programme keeps finding.

sk-card (#72) proved the base layer carries a *presentational* component. This mission proves
it carries a *behavioural* one, which is the harder claim and the one ADR-11's required
behaviours were written for.

### What #72 established that this mission must not disturb

* `scripts/build-elements-css.mjs` derives its component list from the ELEMENTS that exist and
  fails on an orphan or on drift. This mission extends what it reads (see FR-011) and must
  keep `sk-card`'s generated module **byte-identical**.
* `scripts/build-element-markup.mjs` generates static markup from `*.markup.ts`. Its export
  contract is `<component>StaticHtml(variant, inset, content)` plus `<COMPONENT>_VARIANTS`,
  and it emits `Sk<Comp>InsetHTML` **unconditionally**. `inset` is a card-specific axis. See
  "Out of scope" — this mission deliberately does not give nav-pill a markup module.
* The variant failure policy is split by caller: total on the render path, throwing on the
  authoring path. Any equivalent validation this mission adds copies that split.
* Published prose (a `/** */` above an export, and every `@csspart` description) is copied
  verbatim into `custom-elements.json`. Rationale goes in `//` comments.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A consumer gets a working nav with no id contract and no `window` assignment (Priority: P1)

A Django, Jekyll or Hugo author drops `<script src="elements.js">` on a page and writes
`<sk-nav-pill>` around their own `<a>` links. The nav collapses to a hamburger below 720px and
the hamburger opens the same links as a panel. They author no id, no `onclick`, and no items
twice.

**Why this priority:** it is the mission's entire point. Every other story is a property of
this one.

**Acceptance**

1. **Given** a page with `<sk-nav-pill>` containing four `<a>` elements and no other markup,
   **when** the viewport is below the breakpoint and the hamburger is activated, **then** the
   panel opens and contains those same four links — with the links authored exactly once.
2. **Given** the same page with JavaScript disabled, **when** it loads, **then** the links are
   present, visible and navigable. A behavioural element degrades to its content.
3. **Given** two `<sk-nav-pill>` elements on one page, **when** one is opened, **then** the
   other's state is unchanged. There is no document-level singleton.

### User Story 2 - The open/close contract is a real API, observable and cancellable (Priority: P1)

A consumer opens the drawer from their own control, closes it when a route changes, and
reacts to it opening.

**Acceptance**

1. `open()`, `close()` and `toggle()` are methods on the element; `open` is a reflected
   boolean property/attribute pair, and reading it reports the true state.
2. A documented custom event fires on state change, **exactly once** per change, with a
   documented `detail` shape, and `bubbles`/`composed` as documented.
3. Calling `open()` when already open fires nothing. Idempotence is asserted, not assumed.
4. Where the event is cancellable, `preventDefault()` demonstrably prevents the change — the
   element does not open, and `open` still reports `false`.

### User Story 3 - The keyboard and focus contract is correct, not merely present (Priority: P1)

A keyboard user opens the panel, reads it, presses Escape, and lands back on the control they
came from.

**Acceptance**

1. `aria-expanded` on the invoking control tracks the true state in both directions.
2. Escape closes an open panel and **returns focus to the invoker** — the element records the
   invoker rather than assuming it is its own hamburger, because `open()` may be called from
   a consumer's control.
3. Escape on a closed panel does nothing and does not steal focus.
4. The control's accessible name changes with state, and `aria-controls` resolves — which,
   per ADR-9, requires the control and its target to be in **the same root**.

### User Story 4 - The demo page keeps working on both path modes (Priority: P2)

`apps/demo/dashboard-demo.html` is the operator-facing artifact and CLAUDE.md hard rule 7
binds it: relative `../../packages/...` paths for `file://` dev, and the `sed`-rewritten paths
`scripts/assemble-demo-dist.sh` produces for deployment.

**Acceptance**

1. The demo's header nav renders and toggles when opened directly from the filesystem.
2. It renders and toggles after `scripts/assemble-demo-dist.sh` rewrites the paths.
3. No `window.skToggleDrawer`, no `onclick` attribute, and no `id="sk-nav-drawer"` remain.

### Edge Cases

* **A property set before the definition loads.** `el.open = true` on an un-upgraded element
  creates an own property that shadows the accessor. ADR-11 required behaviour 3.
* **Escape while focus is inside the panel**, not on the invoker.
* **The invoker is removed from the DOM** while the panel is open — focus return must not
  throw.
* **`open()` called before first render**, when the shadow root exists but has not painted.
* **No items slotted at all.** The hamburger must not offer to open an empty panel.
* **A second `define('sk-nav-pill', …)`** — ADR-10 §5's guard, already covered by SC-015 for
  the package, and unchanged here.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A custom element `sk-nav-pill` is registered through the guarded `define()`
  helper and exported from `@spec-kitty/elements`.
- **FR-002**: The element exposes `open()`, `close()` and `toggle()` as public methods, and an
  `open` boolean property reflected to an `open` attribute.
- **FR-003**: The element fires a documented custom event on every state change and on no
  non-change. The event name, `detail` shape, `bubbles`, `composed` and `cancelable` are
  recorded in the element's published JSDoc and in the manifest.
- **FR-004**: The invoking control carries `aria-expanded` reflecting the true state, and
  `aria-controls` referencing the panel **within the same root**.
- **FR-005**: Escape closes an open panel and returns focus to the control that opened it,
  recorded at open time rather than assumed.
- **FR-006**: Nav items are authored **once** by the consumer and presented in both the
  desktop row and the collapsed panel. No consumer-side duplication.
- **FR-007**: `skToggleDrawer` is deleted, along with its re-export, its `.d.ts`, its README
  section and its story decorator. No compatibility shim is written.
- **FR-008**: `apps/demo/dashboard-demo.html` uses the element and resolves on both path modes.
- **FR-009**: The Storybook story for the drawer renders the element and no longer assigns
  anything to `window`.
- **FR-010**: The behaviour registry gains a **subject** dimension, so a behaviour id can be
  claimed by more than one subject and each subject's coverage is checked independently.
  Without this, deleting every `sk-nav-pill` behaviour test leaves the floor reporter green,
  because the synthetic fixture still covers the same ids — the certifying-absence shape this
  programme has now hit ten times.
- **FR-011**: `scripts/build-elements-css.mjs` adopts **every** `sk-*.css` in a component's
  styles directory, not only `sk-<name>.css`. nav-pill's drawer styling is a second sheet by
  design and static consumers link both. `sk-card`'s generated module must not change.
- **FR-012**: The mutation harness (`mutations.json`) gains one mutation per new behaviour
  test, each proving its named test goes red with no collateral.

### Non-Functional Requirements

- **NFR-001**: No CSS is authored in `packages/elements`. Both nav-pill sheets stay in
  `@spec-kitty/styles` and are adopted through the generated module (ADR-10 §1, FR-009 of #71).
- **NFR-002**: No selector in either sheet may reference an ancestor outside the element's own
  root (`:root`, `html`, `body`, `:host-context()`) — ADR-9's cross-boundary rule, and the
  defect #72 repaired for sk-card.
- **NFR-003**: The a11y gate reports zero violations for every nav-pill story, in both the
  open and closed states. A gate that only ever sees the closed state has not tested the
  keyboard path.
- **NFR-004**: No behaviour test may pass against an element that does not exist. Every new
  test is proven red-first by mutation before it is counted.

### Constraints

- **C-001**: ADR-9 governs the shadow arrangement. Its finding that **axe scopes ID lookups to
  `getRootNode()` and no cross-root reference resolves** is load-bearing here: the control and
  the panel it names must share a root. This is an application of the ADR, not a new decision —
  but it is flagged on the issue because it determines the element's shape.
- **C-002**: ADR-10 §5 — registration through `define()`, and the `@element` JSDoc annotation
  is required or the manifest carries no definition.
- **C-003**: No ADR is written or amended by this mission. ADRs are written only in #67.
- **C-004**: `kitty-specs/**`, `docs/architecture/validation/**` and `docs/learnings/**` are
  frozen historical record.
- **C-005**: Issue #13 (`Move skToggleDrawer to packages/html-js/...`) is **already closed** —
  verified, not assumed. Nothing to supersede; the issue body's instruction to close it is
  stale.
- **C-006**: `packages/styles/src/nav-pill/` already ships `index.ts`, `sk-nav-pill.html`,
  `sk-nav-pill.d.ts` and two stylesheets. `scripts/build-element-markup.mjs` would **overwrite**
  the first two the moment a `sk-nav-pill.markup.ts` appears. This mission does not create one.

### Key Entities

- **`SkNavPill`** — the element. Owns state, the event, the keyboard contract and focus return.
- **The invoker** — whatever control called `open()`. Recorded per open, not assumed.
- **The behaviour registry** (`behaviours.json`) — gains `subjects` per FR-010.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-101**: `<sk-nav-pill>` with four slotted links renders four links in the row and the
  same four in the opened panel, with the links present exactly once in the source.
- **SC-102**: `grep -rn 'skToggleDrawer' --include='*.{ts,js,html,md}'` returns nothing outside
  frozen `kitty-specs/**` and the ADR/programme prose that records it historically.
- **SC-103**: The state-change event fires exactly once per change (ADR-11 item 2 / SC-006),
  carries the documented detail (SC-007), is composed and bubbles as documented (SC-008), and
  `preventDefault()` prevents where cancelable (SC-009) — each asserted against `sk-nav-pill`,
  each with its own mutation.
- **SC-104**: `el.open = true` before the definition loads is applied on upgrade (SC-010).
- **SC-105**: Escape closes, focus returns to the recorded invoker, and `aria-expanded` tracks
  state (SC-012) — asserted against `sk-nav-pill`.
- **SC-106**: Deleting any one `sk-nav-pill` behaviour test makes the floor reporter fail,
  because the registry records the subject. Proven by mutation, not by reading FR-010.
- **SC-107**: `node scripts/build-elements-css.mjs --check` is green and `sk-card.css.js` is
  byte-identical to its pre-mission content (`git diff --exit-code` on that path).
- **SC-108**: The a11y gate is zero for every nav-pill story **including a story that renders
  the panel open**.
- **SC-109**: `apps/demo/dashboard-demo.html` toggles from `file://` and after
  `scripts/assemble-demo-dist.sh`, with no `window` assignment and no drawer id.
- **SC-110**: `node scripts/suite-selftest.mjs` reports every mutation producing its named red
  with a green baseline, at the new, larger count.

## Out of scope

- **A `sk-nav-pill.markup.ts` and generated static markup.** The generator's export contract is
  `(variant, inset, content)` and it emits `Sk<Comp>InsetHTML` unconditionally; nav-pill has
  neither variants nor an inset, so generating it would emit a meaningless
  `sk-nav-pill--inset` class — the exact "certified actively wrong output" failure #72's
  generator was hardened against. Generalising that contract belongs with the migration
  batches (#77–#79) or the recipe rewrite (#76), against more than one real second component.
  Recorded here rather than discovered later. **Filed as a follow-up issue.**
- Migrating any other component to the base layer.
- The React wrapper (#75) and the conformance matrix (#112).
- Making lint blocking (#114).
- Tightening the `::part()` ratchet's known looseness (a mention in a comment or a `test.skip`
  satisfies it, and it is not scoped per element).

## Decisions this mission does NOT make

Recorded so the pre-merge squad can check the claim rather than take it:

1. **Shadow arrangement** — determined by ADR-9's cross-root finding, applied, not decided.
2. **Registration mechanism** — ADR-10 §5.
3. **Where CSS is authored** — ADR-8 constraint 1 / ADR-10 §1.
4. **Whether the removal of `skToggleDrawer` needs a shim** — the issue body rules it out
   explicitly: nothing is published, so nothing imports it.

If a fork appears that none of these covers, work on that thread stops and it is raised on #73.
