"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import {
  useEventListener,
  useProperties,
  createForwardedRefHandler,
} from "./react-utils.js";

export const SkAppShell = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    open,
    presentation,
    className,
    exportparts,
    htmlFor,
    part,
    tabIndex,
    compactTrigger,
    ...restProps
  } = props;

  /** Waits for the client before loading the custom element */
  useEffect(() => {
    import("@spec-kitty/elements");
  }, []);

  /** Event listeners - run once */
  useEventListener(ref, "sk-app-shell-dismiss", props.onSkAppShellDismiss);

  /** Properties - run whenever a property has changed */
  useProperties(ref, "compactTrigger", compactTrigger, () => null);

  return React.createElement(
    "sk-app-shell",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      presentation: presentation,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      open: open ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
