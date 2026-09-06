import type { Meta, StoryObj } from '@storybook/web-components';
import { html, type TemplateResult } from 'lit';
import './sk-notice.js';
// Composed by the TrailingActions and WithStatusIndicator stories. Imported explicitly rather
// than relying on another story file having already defined them: Storybook bundles every story
// together, so a missing import here is invisible until someone runs this file's stories alone.
import '../button/sk-button.js';
import '../status-indicator/sk-status-indicator.js';

// TONES ARE DERIVED, NOT RETYPED. Importing the vocabulary here means a tone added, removed or
// reordered in sk-status-indicator.ts changes this file's stories rather than silently leaving
// one uncovered.
import { STATUS_TONES } from '../status-indicator/sk-status-indicator.js';

const LABEL: Record<string, string> = {
  neutral: 'Nothing has happened yet',
  info: 'Collecting evidence from the last run',
  success: 'All twelve targets verified',
  attention: 'Two targets need review before release',
  danger: 'The deploy failed on three of twelve targets',
  recovery: 'Reconnected — replaying the queued events',
};

const notice = (tone: string, opts: { announce?: string; heading?: string } = {}) => `
  <sk-notice tone="${tone}"${opts.announce ? ` announce="${opts.announce}"` : ''} message="${LABEL[tone]}">
    ${opts.heading ? `<h3 slot="heading">${opts.heading}</h3>` : ''}
  </sk-notice>
`;

const frame = (body: string, attrs = '') => `
  <div${attrs} style="display:grid;gap:var(--sk-space-4);background:var(--sk-surface-page);padding:var(--sk-space-6);max-width:56rem;">
    ${body}
  </div>
`;

const allTones = (attrs = '') => frame(STATUS_TONES.map((t) => notice(t)).join(''), attrs);

const meta: Meta = {
  title: 'Elements/SkNotice',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'A block-level status message about a page or a region of it, announced at a politeness the consumer chooses. Announcement is an explicit property, never a side effect of tone. The element never removes itself.',
      },
    },
  },
  render: () => frame(notice('info')),
};

export default meta;
type Story = StoryObj;

/** The base notice: a tone, a message, and no announcement. Announcement is opt-in. */
export const Default: Story = {};

export const Neutral: Story = { render: () => frame(notice('neutral')) };
export const Info: Story = { render: () => frame(notice('info')) };
export const Success: Story = { render: () => frame(notice('success')) };
export const Attention: Story = { render: () => frame(notice('attention')) };
export const Danger: Story = { render: () => frame(notice('danger')) };
export const Recovery: Story = { render: () => frame(notice('recovery')) };

/**
 * The six tones, each labelled by its own message.
 *
 * READ THE TEXT, NOT THE HUE. Every notice here is interpretable with the colour removed — that
 * is the Greyscale story's assertion, and it is why the meaning is in the message rather than in
 * a story caption.
 */
export const AllTones: Story = { render: () => allTones() };

/**
 * ANNOUNCEMENT IS EXPLICIT, AND IT IS NOT A FUNCTION OF TONE.
 *
 * All three notices below carry `tone="danger"`. Only the politeness differs, and that is the
 * point #178 makes: a `danger` notice with `announce="off"` is silent, and a `neutral` one with
 * `announce="assertive"` interrupts. Nothing about the tone decides it.
 *
 * `off` renders NO live region — not an empty one, and not one with the role removed. `polite`
 * renders `role="status"`, `assertive` renders `role="alert"`, and in both cases the node
 * carrying the role exists from that node's first render, before any message reaches it.
 */
export const AnnounceOff: Story = {
  render: () => frame(notice('danger', { announce: 'off', heading: 'Announcement off' })),
};

export const AnnouncePolite: Story = {
  render: () => frame(notice('danger', { announce: 'polite', heading: 'Announced politely' })),
};

