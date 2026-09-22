# Research: `.sk-progress--indeterminate`

**Mission:** `progress-indeterminate-01M25C78`

**Issue:** [#306](https://github.com/spec-kitty/spec-kitty-design/issues/306) `[TKT6]
.sk-progress--indeterminate — accessible unknown-duration activity over the existing progress
family`, part of [#300](https://github.com/spec-kitty/spec-kitty-design/issues/300) (epic), Gap G5.

**Research date:** 2026-09-10

**Repository revision inspected:** `5061e68` (`mission/progress-indeterminate`, cut from
`train/elements-first` at the head named in this mission's dispatch).

**Decision status:** complete enough for implementation, with one execution risk (the cross-engine
indeterminate rendering technique) explicitly carried forward rather than resolved here, and one
cross-mission decision (the TKT5/TKT6 activity-cue pairing) resolved in this document and restated
verbatim in `spec.md`.

## Question and boundary

Two things this research resolves:

1. **The component question.** How does `.sk-progress--indeterminate` extend the existing
   `packages/styles/src/progress/` family — shipped by #210, TKW2 — to express unknown-duration
   activity, while preserving #210's three-flat-children markup contract exactly, adding no invented
   ARIA, surviving `prefers-reduced-motion: reduce` without ever reading as complete or empty, and
   rendering consistently on Chromium, Firefox and WebKit.
2. **The pairing question #306 and #305 jointly own.** Whether one activity-cue primitive can serve
   both this standalone track and #305's in-button busy cue. #306 starts first (confirmed: no
   `button-busy-axis` mission directory exists under `kitty-specs/` on this checkout), so this
   research is where that decision is made, not merely referenced.

Evidence is registered in [`research/source-register.csv`](./research/source-register.csv);
individual findings are cross-referenced by `E-*` ids in
[`research/evidence-log.csv`](./research/evidence-log.csv).

## Executive conclusion

Add `.sk-progress--indeterminate` as a root-class modifier on the existing `packages/styles/src/progress/`
family. No new package, no custom element, no ADR-15 dependency — measured directly against
`sk-progress.css`, this family carries no `:host`, no `::slotted()`, no `container-type` and no
`::part()` reference; it has no shadow root at all (`sk-progress.css`'s own header comment: "No
shadow root: this component has no custom element"). ADR-15 rules on shadow-DOM-backed CSS
constructs specifically; there is nothing here for it to reach. [E-001, E-002, E-003]

The markup contract is #210's three-flat-children shape, unchanged in order and count:

```html
<div class="sk-progress sk-progress--indeterminate">
  <label class="sk-progress__label" for="sync-progress">Syncing your changes</label>
  <progress class="sk-progress__bar" id="sync-progress"></progress>
</div>
```

`__meta` is omitted here because it is optional for indeterminate (no percentage exists to state);
when a consumer supplies one anyway, it must not assert a percentage — see R-03.

**The pairing decision (R-00, below): two independently-authored activity cues, not one shared
primitive.** #306's cue is a real, semantically-exposed `<progress>` element; #305's cue is required
by its own issue to be presentational, live inside a button's fixed-size box, and work uniformly
under `disabled`/`aria-disabled` without adding a second widget to the accessibility tree. These are
incompatible postures, not merely different styling. Full rationale in R-00.

## Authority and conflict resolution

Evidence is applied in this order:

1. #306's own binding text — outcome, public contract, pairing-decision clause, required stories and
   tests, non-goals, boundary.
2. #305's binding text, read for the pairing decision only — its constraints are binding on what
   #306 may rule, not on what #306 itself builds.
3. #300's epic-level dependency map and shared constraints (#286 copy rule; #301/ADR-15's static-form
   scope, which the epic's own dependency map states #306 does **not** depend on).
4. #210's binding contract for the family #306 extends — the three-flat-children order, the
   consumer-supplies-everything rule, and the explicit "indeterminate loading" non-goal #306 now
   discharges.
5. ADR-9 (styling API — the cross-root ID findings do not apply; no shadow root exists here), ADR-10
   (styles-only class ruling — this family already qualifies, per #210's own research), ADR-11
   (verification stack — not applicable beyond axe/visual, since this component owns no behaviour
   registry entry), ADR-15 (measured not to reach this family; see R-01).
6. `docs/contributing/adding-a-component.md`'s current recipe — specifically the forced-colors/
   reduced-motion baselines section and the ADR-15 `:host`/`container-type`/`::slotted()` table,
   consulted to confirm none of its rows apply here.
7. #119 and #136 — named directly in #306's issue as prior browser-matrix history to check before
   relying on any cross-engine assumption.

No source conflicts were found between #306 and #210: #306 discharges a non-goal #210 named
explicitly ("indeterminate loading" is listed in #210's non-goals) on terms #210 itself set (reuse
the same three children, the same modifier-class mechanism already used for `--compact`/`--narrow`).

## R-00 — The TKT5/TKT6 activity-cue pairing decision

**This section is the canonical ruling. `spec.md`'s "Cross-Mission Decision" section restates it
verbatim for #305 to link.**

### The question

Both #305 and #306 carry the identical clause: decide, before either freezes its own contract,
whether one activity-cue primitive can serve both the in-button busy cue (#305) and the standalone
indeterminate track (#306).

### The constraint intersection, stated side by side

| Axis | #306's binding requirement | #305's binding requirement |
|---|---|---|
| DOM primitive | A real `<progress class="sk-progress__bar">` with **no `value`** attribute — mandated by #306's own outcome text, not a design choice this research is free to change | Not specified as any particular element; evidence names hand-rolled `.saving-spinner`/`.sending-spinner` — a compact glyph, not a track |
| ARIA/exposure | **Exposed** as a progress indicator: "the bar is exposed as a progress indicator with no value; the supplied label names it" — a real, named widget in the accessibility tree | **Owns no announcement.** "The button owns no announcement... this component creates no live region and sets no `role=status`." Read together with "the accessible name is the supplied one in both states" (not two names, not a name plus a nested widget), the cue is meant to be non-exposed decoration — the label swap is what carries state to AT, not the cue |
| Shape/sizing | Full-width standalone track (existing family: `width: 120px; height: 4px` default, `--narrow` fills its container) — sized for a labelled row of its own | Must reserve **fixed space inside a button's own box**, tested for zero layout shift, across every button tone **and** `--sm`/`--icon` — a compact, inline-sized glyph, not a track |
| Disabling mechanism | Not applicable — a standalone track has no disabled state | **Must own neither** `disabled` nor `aria-disabled`; must render correctly under either, chosen by the consumer |
| Reduced motion | Animation stops; track **stays visibly present as activity** — never full, never empty | Animation stops; cue **stays visible and detectable** — must not disappear |
| Composition model | **No shadow root.** Styles-only family, no custom element (confirmed in R-01) | `sk-button` **is** a shadow-DOM custom element (ADR-15's own text: "`sk-button.css`'s only `:host` rule is `display: inline-flex`") |
| Cross-engine risk | The dominant, explicitly named risk: valueless `<progress>` carries UA-supplied indeterminate rendering that differs per engine (#119/#136 precedent: this repo has twice found engine-specific rendering/testing holes in exactly this territory) | Not named as a risk in #305 at all — because #305's evidence describes a hand-authored spinner, which has no native-element rendering to diverge across engines in the first place |

### The ruling

**Two independently-authored activity cues. No shared general-purpose primitive.**

1. **Semantic posture is incompatible, not merely different-looking.** #306's contract requires the
   cue to *be* a real, ARIA-silent-because-native progress indicator — genuinely exposed to assistive
   technology as a progress widget. #305's contract requires the button to own no announcement and to
   preserve a single accessible name across idle/busy — which only holds cleanly if the cue itself
   contributes no competing accessible object. Nesting a real `<progress role="progressbar">` inside
   a `<button>` — even valueless, even with no invented ARIA on it — adds a second, distinct
   accessible-tree node inside a control #305 requires to expose exactly one name and no other
   widget. Making #305 consume #306's primitive means either #306 relaxes its "no invented ARIA on an
   exposed progress indicator" contract to add `aria-hidden` for #305's sake (a change to a shipped,
   already-approved family contract for a reason belonging to a different component), or #305 accepts
   a second exposed widget it does not want and cannot suppress without ARIA it explicitly says it
   should not need to invent.
2. **Composition models do not meet.** #306's family has no shadow root at all — it is pure static
   HTML/CSS with no element, confirmed in R-01. `sk-button` is a shadow-DOM custom element. A "shared
   primitive" would have to be simultaneously consumable as bare light-DOM markup (for #306's
   no-element family) and as shadow-DOM content one element adopts (for #305) — the
   adding-a-component.md "Composing another component's stylesheet" mechanism exists for one *shadow
   element* adopting another's sheet; it has no analogue for a light-DOM-only family handing a
   fragment to a shadow-DOM element, and inventing one here would be new architecture built to serve
   a naming coincidence, not a measured need.
3. **Shape and sizing regimes do not overlap.** #306's track is sized to sit in its own labelled row
   (the default 120px×4px track, or `--narrow`'s fill-the-container form). #305 needs a cue small
   enough to sit inside a `--sm`/`--icon` button next to label text with zero measured layout shift.
   Family 4's own hand-authored evidence (`.saving-spinner`, `.sending-spinner`) independently
   confirms the shape #305 actually needs is a compact spinner glyph, not a horizontal track — the
   two components are not converging on one shape from two contexts, they start from different
   shapes.
4. **The cross-engine risk is native-`<progress>`-specific and must not be imported into #305's
   contract.** #306's dominant, named risk is UA-supplied indeterminate rendering divergence — exactly
   the class of defect #119 (a browser-matrix hole in a different feature) and #136 (WebKit-specific
   media-query re-evaluation failure) already demonstrate this repository is capable of shipping
   unnoticed. If #305 consumed a `<progress>`-based cue to satisfy "sharing," it would inherit that
   same native-rendering cross-engine risk for a component whose own contract — as written — carries
   no such risk today (a CSS-only decorative cue has no UA-native rendering to diverge). Importing
   a risk into #305 to manufacture sharing is not a savings; it is a new liability with no
   corresponding benefit, since the two cues do not need to look alike.
5. **Both issues already name the alternative as their default, and forbid the alternative's
   opposite as a non-goal contingent on this exact decision.** #306's non-goals list "a spinner glyph
   for general use"; #305's non-goals list "a general-purpose spinner component (unless the TKT6
   pairing decision explicitly rules for one, in which case it is delivered where that decision
   says)." Both issues already anticipate that the default outcome is two cues, and only an explicit,
   evidenced ruling for sharing overrides that default. The evidence above does not clear that bar —
   it argues the other way, on accessibility posture, composition model, and shape/sizing, not on
   preference.

### What each mission may and must not freeze as a result

- **#306 (this mission) may freeze:** the real, valueless `<progress class="sk-progress__bar">` as
  its sole activity cue, exposed with no invented ARIA, exactly as its own issue already requires.
  Nothing about this ruling changes #306's own contract — the ruling confirms #306 proceeds exactly
  as specified, without waiting on or adapting to #305's shape.
- **#305 must not freeze:** a shared cue primitive sourced from `.sk-progress`, and must not
  attempt to reuse `sk-progress__bar` or any `<progress>`-based element as its busy cue.
- **#305 must author its own cue**, independently, sized and exposed for its own context: a compact,
  presentational (not independently name-exposed) visual, reserving fixed space inside the button box
  it lives in, working uniformly under `disabled`/`aria-disabled`, remaining visible (not hidden) and
  non-animating under `prefers-reduced-motion: reduce`, and — per its own non-goals list — **not** a
  general-purpose spinner component; it is scoped to `sk-button` alone, the same way #306's cue is
  scoped to the progress family alone.
- **Neither mission is authorized to build a general-purpose spinner component** as a side effect of
  this ruling; this ruling is explicitly a decision *against* that shape, not a deferral of it.

### Where this is recorded

Canonically in this document (`kitty-specs/progress-indeterminate-01M25C78/research.md`, this
section, R-00) and restated verbatim in `kitty-specs/progress-indeterminate-01M25C78/spec.md` under
"Cross-Mission Decision: TKT5/TKT6 Activity Cue." #305 links to `spec.md`'s section as the
citable record, since `spec.md` is the mission's outcome-facing document. [E-004, E-005, E-006,
E-007, E-008, E-009, E-010]

## Decisions and rationale

### R-01 — ADR-15 does not reach this component; independence confirmed, not assumed

**Decision.** `.sk-progress--indeterminate` proceeds with no dependency on ADR-15 or on #301's
ruling. [E-002, E-003, E-011]

**Why.** ADR-15 rules on three shadow-DOM CSS construct kinds: a host-attribute axis inside a
host-owned `@container`, a host-owned `container-type`, and `::slotted()` child rules — plus a
fourth, `::part()` reached from another sheet, which ADR-15 explicitly declines to rule on (assigned
to #314). All four presuppose a shadow root. `packages/styles/src/progress/sk-progress.css`'s own
header comment states plainly: "No shadow root: this component has no custom element (styles-only,
ADR-10's 'Styles-only components are a class, not a fixed exception count' section), so no `:host`
rule applies here." A direct grep of the file confirms zero occurrences of `:host`, `::slotted`,
`container-type`, or `::part` — this is a measurement, not an inference from the comment alone.
[E-002, E-003]

**Consequences.** No wrapper element, no generated `.sk-progress-host` pairing, and no gate from
#309/#310 (ADR-15's follow-through missions) applies to this family. The modifier `.sk-progress--indeterminate`
is an ordinary root-class modifier exactly like the existing `.sk-progress--compact`/`.sk-progress--narrow`
— the same mechanism #210 already used, extended on the same terms. This matches #306's own epic-level
placement: #300's dependency map lists #306 with "no #301 dependency; already styles-only," and this
research confirms that by measurement rather than repeating the epic's assertion.

### R-02 — `.sk-progress--indeterminate` is a root-class modifier; the omitted `value` attribute is the only markup change

**Decision.** The modifier adds one root class, `sk-progress--indeterminate`, next to the existing
`.sk-progress` class. The only structural change to the three-flat-children markup is that
`<progress class="sk-progress__bar">` carries **no `value` attribute at all** — not an empty string,
not `value="0"`, not an out-of-range value relied upon to fail-safe into indeterminate. `max` may
still be present or absent per HTML's own rules (its default is `1` when a valueless/max-less
`<progress>` is later given a value, but for a genuinely indeterminate control neither matters to
rendering). [E-001, E-004]

**Why.** #306's outcome text is explicit: "a real `<progress class="sk-progress__bar">` with **no
`value` attribute**." Relying on an empty-string or invalid `value` to trigger indeterminate mode
would depend on HTML parsing edge-case behaviour (per WHATWG HTML, an unparsable `value` also yields
an indeterminate progress bar) rather than the attribute's plain absence — an implementation detail
with more surface for cross-engine divergence than simply never writing the attribute. Omission is
also what every generated fixture can assert directly and unambiguously: "no `value` attribute
present," not "a `value` attribute present but unparsable."

**Consequences.** The generated static-markup barrel (`packages/styles/src/progress/index.ts`) needs
at least one new fixture whose HTML string contains no `value="..."` substring on its `<progress>`
tag. The existing `sk-progress.spec.ts` test `readFixtures`/`parseFixture` helpers assume every
fixture has parseable `value`/`max` (used in the "every maintained fixture keeps its visible meta
text consistent" test) — this assumption breaks the moment an indeterminate fixture is added to the
same barrel and must be corrected in the same commit that adds the fixture (see R-03 and the plan's
test-impact section), not discovered later as a red build.

### R-03 — `__meta` is optional; when present it must not assert a percentage

**Decision.** For indeterminate fixtures, `sk-progress__meta` may be omitted entirely (a supported,
tested state — #306: "`__meta` becomes optional, and its absence is a supported tested state"). If a
consumer supplies meta text anyway (e.g. a short status word), it must not read as a percentage or
fraction, because none exists. This mission's own maintained fixtures therefore include at least one
indeterminate-with-meta fixture whose meta text is non-numeric (e.g. "Syncing…"), and at least one
indeterminate-without-meta fixture, per #306's own required-stories list ("indeterminate with a
label; indeterminate without meta; indeterminate with meta"). [E-001, E-012]

**Why.** #210's existing `sk-progress.spec.ts` test ("every maintained fixture keeps its visible meta
text consistent with its own value/max pair") parses every barrel export looking for a `\d+%` pattern
and a matching `value`/`max` pair. That test's premise — every fixture has a value/max and a
percentage meta — is now false for indeterminate fixtures, by #306's own design. The plan/tasks phase
must scope that existing test to the determinate fixtures only (by name or by a shared naming
convention such as an `Indeterminate` substring) rather than either loosening it globally (which
would silently stop catching a real determinate-fixture regression) or leaving it broken (which would
red the build on the very first indeterminate fixture added). [E-012, E-013]

**Consequences.** This is a concrete, scoped test-file edit for the plan/tasks phase to assign
explicitly as its own subtask, not an incidental side effect discovered mid-implementation.

### R-04 — Cross-engine coverage is proven through the existing unfiltered `playwright` CI job, not a new mechanism

**Decision.** Functional, DOM/computed-style-level cross-engine consistency (not pixel parity) is
proven by extending `apps/storybook/src/tests/sk-progress.spec.ts` (or a sibling
`sk-progress-indeterminate.spec.ts` in the same directory) with assertions that run unfiltered
through the existing `playwright` CI job in `.github/workflows/ci-quality.yml`. That job runs
`npx playwright test` with no `--project` filter against `playwright.config.ts`'s three declared
projects — `chromium`, `firefox`, `webkit` — after `npx playwright install --with-deps`, which
installs all three engines on the CI runner. This is the **only** place in this repository's CI where
WebKit actually executes; it is the mechanism, already wired, that satisfies #306's "rendering
verified on all three engines" acceptance criterion. No new workflow, job, or install step is
required. [E-014, E-015, E-016]

**Locally**, this host cannot run WebKit — `webkit.launch()` fails with "Host system is missing
dependencies to run browsers," the same gap ADR-15's own measurement recorded and #301's dispatch
brief names explicitly for this mission. Verification during specify/plan/tasks and later
implementation runs `npx playwright test --project=chromium --project=firefox` locally; the WebKit
leg is verified by the `playwright` CI job on the mission's PR, which is authoritative for it — this
is consistent with this project's own stated convention that a CI-run cross-browser leg is
authoritative for an engine that cannot run on the workstation (the same posture ADR-15 itself took
for its own WebKit gap, and the same posture this repo's memory records for visual baselines
generally: CI-authoritative, not locally assumed). [E-014, E-017]

**What this deliberately does not do.** It does not add Chromium/Firefox/WebKit visual-regression
(pixel) baselines. `visual-regression` in `ci-quality.yml` runs `--project=chromium` only, by
existing, already-documented repository policy ("visual baselines exist for chromium only... Enforced
VR gate runs chromium-only for now; cross-browser smoke still exercises all three browsers"). Adding
firefox/webkit pixel baselines for this one component would be a repository-wide policy change this
mission is not chartered to make (the same shape of overreach #286's own gate work explicitly avoided
for a different rule — "do not build a repo-wide gate"). "Renders consistently" for #306's purposes is
proven by computed-style and DOM-structure assertions (track present, not full, not empty, fill/track
distinguishable, three-child order preserved) executed identically on all three engines by the
existing unfiltered `playwright` job — not by comparing screenshots. [E-016, E-018]

### R-05 — The indeterminate visual is an authored, token-driven animation, not a reliance on native UA indeterminate rendering

**Decision.** The indeterminate "activity" look (#306: "the animation stops... the track stays
visibly present as activity") is authored CSS — a `--sk-motion-*`-token-driven `@keyframes` animation
applied via the same vendor pseudo-element surface the determinate family already uses
(`::-webkit-progress-bar`/`::-webkit-progress-value`/`::-moz-progress-bar`), not a reliance on each
browser's own built-in indeterminate paint. [E-019, E-020]

**Why.** A UA's native indeterminate rendering (a) is not switched off by `prefers-reduced-motion:
reduce` on its own — reduced-motion only affects author-authored `animation`/`transition`
declarations, not internal browser chrome-level rendering — so #306's binding requirement that "the
animation stops" under reduced motion is unsatisfiable without an authored animation to stop in the
first place; and (b) is exactly the named cross-engine risk: each engine's default indeterminate
paint differs, and the determinate family's own existing pattern of resetting the vendor
pseudo-elements (`appearance: none` plus explicit `::-webkit-progress-bar`/`::-webkit-progress-value`/
`::-moz-progress-bar` rules) is already how this repository takes control of `<progress>`'s rendering
away from the UA default for the *determinate* case; the same technique extends naturally to the
indeterminate case. [E-019, E-020]

**Consequences — carried as an execution risk, not resolved here (see "Open questions").** The exact
mechanism (e.g. an animated `background-position` sweep on the reset pseudo-elements, sized and timed
so the track never reads as fully empty or fully full at any animation frame) is an implementation
detail for the plan/tasks and implementation phases to author and measure against real engines,
per #306's explicit warning not to repeat #119's browser-matrix hole. This research establishes the
*direction* (authored, token-driven, vendor-pseudo-element-based) and the reason a native-rendering
reliance cannot satisfy the binding reduced-motion requirement; it does not pre-author the keyframes.

### R-06 — Forced colors: extend the existing pattern, verify the animated fill separately

**Decision.** The existing `@media (forced-colors: active)` block already overrides the fill's
`background-color` to `Highlight` on both vendor pseudo-elements, and the track's `border` already
survives automatically. The indeterminate variant reuses this exact mechanism; the only new
verification surface is confirming the *animated* fill remains distinguishable under forced colors
at multiple points in its animation cycle, not merely at a single static frame. [E-021]

**Why.** #306: "Under forced colors the track and its indicator stay distinguishable from each
other and from the page" — the existing determinate story already proves this for a static fill;
the indeterminate case adds only the "at multiple animation frames" dimension, since forced-colors
rendering of an animated `background-position` sweep has not been measured in this repository before.
[E-021]

**Consequences.** The forced-colors story/test for indeterminate should sample the fill's color at
more than one point in time (e.g. animation paused at two different `animation-delay` offsets, or
measured with the animation itself disabled via a test-only override) rather than relying on a single
snapshot, to avoid a false pass that happens to sample a frame where the override is coincidentally
correct.

### R-07 — No component-scoped no-literal (#286) test; recorded and reasoned, not silently skipped

**Decision.** This mission does not add a component-scoped "no user-visible literal" test of the
kind #308 is reported to have introduced for `sk-confirm-dialog`. [E-022, E-023, E-024]

**Why.** #286's rule targets a custom element's `render()` output — shadow-DOM-rendered content a
consumer's i18n tooling cannot reach. `sk-progress` (including its indeterminate modifier) has **no
custom element and no `render()` method of any kind** — R-01 confirms this family has no shadow root
at all. Every user-visible string in every fixture (`label` text, optional `__meta` text) is already,
structurally, plain light-DOM markup the consumer authors directly — #306's own contract states this
plainly ("the label and any meta text are consumer supplied") and #210's existing test suite already
asserts zero `aria-*`/`role` attributes across every fixture, which is the adjacent risk #286 would
otherwise be guarding against here. There is no `content:`-with-text CSS declaration anywhere in
`sk-progress.css` today (the file's only `content`-adjacent risk class, per
`adding-a-component.md`'s forced-colors section, is a CSS Generated Content glyph contributing to an
accessible name — and this family has no `::before`/`::after` content at all, confirmed by grep) and
this mission does not introduce one. This reasoning follows #302's precedent shape (reported in this
mission's dispatch brief) — reasoning out of a test because the render path structurally cannot carry
the defect the test would guard against — rather than #308's shape of adding a red-first test where
the defect is structurally possible (a `render()` method the consumer cannot instrument). [E-022,
E-023, E-024]

**Consequences.** The plan/tasks phase should still add one narrow, cheap assertion as a permanent
guard against regression, in the same spirit as the existing `sk-progress.spec.ts` "no CSS-generated
arithmetic" test: assert `sk-progress.css` contains no `content:` declaration carrying literal text
(distinct from the existing test, which only checks for `value`/`max`/`counter()` references). This
is a five-line addition to an existing test file, not a new component-scoped #286 gate, and it is
scoped to this file only — it does not attempt the repository-wide gate #286 itself owns.

## Rejected or deliberately absent approaches

| Approach | Reason not selected | Evidence |
|---|---|---|
| One shared activity-cue primitive for #305 and #306 | Incompatible accessibility posture (exposed widget vs. presentational-only), incompatible composition model (no shadow root vs. shadow-DOM element), incompatible shape/sizing regime, and an unnecessary cross-engine risk import into #305 — see R-00 | E-004 through E-010 |
| Relying on native UA indeterminate rendering with no authored animation | Cannot be switched off by `prefers-reduced-motion: reduce`, and is the named cross-engine divergence risk itself | E-019, E-020 |
| `value=""` or an out-of-range `value` to trigger indeterminate rendering | #306 requires the attribute's plain absence; relying on parse-failure behaviour is an unstated, more fragile cross-engine dependency | E-001, E-004 |
| Adding firefox/webkit pixel visual-regression baselines for this component | Contradicts this repository's own already-documented chromium-only VR policy; a repo-wide policy change out of this mission's charter | E-016, E-018 |
| A component-scoped #286 no-literal test | This family has no `render()` and no shadow root — the defect class #286 targets cannot occur here; reasoned out following #302's precedent, not silently skipped | E-022, E-023, E-024 |
| A new `sk-spinner`/general-purpose spinner component | Explicit non-goal in both #305 and #306, contingent only on the R-00 ruling, which rules against sharing | E-009, E-010 |

## Evidence-to-implementation handoff

- [`data-model.md`](./data-model.md) extends #210's existing markup/attribute contract table with
  the indeterminate variant and its fixture matrix.
- `spec.md` restates R-00's ruling verbatim under "Cross-Mission Decision: TKT5/TKT6 Activity Cue"
  and turns R-01 through R-07 into functional/non-functional requirements and acceptance criteria.
- `plan.md` (not yet authored at this revision) owns the exact CSS technique for the animated
  indeterminate fill, the test-file edit scoping the existing percentage-consistency check away from
  indeterminate fixtures, and the gate commands from the recipe's "Run the gates" section.
- `tasks.md`/`tasks/` (not yet authored at this revision) own work-package sequencing. #306 states
  "one bounded Work Package and one PR" and this research found no reason to split it — the whole
  change is one CSS file, its generated barrel, its stories, and its tests.

## Open questions and risks

No product, ownership, or cross-mission decision remains open — R-00 resolves the one this mission
shares with #305. The following are execution risks carried into planning/implementation:

1. **The exact cross-engine animation technique (R-05) is not yet measured against real engines.**
   The direction (authored `@keyframes` on the reset vendor pseudo-elements, token-driven, disabled
   under reduced motion while a static mid-state frame remains visible) is established; the specific
   keyframe shape that reads correctly and identically enough on Chromium, Firefox and WebKit is an
   implementation-phase measurement, explicitly named so the next phase does not treat it as settled.
   [E-019, E-020]
2. **Forced-colors legibility of an animated fill has no existing precedent in this repository to
   copy exactly** (R-06) — the pattern for a *static* fill is proven twice already
   (`sk-skip-link.css`, `sk-data-table.css`); extending it to an animated one needs its own
   measurement at more than one animation frame. [E-021]
3. **WebKit remains unverifiable on this host for the whole mission**, not only for this component —
   this is #301/ADR-15's already-recorded gap, unchanged and not newly introduced here. All WebKit
   verification for this mission happens on CI's `playwright` job before merge, never locally. [E-014,
   E-017]

## Explicitly out of scope for this research

- Any change to `#210`'s determinate contract beyond what #306 authorizes (adding the
  `--indeterminate` modifier and, where necessary, scoping one existing test to determinate fixtures
  only).
- A shared activity-cue component, a general-purpose spinner, or any change to `#305`'s own contract
  — #305 implements against R-00, it does not get built here.
- Timers, delays, minimum display durations, skeleton/shimmer placeholders, progress computation,
  estimation, a transition from indeterminate to determinate, live-region announcements, or a busy
  state on any other component — all named non-goals in #306.
- `apps/demo/dashboard-demo.html` or any Team Kitty application surface — this mission delivers
  library surface only, per #306's Boundary section.
