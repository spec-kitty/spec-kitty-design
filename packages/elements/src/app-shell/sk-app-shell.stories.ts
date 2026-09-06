import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-app-shell.js';

const storyFrameStyle = [
  'box-sizing: border-box',
  'min-height: 100vh',
  'color: var(--sk-fg-body)',
  'background: var(--sk-surface-page)',
  'font-family: var(--sk-font-sans)',
].join('; ');

const linkStyle = 'color: var(--sk-fg-default); font: inherit;';

const composition = () => `
  <sk-app-shell>
    <nav slot="personal-rail" aria-label="Product areas">
      <a href="#work" style="${linkStyle}">Work</a>
      <a href="#settings" style="${linkStyle}">Settings</a>
    </nav>
    <aside slot="context-sidebar" aria-label="Current workspace">
      <a href="#overview" style="${linkStyle}">Overview</a>
      <a href="#activity" style="${linkStyle}">Activity</a>
    </aside>
    <header slot="page-header">
      <p>Workspace</p>
      <h1>Delivery overview</h1>
    </header>
    <section aria-label="Delivery summary"><p>Consumer-owned page content.</p></section>
  </sk-app-shell>`;

const storyFrame = (content: string, className = '') =>
  `<div${className ? ` class="${className}"` : ''} style="${storyFrameStyle}">${content}</div>`;

const meta: Meta = {
  title: 'Elements/SkAppShell',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => storyFrame(composition()) };

export const DesktopComposition: Story = { render: () => storyFrame(composition()) };

export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => storyFrame(composition()),
};

export const EmptyRegions: Story = {
  render: () => storyFrame(`
    <sk-app-shell>
      <p>The personal rail, context sidebar, and page header are intentionally empty.</p>
    </sk-app-shell>`),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(composition(), 'sk-light'),
};
