# Quickstart: `sk-confirm-dialog`

This guide is for design-system consumers who already load the Spec Kitty elements bundle. Exact
attribute names below match the shipped implementation (see `contracts/sk-confirm-dialog.md`).

```html
<sk-confirm-dialog
  id="revoke-link-confirm"
  dialog-title="Revoke this link?"
  message="Anyone with this link will lose access immediately. This can't be undone."
  confirm-label="Revoke link"
  cancel-label="Keep link"
  confirm-variant="primary"
  initial-focus="cancel"
></sk-confirm-dialog>
```

Open it in response to a user action, and listen for the outcome through the native `close`
event — there is no second, custom event for this:

```ts
const dialog = document.getElementById('revoke-link-confirm');

openButton.addEventListener('click', () => {
  // showModal() is a public method on the element itself: it also records `openButton` (or,
  // if omitted, whatever currently has focus) as where focus returns on close (FR-009), and
  // resets the outcome to 'cancel' before the dialog can be shown (FR-007).
  dialog?.showModal(openButton);
});

const dialogEl = dialog?.shadowRoot?.querySelector('[part="dialog"]');
dialogEl?.addEventListener('close', () => {
  if (dialogEl.returnValue === 'confirm') {
    // Your application performs the revoke here. The element never does.
    revokeBearerLink();
  }
  // 'cancel' (Escape, backdrop click, the Keep-link button, or an unset programmatic close)
  // requires no handling — nothing happened, and focus is already back on the invoker.
});
```

Every visible string — the title, the message, and both button labels — must be supplied by your
application. There is no English (or any other) fallback text: an omitted string renders with
nothing substituted for it and logs a development-time warning, so a missing translation is
visible in your own testing rather than silently shipped as English to a non-English locale.

The confirm control is styled with the existing `.sk-button` tone system via `confirm-variant`
(`primary`, `secondary` or `ghost`; omit it for the unstyled base button) — choose the tone
yourself. The element never infers that an action is destructive and never applies a tone on your
behalf.

By default, clicking outside the dialog does nothing — the safest default for a destructive
confirmation is requiring an explicit control activation. Add the `backdrop-dismiss` attribute to
opt in; a backdrop click then resolves `'cancel'`, the same as Escape.

**Do not** use this element to confirm deleting an entire Team — that flow is blocked upstream
(Team Kitty SaaS #1432) and this library refuses to make it look available. Legitimate uses are
membership removal, leaving a team, and bearer-link revocation.

There is no drawer, sheet, toast, undo, nested-dialog, or modal-stack behavior here — one dialog,
two actions, one reported outcome.
