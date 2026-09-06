import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-card.css.js';
import { cardClasses } from './sk-card.markup.js';

// EVERYTHING IN THE `/** */` BELOW IS PUBLISHED API. The analyzer copies the class
// description and each `@csspart` description verbatim into custom-elements.json, which IDE
// hovers and docs sites render. #72 shipped a 1144-character `@csspart` blob that way, and
// the first fix merely relocated 376 characters of it into the class description. Rationale
// for maintainers belongs here, in `//` comments the analyzer does not read.
//
// THE ANNOTATIONS ARE REQUIRED, NOT DECORATIVE:
//   * `@element sk-card` — registration goes through the guarded `define()` helper
//     (ADR-10 §5) and the analyzer cannot follow that indirection. Without it the manifest
//     carries no definition for this element and scripts/check-manifest-content.mjs fails.
//   * `@csspart card` — ADR-9's rule is that a consumer restyles through the part, never by
//     reaching into the shadow tree. An UNTERMINATED tag swallows everything after it, which
//     is how the blob above happened; keep tag descriptions to one short line.
//
// The variant contract is not repeated in prose: the manifest already carries
// `variant: 'blue' | 'purple' | undefined` from the field declaration below. Same for `status`
// (#177), whose six tones the manifest carries the same way — the class description says what the
// axis IS, not what its members are.
//
// SINCE #129 THAT INCLUDES EVERY REACTIVE PROPERTY'S OWN `/** */`, and every public
// method's: normalise-manifest.mjs propagates a field's description onto its attribute,
// and the React generator copies it into the prop docs. check-manifest-content.mjs now
// refuses a manifest where any of them is missing, so this is enforced, not advisory.
/**
 * The card primitive — the first real component on the ADR-8 base layer.
 *
 * @element sk-card
 * @slot - the card's content
 * @csspart card - the card surface
 */
export class SkCard extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
    inset: { type: Boolean, reflect: true },
    status: { type: String, reflect: true },
  };

  /** Accent colour. Omit for the default surface; an unknown value renders the base card and
   *  warns rather than throwing. */
  declare variant: 'blue' | 'purple' | undefined;

  /** Swaps the surface token for the inset (input) surface, for a card nested inside another. */
  declare inset: boolean;

  // THE UNION IS SPELLED OUT HERE BECAUSE THE PIPELINE REQUIRES IT, not because the card owns a
  // second vocabulary. `scripts/build-vue-types.mjs` emits `'<attr>'?: <the manifest's type text>`
  // verbatim into packages/elements/vue.d.ts, and that file imports nothing from this package — so
  // a `StatusIndicatorTone` alias here would emit an unresolved identifier and fail typecheck-all.
  // #146 wrote `tone`'s union out inline at sk-status-indicator.ts for exactly this reason while
  // keeping the authored list in `STATUS_TONES`.
  //
  // What holds this honest: packages/react/type-tests/wrappers.type-test.tsx proves this union and
  // `StatusIndicatorTone` are mutually assignable, and the behaviour fixture still proves
  // CARD_STATUSES' keys equal STATUS_TONES in order. Widening, narrowing or renaming any of them
  // reds a test.
  //
  // #216 did NOT close this half, and it is worth saying which half it closed. `CARD_STATUSES` is
  // now derived from `STATUS_TONES` — the runtime copy and the assertion that policed it are both
  // gone. This `declare` line is a different pipeline: `build-vue-types.mjs` copies the MANIFEST's
  // type text, and only a property-only field's type is emitted as an `import(...)` reference, so
  // an attribute annotated with an alias would still emit an unresolved identifier into a
  // declaration file that imports nothing. Measured after the #216 fix landed, not assumed.
  /** Operational status tone, orthogonal to `variant` — a card may carry both. The vocabulary is
   *  `sk-status-indicator`'s; the card holds no domain mapping and never infers a tone. An unknown
   *  value renders the base card and warns rather than throwing. */
  declare status: 'neutral' | 'info' | 'success' | 'attention' | 'danger' | 'recovery' | undefined;

  constructor() {
    super();
    this.inset = false;
  }

  render() {
    // The class list comes from sk-card.markup.ts, which is also what generates the static
    // HTML and the template-literal exports — ADR-10 §3's "authored once".
    return html`<div part="card" class=${cardClasses(this.variant, this.inset, this.status)}><slot></slot></div>`;
  }
}

define('sk-card', SkCard);
