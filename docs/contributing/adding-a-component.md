# Adding a component

> **Rewritten for the elements-first architecture (#72).** This document previously told you
> to run `nx g @nx/angular:component` and to export `Default`, `Mobile`, `Desktop` stories.
> `packages/angular` was deleted in #102, ADR-8 moved behaviour into custom elements, and the
> required theme variant is `LightMode`. Two pre-merge lenses flagged that this file was the
> only doc a new implementer would open and that it was actively wrong.

Components live in three packages:

| package | holds | published |
|---|---|---|
| `packages/tokens` | `--sk-*` custom properties — the only place a colour is written | yes |
| `packages/styles` | the `.css` source of record, plus **generated** static HTML | yes |
| `packages/elements` | the custom element, and the **authored** markup module | not yet (#80) |

There are no wrappers. ADR-8 confirmation #1 requires that none exist.

## Steps

### 1. Author the CSS in `packages/styles`

`packages/styles/src/<name>/sk-<name>.css`. This is the source of record and the only file
stylelint's `--sk-*` rule can see.

**Never write a theme selector here.** `:root[data-theme="light"] .sk-x` and `.sk-light .sk-x`
both cross a shadow boundary, so both are **inert** once the CSS is adopted by an element —
silently, with no error and no warning, producing a `LightMode` story that renders dark
styling. #72 found and repaired exactly that in `sk-card.css`.

Light-mode variance goes in **tokens**, because a custom property inherits through a shadow
boundary and a selector does not. Reuse the tint family — `--sk-surface-tint-*`,
`--sk-on-tint-*`, `--sk-border-tint-*` — rather than inventing a component-named token.
`:host-context()` is not an escape hatch: Baseline limited, Chromium-only.

### 2. Author the markup ONCE, in `packages/elements`

`packages/elements/src/<name>/sk-<name>.markup.ts` must export:

- `<name>Classes(variant?, inset?)` — the BEM class list, throwing on an unknown variant;
- `<name>StaticHtml(variant?, inset?, content?)` — the server-rendered form;
- `<NAME>_VARIANTS` — the variant → modifier map the generator derives exports from.

ADR-10 §3: *the element's template is the sole authored source.* `sk-<name>.html` and
`packages/styles/src/<name>/index.ts` are **generated** from this module by
`node scripts/build-element-markup.mjs`, and CI fails if they drift. Do not hand-edit them,
and do not hand-write markup in a story — render from the generated exports.

### 3. Write the element

`packages/elements/src/<name>/sk-<name>.ts`:

- `static styles = [sheet]` from the generated `sk-<name>.css.js` — never `css\`\`` in the
  `.ts`, which `scripts/check-no-css-in-source.mjs` enforces;
- register through `define()` (ADR-10 §5), and carry an **`@element sk-<name>`** JSDoc — the
  manifest analyzer cannot follow the guarded helper, and `check-manifest-content.mjs` fails
  without it;
- declare every `::part()` with `@csspart`, and **terminate the tag before any prose** — the
  description is published API and swallows the rest of the docblock otherwise;
- export it from `src/index.ts` and side-effect import it in `src/elements.ts`.

### 4. Record the parts

Every `@csspart` must be added to `expected-parts.json` **in the same PR as a test that
targets it**. `scripts/check-part-ratchet.mjs` is shrink-only: parts may be removed, never
added silently.

### 5. Stories

`packages/elements/src/<name>/sk-<name>.stories.ts`, plus the styles-layer story if the
component has a static form. Required variant: **`LightMode`**, wrapped in
`class="sk-light"` — **not** `data-theme="light"`, which activates nothing on a wrapper
because the token block anchors on `:root[data-theme="light"], .sk-light` and `:root` only
matches `<html>` (#93).

Verify LightMode actually renders light styling. Do not assume it: assert the computed value
under both themes and require them to differ.

### 6. Behaviour tests, if it owns behaviour

If the component has form association, events, focus or keyboard handling, add ids to
`behaviours.json` and tests to `fixtures/elements-behaviour/`. Read that fixture's mutation
contract first — every anchor must be unique, single-occurrence and non-inert, with an entry
in `mutations.json`, or `scripts/suite-selftest.mjs` fails the build.

A purely presentational component owns none of the fourteen and adds nothing there.

### 7. Run the gates

```bash
node scripts/build-elements-css.mjs && node scripts/build-element-markup.mjs
npx nx run-many --target=build --projects=tokens,styles,elements
npm run test
npx nx run storybook:storybook:build && node scripts/run-axe-storybook.js
node scripts/check-no-css-in-source.mjs && node scripts/check-part-ratchet.mjs
node scripts/check-manifest-content.mjs && node scripts/measure-elements-sizes.mjs
```

### 8. Visual baseline

Baselines are **CI-authoritative** — local font metrics differ. Take them from the
`visual-regression-diffs` artifact rather than from a local run.

## Rules

- No hardcoded values — only `--sk-*` tokens (stylelint enforces it).
- No theme selectors in component CSS. Tokens, always.
- No markup authored twice. Generated artifacts are exempt and must be regenerable.
- a11y addon enabled (`a11y: { disable: false }`).
- Never embed mascot illustrations in component files.

## Adding a token

New tokens go in **both** blocks of `packages/tokens/src/tokens.css` (the `:root` default and
the `:root[data-theme="light"], .sk-light` override) and require
`npx nx run tokens:catalogue` — the catalogue is a published artifact, and
`scripts/check-token-breaking-changes.sh` is blind to anything missing from it.
