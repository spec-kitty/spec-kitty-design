"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { useEventListener, createForwardedRefHandler } from "./react-utils.js";

export const SkThemeToggle = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    darkLabel,
    label,
    lightLabel,
    preference,
    systemLabel,
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
  useEventListener(ref, "sk-theme-change", props.onSkThemeChange);

  return React.createElement(
    "sk-theme-toggle",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      "dark-label": darkLabel ?? props["dark-label"],
      label: label,
      "light-label": lightLabel ?? props["light-label"],
      preference: preference,
      "system-label": systemLabel ?? props["system-label"],
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
