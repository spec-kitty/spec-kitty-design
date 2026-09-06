import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-section-header.js';

const header = (content: string, light = false) => `
  <div${light ? ' class="sk-light"' : ''} style="background:var(--sk-surface-page);padding:var(--sk-space-6);">
    <sk-section-header>${content}</sk-section-header>
  </div>
`;

const defaultContent = `
  <span slot="eyebrow">In flight</span>
  <h2 slot="title">Recent activity</h2>
  <p slot="description">What needs attention now.</p>
`;

const meta: Meta = {
  title: 'Elements/SkSectionHeader',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component: 'A section heading that projects consumer-owned eyebrow, native heading, description, metadata, and action content.',
      },
    },
  },
  render: () => header(defaultContent),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const WithMetadataAndAction: Story = {
  render: () => header(`
    <span slot="eyebrow">Admitted repos</span>
    <h3 slot="title">Repository activity</h3>
    <p slot="description">Consumer-supplied repository evidence.</p>
    <span slot="metadata">3 repositories</span>
    <sk-button slot="action" variant="ghost" size="sm">View all</sk-button>
  `),
};

export const LongContent: Story = {
  render: () => `
    <div style="max-width:calc(var(--sk-space-12) * 3);">
      ${header(`
        <span slot="eyebrow">Recent activity awaiting independent verification</span>
        <h4 slot="title">A deliberately long consumer heading remains owned by the document outline</h4>
        <p slot="description">Supporting content can wrap without colliding with a long metadata value or the trailing consumer action.</p>
        <span slot="metadata">Updated moments ago</span>
        <sk-button slot="action" variant="ghost" size="sm">Open activity</sk-button>
      `)}
    </div>
  `,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => header(defaultContent, true),
};
