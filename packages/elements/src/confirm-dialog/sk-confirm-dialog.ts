import { LitElement, html, nothing } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { define } from '../define.js';
import buttonSheet from '../button/sk-button.css.js';
import { buttonClasses } from '../button/sk-button.markup.js';
import sheet from './sk-confirm-dialog.css.js';

/** The two outcomes this element ever reports, read from the native `close` event's
 *  `HTMLDialogElement.returnValue` (FR-006). There is no third state. */
export type ConfirmDialogOutcome = 'confirm' | 'cancel';

/** Which control receives focus when the dialog opens (FR-008). Overridable; defaults to
 *  `cancel` because that is the safe default for a destructive confirmation. */
export type ConfirmDialogInitialFocus = ConfirmDialogOutcome;

const INITIAL_FOCUS_VALUES: ReadonlyArray<ConfirmDialogInitialFocus> = Object.freeze([
  'confirm',
  'cancel',
]);

const resolveInitialFocus = (value: unknown): ConfirmDialogInitialFocus => {
  if (typeof value === 'string' && (INITIAL_FOCUS_VALUES as readonly string[]).includes(value)) {
    return value as ConfirmDialogInitialFocus;
  }
  if (value !== undefined && value !== '') {
    console.warn(
      `sk-confirm-dialog: unknown initial-focus "${String(value)}" — expected "confirm" or ` +
        `"cancel"; using "cancel".`,
    );
  }
  return 'cancel';
};

// A missing-required-string warning is emitted at most once per property per stretch of
// renders where it stays missing (FR-017) — a per-instance, per-property dedupe rather than
// a warn-on-every-render storm. Re-supplying and then re-omitting the same property warns
// again, which is correct: that is a new integration defect, not a repeat of the old one.
const REQUIRED_STRING_PROPS = ['dialogTitle', 'message', 'confirmLabel', 'cancelLabel'] as const;
type RequiredStringProp = (typeof REQUIRED_STRING_PROPS)[number];

/**
 * A bounded, single-purpose confirmation dialog over the native `<dialog>`, opened via
 * `showModal()`.
 *
 * NO STRING HAS A DEFAULT (FR-001, FR-017). `dialogTitle`, `message`, `confirmLabel` and
 * `cancelLabel` are entirely consumer-supplied. Omitting one renders that node with nothing
 * substituted for it — never an English or any other library-authored literal — and logs a
 * one-time development warning naming the missing property. That is FR-018's guarantee,
 * proven in `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` by a component-scoped
 * test asserting the rendered shadow tree carries zero bare user-visible text beyond the
 * exact supplied strings; that test is NOT a repo-wide gate (issue #286 owns building one).
 *
 * ONE REPORTING MECHANISM (FR-006). The element never fires a custom event for its outcome.
 * Every path — confirm, cancel, Escape, backdrop dismissal (when `backdrop-dismiss` is set),
 * and a programmatic `close()` with no explicit value — funnels through the native `<dialog>`
 * `close` event, read via `returnValue` (`'confirm' | 'cancel'`). Every path other than an
 * explicit confirm activation resolves `'cancel'` (FR-007) — the element defaults
 * `returnValue` to `'cancel'` before the dialog can be shown, so an unset programmatic close
 * can never be read back as an invented confirmation.
 *
 * THE ELEMENT PERFORMS NO MUTATION, REQUEST, OR NAVIGATION (FR-005). It reports what the user
 * did; the consumer decides what happens next, listening for the dialog's own `close` event:
 *
 * ```ts
 * const dialogEl = host.shadowRoot!.querySelector('[part="dialog"]') as HTMLDialogElement;
 * dialogEl.addEventListener('close', () => {
 *   if (dialogEl.returnValue === 'confirm') doTheThing();
 * });
 * ```
 *
 * STATIC FORM (FR-016). This component ships no `sk-confirm-dialog.markup.ts` and generates
 * no static `sk-confirm-dialog.html`/`index.ts` — `showModal()` has no server-rendered
 * equivalent, the same shape as `sk-notice` (#178). Whether the *stylesheet* additionally
 * needs a generated static twin for a consumer-rendered `<dialog>` is explicitly deferred to
 * open issue #301's ruling; this component does not decide it.
 *
 * TEAM DELETION IS NEVER A DEMONSTRATED FLOW (FR-014). Whole-Team deletion is blocked upstream
 * (Team Kitty SaaS #1432); every example anywhere near this component uses membership
 * removal, leaving a team, or bearer-link revocation instead.
 *
 * Token dependencies: --sk-border-default, --sk-border-width-1, --sk-fg-body,
 * --sk-fg-default, --sk-font-sans, --sk-motion-duration-fast, --sk-motion-ease-out,
 * --sk-radius-lg, --sk-shadow-elev, --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-5,
 * --sk-space-8, --sk-space-9, --sk-text-base, --sk-text-lg, --sk-weight-semibold (this
 * component's own sheet), plus whichever `--sk-*` tokens the composed `.sk-button` sheet
 * uses for the confirm/cancel controls.
 *
 * @element sk-confirm-dialog
 * @csspart dialog - The native `<dialog>` itself; the root surface, and the consumer's own
 *   access point for the platform's `close`/`returnValue` contract.
 * @csspart title - The heading node. Its text is the dialog's accessible name.
 * @csspart body - The message region. Scrolls independently when its content overflows
 *   (FR-010); its text is the dialog's accessible description.
 * @csspart actions - The footer row holding the cancel and confirm controls. Never scrolls.
 * @csspart cancel - The cancel control.
 * @csspart confirm - The confirm control. Composes `.sk-button`; set `confirm-variant` to
 *   choose its tone — the element never infers or applies one (FR-004).
 */
