import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-check-bullet.js';

/**
 * <sk-check-bullet> — #79's primitives batch.
 *
 * Use inside a `<ul role="list">`. The element sets `role="listitem"` on itself because a
 * custom element inside a `<ul>` is not a list item; the static form is a real `<li>`.
 */
const list = (items: readonly string[], extra = '') => `
  <ul role="list" style="list-style:none; padding:0; margin:0; display:grid; gap:var(--sk-space-3);">
    ${items.map((t) => `<sk-check-bullet${extra}>${t}</sk-check-bullet>`).join('\n    ')}
  </ul>`;

const meta: Meta = {
  title: 'Elements/SkCheckBullet',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () =>
    list([
      'Requirements captured before code generation begins',
      'Decisions and rationale live with the feature',
      'Every PR ships with a spec reviewers can check against',
    ]),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

/** A single bullet, for composing into other layouts. */
export const Single: Story = {
  render: () => '<ul role="list" style="list-style:none;padding:0;margin:0;"><sk-check-bullet>One checked item</sk-check-bullet></ul>',
};

/** The tick is a property, so a consumer can use a different mark. */
export const CustomIcon: Story = {
  render: () => list(['Shipped', 'Verified', 'Documented'], ' icon="★"'),
};

/** `class="sk-light"`, not `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6);">
      ${list(['Requirements captured up front', 'Rationale lives with the feature', 'Reviewable specs'])}
    </div>
  `,
};
