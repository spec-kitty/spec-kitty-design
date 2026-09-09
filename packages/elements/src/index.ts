export { define, registeredTags } from './define.js';
export {
  SkCopyField,
  type CopyFieldOutcome,
  type SkCopyFieldResultDetail,
} from './copy-field/sk-copy-field.js';
export { SkActionRow, type ActionRowActivateDetail } from './action-row/sk-action-row.js';
export {
  SkBarChart,
  type BarChartSelectDetail,
  type BarDatum,
  type BarSeries,
} from './bar-chart/sk-bar-chart.js';
export {
  SkTimeSeriesChart,
  type TimeSeriesChartSelectDetail,
  type TimeSeriesDatum,
  type TimeSeriesPoint,
  type TimeSeriesResolution,
} from './time-series-chart/sk-time-series-chart.js';
export { SkStub } from './stub/sk-stub.js';
export { SkBlogCard } from './blog-card/sk-blog-card.js';
export { SkButton } from './button/sk-button.js';
export { SkCard } from './card/sk-card.js';
export { SkCheckBullet } from './check-bullet/sk-check-bullet.js';
export { SkNavPill } from './nav-pill/sk-nav-pill.js';
export { SkFormInput } from './form-input/sk-form-input.js';
export { SkFormTextarea } from './form-textarea/sk-form-textarea.js';
export { SkGrid } from './grid/sk-grid.js';
export { SkFeatureCard } from './feature-card/sk-feature-card.js';
export { SkRibbonCard } from './ribbon-card/sk-ribbon-card.js';
export { SkPillTag } from './pill-tag/sk-pill-tag.js';
export { SkSectionBanner } from './section-banner/sk-section-banner.js';
export { SkSiteFooter } from './site-footer/sk-site-footer.js';
export {
  SkAppShell,
  type SkAppShellDismissDetail,
  type SkAppShellPresentation,
} from './app-shell/sk-app-shell.js';
export { SkPersonalRail } from './personal-rail/sk-personal-rail.js';
export { SkContextSidebar } from './context-sidebar/sk-context-sidebar.js';
export { SkPageHeader } from './page-header/sk-page-header.js';
export { SkSectionHeader } from './section-header/sk-section-header.js';
// STATUS_TONES is the library's ONE authored tone list (#146, exported at #177). Since #216 it is
// authored in `status-indicator/status-tones.ts`, a LEAF with no imports, and re-exported by the
// element — so `sk-card.markup.ts`, which the markup generator evaluates in a bare Node process,
// can consume it directly. This line is unchanged by that move on purpose: consumers outside the
// package see the same two names in the same place they always did.
export {
  SkStatusIndicator,
  STATUS_TONES,
  type StatusIndicatorTone,
} from './status-indicator/sk-status-indicator.js';
export { SkEntityMarker } from './entity-marker/sk-entity-marker.js';
export { SkMetric } from './metric/sk-metric.js';
export {
  SkEvidenceChain,
  type EvidenceStage,
} from './evidence-chain/sk-evidence-chain.js';
// sk-notice (#178) CONSUMES the tone vocabulary above rather than restating it — it imports
// STATUS_TONES directly, which it could even before #216 because it authors no `*.markup.ts`
// (there is no static form for an announcement-bearing element to have) and so never met the
// data:-URL constraint #216 closed. It needed no conversion when that landed; `sk-card` did.
// `NOTICE_ANNOUNCEMENTS` is its own, separate axis: politeness, not tone.
export {
  SkNotice,
  NOTICE_ANNOUNCEMENTS,
  type NoticeAnnounce,
  type SkNoticeDismissDetail,
} from './notice/sk-notice.js';

export {
  SkTransitionMatrix,
  type TransitionColumn,
  type TransitionMatrixProperties,
  type TransitionMatrixSelectDetail,
  type TransitionRoute,
  type TransitionTone,
} from './transition-matrix/sk-transition-matrix.js';

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
export { default as skActionRowSheet } from './action-row/sk-action-row.css.js';
export { default as skBarChartSheet } from './bar-chart/sk-bar-chart.css.js';
export { default as skTimeSeriesChartSheet } from './time-series-chart/sk-time-series-chart.css.js';

// Same reason, for sk-grid's [SC-014]: the claim is that the adopted sheet is the one
// GENERATED from packages/styles/src/grid/sk-grid.css, and identity against the class's own
// `static styles` would hold for any sheet at all.
export { default as skGridSheet } from './grid/sk-grid.css.js';
export { default as skBlogCardSheet } from './blog-card/sk-blog-card.css.js';
// sk-card's sheet, exported for the FIRST time at #78 and for a reason worth stating: it is
// the only sheet in the repo adopted by a component other than its author, so blog-card's
// [SC-014] identity assertion needs it to prove the frame is IMPORTED rather than copied.
// Without it that test could only count sheets, not identify them.
export { default as skCardSheet } from './card/sk-card.css.js';
export { default as skButtonSheet } from './button/sk-button.css.js';
export { default as skCheckBulletSheet } from './check-bullet/sk-check-bullet.css.js';
export { default as skFeatureCardSheet } from './feature-card/sk-feature-card.css.js';
export { default as skRibbonCardSheet } from './ribbon-card/sk-ribbon-card.css.js';
export { default as skPillTagSheet } from './pill-tag/sk-pill-tag.css.js';
export { default as skSectionBannerSheet } from './section-banner/sk-section-banner.css.js';
export { default as skSiteFooterSheet } from './site-footer/sk-site-footer.css.js';
export { default as skSectionHeaderSheet } from './section-header/sk-section-header.css.js';
export { default as skStatusIndicatorSheet } from './status-indicator/sk-status-indicator.css.js';
export { default as skEntityMarkerSheet } from './entity-marker/sk-entity-marker.css.js';
export { default as skMetricSheet } from './metric/sk-metric.css.js';
export { default as skEvidenceChainSheet } from './evidence-chain/sk-evidence-chain.css.js';
export { default as skNoticeSheet } from './notice/sk-notice.css.js';
export { default as skTransitionMatrixSheet } from './transition-matrix/sk-transition-matrix.css.js';
export { default as skCopyFieldSheet } from './copy-field/sk-copy-field.css.js';

