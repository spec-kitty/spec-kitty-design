import './sk-empty-state.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import { SkEmptyStateWithActionHTML, SkEmptyStateWithoutActionHTML } from './index';

const meta: Meta = {
  title: 'Primitives/SkEmptyState (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const WithAction: Story = {
  render: () => SkEmptyStateWithActionHTML,
};

export const WithoutAction: Story = {
  render: () => SkEmptyStateWithoutActionHTML,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkEmptyStateWithActionHTML}
    </div>
  `,
};
