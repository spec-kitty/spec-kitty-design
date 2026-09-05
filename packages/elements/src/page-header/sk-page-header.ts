import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-page-header.css.js';

export class SkPageHeader extends LitElement {
  static styles = [sheet];

  render() {
    return html``;
  }
}

define('sk-page-header', SkPageHeader);
