import './sk-progress.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkProgressT10HTML,
  SkProgressZeroHTML,
  SkProgressCompleteHTML,
  SkProgressLargeTotalHTML,
  SkProgressLongLabelHTML,
  SkProgressCompactHTML,
  SkProgressNarrowHTML,
  SkProgressForcedColorsHTML,
} from './index';

const meta: Meta = {
  title: 'Primitives/SkProgress (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => SkProgressT10HTML,
};

export const Zero: Story = {
  render: () => SkProgressZeroHTML,
};

export const Complete: Story = {
  render: () => SkProgressCompleteHTML,
};

export const LargeTotal: Story = {
  render: () => SkProgressLargeTotalHTML,
};

export const LongLabel: Story = {
  render: () => SkProgressLongLabelHTML,
};

export const Compact: Story = {
  render: () => SkProgressCompactHTML,
};

export const Narrow: Story = {
  render: () => SkProgressNarrowHTML,
};

export const ForcedColors: Story = {
  render: () => SkProgressForcedColorsHTML,
};

/**
 * Rendered from the GENERATED T10 export, wrapped in `class="sk-light"` — never
 * `data-theme="light"`, which activates nothing on a wrapper (CLAUDE.md §6, #93).
 * `sk-progress.spec.ts` verifies a computed value genuinely differs between this
 * and Default rather than assuming the class does something.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkProgressT10HTML}
    </div>
  `,
};
