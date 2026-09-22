import React from "react";
import {
  SkNotice as SkNoticeElement,
  SkNoticeDismissDetail,
} from "@spec-kitty/elements";

export type { SkNoticeElement, SkNoticeDismissDetail };

export interface SkNoticeProps extends Pick<
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
  /** Whether to render the dismiss control. The element never removes itself when it is used. */
  dismissible?: boolean;

  /** Announcement politeness. `off` (the default) renders no live region; `polite` renders
`role="status"`; `assertive` renders `role="alert"`. Independent of `tone`. */
  announce?: SkNoticeElement["announce"];

  /** Accessible name for the dismiss control. Defaults to `Dismiss notice`. */
  dismissLabel?: SkNoticeElement["dismissLabel"];

  /** The message text. Changing it to a DIFFERENT value re-announces, when announcement is on.

Re-setting it to the value it already holds announces nothing: Lit's default `hasChanged` is
`!==`, so an identical assignment produces no update and no DOM mutation for a screen reader
to notice. A dashboard that reports "Connection lost" twice in a row therefore announces it
once. If a repeat genuinely needs to be heard, the consumer must make the text differ — a
count or a timestamp — because an element that re-announced identical text on every
assignment would be unusable for the polling callers this is built for.

A consumer that must announce a message which already exists when the notice is inserted
should insert the notice first and then assign this — a live region that enters the DOM
together with its content is not reliably announced, and the element cannot defer its own
first paint without a timer. */
  message?: SkNoticeElement["message"];

  /** Presentation tone, from the library's one tone vocabulary. Unknown values render as
`neutral` without changing the visible message. */
  tone?: SkNoticeElement["tone"];

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
  ref?: React.Ref<SkNoticeElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;

  /** Requests dismissal; `detail: { tone }`. Bubbles, is composed, and is cancelable. The element never removes itself. After the event, focus moves to the notice host; `preventDefault()` abandons that move and leaves focus on the dismiss control. If you remove the notice in your handler you MUST move focus yourself — the host is gone by then and focus falls to `<body>`. */
  onSkNoticeDismiss?: (event: CustomEvent<SkNoticeDismissDetail>) => void;
}

/**
 * A block-level status message about a page or a region of it, announced at a politeness the
 * consumer chooses.
 *
 * Announcement is an explicit property, never a side effect of tone: a `danger` notice with
 * `announce="off"` is silent, and a `neutral` one with `announce="assertive"` interrupts. The
 * element owns no application state — the consumer decides whether a notice exists — and it has
 * no timer, no positioning and no stacking. It is not a toast.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-border-width-4, --sk-fg-body, --sk-font-sans,
 * --sk-motion-duration-fast, --sk-motion-ease-out, --sk-on-status-attention,
 * --sk-on-status-danger, --sk-on-status-info, --sk-on-status-neutral, --sk-on-status-recovery,
 * --sk-on-status-success, --sk-radius-md, --sk-radius-sm, --sk-space-1, --sk-space-2,
 * --sk-space-3, --sk-space-4, --sk-status-attention, --sk-status-danger, --sk-status-info,
 * --sk-status-neutral, --sk-status-recovery, --sk-status-success, --sk-surface-card,
 * --sk-text-base, --sk-text-lg, --sk-weight-semibold.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `announce`: Announcement politeness. `off` (the default) renders no live region; `polite` renders
 * `role="status"`; `assertive` renders `role="alert"`. Independent of `tone`.
 * - `dismiss-label`/`dismissLabel`: Accessible name for the dismiss control. Defaults to `Dismiss notice`.
 * - `dismissible`: Whether to render the dismiss control. The element never removes itself when it is used.
 * - `message`: The message text. Changing it to a DIFFERENT value re-announces, when announcement is on.
 *
 * Re-setting it to the value it already holds announces nothing: Lit's default `hasChanged` is
 * `!==`, so an identical assignment produces no update and no DOM mutation for a screen reader
 * to notice. A dashboard that reports "Connection lost" twice in a row therefore announces it
 * once. If a repeat genuinely needs to be heard, the consumer must make the text differ — a
 * count or a timestamp — because an element that re-announced identical text on every
 * assignment would be unusable for the polling callers this is built for.
 *
 * A consumer that must announce a message which already exists when the notice is inserted
 * should insert the notice first and then assign this — a live region that enters the DOM
 * together with its content is not reliably announced, and the element cannot defer its own
 * first paint without a timer.
 * - `tone`: Presentation tone, from the library's one tone vocabulary. Unknown values render as
 * `neutral` without changing the visible message.
 *
 * ## Events
 *
 * Events that will be emitted by the component.
 *
 * - `sk-notice-dismiss`: Requests dismissal; `detail: { tone }`. Bubbles, is composed, and is cancelable. The element never removes itself. After the event, focus moves to the notice host; `preventDefault()` abandons that move and leaves focus on the dismiss control. If you remove the notice in your handler you MUST move focus yourself — the host is gone by then and focus falls to `<body>`.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: The message body. Rendered inside the live region, so slotted content is announced with `message`.
 * - `actions`: Trailing consumer-owned controls, such as `sk-button`s.
 * - `heading`: A consumer-supplied native heading. The element generates none, so the level stays the consumer's. Rendered INSIDE the live region and first within it, so a headline here is announced ahead of `message` and the default slot (#228). Both live-region roles this element renders are implicitly atomic, so every later re-announcement repeats the heading too; if you want a headline that is seen and never heard, put it outside the notice.
 * - `marker`: A decorative consumer-supplied marker. Falls back to a per-tone glyph.
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `actions`: The trailing actions wrapper.
 * - `body`: The heading, the message and the default slot, and the live region when announcement is on.
 * - `content`: The body and actions column.
 * - `dismiss`: The dismiss control.
 * - `heading`: The consumer heading's wrapper. Nested inside `body`, and therefore inside the live region when announcement is on.
 * - `marker`: The decorative marker wrapper.
 * - `notice`: The notice layout root.
 */
export const SkNotice: React.ForwardRefExoticComponent<SkNoticeProps>;
