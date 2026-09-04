import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-blog-card.js';
import { PLACEHOLDER_THUMBNAIL } from './sk-blog-card.markup.js';

/**
 * <sk-blog-card> — #78, built on the operator ruling that it composes sk-card's STYLESHEET
 * rather than nesting the element.
 *
 * The frame comes from `sk-card.css`, adopted alongside this component's own sheet, and the
 * element renders ONE root carrying both classes — the same shape the static form has always
 * had. Title, excerpt, meta and the read-more link are slotted; the thumbnail and eyebrow are
 * properties, because their PRESENCE is a layout decision the component makes.
 */
const body = (title: string) => `
  <h3 class="sk-blog-card__title">${title}</h3>
  <p class="sk-blog-card__excerpt">A practical look at keeping product intent, implementation
    details and review evidence connected as teams adopt agentic coding workflows.</p>
  <p class="sk-blog-card__meta">May 3, 2026 · 6 min read</p>
  <a class="sk-blog-card__read-more" href="#">Read the article</a>`;

const meta: Meta = {
  title: 'Elements/SkBlogCard',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () =>
    `<sk-blog-card style="max-width:360px" thumbnail="${PLACEHOLDER_THUMBNAIL}" alt="Abstract yellow and blue architecture diagram" eyebrow="Field notes">${body('Designing agent-ready workflows without losing the thread')}</sk-blog-card>`,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

/** No thumbnail — no `<img>` is rendered at all, rather than an empty one. */
export const WithoutImage: Story = {
  render: () =>
    `<sk-blog-card style="max-width:360px" eyebrow="Field notes">${body('A post with no preview image')}</sk-blog-card>`,
};

export const WithoutEyebrow: Story = {
  render: () =>
    `<sk-blog-card style="max-width:360px" thumbnail="${PLACEHOLDER_THUMBNAIL}" alt="Abstract yellow and blue architecture diagram">${body('A post with no category lead-in')}</sk-blog-card>`,
};

/**
 * A long title, which the CSS clamps to three lines.
 *
 * This was a generated export before #78 (`SkBlogCardLongTitleHTML`). It is CONTENT, not a
 * component axis, so it lives here now — the rule #77 established when section-banner's version
 * strings were found baked into its published constants.
 */
export const LongTitle: Story = {
  render: () =>
    `<sk-blog-card style="max-width:360px" thumbnail="${PLACEHOLDER_THUMBNAIL}" alt="Abstract yellow and blue architecture diagram" eyebrow="Field notes">${body('An unusually long article title that runs past three lines and has to be clamped by the component rather than by the page that embeds it')}</sk-blog-card>`,
};

/** `class="sk-light"`, not `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6);">
      <sk-blog-card style="max-width:360px" thumbnail="${PLACEHOLDER_THUMBNAIL}" alt="Abstract yellow and blue architecture diagram" eyebrow="Field notes">${body('Designing agent-ready workflows')}</sk-blog-card>
    </div>
  `,
};
