import './sk-context-nav.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkContextNavCurrentNestedHTML,
  SkContextNavDefaultHTML,
  SkContextNavEmptyHTML,
  SkContextNavEmptyOverflowHTML,
  SkContextNavLongLabelsHTML,
  SkContextNavScaleHTML,
  SkContextNavUnavailableAllHTML,
  SkContextNavUnavailableLongHTML,
  SkContextNavUnavailableMixedHTML,
  SkContextNavUnavailableParentHTML,
} from './index';

const meta: Meta = {
  title: 'Navigation/SkContextNav (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const withoutCurrent = (html: string): string => html.replace(/\saria-current="[^"]*"/g, '');

const currentParent = (html: string): string =>
  withoutCurrent(html).replace('href="#collection"', 'href="#collection" aria-current="page"');

const withChildCount = (html: string, count: number): string =>
  withoutCurrent(html)
    .split('\n')
    .filter((line) => {
      const child = line.match(/href="#item-(\d+)"/);
      return child === null || Number(child[1]) <= count;
    })
    .join('\n');

const withoutUnavailableAnnotations = (html: string): string =>
  html.replace(
    /\s*<span class="sk-context-nav__annotation">[\s\S]*?<\/span>/g,
    '',
  );

const storyFrame = (
  html: string,
  { light = false, narrow = false, rtl = false }: { light?: boolean; narrow?: boolean; rtl?: boolean } = {},
): string => `
  <div data-context-nav-story-frame${light ? ' class="sk-light"' : ''}${rtl ? ' dir="rtl"' : ''} style="box-sizing: border-box; inline-size: 100%; max-inline-size: ${narrow ? '240px' : '320px'}; padding: var(--sk-space-4); color: var(--sk-fg-body); background: var(--sk-surface-page);">
    ${html}
  </div>
`;

/** Canonical grouped navigation with text and decorative-icon links. */
export const Default: Story = {
  render: () => storyFrame(SkContextNavDefaultHTML),
};

export const CurrentTopLevel: Story = {
  render: () => storyFrame(SkContextNavDefaultHTML),
};

export const CurrentNested: Story = {
  render: () => storyFrame(SkContextNavCurrentNestedHTML),
};

export const CurrentParent: Story = {
  render: () => storyFrame(currentParent(SkContextNavCurrentNestedHTML)),
};

export const NoCurrent: Story = {
  render: () => storyFrame(withoutCurrent(SkContextNavDefaultHTML)),
};

export const Empty: Story = {
  render: () => storyFrame(SkContextNavEmptyHTML),
};

export const EmptyOverflow: Story = {
  render: () => storyFrame(SkContextNavEmptyOverflowHTML),
};

export const LongLabels: Story = {
  render: () => storyFrame(SkContextNavLongLabelsHTML, { narrow: true }),
};

export const OneChild: Story = {
  render: () => storyFrame(withChildCount(SkContextNavCurrentNestedHTML, 1), { narrow: true }),
};

export const ThreeChildren: Story = {
  render: () => storyFrame(withChildCount(SkContextNavCurrentNestedHTML, 3), { narrow: true }),
};

export const TwentyChildren: Story = {
  render: () => storyFrame(SkContextNavScaleHTML, { narrow: true }),
};

/** A 240 CSS-pixel composition inside a 390 CSS-pixel browser viewport. */
export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => storyFrame(SkContextNavLongLabelsHTML, { narrow: true }),
};

/** Browser tests activate forced-colours emulation for this current/nested route. */
export const ForcedColors: Story = {
  render: () => storyFrame(SkContextNavCurrentNestedHTML, { narrow: true }),
};

export const Rtl: Story = {
  render: () => storyFrame(SkContextNavCurrentNestedHTML, { narrow: true, rtl: true }),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(SkContextNavDefaultHTML, { light: true }),
};

/** Mixed native links and static unavailable destinations in the default dark theme. */
export const UnavailableMixed: Story = {
  render: () => storyFrame(SkContextNavUnavailableMixedHTML),
};

/** Unavailable destinations remain explicit when the consumer omits annotation text. */
export const UnavailableAnnotationFree: Story = {
  render: () =>
    storyFrame(withoutUnavailableAnnotations(SkContextNavUnavailableMixedHTML)),
};

/** A catalogue may truthfully contain no available or current destination. */
export const UnavailableAll: Story = {
  render: () => storyFrame(SkContextNavUnavailableAllHTML),
};

/** An unavailable parent has no implied child list beside a real available parent. */
export const UnavailableParent: Story = {
  render: () => storyFrame(SkContextNavUnavailableParentHTML),
};

/** Long labels and annotations in the 240 CSS-pixel composition. */
export const UnavailableLong: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => storyFrame(SkContextNavUnavailableLongHTML, { narrow: true }),
};

/** Browser tests activate forced-colours emulation for this unavailable-entry route. */
export const UnavailableForcedColors: Story = {
  render: () => storyFrame(SkContextNavUnavailableMixedHTML, { narrow: true }),
};

export const UnavailableRtl: Story = {
  render: () =>
    storyFrame(SkContextNavUnavailableLongHTML, { narrow: true, rtl: true }),
};

export const UnavailableLightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => storyFrame(SkContextNavUnavailableMixedHTML, { light: true }),
};
