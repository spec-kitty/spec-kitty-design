"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkFormInput = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    disabled,
    invalid,
    required,
    description,
    label,
    name,
    placeholder,
    type,
    value,
    className,
    exportparts,
    htmlFor,
    part,
    tabIndex,
    ...restProps
  } = props;

  /** Waits for the client before loading the custom element */
  useEffect(() => {
    import("@spec-kitty/elements");
  }, []);

  return React.createElement(
    "sk-form-input",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      description: description,
      label: label,
      name: name,
      placeholder: placeholder,
      type: type,
      value: value,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      disabled: disabled ? true : undefined,
      invalid: invalid ? true : undefined,
      required: required ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
