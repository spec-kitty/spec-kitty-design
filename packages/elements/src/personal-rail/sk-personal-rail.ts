import { LitElement, html } from 'lit';
import { define } from '../define.js';

export class SkPersonalRail extends LitElement {
  static styles = [];
  static properties = {
    label: { type: String },
  };

  declare label: string | undefined;

  render() {
    return html``;
  }
}

define('sk-personal-rail', SkPersonalRail);
