# Implementation Plan: A markup module imports the one vocabulary, and two records stop disagreeing

**Mission**: `markup-vocabulary-import-and-ratchet-corrections-01M1WBVC`
**Branch**: `mission/markup-vocabulary-import-and-ratchet-corrections`
**Closes**: #216, #219, #220
**Base**: `train/elements-first@1f95a35`

## 1. Measurement first — what the tree does today

Measured in this clone before any edit:

| measurement | result |
|---|---|
| `node --version` | `v22.22.2`; CI pins `node-version: '22'` in all five workflows |
| `import(pathToFileURL('…/sk-card.markup.ts').href)` | **succeeds** — Node ≥22.18 strips types natively, so a real module URL already loads a `*.markup.ts` |
| same, with `import '../status-indicator/sk-status-indicator.js'` added | `ERR_MODULE_NOT_FOUND` — Node does **not** remap a `.js` specifier onto the `.ts` source that exists |
| `import('…/sk-status-indicator.ts')` in Node | fails: `Cannot find package 'lit'`, and `define.ts` touches `customElements` at module scope |
| `module.registerHooks` | present (`function`) — the synchronous, in-thread hook API, Node ≥22.15 |
| markup sources | 21 `packages/elements/src/*/sk-*.markup.ts` |
| `sk-notice` | imports `STATUS_TONES` **already** (`sk-notice.ts:4`); authors no `*.markup.ts`; carries no restated tone list and no parity test |
| `expected-stories.json` | 160 ids, prefixes `elements` and `primitives` only; `components-card--statuses-greyscale` absent |
| `components-card--statuses-greyscale` | `packages/styles/src/card/sk-card-html.stories.ts`, `title: 'Components/Card'`, `export const StatusesGreyscale` |
| implementation-evidence files in `kitty-specs/` | exactly one (`card-status-tone-axis-01M1VJNY`), and it is the only one citing a styles-layer story as acceptance evidence |

Three facts follow, and they set the whole shape of the fix:

1. **The operator's diff is right, and it is not sufficient on its own.** `pathToFileURL(markupPath)`
   loads the module, but the first relative import written the way this repo writes every import
   (`./x.js` over an `x.ts` source) does not resolve.
2. **The vocabulary cannot be imported from the element.** `sk-status-indicator.ts` reaches `lit`
   and, through `define.js`, `customElements` at module scope. Any generator that evaluates a
   markup module which imports it dies. The importable thing must be a **leaf**.
3. **`sk-notice` needs no conversion.** The #216 ruling's sequencing note anticipated converting
   both; the measurement says only `sk-card` restates.

## 2. Architecture of the fix (#216)

### 2.1 The generator evaluates the authored source

`scripts/build-element-markup.mjs` replaces

```js
mod = await import(`data:text/javascript,${encodeURIComponent(js)}`);
```

with `await import(pathToFileURL(src).href)`, and installs two synchronous `module.registerHooks`
hooks once, at module scope, before the loop:

- **`resolve`** — for a relative specifier ending `.js` whose target does not exist on disk, retarget
  to the sibling `.ts` when that does. This is the NodeNext source convention the whole repository
  is written in, and nothing else changes: a specifier that resolves normally is passed straight to
  `nextResolve`.
- **`load`** — for any `file:` URL ending `.ts`, return `esbuild.transformSync(…, { loader: 'ts' })`.

The `load` hook is why esbuild stays. Node's own type stripping would also work here, but it is
erasable-syntax-only and version-gated on the runner's Node minor; esbuild is **pinned** in
`package.json` (`0.28.1`), already the transformer this file uses, and the file's own comment
records why hand-stripping types is not an option. Keeping it means the change is to *where a module
is evaluated*, not to *what understands the language* — the smallest change that discharges the
ruling.

### 2.2 The failure stays named

The `data:`-URL leaf-module error is replaced, not deleted. The new message names the markup file,
the first line of the underlying error, and the real remaining constraint: a `*.markup.ts` may
import a **leaf vocabulary module** — one with no imports of its own — and may not reach a module
that needs a browser (`lit`, anything registering a custom element). That is a weaker and truer
constraint than "no relative imports", and it is the one a reader now hits.

This is verified red-first with a scratch markup module carrying an unresolvable import, which is
removed once the message is recorded.

### 2.3 The vocabulary becomes a leaf

New `packages/elements/src/status-indicator/status-tones.ts`: the `StatusIndicatorTone` union and
the frozen `STATUS_TONES` array, moved verbatim, with **no imports**.
`sk-status-indicator.ts` imports them and re-exports both, so `packages/elements/src/index.ts`, the
behaviour fixtures, the stories and `sk-notice` are untouched and the package's public surface does
not move.

### 2.4 `sk-card` consumes it

