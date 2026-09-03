import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-form-textarea.js';

/**
 * <sk-form-textarea> — arrangement B, form-associated, multi-line.
 *
 * FIVE STORIES, NAMED IN expected-stories.json. The axe gate refuses only a GLOBALLY empty
 * story set, so a component shipping one `Default` story reports green over one state and the
 * gate cannot tell the difference. The Error and Disabled states are the point: they are where
 * a form control's accessibility actually goes wrong, and they are what the eight legacy HTML
 * strings existed to show.
 */
const meta: Meta = {
  title: 'Elements/SkFormTextarea',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () =>
    `<sk-form-textarea name="summary" label="What are you trying to ship?" description="Keep it brief — one or two sentences." placeholder="Describe your goal..."></sk-form-textarea>`,
};

export const Filled: Story = {
  render: () => {
    // `value` is a property, not an attribute — set after upgrade, the way a consumer would.
    const el = document.createElement('sk-form-textarea');
    el.setAttribute('name', 'summary');
    el.setAttribute('label', 'What are you trying to ship?');
    el.setAttribute('description', "Keep it brief — one or two sentences.");
    (el as HTMLElement & { value: string }).value = 'Ship the elements-first redesign.';
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
    `<sk-form-textarea name="summary" label="What are you trying to ship?" required description="Required."></sk-form-textarea>`,
};

export const Disabled: Story = {
  render: () =>
    `<sk-form-textarea name="summary" label="What are you trying to ship?" disabled description="This field is currently unavailable."></sk-form-textarea>`,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () =>
    `<div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
  <sk-form-textarea name="summary" label="What are you trying to ship?" description="Keep it brief — one or two sentences."></sk-form-textarea>
</div>`,
};
