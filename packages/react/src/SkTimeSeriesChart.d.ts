import React from "react";
import {
  SkTimeSeriesChart as SkTimeSeriesChartElement,
  TimeSeriesChartSelectDetail,
} from "@spec-kitty/elements";

export type { SkTimeSeriesChartElement, TimeSeriesChartSelectDetail };

export interface SkTimeSeriesChartProps extends Pick<
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
  /** Enables native controls that request selection of a point. */
  selectable?: boolean;

  /** Optional visible description associated with the chart figure. */
  description?: SkTimeSeriesChartElement["description"];

  /** Consumer-supplied gap duration, in the same unit as the point timestamps, at or beyond which
a run with no observation earns a visible note. Zero, negative and non-finite values annotate
nothing. The element infers no threshold of its own. */
  gapThreshold?: SkTimeSeriesChartElement["gapThreshold"];

  /** Accessible name for the chart figure and the published table's caption. */
  label?: SkTimeSeriesChartElement["label"];

  /** Controlled selected point identifier. The component never mutates it. */
  selectedId?: SkTimeSeriesChartElement["selectedId"];

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
  ref?: React.Ref<SkTimeSeriesChartElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Complete consumer-owned series collection. An invalid collection fails closed. */
  series?: SkTimeSeriesChartElement["series"];

  /** Requests selection of the exact consumer point. The event bubbles, is composed, and is cancelable; cancelling it suppresses the element's own focus move and nothing else. */
  onSkTimeSeriesChartSelect?: (
    event: CustomEvent<TimeSeriesChartSelectDetail>,
  ) => void;
}

/**
 * A controlled, property-fed line chart over a time axis whose missing intervals are drawn as
 * gaps and published as "No data".
 *
 * Every value is published persistently in a paired native table — the element's accessible
 * representation and its narrow-viewport treatment — so no meaning is hover-only. The graphic is
 * aria-hidden and carries no accessible content of its own. Selection is controlled: activation
 * requests a change and never makes one, and the only default action the element owns is moving
 * focus to the activated point, which a listener may cancel.
 *
 * Series are distinguished by three redundant channels — ink, dash pattern and marker shape —
 * because ink is the one of the three that collapses under forced-colors and in greyscale.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-chart-baseline, --sk-chart-dash-1,
 * --sk-chart-dash-2, --sk-chart-dash-3, --sk-chart-dash-4, --sk-chart-gap,
 * --sk-chart-gap-dash, --sk-chart-gap-fill, --sk-chart-grid, --sk-chart-plot-block-size,
 * --sk-chart-series-1, --sk-chart-series-2, --sk-chart-series-3, --sk-chart-series-4,
 * --sk-chart-stroke-width, --sk-fg-body, --sk-fg-default, --sk-fg-muted, --sk-font-mono,
 * --sk-font-sans, --sk-motion-duration-fast, --sk-motion-ease-out, --sk-radius-md,
 * --sk-radius-sm, --sk-space-1, --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-5,
 * --sk-space-6, --sk-space-10, --sk-surface-card, --sk-surface-pill, --sk-text-sm,
 * --sk-text-xs, --sk-weight-medium.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `description`: Optional visible description associated with the chart figure.
 * - `gap-threshold`/`gapThreshold`: Consumer-supplied gap duration, in the same unit as the point timestamps, at or beyond which
 * a run with no observation earns a visible note. Zero, negative and non-finite values annotate
 * nothing. The element infers no threshold of its own.
 * - `label`: Accessible name for the chart figure and the published table's caption.
 * - `selectable`: Enables native controls that request selection of a point.
 * - `selected-id`/`selectedId`: Controlled selected point identifier. The component never mutates it.
 * - `series`: Complete consumer-owned series collection. An invalid collection fails closed. (property only)
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-time-series-chart-select`: Requests selection of the exact consumer point. The event bubbles, is composed, and is cancelable; cancelling it suppresses the element's own focus move and nothing else.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `chart`: Accessible figure root.
 * - `empty-state`: Stable empty or unavailable state.
 * - `gap`: A drawn interval with no observation.
 * - `gap-note`: One such note.
 * - `gap-notes`: Visible notes for gaps beyond the supplied threshold.
 * - `legend`: Series key carrying ink, dash pattern and marker shape.
 * - `line`: One drawn segment of one series at one resolution.
 * - `marker`: One observation's marker, shaped by series.
 * - `plot`: Framed viewport holding the graphic.
 * - `point`: Native selection control, present only when selectable.
 * - `resolution-boundary`: The rule where a supplied resolution changes.
 * - `row`: One point's row.
 * - `scroller`: Scrollable viewport for the published table.
 * - `series-name`: Consumer-authored series name in the legend.
 * - `table`: The paired tabular equivalent of the same series.
 * - `value`: One point's display string, or the no-observation literal.
 */
export const SkTimeSeriesChart: React.ForwardRefExoticComponent<SkTimeSeriesChartProps>;