export class SkConfirmDialog extends LitElement {
  static styles = [buttonSheet, sheet];

  static properties = {
    dialogTitle: { type: String, attribute: 'dialog-title' },
    message: { type: String },
    confirmLabel: { type: String, attribute: 'confirm-label' },
    cancelLabel: { type: String, attribute: 'cancel-label' },
    confirmVariant: { type: String, attribute: 'confirm-variant' },
    initialFocus: { type: String, attribute: 'initial-focus' },
    backdropDismiss: { type: Boolean, attribute: 'backdrop-dismiss', reflect: true },
    open: { type: Boolean, reflect: true },
  };

  /** The dialog's accessible name. Required — no default (FR-001, FR-017). Omitting it warns
   *  and renders the title node with no text. */
  declare dialogTitle: string | undefined;

  /** The dialog's accessible description. Required — no default (FR-001, FR-017). Long
   *  values scroll independently of the action row (FR-010). */
  declare message: string | undefined;

  /** The confirm control's visible label. Required — no default (FR-001, FR-017). */
  declare confirmLabel: string | undefined;

  /** The cancel control's visible label. Required — no default (FR-001, FR-017). */
  declare cancelLabel: string | undefined;

  /** The confirm control's `.sk-button` tone (`primary`, `secondary` or `ghost`). Omit for
   *  the unstyled base button. The element never infers or applies a tone itself (FR-004) —
   *  this is a style choice, not user-visible copy, so it is exempt from the no-defaults rule
   *  and may reasonably be left unset by a consumer who wants the base button. */
  declare confirmVariant: 'primary' | 'secondary' | 'ghost' | undefined;

  /** Which control receives focus when the dialog opens: `'confirm'` or `'cancel'`.
   *  Defaults to `'cancel'`, the safe default for a destructive confirmation (FR-008). An
   *  unknown value warns and falls back to `'cancel'`. */
  declare initialFocus: ConfirmDialogInitialFocus;

  /** Whether clicking the dialog's own backdrop closes it. Defaults to `false`: a
   *  destructive confirmation's safest default is to require an explicit control activation,
   *  so an accidental click outside the dialog's content does nothing rather than silently
   *  cancelling. When set, a backdrop click resolves `'cancel'` (FR-007). */
  declare backdropDismiss: boolean;

  /** Reflects the dialog's real open/closed state (ADR-11 SC-005). Read-only in practice —
   *  set by the element itself from `showModal()` and the native `close` event — a consumer
   *  should not assign it directly to open or close the dialog; call `showModal()` and the
   *  dialog's own `close()` instead. */
  declare open: boolean;

  #dialogEl: HTMLDialogElement | undefined;
  #invoker: HTMLElement | undefined;
  #warned = new Set<RequiredStringProp>();

  constructor() {
    super();
    this.initialFocus = 'cancel';
    this.backdropDismiss = false;
    this.open = false;
  }

  /**
   * Opens the dialog as a native modal (FR-013). Equivalent to calling `showModal()` on the
   * rendered `<dialog>` directly (reachable via `shadowRoot.querySelector('[part="dialog"]')`
   * — the same node `::part(dialog)` targets from outside), except that it also records
   * `invoker` (or `document.activeElement`, if omitted) as the element focus returns to when
   * the dialog closes (FR-009), and it resets `returnValue` to `'cancel'` before opening so an
   * unset close can never be read back as a confirmation (FR-007).
   */
  showModal(invoker?: HTMLElement): void {
    this.#invoker =
      invoker ?? (document.activeElement instanceof HTMLElement ? document.activeElement : undefined);
    const dialogEl = this.#dialogEl;
    if (!dialogEl) return;
    // Defaulted BEFORE the dialog can be shown, so a prior confirmation's leftover 'confirm'
    // can never survive into the next open — belt, not the only fastener: #handleClose below is
    // what actually makes FR-007 hold for Escape (see its own comment for why this alone is not
    // enough).
    dialogEl.returnValue = 'cancel';
    dialogEl.showModal();
    this.open = true;
    const target =
      resolveInitialFocus(this.initialFocus) === 'confirm'
        ? dialogEl.querySelector<HTMLElement>('[part="confirm"]')
        : dialogEl.querySelector<HTMLElement>('[part="cancel"]');
    target?.focus();
  }

