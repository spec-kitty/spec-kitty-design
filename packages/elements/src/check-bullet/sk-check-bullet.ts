import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-check-bullet.css.js';
import {
  checkBulletClasses,
  checkBulletPresentation,
} from './sk-check-bullet.markup.js';

/**
 * A passive completion-state item for feature lists on marketing and reference pages.
 *
 * Put it inside a `<ul role="list">`. The element sets `role="listitem"` on itself, because a
 * custom element inside a `<ul>` is NOT a list item — the static form is a real `<li>`, and
 * this is the one place the two consumption paths differ structurally.
 *
 * @element sk-check-bullet
 * @slot - the bullet's text
 * @csspart bullet - the bullet row
 * @csspart icon - the completion-state marker, decorative and hidden from assistive technology
 */
export class SkCheckBullet extends LitElement {
  static styles = [sheet];

  static properties = {
    icon: { type: String, reflect: true },
    state: { type: String, reflect: true },
  };

  /** Decorative marker glyph. Defaults to the current state's marker; set it to override. */
  declare icon: string | undefined;

  /** Read-only completion state. Omit for complete; unsupported values render as complete. */
  declare state: 'complete' | 'pending' | undefined;

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
    const presentation = checkBulletPresentation(this.state);
    // A wrapper carries the layout class, so the SAME rule serves the static <li> and this
    // element — the two paths agree on everything except the outer element, which they cannot.
    return html`<div part="bullet" class=${checkBulletClasses(this.state)}>
      <span part="icon" class="sk-check-bullet__icon" aria-hidden="true"
        >${this.icon ?? presentation.icon}</span
      >
      <span class="sk-check-bullet__state">${presentation.label}</span>
      <slot></slot>
    </div>`;
  }
}

define('sk-check-bullet', SkCheckBullet);
