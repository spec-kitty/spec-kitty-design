import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-status-indicator.js';

const status = (tone: string, text: string) => `
  <sk-status-indicator tone="${tone}">
    <span slot="marker">●</span>
    ${text}
  </sk-status-indicator>
`;

const allTones = (light = false) => `
  <div${light ? ' class="sk-light"' : ''} style="display:grid;gap:var(--sk-space-3);background:var(--sk-surface-page);padding:var(--sk-space-6);">
    ${status('neutral', 'Awaiting evidence')}
    ${status('info', 'Measurement in progress')}
    ${status('success', 'Verification complete')}
    ${status('attention', 'Review needed')}
    ${status('danger', 'Delivery blocked')}
    ${status('recovery', 'Recovery in progress')}
  </div>
`;

const meta: Meta = {
  title: 'Elements/SkStatusIndicator',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component: 'A visible consumer-authored status label with one of six presentation-only tones.',
      },
    },
  },
  render: () => status('neutral', 'Awaiting evidence'),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const AllTones: Story = {
  render: () => allTones(),
};

export const LongText: Story = {
  render: () => `
    <div style="max-width:calc(var(--sk-space-12) * 2);">
      ${status('attention', 'Independent observation remains open and will be supplied by the consumer when it becomes available')}
    </div>
  `,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => allTones(true),
};
