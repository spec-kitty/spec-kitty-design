import React from "react";
import { SkStatusIndicator as SkStatusIndicatorElement } from "@spec-kitty/elements";

export type { SkStatusIndicatorElement };

export interface SkStatusIndicatorProps extends Pick<
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
  /** Presentation tone. Unknown values render as `neutral` without changing the visible text. */
  tone?: SkStatusIndicatorElement["tone"];

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
  ref?: React.Ref<SkStatusIndicatorElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A consumer-labelled status with a presentation-only tone and decorative marker.
 *
 * Token dependencies: --sk-color-red, --sk-fg-body, --sk-fg-muted, --sk-font-sans,
 * --sk-on-tint-butter, --sk-on-tint-lilac, --sk-on-tint-mint, --sk-on-tint-sky,
 * --sk-space-2, --sk-text-sm.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `tone`: Presentation tone. Unknown values render as `neutral` without changing the visible text.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: Visible consumer-supplied status text.
 * - `marker`: A decorative consumer-supplied marker or icon.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `marker`: The decorative marker wrapper.
 * - `status`: The indicator layout root.
 * - `text`: The visible-text wrapper.
 */
export const SkStatusIndicator: React.ForwardRefExoticComponent<SkStatusIndicatorProps>;
