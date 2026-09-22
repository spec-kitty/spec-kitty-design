---
affected_files: []
cycle_number: 1
mission_slug: static-form-of-element-backed-css-01M248TF
reproduction_command:
reviewed_at: '2026-09-10T00:52:04Z'
reviewer_agent: claude
wp_id: WP01
---

# WP01 independent review — REJECT (cycle 1)

Reviewer: independent (did not implement). Every number below is one I measured myself, on a
clean rebuild (`rm -rf packages/{styles,tokens}/dist apps/storybook/storybook-static`, then
`nx run tokens:build --skip-nx-cache && nx run styles:build --skip-nx-cache &&
nx run storybook:storybook:build --skip-nx-cache`).

## What reproduced, exactly

All three committed probes re-run byte-identically against the committed `result.json`
(ignoring `generated_at`). The pre-declaration ordering is real: `90a5feb` (02:15:13) added
only the three `outcomes.declared.json`; `b84db12` (02:23:44) added every `run.mjs`,
`exemplar.html`, `shadow.html` and `result.json`. `git log -- .../outcomes.declared.json`
shows one commit and no amendment.

The wrapper finding survives attack. I probed four states the declared set never reaches
(shell 600px and 700px — below the sheet's unconditional `@container (max-width: 720px)`;
nested outer container 600px around a 1000px shell; outer 900px around a 600px shell), each
under three consumer-hostility modes (none, `display: contents` on the outer box, flex parent),
in both engines: **120 comparisons, 0 variant-B mismatches**, 20 variant-A mismatches. The
ruling for kinds 1 and 2 is correct.

O5 reproduces and is confirmed: bare `img { object-fit: contain }` (0,0,1) beats
`::slotted(img)` and loses to the static descendant rewrite, both engines, regardless of
sheet order. The kind-3 shadow-only ruling is correct.

---

## HIGH-1 — The prescribed wrapper is under-specified, and as written it breaks the component

**Where the claim is made**
- `packages/styles/src/app-shell/sk-app-shell.css`, header comment: "with
  `.sk-app-shell-host { container-type: inline-size }`"
- `packages/styles/src/action-row/sk-action-row.css`, header comment:
  `<div class="sk-action-row-host">   <- container-type: inline-size here`
- `docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`, §2 "What
  the static path gets" ("a generated `.sk-action-row-host` wrapper carrying
  `container-type: inline-size`") and the **#307 freeze guidance** ("with
  `container-type: inline-size` on the outer element")
