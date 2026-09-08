# Public contract: `sk-copy-field`

## Inputs

| Property | Attribute | Type | Default |
|---|---|---|---|
| `value` | `value` | `string` | `''` |
| `label` | `label` | `string` | `Copy value` |
| `successMessage` | `success-message` | `string` | `Value copied.` |
| `manualMessage` | `manual-message` | `string` | `Value selected. Use your system copy shortcut to copy it.` |
| `failureMessage` | `failure-message` | `string` | `Unable to copy or select the value.` |

`value` is rendered through Lit text interpolation and is supplied unchanged to the asynchronous
Clipboard API. Missing or blank `label` warns and uses the generic default. Message properties
control only the stable result region; empty or whitespace-only messages fail open to their
applicable defaults.

## Event

```ts
export type CopyFieldOutcome = 'copied' | 'manual' | 'failed';

export interface SkCopyFieldResultDetail {
  readonly outcome: CopyFieldOutcome;
}
```

`sk-copy-field-result` is emitted exactly once after each non-empty activation reaches a terminal
result. It bubbles, is composed, and is non-cancelable. Its detail is a frozen object with exactly
one `outcome` key and never contains the field value. Overlapping attempts each emit once; visible
status follows completion order. A result captured before any actual value change may still emit
truthfully for its attempt but cannot relabel the changed field, even after an A→B→A batch.

## Parts and semantics

- `field`: immediate bordered value/action/status composition.
- `value`: visible non-editable `<code tabindex="-1">`; programmatic focus/selection target.
- `copy-control`: the sole sequential focus target for non-empty values, a native `type="button"`;
  it is disabled and absent from sequential navigation for the empty value.
- `status`: one stable `role="status"`, polite and atomic from first render.

The field uses its value/action columns above `20rem` of available host inline size. When its host
container is `20rem` wide or less, it reflows to one column and end-aligns the same native button,
independently of the page viewport, so enlarged text and narrow compositions keep both the exact
value and action reachable without horizontal clipping.

There are no slots, public methods, form association, static markup form, timers, retries, command
execution, validation, global notifications, telemetry, or application/domain behavior.
