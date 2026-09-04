"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkCheckBullet = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    icon,
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
    "sk-check-bullet",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      icon: icon,
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
