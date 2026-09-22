"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import {
  useEventListener,
  useProperties,
  createForwardedRefHandler,
} from "./react-utils.js";

export const SkBarChart = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    selectable,
    description,
    label,
    selectedId,
    className,
    exportparts,
    htmlFor,
    part,
    tabIndex,
    series,
    ...restProps
  } = props;

  /** Waits for the client before loading the custom element */
  useEffect(() => {
    import("@spec-kitty/elements");
  }, []);

  /** Event listeners - run once */
  useEventListener(ref, "sk-bar-chart-select", props.onSkBarChartSelect);

  /** Properties - run whenever a property has changed */
  useProperties(ref, "series", series, () => Object.freeze([]));

  return React.createElement(
    "sk-bar-chart",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      description: description,
      label: label,
      "selected-id": selectedId ?? props["selected-id"],
      class: className,
      exportparts: exportparts,
      for: htmlFor ?? props["for"],
      part: part,
      tabindex: tabIndex ?? props["tabindex"],
      selectable: selectable ? true : undefined,
      style: { ...props.style },
    },
    props.children,
  );
});
