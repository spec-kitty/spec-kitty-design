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
 * Real, browser-driven focus -- not a simulated "is-focused" class.
 *
 * ":focus-visible" has no simulatable class form, and sk-form-input.css
 * already records, in this repo's own words, that .sk-input.is-focused
 * "fakes a state the browser owns" and was deliberately removed. This
 * play() function calls native .focus() on the rendered link using only
 * plain DOM APIs (no @storybook/test -- not a dependency of this project;
 * play itself is a core CSF story field, not something that library adds).
 * Storybook runs play() as part of normal story rendering, so
 * run-axe-storybook.js -- which loads each story's iframe and waits for it
 * to finish rendering -- scans the ACTUALLY-focused DOM, which is what makes
 * FR-006's AA-contrast requirement independently checkable at all: plain
 * axe never calls .focus() itself, so a deliberately low-contrast link
 * reports zero color-contrast violations at rest and only fails once
 * something focuses it.
 *
 * Also the forced-colors visual baseline (SC-005): the focused outline uses
 * the LONGHAND outline-color (not the outline shorthand, which stylelint's
 * declaration-strict-value does not police at all regardless of value --
 * see sk-skip-link.css's own comment). Independently confirmed in-engine:
 * this reveal-on-focus mechanism (clip-path + :focus-visible) passes under
 * page.emulateMedia({ forcedColors: 'active' }) in both colorScheme: 'dark'
 * and colorScheme: 'light' -- forced-colors changes paint colors only, never
 * layout or focus semantics, so the same clip-path/:focus-visible mechanism
 * verified in normal rendering holds here too.
 */
export const Focused: Story = {
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
