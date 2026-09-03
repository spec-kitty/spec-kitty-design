import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-form-input.js';

/**
 * <sk-form-input> — arrangement B, form-associated.
 *
 * FIVE STORIES, NAMED IN expected-stories.json. The axe gate refuses only a GLOBALLY empty
 * story set, so a component shipping one `Default` story reports green over one state and the
 * gate cannot tell the difference. The Error and Disabled states are the point: they are where
 * a form control's accessibility actually goes wrong, and they are what the eight legacy HTML
 * strings existed to show.
 */
const meta: Meta = {
  title: 'Elements/SkFormInput',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () =>
    `<sk-form-input name="email" label="Email address" description="We'll never share your email." placeholder="you@team.com"></sk-form-input>`,
};

export const Filled: Story = {
  render: () => {
    // `value` is a property, not an attribute — set after upgrade, the way a consumer would.
    const el = document.createElement('sk-form-input');
    el.setAttribute('name', 'email');
    el.setAttribute('label', 'Email address');
    el.setAttribute('description', "We'll never share your email.");
    (el as HTMLElement & { value: string }).value = 'ada@team.com';
    return el;
  },
};

/**
 * The invalid state, rendered already invalid — not reached by interaction.
 *
 * The axe gate treats a story that paints nothing until interaction as an UNRENDERED story
 * rather than a passing one, so an Error story that requires a blur to appear tests nothing.
 * `required` with an empty value is invalid on first update.
 */
export const Error: Story = {
  render: () =>
    `<sk-form-input name="email" label="Email address" required description="Required."></sk-form-input>`,
};

export const Disabled: Story = {
  render: () =>
    `<sk-form-input name="email" label="Email address" disabled description="This field is currently unavailable."></sk-form-input>`,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () =>
    `<div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
  <sk-form-input name="email" label="Email address" description="We'll never share your email."></sk-form-input>
</div>`,
};