export const AnnounceAssertive: Story = {
  render: () =>
    frame(notice('danger', { announce: 'assertive', heading: 'Announced assertively' })),
};

// The two stories below wire real listeners, so they render a Lit template rather than the HTML
// string the rest of this file uses. A string reaches the DOM through innerHTML and cannot carry
// an event binding, and this repo's Storybook registers only `@storybook/addon-docs` and
// `@storybook/addon-a11y` (apps/storybook/.storybook/main.ts) — there is no Actions panel to log
// into. Both stories therefore render their log INTO the story, which is strictly better
// evidence than a panel: it survives into the axe run and the visual baselines, where a panel
// does not.
const logBox = (id: string) => html`<pre
  id=${id}
  style="margin:0;padding:var(--sk-space-3);background:var(--sk-surface-card);color:var(--sk-fg-body);font-family:var(--sk-font-mono);font-size:var(--sk-text-sm);white-space:pre-wrap;"
>waiting…</pre>`;

const wrap = (body: TemplateResult) => html`<div
  style="display:grid;gap:var(--sk-space-4);background:var(--sk-surface-page);padding:var(--sk-space-6);max-width:56rem;"
>
  ${body}
</div>`;

/**
 * THE MESSAGE-CHANGE STORY — the one this mission exists for.
 *
 * Same notice, same tone, new message. Press the button and the message changes with nothing
 * else changing. The live region's text follows, which is what re-announces it.
 *
 * This is the exact defect `sk-form-input.ts` records twice, at its `errorMessage` field and
 * again at `willUpdate`: in both, the announced text changed and nothing re-rendered, so
 * `role="alert"` never fired again and `aria-describedby` pointed at stale text. Here `message`
 * is an ordinary reactive property, so the update is Lit's to do.
 *
 * The proof is not this story — a story cannot fail. It is
 * `fixtures/elements-behaviour/src/sk-notice.test.ts`, whose red is a stale message.
 */
export const MessageChange: Story = {
  render: () => {
    const messages = [
      'Reconnecting — retrying in 5 seconds',
      'Reconnecting — retrying in 2 seconds',
      'Reconnected. Replaying 14 queued events.',
    ];
    let index = 0;
    const advance = (event: Event) => {
      const root = (event.currentTarget as HTMLElement).closest('div');
      const target = root?.querySelector('sk-notice') as (HTMLElement & { message: string }) | null;
      const log = root?.querySelector('#message-change-log');
      if (!target) return;
      index = (index + 1) % messages.length;
      target.message = messages[index] as string;
      if (log) log.textContent = `message is now: ${messages[index]}`;
    };
    return wrap(html`
      <sk-notice tone="recovery" announce="polite" message=${messages[0]}>
        <h3 slot="heading">Connection</h3>
      </sk-notice>
      <button type="button" @click=${advance}>Change the message (tone stays the same)</button>
      ${logBox('message-change-log')}
    `);
  },
};

/**
 * DISMISSAL IS CONTROLLED — the notice does not remove itself.
 *
 * Dismiss it and watch: the event fires, the log records it, and the notice is STILL THERE. That
 * is the contract. The consumer owns whether a notice exists; #178 is explicit that the element
 * removing itself would take that decision away from the only code that can make it correctly.
 *
 * The second notice cancels the event with `preventDefault()`. The visible difference is where
 * focus goes: the element's one post-dismissal effect is moving focus to the host, and cancelling
 * abandons exactly that. This is what keeps `cancelable` load-bearing rather than an inert flag —
 * a cancelable event that prevents nothing is an affordance this repo has flagged before.
 *
 * The dismiss control is a real `<button>` with a required accessible name (`dismiss-label`),
 * not the unlabelled `×` glyph the Factory Dashboard audit found on every hand-rolled strip.
 */
