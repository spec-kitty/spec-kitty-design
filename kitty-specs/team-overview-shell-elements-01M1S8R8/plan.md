# Implementation Plan: Team overview shell elements

**Mission:** `team-overview-shell-elements-01M1S8R8` · Issue #145 · Epic #144
**Branch:** `mission/team-overview-shell-elements` from `train/elements-first` at `37662678938c0e76455760e435c5ea626aac8056`
**Date:** 2026-09-05
**Spec:** [`spec.md`](./spec.md) in this same frozen planning tree. The reachable immutable planning
identity is `lanes.json.planning_commit_sha`, captured by the final canonical task-finalization run.

## Summary

Add four controlled, slot-driven Lit elements—`sk-app-shell`, `sk-personal-rail`,
`sk-context-sidebar`, and `sk-page-header`—and one additive `icon` size to the existing
`sk-button`. CSS owns the approved 56px + 240px desktop geometry, responsive reflow, theme-aware
surfaces, truncation constraints and focus visibility. Team Kitty continues to own route/team/user
state, visibility, destinations, copy, timers, actions and icons.

The four new elements have no honest data-independent static form: their entire useful payload is
consumer-supplied semantic slotted content. Their only authored markup is Lit `render()`; do not
add `.markup.ts`, generated `.html`, or styles-layer `index.ts` files for them. Button keeps its
existing canonical markup module and generator paths. All elements adopt generated constructed
stylesheets and expose explicit `::part()` surfaces. Generated manifest, React, Vue and size output
is integrated once in a serial final WP.

No dependency or lockfile change is needed. Two semantic layout tokens express the fixed shell
columns; the 40px icon target reuses `--sk-space-8`. New and existing tokens are the only design
values used by component CSS.

## Technical Context

**Language/Version**: TypeScript 5.x, Lit 3.3.3, standards-based custom elements, CSS
**Primary Dependencies**: Existing Lit, Nx, CEM, Vitest, Playwright, axe, React-wrapper and Vue-type toolchain only
**Storage**: N/A; no store, persistence, fetch, router, timer or clock
**Testing**: Vitest browser/Node projects, mutation harness, Playwright browser matrix, Storybook build, axe and CI-authoritative visual baselines
**Target Platform**: ESM/IIFE modern browsers, Storybook, generated React wrapper and generated Vue declarations
**Project Type**: Nx elements-first web design-system monorepo
**Performance Goals**: Storybook exact-head CI build under 180 seconds; generated size report current after real builds
**Constraints**: token-only styling, one authored CSS/markup source, no Team Kitty state/actions/icons, one serial dependency chain
**Scale/Scope**: four slot-only shell elements, one existing-button size/accessibility extension, fixtures at 390/414/1280/1440px

Canonical CSS is one authored `packages/styles/src/<component>/sk-<component>.css` per component.
Canonical markup for the new shells is Lit `render()` only; button retains its existing
`sk-button.markup.ts` plus generated static outputs. The review topology is four WPs in one strict
dependency chain. Spec Kitty may materialize one lane per WP; dependencies prevent parallel claims.
A Tier-B three-lens PASS gates WP01.

## Charter Check

| Obligation | Plan response |
|---|---|
| Token-only CSS | Add only the two fixed shell-width tokens, in both theme blocks, and reuse existing surface/foreground/border/spacing/type/focus tokens everywhere else. Regenerate the catalogue. |
| Elements-first boundary | Each tag registers through `define()`, has an open shadow root, imports its generated stylesheet, appears in both runtime entries and never imports application code. |
| Accessible semantics | Real `nav`, `aside`, `header`, main-region structure and consumer headings/controls; labels forward to the owning landmark/control; axe zero and computed accessible-name assertions. |
| Required behaviours | Every new presentational element owns SC-013 and SC-014. `sk-personal-rail`, `sk-context-sidebar`, and the extended `sk-button` also own SC-010 for their new reflected `label` property. Slots and native event pass-through get direct regression tests but no invented/mislabelled ADR id. |
| Red-first evidence | Each new element receives one non-inert SC-013 mutation and two SC-014 mutations (sheet length and identity); the three reflected labels each receive one uniquely attributable SC-010 mutation. This is 15 new arms. Button name/focus/size probes remain direct red-first evidence outside the ADR registry. |
| Story completeness | Default, long/edge, responsive where applicable and `LightMode` stories are ratcheted. Button gains named icon button/link/focus examples. |
| Visual evidence | Shell desktop dark/light, 390px reflow and icon focus states are captured by CI-authoritative Chromium baselines and reviewed against the approved export. |
| Performance | Final exact-head CI Storybook build must complete in under the charter's 180-second limit; `SIZES.md` is regenerated after real builds. |
| Canonical generation | CSS modules, token catalogue, CEM, React, Vue and sizes are generated; generated files are never hand-edited. Only stable outputs are byte-determinism checks because the token catalogue embeds its generation timestamp. |
| Supply chain | No new dependency, lifecycle script or registry access. If implementation discovers one, stop. |
| Review, merge and resolution | Post-tasks and pre-merge squads are exact-SHA gates. One maintainer approval is required. Only `train/elements-first` may receive this mission. WP workers close no issue; after the authorized train merge is verified, mission/orchestrator wrap-up closes exactly #145 and #153 with merged PR/commit evidence. |

