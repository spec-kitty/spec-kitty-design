import React from "react";
import { SkContextSidebar as SkContextSidebarElement } from "@spec-kitty/elements";

export type { SkContextSidebarElement };

export interface SkContextSidebarProps extends Pick<
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
  /** Accessible name forwarded unchanged to the complementary landmark when nonblank. */
  label?: SkContextSidebarElement["label"];

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
  ref?: React.Ref<SkContextSidebarElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A labelled complementary landmark for consumer-owned selected-context content.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `label`: Accessible name forwarded unchanged to the complementary landmark when nonblank.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: Consumer-owned context content or navigation.
 * - `footer`: Consumer-owned contextual actions.
 * - `header`: Consumer-owned context heading or summary.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `content`: The default context-content region.
 * - `footer`: The context-footer region.
 * - `header`: The context-header region.
 * - `sidebar`: The complementary landmark and responsive container.
 */
export const SkContextSidebar: React.ForwardRefExoticComponent<SkContextSidebarProps>;
