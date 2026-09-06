import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { define } from '../define.js';
import { STATUS_TONES, type StatusIndicatorTone } from '../status-indicator/sk-status-indicator.js';
import sheet from './sk-notice.css.js';

// THE TONE VOCABULARY IS IMPORTED, NOT RESTATED.
//
// #216 records that a `*.markup.ts` cannot import a shared vocabulary — it is evaluated from a
// `data:` URL, which has no module base — which is why `sk-card.markup.ts` had to spell the six
// tones again and is held to `STATUS_TONES` by an order-sensitive assertion instead.
//
// That constraint does not reach this file, and the reason is worth stating rather than leaving
// as luck: a `*.markup.ts` exists ONLY for a component with a server-rendered static form, and
// this element has none. A live region and a dismiss control are meaningless without JavaScript,
// so there is nothing for build-element-markup.mjs to generate and no leaf module to author.
// sk-notice therefore adds NO third copy of the vocabulary — it consumes the one #146 authored
// and #177 exported.

/** The politeness of the notice's live region. `off` renders no live region at all. */
export type NoticeAnnounce = 'off' | 'polite' | 'assertive';

/** The politeness levels, in escalating order. */
export const NOTICE_ANNOUNCEMENTS: ReadonlyArray<NoticeAnnounce> = Object.freeze([
  'off',
  'polite',
  'assertive',
]);

/** The `sk-notice-dismiss` detail: the tone the notice carried when it was dismissed. */
export interface SkNoticeDismissDetail {
  /** The notice's tone at the moment of dismissal. */
  tone: StatusIndicatorTone;
}

const noticeTone = (value: unknown): StatusIndicatorTone => {
  if (typeof value === 'string' && STATUS_TONES.includes(value as StatusIndicatorTone)) {
    return value as StatusIndicatorTone;
  }
  if (value !== undefined && value !== '') {
    console.warn(`unknown sk-notice tone "${String(value)}"; using neutral`);
  }
  return 'neutral';
};

const noticeAnnounce = (value: unknown): NoticeAnnounce => {
  if (typeof value === 'string' && NOTICE_ANNOUNCEMENTS.includes(value as NoticeAnnounce)) {
    return value as NoticeAnnounce;
  }
  if (value !== undefined && value !== '') {
    console.warn(`unknown sk-notice announce "${String(value)}"; using off`);
  }
  return 'off';
};

// polite -> role="status", assertive -> role="alert". The ROLE is what carries the implicit
// aria-live value, and it is set on the node from birth rather than alongside an aria-live
// attribute added later — see the class docblock.
const ROLE: Record<Exclude<NoticeAnnounce, 'off'>, 'status' | 'alert'> = {
  polite: 'status',
  assertive: 'alert',
};

// Fallback marker glyphs. Real DOM text, deliberately, and NOT CSS generated content: a
// `content:` glyph joins the accessible name of whatever it is drawn on unless the alt-text
// syntax suppresses it, and a background-drawn icon receives none of the automatic recolouring
// under forced colors. These sit inside an aria-hidden box, so they carry the tone VISUALLY —
// for a sighted reader in greyscale — while the consumer's message text carries it for
// everyone. The element maps no domain word to a tone and these are not labels.
const MARKER: Record<StatusIndicatorTone, string> = {
  neutral: '•',
  info: 'i',
  success: '✓',
  attention: '!',
  danger: '×',
  recovery: '↻',
};