No charter exception is requested.

## Architecture and Public API

### `sk-app-shell`

The host is a block formatting context. Its shadow tree is structural only:

```html
<div part="shell" class="sk-app-shell">
  <div part="personal" class="sk-app-shell__personal"><slot name="personal-rail"></slot></div>
  <div part="context" class="sk-app-shell__context"><slot name="context-sidebar"></slot></div>
  <div part="content" class="sk-app-shell__content">
    <div part="header" class="sk-app-shell__header"><slot name="page-header"></slot></div>
    <main part="main" class="sk-app-shell__main"><slot></slot></main>
  </div>
</div>
```

At desktop widths, the grid columns are the semantic tokens
`--sk-layout-personal-rail-width` (56px) and `--sk-layout-context-sidebar-width` (240px), followed
by `minmax(0, 1fr)`. The content, header and main boxes all set the min-width equivalent needed for
wide descendants to shrink or manage their own overflow. At the established narrow structural
breakpoint (720px), areas become one column in DOM order. No region is hidden and no drawer state
is created. `hidden` on a slotted host remains consumer-controlled and is respected naturally.

No properties, methods, event listeners or custom events are added.

### `sk-personal-rail`

The element renders one labelled `<nav>` with four named slots in stable order. `primary` occupies
the top region. `utilities`, a visual divider, `account`, and `logout` occupy the bottom group,
with account above logout. The public `label` string is reflected and names the internal `<nav>`;
the render-time fallback is exactly `Personal navigation` when the supplied value is absent/blank.
The component never scans slotted content, so it neither creates identity nor tries to detect a
consumer's duplicate.

At desktop width the rail fills the 56px shell column and lays groups vertically. At narrow width
it becomes a width-safe horizontal/flex-wrapping region while preserving DOM/tab order. Slotted
controls keep their own semantics and events; no listener is attached by the rail.

Public parts: `rail`, `primary`, `bottom`, `utilities`, `divider`, `account`, `logout`.

### `sk-context-sidebar`

The element renders a labelled `<aside>` with `header`, default, and `footer` slots. The reflected
`label` string names the `<aside>`; the render-time fallback is exactly `Context` when absent/blank.
The component does not wrap the default slot in a `<nav>` because it accepts generic selected
context content as well as navigation, and a false navigation landmark is worse than leaving the
consumer's native `<nav>` intact.

The content wrapper and direct slotted nodes receive `min-width: 0`/max-width constraints. Direct
textual links/buttons may use ellipsis, but the source text/accessible name is never rewritten,
removed or replaced by a tooltip-only value. The 240px column becomes full-width in narrow shell
flow. No selection or switching behavior is implemented.

Public parts: `sidebar`, `header`, `content`, `footer`.

### `sk-page-header`

The element renders a `<header>` split into a text group (`eyebrow`, `title`, `supporting`) and a
metadata group (`sync`, `actions`). The consumer supplies the actual heading element, so the shell
never guesses an `h1`/`h2` level. It renders no fallback title or freshness text. At narrow widths
the metadata group moves below the text group in DOM order and actions remain reachable.

There are no properties, methods, event handlers, timers or custom events. Public parts are
`header`, `text`, `eyebrow`, `title`, `supporting`, `meta`, `sync`, `actions`.

### Existing `sk-button` additive extension

