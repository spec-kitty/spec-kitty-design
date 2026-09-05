"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import {
  useEventListener,
  useProperties,
  createForwardedRefHandler,
} from "./react-utils.js";

export const SkTransitionMatrix = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    selectable,
    description,
    selectedRouteId,
    selectionHint,
    windowLabel,
    className,
    exportparts,
    htmlFor,
    part,
    tabIndex,
    columns,
    routes,
    ...restProps
  } = props;

  /** Waits for the client before loading the custom element */
  useEffect(() => {
    import("@spec-kitty/elements");
  }, []);

  /** Event listeners - run once */
  useEventListener(
    ref,
    "sk-transition-matrix-select",
    props.onSkTransitionMatrixSelect,
  );

  /** Properties - run whenever a property has changed */
  useProperties(ref, "columns", columns, () => Object.freeze([]));
  useProperties(ref, "routes", routes, () => Object.freeze([]));

  return React.createElement(
    "sk-transition-matrix",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      description: description,
      "selected-route-id": selectedRouteId ?? props["selected-route-id"],
      "selection-hint": selectionHint ?? props["selection-hint"],
      "window-label": windowLabel ?? props["window-label"],
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
