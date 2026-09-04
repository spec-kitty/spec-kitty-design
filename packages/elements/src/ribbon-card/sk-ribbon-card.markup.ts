// The AUTHORED markup source for sk-ribbon-card (ADR-10 §3).
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL.
//
// TWO COLOUR AXES over the SAME five colours, on two different nodes: the border is the card's
// own class and is therefore the generator's variant; the ribbon's colour is an axis, because
// it lands on the ribbon inside. Both derive from one COLOURS list so they cannot drift apart
// — adding a colour to one and not the other is the hand-maintained-subset defect #77 found in
// sk-grid's axes.
//
// THE TITLE IS NOT HERE. The static form carried `<h4 class="sk-h4">`, a typography utility
// from another package's sheet. Inside a shadow root that class reaches nothing, and putting it
// in this component's adopted sheet is rejected by check-adopted-css-boundaries.mjs — correctly,
// since `.sk-h4` is not owned by sk-ribbon-card. It is content, so it is slotted: slotted nodes
// stay in the consumer's light DOM, where the global sheet already reaches them.

/** The five brand colours both axes draw on. */
export const RIBBON_CARD_COLOURS = ['yellow', 'green', 'purple', 'blue', 'red'] as const;

export type RibbonCardColour = (typeof RIBBON_CARD_COLOURS)[number];

/** Border modifiers — the card's own classes, so these are the variants. */
export const RIBBON_CARD_VARIANTS = Object.fromEntries(
  RIBBON_CARD_COLOURS.map((c) => [`border-${c}`, `sk-ribbon-card--border-${c}`]),
) as Record<string, string>;

/** Ribbon colour modifiers — an INNER class, so an axis rather than a variant. */
export const RIBBON_CARD_RIBBONS = Object.fromEntries(
  RIBBON_CARD_COLOURS.map((c) => [c, `sk-ribbon-card__ribbon--${c}`]),
) as Record<string, string>;

export const DEFAULT_RIBBON: RibbonCardColour = 'yellow';

export function isRibbonCardVariant(v: string): boolean {
  return Object.hasOwn(RIBBON_CARD_VARIANTS, v);
}

export function isRibbonCardColour(c: string): c is RibbonCardColour {
  return Object.hasOwn(RIBBON_CARD_RIBBONS, c);
}

export const unknownVariantMessage = (v: string): string =>
  `unknown ribbon-card variant "${v}" — expected one of ${Object.keys(RIBBON_CARD_VARIANTS).join(', ')}`;

export const unknownRibbonMessage = (c: string): string =>
  `unknown ribbon colour "${c}" — expected one of ${RIBBON_CARD_COLOURS.join(', ')}`;

// Two callers, two failure policies — warn-and-degrade on the render path, throw on the
// authoring path. Collapsing them is the regression sk-card recorded and #77 reproduced once.

/** The card's class list. Warns and degrades on an unknown variant. */
export function ribbonCardClasses(variant?: string): string {
  if (variant !== undefined && !isRibbonCardVariant(variant)) {
    console.warn(`sk-ribbon-card: ${unknownVariantMessage(variant)} — rendering the plain card.`);
    variant = undefined;
  }
  // eslint-disable-next-line security/detect-object-injection -- narrowed by isRibbonCardVariant above
  const modifier = variant ? RIBBON_CARD_VARIANTS[variant] : '';
  return ['sk-ribbon-card', modifier].filter(Boolean).join(' ');
}

/** The ribbon's class list. Warns and degrades to the default colour. */
export function ribbonClasses(colour?: string): string {
  if (colour !== undefined && !isRibbonCardColour(colour)) {
    console.warn(`sk-ribbon-card: ${unknownRibbonMessage(colour)} — using ${DEFAULT_RIBBON}.`);
    colour = undefined;
  }
  return `sk-ribbon-card__ribbon ${RIBBON_CARD_RIBBONS[colour ?? DEFAULT_RIBBON]}`;
}

export interface RibbonCardStaticOptions {
  variant?: string;
  /** The ribbon's label. THE RIBBON IS RENDERED ONLY WHEN THIS IS SET — an empty ribbon is a
   *  coloured tab with no text, which reads as a rendering bug rather than a plain card. */
  ribbon?: string;
  accent?: string;
}

const PLACEHOLDER_CONTENT =
  '<h4>Card title</h4><p>What this card is offering the reader.</p>';

/** The static form. Throws on an unknown variant or ribbon colour. */
export function ribbonCardStaticHtml(
  opts: RibbonCardStaticOptions = {},
  content = PLACEHOLDER_CONTENT,
): string {
  const { variant, ribbon, accent } = opts;
  if (variant !== undefined && !isRibbonCardVariant(variant)) throw new Error(unknownVariantMessage(variant));
  if (accent !== undefined && !isRibbonCardColour(accent)) {
    throw new Error(unknownRibbonMessage(accent));
  }
  const tab = ribbon ? `<div class="${ribbonClasses(accent)}">${ribbon}</div>` : '';
  return (
    `<article class="${ribbonCardClasses(variant)}">` +
    tab +
    `<div class="sk-ribbon-card__content">${content}</div>` +
    `</article>`
  );
}

/**
 * The non-variant axes, DERIVED.
 *
 * `WithRibbon` reproduces the export name the styles layer already published, and the per-colour
 * ribbon forms are derived from RIBBON_CARD_COLOURS so a sixth colour cannot appear on one axis
 * and not the other.
 */
export const RIBBON_CARD_AXES = {
  WithRibbon: { ribbon: 'Primary Workshop' },
  ...Object.fromEntries(
    RIBBON_CARD_COLOURS.map((c) => [
      `Ribbon${c.charAt(0).toUpperCase()}${c.slice(1)}`,
      { ribbon: 'Primary Workshop', accent: c },
    ]),
  ),
} as Record<string, RibbonCardStaticOptions>;
