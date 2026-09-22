import './sk-section-banner.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkSectionBannerNeutralHTML,
  SkSectionBannerPurpleHTML,
  SkSectionBannerGreenHTML,
} from './index';

/**
 * Renders from the GENERATED exports (ADR-10 §3).
 *
 * Until #77 those exports each carried a hardcoded version string — `VERSION 1.X — FIRST
 * STABLE RELEASE` and two more — so a docsite's content lived inside the component library and
 * changing a version number meant editing a component. The exports now carry a placeholder
 * label and the content lives here, in the story.
 *
 * `label()` THROWS when the marker is absent, for the reason the card and grid stories do:
 * `String.replace` with a string pattern returns its input UNCHANGED on no match, so renaming
 * the default content would silently render every banner as "Section label" with no error.
 */
const MARKER = '>Section label<';
const label = (markup: string, text: string) => {
  if (!markup.includes(MARKER)) {
    throw new Error(
      `sk-section-banner story: generated markup no longer contains ${JSON.stringify(MARKER)} — ` +
        `label() would have silently returned it unchanged. Update the marker alongside ` +
        `sectionBannerStaticHtml()'s default content.`,
    );
  }
  return markup.replace(MARKER, `>${text}<`);
};

const NEUTRAL = 'VERSION 1.X — FIRST STABLE RELEASE';
const PURPLE = 'VERSION 2.X — EVENT ARCHITECTURE &amp; SKILLS';
const GREEN = 'VERSION 3.X — STABLE RELEASE';

const all = () => `
  <div style="display:flex;flex-direction:column;gap:var(--sk-space-3);align-items:flex-start;">
    ${label(SkSectionBannerNeutralHTML, NEUTRAL)}
    ${label(SkSectionBannerPurpleHTML, PURPLE)}
    ${label(SkSectionBannerGreenHTML, GREEN)}
  </div>`;

const meta: Meta = {
  title: 'Primitives/SkSectionBanner (HTML)',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Static section-banner primitive — a mono-cap label used to delineate version/section blocks. Non-interactive: no Hover/Focus/Active/Disabled states; the colour variant IS the state.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Default neutral section banner.' } },
  },
  render: () => label(SkSectionBannerNeutralHTML, NEUTRAL),
};

export const Neutral: Story = {
  parameters: {
    docs: { description: { story: 'Neutral variant — marks a stable / current version block.' } },
  },
  render: () => label(SkSectionBannerNeutralHTML, NEUTRAL),
};

export const Purple: Story = {
  parameters: {
    docs: { description: { story: 'Purple variant — flags the v2.x evolution / event-architecture block.' } },
  },
  render: () => label(SkSectionBannerPurpleHTML, PURPLE),
};

export const Green: Story = {
  parameters: {
    docs: { description: { story: 'Green variant — flags the v3.x stable-release block.' } },
  },
  render: () => label(SkSectionBannerGreenHTML, GREEN),
};

export const AllVariants: Story = {
  parameters: {
    docs: { description: { story: 'Every colour variant rendered stacked — the catalog-completeness reference for section-banner styling.' } },
  },
  render: all,
};

/**
 * `class="sk-light"`, NOT `data-theme="light"`.
 *
 * This story carried the attribute form until #77, which activates nothing: the token package
 * anchors its light block on `:root[data-theme="light"], .sk-light` and `:root` only ever
 * matches <html>, so it had been rendering the dark palette on a light ground with every gate
 * green (#93).
 */
export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'sk-light' },
    docs: { description: { story: 'Every colour variant against the light page surface, for cross-theme verification.' } },
  },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: block; width: 100%;">
      ${all()}
    </div>
  `,
};
