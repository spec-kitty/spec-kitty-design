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

/**
 * The ONE guarded substitution in this file. Every `.replace` here goes through it, because a
 * story that guards its label swap and then hand-rolls two more unguarded ones has closed the
 * class in the comment only — which a verification pass caught this file doing.
 */
const swap = (markup: string, find: string, put: string, what: string) => {
  if (!markup.includes(find)) {
    throw new Error(
      `sk-button story: generated markup no longer contains ${JSON.stringify(find)} (${what}) — ` +
        `the replacement would have silently returned it unchanged. Update this story alongside ` +
        `buttonStaticHtml().`,
    );
  }
  return markup.replace(find, put);
};

const label = (markup: string, text: string) => swap(markup, MARKER, `>${text}<`, 'the label');

/**
 * Adds a tone to a generated form that has none.
 *
 * `SkButtonSmHTML` is `sk-button sk-button--sm` — SIZE ONLY — and the base class sets no
 * background or colour, so rendering it bare paints a tone-less button. An earlier revision of
 * this fold did exactly that, and the Small story stopped showing anything: a regression
 * introduced while removing hand-authored markup. Composing a class onto a generated string is
 * not a second authoring site, so ADR-8 criterion 3 is unaffected.
 */
const withTone = (markup: string, tone: 'primary' | 'secondary' | 'ghost') =>
  swap(markup, 'class="sk-button', `class="sk-button sk-button--${tone}`, 'the class list');

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
export const Small: Story = {
  render: () => label(withTone(SkButtonSmHTML, 'primary'), 'Book Demo'),
};

/**
 * `disabled` is authored here rather than generated: it is a STATE, not a variant, so it is not
 * one of the generator's forms. `aria-disabled` is deliberately absent — a real `<button>` with
 * `disabled` already exposes that to assistive technology, and adding both is redundant.
 */
export const Disabled: Story = {
  render: () => swap(label(SkButtonPrimaryHTML, 'Disabled'), '<button ', '<button disabled ', 'the opening tag'),
};

export const AllVariants: Story = {
  render: () => `
    <div style="display:flex;gap:var(--sk-space-4);flex-wrap:wrap;align-items:center">
      ${label(SkButtonPrimaryHTML, 'Get started')}
      ${label(SkButtonSecondaryHTML, 'Star on GitHub')}
      ${label(SkButtonGhostHTML, 'Read the docs')}
      ${label(withTone(SkButtonSmHTML, 'primary'), 'Book Demo')}
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
