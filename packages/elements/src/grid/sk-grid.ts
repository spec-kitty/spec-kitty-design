import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-grid.css.js';
import { gridClasses } from './sk-grid.markup.js';

// EVERYTHING IN THE `/** */` BELOW IS PUBLISHED API — the analyzer copies the class description
// and each tag's description verbatim into custom-elements.json, and the React generator copies
// property descriptions into the prop docs a consumer reads in their editor. Rationale for
// maintainers belongs here, in `//`, which the analyzer does not read.
//
// `@element sk-grid` is required: registration goes through the guarded `define()` helper
// (ADR-10 §5) and the analyzer cannot follow that indirection.
//
// THE PART IS THE POINT, and an earlier draft of this file argued the opposite — that a layout
// primitive has "nothing inside to target". It does: the grid container. `variant` and `gap` are
// a closed set by design, so without `::part(grid)` a consumer who needs a different gap at their
// own breakpoint has no route at all — they cannot reach the container from outside the shadow
// root, and the host element is not the grid box. That is precisely the escape hatch ADR-9 makes
// parts for.
/**
 * A responsive grid layout primitive.
 *
 * Bounded on purpose: it supports 2, 3 and 4 columns because that is what the blog listing and
 * reference pages need. It is not a general-purpose grid system. Use `::part(grid)` for layouts
 * outside that set rather than asking for another variant.
 *
 * @element sk-grid
 * @slot - the grid items, which become the grid's direct children
 * @csspart grid - the grid container, for column and gap overrides beyond the provided set
 */
export class SkGrid extends LitElement {
  static styles = [sheet];

  static properties = {
    variant: { type: String, reflect: true },
    gap: { type: Number, reflect: true },
  };

  /** Column count, as `cols-2`, `cols-3` or `cols-4`. Omit for a single column. An unknown
   *  value renders the base grid and warns rather than throwing. */
  declare variant: 'cols-2' | 'cols-3' | 'cols-4' | undefined;

  /** Gap between items, in token steps: 3, 4 or 6. Omit for the default (4). */
  declare gap: number | undefined;

  render() {
    // A wrapper div carries the grid, and the slotted children still become its grid items —
    // because a `<slot>` is `display: contents` by default, so it does not itself participate
    // in layout and its assigned nodes are laid out as children of the div. Setting
    // `display: block` on the slot would break that and make the slot the single grid item.
    return html`<div part="grid" class=${gridClasses(this.variant, this.gap)}><slot></slot></div>`;
  }
}

define('sk-grid', SkGrid);
