import React from "react";
import { SkButton as SkButtonElement } from "@spec-kitty/elements";

export type { SkButtonElement };

export interface SkButtonProps extends Pick<
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
  /** Disables the button. Ignored when `href` is set — a disabled link is not a thing HTML
has, and faking one with pointer-events hides it from assistive technology. */
  disabled?: boolean;

  /** When set, the element renders an anchor to this URL instead of a button. */
  href?: SkButtonElement["href"];

  /** Size: `sm`, or omit for the default. */
  size?: SkButtonElement["size"];

  /** Tone: `primary`, `secondary` or `ghost`. Omit for the unstyled base. An unknown value
renders the base button and warns rather than throwing. */
  variant?: SkButtonElement["variant"];

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
  ref?: React.Ref<SkButtonElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A button, or a link styled as one.
 *
 * Set `href` and it renders an anchor; omit it and you get a button. That is not a
 * convenience — every use of this primitive in the demo pages is an `<a href>` styled as a
 * button, while the stories use `<button>`, so the catalogue already needs both and the class
 * list is identical either way.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `disabled`: Disables the button. Ignored when `href` is set — a disabled link is not a thing HTML
 * has, and faking one with pointer-events hides it from assistive technology.
 * - `href`: When set, the element renders an anchor to this URL instead of a button.
 * - `size`: Size: `sm`, or omit for the default.
 * - `variant`: Tone: `primary`, `secondary` or `ghost`. Omit for the unstyled base. An unknown value
 * renders the base button and warns rather than throwing.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the button's label
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `button`: the rendered `<button>` or `<a>`
 */
export const SkButton: React.ForwardRefExoticComponent<SkButtonProps>;
