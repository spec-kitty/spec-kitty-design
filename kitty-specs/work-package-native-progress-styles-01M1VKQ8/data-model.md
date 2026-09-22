# Data model: Native progress styles

**Mission:** `work-package-native-progress-styles-01M1VKQ8`

**Model kind:** none. This mission has no domain entities.

**Persistence/migrations:** none.

## Why there is no data model

`sk-progress` is a styles-only component: a `.css` file plus a fixed set of authored `.html`
fixtures, with no custom element, no JavaScript, no reactive properties, no events, and no
application state (see [`research.md`](./research.md), R-01). A data model documents entities,
attributes, relationships, validation, and state transitions that a component owns and evolves at
runtime. There is nothing here that fits that description:

- **No entity.** The component has no object, record, or structured input a consumer constructs and
  hands to it. A consumer writes plain HTML attribute values (`value="5"`, `max="8"`) directly into
  markup it authors itself; there is no intermediate shape the library defines, validates, or
  transforms.
- **No relationships.** There is nothing to relate — no collection, no parent/child data structure,
  no id-keyed join the way, for example, `flow-health-transition-matrix`'s columns and routes are
  joined by stable id. `<label for>`/`<progress id>` is a **markup** relationship (documented below),
  not a data relationship.
- **No validation model.** #210 states plainly that "invalid negative/over-max domain data remains
  consumer validation" — the library performs none. There is no validity rule this component enforces
  or could enforce, since it has no code path a value ever passes through.
- **No state transitions.** A static `<progress value="5" max="8">` does not transition between
  states under this component's own logic; if a consumer's own script later changes `value` on an
  existing element, that is the consumer's runtime behaviour, entirely outside this library's
  markup/CSS surface.
- **No manifest/React mapping.** There is no element, so there is no `custom-elements.json` entry, no
  `::part()`, no property-only marker, and no generated React prop for this component at all —
  contrast every element-backed mission's data-model.md, which ends with exactly this section.

Deviating from the data-model template's entity/relationship/validation/state-transition sections by
omitting them (rather than inventing placeholder entities to fill them) is the deliberate, instructed
choice for this mission: a styles-only, data-free component should say so plainly rather than force a
model onto markup that carries none.

## What actually needs documenting instead: the markup and attribute contract

The closest analogue to a "model" here is the fixed markup shape every fixture instantiates. This is
a documentation contract, not a data model — there is no code enforcing it beyond CSS selectors and
the stylelint/htmlhint gates already run against every static fixture in this repository.

```html
<div class="sk-progress[ sk-progress--<modifier>]">
  <label class="sk-progress__label" for="<id>">[consumer-authored label text]</label>
  <progress class="sk-progress__bar" id="<id>" value="<number>" max="<number>">[fallback text]</progress>
  <span class="sk-progress__meta">[consumer-authored visible metadata text]</span>
</div>
```

| Part | Element | Attributes a consumer supplies | Notes |
|---|---|---|---|
| Root | `div.sk-progress` | none | Carries layout modifier classes (R-07); no ARIA role — it is a plain grouping box |
| Label | `label.sk-progress__label` | `for="<id>"`, text content | Programmatically associates with the control by native `for`/`id`; text is entirely consumer-owned copy |
| Control | `progress.sk-progress__bar` | `id="<id>"`, `value`, `max`, fallback text content | Native `<progress>`; browser derives role `progressbar` and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` from `value`/`max`/(implicit `min=0`) with no author ARIA needed (research.md R-03, R-04) |
| Meta | `span.sk-progress__meta` | text content | Visible, styled duplicate of the same numerator/denominator the control's `value`/`max` express, for sighted users; not an ARIA-visible duplicate of the control's own accessible name (research.md R-04) |

`<id>` is any value unique within the rendering document; fixtures use a descriptive id per state
(e.g. `mission-progress` in the T10 worked example from #210's own issue body) rather than a fixed
literal, since multiple fixtures render on one Storybook/story page.

### Layout modifiers (R-07)

| Modifier | Effect | Markup shape |
|---|---|---|
| (none / default) | Stacked or inline per base rules | Same three children, same order |
| `sk-progress--compact` | Compact/inline arrangement | Same three children, same order — CSS layout only |
| `sk-progress--narrow` | Stacked arrangement for narrow viewports | Same three children, same order — CSS layout only |

No modifier changes which children exist, their order, or their attributes — only their CSS layout
(research.md R-07).

## Fixture matrix (the closest analogue to "instances")

Required by #210's "Required stories and tests" section. Each row is a static `.html` fixture under
`packages/styles/src/progress/`, generated into the barrel by `build-styles-only-markup.mjs` — none
of them is derived from another at build time; each is authored directly, the same way `facts` and
`disclosure`'s per-state fixtures are today.

| Fixture | `value`/`max` | What it exercises |
|---|---|---|
| Zero | `value="0"` | Empty/zero-progress rendering; fill is visually absent, track remains visible |
| T10 5/8 | `value="5" max="8"` | #210's own worked example — "5 of 8 Work Packages done", "63%" |
| Complete | `value="<max>" max="<max>"` | Full-bar rendering; fill reaches 100% |
| Large total | large `value`/`max` (e.g. thousands) | Layout does not break with large numeral text in the label/meta |
| Long label | long label string | Label wrapping/truncation behaviour at normal and narrow widths |
| Compact | `sk-progress--compact` modifier | Inline arrangement, same native structure |
| Narrow | `sk-progress--narrow` modifier | Stacked arrangement at narrow viewport width |
| Forced colors | any determinate value | `forced-colors: active` legibility — track border, fill override (research.md R-05) |
| Default (dark) | any determinate value | The library's default (non-`.sk-light`) theme |
| `LightMode` | any determinate value | Required per CLAUDE.md §6 / the component recipe; wrapped in `class="sk-light"` |

No fixture carries indeterminate state, a timer, a stepper, task data, completion animation, or
status-tone colour coding — all named non-goals in #210.

## Explicitly absent

The following are not entities, properties, events, or hidden state in this "model," because this
component has none of them:

- a JavaScript class, reactive property, or public method of any kind;
- an event of any kind;
- a manifest entry, `::part()`, or generated React prop;
- application state, timers, or completion-percentage computation;
- validation logic for negative or over-max values — a consumer's responsibility per #210;
- Team Kitty domain vocabulary (mission ids, work-package counts as typed data, claim/heartbeat
  state) — the fixtures use plain numbers and strings, never a typed domain object.
