import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-pill-tag.js';

/**
 * <sk-pill-tag> — #79's primitives batch.
 *
 * `variant` is colour, `shape` is size, and they are independent — which is the point of
 * folding the old `.sk-eyebrow-pill` in as a shape rather than leaving it a second component:
 * a tinted eyebrow is now expressible and was not before.
 */
const meta: Meta = {
  title: 'Elements/SkPillTag',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-pill-tag>v1.0.0</sk-pill-tag>',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
export const Green: Story = { render: () => '<sk-pill-tag variant="green">SemVer</sk-pill-tag>' };
export const Purple: Story = { render: () => '<sk-pill-tag variant="purple">Skills Pack</sk-pill-tag>' };
export const Breaking: Story = { render: () => '<sk-pill-tag variant="breaking">Breaking</sk-pill-tag>' };
export const Yellow: Story = { render: () => '<sk-pill-tag variant="yellow">Schema Gate</sk-pill-tag>' };

export const Eyebrow: Story = {
  render: () => '<sk-pill-tag shape="eyebrow">For software teams adopting agentic coding</sk-pill-tag>',
};

/** The two axes compose — this combination did not exist before #79. */
export const TintedEyebrow: Story = {
  render: () => '<sk-pill-tag shape="eyebrow" variant="purple">Skills Pack preview</sk-pill-tag>',
};

export const AllVariants: Story = {
  render: () => `
    <div style="display:flex; gap:var(--sk-space-3); align-items:center; flex-wrap:wrap;">
      <sk-pill-tag>v1.0.0</sk-pill-tag>
      <sk-pill-tag variant="breaking">Breaking</sk-pill-tag>
      <sk-pill-tag variant="green">SemVer</sk-pill-tag>
      <sk-pill-tag variant="purple">Skills Pack</sk-pill-tag>
      <sk-pill-tag variant="yellow">Schema Gate</sk-pill-tag>
    </div>
  `,
};

/** `class="sk-light"`, not `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:flex; gap:var(--sk-space-3); flex-wrap:wrap;">
      <sk-pill-tag>v1.0.0</sk-pill-tag>
      <sk-pill-tag variant="green">SemVer</sk-pill-tag>
      <sk-pill-tag variant="purple">Skills Pack</sk-pill-tag>
      <sk-pill-tag shape="eyebrow">Eyebrow on light</sk-pill-tag>
    </div>
  `,
};
