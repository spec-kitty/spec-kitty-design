import React from "react";
import { SkSiteFooter as SkSiteFooterElement } from "@spec-kitty/elements";

export type { SkSiteFooterElement };

export interface SkSiteFooterProps extends Pick<
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
  ref?: React.Ref<SkSiteFooterElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A site footer: a brand column, link columns, and a legal line.
 *
 * The component owns the layout — a responsive grid that collapses to one column, and the
 * divider above the legal line. Everything a reader sees is yours, supplied through the slots.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the link columns, which become the grid's remaining children
 * - `brand`: the brand column: a mark, a wordmark and a tagline
 * - `legal`: the copyright line
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `divider`: the rule above the legal line
 * - `footer`: the footer element, for padding and border overrides
 * - `grid`: the column grid, for layouts outside the provided one
 * - `legal`: the legal line
 */
export const SkSiteFooter: React.ForwardRefExoticComponent<SkSiteFooterProps>;
