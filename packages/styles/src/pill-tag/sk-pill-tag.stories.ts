import type { Meta, StoryObj } from '@storybook/html';
import { SkTagHTML, SkEyebrowPillHTML, type PillTagVariant } from './index';
import './sk-pill-tag.css';

const meta: Meta = {
  title: 'Tags/SkPillTag (HTML)',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Static label primitives — sk-tag (compact, colour-variants) and sk-eyebrow-pill (lead-in label). Non-interactive: no Hover/Focus/Active/Disabled states; the colour variant IS the state.',
      },
    },
  },
  render: (args) => SkTagHTML(args['label'] ?? 'v1.0.0', args['variant'] ?? 'default'),
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: 'select',
      options: ['default', 'green', 'purple', 'breaking', 'yellow'] satisfies PillTagVariant[],
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default neutral pill — closes #10 acceptance for SkPillTag populated HTML output.',
      },
    },
  },
  args: { label: 'v1.0.0', variant: 'default' },
};

export const Green: Story = {
  args: { label: 'SemVer', variant: 'green' },
};

export const Purple: Story = {
  args: { label: 'Skills Pack', variant: 'purple' },
};

export const Breaking: Story = {
  args: { label: 'Breaking', variant: 'breaking' },
};

export const Yellow: Story = {
  args: { label: 'Schema Gate', variant: 'yellow' },
};

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Every colour variant rendered side-by-side — used as the catalog-completeness reference for tag styling.',
      },
    },
  },
  render: () => `
    <div style="display:flex;gap:var(--sk-space-2);flex-wrap:wrap;align-items:center;">
      ${SkTagHTML('v1.0.0')}
      ${SkTagHTML('Breaking', 'breaking')}
      ${SkTagHTML('SemVer', 'green')}
      ${SkTagHTML('Skills Pack', 'purple')}
      ${SkTagHTML('Schema Gate', 'yellow')}
    </div>
  `,
};

export const EyebrowPill: Story = {
  parameters: {
    docs: {
      description: {
        story: 'sk-eyebrow-pill — the larger lead-in label used above headlines to set context.',
      },
    },
  },
  render: () => `
    <div style="display:flex;gap:var(--sk-space-2);flex-wrap:wrap;align-items:center;">
      ${SkEyebrowPillHTML('For software teams adopting agentic coding')}
      ${SkEyebrowPillHTML('Open-source CLI quickstart')}
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
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      <div style="display:flex;gap:var(--sk-space-2);flex-wrap:wrap;align-items:center;">
        ${SkTagHTML('v1.0.0')}
        ${SkTagHTML('Breaking', 'breaking')}
        ${SkTagHTML('SemVer', 'green')}
        ${SkTagHTML('Skills Pack', 'purple')}
        ${SkTagHTML('Schema Gate', 'yellow')}
      </div>
    </div>
  `,
};
