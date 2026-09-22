# WP05/T017: how the ADR-10 §5 ↔ ADR-11 collision is resolved

**Chosen:** mandatory `@element <tag>` JSDoc **plus** an analyzer-level assertion,
**not** a CEM plugin that follows the guarded helper.

## Measured, on analyzer 0.11.0, in this repo

Removing `packages/elements/src/define.ts` from the config's `exclude` list:

```
$ npx cem analyze --config packages/elements/custom-elements-manifest.config.mjs
custom-elements-manifest: 1 bogus definition(s) named "tag":
   packages/elements/src/define.ts
$ echo $?
1
```

`cem` exits 1 and writes **no** manifest — the failure is not advisory, and it does
not leave a corrupt artifact behind. With the exclusion in place:

```
packages/elements/src/stub/sk-stub.ts
   class SkStub | tagName = sk-stub | customElement = true
```

## Why not a plugin that follows `define()`

It is the more elegant option and it was rejected on blast radius. A plugin that
resolves the indirection has to re-implement, per call site, the binding analysis
the analyzer declines to do — and it would be **load-bearing for generated code**:
ADR-11 generates the React wrapper from this manifest, and ADR-9 confirmation #2
verifies `::part()` through it. A plugin bug there is silent and lands two missions
downstream as wrong generated components. The JSDoc route puts the tag name in the
element's own source, where it is reviewable next to the class it names.

## What the assertion actually guards

Not "the analyzer got it right" — the exclusion means the analyzer never sees
`define.ts` at all. It guards the **re-inclusion**: a future glob widening, a
config edit, or a second module that calls `customElements.define` directly. That
is a real regression path and it is now loud. It is *not* evidence that some other
element is correctly annotated.

## The residual gap

The manifest carries `tagName` on the *declaration* but **no
`custom-element-definition` export**, because the analyzer still cannot see the
registration. Standard wrapper generators read `declarations[].customElement` +
`tagName`, so ADR-11 is served — but a consumer that keys off the definition export
specifically would find nothing. Worth confirming when #71 actually generates the
wrapper rather than assuming it now.

## What enforces this

- `packages/elements/custom-elements-manifest.config.mjs` — the exclusion and the
  `assert-no-bogus-tag-definition` plugin.
- `packages/elements/src/stub/sk-stub.ts` — the `@element` annotation, with a
  comment saying it is required rather than decorative.
- `.github/workflows/ci-quality.yml` — regenerate + `git diff --exit-code`.
  Verified idempotent, so it will not false-positive.
