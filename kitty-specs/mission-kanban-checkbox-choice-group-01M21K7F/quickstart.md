# Quickstart: native checkbox choice group

## Consumer markup

Use one real fieldset and legend, then one real label/input pair per choice. Add the styles package
CSS through the normal consumer path; do not register an element.

```html
<fieldset class="sk-checkbox-choice-group">
  <legend class="sk-checkbox-choice-group__legend">Detailed lanes</legend>
  <div class="sk-checkbox-choice-group__options">
    <label class="sk-checkbox-choice-group__choice">
      <input class="sk-checkbox-choice-group__control" type="checkbox" name="lane" value="planned">
      <span class="sk-checkbox-choice-group__label">Planned</span>
      <span class="sk-checkbox-choice-group__metadata">3</span>
    </label>
  </div>
</fieldset>
```

Consumers own checked/disabled state, names, values, metadata, submission/reset handlers,
filtering, persistence, URLs, and surrounding Apply/Clear actions.

## Verification sequence

1. Generate the styles-only barrel.
2. Build the styles package and Storybook.
3. Run the dedicated checkbox-choice browser spec.
4. Run axe across the built Storybook.
5. Run visual regression and inspect dark, light, narrow, long, disabled, focus, forced-colors,
   zoom, and K3 frames.
6. Run repository lint/build/generator/ratchet gates and verify a clean tree.

The Work Package prompt contains the exact commands resolved for the implementation checkout.
