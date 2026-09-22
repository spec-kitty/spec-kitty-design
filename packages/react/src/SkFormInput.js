"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { useProperties, createForwardedRefHandler } from "./react-utils.js";

export const SkFormInput = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    disabled,
    invalid,
    readOnly,
    required,
    autoComplete,
    description,
    inputMode,
    label,
    max,
    min,
    name,
    pattern,
    placeholder,
    step,
    type,
    value,
    className,
    exportparts,
    htmlFor,
    part,
    tabIndex,
    options,
    ...restProps
  } = props;

  /** Waits for the client before loading the custom element */
  useEffect(() => {
    import("@spec-kitty/elements");
  }, []);

  /** Properties - run whenever a property has changed */
  useProperties(ref, "options", options, () => Object.freeze([]));

  return React.createElement(
    "sk-form-input",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      autocomplete: autoComplete ?? props["autocomplete"],
      description: description,
      inputmode: inputMode ?? props["inputmode"],
      label: label,
      max: max,
      min: min,
      name: name,
      pattern: pattern,
      placeholder: placeholder,
      step: step,
      type: type,
      value: value,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      disabled: disabled ? true : undefined,
      invalid: invalid ? true : undefined,
      readonly: readOnly ? true : undefined,
      required: required ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
