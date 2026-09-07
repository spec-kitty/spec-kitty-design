---
work_package_id: WP01
title: Native light-DOM form-select styles
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
- FR-013
- FR-014
- NFR-001
- NFR-002
- NFR-003
- NFR-004
- NFR-005
- NFR-006
- NFR-007
- NFR-008
- NFR-009
- NFR-010
- C-001
- C-002
- C-003
- C-004
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
planning_base_branch: mission/native-form-select-styles
merge_target_branch: mission/native-form-select-styles
branch_strategy: Planning artifacts for this mission were generated on mission/native-form-select-styles. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/native-form-select-styles unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - native light-DOM form-select styles
history:
- at: '2026-09-07T02:45:00Z'
  actor: codex
  action: Prompt authored for issue
agent_profile: frontend-freddy
authoritative_surface: packages/styles/src/form-select/
create_intent:
- packages/styles/src/form-select/sk-form-select.css
- packages/styles/src/form-select/sk-form-select-t10-lane.html
- packages/styles/src/form-select/sk-form-select-t12-filters.html
- packages/styles/src/form-select/sk-form-select-compact.html
- packages/styles/src/form-select/sk-form-select-long-options.html
- packages/styles/src/form-select/sk-form-select-optgroups.html
- packages/styles/src/form-select/sk-form-select-required-invalid.html
- packages/styles/src/form-select/sk-form-select-disabled.html
- packages/styles/src/form-select/sk-form-select-narrow.html
- packages/styles/src/form-select/index.ts
- packages/styles/src/form-select/sk-form-select-html.stories.ts
- apps/storybook/src/tests/sk-form-select.spec.ts
execution_mode: code_change
model: ''
owned_files:
- packages/styles/src/form-select/**
- packages/styles/src/index.ts
- packages/styles/package.json
- expected-stories.json
- docs/design-system/using-components.md
- packages/elements/SIZES.md
- apps/storybook/src/tests/sk-form-select.spec.ts
- apps/storybook/src/tests/visual.spec.ts
- apps/storybook/src/tests/visual.spec.ts-snapshots/sk-form-select-*.png
role: implementer
tags:
- styles-only
- native-form
- accessibility
task_type: implement
tracker_refs:
- '#211'
- '#208'
---

# Work Package Prompt: WP01 — Native light-DOM form-select styles

## Do this first: load governed context

Load `frontend-freddy` through the installed Spec Kitty resolver, then load action-scoped charter
context for implementation. Read `AGENTS.md`, `CLAUDE.md`, the issue, `spec.md`, `research.md`,
`data-model.md`, `plan.md`, ADR-9/10/11 and the latest component-authoring recipe in full. Use the
runtime CLI for action/status/verdict mutations; never hand-edit mission event/status/meta files.

This is a `single_branch` mission in a fresh isolated primary clone. Work on
`mission/native-form-select-styles`; do not create a git worktree. Before product editing, fetch and
rebase the mission branch onto the latest `origin/train/elements-first`, regenerate affected
artifacts and record the new base. Never branch from or target `main`.

## Outcome and definition of done

Ship a styles-only select primitive with exactly two public classes:

1. `.sk-form-select`, directly on a native light-DOM `<select>`;
2. `.sk-form-select--compact`, the sole density/filter-bar modifier.

Done means one reviewed head satisfies all of these:

- Real `option`/`optgroup` descendants and browser-owned value, name, required, disabled,
  submission, reset, keyboard and typeahead behaviour remain intact.
- Existing form-field label/description classes compose the control. Required-invalid help uses
  same-root `aria-describedby`; invalid, focus and disabled are not colour-only.
- Native indicator, focus and disabled affordances survive forced colors and separately recorded
  200% browser zoom. Long labels and 320px layout stay contained. No motion is introduced.
- All CSS design values resolve through authoritative `--sk-*` tokens. No `appearance:none`,
  replacement arrow or `forced-color-adjust:none` is present.
- Eight authored fixtures drive the generated barrel. Public aggregate and subpath imports resolve.
- Required T10/T12/state/theme stories are non-empty and axe-clean; LightMode uses `.sk-light` and
  produces a real computed token delta.
- Documentation states why the primitive stays native light DOM, why #180's free-text datalist is
  not a closed selector, and that consumers own options/value/change/application state.
- Focused and full gates pass. Exact-head CI and four Codex pre-merge lenses name the final SHA.

## Hard boundaries

Do not create a custom element, shadow root, React/Vue wrapper, component manifest entry,
`expected-parts`/`expected-docs` entry, behaviour subject, mutation, JavaScript helper, custom
combobox/listbox, async search, multi-select widget or rich option renderer. Do not edit #177 card
tones, #178 notice tones, demo/application filter state, routing, fetching, timers, claim logic,
progress arithmetic or Markdown parsing. Do not invent `sk-work-package-card`, Kanban state or a
full-page Work Package element.

## T001 — Red-first focused contract and fresh train

Fetch and rebase the clean mission branch onto current `origin/train/elements-first`; rerun the
baseline generator check. Create `apps/storybook/src/tests/sk-form-select.spec.ts` first and prove
the focused command reds only because the new story/surface is absent.

The completed test must assert:

- every generated fixture root is a native `<select>` and descendants are only native
  `<option>`/`<optgroup>` in authored order; no role replacement or custom option markup;
- public selector/source inventory is exactly the base and compact classes, with no raw design
  values, motion, `appearance:none`, replacement indicator or forced-colour suppression;
- label activation/focus, accessible name, ArrowDown choice and unique-prefix typeahead;
- real form `FormData`, two independent T12 filters, request/submit validity, reset, required
  `valueMissing`, disabled omission and same-root described help;
- compact preserves native semantics; long and narrow stories do not create page overflow;
- `.sk-light` exists and yields a token-derived computed delta; forced-colors retains focus,
  invalid/disabled cues and UA indicator; all story loads are anti-vacuous.

Do not assert open operating-system popup pixels or engine-private accessibility internals.

## T002 — Author the exact stylesheet and native fixtures

Create the eight planned `.html` fixtures. Use unique ids within every rendered fixture and native
label `for` associations. T10 is a lane-choice form. T12 contains two independently named filter
selects. Required-invalid starts on an empty placeholder and points to same-root description text.
Optgroups remain real labelled nodes; long-option and narrow states use ordinary native markup.

Author minimal CSS for the two classes only. Use existing input surface/border/focus/foreground,
spacing, radius, type and weight tokens. Keep the UA indicator by leaving `appearance` alone. Do
not set `outline:none`; use a visible token/system-compatible outline or the existing sanctioned
focus treatment. Add a non-colour state cue for invalid/disabled if measurement requires it. Keep
`box-sizing:border-box`, `max-inline-size:100%`/`inline-size:100%` token-free structural values as
per repository conventions. Author no transition, animation or reduced-motion block.

## T003 — Generate distribution and stories

Run `node scripts/build-styles-only-markup.mjs`; never edit the produced `index.ts`. Add the CSS to
the aggregate style entry and `./form-select/*` to the package exports. Verify generator check and
root/subpath resolution.

Author the story module solely from generated fixture exports. Expose at least `Default` (T10 dark),
`T10Lane`, `T12TwoFilters`, `Compact`, `LongOptions`, `Optgroups`, `RequiredInvalid`, `Disabled`,
`Narrow`, `ForcedColors`, and `LightMode`. LightMode must wrap in `class="sk-light"`, not inert
`data-theme`, and every story keeps a11y enabled. Add all ids to `expected-stories.json`.

## T004 — Turn live native evidence green

Run the focused spec across configured Chromium, Firefox and WebKit projects where local libraries
permit; exact-head CI remains mandatory for WebKit. Use real keyboard input and form APIs. Keep
typeahead deterministic with a unique initial. Assert option tags/order rather than popup AX
internals. At 320 CSS pixels assert document containment. With forced-colors emulation inspect live
focus/invalid/disabled boundaries and preserve the native arrow. Separately inspect at 200% browser
zoom and record indicator, focus, invalid, disabled and content results in the PR evidence; a narrow
viewport is not a substitute.

## T005 — Documentation, axe, visuals and generated surfaces

Add the public using-components section with canonical markup, both class names, state ownership,
native light-DOM rationale, and the explicit contrast: #180's datalist allows unmatched free text,
whereas native select is a closed authored option set. State that consumers own option data,
selection, `change` handling and application filtering/lane state.

Run the Storybook axe runner against every ratcheted story and require non-empty render roots, no
console errors and zero WCAG 2.1 AA violations. Register stable closed-control Chromium visuals for
dark, light, compact, invalid, forced-colors and narrow coverage (or an equally complete named set).
Never snapshot an open native popup. Regenerate the recipe-required SIZES/shared outputs and commit
only generated bytes produced by their scripts.

## T006 — Full verification and negative audit

Run focused checks after each surface, then every current recipe/CLAUDE/CI command. This includes
styles-only generator write+check, styles build, type checks, lint/stylelint/HTMLHint, focused and
full Playwright, Storybook production build, axe, visual regression, release graph/package pack,
security/lockfile, mutation/self-test where CI invokes them, `npm test`, and `npm run quality:all`.

Audit the final diff: no token addition unless a separately governed demonstrated gap exists; no
element/wrapper/manifest/behaviour/mutation/demo change; no third public selector; no application
logic; all generated files reproducible; only owned files changed.

## T007 — Exact-head handoff

Before pre-merge review, fetch latest train, rebase, regenerate in dependency order and rerun every
affected/full gate. Push with `--force-with-lease` only if rebase requires it. Any later push stales
CI and adversarial evidence and repeats the entire final gate. The outer orchestrator opens the
`Refs #211`, `part of #208` PR to `train/elements-first`, runs the four exact-head Codex lenses,
waits for exact-head CI, and owns squash merge/issue/epic closeout.

