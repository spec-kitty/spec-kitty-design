import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-stub.js';

/**
 * The one story this mission authors (C-003). Component migration is #72 and the
 * batches; this exists to prove the element renders in Storybook and that the
 * accessibility gate can assess content inside an open shadow root.
 */
const meta: Meta = {
  title: 'Elements/SkStub',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-stub></sk-stub>',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

/**
 * LightMode is required of every story by CLAUDE.md §3.
 *
 * Note the wrapper carries `class="sk-light"`, not `data-theme="light"`. The token
 * package anchors its light block on `:root[data-theme="light"], .sk-light`, and
 * `:root` only ever matches <html> — so a `data-theme` attribute on a wrapping div
 * activates nothing. That is #93, still open, and it is why the existing
 * packages/styles LightMode stories render dark.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6);">
      <sk-stub></sk-stub>
    </div>
  `,
};
