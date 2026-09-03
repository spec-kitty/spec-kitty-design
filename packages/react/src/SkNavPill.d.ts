import React from "react";
import { SkNavPill as SkNavPillElement } from "@spec-kitty/elements";

export type { SkNavPillElement };

export interface SkNavPillProps extends Pick<
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
  /** Whether the navigation panel is open. Reflected as the `open` attribute. */
  isOpen?: boolean;

  /** Accessible name for the navigation landmark. */
  label?: SkNavPillElement["label"];

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
  ref?: React.Ref<SkNavPillElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** before the open state changes; `detail: { open: boolean }` is the REQUESTED state, `cancelable`, `bubbles` and `composed`. Calling `preventDefault()` abandons the change. */
  onSkNavPillToggle?: (event: CustomEvent<{ open: boolean }>) => void;
}

/**
 * The navigation pill — a row of links that collapses to a hamburger and a panel.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `label`: Accessible name for the navigation landmark.
 * - `open`/`isOpen`: Whether the navigation panel is open. Reflected as the `open` attribute.
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-nav-pill-toggle`: before the open state changes; `detail: { open: boolean }` is the REQUESTED state, `cancelable`, `bubbles` and `composed`. Calling `preventDefault()` abandons the change.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the navigation items, authored once and presented in both the row and the panel
 *
 * ## Methods
 *
 * Methods that can be called to access component functionality.
 *
 * - `close() => void`: Close the panel. No-op when it is already closed.
 * - `open(invoker?: HTMLElement | null) => void`: Open the panel.
 * - `toggle(invoker?: HTMLElement | null) => void`: Open or close the panel. Pass the element that triggered it to return focus there
 * on close. Fires `sk-nav-pill-toggle` first, which can cancel the change.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `hamburger`: the toggle control
 * - `items`: the items row, which becomes the collapsed panel
 * - `nav`: the pill container
 */
export const SkNavPill: React.ForwardRefExoticComponent<SkNavPillProps>;
