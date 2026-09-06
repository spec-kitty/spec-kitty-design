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

// THE SIBLING MAP, and the reason it is a sibling rather than more entries in CARD_VARIANTS.
//
// `variant` is the brand/decorative axis; `status` is the operational one, and #177 makes the
// separation binding. Folding the six tones into CARD_VARIANTS would make every brand x status
// combination unreachable and would fork the tone vocabulary into the variant enum.
//
// THE KEYS ARE NOT AUTHORED HERE — they are #146's, and this file is not allowed to import them.
// `scripts/build-element-markup.mjs` evaluates every *.markup.ts from a `data:` URL, which has no
// module base, and exits with a named error on any relative import. So the one authored list is
// `STATUS_TONES` in packages/elements/src/status-indicator/sk-status-indicator.ts, and this map is
// held equal to it — membership AND order — by an assertion in
// fixtures/elements-behaviour/src/sk-card.test.ts. Adding a tone to #146 reds that test until this
// map is extended, which is the intended failure. Do not "fix" it by narrowing either side.
/** Status tone → BEM modifier. The tone vocabulary is `sk-status-indicator`'s, not the card's. */
export const CARD_STATUSES = {
  neutral: 'sk-card--status-neutral',
  info: 'sk-card--status-info',
  success: 'sk-card--status-success',
  attention: 'sk-card--status-attention',
  danger: 'sk-card--status-danger',
  recovery: 'sk-card--status-recovery',
} as const;

export type CardStatus = keyof typeof CARD_STATUSES;

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

// `Object.hasOwn` here for the SAME measured reason as `isCardVariant` above, restated only as a
// pointer: `in` reaches the prototype chain, so `status="constructor"` would pass and this module
// also generates server-rendered HTML.
/** Whether `status` names a real card status modifier. */
export function isCardStatus(status: string): status is CardStatus {
  return Object.hasOwn(CARD_STATUSES, status);
}

/** The shared diagnostic for an unrecognised status. */
export const unknownStatusMessage = (status: string): string =>
  `unknown card status "${status}" — expected one of ${Object.keys(CARD_STATUSES).join(', ')}`;

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
//
// `status` (#177) takes the SAME policy, deliberately and not by copy-paste convenience: it is the
// same untrusted-markup-input class as `variant` — a CMS field, a server template, a typo — and
// the empty-shadow-root failure above is identical whichever axis triggers it. `status=""` is
// treated as absent and does NOT warn, matching `statusTone()` in sk-status-indicator.ts, because
// an attribute present-but-empty is how a template writes "no status".
/** The card's class list. An unknown `variant` or `status` warns and degrades to the base card. */
export function cardClasses(variant?: string, inset = false, status?: string): string {
  if (variant && !isCardVariant(variant)) {
    console.warn(`sk-card: ${unknownVariantMessage(variant)} — rendering the base card.`);
    variant = undefined;
  }
  if (status && !isCardStatus(status)) {
    console.warn(`sk-card: ${unknownStatusMessage(status)} — rendering the base card.`);
    status = undefined;
  }
  return [
    'sk-card',
    variant ? CARD_VARIANTS[variant as CardVariant] : '',
    inset ? 'sk-card--inset' : '',
    status ? CARD_STATUSES[status as CardStatus] : '',
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
/** The options a static form can vary. One key per axis this component has. */
export interface CardStaticOptions {
  variant?: string;
  inset?: boolean;
  status?: string;
}

// The status forms are DERIVED from CARD_STATUSES rather than typed out. Typing them out would
// put the tone list in this file a second time, and the second copy is the one that goes stale.
// `Object.fromEntries` widens away the literal key types, which is why this object is only
// `satisfies`-checked and not `as const` — the generator reads the keys at runtime and the type
// only has to prove every value is a legal option bag.
const STATUS_AXES: Record<string, CardStaticOptions> = Object.fromEntries(
  Object.keys(CARD_STATUSES).map((status) => [
    `Status${status.charAt(0).toUpperCase()}${status.slice(1)}`,
    { status },
  ]),
);

/**
 * The static forms this component publishes, BEYOND the base and one per variant.
 *
 * The generator derives base + variants on its own; this names everything else. It exists
 * because the generator used to emit `Sk<Comp>InsetHTML` unconditionally — `inset` is a CARD
 * axis, and for `sk-nav-pill` or `sk-grid` that would have committed
 * `class="sk-grid sk-grid--inset"`, a class in no stylesheet, as generated output with
 * `--check` green. A component with no extra axes exports an empty object; omitting it is an
 * error, because `?? {}` cannot distinguish "none" from "I looked for the wrong name".
 */
export const CARD_AXES = {
  Inset: { inset: true },
  ...STATUS_AXES,
} satisfies Record<string, CardStaticOptions>;

export function cardStaticHtml(opts: CardStaticOptions = {}, content = 'Card content'): string {
  // THROWS, where `cardClasses` warns. This is the authoring/build path — the generator and
  // server-side templates call it, nothing is painted yet, and committing a card with a
  // silently-dropped variant into generated output is the failure worth stopping.
  const { variant, inset = false, status } = opts;
  if (variant !== undefined && !isCardVariant(variant)) {
    throw new Error(unknownVariantMessage(variant));
  }
  if (status !== undefined && !isCardStatus(status)) {
    throw new Error(unknownStatusMessage(status));
  }
  return `<article class="${cardClasses(variant, inset, status)}">${content}</article>`;
}
