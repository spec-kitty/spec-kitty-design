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
| Live references | 27 | 154 | **rewritten** |
| Package source headers | 29 | 29 | **rewritten** — see below |
| Decision records | 8 | 22 | untouched |
| Demo display copy | 1 | 8 | **rewritten** |
| Diagram sources and renders | 6 | 6 | deferred to #83 |
| Programme document | 1 | 6 | 5 untouched, 1 corrected |
| Commitlint scope enum | 1 | 3 | **scope dropped**; 3 explanatory comment lines remain |
| Angular CSS comments | 3 | 3 | **rewritten** |

Files sum to 169, lines to 831.

**The header, Angular-comment and commitlint rows were deferrals in this
document's first two drafts. The operator directed that the findings be fixed
rather than deferred, so they were** — see *Findings fixed rather than deferred*
below. What remains untouched is the frozen record, the ADRs, and the diagrams
that belong to #83.

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

## Findings fixed rather than deferred

The adversarial gate ran twice and produced no code defect after pass 1. The
operator directed that its findings be fixed rather than filed. What changed:

**Names.** All 29 source headers and the 3 Angular button-CSS comments now say
`@spec-kitty/styles`. This mattered more than an internal tidy: **28 of the 29 reach
the published tarball** — the 27 `.css`/`.html` via `project.json`'s
`**/*.{html,css}` asset glob and `sk-nav-pill.js` via `release.yml`'s hand-written
`cp` — so a consumer opening `@spec-kitty/styles/dist/button/sk-button.css` was
reading a comment naming a package that does not exist. The edit is 32 files, 32
lines, and every changed line is a comment. `packages/styles/README.md` also pointed
installers at `src/`, which the `files` allowlist excludes from the tarball; it now
points at `dist/`.

**The commitlint enum.** `html-js` is dropped, per the file's own standing rule that
the scope stays only *"until their packages are actually gone"*. `CLAUDE.md` and
`llms-full.txt` mirrored that enum and had been wrong since O2 — listing ten scopes
against an enum of thirteen — so both are corrected, and `CLAUDE.md`'s worked example
now names a package that exists.

**A dead boundary rule.** `eslint.config.mjs` constrained `sourceTag: 'scope:docs'`,
which no project carries; the rule matched nothing while `apps/storybook`, the one
project that depends on all three packages, was governed by no constraint at all.
Retargeted to `scope:storybook`. Lint passes.

**A `.gitignore` exception resting on a false premise.** The un-ignore entries for
`packages/{angular,styles}/dist/` were justified by *"npm pack respects .gitignore for
re-inclusion"*. Tested both packages both ways: the tarballs are identical — `styles`
is governed by its `files` allowlist and `angular` publishes from inside `dist/`,
where root ignore rules do not reach. The exceptions bought nothing and un-ignored
the build trees, which is how a stray `git add -A` in this very mission nearly
committed compiled output. Removed, with the test recorded in the file.

**A lockfile pin that had drifted.** The root mirror said `^1.59.1` for
`@playwright/test` against the manifest's exact `1.62.1`. `docs-diagrams.yml` now pins
the diagram-rendering browser off that exact version, so the drift was load-bearing
for diagram reproducibility.

**Two gates that could not fail.**

- `quality:htmlhint` ended in `|| true`. The 9 errors it was masking are Angular
  *template fragments*, where `attr-lowercase` (`*ngIf`) and `input-requires-label`
  are category errors — that is what the `|| true` was really for. The glob is now
  narrowed off `packages/angular` and widened onto `apps/demo/**` and `audit/*.html`,
  and the `|| true` is gone. 20 files, clean.
- The demo deploy assembly ran only on push to `main`, and its only check grepped for
  a residual `../../packages` prefix — it proved the `sed` fired, never that the
  rewritten targets existed. It is now `scripts/assemble-demo-dist.sh`, which derives
  the component set from the pages themselves rather than a hardcoded seven-name
  allowlist (removing the drift class entirely) and asserts every reference resolves.
  `ci-quality.yml` runs it on every PR. Both failure modes were tested: a page
  referencing a component that does not exist, and a rename the `sed` missed.

**The runtime code had no test.** `sk-nav-pill.js` is the only executable code in
this package and nothing exercised it, so a broken import would have gone green
everywhere. `apps/storybook/src/tests/nav-pill-behaviour.spec.ts` drives it through
the assembled demo page and asserts both the toggle behaviour and the absence of
module/asset failures; verified by breaking the specifier and watching it fail.

### A finding this work turned up, which is not fixed here

Chasing that last item surfaced something larger. **The HTML Storybook stories do not
render at all.** Storybook is configured with `@storybook/angular` as its only
framework, and the HTML stories — whose `render` returns a raw string — never leave
the `sb-preparing-story` state. Reproduced directly: `primitives-skstub-angular--default`
and `components-skfeaturecard-angular--default` render; `primitives-skstub-html--default`
and `components-skfeaturecard-html--default` are blank after a 25-second wait.

The consequence is that **3 of the 7 visual baselines — the HTML ones, and the only
ones that touch this package — are screenshots of a loading spinner.** They pass
unchanged no matter what happens to `packages/styles`. `visual.spec.ts` takes those
three after only `waitForLoadState('domcontentloaded')`, with no selector wait, which
is why nobody noticed.

That is why this mission's exit criterion needed the correction recorded in
`elements-first-programme.md`: the baselines were never the behaviour-neutrality
proof they were taken for. It is **not** fixed here — ADR-13 and M3 (#69) move
Storybook to the web-components renderer, which is the fix — but the baselines should
not be trusted as component coverage until then. Filed on #88.

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
