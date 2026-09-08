import React from "react";
import {
  SkCopyField as SkCopyFieldElement,
  SkCopyFieldResultDetail,
} from "@spec-kitty/elements";

export type { SkCopyFieldElement, SkCopyFieldResultDetail };

export interface SkCopyFieldProps extends Pick<
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
  /** Message shown when neither copying nor exact selection succeeded. */
  failureMessage?: SkCopyFieldElement["failureMessage"];

  /** Accessible name for the native copy control. Blank values warn and use `Copy value`. */
  label?: SkCopyFieldElement["label"];

  /** Message shown when the visible value was selected for manual copying. */
  manualMessage?: SkCopyFieldElement["manualMessage"];

  /** Message shown after the Clipboard API fulfills. Blank values use the default. */
  successMessage?: SkCopyFieldElement["successMessage"];

  /** Exact text displayed and offered for copying. The empty string disables the control. */
  value?: SkCopyFieldElement["value"];

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
  ref?: React.Ref<SkCopyFieldElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Reports only copied, manual, or failed. The event bubbles, is composed, and is not cancelable. */
  onSkCopyFieldResult?: (event: CustomEvent<SkCopyFieldResultDetail>) => void;
}

/**
 * A non-editable exact-value field with a single native copy control and truthful inline results.
 *
 * The displayed string is the string sent to the Clipboard API. When clipboard access is not
 * available, the visible code is focused and selected for a manual system copy shortcut. The
 * component never executes, parses, validates, logs, or includes the value in its result event.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-width-1,
 * --sk-border-width-2, --sk-fg-body, --sk-fg-muted, --sk-font-mono, --sk-font-sans,
 * --sk-radius-md, --sk-space-2, --sk-space-3, --sk-surface-input, --sk-text-sm.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `failure-message`/`failureMessage`: Message shown when neither copying nor exact selection succeeded.
 * - `label`: Accessible name for the native copy control. Blank values warn and use `Copy value`.
 * - `manual-message`/`manualMessage`: Message shown when the visible value was selected for manual copying.
 * - `success-message`/`successMessage`: Message shown after the Clipboard API fulfills. Blank values use the default.
 * - `value`: Exact text displayed and offered for copying. The empty string disables the control.
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-copy-field-result`: Reports only copied, manual, or failed. The event bubbles, is composed, and is not cancelable.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `copy-control`: Native copy button.
 * - `field`: Immediate bordered value, action, and status composition.
 * - `status`: Stable polite result region.
 * - `value`: Exact visible non-editable value and manual-selection target.
 */
export const SkCopyField: React.ForwardRefExoticComponent<SkCopyFieldProps>;