The existing `BUTTON_SIZES` map gains `icon: 'sk-button--icon'`; do not derive `BUTTON_AXES` from
that map and do not add an `Icon` static axis/export automatically. An icon glyph is consumer data,
so a generated size-only `Label` form would not be an honest icon fixture and repeats the tone-less
static-form defect #79 documents.

The element's public size union becomes `'sm' | 'icon' | undefined`. Add a documented reflected
`label` string property. Use trimming only to decide whether a value is blank; forward every valid
supplied string unchanged to `aria-label` on both the real `<button>` and real `<a>`. When
`size="icon"` lacks a non-empty label, the forgiving render path warns once per invalid value
transition and still renders the control so content is not swallowed. The strict
`buttonStaticHtml({ size: 'icon' })` authoring path throws unless its options contain a non-empty
`label`; valid static icon authoring escapes but otherwise preserves the supplied `aria-label`.
Other sizes do not require `label`, preserving #79 compatibility.

Set `static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true }` so
`host.focus()` reaches the real control without adding a host tab stop. This does not absorb #154:
the generated wrapper's universal `tabIndex` policy remains out of scope. The `icon` modifier makes
the real control exactly `var(--sk-space-8)` square, removes inline padding, and keeps the existing
tone axis. Add an explicit token-driven `:focus-visible` outline that applies to every button size.

Tests use `toHaveAccessibleName()` on each inner branch, not only an `aria-label` string assertion.
They also prove focus delegation, exact 40px geometry, missing/blank diagnosis, static strictness,
size/tone independence and all existing #79 behavior.

## Styling and Token Model

Add these two tokens to both token theme blocks and regenerate the catalogue:

| Token | Value | Purpose |
|---|---:|---|
| `--sk-layout-personal-rail-width` | `3.5rem` (56px at the root baseline) | Approved fixed personal navigation column |
| `--sk-layout-context-sidebar-width` | `15rem` (240px at the root baseline) | Approved fixed context column |

The width tokens are layout semantics, not component-named color aliases, and their values do not
change by theme. Icon size reuses `--sk-space-8`. All surface/ink pairings use existing semantic
surface and foreground tokens. Component CSS contains no ancestor theme selector; `.sk-light`
changes inherited tokens outside the shadow root.

The only permitted non-token CSS literals are structural values such as `0`, `1fr`, percentages,
`auto`, `none`, and the established documented 720px media boundary. No new color, spacing, type,
radius, shadow, motion or z-index literal appears in component CSS.

## Slots, Parts, and Accessibility Projection

| Element | Slots | Landmark | Public parts |
|---|---|---|---|
| `sk-app-shell` | `personal-rail`, `context-sidebar`, `page-header`, default | internal `<main>` | shell, personal, context, content, header, main |
| `sk-personal-rail` | `primary`, `utilities`, `account`, `logout` | labelled `<nav>` | rail, primary, bottom, utilities, divider, account, logout |
| `sk-context-sidebar` | `header`, default, `footer` | labelled `<aside>` | sidebar, header, content, footer |
| `sk-page-header` | `eyebrow`, `title`, `supporting`, `sync`, `actions` | `<header>`; consumer owns heading | header, text, eyebrow, title, supporting, meta, sync, actions |

Empty slots have no invented fallback content. Slot-assignment tests assert each named/default slot,
empty output, and preserved DOM order. They are direct regression tests, not SC-011 subjects:
ADR-11 SC-011's second clause is fallback-content behavior, and these elements deliberately have
none. Native descendant clicks are asserted once at the document boundary without any shell
redispatch, but no event behavior ID is claimed because the shell owns no event contract.

Each new fixture registers for:

- SC-013: all declared parts exist and are targetable from outside. One unique non-root part is
  removed by the mutation so the test cannot fail merely because its mount helper lost the root.
- SC-014 length: replace `static styles = [sheet]` with `[]`.
- SC-014 identity: replace it with `[new CSSStyleSheet()]` while preserving length one.

`sk-personal-rail`, `sk-context-sidebar`, and `sk-button` also register for SC-010. Each fixture
creates its tag before definition, assigns a deliberate whitespace-bearing `label` property, then
loads a late subclass and proves the property survives, the reflected attribute preserves the exact
string, and the real landmark/control receives it unchanged. Each SC-010 mutation changes only that
element's `label: { type: String, reflect: true }` declaration to `reflect: false`, so the exact
reflection assertion kills the arm without borrowing a failure from another behavior.

