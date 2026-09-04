import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-button.js';

/**
 * <sk-button> — #79's primitives batch.
 *
 * Set `href` and it renders an anchor; omit it and you get a button. Both carry the same
 * classes, because the catalogue already needs both: every use of this primitive in the demo
 * pages is a link styled as a button, while the stories use a real button.
 */
const meta: Meta = {
  title: 'Elements/SkButton',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-button variant="primary">Primary</sk-button>',
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {};
export const Secondary: Story = { render: () => '<sk-button variant="secondary">Secondary</sk-button>' };
export const Ghost: Story = { render: () => '<sk-button variant="ghost">Ghost</sk-button>' };

/** Size is an axis, independent of tone. */
export const Small: Story = {
  render: () => `
    <div style="display:flex; gap:var(--sk-space-4); align-items:center;">
      <sk-button variant="primary" size="sm">Small primary</sk-button>
      <sk-button variant="secondary" size="sm">Small secondary</sk-button>
    </div>
  `,
};

/** With `href` the element renders a real anchor — it navigates, and assistive technology
 *  announces a link rather than a button. */
export const AsLink: Story = {
  render: () => '<sk-button variant="primary" href="#posts">Read the posts</sk-button>',
};

export const Disabled: Story = {
  render: () => '<sk-button variant="primary" disabled>Disabled</sk-button>',
};

export const AllVariants: Story = {
  render: () => `
    <div style="display:flex; gap:var(--sk-space-4); align-items:center; flex-wrap:wrap;">
      <sk-button variant="primary">Primary</sk-button>
      <sk-button variant="secondary">Secondary</sk-button>
      <sk-button variant="ghost">Ghost</sk-button>
      <sk-button variant="primary" href="#">Link</sk-button>
    </div>
  `,
};

/** `class="sk-light"`, not `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:flex; gap:var(--sk-space-4); flex-wrap:wrap;">
      <sk-button variant="primary">Primary</sk-button>
      <sk-button variant="secondary">Secondary</sk-button>
      <sk-button variant="ghost">Ghost</sk-button>
    </div>
  `,
};