/**
 * A block-level status message about a page or a region of it, announced at a politeness the
 * consumer chooses.
 *
 * Announcement is an explicit property, never a side effect of tone: a `danger` notice with
 * `announce="off"` is silent, and a `neutral` one with `announce="assertive"` interrupts. The
 * element owns no application state — the consumer decides whether a notice exists — and it has
 * no timer, no positioning and no stacking. It is not a toast.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-border-width-4, --sk-fg-body, --sk-font-sans,
 * --sk-motion-duration-fast, --sk-motion-ease-out, --sk-on-status-attention,
 * --sk-on-status-danger, --sk-on-status-info, --sk-on-status-neutral, --sk-on-status-recovery,
 * --sk-on-status-success, --sk-radius-md, --sk-radius-sm, --sk-space-1, --sk-space-2,
 * --sk-space-3, --sk-space-4, --sk-status-attention, --sk-status-danger, --sk-status-info,
 * --sk-status-neutral, --sk-status-recovery, --sk-status-success, --sk-surface-card,
 * --sk-text-base, --sk-text-lg, --sk-weight-semibold.
 *
 * @element sk-notice
 * @slot heading - A consumer-supplied native heading. The element generates none, so the level stays the consumer's. Rendered INSIDE the live region and first within it, so a headline here is announced ahead of `message` and the default slot (#228). Both live-region roles this element renders are implicitly atomic, so every later re-announcement repeats the heading too; if you want a headline that is seen and never heard, put it outside the notice.
 * @slot marker - A decorative consumer-supplied marker. Falls back to a per-tone glyph.
 * @slot - The message body. Rendered inside the live region, so slotted content is announced with `message`.
 * @slot actions - Trailing consumer-owned controls, such as `sk-button`s.
 * @csspart notice - The notice layout root.
 * @csspart marker - The decorative marker wrapper.
 * @csspart content - The body and actions column.
 * @csspart heading - The consumer heading's wrapper. Nested inside `body`, and therefore inside the live region when announcement is on.
 * @csspart body - The heading, the message and the default slot, and the live region when announcement is on.
 * @csspart actions - The trailing actions wrapper.
 * @csspart dismiss - The dismiss control.
 * @fires {CustomEvent<SkNoticeDismissDetail>} sk-notice-dismiss - Requests dismissal; `detail: { tone }`. Bubbles, is composed, and is cancelable. The element never removes itself. After the event, focus moves to the notice host; `preventDefault()` abandons that move and leaves focus on the dismiss control. If you remove the notice in your handler you MUST move focus yourself — the host is gone by then and focus falls to `<body>`.
 */
export class SkNotice extends LitElement {
  static styles = [sheet];

  static properties = {
    tone: { type: String, reflect: true },
    announce: { type: String, reflect: true },
    // REACTIVE, and that is the whole announcement contract rather than an incidental choice.
    //
    // sk-form-input.ts records the same defect twice — once at the `errorMessage` field and once
    // at `willUpdate` — and both reduce to: the announced text changed and nothing re-rendered.
    // In the first, the rendered node interpolated `validationMessage`, a getter over
    // ElementInternals that Lit cannot observe, so a message that changed without `invalid`
    // flipping never repainted; `aria-describedby` then pointed at stale text and `role="alert"`
    // never fired again. In the second, `label` was missing from the observed change set, so
    // changing it left the alert node showing the OLD label until an unrelated trigger re-ran
    // validate().
    //
    // Declared here as an ordinary reactive property, a changed `message` re-renders the live
    // region's text child on the next update with no other trigger, which is what re-announces
    // it. Deleting this line is the SC-010 mutation arm, and it reds both the marked
    // property-before-upgrade test and the unmarked re-announcement test.
    message: { type: String },
    dismissible: { type: Boolean, reflect: true },
    dismissLabel: { type: String, attribute: 'dismiss-label' },
  };

  /**
   * Presentation tone, from the library's one tone vocabulary. Unknown values render as
   * `neutral` without changing the visible message.
   */
  declare tone: 'neutral' | 'info' | 'success' | 'attention' | 'danger' | 'recovery' | undefined;

  /**
   * Announcement politeness. `off` (the default) renders no live region; `polite` renders
   * `role="status"`; `assertive` renders `role="alert"`. Independent of `tone`.
   */
  declare announce: 'off' | 'polite' | 'assertive';

