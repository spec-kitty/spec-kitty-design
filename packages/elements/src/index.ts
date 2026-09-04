export { define, registeredTags } from './define.js';
export { SkStub } from './stub/sk-stub.js';
export { SkButton } from './button/sk-button.js';
export { SkCard } from './card/sk-card.js';
export { SkNavPill } from './nav-pill/sk-nav-pill.js';
export { SkFormInput } from './form-input/sk-form-input.js';
export { SkFormTextarea } from './form-textarea/sk-form-textarea.js';
export { SkGrid } from './grid/sk-grid.js';
export { SkFeatureCard } from './feature-card/sk-feature-card.js';
export { SkRibbonCard } from './ribbon-card/sk-ribbon-card.js';
export { SkSectionBanner } from './section-banner/sk-section-banner.js';

/**
 * The generated constructed stylesheet, exported so a test can assert PROVENANCE.
 *
 * Asserting `adoptedStyleSheets[0] === Ctor.styles[0]` is a tautology — Lit adopts
 * whatever the class declares, so it holds for any sheet, including a hand-authored one.
 * The real claim is that the adopted sheet is the one generated from
 * @spec-kitty/styles, and that needs this export to be checkable from outside without
 * reaching across a project boundary.
 */
export { default as skStubSheet } from './stub/sk-stub.css.js';

// Same reason, for sk-grid's [SC-014]: the claim is that the adopted sheet is the one
// GENERATED from packages/styles/src/grid/sk-grid.css, and identity against the class's own
// `static styles` would hold for any sheet at all.
export { default as skGridSheet } from './grid/sk-grid.css.js';
export { default as skButtonSheet } from './button/sk-button.css.js';
export { default as skFeatureCardSheet } from './feature-card/sk-feature-card.css.js';
export { default as skRibbonCardSheet } from './ribbon-card/sk-ribbon-card.css.js';
export { default as skSectionBannerSheet } from './section-banner/sk-section-banner.css.js';

// The card's authored markup module, exported so the two failure policies are reachable
// from the behaviour fixture. `cardClasses` is TOTAL (an unknown variant warns and degrades)
// because it runs inside `render()`; `cardStaticHtml` THROWS because it runs on the
// authoring/build path. A split nothing asserts is a split that regresses.
//
// `//`, not `/** */`: a doc comment here would be lifted verbatim into custom-elements.json
// and shown to consumers in IDE hovers.
export {
  CARD_AXES,
  CARD_VARIANTS,
  cardClasses,
  cardStaticHtml,
  isCardVariant,
  type CardVariant,
} from './card/sk-card.markup.js';

// The grid's markup module, exported for the same reason as the card's: the two failure
// policies are only a split if something can reach both. `gridClasses` warns and degrades,
// `gridStaticHtml` throws.
export { gridClasses, gridStaticHtml, type GridGap, type GridVariant } from './grid/sk-grid.markup.js';

// sk-button's markup module. Both class helpers, because tone and size each degrade.
export {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  buttonClasses,
  buttonStaticHtml,
  type ButtonSize,
  type ButtonVariant,
} from './button/sk-button.markup.js';

// sk-feature-card's markup module. Both class helpers are exported because the component has
// TWO independent axes and each has its own degrade path.
export {
  // The maps are exported for the same reason RIBBON_CARD_COLOURS is: the behaviour fixture
  // DERIVES its loops from them, so an accent or variant added without coverage fails instead
  // of passing unobserved. feature-card's test hardcoded its three accents and a `.toBe(3)`
  // until the pre-merge gate caught the asymmetry with its own sibling.
  FEATURE_CARD_ACCENTS,
  FEATURE_CARD_VARIANTS,
  featureCardChipClasses,
  featureCardClasses,
  featureCardStaticHtml,
  type FeatureCardAccent,
  type FeatureCardVariant,
} from './feature-card/sk-feature-card.markup.js';

// sk-ribbon-card's markup module. Both class helpers, because the card and the ribbon each
// have their own degrade path.
export {
  RIBBON_CARD_COLOURS,
  ribbonCardClasses,
  ribbonCardStaticHtml,
  ribbonClasses,
  type RibbonCardColour,
} from './ribbon-card/sk-ribbon-card.markup.js';

// sk-section-banner's markup module, same reason.
//
// ONLY WHAT IS CONSUMED. An earlier revision re-exported the *_VARIANTS, *_AXES and is* names
// for both components — eight symbols with no caller anywhere in the repo. They are not needed
// by the generator, which evaluates the markup module directly from a data: URL and never goes
// through this barrel, nor by the analyzer, which globs source. (sk-card's equivalents are
// re-exported and equally unconsumed; that is inherited, not a precedent worth extending.)
export {
  sectionBannerClasses,
  sectionBannerStaticHtml,
  type SectionBannerVariant,
} from './section-banner/sk-section-banner.markup.js';

