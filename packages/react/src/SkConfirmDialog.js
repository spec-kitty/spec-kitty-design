"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkConfirmDialog = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    backdropDismiss,
    open,
    cancelLabel,
    confirmLabel,
    confirmVariant,
    dialogTitle,
    initialFocus,
    message,
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
    "sk-confirm-dialog",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      "cancel-label": cancelLabel ?? props["cancel-label"],
      "confirm-label": confirmLabel ?? props["confirm-label"],
      "confirm-variant": confirmVariant ?? props["confirm-variant"],
      "dialog-title": dialogTitle ?? props["dialog-title"],
      "initial-focus": initialFocus ?? props["initial-focus"],
      message: message,
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      "backdrop-dismiss": backdropDismiss ? true : undefined,
      open: open ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
