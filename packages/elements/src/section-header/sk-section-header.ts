import { LitElement, html } from 'lit';
import { define } from '../define.js';
import sheet from './sk-section-header.css.js';

/**
 * A presentational section heading whose outline level and supporting content are consumer-owned.
 *
 * Token dependencies: --sk-fg-default, --sk-fg-muted, --sk-font-display, --sk-font-mono,
 * --sk-font-sans, --sk-space-2, --sk-space-6, --sk-text-sm, --sk-text-xl, --sk-text-xs,
 * --sk-weight-medium, --sk-weight-semibold.
 *
 * @element sk-section-header
 * @slot eyebrow - Optional lead-in content.
 * @slot title - A consumer-authored native heading.
 * @slot description - Optional supporting description.
 * @slot metadata - Optional count or metadata.
 * @slot action - Optional trailing action.
 * @csspart header - The section-header layout root.
 * @csspart eyebrow - The eyebrow slot wrapper.
 * @csspart title - The native-heading slot wrapper.
 * @csspart description - The description slot wrapper.
 * @csspart metadata - The metadata slot wrapper.
 * @csspart action - The action slot wrapper.
 */
export class SkSectionHeader extends LitElement {
  static styles = [sheet];

  #syncSlot(slot: HTMLSlotElement): void {
    const hasContent = slot.assignedNodes({ flatten: true }).some(
      (node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent?.trim().length ?? 0) > 0,
    );
    slot.parentElement?.toggleAttribute('hidden', !hasContent);
  }

  protected firstUpdated(): void {
    for (const slot of Array.from(this.renderRoot.querySelectorAll<HTMLSlotElement>('slot'))) {
      this.#syncSlot(slot);
    }
  }

  render() {
    return html`<div part="header" class="sk-section-header">
      <div part="eyebrow" class="sk-section-header__eyebrow" hidden><slot name="eyebrow" @slotchange=${(event: Event) => this.#syncSlot(event.currentTarget as HTMLSlotElement)}></slot></div>
      <div part="title" class="sk-section-header__title" hidden><slot name="title" @slotchange=${(event: Event) => this.#syncSlot(event.currentTarget as HTMLSlotElement)}></slot></div>
      <div part="description" class="sk-section-header__description" hidden><slot name="description" @slotchange=${(event: Event) => this.#syncSlot(event.currentTarget as HTMLSlotElement)}></slot></div>
      <div part="metadata" class="sk-section-header__metadata" hidden><slot name="metadata" @slotchange=${(event: Event) => this.#syncSlot(event.currentTarget as HTMLSlotElement)}></slot></div>
      <div part="action" class="sk-section-header__action" hidden><slot name="action" @slotchange=${(event: Event) => this.#syncSlot(event.currentTarget as HTMLSlotElement)}></slot></div>
    </div>`;
  }
}

define('sk-section-header', SkSectionHeader);
