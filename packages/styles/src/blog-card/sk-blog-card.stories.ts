// SK-CARD FIRST, MATCHING THE ELEMENT. `sk-blog-card.ts` adopts `[cardSheet, sheet]`, and the
// two consumption paths must load the two sheets in the SAME order or the cascade differs
// between them — which is the divergence this whole component exists to disprove. An earlier
// revision of this PR flipped these two imports, so the element resolved ties to blog-card and
// the static path resolved them to sk-card. A lens caught it; nothing else could have, because
// SC-014 asserts the ELEMENT's adoptedStyleSheets order and no gate reads a story's import
// order.
import '../card/sk-card.css';
import './sk-blog-card.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkBlogCardHTML,
  SkBlogCardWithImageHTML,
  SkBlogCardWithEyebrowHTML,
  SkBlogCardFullHTML,
} from './index';

/**
 * Renders from the GENERATED exports (ADR-10 §3).
 *
 * Both stylesheets are imported here because the static form composes both CLASSES — the
 * contract this component's CSS header has always stated. The element does the same thing by
 * adopting both sheets, which is the #78 ruling: composing the stylesheets rather than nesting
 * the elements keeps the bordered box one box on both paths, so `.sk-blog-card:hover` needs
 * exactly one declaration.
 *
 * Until #78 this file imported four hand-written exports produced by a builder function taking
 * booleans. Three of those were the two optional regions in combination — axes, now derived —
 * and the fourth was a long title, which is CONTENT and lives in a story.
 *
 * `fill()` THROWS when the marker is absent: String.replace returns its input unchanged on no
 * match, so a renamed default would silently render every card as "Article title".
 */
const MARKER =
  '<h3 class="sk-blog-card__title">Article title</h3>' +
  '<p class="sk-blog-card__excerpt">What the article is about.</p>' +
  '<p class="sk-blog-card__meta">Date · reading time</p>';

const fill = (markup: string, title: string) => {
  if (!markup.includes(MARKER)) {
    throw new Error(
      'sk-blog-card story: generated markup no longer contains the placeholder body — fill() ' +
        'would have silently returned it unchanged. Update MARKER alongside blogCardStaticHtml().',
    );
  }
  return markup.replace(
    MARKER,
    `<h3 class="sk-blog-card__title">${title}</h3>` +
      '<p class="sk-blog-card__excerpt">A practical look at keeping product intent, implementation ' +
      'details and review evidence connected as teams adopt agentic coding workflows.</p>' +
      '<p class="sk-blog-card__meta">May 3, 2026 · 6 min read</p>' +
      '<a class="sk-blog-card__read-more" href="#">Read the article</a>',
  );
};

const wrap = (markup: string) => `<div style="max-width:360px">${markup}</div>`;

const meta: Meta = {
  title: 'Components/SkBlogCard',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => wrap(fill(SkBlogCardFullHTML, 'Designing agent-ready workflows without losing the thread')),
};

/** No thumbnail — the `<img>` is absent entirely rather than empty. */
export const WithoutImage: Story = {
  render: () => wrap(fill(SkBlogCardWithEyebrowHTML, 'A post with no preview image')),
};

export const WithoutEyebrow: Story = {
  render: () => wrap(fill(SkBlogCardWithImageHTML, 'A post with no category lead-in')),
};

/** Neither optional region — the smallest form the component has. */
export const TitleOnly: Story = {
  render: () => wrap(fill(SkBlogCardHTML, 'Just a title, an excerpt and a date')),
};

/** A long title, clamped to three lines by the component rather than by the page. */
export const LongTitle: Story = {
  render: () =>
    wrap(
      fill(
        SkBlogCardFullHTML,
        'An unusually long article title that runs past three lines and has to be clamped by the component rather than by the page that embeds it',
      ),
    ),
};

/** `class="sk-light"`, NOT `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6);">
      ${wrap(fill(SkBlogCardFullHTML, 'Designing agent-ready workflows'))}
    </div>
  `,
};
