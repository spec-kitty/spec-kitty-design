import './sk-pill-tag.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkPillTagHTML,
  SkPillTagGreenHTML,
  SkPillTagPurpleHTML,
  SkPillTagBreakingHTML,
  SkPillTagYellowHTML,
  SkPillTagEyebrowHTML,
} from './index';

/**
 * Renders from the GENERATED exports (ADR-10 §3).
 *
 * Until #79 this file imported `SkTagHTML(label, variant)` and `SkEyebrowPillHTML(label)` —
 * hand-written builder FUNCTIONS in the styles layer, over two class families that shared a
 * directory. The markup is now authored once in
 * `packages/elements/src/pill-tag/sk-pill-tag.markup.ts` and generated from there, and the
 * eyebrow is a shape modifier of the same component rather than a second one.
 *
 * `label()` THROWS when the marker is absent, because `String.replace` with a string pattern
 * returns its input UNCHANGED on no match — renaming the placeholder would otherwise render
 * every tag as "Label" with no error.
 */
const MARKER = '>Label<';

const label = (markup: string, text: string) => {
  if (!markup.includes(MARKER)) {
    throw new Error(
      `sk-pill-tag story: generated markup no longer contains ${JSON.stringify(MARKER)} — ` +
        `label() would have silently returned it unchanged. Update MARKER alongside ` +
        `pillTagStaticHtml()'s default content.`,
    );
  }
  return markup.replace(MARKER, `>${text}<`);
};

const meta: Meta = {
  title: 'Primitives/SkPillTag',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Static label primitive. Colour is the `variant` axis and size is the `shape` axis, so a tinted eyebrow is expressible. Non-interactive: no Hover/Focus/Active/Disabled states; the colour variant IS the state.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => label(SkPillTagHTML, 'v1.0.0') };
export const Green: Story = { render: () => label(SkPillTagGreenHTML, 'SemVer') };
export const Purple: Story = { render: () => label(SkPillTagPurpleHTML, 'Skills Pack') };
export const Breaking: Story = { render: () => label(SkPillTagBreakingHTML, 'Breaking') };
export const Yellow: Story = { render: () => label(SkPillTagYellowHTML, 'Schema Gate') };

export const AllVariants: Story = {
  render: () => `
    <div style="display:flex; gap:var(--sk-space-3); align-items:center; flex-wrap:wrap;">
      ${label(SkPillTagHTML, 'v1.0.0')}
      ${label(SkPillTagBreakingHTML, 'Breaking')}
      ${label(SkPillTagGreenHTML, 'SemVer')}
      ${label(SkPillTagPurpleHTML, 'Skills Pack')}
      ${label(SkPillTagYellowHTML, 'Schema Gate')}
    </div>
  `,
};

/**
 * The eyebrow shape — larger, square-cornered, used as a lead-in above a headline.
 *
 * It was `.sk-eyebrow-pill`, a standalone class in this component's own stylesheet that
 * restated the base rule almost verbatim. #79 folded it into `--eyebrow`, so it now composes
 * with the colour variants rather than duplicating the base.
 */
export const Eyebrow: Story = {
  render: () => `
    <div style="display:flex; flex-direction:column; gap:var(--sk-space-3); align-items:flex-start;">
      ${label(SkPillTagEyebrowHTML, 'For software teams adopting agentic coding')}
      ${label(SkPillTagEyebrowHTML, 'Open-source CLI quickstart')}
    </div>
  `,
};

/** `class="sk-light"`, NOT `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:flex; gap:var(--sk-space-3); flex-wrap:wrap;">
      ${label(SkPillTagHTML, 'v1.0.0')}
      ${label(SkPillTagGreenHTML, 'SemVer')}
      ${label(SkPillTagPurpleHTML, 'Skills Pack')}
      ${label(SkPillTagYellowHTML, 'Schema Gate')}
    </div>
  `,
};
