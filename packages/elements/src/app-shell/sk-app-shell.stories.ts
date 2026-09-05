import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-app-shell.js';

const composition = () => `
  <sk-app-shell>
    <nav slot="personal-rail" aria-label="Product areas">
      <a href="#work">Work</a>
      <a href="#settings">Settings</a>
    </nav>
    <aside slot="context-sidebar" aria-label="Current workspace">
      <a href="#overview">Overview</a>
      <a href="#activity">Activity</a>
    </aside>
    <header slot="page-header">
      <p>Workspace</p>
      <h1>Delivery overview</h1>
    </header>
    <section aria-label="Delivery summary"><p>Consumer-owned page content.</p></section>
  </sk-app-shell>`;

const meta: Meta = {
  title: 'Elements/SkAppShell',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: composition };

export const DesktopComposition: Story = { render: composition };

export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: composition,
};

export const EmptyRegions: Story = { render: () => '<sk-app-shell></sk-app-shell>' };

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `<div class="sk-light" style="background: var(--sk-surface-page);">${composition()}</div>`,
};