```ts
import { STATUS_TONES, type StatusIndicatorTone } from '../status-indicator/status-tones.js';

export const CARD_STATUSES: Readonly<Record<StatusIndicatorTone, string>> = Object.freeze(
  Object.fromEntries(STATUS_TONES.map((t) => [t, `sk-card--status-${t}`])),
) as Readonly<Record<StatusIndicatorTone, string>>;

export type CardStatus = StatusIndicatorTone;
```

`CardStatus` stays a real union rather than widening to `string`, so `isCardStatus`'s type predicate
and every consumer of the type keep their narrowing. `STATUS_AXES` already derives from
`Object.keys(CARD_STATUSES)` and needs no change — which is the point: the derivation chain was
already there, and only its root was a copy.

### 2.5 The parity test goes

`fixtures/elements-behaviour/src/sk-card.test.ts`'s order-sensitive
`Object.keys(CARD_STATUSES) === [...STATUS_TONES]` case is **removed**, and the reason is recorded
where it was: the map is now a derivation, so the assertion cannot fail for the reason it was
written. The second half of that test — every modifier is this block's BEM family — is **kept**,
moved to stand on its own: it constrains the template literal, which the derivation does not.

### 2.6 What this does not fix

`scripts/build-vue-types.mjs` copies an attribute's manifest `type.text` verbatim into
`packages/elements/vue.d.ts`, and that file imports nothing for attribute types (its
`x-spec-kitty-property-only` branch does emit an `import('…')` type, but attributes do not go through
it). So `sk-card.ts`'s `declare status:` line must still spell the union inline. This is measured,
recorded against NFR-002, and **not** forced: closing it is a change to a second generator's emit
strategy, which is nobody's ruling yet.

## 3. `#219` — one id, and the principle written down

Add `components-card--statuses-greyscale` to `expected-stories.json` under a `card (static)` key in
`byElement`, bump `total` 160 → 161, and extend `$comment` with: what the scope is now (the elements
plus any styles-layer story a mission has named as acceptance evidence), why this id (it is the
static half of #177's own stated proof that a tone is never the sole carrier of meaning, and the
static path is the no-JavaScript consumer ADR-10 §3 exists to serve), and the standing principle —
**a story cited as proof is ratcheted in the same commit that cites it**.

Deliberately **not** the whole `packages/styles` catalogue: #219 raises that as an open question and
it is a larger scope decision. The sweep that bounds this narrow scope is recorded in §1: exactly
one `implementation-evidence.md` exists in `kitty-specs/`, and it cites exactly one styles-layer
story.

## 4. `#220` — the doc moves, the artifact does not

`docs/contributing/adding-a-token.md`'s category table gains a row per real prefix
(`--sk-status-` under `status`, `--sk-on-*` under `on`) instead of one row spanning both, plus a
short paragraph stating the convention: the catalogue bins by prefix, so `--sk-on-*` is one
category regardless of what each token pairs with — which is why `--sk-on-tint-*` sits away from
`--sk-surface-tint-*` too — and a semantic pair therefore spans two categories. The pairing rule
already at the foot of the file is pointed at from there.

The alternative — binning by pair — changes a published artifact that stylelint and the docs site
consume, and #220 lists it as the "real fix" precisely because it is not free. Per the mission
brief, that belongs to the operator; this mission takes option 2 and says so.

## 5. Order of work

1. **WP01** — the generator, the leaf vocabulary module, `sk-card`'s conversion, the parity test.
   Regenerate all markup cache-free; prove byte-identity; run the behaviour fixture.
2. **WP02** — `expected-stories.json` (#219).
3. **WP03** — `docs/contributing/adding-a-token.md` (#220).

WP02 and WP03 are independent of WP01 and of each other. They are separated because they touch
disjoint files and carry disjoint evidence, not because they need sequencing.

## 6. Risks

| risk | mitigation |
|---|---|
| A loader hook changes evaluation for modules the generator did not intend to touch. | The hooks are installed in the generator process only, and both are narrowly conditioned: `resolve` fires only for a relative `.js` specifier with no file behind it and a `.ts` sibling; `load` fires only for a `file:` URL ending `.ts`. Everything else falls through to `nextResolve`/`nextLoad`. |
| Byte-identity is asserted from a cached run. | Regenerate with the cache off, and prove it with `git status --short packages/styles` plus a full `--check`. |
| The removed parity test was load-bearing for something else. | Its second assertion (BEM family per tone) is kept. The full behaviour fixture is run before and after and the test counts compared. |
| The train moves under the mission. | Re-fetch `train/elements-first` before finishing; rebase rather than merge; never hand-merge a generated artifact — regenerate it. |
| `expected-stories.json`'s `total` and its lists disagree. | `run-axe-storybook.js` fails closed on exactly that; the built index is checked for the new id rather than assumed. |
