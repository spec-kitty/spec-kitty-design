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
  SkProgressIndeterminateHTML,
  SkProgressIndeterminateWithMetaHTML,
  SkProgressIndeterminateNarrowHTML,
  SkProgressIndeterminateCompactHTML,
  SkProgressIndeterminateLongLabelHTML,
  SkProgressIndeterminateForcedColorsHTML,
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
 * Indeterminate (#306): a real, valueless `<progress class="sk-progress__bar">`
 * — no `value` attribute anywhere in the source, no meta. See spec.md's
 * "Cross-Mission Decision: TKT5/TKT6 Activity Cue" for why this cue is not
 * shared with sk-button/#305.
 */
export const Indeterminate: Story = {
  render: () => SkProgressIndeterminateHTML,
};

/** Indeterminate with non-percentage `sk-progress__meta` status text. */
export const IndeterminateWithMeta: Story = {
  render: () => SkProgressIndeterminateWithMetaHTML,
};

/** Indeterminate combined with the existing `--narrow` layout modifier. */
export const IndeterminateNarrow: Story = {
  render: () => SkProgressIndeterminateNarrowHTML,
};

/** Indeterminate combined with a long label, proving no horizontal overflow. */
export const IndeterminateLongLabel: Story = {
  render: () => SkProgressIndeterminateLongLabelHTML,
};

/**
 * Indeterminate combined with the existing `--compact` layout modifier (FR-010,
 * data-model.md:57 — `.sk-progress--indeterminate.sk-progress--compact` is a
 * declared-supported combination).
 */
export const IndeterminateCompact: Story = {
  render: () => SkProgressIndeterminateCompactHTML,
};

/** Indeterminate under `forced-colors: active` — sampled at multiple points in the animation cycle by the corresponding Playwright test. */
export const IndeterminateForcedColors: Story = {
  render: () => SkProgressIndeterminateForcedColorsHTML,
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
