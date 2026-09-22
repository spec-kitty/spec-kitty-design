---
affected_files: []
cycle_number: 1
mission_slug: copy-field-element-01M1Y3QH
reproduction_command:
reviewed_at: '2026-09-07T17:10:22Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — cycle 1

Reviewed lane commit: `63f0ee23304c7a07e133ec87b6e82b8e2976430e`

Verdict: **REJECT**

## Issue 1 — HIGH: the first-render live region is absent from the accessibility tree

`packages/styles/src/copy-field/sk-copy-field.css:49-51` applies `display: none` to the empty
status node. In Chromium, the initial story reports `display: "none"`, zero client rects, no
offset parent, and this accessibility snapshot:

```text
- code: npm run quality:all
- button "Copy value": Copy
```

There is no `status` node in the accessibility tree until result text and visibility change
together. That defeats FR-010/NFR-002 and the #178 stable-live-region rule even though the DOM
element identity itself is stable. Axe does not detect this timing/exposure defect.

Remove the rendered-tree suppression from the empty status node (an empty inline element does not
need `display:none`) and add an accessibility-tree assertion that the polite atomic status exists
before activation and retains the same DOM identity after an outcome.

## Issue 2 — HIGH: a stale rejected attempt mutates the new value, and manual fallback runs twice

`packages/elements/src/copy-field/sk-copy-field.ts:219-225` attempts selection before checking the
captured revision/value, then repeats `#selectVisibleValue()` after finishing a successful manual
fallback. A browser probe starting a write for `old`, changing the field to `new value`, and then
rejecting the old write produced:

```json
{"outcomes":["failed"],"status":"","activePart":"value","selected":"new value","visible":"new value"}
```

The late attempt therefore steals focus and selects a different value from its snapshot, contrary
to the plan's attempt invariant requiring snapshot/revision verification before selection. A
current-value manual fallback also called both `removeAllRanges` and `addRange` twice, contrary to
the planned maximum of one selection attempt per activation.

Check snapshot/revision before touching focus or selection. A stale clipboard failure may complete
truthfully as `failed`, but it must not focus/select the changed field or restore status. Retain the
verified first selection instead of repeating it. Add ordinary browser tests for stale rejection
focus/selection isolation and exactly one fallback selection attempt.

## Issue 3 — MEDIUM: an omitted label does not warn

FR-003 and the public contract require missing/blank label text to warn and fail open. The initial
`#label = DEFAULT_LABEL` means an omitted label resolves as valid, so the default story emits no
warning. Existing coverage tests only a blank string.

Track whether the consumer supplied a meaningful label separately from the fallback value, warn
once for the omitted case as well as invalid transitions, and add omitted-label/property-before-
upgrade coverage without blanking the control or value.

## Issue 4 — MEDIUM: the required Active story is not an active-state proof

`packages/elements/src/copy-field/sk-copy-field.stories.ts:86-90` dispatches an untrusted
`PointerEvent('pointerdown')`. Synthetic dispatch does not establish the UA `:active` state. The
built story returned `button.matches(':active') === false`, so the addressable Active story is
mislabelled and non-deterministic acceptance evidence.

Drive a real held pointer activation through the Storybook interaction surface or the browser
spec, and assert the native button is actually `:active` while captured. Do not add a simulated
production state class.

## Issue 5 — MEDIUM: the required registration mutation arm is missing

T005/NFR-007 require a meaningful duplicate-registration arm. The fixture tests `define()` but
`sk-copy-field` is not registered as an SC-015 subject and `mutations.json` has no SC-015 arm for
this element. The committed copy-field subjects/arms cover SC-006/007/008/010/012/013/014 only.

Register the applicable SC-015 subject and add a surgical mutation that proves the new module's
guarded registration/duplicate behavior goes red. Re-run the changed-scope mutation set at the
final reviewed SHA. Also add ordinary regression coverage for Issues 1-4; mutation completion was
not used as a substitute for these observed defects.

## Issue 6 — MEDIUM: consumer-facing Storybook documentation is incomplete

`packages/elements/src/copy-field/sk-copy-field.stories.ts:53-65` publishes only a one-sentence
component description. T004 requires consumer docs for inputs, event, parts, exactness, manual
fallback, the JavaScript-only/no-static-form boundary, non-goals, and the exact authored `--sk-*`
token dependencies. Some pieces exist in generated API metadata, but the Storybook component
description omits the JavaScript boundary and token list and does not provide the requested
consumer contract in one discoverable place.

Expand the Storybook docs description with the required concise contract and keep its token list
byte-for-byte aligned with the authored stylesheet/JSDoc.

## Anti-pattern checklist

1. Dead code: **PASS** — element, sheet, exports, stories, fixtures, and generated consumers have
   live production/distribution call sites.
2. Synthetic-fixture test: **PASS** — FR tests invoke the element path; the React-created event
   specifically exercises the generated wrapper listener and is mutation-bound to that path.
3. Silent empty return: **PASS** — the empty-string return is the specified no-operation guard;
   caught selection failures map explicitly to `failed`.
4. FR coverage: **FAIL** — missing-label warning, first-render accessible status, stale-rejection
   focus isolation, one-selection behavior, and a truthful Active state are not covered.
5. Frozen surface: **PASS** — no Dossier files changed and its aggregate remains
   `80b45a56bfd679b46481c9f464dbdf79ba0db28f23cd5578c3a341f0f9bcffb4`.
6. Locked decision: **FAIL** — fallback selection occurs before the required revision/snapshot
   guard, and omitted labels do not follow the contract's MUST-warn behavior.
7. Shared-file ownership: **N/A** — `lanes.json` assigns only WP01 to lane-a.
8. Production fragility: **N/A** — the diff adds no production `raise`/throw path.

## Passing evidence retained

- Focused Chromium Vitest: 16/16 passed.
- Dedicated Chromium/Firefox Playwright: 16/16 passed.
- Storybook build: passed in 14.47s; axe: zero violations across 354 rendered stories.
- Generator freshness, manifest, entries, CSS boundaries/hygiene, parts, fixture-import and theme
  checks: passed.
- Typecheck and `quality:all`: passed (warnings only in pre-existing files).
- Mutation harness guard selftests: 10/10 passed; baseline reported 428 assertions and 127 registry
  pairs before the guard probes.

The deliberately absent local visual PNGs are not a finding; repository CI remains authoritative.
The full mutation run still remains required at the final rebased SHA, independently of this
rejection.
