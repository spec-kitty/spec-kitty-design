import React from "react";
import { SkFormTextarea as SkFormTextareaElement } from "@spec-kitty/elements";

export type { SkFormTextareaElement };

export interface SkFormTextareaProps extends Pick<
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
  /** undefined */
  disabled?: boolean;

  /** undefined */
  invalid?: boolean;

  /** undefined */
  required?: boolean;

  /** undefined */
  description?: SkFormTextareaElement["description"];

  /** undefined */
  label?: SkFormTextareaElement["label"];

  /** undefined */
  name?: SkFormTextareaElement["name"];

  /** undefined */
  placeholder?: SkFormTextareaElement["placeholder"];

  /** undefined */
  rows?: SkFormTextareaElement["rows"];

  /** undefined */
  value?: SkFormTextareaElement["value"];

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
  ref?: React.Ref<SkFormTextareaElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A labelled multi-line text control that participates in a native form.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `description`: undefined
 * - `disabled`: undefined
 * - `invalid`: undefined
 * - `label`: undefined
 * - `name`: undefined
 * - `placeholder`: undefined
 * - `required`: undefined
 * - `rows`: undefined
 * - `value`: undefined
 *
 * ## Methods
 *
 * Methods that can be called to access component functionality.
 *
 * - `checkValidity() => boolean`: undefined
 * - `formDisabledCallback(isDisabled: boolean) => void`: undefined
 * - `formResetCallback() => void`: undefined
 * - `reportValidity() => boolean`: undefined
 * - `setCustomError(message: string | null) => void`: Set or clear a validation error the element cannot derive itself — a server-side rejection,
 * a cross-field rule. Pass `null` to clear it.
 *
 * This exists because a lens found the only lever a consumer HAD was `el.invalid = true`,
 * and that produced the worst possible state: `:host([invalid])` painted the field red,
 * `aria-invalid` said `true`, `aria-describedby` pointed at an error node rendering the
 * EMPTY string — because `setValidity` had never been called — and `internals.validity.valid`
 * stayed `true`, so the form submitted anyway. An error identified visually with no
 * programmatic text, on a control that still submits (WCAG 3.3.1).
 *
 * Routing through `setValidity` keeps the one-source-of-truth the `error` getter above
 * argues for: validity is the state, `invalid` and the message are both derived from it.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `control`: the multi-line control
 * - `description`: the helper text
 * - `error`: the validation message
 * - `field`: the field wrapper
 * - `label`: the label
 */
export const SkFormTextarea: React.ForwardRefExoticComponent<SkFormTextareaProps>;
