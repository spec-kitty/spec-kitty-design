import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-nav-pill.css';
import './sk-nav-pill-drawer.css';

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

/**
 * The two-container arrangement, rendered STATICALLY in its open state.
 *
 * Why this exists at all: after #73 removed `skToggleDrawer`, a pre-merge lens swept the repo
 * and found that `.sk-nav-pill__drawer`, `.is-open`, `--responsive` and `--has-drawer` had
 * ZERO consumers outside their own definitions — no story, no demo page, no `.html` artifact.
 * The mission's argument for keeping those 45 lines ("static consumers still use it") had no
 * in-repo evidence behind it, and both remaining `import './sk-nav-pill-drawer.css'` sites
 * were inert. That is the same certifying-absence shape as a gate over an empty set.
 *
 * Rendered already open, not interactive. That is exactly what the CSS owns: the arrangement
 * has no behaviour of its own any more — the consumer supplies the toggle. An interactive
 * story would be asserting a component works while being unable to open it; an open-state
 * story asserts only the styling, and gives the a11y gate a second arrangement to see.
 */
export const CollapsedStatic: Story = {
  name: 'Collapsed / drawer (static, CSS only)',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'The markup-plus-CSS drawer arrangement, shown open. `@spec-kitty/styles` ships no ' +
          'JavaScript: something must add `is-open` to the drawer, and that is now the ' +
          "consumer's code — or `<sk-nav-pill>` in @spec-kitty/elements, which owns its panel.",
      },
    },
  },
  render: () => `
<div>
  <nav class="sk-nav-pill sk-nav-pill--responsive sk-nav-pill--has-drawer" aria-label="Primary navigation">
    <div class="sk-nav-pill__items">
      <a href="#" class="sk-nav-pill__item">Platform</a>
      <a href="#" class="sk-nav-pill__item sk-nav-pill__item--active" aria-current="page">Getting Started</a>
    </div>
    <button class="sk-nav-pill__hamburger" type="button"
            aria-label="Close navigation" aria-expanded="true" aria-controls="sk-nav-drawer-story">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
      </svg>
    </button>
  </nav>
  <div class="sk-nav-pill__drawer is-open" id="sk-nav-drawer-story">
    <a href="#" class="sk-nav-pill__item sk-nav-pill__item--active" aria-current="page">Getting Started</a>
    <a href="#" class="sk-nav-pill__item">Platform</a>
  </div>
</div>`,
};

// ── The INTERACTIVE collapsed/drawer story has MOVED ─────────────────────
//
// It lived here and it was interactive: the decorator put `skToggleDrawer` on `window` so an
// inline `onclick` in the rendered string could resolve it. That helper is gone (#73) and its
// behaviour is `<sk-nav-pill>` in @spec-kitty/elements — see Elements/SkNavPill, which has a
// story rendering the panel already open so the a11y gate sees both states.
//
// It is NOT reproduced here as a static snapshot. packages/styles may depend only on
// @spec-kitty/tokens (eslint depConstraints, scope:styles), so this file cannot import the
// element; and a story that renders the drawer markup without the behaviour would assert that
// a component works while being unable to open it. The two-container CSS itself is unchanged
// and still shipped for static consumers — it is the story that had a JS dependency, not the
// stylesheet.

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
