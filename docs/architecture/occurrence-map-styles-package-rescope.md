# Occurrence classification — `html-js` → `styles` (M2, issue #68)

**Date:** 2026-09-02 · **Mission:** `styles-package-rescope` · **Reads:** ADR-8

The mandatory artefact for this mission: every occurrence of the string `html-js`
in the repository, classified as a **live reference** (rewritten by this mission)
or as something that is **not rewritten**, with the reason.

Baseline at `train/elements-first` (`13459c8`), before the rename: **831 matching
lines across 169 tracked files.** `git grep -c` counts lines, not hits — the true
occurrence count is **884** (`git grep -o html-js | wc -l`). Every count in the
table below is the line metric, consistently.

| Class | Files | Matching lines | Action |
|---|---:|---:|---|
| Frozen historical record | 93 | 600 | untouched |
| Live references | 27 | 154 | **151 rewritten, 3 held** (see the commitlint note) |
| Package source headers | 29 | 29 | untouched — moved verbatim |
| Decision records | 8 | 22 | untouched |
| Demo display copy | 1 | 8 | 7 rewritten, 1 untouched |
| Diagram sources and renders | 6 | 6 | deferred to #83 |
| Programme document | 1 | 6 | 6 occurrences untouched |
| Commitlint scope enum | 1 | 3 | untouched |
| Angular CSS comments | 3 | 3 | untouched |

Files sum to 169, lines to 831.

## Rewritten — live references

The directory move itself: `git mv packages/html-js packages/styles`, **65 renames,
62 of them at 100% similarity**. The three that carry content are `README.md` (87%),
`package.json` (93%) and `project.json` (55%) — the files whose job is to name the
package. Nothing under `src/` changed a byte:
`git rev-parse f510887:packages/styles/src` equals
`git rev-parse 13459c8:packages/html-js/src`, one hash.

Plus:

- **Package metadata** — `package.json` (`name` → `@spec-kitty/styles`), `project.json`
  (project name, `sourceRoot`, `outputPath`, `main`, `tsConfig`, asset `input`,
  lint patterns, `scope:styles` tag), `README.md`.
- **Workspace config** — `eslint.config.mjs` `depConstraints` (`scope:html-js` →
  `scope:styles`, and the `scope:docs` allowance), `.gitignore` npm-pack
  re-inclusion exception, `package-lock.json` (the workspace link entry and the
  workspace package entry — 6 lines, edited surgically; a full `npm install`
  regenerate was reverted because this machine's npm also stripped `libc` fields
  and rewrote an unrelated `@playwright/test` range).
- **Pipelines** — `ci-quality.yml` `components` path filter; `storybook-deploy.yml`
  path trigger, build project list, the `sed` rewrite rule and its comment, and the
  component copy allowlist; `release.yml` build project list, the hand-written
  `cp` of `sk-nav-pill.js`, the dist-audit `for pkg` loop, and the publish step;
  `pr-preview.yml` build project list.
- **Storybook** — `.storybook/main.ts` (`htmlJsPath` → `stylesPath` and the webpack
  `include`). The `stories` glob is `packages/**` and needed no change.
- **Demo pages** — all three, in the `file://` relative form. Only `blog-demo.html`
  and `dashboard-demo.html` have a deploy form: `storybook-deploy.yml` copies just
  those two into the dist, so `apps/demo/index.html` exists in `file://` mode only.
- **Render harness** — `audit/index.html`, 27 paths. See the `audit/**` ruling below.
- **Doc surfaces** — `CLAUDE.md`, `README.md`, `llms.txt`, `llms-full.txt`,
  `docs/contributing/*`, `docs/design-system/*`, `docs/architecture/sad-lite.md`,
  `docs/architecture/system-context-canvas.md`,
  `skills/spec-kitty-design/rules/component-authoring.md`.

## `audit/**` is live tooling, not record — a declared deviation from #68

**This mission was told to leave `audit/**` alone, and did not.** Issue #68's
mandatory-artefact clause names `audit/**` alongside the frozen record, as did
`elements-first-programme.md:135` at `13459c8`. That classification is wrong:

- `audit/run.js` is an executable Playwright harness. It serves the repo, navigates
  to `http://localhost:8899/audit/index.html`, waits on `window.__DONE__` and
  screenshots the component set.
- `audit/index.html` carried **27 live `/packages/html-js/dist/…` references** — 14
  stylesheet links and 13 ES-module imports.

Left alone, all 27 would 404, `window.__DONE__` would never be set, and `run.js`
would time out and exit 1. #68 is internally contradictory here: its exit criterion
demands *"no live `packages/html-js` reference remains"*, and this is the single
largest concentration of live path references in the repository. One of the two
instructions had to give; this mission kept the exit criterion and gave up the
classification assumption, and corrected the upstream claim at
`elements-first-programme.md:135` so the error is not re-seeded.

