import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, waitFor } from 'storybook/test';
import './sk-confirm-dialog.js';
import type { SkConfirmDialog } from './sk-confirm-dialog.js';

// EVERY STORY BELOW SUPPLIES REAL, NON-EMPTY STRINGS FOR ALL FOUR REQUIRED PROPS. There is no
// generated static markup module for this component (FR-016/research.md) — every story below
// renders from the element's own tag, never from hand-written static HTML.
//
// FR-001/FR-017/FR-018's warn-and-render-nothing behaviour for an OMITTED required string is
// deliberately NOT demonstrated as a Storybook story. Omitting `confirm-label` renders that
// control with zero accessible name — a genuine WCAG 4.1.2 violation this repo's axe gate
// correctly rejects, measured directly: an earlier `MissingConfirmLabel` story reported
// `component host(s) rendered nothing: button.sk-button` and never satisfied the render-wait.
// This repo has no per-story a11y opt-out (`run-axe-storybook.js` scans every story with none
// exempted), so a story that is honestly, unavoidably inaccessible cannot ship here. The
// mechanical proof stays exactly where it is authoritative — the red-first-demonstrated tests in
// `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` — rather than a visual aid that
// would fail the very gate every other story here passes.
//
// TEAM DELETION IS NEVER THE EXAMPLE (FR-014). Every destructive exemplar here is membership
// removal, leaving a team, or bearer-link revocation — never whole-Team deletion, which is
// blocked upstream on Team Kitty SaaS #1432.

const frame = (content: unknown, light = false, width = '32rem') => html`<div
  class=${light ? 'sk-light' : ''}
  style=${`box-sizing:border-box;inline-size:${width};max-inline-size:100%;min-block-size:16rem;padding:var(--sk-space-6);background:var(--sk-surface-page);color:var(--sk-fg-body);`}
>${content}</div>`;

const hostFrom = (canvasElement: HTMLElement): SkConfirmDialog =>
  canvasElement.querySelector('sk-confirm-dialog') as SkConfirmDialog;

/** Opens the dialog the way a real consumer does: `showModal()` in response to a user action. */
const openViaShowModal = async (canvasElement: HTMLElement): Promise<void> => {
  const host = hostFrom(canvasElement);
  await (host as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  host.showModal();
  await waitFor(() => {
    expect(host.shadowRoot!.querySelector('[part="dialog"]')).toHaveAttribute('open');
  });
};

const meta: Meta = {
  title: 'Elements/SkConfirmDialog',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: {
      description: {
        component:
          "A bounded, single-purpose confirmation dialog over the native <dialog>, opened via showModal(). Every visible string is consumer-supplied — there is no fallback text. Reports its outcome ('confirm' | 'cancel') through exactly one mechanism: the native close event's returnValue. Performs no mutation, request, or navigation itself.",
      },
    },
  },
  render: () =>
    frame(html`
      <sk-confirm-dialog
        dialog-title="Revoke this link?"
        message="Anyone with this link will lose access immediately. This can't be undone."
        confirm-label="Revoke link"
        cancel-label="Keep link"
        confirm-variant="primary"
      ></sk-confirm-dialog>
    `),
};

export default meta;
type Story = StoryObj;

/**
 * The dialog element present but not opened — nothing renders unexpectedly.
 *
 * ASSERTED, not eyeballed: a real defect shipped here once already. `sk-confirm-dialog.css`'s
 * root ruleset originally declared `display: flex` (plus border/background/padding/sizing) with
 * no `[open]` qualifier, which overrides the native `<dialog>` UA stylesheet's own
 * `dialog:not([open]) { display: none }` — normal-origin author CSS beats UA-origin CSS
 * regardless of specificity. The visible symptom was exactly this story: a mounted-but-never-
 * opened dialog rendering as a real, positioned, non-modal box with the full title and body
 * text, silently contradicting this doc comment. `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts`
 * is the mechanical, red-first-demonstrated proof; this `play()` is what makes THIS story catch
 * a regression too, rather than only ever being read, not run.
 */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const host = hostFrom(canvasElement);
    await (host as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const dialog = host.shadowRoot!.querySelector('[part="dialog"]') as HTMLDialogElement;
    expect(dialog).not.toHaveAttribute('open');
    expect(getComputedStyle(dialog).display).toBe('none');
    const box = dialog.getBoundingClientRect();
    expect(box.width).toBe(0);
    expect(box.height).toBe(0);
  },
};

