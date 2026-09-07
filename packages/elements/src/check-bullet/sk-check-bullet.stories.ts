import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-check-bullet.js';

/**
 * <sk-check-bullet> — #79's primitives batch.
 *
 * Use inside a `<ul role="list">`. The element sets `role="listitem"` on itself because a
 * custom element inside a `<ul>` is not a list item; the static form is a real `<li>`.
 */
type CheckBulletStoryItem = {
  text: string;
  state?: 'complete' | 'pending';
  icon?: string;
};

const itemMarkup = (item: CheckBulletStoryItem) => {
  const state = item.state ? ` state="${item.state}"` : '';
  const icon = item.icon ? ` icon="${item.icon}"` : '';
  return `<sk-check-bullet${state}${icon}>${item.text}</sk-check-bullet>`;
};

const list = (items: readonly CheckBulletStoryItem[]) => `
  <ul role="list" style="list-style:none; padding:0; margin:0; display:grid; gap:var(--sk-space-3);">
    ${items.map(itemMarkup).join('\n    ')}
  </ul>`;

const meta: Meta = {
  title: 'Elements/SkCheckBullet',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () =>
    list([
      { text: 'Requirements captured before code generation begins' },
      { text: 'Decisions and rationale live with the feature' },
      { text: 'Every PR ships with a spec reviewers can check against' },
    ]),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

/** A single bullet, for composing into other layouts. */
export const Single: Story = {
  render: () =>
    '<ul role="list" style="list-style:none;padding:0;margin:0;"><sk-check-bullet>One checked item</sk-check-bullet></ul>',
};

export const Complete: Story = {
  render: () => list([{ text: 'Implementation complete', state: 'complete' }]),
};

export const Pending: Story = {
  render: () => list([{ text: 'Review pending', state: 'pending' }]),
};

export const Mixed: Story = {
  render: () =>
    list([
      { text: 'Specification approved', state: 'complete' },
      { text: 'Implementation complete', state: 'complete' },
      { text: 'Independent review pending', state: 'pending' },
    ]),
};

export const LongItems: Story = {
  render: () =>
    `<div style="max-inline-size:calc(var(--sk-space-12) + var(--sk-space-12));">${list(
      [
        {
          text: 'A deliberately long supplied subtask description wraps naturally without changing the passive list-item semantics or inventing progress behavior.',
          state: 'pending',
        },
        {
          text: 'A second long completed item demonstrates that state, icon, and consumer-authored text remain attached at narrow widths.',
          state: 'complete',
        },
      ],
    )}</div>`,
};

export const NoSubtasks: Story = {
  render: () => `
    <div class="sk-empty-state" style="color:var(--sk-fg-default);">
      <h3 class="sk-empty-state__heading">No subtasks</h3>
      <p class="sk-empty-state__body">The consumer supplies this passive absence message.</p>
    </div>
  `,
};

export const FiftyItems: Story = {
  render: () =>
    list(
      Array.from({ length: 50 }, (_, index) => ({
        text: `Supplied subtask ${index + 1}`,
        state: index % 3 === 0 ? ('pending' as const) : ('complete' as const),
      })),
    ),
};

/** The tick is a property, so a consumer can use a different mark. */
export const CustomIcon: Story = {
  render: () =>
    list([
      { text: 'Shipped', state: 'complete', icon: '★' },
      { text: 'Awaiting verification', state: 'pending', icon: '☆' },
      { text: 'Documented', state: 'complete', icon: '★' },
    ]),
};

/** `class="sk-light"`, not `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6);">
      ${list([
        { text: 'Requirements captured up front', state: 'complete' },
        { text: 'Rationale lives with the feature', state: 'complete' },
        { text: 'Review pending', state: 'pending' },
      ])}
    </div>
  `,
};
