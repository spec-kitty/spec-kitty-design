# Occurrence classification — `html-js` → `styles` (M2, issue #68)

**Date:** 2026-09-02 · **Mission:** `styles-package-rescope` · **Reads:** ADR-8

The mandatory artefact for this mission: every occurrence of the string `html-js`
in the repository, classified as a **live reference** (rewritten by this mission)
or as something that is **not rewritten**, with the reason.

Baseline: `git grep -c html-js` at `train/elements-first` before the rename —
**831 occurrences across 169 tracked files.**

| Class | Files | Occurrences | Action |
|---|---:|---:|---|
| Frozen historical record | 94 | 627 | untouched |
| Live references | 26 | 127 | **rewritten** |
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
- **Demo pages** — all three, in the `file://` relative form. The post-`sed` deploy
  form is covered by the `storybook-deploy.yml` rule above; both modes were
  verified, see below.
- **Doc surfaces** — `CLAUDE.md`, `README.md`, `llms.txt`, `llms-full.txt`,
  `docs/contributing/*`, `docs/design-system/*`, `docs/architecture/sad-lite.md`,
  `docs/architecture/system-context-canvas.md`,
  `skills/spec-kitty-design/rules/component-authoring.md`.

## Not rewritten, and why

**Frozen historical record** (`kitty-specs/**`, `docs/architecture/validation/**`,
`docs/learnings/**`, `audit/**`) — 627 occurrences, 75% of the total. These record
what past missions did, under the name the package had at the time. Rewriting them
would falsify the record, and `kitty-specs/**` additionally desyncs runtime state
when hand-edited (CLAUDE.md §7).

**Decision records** (`docs/architecture/decisions/**`, `research/**`) — an ADR
states what was decided on a date. ADR-8 in particular *argues from* the name
`@spec-kitty/html-js` when it explains what is being re-scoped; rewriting it would
make the argument incoherent. The run prompt also writes ADRs only in #67.

**Package source headers** — 29 files under `packages/styles/src/` open with an
attribution comment naming `@spec-kitty/html-js`. Left byte-identical so the move
appears in the diff as 100%-similarity renames, which is what lets a reviewer
verify behaviour-neutrality by inspection. Editing them would turn 62 verifiable
renames into 62 content diffs for no behavioural gain. Filed as a follow-up.

**Angular CSS comments** — the same question as above, in a package this mission
puts explicitly out of scope. Follow-up, with the headers.

**Commitlint scope enum** — `commitlint.config.cjs` carries its own rule:
*"`angular` and `html-js` stay until their packages are actually gone."* Dropping
the scope is defensible now, but the file is not in this mission's scope and
dropping it would reject a legitimate future revert. `CLAUDE.md` line 38 and
line 107, and the corresponding line in `llms-full.txt`, describe **this enum**
and so deliberately still say `html-js` — they are accurate as long as the enum
does. #69 retires Angular and can drop both scopes in one edit.

**Diagram sources and renders** (`docs/architecture/assets/**`) — ADR-12 assigns
these files to #67, which must add the `styles` and `elements` layers anyway.
Touching a `.mmd` here would also trigger `docs-diagrams.yml`, whose drift check
currently fails on 8 of 8 SVGs for reasons unrelated to this mission.

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
- `npx nx run storybook:storybook:build` — completed; `sk-btn`, `sk-nav-pill` and
  `sk-pill-tag` rules confirmed present in the built bundle, so the rewritten
  webpack `include` still resolves component CSS.
- `npm ci --ignore-scripts` from the edited lockfile — clean; `node_modules/@spec-kitty/styles`
  links to `packages/styles`.
- **Demo pages, `file://` mode** — all 22 relative references resolve on disk.
- **Demo pages, deploy mode** — the `storybook-deploy.yml` `sed` and asset copy were
  replayed into a scratch dist; the workflow's own residual-path sanity check
  passes and all 19 rewritten references resolve.
- **The 7 visual baselines** are keyed to story ids derived from each story's
  `title` (`Components/SkFeatureCard (HTML)` → `components-skfeaturecard-html`),
  not from the directory. No story file changed, so no id changed. The baselines
  are `-chromium-linux.png` generated on the CI runner image; CI is authoritative
  for that gate and this mission does not claim a local pass.
