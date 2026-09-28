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
 * forced-colors mode unaided; the background-based zebra treatment does not.
 * NORMAL-mode hover is `filter: brightness()` on the row (not a border --
 * see sk-data-table.css for why). The forced-colors substitute for BOTH zebra
 * and hover is a `border-left` accent on the row's first CELL (never the
 * `<tr>` -- inert under the sticky-header's `border-collapse: separate`),
 * with an explicit `Canvas` baseline (not `transparent`, which Chromium
 * force-recolours under forced-colors instead of preserving) overridden to
 * `CanvasText` (zebra) / `Highlight` (hover) via the LONGHAND
 * `border-left-color`, which is what the stylelint gate actually certifies.
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
 *
 * The injection FAILS LOUDLY if the expected attribute is missing from the
 * generated markup, rather than silently rendering the unmodified original --
 * a bare `String.replace` with no verification was measured to do exactly
 * that on a no-match (no max-height, no stickiness demonstrated, no
 * overflow, no scrollable-region-focusable finding -- every gate green over
 * nothing being tested).
 */
const STICKY_HEADER_SCROLLER_CLASS = 'class="sk-data-table__scroller"';
const STICKY_HEADER_SCROLLER_REPLACEMENT =
  'class="sk-data-table__scroller" role="region" aria-label="Recent builds, long list" tabindex="0" style="max-height: 240px;"';

function renderStickyHeader(): string {
  if (!SkDataTableStickyHeaderHTML.includes(STICKY_HEADER_SCROLLER_CLASS)) {
    throw new Error(
      'sk-data-table StickyHeader story: expected marker ' +
        JSON.stringify(STICKY_HEADER_SCROLLER_CLASS) +
        ' not found in SkDataTableStickyHeaderHTML -- the injected max-height/role/' +
        'aria-label/tabindex would have silently been dropped. Update this story ' +
        "alongside sk-data-table-sticky-header.html's markup.",
    );
  }
  return SkDataTableStickyHeaderHTML.replace(STICKY_HEADER_SCROLLER_CLASS, STICKY_HEADER_SCROLLER_REPLACEMENT);
}

export const StickyHeader: Story = {
  render: renderStickyHeader,
};

/**
 * SC-003: at a narrow width, the scroller is a labelled, keyboard-reachable
 * region (role="region" + aria-label + tabindex="0") wrapping an INTACT
 * table -- same <th scope> usage and cell structure as Default. Block-reflow
 * of cells is explicitly rejected; nothing about the wrapper changes the
 * table's internal structure. Unlike StickyHeader's max-height, the
 * max-width here is baked directly into the authored exemplar (not applied
 * at story render time) -- narrowness is this exemplar's entire subject, not
 * an optional demo aid, so a consumer copying it should get the same narrow
 * behaviour, not a wide table that happens to only look narrow inside this
 * story.
 */
export const NarrowScrollable: Story = {
  render: () => SkDataTableNarrowScrollableHTML,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkDataTableDefaultHTML}
    </div>
  `,
};
