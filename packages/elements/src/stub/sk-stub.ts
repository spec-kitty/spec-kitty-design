import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-stub.css.js';

/**
 * The scaffold element for the ADR-8 custom-element base layer.
 *
 * @element sk-stub
 *
 * The `@element` annotation above is REQUIRED, not decorative. Registration goes
 * through the guarded `define()` helper (ADR-10 §5), and the Custom Elements
 * Manifest analyzer cannot follow that indirection — without this JSDoc the
 * manifest carries no definition for this element at all, and `define.ts` instead
 * contributes one named literally `tag`. ADR-11 generates the React wrapper from
 * that manifest. See WP05's CI assertion.
 *
 * MARKUP IS AUTHORED IN THREE PLACES TODAY (#105, C-006). `packages/styles/src/stub/`
 * already ships `sk-stub.html` and a `SkStubHTML` template literal; `render()` below
 * is the third. ADR-10 §3 requires the static `.html` to become generated output,
 * and #79 closes with a repository-wide "no component markup is authored twice"
 * assertion that will trip on this. This mission deliberately does NOT migrate it
 * (C-003) — but the three copies must not silently diverge. If you change the markup
 * here, check the other two.
 */
export class SkStub extends LitElement {
  static styles = [sheet];

  render() {
    return html`<div class="sk-stub">
      <span class="sk-stub__label">Spec Kitty Design System — stub primitive</span>
    </div>`;
  }
}

define('sk-stub', SkStub);
