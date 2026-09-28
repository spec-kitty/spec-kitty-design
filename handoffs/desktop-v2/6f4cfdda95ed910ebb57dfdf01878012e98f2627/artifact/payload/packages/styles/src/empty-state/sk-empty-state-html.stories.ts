import './sk-empty-state.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkEmptyStateInlineHTML,
  SkEmptyStateWithActionHTML,
  SkEmptyStateWithoutActionHTML,
} from './index';

const LONG_INLINE_COPY =
  'No Work Packages match the current consumer-supplied filters, so broaden them to review the complete lane.';

const inlineFrame = (content: string, light = false) => `
  <div${light ? ' class="sk-light"' : ''} data-inline-empty-frame
    style="box-sizing:border-box;inline-size:360px;max-inline-size:100%;background:var(--sk-surface-page);padding:var(--sk-space-3);">
    ${content}
  </div>
`;

const inlineWith = (copy: string) =>
  `<p class="sk-empty-state sk-empty-state--inline">${copy}</p>`;

const meta: Meta = {
  title: 'Primitives/SkEmptyState (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const WithAction: Story = {
  render: () => SkEmptyStateWithActionHTML,
};

export const WithoutAction: Story = {
  render: () => SkEmptyStateWithoutActionHTML,
};

export const Inline: Story = {
  render: () => inlineFrame(SkEmptyStateInlineHTML),
};

export const InlineLongNarrow: Story = {
  render: () => inlineFrame(inlineWith(LONG_INLINE_COPY)),
};

export const InlinePreferences: Story = {
  render: () => inlineFrame(inlineWith('Nothing here while the consumer-owned filter remains active.')),
};

export const InlineLightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => inlineFrame(inlineWith(LONG_INLINE_COPY), true),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkEmptyStateWithActionHTML}
    </div>
  `,
};
