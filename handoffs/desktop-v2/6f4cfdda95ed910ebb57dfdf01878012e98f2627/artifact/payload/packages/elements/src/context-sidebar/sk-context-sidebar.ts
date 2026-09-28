import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-context-sidebar.css.js';

/**
 * A labelled complementary landmark for consumer-owned selected-context content.
 *
 * @element sk-context-sidebar
 * @slot header - Consumer-owned context heading or summary.
 * @slot - Consumer-owned context content or navigation.
 * @slot footer - Consumer-owned contextual actions.
 * @csspart sidebar - The complementary landmark and responsive container.
 * @csspart header - The context-header region.
 * @csspart content - The default context-content region.
 * @csspart footer - The context-footer region.
 */
export class SkContextSidebar extends LitElement {
  static styles = [sheet];
  static properties = {
    label: { type: String, reflect: true },
  };

  /** Accessible name forwarded unchanged to the complementary landmark when nonblank. */
  declare label: string | undefined;

  render() {
    const label = typeof this.label === 'string' && this.label.trim()
      ? this.label
      : 'Context';
    return html`<aside part="sidebar" class="sk-context-sidebar" aria-label=${label}>
      <div part="header" class="sk-context-sidebar__header">
        <slot name="header"></slot>
      </div>
      <div part="content" class="sk-context-sidebar__content">
        <slot></slot>
      </div>
      <div part="footer" class="sk-context-sidebar__footer">
        <slot name="footer"></slot>
      </div>
    </aside>`;
  }
}

define('sk-context-sidebar', SkContextSidebar);