// The card's authored markup module, exported so the two failure policies are reachable
// from the behaviour fixture. `cardClasses` is TOTAL (an unknown variant warns and degrades)
// because it runs inside `render()`; `cardStaticHtml` THROWS because it runs on the
// authoring/build path. A split nothing asserts is a split that regresses.
//
// `//`, not `/** */`: a doc comment here would be lifted verbatim into custom-elements.json
// and shown to consumers in IDE hovers.
//
// CARD_STATUSES is exported for the reason FEATURE_CARD_ACCENTS and RIBBON_CARD_COLOURS are: the
// behaviour fixture DERIVES its loops from it, and still asserts its keys equal STATUS_TONES in
// order. Since #216 the map IS `Object.fromEntries(STATUS_TONES.map(...))`, so that assertion no
// longer guards two lists drifting apart — it guards the DERIVATION EXPRESSION, which nothing else
// gates and which a reviewer forked in one edit while every static gate stayed green.
export {
  CARD_AXES,
  CARD_STATUSES,
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

// sk-blog-card's markup module. `BLOG_CARD_AXES` and `BLOG_CARD_VARIANTS` are NOT re-exported:
// they are declared in the markup module because the GENERATOR requires them there and cannot
// tell an absent export from an empty one, and that obligation is on the module, not on this
// barrel. Same call as sk-check-bullet's, per the ONLY WHAT IS CONSUMED note below — applied
// here on the rebase so blog-card does not land as the one exception to a rule #79 just set.
export {
  PLACEHOLDER_THUMBNAIL,
  blogCardStaticHtml,
} from './blog-card/sk-blog-card.markup.js';

// sk-button's markup module. The two maps because the behaviour fixture derives its loops from
// them; both class helpers because tone and size each degrade.
//
// `ButtonSize`/`ButtonVariant` are NOT re-exported — see the ONLY WHAT IS CONSUMED note below.
// A lens suggested the alternative of keeping them and using them for the element's `declare`
// lines, which would have given them a consumer. Declined deliberately: those declarations are
// PUBLISHED API, and `declare variant: ButtonVariant | undefined` shows a consumer the alias
// name in an IDE hover where the literal union shows them the actual accepted values. The
// restatement is worth the clarity; the unconsumed export is not.
export {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  buttonClasses,
  buttonStaticHtml,
} from './button/sk-button.markup.js';

// sk-check-bullet's markup module. Only the static form is public here, because the fixture
// consumes it; the element imports its class and presentation helpers directly from the module.
//
// `CHECK_BULLET_AXES` and `CHECK_BULLET_VARIANTS` are declared in the markup module because the
// GENERATOR requires them there and cannot tell an absent export from an empty one — that
// obligation is on the module, not on this barrel, and an earlier revision of this block cited
// it as though it were. The runtime-only helpers stay internal to the element package.
export { checkBulletStaticHtml } from './check-bullet/sk-check-bullet.markup.js';

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

// sk-site-footer's markup module. Only the static form and the legal placeholder: the class map
// is imported by the element straight from the module, and _VARIANTS/_AXES are the generator's
// requirement on the module rather than on this barrel — see the ONLY WHAT IS CONSUMED note below.
export {
  PLACEHOLDER_LEGAL,
  siteFooterStaticHtml,
} from './site-footer/sk-site-footer.markup.js';

// sk-pill-tag's markup module. Both class helpers, because colour and shape each degrade; the
// maps because the fixture derives its loops from them. The `PillTagShape`/`PillTagVariant`
// aliases are not re-exported, for the reason given in the sk-button block above.
export {
  PILL_TAG_SHAPES,
  PILL_TAG_VARIANTS,
  pillTagClasses,
  pillTagStaticHtml,
} from './pill-tag/sk-pill-tag.markup.js';

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
// by the generator, which imports the markup module by its own file URL and never goes through
// this barrel, nor by the analyzer, which globs source.
//
// APPLIED TO TWO COMPONENTS SO FAR, and the rest is a KNOWN, SCOPED gap rather than an
// oversight — a lens enumerated it and it is worth stating plainly instead of leaving the rule
// looking uniformly applied. Ten re-exports below still have no consumer anywhere:
// `CARD_AXES`, `CARD_VARIANTS`, `isCardVariant`, and the six type aliases `CardVariant`,
// `GridGap`, `GridVariant`, `FeatureCardAccent`, `FeatureCardVariant`, `RibbonCardColour`,
// `SectionBannerVariant`. Those six are the exact category `ButtonSize`/`ButtonVariant`/
// `PillTagShape`/`PillTagVariant` were just deleted from, and the argument for deleting them
// (a literal union is better published API than an alias name) applies equally.
//
// They stay because #79 owns button, pill-tag and check-bullet, and its boundary rule is that a
// mission owns exactly the components in its slug — sweeping grid, feature-card, ribbon-card and
// section-banner here would be the "while we're here" edit that rule exists to prevent. Nothing
// is unreachable for a consumer either way: `keyof typeof GRID_VARIANTS` recovers any of them.
export {
  sectionBannerClasses,
  sectionBannerStaticHtml,
  type SectionBannerVariant,
} from './section-banner/sk-section-banner.markup.js';
