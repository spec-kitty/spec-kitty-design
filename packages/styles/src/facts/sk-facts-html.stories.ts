import './sk-facts.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkFactsHTML,
  SkFactsTwoColHTML,
  SkFactsCompactHTML,
  SkFactsLongValueHTML,
  SkFactsEmptyValueHTML,
} from './index';

const meta: Meta = {
  title: 'Primitives/SkFacts (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: 'Stacked (default)',
  render: () => SkFactsHTML,
};

export const TwoColumn: Story = {
  render: () => SkFactsTwoColHTML,
};

export const Compact: Story = {
  render: () => SkFactsCompactHTML,
};

export const LongValue: Story = {
  render: () => SkFactsLongValueHTML,
};

export const EmptyValue: Story = {
  render: () => SkFactsEmptyValueHTML,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkFactsHTML}
    </div>
  `,
};
