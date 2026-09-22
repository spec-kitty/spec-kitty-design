import React from "react";
import { SkSectionBanner as SkSectionBannerElement } from "@spec-kitty/elements";

export type { SkSectionBannerElement };

export interface SkSectionBannerProps extends Pick<
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
  /** Colour variant: `neutral` (the default), `purple` or `green`. An unknown value renders
the neutral banner and warns rather than throwing. */
  variant?: SkSectionBannerElement["variant"];

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
  ref?: React.Ref<SkSectionBannerElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A mono-caps banner that delineates a version or section block.
 *
 * Non-interactive by design: it has no hover, focus or disabled state, and the colour variant
 * IS the state. The label is slotted content, not a property — a banner's text is the
 * consuming page's, and hardcoding it in the component is what this element replaced.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `variant`: Colour variant: `neutral` (the default), `purple` or `green`. An unknown value renders
 * the neutral banner and warns rather than throwing.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the banner label
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `banner`: the banner container
 * - `dot`: the leading dot, which is decorative and hidden from assistive technology
 * - `label`: the label text wrapper
 */
export const SkSectionBanner: React.ForwardRefExoticComponent<SkSectionBannerProps>;
