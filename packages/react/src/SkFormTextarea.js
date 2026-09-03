"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkFormTextarea = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    disabled,
    invalid,
    required,
    description,
    label,
    name,
    placeholder,
    rows,
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
    "sk-form-textarea",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      description: description,
      label: label,
      name: name,
      placeholder: placeholder,
      rows: rows,
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