**This deviation is declared, not ratified.** It wants an operator's word at the
accept gate rather than silent consent.

Nothing in `.github/workflows/` invokes the harness — `ci-quality.yml`'s
`paths-filter` groups contain no `audit/**` entry — so CI could not have caught the
breakage and cannot confirm the repair. See the evidence section for what was
verified instead.

## Not rewritten, and why

Each deferral below routes to a live issue number:
**#88** (post-rename hygiene) · **#83** (the diagram corrections, successor to the
now-closed #67).

**Frozen historical record** (`kitty-specs/**`, `docs/architecture/validation/**`,
`docs/learnings/**`) — 600 lines, 72% of the total. These record what past missions
did, under the name the package had at the time. Rewriting them would falsify the
record, and `kitty-specs/**` additionally desyncs runtime state when hand-edited
(CLAUDE.md §7).

**Decision records** (`docs/architecture/decisions/**`, `research/**`) — an ADR
states what was decided on a date. ADR-8 in particular *argues from* the name
`@spec-kitty/html-js` when it explains what is being re-scoped. Note ADR-2 is still
`Status: Accepted` with no "Amended by ADR-8" back-pointer while drawing the old
`tokens ← html-js` graph; #83 explicitly out-of-scopes ADR text, so that is tracked
on **#88**, not #83.

**Package source headers** — 29 files under `packages/styles/src/` open with an
attribution comment naming `@spec-kitty/html-js`: 11 `.css`, 16 `.html`, plus
`form-field/index.ts` and `nav-pill/sk-nav-pill.js`.

The governing rule is that **this mission renames references to the component
source, and does not edit the component source itself.** That is what #68 means by
putting *"any CSS or markup change"* and *"the `index.ts` string exports — they
move, they do not change"* out of scope, and it covers all 29 including the `.js`,
which no narrower wording reaches. It is also the rule that correctly *permits*
rewriting `apps/demo/*.html` and `audit/index.html`, which are references, not
source.

Worth recording against **#88**: **28 of the 29 reach the published tarball.** The
27 `.css`/`.html` are copied verbatim by `project.json`'s `**/*.{html,css}` asset
glob, and `sk-nav-pill.js` is copied by hand in `release.yml`. So a consumer opening
`@spec-kitty/styles/dist/button/sk-button.css` reads a comment naming a package that
does not exist — a published-artifact inconsistency, not merely an internal one.

**Angular CSS comments** — `packages/angular/src/lib/button/sk-button-*.component.css`
carry present-tense provenance claims naming `@spec-kitty/html-js`. Out of scope
(Angular), and #69 deletes the package outright. **#88**.

**Commitlint scope enum** — `commitlint.config.cjs` carries its own rule:
*"`angular` and `html-js` stay until their packages are actually gone."* That
condition has now fired, but the file is not in this mission's in-scope list.
Tracked on **#88** — note #69's body commits only to retiring the `angular` scope,
so `html-js` needs an explicit owner rather than an assumption.

Three live doc lines are held back with it, and they are **stale, not accurate**:

- `CLAUDE.md:38` and `llms-full.txt:604` mirror the enum and list only the original
  ten scopes. The enum has carried `styles`, `elements` and `react` since O2, so
  both were already incomplete at the base commit — O2's unfinished business.
- `CLAUDE.md:107` is a different thing: not a list, but a worked example
  (*"sticking a tokens change in an `html-js`-scoped commit…"*). It names a scope by
  the name of a package **this merge deletes**, so unlike the other two it is
  degraded by this mission rather than merely inherited. It is the one of the three
  with a real claim to have belonged in this diff.

**Diagram sources and renders** (`docs/architecture/assets/**`) — ADR-12 assigns
these files to the diagram-correction mission, which must add the `styles` and
`elements` layers anyway. That mission is **#83** (#67 was closed COMPLETED on
2026-09-02 and superseded). Consequence to be aware of: `sad-lite.md` §3 now has an
updated inline mermaid block sitting directly under an embedded
`c4-l2-package-topology.svg` that still renders `@spec-kitty/html-js`. The two
disagree until #83 re-renders the asset. Editing the inline block was correct — it
is live prose, and `docs-diagrams.yml` only watches `docs/architecture/assets/**`.

**Programme document** — its 6 `html-js` occurrences are untouched: it describes this
mission as *"rename `packages/html-js` → `packages/styles`"*, and rewriting that
produces "rename `packages/styles` → `packages/styles`". The file **is** modified by
this mission, at the mandatory-artefact line only, to link this document and to
correct the `audit/**`-as-record claim at source. That edit is a second declared
deviation: #68 does not list this file, and it is the document defining this
mission's scope. Also stale in it and tracked on **#88**: the O7 row at line 102
still reads `open`, though `13459c8` closed it.

