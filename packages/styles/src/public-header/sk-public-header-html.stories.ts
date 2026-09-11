import '../button/sk-button.css';
import './sk-public-header.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkPublicHeaderBrandOnlyHTML,
  SkPublicHeaderCurrentActionHTML,
  SkPublicHeaderLongLabelsHTML,
  SkPublicHeaderManyActionsHTML,
  SkPublicHeaderMixedControlsHTML,
  SkPublicHeaderOneActionHTML,
  SkPublicHeaderThemeSlotHTML,
  SkPublicHeaderTwoActionsHTML,
} from './index';

const meta: Meta = {
  title: 'Navigation/SkPublicHeader (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const storyFrame = (
  html: string,
  {
    light = false,
    narrow = false,
    rtl = false,
    shortViewport = false,
  }: {
    light?: boolean;
    narrow?: boolean;
    rtl?: boolean;
    shortViewport?: boolean;
  } = {},
): string => `
  <div data-public-header-story-frame${light ? ' class="sk-light"' : ''}${rtl ? ' dir="rtl"' : ''} style="box-sizing: border-box; inline-size: calc(100vw - var(--sk-space-8)); max-inline-size: ${narrow ? 'calc(var(--sk-space-10) * 4)' : 'calc(var(--sk-space-12) * 8)'};${shortViewport ? ' block-size: var(--sk-space-10); overflow-block: auto;' : ''} color: var(--sk-fg-body); background: var(--sk-surface-page);">
    ${html}
  </div>
`;

/** The Family 6 two-action form in the default dark theme. */
export const Default: Story = {
  render: () => storyFrame(SkPublicHeaderTwoActionsHTML),
};

export const BrandOnly: Story = {
  render: () => storyFrame(SkPublicHeaderBrandOnlyHTML),
};

export const OneAction: Story = {
  render: () => storyFrame(SkPublicHeaderOneActionHTML),
};

export const ManyActions: Story = {
  render: () => storyFrame(SkPublicHeaderManyActionsHTML),
};

export const LongLabels: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => storyFrame(SkPublicHeaderLongLabelsHTML, { narrow: true }),
};

export const CurrentAction: Story = {
  render: () => storyFrame(SkPublicHeaderCurrentActionHTML),
};

export const MixedControls: Story = {
  render: () => storyFrame(SkPublicHeaderMixedControlsHTML),
};

export const ThemeToggleComposition: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Blocked on #323. Once #323 merges into `train/elements-first` and ships a stable public contract, the neutral placeholder button will be replaced by a real `<sk-theme-toggle class="sk-public-header__action">`. This family owns no theme state either way.',
      },
    },
  },
  render: () => storyFrame(SkPublicHeaderThemeSlotHTML),
};

// `parameters.viewport` is INERT in this repo: `apps/storybook/.storybook/main.ts` registers only
// addon-docs and addon-a11y, and the viewport feature is applied by the manager resizing the
// preview iframe — which nothing here goes through, since every consumer loads `/iframe.html`
// directly. So these two stories constrain the FRAME, the way LongLabels already did. Without
// that they rendered byte-identically to Default while being frozen into `expected-stories.json`
// as independent narrow/short evidence — an artifact enrolled in a gate on evidence it did not
// carry. The Playwright layer sets its own viewport and remains the behavioural proof; this makes
// the story list honest to a human reviewer opening it.
export const Narrow: Story = {
  render: () => storyFrame(SkPublicHeaderTwoActionsHTML, { narrow: true }),
};

export const ShortViewport: Story = {
  render: () => storyFrame(SkPublicHeaderTwoActionsHTML, { shortViewport: true }),
};

export const Rtl: Story = {
  render: () => storyFrame(SkPublicHeaderTwoActionsHTML, { rtl: true }),
};

/** Browser tests activate forced-colours emulation for this current route. */
export const ForcedColors: Story = {
  render: () => storyFrame(SkPublicHeaderCurrentActionHTML),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(SkPublicHeaderTwoActionsHTML, { light: true }),
};
