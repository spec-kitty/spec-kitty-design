"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkMetric = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    compact,
    annotation,
    displayValue,
    label,
    tone,
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
    "sk-metric",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      annotation: annotation,
      "display-value": displayValue ?? props["display-value"],
      label: label,
      tone: tone,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      compact: compact ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
