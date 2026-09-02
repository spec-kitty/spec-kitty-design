# Occurrence classification — `html-js` → `styles` (M2, issue #68)

**Date:** 2026-09-02 · **Mission:** `styles-package-rescope` · **Reads:** ADR-8

The mandatory artefact for this mission: every occurrence of the string `html-js`
in the repository, classified as a **live reference** (rewritten) or as something
**not rewritten**, with the reason.

This document owns *classification*. Remediation of the findings the adversarial
gate raised lives on **#88**; the diagram work lives on **#83**. Keeping the two
apart is deliberate — an earlier draft mirrored #88 here and the copy contradicted
the shipped code twice before it was caught.

Baseline at `train/elements-first` (`13459c8`), before the rename: **831 matching
lines across 169 tracked files.** `git grep -c` counts lines, not hits — the true
occurrence count is **884**. Every count below is the line metric, consistently.

| Class | Files | Matching lines | Action |
|---|---:|---:|---|
| Frozen historical record | 93 | 600 | untouched |
| Live references | 27 | 154 | rewritten |
| Package source headers | 29 | 29 | rewritten |
| Decision records | 8 | 22 | untouched |
| Demo display copy | 1 | 8 | rewritten |
| Diagram sources and renders | 6 | 6 | deferred to #83 |
| Programme document | 1 | 6 | 5 untouched, 1 corrected |
| Commitlint scope enum | 1 | 3 | scope dropped; 3 comment lines remain |
| Angular CSS comments | 3 | 3 | rewritten |

Files sum to 169, lines to 831.

## Rewritten

The directory move itself: `git mv packages/html-js packages/styles`, **65 renames,
62 at 100% similarity**. The three carrying content are `README.md`, `package.json`
and `project.json` — the files whose job is to name the package. Nothing under
`src/` changed except line-1 attribution comments:
`git rev-parse <head>:packages/styles/src` matched
`git rev-parse 13459c8:packages/html-js/src` exactly until those headers were
updated, and every header edit is a single comment line.

- **Package metadata** — `package.json` name, `project.json` (name, `sourceRoot`,
  `outputPath`, `main`, `tsConfig`, asset `input`, lint patterns, `scope:styles`
  tag), `README.md` (including two install paths that pointed at `src/`, which the
  `files` allowlist excludes from the tarball).
- **Workspace config** — `eslint.config.mjs` `depConstraints`, `.gitignore`,
  `package-lock.json` (the workspace link and package entries, edited surgically:
  a full `npm install` regenerate was reverted because this machine's npm also
  stripped `libc` fields from unrelated optional deps).
- **Pipelines** — `ci-quality.yml`, `storybook-deploy.yml`, `release.yml`,
  `pr-preview.yml`.
- **Storybook** — `.storybook/main.ts`. The `stories` glob is `packages/**` and
  needed no change.
- **Demo pages** — all three in the `file://` form. Only the two `*-demo.html`
  pages have a deploy form; `apps/demo/index.html` is `file://` only.
- **Render harness** — `audit/index.html`, 27 paths. See the ruling below.
- **Doc surfaces** — `CLAUDE.md`, `README.md`, `llms.txt`, `llms-full.txt`,
  `docs/contributing/*`, `docs/design-system/*`, `sad-lite.md`,
  `system-context-canvas.md`, the component-authoring rule.
