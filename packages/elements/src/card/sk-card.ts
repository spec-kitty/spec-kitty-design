import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-card.css.js';
import { cardClasses } from './sk-card.markup.js';

/**
 * The card primitive — the first real component on the ADR-8 base layer.
 *
 * @element sk-card
 *
 * The `@element` annotation is REQUIRED, not decorative: registration goes through the
 * guarded `define()` helper (ADR-10 §5) and the manifest analyzer cannot follow that
 * indirection. Without it the manifest carries no definition for this element, and
 * scripts/check-manifest-content.mjs fails.
 *
 * @csspart card - the card surface. The ADR-9 styling API: a consumer restyles through
 *                 this, never by reaching into the shadow tree.
 *
 * VARIANTS ARE ATTRIBUTES, NOT CLASSES. The static layer uses `.sk-card--blue`; here the
 * consumer writes `<sk-card variant="blue">`. The adopted stylesheet is byte-identical to
 * `packages/styles/src/card/sk-card.css`, so the class must still land on the internal
 * node — that mapping is this element's job and is why `part="card"` and the class list
 * sit on the same element.
 *
 * WHY THERE IS NO LIGHT-MODE HANDLING HERE. `sk-card.css` used to carry
 * `:root[data-theme="light"] .sk-card--blue` and `.sk-light .sk-card--blue`. Both cross a
 * shadow boundary and both are therefore INERT inside this element — the themed ancestor
 * is outside the shadow root and a descendant combinator cannot reach in. Silently: a
 * LightMode story would render dark styling with no error and no warning. Light-mode
 * variance now lives in `--sk-border-card-{blue,purple}`, because a custom property
 * inherits through the boundary and a selector does not. Do not reintroduce either
 * selector, and do not reach for `:host-context()` — Baseline limited, Chromium-only.
 */
export class SkCard extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
    inset: { type: Boolean, reflect: true },
  };

  declare variant: 'blue' | 'purple' | undefined;
  declare inset: boolean;

  constructor() {
    super();
    this.inset = false;
  }

  render() {
    // The class list comes from sk-card.markup.ts, which is also what generates the static
    // HTML and the template-literal exports — ADR-10 §3's "authored once".
    return html`<div part="card" class=${cardClasses(this.variant, this.inset)}><slot></slot></div>`;
  }
}

define('sk-card', SkCard);