export const Dismissible: Story = {
  render: () => {
    let count = 0;
    const onDismiss = (event: Event) => {
      const detail = (event as CustomEvent<{ tone: string }>).detail;
      const root = (event.currentTarget as HTMLElement).closest('div');
      const log = root?.querySelector('#dismiss-log');
      count += 1;
      const dismissed = event.target as HTMLElement;
      if (log) {
        log.textContent =
          `sk-notice-dismiss #${count} — detail: ${JSON.stringify(detail)}\n` +
          `bubbles: ${event.bubbles}, composed: ${event.composed}, cancelable: ${event.cancelable}\n` +
          `still in the document after the event: ${dismissed.isConnected}`;
      }
    };
    const onDismissCancelled = (event: Event) => {
      event.preventDefault();
      const root = (event.currentTarget as HTMLElement).closest('div');
      const log = root?.querySelector('#dismiss-cancelled-log');
      if (log) {
        log.textContent =
          `preventDefault() called — defaultPrevented: ${event.defaultPrevented}\n` +
          `the element still did not remove itself, and it left focus alone`;
      }
    };
    return wrap(html`
      <sk-notice
        tone="danger"
        announce="assertive"
        dismissible
        dismiss-label="Dismiss the deploy failure notice"
        message="The deploy failed on three of twelve targets."
        @sk-notice-dismiss=${onDismiss}
      >
        <h3 slot="heading">Deploy failed</h3>
      </sk-notice>
      ${logBox('dismiss-log')}
      <sk-notice
        tone="attention"
        dismissible
        dismiss-label="Dismiss the review notice"
        message="Two targets need review before release."
        @sk-notice-dismiss=${onDismissCancelled}
      >
        <h3 slot="heading">Cancelled dismissal</h3>
      </sk-notice>
      ${logBox('dismiss-cancelled-log')}
    `);
  },
};

/** A long single message wraps rather than truncating; the marker stays at the top. */
export const LongMessage: Story = {
  render: () =>
    frame(`
      <sk-notice tone="attention" announce="polite" message="The verification run completed with two targets flagged for independent observation, and the evidence for both is still being collected; nothing here is blocking the release, but neither target can be signed off until the observation lands and a reviewer has recorded a verdict against it.">
        <h3 slot="heading">Review needed</h3>
      </sk-notice>
    `),
};

/**
 * A MULTI-PARAGRAPH BODY, slotted rather than passed as `message`.
 *
 * The body slot is rendered INSIDE the live region, so slotted content participates in the
 * announcement exactly as `message` does — a consumer is not forced to choose between structured
 * markup and being announced.
 */
export const MultiParagraphBody: Story = {
  render: () =>
    frame(`
      <sk-notice tone="danger" announce="assertive">
        <h3 slot="heading">The deploy failed</h3>
        <p>Three of twelve targets rejected the release bundle.</p>
        <p>The failures are all signature mismatches, so the bundle is likely stale rather than broken.</p>
      </sk-notice>
    `),
};

/**
 * TRAILING ACTIONS are the consumer's own controls, slotted. The element owns no retry logic, no
 * reconnect logic and no undo — #178 puts all three out of scope. It renders a place to put them.
 */
export const TrailingActions: Story = {
  render: () =>
    frame(`
      <sk-notice tone="danger" announce="assertive" message="The deploy failed on three of twelve targets.">
        <h3 slot="heading">Deploy failed</h3>
        <sk-button slot="actions" variant="secondary">View the log</sk-button>
        <sk-button slot="actions">Retry the deploy</sk-button>
      </sk-notice>
    `),
};

/**
 * A NOTICE MAY SLOT AN INDICATOR; AN INDICATOR NEVER BECOMES A NOTICE.
 *
 * #178's table is binding: `sk-status-indicator` (#146) is inline, passive and lives inside a row
 * or header; `sk-notice` is block, announced, and owns a region. They share exactly one thing —
 * the tone vocabulary — and this story is what that sharing looks like. Neither absorbs the
 * other, and this mission changes nothing about the indicator.
 */
