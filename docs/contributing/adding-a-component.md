# Adding a component

Components live in two packages: `packages/angular/` (Angular LTS) and
`packages/styles/` (framework-agnostic HTML). Most components should exist
in both — start with the HTML primitive, then add the Angular wrapper.

## Steps

### 1. Generate the Angular component

```bash
npx nx g @nx/angular:component <name> \
  --project=angular \
  --path=packages/angular/src/lib/<name> \
  --export \
  --standalone
```

### 2. Write the HTML primitive

Create `packages/styles/src/<name>/index.ts` and `<name>.css`.

### 3. Add Storybook stories

- Angular story: `packages/angular/src/lib/<name>/<name>.stories.ts`
- HTML story: `packages/styles/src/<name>/<name>.html.stories.ts`

Required story exports: `Default`, `Mobile`, `Desktop`.
For interactive components, add `Hover`, `Focus`, `Disabled`.

### 4. Document token dependencies

In the story `meta.parameters.docs.description.component`:
```typescript
'Uses: `--sk-color-yellow`, `--sk-fg-on-primary`, `--sk-radius-pill`'
```

### 5. Export from package index

Add to `packages/angular/src/index.ts`:
```typescript
export { MyComponent } from './lib/<name>/<name>.component';
```

### 6. Run checks

```bash
npx nx run-many --target=build --projects=tokens,angular,styles
npx nx run storybook:storybook:build
node scripts/run-axe-storybook.js
```

### 7. Establish visual baseline

```bash
npx playwright test apps/storybook/src/tests/visual.spec.ts --update-snapshots
git add apps/storybook/src/tests/visual.spec.ts-snapshots/
git commit -m "test(visual): add baseline for <name>"
```

## Rules

- No hardcoded values — only `--sk-*` tokens (checked by Stylelint)
- a11y addon must be enabled (`a11y: { disable: false }` in story parameters)
- Never embed mascot illustrations in component files