- **Source headers** — 29 files under `packages/styles/src/` and 3 Angular button
  CSS comments named `@spec-kitty/html-js`. **28 of the 29 reach the published
  tarball** (27 via `project.json`'s asset glob, `sk-nav-pill.js` via
  `release.yml`'s `cp`), so this was a consumer-visible inconsistency, not an
  internal one.

## `audit/**` is live tooling, not record — a declared deviation from #68

**This mission was told to leave `audit/**` alone, and did not.** Issue #68 and
`elements-first-programme.md` both named `audit/**` alongside the frozen record.
That is wrong: `audit/run.js` is an executable Playwright harness, and
`audit/index.html` carried **27 live `/packages/html-js/dist/…` references** — 14
stylesheet links and 13 ES-module imports. Left alone every one would 404,
`window.__DONE__` would never be set, and the harness would hang then exit 1.

#68 is internally contradictory here: its exit criterion demands *"no live
`packages/html-js` reference remains"*, and this was the largest concentration of
them in the repository. The mission kept the exit criterion and gave up the
classification, then corrected the claim at its source in the programme document.

Verified by resolving all 27 rewritten paths against a real `nx build styles`
tree. That mattered: the file mixes `dist/<comp>/<file>.css` for stylesheets with
`dist/src/<comp>/index.js` for ES modules, and a blanket rewrite could have
flattened one into the other. **The harness was not executed end to end** — that
needs a server on `:8899`. No workflow invokes it, so CI can confirm neither the
breakage nor the repair.

**Declared, not ratified** — it wants an operator's word at the accept gate.

## Not rewritten, and why

**Frozen historical record** (`kitty-specs/**`, `docs/architecture/validation/**`,
`docs/learnings/**`) — 600 lines, 72% of the total. They record what past missions
did under the name the package had at the time. Rewriting would falsify the record,
and `kitty-specs/**` desyncs runtime state when hand-edited (CLAUDE.md §7).

**Decision records** (`docs/architecture/decisions/**`, `research/**`) — an ADR
states what was decided on a date, and ADR-8 argues *from* the old name when it
explains what is being re-scoped. ADR-2 still lacks an "Amended by ADR-8"
back-pointer while drawing the old graph; #83 out-of-scopes ADR text, so that is
tracked on **#88**.

**Diagram sources and renders** (`docs/architecture/assets/**`) — ADR-12 assigns
these to the diagram mission, which must add the `styles` and `elements` layers
anyway. That is **#83** (#67 was closed COMPLETED on 2026-09-02 and superseded).
Consequence: `sad-lite.md` §3 now has an updated inline mermaid block above an
embedded SVG that still renders the old name, until #83 re-renders it.

**Commitlint comment lines** — the enum entry was dropped, but three comment lines
in `commitlint.config.cjs` still say `html-js` while explaining that history. They
are accurate as history.

**Programme document** — its 6 occurrences describe this mission as *"rename
`packages/html-js` → `packages/styles`"*; rewriting that yields nonsense. The file
**is** modified by this mission — the mandatory-artefact line, the O7 status row,
the M2 exit criterion and M3's build-project list — which is a second declared
deviation, since #68 does not list it and it is the document defining this
mission's scope.

**The cross-repository consequence (O3)** — the Team Kitty SaaS repo's
`design-authority.json` lists `packages/html-js/src/index.ts` in `required_files`
and its resolver hard-fails when that path disappears, which this merge causes.
ADR-8 and the programme document both pre-ruled this hygiene rather than a blocker,
because that repo has no Actions workflows on `main`.

## Behaviour-neutrality evidence

- The moved source tree is byte-identical apart from line-1 comments.
- `npx nx run-many --target=build --projects=tokens,angular,styles` — all built;
  `npx nx show projects` → `["angular","styles","tokens","storybook"]`.
- `npm ci --ignore-scripts` clean from the edited lockfile.
- **Demo pages resolve in both modes** — every `file://` reference exists on disk,
  and `scripts/assemble-demo-dist.sh` resolves every deploy-mode reference,
  including the 30 font files `tokens.css` names through `url()`.
- **The `audit/` harness resolves** — all 27 paths against a real build.
- `npm run quality:all` exits 0. Reported because #68 names it, but it constrains
  little here: `quality:stylelint` covers CSS content that did not change, and the
  htmlhint globs did not cover `apps/demo` or `audit` until this mission widened
  them.
- **CI is the authority for the baselines and the gates**; the PR's checks are the
  live surface, and a SHA-pinned transcript in a committed document goes stale on
  the next push, so none is kept here.

### The visual baselines are not the proof they were taken for

`elements-first-programme.md` called the 7 visual baselines *"the
behaviour-neutrality proof"*. They are not, and this is the sharpest thing the
mission found.

**Storybook's HTML stories mount nothing.** `@storybook/angular` is the only
configured framework. It wraps every story in a host element named after the story
id — and for the HTML stories, whose `render` returns a raw string, that host is
created **empty**:

```
primitives-skstub-html--default   -> <primitives-skstub-html--default ng-version="21.2.22"></...>   0 children, 0 text
form-forminput-angular--form-input-error -> <form-forminput-angular--form-input-error ...><sk-form-field ...>  real markup
```

An earlier draft of this document said they "sit in `sb-preparing-story`
indefinitely". That mechanism was wrong; the host mounts, the component never
does. The consequence is the same and is what matters.

The proof is in the committed baselines themselves. The three HTML snapshots —
`sk-stub-html-default`, `sk-feature-card-html-default`,
`sk-ribbon-card-html-with-ribbon` — are **byte-identical**: 4254 bytes,
md5 `fb104b5fd49f…`, a blank 1280×720 frame. Three different components cannot
produce one identical image. They are the only baselines that touch
`@spec-kitty/styles`; the other four are Angular stories.

So those three pass unchanged whatever happens to this package — which is why they
passed a mission that moved every file in it. `visual.spec.ts` takes them after
only `waitForLoadState('domcontentloaded')`, with no selector wait, unlike the
Angular cases which wait on a real class and would have failed loudly.

**The axe gate is blind to it too.** `scripts/run-axe-storybook.js` treats a story
as rendered when the root has `childElementCount > 0 || textContent`. The empty host
element *is* a child, so every HTML story passes that check while displaying
nothing — the WCAG scan has been running against empty wrappers.

Not fixed here: ADR-13 and M3 (#69) move Storybook to the web-components renderer,
which is the fix. Tracked on **#88**. Until then the visual baselines are not
component coverage, and the binding evidence for this rename is the byte-identical
source tree plus the path-resolution checks above.
