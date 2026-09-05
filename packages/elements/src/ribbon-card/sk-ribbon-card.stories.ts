import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-ribbon-card.js';

/**
 * <sk-ribbon-card> — #78's cards batch.
 *
 * The ribbon's label is a property; its presence is what renders the tab. The title and body
 * are slotted, so the consumer keeps their own typography classes — inside a shadow root a
 * global utility like `sk-h4` reaches nothing, which is why the static form's `<h4 class="sk-h4">`
 * became slotted content in this migration.
 */
const card = (attrs: string, title: string, body: string) =>
  `<sk-ribbon-card ${attrs}><h4 class="sk-h4">${title}</h4><p>${body}</p></sk-ribbon-card>`;

const meta: Meta = {
  title: 'Elements/SkRibbonCard',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => card('', 'SemVer release channel', 'Production-ready releases with our standard breaking-change policy.'),
};

export default meta;
type Story = StoryObj;

/** No ribbon — and the tab is absent from the DOM entirely, not an empty coloured shape. */
export const Default: Story = {};

export const WithRibbon: Story = {
  render: () => card('ribbon="Primary"', 'Full-day rollout workshop', 'Get everyone aligned in your environment.'),
};

export const RibbonColours: Story = {
  render: () => `
    <div style="display:grid; gap:var(--sk-space-6); grid-template-columns:repeat(3, 1fr);">
      ${card('ribbon="Stable" accent="green"', 'SemVer channel', 'Green ribbon.')}
      ${card('ribbon="Preview" accent="purple"', 'Skills Pack beta', 'Purple ribbon.')}
      ${card('ribbon="Retired" accent="red"', 'Legacy channel', 'Red ribbon.')}
    </div>
  `,
};

/** The two axes are independent — the border and the ribbon need not match. */
export const BorderedVariants: Story = {
  render: () => `
    <div style="display:grid; gap:var(--sk-space-6); grid-template-columns:repeat(3, 1fr);">
      ${card('variant="border-yellow" ribbon="Primary" accent="yellow"', 'Primary', 'Matched.')}
      ${card('variant="border-green" ribbon="Stable" accent="green"', 'Stable', 'Matched.')}
      ${card('variant="border-purple" ribbon="Preview" accent="blue"', 'Preview', 'Purple border, blue ribbon.')}
    </div>
  `,
};

/** `class="sk-light"`, not `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:grid; gap:var(--sk-space-6); grid-template-columns:repeat(2, 1fr);">
      ${card('ribbon="Primary"', 'Full-day rollout workshop', 'Ribbon on the light surface.')}
      ${card('variant="border-green" ribbon="Stable" accent="green"', 'SemVer channel', 'Border and ribbon on the light surface.')}
    </div>
  `,
};
