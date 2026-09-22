import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { define } from '../define.js';
import '../metric/sk-metric.js';
import skEvidenceChainSheet from './sk-evidence-chain.css.js';

export type EvidenceStage = Readonly<{
  id: string;
  label: string;
  displayValue: string;
  annotation?: string;
  tone?: 'neutral' | 'info' | 'success' | 'attention';
}>;

const EVIDENCE_TONES = Object.freeze(['neutral', 'info', 'success', 'attention'] as const);

const isRequiredText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isEvidenceTone = (
  value: unknown,
): value is 'neutral' | 'info' | 'success' | 'attention' =>
  typeof value === 'string' && EVIDENCE_TONES.includes(
    value as 'neutral' | 'info' | 'success' | 'attention',
  );

const validatedStages = (value: unknown): ReadonlyArray<EvidenceStage> | null => {
  if (!Array.isArray(value)) return null;

  const ids = new Set<string>();
  try {
    if (value.length === 0) return null;
    for (const stage of value) {
      if (stage === null || typeof stage !== 'object' || Array.isArray(stage)) return null;
      const candidate = stage as {
        id?: unknown;
        label?: unknown;
        displayValue?: unknown;
        annotation?: unknown;
        tone?: unknown;
      };
      if (
        !isRequiredText(candidate.id) ||
        !isRequiredText(candidate.label) ||
        !isRequiredText(candidate.displayValue) ||
        (candidate.annotation !== undefined && typeof candidate.annotation !== 'string') ||
        (candidate.tone !== undefined && !isEvidenceTone(candidate.tone)) ||
        ids.has(candidate.id)
      ) {
        return null;
      }
      ids.add(candidate.id);
    }
  } catch {
    return null;
  }

  return value as ReadonlyArray<EvidenceStage>;
};

/**
 * An ordered chain of generic evidence stages composed from real `sk-metric` elements.
 *
 * The consumer owns stage order, identity, display formatting, and domain meaning. Valid supplied
 * strings and object references are preserved; invalid whole inputs fail closed.
 *
 * Token dependencies: --sk-border-strong, --sk-border-width-1, --sk-border-width-2,
 * --sk-fg-muted, --sk-fg-subtle, --sk-font-mono, --sk-font-sans, --sk-space-1,
 * --sk-space-2, --sk-space-3, --sk-space-4, --sk-space-10, --sk-text-sm,
 * --sk-text-xs.
 *
 * @element sk-evidence-chain
 * @csspart list - The native ordered list containing the evidence stages.
 * @csspart stage - An individual evidence stage list item.
 * @csspart connector - A decorative connector between adjacent stages.
 * @csspart empty-state - The status shown for empty or invalid whole input.
 */
export class SkEvidenceChain extends LitElement {
  static styles = [skEvidenceChainSheet];

  static properties = {
    stages: { attribute: false },
  };

  /** Ordered consumer-supplied stages, assigned as a JavaScript property. Assign a new array
   *  reference after changing the collection. Defaults to a frozen empty array. */
  stages: ReadonlyArray<
    Readonly<{
      id: string;
      label: string;
      displayValue: string;
      annotation?: string;
      tone?: 'neutral' | 'info' | 'success' | 'attention';
    }>
  > = Object.freeze([]);

  render() {
    const stages = validatedStages(this.stages);
    if (stages === null) {
      return html`<p part="empty-state" class="sk-evidence-chain__empty" role="status">No evidence available.</p>`;
    }

    return html`<ol part="list" class="sk-evidence-chain__list">
      ${repeat(
        stages,
        (stage) => stage.id,
        (stage, index) => html`<li part="stage" class="sk-evidence-chain__stage">
          <sk-metric
            class="sk-evidence-chain__metric"
            compact
            .label=${stage.label}
            .displayValue=${stage.displayValue}
            .annotation=${stage.annotation ?? ''}
            .tone=${stage.tone ?? 'neutral'}
          ></sk-metric>
          ${index < stages.length - 1
            ? html`<span
                part="connector"
                class="sk-evidence-chain__connector"
                aria-hidden="true"
              ></span>`
            : nothing}
        </li>`,
      )}
    </ol>`;
  }
}

define('sk-evidence-chain', SkEvidenceChain);
