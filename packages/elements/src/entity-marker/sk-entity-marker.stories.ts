import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-entity-marker.js';

const wrapper = (content: string, light = false) => `
  <div${light ? ' class="sk-light"' : ''} style="display:flex;align-items:center;gap:var(--sk-space-3);background:var(--sk-surface-page);padding:var(--sk-space-6);">
    ${content}
  </div>
`;

const meta: Meta = {
  title: 'Elements/SkEntityMarker',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component: 'A compact consumer-supplied mark whose label explicitly selects meaningful or decorative accessibility.',
      },
    },
  },
  render: () => '<sk-entity-marker label="Spec Kitty">SK</sk-entity-marker>',
};

export default meta;
type Story = StoryObj;

export const Initials: Story = {};

export const MeaningfulIcon: Story = {
  render: () => wrapper(`
    <sk-entity-marker label="Repository">
      <svg viewBox="0 0 24 24" style="width:var(--sk-space-4);height:var(--sk-space-4);" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M4 6h16v12H4z"></path>
        <path d="m4 8 8 5 8-5"></path>
      </svg>
    </sk-entity-marker>
    <span style="color:var(--sk-fg-body);">Repository</span>
  `),
};

export const Decorative: Story = {
  render: () => wrapper(`
    <sk-entity-marker>SP</sk-entity-marker>
    <span style="color:var(--sk-fg-body);">The adjacent text carries the meaning</span>
  `),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => wrapper('<sk-entity-marker label="Spec Kitty">SK</sk-entity-marker>', true),
};
