// The AUTHORED markup source for sk-section-banner (ADR-10 §3). The static HTML and the
// styles-layer module are GENERATED from this file; CI fails on drift.
//
// This component's markup was authored THREE times before #77 — sk-section-banner.html,
// index.ts, and the stories — and the three disagreed: the `.html` carried only the neutral
// variant while index.ts carried all three, each with a different hardcoded version label.
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL.

/** The colour variants. `neutral` is the default; the base form is not a distinct look. */
export const SECTION_BANNER_VARIANTS = {
  neutral: 'sk-section-banner--neutral',
  purple: 'sk-section-banner--purple',
  green: 'sk-section-banner--green',
} as const;

export type SectionBannerVariant = keyof typeof SECTION_BANNER_VARIANTS;

// `Object.hasOwn`, matching sk-card.markup.ts:36. `in` reaches the prototype chain.
export function isSectionBannerVariant(variant: string): variant is SectionBannerVariant {
  return Object.hasOwn(SECTION_BANNER_VARIANTS, variant);
}

export const unknownVariantMessage = (variant: string): string =>
  `unknown section-banner variant "${variant}" — expected one of ${Object.keys(
    SECTION_BANNER_VARIANTS,
  ).join(', ')}`;

/**
 * The DEFAULT variant, and the reason there is one.
 *
 * Unlike sk-card, the base `.sk-section-banner` class sets no background and no colour — the
 * variant carries both. A base form with no variant is therefore not a plainer banner, it is
 * an unpainted one, so `neutral` is the default on both paths rather than leaving the
 * generator's base export rendering an invisible banner.
 */
export const DEFAULT_VARIANT: SectionBannerVariant = 'neutral';

// DERIVED from DEFAULT_VARIANT, not written out again.
//
// This was `SECTION_BANNER_VARIANTS.neutral` — a static member access chosen to dodge
// eslint-plugin-security, which reports a computed index even when the key is a module
// constant. That made the default variant TWO constants with no link: DEFAULT_VARIANT fed only
// the warning string, DEFAULT_MODIFIER fed the render, and setting DEFAULT_VARIANT to 'purple'
// would have warned "using purple" while rendering neutral, with nothing red. A split-brain in
// the one file this mission designated as the component's single authority is worse than a
// suppressed lint warning, so the index is restored and the rule disabled on this line with its
// reason: the key is a typed module constant, not input.
// eslint-disable-next-line security/detect-object-injection -- key is a module constant of a literal union type
const DEFAULT_MODIFIER: string = SECTION_BANNER_VARIANTS[DEFAULT_VARIANT];

/** The class list. Warns and degrades to the default variant on an unknown one. */
export function sectionBannerClasses(variant?: string): string {
  if (variant !== undefined && !isSectionBannerVariant(variant)) {
    console.warn(`sk-section-banner: ${unknownVariantMessage(variant)} — using ${DEFAULT_VARIANT}.`);
    variant = undefined;
  }
  // Ternary over the narrowed value rather than a computed index on a variable key — same
  // shape as cardClasses and gridClasses, and it keeps eslint-plugin-security quiet without a
  // disable comment.
  const modifier = variant
    ? SECTION_BANNER_VARIANTS[variant as SectionBannerVariant]
    : DEFAULT_MODIFIER;
  return `sk-section-banner ${modifier}`;
}

export interface SectionBannerStaticOptions {
  variant?: string;
}

/**
 * The static form. Throws on an unknown variant — it runs on the build path, where a bad
 * variant must never reach committed output.
 *
 * `content` is the LABEL TEXT, and it is a placeholder here on purpose. Until #77 the three
 * generated exports each carried a hardcoded version string ("VERSION 1.X — FIRST STABLE
 * RELEASE" and two others), which made the component's own source the place a docsite's
 * content lived — so changing a version number meant editing the component library. The
 * label is the consumer's; only the structure is the component's.
 */
export function sectionBannerStaticHtml(
  opts: SectionBannerStaticOptions = {},
  content = 'Section label',
): string {
  const { variant } = opts;
  if (variant !== undefined && !isSectionBannerVariant(variant)) {
    throw new Error(unknownVariantMessage(variant));
  }
  return (
    `<div class="${sectionBannerClasses(variant)}">` +
    `<span class="sk-section-banner__dot" aria-hidden="true">●</span>` +
    `<span class="sk-section-banner__label">${content}</span>` +
    `</div>`
  );
}

/**
 * No non-variant axes. Declared explicitly rather than omitted — `?? {}` cannot distinguish
 * "this component has none" from "I looked for the wrong export name", which is a defect this
 * generator has already had.
 */
export const SECTION_BANNER_AXES = {} as const;
