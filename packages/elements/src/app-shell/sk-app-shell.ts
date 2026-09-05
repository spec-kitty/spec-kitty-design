import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-app-shell.css.js';

/**
 * A stateless page frame for personal navigation, contextual navigation, page heading, and content.
 *
 * @element sk-app-shell
 * @slot personal-rail - Consumer-owned personal or application navigation.
 * @slot context-sidebar - Consumer-owned navigation or content for the selected context.
 * @slot page-header - Consumer-owned page title, supporting text, metadata, and actions.
 * @slot - Consumer-owned main page content.
 * @csspart shell - The complete responsive shell grid.
 * @csspart personal - The personal-navigation column.
 * @csspart context - The contextual-navigation column.
 * @csspart content - The page header and main-content column.
 * @csspart header - The page-header region.
 * @csspart main - The main-content landmark.
 */
export class SkAppShell extends LitElement {
  static styles = [sheet];

  render() {
    return html`<div part="shell" class="sk-app-shell">
      <div part="personal" class="sk-app-shell__personal">
        <slot name="personal-rail"></slot>
      </div>
      <div part="context" class="sk-app-shell__context">
        <slot name="context-sidebar"></slot>
      </div>
      <div part="content" class="sk-app-shell__content">
        <div part="header" class="sk-app-shell__header">
          <slot name="page-header"></slot>
        </div>
        <main part="main" class="sk-app-shell__main"><slot></slot></main>
      </div>
    </div>`;
  }
}

define('sk-app-shell', SkAppShell);
