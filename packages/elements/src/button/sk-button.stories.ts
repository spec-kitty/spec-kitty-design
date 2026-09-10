import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-button.js';

/**
 * <sk-button> — #79's primitives batch.
 *
 * Set `href` and it renders an anchor; omit it and you get a button. Both carry the same
 * classes, because the catalogue already needs both: every use of this primitive in the demo
 * pages is a link styled as a button, while the stories use a real button.
 */
const meta: Meta = {
  title: 'Elements/SkButton',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
  render: () => '<sk-button variant="primary">Primary</sk-button>',
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {};
export const Secondary: Story = { render: () => '<sk-button variant="secondary">Secondary</sk-button>' };
export const Ghost: Story = { render: () => '<sk-button variant="ghost">Ghost</sk-button>' };

/** Size is an axis, independent of tone. */
export const Small: Story = {
  render: () => `
    <div style="display:flex; gap:var(--sk-space-4); align-items:center;">
      <sk-button variant="primary" size="sm">Small primary</sk-button>
      <sk-button variant="secondary" size="sm">Small secondary</sk-button>
    </div>
  `,
};

/** With `href` the element renders a real anchor — it navigates, and assistive technology
 *  announces a link rather than a button. */
export const AsLink: Story = {
  render: () => '<sk-button variant="primary" href="#posts">Read the posts</sk-button>',
};

export const Disabled: Story = {
  render: () => '<sk-button variant="primary" disabled>Disabled</sk-button>',
};

/** The accessible name reaches the real button; the consumer supplies the glyph. */
export const Icon: Story = {
  render: () =>
    '<sk-button variant="primary" size="icon" label="Notifications"><span aria-hidden="true">●</span></sk-button>',
};

/** Icon sizing composes with the native anchor branch. */
export const IconLink: Story = {
  render: () =>
    '<sk-button variant="ghost" size="icon" label="Open settings" href="#settings"><span aria-hidden="true">★</span></sk-button>',
};

/** Focus the host to preview the delegated focus-visible treatment on the real control. */
export const IconFocus: Story = {
  render: () =>
    '<sk-button variant="secondary" size="icon" label="Focus preview"><span aria-hidden="true">+</span></sk-button>',
};

/**
 * Busy (#305): a decorative, non-flow-participating activity cue, per tone. The accessible
 * name is unchanged from the idle `Primary`/`Secondary`/`Ghost` stories above — compare them
 * side by side rather than adding a redundant "Idle" story here.
 */
export const Busy: Story = {
  render: () => `
    <div style="display:flex; gap:var(--sk-space-4); align-items:center; flex-wrap:wrap;">
      <sk-button variant="primary" busy>Saving</sk-button>
      <sk-button variant="secondary" busy>Saving</sk-button>
      <sk-button variant="ghost" busy>Saving</sk-button>
      <sk-button busy>Saving</sk-button>
    </div>
  `,
};

/** The busy axis at `size="sm"` — the smaller cue/inset variant in `sk-button.css`. */
export const BusySmall: Story = {
  render: () => '<sk-button variant="primary" size="sm" busy>Saving</sk-button>',
};

/** The busy axis at `size="icon"` — the tightest box the cue must fit (#305's FR-001). */
export const BusyIcon: Story = {
  render: () =>
    '<sk-button variant="primary" size="icon" label="Sending invitation" busy><span aria-hidden="true">✉</span></sk-button>',
};

/** `busy` + native `disabled` (User Story 2): the existing dimmed/not-allowed treatment
 *  applies unchanged, the cue is still visible, and the control leaves the tab order — all per
 *  platform default, none of it owned by this mission. */
export const BusyDisabled: Story = {
  render: () => '<sk-button variant="primary" busy disabled>Saving</sk-button>',
};

/** `busy` + focusable `aria-disabled="true"` (User Story 2): no CSS this mission adds dims the
 *  button, the cue is still visible, and the control remains focusable and in the tab order —
 *  the shape Team Kitty SaaS #1520's double-submit prevention relies on. */
export const BusyAriaDisabled: Story = {
  render: () => '<sk-button variant="primary" busy aria-disabled="true">Saving</sk-button>',
};

export const AllVariants: Story = {
  render: () => `
    <div style="display:flex; gap:var(--sk-space-4); align-items:center; flex-wrap:wrap;">
      <sk-button variant="primary">Primary</sk-button>
      <sk-button variant="secondary">Secondary</sk-button>
      <sk-button variant="ghost">Ghost</sk-button>
      <sk-button variant="primary" href="#">Link</sk-button>
    </div>
  `,
};

/** `class="sk-light"`, not `data-theme="light"` — the attribute form activates nothing (#93). */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display:flex; gap:var(--sk-space-4); flex-wrap:wrap;">
      <sk-button variant="primary">Primary</sk-button>
      <sk-button variant="secondary">Secondary</sk-button>
      <sk-button variant="ghost">Ghost</sk-button>
      <sk-button variant="primary" size="icon" label="Notifications"><span aria-hidden="true">●</span></sk-button>
      <sk-button variant="ghost" size="icon" label="Open settings" href="#settings"><span aria-hidden="true">★</span></sk-button>
      <sk-button variant="primary" busy>Saving</sk-button>
    </div>
  `,
};
