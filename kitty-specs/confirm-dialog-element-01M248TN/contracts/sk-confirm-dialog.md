# Public contract: `sk-confirm-dialog`

Exact attribute names, the backdrop-dismissal toggle's default, and the final `::part()` set are
finalized during `/spec-kitty.tasks` and implementation (see research.md's "Open questions carried
into tasks"). This contract fixes what is **not** negotiable: the shape, the no-defaults rule, and
the single reporting mechanism.

## Inputs

| Property | Attribute | Type | Default | Required |
|---|---|---|---|---|
| `dialogTitle` | `dialog-title` | `string` | **none** | Yes — omitting it warns and renders no substituted text (FR-001, FR-017) |
| `message` | `message` | `string` | **none** | Yes — same as above |
| `confirmLabel` | `confirm-label` | `string` | **none** | Yes — same as above |
| `cancelLabel` | `cancel-label` | `string` | **none** | Yes — same as above |
| `initialFocus` | `initial-focus` | `'confirm' \| 'cancel'` | `'cancel'` | No — this is a behavioral safe-default (FR-008), not user-visible copy, so it is exempt from the no-defaults rule |
| a backdrop-dismissal toggle | *(name finalized in tasks)* | `boolean` | *(finalized in tasks)* | No |

**No property in this table other than `initialFocus` and the backdrop-dismissal toggle may ever
carry a fallback value that renders as literal text.** This is the sharpest, most heavily reviewed
line in issue #308: "No user-visible literal enters `render()`."

## Opening and closing

- The consumer opens the dialog by calling the underlying native `showModal()` behavior (exposed
  however the element chooses to expose it — as a public method or by consumer access to the
  rendered `<dialog>` via a part — finalized in tasks). The platform then supplies focus trapping,
  page inertness, and top-layer stacking (FR-013).
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

## Parts and semantics (illustrative — finalized in tasks)

- A root dialog surface part.
- A title/heading part (accessible name source).
- A body part (accessible description source; scrolls when content overflows, FR-010).
- An actions part containing the confirm and cancel controls.
- The confirm control composes the existing `.sk-button` contract; **the consumer supplies its
  tone** (e.g., a destructive red vs. a neutral tone) — the element never infers or applies one
  (FR-004).

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
