"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { useEventListener, createForwardedRefHandler } from "./react-utils.js";

export const SkNotice = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    dismissible,
    announce,
    dismissLabel,
    message,
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

  /** Event listeners - run once */
  useEventListener(ref, "sk-notice-dismiss", props.onSkNoticeDismiss);

  return React.createElement(
    "sk-notice",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      announce: announce,
      "dismiss-label": dismissLabel ?? props["dismiss-label"],
      message: message,
      tone: tone,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      dismissible: dismissible ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
