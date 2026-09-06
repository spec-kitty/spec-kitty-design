import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-personal-rail.js';

const storyFrameStyle = [
  'box-sizing: border-box',
  'min-height: 100vh',
  'color: var(--sk-fg-body)',
  'background: var(--sk-surface-page)',
  'font-family: var(--sk-font-sans)',
].join('; ');

const linkStyle = 'color: var(--sk-fg-default); font: inherit;';
const controlStyle = [
  'color: var(--sk-fg-default)',
  'background: var(--sk-surface-pill)',
  'border: var(--sk-border-width-1) solid var(--sk-border-default)',
  'border-radius: var(--sk-radius-sm)',
  'padding: var(--sk-space-1) var(--sk-space-2)',
  'font: inherit',
].join('; ');

const rail = (label = 'Product navigation') => `
  <sk-personal-rail label="${label}">
    <a slot="primary" href="#work" style="${linkStyle}">Work</a>
    <button slot="utilities" type="button" style="${controlStyle}">Notifications</button>
    <a slot="account" href="#account" style="${linkStyle}">Account</a>
    <button slot="logout" type="button" style="${controlStyle}">Log out</button>
  </sk-personal-rail>`;

const storyFrame = (content: string, className = '') =>
  `<div${className ? ` class="${className}"` : ''} style="${storyFrameStyle}">${content}</div>`;

const meta: Meta = {
  title: 'Elements/SkPersonalRail',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => storyFrame(rail()) };

export const LongLabels: Story = {
  render: () => storyFrame(`
    <sk-personal-rail label="Navigation for a workspace with a deliberately long accessible name">
      <a slot="primary" href="#long" style="${linkStyle}">A deliberately long consumer-owned navigation label</a>
      <button slot="utilities" type="button" style="${controlStyle}">Notifications and pending reviews</button>
      <a slot="account" href="#account" style="${linkStyle}">Account preferences for this workspace</a>
      <button slot="logout" type="button" style="${controlStyle}">Log out from this workspace</button>
    </sk-personal-rail>`),
};

export const EmptyGroups: Story = {
  render: () => storyFrame(`
    <sk-personal-rail>
      <p slot="primary">The utilities, account, and logout groups are intentionally empty.</p>
    </sk-personal-rail>`),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(rail(), 'sk-light'),
};
