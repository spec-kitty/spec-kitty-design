import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-card.js';

/**
 * <sk-card> — ADR-8 confirmation #1: one CSS source, three consumption paths, no wrapper.
 *
 * Variants are ATTRIBUTES here (`variant="blue"`), not the classes the static layer uses.
 * The adopted stylesheet is byte-identical to packages/styles/src/card/sk-card.css.
 */
const meta: Meta = {
  title: 'Elements/SkCard',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-card><p>Card content</p></sk-card>',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Blue: Story = {
  render: () => '<sk-card variant="blue"><p>Information card</p></sk-card>',
};

export const Purple: Story = {
  render: () => '<sk-card variant="purple"><p>Architecture card</p></sk-card>',
};

export const Inset: Story = {
  render: () => '<sk-card inset><p>Inset card</p></sk-card>',
};

/**
 * LightMode is required of every story by CLAUDE.md §3 — and this mission's exit criteria
 * say to VERIFY it renders light-mode styling rather than assume it.
 *
 * It does, and it is the reason this mission touched tokens. `sk-card.css` used to carry
 * `:root[data-theme="light"] .sk-card--blue` and `.sk-light .sk-card--blue`. Both cross a
 * shadow boundary, so inside <sk-card> both are inert — this story would have rendered
 * DARK borders on a light ground, with no error and no warning. Light-mode variance now
 * lives in `--sk-border-tint-{sky,lilac}`, and a custom property inherits through the
 * boundary where a selector does not.
 *
 * The wrapper carries `class="sk-light"`, not `data-theme="light"`: the token package
 * anchors its light block on `:root[data-theme="light"], .sk-light`, and `:root` only ever
 * matches <html>, so the attribute on a wrapping div activates nothing (#93).
 *
 * Asserted, not eyeballed: fixtures/elements-behaviour/src/sk-card.test.ts reads the
 * computed border colour under both themes and requires them to differ.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: grid; gap: var(--sk-space-4);">
      <sk-card variant="blue"><p>Information card</p></sk-card>
      <sk-card variant="purple"><p>Architecture card</p></sk-card>
    </div>
  `,
};
