---
work_package_id: WP02
title: The generator, the tagName filter, and a drift gate that refuses an empty set
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-009
- FR-010
- FR-011
- NFR-001
- NFR-002
planning_base_branch: mission/react-wrapper-generation
merge_target_branch: mission/react-wrapper-generation
branch_strategy: Planning artifacts for this mission were generated on mission/react-wrapper-generation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/react-wrapper-generation unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
phase: Phase 2 - Generator
history:
- timestamp: '2026-09-03T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/build-react-wrappers.mjs
create_intent:
- scripts/build-react-wrappers.mjs
- packages/react/package.json
- packages/react/project.json
- packages/react/tsconfig.json
- tests/node/react-wrappers.test.ts
execution_mode: code_change
owned_files:
- scripts/build-react-wrappers.mjs
- packages/react/package.json
- packages/react/project.json
- packages/react/tsconfig.json
- tests/node/react-wrappers.test.ts
- package.json
- package-lock.json
- .github/workflows/ci-quality.yml
- scripts/check-gate-wiring.mjs
tags: []
tracker_refs: []
---

# WP02 — Generate, commit, gate on drift

The post-tasks squad took this WP apart. Five of its findings are load-bearing and the WP is
rewritten around them.

## Subtasks

- **T004 — the generator.** `scripts/build-react-wrappers.mjs` wrapping
  `generateReactWrappers(manifest, { outdir, modulePath })`.

  **Pin `@wc-toolkit/react-wrappers@1.2.7` in the ROOT `devDependencies`.** The script is a root
  script; only a root pin makes its `import` a declared dependency. Putting it in
  `packages/react/package.json` and letting workspace hoisting resolve it reproduces exactly the
  transitive-accident shape the precedent warns about — and that precedent is **#71**
  (`require('playwright')` present only via `@playwright/test`), not #70, whose finding was
  about vite. The first draft of this WP cited the wrong issue.

  **Name the output directory in this WP, and assert it is tracked.** `.gitignore:5-6` is
  `dist/` + `packages/*/dist/`, and a bare `dist/` matches a directory of that name at *any*
  depth. A TypeScript package's natural `outdir` is `packages/react/dist/` — which would make
  the entire committed artifact invisible to git, `git diff` permanently green, and a fresh CI
  clone contain no wrappers at all. `build-elements-css.mjs`'s own docstring records the repo
  already paying this exact price. Assert the outdir is `git ls-files`-tracked.

- **T005 — the filter, and THREE independent counts, not two.**

  The first draft said: assert the emitted file set equals the manifest's `tagName`-bearing
  declarations. **A lens showed that is a tautology.** The generator filters on `decl.tagName`;
  the assertion reads `decl.tagName` from the same manifest. If the generator's *effective*
  filter is narrower — it honours `exclude`, and skips declarations it cannot type — both sides
  shrink together and the sets stay equal. `sk-stub` has 0 members; a generator that declines to
  emit an empty component, or a stray `exclude: ['SkStub']`, yields four files, expected four,
  green, and `<SkStub>` does not exist.

  This is not hypothetical here. `build-elements-css.mjs:57-62` records the identical defect:
  `expected` was built from the same wrong mapping the generator used, so the orphan sweep could
  not catch it either. Fixed in `f2c4508`.

  **So: three counts that must all agree** (SC-312) —
  `packages/elements/src/*/sk-*.ts` → manifest `tagName`s → emitted files.
  `tests/node/config-contract.test.ts:236-252` already ties the first two, so this WP adds one
  link to a chain that is otherwise closed. Account explicitly for `index.d.ts`, `index.js` and
  `react-utils.js`, which are always emitted and carry no `tagName`.

  Why filter at all, stated correctly: `out/FormControlBase.d.ts` is emitted for an abstract
  class, and `FormControlBase` is **not exported** from `src/index.ts` — so the generated import
  is a type error, and `FormControlBase.js:25` emits `React.createElement("undefined", …)`. The
  first draft called it "exported but not registrable"; it is worse than that, and a filter
  justified on a disprovable premise gets argued about instead of kept.

