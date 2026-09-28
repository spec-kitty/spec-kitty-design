import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-metric.js';

const meta: Meta = {
  title: 'Elements/SkMetric',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-metric label="Items processed" display-value="128"></sk-metric>',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const WithAnnotation: Story = {
  render: () => '<sk-metric label="Average latency" display-value="12.40 ms" annotation="Sampled"></sk-metric>',
};

export const Tones: Story = {
  render: () => `
    <div style="display:grid;gap:var(--sk-space-4);">
      <sk-metric label="Neutral sample" display-value="14" annotation="Reference" tone="neutral"></sk-metric>
      <sk-metric label="Information sample" display-value="28" annotation="Updated" tone="info"></sk-metric>
      <sk-metric label="Successful sample" display-value="42" annotation="Within range" tone="success"></sk-metric>
      <sk-metric label="Attention sample" display-value="56" annotation="Review" tone="attention"></sk-metric>
    </div>
  `,
};

export const Compact: Story = {
  render: () => '<sk-metric compact label="Items processed" display-value="128" annotation="Current"></sk-metric>',
};

export const LongContent: Story = {
  render: () => '<sk-metric label="A deliberately long localized label supplied by a consumer" display-value="9,876,543,210,123.000 units awaiting classification" annotation="Extended sample annotation"></sk-metric>',
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background:var(--sk-surface-page);padding:var(--sk-space-6);">
      <sk-metric label="Items processed" display-value="128"></sk-metric>
    </div>
  `,
};
