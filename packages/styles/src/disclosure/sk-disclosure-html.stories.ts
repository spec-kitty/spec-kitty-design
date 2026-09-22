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

/**
 * Also the forced-colors visual baseline (SC-005). Measured, not asserted:
 * the recolor mechanism is NOT "content-drawn glyphs get recolored
 * automatically" -- it is that Chromium maps <summary> (like <a>) to the
 * LinkText system color intrinsically, regardless of content technique.
 * Measured rgb(255,255,0) (dark scheme) / rgb(0,0,159) (light scheme) --
 * both are LinkText, not CanvasText (white/black), via
 * page.emulateMedia({ forcedColors: 'active' }) against both
 * colorScheme: 'dark' and colorScheme: 'light'. See sk-disclosure.css's
 * file-header comment for the full explanation; this is a pointer to it,
 * not a restatement.
 */
export const Open: Story = {
  render: () => SkDisclosureOpenHTML,
};

export const LongBody: Story = {
  render: () => SkDisclosureLongBodyHTML,
};

/**
 * The outer disclosure is open; the inner (nested) disclosure is closed.
 *
 * This proves the [open] marker rule uses a CHILD combinator
 * (.sk-disclosure[open] > .sk-disclosure__summary::before), not a
 * descendant combinator. A descendant-combinator selector would ALSO match
 * the inner, still-closed disclosure's summary -- because [open] .foo
 * matches any .foo anywhere inside an open ancestor -- and both markers
 * would render as "open" even though only the outer one is.
 */
export const Nested: Story = {
  render: () => SkDisclosureNestedHTML,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkDisclosureClosedHTML}
    </div>
  `,
};
