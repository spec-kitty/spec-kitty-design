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

export function cardClasses(variant?: string, inset = false): string {
  return [
    'sk-card',
    variant && variant in CARD_VARIANTS ? CARD_VARIANTS[variant as CardVariant] : '',
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
  return `<article class="${cardClasses(variant, inset)}">${content}</article>`;
}
