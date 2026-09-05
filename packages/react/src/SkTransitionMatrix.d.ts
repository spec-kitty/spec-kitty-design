import React from "react";
import {
  SkTransitionMatrix as SkTransitionMatrixElement,
  TransitionMatrixSelectDetail,
} from "@spec-kitty/elements";

export type { SkTransitionMatrixElement, TransitionMatrixSelectDetail };

export interface SkTransitionMatrixProps extends Pick<
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
  /** Enables route-selection intent without taking ownership of selection. */
  selectable?: boolean;

  /** Optional consumer-authored explanation shown above the matrix. */
  description?: SkTransitionMatrixElement["description"];

  /** Consumer-controlled selected route id. */
  selectedRouteId?: SkTransitionMatrixElement["selectedRouteId"];

  /** Optional consumer-authored selectable-row instruction. */
  selectionHint?: SkTransitionMatrixElement["selectionHint"];

  /** Optional consumer-authored label for the reporting window. */
  windowLabel?: SkTransitionMatrixElement["windowLabel"];

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
  ref?: React.Ref<SkTransitionMatrixElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Consumer-labelled time buckets, assigned as a JavaScript property. */
  columns?: SkTransitionMatrixElement["columns"];

  /** Aggregate transition routes, assigned as a JavaScript property. */
  routes?: SkTransitionMatrixElement["routes"];

  /** Requests that the consumer inspect a route. The event bubbles, is composed, and is not cancelable. */
  onSkTransitionMatrixSelect?: (
    event: CustomEvent<TransitionMatrixSelectDetail>,
  ) => void;
}

/**
 * An aggregate route-by-time-bucket transition matrix with controlled route-selection intent.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-color-blue, --sk-color-green,
 * --sk-color-purple, --sk-color-red, --sk-fg-body, --sk-fg-default, --sk-fg-muted,
 * --sk-fg-on-card, --sk-font-mono, --sk-font-sans, --sk-radius-lg, --sk-radius-sm,
 * --sk-space-1, --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-5,
 * --sk-space-6, --sk-space-10, --sk-space-12, --sk-surface-card,
 * --sk-surface-muted, --sk-surface-pill, --sk-text-lg, --sk-text-sm, --sk-text-xs,
 * --sk-weight-medium, --sk-weight-semibold.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `description`: Optional consumer-authored explanation shown above the matrix.
 * - `selectable`: Enables route-selection intent without taking ownership of selection.
 * - `selected-route-id`/`selectedRouteId`: Consumer-controlled selected route id.
 * - `selection-hint`/`selectionHint`: Optional consumer-authored selectable-row instruction.
 * - `window-label`/`windowLabel`: Optional consumer-authored label for the reporting window.
 * - `columns`: Consumer-labelled time buckets, assigned as a JavaScript property. (property only)
 * - `routes`: Aggregate transition routes, assigned as a JavaScript property. (property only)
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-transition-matrix-select`: Requests that the consumer inspect a route. The event bubbles, is composed, and is not cancelable.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `bar`: A proportional magnitude bar.
 * - `empty-state`: Labelled empty or invalid-data state.
 * - `group`: Visible separator for a contiguous named route group.
 * - `header`: Title, derived move total, and consumer-supplied window label.
 * - `legend`: Ordered labels for the tones present in the supplied routes.
 * - `route`: A route row header.
 * - `row`: A route row.
 * - `scroller`: Horizontally scrollable table viewport.
 * - `table`: Native transition matrix table.
 * - `total`: A derived route total.
 */
export const SkTransitionMatrix: React.ForwardRefExoticComponent<SkTransitionMatrixProps>;
