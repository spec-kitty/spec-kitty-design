# Quickstart: native radio choice group

## Consumer markup

Use one real fieldset and legend, then one real label/input pair per choice, all sharing one
`name`. Add the styles package CSS through the normal consumer path; do not register an element.

```html
<fieldset class="sk-radio-choice-group">
  <legend class="sk-radio-choice-group__legend">Connect a workspace</legend>
  <div class="sk-radio-choice-group__options">
    <label class="sk-radio-choice-group__choice">
      <input class="sk-radio-choice-group__control" type="radio" name="workspace_id" value="1"
        checked required>
      <span class="sk-radio-choice-group__label">Acme</span>
      <span class="sk-radio-choice-group__secondary-value">acme</span>
    </label>
    <label class="sk-radio-choice-group__choice">
      <input class="sk-radio-choice-group__control" type="radio" name="workspace_id" value="2"
        required>
      <span class="sk-radio-choice-group__label">Acme / Platform</span>
      <span class="sk-radio-choice-group__secondary-value">acme/platform</span>
    </label>
  </div>
</fieldset>
```

Consumers own the group `name`, values, primary/secondary text, checked/default-checked/disabled/
required state, submission and reset handlers, validation-message copy, routing, and every other
provider concern (#286).

## Verification sequence

1. Generate the styles-only barrel.
2. Build the styles package and Storybook.
3. Run the dedicated radio-choice browser spec (roles/names/order, exactly-one selection, arrow-key/
   Space/label activation, required/invalid constraint validation, submission, reset).
4. Run axe across the built Storybook.
5. Run visual regression and inspect dark, light, narrow, RTL, long, required-invalid, disabled,
   disabled-group, focus, and forced-colors (including a customized-`accent-color` choice) frames.
6. Run repository lint/build/generator/ratchet gates and verify a clean tree.
7. Record real 200%-zoom and real RTL browser evidence (not a viewport-resize substitute) under
   `docs/architecture/validation/issue-336-radio-choice-group-zoom/`.

The Work Package prompt (`tasks/WP01-native-radio-choice-group-styles-and-conformance-evidence.md`)
contains the exact commands resolved for the implementation checkout.
