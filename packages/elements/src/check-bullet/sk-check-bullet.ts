import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-check-bullet.css.js';
import { DEFAULT_ICON, checkBulletClasses } from './sk-check-bullet.markup.js';

/**
 * A checked feature bullet, for the tick-lists on marketing and reference pages.
 *
 * Put it inside a `<ul role="list">`. The element sets `role="listitem"` on itself, because a
 * custom element inside a `<ul>` is NOT a list item — the static form is a real `<li>`, and
 * this is the one place the two consumption paths differ structurally.
 *
 * @element sk-check-bullet
 * @slot - the bullet's text
 * @csspart bullet - the bullet row
 * @csspart icon - the tick, which is decorative and hidden from assistive technology
 */
export class SkCheckBullet extends LitElement {
  static styles = [sheet];

  static properties = {
    icon: { type: String, reflect: true },
  };

  /** The tick glyph. Defaults to ✓; set it to use a different mark. */
  declare icon: string | undefined;

  connectedCallback(): void {
    super.connectedCallback();
    // `role="listitem"` ON THE HOST, and only if the consumer has not set one.
    //
    // A <ul> whose children are custom elements has no list items, so a screen reader announces
    // an empty list. Setting the role restores it. Not overriding an existing role matters:
    // a consumer using these outside a list — a feature grid, say — must be able to say so, and
    // silently forcing listitem would make their markup wrong instead of ours.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'listitem');
  }

  render() {
    // A wrapper carries the layout class, so the SAME rule serves the static <li> and this
    // element — the two paths agree on everything except the outer element, which they cannot.
    return html`<div part="bullet" class=${checkBulletClasses()}>
      <span part="icon" class="sk-check-bullet__icon" aria-hidden="true">${this.icon ?? DEFAULT_ICON}</span>
      <slot></slot>
    </div>`;
  }
}

define('sk-check-bullet', SkCheckBullet);
