import './sk-grid.css';
import '../card/sk-card.css';
import { SkCardHTML } from '../card';
import { SkGridHTML, SkGridCols2HTML, SkGridCols3HTML, SkGridCols4HTML, SkGridGap6HTML } from './index';
import type { Meta, StoryObj } from '@storybook/web-components';

/**
 * Renders from the GENERATED exports, not from hand-written markup.
 *
 * Until #77 this file held six `<div class="sk-grid sk-grid--cols-N">` literals and its own
 * docstring correctly identified the equivalent card problem one directory over. Grid now has
 * an authored markup module, so the same rule binds here: structure comes from the generated
 * constant, and these stories add only the presentation a demo needs.
 *
 * `fill()` THROWS when its marker is absent, for the reason wrap() does in the card stories:
 * `String.replace` with a string pattern returns its input UNCHANGED on no match, so renaming
 * `gridStaticHtml`'s default content would silently produce empty grids in every story with no
 * error. A screenshot of an empty grid and a screenshot of a correct one differ; axe's report
 * on them does not.
 */
// The generated grid's placeholder children, as one literal. `gridStaticHtml` defaults to
// three `<div>Grid item N</div>` children so the committed `.html` demonstrates the layout it
// documents (ADR-10 §3's no-JavaScript consumer); the stories swap them for cards.
const GRID_MARKER = '<div>Grid item 1</div><div>Grid item 2</div><div>Grid item 3</div>';
const CARD_MARKER = '>Card content<';

const card = (n: number) => {
  if (!SkCardHTML.includes(CARD_MARKER)) {
    throw new Error(
      `sk-grid story: SkCardHTML no longer contains ${JSON.stringify(CARD_MARKER)} — the ` +
        `replace below would have returned it unchanged. Update the marker alongside ` +
        `cardStaticHtml()'s default content.`,
    );
  }
  return SkCardHTML.replace(
    CARD_MARKER,
    ` style="padding: var(--sk-space-5);"><p style="color: var(--sk-fg-muted); margin: 0; font-size: var(--sk-text-sm);">Card ${n}</p><`,
  );
};

/**
 * Swaps the generated placeholder children for cards, and wraps for width.
 *
 * The width goes on an OUTER div rather than being injected into the generated element's own
 * attributes: the story adds presentation around the component, never inside its markup, so
 * nothing here can drift from what the generator emits.
 *
 * THROWS when the marker is absent, because `String.replace` with a string pattern returns its
 * input UNCHANGED on no match — renaming `gridStaticHtml`'s default content would otherwise
 * render every story with three grey placeholder divs and no error. It has already fired once,
 * for exactly that reason, when #77's gate fold changed the default from a text node.
 */
const fill = (markup: string, count: number, style = '') => {
  if (!markup.includes(GRID_MARKER)) {
    throw new Error(
      `sk-grid story: generated markup no longer contains the placeholder children ` +
        `${JSON.stringify(GRID_MARKER)} — fill() would have silently returned it unchanged. ` +
        `Update GRID_MARKER alongside gridStaticHtml()'s default content.`,
    );
  }
  const children = Array.from({ length: count }, (_, i) => card(i + 1)).join('\n  ');
  const grid = markup.replace(GRID_MARKER, `\n  ${children}\n`);
  return style ? `<div style="${style}">${grid}</div>` : grid;
};

const meta: Meta = {
  title: 'Components/SkGrid',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

/**
 * Single-column layout (no column modifier). sk-grid is a presentational primitive with no
 * interactive states — column collapsing at 720 px is its only runtime behaviour, and the
 * Responsive story demonstrates it.
 */
export const Default: Story = {
  render: () => fill(SkGridHTML, 3, 'max-width: 640px;'),
};

/** Two equal columns via `.sk-grid--cols-2`. Collapses to single column below 720 px. */
export const TwoColumn: Story = {
  render: () => fill(SkGridCols2HTML, 4, 'max-width: 640px;'),
};

/** Three equal columns via `.sk-grid--cols-3`. Collapses to single column below 720 px. */
export const ThreeColumn: Story = {
  render: () => fill(SkGridCols3HTML, 3, 'max-width: 960px;'),
};

/** Four equal columns via `.sk-grid--cols-4`. Collapses to single column below 720 px. */
export const FourColumn: Story = {
  render: () => fill(SkGridCols4HTML, 4, 'max-width: 1200px;'),
};

/**
 * The gap axis, independent of the column count. Resize the canvas below 720 px to see the
 * collapse; the breakpoint matches sk-nav-pill's hamburger boundary.
 */
export const Responsive: Story = {
  render: () => fill(SkGridGap6HTML, 3),
};

/**
 * `class="sk-light"`, NOT `data-theme="light"`.
 *
 * This story carried the attribute form until #77. The token package anchors its light block
 * on `:root[data-theme="light"], .sk-light`, and `:root` only ever matches <html> — so the
 * attribute on a wrapping div activated nothing and this story rendered the DARK palette on a
 * light background, with no error and no failing gate (#93).
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block; width: 100%;">
      ${fill(SkGridCols3HTML, 3)}
    </div>
  `,
};
