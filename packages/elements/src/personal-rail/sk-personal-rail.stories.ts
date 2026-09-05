import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-personal-rail.js';

const rail = (label = 'Product navigation') => `
  <sk-personal-rail label="${label}">
    <a slot="primary" href="#work">Work</a>
    <button slot="utilities" type="button">Notifications</button>
    <a slot="account" href="#account">Account</a>
    <button slot="logout" type="button">Log out</button>
  </sk-personal-rail>`;

const meta: Meta = {
  title: 'Elements/SkPersonalRail',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => rail() };

export const LongLabels: Story = {
  render: () => `
    <sk-personal-rail label="Navigation for a workspace with a deliberately long accessible name">
      <a slot="primary" href="#long">A deliberately long consumer-owned navigation label</a>
      <button slot="utilities" type="button">Notifications and pending reviews</button>
      <a slot="account" href="#account">Account preferences for this workspace</a>
      <button slot="logout" type="button">Log out from this workspace</button>
    </sk-personal-rail>`,
};

export const EmptyGroups: Story = { render: () => '<sk-personal-rail></sk-personal-rail>' };

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `<div class="sk-light" style="background: var(--sk-surface-page);">${rail()}</div>`,
};
