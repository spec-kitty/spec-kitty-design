import React from "react";
import {
  SkBarChart as SkBarChartElement,
  BarChartSelectDetail,
} from "@spec-kitty/elements";

export type { SkBarChartElement, BarChartSelectDetail };

export interface SkBarChartProps extends Pick<
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
  /** Enables native button surfaces that request datum selection. */
  selectable?: boolean;

  /** Optional visible description associated with the chart figure. */
  description?: SkBarChartElement["description"];

  /** Accessible name for the chart figure. */
  label?: SkBarChartElement["label"];

  /** Controlled selected datum identifier. The component never mutates it. */
  selectedId?: SkBarChartElement["selectedId"];

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
  ref?: React.Ref<SkBarChartElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Complete consumer-owned data series. Invalid series fail closed. */
  series?: SkBarChartElement["series"];

  /** Requests selection for the exact consumer datum ID. The event bubbles, is composed, and is not cancelable. */
  onSkBarChartSelect?: (event: CustomEvent<BarChartSelectDetail>) => void;
}

/**
 * A controlled, property-fed bar chart for compact numeric comparisons.
 *
 * Token dependencies: --sk-border-default, --sk-border-strong, --sk-border-width-1,
 * --sk-border-focus, --sk-border-width-2, --sk-color-data-baseline,
 * --sk-color-data-grid, --sk-color-data-series-primary, --sk-fg-body, --sk-fg-default,
 * --sk-fg-muted, --sk-font-mono, --sk-font-sans,
 * --sk-motion-duration-fast, --sk-motion-ease-out, --sk-radius-md, --sk-radius-sm,
 * --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-5, --sk-space-6,
 * --sk-space-10, --sk-surface-card, --sk-surface-muted, --sk-surface-pill,
 * --sk-text-sm, --sk-text-xs, --sk-weight-semibold.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `description`: Optional visible description associated with the chart figure.
 * - `label`: Accessible name for the chart figure.
 * - `selectable`: Enables native button surfaces that request datum selection.
 * - `selected-id`/`selectedId`: Controlled selected datum identifier. The component never mutates it.
 * - `series`: Complete consumer-owned data series. Invalid series fail closed. (property only)
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-bar-chart-select`: Requests selection for the exact consumer datum ID. The event bubbles, is composed, and is not cancelable.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `bar`: The numeric SVG bar geometry.
 * - `chart`: Accessible figure root.
 * - `empty-state`: Stable empty or unavailable state.
 * - `item`: A single datum container.
 * - `label`: Consumer-authored category label.
 * - `plot`: Ordered collection of chart items.
 * - `value`: Consumer-authored display value.
 */
export const SkBarChart: React.ForwardRefExoticComponent<SkBarChartProps>;
