"use client";
import React, { forwardRef, useEffect, useRef } from "react";

import { createForwardedRefHandler } from "./react-utils.js";

export const SkBlogCard = forwardRef((props, forwardedRef) => {
  const ref = useRef(null);
  const {
    alt,
    eyebrow,
    thumbnail,
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
    "sk-blog-card",
    {
      ref: createForwardedRefHandler(ref, forwardedRef),
      ...restProps,
      alt: alt,
      eyebrow: eyebrow,
      thumbnail: thumbnail,
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
