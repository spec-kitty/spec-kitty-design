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
           style="color: var(--sk-fg-default)"
           >Run ${i + 1}</a>
      </p>`).join('')}
  </div>`;

// WCAG 2.4.11 under webkit needs BOTH the container inset and an explicit scroll (#456).
//
// MECHANISM, corrected by the pre-merge squad after an earlier revision of this comment got it
// wrong. That revision said webkit "never consults" scroll-margin or scroll-padding. It does --
// exactly, to the sub-pixel -- the moment a scroll is actually performed. The probe's own numbers
// prove it: `scrollIntoView({block:'start'})` aligns the scroll-MARGIN box inside the scrollport
// inset by scroll-PADDING, so the landing position is scrollerTop + padding + margin:
//
//   compact  0 + 80 + 80       = 160      measured 160
//   default  -0.19 + 288 + 288 = 575.81   measured 575.8125
//
// What webkit does NOT do is INITIATE a focus-driven scroll for a row it considers already in the
// scrollport. That is the whole defect, and it is why no CSS value could fix it: the properties
// were correct and simply never got a scroll to apply to. Chromium initiates that scroll itself,
// which is why this never reproduces there.
//
// The cure therefore DEPENDS on the container's scroll-padding: `portTop` below is the scroller's
// top plus that inset, and without it the guard compares against the bare top edge, `12 < 0` is
// false, and nothing fires. An earlier revision of this PR labelled scroll-padding "refuted" --
// it is load-bearing.
//
// The rows no longer carry `scroll-margin-block-start`. With both set they STACKED: a row landed
// ~160px down against a 66-71px header, roughly twice the needed inset, which no assertion in the
// contract test could see. One declaration on the container replaces per-row margins -- the same
// conclusion the section-nav surface reached on the inline axis (packages/styles/src/section-nav/,
// named by directory because a contract test forbids its `sk-` filename under packages/elements).
//
// ATTACHED VIA `play`, NOT AN INLINE `onfocusin=` ATTRIBUTE. An earlier revision used the
// attribute form on the grounds that `play` runs after render while the contract test focuses
// without waiting. That was true about `play` and a false dichotomy: the squad pointed out this
// same PR's other half establishes the readiness-marker pattern (`data-render-complete`), so the
// race closes by marking the scroller once attached and having the test wait for the mark. The
// attribute form was also the only inline `on*=` handler in any story in this repository, invisible
// to every gate (a string literal no linter or tsc can see), and dead under a CSP without
// `unsafe-inline` -- which is precisely the configuration a consumer is most likely to run.
export const liftFocusClearOfStickyHeader = (event: FocusEvent): void => {
  const scroller = event.currentTarget as HTMLElement | null;
  const target = event.target as HTMLElement | null;
  if (!scroller || !target || target === scroller || !target.getBoundingClientRect) return;
  // The header lives INSIDE the scroll container and has its own focusables (the trailing action).
  // Those sit above the inset by construction, so without this guard focusing one scrolls the
  // container every time -- in Chromium too. Nothing in the fixture focuses it, which is exactly
  // why the contract test would never have shown it.
  if (target.closest('sk-page-header')) return;
  const style = getComputedStyle(scroller);
  const insetTop = Number.parseFloat(style.scrollPaddingBlockStart) || 0;
  const insetBottom = Number.parseFloat(style.scrollPaddingBlockEnd) || 0;
  const port = scroller.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  // Both edges: the squad noted every observation had the row INSIDE the scrollport, so whether
  // webkit also declines to scroll a target entirely below it was untested and a one-sided guard
  // would silently do nothing there.
  if (box.top < port.top + insetTop) target.scrollIntoView({ block: 'start' });
  else if (box.bottom > port.bottom - insetBottom) target.scrollIntoView({ block: 'end' });
};

/** Attaches the handler and marks the scroller, so a test can wait for it rather than race it. */
export const attachFocusLift = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const scroller = canvasElement.querySelector<HTMLElement>('[data-scroller]');
  if (!scroller || scroller.dataset['focusLift'] === 'ready') return;
  scroller.addEventListener('focusin', liftFocusClearOfStickyHeader as EventListener);
  scroller.dataset['focusLift'] = 'ready';
};

const scroller = (content: string, height = '100vh', className = '', extraStyle = '') => `
  <div data-scroller${className ? ` class="${className}"` : ''} style="${storyFrameStyle}; min-height: 0; height: ${height}; overflow: auto; scroll-padding-block-start: var(--sk-layout-page-header-sticky-scroll-margin)${extraStyle ? `; ${extraStyle}` : ''}">
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
          'trailing action in view. The SCROLL CONTAINER carries ' +
          '`scroll-padding-block-start: var(--sk-layout-page-header-sticky-scroll-margin)` — one ' +
          'declaration, not a per-row `scroll-margin`, which would stack with it — and a ' +
          '`focusin` handler that scrolls explicitly, because WebKit declines to initiate a ' +
          'focus-driven scroll for a row it considers already in the scrollport (#456).',
      },
    },
  },
  play: attachFocusLift,
  render: () => scroller(`${header('density="compact" sticky')}${longBody()}`),
};

export const DefaultSticky: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A sticky header at the DEFAULT density — supported, because the two axes are ' +
          'orthogonal. Its height is entirely the consumer\'s slotted content, so the derived ' +
          'default of `--sk-layout-page-header-sticky-scroll-margin` (80px = 0 offset + 48px compact height + 32px, sized for the ' +
          'compact single row) does not cover it. The scroll container below therefore sets the ' +
          'token to this consumer\'s own measured figure, which is the documented remedy — the ' +
          'token name stays the one place the value lives. Remove that override and a focused ' +
          'row lands behind the header.',
      },
    },
  },
  play: attachFocusLift,
  render: () =>
    scroller(
      `${header('sticky')}${longBody()}`,
      '100vh',
      '',
      // The consumer's own figure for THIS composition, rounded up from a measured ~227px.
      // There is no derived token for default density: the height is the consumer's content,
      // so publishing a number would be a guess wearing a token's name.
      '--sk-layout-page-header-sticky-scroll-margin: 18rem',
    ),
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
  play: attachFocusLift,
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
  play: attachFocusLift,
  render: () => scroller(`${header('density="compact" sticky')}${longBody(20)}`, '100vh', 'sk-light'),
};
