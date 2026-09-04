import './sk-site-footer.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import { SkSiteFooterHTML } from './index';

/**
 * <sk-site-footer> — the STATIC form, generated from the element's markup module (ADR-10 §3).
 *
 * This file used to import a hand-written `index.ts` that built the markup inline and computed
 * `new Date().getFullYear()` at module load. Both are gone: the markup is authored once in
 * `packages/elements/src/site-footer/sk-site-footer.markup.ts`, and the year is a pinned
 * placeholder because a generated artifact whose bytes depend on the wall clock stops matching a
 * fresh generation on 1 January (ADR-11 item 9).
 */
const meta: Meta = {
  title: 'Components/SiteFooter (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => SkSiteFooterHTML };

/**
 * `class="sk-light"`, NOT `data-theme="light"`.
 *
 * The attribute form activates nothing: tokens anchor light on
 * `:root[data-theme="light"], .sk-light`, and `:root` matches only `<html>` (#93). This story
 * carried the inert form, so it had been rendering the DARK palette on a light background and
 * the a11y gate never saw the light pairing. Retiring the same wrapper exposed four failing
 * pill-tag variants and a 1.73:1 check-bullet tick in the two preceding batches — measured here
 * before assuming otherwise, and this component's inks pass because it uses semantic `--sk-fg-*`
 * tokens rather than raw `--sk-color-*` palette values.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, layout: 'fullscreen' },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); display: block; width: 100%; padding: 0 var(--sk-space-7);">
      ${SkSiteFooterHTML}
    </div>
  `,
};
