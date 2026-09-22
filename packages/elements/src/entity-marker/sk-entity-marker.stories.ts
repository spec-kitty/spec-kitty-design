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

/* #304 additive stories below. AxisMatrix and ImageNaming above are NOT extended — both are
   pinned by exact-count/exact-order Playwright assertions
   (apps/storybook/src/tests/sk-compact-work-item-extensions.spec.ts's "keeps size and shape
   independent across the full 2x2 matrix" and "uses one host-owned name and cover-crops
   portrait and landscape images") and by visual-regression baselines in
   apps/storybook/src/tests/visual.spec.ts (NFR-001 requires those pixel-identical). New size,
   border and image-at-new-size coverage lands as new, additive stories instead. */

export const LargeSize: Story = {
  render: () => wrapper(`
    <sk-entity-marker label="Large square" size="lg">LS</sk-entity-marker>
    <sk-entity-marker label="Large circle" size="lg" shape="circle">LC</sk-entity-marker>
  `),
};

export const ImageNamingLargeSize: Story = {
  render: () => wrapper(`
    <sk-entity-marker label="Ada Lovelace" size="lg" shape="circle">
      <img src="${IMAGE_SOURCE}" alt="">
    </sk-entity-marker>
    <span style="color:var(--sk-fg-body);">Ada Lovelace, at the page-scale profile-picture size</span>
  `),
};

export const BorderedAxisMatrix: Story = {
  render: () => wrapper(`
    <sk-entity-marker label="Default square bordered" border="true">DB</sk-entity-marker>
    <sk-entity-marker label="Default circle bordered" shape="circle" border="true">DCB</sk-entity-marker>
    <sk-entity-marker label="Compact square bordered" size="sm" border="true">CB</sk-entity-marker>
    <sk-entity-marker label="Compact circle bordered" size="sm" shape="circle" border="true">CCB</sk-entity-marker>
    <sk-entity-marker label="Large square bordered" size="lg" border="true">LB</sk-entity-marker>
    <sk-entity-marker label="Large circle bordered" size="lg" shape="circle" border="true">LCB</sk-entity-marker>
  `),
};

export const BorderedOuterBoxComparison: Story = {
  render: () => wrapper(`
    <sk-entity-marker label="Unbordered" data-comparison="unbordered">CMP</sk-entity-marker>
    <sk-entity-marker label="Bordered" border="true" data-comparison="bordered">CMP</sk-entity-marker>
  `),
};

export const BorderedForcedColors: Story = {
  parameters: { a11y: { disable: false } },
  render: () => wrapper(`
    <sk-entity-marker label="Unbordered reference" data-forced-colors-base>UB</sk-entity-marker>
    <sk-entity-marker label="Bordered" border="true">BD</sk-entity-marker>
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