This is exactly 15 new mutation arms across 11 `(id, subject)` pairs: the existing 12 SC-013/SC-014
arms plus three SC-010 arms. Registry guard SC-015 remains owned by the shared `define()` fixture;
the four new tags do not duplicate that proof. The button's accessible name, focus and icon geometry
are additionally proven by direct intentional source reversals with the exact named failing
assertion recorded in the fixture/mission evidence.

## File and Write Scope

### Authored component sources

```text
packages/tokens/src/tokens.css
packages/styles/src/app-shell/sk-app-shell.css
packages/styles/src/personal-rail/sk-personal-rail.css
packages/styles/src/context-sidebar/sk-context-sidebar.css
packages/styles/src/page-header/sk-page-header.css
packages/elements/src/app-shell/sk-app-shell.ts
packages/elements/src/app-shell/sk-app-shell.stories.ts
packages/elements/src/personal-rail/sk-personal-rail.ts
packages/elements/src/personal-rail/sk-personal-rail.stories.ts
packages/elements/src/context-sidebar/sk-context-sidebar.ts
packages/elements/src/context-sidebar/sk-context-sidebar.stories.ts
packages/elements/src/page-header/sk-page-header.ts
packages/elements/src/page-header/sk-page-header.stories.ts
packages/elements/src/button/sk-button.ts
packages/elements/src/button/sk-button.markup.ts
packages/elements/src/button/sk-button.stories.ts
packages/styles/src/button/sk-button.css
fixtures/elements-behaviour/src/sk-app-shell.test.ts
fixtures/elements-behaviour/src/sk-personal-rail.test.ts
fixtures/elements-behaviour/src/sk-context-sidebar.test.ts
fixtures/elements-behaviour/src/sk-page-header.test.ts
fixtures/elements-behaviour/src/sk-button.test.ts
apps/storybook/src/tests/sk-team-overview-shell-layout.spec.ts
apps/storybook/src/tests/visual.spec.ts
docs/design-system/using-components.md
docs/design-system/changelog.md
```

### Authored shared entries and ratchets — final integration owner only

```text
packages/elements/src/index.ts
packages/elements/src/elements.ts
packages/styles/package.json
expected-docs.json
expected-parts.json
expected-stories.json
behaviours.json
mutations.json
```

`packages/styles/src/index.ts` is not changed: the four new slot-only elements have no generated
static HTML barrel. `packages/styles/package.json` gains the four CSS subpath exports.

Expected ratchet movement before implementation review:

- `expected-docs.json`: four new elements (0/1/1/0 public attributes) plus `sk-button` 4→5;
  total 65→68.
- `expected-parts.json`: 6 + 7 + 4 + 8 = 25 new parts; total 44→69.
- `behaviours.json`: four new subjects on SC-013 and SC-014 plus SC-010 subjects for
  `sk-personal-rail`, `sk-context-sidebar`, and `sk-button`.
- `mutations.json`: three SC-013/SC-014 arms per new element plus three SC-010 label arms, 15 total.
- `expected-stories.json`: exact new story ids and added button icon story ids determined from the
  built Storybook index; no undocumented shrink.

### Generated and committed artifacts

```text
packages/tokens/dist/token-catalogue.json
packages/elements/src/{app-shell,personal-rail,context-sidebar,page-header}/sk-*.css.js
packages/elements/src/{app-shell,personal-rail,context-sidebar,page-header}/sk-*.css.d.ts
packages/elements/src/button/sk-button.css.js
packages/elements/src/button/sk-button.css.d.ts
packages/elements/custom-elements.json
packages/react/src/SkAppShell.{js,d.ts}
packages/react/src/SkPersonalRail.{js,d.ts}
packages/react/src/SkContextSidebar.{js,d.ts}
packages/react/src/SkPageHeader.{js,d.ts}
packages/react/src/SkButton.{js,d.ts}
packages/react/src/index.{js,d.ts}
packages/react/.wrapper-floor
packages/elements/vue.d.ts
packages/elements/SIZES.md
```

Only generators write these files. New shell CSS modules are path-local and may be generated with
their component WP; the final integration WP owns the aggregate committed state and all shared
generated output. `token-catalogue.json` is generated and committed once for each token-source
state because its ISO timestamp makes a no-change rerun byte-different; it is not a determinism
probe.

### Explicitly excluded

