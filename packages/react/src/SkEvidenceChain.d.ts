import React from "react";
import { SkEvidenceChain as SkEvidenceChainElement } from "@spec-kitty/elements";

export type { SkEvidenceChainElement };

export interface SkEvidenceChainProps extends Pick<
  React.AllHTMLAttributes<HTMLElement>,
  | "children"
  | "dir"
  | "hidden"
  | "id"
  | "lang"
  | "slot"
  | "style"
  | "title"
  | "translate"
  | "onClick"
  | "onFocus"
  | "onBlur"
> {
  /** A space-separated list of the classes of the element. Classes allows CSS and JavaScript to select and access specific elements via the class selectors or functions like the method `Document.getElementsByClassName()`. */
  className?: string;

  /** Contains a space-separated list of the part names of the element that should be exposed on the host element. */
  exportparts?: string;

  /** Used for labels to link them with their inputs (using input id). */
  htmlFor?: string;

  /** Used to help React identify which items have changed, are added, or are removed within a list. */
  key?: number | string;

  /** Contains a space-separated list of the part names of the element. Part names allows CSS to select and style specific elements in a shadow tree via the ::part pseudo-element. */
  part?: string;

  /** A mutable ref object whose `.current` property is initialized to the passed argument (`initialValue`). The returned object will persist for the full lifetime of the component. */
  ref?: React.Ref<SkEvidenceChainElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Ordered consumer-supplied stages, assigned as a JavaScript property. Assign a new array
reference after changing the collection. Defaults to a frozen empty array. */
  stages?: SkEvidenceChainElement["stages"];
}

/**
 * An ordered chain of generic evidence stages composed from real `sk-metric` elements.
 *
 * The consumer owns stage order, identity, display formatting, and domain meaning. Valid supplied
 * strings and object references are preserved; invalid whole inputs fail closed.
 *
 * Token dependencies: --sk-border-strong, --sk-border-width-2, --sk-fg-muted,
 * --sk-font-sans, --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-6,
 * --sk-text-sm.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `stages`: Ordered consumer-supplied stages, assigned as a JavaScript property. Assign a new array
 * reference after changing the collection. Defaults to a frozen empty array. (property only)
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `connector`: A decorative connector between adjacent stages.
 * - `empty-state`: The status shown for empty or invalid whole input.
 * - `list`: The native ordered list containing the evidence stages.
 * - `stage`: An individual evidence stage list item.
 */
export const SkEvidenceChain: React.ForwardRefExoticComponent<SkEvidenceChainProps>;