  /**
   * The message text. Changing it to a DIFFERENT value re-announces, when announcement is on.
   *
   * Re-setting it to the value it already holds announces nothing: Lit's default `hasChanged` is
   * `!==`, so an identical assignment produces no update and no DOM mutation for a screen reader
   * to notice. A dashboard that reports "Connection lost" twice in a row therefore announces it
   * once. If a repeat genuinely needs to be heard, the consumer must make the text differ — a
   * count or a timestamp — because an element that re-announced identical text on every
   * assignment would be unusable for the polling callers this is built for.
   *
   * A consumer that must announce a message which already exists when the notice is inserted
   * should insert the notice first and then assign this — a live region that enters the DOM
   * together with its content is not reliably announced, and the element cannot defer its own
   * first paint without a timer.
   */
  declare message: string;

  /** Whether to render the dismiss control. The element never removes itself when it is used. */
  declare dismissible: boolean;

  /** Accessible name for the dismiss control. Defaults to `Dismiss notice`. */
  declare dismissLabel: string;

  constructor() {
    super();
    this.announce = 'off';
    this.message = '';
    this.dismissible = false;
    this.dismissLabel = 'Dismiss notice';
  }

  connectedCallback(): void {
    super.connectedCallback();
    // The documented focus destination on dismissal is the HOST, so the host has to be
    // programmatically focusable. Set only when the consumer supplied no `tabindex` of their
    // own — clobbering a consumer's value would silently change their tab order. `-1` keeps the
    // notice out of the sequential tab order; it is a focus target, not a tab stop.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
  }

  #dismiss(): void {
    const evt = new CustomEvent<SkNoticeDismissDetail>('sk-notice-dismiss', {
      detail: { tone: noticeTone(this.tone) },
      bubbles: true,
      composed: true,
      cancelable: true,
    });

    // WHAT `cancelable` ACTUALLY PREVENTS, stated because a cancelable event that prevents
    // nothing is an inert affordance this repo has flagged before.
    //
    // The element does not remove itself — #178 is explicit that the consumer owns whether the
    // notice exists — so removal is not the default action. The one effect the element DOES own
    // after dismissal is the focus move, and that is what `preventDefault()` abandons. A
    // consumer who cancels is saying "I am handling this; leave focus where the user put it",
    // which is the only honest meaning available here.
    if (!this.dispatchEvent(evt)) return;