export const WithStatusIndicator: Story = {
  render: () =>
    frame(`
      <sk-notice tone="recovery" announce="polite">
        <h3 slot="heading">Recovering</h3>
        <p>The queue is draining. No action is needed.</p>
        <sk-status-indicator slot="actions" tone="recovery"><span slot="marker">●</span>Replaying events</sk-status-indicator>
      </sk-notice>
    `),
};

/**
 * TONE IS NEVER THE ONLY CARRIER OF MEANING.
 *
 * The same six notices, desaturated in the browser. Every one still says what it is, because the
 * meaning is in the message text and the marker glyph, and the tone edge still reads as a weight.
 *
 * This is the audited defect shown as its own absence: at factory-dashboard@1fb95bc the
 * border/background hue was the sole difference between "info" and "failed", and those strips go
 * blank under this filter.
 */
export const Greyscale: Story = {
  render: () => `<div style="filter:grayscale(1) contrast(1.05);">${allTones()}</div>`,
};

/**
 * FORCED COLORS, as a documented baseline — and it is deliberately NOT a byte-identical re-render
 * of AllTones. #176's gate deleted three decoy stories that were exactly that and asserted
 * nothing.
 *
 * What to look at, and why the block is load-bearing rather than merely present:
 *
 * - `background` flattens to `Canvas`, so all six tone surfaces become one ground. Every
 *   chromatic carrier is gone.
 * - `border-*-color` is remapped to a system colour automatically, with zero author CSS. So a
 *   forced-colors rule that only set a border colour would change nothing that was not already
 *   going to happen. `transparent` is not preserved there either — it maps to `CanvasText` like
 *   any other border colour.
 * - What survives BECAUSE the stylesheet does something no remap supplies is the WIDTH step: the
 *   tone edge doubles, which is measured against the normal-mode value in
 *   `apps/storybook/src/tests/sk-notice-forced-colors.spec.ts` rather than assumed here.
 * - The marker is real text, so it recolours with everything else. A background-drawn icon would
 *   need `forced-color-adjust: none`, which freezes it at its authored colour — frequently
 *   invisible against the forced-colors ground. This component sets it nowhere.
 * - The dismiss button keeps a visible ring because it is drawn with `outline`, not `box-shadow`:
 *   `box-shadow` computes away entirely in this mode.
 *
 * To see it: DevTools → Rendering → Emulate CSS media feature forced-colors, or
 * `page.emulateMedia({ forcedColors: 'active' })`.
 */
export const ForcedColors: Story = {
  render: () =>
    frame(`
      ${STATUS_TONES.map((t) => notice(t)).join('')}
      <sk-notice tone="danger" dismissible dismiss-label="Dismiss the forced-colors sample" message="Tab to the dismiss control: the focus ring is an outline, so it survives here.">
        <h3 slot="heading">The dismiss control keeps its ring</h3>
      </sk-notice>
    `),
};

/**
 * LightMode is required of every component, and this mission's exit criteria say to VERIFY it
 * renders light styling rather than assume it.
 *
 * The wrapper carries `class="sk-light"`, NOT `data-theme="light"`: the token package anchors its
 * light block on `:root[data-theme="light"], .sk-light`, and `:root` only ever matches `<html>`,
 * so the attribute on a wrapping div activates nothing at all (#93).
 *
 * It works here for the reason ADR-9 §3 gives: `sk-notice.css` contains no theme selector, because
 * one would cross the shadow boundary and be silently inert. Every tone's light value arrives
 * through `--sk-status-*` / `--sk-on-status-*`, and a custom property inherits through the
 * boundary where a selector does not.
 *
 * EVERY TONE, not a sample: `fixtures/elements-behaviour/src/sk-notice.test.ts` iterates
 * `STATUS_TONES` and requires each tone's surface to differ between the themes, so a tone whose
 * light value was never defined reds there rather than being eyeballed here.
 */
export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => allTones(' class="sk-light"'),
};
