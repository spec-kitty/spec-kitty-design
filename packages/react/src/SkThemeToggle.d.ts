import React from "react";
import { SkThemeToggle as SkThemeToggleElement } from "@spec-kitty/elements";

export type { SkThemeToggleElement };

export interface SkThemeToggleProps extends Pick<
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
  /** Visible label for the Dark choice. */
  darkLabel?: SkThemeToggleElement["darkLabel"];

  /** Visible legend and accessible name for the preference group. */
  label?: SkThemeToggleElement["label"];

  /** Visible label for the Light choice. */
  lightLabel?: SkThemeToggleElement["lightLabel"];

  /** Selected preference. Invalid attribute and property values safely become `system`. */
  preference?: SkThemeToggleElement["preference"];

  /** Visible label for the System choice. */
  systemLabel?: SkThemeToggleElement["systemLabel"];

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
  ref?: React.Ref<SkThemeToggleElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Reports a user-selected preference and its resolved root theme. */
  onSkThemeChange?: (
    event: CustomEvent<{
      preference: "system" | "light" | "dark";
      theme: "light" | "dark";
    }>,
  ) => void;
}

/**
 * A three-state theme-preference control that resolves System, Light, or Dark on the root.
 *
 * Consumer-supplied labels are required so the package never ships untranslated fallback copy.
 * If any label is absent or blank, the element renders no interactive control. The pre-paint
 * bootstrap is independent of this presentation and continues to provide system-default theming.
 *
 * Every control connected to one document shows one shared preference: a choice on any of them
 * selects it on all of them, and exactly one System listener exists while that preference is
 * System. A control connecting alongside another control adopts the page's current preference; a
 * control connecting alone re-reads storage, unless storage cannot be read — then it adopts
 * whatever preference the page last showed. Either is skipped for a control given an explicit
 * `preference` before connecting, which always wins.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `dark-label`/`darkLabel`: Visible label for the Dark choice.
 * - `label`: Visible legend and accessible name for the preference group.
 * - `light-label`/`lightLabel`: Visible label for the Light choice.
 * - `preference`: Selected preference. Invalid attribute and property values safely become `system`.
 * - `system-label`/`systemLabel`: Visible label for the System choice.
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-theme-change`: Reports a user-selected preference and its resolved root theme.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `control`: The native fieldset containing the three radio choices.
 */
export const SkThemeToggle: React.ForwardRefExoticComponent<SkThemeToggleProps>;
