# Decision Moment `01M24913K9HVQR703BFYV2Y9FG`

- **Mission:** `confirm-dialog-element-01M248TN`
- **Origin flow:** `specify`
- **Slot key:** `specify.contract.reporting-mechanism`
- **Input key:** `reporting_mechanism`
- **Status:** `resolved`
- **Created:** `2026-09-09T23:46:10.153904+00:00`
- **Resolved:** `2026-09-09T23:46:23.322563+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

Which single mechanism should sk-confirm-dialog use to report confirm/cancel: the native <dialog> close event with returnValue, or a named custom event?

## Options

- native close + returnValue
- named custom event

## Final answer

native close + returnValue: the element funnels every dismissal path (Escape, backdrop click, confirm click, cancel click, programmatic close()) through HTMLDialogElement.close(returnValue), so the platform's own 'close' event is the single observation point; returnValue is 'confirm' or 'cancel'. This avoids adding a second, redundant custom-event contract and keeps the published surface (manifest, ratchets) minimal, per #308's 'chosen and documented explicitly, not half-supported' requirement.

## Rationale

_(none)_

## Change log

- `2026-09-09T23:46:10.153904+00:00` — opened
- `2026-09-09T23:46:23.322563+00:00` — resolved (final_answer="native close + returnValue: the element funnels every dismissal path (Escape, backdrop click, confirm click, cancel click, programmatic close()) through HTMLDialogElement.close(returnValue), so the platform's own 'close' event is the single observation point; returnValue is 'confirm' or 'cancel'. This avoids adding a second, redundant custom-event contract and keeps the published surface (manifest, ratchets) minimal, per #308's 'chosen and documented explicitly, not half-supported' requirement.")
