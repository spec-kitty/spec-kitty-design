import './sk-button.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkButtonPrimaryHTML,
  SkButtonSecondaryHTML,
  SkButtonGhostHTML,
  SkButtonSmHTML,
  SkButtonLinkHTML,
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

// `withTone()` USED TO LIVE HERE and is deliberately gone. It composed a tone class onto
// `SkButtonSmHTML`, which the generator emitted as `sk-button sk-button--sm` — size only, and
// the base class paints nothing, so the Small story rendered an invisible button until the
// helper patched it. That was treating the symptom: the cause was `BUTTON_AXES` being derived
// from `BUTTON_SIZES`, conflating "size modifiers" with "static forms worth publishing". The
// axis now declares its tone, so the generated string is already painted and the story
// composes nothing. Do not reintroduce a class-composing helper here; fix the axis instead.

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
  render: () => label(SkButtonSmHTML, 'Book Demo'),
};

/**
 * The ANCHOR form, and the reason it has a story at all.
 *
 * `SkButtonLinkHTML` was added to `BUTTON_AXES` because every button-styled thing in
 * `apps/demo` is an `<a href>` and the no-JavaScript consumer had to hand-write it. But a
 * generated export with no consumer is the exact defect that addition was fixing — a lens
 * caught that the new export shipped with zero references and the anchor branch of
 * `buttonStaticHtml` still had no coverage anywhere. This story is its consumer, and it also
 * gives the a11y gate the class-path anchor form to check.
 */
export const Link: Story = { render: () => label(SkButtonLinkHTML, 'Read the docs') };

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
      ${label(SkButtonSmHTML, 'Book Demo')}
      ${label(SkButtonLinkHTML, 'Read the docs')}
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
