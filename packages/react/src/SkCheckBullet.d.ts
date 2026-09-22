import React from "react";
import { SkCheckBullet as SkCheckBulletElement } from "@spec-kitty/elements";

export type { SkCheckBulletElement };

export interface SkCheckBulletProps extends Pick<
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
  /** Decorative marker glyph. Defaults to the current state's marker; set it to override. */
  icon?: SkCheckBulletElement["icon"];

  /** Read-only completion state. Omit for complete; unsupported values render as complete. */
  state?: SkCheckBulletElement["state"];

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
  ref?: React.Ref<SkCheckBulletElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A passive completion-state item for feature lists on marketing and reference pages.
 *
 * Put it inside a `<ul role="list">`. The element sets `role="listitem"` on itself, because a
 * custom element inside a `<ul>` is NOT a list item — the static form is a real `<li>`, and
 * this is the one place the two consumption paths differ structurally.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `icon`: Decorative marker glyph. Defaults to the current state's marker; set it to override.
 * - `state`: Read-only completion state. Omit for complete; unsupported values render as complete.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the bullet's text
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `bullet`: the bullet row
 * - `icon`: the completion-state marker, decorative and hidden from assistive technology
 */
export const SkCheckBullet: React.ForwardRefExoticComponent<SkCheckBulletProps>;
