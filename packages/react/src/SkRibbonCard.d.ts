import React from "react";
import { SkRibbonCard as SkRibbonCardElement } from "@spec-kitty/elements";

export type { SkRibbonCardElement };

export interface SkRibbonCardProps extends Pick<
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
  /** The ribbon's colour: `yellow` (the default), `green`, `purple`, `blue` or `red`. Ignored
when no `ribbon` label is set. */
  accent?: SkRibbonCardElement["accent"];

  /** The ribbon's label. The ribbon is rendered ONLY when this is set — an empty tab is a
coloured shape with no text, which reads as a bug rather than as a plain card. */
  ribbon?: SkRibbonCardElement["ribbon"];

  /** Border colour: `border-yellow`, `-green`, `-purple`, `-blue` or `-red`. Omit for the
default neutral hairline. An unknown value renders the plain card and warns. */
  variant?: SkRibbonCardElement["variant"];

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
  ref?: React.Ref<SkRibbonCardElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A card with an optional diagonal ribbon tab in its corner.
 *
 * The title and body are slotted, because they are the consuming page's content. The ribbon's
 * LABEL is a property rather than a slot — it is a short string the component positions and
 * rotates, and ADR-9 §4 took the same route for the form controls' `label`.
 *
 * The two colour axes are independent: `variant` tints the card's border, `accent` tints
 * the tab, and a card may use either, both or neither.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `accent`: The ribbon's colour: `yellow` (the default), `green`, `purple`, `blue` or `red`. Ignored
 * when no `ribbon` label is set.
 * - `ribbon`: The ribbon's label. The ribbon is rendered ONLY when this is set — an empty tab is a
 * coloured shape with no text, which reads as a bug rather than as a plain card.
 * - `variant`: Border colour: `border-yellow`, `-green`, `-purple`, `-blue` or `-red`. Omit for the
 * default neutral hairline. An unknown value renders the plain card and warns.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the card's title and body
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `card`: the card frame
 * - `content`: the content wrapper
 * - `ribbon`: the ribbon tab, absent from the DOM when no `ribbon` label is set
 */
export const SkRibbonCard: React.ForwardRefExoticComponent<SkRibbonCardProps>;
