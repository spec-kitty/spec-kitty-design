import React from "react";
import { SkBlogCard as SkBlogCardElement } from "@spec-kitty/elements";

export type { SkBlogCardElement };

export interface SkBlogCardProps extends Pick<
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
  /** Alt text for the preview image. Set it whenever `thumbnail` is set.

ONE WORD, and I walked into the reason twice. This was `thumbnailAlt`, which Lit maps to a
hyphenated `thumbnail-alt` attribute — and a hyphen is not a valid JS property key, so
`build-react-wrappers.mjs` refuses it: the emitted createElement props cannot carry the
key, and under ssrSafe (where React delivers first-render props as ATTRIBUTES) the value
would never reach the element. sk-ribbon-card hit this at #78 and its comment records it;
this component hit it anyway. `alt` is also the HTML attribute it feeds. */
  alt?: SkBlogCardElement["alt"];

  /** A short lead-in above the title, such as a category. */
  eyebrow?: SkBlogCardElement["eyebrow"];

  /** The preview image's URL. With none, no `<img>` is rendered at all — an empty one is a
broken-image icon rather than a neutral placeholder. */
  thumbnail?: SkBlogCardElement["thumbnail"];

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
  ref?: React.Ref<SkBlogCardElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

/**
 * A blog preview card: thumbnail, eyebrow, title, excerpt, meta and a read-more link.
 *
 * It COMPOSES `sk-card`'s stylesheet rather than nesting the element, so the frame is authored
 * once in `sk-card.css` and this component's own sheet adds only blog layout — the contract its
 * CSS header has always described, now true of the element as well as the static form.
 *
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `alt`: Alt text for the preview image. Set it whenever `thumbnail` is set.
 *
 * ONE WORD, and I walked into the reason twice. This was `thumbnailAlt`, which Lit maps to a
 * hyphenated `thumbnail-alt` attribute — and a hyphen is not a valid JS property key, so
 * `build-react-wrappers.mjs` refuses it: the emitted createElement props cannot carry the
 * key, and under ssrSafe (where React delivers first-render props as ATTRIBUTES) the value
 * would never reach the element. sk-ribbon-card hit this at #78 and its comment records it;
 * this component hit it anyway. `alt` is also the HTML attribute it feeds.
 * - `eyebrow`: A short lead-in above the title, such as a category.
 * - `thumbnail`: The preview image's URL. With none, no `<img>` is rendered at all — an empty one is a
 * broken-image icon rather than a neutral placeholder.
 *
 * ## Slots
 *
 * Areas where markup can be added to the component.
 *
 * - `(default)`: the card's title, excerpt, meta and read-more link
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `card`: the card frame, carrying both `sk-card` and `sk-blog-card`
 * - `content`: the text column
 * - `thumbnail`: the preview image, absent when no `thumbnail` is set
 */
export const SkBlogCard: React.ForwardRefExoticComponent<SkBlogCardProps>;
