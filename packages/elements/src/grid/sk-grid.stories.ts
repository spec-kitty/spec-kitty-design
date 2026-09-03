import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-grid.js';
import '../card/sk-card.js';

/**
 * <sk-grid> — the layout primitive as a custom element (#77).
 *
 * Column count and gap are ATTRIBUTES here (`variant="cols-3"`, `gap="6"`), not the BEM
 * classes the static layer uses. Both come from the same authored markup module, so the
 * class list cannot drift between the two consumption paths.
 */
const items = (n: number) =>
  Array.from({ length: n }, (_, i) => `<sk-card><p>Card ${i + 1}</p></sk-card>`).join('\n      ');

const meta: Meta = {
  title: 'Elements/SkGrid',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => `<sk-grid style="max-width: 640px;">\n      ${items(3)}\n    </sk-grid>`,
};

export default meta;
type Story = StoryObj;

/** Single column — no `variant`. */
export const Default: Story = {};

export const TwoColumn: Story = {
  render: () => `<sk-grid variant="cols-2" style="max-width: 640px;">\n      ${items(4)}\n    </sk-grid>`,
};

export const ThreeColumn: Story = {
  render: () => `<sk-grid variant="cols-3" style="max-width: 960px;">\n      ${items(3)}\n    </sk-grid>`,
};

export const FourColumn: Story = {
  render: () => `<sk-grid variant="cols-4" style="max-width: 1200px;">\n      ${items(4)}\n    </sk-grid>`,
};

/** The gap axis is independent of the column count. */
export const WideGap: Story = {
  render: () => `<sk-grid variant="cols-3" gap="6" style="max-width: 960px;">\n      ${items(3)}\n    </sk-grid>`,
};

/**
 * Column collapse at 720 px is this element's only runtime behaviour. Resize the canvas
 * below 720 px to observe it.
 */
export const Responsive: Story = {
  render: () => `<sk-grid variant="cols-3" gap="6">\n      ${items(3)}\n    </sk-grid>`,
};

/**
 * `class="sk-light"`, not `data-theme="light"` — the token package anchors its light block on
 * `:root[data-theme="light"], .sk-light`, and `:root` only ever matches <html>, so the
 * attribute on a wrapping div activates nothing (#93). The styles-layer grid story carried
 * exactly that inert form until this mission.
 *
 * sk-grid itself declares no colour, so what this story verifies is that the grid does not
 * BLOCK theming of its children: the cards inside must pick the light palette up through the
 * grid's shadow boundary. Asserted in fixtures/elements-behaviour/src/sk-grid.test.ts.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6);">
      <sk-grid variant="cols-3" gap="4">
        <sk-card variant="blue"><p>Information</p></sk-card>
        <sk-card variant="purple"><p>Architecture</p></sk-card>
        <sk-card><p>Default</p></sk-card>
      </sk-grid>
    </div>
  `,
};
