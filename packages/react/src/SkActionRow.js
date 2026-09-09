"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { useEventListener, createForwardedRefHandler } from "./react-utils.js";

export const SkActionRow = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    selectable,
    selected,
    href,
    layout,
    presentation,
    rowId,
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
  useEventListener(ref, "sk-action-row-activate", props.onSkActionRowActivate);

  return React.createElement(
    "sk-action-row",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      href: href,
      layout: layout,
      presentation: presentation,
      "row-id": rowId ?? props["row-id"],
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      selectable: selectable ? true : undefined,
      selected: selected ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
