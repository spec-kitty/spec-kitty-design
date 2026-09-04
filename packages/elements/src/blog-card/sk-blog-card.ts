import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import cardSheet from '../card/sk-card.css.js';
import sheet from './sk-blog-card.css.js';

/**
 * A blog preview card: thumbnail, eyebrow, title, excerpt, meta and a read-more link.
 *
 * It COMPOSES `sk-card`'s stylesheet rather than nesting the element, so the frame is authored
 * once in `sk-card.css` and this component's own sheet adds only blog layout — the contract its
 * CSS header has always described, now true of the element as well as the static form.
 *
 * @element sk-blog-card
 * @slot - the card's title, excerpt, meta and read-more link
 * @csspart card - the card frame, carrying both `sk-card` and `sk-blog-card`
 * @csspart thumbnail - the preview image, absent when no `thumbnail` is set
 * @csspart content - the text column
 */
export class SkBlogCard extends LitElement {
  // BOTH SHEETS, and the order is load-bearing: sk-card first, so blog-card's rules win where
  // the two touch. This is the composition the #78 ruling chose over nesting a real <sk-card>,
  // which would have moved the bordered box a shadow root deeper and forced every shared
  // declaration to be written twice — once plain, once through ::part(card).
  //
  // check-adopted-css-boundaries.mjs derives this adopted set from these very imports and
  // checks each sheet's rules against the component that AUTHORED it, so sk-card.css is held to
  // sk-card's ownership wherever it is adopted.
  static styles = [cardSheet, sheet];

  static properties = {
    thumbnail: { type: String, reflect: true },
    alt: { type: String, reflect: true },
    eyebrow: { type: String, reflect: true },
  };

  /** The preview image's URL. With none, no `<img>` is rendered at all — an empty one is a
   *  broken-image icon rather than a neutral placeholder. */
  declare thumbnail: string | undefined;

  /**
   * Alt text for the preview image. Set it whenever `thumbnail` is set.
   *
   * ONE WORD, and I walked into the reason twice. This was `thumbnailAlt`, which Lit maps to a
   * hyphenated `thumbnail-alt` attribute — and a hyphen is not a valid JS property key, so
   * `build-react-wrappers.mjs` refuses it: the emitted createElement props cannot carry the
   * key, and under ssrSafe (where React delivers first-render props as ATTRIBUTES) the value
   * would never reach the element. sk-ribbon-card hit this at #78 and its comment records it;
   * this component hit it anyway. `alt` is also the HTML attribute it feeds.
   */
  declare alt: string | undefined;

  /** A short lead-in above the title, such as a category. */
  declare eyebrow: string | undefined;

  render() {
    // ONE root carrying BOTH classes — structurally identical to the static form, which is what
    // lets `.sk-blog-card:hover { border-color }` work on both paths with one declaration.
    return html`<article part="card" class="sk-card sk-blog-card">
      ${this.thumbnail
        ? html`<img
            part="thumbnail"
            class="sk-blog-card__thumbnail"
            src=${this.thumbnail}
            alt=${this.alt ?? ''}
          />`
        : nothing}
      <div part="content" class="sk-blog-card__content">
        ${this.eyebrow ? html`<p class="sk-blog-card__eyebrow">${this.eyebrow}</p>` : nothing}
        <slot></slot>
      </div>
    </article>`;
  }
}

define('sk-blog-card', SkBlogCard);
