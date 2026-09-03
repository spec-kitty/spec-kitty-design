import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-section-banner.css.js';
import { sectionBannerClasses } from './sk-section-banner.markup.js';

// Doc comments below are PUBLISHED API — the analyzer copies them into custom-elements.json
// and the React generator into the consumer's editor hover. Maintainer rationale goes in `//`.
/**
 * A mono-caps banner that delineates a version or section block.
 *
 * Non-interactive by design: it has no hover, focus or disabled state, and the colour variant
 * IS the state. The label is slotted content, not a property — a banner's text is the
 * consuming page's, and hardcoding it in the component is what this element replaced.
 *
 * @element sk-section-banner
 * @slot - the banner label
 * @csspart banner - the banner container
 * @csspart dot - the leading dot, which is decorative and hidden from assistive technology
 * @csspart label - the label text wrapper
 */
export class SkSectionBanner extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
  };

  /** Colour variant: `neutral` (the default), `purple` or `green`. An unknown value renders
   *  the neutral banner and warns rather than throwing. */
  declare variant: 'neutral' | 'purple' | 'green' | undefined;

  render() {
    // The dot is decorative and carries aria-hidden, so the accessible name of the banner is
    // the slotted label alone. Without that the name would begin with the bullet character,
    // which a screen reader announces.
    return html`<div part="banner" class=${sectionBannerClasses(this.variant)}>
      <span part="dot" class="sk-section-banner__dot" aria-hidden="true">●</span>
      <span part="label" class="sk-section-banner__label"><slot></slot></span>
    </div>`;
  }
}

define('sk-section-banner', SkSectionBanner);
