import React from "react";
import {
  SkActionRow as SkActionRowElement,
  ActionRowActivateDetail,
} from "@spec-kitty/elements";

export type { SkActionRowElement, ActionRowActivateDetail };

export interface SkActionRowProps extends Pick<
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
  /** Enables the native primary trigger when `rowId` is non-empty. */
  selectable?: boolean;

  /** Consumer-controlled current-row presentation. Activation never changes this value. */
  selected?: boolean;

  /** Stable consumer-owned identifier included in activation requests. */
  rowId?: SkActionRowElement["rowId"];

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
  ref?: React.Ref<SkActionRowElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Requests activation for the exact consumer row ID. The event bubbles, is composed, and is not cancelable. */
  onSkActionRowActivate?: (event: CustomEvent<ActionRowActivateDetail>) => void;
}

/**
 * A controlled, consumer-composed action row.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-fg-body, --sk-fg-default, --sk-fg-muted,
 * --sk-font-display, --sk-font-mono, --sk-font-sans, --sk-motion-duration-fast,
 * --sk-motion-ease-out, --sk-radius-md, --sk-space-1, --sk-space-2, --sk-space-3,
 * --sk-space-4, --sk-space-5, --sk-surface-card, --sk-surface-muted, --sk-surface-pill,
 * --sk-text-base, --sk-text-sm, --sk-text-xs, --sk-weight-medium, --sk-weight-semibold.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `row-id`/`rowId`: Stable consumer-owned identifier included in activation requests.
 * - `selectable`: Enables the native primary trigger when `rowId` is non-empty.
 * - `selected`: Consumer-controlled current-row presentation. Activation never changes this value.
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-action-row-activate`: Requests activation for the exact consumer row ID. The event bubbles, is composed, and is not cancelable.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `controls`: Independent trailing controls.
 * - `marker`: Consumer-supplied visual marker.
 * - `metadata`: Consumer-authored trailing metadata.
 * - `reference`: Consumer-authored reference or path.
 * - `tags`: Consumer-authored semantic tags.
 * - `title`: Primary consumer-authored title.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `controls`: Independent controls wrapper.
 * - `marker`: Marker projection wrapper.
 * - `metadata`: Metadata projection wrapper.
 * - `reference`: Reference projection wrapper.
 * - `row`: Stable row root.
 * - `tags`: Tags projection wrapper.
 * - `title`: Title projection wrapper.
 * - `trigger`: Primary scan-content surface.
 */
export const SkActionRow: React.ForwardRefExoticComponent<SkActionRowProps>;
