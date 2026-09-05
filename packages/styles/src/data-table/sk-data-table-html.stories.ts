import './sk-data-table.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkDataTableDefaultHTML,
  SkDataTableStickyHeaderHTML,
  SkDataTableNarrowScrollableHTML,
} from './index';

const meta: Meta = {
  title: 'Primitives/SkDataTable (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => SkDataTableDefaultHTML,
};

export const StickyHeader: Story = {
  render: () => SkDataTableStickyHeaderHTML,
};

/**
 * SC-003: at a narrow width, the scroller is a labelled, keyboard-reachable
 * region (`role="region"` + `aria-label` + `tabindex="0"`) wrapping an
 * INTACT table — same `<th scope>` usage and cell structure as `Default`.
 * Block-reflow of cells is explicitly rejected; nothing about the wrapper
 * changes the table's internal structure.
 */
export const NarrowScrollable: Story = {
  render: () => SkDataTableNarrowScrollableHTML,
};

/**
 * Forced-colors visual baseline (SC-005) — zebra/hover ROW DISTINCTION, not
 * borders. Measured: a plain border already survives forced-colors mode
 * unaided; the background-based zebra/hover treatment does not, and is
 * substituted here with a border-left accent band (CanvasText for the
 * zebra alternation, Highlight for the hovered row) — see the CSS file's
 * comments and this mission's verification notes for the exact computed
 * colors observed under `page.emulateMedia({ forcedColors: 'active' })` in
 * both the dark and light High Contrast schemes.
 */
export const ForcedColorsBaseline: Story = {
  render: () => SkDataTableDefaultHTML,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkDataTableDefaultHTML}
    </div>
  `,
};
