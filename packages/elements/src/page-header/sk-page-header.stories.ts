import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-page-header.js';

const storyFrameStyle = [
  'box-sizing: border-box',
  'min-height: 100vh',
  'color: var(--sk-fg-body)',
  'background: var(--sk-surface-page)',
  'font-family: var(--sk-font-sans)',
].join('; ');

const controlStyle = [
  'color: var(--sk-fg-default)',
  'background: var(--sk-surface-pill)',
  'border: var(--sk-border-width-1) solid var(--sk-border-default)',
  'border-radius: var(--sk-radius-sm)',
  'padding: var(--sk-space-1) var(--sk-space-2)',
  'font: inherit',
].join('; ');

const pageHeader = () => `
  <sk-page-header>
    <span slot="eyebrow">Overview</span>
    <h2 slot="title">Delivery summary</h2>
    <p slot="supporting">Current evidence and recent activity.</p>
    <span slot="sync">Last synchronized recently</span>
    <button slot="actions" type="button" style="${controlStyle}">Refresh</button>
  </sk-page-header>`;

const storyFrame = (content: string, className = '') =>
  `<div${className ? ` class="${className}"` : ''} style="${storyFrameStyle}">${content}</div>`;

const meta: Meta = {
  title: 'Elements/SkPageHeader',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => storyFrame(pageHeader()) };

export const LongTitle: Story = {
  render: () => storyFrame(`
    <sk-page-header>
      <span slot="eyebrow">Reference</span>
      <h2 slot="title">A deliberately long consumer-owned page heading that demonstrates wrapping without changing its semantics</h2>
      <p slot="supporting">Supporting copy remains next to the heading group.</p>
      <span slot="sync">Evidence synchronized recently</span>
      <button slot="actions" type="button" style="${controlStyle}">View details</button>
    </sk-page-header>`),
};

export const WithoutMetadata: Story = {
  render: () => storyFrame(`
    <sk-page-header>
      <span slot="eyebrow">Reference</span>
      <h2 slot="title">Page without metadata</h2>
      <p slot="supporting">The sync and actions regions are intentionally empty.</p>
    </sk-page-header>`),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(pageHeader(), 'sk-light'),
};
