# Public contract: `sk-confirm-dialog`

Finalized during implementation (WP01, #308). This contract fixes the shape, the no-defaults
rule, and the single reporting mechanism.

## Inputs

| Property | Attribute | Type | Default | Required |
|---|---|---|---|---|
| `dialogTitle` | `dialog-title` | `string` | **none** | Yes — omitting it warns and renders no substituted text (FR-001, FR-017) |
| `message` | `message` | `string` | **none** | Yes — same as above |
| `confirmLabel` | `confirm-label` | `string` | **none** | Yes — same as above |
| `cancelLabel` | `cancel-label` | `string` | **none** | Yes — same as above |
| `confirmVariant` | `confirm-variant` | `'primary' \| 'secondary' \| 'ghost' \| undefined` | **none** (renders the unstyled base `.sk-button`) | No — a style choice, not user-visible copy, so it is exempt from the no-defaults rule (FR-004) |
| `initialFocus` | `initial-focus` | `'confirm' \| 'cancel'` | `'cancel'` | No — this is a behavioral safe-default (FR-008), not user-visible copy, so it is exempt from the no-defaults rule |
| `backdropDismiss` | `backdrop-dismiss` | `boolean` (reflected) | `false` | No — the safest default for a destructive confirmation is to require an explicit control activation; a consumer opts in to backdrop dismissal explicitly |
| `open` | `open` | `boolean` (reflected, read-mostly) | `false` | No — mirrors the native `<dialog>`'s real open/closed state (ADR-11 SC-005); a consumer should not assign it directly |

**No property in this table other than `confirmVariant`, `initialFocus`, `backdropDismiss` and
`open` may ever carry a fallback value that renders as literal text.** This is the sharpest, most
heavily reviewed line in issue #308: "No user-visible literal enters `render()`."

## Opening and closing

- The consumer opens the dialog by calling the element's own public `showModal(invoker?)` method,
  which also records the invoker (or `document.activeElement`, if omitted) for FR-009's focus
  return and resets `returnValue` to `'cancel'` before opening (FR-007). The rendered `<dialog>`
  itself remains reachable at `shadowRoot.querySelector('[part="dialog"]')`, the same node
  `::part(dialog)` targets from outside, for a consumer who prefers to call its native
  `showModal()`/`close()` directly. The platform supplies focus trapping, page inertness, and
  top-layer stacking either way (FR-013).
- The consumer never calls a "confirm" or "cancel" method on the element itself to force an
  outcome — the element performs no action; it only reports what the user did (FR-005).

## Outcome — one mechanism, not two

```ts
// The element renders and manages an internal <dialog>. On close, read:
dialogEl.returnValue; // 'confirm' | 'cancel'
```

The dialog's native `close` event is the single, documented reporting mechanism (FR-006). There is
no second, competing custom event for outcome reporting. Every path below resolves the same
`returnValue`:

| Path | `returnValue` |
|---|---|
| Confirm control activated (pointer or keyboard) | `'confirm'` |
| Cancel control activated | `'cancel'` |
| Escape key | `'cancel'` |
| Backdrop dismissal (if enabled) | `'cancel'` |
| Programmatic close with no explicit outcome supplied | `'cancel'` (never invented as `'confirm'`) |

Focus returns to the element that invoked the dialog on every path above (FR-009).

## Parts and semantics

Six declared `::part()`s, each present unconditionally and targetable from outside:

- `dialog` — the native `<dialog>` itself; the root surface.
- `title` — the heading node; its text is the dialog's accessible name (`aria-labelledby`).
- `body` — the message region; its text is the dialog's accessible description
  (`aria-describedby`); scrolls independently when content overflows (FR-010).
- `actions` — the footer row holding the cancel and confirm controls; never scrolls.
- `cancel` — the cancel control.
- `confirm` — the confirm control. Composes the existing `.sk-button` contract; **the consumer
  supplies its tone** via `confirm-variant` (e.g., a destructive red vs. a neutral tone) — the
  element never infers or applies one itself (FR-004).

## What this element does NOT do

No mutation, request, or navigation (FR-005). No modal framework, service, stack, or manager
(C-002). No drawers, sheets, non-modal dialogs, nested dialogs, toasts, or snackbars (C-003). No
copy defaults, no destructive-action vocabulary (C-004). No undo, no in-dialog form validation
(C-005). No Team, membership, invitation, bearer-link, or session model (FR-015) — and in
particular, no story, exemplar, doc, or fixture in this mission ever presents whole-Team deletion
as an available flow (FR-014); the legitimate destructive exemplars are membership removal, leave,
and bearer-link revoke.

## Static form

This element has no server-rendered static twin for its *interactive* behavior — `showModal()` has
no static equivalent, the same shape as `sk-notice` (#178). Whether its **stylesheet** additionally
needs a generated static twin for a consumer-rendered `<dialog>` is explicitly deferred to open
issue #301's ruling (FR-016) and is not decided by this contract.
