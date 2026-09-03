import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-nav-pill.js';

/**
 * <sk-nav-pill> — the behaviour element.
 *
 * The items are authored ONCE. Below 720px the same container becomes the panel, which is
 * why there is no second copy of the links here: `packages/styles/src/nav-pill`'s own story
 * and `apps/demo/dashboard-demo.html` both carried the nav twice, once for the row and once
 * for the drawer, and that duplication is what this element removes.
 */
const meta: Meta = {
  title: 'Elements/SkNavPill',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};
export default meta;
type Story = StoryObj;

const items = `
  <a href="#" class="sk-nav-pill__item">Platform</a>
  <a href="#" class="sk-nav-pill__item sk-nav-pill__item--active" aria-current="page">Getting Started</a>
  <a href="#" class="sk-nav-pill__item">About</a>
  <a href="#" class="sk-nav-pill__item">Blog</a>`;

export const Default: Story = {
  render: () => `<sk-nav-pill label="Primary navigation">${items}</sk-nav-pill>`,
};

/**
 * The collapsed panel, rendered ALREADY OPEN.
 *
 * Open on load, not opened by a play function. The axe gate treats a story that paints
 * nothing until interaction as an UNRENDERED story rather than a passing one — and a
 * component whose only story is the closed state has had one of its two states tested.
 * This is the story that makes NFR-003 mean something.
 */
export const Open: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'The panel open at a mobile width. The `open` attribute is the reflected form of ' +
          'the `isOpen` property; `open()`, `close()` and `toggle()` are the public methods. ' +
          'Escape closes and returns focus to whatever control opened it.',
      },
    },
  },
  render: () => `<sk-nav-pill open label="Primary navigation">${items}</sk-nav-pill>`,
};
