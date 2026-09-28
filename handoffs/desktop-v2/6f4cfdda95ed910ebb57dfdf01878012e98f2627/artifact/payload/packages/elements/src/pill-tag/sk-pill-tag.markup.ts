// The AUTHORED markup source for sk-pill-tag (ADR-10 §3).
//
// EVALUATED IN A BARE NODE PROCESS by scripts/build-element-markup.mjs. It may import a LEAF —
// a module with no imports of its own, like status-indicator/status-tones.ts — and may NOT reach
// anything that needs a browser. It was a strict leaf until #216: the generator evaluated it from
// a `data:` URL, which has no module base, so no import resolved at all.
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

// The ONE authored tone list, imported rather than restated (#216, #146, and #302's own precedent
// #177). `status-tones.ts` is a leaf — it imports nothing and needs no DOM — which is exactly what
// the generator can evaluate; `sk-status-indicator.ts` re-exports it for everyone else. Importing
// the ELEMENT here would not work: it reaches `lit` and registers a custom element at module scope.
import { STATUS_TONES, type StatusIndicatorTone } from '../status-indicator/status-tones.js';

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

// THE THIRD, ORTHOGONAL AXIS (#302). `variant` is the brand/decorative axis; `status` is the
// operational one, and #177 made that separation binding for sk-card. Folding the six tones into
// PILL_TAG_VARIANTS would make every brand x status combination unreachable and would fork the
// tone vocabulary into the variant enum — so this is a sibling map, not a fourth variant.
//
// DERIVED, NOT RESTATED — mirroring sk-card.markup.ts's CARD_STATUSES exactly. Adding, removing,
// renaming or reordering a tone in status-tones.ts changes this map, the element, the static HTML
// and the generated template-literal exports in one edit.
//
// THE EQUALITY ASSERTION IS KEPT, not merely implied by the derivation. sk-card.markup.ts's own
// comment records why: the derivation is an EXPRESSION, and nothing gates the expression — a rogue
// entry appended inside the `Object.fromEntries` argument still type-checks, still regenerates,
// and still passes every static gate in this repo. `fixtures/elements-behaviour/src/sk-pill-tag.test.ts`
// holds `Object.keys(PILL_TAG_STATUSES)` equal to `STATUS_TONES`, in order.
/** Status tone → BEM modifier. The tone vocabulary is `sk-status-indicator`'s, not the tag's. */
export const PILL_TAG_STATUSES: Readonly<Record<StatusIndicatorTone, string>> = Object.freeze(
  Object.fromEntries(STATUS_TONES.map((tone) => [tone, `sk-pill-tag--status-${tone}`])),
) as Readonly<Record<StatusIndicatorTone, string>>;

// THE VOCABULARY'S TYPE, not a second one derived from the map above — `Object.fromEntries` widens
// its key type to `string`, so `keyof typeof PILL_TAG_STATUSES` would be `string` and
// `isPillTagStatus` would narrow nothing. Aliasing the imported union keeps narrowing intact while
// adding no second authored list.
export type PillTagStatus = StatusIndicatorTone;

function isPillTagVariant(v: string): v is PillTagVariant {
  return Object.hasOwn(PILL_TAG_VARIANTS, v);
}

function isPillTagShape(s: string): s is PillTagShape {
  return Object.hasOwn(PILL_TAG_SHAPES, s);
}

// `Object.hasOwn`, never `in` — the same prototype-pollution reason sk-card.markup.ts's
// `isCardStatus` records: `in` reaches the prototype chain, so `isPillTagStatus('constructor')`
// would pass and this module also generates server-rendered HTML.
function isPillTagStatus(s: string): s is PillTagStatus {
  return Object.hasOwn(PILL_TAG_STATUSES, s);
}

const unknownVariantMessage = (v: string): string =>
  `unknown pill-tag variant "${v}" — expected one of ${Object.keys(PILL_TAG_VARIANTS).join(', ')}`;

const unknownShapeMessage = (s: string): string =>
  `unknown pill-tag shape "${s}" — expected one of ${Object.keys(PILL_TAG_SHAPES).join(', ')}`;

