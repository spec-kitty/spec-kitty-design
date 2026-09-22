import React from "react";
import { SkMetric as SkMetricElement } from "@spec-kitty/elements";

export type { SkMetricElement };

export interface SkMetricProps extends Pick<
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
  /** Uses compact visual density when true, without changing content or semantics. Defaults to
`false`. */
  compact?: boolean;

  /** Optional supporting text, preserved exactly. Defaults to `''`; the annotation container is
omitted when this is empty. */
  annotation?: SkMetricElement["annotation"];

  /** Required opaque, preformatted display text, preserved exactly. Defaults to `''`; the
element never parses or rewrites it. */
  displayValue?: SkMetricElement["displayValue"];

  /** Required consumer-supplied label, preserved exactly. Defaults to `''`; blank values render
the unavailable state. */
  label?: SkMetricElement["label"];

  /** Generic presentation tone: `neutral` (the default), `info`, `success`, or `attention`.
Unsupported runtime values render the unavailable state. */
  tone?: SkMetricElement["tone"];

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
  ref?: React.Ref<SkMetricElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A generic supplied label and opaque display value with optional supporting annotation.
 *
 * The consumer owns all formatting and domain meaning. This element preserves valid strings
 * exactly and contributes a native definition relationship, not a section heading.
 *
 * Token dependencies: --sk-fg-default, --sk-fg-muted, --sk-font-mono, --sk-font-sans,
 * --sk-on-tint-butter, --sk-on-tint-mint, --sk-on-tint-sky, --sk-space-1,
 * --sk-space-2, --sk-space-3, --sk-space-4, --sk-text-2xl, --sk-text-sm,
 * --sk-text-xs, --sk-text-xl, --sk-weight-bold, --sk-weight-medium.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `annotation`: Optional supporting text, preserved exactly. Defaults to `''`; the annotation container is
 * omitted when this is empty.
 * - `compact`: Uses compact visual density when true, without changing content or semantics. Defaults to
 * `false`.
 * - `display-value`/`displayValue`: Required opaque, preformatted display text, preserved exactly. Defaults to `''`; the
 * element never parses or rewrites it.
 * - `label`: Required consumer-supplied label, preserved exactly. Defaults to `''`; blank values render
 * the unavailable state.
 * - `tone`: Generic presentation tone: `neutral` (the default), `info`, `success`, or `attention`.
 * Unsupported runtime values render the unavailable state.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `annotation`: The optional supporting annotation container.
 * - `empty-state`: The status shown when required content or tone is invalid.
 * - `label`: The supplied metric label.
 * - `metric`: The native definition-list metric container.
 * - `value`: The supplied opaque display value.
 */
export const SkMetric: React.ForwardRefExoticComponent<SkMetricProps>;
