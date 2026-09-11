import './sk-section-nav.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkSectionNavDefaultHTML,
  SkSectionNavLongLabelsHTML,
  SkSectionNavManyRoutesHTML,
  SkSectionNavNoCurrentHTML,
  SkSectionNavOneRouteHTML,
  SkSectionNavTwoRouteHTML,
} from './index';

const meta: Meta = {
  title: 'Navigation/SkSectionNav (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const withoutCurrent = (html: string): string => html.replace(/\saria-current="[^"]*"/g, '');

const withCurrent = (html: string, href: string): string =>
  withoutCurrent(html).replace(`href="${href}"`, `href="${href}" aria-current="page"`);

const storyFrame = (
  html: string,
  {
    light = false,
    narrow = false,
    veryNarrow = false,
    rtl = false,
  }: { light?: boolean; narrow?: boolean; veryNarrow?: boolean; rtl?: boolean } = {},
): string => `
  <div data-section-nav-story-frame${light ? ' class="sk-light"' : ''}${rtl ? ' dir="rtl"' : ''} style="box-sizing: border-box; inline-size: 100%; max-inline-size: ${veryNarrow ? '200px' : narrow ? '240px' : '320px'}; padding: var(--sk-space-4); color: var(--sk-fg-body); background: var(--sk-surface-page);">
    ${html}
  </div>
`;

/** Canonical three-route administrator strip; current is the middle route. */
export const Default: Story = {
  render: () => storyFrame(SkSectionNavDefaultHTML),
};

export const CurrentFirst: Story = {
  render: () => storyFrame(withCurrent(SkSectionNavDefaultHTML, '#overview')),
};

export const CurrentLast: Story = {
  render: () => storyFrame(withCurrent(SkSectionNavDefaultHTML, '#settings')),
};

/** One link is explicit aria-current="false"; the rest carry no aria-current at all. */
export const NoCurrent: Story = {
  render: () => storyFrame(SkSectionNavNoCurrentHTML),
};

export const OneRoute: Story = {
  render: () => storyFrame(SkSectionNavOneRouteHTML),
};

/** A permission check has supplied only two of three possible routes. */
export const TwoRoute: Story = {
  render: () => storyFrame(SkSectionNavTwoRouteHTML),
};

/** Six routes exceed the strip's available inline space and force local scroll. */
export const ManyRoutes: Story = {
  render: () => storyFrame(SkSectionNavManyRoutesHTML, { narrow: true }),
};

export const LongLabels: Story = {
  render: () => storyFrame(SkSectionNavLongLabelsHTML, { narrow: true }),
};

// `parameters.viewport` is INERT in this repo: `apps/storybook/.storybook/main.ts` registers only
// addon-docs and addon-a11y, and the viewport feature is applied by the manager resizing the
// preview iframe — which nothing here goes through, since every consumer loads `/iframe.html`
// directly. #353 (sk-public-header) diagnosed and fixed the identical defect: a story that only
// set an inert `viewport` parameter rendered byte-identically to another and was still frozen into
// `expected-stories.json` as independent evidence it did not carry. The fix here follows #353's
// own remedy — constrain the FRAME instead, at a width genuinely narrower than ManyRoutes' 240px,
// so this id proves tighter local-overflow containment than any other fixture in this family
// rather than duplicating ManyRoutes' own render. The Playwright layer sets its own viewport and
// remains the behavioural proof; this makes the story list honest to a human reviewer opening it.
export const Narrow: Story = {
  render: () => storyFrame(SkSectionNavManyRoutesHTML, { veryNarrow: true }),
};

/** Browser tests activate forced-colours emulation for this current-route composition. */
export const ForcedColors: Story = {
  render: () => storyFrame(SkSectionNavDefaultHTML, { narrow: true }),
};

export const Rtl: Story = {
  render: () => storyFrame(SkSectionNavDefaultHTML, { narrow: true, rtl: true }),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(SkSectionNavDefaultHTML, { light: true }),
};
