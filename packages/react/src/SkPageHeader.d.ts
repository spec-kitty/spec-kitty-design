import React from "react";
import { SkPageHeader as SkPageHeaderElement } from "@spec-kitty/elements";

export type { SkPageHeaderElement };

export interface SkPageHeaderProps extends Pick<
  React.AllHTMLAttributes<HTMLElement>,
  | "children"
  | "dir"
  | "hidden"
  | "id"
  | "lang"
  | "slot"
  | "style"
  | "title"
  | "translate"
  | "onClick"
  | "onFocus"
  | "onBlur"
> {
  /** Whether the header pins itself to the top of its scroll region. Independent of `density`:
a compact header need not stick and a sticky header need not be compact. Below 720px of
viewport width or 480px of viewport height the header returns to normal flow and stacks,
keeping the title, the metadata and the actions all present. */
  sticky?: boolean;

  /** Layout density, as `compact`. Omit for the default density. The compact form carries the
same five slots on a single row, with the actions region pinned and the text truncating
visually — the full text stays in the accessibility tree. An unknown value renders the
default density and warns rather than throwing. */
  density?: SkPageHeaderElement["density"];

  /** A space-separated list of the classes of the element. Classes allows CSS and JavaScript to select and access specific elements via the class selectors or functions like the method `Document.getElementsByClassName()`. */
  className?: string;

  /** Contains a space-separated list of the part names of the element that should be exposed on the host element. */
  exportparts?: string;

  /** Used for labels to link them with their inputs (using input id). */
  htmlFor?: string;

  /** Used to help React identify which items have changed, are added, or are removed within a list. */
  key?: number | string;

  /** Contains a space-separated list of the part names of the element. Part names allows CSS to select and style specific elements in a shadow tree via the ::part pseudo-element. */
  part?: string;

  /** A mutable ref object whose `.current` property is initialized to the passed argument (`initialValue`). The returned object will persist for the full lifetime of the component. */
  ref?: React.Ref<SkPageHeaderElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
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
 * header (WCAG 2.4.11).
 *
 * That token's DEFAULT VALUE covers ONE configuration: `density="compact"` laid out on a single
 * row, which is the header wider than 720px. It is derived from the header's own sticky offset
 * and compact block size rather than restated, so within that configuration it cannot drift.
 * Outside it the header is taller than the default and the consumer overrides the token — the
 * name stays the single place the value lives, which is the part of the contract that matters.
 * Two cases need the override, and the orthogonality above is why the first exists:
 *
 * - **Default density.** `sticky` without `density="compact"` is supported, and its height is
 *   entirely the consumer's slotted content — measured between 227px and 533px for one
 *   composition across two widths and two title lengths, against an 80px default. There is no
 *   honest derived number for it, so there is no second token: the consumer sets the value from
 *   their own header.
 * - **A stacked compact header.** Stacking is a CONTAINER query on the header's own width and the
 *   sticky drop is a MEDIA query on the viewport's, so they are not the same threshold: a 400px
 *   header column inside a 1400px viewport is sticky AND stacked at once — measured 96px against
 *   the same 80px default.
 *
 * The element does not measure its own live box to close that gap, because observing layout is
 * the class of behaviour it is deliberately barred from owning.
 *
 * The `sync` slot's contents are rendered verbatim. This element never starts a timer, reads a
 * clock, polls, observes scrolling, or computes a relative age: freshness belongs to the
 * consumer, which owns the timer and supplies the resulting string.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `density`: Layout density, as `compact`. Omit for the default density. The compact form carries the
 * same five slots on a single row, with the actions region pinned and the text truncating
 * visually — the full text stays in the accessibility tree. An unknown value renders the
 * default density and warns rather than throwing.
 * - `sticky`: Whether the header pins itself to the top of its scroll region. Independent of `density`:
 * a compact header need not stick and a sticky header need not be compact. Below 720px of
 * viewport width or 480px of viewport height the header returns to normal flow and stacks,
 * keeping the title, the metadata and the actions all present.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `actions`: Consumer-owned page actions.
 * - `eyebrow`: Consumer-owned orientation text above the title.
 * - `supporting`: Consumer-owned supporting copy.
 * - `sync`: Consumer-owned synchronization or status copy.
 * - `title`: Consumer-owned page heading; the consumer chooses its heading level.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `actions`: The actions region.
 * - `eyebrow`: The eyebrow region.
 * - `header`: The complete responsive page-header container.
 * - `meta`: The synchronization and actions group.
 * - `supporting`: The supporting-copy region.
 * - `sync`: The synchronization-copy region.
 * - `text`: The eyebrow, title, and supporting-copy group.
 * - `title`: The title region.
 */
export const SkPageHeader: React.ForwardRefExoticComponent<SkPageHeaderProps>;
