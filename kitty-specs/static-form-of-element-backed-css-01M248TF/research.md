# Research: static form of element-backed CSS families (G0)

## Decisions

### R-001 — This mission is a decision, not a component; scope is one bounded Work Package

**Decision**: The deliverable is a recorded ruling (an ADR or an ADR amendment), a discriminating measurement, and whatever doc corrections the ruling forces — landed as one Work Package and one PR, per #301's own "Delivery" line and #300's per-child convention.

**Rationale**: #301 states "one bounded Work Package and one PR" explicitly. The three measured constructs (app-shell presentation axis, action-row container query, entity-marker `::slotted(img)`) and the doc-correction surface they touch are all read/verify/rule work on existing files — no new component, no new build target — which is small enough to stay in one WP regardless of which way the ruling falls, provided the "generated static form" branch limits itself to *naming* the generator/boundary-gate work rather than building it (issue acceptance item 6 requires exactly this: filed as separate issues, "only work small enough for this one Work Package lands here").

### R-002 — The question stays open through spec.md; both candidate outcomes are fully specified as alternatives

**Decision**: `spec.md` states the question precisely and encodes candidate (a) "declared generated static form" and candidate (b) "stated shadow-only rule" as two complete, independently-consequenced branches. Neither is selected by the spec. Functional requirements are written so that satisfying them does not presuppose which branch the measurement selects.

**Rationale**: #301's own text: "Either answer is fine. Neither is a component mission's to take." The mission brief given for this dispatch is explicit that picking a winner in the spec — even implicitly through phrasing — is a rejection condition. The measurement (R-008) is what selects the branch; the plan phase decides how to perform it; the implement phase performs it and records the outcome.

### R-003 — Verify the issue's evidence against the current train head rather than transcribing it

**Decision**: Every file-level evidence claim in #301 is re-measured against this checkout (`train/elements-first@2b59c8c`, the head this mission branched from) before it is written into `spec.md`. A claim that does not hold is stated as a correction in the spec's evidence section rather than repeated.

**Rationale**: Mission dispatch instruction and this repo's own recorded pattern (`verify-root-cause-against-committed-history`, `verify-guards-not-just-call-sites`): a defect or claim seen only in a source document may not hold against the actual committed files, and ADR amendments are cheap to get subtly wrong if the underlying measurement is stale.

**Findings** (see `research/evidence-log.csv` EV-001..EV-004 for the source mapping):

| Issue claim | File | Verified? |
|---|---|---|
| Compact/rail-preserving axis is `:host([presentation=...])` inside `@container` blocks whose container is the host | `packages/styles/src/app-shell/sk-app-shell.css` | **Holds.** `:host { container-type: inline-size }` (line 5); `@container (max-inline-size: 1100px)` (line 67) and `@container (max-inline-size: 860px)` (line 104) both gate `:host([presentation="rail-preserving"])` / `:host([presentation="compact"])` rules. |
| `:host { container-type: inline-size }` establishes the container every reflow rule below it depends on | `packages/styles/src/action-row/sk-action-row.css` | **Holds.** Line 4. `@container (max-width: 400px)` (line 186) is the one reflow rule gated by it. |
| `::slotted(img)` is the only image rule the component has | `packages/styles/src/entity-marker/sk-entity-marker.css` | **Holds.** Lines 41–46; no other rule in the 46-line file targets an image. |
| T3/T4 canvases copied the `:host([presentation="compact"])` block verbatim into a document stylesheet, where it matches nothing | Family 4 canvases, `ux_redesign/families/04-teams-membership` (planning repo) | **Not independently re-verifiable from this checkout.** The planning repo is not part of this repository and is not reachable from this workspace (confirmed: `gh repo view` fails to resolve it). This claim is carried into `spec.md` as reported evidence from #301, attributed as such, per issue acceptance item 9 ("named in the ruling as the observed failure mode") — naming it does not require re-deriving it independently when the source system is out of reach, but the spec must say plainly that this one line is unverified testimony rather than a first-party measurement. |

### R-004 — `:host`, `:host([attr])` and `::slotted()` are legitimate ADR-9-compliant shadow constructs, not defects

