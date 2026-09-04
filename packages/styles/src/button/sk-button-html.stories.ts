import './sk-button.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkButtonPrimaryHTML,
  SkButtonSecondaryHTML,
  SkButtonGhostHTML,
  SkButtonSmHTML,
} from './index';

/**
 * Renders from the GENERATED exports (ADR-10 §3, ADR-8 criterion 3).
 *
 * This file hand-authored button markup EIGHT times — including two strings that were exactly
 * `SkButtonGhostHTML` and `SkButtonSmHTML`, generated exports #79 itself added and then left
 * with no consumer. A pre-merge lens caught that: the mission produced the fix and did not
 * apply it, in the batch the programme assigns criterion 3 to.
 *
 * `label()` THROWS when the marker is absent, because `String.replace` with a string pattern
 * returns its input UNCHANGED on no match — a renamed default would otherwise render every
 * button as "Label" with no error.
 */
const MARKER = '>Label<';

const label = (markup: string, text: string) => {
  if (!markup.includes(MARKER)) {
    throw new Error(
      `sk-button story: generated markup no longer contains ${JSON.stringify(MARKER)} — ` +
        `label() would have silently returned it unchanged. Update MARKER alongside ` +
        `buttonStaticHtml()'s default content.`,
    );
  }
  return markup.replace(MARKER, `>${text}<`);
};

const meta: Meta = {
  title: 'Components/Button (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => label(SkButtonPrimaryHTML, 'Get started') };
export const Secondary: Story = { render: () => label(SkButtonSecondaryHTML, 'Star on GitHub') };
export const Ghost: Story = { render: () => label(SkButtonGhostHTML, 'Read the docs') };
export const Small: Story = { render: () => label(SkButtonSmHTML, 'Book Demo') };

/**
 * `disabled` is authored here rather than generated: it is a STATE, not a variant, so it is not
 * one of the generator's forms. `aria-disabled` is deliberately absent — a real `<button>` with
 * `disabled` already exposes that to assistive technology, and adding both is redundant.
 */
export const Disabled: Story = {
  render: () => label(SkButtonPrimaryHTML, 'Disabled').replace('<button ', '<button disabled '),
};

export const AllVariants: Story = {
  render: () => `
    <div style="display:flex;gap:var(--sk-space-4);flex-wrap:wrap;align-items:center">
      ${label(SkButtonPrimaryHTML, 'Get started')}
      ${label(SkButtonSecondaryHTML, 'Star on GitHub')}
      ${label(SkButtonGhostHTML, 'Read the docs')}
      ${label(SkButtonSmHTML, 'Book Demo')}
    </div>
  `,
};

/** `class="sk-light"`, NOT `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:flex; gap:var(--sk-space-4); flex-wrap:wrap;">
      ${label(SkButtonPrimaryHTML, 'Get started')}
      ${label(SkButtonSecondaryHTML, 'Star on GitHub')}
      ${label(SkButtonGhostHTML, 'Read the docs')}
    </div>
  `,
};
