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
// since `.sk-h4` is not owned by sk-ribbon-card. It is content, so it is slotted.
//
// AND `.sk-h4` IS DEFINED NOWHERE. An earlier version of this comment said slotted nodes "stay
// in the consumer's light DOM, where the global sheet already reaches them" — two pre-merge
// lenses grepped for it and there is no such sheet: `.sk-h4` has no CSS definition anywhere in
// this repo, and tokens.css declares variables only. The class is inert wherever it appears.
// What actually styles the heading is the `.sk-ribbon-card__content h4` rule (and its
// `::slotted()` branch), so dropping the class from the generated artifact changes nothing.
// The conclusion was right; the reason given for it was not.

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

/**
 * The card's class list. Warns and degrades on an unknown variant.
 *
 * `hasRibbon` exists because THE RIBBON OVERLAPS THE CARD'S OWN TITLE. The bar is a fixed 174px
 * whose rotated footprint is 141x141px regardless of how short the label is, so it eats a wedge
 * of the content box that no label-length rule can shrink — measured by hit-testing every glyph
 * of a long title with `elementFromPoint`, it covered 1-3 glyphs at every card width from 280px
 * up, where the old drop-tab (auto-width, outside the card) covered none.
 *
 * Shrinking the ribbon cannot fix it: at the title's first line the band is already ~61px inboard
 * of the content edge, so clearing it that way would leave no ribbon. The content has to reserve
 * the corner instead, which is what real corner-ribbon designs do — hence a modifier, so a card
 * WITHOUT a ribbon keeps its full width and is not indented for a corner nothing occupies.
 */
export function ribbonCardClasses(variant?: string, hasRibbon = false): string {
  if (variant !== undefined && !isRibbonCardVariant(variant)) {
    console.warn(`sk-ribbon-card: ${unknownVariantMessage(variant)} — rendering the plain card.`);
    variant = undefined;
  }
  // eslint-disable-next-line security/detect-object-injection -- narrowed by isRibbonCardVariant above
  const modifier = variant ? RIBBON_CARD_VARIANTS[variant] : '';
  return ['sk-ribbon-card', modifier, hasRibbon ? 'sk-ribbon-card--has-ribbon' : '']
    .filter(Boolean)
    .join(' ');
}

/**
 * The most characters that fit inside the clipped corner — MEASURED BY INK, not by geometry.
 *
 * The bar is centred ON the card's corner and the label is centred IN the bar, so a long label
 * runs past the card edge and is cut by the card's `overflow: hidden`.
 *
 * HOW THIS IS MEASURED, because the obvious way is wrong and was used here once. Taking
 * `getBoundingClientRect()` of the text inside the already-rotated bar returns the AXIS-ALIGNED
 * ENVELOPE of the rotated run, not the run's width; mapping that envelope through the rotation
 * matrix a second time double-transforms it and understates the budget badly. The first version
 * of this constant said 8 characters for exactly that reason. What is measured instead: paint
 * the label, screenshot the card with `overflow: hidden` and again with `overflow: visible`, and
 * count the label pixels that differ. That number IS the clipped ink.
 *
 *   characters:   3    8   10   12   13   14   15   16
 *   ink lost:     0    0    0    0    0    2   26   53
 *
 * So 13 fits and 14 starts to lose ink. Every label this repo ships is inside that.
 *
 * TWO THINGS THIS NUMBER IS RELATIVE TO, both of which the previous version asserted away:
 *  - The FONT. `--sk-font-mono` resolves to a fallback stack; tokens.css records that JetBrains
 *    Mono is not actually loaded. The measured face here advances 8.88px/char, so width is
 *    linear in character count and a count is a fair budget — but a narrower or wider mono on
 *    another platform shifts it. This is a per-platform constant presented as guidance.
 *  - The ROOT FONT SIZE. The bar's height is rem-derived while its width/top/right are px, so
 *    the derivation in sk-ribbon-card.css holds at a 16px root. At 20px the budget falls to ~9.
 *
 * It warns rather than enforcing, which is the right strength for a number with those caveats.
 */
const RIBBON_LABEL_MAX = 13;

const overlongRibbonMessage = (label: string): string =>
  `ribbon label "${label}" is ${label.length} characters; at most ${RIBBON_LABEL_MAX} fit inside ` +
  `the corner at this size and the rest is clipped. Use a shorter badge.`;

/** Warns on BOTH paths — a clipped label is legible-but-wrong, which is what a warning is for.
 *  Never throws (it would take out the whole card mid-render) and never truncates (it would
 *  invent an ellipsis the design does not have). */
export function checkRibbonLabel(label?: string): void {
  if (label !== undefined && label.length > RIBBON_LABEL_MAX) {
    console.warn(`sk-ribbon-card: ${overlongRibbonMessage(label)}`);
  }
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
  // Warns here too — same CSS, same clip.
  checkRibbonLabel(ribbon);
  if (variant !== undefined && !isRibbonCardVariant(variant)) throw new Error(unknownVariantMessage(variant));
  if (accent !== undefined && !isRibbonCardColour(accent)) {
    throw new Error(unknownRibbonMessage(accent));
  }
  const tab = ribbon ? `<div class="${ribbonClasses(accent)}">${ribbon}</div>` : '';
  return (
    `<article class="${ribbonCardClasses(variant, ribbon !== undefined)}">` +
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
  WithRibbon: { ribbon: 'Primary' },
  ...Object.fromEntries(
    RIBBON_CARD_COLOURS.map((c) => [
      `Ribbon${c.charAt(0).toUpperCase()}${c.slice(1)}`,
      { ribbon: 'Primary', accent: c },
    ]),
  ),
} as Record<string, RibbonCardStaticOptions>;
