import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-context-sidebar.css.js';

export class SkContextSidebar extends LitElement {
  static styles = [sheet];
  static properties = {
    label: { type: String, reflect: true },
  };

  declare label: string | undefined;

  render() {
    return html``;
  }
}

define('sk-context-sidebar', SkContextSidebar);
