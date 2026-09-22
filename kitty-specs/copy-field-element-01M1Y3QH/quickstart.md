# Quickstart: `sk-copy-field`

This guide is for design-system consumers who already load the Spec Kitty elements bundle.

```html
<sk-copy-field
  value='spec-kitty dispatch "Add dark-mode tokens to the dossier"'
  label="Copy Start a Mission command"
  success-message="Command copied. Paste it into your terminal."
  manual-message="Command selected. Use your system copy shortcut to copy it."
></sk-copy-field>
```

Listen for the privacy-safe terminal result when application code needs to respond:

```ts
document.querySelector('sk-copy-field')?.addEventListener('sk-copy-field-result', (event) => {
  const { outcome } = (event as CustomEvent<{ readonly outcome: 'copied' | 'manual' | 'failed' }>).detail;
  // The copied value is intentionally absent. The application still owns any routing or workflow.
  console.log(outcome);
});
```

`value` is shown and copied exactly. An empty string disables the button. When browser clipboard
writing is unavailable, the field focuses and selects its visible value and announces the manual
copy instruction. The component does not execute or validate commands, retry, reset on a timer,
show global toasts, or publish a static inert HTML alternative.

Public parts are `field`, `value`, `copy-control`, and `status`.
