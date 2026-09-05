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

/**
 * Also the forced-colors visual baseline (SC-005) -- zebra/hover ROW
 * DISTINCTION, not borders. Measured: a plain border already survives
 * forced-colors mode unaided; the background-based zebra/hover treatment
 * does not, and is substituted with a border-left accent band (CanvasText
 * for the zebra alternation, Highlight for the hovered row) -- see the CSS
 * file's own comments for the mechanism and why the LONGHAND
 * border-left-color, not the border-left shorthand, is what the stylelint
 * gate actually certifies.
 */
export const Default: Story = {
  render: () => SkDataTableDefaultHTML,
};

/**
 * The max-height that makes the sticky behaviour demonstrable is applied
 * HERE, at story render time -- not baked into the authored exemplar, which
 * a consumer might paste verbatim and get hard-capped at 240px for no reason
 * of their own choosing. role="region"/aria-label/tabindex="0" are ALSO
 * applied only here, and only because this constraint makes the scroller
 * genuinely vertically overflow -- axe's scrollable-region-focusable rule
 * measured this: an unlabelled, non-focusable scroller that actually
 * overflows is a real keyboard-accessibility defect, unlike the plain
 * Default/exemplar case (no height cap, scrollWidth === clientWidth,
 * nothing to scroll) where the same triad would be a dead tab stop instead.
 */
export const StickyHeader: Story = {
  render: () =>
    SkDataTableStickyHeaderHTML.replace(
      'class="sk-data-table__scroller"',
      'class="sk-data-table__scroller" role="region" aria-label="Recent builds, long list" tabindex="0" style="max-height: 240px;"',
    ),
};

/**
 * SC-003: at a narrow width, the scroller is a labelled, keyboard-reachable
 * region (role="region" + aria-label + tabindex="0") wrapping an INTACT
 * table -- same <th scope> usage and cell structure as Default. Block-reflow
 * of cells is explicitly rejected; nothing about the wrapper changes the
 * table's internal structure. The max-width forcing the narrow condition is
 * applied HERE, at story render time, for the same reason as StickyHeader's
 * max-height above -- the authored exemplar itself carries no hardcoded cap.
 */
export const NarrowScrollable: Story = {
  render: () => `<div style="max-width: 320px;">${SkDataTableNarrowScrollableHTML}</div>`,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkDataTableDefaultHTML}
    </div>
  `,
};
