import './sk-card.css';
import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Components/Card',
  parameters: { a11y: { disable: false } },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => `<article class="sk-card" style="max-width:360px"><p style="color:var(--sk-fg-default);margin:0">Default card content</p></article>`,
};

export const Blue: Story = {
  parameters: {
    docs: {
      description: {
        story: "Hover to see the accent border activate on all 4 sides. The border is always 2px — only the colour changes, so there is no layout shift.",
      },
    },
  },
  render: () => `<article class="sk-card sk-card--blue" style="max-width:360px"><p style="color:var(--sk-fg-default);margin:0">Blue tint card — information context. Hover to see full accent border.</p></article>`,
};

export const Purple: Story = {
  parameters: {
    docs: {
      description: {
        story: "Same no-jump border technique as Blue — 2px border always present, accent colour transitions on hover.",
      },
    },
  },
  render: () => `<article class="sk-card sk-card--purple" style="max-width:360px"><p style="color:var(--sk-fg-default);margin:0">Purple tint card — feature context. Hover to see full accent border.</p></article>`,
};

export const Inset: Story = {
  render: () => `<article class="sk-card sk-card--inset" style="max-width:360px"><p style="color:var(--sk-fg-default);margin:0">Inset card — nested content</p></article>`,
};

export const BlogCardExample: Story = {
  render: () => `
    <article class="sk-card" style="max-width:400px">
      <div style="display:flex;gap:var(--sk-space-2);margin-bottom:var(--sk-space-4)">
        <span class="sk-tag sk-tag--green">Release</span>
        <span class="sk-tag">v3.2.0</span>
      </div>
      <h3 style="font-family:var(--sk-font-display);font-size:var(--sk-text-xl);font-weight:var(--sk-weight-bold);color:var(--sk-fg-default);margin:0 0 var(--sk-space-3)">
        Spec Kitty 3.2 ships with org-layer doctrine
      </h3>
      <p style="font-size:var(--sk-text-sm);color:var(--sk-fg-muted);line-height:1.55;margin:0 0 var(--sk-space-4)">
        The new org-level DRG allows teams to publish proprietary governance
        without forking the CLI.
      </p>
      <a href="#" style="font-size:var(--sk-text-sm);color:var(--sk-color-yellow);text-decoration:none">Read the post →</a>
    </article>
  `,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: flex; gap: var(--sk-space-4); flex-wrap: wrap;">
      <article class="sk-card" style="max-width:200px">Default</article>
      <article class="sk-card sk-card--blue" style="max-width:200px">Blue</article>
      <article class="sk-card sk-card--purple" style="max-width:200px">Purple</article>
      <article class="sk-card sk-card--inset" style="max-width:200px">Inset</article>
    </div>
  `,
};
