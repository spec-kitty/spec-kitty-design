/**
 * The card's markup, authored ONCE (ADR-10 §3, criterion 3).
 *
 * Markup for this component used to exist four times: this shape, the static
 * `packages/styles/src/card/sk-card.html`, the template-literal constants in
 * `packages/styles/src/card/index.ts`, and the story `render:` strings. ADR-10 §3 ratified
 * the ruling — *the element's template is the sole authored source*, and the static HTML
 * becomes build output, generated and never hand-edited, because Django/Jekyll/Hugo
 * consumers genuinely need real HTML and dropping it strands the majority of named
 * consumers.
 *
 * So this module is the one authored place. `sk-card.ts` renders from it, and
 * `scripts/build-element-markup.mjs` generates the two static artifacts from it, with a
 * `--check` mode that fails CI on drift — the same contract the CSS pipeline uses.
 *
 * Criterion 3 as restated by the ADR: **no component markup is AUTHORED twice.** Generated
 * artifacts are exempt and are required to be regenerable.
 */

/** Variant → BEM modifier. The static layer's classes are the contract; the element's
 *  `variant="blue"` attribute is sugar over them. */
export const CARD_VARIANTS = { blue: 'sk-card--blue', purple: 'sk-card--purple' } as const;

export type CardVariant = keyof typeof CARD_VARIANTS;

// PUBLISHED PROSE IS SHORT, DELIBERATELY. Everything in a `/** */` above an export is
// lifted verbatim into custom-elements.json and rendered in IDE hovers and on docs sites —
// #72 already shipped a 1144-character `@csspart` blob that way. Rationale for maintainers
// goes in `//` comments, which the analyzer does not capture.
//
// `Object.hasOwn`, not `in`: `in` reaches the prototype chain, so `cardClasses('constructor')`
// emitted `sk-card function Object() { [native code] }` as a class attribute — and because
// this module also generates server-rendered HTML, that string reached real markup.
/** Whether `variant` names a real card modifier. */
export function isCardVariant(variant: string): variant is CardVariant {
  return Object.hasOwn(CARD_VARIANTS, variant);
}

/** The shared diagnostic for an unrecognised variant. */
export const unknownVariantMessage = (variant: string): string =>
  `unknown card variant "${variant}" — expected one of ${Object.keys(CARD_VARIANTS).join(', ')}`;

// WHY THIS IS TOTAL AND `cardStaticHtml` IS NOT — the load-bearing decision in this file.
//
// The previous fold made this THROW, and pass 2 measured the consequence: Lit rejects
// `updateComplete`, `render()` never returns a tree, and `<sk-card variant="typo">` paints an
// EMPTY shadow root with no `<slot>` — so the element silently eats its own light-DOM
// children. That is strictly worse than the fail-open it replaced (wrong tint, content still
// visible), and `variant` is untrusted markup input: a CMS field, a server template, a typo.
// The platform contract for an unknown attribute value is graceful degradation —
// `<input type="bogus">` becomes a text input; nothing blanks itself.
//
// The hard assertion belongs on the AUTHORING path, where a bad variant is a build error and
// nothing is painted yet: see `cardStaticHtml`. The throw was also unreachable from the build
// path it was justified for — the generator derives its variants from
// `Object.keys(CARD_VARIANTS)` and cannot pass an unknown one. One module, two callers, two
// failure policies; collapsing them into one function is what went wrong. Both halves are
// asserted in fixtures/elements-behaviour/src/sk-card.test.ts.
/** The card's class list. An unknown `variant` warns and degrades to the base card. */
export function cardClasses(variant?: string, inset = false): string {
  if (variant && !isCardVariant(variant)) {
    console.warn(`sk-card: ${unknownVariantMessage(variant)} — rendering the base card.`);
    variant = undefined;
  }
  return [
    'sk-card',
    variant ? CARD_VARIANTS[variant as CardVariant] : '',
    inset ? 'sk-card--inset' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The static form, for consumers with no JavaScript.
 *
 * `<article>` rather than the element's `<div part="card">`: the element needs the part for
 * the ADR-9 styling API, and a server-rendered card needs the semantics. Same classes, same
 * CSS, one authored source for both — which is the point.
 */
export function cardStaticHtml(variant?: string, inset = false, content = 'Card content'): string {
  // THROWS, where `cardClasses` warns. This is the authoring/build path — the generator and
  // server-side templates call it, nothing is painted yet, and committing a card with a
  // silently-dropped variant into generated output is the failure worth stopping.
  if (variant !== undefined && !isCardVariant(variant)) {
    throw new Error(unknownVariantMessage(variant));
  }
  return `<article class="${cardClasses(variant, inset)}">${content}</article>`;
}
