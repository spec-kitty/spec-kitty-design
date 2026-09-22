import React from "react";
import { SkGrid as SkGridElement } from "@spec-kitty/elements";

export type { SkGridElement };

export interface SkGridProps extends Pick<
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
  /** Gap between items, in token steps: 3, 4 or 6. Omit for the default (4). */
  gap?: SkGridElement["gap"];

  /** Column count, as `cols-2`, `cols-3` or `cols-4`. Omit for a single column. An unknown
value renders the base grid and warns rather than throwing. */
  variant?: SkGridElement["variant"];

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
  ref?: React.Ref<SkGridElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A responsive grid layout primitive.
 *
 * Bounded on purpose: it supports 2, 3 and 4 columns because that is what the blog listing and
 * reference pages need. It is not a general-purpose grid system. Use `::part(grid)` for layouts
 * outside that set rather than asking for another variant.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `gap`: Gap between items, in token steps: 3, 4 or 6. Omit for the default (4).
 * - `variant`: Column count, as `cols-2`, `cols-3` or `cols-4`. Omit for a single column. An unknown
 * value renders the base grid and warns rather than throwing.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the grid items, which become the grid's direct children
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `grid`: the grid container, for column and gap overrides beyond the provided set
 */
export const SkGrid: React.ForwardRefExoticComponent<SkGridProps>;