- `docs/contributing/adding-a-component.md` ("with `container-type: inline-size` on the outer
  one")

**What was actually measured.** `measurement/host-attribute-axis/exemplar.html` variant B is
`.sk-app-shell-host { display: block; width: 100%; min-width: 0; container-type: inline-size; }`
— the complete `:host` declaration set. `measurement/host-container-type/exemplar.html`
variant B is `.sk-action-row-host { display: block; min-width: 0; container-type: inline-size; }`.
The 14/14 and 13/13 results belong to those rules, not to the abbreviated rule the prose
prescribes.

**My measurement of the abbreviated form.** Same page, same built CSS, wrapper reduced to
`container-type: inline-size` only, component placed as an item of a 300px flex row:

| Component | Layout | Shadow form | Wrapper as measured | Wrapper as prescribed |
|---|---|---|---|---|
| `sk-app-shell` `.sk-app-shell` `width` | flex row 300px | `300px` | `300px` ✓ | **`0px`** ✗ |
| `sk-app-shell` `.sk-app-shell` `grid-template-columns` | flex row 300px | `300px` | `300px` ✓ | **`0px`** ✗ |
| `sk-app-shell` (both reads) | grid track 300px | `300px` | `300px` ✓ | `300px` ✓ |
| `sk-action-row` (both reads) | flex / grid | matches | matches ✓ | matches ✓ |

Chromium 151 and Firefox 153, identical. The component vanishes.

**Why this is HIGH.** #307 is told to freeze this exact static contract and #309 to generate
it. #309's own body is right — "The generated sheet emits `.sk-<name>-host { … }` carrying
**whatever `:host` declared** — critically `container-type`". ADR-15, both shipped CSS header
comments and the authoring recipe are the surfaces that are wrong, and the CSS comment is the
one a consumer actually reads.

**What settles it.** State the wrapper rule as the complete `:host` declaration set everywhere
it is prescribed, and add one declared outcome placing the component as a flex item so the
regression is in the table #309/#310 inherit.

---

## HIGH-2 — "each affected component's docs say what a static consumer must author instead" is unmet

Issue #301's acceptance, candidate-(b) branch: *"every document that currently implies
otherwise is corrected in the same PR, and **each affected component's docs say what a static
consumer must author instead**."* Kind 3 took candidate (b). Only `sk-entity-marker` got the
note.

Components still carrying shadow-only `::slotted()` rules with no static-consumer instruction:

| File | Rules |
|---|---|
| `packages/styles/src/context-sidebar/sk-context-sidebar.css` | `::slotted(*)`, `::slotted(a)`, `::slotted(button)` |
| `packages/styles/src/personal-rail/sk-personal-rail.css` | `::slotted(*)` |
| `packages/styles/src/section-header/sk-section-header.css` | `.sk-section-header__title slot::slotted(*)` |
| `packages/styles/src/notice/sk-notice.css` | `.sk-notice__heading ::slotted(*)`, `.sk-notice__body ::slotted(p)`, `::slotted(p + p)` |
| `packages/styles/src/page-header/sk-page-header.css` | `::slotted(*)` plus four `--compact` variants |
| `packages/styles/src/nav-pill/sk-nav-pill-drawer.css` | `:host([open]) .sk-nav-pill__items ::slotted(.sk-nav-pill__item)` |

Correctly excluded, verified individually: `sk-blog-card`, `sk-feature-card`, `sk-ribbon-card`,
`sk-site-footer` (paired spelling, documented in-file); `sk-nav-pill` (documents at length why
the list cannot be merged); `sk-form-input`, `sk-form-textarea` (forbid `::slotted` and say so).

The sharpest instance: `sk-personal-rail` and `sk-context-sidebar` are the two slots of
`sk-app-shell` — the component this mission measured. A Family 4 Django shell rebuilding the
app shell statically hits them on the first screen.

ADR-15's Consequences names the debt ("every component using it owes its consumers a
hand-written instruction") but discharges none of it and files no issue for it, and #309/#310
both explicitly exclude `::slotted()`. So it is currently unowned.

**What settles it.** Either add the note to the six files, or file a named issue that owns the
backfill and say in ADR-15 that acceptance item 7 is discharged by that issue rather than by
this PR. Do not leave it implied.

---

## MEDIUM-1 — O6 is an order result, recorded as a specificity result

`measurement/slotted-child-rule/outcomes.declared.json`, O6:
> "object-fit with the same competing rule at **HIGHER specificity** `.page-scope img`"

`.page-scope img` is (0,1,1). `.sk-entity-marker__content > img` is (0,1,1). They tie.
ADR-15 prints the (0,1,1) value correctly but concludes:
> "the shadow form always yields to the page, and the static form yields **only when the page
> outbids it**"

O6 itself falsifies that: the page does not outbid, and the static form yields anyway —
because `exemplar.html` always appends the consumer rule last.

**My measurement** (consumer sheet position varied, both engines, identical):

| Consumer rule | Consumer sheet LAST | Consumer sheet FIRST |
|---|---|---|
| `img` (0,0,1) | shadow `contain` / static `cover` — DIVERGE | shadow `contain` / static `cover` — DIVERGE |
| `.page-scope img` (0,1,1) — tie | shadow `contain` / static `contain` — equal | shadow `contain` / static **`cover`** — DIVERGE |
| `.page-scope.theme img` (0,2,1) — genuinely outbids | equal | equal |

Re-convergence is real, but only at *strictly higher* specificity. At a tie it depends on
stylesheet order the consumer often does not control.

**Consequence for #304.** The instruction #304 will freeze is the one now shipped in
`sk-entity-marker.css`: *"A static consumer's own stylesheet therefore has to outbid this rule
on specificity."* That advice is safe when followed literally, but the file never states the
boundary, and scoping with a single wrapper class — the most ordinary thing a consumer does —
lands exactly on the tie. Correct O6's label, correct the "only when the page outbids it"
sentence, and state the tie case in the component comment and in
`docs/contributing/adding-a-component.md`.

---

## MEDIUM-2 — the declared outcome set never crosses the sheet's unconditional 720px breakpoint

`packages/styles/src/app-shell/sk-app-shell.css` carries a non-host-dependent
`@container (max-width: 720px) { .sk-app-shell { grid-template-columns: minmax(0, 1fr) } }`.
The 14 declared outcomes probe 800 / 900 / 1000 / 1200 only, so that rule is never exercised
on either side.

I probed it: at a 600px shell the real element computes `600px` and variant B computes `600px`
(equal); at a 700px `rail-preserving` shell, `56px 644px` on both. So the ruling is unaffected —
but #309 and #310 both name this outcome table as their acceptance bar, and a generator that
mishandles a sheet's *unconditional* container rules would pass it. #310's own text says a gate
built on cases that do not discriminate "certifies nothing"; the same standard applies to the
table it inherits. Add one sub-720 outcome per construct.

---

## LOW

- **LOW-1 (PR body, not the WP).** `<scratchpad>/301-pr-body.md` line 7: "It is the
  design-system/docs repo". It is the design-system **monorepo** — publishable
  `@spec-kitty/{styles,tokens,elements,react}` plus Storybook. Also "Merging this repository
  deploys nothing" is over-broad: `storybook-deploy.yml` is `push: branches: [main]` with a
  paths filter that includes `packages/styles/**`, which this PR touches. The accurate
  sentence is: merging this PR into `train/elements-first` deploys nothing; the Pages deploy
  fires only when the train reaches `main`. `release.yml` is tags-only — that half is correct.
- **LOW-2.** `kitty-specs/.../acceptance-matrix.json` is untouched scaffold: nine criteria all
  `pending` with `"TODO: replace with a real acceptance criterion"`, `overall_verdict:
  "pending"`, `negative_invariants: []`. Not in WP01's `owned_files`, so arguably not this
  WP's, but this is the mission's only WP and no accept gate can read it as it stands.
- **LOW-3.** ADR-15 line 21: "Family 4's T1–T6 are Django-rendered shells, **which is how the
  majority of named consumers take this library**." The first half is attributed to #301; the
  second is asserted with no source and is not measurable from this repository. Either source
  it or drop it — the record is otherwise scrupulous about attribution.
- **LOW-4.** #309 says "at least `sk-app-shell` and `sk-action-row`". Two more components carry
  the identical constructs and are unnamed: `sk-copy-field` (`:host { container-type:
  inline-size }` with `@container (max-inline-size: 20rem) { .sk-copy-field { … } }`) and
  `sk-page-header` (both kind 1 and kind 2). Naming them keeps the generator's scope from being
  discovered late.

---

## Verified and accepted — do not redo these

- **Gates, all re-run by me, none taken on report.** `npm test`: 48 files, 582/582, suite floor
  green (`node=34 browser(chromium)=548`), exit 0. `npm run quality:all`: exit 0; lint re-run
  with `--skip-nx-cache` (the cache had served 8/8) gives 0 errors, 27 warnings, every one in a
  file this mission did not touch. `check-adr-index.mjs` 16/16 ✓. `check-llms-adr-surface.mjs`
  ✓. `check-adopted-css-boundaries.mjs` ✓ 29/29 elements, 511 rules. `build-elements-css.mjs
  --check` ✓. `git status --porcelain` clean.
- **The reported non-green is genuinely pre-existing.**
  `git show 2b59c8cc:packages/styles/src/app-shell/sk-app-shell.css` fails
  `check-component-token-literals.mjs` at line 50 with the identical
  `calc(100dvh - var(--sk-space-12))`; at HEAD it is line 77, moved only by the 27-line comment.
  `git log -S'100dvh'` attributes it to `86058d9` (#268, 2026-09-08). The script is also not
  wired into any workflow under `.github/`.
- **Visual contract did not move.** `build-elements-css.mjs` strips comments, so
  `packages/elements/src/*/sk-*.css.js` is byte-identical and `--check` is green. The only
  product-file change in the whole mission is three comment blocks.
- **Non-goals respected.** #239 explicitly not decided; no compact app-shell static form built
  (routed to #253's line); no new element or component.
- **#302 / #305 freeze guidance is correct.** `sk-pill-tag.css` and `sk-button.css` each carry
  exactly one `:host { display: inline-flex }`, no `container-type`, no `::slotted()`, no
  `@container`; their markup modules are single-element (`<span class="sk-pill-tag">`,
  `<button class="sk-button">`); their element TS adds no host-dependent CSS; their `.css.js`
  is generated from the same sheet.
- **#304 split is correct.** `.sk-entity-marker--sm` and `.sk-entity-marker--circle` are
  ordinary root-class modifiers on the shadow root's own span.
- **#309 / #310 are correctly scoped.** #310 carries the explicit empty-set floor with its own
  message, the collapsed forms as recorded red probes, composed cases as mandatory, the
  `::slotted()` exclusion citing O5, and registration in `check-gate-wiring.mjs`. Every script
  and self-test they cite exists and carries the floor they claim
  (`check-adr-index.mjs`, `check-release-graph.mjs`, `check-adopted-css-boundaries.mjs
  --selftest`, `build-element-markup.mjs --check`).
- **The #161 correction is right, verified first-hand.** `packages/styles/dist/src/index.js`
  exists after the build, so #161's stated cause is false; `import('@spec-kitty/styles')` fails
  with `ERR_MODULE_NOT_FOUND: Cannot find module '.../dist/src/blog-card/index'` — the
  extensionless re-export, exactly as ADR-15 says.
- **Testimony is not upgraded.** The FR-009 section says plainly it is reported evidence from
  #301, names the unreachable planning-repo path, and nowhere else in the record is it treated
  as first-party measurement.
- **No Lynn verdict is cited.** Twelve occurrences across the diff; every one is either the
  program-state name "ready-for-Lynn" or an explicit statement that no verdict is recorded.
- **WebKit gap accepted.** I confirmed `webkit.launch()` fails on this host with the exact
  "Host system is missing dependencies to run browsers" message. ADR-10's Consequences records
  the same gap for the same class of claim. Two independent engines agreed on every declared
  row and on all 120 of my additional comparisons. Acceptable; no action.
- **`Proposed` is the correct status.** Ratification is the operator's, #301 gates adoption on
  the pending Family 4 product verdict, and ADR-12/13/14 are all `Proposed` too. Do not
  upgrade it.
- **Could not verify.** The narrative that a `.v-A`/`.v-B` body-class defect was found and
  fixed mid-run: every probe file landed in one commit (`b84db12`), so no earlier revision
  exists in history to compare. It is settled empirically instead — the current instrument
  carries no body class, and re-running all three probes from a clean rebuild reproduces the
  committed numbers exactly.
