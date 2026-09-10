# Quickstart: reproducing this mission's evidence

This mission has no runnable feature. This quickstart instead documents how a reviewer reproduces
the two measurements this mission's spec and plan depend on, so neither is trusted as an
assertion.

## 1. Reproduce the #161 real-package-consumption measurement (spec FR-004, research.md R-006)

```bash
cd <repo root checkout>
npm ci --ignore-scripts        # only if node_modules isn't already installed
rm -rf packages/styles/dist packages/tokens/dist
npx nx run tokens:build --skip-nx-cache
npx nx run styles:build --skip-nx-cache

# Confirm the per-component subpath exports resolve to real files:
ls packages/styles/dist/action-row/sk-action-row.css
ls packages/styles/dist/entity-marker/sk-entity-marker.css
ls packages/styles/dist/app-shell/sk-app-shell.css

# Confirm the root-barrel defect (present, for the reason recorded in research.md, not the
# reason #161's own text states). Run through the real npm-workspace symlink
# (node_modules/@spec-kitty/styles -> packages/styles) using the bare specifier, so package.json's
# "exports" map is actually exercised rather than bypassed by a direct file path:
node --input-type=module -e "
try { await import('@spec-kitty/styles'); console.log('root import OK'); }
catch (e) { console.log('root import FAILS:', e.code, e.message); }
"
```

Expect: the three `ls` commands succeed; the root-import probe fails with
`ERR_MODULE_NOT_FOUND`, referencing a missing file **extension**, not a missing directory.

## 2. Reproduce the FR-008 discriminating measurement (once the implementation WP has produced it)

```bash
cd <repo root checkout>
npx nx run storybook:storybook:build --skip-nx-cache
# Serve the built Storybook, then run the mission's probe script(s):
node kitty-specs/static-form-of-element-backed-css-01M248TF/measurement/<construct>/run.mjs
```

Each probe script (added by the implementation WP under `measurement/<construct>/`) is expected
to:

1. Launch Playwright against the built Storybook's `iframe.html` for the real custom element,
   following the pattern in `apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts`.
2. Render the throwaway static exemplar HTML file (in the same directory) that links the real
   built CSS at its package subpath.
3. Capture and diff the observable outcomes declared in
   `contracts/measurement-contract.md`, including the composed/nested case.
4. Write the result record (also per that contract) to
   `measurement/<construct>/result.json`.

Do not accept a hand-written narrative in place of a committed `result.json` — per NFR-001, the
evidence must be re-executable, not merely described.
