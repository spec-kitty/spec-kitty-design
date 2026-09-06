import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-page-header.js';

const storyFrameStyle = [
  'box-sizing: border-box',
  'min-height: 100vh',
  'color: var(--sk-fg-body)',
  'background: var(--sk-surface-page)',
  'font-family: var(--sk-font-sans)',
].join('; ');

const controlStyle = [
  'color: var(--sk-fg-default)',
  'background: var(--sk-surface-pill)',
  'border: var(--sk-border-width-1) solid var(--sk-border-default)',
  'border-radius: var(--sk-radius-sm)',
  'padding: var(--sk-space-1) var(--sk-space-2)',
  'font: inherit',
].join('; ');

const pageHeader = () => `
  <sk-page-header>
    <span slot="eyebrow">Overview</span>
    <h2 slot="title">Delivery summary</h2>
    <p slot="supporting">Current evidence and recent activity.</p>
    <span slot="sync">Last synchronized recently</span>
    <button slot="actions" type="button" style="${controlStyle}">Refresh</button>
  </sk-page-header>`;

const storyFrame = (content: string, className = '') =>
  `<div${className ? ` class="${className}"` : ''} style="${storyFrameStyle}">${content}</div>`;

const meta: Meta = {
  title: 'Elements/SkPageHeader',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => storyFrame(pageHeader()) };

export const LongTitle: Story = {
  render: () => storyFrame(`
    <sk-page-header>
      <span slot="eyebrow">Reference</span>
      <h2 slot="title">A deliberately long consumer-owned page heading that demonstrates wrapping without changing its semantics</h2>
      <p slot="supporting">Supporting copy remains next to the heading group.</p>
      <span slot="sync">Evidence synchronized recently</span>
      <button slot="actions" type="button" style="${controlStyle}">View details</button>
    </sk-page-header>`),
};

export const WithoutMetadata: Story = {
  render: () => storyFrame(`
    <sk-page-header>
      <span slot="eyebrow">Reference</span>
      <h2 slot="title">Page without metadata</h2>
      <p slot="supporting">The sync and actions regions are intentionally empty.</p>
    </sk-page-header>`),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(pageHeader(), 'sk-light'),
};

/* ──────────────────────────────────────────────────────────────────────────────
   #182 — the compact density axis and the sticky axis.

   THE LIVE/PAUSED INDICATOR IS A SLOTTED `<span>` HERE, DELIBERATELY. #182 says it
   is a slotted `sk-status-indicator` (#146), and #146 has not landed. Inventing a
   `--sk-status-*` token family or a stand-in element to fill the gap is exactly
   what that issue forbids, so these stories slot a plain element the consumer
   owns. When #146 lands, the consumer swaps the element and this header does not
   change — which is the point of the slot.
   ────────────────────────────────────────────────────────────────────────────── */

const indicatorStyle = [
  'display: inline-block',
  'color: var(--sk-fg-muted)',
  'background: var(--sk-surface-pill)',
  'border: var(--sk-border-width-1) solid var(--sk-border-default)',
  'border-radius: var(--sk-radius-pill)',
  'padding: var(--sk-space-1) var(--sk-space-3)',
  'font-size: var(--sk-text-xs)',
].join('; ');

/** One set of slot content, rendered at whichever density and stickiness the caller asks for.
 *  The point of every story below is that this string is the only header markup there is. */
const header = (attrs = '', title = 'Delivery summary', sync = 'Updated 12 seconds ago') => `
  <sk-page-header ${attrs}>
    <span slot="eyebrow">Overview</span>
    <h2 slot="title">${title}</h2>
    <p slot="supporting">Current evidence and recent activity.</p>
    <span slot="sync">${sync}</span>
    <span slot="sync" style="${indicatorStyle}">Live</span>
    <button slot="actions" type="button" style="${controlStyle}">Refresh</button>
  </sk-page-header>`;

/** A long scrolling body whose focusable rows carry the documented scroll margin, so a keyboard
 *  user tabbing down never lands behind the sticky header (WCAG 2.4.11). This is the recipe
 *  consumers copy: the value is named, not guessed. */
const longBody = (rows = 40) => `
  <div style="padding: var(--sk-space-6)">
    ${Array.from({ length: rows }, (_, i) => `
      <p style="margin: 0 0 var(--sk-space-4)">
        <a href="#row-${i + 1}"
           style="color: var(--sk-fg-default); scroll-margin-block-start: var(--sk-layout-page-header-sticky-scroll-margin)"
           >Run ${i + 1}</a>
      </p>`).join('')}
  </div>`;

const scroller = (content: string, height = '100vh', className = '') => `
  <div data-scroller${className ? ` class="${className}"` : ''} style="${storyFrameStyle}; min-height: 0; height: ${height}; overflow: auto">
    ${content}
  </div>`;

export const Compact: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same five slots at `density="compact"`. Nothing is removed and nothing is ' +
          'authored twice — the eyebrow, title and supporting copy move onto one row and the ' +
          'trailing action is pinned so it cannot be squeezed out.',
      },
    },
  },
  render: () => storyFrame(header('density="compact"')),
};

export const DensityComparison: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default and compact, from identical slot content, so the difference is density and ' +
          'nothing else.',
      },
    },
  },
  render: () => storyFrame(`${header()}${header('density="compact"')}`),
};

export const CompactSticky: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Compact and sticky over a long list. The header keeps the page identity, the ' +
          'consumer-supplied freshness string, the consumer-supplied live indicator and the ' +
          'trailing action in view. Each row below carries ' +
          '`scroll-margin-block-start: var(--sk-layout-page-header-sticky-scroll-margin)`, which ' +
          'is what keeps a focused row out from behind the header.',
      },
    },
  },
  render: () => scroller(`${header('density="compact" sticky')}${longBody()}`),
};

export const NarrowReflow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Below the documented 720px the header stops sticking and stacks. Title, metadata and ' +
          'the trailing action are all still present and reachable — nothing is dropped to make ' +
          'room.',
      },
    },
  },
  render: () => `
    <div style="${storyFrameStyle}">
      <div style="width: 480px; max-width: 100%; border: var(--sk-border-width-1) solid var(--sk-border-default)">
        ${header('density="compact" sticky')}
      </div>
    </div>`,
};

export const ShortViewport: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A viewport 480px high or shorter drops stickiness by the same mechanism: a sticky ' +
          'header that eats a third of a short viewport is worse than no sticky header.',
      },
    },
  },
  render: () => scroller(`${header('density="compact" sticky')}${longBody(12)}`, '360px'),
};

export const CompactTruncation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A long title and a long freshness string truncate visually at compact density. The ' +
          'DOM text is untouched, so assistive technology still reads both in full.',
      },
    },
  },
  render: () =>
    storyFrame(
      header(
        'density="compact"',
        'A deliberately long consumer-owned page heading that has to give way before the action does',
        'Updated 12 seconds ago from the consumer-owned synchronization timer, verbatim',
      ),
    ),
};

export const CompactStickyLightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => scroller(`${header('density="compact" sticky')}${longBody(20)}`, '100vh', 'sk-light'),
};
