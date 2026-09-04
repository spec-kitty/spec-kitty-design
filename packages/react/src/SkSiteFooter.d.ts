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
  /** Heading for the first link column. */
  headingOne?: SkSiteFooterElement["headingOne"];

  /** Heading for the second link column. */
  headingTwo?: SkSiteFooterElement["headingTwo"];

  /** The copyright line. Omit it and the divider above it is not rendered either. */
  legal?: SkSiteFooterElement["legal"];

  /** One sentence under the wordmark. */
  tagline?: SkSiteFooterElement["tagline"];

  /** The brand wordmark. */
  wordmark?: SkSiteFooterElement["wordmark"];

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
 * A site footer: a brand column, two link columns, and a legal line.
 *
 * The element owns the structure — the grid, the `<nav>`s, the headings, the `<ul>`s, the divider
 * and the legal line. Text arrives as properties; only the link ITEMS are slotted, as `<li>`
 * elements that land directly inside the element's own `<ul>`.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `headingOne`: Heading for the first link column.
 * - `headingTwo`: Heading for the second link column.
 * - `legal`: The copyright line. Omit it and the divider above it is not rendered either.
 * - `tagline`: One sentence under the wordmark.
 * - `wordmark`: The brand wordmark.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `column-one`: `<li>` items for the first link column
 * - `column-two`: `<li>` items for the second link column The slot NAMES keep their hyphens — a slot name is a string, not a property key, so the constraint that shaped `headingOne`/`headingTwo` does not reach them.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `divider`: the rule above the legal line, absent when `legal` is empty
 * - `footer`: the footer element, for padding and border overrides
 * - `grid`: the column grid, for layouts outside the provided one
 * - `legal`: the legal line
 */
export const SkSiteFooter: React.ForwardRefExoticComponent<SkSiteFooterProps>;
