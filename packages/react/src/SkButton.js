"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkButton = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    busy,
    disabled,
    href,
    label,
    size,
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
    "sk-button",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      href: href,
      label: label,
      size: size,
      variant: variant,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      busy: busy ? true : undefined,
      disabled: disabled ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
