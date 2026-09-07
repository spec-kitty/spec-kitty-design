# Research: Native form-select styles

**Mission:** `native-form-select-styles-01M1WSXJ`

**Issue:** [#211](https://github.com/spec-kitty/spec-kitty-design/issues/211), child of
[#208](https://github.com/spec-kitty/spec-kitty-design/issues/208)

**Research base:** `train/elements-first@9e6d9731c0a6ea64c70ef7779fbd266d71801bdd`

**Audience:** the planner, implementer, and reviewers who must deliver #211 without replacing
browser-owned select semantics or expanding into application filter state.

## Executive finding

No new architecture decision is required. ADR-10 explicitly classifies a surface whose complete
value is styling native semantics as styles-only. The mission therefore adds a new
`packages/styles/src/form-select/` component whose class is applied directly to a native,
single-choice light-DOM `<select>`. The existing `.sk-form-field`, label, and description classes
compose around it. No `<sk-form-select>` element, shadow root, custom option model, manifest entry,
React/Vue wrapper, behavior subject, or mutation subject is permitted. [E-001, E-002, E-003]

The public selector inventory is exactly:

- `.sk-form-select` — the full-width base presentation;
- `.sk-form-select--compact` — the compact/filter-bar presentation modifier.

Native pseudo-classes own invalid, disabled, and focus states. Narrow/full-width is the base
control inside a constrained consumer container. `option` and `optgroup` remain completely
platform-owned and are not styled. [E-004, E-005]

## Authority and design evidence

Issue #211 is the binding implementation contract. Epic #208 establishes the library/application
boundary and downstream composition in #214. ADR-9 governs same-root label and description
relationships. ADR-10 governs styles-only native semantics and generated markup. ADR-11 and the
current authoring recipe govern tests and generated-artifact drift. [E-001, E-002, E-006]

The approved T10 Stitch project was requested directly but exposed only the unauthenticated
application shell, not a screen payload. Prior #209 research independently records the same
limitation. No checked-in historical image is identified as T10, so none is substituted. The
issue body already transcribes the required visual intent: a closed lane choice, a compact
filter-bar recurrence, native affordances, narrow/full-width layout, dark/light, and forced
colors. No unseen pixel value is claimed. [E-007]

## Decisions already covered by governing records

### R-01 — new styles-only component directory

Create `packages/styles/src/form-select/`, not an element directory and not extra selectors inside
`form-field`. The repository convention is one component directory per public surface, while
`build-styles-only-markup.mjs` derives styles-only components as CSS directories with no matching
element directory. "Extend form-field" means compose with its public classes. [E-003, E-008]

### R-02 — preserve the native select and its descendants

Apply `.sk-form-select` directly to `<select>`. Real `<option>` and `<optgroup>` descendants stay
in the same light DOM and retain UA keyboard, typeahead, selection, validation, submission, and
reset behavior. Do not author `role`, `aria-selected`, listbox/combobox plumbing, popup state, or a
shadow wrapper. `multiple` and custom option rendering are outside the mission. [E-002, E-009]

### R-03 — exact class surface

Add only the base class and compact modifier. Do not add `--filter-bar`, `--invalid`, `--disabled`,
`--narrow`, `--full-width`, `__option`, or `__indicator`. Native pseudo-classes and constrained
containers already name those conditions without expanding the API. [E-004]

### R-04 — same-root accessible relationships

Every maintained field uses a native `label[for]` whose value resolves to the select `id` in the
same document root. Required-invalid help uses a same-root `aria-describedby` target. The visible
error message plus a structural boundary/focus treatment prevents color-only communication; the
library does not synthesize `aria-invalid` or validation messages. [E-006, E-010]

### R-05 — retain native indicator and focus mechanics

Never use `appearance: none`, a background-image/generated-content arrow, or
`forced-color-adjust: none`. Do not copy legacy `.sk-input`'s `outline: none` and box-shadow-only
focus treatment: box shadows disappear in forced colors. Use a real token-backed outline for
keyboard focus, and let native indicator/disabled affordances survive. No transition is required,
so no reduced-motion block should be added. [E-011, E-012]

### R-06 — existing tokens cover the surface

The existing input surface, foreground, border, focus, width, radius, font, size, and spacing
tokens cover default and compact presentation. No new token is justified by current evidence.
Implementation should use logical sizing (`inline-size: 100%`, `min-inline-size: 0`,
`max-inline-size: 100%`) so long selected text cannot widen the page. [E-013]

### R-07 — native behavior is tested but not re-owned

The issue requires real browser checks for label activation, Arrow-key selection, unique-prefix
typeahead, form submission/reset, required validity, disabled exclusion, and option/optgroup
semantics. These belong in outer Playwright because the subject is the shipped browser surface.
They do not justify `behaviours.json` or `mutations.json`: there is no JavaScript behavior in this
component to mutate, and the recipe registers only behavior a component owns. [E-014, E-015]

### R-08 — generated and public distribution

Author the CSS, HTML exemplars, and Storybook story. Generate the component `index.ts` using
`build-styles-only-markup.mjs`. Manually wire the root styles barrel and package subpath because
the generator does not do so. Element CSS modules, manifest, wrappers, Vue types, element
ratchets, and element size rows must remain semantically unchanged after full regeneration;
`SIZES.md` is regenerated only after the build. [E-008, E-016]

### R-09 — every named story is acceptance evidence

Provide separately addressable `Default`, T10 lane selector, T12 two-filter recurrence,
`Compact`, `LongOptions`, `Optgroups`, `RequiredEmptyInvalid`, `Disabled`, `Narrow`,
`ForcedColors`, `DefaultDark`, and `LightMode` stories. Ratchet the actual built Storybook IDs.
Default/T10/default-dark/light may share one authored exemplar; duplication of markup sources is
not required. Visual baselines cover the closed control, never the OS popup. [E-017]

### R-10 — document the datalist boundary

#180's datalist remains the free-text-with-suggestions surface. A select is a closed set whose
value must be one of its options. Documentation must state this distinction and preserve consumer
ownership of option content, selected value, change handlers, lane/filter state, fetching,
routing, and responsive route selection. [E-018]

## Canonical semantic shape

```html
<div class="sk-form-field">
  <label class="sk-form-field__label" for="lane-filter">Lane</label>
  <select
    class="sk-form-select"
    id="lane-filter"
    name="lane"
    aria-describedby="lane-filter-help"
  >
    <option value="all">All lanes</option>
    <optgroup label="Active lanes">
      <option value="doing">In progress</option>
    </optgroup>
  </select>
  <span class="sk-form-field__description" id="lane-filter-help">
    Consumer-supplied help.
  </span>
</div>
```

Required-empty adds `required` and an initially selected `option value=""`. The maintained error
exemplar supplies `aria-invalid="true"` and described help for visible reference evidence while
browser tests prove that `validity.valueMissing` and submit blocking still come from the native
control. The stylesheet never toggles either attribute or value. [E-010, E-015]

## Falsifiable browser evidence

The focused Playwright surface should prove, in Chromium, Firefox, and WebKit unless a capability
is explicitly engine-scoped:

1. The styled node is an `HTMLSelectElement` in light DOM with only native option/optgroup
   descendants, no custom roles/state, and an accessible combobox name from its label.
2. Clicking the label moves real document focus to the select.
3. `ArrowDown` changes the value on a fresh fixture; a unique prefix such as `d` chooses `done`
   through native typeahead. Do not use `selectOption()` as evidence for these two behaviors.
4. A submitted form yields the exact authored `name`/selected `value`; the T12 recurrence proves
   two independently named filters submit together.
5. `form.reset()` restores the authored initial option and selected index without a library reset
   handler.
6. Required-empty reports `validity.valueMissing`, fails `checkValidity()`, and blocks
   `requestSubmit()` until a non-empty option is chosen.
7. A disabled select cannot receive programmatic focus and is absent from `FormData`.
8. `select.options` preserves flattened option order/value, and optgroup labels and descendant
   element types remain native. Do not require OS-popup AX internals that differ between engines.
9. The described invalid help resolves through `getRootNode()` and is the computed accessible
   description.
10. At 320 CSS pixels, the control stays inside its form field, the document does not overflow,
    and focus remains usable. This is honest reflow evidence, not mislabeled browser-zoom emulation.
11. Dark and `.sk-light` stories differ in a token-derived computed value without semantic drift.
12. Chromium forced-colors emulation retains native appearance, a visible focus outline, disabled
    semantics, and non-color-only invalid treatment. WebKit/Firefox are not silently skipped from
    the ordinary semantic suite.

Space/Enter popup opening, native popup screenshots, popup accessibility-tree internals, and exact
`change` event timing are intentionally not asserted because those are browser/OS-owned and differ
without violating the contract. [E-015, E-019]

## Implementation map

### Authored source

- `packages/styles/src/form-select/sk-form-select.css`
- `packages/styles/src/form-select/sk-form-select-*.html` for the named states
- `packages/styles/src/form-select/sk-form-select-html.stories.ts`
- `apps/storybook/src/tests/sk-form-select.spec.ts`
- focused additions to `apps/storybook/src/tests/visual.spec.ts`
- `expected-stories.json`
- `packages/styles/src/index.ts`
- `packages/styles/package.json`
- the form/select section of `docs/design-system/using-components.md`

### Generated evidence

- `packages/styles/src/form-select/index.ts` from `build-styles-only-markup.mjs`
- normal full-regeneration outputs only when bytes genuinely change
- `packages/elements/SIZES.md` after building the measured packages
- CI-authoritative visual snapshots obtained from GitHub rather than refreshed from workstation
  font metrics

### Explicitly unchanged surfaces

- `packages/elements/src/`
- `packages/react/src/`
- `packages/elements/custom-elements.json`
- `packages/elements/vue.d.ts`
- `expected-parts.json` and `expected-docs.json`
- `behaviours.json`, `mutations.json`, and mutation subjects
- token source/catalogue unless implementation measurement discovers a genuinely missing reusable
  value; none is currently indicated

## Verification plan

Focused gates first:

```text
node scripts/build-styles-only-markup.mjs
node scripts/build-styles-only-markup.mjs --check
node scripts/check-component-token-literals.mjs --selftest
node scripts/check-component-token-literals.mjs packages/styles/src/form-select/sk-form-select.css
npx nx run styles:build
node scripts/check-release-graph.mjs --selftest
node scripts/check-release-graph.mjs
npx nx run storybook:storybook:build
npx playwright test apps/storybook/src/tests/sk-form-select.spec.ts
node scripts/run-axe-storybook.js
```

Then run the complete regeneration, type, lint, unit, behavior/mutation, Storybook, axe,
Playwright, visual, size, security, commit, and `npm run quality:all` gates required by CLAUDE.md,
the recipe, CI, and #211. Visual baselines are CI-authoritative. [E-016, E-020]

## Risks and mitigations

| Risk | Evidence | Mitigation |
| --- | --- | --- |
| Native arrow is replaced or disappears in forced colors | Legacy input styling is tempting but select indicator is UA-owned | Prohibit `appearance:none`, custom arrows, and `forced-color-adjust:none`; assert native appearance and visually baseline the closed control |
| Focus becomes box-shadow-only and vanishes | Recipe records box-shadow disappearance under forced colors | Use and test a real outline with authoritative tokens |
| Native validation is visually color-only | Border color alone does not communicate invalidity | Preserve native `:invalid`, use structural border/outline delta, and require visible described help in maintained invalid composition |
| Long option text creates page overflow | Select intrinsic sizing can pressure narrow containers | Logical `min/max/inline-size`, 320px geometry assertion, closed-state visual |
| Shallow tests pass while browser behavior breaks | Attribute inspection does not exercise UA behavior | Drive real focus/keys/submission/reset/validity across configured engines |
| Popup assertions flake across platforms | Native popup is OS/engine UI | Test closed control and semantic/value outcomes, not popup pixels or internal AX nodes |
| Generated barrel exists but public package omits it | Root barrel and package exports are manual | Assert root and subpath resolution; run release-graph gate |
| Story evidence can be silently retired | Packages/styles stories are not globally ratcheted by default | Add every #211 acceptance story ID to `expected-stories.json` |
| A developer invents filter/lane state | T10/T12 examples mention application concepts | Keep state in consumer fixtures only; source/diff assertions reject handlers, routing, fetching, and selection ownership |
| Stitch pixels are unavailable | Direct project response has no authorized screen payload | Use issue #211 as implementation authority and make no unobserved pixel claim |

## Open questions

None block specification or planning. Browser calibration may select among existing spacing/focus
tokens, but it cannot widen the public selector surface or replace native semantics. Any finding
that would require one of those changes is a new architectural fork and must be raised rather than
silently implemented.
