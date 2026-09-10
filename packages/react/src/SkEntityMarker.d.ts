import React from "react";
import { SkEntityMarker as SkEntityMarkerElement } from "@spec-kitty/elements";

export type { SkEntityMarkerElement };

export interface SkEntityMarkerProps extends Pick<
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
  /** Optional bordered presentation whose outer box is identical to the unbordered form. Only `true` is supported; invalid values render unbordered. */
  border?: SkEntityMarkerElement["border"];

  /** Accessible name for a meaningful mark. Empty or whitespace-only values make it decorative. */
  label?: SkEntityMarkerElement["label"];

  /** Optional circular presentation. Only `circle` is supported; invalid values use the square shape. */
  shape?: SkEntityMarkerElement["shape"];

  /** Optional presentation size. Only `sm`/`lg` are supported; invalid values use the default size. */
  size?: SkEntityMarkerElement["size"];

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
  ref?: React.Ref<SkEntityMarkerElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A compact consumer-supplied icon, initials, or short mark with explicit accessible naming.
 *
 * Token dependencies: --sk-border-default, --sk-border-width-1, --sk-font-sans,
 * --sk-on-tint-butter, --sk-radius-pill, --sk-radius-sm, --sk-space-1, --sk-space-5,
 * --sk-space-7, --sk-space-9, --sk-surface-tint-butter, --sk-text-xs, --sk-weight-bold.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `border`: Optional bordered presentation whose outer box is identical to the unbordered form. Only `true` is supported; invalid values render unbordered.
 * - `label`: Accessible name for a meaningful mark. Empty or whitespace-only values make it decorative.
 * - `shape`: Optional circular presentation. Only `circle` is supported; invalid values use the square shape.
 * - `size`: Optional presentation size. Only `sm`/`lg` are supported; invalid values use the default size.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: Consumer-supplied icon, initials, short mark, or direct image. Meaningful images use a host label and `alt=""`.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `content`: The supplied-mark wrapper.
 * - `marker`: The marker layout root.
 */
export const SkEntityMarker: React.ForwardRefExoticComponent<SkEntityMarkerProps>;
