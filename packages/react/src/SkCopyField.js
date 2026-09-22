"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { useEventListener, createForwardedRefHandler } from "./react-utils.js";

export const SkCopyField = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    failureMessage,
    label,
    manualMessage,
    successMessage,
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

  /** Event listeners - run once */
  useEventListener(ref, "sk-copy-field-result", props.onSkCopyFieldResult);

  return React.createElement(
    "sk-copy-field",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      "failure-message": failureMessage ?? props["failure-message"],
      label: label,
      "manual-message": manualMessage ?? props["manual-message"],
      "success-message": successMessage ?? props["success-message"],
      value: value,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      style: { ...props.style },
    },
    props.children,
  );
});
