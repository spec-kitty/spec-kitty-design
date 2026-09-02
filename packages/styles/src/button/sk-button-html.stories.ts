import './sk-button.css';
import type { Meta, StoryObj } from '@storybook/html';
import { SkButtonPrimaryHTML, SkButtonSecondaryHTML } from './index';

const meta: Meta = {
  title: 'Components/Button (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => SkButtonPrimaryHTML };
export const Secondary: Story = { render: () => SkButtonSecondaryHTML };
export const Ghost: Story = {
  render: () => `<button class="sk-btn sk-btn--ghost" type="button">Read the docs</button>`,
};
export const Small: Story = {
  render: () => `<button class="sk-btn sk-btn--primary sk-btn--sm" type="button">Book Demo</button>`,
};
export const Disabled: Story = {
  render: () => `<button class="sk-btn sk-btn--primary" type="button" disabled aria-disabled="true">Disabled</button>`,
};
export const AllVariants: Story = {
  render: () => `
    <div style="display:flex;gap:var(--sk-space-4);flex-wrap:wrap;align-items:center">
      <button class="sk-btn sk-btn--primary">Get started</button>
      <button class="sk-btn sk-btn--secondary">Star on GitHub</button>
      <button class="sk-btn sk-btn--ghost">Read the docs</button>
      <button class="sk-btn sk-btn--primary sk-btn--sm">Book Demo</button>
    </div>
  `,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      <button class="sk-btn sk-btn--primary" type="button">Get started</button>
    </div>
  `,
};