**Decision**: The spec must not describe the three measured constructs as violations of any existing rule. They pass `check-adopted-css-boundaries.mjs`'s boundary check today (confirmed by reading the script's own self-test table: `:host`, `:host([open]) .sk-nav-pill__items`, and `::slotted` compounds are all in the `accept` column). The problem #301 raises is that these constructs are shadow-DOM-only, not that they are malformed.

**Rationale**: Getting this wrong would misdirect the ruling toward "fix the CSS" when the actual question is "what, if anything, serves the light-DOM/static consumer who cannot use `:host` or `::slotted()` at all." Confusing the two would smuggle in an answer (implicitly favoring (a), a generated replacement) by mischaracterizing the input as broken.

### R-005 — The measurement is the discriminator, and it must be a real measurement, not an assertion

**Decision**: `spec.md` specifies (without prescribing the mechanism) that the WP's implementation step must produce one of:
- a static, generated, light-DOM-consumable exemplar for each of the three measured constructs, demonstrated equivalent in rendered/behavioral terms to the shadow form on the train ref; or
- a recorded negative measurement per construct, stating precisely and concretely what the static consumer cannot get and why (e.g., "no CSS mechanism exists to express a host-attribute-driven layout swap without either a shadow root or a class the server must compute itself").

Whichever measurement is produced determines which of candidate (a) or (b) the ruling adopts. `plan.md` designs the concrete mechanics (e.g., a probe HTML page rendered both ways, or a generator dry run against one construct); this research document and `spec.md` only fix the shape of what counts as evidence.

**Rationale**: #301 acceptance item 8, verbatim: "Verification is a measurement, not an assertion — either a static exemplar demonstrated equal to the shadow form on the train ref, or a recorded negative measurement showing precisely what a static consumer cannot get."

### R-006 — #161 is measured with a real build, not re-read from the issue text, and it does not block the FR-008 measurement

