import '../card/sk-card.css';
import './sk-blog-card.css';
import type { Meta, StoryObj } from '@storybook/html';
import {
  SkBlogCardDefaultHTML,
  SkBlogCardLongTitleHTML,
  SkBlogCardWithoutEyebrowHTML,
  SkBlogCardWithoutImageHTML,
} from './index';

const meta: Meta = {
  title: 'Components/SkBlogCard',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const frame = (html: string) => `<div style="max-width: 420px;">${html}</div>`;

export const Default: Story = {
  render: () => frame(SkBlogCardDefaultHTML),
};

export const WithoutImage: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Image-less variant keeps the card rhythm intact and renders no broken media slot.',
      },
    },
  },
  render: () => frame(SkBlogCardWithoutImageHTML),
};

export const WithoutEyebrow: Story = {
  render: () => frame(SkBlogCardWithoutEyebrowHTML),
};

export const LongTitle: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Long title variant exercises the three-line title clamp.',
      },
    },
  },
  render: () => frame(SkBlogCardLongTitleHTML),
};

export const Hover: Story = {
  parameters: {
    pseudo: { hover: true },
    docs: {
      description: {
        story: 'Hover state highlights the composed sk-card border and read-more affordance without layout shift.',
      },
    },
  },
  render: () => frame(SkBlogCardDefaultHTML),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${frame(SkBlogCardDefaultHTML)}
    </div>
  `,
};
