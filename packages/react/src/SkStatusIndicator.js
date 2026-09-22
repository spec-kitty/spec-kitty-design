"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkStatusIndicator = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    pulsing,
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
    "sk-status-indicator",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      tone: tone,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      pulsing: pulsing ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
