import './sk-skip-link.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import { SkSkipLinkUnfocusedHTML } from './index';

const meta: Meta = {
  title: 'Primitives/SkSkipLink (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Unfocused: Story = {
  render: () => SkSkipLinkUnfocusedHTML,
};

/**
 * Real, browser-driven focus — not a simulated `is-focused` class.
 *
 * `:focus-visible` has no simulatable class form, and `sk-form-input.css`
 * already records, in this repo's own words, that `.sk-input.is-focused`
 * "fakes a state the browser owns" and was deliberately removed. This
 * `play()` function calls native `.focus()` on the rendered link using only
 * plain DOM APIs (no `@storybook/test` — not a dependency of this project;
 * `play` itself is a core CSF story field, not something that library adds).
 * Storybook runs `play()` as part of normal story rendering, so
 * `run-axe-storybook.js` — which loads each story's iframe and waits for it
 * to finish rendering — scans the ACTUALLY-focused DOM, which is what makes
 * FR-006's AA-contrast requirement independently checkable at all: plain
 * axe never calls `.focus()` itself, so a deliberately low-contrast link
 * reports zero `color-contrast` violations at rest and only fails once
 * something focuses it.
 */
export const Focused: Story = {
  render: () => SkSkipLinkUnfocusedHTML,
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector<HTMLAnchorElement>('.sk-skip-link');
    link?.focus();
  },
};

/**
 * Forced-colors visual baseline (SC-005). The focused state's outline uses
 * the unpoliced `outline` shorthand with the `Highlight` system color —
 * measured with Playwright's `page.emulateMedia({ forcedColors: 'active' })`
 * against both `colorScheme: 'dark'` and `colorScheme: 'light'`; see this
 * mission's verification notes for the exact computed outline color
 * observed in both schemes.
 */
export const ForcedColorsBaseline: Story = {
  render: () => SkSkipLinkUnfocusedHTML,
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector<HTMLAnchorElement>('.sk-skip-link');
    link?.focus();
  },
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkSkipLinkUnfocusedHTML}
    </div>
  `,
};
