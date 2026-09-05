# Consuming the elements from Vue 3

There is no `@spec-kitty/vue` package, and you do not need one. Vue 3 uses the custom elements
directly, including `v-model`. This page is the whole integration.

**Every claim in *Binding values*, *Events* and the compile tables is asserted in
`fixtures/vue-consumer/` or `tests/node/vue-sfc-compile.test.ts`, and runs on every PR.** An earlier
revision documented a `v-model` limitation that does not exist and a `@sk-change` event that no
element fires; both were written from reasoning rather than measurement, and both were wrong.

The **Install** notes are *not* covered by a test — they are checked against the packages' own
`exports` and `peerDependencies`, by hand. Two lenses caught an earlier version of this paragraph
claiming blanket coverage, on the page whose whole subject is unverified claims. Two of the four
rows in the warning table below are asserted in the fixture; the other two were one-off probes, and
the table says which.

## Install

```bash
npm install @spec-kitty/elements @spec-kitty/tokens @spec-kitty/styles lit
```

`lit` and the two sibling packages are declared peers of `@spec-kitty/elements`. npm ≥7 installs
peers for you, so `npm i @spec-kitty/elements` alone appears to work — under pnpm (strict by
default), yarn, or `--legacy-peer-deps`, `lit` is left unmet and the elements fail to construct.

```js
// main.js — import once, before mounting
import '@spec-kitty/elements';
import '@spec-kitty/tokens';
```

`@spec-kitty/tokens` resolves to `dist/tokens.css` through its root export. Do **not** write
`@spec-kitty/tokens/dist/tokens.css` — that subpath is not in the package's `exports` and any
resolver that honours `exports` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## The one line of configuration

If you use **Single File Components** — the default and dominant way to write Vue — tell the
compiler that `sk-*` tags are custom elements:

```js
// vite.config.js
import vue from '@vitejs/plugin-vue';

export default {
  plugins: [
    vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('sk-') } } }),
  ],
};
```

**Why.** `@vitejs/plugin-vue` compiles your template at *build* time, when no `CustomElementRegistry`
exists, so the compiler cannot know `sk-button` is an element. Asserted against `@vue/compiler-dom`:

| | emitted code |
|---|---|
| without `isCustomElement` | `resolveComponent("sk-button")` |
| with `isCustomElement` | `createElementBlock("sk-button")` |

### The runtime-compiler exception, and its condition

If you compile templates *at runtime*, Vue's full build defaults `isCustomElement` to
`tag => !!customElements.get(tag)` (since Vue 3.3), so a **registered** element resolves cleanly with
no configuration:

| tag | registered | Vue warnings | |
|---|---|---|---|
| `<sk-button>` | yes | **0** | asserted in the fixture |
| `<sk-not-a-real-element>` | no | 1 | asserted in the fixture |
| `<NotAThing>` | no | 1 | one-off probe |
| `<blahtag>` | no | 1 | one-off probe |

The discriminator is the registry, not the hyphen — so on this path the requirement is **import
order**: `import '@spec-kitty/elements'` must run before the template is compiled.

**This path is not the default and most projects are not on it.** `vue`'s `exports` resolve to
`vue.runtime.esm-bundler.js`, which has no compiler; reaching it needs an explicit alias:

```js
resolve: { alias: { vue: 'vue/dist/vue.esm-bundler.js' } }
```

If you have not set that, you are on the SFC path and you need `isCustomElement`.

## Binding values

```vue
<template>
  <sk-pill-tag variant="green">Ready</sk-pill-tag>
  <sk-site-footer :legal="legal" />
  <sk-form-input v-model="text" name="email" label="Email" />
</template>
```

**`v-model` works**, in both directions. For a tag the compiler knows is a custom element, Vue emits
`vModelText`, which drives the `value` **property** and listens for `input` — and our form elements
satisfy both. Measured: typing updates the ref, and assigning the ref updates the inner control.

**A plain `:` binding sets the DOM property, not the attribute.** Vue's `shouldSetAsProp` ends
`return key in el`, and an upgraded Lit element declares an accessor for every property — so
`:legal="x"` takes the property route. The attribute appears too, but that is *our element
reflecting* it, not Vue setting it.

| you want | write |
|---|---|
| a static string | `variant="green"` |
| a dynamic value on an **upgraded** element | `:legal="x"` — takes the property route |
| to force the property route regardless | `:legal.prop="x"` |
| two-way binding on a form element | `v-model="text"` |
| an event | `@input`, or `@sk-nav-pill-toggle` for the element's own |

`.prop` matters when the element may **not be upgraded yet** — `key in el` is false before upgrade,
so Vue would fall back to setting an attribute. If you import the elements before mounting, the
plain `:` form is enough.

## Events

Our elements dispatch **one** custom event: `sk-nav-pill-toggle`, from `sk-nav-pill`. Everything
else you will listen for is native.

Form input does **not** emit a custom event. The inner `<input>`'s native `input` event is
`composed`, so it crosses the shadow boundary and `$event.target` retargets to the host, whose
`value` the element has already synced:

```vue
<sk-form-input :value="text" @input="text = $event.target.value" />
```

or simply use `v-model`, which does exactly this for you.

## Editor completion and type-checking

Opt in with one reference, in any `.d.ts` in your project:

```ts
/// <reference types="@spec-kitty/elements/vue" />
```

That augments Vue's `GlobalComponents` with all 14 elements and their props, generated from
`custom-elements.json`. It is opt-in rather than automatic because augmenting the `vue` module
unconditionally would force a `vue` dependency on every consumer of `@spec-kitty/elements`,
including the ones using React or no framework.

**Known gap:** the generated types cover props, not events. `@sk-nav-pill-toggle` is untyped.

## Verified by

`fixtures/vue-consumer/` runs a real Vue render against the elements on every PR — upgrade, plain
`:` binding taking the property route, `.prop` reactivity, `v-model` in both directions, the real
`sk-nav-pill-toggle` event, `@input` retargeting from `sk-form-input`, and the warning matrix above.
`tests/node/vue-sfc-compile.test.ts` asserts the two compile paths. The generated types are compiled
by `nx run vue-consumer-fixture:typecheck`, including a `@ts-expect-error` that fails if the prop
unions ever degrade to `any`.