    // FOCUS LANDS ON THE HOST — AFTER the dispatch above, and that ordering is the whole of what
    // this move can and cannot do.
    //
    // WHAT IT DELIVERS: when the consumer's handler returns without removing the notice, focus is
    // left on the host rather than on a dismiss button that may now be hidden or re-rendered.
    //
    // WHAT IT DOES NOT DELIVER, measured rather than assumed: during the handler focus is still on
    // the dismiss BUTTON, because this line has not run yet. A consumer who removes the notice in
    // that handler — which is exactly what the docs tell them to do, since the element never
    // removes itself — leaves this call running on a detached host, where `focus()` is a no-op,
    // and focus falls to <body>. `sk-notice.test.ts` asserts that <body> outcome so it stays
    // visible.
    //
    // SO THE OBLIGATION IS THE CONSUMER'S: if you remove the notice, move focus somewhere
    // deliberate yourself. The element gives you a synchronous window in which focus is still
    // inside the notice; it cannot hold focus inside a subtree you have deleted.
    //
    // NEITHER ORDERING FIXES THIS, and the shape of the non-fix is recorded so it is not retried:
    // focusing the host BEFORE the dispatch would move focus even when the consumer cancels, which
    // is precisely the default action `preventDefault()` exists to abandon; and a removed, focused
    // host drops to <body> whatever the order. An earlier revision of this comment claimed the
    // host-focus move PREVENTS the focus-loss defect. It does not — it narrows it to the case the
    // consumer controls.
    this.focus();
  }

  render() {
    const tone = noticeTone(this.tone);
    const announce = noticeAnnounce(this.announce);

    // THE LIVE REGION IS THE VISIBLE MESSAGE CONTAINER — one node, one copy of the text.
    //
    // A separate visually-hidden mirror was the alternative and is worse: it puts the message in
    // the accessibility tree twice, and `aria-hidden`-ing the copy to fix that would suppress the
    // very announcements it exists for.
    //
    // THE HEADING IS INSIDE IT (#228, operator ruling 2026-09-07), and it used to be a sibling
    // BEFORE it. A consumer following this element's own Dismissible story — `<h3
    // slot="heading">Deploy failed</h3>` plus the detail in `message` — heard the detail and
    // never the headline, which is not what `role="alert"` implies to anyone reading that markup.
    // The whole notice is now announced, heading first.
    //
    // `keyed()` on the politeness is what keeps the "never toggled onto an existing node" half of
    // #178's requirement honest. Within one politeness the key is stable, so a `message` change
    // re-renders only the text child and the container node itself is preserved — that is the
    // node-identity guarantee the behaviour fixture asserts. Change the politeness and the key
    // changes, so Lit discards the node and builds a new one that carries its role from birth,
    // rather than mutating a role onto a node that is already holding text.
    //
    // IT PICKS THE BETTER OF TWO UNRELIABLE OPTIONS RATHER THAN REMOVING THE HAZARD, which is
    // worth stating because the paragraph above reads as absolute. Switching `announce` from `off`
    // to `polite` while a message is already set births a node whose text is present at birth —
    // the very "created at the same moment as its content" condition this keying is invoked to
    // avoid. Both spellings are unreliable there; a role mutated onto a node already holding text
    // is the worse of the two, so that is the one this avoids.
    //
    // #228 WIDENED THAT HAZARD IN TWO WAYS, and this paragraph is wider than it was because the
    // caveat it replaced was measurably too narrow once the heading moved inside:
    //
    //   1. THE ESCAPE IS NARROWER. The old wording closed with "the reliable path remains the one
    //      the docs give consumers: set the politeness first, then assign the message". That path
    //      relied on the region being EMPTY at birth. With the heading inside, a consumer who
    //      slots one — which the stories, the docs and #228's own example all do — births a region
    //      that already holds text no matter when `message` is assigned. The recommended ordering
    //      still helps, because the message still arrives as a mutation to an existing node, but
    //      it no longer produces an empty-at-birth region and the old sentence claimed it did.
    //
    //   2. EVERY RE-ANNOUNCEMENT NOW CARRIES THE HEADING, permanently, not just at birth. Both
    //      roles this element renders are implicitly ATOMIC — WAI-ARIA gives `alert` and `status`
    //      `aria-atomic="true"` as well as their `aria-live` value — so a change anywhere in the
    //      region is presented as the whole region. That is precisely what makes the ruling work:
    //      changing `message` alone re-reads "Deploy failed. Retrying in 2s", not "Retrying in
    //      2s". It is also the cost: a notice that updates a countdown repeats its headline on
    //      every tick. Nothing here can trim that without taking the heading back out, so it is a
    //      documented consequence rather than a defect — see the migration line in
    //      docs/design-system/changelog.md.
    //
    // What has NOT changed: within one politeness the region node is still preserved across a
    // message change, so the heading is not re-created either, and the node-identity assertions in
    // the behaviour fixture still hold with a heading in scope.
    const body = keyed(
      announce,
      html`<div
        part="body"
        class="sk-notice__body"
        role=${announce === 'off' ? nothing : ROLE[announce]}
      ><div part="heading" class="sk-notice__heading"><slot name="heading"></slot></div>${this
        .message}<slot></slot></div>`,
    );

    return html`<div part="notice" class="sk-notice sk-notice--${tone}" data-tone=${tone}>
      <span part="marker" class="sk-notice__marker" aria-hidden="true"
        ><slot name="marker">${MARKER[tone]}</slot></span
      >
      <div part="content" class="sk-notice__content">
        ${body}
        <div part="actions" class="sk-notice__actions"><slot name="actions"></slot></div>
      </div>
      ${this.dismissible
        ? html`<button
            part="dismiss"
            class="sk-notice__dismiss"
            type="button"
            aria-label=${this.dismissLabel || 'Dismiss notice'}
            @click=${this.#dismiss}
          >
            ✕
          </button>`
        : nothing}
    </div>`;
  }
}

define('sk-notice', SkNotice);