- `packages/styles/src/index.ts` and new shell `.markup.ts`/`.html`/`index.ts` files.
- Sibling TKO2–TKO5 authored directories, Team Kitty application code, routers/stores/icons.
- Wrapper generator/runtime changes, `tabIndex` policy, dependency files, release/tag/deploy files.
- Issue closure by a WP, closure before the authorized train merge is verified, or wrap-up changing
  #112, #125, #144, #146, #147, #148, #150, #154, or another unrelated issue state; separately
  completed states are recorded and preserved as external changes.
- Any merge/push to `main`, publication or deployment.

## Story and Browser Evidence

Each new element has `Default` and `LightMode`; edge stories are:

- `sk-app-shell`: `DesktopComposition`, `Narrow`, `EmptyRegions`, `LightMode`.
- `sk-personal-rail`: `Default`, `LongLabels`, `EmptyGroups`, `LightMode`.
- `sk-context-sidebar`: `Default`, `LongLabels`, `Empty`, `LightMode`.
- `sk-page-header`: `Default`, `LongTitle`, `WithoutMetadata`, `LightMode`.
- existing `sk-button`: add `Icon`, `IconLink`, `IconFocus`, and include icon controls in
  `LightMode` without removing any #79 story.

The shell composition uses only generic fixture names/content and the five mission-owned surfaces;
it is not epic #144's final Team overview pattern and does not absorb #150. The final full-page
composition remains #150 after #145–#149 land.

`sk-team-overview-shell-layout.spec.ts` exercises the actual Storybook composition at 390, 414,
1280 and 1440 in the normal Playwright browser matrix. It measures shell columns, overflow, region
order, landmarks, long-label source/accessibility preservation, native event count, unchanged sync
copy under a clock spy and focus/tab reachability. It does not inspect private BEM class names.

`visual.spec.ts` adds CI-authoritative Chromium clips for:

1. 1440px desktop shell, dark;
2. 1440px desktop shell, light;
3. 390px narrow shell;
4. icon button focus-visible, dark;
5. icon button focus-visible, light.

WP04 authors these screenshot cases and executes each locally only far enough to prove that its
locator reaches a visible, non-empty target and that Playwright emits a diagnostic actual. WP04
records the expected missing-baseline result, never stages a locally produced PNG, and does not
claim visual approval. CI-authoritative baseline retrieval, comparison, commit, and passing rerun
belong wholly to post-consolidation mission wrap-up after the draft PR exists.

## Generation and Verification Order

Generate the timestamped token catalogue once after a token-source state changes, then run the
stable generators in this order after their authored inputs change:

```bash
npx nx run tokens:catalogue
node scripts/build-elements-css.mjs
node scripts/build-element-markup.mjs
npx nx run elements:analyze --skip-nx-cache
node scripts/build-react-wrappers.mjs
node scripts/build-vue-types.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
node scripts/measure-elements-sizes.mjs
```

`--skip-nx-cache` is mandatory for analyze; #79 proved a cached result gives false manifest-drift
evidence. Build precedes size measurement because the size script reads `dist/` and does not build.

After WP01 generates the catalogue, and again after any post-refresh catalogue generation, run this
exact read-only comparator. It reconstructs the generator's complete non-time payload from
`tokens.css`, validates that `generated_at` is a real timestamp, and ignores only that timestamp's
value. It writes no file:

```bash
node --input-type=module <<'NODE'
import { readFileSync } from 'node:fs';
const sourcePath = 'packages/tokens/src/tokens.css';
const cataloguePath = 'packages/tokens/dist/token-catalogue.json';
const source = readFileSync(sourcePath, 'utf8');
const categories = {};
for (const match of source.matchAll(/\s(--sk-([a-z][a-z0-9]*)(?:-[a-z0-9]+)+)\s*:/g)) {
  const [, token, category] = match;
  categories[category] ??= { prefix: `--sk-${category}-`, tokens: [] };
  if (!categories[category].tokens.includes(token)) categories[category].tokens.push(token);
}
const catalogue = JSON.parse(readFileSync(cataloguePath, 'utf8'));
const { generated_at: generatedAt, ...actual } = catalogue;
if (typeof generatedAt !== 'string' || Number.isNaN(Date.parse(generatedAt))) {
  throw new Error('token catalogue generated_at is absent or invalid');
}
const expected = { schema_version: '1.0.0', generated_from: sourcePath, categories };
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error('token catalogue differs from tokens.css outside generated_at');
}
NODE
```

