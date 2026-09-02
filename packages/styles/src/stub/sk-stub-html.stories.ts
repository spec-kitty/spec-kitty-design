import type { Meta, StoryObj } from '@storybook/html';
import { SkStubHTML } from './index';

const meta: Meta = {
  title: 'Primitives/SkStub (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => SkStubHTML,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
};

export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'sk-light' },
    docs: { description: { story: 'Stub placeholder rendered on the light-mode surface for cross-theme verification.' } },
  },
  render: () => `<div data-theme="light" style="background:var(--sk-surface-page);padding:var(--sk-space-6);display:inline-block;">${SkStubHTML}</div>`,
};
