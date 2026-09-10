import React from "react";
import { SkConfirmDialog as SkConfirmDialogElement } from "@spec-kitty/elements";

export type { SkConfirmDialogElement };

export interface SkConfirmDialogProps extends Pick<
  React.AllHTMLAttributes<HTMLElement>,
  | "children"
  | "dir"
  | "hidden"
  | "id"
  | "lang"
  | "slot"
  | "style"
  | "title"
  | "translate"
  | "onClick"
  | "onFocus"
  | "onBlur"
> {
  /** Whether clicking the dialog's own backdrop closes it. Defaults to `false`: a
destructive confirmation's safest default is to require an explicit control activation,
so an accidental click outside the dialog's content does nothing rather than silently
cancelling. When set, a backdrop click resolves `'cancel'` (FR-007). */
  backdropDismiss?: boolean;

  /** Reflects the dialog's real open/closed state (ADR-11 SC-005). Read-only in practice —
set by the element itself from `showModal()` and the native `close` event — a consumer
should not assign it directly to open or close the dialog; call `showModal()` and the
dialog's own `close()` instead. */
  open?: boolean;

  /** The cancel control's visible label. Required — no default (FR-001, FR-017). */
  cancelLabel?: SkConfirmDialogElement["cancelLabel"];

  /** The confirm control's visible label. Required — no default (FR-001, FR-017). */
  confirmLabel?: SkConfirmDialogElement["confirmLabel"];

  /** The confirm control's `.sk-button` tone (`primary`, `secondary` or `ghost`). Omit for
the unstyled base button. The element never infers or applies a tone itself (FR-004) —
this is a style choice, not user-visible copy, so it is exempt from the no-defaults rule
and may reasonably be left unset by a consumer who wants the base button. */
  confirmVariant?: SkConfirmDialogElement["confirmVariant"];

  /** The dialog's accessible name. Required — no default (FR-001, FR-017). Omitting it warns
and renders the title node with no text. */
  dialogTitle?: SkConfirmDialogElement["dialogTitle"];

  /** Which control receives focus when the dialog opens: `'confirm'` or `'cancel'`.
Defaults to `'cancel'`, the safe default for a destructive confirmation (FR-008). An
unknown value warns and falls back to `'cancel'`. */
  initialFocus?: SkConfirmDialogElement["initialFocus"];

  /** The dialog's accessible description. Required — no default (FR-001, FR-017). Long
values scroll independently of the action row (FR-010). */
  message?: SkConfirmDialogElement["message"];

  /** A space-separated list of the classes of the element. Classes allows CSS and JavaScript to select and access specific elements via the class selectors or functions like the method `Document.getElementsByClassName()`. */
  className?: string;

  /** Contains a space-separated list of the part names of the element that should be exposed on the host element. */
  exportparts?: string;

  /** Used for labels to link them with their inputs (using input id). */
  htmlFor?: string;

  /** Used to help React identify which items have changed, are added, or are removed within a list. */
  key?: number | string;

  /** Contains a space-separated list of the part names of the element. Part names allows CSS to select and style specific elements in a shadow tree via the ::part pseudo-element. */
  part?: string;

  /** A mutable ref object whose `.current` property is initialized to the passed argument (`initialValue`). The returned object will persist for the full lifetime of the component. */
  ref?: React.Ref<SkConfirmDialogElement>;

  /** Allows developers to make HTML elements focusable, allow or prevent them from being sequentially focusable (usually with the `Tab` key, hence the name) and determine their relative ordering for sequential focus navigation. */
  tabIndex?: number;
}

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
 * ## Attributes & Properties
 *
 * Component attributes and properties that can be applied to the element or by using JavaScript.
 *
 * - `backdrop-dismiss`/`backdropDismiss`: Whether clicking the dialog's own backdrop closes it. Defaults to `false`: a
 * destructive confirmation's safest default is to require an explicit control activation,
 * so an accidental click outside the dialog's content does nothing rather than silently
 * cancelling. When set, a backdrop click resolves `'cancel'` (FR-007).
 * - `cancel-label`/`cancelLabel`: The cancel control's visible label. Required — no default (FR-001, FR-017).
 * - `confirm-label`/`confirmLabel`: The confirm control's visible label. Required — no default (FR-001, FR-017).
 * - `confirm-variant`/`confirmVariant`: The confirm control's `.sk-button` tone (`primary`, `secondary` or `ghost`). Omit for
 * the unstyled base button. The element never infers or applies a tone itself (FR-004) —
 * this is a style choice, not user-visible copy, so it is exempt from the no-defaults rule
 * and may reasonably be left unset by a consumer who wants the base button.
 * - `dialog-title`/`dialogTitle`: The dialog's accessible name. Required — no default (FR-001, FR-017). Omitting it warns
 * and renders the title node with no text.
 * - `initial-focus`/`initialFocus`: Which control receives focus when the dialog opens: `'confirm'` or `'cancel'`.
 * Defaults to `'cancel'`, the safe default for a destructive confirmation (FR-008). An
 * unknown value warns and falls back to `'cancel'`.
 * - `message`: The dialog's accessible description. Required — no default (FR-001, FR-017). Long
 * values scroll independently of the action row (FR-010).
 * - `open`: Reflects the dialog's real open/closed state (ADR-11 SC-005). Read-only in practice —
 * set by the element itself from `showModal()` and the native `close` event — a consumer
 * should not assign it directly to open or close the dialog; call `showModal()` and the
 * dialog's own `close()` instead.
 *
 * ## Methods
 *
 * Methods that can be called to access component functionality.
 *
 * - `showModal(invoker?: HTMLElement) => void`: Opens the dialog as a native modal (FR-013). Equivalent to calling `showModal()` on the
 * rendered `<dialog>` directly (reachable via `shadowRoot.querySelector('[part="dialog"]')`
 * — the same node `::part(dialog)` targets from outside), except that it also records
 * `invoker` (or `document.activeElement`, if omitted) as the element focus returns to when
 * the dialog closes (FR-009), and it resets `returnValue` to `'cancel'` before opening so an
 * unset close can never be read back as a confirmation (FR-007).
 *
 * ## CSS Parts
 *
 * Custom selectors for styling elements within the component.
 *
 * - `actions`: The footer row holding the cancel and confirm controls. Never scrolls.
 * - `body`: The message region. Scrolls independently when its content overflows (FR-010); its text is the dialog's accessible description.
 * - `cancel`: The cancel control.
 * - `confirm`: The confirm control. Composes `.sk-button`; set `confirm-variant` to choose its tone — the element never infers or applies one (FR-004).
 * - `dialog`: The native `<dialog>` itself; the root surface, and the consumer's own access point for the platform's `close`/`returnValue` contract.
 * - `title`: The heading node. Its text is the dialog's accessible name.
 */
export const SkConfirmDialog: React.ForwardRefExoticComponent<SkConfirmDialogProps>;
