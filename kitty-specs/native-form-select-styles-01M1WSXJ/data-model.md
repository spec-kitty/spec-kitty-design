# Data model: Native form-select styles

**Mission:** `native-form-select-styles-01M1WSXJ`

This mission introduces no persisted model, custom-element state, or application state. Its model
is the native light-DOM form structure and the presentation states accepted by two CSS classes.

## Ownership boundary

| Concern | Owner | Carrier |
| --- | --- | --- |
| Label text and association | Consumer | Native `label[for]` and matching select `id` in one root |
| Option and optgroup content/order | Consumer | Real `option`/`optgroup` descendants |
| Selected/default value | Consumer/browser | `selected`, `value`, and native selection state |
| Required/disabled/name/value semantics | Browser | Native select attributes and form algorithms |
| Keyboard choice and typeahead | Browser | Native select interaction |
| Submission and reset | Browser | Native `form`, `FormData`, `requestSubmit()`, and `reset()` |
| Change handler and filter/lane state | Consumer application | Outside this library |
| Field layout, label/help presentation | Existing design system | `.sk-form-field*` |
| Select box presentation | This mission | `.sk-form-select` and `--compact` |
| Theme values | Token package | Inherited authoritative `--sk-*` tokens |
| Validation/help wording | Consumer/browser | Browser validity plus consumer-supplied same-root help |

## NativeFormSelect

The styled control is an actual single-choice `HTMLSelectElement`.

| Field | Carrier | Required | Invariant |
| --- | --- | --- | --- |
| base class | `select.classList` | yes | Includes `.sk-form-select` on the select itself |
| density | class modifier | optional | Only `.sk-form-select--compact`; presentation only |
| id | native `id` | yes in labelled references | Matches exactly one same-root `label[for]` |
| name | native `name` | required for submitted fixtures | Consumer-authored; preserved in `FormData` |
| value | native selection | browser/consumer-owned | Always an authored option value |
| required | native boolean attribute | state-dependent | Empty selected option produces native `valueMissing` |
| disabled | native boolean attribute | state-dependent | Excluded from focus/submission by the browser |
| description | `aria-describedby` | state-dependent | Resolves to supplied help in the same root |
| invalid reference state | native `:invalid` plus optional supplied `aria-invalid` | state-dependent | CSS does not calculate or toggle validity |
| descendants | `option` and optional `optgroup` | one or more options | No wrapper or authored ARIA option state |

The control has no structured options property, event API, timer, network behavior, or responsive
selection state. `multiple` and `size > 1` listbox presentations are not modeled.

## FormFieldComposition

```html
<div class="sk-form-field">
  <label class="sk-form-field__label" for="outcome-filter">Outcome</label>
  <select
    class="sk-form-select sk-form-select--compact"
    id="outcome-filter"
    name="outcome"
    aria-describedby="outcome-filter-help"
  >
    <option value="all">All outcomes</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
  </select>
  <span class="sk-form-field__description" id="outcome-filter-help">
    Filters supplied application data.
  </span>
</div>
```

### Relationship invariants

1. `label.htmlFor === select.id` and both nodes share `getRootNode()`.
2. Every `aria-describedby` token resolves to visible consumer-authored help in that same root.
3. `.sk-form-select` is carried by the native select, never an ancestor wrapper.
4. A select's direct children are native options and/or optgroups; an optgroup's children are
   native options.
5. DOM option order, `select.options` order, value order, and submitted value agree.
6. No CSS or JavaScript invents option text, selection, roles, or filter state.

## NativeOption

| Field | Carrier | Owner | Constraint |
| --- | --- | --- | --- |
| label | text / native `label` | Consumer | Preserved verbatim; long text remains available |
| value | native `value` | Consumer | Submitted by the browser when selected |
| default selection | `selected` attribute | Consumer | Restored by native form reset |
| disabled | native boolean attribute | Consumer/browser | Browser skips interaction as defined by platform |
| accessibility role/state | implicit UA semantics | Browser | No authored `role` or `aria-selected` |

