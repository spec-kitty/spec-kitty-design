import React from "react";
import { SkSectionHeader as SkSectionHeaderElement } from "@spec-kitty/elements";

export type { SkSectionHeaderElement };

export interface SkSectionHeaderProps extends Pick<
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
  ref?: React.Ref<SkSectionHeaderElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A presentational section heading whose outline level and supporting content are consumer-owned.
 *
 * Token dependencies: --sk-fg-default, --sk-fg-muted, --sk-font-display, --sk-font-mono,
 * --sk-font-sans, --sk-space-2, --sk-space-6, --sk-text-sm, --sk-text-xl, --sk-text-xs,
 * --sk-weight-medium, --sk-weight-semibold.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `action`: Optional trailing action.
 * - `description`: Optional supporting description.
 * - `eyebrow`: Optional lead-in content.
 * - `metadata`: Optional count or metadata.
 * - `title`: A consumer-authored native heading.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `action`: The action slot wrapper.
 * - `description`: The description slot wrapper.
 * - `eyebrow`: The eyebrow slot wrapper.
 * - `header`: The section-header layout root.
 * - `metadata`: The metadata slot wrapper.
 * - `title`: The native-heading slot wrapper.
 */
export const SkSectionHeader: React.ForwardRefExoticComponent<SkSectionHeaderProps>;
