import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { define } from '../define.js';
import sheet from './sk-app-shell.css.js';

/** The app-shell layout presentation. Omit it to retain the legacy shell. */
export type SkAppShellPresentation = 'compact' | undefined;

/** Detail carried by `sk-app-shell-dismiss`. */
export interface SkAppShellDismissDetail {
  /** The interaction that requested dismissal. */
  readonly reason: 'escape';
}

const COMPACT_MAX_INLINE_SIZE = 860;

type ExposureRegion =
  | 'personal-rail'
  | 'context-sidebar'
  | 'compact-header'
  | 'compact-navigation';

interface ConsumerExposure {
  readonly inert: string | null;
  readonly ariaHidden: string | null;
}

interface AssignedRootExposureLease {
  readonly owner: SkAppShell;
  readonly exposure: ConsumerExposure;
}

const assignedRootExposureLeases = new WeakMap<Element, AssignedRootExposureLease>();
const claimedEscapeInteractions = new WeakSet<KeyboardEvent>();

const presentationConverter = {
  // The public omission state is `undefined`; Lit's default String converter returns `null`
  // when a native attribute is removed. Reflection in the property-to-attribute direction keeps
  // using Lit's default converter because no custom `toAttribute` arm is declared here.
  fromAttribute(value: string | null): string | undefined {
    return value ?? undefined;
  },
};

/**
 * A stateless page frame for personal navigation, contextual navigation, page heading, and content.
 *
 * Token dependencies: --sk-border-default, --sk-border-focus, --sk-border-strong,
 * --sk-border-width-1, --sk-border-width-2, --sk-layout-context-sidebar-width,
 * --sk-layout-personal-rail-width, --sk-space-3, --sk-space-4, --sk-space-12,
 * --sk-surface-card.
 *
 * @element sk-app-shell
 * @slot personal-rail - Consumer-owned personal or application navigation.
 * @slot context-sidebar - Consumer-owned navigation or content for the selected context.
 * @slot compact-header - Consumer-owned compact identity and trigger, directly assigned or wrapped by a directly assigned light-DOM element.
 * @slot compact-navigation - Consumer-owned navigation target, directly assigned or wrapped by a directly assigned light-DOM element; its id and accessible label stay consumer-owned.
 * @slot page-header - Consumer-owned page title, supporting text, metadata, and actions.
 * @slot - Consumer-owned main page content.
 * @csspart shell - The complete responsive shell grid.
 * @csspart personal - The personal-navigation column.
 * @csspart context - The contextual-navigation column.
 * @csspart compact-header - The compact identity and trigger row.
 * @csspart compact-navigation - The bounded compact navigation drawer.
 * @csspart content - The page header and main-content column.
 * @csspart header - The page-header region.
 * @csspart main - The main-content landmark.
 * @fires {CustomEvent<{ readonly reason: 'escape' }>} sk-app-shell-dismiss - Requests dismissal after Escape while the controlled compact drawer is effectively open. Detail is `{ reason: 'escape' }`; the event bubbles, is composed, and is not cancelable.
 */
export class SkAppShell extends LitElement {
  static styles = [sheet];

  static properties = {
    presentation: { type: String, reflect: true, converter: presentationConverter },
    open: { type: Boolean, reflect: true },
    compactTrigger: { attribute: false },
  };

  // Keep the public class declaration on the exported alias while giving manifest-driven
  // consumers the self-contained union they can emit without manufacturing an import.
  /**
   * @type {'compact' | undefined}
   * Enables the opt-in compact layout. Omit it for the legacy responsive shell.
   */
  declare presentation: SkAppShellPresentation;

  /** Consumer-controlled compact drawer state. The shell never changes this value. */
  open = false;

  /** Consumer trigger used only for accepted-Escape focus return. It must be actually assigned within this shell's compact-header slot and control a same-root target actually assigned within this shell's compact-navigation slot. */
  compactTrigger: HTMLElement | null = null;

  #inlineSize = Number.POSITIVE_INFINITY;
  #resizeObserver: ResizeObserver | null = null;
  #pendingDismissal: { accepted: boolean; trigger: HTMLElement | null } | null = null;
  #suppressedRoots = new Set<Element>();

