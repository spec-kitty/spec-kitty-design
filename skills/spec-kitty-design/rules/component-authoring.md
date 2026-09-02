# Component Authoring Rules

## Story structure (required)

Every component must have a Storybook story with these named exports:

```typescript
export const Default: Story = {};          // MANDATORY
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const Desktop: Story = { parameters: { viewport: { defaultViewport: 'desktop' } } };
// Interactive components additionally need:
export const Hover: Story = { play: async ({ canvasElement }) => { ... } };
export const Focus: Story = { play: async ({ canvasElement }) => { ... } };
export const Disabled: Story = {};         // if applicable
```

## a11y requirement

Every story must enable axe-core:
```typescript
parameters: { a11y: { disable: false } }
```

Never use `a11y: { disable: true }` in production stories. Accessibility waivers go in
the story description with a tracking issue link.

## Token dependency documentation

Every component's Storybook story `meta.description` should list the tokens it uses:
```typescript
const meta: Meta = {
  title: 'Atoms/Button',
  parameters: {
    docs: {
      description: {
        component: 'Uses: `--sk-color-yellow`, `--sk-fg-on-primary`, `--sk-radius-pill`, `--sk-space-3`, `--sk-space-7`'
      }
    }
  }
};
```

## Framework isolation

- Angular stories in `*.stories.ts`
- HTML stories in `*.html.stories.ts` or `*.stories.html.ts`
- Never import Angular components in an HTML story
- Never import HTML primitives in an Angular story

## Stub reference

The stub component (`packages/angular/src/lib/stub/`, `packages/styles/src/stub/`)
is the minimal valid example. Follow its structure for new components.

## CI gates a new component must pass

1. `npm run quality:stylelint` — no hardcoded values
2. `npx nx run storybook:storybook:build` — Storybook builds
3. `node scripts/run-axe-storybook.js` — zero WCAG 2.1 AA violations
4. `npx playwright test apps/storybook/src/tests/visual.spec.ts --update-snapshots` — establish baseline
