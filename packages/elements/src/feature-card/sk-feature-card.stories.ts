import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-feature-card.js';

/**
 * <sk-feature-card> — #78's cards batch.
 *
 * `accent` colours the icon chip, `variant` colours the card's border, and they are
 * independent: a card may have either, both or neither. The icon, title and body are slotted,
 * because they are the consuming page's content — the same rule #77 applied to sk-section-banner
 * after its three generated exports were found carrying hardcoded version strings.
 */
const CLOCK =
  '<svg slot="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';

const card = (attrs: string, title: string, body: string) =>
  `<sk-feature-card ${attrs}>${CLOCK}<h4 class="sk-feature-card__title">${title}</h4><p class="sk-feature-card__body">${body}</p></sk-feature-card>`;

const meta: Meta = {
  title: 'Elements/SkFeatureCard',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => card('', 'Stay in flow', 'Spec Kitty keeps context in one place.'),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Yellow: Story = { render: () => card('accent="yellow"', 'Stay in flow', 'The default accent.') };
export const Green: Story = { render: () => card('accent="green"', 'Context stays put', 'Decisions live with the feature.') };
export const Purple: Story = { render: () => card('accent="purple"', 'Review with confidence', 'Every PR comes with a spec.') };

/**
 * The border variants, each paired with its matching accent.
 *
 * The PAIRING is a demo choice and lives here, not in the component: `variant` and `accent` are
 * independent axes, and the generated static exports show them that way. Until #78 the
 * generated `SkFeatureCardBorderGreenHTML` hardcoded the pairing, which made a presentation
 * decision part of the published artifact.
 */
export const BorderedVariants: Story = {
  render: () => `
    <div style="display:grid; gap:var(--sk-space-4); grid-template-columns:repeat(3, 1fr);">
      ${card('variant="border-yellow" accent="yellow"', 'Primary', 'Yellow border, yellow chip.')}
      ${card('variant="border-green" accent="green"', 'Verified', 'Green border, green chip.')}
      ${card('variant="border-purple" accent="purple"', 'Preview', 'Purple border, purple chip.')}
    </div>
  `,
};

/** The axes are independent — a green chip in a purple-bordered card is legal and supported. */
export const MixedAxes: Story = {
  render: () => card('variant="border-purple" accent="green"', 'Independent axes', 'Purple border, green chip.'),
};

/**
 * `class="sk-light"`, not `data-theme="light"` — `:root` only ever matches <html>, so the
 * attribute form on a wrapping div activates nothing (#93). `check-story-theme-wrapper.mjs`
 * now fails on the attribute form anywhere in `packages/**`.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:grid; gap:var(--sk-space-4); grid-template-columns:repeat(3, 1fr);">
      ${card('accent="yellow"', 'Stay in flow', 'Yellow accent on the light surface.')}
      ${card('accent="green"', 'Context stays put', 'Green accent on the light surface.')}
      ${card('accent="purple"', 'Review with confidence', 'Purple accent on the light surface.')}
    </div>
  `,
};
