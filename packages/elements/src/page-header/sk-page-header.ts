import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-page-header.css.js';

/**
 * A stateless layout for consumer-owned page orientation, metadata, and actions.
 *
 * @element sk-page-header
 * @slot eyebrow - Consumer-owned orientation text above the title.
 * @slot title - Consumer-owned page heading; the consumer chooses its heading level.
 * @slot supporting - Consumer-owned supporting copy.
 * @slot sync - Consumer-owned synchronization or status copy.
 * @slot actions - Consumer-owned page actions.
 * @csspart header - The complete responsive page-header container.
 * @csspart text - The eyebrow, title, and supporting-copy group.
 * @csspart eyebrow - The eyebrow region.
 * @csspart title - The title region.
 * @csspart supporting - The supporting-copy region.
 * @csspart meta - The synchronization and actions group.
 * @csspart sync - The synchronization-copy region.
 * @csspart actions - The actions region.
 */
export class SkPageHeader extends LitElement {
  static styles = [sheet];

  render() {
    return html`<header part="header" class="sk-page-header">
      <div part="text" class="sk-page-header__text">
        <div part="eyebrow" class="sk-page-header__eyebrow">
          <slot name="eyebrow"></slot>
        </div>
        <div part="title" class="sk-page-header__title">
          <slot name="title"></slot>
        </div>
        <div part="supporting" class="sk-page-header__supporting">
          <slot name="supporting"></slot>
        </div>
      </div>
      <div part="meta" class="sk-page-header__meta">
        <div part="sync" class="sk-page-header__sync">
          <slot name="sync"></slot>
        </div>
        <div part="actions" class="sk-page-header__actions">
          <slot name="actions"></slot>
        </div>
      </div>
    </header>`;
  }
}

define('sk-page-header', SkPageHeader);
