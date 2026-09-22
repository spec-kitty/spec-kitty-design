"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkStub = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const { className, exportparts, htmlFor, part, tabIndex, ...restProps } =
    props;

  /** Waits for the client before loading the custom element */
  useEffect(() => {
    import("@spec-kitty/elements");
  }, []);

  return React.createElement(
    "sk-stub",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
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
