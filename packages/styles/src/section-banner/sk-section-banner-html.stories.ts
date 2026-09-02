import './sk-section-banner.css';
import type { Meta, StoryObj } from '@storybook/html';
import {
  SkSectionBannerNeutralHTML,
  SkSectionBannerPurpleHTML,
  SkSectionBannerGreenHTML,
} from './index';

const meta: Meta = {
  title: 'Primitives/SkSectionBanner (HTML)',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Static section-banner primitive — a mono-cap label used to delineate version/section blocks. Non-interactive: no Hover/Focus/Active/Disabled states; the colour variant IS the state.',
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
        story: 'Default neutral section banner — closes #10 acceptance for SkSectionBanner populated HTML output.',
      },
    },
  },
  render: () => SkSectionBannerNeutralHTML,
};

export const Neutral: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Neutral variant — used to mark a stable / current version block.',
      },
    },
  },
  render: () => SkSectionBannerNeutralHTML,
};

export const Purple: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Purple variant — used to flag the v2.x evolution / event-architecture block.',
      },
    },
  },
  render: () => SkSectionBannerPurpleHTML,
};

export const Green: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Green variant — used to flag the v3.x stable-release block.',
      },
    },
  },
  render: () => SkSectionBannerGreenHTML,
};

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Every colour variant rendered stacked — used as the catalog-completeness reference for section-banner styling.',
      },
    },
  },
  render: () => `
    <div style="display:flex;flex-direction:column;gap:var(--sk-space-3);align-items:flex-start;">
      ${SkSectionBannerNeutralHTML}
      ${SkSectionBannerPurpleHTML}
      ${SkSectionBannerGreenHTML}
    </div>
  `,
};

export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'sk-light' },
    docs: {
      description: {
        story: 'Light-mode surface variant — every colour variant rendered against the light page surface for cross-theme verification.',
      },
    },
  },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: block; width: 100%;">
      <div style="display:flex;flex-direction:column;gap:var(--sk-space-3);align-items:flex-start;">
        ${SkSectionBannerNeutralHTML}
        ${SkSectionBannerPurpleHTML}
        ${SkSectionBannerGreenHTML}
      </div>
    </div>
  `,
};
