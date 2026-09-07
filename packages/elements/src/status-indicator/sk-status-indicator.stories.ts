import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-status-indicator.js';

const status = (tone: string, text: string, pulsing = false, marker = true) => `
  <sk-status-indicator tone="${tone}" ${pulsing ? 'pulsing' : ''}>
    ${marker ? '<span slot="marker">●</span>' : ''}
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

export const PulsingStates: Story = {
  render: () => `
    <div style="display:grid;gap:var(--sk-space-3);background:var(--sk-surface-page);padding:var(--sk-space-6);">
      ${status('success', 'Static supplied status')}
      ${status('success', 'Live supplied status', true)}
      ${status('attention', 'Pulse requested without a marker', true, false)}
    </div>
  `,
};

export const MultiplePulsingAllTones: Story = {
  render: () => `
    <div style="display:grid;gap:var(--sk-space-3);background:var(--sk-surface-page);padding:var(--sk-space-6);">
      ${status('neutral', 'Awaiting evidence', true)}
      ${status('info', 'Measurement in progress', true)}
      ${status('success', 'Verification complete', true)}
      ${status('attention', 'Review needed', true)}
      ${status('danger', 'Delivery blocked', true)}
      ${status('recovery', 'Recovery in progress', true)}
    </div>
  `,
};

export const PulsingPreferences: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use the browser or operating-system reduced-motion and forced-colors preferences to inspect the static marker fallbacks.',
      },
    },
  },
  render: () => `
    <div style="display:grid;gap:var(--sk-space-3);background:var(--sk-surface-page);padding:var(--sk-space-6);">
      ${status('info', 'Pulse off for comparison')}
      ${status('info', 'Pulse on with preference-aware fallback', true)}
    </div>
  `,
};

export const PulsingLightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => `
    <div class="sk-light" style="display:grid;gap:var(--sk-space-3);background:var(--sk-surface-page);padding:var(--sk-space-6);">
      ${status('success', 'Live supplied status', true)}
      ${status('recovery', 'Recovery supplied status', true)}
    </div>
  `,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => allTones(true),
};
