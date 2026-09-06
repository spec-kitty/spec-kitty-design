import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-page-header.css.js';

// THE DENSITY MAP IS THE CLOSED SET, and it is a map rather than a boolean because #182 calls
// this a density AXIS: a third density would be another entry here, not a second boolean whose
// combinations with the first are mostly meaningless.
const DENSITIES: Record<string, string> = { compact: 'sk-page-header--compact' };

/** The BEM class list for the header box. Warns and degrades on an unknown density. */
function pageHeaderClasses(density?: string): string {
  // WARNS AND DEGRADES, NEVER THROWS, and the reason is measured rather than stylistic: this
  // runs on the render path, so a throw makes Lit reject `updateComplete`, `render()` never
  // returns a tree, and the element paints a shadow root with no `<slot>` — silently eating the
  // consumer's own light-DOM children. sk-card records that regression; sk-grid copies the
  // policy; this is the third instance of it.
  if (density !== undefined && !Object.hasOwn(DENSITIES, density)) {
    console.warn(
      `sk-page-header: unknown density "${density}" — expected one of ` +
        `${Object.keys(DENSITIES).join(', ')} — rendering the default density.`,
    );
    density = undefined;
  }
  return ['sk-page-header', density ? DENSITIES[density] : ''].filter(Boolean).join(' ');
}

/**
 * A stateless layout for consumer-owned page orientation, metadata, and actions.
 *
 * Two orthogonal axes. `density` changes how much room the header takes; `sticky` changes
 * whether it stays put while its scroll region scrolls. Neither implies the other, and the same
 * five slots resolve at either density — there is no second header to author and no second
 * markup path to drift.
 *
 * When `sticky` is set the HOST is the sticky box, so the header pins itself inside whatever
 * scroll container its surroundings provide. Two viewport thresholds return it to normal flow —
 * 720px of width and 480px of height — because a sticky header that eats a short viewport, or
 * that overlaps a focused control below it, is worse than no sticky header at all. Nothing is
 * dropped in that reflow.
 *
 * Consumers styling their own content under a sticky header should set
 * `scroll-margin-block-start: var(--sk-layout-page-header-sticky-scroll-margin)` on the
 * focusable elements in it, so a focused element scrolled into view is not obscured by the
 * header (WCAG 2.4.11). That token is derived from the header's own sticky offset and compact
 * block size rather than restated, so it cannot drift from the header's footprint.
 *
 * The `sync` slot's contents are rendered verbatim. This element never starts a timer, reads a
 * clock, polls, observes scrolling, or computes a relative age: freshness belongs to the
 * consumer, which owns the timer and supplies the resulting string.
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

  static properties = {
    density: { type: String, reflect: true },
    sticky: { type: Boolean, reflect: true },
  };

  /** Layout density, as `compact`. Omit for the default density. The compact form carries the
   *  same five slots on a single row, with the actions region pinned and the text truncating
   *  visually — the full text stays in the accessibility tree. An unknown value renders the
   *  default density and warns rather than throwing. */
  declare density: 'compact' | undefined;

  /** Whether the header pins itself to the top of its scroll region. Independent of `density`:
   *  a compact header need not stick and a sticky header need not be compact. Below 720px of
   *  viewport width or 480px of viewport height the header returns to normal flow and stacks,
   *  keeping the title, the metadata and the actions all present. */
  declare sticky: boolean;

  constructor() {
    super();
    // A real `false`, not `undefined`, so `declare sticky: boolean` is not a type lie and a
    // consumer reading the property before touching it gets a boolean. Safe against the
    // pre-upgrade case: ReactiveElement saves and deletes instance properties inside its own
    // constructor (before this body runs) and re-applies them during the first update (after
    // it), so a value assigned before the definition loaded still wins over this default.
    this.sticky = false;
  }

  render() {
    return html`<header part="header" class=${pageHeaderClasses(this.density)}>
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
