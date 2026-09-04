import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import sheet from './sk-button.css.js';
import { buttonClasses } from './sk-button.markup.js';

/**
 * A button, or a link styled as one.
 *
 * Set `href` and it renders an anchor; omit it and you get a button. That is not a
 * convenience — every use of this primitive in the demo pages is an `<a href>` styled as a
 * button, while the stories use `<button>`, so the catalogue already needs both and the class
 * list is identical either way.
 *
 * @element sk-button
 * @slot - the button's label
 * @csspart button - the rendered `<button>` or `<a>`
 */
export class SkButton extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    href: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  /** Tone: `primary`, `secondary` or `ghost`. Omit for the unstyled base. An unknown value
   *  renders the base button and warns rather than throwing. */
  declare variant: 'primary' | 'secondary' | 'ghost' | undefined;

  /** Size: `sm`, or omit for the default. */
  declare size: 'sm' | undefined;

  /** When set, the element renders an anchor to this URL instead of a button. */
  declare href: string | undefined;

  /** Disables the button. Ignored when `href` is set — a disabled link is not a thing HTML
   *  has, and faking one with pointer-events hides it from assistive technology. */
  declare disabled: boolean;

  render() {
    const cls = buttonClasses(this.variant, this.size);
    // THE INTERACTIVE ELEMENT IS REAL, and it is inside the shadow root carrying the same
    // classes the static form puts on its own root — so one CSS source serves both paths with
    // nothing written twice. That is the divergence #78 had to repair after the fact.
    //
    // KNOWN LIMITATION, stated rather than discovered later: a <button> inside a shadow root
    // does not submit an enclosing form. No form exists in this repo today — grepped — and
    // ADR-9 §4 plus #74's ElementInternals work is the mechanism if one ever does. Filed
    // rather than half-built.
    return this.href === undefined
      ? html`<button part="button" class=${cls} type="button" ?disabled=${this.disabled}>
          <slot></slot>
        </button>`
      : html`<a part="button" class=${cls} href=${this.href}><slot></slot></a>`;
  }
}

define('sk-button', SkButton);
