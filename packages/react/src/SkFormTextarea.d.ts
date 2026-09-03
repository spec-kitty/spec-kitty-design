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
  /** Excludes the field from submission and from user interaction. */
  disabled?: boolean;

  /** Whether the field is currently showing an error. Derived from validity — set it through
`setCustomError()` rather than assigning this directly. */
  invalid?: boolean;

  /** Marks the field required. An empty required field blocks submission and reports
"&lt;label&gt; is required". */
  required?: boolean;

  /** Optional helper text rendered under the control and linked to it for screen readers. */
  description?: SkFormTextareaElement["description"];

  /** The visible label. Also the accessible name, so it is not optional in practice. */
  label?: SkFormTextareaElement["label"];

  /** The name submitted with the form value. Required for the field to participate in
submission at all: a form control with no name contributes no `FormData` entry. */
  name?: SkFormTextareaElement["name"];

  /** Placeholder text. Not a substitute for `label`: it disappears on input and is not a
reliable accessible name. */
  placeholder?: SkFormTextareaElement["placeholder"];

  /** Visible height in text rows. */
  rows?: SkFormTextareaElement["rows"];

  /** The current value, and what the form submits under `name`. */
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
 * - `description`: Optional helper text rendered under the control and linked to it for screen readers.
 * - `disabled`: Excludes the field from submission and from user interaction.
 * - `invalid`: Whether the field is currently showing an error. Derived from validity — set it through
 * `setCustomError()` rather than assigning this directly.
 * - `label`: The visible label. Also the accessible name, so it is not optional in practice.
 * - `name`: The name submitted with the form value. Required for the field to participate in
 * submission at all: a form control with no name contributes no `FormData` entry.
 * - `placeholder`: Placeholder text. Not a substitute for `label`: it disappears on input and is not a
 * reliable accessible name.
 * - `required`: Marks the field required. An empty required field blocks submission and reports
 * "&lt;label&gt; is required".
 * - `rows`: Visible height in text rows.
 * - `value`: The current value, and what the form submits under `name`.
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