Options receive no `sk-*` class and no CSS selector from this mission. Native popup rendering is
not a design-system surface.

## NativeOptGroup

| Field | Carrier | Owner | Constraint |
| --- | --- | --- | --- |
| group label | native `label` attribute | Consumer | Preserved in DOM/platform UI |
| child options | native option descendants | Consumer/browser | Flatten into `select.options` in source order |
| styling/role | browser-owned | Browser | No custom group role or style contract |

## Presentation states

| Axis | Values | Model effect |
| --- | --- | --- |
| density | default; compact | Changes padding/type density only |
| validity | valid; required-empty invalid | Browser `:invalid`; supplied help/aria reference in exemplar |
| availability | enabled; disabled | Native semantics; CSS must not obscure distinction |
| option structure | flat; optgroups | Native descendants only |
| content length | ordinary; long option | Same DOM contract; logical sizing contains control |
| viewport | ordinary; 320px narrow | Full-width base within consumer container |
| theme | default dark; `.sk-light` | Token values change; DOM/semantics do not |
| user colors | normal; forced colors | Native indicator, focus, invalid boundary remain perceivable |
| recurrence | one T10 lane select; two T12 filters | Same component composed once or twice; no shared library state |

No motion axis exists. No reduced-motion CSS is needed because the component owns no transition or
animation.

## Required-invalid state

```html
<div class="sk-form-field sk-form-field--error">
  <label class="sk-form-field__label" for="required-lane">Lane</label>
  <select
    class="sk-form-select"
    id="required-lane"
    name="lane"
    required
    aria-invalid="true"
    aria-describedby="required-lane-error"
  >
    <option value="" selected>Choose a lane</option>
    <option value="planned">Planned</option>
  </select>
  <span class="sk-form-field__description" id="required-lane-error">
    Choose a lane.
  </span>
</div>
```

The maintained exemplar supplies `aria-invalid` and visible help because it is a static reference.
The actual native invalid condition is `select.validity.valueMissing`. The library never watches
the value, calls validation APIs, or synchronizes ARIA state.

## Relationships and cardinality

```text
Form 0..1
  └─ FormFieldComposition 1..n
       ├─ native Label 1
       ├─ NativeFormSelect 1
       │    ├─ NativeOption 1..n
       │    └─ NativeOptGroup 0..n
       │         └─ NativeOption 1..n
       └─ supplied Description/Error 0..1
```

## Cross-entity negative invariants

1. No `sk-form-select` custom element, element source directory, shadow root, manifest entry,
   generated framework wrapper, element part/docs ratchet, behavior subject, or mutation exists.
2. No custom arrow, popup, listbox, combobox implementation, async search, custom option rendering,
   or multi-select widget exists.
3. No library-owned selected lane, filter state, handler, fetch, route, or responsive state exists.
4. No `option`, `optgroup`, `__indicator`, `__option`, invalid, disabled, narrow, or full-width public
   class expands the two-class surface.
5. No theme selector, raw design value, token fallback, `appearance:none`, or
   `forced-color-adjust:none` is introduced.
6. No transition/animation is added merely to create reduced-motion work.

## Validation mapping

| Model rule | Evidence |
| --- | --- |
| Native direct control | DOM type/root assertions and exact selector inventory |
| Same-root label/help | label click focus plus root ID resolution/accessibility description |
| Browser-owned choice | ArrowDown and unique-prefix typeahead in real browsers |
| Browser-owned form semantics | submitted FormData, requestSubmit blocking, reset, disabled exclusion |
| Native descendants | option/optgroup tag/type/order/value assertions |
| Exact style surface | parsed public selector set equals the two approved classes plus state pseudo-classes |
| Native indicator/focus | source prohibitions, computed `appearance`, focus outline, forced-colors visual |
| Narrow containment | 320px geometry and page scroll-width assertions |
| Theme fidelity | dark-vs-light computed delta with `.sk-light` ancestor |
| Distribution | generated barrel byte drift plus root/subpath resolution |
| Consumer ownership | negative delta/source assertions for state, handlers, routing, fetching, and option generation |
