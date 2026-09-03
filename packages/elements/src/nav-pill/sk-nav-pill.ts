import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-nav-pill.css.js';

// EVERYTHING IN THE `/** */` BELOW IS PUBLISHED API — the analyzer copies the class
// description and each `@csspart` description verbatim into custom-elements.json, which IDE
// hovers and docs sites render. Rationale for maintainers belongs here, in `//` comments.
//
// WHY THE PANEL LIVES INSIDE THIS ELEMENT.
//
// The hamburger carries `aria-controls`. ADR-9 records, with measurement, that axe resolves
// such references from the ATTRIBUTE and scopes ID lookups to `getRootNode()`, so no
// cross-root reference resolves — and quotes MDN: "a target element must be in the same DOM
// as the referencing element, or a parent DOM". A hamburger in this shadow root therefore
// cannot name a panel the consumer left in their document, which is precisely the
// arrangement `skToggleDrawer` required (`document.getElementById('sk-nav-drawer')`) and
// precisely what dashboard-demo.html did. The control and its target share a root here.
//
// NO `--responsive` / `--has-drawer` MODIFIER ON THE SHADOW NAV, deliberately. Those exist so
// a static consumer can opt into the collapsing arrangement; inside the element it is not
// optional. Leaving them off also keeps the sheet's static rules from racing the `:host` rules
// on specificity — `.sk-nav-pill--responsive .sk-nav-pill__items` and
// `:host([open]) .sk-nav-pill__items` are close enough that source order would decide.
//
// ONE ITEMS CONTAINER, NOT TWO. Two slots cannot hold the same nodes, so a row plus a
// separate panel would force the consumer to author their nav items TWICE — which is what
// the demo and the story did. Below the breakpoint the same container becomes the panel
// (`sk-nav-pill-drawer.css`, the `:host` block).
//
// THE INVOKER IS RECORDED, NOT ASSUMED. `open()` is public, so a consumer's own control is a
// legitimate invoker — that is the whole point of replacing a global helper. Escape returns
// focus to whatever opened the panel, which is not necessarily the hamburger.
/**
 * The navigation pill — a row of links that collapses to a hamburger and a panel.
 *
 * @element sk-nav-pill
 *
 * @slot - the navigation items, authored once and presented in both the row and the panel
 * @csspart nav - the pill container
 * @csspart items - the items row, which becomes the collapsed panel
 * @csspart hamburger - the toggle control
 * @fires sk-nav-pill-toggle - before the open state changes; `detail: { open: boolean }` is
 *   the REQUESTED state, `cancelable`, `bubbles` and `composed`. Calling `preventDefault()`
 *   abandons the change.
 */
export class SkNavPill extends LitElement {
  static styles = [sheet];

  // `isOpen` the PROPERTY, `open` the ATTRIBUTE. The issue specifies `open()` as a METHOD,
  // and a class cannot have both — `<dialog>` hits the same wall and solves it the same way
  // (`open` property, `show()`/`close()` methods). The attribute keeps its idiomatic name so
  // `:host([open])` in the stylesheet reads like `<details open>`.
  static properties = {
    isOpen: { type: Boolean, reflect: true, attribute: 'open' },
    label: { type: String },
  };

  declare isOpen: boolean;
  declare label: string;

  /** The control to return focus to. Not reflected, not an attribute — runtime state. */
  #invoker: HTMLElement | null = null;

  constructor() {
    super();
    this.isOpen = false;
    this.label = 'Primary navigation';
    this.addEventListener('keydown', this.#onKeydown);
  }

  /**
   * Open the panel.
   *
   * @param invoker - the control focus returns to on close. Defaults to whatever has focus,
   *   resolved through the composed path: `document.activeElement` inside a shadow root
   *   reports the HOST, not the inner control, so reading it directly returns this element.
   */
  open(invoker?: HTMLElement | null): void {
    this.#setOpen(true, invoker ?? this.#activeControl());
  }

  close(): void {
    this.#setOpen(false, null);
  }

  toggle(invoker?: HTMLElement | null): void {
    if (this.isOpen) this.close();
    else this.open(invoker);
  }

  #activeControl(): HTMLElement | null {
    let node: Element | null = document.activeElement;
    // Walk INTO shadow roots: activeElement reports the host at each level.
    while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement;
    return node instanceof HTMLElement && node !== this ? node : null;
  }

  #setOpen(next: boolean, invoker: HTMLElement | null): void {
    // IDEMPOTENT. open() on an already-open panel is not a state change, so it fires nothing.
    // Without this the "fires exactly once" contract is trivially satisfiable and useless.
    if (this.isOpen === next) return;

    const evt = new CustomEvent('sk-nav-pill-toggle', {
      detail: { open: next },
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    // Dispatched BEFORE the change, so preventDefault() has something to prevent. A listener
    // that cancels must see the panel stay shut — asserting `defaultPrevented` would only
    // prove the listener ran.
    if (!this.dispatchEvent(evt)) return;

    if (next) this.#invoker = invoker;
    this.isOpen = next;

    if (!next) {
      const target = this.#invoker;
      this.#invoker = null;
      // isConnected, because the invoker may have left the DOM while the panel was open.
      if (target?.isConnected) target.focus();
    }
  }

  #onKeydown = (e: Event): void => {
    const ke = e as KeyboardEvent;
    if (ke.key !== 'Escape') return;
    // A closed panel does not consume Escape and does not move focus. Consumers nest these
    // inside dialogs; stealing the key from an outer handler is the easy bug here.
    if (!this.isOpen) return;
    ke.preventDefault();
    this.close();
  };

  render() {
    return html`<nav
      part="nav"
      class="sk-nav-pill"
      aria-label=${this.label}
    >
      <div part="items" class="sk-nav-pill__items" id="items"><slot></slot></div>
      <button
        part="hamburger"
        class="sk-nav-pill__hamburger"
        type="button"
        id="hamburger"
        aria-controls="items"
        aria-expanded=${this.isOpen ? 'true' : 'false'}
        aria-label=${this.isOpen ? 'Close navigation' : 'Open navigation'}
        @click=${this.#onHamburger}
      >
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.75"
             stroke-linecap="round" aria-hidden="true">
          <line x1="2" y1="4.5" x2="16" y2="4.5" />
          <line x1="2" y1="9" x2="16" y2="9" />
          <line x1="2" y1="13.5" x2="16" y2="13.5" />
        </svg>
      </button>
    </nav>`;
  }

  #onHamburger = (e: Event): void => {
    this.toggle(e.currentTarget as HTMLElement);
  };
}

define('sk-nav-pill', SkNavPill);