  #handleClose = (): void => {
    // NORMALIZE returnValue HERE — this is the one point in the whole close sequence where a
    // written value is guaranteed to survive. MEASURED (not assumed from the spec text): on
    // Escape, Chromium's own close-watcher path resets `returnValue` to the empty string as
    // part of its internal close steps — the `cancel` event's handlers still see whatever was
    // pre-set (e.g. this class's own showModal() default), but by the time `close` fires it has
    // already been cleared to `''`, and setting it again from inside a `cancel` listener does
    // NOT stick either (the reset happens after `cancel`'s listeners run). Setting it here,
    // inside the `close` listener itself, is the only place measured to hold: nothing in the
    // platform's own steps runs after `close` is dispatched. Every path other than an explicit
    // confirm activation therefore resolves 'cancel' here, regardless of what the platform did
    // to the value in between (FR-007) — the showModal() pre-set above is a second, redundant
    // safeguard for the one case this handler cannot reach (a `returnValue` read by a consumer
    // BEFORE showModal() is ever called for the first time), not the mechanism that makes
    // Escape correct.
    const dialogEl = this.#dialogEl;
    if (dialogEl && dialogEl.returnValue !== 'confirm') {
      dialogEl.returnValue = 'cancel';
    }
    this.open = false;
    // Focus returns to the invoker on EVERY close path (FR-009) — this handler is the one
    // place all of them funnel through, because it is bound to the dialog's own native
    // `close` event rather than to the confirm/cancel click handlers individually.
    this.#invoker?.focus();
    this.#invoker = undefined;
  };

  #handleConfirmClick = (): void => {
    // Explicit, not a fallthrough of the pre-open default — a future change to that default
    // must not silently change what the confirm control itself does.
    this.#dialogEl?.close('confirm');
  };

  #handleCancelClick = (): void => {
    this.#dialogEl?.close('cancel');
  };

  #handleBackdropClick = (event: MouseEvent): void => {
    if (!this.backdropDismiss) return;
    // The click lands on the <dialog> element itself only when it lands on the
    // backdrop-adjacent box the dialog paints around its own content — a click inside the
    // content (the title, body or actions) targets one of THOSE nodes instead, never the
    // <dialog> itself, per how the platform lays the dialog and its content out.
    if (event.target === this.#dialogEl) {
      // No explicit value: relies on `returnValue` already being defaulted to 'cancel' by
      // showModal() above. Native <dialog> has no built-in backdrop-close behavior at all —
      // this listener is the entire mechanism.
      this.#dialogEl?.close();
    }
  };

  #setDialogEl = (el: Element | undefined): void => {
    this.#dialogEl = (el as HTMLDialogElement | undefined) ?? undefined;
  };

  #requiredText(prop: RequiredStringProp, value: string | undefined): string | typeof nothing {
    if (typeof value === 'string' && value !== '') {
      this.#warned.delete(prop);
      return value;
    }
    if (!this.#warned.has(prop)) {
      this.#warned.add(prop);
      console.warn(
        `sk-confirm-dialog: required property "${prop}" was omitted — rendering with no ` +
          `substituted text. No fallback copy is ever shown for this property (FR-001, FR-017).`,
      );
    }
    // `nothing` renders no text node at all — not an empty string text node — so the
    // FR-018 "zero bare user-visible text nodes beyond the exact supplied strings" test has
    // no node to find here, rather than an empty one to special-case.
    return nothing;
  }

  render() {
    const title = this.#requiredText('dialogTitle', this.dialogTitle);
    const message = this.#requiredText('message', this.message);
    const confirmLabel = this.#requiredText('confirmLabel', this.confirmLabel);
    const cancelLabel = this.#requiredText('cancelLabel', this.cancelLabel);
    const confirmClass = buttonClasses(this.confirmVariant);
    const cancelClass = buttonClasses();

    return html`<dialog
      part="dialog"
      class="sk-confirm-dialog"
      aria-labelledby="title"
      aria-describedby="body"
      @close=${this.#handleClose}
      @click=${this.#handleBackdropClick}
      ${ref(this.#setDialogEl)}
    >
      <h2 id="title" part="title" class="sk-confirm-dialog__title">${title}</h2>
      <div id="body" part="body" class="sk-confirm-dialog__body">${message}</div>
      <div part="actions" class="sk-confirm-dialog__actions">
        <button
          part="cancel"
          class="sk-confirm-dialog__cancel ${cancelClass}"
          type="button"
          @click=${this.#handleCancelClick}
        >
          ${cancelLabel}
        </button>
        <button
          part="confirm"
          class="sk-confirm-dialog__confirm ${confirmClass}"
          type="button"
          @click=${this.#handleConfirmClick}
        >
          ${confirmLabel}
        </button>
      </div>
    </dialog>`;
  }
}

define('sk-confirm-dialog', SkConfirmDialog);
