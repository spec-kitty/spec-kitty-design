---
work_package_id: WP01
title: 'CLI-auth proof hardening: breakpoint alignment + derived composition inventory'
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- NFR-001
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
planning_base_branch: mission/cli-auth-proof-hardening
merge_target_branch: mission/cli-auth-proof-hardening
branch_strategy: Planning artifacts for this mission were generated on mission/cli-auth-proof-hardening. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/cli-auth-proof-hardening unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
history: []
agent_profile: node-norris
authoritative_surface: apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- packages/elements/src/patterns/cli-auth.stories.ts
- apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts
- scripts/check-pattern-composition.mjs
role: implementer
tags: []
tracker_refs:
- '417'
- '418'
---

# WP01 — CLI-auth proof hardening: breakpoint alignment + derived composition inventory

## Objective

Close two deferred findings from the #329/#409 CLI-auth pattern proof, both filed by
`architect-alphonso` at the #409 pre-merge gate and both explicitly named as about to be copied by
four in-flight sibling pattern missions if left unfixed here:

1. **#417** — `cli-auth.stories.ts`'s story-local `.sk-cli-auth-pattern` frame narrows at
   `max-width: 390px`; the `sk-boundary-page` frame it composes for stories 3-4 narrows at
   `max-width: 480px`. Align to `480px` with a comment recording the deliberate mirror. Sweep the
   five other named pattern families for the same defect.
2. **#418** — the composition proof's DOM-inventory assertion in `sk-cli-auth-pattern.spec.ts` is
   a five-name regex denylist that cannot fail for an unlisted name. Replace it with a derived
   enumeration: every `sk`-prefixed tag/class the rendered markup names must resolve to a known
   custom element or an owned styles/tokens class, computed from real source (the generated
   Custom Elements Manifest, `ownedClasses()`), not hand-typed.

## Context

Read `plan.md` in full before starting. Key facts already verified during planning (do not
re-derive from scratch, but DO re-verify with a real command before relying on any of them):

- Only `cli-auth.stories.ts` composes `sk-boundary-page` among the six named pattern families;
  the other five either declare no local width `@media` at all, or declare `720px`/`@container
  720px`, which already agrees with the `720px` breakpoint baked into the public components they
  compose (`sk-page-header.css`, `sk-context-sidebar.css`, `sk-personal-rail.css`).
