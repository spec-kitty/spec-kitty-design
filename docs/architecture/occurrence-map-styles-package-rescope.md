# Occurrence classification — `html-js` → `styles` (M2, issue #68)

**Date:** 2026-09-02 · **Mission:** `styles-package-rescope` · **Reads:** ADR-8

The mandatory artefact for this mission: every occurrence of the string `html-js`
in the repository, classified as a **live reference** (rewritten by this mission)
or as something that is **not rewritten**, with the reason.

Baseline at `train/elements-first` (`13459c8`) before the rename: **831 matching
lines across 169 tracked files.** `git grep -c` counts lines, not hits — the true
occurrence count is **884** (`git grep -o html-js | wc -l`). Every count in this
document is the line metric, consistently.

| Class | Files | Matching lines | Action |
|---|---:|---:|---|
| Frozen historical record | 93 | 600 | untouched |
| Live references | 27 | 154 | **rewritten** |
| Package source headers | 29 | 29 | untouched — moved verbatim |
| Decision records | 8 | 22 | untouched |
| Demo display copy | 1 | 8 | 7 rewritten, 1 untouched |
| Diagram sources and renders | 6 | 6 | deferred to #67 |
| Programme document | 1 | 6 | untouched |
| Commitlint scope enum | 1 | 3 | untouched |
| Angular CSS comments | 3 | 3 | untouched |

## Rewritten — live references

The directory move itself (`git mv packages/html-js packages/styles`, 62 files at
100% similarity), plus:

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
  and `dashboard-demo.html` have a deploy form at all: `storybook-deploy.yml` copies
  just those two into the dist, so `apps/demo/index.html` exists in `file://` mode
  only. Both modes were verified, see below.
- **Render harness** — `audit/index.html`, 27 paths. See the `audit/**` note below.
- **Doc surfaces** — `CLAUDE.md`, `README.md`, `llms.txt`, `llms-full.txt`,
  `docs/contributing/*`, `docs/design-system/*`, `docs/architecture/sad-lite.md`,
  `docs/architecture/system-context-canvas.md`,
  `skills/spec-kitty-design/rules/component-authoring.md`.

Everything deferred below is tracked as **#88**, except the two items that belong
to #67 (the ADR-2 back-pointer and the stale O7 status line).

## Not rewritten, and why

**Frozen historical record** (`kitty-specs/**`, `docs/architecture/validation/**`,
`docs/learnings/**`) — 600 occurrences, 72% of the total. These record what past
missions did, under the name the package had at the time. Rewriting them would
falsify the record, and `kitty-specs/**` additionally desyncs runtime state when
hand-edited (CLAUDE.md §7).

**`audit/**` is the exception, and the first draft of this map got it wrong.**
Issue #68 and `elements-first-programme.md:137` both name `audit/**` alongside the
frozen record, and this map repeated that. It does not hold: `audit/run.js` is an
executable Playwright harness that serves `audit/index.html` on `localhost:8899`
and screenshots the component set, and `audit/index.html` carries **27 live
`/packages/html-js/dist/…` stylesheet links and ES-module imports**. Left alone,
every one of them 404s and the harness stops working — `window.__DONE__` is never
set and `run.js` times out. Those 27 paths are therefore rewritten with the same
mechanical rule as the demo pages. `render.png` is a captured artifact and is left
as it is. Nothing in `.github/workflows/` invokes the harness, so this was invisible
to CI in both directions — it is why the gate caught it and the pipeline did not.

**Decision records** (`docs/architecture/decisions/**`, `research/**`) — an ADR
states what was decided on a date. ADR-8 in particular *argues from* the name
`@spec-kitty/html-js` when it explains what is being re-scoped; rewriting it would
make the argument incoherent. The run prompt also writes ADRs only in #67.

**Package source headers** — 29 files under `packages/styles/src/` open with an
attribution comment naming `@spec-kitty/html-js`. Issue #68 puts *"any CSS or
markup change"* explicitly out of scope, and a comment on line 1 of a `.css` file
is a change to a `.css` file. That is the reason they are left alone.

A secondary reason given in this map's first draft — that editing them would turn
"62 verifiable renames into 62 content diffs" — was overstated and is withdrawn.
Only **29** of the 65 renamed files carry a header, and the diff already mixes
pure renames with three content-carrying ones (`README.md` 87%, `package.json` 93%,
`project.json` 55%), so a reviewer must already tell the two apart. Worth recording
against the follow-up: 24 of the 29 are `.css`/`.html` files that `project.json`
copies verbatim into `dist/`, so a consumer opening
`@spec-kitty/styles/dist/button/sk-button.css` reads a comment naming a package
that does not exist. That is a published-artifact inconsistency, not merely an
internal one, and it should not sit unfixed for long.

**Angular CSS comments** — the same question as above, in a package this mission
puts explicitly out of scope. Follow-up, with the headers.

