"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkSiteFooter = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    headingOne,
    headingTwo,
    legal,
    tagline,
    wordmark,
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
    "sk-site-footer",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      headingOne: headingOne,
      headingTwo: headingTwo,
      legal: legal,
      tagline: tagline,
      wordmark: wordmark,
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
