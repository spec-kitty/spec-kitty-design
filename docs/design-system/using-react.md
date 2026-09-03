# Using the elements from React

**Status:** this page records the answer to #75's SC-305 — *what does a generated wrapper buy
over React 19's native custom-element support?* — and then tells you how to use the result.

## The short answer

**A little, and less than the mission assumed when it started.** Use `@spec-kitty/react` if you
want typed JSX and typed refs. Use the elements directly if you do not; nothing will break.

React 19 scores **16/16 on [Custom Elements Everywhere][cee] for both basic and advanced
interop** — properties, attributes and `onFooEvent` listeners all work natively (verified
2026-09-03; Angular scores the same). So the wrapper was never going to *unblock* anything. The
question was only ever ergonomics, and the honest measurement is below.

[cee]: https://custom-elements-everywhere.com

## What the wrapper actually buys

| | native `<sk-form-input>` | `<SkFormInput>` |
|---|---|---|
| renders, upgrades, reacts to props | yes | yes |
| events reach a handler | yes (`onSkNavPillToggle` works natively in 19) | yes |
| form participation | yes | yes |
| **JSX prop typing** | none — unknown props are silently accepted | **yes** |
| **typed ref to the element** | `useRef<HTMLElement>` and cast | **`useRef<SkFormInputElement>`, no cast** |
| **event `detail` typing** | none | **yes** — `CustomEvent<{ open: boolean }>` |
| SSR / RSC | you write `'use client'` | emitted for you, plus a deferred import |

Two of those rows are the whole value proposition, and both are real: `<SkFormInput required="yes" />`
and `<SkFormInput flavour="strawberry" />` are both compile errors, and
`ref.current.setCustomError('taken')` resolves without a cast. `packages/react/type-tests/`
asserts each with `@ts-expect-error`, which fails if the error ever stops occurring.

### What it does not buy, stated plainly

*(Event `detail` typing was in this list and is not any more. The generated handler now reads
`onSkNavPillToggle?: (event: CustomEvent<{ open: boolean }>) => void`, so `e.detail.open`
resolves with no cast. It was never a limitation of the generator — the generator honours
`events[].type.text` and the analyzer honours `@fires {Type}`; `sk-nav-pill.ts` simply wrote
`@fires` without one. One line of JSDoc. This was the plan's "single sharpest answer to
SC-305", and it turned out to be ours.)*

  Do **not** reach for the generator's `stronglyTypedEvents` option if you meet this again: it
  emits `TypedEvent<SkNavPillElement, E = Event>` — it types `.target` and *downgrades* the
  parameter from `CustomEvent` to `Event`.

- **Nothing at runtime.** The wrapper is a `forwardRef` around `createElement(tag)`. If you are
  not writing TypeScript, it buys you nothing at all and costs you a dependency.

### Two defects found in the generator, and what we do about them

Both were found by running it, not by reading it, and both are patched in
`scripts/build-react-wrappers.mjs` by narrowing the manifest we hand it — never by a denylist.

1. **It wraps declarations that are not elements.** Off the shelf it emits `FormControlBase.d.ts`
   for an abstract class with no tag name. That file imports a symbol `src/index.ts` does not
   export — a type error — and its `.js` emits `React.createElement("undefined", …)`, the
   literal string as a tag name. We drop declarations with no `tagName`; the manifest has six.

2. **It emits read-only getters as settable props.** `error` is `readonly: true` in the manifest
   and its own docstring says *"READ-ONLY, derived from validity — never a settable property"*,
   and the generator emitted `error?: …` anyway, so `<SkFormInput error="boom" />` would have
   typechecked and then assigned to a getter. Its handling is also inconsistent —
   `validationMessage` and `validity` are readonly too and are *not* emitted. We drop `readonly`
   fields. **Read these through the ref**, which is the correct channel.

### The alternative we were told to consider, and why it is not usable here

`@wc-toolkit/react-wrappers`' own README says *"If you are using React v19+, you can now use
custom elements directly without needing wrappers"* and points at **`@wc-toolkit/jsx-types`** —
same maintainer, no runtime, just ambient JSX declarations. On this mission's central question
that alternative could not go unmentioned, so it was measured.

**`@wc-toolkit/jsx-types@1.8.0` does not run on our manifest.** It crashes:

```
SyntaxError: Identifier expected. (2:184)
> 2 | import type { …, SkStub, default, unknownVariantMessage } from "./dist/index.js";
```

`skStubSheet` is a renamed default re-export, so the manifest correctly records
`{ name: "skStubSheet", declaration: { name: "default" } }`. The tool builds its import list
from `declaration.name` rather than `name`, and emits `default` — a reserved word — into a named
import list. Narrowing the manifest first does not help. To be filed upstream.

So the choice was between a wrapper package with two patched defects and an alternative that
does not execute. We shipped the wrapper.

## Using it

```tsx
import { SkFormInput, type SkFormInputElement } from '@spec-kitty/react';

function Field() {
  const ref = useRef<SkFormInputElement>(null);
  return <SkFormInput ref={ref} name="email" label="Email" required />;
}
```

- **Everything in `packages/react/src/` is generated.** Do not hand-edit it: CI regenerates and
  fails on drift, on orphaned files, and on a shrunken output set (`.wrapper-floor` is a
  committed ratchet; the gate refuses a missing or unparseable one rather than reading it as
  no floor).
- **`errorMessage` is deliberately not a prop.** It is Lit `state: true` — the element observes
  no attribute for it — so under the deferred registration below it could never arrive on a
  first render. Set it through `setCustomError()`, the element's own lever, and read it through
  the ref. The manifest used to claim an attribute for it, because the analyzer does not honour
  `state`; `normalise-manifest.mjs` now corrects that at source.
- **Every prop is documented.** There were twenty-two `/** undefined */` blocks; there are now
  none, and the public methods carry descriptions too. Twenty of the twenty-two attributes
  simply had no JSDoc; the other two had it on `FormControlBase`, where the analyzer will not
  propagate a description onto a subclass's attribute. `normalise-manifest.mjs` now does that
  — and once the JSDoc was written it carries **fourteen** of the twenty-two, every inherited
  field on both form elements. So a property is documented once, where it is declared, and
  `check-manifest-content.mjs` refuses a manifest where any of them lost its description. Note the consequence: **base-class JSDoc is consumer-facing API documentation**, so
  keep maintainer rationale in `//`.
- **Public inherited properties are props.** `value`, `label`, `name`, `required`, `disabled`,
  `description` and `invalid` — seven of the eight that come from `FormControlBase` — are all
  settable from JSX. The eighth is `errorMessage`, and it is the exception described above. (An early draft of #75's FR-004 said inherited members must *not* become
  props, which would have shipped a form wrapper with no `value`.)
- **`'use client'` is emitted for you**, and element registration is deferred into a
  `useEffect` — a custom element cannot run in a server render.
- **React is not a dependency of `@spec-kitty/elements`** and must not become one.
