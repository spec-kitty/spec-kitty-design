import React from "react";
import { SkFeatureCard as SkFeatureCardElement } from "@spec-kitty/elements";

export type { SkFeatureCardElement };

export interface SkFeatureCardProps extends Pick<
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
  /** Icon-chip colour: `yellow` (the default), `green` or `purple`. An unknown value uses the
default and warns. */
  accent?: SkFeatureCardElement["accent"];

  /** Border colour: `border-yellow`, `border-green` or `border-purple`. Omit for the default
neutral hairline. An unknown value renders the plain card and warns rather than throwing. */
  variant?: SkFeatureCardElement["variant"];

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
  ref?: React.Ref<SkFeatureCardElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A feature card: an accented icon chip above a title and a short body.
 *
 * The icon, title and body are all slotted, because they are the consuming page's content. The
 * component owns the frame, the chip and the two colour axes — which are independent: `accent`
 * colours the chip, `variant` colours the card's border, and a card may have either, both or
 * neither.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `accent`: Icon-chip colour: `yellow` (the default), `green` or `purple`. An unknown value uses the
 * default and warns.
 * - `variant`: Border colour: `border-yellow`, `border-green` or `border-purple`. Omit for the default
 * neutral hairline. An unknown value renders the plain card and warns rather than throwing.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the card's title and body
 * - `icon`: the chip's glyph, typically an inline SVG. Mark it `aria-hidden` unless it carries meaning the title does not.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `card`: the card frame
 * - `chip`: the icon chip, for an accent outside the provided set
 */
export const SkFeatureCard: React.ForwardRefExoticComponent<SkFeatureCardProps>;
