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
