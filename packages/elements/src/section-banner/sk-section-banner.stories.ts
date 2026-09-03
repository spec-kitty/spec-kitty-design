import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-section-banner.js';

/**
 * <sk-section-banner> — the version/section marker as a custom element (#77).
 *
 * The label is slotted, not a property. Until this mission the three generated static exports
 * each carried a hardcoded version string, which put a docsite's content inside the component
 * library; the labels below live in the story because that is where content belongs.
 */
const meta: Meta = {
  title: 'Elements/SkSectionBanner',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-section-banner>Version 1.x — first stable release</sk-section-banner>',
};

export default meta;
type Story = StoryObj;

/** No `variant` — which renders the neutral banner, not an unpainted one. */
export const Default: Story = {};

export const Neutral: Story = {
  render: () => '<sk-section-banner variant="neutral">Version 1.x — first stable release</sk-section-banner>',
};

export const Purple: Story = {
  render: () => '<sk-section-banner variant="purple">Version 2.x — event architecture &amp; skills</sk-section-banner>',
};

export const Green: Story = {
  render: () => '<sk-section-banner variant="green">Version 3.x — stable release</sk-section-banner>',
};

export const AllVariants: Story = {
  render: () => `
    <div style="display:flex;flex-direction:column;gap:var(--sk-space-3);align-items:flex-start;">
      <sk-section-banner variant="neutral">Version 1.x — first stable release</sk-section-banner>
      <sk-section-banner variant="purple">Version 2.x — event architecture &amp; skills</sk-section-banner>
      <sk-section-banner variant="green">Version 3.x — stable release</sk-section-banner>
    </div>
  `,
};

/**
 * `class="sk-light"`, not `data-theme="light"` — `:root` only ever matches <html>, so the
 * attribute form on a wrapping div activates nothing (#93).
 *
 * Every variant's background and foreground come from tokens, which inherit through the shadow
 * boundary; a selector would not. Asserted in the element's behaviour fixture rather than
 * eyeballed here.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:flex; flex-direction:column; gap:var(--sk-space-3); align-items:flex-start;">
      <sk-section-banner variant="neutral">Version 1.x — first stable release</sk-section-banner>
      <sk-section-banner variant="purple">Version 2.x — event architecture &amp; skills</sk-section-banner>
      <sk-section-banner variant="green">Version 3.x — stable release</sk-section-banner>
    </div>
  `,
};