export const OpenShortBody: Story = {
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

/**
 * A LONG BODY SCROLLS; THE ACTION GROUP NEVER DOES (FR-010).
 *
 * The dialog frame here is deliberately short (`min-block-size` on the wrapper is irrelevant —
 * the dialog itself is capped by the platform's own `max-height: calc(100% - 6em)`), so the
 * message overflows its region and scrolls while `Keep link`/`Revoke link` stay pinned and fully
 * visible.
 */
export const OpenLongScrollingBody: Story = {
  render: () =>
    frame(html`
      <sk-confirm-dialog
        dialog-title="Revoke this link?"
        message="Anyone with this link will lose access immediately, including anyone who bookmarked it, saved it in a password manager, or has it open in a browser tab right now. This can't be undone, and a new link will have a different address, so anything that currently points at the old one — a shared document, a support ticket, a saved bookmark — will need to be updated separately. If you are not sure who currently has this link, consider notifying your team before revoking it so no one is caught by surprise the next time they try to use it."
        confirm-label="Revoke link"
        cancel-label="Keep link"
        confirm-variant="primary"
      ></sk-confirm-dialog>
    `),
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

export const DifferentLengthLabels: Story = {
  render: () =>
    frame(html`
      <sk-confirm-dialog
        dialog-title="Remove this member?"
        message="They will lose access to this team immediately."
        confirm-label="Yes, remove them from the team permanently"
        cancel-label="No"
        confirm-variant="primary"
      ></sk-confirm-dialog>
    `),
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

export const WrappingTitle: Story = {
  render: () =>
    frame(html`
      <sk-confirm-dialog
        dialog-title="Are you sure you want to leave this team? You will lose access to every project it owns."
        message="You can ask to rejoin later, but an admin will need to approve it."
        confirm-label="Leave team"
        cancel-label="Stay"
        confirm-variant="primary"
      ></sk-confirm-dialog>
    `),
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

export const Default: Story = {
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

/**
 * LightMode is required of every component. The wrapper carries `class="sk-light"`, NOT
 * `data-theme="light"` — the token package anchors its light block on
 * `:root[data-theme="light"], .sk-light`, and `:root` only ever matches `<html>`, so the
 * attribute on a wrapping div activates nothing at all (#93).
 *
 * `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` asserts the surface's computed
 * background differs between the two themes, rather than trusting this story by eye.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () =>
    frame(
      html`
        <sk-confirm-dialog
          dialog-title="Revoke this link?"
          message="Anyone with this link will lose access immediately. This can't be undone."
          confirm-label="Revoke link"
          cancel-label="Keep link"
          confirm-variant="primary"
        ></sk-confirm-dialog>
      `,
      true,
    ),
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

/**
 * REDUCED MOTION, as a documented baseline. This component's entrance animation
 * (`sk-confirm-dialog-enter`) is cancelled under `prefers-reduced-motion: reduce`
 * (`sk-confirm-dialog.css`); the visual-regression spec applies the real media emulation
 * (`page.emulateMedia({ reducedMotion: 'reduce' })`) rather than this story attempting to
 * simulate it. To see it locally: DevTools → Rendering → Emulate CSS prefers-reduced-motion.
 */
export const ReducedMotion: Story = {
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

/**
 * FORCED COLORS, as a documented baseline. `background` flattens to `Canvas` under
 * `forced-colors: active`, so the surface's boundary comes from the doubled `border-width` step
 * in `sk-confirm-dialog.css`'s forced-colors block rather than from any chromatic cue. To see it
 * locally: DevTools → Rendering → Emulate CSS media feature forced-colors, or
 * `page.emulateMedia({ forcedColors: 'active' })`.
 */
export const ForcedColors: Story = {
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

/** A right-to-left ancestor direction; layout is logical-property-driven throughout
 *  `sk-confirm-dialog.css`, so this mirrors correctly with no component-specific RTL rule. */
export const RTL: Story = {
  render: () =>
    html`<div dir="rtl">
      ${frame(html`
        <sk-confirm-dialog
          dialog-title="هل تريد إبطال هذا الرابط؟"
          message="سيفقد أي شخص لديه هذا الرابط الوصول فورًا. لا يمكن التراجع عن هذا."
          confirm-label="إبطال الرابط"
          cancel-label="الاحتفاظ بالرابط"
          confirm-variant="primary"
        ></sk-confirm-dialog>
      `)}
    </div>`,
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};

/**
 * A NARROW VIEWPORT / 200% ZOOM PROXY (FR-010, NFR-001). The frame below is narrower than the
 * dialog's own fluid cap (`min(92vw, 28rem)`), which is the same effect a real narrow viewport
 * or a 200% zoom has on available space: the dialog fills the available width and the action
 * group remains fully visible and reachable, with both controls still at least 44x44px.
 */
export const NarrowWidth: Story = {
  render: () =>
    frame(
      html`
        <sk-confirm-dialog
          dialog-title="Revoke this link?"
          message="Anyone with this link will lose access immediately. This can't be undone."
          confirm-label="Revoke link"
          cancel-label="Keep link"
          confirm-variant="primary"
        ></sk-confirm-dialog>
      `,
      false,
      '18rem',
    ),
  play: async ({ canvasElement }) => openViaShowModal(canvasElement),
};
