import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-entity-marker.js';

const IMAGE_SOURCE =
  'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2280%22%20height%3D%22120%22%20viewBox%3D%220%200%2080%20120%22%3E%3Crect%20width%3D%2280%22%20height%3D%22120%22%20fill%3D%22%238fcb8f%22%2F%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%2240%22%20r%3D%2222%22%20fill%3D%22%231f2228%22%2F%3E%3Cpath%20d%3D%22M14%20110c4-28%2048-28%2052%200%22%20fill%3D%22%231f2228%22%2F%3E%3C%2Fsvg%3E';

const wrapper = (content: string, light = false) => `
  <div${light ? ' class="sk-light"' : ''} style="display:flex;align-items:center;flex-wrap:wrap;gap:var(--sk-space-3);background:var(--sk-surface-page);padding:var(--sk-space-6);">
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

export const AxisMatrix: Story = {
  render: () => wrapper(`
    <sk-entity-marker label="Default square">DS</sk-entity-marker>
    <sk-entity-marker label="Compact square" size="sm">CS</sk-entity-marker>
    <sk-entity-marker label="Default circle" shape="circle">DC</sk-entity-marker>
    <sk-entity-marker label="Compact circle" size="sm" shape="circle">CC</sk-entity-marker>
  `),
};

export const ImageNaming: Story = {
  render: () => wrapper(`
    <sk-entity-marker label="Ada Lovelace" shape="circle">
      <img src="${IMAGE_SOURCE}" alt="">
    </sk-entity-marker>
    <span style="color:var(--sk-fg-body);">Ada Lovelace</span>
  `),
};

export const LongLabel: Story = {
  render: () => wrapper(`
    <sk-entity-marker label="A deliberately long consumer-authored accessible name" size="sm" shape="circle">AL</sk-entity-marker>
    <span style="color:var(--sk-fg-body);">Long names remain consumer-owned and do not change marker geometry.</span>
  `),
};

export const CompactCircleLightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => wrapper(`
    <sk-entity-marker label="Ada Lovelace" size="sm" shape="circle">
      <img src="${IMAGE_SOURCE}" alt="">
    </sk-entity-marker>
    <span style="color:var(--sk-fg-body);">Ada Lovelace</span>
  `, true),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => wrapper('<sk-entity-marker label="Spec Kitty">SK</sk-entity-marker>', true),
};
