/**
 * The tone vocabulary, authored ONCE and importable by anything (#146, #216).
 *
 * `STATUS_TONES` used to live in `sk-status-indicator.ts` beside the element. That was fine for
 * every consumer that runs in a browser and impossible for the one that does not:
 * `scripts/build-element-markup.mjs` evaluates each `*.markup.ts` in a bare Node process, and
 * `sk-status-indicator.ts` reaches `lit` and — through `define.js` — patches
 * `customElements.define` at module scope. Importing it there dies before the vocabulary is read.
 *
 * So the vocabulary is a LEAF: this file imports nothing, and nothing it exports needs a DOM.
 * `sk-status-indicator.ts` re-exports both names unchanged, so the package barrel, the fixtures,
 * the stories and every existing consumer are untouched — the move is invisible from outside.
 *
 * That is the whole of what #216 needed on this side. The generator half is in
 * `scripts/build-element-markup.mjs`: a markup module may now import a leaf like this one, which
 * is why `sk-card.markup.ts` derives its status map instead of restating six strings and pinning
 * them with an assertion nothing forced the next component to copy.
 *
 * KEEP THIS FILE A LEAF — and that is now ENFORCED, not requested. `build-element-markup.mjs`
 * reads this file's import list from esbuild's metafile before it evaluates anything and exits
 * non-zero, naming THIS file, if the list is not empty.
 *
 * The check exists because the request alone did not hold. Measured on the first round of this
 * change: `import { css } from 'lit'` here left `--check` green and exit 0 — some browser-facing
 * modules survive evaluation in Node by accident — and `import '../define.js'` did fail, but with
 * `customElements is not defined` reported against `sk-card.markup.ts`, which is not the file that
 * gained the import, on whichever unrelated PR touched a markup module next.
 */
export type StatusIndicatorTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'attention'
  | 'danger'
  | 'recovery';

// FROZEN, and not only for hygiene: the generator imports this array into a process that then
// evaluates ten markup modules in sequence, so a mutable export would let one component's
// evaluation change another's output.
//
// `//`, not `/** */`: a doc comment above an export is lifted verbatim into custom-elements.json.
/** The tone vocabulary, in presentation order. */
export const STATUS_TONES: ReadonlyArray<StatusIndicatorTone> = Object.freeze([
  'neutral',
  'info',
  'success',
  'attention',
  'danger',
  'recovery',
]);
