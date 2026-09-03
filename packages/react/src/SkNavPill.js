"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { useEventListener, createForwardedRefHandler } from "./react-utils.js";

export const SkNavPill = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    isOpen,
    label,
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
  useEventListener(ref, "sk-nav-pill-toggle", props.onSkNavPillToggle);

  return React.createElement(
    "sk-nav-pill",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      label: label,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      open: isOpen ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
