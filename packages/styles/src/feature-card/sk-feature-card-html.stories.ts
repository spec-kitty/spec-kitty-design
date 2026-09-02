import './sk-feature-card.css';
import type { Meta, StoryObj } from '@storybook/html';
import {
  SkFeatureCardYellowHTML,
  SkFeatureCardGreenHTML,
  SkFeatureCardPurpleHTML,
  SkFeatureCardBorderYellowHTML,
  SkFeatureCardBorderGreenHTML,
  SkFeatureCardBorderPurpleHTML,
} from './index';

const meta: Meta = {
  title: 'Components/SkFeatureCard (HTML)',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Static feature-card primitive. The component is non-interactive (no Hover/Focus/Active/Disabled states); colour intent is driven by icon-chip and border modifiers.',
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
        story: 'Default feature card with yellow icon chip — closes #10 acceptance for FeatureCard styled output.',
      },
    },
  },
  render: () => SkFeatureCardYellowHTML,
};

export const GreenIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Feature card with green icon-chip tint — used to flag stable / verified feature copy.',
      },
    },
  },
  render: () => SkFeatureCardGreenHTML,
};

export const PurpleIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Feature card with purple icon-chip tint — used to flag evolution / preview feature copy.',
      },
    },
  },
  render: () => SkFeatureCardPurpleHTML,
};

export const ColorizedBorders: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Three side-by-side feature cards demonstrating the colorized-border treatment requested by issue #10. Each card uses an existing solid colour token (--sk-color-yellow / --sk-color-green / --sk-color-purple) on the border edge; the rgba() icon-chip tints are intentionally untouched (out-of-mission scope).',
      },
    },
  },
  render: () => `
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:var(--sk-space-4);max-width:900px;">
      ${SkFeatureCardBorderYellowHTML}
      ${SkFeatureCardBorderGreenHTML}
      ${SkFeatureCardBorderPurpleHTML}
    </div>
  `,
};

export const Grid: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Two-column grid of the three default icon-chip variants — matches the reference layout for the catalog landing.',
      },
    },
  },
  render: () => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sk-space-4);max-width:600px;">
    ${SkFeatureCardYellowHTML}
    ${SkFeatureCardGreenHTML}
    ${SkFeatureCardPurpleHTML}
  </div>`,
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
        ${SkFeatureCardBorderYellowHTML}
        ${SkFeatureCardBorderGreenHTML}
        ${SkFeatureCardBorderPurpleHTML}
      </div>
    </div>
  `,
};
