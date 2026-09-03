export { define } from './define.js';
export { SkStub } from './stub/sk-stub.js';
export { SkCard } from './card/sk-card.js';
export { SkNavPill } from './nav-pill/sk-nav-pill.js';
export { SkFormInput } from './form-input/sk-form-input.js';

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

// The card's authored markup module, exported so the two failure policies are reachable
// from the behaviour fixture. `cardClasses` is TOTAL (an unknown variant warns and degrades)
// because it runs inside `render()`; `cardStaticHtml` THROWS because it runs on the
// authoring/build path. A split nothing asserts is a split that regresses.
//
// `//`, not `/** */`: a doc comment here would be lifted verbatim into custom-elements.json
// and shown to consumers in IDE hovers.
export {
  CARD_VARIANTS,
  cardClasses,
  cardStaticHtml,
  isCardVariant,
  type CardVariant,
} from './card/sk-card.markup.js';
