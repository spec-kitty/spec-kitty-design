import type { Meta, StoryObj } from '@storybook/html';
import './sk-nav-pill.css';
import './sk-nav-pill-drawer.css';
import { skToggleDrawer } from './index';

const meta: Meta = {
  title: 'Navigation/SkNavPill (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: (args) => {
    const items: Array<{ label: string; href: string; active?: boolean }> = args['items'] ?? [
      { label: 'Platform', href: '#' },
      { label: 'Getting Started', href: '#', active: true },
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
    ];

    const itemsHtml = items
      .map(
        (item) =>
          `<a href="${item.href}" class="sk-nav-pill__item${item.active ? ' sk-nav-pill__item--active' : ''}"${item.active ? ' aria-current="page"' : ''}>${item.label}</a>`
      )
      .join('\n    ');

    return `<nav class="sk-nav-pill" aria-label="Primary navigation">
  <div class="sk-nav-pill__items">
    ${itemsHtml}
  </div>
  <div class="sk-nav-pill__cta">
    <button class="sk-nav-pill__cta-btn" type="button">Book Demo</button>
  </div>
</nav>`;
  },
  argTypes: {
    items: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    items: [
      { label: 'Platform', href: '#' },
      { label: 'Getting Started', href: '#' },
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
};

export const ActiveItem: Story = {
  args: {
    items: [
      { label: 'Platform', href: '#' },
      { label: 'Getting Started', href: '#', active: true },
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
};

export const Mobile: Story = {
  args: {
    items: [
      { label: 'Platform', href: '#' },
      { label: 'Getting Started', href: '#', active: true },
      { label: 'About', href: '#' },
    ],
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

// ── Collapsed / responsive nav pill ──────────────────────────────────────
// Shows hamburger button on narrow viewports; drawer slides open on click.
// Add sk-nav-pill--responsive to enable the CSS breakpoint behaviour.
// Add sk-nav-pill--has-drawer for the toggle button active-state styling.
export const CollapsedHamburger: Story = {
  name: 'Collapsed / Hamburger (responsive)',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Responsive nav pill that collapses to a hamburger at ≤ 720 px. ' +
          'Requires both `sk-nav-pill.css` (base) and `sk-nav-pill-drawer.css` (drawer extension). ' +
          'The drawer toggle also requires `skToggleDrawer` from `sk-nav-pill.js`. ' +
          'Drag the right edge of the sandbox to cross the breakpoint.',
      },
    },
  },
  decorators: [
    (story) => {
      (window as any).__skToggleDrawer = skToggleDrawer;
      return story();
    },
  ],
  render: () => `
<div style="resize:horizontal;overflow:hidden;min-width:220px;max-width:800px;border:1px dashed var(--sk-border-default);padding:var(--sk-space-4);">
  <p style="font-size:var(--sk-text-xs);color:var(--sk-fg-muted);margin-bottom:var(--sk-space-3);font-family:var(--sk-font-mono);">
    Drag the right edge to resize and watch the nav collapse below 720 px.
  </p>
  <nav class="sk-nav-pill sk-nav-pill--responsive sk-nav-pill--has-drawer" aria-label="Primary navigation">
    <div class="sk-nav-pill__items">
      <a href="#" class="sk-nav-pill__item">Platform</a>
      <a href="#" class="sk-nav-pill__item sk-nav-pill__item--active" aria-current="page">Getting Started</a>
      <a href="#" class="sk-nav-pill__item">About</a>
      <a href="#" class="sk-nav-pill__item">Blog</a>
      <a href="#" class="sk-nav-pill__item">Training</a>
    </div>
    <div class="sk-nav-pill__cta" style="display:flex;align-items:center;gap:var(--sk-space-2);">
      <!-- Hamburger — hidden on desktop, shown on mobile -->
      <button
        class="sk-nav-pill__hamburger"
        aria-label="Open navigation"
        aria-expanded="false"
        aria-controls="sk-nav-drawer"
        type="button"
        onclick="window.__skToggleDrawer && window.__skToggleDrawer(this)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <line x1="4" y1="7" x2="20" y2="7"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="17" x2="20" y2="17"/>
        </svg>
      </button>
      <button class="sk-nav-pill__cta-btn" type="button">Book Demo</button>
    </div>
  </nav>
  <!-- Drawer: slides open on mobile when hamburger is toggled -->
  <div id="sk-nav-drawer" class="sk-nav-pill__drawer">
    <a href="#" class="sk-nav-pill__item">Platform</a>
    <a href="#" class="sk-nav-pill__item sk-nav-pill__item--active" aria-current="page">Getting Started</a>
    <a href="#" class="sk-nav-pill__item">About</a>
    <a href="#" class="sk-nav-pill__item">Blog</a>
    <a href="#" class="sk-nav-pill__item">Training</a>
  </div>
</div>`,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      <nav class="sk-nav-pill" aria-label="Primary navigation">
        <div class="sk-nav-pill__items">
          <a href="#" class="sk-nav-pill__item">Platform</a>
          <a href="#" class="sk-nav-pill__item sk-nav-pill__item--active" aria-current="page">Getting Started</a>
          <a href="#" class="sk-nav-pill__item">About</a>
        </div>
        <div class="sk-nav-pill__cta">
          <button class="sk-nav-pill__cta-btn" type="button">Book Demo</button>
        </div>
      </nav>
    </div>
  `,
};
