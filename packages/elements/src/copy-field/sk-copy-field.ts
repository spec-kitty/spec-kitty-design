import { LitElement, html } from 'lit';
import { buttonClasses } from '../button/sk-button.markup.js';
import buttonSheet from '../button/sk-button.css.js';
import { define } from '../define.js';
import sheet from './sk-copy-field.css.js';

export type CopyFieldOutcome = 'copied' | 'manual' | 'failed';

export interface SkCopyFieldResultDetail {
  readonly outcome: CopyFieldOutcome;
}

const DEFAULT_LABEL = 'Copy value';
const DEFAULT_SUCCESS_MESSAGE = 'Value copied.';
const DEFAULT_MANUAL_MESSAGE =
  'Value selected. Use your system copy shortcut to copy it.';
const DEFAULT_FAILURE_MESSAGE = 'Unable to copy or select the value.';

const nonBlankOr = (value: string | null | undefined, fallback: string): string =>
  typeof value === 'string' && value.trim() !== '' ? value : fallback;

const stringWithDefault = (fallback: string) => ({
  fromAttribute: (value: string | null): string => value ?? fallback,
  toAttribute: (value: string): string => value,
});

/**
 * A non-editable exact-value field with a single native copy control and truthful inline results.
 *
 * The displayed string is the string sent to the Clipboard API. When clipboard access is not
 * available, the visible code is focused and selected for a manual system copy shortcut. The
 * component never executes, parses, validates, logs, or includes the value in its result event.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-width-1,
 * --sk-border-width-2, --sk-fg-body, --sk-fg-muted, --sk-font-mono, --sk-font-sans,
 * --sk-radius-md, --sk-space-2, --sk-space-3, --sk-surface-input, --sk-text-sm.
 *
 * @element sk-copy-field
 * @csspart field - Immediate bordered value, action, and status composition.
 * @csspart value - Exact visible non-editable value and manual-selection target.
 * @csspart copy-control - Native copy button.
 * @csspart status - Stable polite result region.
 * @fires {CustomEvent<SkCopyFieldResultDetail>} sk-copy-field-result - Reports only copied, manual, or failed. The event bubbles, is composed, and is not cancelable.
 */
export class SkCopyField extends LitElement {
  static styles = [buttonSheet, sheet];

  static properties = {
    value: { type: String, converter: stringWithDefault(''), reflect: true, noAccessor: true },
    label: {
      type: String,
      reflect: true,
      noAccessor: true,
    },
    successMessage: {
      type: String,
      converter: stringWithDefault(DEFAULT_SUCCESS_MESSAGE),
      attribute: 'success-message',
      noAccessor: true,
    },
    manualMessage: {
      type: String,
      converter: stringWithDefault(DEFAULT_MANUAL_MESSAGE),
      attribute: 'manual-message',
      noAccessor: true,
    },
    failureMessage: {
      type: String,
      converter: stringWithDefault(DEFAULT_FAILURE_MESSAGE),
      attribute: 'failure-message',
      noAccessor: true,
    },
  };

  #value = '';
  #label = DEFAULT_LABEL;
  #hasConsumerLabel = false;
  #successMessage = DEFAULT_SUCCESS_MESSAGE;
  #manualMessage = DEFAULT_MANUAL_MESSAGE;
  #failureMessage = DEFAULT_FAILURE_MESSAGE;
  #revision = 0;
  #outcome: CopyFieldOutcome | undefined;
  #warnedInvalidLabel: string | undefined;

  /** Exact text displayed and offered for copying. The empty string disables the control. */
  get value(): string {
    return this.#value;
  }

  set value(next: string | null | undefined) {
    const normalized = next ?? '';
    const previous = this.#value;
    if (normalized === previous) return;
    this.#value = normalized;
    this.#revision += 1;
    this.#outcome = undefined;
    const status = this.shadowRoot?.querySelector<HTMLElement>('.sk-copy-field__status');
    if (status) status.textContent = '';
    this.requestUpdate('value', previous);
  }

  /** Accessible name for the native copy control. Blank values warn and use `Copy value`. */
  get label(): string {
    return this.#label;
  }

