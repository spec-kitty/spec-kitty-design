# Elements-First Programme — Mission Briefs

**Status:** ready to drive
**Branch model:** all work happens on `train/elements-first`, a long-lived integration branch cut from `main`. Mission branches are cut from the train and merge back into it; the train lands on `main` once, at the end.
**Governing decisions:** ADR-8 (base layer), ADR-9 (styling API, label ownership), ADR-10 (distribution, canonical markup), ADR-11 (verification stack), ADR-12 (consumer audit), ADR-13 (Storybook builder). Read the ones each brief names before writing a spec.

Every mission below has an intent, a scope boundary in both directions, dependencies, an expected work-package shape, and exit criteria that can be checked rather than asserted. Where a mission carries a residual unknown, it is named in the brief; none of them block starting.

---

## How to run one

The full loop procedure — selection, claiming, driving, and releasing the claim — is in
[`elements-first-run-prompt.md`](./elements-first-run-prompt.md). In short:

1. Take the lowest-numbered unassigned issue in epic #66 whose dependencies are closed.
2. **Claim it before any other action** — assign yourself, verify you are the sole assignee, comment on the issue. Claiming is the concurrency guard, not bookkeeping.
3. Cut `mission/<slug>` from `train/elements-first`.
4. `spec-kitty specify` → `plan` → `tasks`, seeded from the issue body. Never hand-edit `kitty-specs/` (CLAUDE.md §7).
5. PR into the train with `Refs #N` — a merge into the train closes nothing automatically.
6. On success, comment the evidence and close. On blocked, comment why and **remove the assignee** so the issue does not look claimed forever.

Charter gates still apply per component: a Storybook story including a `LightMode` variant, axe-core zero violations, visual diff against the reference set, token-only CSS.

## Adversarial squad cadence

The squad is **report-only** and never gates a mission — findings are triaged and folded before the next phase starts. It is activated the way kitty-desktop activates it: as a standing order in the charter's review policy prose, not through `selected_tactics`, which stays empty.

**Blanket cadence does not port to a sixteen-mission programme.** Every point-cut of every mission is 60 deployments; at 3–4 lenses each that is roughly 200 delegate runs, and a single research-grade delegate pass in this programme measured 199k tokens. The cadence below is tiered by what a mission sets in motion rather than by ceremony, and costs about 29 deployments.

**Pre-merge is not tiered.** Every PR into the train gets the **full gate — all four lenses — and its evidence posted as a PR comment before the merge.** Operator standing order, 2026-09-02. The tiering below governs only the *earlier* point-cuts, where the return on a squad varies by what the mission sets in motion.

| Tier | Missions | Earlier point-cuts | Pre-merge (every PR) |
|---|---|---|---|
| **A — mechanism-setting** | M4, M5, M8 | post-spec, post-plan, post-tasks · 4 lenses | **full · 4 lenses · evidence posted** |
| **B — high blast radius** | M2, M3, M9, M14 | post-tasks · 3 lenses | **full · 4 lenses · evidence posted** |
| **C — routine** | M6, M7, M10, M11–13, M15, M16 | none | **full · 4 lenses · evidence posted** |
| **Programme** | the `train/elements-first` → `main` PR | — | **full · 4 lenses · evidence posted** |

### The evidence comment

The gate is not run until its evidence is on the PR. The comment must carry, at minimum:

- **The commit SHA reviewed.** Without it the evidence silently decouples from the diff the moment anyone pushes again — the same failure the `[ci] green @<sha>` convention exists to prevent. A gate whose SHA is not the PR head is stale and must be re-run.
- **Each lens by profile id**, with its verdict and the initialization it applied.
- **Findings as `[SEVERITY] file:line — issue — recommendation`.** Ungrounded findings do not count as evidence.
- **Disposition per finding**: folded into this PR, or deferred with an issue link. "Noted" is not a disposition.
- **Pass number**, and for a second pass, which of the previous pass's findings are now fixed, still open, or superseded — named individually, not counted.
- **Where each lens concedes it does not apply.** A lens that concedes nothing is noise, and a squad that produces four confident verdicts on a docs-only PR has told you nothing.

**Cost:** the gate is per PR, not per mission. A mission that opens three PRs pays three gates — which is deliberate: it prices incoherent PRs. Uniform pre-merge raises the programme from roughly 93 delegate runs to roughly 112, about 20%, for the point-cut where a finding is cheapest to act on and most expensive to miss.

