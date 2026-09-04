import React from "react";
import { SkPillTag as SkPillTagElement } from "@spec-kitty/elements";

export type { SkPillTagElement };

export interface SkPillTagProps extends Pick<
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
  /** Shape: `eyebrow` for the larger, square-cornered lead-in label. Omit for the compact pill. */
  shape?: SkPillTagElement["shape"];

  /** Colour: `green`, `purple`, `breaking` or `yellow`. Omit for the neutral tag. An unknown
value renders the base tag and warns rather than throwing. */
  variant?: SkPillTagElement["variant"];

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
  ref?: React.Ref<SkPillTagElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A small inline label — a version tag, a status chip, or an eyebrow above a headline.
 *
 * `variant` sets the colour and `shape` sets the size; they are independent, so a tinted
 * eyebrow is expressible. The label is slotted, because the text is the consuming page's.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `shape`: Shape: `eyebrow` for the larger, square-cornered lead-in label. Omit for the compact pill.
 * - `variant`: Colour: `green`, `purple`, `breaking` or `yellow`. Omit for the neutral tag. An unknown
 * value renders the base tag and warns rather than throwing.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the label text
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `tag`: the tag itself, for a treatment outside the provided variants
 */
export const SkPillTag: React.ForwardRefExoticComponent<SkPillTagProps>;