  set label(next: string | null | undefined) {
    const hasConsumerLabel = next !== null && next !== undefined;
    const normalized = next ?? DEFAULT_LABEL;
    const previous = this.#label;
    if (normalized === previous && hasConsumerLabel === this.#hasConsumerLabel) return;
    this.#label = normalized;
    this.#hasConsumerLabel = hasConsumerLabel;
    this.requestUpdate('label', previous);
  }

  /** Message shown after the Clipboard API fulfills. Blank values use the default. */
  get successMessage(): string {
    return this.#successMessage;
  }

  set successMessage(next: string | null | undefined) {
    const normalized = next ?? DEFAULT_SUCCESS_MESSAGE;
    const previous = this.#successMessage;
    if (normalized === previous) return;
    this.#successMessage = normalized;
    this.requestUpdate('successMessage', previous);
  }

  /** Message shown when the visible value was selected for manual copying. */
  get manualMessage(): string {
    return this.#manualMessage;
  }

  set manualMessage(next: string | null | undefined) {
    const normalized = next ?? DEFAULT_MANUAL_MESSAGE;
    const previous = this.#manualMessage;
    if (normalized === previous) return;
    this.#manualMessage = normalized;
    this.requestUpdate('manualMessage', previous);
  }

  /** Message shown when neither copying nor exact selection succeeded. */
  get failureMessage(): string {
    return this.#failureMessage;
  }

  set failureMessage(next: string | null | undefined) {
    const normalized = next ?? DEFAULT_FAILURE_MESSAGE;
    const previous = this.#failureMessage;
    if (normalized === previous) return;
    this.#failureMessage = normalized;
    this.requestUpdate('failureMessage', previous);
  }

  #resolvedLabel(): string {
    if (this.#hasConsumerLabel && this.label.trim() !== '') {
      this.#warnedInvalidLabel = undefined;
      return this.label;
    }
    const invalidLabel = this.#hasConsumerLabel ? `blank:${this.label}` : 'missing';
    if (this.#warnedInvalidLabel !== invalidLabel) {
      console.warn('sk-copy-field: label is missing or blank; using "Copy value".');
      this.#warnedInvalidLabel = invalidLabel;
    }
    return DEFAULT_LABEL;
  }

  #selectVisibleValue(snapshot: string): boolean {
    try {
      const node = this.shadowRoot?.querySelector<HTMLElement>('[part="value"]');
      const selection = globalThis.getSelection?.();
      if (!node || !selection) return false;
      node.focus({ preventScroll: true });
      selection.setBaseAndExtent(node, 0, node, node.childNodes.length);
      return this.shadowRoot?.activeElement === node && selection.toString() === snapshot;
    } catch {
      return false;
    }
  }

  #finish(outcome: CopyFieldOutcome, snapshot: string, revision: number): void {
    const detail = Object.freeze({ outcome }) satisfies SkCopyFieldResultDetail;
    const event = new CustomEvent<SkCopyFieldResultDetail>('sk-copy-field-result', {
      detail,
      bubbles: true,
      composed: true,
      cancelable: false,
    });
    this.dispatchEvent(event);
    if (this.#revision === revision && this.value === snapshot) {
      this.#outcome = outcome;
      const status = this.shadowRoot?.querySelector<HTMLElement>('.sk-copy-field__status');
      if (status) status.textContent = this.#statusMessage();
    }
  }

  async #copyValue(): Promise<void> {
    const snapshot = this.value;
    if (snapshot === '') return;
    const revision = this.#revision;
    let outcome: CopyFieldOutcome | undefined;

    if (globalThis.isSecureContext) {
      try {
        const clipboard = navigator.clipboard;
        const writeText = clipboard?.writeText;
        if (typeof writeText === 'function') {
          await writeText.call(clipboard, snapshot);
          outcome = 'copied';
        }
      } catch {
        // Clipboard denial and synchronous API failures use the selection fallback below.
      }
    }

    if (outcome === undefined) {
      await Promise.resolve();
      outcome = this.#revision === revision && this.value === snapshot
        ? (this.#selectVisibleValue(snapshot) ? 'manual' : 'failed')
        : 'failed';
    }
    this.#finish(outcome, snapshot, revision);
  }

  #statusMessage(): string {
    switch (this.#outcome) {
      case 'copied':
        return nonBlankOr(this.successMessage, DEFAULT_SUCCESS_MESSAGE);
      case 'manual':
        return nonBlankOr(this.manualMessage, DEFAULT_MANUAL_MESSAGE);
      case 'failed':
        return nonBlankOr(this.failureMessage, DEFAULT_FAILURE_MESSAGE);
      default:
        return '';
    }
  }

  protected updated(): void {
    const status = this.shadowRoot?.querySelector<HTMLElement>('.sk-copy-field__status');
    if (status) status.textContent = this.#statusMessage();
  }

  render() {
    return html`<div part="field" class="sk-copy-field">
      <code part="value" class="sk-copy-field__value" tabindex="-1">${this.value}</code>
      <button
        part="copy-control"
        class=${buttonClasses('secondary', 'sm')}
        type="button"
        aria-label=${this.#resolvedLabel()}
        ?disabled=${this.value === ''}
        @click=${this.#copyValue}
      >Copy</button>
      <span
        part="status"
        class="sk-copy-field__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      ></span>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sk-copy-field': SkCopyField;
  }

  interface GlobalEventHandlersEventMap {
    'sk-copy-field-result': CustomEvent<SkCopyFieldResultDetail>;
  }
}

define('sk-copy-field', SkCopyField);