- **T006 — `--check`, and a floor that is a ratchet, not `> 0`.**

  Three separate holes the first draft did not name:

  1. **The floor.** "A generator emitting nothing must fail" is satisfied by **one** file.
     Combined with the tautology above: emit `SkCard.d.ts` only, `1 > 0`, green, four of five
     elements missing. The floor must be a **ratchet on a committed number**, per
     `check-elements-entries.mjs:107-109`. And note the sibling gate this WP was told to copy
     **fails this today** — `build-elements-css.mjs --check` prints `✅ … (0 component(s))` and
     exits 0. Filed as **#123**. Copy `build-element-markup.mjs:29-31`, not the CSS gate.
  2. **Orphans.** Verified in a throwaway repo: for a file the generator no longer emits but
     that stays committed, `git diff --exit-code` is **green** (nothing changed) and a
     per-emitted-file compare is **green** (never iterated). Only an `expected`-set sweep
     catches it — `build-elements-css.mjs:167-191` has one, `build-element-markup.mjs` does
     not. **Neither cited template is complete; this gate needs the union.** A lens also
     confirmed the generator does not clean its outdir: a planted `STALE.d.ts` survived
     regeneration.
  3. **Tree walk.** `statSync(f).isFile()` — `check-part-ratchet.mjs:76-78` exists because
     `__screenshots__/` matched `*.test.ts`. Sort by codepoint, not `localeCompare`; that is
     latent for PascalCase filenames but it is the mechanism that would make FR-003 flaky off
     ubuntu, and FR-003 is this mission's hardest criterion.

- **T007 (NEW) — a `--selftest` probe table.** Every gate landed since `f8af689` ships one:
  `check-adopted-css-boundaries.mjs` 20+ probes, `check-elements-entries.mjs` 14 probes each
  labelled with the version it defeated. The first draft asked for a single `REQUIRED_LINT`
  entry and no probes, which is half the lesson from the episode it correctly cites. Probes
  must include: the empty set, the one-file set, the orphan, an outdir under `dist/`, and a
  declaration with `tagName` that the generator skipped.

  Add **two** `REQUIRED_LINT` entries (gate + `--selftest`) in the same commit as the gate.
  Note for the record: `REQUIRED_LINT` today protects 4 of 10 enforced steps and does not
  require its own — filed as **#124**, not this mission's to fix, but it means this gate lands
  better-protected than the two it is modelled on.

- **T008 (NEW) — decide the SSR/RSC boundary (FR-009).** Issue #75 lists it in scope; the spec
  said "a decision, not a default" and then made none. Emit `'use client'`, or record a reasoned
  refusal, and assert whichever by grep over the output. The named consumer is a 22-component
  SaaS design surface; if it ever renders server-side this gets discovered in production.

- **T009 (NEW) — make the package typecheckable (FR-010).** `scripts/typecheck-all.mjs:25`
  derives its projects from `nx show projects --with-target typecheck`, which returns exactly
  `["elements-behaviour-fixture","elements"]`. Without `packages/react/project.json` carrying a
  `typecheck` target, the generated `.d.ts` is compiled by nothing and the mission's entire
  stated value — typed JSX, typed refs — ships unverified. Assert the project list grows 2 → 3.

- **T010 (NEW) — assert the prop set positively (FR-011).** T005 compares the **file** set.
  Nothing yet compares the **prop** set, so a generator emitting empty props objects passes
  every criterion in this mission: `sk-form-input` could drop 10 attributes to 2, green. Per
  element, emitted props == public non-inherited manifest fields, as sets, non-empty floor for
  every element that has one, `sk-stub` the named exemption.

## Definition of Done

- `node scripts/build-react-wrappers.mjs --check` green; drift, orphan, hand-edit and empty-set
  all demonstrated red.
- `--selftest` table committed, with a shrink-only floor.
- Three counts agree (SC-312); prop sets agree per element (SC-311).
- Outdir named, `git ls-files`-tracked, and not under any `dist/`.
- `typecheck-all.mjs` picks up 3 projects (SC-310).
- SSR/RSC decision greppable in the output (SC-309).
- Two `REQUIRED_LINT` entries, same commit.
- `@wc-toolkit/react-wrappers@1.2.7` in **root** `devDependencies`.
- Re-run the spike before trusting `plan.md`'s S1–S6 table: the package is in neither
  `node_modules/` nor `package-lock.json` in this checkout, so those figures are not currently
  reproducible from the lane.
