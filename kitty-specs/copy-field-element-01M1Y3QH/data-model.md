# Data model: `sk-copy-field`

This mission introduces no application or persisted data model. The following is the complete
in-element interaction model.

## Public inputs

| Field | Type | Default | Rule |
|---|---|---|---|
| `value` | `string` | `''` | Single source for visible and attempted clipboard text; copied byte-for-byte as a JavaScript string. |
| `label` | `string` | generic documented label | Accessible name for the native button; blank/missing warns and fails open to the generic name. |
| `successMessage` / `success-message` | `string` | documented generic success text | Shown only after the copy mechanism fulfills; blank/whitespace-only input uses the default. |
| `manualMessage` / `manual-message` | `string` | documented manual instruction | Shown after the visible value is focused and fully selected; blank/whitespace-only input uses the default. |
| `failureMessage` / `failure-message` | `string` | documented generic failure text | Shown only when neither clipboard nor selection fallback succeeds; blank/whitespace-only input uses the default. |

## Internal state

| Field | Type | Lifecycle |
|---|---|---|
| `outcome` | `'copied' | 'manual' | 'failed' | undefined` | Empty initially and whenever `value` changes; set once per completed attempt. |
| `statusText` | `string` | Mirrors the message selected for the current outcome; rendered in one stable polite region. |
| `valueRevision` | `number` | Advances synchronously for every actual `value` change, including changes batched before render; a pending attempt may update status only for its captured revision. |

## Result event

```ts
type CopyFieldOutcome = 'copied' | 'manual' | 'failed';

interface SkCopyFieldResultDetail {
  readonly outcome: CopyFieldOutcome;
}
```

The event is named `sk-copy-field-result`, bubbles, crosses the shadow boundary, is not cancelable,
fires exactly once per non-empty attempt, and never includes `value` or any alternate text field.

## State transitions

```text
empty value -> unavailable control, empty stable status, no event
non-empty value + fulfilled Clipboard.writeText -> copied
non-empty value + unavailable/rejected clipboard + successful visible selection -> manual
non-empty value + unavailable/rejected clipboard + failed visible selection -> failed
any outcome + value change -> no outcome, empty stable status
overlapping same-revision attempts -> each emits once; whichever settles most recently owns status
```

No timer, retry counter, queue, permission state, clipboard history, analytics state, or
application/domain state exists.
