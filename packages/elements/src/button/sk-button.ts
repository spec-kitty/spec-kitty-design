import { LitElement, html } from 'lit';
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
    // KNOWN LIMITATIONS, stated rather than discovered later. Both are filed as #153.
    //
    // 1. A <button> inside a shadow root does not submit an enclosing form, and `type="button"`
    //    below is hard-coded, so this element can never be a submit button. ADR-9 §4 plus #74's
    //    ElementInternals work is the mechanism if one is ever wanted. An earlier revision of
    //    this comment claimed "no form exists in this repo today — grepped"; that was false when
    //    written — fixtures/react-consumer/src/wrappers.test.tsx:156 renders one, and a lens
    //    refuted the claim. The limitation is real; the supporting fact was not.
    // 2. The interactive node lives in the shadow root with no `delegatesFocus`, so
    //    `hostEl.focus()` is a silent no-op — the trap sk-nav-pill.ts names on its
    //    activeElement walk (cited by symbol, not line: a lens found the line pin already off
    //    by one, the same defect this fold removed from a programme-doc citation) — and
    //    `aria-label` on the host is ignored because the host's role is generic. So the
    //    icon-only button the a11y gate keeps green cannot be expressed through <sk-button>.
    //
    // `== null`, NOT `=== undefined`. Lit assigns a String property `null` — not `undefined` —
    // when its attribute is removed: reactive-element's `fromAttribute(null, String)` returns
    // null, and `__defaultValues` is only populated under `useDefault`, which nothing here
    // declares. With a strict `=== undefined` check, `removeAttribute('href')` took the ANCHOR
    // branch with `href=${null}`, and lit-html commits `setAttribute(name, value ?? '')` — so
    // the element became `<a href="">` instead of reverting to `<button>`: a click reloaded the
    // page and AT still announced "link". sk-ribbon-card.ts:63 was immune only because it tests
    // truthiness. Found by a lens, not by the suite — `mount()` never mutated after mount.
    return this.href == null
      ? html`<button part="button" class=${cls} type="button" ?disabled=${this.disabled}>
          <slot></slot>
        </button>`
      : html`<a part="button" class=${cls} href=${this.href}><slot></slot></a>`;
  }
}

define('sk-button', SkButton);
