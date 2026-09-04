# Consuming the elements from Vue 3

There is no `@spec-kitty/vue` package, and you do not need one. Vue 3 uses the custom elements
directly. This page is the whole integration.

## What you need

```bash
npm install @spec-kitty/elements @spec-kitty/tokens
```

```js
// main.js — import once, before mounting
import '@spec-kitty/elements';
import '@spec-kitty/tokens/dist/tokens.css';
```

Then use them in a template:

```vue
<template>
  <sk-pill-tag variant="green">Ready</sk-pill-tag>
  <sk-site-footer :legal.prop="legal" />
</template>
```

## The one line of configuration — and exactly when you need it

If you use **Single File Components**, tell the compiler that `sk-*` tags are custom elements:

```js
// vite.config.js
import vue from '@vitejs/plugin-vue';

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('sk-') },
      },
    }),
  ],
};
```

**Why it is needed only for SFCs.** `@vitejs/plugin-vue` compiles your template at *build* time,
when no `CustomElementRegistry` exists — so the compiler cannot know `sk-button` is an element and
emits a component resolution for it. Measured against `@vue/compiler-dom` directly:

| | emitted code |
|---|---|
| without `isCustomElement` | `resolveComponent("sk-button")` |
| with `isCustomElement` | `createElementBlock("sk-button")` |

If you use **string templates with the runtime compiler**, you do not need this at all. Vue 3.5
consults the registry at runtime, so an element that is already registered resolves cleanly. This
was measured rather than assumed:

| tag | registered? | Vue warnings |
|---|---|---|
| `<sk-button>` | yes | **0** |
| `<not-registered-el>` | no | 1 |
| `<NotAThing>` | no | 1 |
| `<blahtag>` | no | 1 |

The discriminator is the registry, not the hyphen — which means the real requirement for the
runtime-compiler path is **import order**: `import '@spec-kitty/elements'` must run before the
template is compiled. If you lazy-load the elements, you are back to needing `isCustomElement`.

## Editor completion and type-checking

Opt in with one reference, in any `.d.ts` in your project:

```ts
/// <reference types="@spec-kitty/elements/vue" />
```

That augments Vue's `GlobalComponents` with all 14 elements and their props, generated from
`custom-elements.json`. It is opt-in rather than automatic because augmenting the `vue` module
unconditionally would force a `vue` dependency on every consumer of `@spec-kitty/elements`,
including the ones using React or no framework at all.

## Binding values

| you want | write | why |
|---|---|---|
| a string | `variant="green"` | attributes take strings; nothing special needed |
| a dynamic string | `:legal="x"` | Vue sets it as an attribute |
| a non-string, or to force the property | `:legal.prop="x"` | `.prop` bypasses the attribute and assigns the DOM property |
| an event | `@sk-change="fn"` | hyphenated custom events work as-is |

`.prop` is the one to reach for when a value is not a string. Our elements reflect simple string
properties to attributes, so both routes work for those — but `.prop` is unambiguous, and it is
what a wrapper package would have existed to do for you.

## What does not work the same as React

`v-model` does not bind to our form elements automatically. Vue's `v-model` on a custom element
expects a `modelValue` prop and an `update:modelValue` event; ours use `value` and `sk-change`.
Write the pair explicitly:

```vue
<sk-form-input :value.prop="text" @sk-change="text = $event.target.value" />
```

## Verified by

`fixtures/vue-consumer/` runs a real Vue render against the built bundle on every PR: elements
upgrade, string attributes pass through, a reactive value reaches a DOM property and stays
reactive, and a hyphenated custom event reaches a Vue handler. The generated types are compiled by
`nx run vue-consumer-fixture:typecheck`, including a `@ts-expect-error` that fails if the prop
unions ever degrade to `any`.
