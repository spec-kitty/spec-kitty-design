import React from "react";
import { SkAppShell as SkAppShellElement } from "@spec-kitty/elements";

export type { SkAppShellElement };

export interface SkAppShellProps extends Pick<
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
  /** Consumer-controlled compact drawer state. The shell never changes this value. */
  open?: boolean;

  /** Enables the opt-in compact layout. Omit it for the legacy responsive shell. */
  presentation?: SkAppShellElement["presentation"];

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
  ref?: React.Ref<SkAppShellElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Consumer trigger used only for accepted-Escape focus return. It must be actually assigned within this shell's compact-header slot and control a same-root target actually assigned within this shell's compact-navigation slot. */
  compactTrigger?: SkAppShellElement["compactTrigger"];

  /** Requests dismissal after Escape while the controlled compact drawer is effectively open. Detail is `{ reason: 'escape' }`; the event bubbles, is composed, and is not cancelable. */
  onSkAppShellDismiss?: (
    event: CustomEvent<{ readonly reason: "escape" }>,
  ) => void;
}

/**
 * A stateless page frame for personal navigation, contextual navigation, page heading, and content.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-layout-context-sidebar-width,
 * --sk-layout-personal-rail-width, --sk-space-3, --sk-space-4, --sk-space-12,
 * --sk-surface-card.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `open`: Consumer-controlled compact drawer state. The shell never changes this value.
 * - `presentation`: Enables the opt-in compact layout. Omit it for the legacy responsive shell.
 * - `compactTrigger`: Consumer trigger used only for accepted-Escape focus return. It must be actually assigned within this shell's compact-header slot and control a same-root target actually assigned within this shell's compact-navigation slot. (property only)
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-app-shell-dismiss`: Requests dismissal after Escape while the controlled compact drawer is effectively open. Detail is `{ reason: 'escape' }`; the event bubbles, is composed, and is not cancelable.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: Consumer-owned main page content.
 * - `compact-header`: Consumer-owned compact identity and trigger, directly assigned or wrapped by a directly assigned light-DOM element.
 * - `compact-navigation`: Consumer-owned navigation target, directly assigned or wrapped by a directly assigned light-DOM element; its id and accessible label stay consumer-owned.
 * - `context-sidebar`: Consumer-owned navigation or content for the selected context.
 * - `page-header`: Consumer-owned page title, supporting text, metadata, and actions.
 * - `personal-rail`: Consumer-owned personal or application navigation.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `compact-header`: The compact identity and trigger row.
 * - `compact-navigation`: The bounded compact navigation drawer.
 * - `content`: The page header and main-content column.
 * - `context`: The contextual-navigation column.
 * - `header`: The page-header region.
 * - `main`: The main-content landmark.
 * - `personal`: The personal-navigation column.
 * - `shell`: The complete responsive shell grid.
 */
export const SkAppShell: React.ForwardRefExoticComponent<SkAppShellProps>;