Do not rerun `tokens:catalogue` merely as a check. After committing every generated output, run the
stable generation checks and exact local gates available on this host:

```bash
node scripts/build-elements-css.mjs --check
node scripts/build-element-markup.mjs --check
npx nx run elements:analyze --skip-nx-cache
git diff --exit-code -- packages/elements/custom-elements.json
node scripts/build-react-wrappers.mjs --check
node scripts/build-react-wrappers.mjs --selftest
node scripts/build-styles-only-markup.mjs --check
node scripts/build-vue-types.mjs --check
node scripts/check-vue-template-types.mjs
node scripts/check-vue-packed-types.mjs
node scripts/measure-elements-sizes.mjs --check
node scripts/check-manifest-content.mjs
node scripts/check-manifest-content.mjs --selftest
node scripts/check-no-css-in-source.mjs
node scripts/check-elements-entries.mjs --selftest
node scripts/check-elements-entries.mjs
node scripts/check-adopted-css-boundaries.mjs --selftest
node scripts/check-adopted-css-boundaries.mjs
node scripts/check-element-css-hygiene.mjs
node scripts/check-part-ratchet.mjs
node scripts/check-story-theme-wrapper.mjs --selftest
node scripts/check-story-theme-wrapper.mjs
node scripts/typecheck-all.mjs
npx nx affected --target=lint --base=<current-train-sha> --head=HEAD
npm run quality:stylelint
npm run quality:htmlhint
npm run quality:all
node scripts/check-gate-wiring.mjs
bash scripts/check-action-pins.sh
bash scripts/npm-audit-gate.sh
npm ci --dry-run --ignore-scripts
npm run security:lockfile-check
npm run test
node scripts/measure-suite-time.mjs
node scripts/suite-selftest.mjs
node scripts/suite-selftest.mjs --selftest
npx nx run storybook:storybook:build
PROJECTS="$(node scripts/release-graph.mjs --projects)"
[ -n "$PROJECTS" ] || { echo "empty build set"; exit 1; }
npx nx run-many --target=build --projects="$PROJECTS"
bash scripts/assemble-demo-dist.sh apps/storybook/storybook-static
node scripts/gate-selftest.mjs
node scripts/run-axe-storybook.js
PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts --project=chromium
npx playwright test
node scripts/check-release-graph.mjs --selftest
node scripts/check-release-graph.mjs
node scripts/check-offline-load.mjs --selftest
node scripts/check-offline-load.mjs
npx commitlint --from=<current-train-sha> --to=HEAD
git diff --check <current-train-sha>..HEAD
```

The dynamic publishable-graph build and `assemble-demo-dist.sh` invocation above are one ordered CI
equivalent: do not substitute the narrower authored-input build. The PR's `[ENFORCED] All hard
gates must pass` job must also finish successfully; a missing or inappropriately skipped prerequisite
is not green. WP04's local visual diagnostic is evidence that each new screenshot target is visible
and non-empty, not a passing baseline gate. A clean `git status --porcelain` after
regeneration/checks is required.

CI remains authoritative for Ubuntu font-dependent baselines, the full browser matrix, mutation
timing and the Storybook `<180s` budget. No missing/skipped hard gate is treated as green.

## Final Train Integration Sequence

Spec Kitty 3.2.6rc4 freezes `lanes.json.planning_commit_sha` once execution starts. Therefore do
not rebase or rewrite any materialized execution lane after its WP is claimed.

Before WP allocation, verify the branch is rebased on the then-current train, small and linear, and
that `npx commitlint --from=<train-sha> --to=HEAD` is green. If history normalization or any planning
repair is required, do it before execution and run task finalization last so
`lanes.json.planning_commit_sha` names the current planning commit and remains its ancestor.

1. Execute WP01→WP04 in dependency order. Spec Kitty may assign separate lane ids, but no WP is
   claimed until its dependency is approved. Never manually merge or rebase a lane.
2. Review every WP independently. WP04 approval covers its aggregate lane state, not a
   post-consolidation PR or latest-train claim.
3. After all four WPs approve, fetch latest `origin/train/elements-first` and refresh/rebase the
   clean planning target while all execution lanes remain frozen. Resolve no authored sibling
   source and confirm current issue #112/train conformance-gate state before proceeding.
4. Run canonical `spec-kitty merge` to consolidate the frozen lanes onto that refreshed target.
   This order is required by SK-179; do not first merge lanes and then rebase their result.
5. Resolve only shared generated/entry/ratchet conflicts. Generate the timestamped token catalogue
   only if the merged token-source state differs from the state already catalogued. Regenerate the
   stable outputs, run the exact read-only source/catalogue comparator above, commit them, and run
   the full exact-head local gate list including `git diff --check <current-train-sha>..HEAD`.
6. From this point, do not rebase. Push/update one draft PR targeting `train/elements-first` with
   `Refs #145`. Obtain the five CI-authoritative actual PNGs from its `visual-regression-diffs`
   artifact, compare them with the operator-supplied approved export, commit only the accepted bytes
   under `apps/storybook/src/tests/visual.spec.ts-snapshots/`, push the new head, and rerun the
   exact `PW_INCLUDE_VISUAL=1 npx playwright test apps/storybook/src/tests/visual.spec.ts
   --project=chromium` command plus every affected exact-head gate. This is the first point at which
   passing approved visual assertions may be claimed.