**Commitlint scope enum** — `commitlint.config.cjs` carries its own rule:
*"`angular` and `html-js` stay until their packages are actually gone."* Dropping
the scope is defensible now. The reason it is not done here is simply that
`commitlint.config.cjs` is not in this mission's in-scope list, and #69 retires
Angular so it can drop both scopes in one edit. (A first draft also argued that
dropping it "would reject a legitimate future revert" — that is wrong: a revert of
this PR inherits the `styles` scope, which stays in the enum. Clause withdrawn.)

`CLAUDE.md` lines 38 and 107 and the matching line in `llms-full.txt` describe
**this enum**, so they deliberately still say `html-js`. An earlier draft of this
map went further and called those lines *accurate as long as the enum does*.
**That was wrong.** The enum has carried `styles`, `elements` and `react` since O2,
before this mission started, while all three doc lines list only the original ten
scopes — so they were already incomplete at the base commit. They are left as they
are because completing them is O2's unfinished business rather than this rename's,
but they are stale, not accurate, and the follow-up should say so.

**Diagram sources and renders** (`docs/architecture/assets/**`) — ADR-12 assigns
these files to #67, which must add the `styles` and `elements` layers anyway. That
ownership is the whole reason; a second reason given in this map's first draft —
that `docs-diagrams.yml`'s drift check "currently fails on 8 of 8 SVGs" — is
**withdrawn as stale**. Commit `13459c8`, the tip of the train this branch is cut
from, is `fix(docs): pin the diagram rendering browser (O7), and re-render`: the
workflow now installs Playwright's pinned Chromium instead of an apt build, and
the re-render already landed. O7 is closed, `elements-first-programme.md:99`
notwithstanding.

**The cross-repository consequence (O3) is real and is not handled here.** The Team
Kitty SaaS repo's `docs/design-qa/design-authority.json` lists
`packages/html-js/src/index.ts` in `required_files`, and
`scripts/design/resolve-design-repo.mjs` hard-fails locally when that path
disappears — which this merge makes it do. ADR-8 and `elements-first-programme.md`
(O3) both pre-ruled this hygiene rather than a blocker, because that repo has no
GitHub Actions workflows on `main`, so nothing goes red. Recorded here so a reader
can see it was considered rather than missed.

**Programme document** — `elements-first-programme.md` describes this mission as
*"rename `packages/html-js` → `packages/styles`"*. Rewriting it produces
"rename `packages/styles` → `packages/styles`".

**Demo display copy** — `apps/demo/dashboard-demo.html` renders a mock kanban card
titled *"Bug fixes — Angular buttons + html-js CSS imports"*. Prose about a past
work package, not a path reference. The other 7 occurrences in that file are live
paths and were rewritten.

## Behaviour-neutrality evidence

- `npm run quality:all` — exit 0 (lint, stylelint, htmlhint).
- `npx nx run-many --target=build --projects=tokens,angular,styles` — all 3 built.
- `npx nx show projects` → `["angular","styles","tokens","storybook"]`.
- `npx nx run storybook:storybook:build` — completed; `sk-feature-card`,
  `sk-ribbon-card` and `sk-stub` rules confirmed present in the built bundle. Those
  are the three components the visual baselines actually cover, so the check is
  on-target rather than merely adjacent; `sk-btn`, `sk-nav-pill` and `sk-pill-tag`
  are present too. The rewritten webpack `include` is a single directory prefix, so
  it resolves for all of `packages/styles` or none.
- `npm ci --ignore-scripts` from the edited lockfile — clean; `node_modules/@spec-kitty/styles`
  links to `packages/styles`.
- **Demo pages, `file://` mode** — all 22 relative references resolve on disk.
- **Demo pages, deploy mode** — the `storybook-deploy.yml` `sed` and asset copy were
  replayed into a scratch dist; the workflow's own residual-path sanity check
  passes and all 19 rewritten references resolve.
- **Known cosmetic inconsistency, deferred with the diagrams:** `sad-lite.md` §3 now
  has an updated inline mermaid block sitting directly under an embedded
  `c4-l2-package-topology.svg` that still renders `@spec-kitty/html-js`. The two
  disagree until #67 re-renders the asset. Editing the inline block was correct — it
  is live prose, and `docs-diagrams.yml` only watches `docs/architecture/assets/**`
  — but the adjacency is visible, so it is called out rather than left to surprise.

- **The 7 visual baselines passed on CI** at `c24d895`, together with
  `storybook-build`, `playwright`, `a11y` and `lighthouse`. They are keyed to story
  ids derived from each story's `title` (`Components/SkFeatureCard (HTML)` →
  `components-skfeaturecard-html`), not from the directory; no story file changed,
  so no id changed.

  **They are weaker proof than they look, and should not be cited as the whole
  argument.** They cover 3 of 13 components — `stub`, `feature-card`, `ribbon-card`
  — chromium only, and none of them exercises the surface this rename actually
  moves. The concrete gap: `apps/demo/dashboard-demo.html` imports `skToggleDrawer`
  from `sk-nav-pill.js`, the package's only runtime behaviour, and that file has no
  story, no test and no baseline. The binding evidence for this rename is the pair
  of path-resolution replays above, not the screenshots.
