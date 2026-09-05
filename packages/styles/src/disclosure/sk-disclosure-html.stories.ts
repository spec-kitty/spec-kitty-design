import './sk-disclosure.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkDisclosureClosedHTML,
  SkDisclosureOpenHTML,
  SkDisclosureLongBodyHTML,
  SkDisclosureNestedHTML,
} from './index';

const meta: Meta = {
  title: 'Primitives/SkDisclosure (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  name: 'Closed (default)',
  render: () => SkDisclosureClosedHTML,
};

export const Open: Story = {
  render: () => SkDisclosureOpenHTML,
};

export const LongBody: Story = {
  render: () => SkDisclosureLongBodyHTML,
};

/**
 * The outer disclosure is open; the inner (nested) disclosure is closed.
 *
 * This proves the `[open]` marker rule uses a CHILD combinator
 * (`.sk-disclosure[open] > .sk-disclosure__summary::before`), not a
 * descendant combinator. A descendant-combinator selector would ALSO match
 * the inner, still-closed disclosure's summary — because `[open] .foo`
 * matches any `.foo` anywhere inside an open ancestor — and both markers
 * would render as "open" even though only the outer one is.
 */
export const Nested: Story = {
  render: () => SkDisclosureNestedHTML,
};

/**
 * Forced-colors visual baseline (SC-005). The marker is a `content`-drawn
 * glyph (`::before { content: '▸' }`), never a background-drawn icon, and
 * `forced-color-adjust` is left at its default `auto` everywhere in this
 * file. Under `forced-colors: active` (Chromium devtools: "Emulate CSS
 * media feature forced-colors", or Windows High Contrast), the browser
 * automatically recolors the marker glyph to the `CanvasText` system color
 * in both the dark and light High Contrast schemes — measured with
 * Playwright's `page.emulateMedia({ forcedColors: 'active' })` against both
 * `colorScheme: 'dark'` and `colorScheme: 'light'`; see this mission's
 * verification notes for the exact computed colors observed.
 */
export const ForcedColorsBaseline: Story = {
  render: () => SkDisclosureOpenHTML,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkDisclosureClosedHTML}
    </div>
  `,
};