7. Run the exact-SHA three-lens pre-merge squad and obtain maintainer approval. Record local, CI,
   visual, squad and maintainer evidence against that immutable PR head on external PR comment/check
   surfaces. Under the SK-178 waiver, do not run an acceptance-verdict writer whose tracked
   auto-commit would move the very HEAD being certified; if the governing acceptance surface cannot
   record the verdict without changing HEAD, stop for maintainer disposition instead of entering a
   self-invalidating commit/evidence loop. Any other push invalidates SHA-pinned evidence. If train
   moves, stop and obtain an explicit rebaseline decision instead of blindly rebasing the reviewed
   candidate.
8. Merge only to `train/elements-first` when explicitly authorized. Verify the PR is merged into
   that base and resolve its exact merge commit. Immediately afterward, mission/orchestrator
   wrap-up—not a WP worker—closes #145 and #153 as completed with the merged PR URL/number and train
   commit SHA in each closure comment. Compare the pre-closure and post-closure state snapshots for
   #112, #125, #144, #146, #147, #148, #150 and #154 and require them to be unchanged across this
   mission's closure operation. If a separate completion races that window, stop and attribute it
   before continuing; never claim or overwrite it. Never merge the train to main, tag, publish or
   deploy.

## Implementation Concern Map

### IC-01 — Shell geometry and responsive ownership

- **Purpose:** Establish the three-region frame without hiding navigation or storing open state.
- **Requirements:** FR-001–FR-003, FR-011, NFR-003, NFR-005.
- **Surfaces:** layout tokens, app-shell CSS/element/story/browser/fixture tests.
- **Depends on:** #79 landed; no sibling mission.
- **Risks:** content overflow; a responsive rule silently hiding a region; raw geometry outside tokens.

### IC-02 — Navigation-region semantics and grouping

- **Purpose:** Separate application navigation, context content and the one account location.
- **Requirements:** FR-004–FR-008, FR-015, NFR-001–NFR-003.
- **Surfaces:** personal-rail and context-sidebar sources/stories/tests.
- **Depends on:** IC-01 for composition evidence only.
- **Risks:** duplicate landmarks, false `<nav>` semantics, inaccessible truncation, intercepted events.

### IC-03 — Page orientation without time ownership

- **Purpose:** Lay out supplied heading/copy/sync/actions while preserving semantics and verbatim time text.
- **Requirements:** FR-009–FR-010, FR-015, NFR-001–NFR-005.
- **Surfaces:** page-header source/story/tests and shell composition.
- **Depends on:** IC-01.
- **Risks:** invented heading level, timer creep, metadata overlap at narrow widths.

### IC-04 — Existing button's icon-only accessibility seam

- **Purpose:** Extend the single button implementation with named square icon controls and focus delegation.
- **Requirements:** FR-012–FR-017, NFR-001–NFR-004.
- **Surfaces:** existing button element/markup/CSS/stories/fixture and generated declarations.
- **Depends on:** landed #79 contract.
- **Risks:** naming only the host, duplicate tab stops, deriving static axes from sizes, breaking text/link paths.

### IC-05 — Shared generated integration and release evidence

