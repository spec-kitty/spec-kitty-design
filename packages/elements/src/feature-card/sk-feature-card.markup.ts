// The AUTHORED markup source for sk-feature-card (ADR-10 §3).
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL.
//
// TWO INDEPENDENT AXES, and which is the "variant" is decided by WHERE THE CLASS LANDS, not by
// which reads better. The generator puts <COMPONENT>_VARIANTS classes on the ROOT, so the
// border modifiers are the variants — they are the card's own classes — and the accent is an
// axis, because it colours the icon chip INSIDE the card rather than the card itself. Getting
// this backwards would emit `class="sk-feature-card sk-feature-card--yellow"`, a class in no
// stylesheet, which is the exact failure build-element-markup.mjs documents at length.

/** Border modifiers — the card's own classes, so these are the variants. */
export const FEATURE_CARD_VARIANTS = {
  'border-yellow': 'sk-feature-card--border-yellow',
  'border-green': 'sk-feature-card--border-green',
  'border-purple': 'sk-feature-card--border-purple',
} as const;

export type FeatureCardVariant = keyof typeof FEATURE_CARD_VARIANTS;

/** Accent colours for the icon chip. An INNER class, not the card's. */
export const FEATURE_CARD_ACCENTS = {
  yellow: 'sk-feature-card__icon-chip--yellow',
  green: 'sk-feature-card__icon-chip--green',
  purple: 'sk-feature-card__icon-chip--purple',
} as const;

export type FeatureCardAccent = keyof typeof FEATURE_CARD_ACCENTS;

export const DEFAULT_ACCENT: FeatureCardAccent = 'yellow';

export function isFeatureCardVariant(v: string): v is FeatureCardVariant {
  return Object.hasOwn(FEATURE_CARD_VARIANTS, v);
}

export function isFeatureCardAccent(a: string): a is FeatureCardAccent {
  return Object.hasOwn(FEATURE_CARD_ACCENTS, a);
}

export const unknownVariantMessage = (v: string): string =>
  `unknown feature-card variant "${v}" — expected one of ${Object.keys(FEATURE_CARD_VARIANTS).join(', ')}`;

export const unknownAccentMessage = (a: string): string =>
  `unknown feature-card accent "${a}" — expected one of ${Object.keys(FEATURE_CARD_ACCENTS).join(', ')}`;

// Two callers, two failure policies — the split sk-card paid for and #77 reproduced once in a
// gap arm. `*Classes` runs inside render(): throwing there makes Lit reject updateComplete and
// the element paints an empty shadow root, silently eating its light-DOM children. It warns and
// degrades. `*StaticHtml` runs on the build path, where a bad value must never reach committed
// output, so it throws.

/** The card's class list. Warns and degrades on an unknown variant. */
export function featureCardClasses(variant?: string): string {
  if (variant !== undefined && !isFeatureCardVariant(variant)) {
    console.warn(`sk-feature-card: ${unknownVariantMessage(variant)} — rendering the plain card.`);
    variant = undefined;
  }
  return ['sk-feature-card', variant ? FEATURE_CARD_VARIANTS[variant as FeatureCardVariant] : '']
    .filter(Boolean)
    .join(' ');
}

/** The icon chip's class list. Warns and degrades to the default accent. */
export function featureCardChipClasses(accent?: string): string {
  if (accent !== undefined && !isFeatureCardAccent(accent)) {
    console.warn(`sk-feature-card: ${unknownAccentMessage(accent)} — using ${DEFAULT_ACCENT}.`);
    accent = undefined;
  }
  const key = (accent ?? DEFAULT_ACCENT) as FeatureCardAccent;
  return `sk-feature-card__icon-chip ${FEATURE_CARD_ACCENTS[key]}`;
}

export interface FeatureCardStaticOptions {
  variant?: string;
  accent?: string;
}

/**
 * A placeholder icon, so the generated `.html` demonstrates the structure it documents.
 *
 * #77 learned this the hard way in the other direction: sk-grid's generated artifact was a
 * single text node, which showed ADR-10 §3's no-JavaScript consumer nothing about the component
 * they were copying. A feature card with an empty chip is the same defect.
 */
const PLACEHOLDER_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';

const PLACEHOLDER_BODY =
  '<h4 class="sk-feature-card__title">Feature title</h4>' +
  '<p class="sk-feature-card__body">What this feature does for the reader.</p>';

/** The static form. Throws on an unknown variant or accent. */
export function featureCardStaticHtml(
  opts: FeatureCardStaticOptions = {},
  content = PLACEHOLDER_BODY,
  icon = PLACEHOLDER_ICON,
): string {
  const { variant, accent } = opts;
  if (variant !== undefined && !isFeatureCardVariant(variant)) throw new Error(unknownVariantMessage(variant));
  if (accent !== undefined && !isFeatureCardAccent(accent)) throw new Error(unknownAccentMessage(accent));
  return (
    `<article class="${featureCardClasses(variant)}">` +
    `<div class="${featureCardChipClasses(accent)}">${icon}</div>` +
    content +
    `</article>`
  );
}

/**
 * The accent axes, DERIVED from FEATURE_CARD_ACCENTS.
 *
 * Hand-listing a subset here is the defect #77's gate pass found in sk-grid: add an accent and
 * the element gains it while the static consumers silently do not, with `--check` green,
 * because the generator emits exactly what this module declares and cannot know it
 * under-declared. Deriving closes that by construction.
 */
export const FEATURE_CARD_AXES = Object.fromEntries(
  Object.keys(FEATURE_CARD_ACCENTS).map((a) => [
    a.charAt(0).toUpperCase() + a.slice(1),
    { accent: a },
  ]),
) as Record<string, FeatureCardStaticOptions>;
