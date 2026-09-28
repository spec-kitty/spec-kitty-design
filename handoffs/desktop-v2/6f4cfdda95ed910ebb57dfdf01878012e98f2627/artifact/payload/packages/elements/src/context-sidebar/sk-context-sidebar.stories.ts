import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-context-sidebar.js';

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

const sidebar = (label = 'Project context') => `
  <sk-context-sidebar label="${label}">
    <strong slot="header">Reference project</strong>
    <nav aria-label="Project sections">
      <a href="#summary" style="${linkStyle}">Summary</a>
      <a href="#activity" style="${linkStyle}">Activity</a>
    </nav>
    <button slot="footer" type="button" style="${controlStyle}">Project settings</button>
  </sk-context-sidebar>`;

const storyFrame = (content: string, className = '') =>
  `<div${className ? ` class="${className}"` : ''} style="${storyFrameStyle}">${content}</div>`;

const meta: Meta = {
  title: 'Elements/SkContextSidebar',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => storyFrame(sidebar()) };

export const LongLabels: Story = {
  render: () => storyFrame(`
    <sk-context-sidebar label="Context for a project with a deliberately long accessible name">
      <strong slot="header">Long-label reference</strong>
      <a href="#long" style="${linkStyle}">A deliberately long consumer-owned context link that truncates visually</a>
      <button slot="footer" type="button" style="${controlStyle}">A deliberately long consumer-owned context action</button>
    </sk-context-sidebar>`),
};

export const Empty: Story = {
  render: () => storyFrame(`
    <sk-context-sidebar>
      <p>The header and footer regions are intentionally empty.</p>
    </sk-context-sidebar>`),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(sidebar(), 'sk-light'),
};