- `packages/elements/custom-elements.json` is generated (`cem analyze` via `nx run
  elements:analyze`) and CI-gated for drift (`.github/workflows/ci-quality.yml`'s "[ENFORCED]
  Custom Elements Manifest is current") and content vacuity (`scripts/check-manifest-content.mjs`)
  — confirmed clean against this checkout by running `npx nx run elements:analyze --skip-nx-cache
  && git diff --exit-code -- packages/elements/custom-elements.json` for real.
- `scripts/check-pattern-composition.mjs` has NO run-as-CLI guard: importing it for its exported
  helpers (`ownedClasses()` etc.) executes its full CLI body as an import side effect and can call
  `process.exit()` — MEASURED by importing it from Node directly and watching the CLI banner print
  and, from an empty cwd, watching `process.exit(1)` fire. This must be fixed (matching the
  existing `check-adr-index.mjs`/`check-release-graph.mjs` guard idiom, which is already in this
  repo) before this file is safely importable from a Playwright spec.
- `.sk-light` (the light-mode toggle class every pattern story's `light` parameter renders) is
  owned by `packages/tokens/src/tokens.css`, NOT `packages/styles`, so `ownedClasses()` alone does
  not cover it — a new `tokensOwnedClasses()` is needed or the derived check false-positives on
  every pattern family's light-mode story.
- The bare `sk-boundary-page` block class carries no CSS rule of its own (documented in
  `sk-boundary-page.css` itself as a "component-host identification hook", a convention shared
  with `sk-context-nav`/`sk-data-table`/`sk-workflow-board`), so neither `ownedClasses()` nor
  `tokensOwnedClasses()` contains it directly — a BEM-block-root derivation
  (`sk-boundary-page` from the owned `sk-boundary-page__stage`) is needed, NOT a hand-added fifth
  name (that would just relocate the denylist this WP exists to remove).

### Subtask T001: Align the narrow-width breakpoint (#417)

**File**: `packages/elements/src/patterns/cli-auth.stories.ts`, the `@media (max-width: 390px)`
block inside `patternStyles` (currently around line 106).

**Steps**:
1. Change `@media (max-width: 390px)` to `@media (max-width: 480px)`.
2. Add a one-line comment immediately above (or inline) recording that this deliberately mirrors
   `sk-boundary-page.css`'s own `480px` narrow-width step (`packages/styles/src/boundary-page/
   sk-boundary-page.css`, its `@media (max-width: 480px)` block), so a future respacing of that
   file does not silently reopen the divergence #417 found.
3. Do NOT touch the rule body (`padding: var(--sk-space-4)`) or any other geometry constant —
   only the breakpoint number changes.

**Expected side effect**: this shifts `cli-auth`'s rendered layout in the 391-480px band (where it
previously used the desktop padding, it will now use the narrow padding, matching
`sk-boundary-page`'s own behavior at that width). Per C-002, do not run `--update-snapshots`
locally — name the affected story IDs (all `patterns-cli-auth--*` stories at narrow viewports,
most directly `code-entry-default`/`code-entry-invalid`/`authorization-decision`, the two stories
whose frame this rule targets) in the mission report so CI can harvest new baselines if
`visual.spec.ts` samples this width. (`visual.spec.ts` itself is out of scope — C-001; note the
expectation, do not edit that file.)

### Subtask T002: Sweep the five other named pattern families (#417)

**Files (read-only)**: `packages/elements/src/patterns/team-overview.stories.ts`,
`mission-kanban.stories.ts` (+ `mission-kanban-ten-lane.stories.ts`), `repository-dossier.stories.ts`,
`work-explorer.stories.ts`, `work-package-views.stories.ts`, `mission-reading.stories.ts`.

**Steps**:
1. For each family, grep for `@media`/`@container` rules with a `max-width`/`min-width` value.
2. For each hit, identify which public component (if any) the family composes that itself owns a
   breakpoint at a DIFFERENT value, the same relationship `cli-auth`↔`sk-boundary-page` had.
3. Record the verdict for each of the six families (cli-auth included) in the mission report:
   which compose nothing with a conflicting breakpoint (no local `@media` at all — mission-kanban,
   work-explorer, work-package-views, mission-reading), and which declare a breakpoint that
   already agrees with what they compose (team-overview at `720px` = `sk-page-header.css`'s
   `720px`; repository-dossier's `@container (max-width: 720px)` = `sk-context-sidebar.css`'s /
   `sk-personal-rail.css`'s `720px`).
4. This round's operator directive is "no more deferrals" — if this sweep finds a genuine
   disagreement in any of the five, fix it in this same WP (same shape as T001: align the
   story-local value to the composed component's real value, with a mirroring comment). If none is
   found (expected, per the planning-time read above — RE-VERIFY, do not merely cite the plan),
   no code change for T002; the mission report states this explicitly with the evidence.

### Subtask T003: Make `check-pattern-composition.mjs` safely importable and export #418's derived primitives

**File**: `scripts/check-pattern-composition.mjs`.

**Steps**:
1. Add `resolve` to the existing `node:path` import.
2. Wrap the file's CLI tail (`if (process.argv.includes('--selftest')) selftest(); const {
   violations, notes } = run('.'); ...`) in the house run-as-CLI guard: `if (process.argv[1] &&
   resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { ... }` — matching
   `check-adr-index.mjs`/`check-release-graph.mjs`'s existing idiom exactly.
3. Prove the guard both ways, for real: `node scripts/check-pattern-composition.mjs` (expect the
   normal CLI pass/output, exit 0) and `node scripts/check-pattern-composition.mjs --selftest`
   (expect the 47-probe selftest to still pass) still behave identically to before the change; AND
   `node -e "import('./scripts/check-pattern-composition.mjs').then(m =>
   console.log(typeof m.ownedClasses))"` no longer prints the CLI banner and does not exit
   early.
4. Add these new exported helpers (see `plan.md` / the file's own new doc comments for the exact
   contract and the false-positive cases each one exists to cover — `.sk-light` from
   `packages/tokens`, the rule-less `sk-boundary-page` block-hook class):
   - `tokensOwnedClasses(root)` — classes `packages/tokens/src/tokens.css` declares rules for.
   - `localClassesIn(rendition)` — classes declared inside a rendition's own `<style>` block(s).
   - `knownElementTags(root)` — tag names from `packages/elements/custom-elements.json`.
   - `bemBlockRoots(classNames)` — the BEM block root of every `__`/`--` suffixed name in a set.
   - `skPrimitivesIn(rendition)` — every `sk`-prefixed tag/class a rendition's markup names,
     bounded to each element's own opening tag.
5. Do not modify `ownedClasses()`, `run()`, `selftest()`, or any existing exported function's
   behavior — this subtask is purely additive plus the CLI guard.

### Subtask T004: Replace the denylist with the derived enumeration (#418)

**File**: `apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts`, the "source is Storybook-only
composition..." test (currently ~line 133-138).

**Steps**:
1. Import the five new helpers from `../../../../scripts/check-pattern-composition.mjs` (relative
   path from `apps/storybook/src/tests/` to the repo-root `scripts/` directory).
2. Remove:
   ```js
   expect(code).not.toMatch(
     /<\s*(?:auth-card|scope-chip|form-action-row|sk-terminal-frame|sk-boundary-stage)(?:\s|>)/,
   );
   ```
3. In its place, compute the derived acceptance sets and assert membership:
   ```js
   const known = knownElementTags();
   const owned = ownedClasses();
   const tokensOwned = tokensOwnedClasses();
   const local = localClassesIn(code);
   const roots = bemBlockRoots([...owned.keys(), ...tokensOwned]);
   const acceptedClasses = new Set([...owned.keys(), ...tokensOwned, ...local, ...roots]);
   const { tags, classes } = skPrimitivesIn(code);

   const unknownTags = [...tags].filter((tag) => !known.has(tag));
   const unknownClasses = [...classes].filter((cls) => !acceptedClasses.has(cls));
   expect(unknownTags, `unregistered custom element tag(s): ${unknownTags.join(", ")}`).toEqual([]);
   expect(
     unknownClasses,
     `sk-prefixed class(es) with no known owner: ${unknownClasses.join(", ")}`,
   ).toEqual([]);
   ```
4. Keep the existing `expect(code).not.toMatch(/customElements\.define\s*\(/);` line — it checks a
   different failure mode (this file DEFINING a new element) that the derived tag check does not
   cover.
5. Add a floor assertion near the top of the test for FR-004 (the manifest must actually describe
   something, visibly, in THIS file — not only relying on the CI gate elsewhere):
   `expect(known.size).toBeGreaterThan(10);` with a short comment citing
   `check-manifest-content.mjs` as the CI-side floor this mirrors locally.

### Subtask T005: Execute the red-first proof (#418, FR-006)

**Steps** — all executed for real, not reasoned about; record exact commands and output in the
mission report:
1. Build Storybook once for this WP's Playwright runs (`npx nx run storybook:storybook:build`),
   on a non-default `STORYBOOK_PORT` to avoid the shared-6006 hazard, and confirm nothing is left
   listening afterward (`ss -ltnp | grep <port>`).
2. Run the full modified spec green: `STORYBOOK_PORT=<port> npx playwright test
   apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts --project=chromium`. Record the real
   result.
3. Temporarily plant a fabricated element+class into `cli-auth.stories.ts`'s real rendered markup
   (e.g. `<sk-auth-panel class="sk-consent-row">planted</sk-auth-panel>` inside Story 2's
   `<sk-card>`), re-run the same spec (or `--grep` the one test), and confirm it goes RED and
   names `sk-auth-panel`/`sk-consent-row` specifically.
4. Revert the plant (`git checkout -- packages/elements/src/patterns/cli-auth.stories.ts`), re-run
   the spec, confirm green again.
5. Record all three outcomes (green baseline, red plant, green revert) verbatim in the mission
   report — this is the "confirm the new derived check catches it by name" proof the mission brief
   requires as executed, not reasoned about.

## Definition of Done

- [ ] T001-T005 complete, each verified by a real executed command (not reasoning).
- [ ] `npm run quality:lint` real, green.
- [ ] `node scripts/check-pattern-composition.mjs --selftest` real, green (47/47 probes).
- [ ] `sk-cli-auth-pattern.spec.ts` real, green against a freshly built Storybook.
- [ ] Red-first plant/revert proof executed and recorded.
- [ ] Family sweep (T002) verdict recorded for all six families.
- [ ] No edits to `apps/storybook/src/tests/visual.spec.ts` (C-001).
- [ ] No `--update-snapshots` run locally (C-002); affected baselines named instead.
- [ ] No hand-edited generated artifact (C-003).
- [ ] `git diff` limited to `owned_files` above.
