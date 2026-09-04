import './sk-feature-card.css';
// LightMode below carries `class="sk-light"`, not `data-theme="light"`. The attribute form
// activates nothing — the token package anchors light on `:root[data-theme="light"], .sk-light`
// and `:root` only ever matches <html> — so this story had been rendering the DARK palette on a
// light ground with every gate green (#93). #78 retires it and lowers the count in
// expected-inert-theme-wrappers.json in the same commit, which that ratchet requires.
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkFeatureCardYellowHTML,
  SkFeatureCardGreenHTML,
  SkFeatureCardPurpleHTML,
  SkFeatureCardBorderYellowHTML,
  SkFeatureCardBorderGreenHTML,
  SkFeatureCardBorderPurpleHTML,
} from './index';

/**
 * Swaps the generated placeholder copy for this catalogue's own.
 *
 * The generated exports carry structural placeholder text, because the copy is the consuming
 * page's rather than the component's — the rule #77 established when sk-section-banner's three
 * exports were found carrying hardcoded version strings. The strings below are the ones this
 * catalogue has always shown, kept verbatim so `visual.spec.ts`'s committed baseline still
 * measures STYLING rather than a copy change.
 *
 * THROWS when the marker is absent, because `String.replace` with a string pattern returns its
 * input unchanged on no match.
 */
const MARKER =
  '<h4 class="sk-feature-card__title">Feature title</h4>' +
  '<p class="sk-feature-card__body">What this feature does for the reader.</p>';

const fill = (markup: string, title: string, body: string) => {
  if (!markup.includes(MARKER)) {
    throw new Error(
      `sk-feature-card story: generated markup no longer contains the placeholder copy — ` +
        `fill() would have silently returned it unchanged. Update MARKER alongside ` +
        `featureCardStaticHtml()'s default content.`,
    );
  }
  return markup.replace(
    MARKER,
    `<h4 class="sk-feature-card__title">${title}</h4><p class="sk-feature-card__body">${body}</p>`,
  );
};

const FLOW = ['Stay in flow', 'When requirements are scattered across meetings, tickets, and chat — Spec Kitty keeps context in one place.'] as const;
const CONTEXT = ['Context stays put', 'Decisions, alternatives, and rationale live with the feature itself — never lost in a thread.'] as const;
const REVIEW = ['Review with confidence', 'Every PR comes with a spec reviewers can check against — no guessing what done looks like.'] as const;

const meta: Meta = {
  title: 'Components/SkFeatureCard (HTML)',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'Static feature-card primitive. The component is non-interactive (no Hover/Focus/Active/Disabled states); colour intent is driven by icon-chip and border modifiers.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default feature card with yellow icon chip — closes #10 acceptance for FeatureCard styled output.',
      },
    },
  },
  render: () => fill(SkFeatureCardYellowHTML, ...FLOW),
};

export const GreenIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Feature card with green icon-chip tint — used to flag stable / verified feature copy.',
      },
    },
  },
  render: () => fill(SkFeatureCardGreenHTML, ...CONTEXT),
};

export const PurpleIcon: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Feature card with purple icon-chip tint — used to flag evolution / preview feature copy.',
      },
    },
  },
  render: () => fill(SkFeatureCardPurpleHTML, ...REVIEW),
};

export const ColorizedBorders: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Three side-by-side feature cards demonstrating the colorized-border treatment requested by issue #10. Each card uses an existing solid colour token (--sk-color-yellow / --sk-color-green / --sk-color-purple) on the border edge; the rgba() icon-chip tints are intentionally untouched (out-of-mission scope).',
      },
    },
  },
  render: () => `
    <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:var(--sk-space-4);max-width:900px;">
      ${fill(SkFeatureCardBorderYellowHTML, 'Stay in flow', 'Yellow-bordered card variant — emphasises a primary feature against the surrounding neutral catalog.')}
      ${fill(SkFeatureCardBorderGreenHTML, 'Context stays put', 'Green-bordered card variant — flags a stable / verified feature in the catalog.')}
      ${fill(SkFeatureCardBorderPurpleHTML, 'Review with confidence', 'Purple-bordered card variant — earmarks an evolution / preview feature in the catalog.')}
    </div>
  `,
};

export const Grid: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Two-column grid of the three default icon-chip variants — matches the reference layout for the catalog landing.',
      },
    },
  },
  render: () => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sk-space-4);max-width:600px;">
    ${fill(SkFeatureCardYellowHTML, ...FLOW)}
    ${fill(SkFeatureCardGreenHTML, ...CONTEXT)}
    ${fill(SkFeatureCardPurpleHTML, ...REVIEW)}
  </div>`,
};

export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'sk-light' },
    docs: {
      description: {
        story:
          'Light-mode surface variant — the colorized-border trio rendered against the light page surface for cross-theme verification.',
      },
    },
  },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:var(--sk-space-4);max-width:900px;">
        ${fill(SkFeatureCardBorderYellowHTML, 'Stay in flow', 'Yellow-bordered card variant — emphasises a primary feature against the surrounding neutral catalog.')}
        ${fill(SkFeatureCardBorderGreenHTML, 'Context stays put', 'Green-bordered card variant — flags a stable / verified feature in the catalog.')}
        ${fill(SkFeatureCardBorderPurpleHTML, 'Review with confidence', 'Purple-bordered card variant — earmarks an evolution / preview feature in the catalog.')}
      </div>
    </div>
  `,
};
