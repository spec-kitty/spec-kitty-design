import './sk-ribbon-card.css';
import type { Meta, StoryObj } from '@storybook/html';
import {
  skRibbonCardHTML,
  SkRibbonCardDefaultHTML,
  SkRibbonCardWithRibbonHTML,
  SkRibbonCardBorderYellowHTML,
  SkRibbonCardBorderGreenHTML,
  SkRibbonCardBorderPurpleHTML,
} from './index';

const meta: Meta = {
  title: 'Components/SkRibbonCard (HTML)',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Static ribbon-card primitive. The component is non-interactive (no Hover/Focus/Active/Disabled states); colour intent is driven by ribbon and border modifiers.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default ribbon card without a ribbon — the bare card frame for a value-prop tile.',
      },
    },
  },
  render: () => SkRibbonCardDefaultHTML,
};

export const WithRibbon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Ribbon card with a yellow ribbon — the canonical workshop / primary callout.',
      },
    },
  },
  render: () => SkRibbonCardWithRibbonHTML,
};

export const RibbonYellow: Story = {
  render: () => skRibbonCardHTML({
    title: 'Full-day rollout workshop',
    body: 'Get product, engineering, and reviewers aligned on Spec Kitty in your environment.',
    ribbonLabel: 'Primary Workshop',
    ribbonVariant: 'yellow',
  }),
};

export const RibbonGreen: Story = {
  render: () => skRibbonCardHTML({
    title: 'SemVer release channel',
    body: 'Production-ready releases with our standard breaking-change policy.',
    ribbonLabel: 'Now stable',
    ribbonVariant: 'green',
  }),
};

export const RibbonPurple: Story = {
  render: () => skRibbonCardHTML({
    title: 'Skills Pack beta',
    body: 'Try the new evolution of Spec Kitty with reusable agent skills baked in.',
    ribbonLabel: 'v2.x Preview',
    ribbonVariant: 'purple',
  }),
};

export const ColorizedBorders: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Three side-by-side ribbon cards demonstrating the colorized-border treatment requested by issue #10. Each card pairs a coloured ribbon with a matching --sk-color-<colour> border so the accent reads as a single, intentional treatment.',
      },
    },
  },
  render: () => `
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:var(--sk-space-4);max-width:900px;">
      ${SkRibbonCardBorderYellowHTML}
      ${SkRibbonCardBorderGreenHTML}
      ${SkRibbonCardBorderPurpleHTML}
    </div>
  `,
};

export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'sk-light' },
    docs: {
      description: {
        story:
          'Light-mode surface variant — the colorized-border trio rendered against the light page surface for cross-theme verification.',
      },
    },
  },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:var(--sk-space-4);max-width:900px;">
        ${SkRibbonCardBorderYellowHTML}
        ${SkRibbonCardBorderGreenHTML}
        ${SkRibbonCardBorderPurpleHTML}
      </div>
    </div>
  `,
};