**The cross-repository consequence (O3)** is real and not handled here. The Team
Kitty SaaS repo's `docs/design-qa/design-authority.json` lists
`packages/html-js/src/index.ts` in `required_files`, and
`scripts/design/resolve-design-repo.mjs` hard-fails locally when that path
disappears — which this merge makes it do. ADR-8 and the programme document both
pre-ruled this hygiene rather than a blocker, because that repo has no GitHub
Actions workflows on `main`.

**Demo display copy** — `apps/demo/dashboard-demo.html` renders a mock kanban card
titled *"Bug fixes — Angular buttons + html-js CSS imports"*. Prose about a past work
package, not a path reference. The other 7 occurrences in that file are live paths
and were rewritten.

## Behaviour-neutrality evidence

- `npm run quality:all` — exit 0 (lint, stylelint, htmlhint). **Stated honestly, this
  is near-empty evidence for this particular mission.** `quality:htmlhint` ends in
  `|| true` so it cannot fail at all, and its globs (`packages/**/*.html`,
  `apps/storybook/src/**/*.html`) exclude both `apps/demo/**` and `audit/**`;
  `quality:stylelint` covers `packages/**/*.css`, whose content did not change. It is
  reported because #68 names it an exit criterion, not because it constrains this
  diff. The `|| true` is tracked on #88.
- `npx nx run-many --target=build --projects=tokens,angular,styles` — all 3 built.
- `npx nx show projects` → `["angular","styles","tokens","storybook"]`.
- `npx nx run storybook:storybook:build` — completed; `sk-feature-card`,
  `sk-ribbon-card` and `sk-stub` confirmed present in the built bundle. Those are the
  components the visual baselines cover, so the check is on-target; `sk-btn`,
  `sk-nav-pill` and `sk-pill-tag` are present too. The rewritten webpack `include` is
  a single directory prefix, so it resolves for all of `packages/styles` or none.
- `npm ci --ignore-scripts` from the edited lockfile — clean;
  `node_modules/@spec-kitty/styles` links to `packages/styles`.
- **Demo pages, `file://` mode** — every relative reference resolves on disk.
- **Demo pages, deploy mode** — the `storybook-deploy.yml` `sed` and asset copy were
  replayed into a scratch dist; the workflow's own residual-path check passes and
  every rewritten reference resolves. (Counts of 22 and 19 elsewhere in this mission's
  trail are *distinct* reference targets, deduplicated — the raw site counts are 23
  and 20, because `blog-demo.html` links `logo.webp` twice.)
- **Render harness** — `nx build styles` was run and all **27** rewritten
  `audit/index.html` paths were resolved against the real build output. This matters
  because the file mixes two prefixes: stylesheets land at `dist/<comp>/<file>.css`
  via the asset glob, ES modules at `dist/src/<comp>/index.js` via tsc. Both forms
  resolve. **The harness itself was not executed end-to-end** — that needs a server on
  `:8899` — so this is path verification, not a run.
- **The 7 visual baselines pass.** `visual-regression` is green at both `c24d895` and
  `f510887`. They are keyed to story ids derived from each story's `title`
  (`Components/SkFeatureCard (HTML)` → `components-skfeaturecard-html`), not from the
  directory; no story file changed, so no id changed.

  **They are narrower proof than they look.** 3 of the 7 render `packages/styles`
  through the rewritten webpack `include`; the other 4 are Angular stories, irrelevant
  to this rename. None exercises the package's only runtime behaviour,
  `sk-nav-pill.js`, which has no story, no test and no baseline. The binding evidence
  for this rename is the path-resolution replays above, not the screenshots. Tracked
  on #88.

### CI status, stated exactly

At **`c24d895`**: `visual-regression`, `playwright`, `lighthouse`, `storybook-build`,
`lint-code`, `security`, `workflow-pin-check`, `preview` all **success**; `a11y`
**cancelled**; and the enforced `gate` job therefore concluded **failure** — it treats
anything other than `success` or `skipped` as a fail. The cancellation was caused by
this branch's own next push, via `ci-quality.yml`'s `cancel-in-progress` concurrency
group; it was not an accessibility regression. That SHA is superseded and its result
is recorded here only so the trail is not misread as green.

`f510887` is the head. Its `gate` result is the one that governs the merge.

### One live disagreement this mission does not resolve

`elements-first-programme.md`'s M2 exit criterion still calls the 7 visual baselines
*"the behaviour-neutrality proof and the reason nothing else may be in the diff."*
This document argues above that they are narrower than that — 3 of the 7 touch the
moved package and none exercises its runtime JS. The two live documents therefore
disagree about what the proof is. This mission does **not** amend that line: it is
the exit criterion it is being judged against, and rewriting the standard you are
measured by, mid-mission, is not a call this mission gets to make. Flagged for the
operator at the accept gate and tracked on #88.