Tier A earns squads at the earlier point-cuts too because each one sets something every later mission inherits: M4 the element mechanism, M5 the verification standard, M8 the accessibility ruling whose failure mode is the charter's second-highest recorded risk. Tier C skips the earlier point-cuts because the ADRs already pin those missions' decisions and the conformance matrix checks mechanically what a squad would re-read — but it still faces the full gate at the merge.

**Lens selection**, from the roster — complementary, not redundant:

* `architect-alphonso` — the layering *is* the thesis; every tier.
* `reviewer-renata` — contract-versus-implementation and fakeable assertions. Non-negotiable on this programme: two gates in this repo were already certifying absence, and a third — the diagram drift check — is not reproducible.
* `debugger-debbie` — "would this actually catch the regression?" Tier A and the programme merge.
* `randy-reducer` — duplication and dead code, which is literally what this programme exists to remove. Read critically; it carries a known duct-tape bias.
* `doctrine-daphne` — charter and SK-D01 integrity, on M1-adjacent and charter-touching work.

**Model routing** (adopted from kitty-desktop's standing order #7): Sonnet for every delegated seat; Opus only for squad lenses and synthesis, arbiter escalation, and plan-phase architecture on risky missions. When in doubt, route down.

**Dispatch rule:** each delegate's prompt begins with the profile load — `spec-kitty agent profile show <id>` and `spec-kitty charter context --action <action> --json` — then states which initialization, boundaries, directives and tactics it applied. Loading the profile is the point; naming a persona is not. Delegates stay read-only unless the task is an isolated implementation in its own worktree. Output is `[SEVERITY] file:line — issue — recommendation`, ending in a verdict, grounded in cited evidence, with honest concession of where the lens does not apply.

**Halting: two passes per point-cut, and that is the whole rule.** A pass ends when every finding it raised is either folded or filed. If a second pass raises new in-scope findings, fold those too and merge — do not run a third, and do not stop and escalate merely because the count did not fall.

*A severity-trend halt was tried and removed. It misfired twice: severity counts are not comparable across passes when the head moves between them, so a reviewer pinned to a stale SHA reports findings already fixed; and findings raised at a different layer — a CI response, say — inflate the count while the original findings are genuinely converging. Counting also treats "created by the fix" and "pre-existing, newly noticed" as the same thing. Escalate on a specific blocker a lens names, not on arithmetic.*

## Boundary rules that apply to every mission

1. **A mission may create, rename or delete a package only if its slug says so.** M2 renames, M3 deletes `angular`, M4 creates `elements`. No other mission touches a `package.json` `name` field.
2. **A component mission owns exactly the components in its slug** and is not done until those components have one authored markup source and one CSS source. No "while we're here" neighbours.
3. **Pipeline files have one owner per wave**: M2 owns the deploy and release path rewrites, M5 owns `ci-quality.yml` gate additions, M14 owns `release.yml`'s publish graph.
4. **ADRs are written only in M1.** A later mission that discovers a decision files an issue and stops; it does not append.
5. **`kitty-specs/**`, `docs/architecture/validation/**` and `docs/learnings/**` are frozen historical record**, including during the rename.
6. **Know which governance file is hand-edited and which is generated.** `kitty-specs/**` artefacts are never hand-edited — they desync runtime state (CLAUDE.md §7). `.kittify/charter/charter.md` is the opposite: it is a curated document and the *only* place this project's policy prose lives. `spec-kitty charter generate` does not write it — verified, including with `--force` — and `charter.yaml` is the doctrine catalogue (`governance`, `directives`, `catalog`), carrying no project policy at all. So charter policy changes are hand edits to `charter.md`, mirrored into `interview/answers.yaml` as the capture of record, and never made inside a mission's work-package diff.

---

## Operator items — not engineering, no repo work

**N1 · Own the `@spec-kitty` npm scope.** Blocks M14 and nothing else. **The npm organisation was created on 2026-09-02** — the part with unbounded lead time is done, and the org-ownership question that ADR-2 flagged as a pre-flight is settled.

Remaining, all short: enable 2FA on the org; issue a granular publish token scoped to `@spec-kitty/*`; add it as `NPM_TOKEN` in this repository's secrets; prove the path end to end with `npm publish --dry-run`. That last step matters — tag `v1.0.0`'s release run failed with `404 PUT .../@spec-kitty%2ftokens`, and a dry run is what converts "the org exists" into "the workflow can actually publish". Until it passes, treat M14 as blocked rather than ready.

**N2 · Storybook Pages hosting identity.** The published URL is `stijn-dejongh.github.io/spec-kitty-design` while the repository is `spec-kitty/spec-kitty-design`. Ownership question, not code.

**N3 · Reconcile the approval rule.** The charter requires "one maintainer approval for PRs touching component files or the core token layer". The live `main-is-safe` ruleset requires **zero** approving reviews and has **no required status checks** — only CodeQL is enforced. Either raise the ruleset to match the charter, or amend the charter to match reality. Writing gates into a charter that GitHub does not enforce is worse than having neither.

---

## Ops — single-concern, no work-package decomposition

| Op | Work | Status |
|---|---|---|
| **O1** | Land the ADRs on the train | ✅ done — ADRs 8–13 are committed |
| **O2** | `commitlint.config.cjs` scope-enum += `styles`, `elements`, `react` | ✅ done, verified both directions |
| **O3** | SaaS `design-authority.json`: repoint `required_files` off `packages/html-js/src/index.ts`, fix the stale `Priivacy-ai/spec-kitty-design` origin | open — hygiene, **not** a blocker: that repo has no CI workflows on `main`, so nothing goes red |
| **O4** | Tokens webfont: remove the Google Fonts `@import` at `tokens.css:138` | open — see below |
| **O5** | Charter amendment lifting the unit-test prohibition | open — wording drafted, needs the CLI |
| **O6** | Glossary seed: `element`, `styles layer`, `wrapper`, `manifest`, `conformance matrix` | open |
| **O7** | SP-7 follow-up: pin the diagram rendering environment | open — see ADR-12 |
| **O8** | SaaS: three components referenced by six files that no longer exist (`TeamspacePulseInMotion`, `ProjectPostureRail`, `TeamspacePulse`) | open — separate repo, unrelated to this programme |

**O4's fork, decided:** drop `--sk-font-mono` to the system monospace stack and delete the `@import`. JetBrains Mono is not vendored — `packages/tokens/fonts/` ships Falling Sky and Swansea only — so removing the import is not a one-line delete. Self-hosting it (woff2 + `@font-face` + OFL attribution) is the alternative and remains available as a follow-up if the brand requires that exact face. The immediate win is that a token file stops making a runtime third-party network request, which kitty-desktop already had to patch out.

**O5's drafted wording** replaces the final sentence of `languages_frameworks`, the closing sentence of `testing_requirements`, and extends the numbered list in `quality_gates` — including making a story that fails to load a *failure* rather than a pass. Run `spec-kitty charter interview → generate → sync`.

**O5 also activates the squad**, in the same run, by amending two answers in `.kittify/charter/interview/answers.yaml`. Note the mechanism: `selected_tactics` stays empty — the squad binds through review-policy prose, which is what agents read. Drafted text:

> **`review_policy`** — append: *"Adversarial squad cadence is a standing order. Every pull request receives the full adversarial gate before merge, and the gate's evidence is posted as a comment on that pull request — naming the commit SHA reviewed, each lens by profile id with its verdict, findings as severity/file/line/recommendation, and the disposition of each finding. A pull request is not merged until that evidence is present and its SHA matches the head. Earlier point-cuts are tiered by mission risk and recorded in `docs/architecture/elements-first-programme.md`: mechanism-setting missions get the squad post-spec, post-plan and post-tasks; high-blast-radius missions post-tasks; routine missions rely on the merge gate alone. The squad is report-only at the earlier point-cuts: findings are triaged and folded before the next phase starts. Delegated seats run on the smaller model; the larger model is reserved for squad lenses and synthesis, arbiter escalation, and plan-phase architecture on risky missions."*
>
> **`quality_gates`** — append: *"An adversarial review squad closes every pull request, with its evidence posted on that pull request before merge, plus the earlier point-cuts its mission's tier declares (see review_policy)."*

---

## Missions

### M1 · `elements-first-decision-record` — ✅ substantially complete

ADRs 8, 9, 10, 11, 12 and 13 are written and committed on the train. What remains: flip ADR-8 to Accepted at review, and execute ADR-12's diagram corrections (which need O7 first).

**Residual:** the canonical-markup ruling in ADR-10 §3 is recommended, not ratified. Downstream missions may proceed on it; it is ratified when ADR-10 moves to Accepted.

---

### M2 · `styles-package-rescope` — **ready now**

**Intent:** rename `packages/html-js` → `packages/styles` / `@spec-kitty/styles`, once, while the repository is still simple.

**In scope:** the directory move; `package.json` name and exports; `project.json` name and tags; `eslint.config.mjs` `depConstraints`; Storybook `main.ts` webpack `include` paths; `apps/demo/*.html` relative paths in both `file://` and post-`sed` modes; `storybook-deploy.yml`'s `sed` rewrite and its explicit component copy allowlist; `release.yml` publish paths and its hand-written `cp` of `sk-nav-pill.js`; CLAUDE.md's repo map; `llms.txt` and `llms-full.txt`; `docs/contributing/*`; `skills/spec-kitty-design/`.

**Explicitly out of scope:** any Lit or element code; any CSS or markup change; the `index.ts` string exports (they move, they do not change); Angular; deleting anything.

**Mandatory artefact:** an occurrence classification separating live references (rewrite) from historical record (`kitty-specs/**`, `docs/architecture/validation/**`, `docs/learnings/**` — untouched). Delivered as [`occurrence-map-styles-package-rescope.md`](occurrence-map-styles-package-rescope.md). Note `audit/**` was listed here as record and is not: `audit/run.js` is a live Playwright harness and `audit/index.html` carried 27 live package paths, so M2 rewrote them.

**Depends on:** O2 ✅. **Reads:** ADR-8.

**WP shape:** classification map · move + package/nx/eslint metadata · pipelines · demo pages both modes · doc surfaces.

**Exit:** `npm run quality:all` green; Storybook builds; **the 7 visual baselines pass unchanged** — that is the behaviour-neutrality proof and the reason nothing else may be in the diff; demo pages resolve from disk and after the deploy rewrite; no live `packages/html-js` reference remains.

---

### M3 · `storybook-renderer-and-angular-retirement` — **ready after M2**

**Intent:** move Storybook to the web-components renderer and delete Angular from the repository.

**In scope:** swap `main.ts` to `@storybook/web-components-vite`; replace the hand-written `webpackFinal` CSS rule with Vite's native handling; delete the 10 Angular story files, `packages/angular`, `angular.json`, `ng-package.json` and the 16 Angular/`zone.js`/`ng-packagr`/`@nx/angular`/`@storybook/angular` devDependencies; update the three workflows hardcoding `projects=tokens,angular,html-js`; retire the `angular` commitlint scope; re-establish the baseline set.

**Out of scope:** the generated Angular wrapper (deferred to M15); any element code; new component coverage.

**Depends on:** M1, M2. **Reads:** ADR-13.

**Proven ahead of time (ADR-13):** the 13 html-js story files need **no changes** — `renderToCanvas` handles a raw HTML string natively, verified by building the real card story under the new renderer and rendering all six of its exports.

**Carries one mandatory repair:** the axe runner must serve the built Storybook over **HTTP**. A Vite build emits module scripts, which are CORS-blocked over `file://`; run against the spike build, all six stories failed to render. Without this the migration silently converts the a11y gate into a no-op.

**Exit:** no `packages/angular`; Storybook builds inside NFR-003's three minutes; every remaining story renders, proven by the repaired axe gate over HTTP; `LightMode` variants intact; 4 Angular-keyed baselines retired and the remaining 3 re-shot and reviewed.

---

### M4 · `elements-package-foundation` — **ready after M1 + M2**

**Intent:** prove the mechanism with the most boring component in the repository.

**In scope:** scaffold `packages/elements` on Lit; nx tags and eslint `depConstraints` (`elements` → `styles` + `tokens`; wrappers → `elements` + `tokens`); the CSS build step from ADR-10 §1; both build artifacts from ADR-10 §2; the guarded `customElements.define` from ADR-10 §5; the CEM analyzer emitting `custom-elements.json`; **exactly one element — `sk-stub`**.

**Out of scope:** any real component; the Storybook renderer (M3 owns it); wrappers; publishing.

**Depends on:** M1, M2. **Reads:** ADR-9, ADR-10.

**Mandatory WP:** extend `ci-quality.yml`'s `components` path filter to `packages/elements/**`. The filter lists only the three existing package paths and the `gate` job treats `skipped` as acceptable, so without this every elements PR merges with a11y, visual regression and Playwright all skipped.

**Proven ahead of time (ADR-10):** the whole CSS path — real `.css` → constructed stylesheet → adopted into a shadow root, 0 `<style>` elements, tokens resolving through the boundary, loaded from a classic script over `file://`.

**Exit:** `nx run elements:build` emits both artifacts plus the manifest; `sk-stub` renders from a bundler-free local HTML page, from a Vite/Svelte fixture, and in Storybook; stylelint SK-D01 still binds to the same `.css`; the CSS source exists exactly once.

---

### M5 · `elements-verification-harness` — **ready after M4 + O5**

**Intent:** the quality signal a screenshot and an axe scan cannot provide.

**In scope:** Vitest with browser mode on the Playwright provider, plus a Node project in the same config; the ADR-11 conformance matrix with its fixture set (bundler-free page, Svelte app, Storybook, React slot reserved); the CEM drift check; new jobs added to `ci-quality.yml`'s `gate` required list.

**Out of scope:** per-component tests beyond `sk-stub` and one placeholder; wrapper generation; the visual baseline set (M3 owns it).

**Depends on:** M4, **O5** — a hard CI gate must not contradict the charter. **Reads:** ADR-11.

**Exit:** the suite runs on train PRs and is enforced in `gate`; red-first evidence for a deliberately broken `setFormValue` and a deliberately mis-fired event; CI stays inside its time envelope, and a budget for the suite is written down rather than assumed (the charter's three-minute figure covers only the Storybook build).

---

### M6 · `sk-card-elements-vertical-slice` — after M4 + M5

**Intent:** ADR-8 confirmation criterion **#1**, on a component with no behaviour.

**In scope:** `<sk-card>` with its blue/purple/inset variants as attributes, slotted content, the ADR-9 `::part()` surface; its story authored the elements way; delete the component's duplicate markup sources per ADR-10 §3; assert the element and the static-CSS card render identically.

**Carries a known repair:** `sk-card.css` is the one file of fourteen using a cross-boundary theme selector (`:root[data-theme="light"] .sk-card--blue`), proven inert inside a shadow root. Its light-mode variance moves into tokens, which means new token pairs in `@spec-kitty/tokens` — a tokens-package change inside this mission, or immediately before it.

**Out of scope:** the demo pages (they remain the styles-layer proof); any other component; wrappers.

**Exit:** confirmation #1 recorded with evidence from three consumption paths, one CSS source, no wrapper in existence; axe zero; `LightMode` present **and rendering light-mode styling**; card markup authored exactly once.

---

### M7 · `sk-nav-pill-behaviour-element` — after M6, parallel with M8

**Intent:** the library's only existing behaviour becomes element-internal.

**In scope:** `skToggleDrawer`'s logic moves inside the element; the global `id="sk-nav-drawer"` contract is replaced by a public API (`open`/`close`/`toggle` plus a documented custom event); `aria-expanded` ownership; Escape and focus-return behaviour; updating `apps/demo/dashboard-demo.html` (hard rule 7). `skToggleDrawer`'s removal is a documented break — and a free one, since nothing is published.

**Exit:** behaviour tests pass in the M5 harness; the keyboard path is axe-clean; the demo page works in both path modes.

---

### M8 · `sk-form-field-form-association` — after M6, parallel with M7

**Intent:** form participation, decided in ADR-9 §4 rather than discovered.

**In scope:** arrangement **B + form-associated** — the element owns both label and control inside its shadow root, with `static formAssociated = true` and `ElementInternals` for `setFormValue` and `setValidity`. Label text becomes a component property. Collapses the eight exported form-state HTML strings into element state.

**Settled ahead of time (ADR-9 §4):** a slotted label with a shadow control fails axe, and so does a form-associated host labelled by a light-DOM `<label for>` — axe flags the inner control as unnamed. A shadow root owning both passes axe but submits nothing unless the host is form-associated. Only the combination does both. Do not re-litigate; do re-verify on the target engines.

**Exit:** a native `<form>` submit produces the right `FormData`; validation state reaches the accessibility tree; axe zero; Firefox parity recorded, and WebKit recorded as verified or explicitly deferred with a reason.

---

### M9 · `react-wrapper-generation` — after M7 + M8

**Intent:** ADR-8 confirmation criterion **#2**.

**In scope:** the CEM → wrapper generator using **`@wc-toolkit/react-wrappers`** (1.2.7, Jul 2026 — the maintained successor to `custom-element-react-wrappers` under the same maintainer, whose last release was Oct 2025); types from the manifest; event and property mapping; ref forwarding; the SSR/RSC boundary; the CI drift check. Wraps only the elements that exist at that point.

**Size it as ergonomics, not interop.** React 19 already scores 16/16 on Custom Elements Everywhere; a wrapper buys JSX-level types, typed refs and SSR attribute handling. `@lit/react` is a runtime `createComponent()` helper called once per component by hand — it cannot satisfy the drift criterion on its own, though the generator may emit calls to it.

**A legitimate outcome is "no package, the manifest sufficed."** That must be allowed to be the finding.

**Exit:** the generated wrapper passes the conformance matrix with zero hand edits, and CI fails when generator output drifts from the manifest.

---

### M10 · `elements-first-authoring-recipe` — after M9, **before the batches**

**Intent:** stop nine components being migrated by nine agents following the old two-package recipe.

**In scope:** `docs/contributing/adding-a-component.md` rewritten for the elements flow; `skills/spec-kitty-design/SKILL.md` and its rules; `docs/design-system/using-components.md`; `llms.txt` and `llms-full.txt`; `sad-lite.md`; `system-context-canvas.md`; `risk-register.md`; CLAUDE.md §1, §5 and §6.

**Out of scope:** ADRs (M1 owns them); the charter (O5); code.

**Exit:** a contributor following only the new recipe produces a component that passes every gate; no document still describes `html-js` + Angular as the topology.

---

### M11 / M12 / M13 · `component-migration-batch-{layout,cards,primitives}` — after M10

Nine remaining components, three per mission. **layout:** grid, section-banner, site-footer. **cards:** blog-card, feature-card, ribbon-card. **primitives:** button, pill-tag, check-bullet.

**Per batch:** element, story, conformance entry, wrapper regeneration, and deletion of that component's duplicate markup sources.

**Parallelism is conditional** on ADR-11's ruling that generated artefacts are CI-generated rather than committed. If they are committed, the three batches collide on the same generated files and must serialise.

**The last batch to merge owns ADR-8 confirmation criterion #3** and asserts it repository-wide, in the restated form from ADR-10 §3: no component markup is *authored* twice.

---

### M14 · `elements-first-release` — after M11–13

**In scope:** `release.yml` rebuilt for the new graph; provenance; SBOM; the integrity hash for the browser bundle; the single-version policy note; CHANGELOG; the semver ruling — nothing was ever installed, so 1.0.0 is still free.

**This mission prepares the release; it does not perform it.** `release.yml` fires on `push: tags: ['v*.*.*']`, not on a merge. Tagging from the integration branch would publish 1.0.0 out of a state that has not been reviewed as a whole, so the tag is pushed **after the train lands on `main`, by the operator** — the same authority as the merge itself.

**Consequence, stated plainly: no mission in this programme needs npm write access.** N1's remaining steps (2FA, publish token, `NPM_TOKEN`, dry run) gate the operator's release, not any mission's work. N1 is therefore not a hard prerequisite for this mission — only for the tag that follows it.

**Exit:** `npm publish --dry-run` passes for every package in the new graph, proving the rebuilt pipeline end to end; a `file://` page loads the **locally built** classic-script bundle with no network; the integrity hash is generated and recorded; and the release runbook states the post-merge sequence — land the train, tag, workflow publishes.

---

### M15 · `fourth-target-cost-measurement` — after M9 (M14 not required: measure against a local build)

ADR-8 confirmation criterion **#4**. Pick the target in advance (Vue or Solid), timebox to one day, measure and record — including the honest outcome "no package needed". Fold the deferred Angular generator in here if and only if a consumer has appeared.

---

### M16 · `dashboard-elements-adoption` — cross-repo, `spec-kitty` #650

The real proof of value: the no-build dashboard consumes elements. A single classic `<script>` plus the token stylesheet, replacing hand-rolled markup inside `dashboard.js` incrementally, introducing no build step.

**Constraints from the audit:** classic script only — `file://` plus `type="module"` is CORS-blocked and the dashboard registers no `.mjs` MIME type; no CSP to fight; `glossary.html` is a second, separately-served page that the audit counts as its own target; `static/js/dossier-panel.js` is referenced by nothing and is dead code.

**Pair with:** kitty-desktop dropping its vendored `tokens.css` mirror for the real package — which needs **O4** landed first, since that repo takes no runtime CDN.

---

## Critical path

```
M1 ✅ ──► M2 ──► M3
            └──► M4 ──► M5 ──► M6 ──┬── M7 ──┐
                                     └── M8 ──┴──► M9 ──► M10 ──► M11∥M12∥M13 ──► M14* ──► M15
                                                                                       └──► M16
                                                            * N1 is a hard prerequisite for M14 only
```

**Parallel:** M3 ∥ M4 · M7 ∥ M8 · the three batches, conditionally · all Ops and operator items throughout.

Where a mission is ready before its parent merges, stack its branch on the parent's branch rather than waiting.
