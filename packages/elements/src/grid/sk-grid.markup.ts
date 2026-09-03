// The AUTHORED markup source for sk-grid (ADR-10 §3). The static HTML and the styles-layer
// module are GENERATED from this file by scripts/build-element-markup.mjs, and CI fails on
// drift — so this is the only place the class list is written.
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL, which has
// no module base.

/** The column-count modifiers this primitive supports, as variant name → BEM modifier. */
export const GRID_VARIANTS = {
  'cols-2': 'sk-grid--cols-2',
  'cols-3': 'sk-grid--cols-3',
  'cols-4': 'sk-grid--cols-4',
} as const;

export type GridVariant = keyof typeof GRID_VARIANTS;

/** The gap modifiers, which are an axis rather than a variant — a grid has a column count AND
 *  a gap, not one or the other. */
export const GRID_GAPS = {
  3: 'sk-grid--gap-3',
  4: 'sk-grid--gap-4',
  6: 'sk-grid--gap-6',
} as const;

export type GridGap = keyof typeof GRID_GAPS;

// `Object.hasOwn`, never `in` and never a truthiness test on the lookup. Both of the obvious
// spellings reach the PROTOTYPE CHAIN: `'constructor' in GRID_GAPS` is true, and
// `GRID_GAPS['constructor']` is a function — which `gridClasses` would then push into the class
// list, emitting `class="sk-grid function Object() { [native code] }"`. sk-card paid for
// exactly this once; the first draft of this file reproduced it in the gap arm, which the
// variant arm had already been written to avoid.
//
// `Object.hasOwn` is the built-in and is what sk-card.markup.ts:36 already uses — an earlier
// draft here hand-rolled a local `owns` wrapper around hasOwnProperty.call, which was a third
// spelling of one predicate for no reason. ES2022 is in tsconfig.base.json's lib.
export function isGridVariant(variant: string): variant is GridVariant {
  return Object.hasOwn(GRID_VARIANTS, variant);
}

export function isGridGap(gap: unknown): gap is GridGap {
  return (
    (typeof gap === 'number' || typeof gap === 'string') && Object.hasOwn(GRID_GAPS, gap)
  );
}

export const unknownVariantMessage = (variant: string): string =>
  `unknown grid variant "${variant}" — expected one of ${Object.keys(GRID_VARIANTS).join(', ')}`;

export const unknownGapMessage = (gap: unknown): string =>
  `unknown grid gap "${String(gap)}" — expected one of ${Object.keys(GRID_GAPS).join(', ')}`;

// TWO CALLERS, TWO FAILURE POLICIES, and collapsing them is the regression sk-card records.
//
// `gridClasses` runs on the RENDER path in a browser. Throwing there means Lit rejects
// `updateComplete`, `render()` never returns a tree, and the element paints an empty shadow
// root with no `<slot>` — silently eating its own light-DOM children. So it warns and degrades
// to the base grid.
//
// `gridStaticHtml` runs on the AUTHORING path at build time, where a bad variant must never
// reach committed output. So it throws.

/** The BEM class list for a grid. Warns and degrades on an unknown variant or gap. */
export function gridClasses(variant?: string, gap?: number): string {
  // Narrow first, then index — the same shape as cardClasses, and it keeps the indexing out
  // of a call argument where eslint-plugin-security reports an injection sink.
  if (variant !== undefined && !isGridVariant(variant)) {
    console.warn(`sk-grid: ${unknownVariantMessage(variant)} — rendering the base grid.`);
    variant = undefined;
  }
  if (gap !== undefined && !isGridGap(gap)) {
    console.warn(`sk-grid: ${unknownGapMessage(gap)} — using the default.`);
    gap = undefined;
  }
  return [
    'sk-grid',
    variant ? GRID_VARIANTS[variant as GridVariant] : '',
    gap !== undefined ? GRID_GAPS[gap as GridGap] : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export interface GridStaticOptions {
  variant?: string;
  gap?: number;
}

/** The static form, for a consumer with no JavaScript. Throws on an unknown variant. */
/**
 * The placeholder CHILDREN, not a text node.
 *
 * ADR-10 §3 keeps the static `.html` for the Django/Jekyll/Hugo consumer who renders without
 * JavaScript. A three-column grid rendered as one text node shows that consumer nothing about
 * the component they are copying — the exports this replaced each carried three or four child
 * divs. The default is children again, so the artifact demonstrates the layout it documents.
 */
const PLACEHOLDER_ITEMS = ['Grid item 1', 'Grid item 2', 'Grid item 3']
  .map((t) => `<div>${t}</div>`)
  .join('');

export function gridStaticHtml(
  opts: GridStaticOptions = {},
  content = PLACEHOLDER_ITEMS,
): string {
  const { variant, gap } = opts;
  if (variant !== undefined && !isGridVariant(variant)) {
    throw new Error(unknownVariantMessage(variant));
  }
  if (gap !== undefined && !isGridGap(gap)) {
    throw new Error(unknownGapMessage(gap));
  }
  return `<div class="${gridClasses(variant, gap)}">${content}</div>`;
}

/**
 * The non-variant axes — DERIVED from GRID_GAPS, not hand-listed.
 *
 * Required by the generator even when empty: `?? {}` cannot distinguish "this component has no
 * axes" from "I looked for the wrong export name".
 *
 * It was `{ Gap3: { gap: 3 }, Gap6: { gap: 6 } }` — a hand-maintained subset of GRID_GAPS, one
 * file over from the hardcoded variant table `build-element-markup.mjs` documents at length as
 * the reason `forms` is derived. Adding a gap to GRID_GAPS would have given the ELEMENT the new
 * gap while the static consumers silently did not get an export, with `--check` green, because
 * the generator emits exactly what this module declares and cannot know it under-declared.
 * Deriving it closes the other half of that class.
 *
 * Gap4 is now emitted too, and that is correct rather than noise: `.sk-grid--gap-4` is the
 * default gap restated, so a consumer pinning it explicitly is a real thing to express.
 */
export const GRID_AXES = Object.fromEntries(
  Object.keys(GRID_GAPS).map((g) => [`Gap${g}`, { gap: Number(g) }]),
) as Record<string, GridStaticOptions>;
