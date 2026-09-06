import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-personal-rail.css.js';

/**
 * A labelled personal-navigation rail with consumer-owned controls in stable groups.
 *
 * @element sk-personal-rail
 * @slot primary - Primary application navigation controls.
 * @slot utilities - Utility controls displayed above the account group.
 * @slot account - The consumer-supplied account or identity control.
 * @slot logout - The consumer-supplied logout control.
 * @csspart rail - The navigation landmark and responsive rail container.
 * @csspart primary - The primary navigation group.
 * @csspart bottom - The bottom utility, account, and logout group.
 * @csspart utilities - The utility controls group.
 * @csspart divider - The visual divider before account controls.
 * @csspart account - The account control group.
 * @csspart logout - The logout control group.
 */
export class SkPersonalRail extends LitElement {
  static styles = [sheet];
  static properties = {
    label: { type: String, reflect: true },
  };

  /** Accessible name forwarded unchanged to the navigation landmark when nonblank. */
  declare label: string | undefined;

  render() {
    const label = typeof this.label === 'string' && this.label.trim()
      ? this.label
      : 'Personal navigation';
    return html`<nav part="rail" class="sk-personal-rail" aria-label=${label}>
      <div part="primary" class="sk-personal-rail__primary">
        <slot name="primary"></slot>
      </div>
      <div part="bottom" class="sk-personal-rail__bottom">
        <div part="utilities" class="sk-personal-rail__utilities">
          <slot name="utilities"></slot>
        </div>
        <div part="divider" class="sk-personal-rail__divider" aria-hidden="true"></div>
        <div part="account" class="sk-personal-rail__account">
          <slot name="account"></slot>
        </div>
        <div part="logout" class="sk-personal-rail__logout">
          <slot name="logout"></slot>
        </div>
      </div>
    </nav>`;
  }
}

define('sk-personal-rail', SkPersonalRail);
