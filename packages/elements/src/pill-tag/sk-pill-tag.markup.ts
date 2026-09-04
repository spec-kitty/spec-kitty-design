// The AUTHORED markup source for sk-pill-tag (ADR-10 §3).
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL.
//
// TWO RENAMES LANDED HERE, both under the operator ruling on #139:
//
//   .sk-tag*          -> .sk-pill-tag*
//   .sk-eyebrow-pill  -> .sk-pill-tag--eyebrow
//
// The first is the ownership rename the ruling is about. The second is a MODELLING change the
// ruling forced into the open: `.sk-eyebrow-pill` was a second component living in
// packages/styles/src/pill-tag/, exported as its own function, restating the base rule almost
// verbatim and differing only in padding, corner radius and font size. That is a size axis,
// not a component — so it is one now, and it composes with the colour variants rather than
// competing with them.

// The generator's variant table: one static export per entry. Rationale here rather than in
// the doc comment, which is published verbatim to consumers.
/** The tag's colour modifiers. */
export const PILL_TAG_VARIANTS = {
  green: 'sk-pill-tag--green',
  purple: 'sk-pill-tag--purple',
  breaking: 'sk-pill-tag--breaking',
  yellow: 'sk-pill-tag--yellow',
} as const;

export type PillTagVariant = keyof typeof PILL_TAG_VARIANTS;

/** The shape/size axis. Independent of colour: an eyebrow may be tinted or not. */
export const PILL_TAG_SHAPES = { eyebrow: 'sk-pill-tag--eyebrow' } as const;

export type PillTagShape = keyof typeof PILL_TAG_SHAPES;

function isPillTagVariant(v: string): v is PillTagVariant {
  return Object.hasOwn(PILL_TAG_VARIANTS, v);
}

function isPillTagShape(s: string): s is PillTagShape {
  return Object.hasOwn(PILL_TAG_SHAPES, s);
}

const unknownVariantMessage = (v: string): string =>
  `unknown pill-tag variant "${v}" — expected one of ${Object.keys(PILL_TAG_VARIANTS).join(', ')}`;

const unknownShapeMessage = (s: string): string =>
  `unknown pill-tag shape "${s}" — expected one of ${Object.keys(PILL_TAG_SHAPES).join(', ')}`;

// Two callers, two failure policies — warn and degrade on the render path, throw on the
// authoring path.

/** The tag's class list. Warns and degrades on an unknown variant or shape. */
export function pillTagClasses(variant?: string, shape?: string): string {
  if (variant !== undefined && !isPillTagVariant(variant)) {
    console.warn(`sk-pill-tag: ${unknownVariantMessage(variant)} — rendering the base tag.`);
    variant = undefined;
  }
  if (shape !== undefined && !isPillTagShape(shape)) {
    console.warn(`sk-pill-tag: ${unknownShapeMessage(shape)} — rendering the base shape.`);
    shape = undefined;
  }
  return [
    'sk-pill-tag',
    variant ? PILL_TAG_VARIANTS[variant as PillTagVariant] : '',
    shape ? PILL_TAG_SHAPES[shape as PillTagShape] : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export interface PillTagStaticOptions {
  variant?: string;
  shape?: string;
}

/** The static form. Throws on an unknown variant or shape. */
export function pillTagStaticHtml(opts: PillTagStaticOptions = {}, content = 'Label'): string {
  const { variant, shape } = opts;
  if (variant !== undefined && !isPillTagVariant(variant)) throw new Error(unknownVariantMessage(variant));
  if (shape !== undefined && !isPillTagShape(shape)) throw new Error(unknownShapeMessage(shape));
  return `<span class="${pillTagClasses(variant, shape)}">${content}</span>`;
}

// DERIVED, and here that is correct — unlike sk-button, where the equivalent derivation was
// wrong and has been replaced by an explicit table. A pill-tag SHAPE is itself a static form
// worth publishing (the base class paints its own background and ink, so every shape renders
// something), which makes shapes and axes the same set. sk-button's sizes were not: a size on
// its own paints nothing, so deriving axes from sizes published an invisible export.
/** The non-variant axes: one per shape. */
export const PILL_TAG_AXES = Object.fromEntries(
  Object.keys(PILL_TAG_SHAPES).map((s) => [`${s.charAt(0).toUpperCase()}${s.slice(1)}`, { shape: s }]),
) as Record<string, PillTagStaticOptions>;