  get #compact(): boolean {
    return this.presentation === 'compact' && this.#inlineSize <= COMPACT_MAX_INLINE_SIZE;
  }

  get #effectivelyOpen(): boolean {
    return this.#compact && this.open;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.#onKeydown);
    this.#resizeObserver = new ResizeObserver((entries) => {
      const previousCompact = this.#compact;
      const entry = entries[entries.length - 1];
      if (!entry) return;
      this.#inlineSize = this.#contentInlineSize(entry);
      const compact = this.#compact;
      if (previousCompact && !compact) this.#releaseHiddenFocus();
      if (previousCompact !== compact) this.requestUpdate();
    });
    this.#inlineSize = this.#contentInlineSize();
    this.#resizeObserver.observe(this, { box: 'content-box' });
    if (this.hasUpdated) this.#reconcileAssignedRootExposure();
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this.#onKeydown);
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#pendingDismissal = null;
    this.#restoreSuppressedRoots();
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.get('open') === true && this.open !== true) {
      this.#releaseHiddenFocus();
    }
    if (changed.get('presentation') === 'compact' && this.presentation !== 'compact') {
      this.#releaseHiddenFocus();
    }
    if (!changed.has('presentation')) return;
    const previousPresentation = changed.get('presentation');
    if (
      this.presentation !== undefined &&
      this.presentation !== 'compact' &&
      this.presentation !== previousPresentation
    ) {
      console.warn(
        `unknown sk-app-shell presentation "${String(this.presentation)}"; using legacy layout`,
      );
    }
  }

  protected override updated(): void {
    this.#reconcileAssignedRootExposure();
  }

  #restoreAttribute(root: Element, name: string, value: string | null): void {
    if (value === null) root.removeAttribute(name);
    else root.setAttribute(name, value);
  }

  #restoreSuppressedRoots(): void {
    for (const root of this.#suppressedRoots) {
      const lease = assignedRootExposureLeases.get(root);
      if (lease?.owner !== this) continue;
      this.#restoreAttribute(root, 'inert', lease.exposure.inert);
      this.#restoreAttribute(root, 'aria-hidden', lease.exposure.ariaHidden);
      assignedRootExposureLeases.delete(root);
    }
    this.#suppressedRoots.clear();
  }

  #suppressAssignedRoots(slotName: ExposureRegion): void {
    const slot = this.shadowRoot!.querySelector<HTMLSlotElement>(`slot[name="${slotName}"]`)!;
    for (const root of slot.assignedElements()) {
      const lease = assignedRootExposureLeases.get(root);
      const exposure = lease?.exposure ?? {
        inert: root.getAttribute('inert'),
        ariaHidden: root.getAttribute('aria-hidden'),
      };
      assignedRootExposureLeases.set(root, { owner: this, exposure });
      this.#suppressedRoots.add(root);
      root.setAttribute('inert', '');
      root.setAttribute('aria-hidden', 'true');
    }
  }

  #releaseAssignedRoots(slotName: ExposureRegion): void {
    const slot = this.shadowRoot!.querySelector<HTMLSlotElement>(`slot[name="${slotName}"]`)!;
    for (const root of slot.assignedElements()) {
      const lease = assignedRootExposureLeases.get(root);
      if (!lease) continue;
      lease.owner.#suppressedRoots.delete(root);
      this.#restoreAttribute(root, 'inert', lease.exposure.inert);
      this.#restoreAttribute(root, 'aria-hidden', lease.exposure.ariaHidden);
      assignedRootExposureLeases.delete(root);
    }
  }

  #reconcileAssignedRootExposure(): void {
    this.#restoreSuppressedRoots();
    if (!this.isConnected) return;

    const compact = this.#compact;
    const regions: ReadonlyArray<readonly [ExposureRegion, boolean]> = [
      ['personal-rail', !compact],
      ['context-sidebar', !compact],
      ['compact-header', compact],
      ['compact-navigation', this.#effectivelyOpen],
    ];
    for (const [slotName, active] of regions) {
      if (active) this.#releaseAssignedRoots(slotName);
      else this.#suppressAssignedRoots(slotName);
    }
  }

  #onExposureSlotChange = (): void => {
    this.#reconcileAssignedRootExposure();
  };

  #releaseHiddenFocus(): void {
    const active = this.getRootNode() instanceof Document
      ? this.ownerDocument.activeElement
      : (this.getRootNode() as ShadowRoot).activeElement;
    if (active instanceof HTMLElement && this.#assignedWithin(active, 'compact-navigation')) {
      active.blur();
    }
  }

  #contentInlineSize(entry?: ResizeObserverEntry): number {
    if (entry) {
      const sizes = entry.contentBoxSize as unknown as
        | ResizeObserverSize
        | readonly ResizeObserverSize[];
      const size = Array.isArray(sizes) ? sizes[0] : sizes;
      if (size && Number.isFinite(size.inlineSize)) return size.inlineSize;
      const writingMode = getComputedStyle(this).writingMode;
      return writingMode.startsWith('vertical') || writingMode.startsWith('sideways')
        ? entry.contentRect.height
        : entry.contentRect.width;
    }

    const style = getComputedStyle(this);
    const vertical = style.writingMode.startsWith('vertical') || style.writingMode.startsWith('sideways');
    const clientInlineSize = vertical ? this.clientHeight : this.clientWidth;
    const paddingStart = Number.parseFloat(style.paddingInlineStart) || 0;
    const paddingEnd = Number.parseFloat(style.paddingInlineEnd) || 0;
    return Math.max(0, clientInlineSize - paddingStart - paddingEnd);
  }

  #assignedWithin(node: Element, slotName: 'compact-header' | 'compact-navigation'): boolean {
    const expectedSlot = this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="${slotName}"]`);
    if (!expectedSlot || !this.contains(node)) return false;
    for (let current: Element | null = node; current && current !== this; current = current.parentElement) {
      if (current.assignedSlot) return current.assignedSlot === expectedSlot;
    }
    return false;
  }

  #validFocusTrigger(trigger: HTMLElement | null): trigger is HTMLElement {
    if (!trigger?.isConnected || !this.#assignedWithin(trigger, 'compact-header')) return false;
    const controlledId = trigger.getAttribute('aria-controls');
    if (!controlledId) return false;
    const root = trigger.getRootNode();
    const target = root instanceof Document || root instanceof ShadowRoot
      ? root.getElementById(controlledId)
      : null;
    return Boolean(
      target &&
      target.getRootNode() === root &&
      this.#assignedWithin(target, 'compact-navigation'),
    );
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.#effectivelyOpen) return;
    if (claimedEscapeInteractions.has(event)) return;
    claimedEscapeInteractions.add(event);
    this.#pendingDismissal = { accepted: false, trigger: this.compactTrigger };
    this.dispatchEvent(
      new CustomEvent<SkAppShellDismissDetail>('sk-app-shell-dismiss', {
        detail: Object.freeze({ reason: 'escape' }),
        bubbles: true,
        composed: true,
        cancelable: false,
      }),
    );
    const pending = this.#pendingDismissal;
    if (!pending) return;
    queueMicrotask(() => {
      pending.accepted = this.open !== true;
      void this.#finishDismissal(pending);
    });
  };

  async #finishDismissal(
    pending: { accepted: boolean; trigger: HTMLElement | null },
  ): Promise<void> {
    await this.updateComplete;
    if (this.#pendingDismissal !== pending) return;
    this.#pendingDismissal = null;
    if (pending.accepted && !this.#effectivelyOpen && this.#validFocusTrigger(pending.trigger)) {
      pending.trigger.focus();
    }
  }

  render() {
    const effectivelyOpen = this.#effectivelyOpen;
    return html`<div part="shell" class="sk-app-shell">
      <div part="personal" class="sk-app-shell__personal">
        <slot name="personal-rail" @slotchange=${this.#onExposureSlotChange}></slot>
      </div>
      <div part="context" class="sk-app-shell__context">
        <slot name="context-sidebar" @slotchange=${this.#onExposureSlotChange}></slot>
      </div>
      <div part="compact-header" class="sk-app-shell__compact-header">
        <slot name="compact-header" @slotchange=${this.#onExposureSlotChange}></slot>
      </div>
      <div
        part="compact-navigation"
        class="sk-app-shell__compact-navigation"
        ?hidden=${!effectivelyOpen}
        ?inert=${!effectivelyOpen}
        aria-hidden=${effectivelyOpen ? 'false' : 'true'}
      >
        <slot name="compact-navigation" @slotchange=${this.#onExposureSlotChange}></slot>
      </div>
      <div part="content" class="sk-app-shell__content">
        <div part="header" class="sk-app-shell__header">
          <slot name="page-header"></slot>
        </div>
        <main part="main" class="sk-app-shell__main"><slot></slot></main>
      </div>
    </div>`;
  }
}

define('sk-app-shell', SkAppShell);
