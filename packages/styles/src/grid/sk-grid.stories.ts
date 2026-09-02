import './sk-grid.css';
import '../card/sk-card.css';
import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Components/SkGrid',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

/** Placeholder card content for grid demos. */
const placeholderCard = (n: number) =>
  `<article class="sk-card" style="padding: var(--sk-space-5);">
    <p style="color: var(--sk-fg-muted); margin: 0; font-size: var(--sk-text-sm);">Card ${n}</p>
  </article>`;

const threeCards = [1, 2, 3].map(placeholderCard).join('\n  ');
const fourCards  = [1, 2, 3, 4].map(placeholderCard).join('\n  ');

/**
 * Default (single-column) layout with default gap (--sk-space-4).
 * sk-grid is a presentational layout primitive with no interactive states —
 * all behaviour is declarative CSS. Column collapsing at 720 px is the only
 * responsive behaviour and is exercised by the Responsive story.
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Single-column layout (no column modifier). sk-grid is a presentational primitive — it has no interactive states. Column collapsing at the 720 px breakpoint is the only runtime behaviour, demonstrated in the Responsive story.',
      },
    },
  },
  render: () => `<div class="sk-grid" style="max-width: 640px;">
  ${threeCards}
</div>`,
};

/** Two equal columns. Collapses to single column below 720 px. */
export const TwoColumn: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Two equal columns via `.sk-grid--cols-2`. Collapses to single column below 720 px.',
      },
    },
  },
  render: () => `<div class="sk-grid sk-grid--cols-2 sk-grid--gap-4" style="max-width: 640px;">
  ${fourCards}
</div>`,
};

/** Three equal columns. Collapses to single column below 720 px. */
export const ThreeColumn: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Three equal columns via `.sk-grid--cols-3`. Collapses to single column below 720 px.',
      },
    },
  },
  render: () => `<div class="sk-grid sk-grid--cols-3 sk-grid--gap-4" style="max-width: 960px;">
  ${threeCards}
</div>`,
};

/** Four equal columns. Collapses to single column below 720 px. */
export const FourColumn: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Four equal columns via `.sk-grid--cols-4`. Collapses to single column below 720 px.',
      },
    },
  },
  render: () => `<div class="sk-grid sk-grid--cols-4 sk-grid--gap-4" style="max-width: 1200px;">
  ${fourCards}
</div>`,
};

/**
 * Three-column layout demonstrating responsive collapse.
 * Resize the viewport below 720 px to see the grid collapse to a single column.
 */
export const Responsive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Three-column layout that collapses to a single column at 720 px. Resize the Storybook canvas below 720 px to observe the responsive behaviour. The breakpoint matches the sk-nav-pill hamburger breakpoint — the established mobile boundary for this design system.',
      },
    },
  },
  render: () => `<div class="sk-grid sk-grid--cols-3 sk-grid--gap-6">
  ${threeCards}
</div>`,
};

/** Light-mode variant: three-column grid on a warm cream background. */
export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'sk-light' },
    docs: {
      description: {
        story: 'Three-column grid rendered in light mode. Background is --sk-surface-page (warm cream).',
      },
    },
  },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block; width: 100%;">
      <div class="sk-grid sk-grid--cols-3 sk-grid--gap-4">
        ${threeCards}
      </div>
    </div>
  `,
};
