"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkGrid = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    gap,
    variant,
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
    "sk-grid",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      gap: gap,
      variant: variant,
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