**Decision**: The spec requires the ruling to hold for a real installed-package consumer, not only for someone reading source in this repository. This was checked with an actual build (`rm -rf packages/styles/dist && npx nx run tokens:build --skip-nx-cache && npx nx run styles:build --skip-nx-cache`, then real Node ESM resolution through this workspace's `node_modules/@spec-kitty/styles` symlink), because a config-only reading of `package.json`/`tsconfig.lib.json` produced a wrong answer during this mission's own drafting. Result: the per-component subpath exports (`@spec-kitty/styles/<name>/*`) resolve to real, on-disk files — this is the path a static consumer actually uses for CSS, and it is not blocked. Only the root package import (`@spec-kitty/styles` bare specifier) is confirmed broken, and for a different, more specific reason than #161's own text states (see below) — a defect the spec records as a scoped limitation, not as a reason the whole question is unmeasurable.

**Rationale**: #301 acceptance item 4 and #300's shared constraint 2 require the ruling to hold for real package consumption; measuring it — rather than assuming either "it's fine" or "it's broken" from the issue text — is exactly this mission's own "measurement, not an assertion" standard applied to its own dependency check.

**Correction to #161's own literal claim.** #161 states the compiler emits `dist/index.js` and "never a `dist/src/` level." A real build contradicts this directly: `styles:build` emits exactly `dist/src/index.js` and `dist/src/index.d.ts`, matching `package.json`'s declared `main`/`types`/`exports["."]` byte-for-byte as a path. So the *file* package.json points at does exist. What actually breaks a real ESM consumer is unrelated to that claim: the emitted `dist/src/index.js` re-exports its siblings as `export * from './blog-card/index'` — no file extension — which fails Node's strict ESM resolution (`ERR_MODULE_NOT_FOUND`) because the referenced module lives at `dist/src/blog-card/index.js` and Node requires the extension for a relative specifier. This is a real defect with the same practical consequence #161 predicts (root import doesn't work), reached by measurement rather than by accepting #161's stated mechanism, which does not hold under a real build.

### R-007 — Relationship to #239 is stated, not resolved

**Decision**: The spec must state how this ruling's scope relates to #239 (open: "can a shadow-DOM element consume a light-DOM primitive?") without deciding #239. #239 is the inverse direction — a shadow element wanting to borrow a light-DOM primitive's stylesheet — and is explicitly out of scope here per #301's own text ("#239 asks the inverse question... and does not own this one").

**Rationale**: #301 acceptance item 5, confirmed against the live #239 issue body, which frames the shareable-adopted-primitive question and says "Either answer is fine and neither is #179's to give" — the same non-prejudging posture this mission must take for its own question.

### R-008 — Downstream children named as gated, per #300's dependency map

**Decision**: The spec records that #300 (the epic) names four children whose static-API finalization is gated on this ruling: TKT2/#302 (G1, `sk-pill-tag` status-tone axis), TKT4/#304 (G3, `sk-entity-marker` size/border/image axis), TKT5/#305 (G4, `.sk-button` busy axis), and TKT7/#307 (G6, static `.sk-action-row` form with trailing controls). The ruling itself — not this spec — states which of them may freeze a static API and in what form; the spec requires the ruling to address this rather than pre-answering it.

**Rationale**: #301 acceptance item 3, cross-checked against #300's own dependency map (`T1 -->|gates static API| T2`, `T4`, `T5`; `T1 -->|starts after| T7`).

### R-009 — Non-goals carried forward unchanged

**Decision**: The spec inherits #301's non-goals verbatim: no compact app-shell static form implementation (belongs to #253/#254/#274's line if the ruling calls for it), no deciding #239, no new element/component, no visual-contract change to any component, no app-side templating/routes/permissions/domain state, and the Family 4 canvases' review-only material is not product UI and must not enter acceptance criteria.

**Rationale**: #301's "Non-goals" section, cross-checked against #300's shared constraint 3 and 4 (application-vs-library boundary; review-only material).

## Evidence summary

- Live GitHub #301 is the authoritative source for this mission's scope and acceptance criteria; it has an approval trail (Opus rereview 04, `approve`, 2026-09-10) but Lynn's Family 4 product **verdict is not recorded** and must not be cited as evidence of anything in this mission's artifacts (mission-dispatch instruction).
- #300 (epic) supplies the dependency map, shared constraints, and the disposition table confirming no other open/closed issue already owns this question.
- #161 (open) and #239 (open) were read live and confirmed to still be open with the content #301 describes.
- ADR-9 (shadow DOM, styling API, cross-boundary rule) and ADR-10 (distribution, canonical markup, styles-only-component class) are the two records this ruling most plausibly amends or is bound by; both are `Accepted`, so charter's architectural-review requirement applies — any spec position that would contradict either must carry an ADR amendment as a tracked WP item, which is exactly this mission's deliverable shape already.
- `docs/contributing/adding-a-component.md` documents the current generator pipeline (`build-element-markup.mjs`, `build-elements-css.mjs`) and the boundary gate (`check-adopted-css-boundaries.mjs`); a "generated static form" ruling would extend this pipeline, not replace it.
- The three measured CSS files were read in full and their line numbers cited above; none contains a defect under the existing shadow-DOM authoring rules.

## Risks and mitigations

- **The planning-repo evidence (T3/T4 canvases) cannot be independently re-verified from this checkout.** Mitigation: state it as reported testimony in the spec's evidence section rather than as a first-party measurement, and require the WP to re-confirm it only if the implementer has access to the planning repo; otherwise the ruling names it as recorded in #301 without re-deriving it.
- **A generated-static-form ruling could balloon past one WP if scoped incautiously.** Mitigation: the spec's functional requirements for candidate (a) explicitly cap the WP's own output to naming the generator and boundary-gate changes (with probe tables identified) and filing them as separate issues — never building them here.
- **#161 could make the measurement partially inconclusive.** Mitigation: the spec requires the ruling to record this as a dependency explicitly rather than treat an inconclusive measurement as a negative result by default.
- **Scope creep toward deciding #239 or redesigning `sk-app-shell`'s compact behavior.** Mitigation: non-goals (R-009) carried verbatim and checked in `plan.md`/`tasks` review.
