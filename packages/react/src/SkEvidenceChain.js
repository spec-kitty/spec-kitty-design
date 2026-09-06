"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { useProperties, createForwardedRefHandler } from "./react-utils.js";

export const SkEvidenceChain = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    className,
    exportparts,
    htmlFor,
    part,
    tabIndex,
    stages,
    ...restProps
  } = props;

  /** Waits for the client before loading the custom element */
  useEffect(() => {
    import("@spec-kitty/elements");
  }, []);

  /** Properties - run whenever a property has changed */
  useProperties(ref, "stages", stages, () => Object.freeze([]));

  return React.createElement(
    "sk-evidence-chain",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
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
