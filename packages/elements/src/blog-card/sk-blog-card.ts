import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import cardSheet from '../card/sk-card.css.js';
import sheet from './sk-blog-card.css.js';
import { BLOG_CARD_CLASSES } from './sk-blog-card.markup.js';

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
  // BOTH SHEETS, sk-card FIRST. This is the composition the #78 ruling chose over nesting a
  // real <sk-card>, which would have moved the bordered box a shadow root deeper and forced
  // every shared declaration to be written twice — once plain, once through ::part(card).
  //
  // THE ORDER IS A CONVENTION, NOT A CURRENTLY-OBSERVABLE BEHAVIOUR, and saying so precisely
  // matters. An earlier revision of this comment called it "load-bearing: sk-card first, so
  // blog-card's rules win where the two touch" — but a lens diffed the two sheets and found
  // `color` was their ONLY overlapping declaration, with the same value on both sides, so
  // swapping them changed no computed style anywhere. That duplicate has now been removed from
  // sk-blog-card.css, which means the two sheets share zero declarations and the order is
  // currently unobservable by design.
  //
  // It is still fixed, and still asserted, because the invariant is that blog-card MUST be able
  // to win: the moment either sheet grows a declaration the other already sets, this order is
  // what decides it, and discovering that at the point of collision is too late. The static
  // path loads the same two sheets in the same order (styles/src/blog-card/sk-blog-card.stories.ts)
  // — an earlier revision of this PR shipped them REVERSED there, which is the divergence the
  // whole component exists to disprove.
  //
  // The [SC-014] arm therefore asserts sheet IDENTITY and ORDER structurally rather than through
  // a computed style, and the swap mutation reds that assertion. That is honest coverage of a
  // convention, not a behavioural claim dressed up as one.
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
    // WARN AND DEGRADE, never throw — the split every markup module in this repo keeps. A throw
    // inside render() makes Lit reject `updateComplete`, so render() returns no tree and the
    // element paints an empty shadow root with NO <slot>, silently eating its own light-DOM
    // children. The authoring path (`blogCardStaticHtml`) throws instead, because bad output
    // must never reach committed artifacts.
    // SAME PREDICATE AND SAME WORDING as blogCardStaticHtml's throw. An earlier revision used
    // `!= null` here against the module's `!== undefined`, and a different message text — two
    // spellings of one rule across the leaf boundary, which a lens flagged. The module cannot be
    // imported for the string (the generator evaluates it from a `data:` URL), so the wording is
    // kept identical by hand and by the test that asserts both paths reject the same inputs.
    if (this.thumbnail && !this.alt) {
      console.warn(
        'sk-blog-card: `thumbnail` is set but `alt` is missing or empty. An empty alt asserts ' +
          'the image is decorative and hides it from assistive technology — pass alt text, or ' +
          'omit the thumbnail.',
      );
    }

    // ONE root carrying BOTH classes — structurally identical to the static form, which is what
    // lets `.sk-blog-card:hover { border-color }` work on both paths with one declaration.
    return html`<article part="card" class=${BLOG_CARD_CLASSES.root}>
      ${this.thumbnail
        ? html`<img
            part="thumbnail"
            class=${BLOG_CARD_CLASSES.thumbnail}
            src=${this.thumbnail}
            alt=${this.alt ?? ''}
          />`
        : nothing}
      <div part="content" class=${BLOG_CARD_CLASSES.content}>
        ${this.eyebrow
          ? html`<p class=${BLOG_CARD_CLASSES.eyebrow}>${this.eyebrow}</p>`
          : nothing}
        <slot></slot>
      </div>
    </article>`;
  }
}

define('sk-blog-card', SkBlogCard);
