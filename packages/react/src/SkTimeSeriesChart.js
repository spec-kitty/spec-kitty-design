"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import {
  useEventListener,
  useProperties,
  createForwardedRefHandler,
} from "./react-utils.js";

export const SkTimeSeriesChart = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    selectable,
    description,
    gapThreshold,
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
  useEventListener(
    ref,
    "sk-time-series-chart-select",
    props.onSkTimeSeriesChartSelect,
  );

  /** Properties - run whenever a property has changed */
  useProperties(ref, "series", series, () => Object.freeze([]));

  return React.createElement(
    "sk-time-series-chart",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      description: description,
      "gap-threshold": gapThreshold ?? props["gap-threshold"],
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
