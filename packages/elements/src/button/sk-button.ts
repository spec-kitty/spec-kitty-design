import { LitElement, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
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
 * @slot - the visible label or consumer-supplied glyph
 * @csspart button - the rendered `<button>` or `<a>`
 * @csspart busy-cue - a decorative, `aria-hidden` activity indicator shown while `busy` is set
 */
export class SkButton extends LitElement {
  static styles = [sheet];
  static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    label: { type: String, reflect: true },
    href: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    busy: { type: Boolean, reflect: true },
  };

  /** Tone: `primary`, `secondary`, `ghost` or `danger-secondary`. Omit for the unstyled base. An
   *  unknown value renders the base button and warns rather than throwing. */
  declare variant: 'primary' | 'secondary' | 'ghost' | 'danger-secondary' | undefined;

  /** Size: `sm`, `icon`, or omit for the default. */
  declare size: 'sm' | 'icon' | undefined;

  /** Accessible name forwarded unchanged to the real control. Required for the `icon` size. */
  declare label: string | undefined;

  /** When set, the element renders an anchor to this URL instead of a button. */
  declare href: string | undefined;

  /** Disables the button. Ignored when `href` is set — a disabled link is not a thing HTML
   *  has, and faking one with pointer-events hides it from assistive technology. */
  declare disabled: boolean;

  /** Shows a decorative activity cue via CSS alone. Purely presentational: this component
   *  never sets, clears, or reads `disabled`/`aria-disabled` on account of `busy`, owns no
   *  request/timer/announcement, and the accessible name is unchanged in either state — the
   *  consumer's own request-handling code and disabling mechanism stay entirely its own. */
  declare busy: boolean;

  #hasWarnedInvalidIconLabel = false;
  #lastInvalidIconLabel: string | undefined;

  render() {
    const cls = buttonClasses(this.variant, this.size, this.busy);
    const validLabel = typeof this.label === 'string' && this.label.trim() ? this.label : undefined;
    const invalidIconLabel = this.size === 'icon' && validLabel === undefined;
    if (invalidIconLabel) {
      if (!this.#hasWarnedInvalidIconLabel || this.#lastInvalidIconLabel !== this.label) {
        console.warn(
          'sk-button: size="icon" requires a non-empty label — rendering the control without aria-label.',
        );
      }
      this.#hasWarnedInvalidIconLabel = true;
      this.#lastInvalidIconLabel = this.label;
    } else {
      this.#hasWarnedInvalidIconLabel = false;
      this.#lastInvalidIconLabel = undefined;
    }
    // THE INTERACTIVE ELEMENT IS REAL, and it is inside the shadow root carrying the same
    // classes the static form puts on its own root — so one CSS source serves both paths with
    // nothing written twice. That is the divergence #78 had to repair after the fact.
    //
    // KNOWN FORM LIMITATION, stated rather than discovered later.
    //
    // A <button> inside a shadow root does not submit an enclosing form, and `type="button"`
    // below is hard-coded, so this element can never be a submit button. ADR-9 §4 plus #74's
    // ElementInternals work is the mechanism if one is ever wanted. An earlier revision of
    // this comment claimed "no form exists in this repo today — grepped"; that was false when
    // written — fixtures/react-consumer/src/wrappers.test.tsx:156 renders one, and a lens
    // refuted the claim. The limitation is real; the supporting fact was not.
    //
    // `== null`, NOT `=== undefined`. Lit assigns a String property `null` — not `undefined` —
    // when its attribute is removed: reactive-element's `fromAttribute(null, String)` returns
    // null, and `__defaultValues` is only populated under `useDefault`, which nothing here
    // declares. With a strict `=== undefined` check, `removeAttribute('href')` took the ANCHOR
    // branch with `href=${null}`, and lit-html commits `setAttribute(name, value ?? '')` — so
    // the element became `<a href="">` instead of reverting to `<button>`: a click reloaded the
    // page and AT still announced "link". sk-ribbon-card.ts:63 was immune only because it tests
    // truthiness. Found by a lens, not by the suite — `mount()` never mutated after mount.
    // THE BUSY CUE IS UNCONDITIONAL, on both branches. Its DOM presence never itself changes
    // between idle and busy — only `.sk-button__busy-cue`'s CSS-driven visibility/animation
    // does (see sk-button.css). Rendering it conditionally on `this.busy` would make the
    // layout-shift measurement test a DOM-mutation cost instead of the CSS mechanism it exists
    // to prove. `aria-hidden="true"` is likewise unconditional: it carries no text and is never
    // a candidate accessible-tree object in either state (FR-011), so its presence is not an
    // accessibility-tree change either.
    return this.href == null
      ? html`<button
          part="button"
          class=${cls}
          type="button"
          aria-label=${ifDefined(validLabel)}
          ?disabled=${this.disabled}
        >
          <slot></slot>
          <span part="busy-cue" class="sk-button__busy-cue" aria-hidden="true"></span>
        </button>`
      : html`<a part="button" class=${cls} href=${this.href} aria-label=${ifDefined(validLabel)}
          ><slot></slot
          ><span part="busy-cue" class="sk-button__busy-cue" aria-hidden="true"></span
        ></a>`;
  }
}

define('sk-button', SkButton);
