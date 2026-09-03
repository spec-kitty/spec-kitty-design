import React from "react";
import { SkFormInput as SkFormInputElement } from "@spec-kitty/elements";

export type { SkFormInputElement };

export interface SkFormInputProps extends Pick<
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

  /** Whether the field is showing an error. The element sets it from its own validity.
Assigning it directly paints the error state WITHOUT setting validity — the field looks
wrong and still submits — so use `setCustomError()` instead. */
  invalid?: boolean;

  /** Marks the field required. An empty required field blocks submission and reports
`${label} is required`, or "This field is required" when `label` is empty. */
  required?: boolean;

  /** Optional helper text rendered under the control and linked to it for screen readers. */
  description?: SkFormInputElement["description"];

  /** The visible label. Also the accessible name, so it is not optional in practice. */
  label?: SkFormInputElement["label"];

  /** The name submitted with the form value. Without it the field contributes no `FormData`
entry — though a required empty one still blocks its form. */
  name?: SkFormInputElement["name"];

  /** Placeholder text. Not a substitute for `label`: it disappears on input and is not a
reliable accessible name. */
  placeholder?: SkFormInputElement["placeholder"];

  /** The native input type — `text`, `email`, `password`, and so on. */
  type?: SkFormInputElement["type"];

  /** The current value, and what the form submits under `name` — unless `disabled`, which
submits nothing. */
  value?: SkFormInputElement["value"];

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
  ref?: React.Ref<SkFormInputElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A labelled text input that participates in a native form.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `description`: Optional helper text rendered under the control and linked to it for screen readers.
 * - `disabled`: Excludes the field from submission and from user interaction.
 * - `invalid`: Whether the field is showing an error. The element sets it from its own validity.
 * Assigning it directly paints the error state WITHOUT setting validity — the field looks
 * wrong and still submits — so use `setCustomError()` instead.
 * - `label`: The visible label. Also the accessible name, so it is not optional in practice.
 * - `name`: The name submitted with the form value. Without it the field contributes no `FormData`
 * entry — though a required empty one still blocks its form.
 * - `placeholder`: Placeholder text. Not a substitute for `label`: it disappears on input and is not a
 * reliable accessible name.
 * - `required`: Marks the field required. An empty required field blocks submission and reports
 * `${label} is required`, or "This field is required" when `label` is empty.
 * - `type`: The native input type — `text`, `email`, `password`, and so on.
 * - `value`: The current value, and what the form submits under `name` — unless `disabled`, which
 * submits nothing.
 *
 * ## Methods
 *
 * Methods that can be called to access component functionality.
 *
 * - `checkValidity() => boolean`: Whether the field is currently valid. Silent — reports nothing to the user.
 * - `formDisabledCallback(isDisabled: boolean) => void`: Called by the browser when a containing fieldset is disabled or re-enabled.
 * - `formResetCallback() => void`: Called by the browser when the containing form resets. Restores the value the
 * field had on connect.
 * - `reportValidity() => boolean`: Like `checkValidity()`, but also shows the browser's validation message.
 * - `setCustomError(message: string | null) => void`: Set or clear a validation error the element cannot derive itself — a server-side rejection,
 * a cross-field rule. Pass `null` to clear it.
 *
 * Prefer this over assigning `invalid`: it sets validity, so the field genuinely blocks
 * submission rather than only looking wrong.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `control`: the input
 * - `description`: the helper text
 * - `error`: the validation message
 * - `field`: the field wrapper
 * - `label`: the label
 */
export const SkFormInput: React.ForwardRefExoticComponent<SkFormInputProps>;