- **Purpose:** Register all public surfaces, generate every committed derivative and prove exact-head readiness.
- **Requirements:** FR-011, NFR-006–NFR-008, C-004–C-010.
- **Surfaces:** entries, package exports, ratchets, mutations, CEM, React/Vue, sizes, docs, visual/CI evidence.
- **Depends on:** IC-01–IC-04 complete.
- **Risks:** parallel #146 shared-file conflicts, cached manifest, stale size data, stale exact-SHA review.

## Work-Package Strategy

Use one strict serial dependency chain of four independently reviewable packages. Spec Kitty may
materialize a distinct lane for each package; the dependency DAG, not lane reuse, enforces order:

1. **WP01 — shell geometry and personal rail:** tokens, app-shell, personal-rail and their unique
   CSS/element/story/fixture/browser sources; focused generation/tests only.
2. **WP02 — context sidebar and page header:** the remaining two new components and their unique
   source/evidence; depends on WP01 composition contract.
3. **WP03 — accessible icon-size button extension:** only existing button authored files and its
   focused regression/red-first evidence; depends on #79, sequenced after WP02 to prevent parallel
   execution and preserve exact dependency bases.
4. **WP04 — generated integration and exact gate closure:** shared entries/exports, ratchets,
   registry/mutations, docs, CEM/React/Vue/size outputs, shell browser/visual integration and every
   final local gate. It depends on WP01–WP03 and is the only shared-artifact owner.

The packages are serial because aggregate generated and registry artifacts are committed. That
does not authorize one package to absorb another issue's authored sources. Post-WP04 mission
wrap-up performs the pre-consolidation target refresh, canonical merge and exact-head gates above;
those steps are not conditions of WP04 approval. Issue closure is also wrap-up-only: workers close
nothing, and #145/#153 close only after the authorized train merge is verified.

## Pre-mortem and Risks

| Failure | Early signal | Prevention / response |
|---|---|---|
| Shell owns drawer/open state | `open`, toggle method/event, hidden CSS branch appears | Reject against FR-003/C-002; keep visibility on slotted host consumer |
| 56/240 geometry bypasses tokens | literal widths in component CSS | Semantic layout tokens, catalogue gate and stylelint |
| Identity appears twice | approved composition has account content in `primary` and `account` | Story/browser assertion on fixture locations; component never synthesizes identity |
| Context content gets false nav semantics | internal `<nav>` wraps generic content | Use labelled `<aside>`; consumer supplies a native nav if appropriate |
| Truncation erases the accessible name | text replaced by short title/aria-label | CSS-only ellipsis; computed accessible-name/full text assertion |
| Button label stays on generic host | inner control accessible name is empty | `toHaveAccessibleName` on BUTTON and A, plus deliberate reversal |
| Focus fix creates two tab stops | host gains `tabindex` | `delegatesFocus` only; keyboard sequence test; leave #154 out of scope |
| Static icon export paints text/tone-less shape | `BUTTON_AXES` derived/grown from sizes | Keep axes declared and unchanged; test strict static API directly |
| SC-014 identity arm is unproven | only `static styles=[]` mutation exists | two mutations per new component: empty and new-sheet identity |
| Reflected label is assigned before definition | late assignment works but no-build order loses the value/reflection | SC-010 late-definition test and one label-declaration mutation for rail, context sidebar and button |
| Parallel #146 lands first | conflicts in entries/ratchets/CEM/wrappers/SIZES/visual spec | pre-consolidation planning-target refresh, preserve authored dirs, then regenerate shared outputs serially |
| Cached analyze masks drift | `nx` reports cached analyze | mandatory `--skip-nx-cache`, then diff manifest |
| Timestamped catalogue is called deterministic | no-input rerun changes only `generated_at` | generate/commit once per token-source state; use the exact read-only comparator that ignores only `generated_at` |
| SIZES records stale dist | measurement before build | build tokens/styles/elements immediately before measure |
| Local PNGs become authority | snapshot generated outside Ubuntu CI | WP04 records diagnostic actuals only; wrap-up accepts only PR-artifact bytes after approved-reference review |
| Review evidence goes stale | push after squad or train moves | a push requires rerunning affected evidence; train movement requires stop/rebaseline, not blind rebase |
| A worker closes an issue or wrap-up closes the wrong set | issue state moves before verified train merge, or a parent/sibling changes | prohibit closure in every WP; snapshot governed states, verify the authorized train merge, close exactly #145/#153 with merge evidence, then compare all non-target states |
