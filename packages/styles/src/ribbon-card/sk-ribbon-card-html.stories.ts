import './sk-ribbon-card.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkRibbonCardHTML,
  SkRibbonCardWithRibbonHTML,
  SkRibbonCardBorderYellowHTML,
  SkRibbonCardBorderGreenHTML,
  SkRibbonCardBorderPurpleHTML,
} from './index';

/**
 * Renders from the GENERATED exports (ADR-10 §3).
 *
 * Until #78 this file imported `skRibbonCardHTML()`, a hand-written builder in the styles
 * layer, and called it with per-story titles and bodies. The markup is now authored once in
 * `packages/elements/src/ribbon-card/sk-ribbon-card.markup.ts` and generated from there;
 * `SkRibbonCardDefaultHTML` became `SkRibbonCardHTML`, the base form, and
 * `sk-ribbon-card-plain.html` — which was that same base kept as a second static file — is
 * deleted rather than regenerated.
 *
 * The title lost its `sk-h4` class in the migration and that is deliberate: the heading is
 * slotted content in the element, so the class belongs to the consumer's markup, not to the
 * component. Inside a shadow root `.sk-h4` reaches nothing.
 *
 * `fill()` THROWS when the marker is absent, because `String.replace` with a string pattern
 * returns its input UNCHANGED on no match — renaming the placeholder would otherwise render
 * every story with "Card title" and no error.
 */
const MARKER = '<h4>Card title</h4><p>What this card is offering the reader.</p>';

const fill = (markup: string, title: string, body: string) => {
  if (!markup.includes(MARKER)) {
    throw new Error(
      `sk-ribbon-card story: generated markup no longer contains the placeholder content — ` +
        `fill() would have silently returned it unchanged. Update MARKER alongside ` +
        `ribbonCardStaticHtml()'s default content.`,
    );
  }
  return markup.replace(MARKER, `<h4 class="sk-h4">${title}</h4><p>${body}</p>`);
};

const meta: Meta = {
  title: 'Components/SkRibbonCard (HTML)',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Static ribbon-card primitive. The ribbon is optional and is absent from the markup entirely when no label is set — not an empty tab.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () =>
    fill(SkRibbonCardHTML, 'SemVer release channel', 'Production-ready releases with our standard breaking-change policy.'),
};

export const WithRibbon: Story = {
  render: () =>
    fill(SkRibbonCardWithRibbonHTML, 'Full-day rollout workshop', 'Get product, engineering and reviewers aligned in your environment.'),
};

/**
 * The bordered variants, each paired with a matching ribbon.
 *
 * The PAIRING is a demo choice and lives here: `variant` and the ribbon colour are independent
 * axes, and the generated exports show them independently. Until #78 the pairing was baked into
 * the published constants.
 */
export const BorderYellow: Story = {
  render: () => fill(SkRibbonCardBorderYellowHTML, 'Full-day rollout workshop', 'Yellow border.'),
};
export const BorderGreen: Story = {
  render: () => fill(SkRibbonCardBorderGreenHTML, 'SemVer release channel', 'Green border.'),
};
export const BorderPurple: Story = {
  render: () => fill(SkRibbonCardBorderPurpleHTML, 'Skills Pack beta', 'Purple border.'),
};

export const AllBorders: Story = {
  render: () => `
    <div style="display:grid; gap:var(--sk-space-6); grid-template-columns:repeat(3, 1fr);">
      ${fill(SkRibbonCardBorderYellowHTML, 'Primary', 'Yellow.')}
      ${fill(SkRibbonCardBorderGreenHTML, 'Stable', 'Green.')}
      ${fill(SkRibbonCardBorderPurpleHTML, 'Preview', 'Purple.')}
    </div>
  `,
};

/**
 * `class="sk-light"`, NOT `data-theme="light"`.
 *
 * The attribute form activates nothing — the token package anchors light on
 * `:root[data-theme="light"], .sk-light` and `:root` only ever matches <html> — so this story
 * had been rendering the DARK palette on a light ground with every gate green (#93). #78
 * retires it and lowers the count in expected-inert-theme-wrappers.json in the same commit.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:grid; gap:var(--sk-space-6); grid-template-columns:repeat(3, 1fr);">
      ${fill(SkRibbonCardBorderYellowHTML, 'Primary', 'Yellow border on the light surface.')}
      ${fill(SkRibbonCardBorderGreenHTML, 'Stable', 'Green border on the light surface.')}
      ${fill(SkRibbonCardBorderPurpleHTML, 'Preview', 'Purple border on the light surface.')}
    </div>
  `,
};