const unknownStatusMessage = (s: string): string =>
  `unknown pill-tag status "${s}" — expected one of ${Object.keys(PILL_TAG_STATUSES).join(', ')}`;

// Two callers, two failure policies — warn and degrade on the render path, throw on the
// authoring path.

/** The tag's class list. Warns and degrades on an unknown variant, shape or status. */
export function pillTagClasses(variant?: string, shape?: string, status?: string): string {
  if (variant !== undefined && !isPillTagVariant(variant)) {
    console.warn(`sk-pill-tag: ${unknownVariantMessage(variant)} — rendering the base tag.`);
    variant = undefined;
  }
  if (shape !== undefined && !isPillTagShape(shape)) {
    console.warn(`sk-pill-tag: ${unknownShapeMessage(shape)} — rendering the base shape.`);
    shape = undefined;
  }
  // `status &&`, NOT `status !== undefined &&` — mirroring `cardClasses`'s own guard. An
  // attribute present-but-empty (`status=""`) is how a template writes "no status": it must be
  // silently treated as absent, with no warning, rather than as an unknown value.
  if (status && !isPillTagStatus(status)) {
    console.warn(`sk-pill-tag: ${unknownStatusMessage(status)} — rendering the base tag.`);
    status = undefined;
  }
  return [
    'sk-pill-tag',
    variant ? PILL_TAG_VARIANTS[variant as PillTagVariant] : '',
    shape ? PILL_TAG_SHAPES[shape as PillTagShape] : '',
    status ? PILL_TAG_STATUSES[status as PillTagStatus] : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export interface PillTagStaticOptions {
  variant?: string;
  shape?: string;
  status?: string;
}

/** The static form. Throws on an unknown variant, shape or status. */
export function pillTagStaticHtml(opts: PillTagStaticOptions = {}, content = 'Label'): string {
  const { variant, shape, status } = opts;
  if (variant !== undefined && !isPillTagVariant(variant)) throw new Error(unknownVariantMessage(variant));
  if (shape !== undefined && !isPillTagShape(shape)) throw new Error(unknownShapeMessage(shape));
  // TOTAL, unlike the `status &&` guard in `pillTagClasses` above — this is the authoring path,
  // where a bad value must not reach committed output, matching `cardStaticHtml`'s throw/warn
  // split. `status: ''` is not passed by any real caller of this options bag, so there is no
  // absent-vs-unknown ambiguity to preserve here the way there is on the render path.
  if (status !== undefined && !isPillTagStatus(status)) throw new Error(unknownStatusMessage(status));
  return `<span class="${pillTagClasses(variant, shape, status)}">${content}</span>`;
}

// DERIVED, and here that is correct — unlike sk-button, where the equivalent derivation was
// wrong and has been replaced by an explicit table. A pill-tag SHAPE is itself a static form
// worth publishing (the base class paints its own background and ink, so every shape renders
// something), which makes shapes and axes the same set. sk-button's sizes were not: a size on
// its own paints nothing, so deriving axes from sizes published an invisible export.
const SHAPE_AXES: Record<string, PillTagStaticOptions> = Object.fromEntries(
  Object.keys(PILL_TAG_SHAPES).map((s) => [`${s.charAt(0).toUpperCase()}${s.slice(1)}`, { shape: s }]),
);

// STATUS AXES, derived from PILL_TAG_STATUSES exactly the way sk-card.markup.ts's STATUS_AXES is
// derived from CARD_STATUSES — never typed out by hand. This is what makes the generator emit
// `SkPillTagStatusNeutralHTML` … automatically as the tone vocabulary changes.
const STATUS_AXES: Record<string, PillTagStaticOptions> = Object.fromEntries(
  Object.keys(PILL_TAG_STATUSES).map((status) => [
    `Status${status.charAt(0).toUpperCase()}${status.slice(1)}`,
    { status },
  ]),
);

/** The non-variant axes: one per shape, one per status tone. */
export const PILL_TAG_AXES = {
  ...SHAPE_AXES,
  ...STATUS_AXES,
} satisfies Record<string, PillTagStaticOptions>;
