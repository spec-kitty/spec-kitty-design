# Data model: `.sk-progress--indeterminate`

**Mission:** `progress-indeterminate-01M25C78`

**Model kind:** none. This mission adds a modifier to an existing data-free component; it introduces
no domain entity of its own.

**Persistence/migrations:** none.

## Why there is no data model

`sk-progress` is, and remains, a styles-only component (research.md R-01): a `.css` file plus
authored `.html` fixtures, no custom element, no JavaScript, no reactive properties, no events, no
application state. `.sk-progress--indeterminate` adds one root-class modifier and one markup rule
(the `<progress>` element's `value` attribute is omitted); it does not add a data model where #210
had none.

- **No entity.** As with the determinate family, a consumer writes plain HTML directly; there is no
  intermediate shape the library defines or validates for the indeterminate case either.
- **No relationships.** `<label for>`/`<progress id>` remains the only markup relationship, unchanged
  from #210.
- **No validation model.** There is nothing to validate — indeterminate has no `value`/`max` pair to
  be invalid.
- **No state transitions.** #306 explicitly excludes "a transition from indeterminate to
  determinate" as a non-goal. A fixture is indeterminate or determinate; it does not become the
  other.
- **No manifest/React mapping.** Still no element, so still no `custom-elements.json` entry, no
  `::part()`, no behaviour-registry subject, no generated React prop.

## What actually needs documenting instead: the extended markup and attribute contract

```html
<div class="sk-progress sk-progress--indeterminate[ sk-progress--<layout-modifier>]">
  <label class="sk-progress__label" for="<id>">[consumer-authored label text]</label>
  <progress class="sk-progress__bar" id="<id>"></progress>
  <!-- span.sk-progress__meta is OPTIONAL here; if present it must not state a percentage -->
  <span class="sk-progress__meta">[consumer-authored, non-percentage text]</span>
</div>
```

| Part | Element | Attributes a consumer supplies | Notes (indeterminate-specific) |
|---|---|---|---|
| Root | `div.sk-progress.sk-progress--indeterminate` | none | The determinate/indeterminate axis is one modifier class on the root; layout modifiers (`--compact`/`--narrow`) may combine with it, unchanged from #210 (research.md R-02) |
| Label | `label.sk-progress__label` | `for="<id>"`, text content | **Required**, exactly as in the determinate contract — unchanged |
| Control | `progress.sk-progress__bar` | `id="<id>"` — **no `value` attribute**, `max` optional and immaterial | Native `<progress>` with `value` omitted renders and exposes as indeterminate per the HTML spec; the browser derives an implicit `progressbar` role with no numeric `aria-valuenow` (research.md R-02) |
| Meta | `span.sk-progress__meta` | text content, **optional** | Present only when the consumer has non-percentage status text to show (e.g. "Syncing…"); its absence is a supported, tested state (research.md R-03). When present, must never read as `\d+%` — there is no percentage to state |

No modifier changes which children exist or their order beyond `__meta`'s new optionality — the
label and control remain mandatory and first/second in document order, unchanged from #210's
three-flat-children rule.

### The determinate/indeterminate axis is independent of the layout axis

| Combination | Valid? | Notes |
|---|---|---|
| `.sk-progress--indeterminate` alone | Yes | Default (stacked) layout, indeterminate state |
| `.sk-progress--indeterminate.sk-progress--compact` | Yes | Compact layout, indeterminate state |
| `.sk-progress--indeterminate.sk-progress--narrow` | Yes | Narrow layout, indeterminate state |
| No `--indeterminate`, `value`/`max` present | Yes (unchanged) | The existing determinate family, untouched by this mission |

## Fixture matrix (the closest analogue to "instances")

Required by #306's "Required stories and tests" section, extending #210's existing determinate
fixture set (not replacing any of it).

| Fixture | `value` attribute | `__meta` | What it exercises |
|---|---|---|---|
| Indeterminate with label | absent | absent | The minimal required shape: label + valueless `<progress>`, no meta |
| Indeterminate without meta | absent | absent | Same as above, named explicitly per #306's required-stories wording — the absence is itself the tested state |
| Indeterminate with meta | absent | present, non-percentage text | Proves `__meta`'s optional presence does not regress to asserting a percentage |
| Determinate (for comparison) | present | present, percentage text | Re-renders an existing #210 fixture alongside the indeterminate ones so the two are visually and structurally distinguishable in the same story/viewport |
| Narrow (indeterminate) | absent | per above | Combines `--indeterminate` with the existing `--narrow` layout modifier |
| Long label (indeterminate) | absent | per above | Combines `--indeterminate` with a long label string, reusing #210's long-label overflow assertion shape |
| Reduced motion | absent | per above | Animation stopped; track asserted neither empty nor full at the frozen frame |
| Forced colors | absent | per above | Track/fill distinguishable, sampled at more than one point in the animation cycle (research.md R-06) |
| Default (dark) | absent | per above | The library's default (non-`.sk-light`) theme |
| `LightMode` | absent | per above | Required per CLAUDE.md §6; wrapped in `class="sk-light"`, never `data-theme="light"` |

No fixture in this mission introduces a timer, a stepper, task data, completion animation percentage,
or a transition between indeterminate and determinate — all named non-goals in #306.

## Explicitly absent

Unchanged from #210's data-model.md, plus:

- an ARIA attribute of any kind on the indeterminate `<progress>` — no invented ARIA, per #306's
  binding contract;
- a shared activity-cue primitive with `sk-button`/#305 — ruled out in research.md R-00;
- a live region, announcement, or `role="status"` anywhere in this family;
- a JavaScript-driven transition between indeterminate and determinate states.
