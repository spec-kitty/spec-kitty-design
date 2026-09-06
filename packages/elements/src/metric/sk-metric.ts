import { LitElement, html, nothing } from 'lit';
import { define } from '../define.js';
import '../pill-tag/sk-pill-tag.js';
import skMetricSheet from './sk-metric.css.js';

const METRIC_TONES = Object.freeze(['neutral', 'info', 'success', 'attention'] as const);
const PILL_VARIANTS = Object.freeze({
  neutral: undefined,
  info: 'purple',
  success: 'green',
  attention: 'yellow',
} as const);

const isRequiredText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isMetricTone = (
  value: unknown,
): value is 'neutral' | 'info' | 'success' | 'attention' =>
  typeof value === 'string' && METRIC_TONES.includes(
    value as 'neutral' | 'info' | 'success' | 'attention',
  );

/**
 * A generic supplied label and opaque display value with optional supporting annotation.
 *
 * The consumer owns all formatting and domain meaning. This element preserves valid strings
 * exactly and contributes a native definition relationship, not a section heading.
 *
 * Token dependencies: --sk-border-default, --sk-border-width-2, --sk-color-blue,
 * --sk-color-green, --sk-color-yellow, --sk-fg-default, --sk-fg-muted, --sk-font-mono,
 * --sk-font-sans, --sk-space-1, --sk-space-2, --sk-space-3, --sk-space-4,
 * --sk-text-2xl, --sk-text-sm, --sk-text-xl, --sk-weight-bold, --sk-weight-semibold.
 *
 * @element sk-metric
 * @csspart metric - The native definition-list metric container.
 * @csspart label - The supplied metric label.
 * @csspart value - The supplied opaque display value.
 * @csspart annotation - The optional supporting annotation container.
 * @csspart empty-state - The status shown when required content or tone is invalid.
 */
export class SkMetric extends LitElement {
  static styles = [skMetricSheet];

  static properties = {
    label: { type: String },
    displayValue: { type: String, attribute: 'display-value' },
    annotation: { type: String },
    tone: { type: String, reflect: true },
    compact: { type: Boolean, reflect: true },
  };

  /** Required consumer-supplied label, preserved exactly. Defaults to `''`; blank values render
   *  the unavailable state. */
  label = '';

  /** Required opaque, preformatted display text, preserved exactly. Defaults to `''`; the
   *  element never parses or rewrites it. */
  displayValue = '';

  /** Optional supporting text, preserved exactly. Defaults to `''`; the annotation container is
   *  omitted when this is empty. */
  annotation = '';

  /** Generic presentation tone: `neutral` (the default), `info`, `success`, or `attention`.
   *  Unsupported runtime values render the unavailable state. */
  tone: 'neutral' | 'info' | 'success' | 'attention' = 'neutral';

  /** Uses compact visual density when true, without changing content or semantics. Defaults to
   *  `false`. */
  compact = false;

  render() {
    if (
      !isRequiredText(this.label) ||
      !isRequiredText(this.displayValue) ||
      typeof this.annotation !== 'string' ||
      !isMetricTone(this.tone)
    ) {
      return html`<p part="empty-state" class="sk-metric__empty" role="status">Metric unavailable.</p>`;
    }

    const pillVariant = PILL_VARIANTS[this.tone];
    return html`<dl part="metric" class="sk-metric sk-metric--${this.tone}">
      <dt part="label" class="sk-metric__label">${this.label}</dt>
      <dd class="sk-metric__content">
        <span part="value" class="sk-metric__value">${this.displayValue}</span>
        ${this.annotation === '' ? nothing : html`<span part="annotation" class="sk-metric__annotation">
          <sk-pill-tag variant=${pillVariant ?? nothing}>${this.annotation}</sk-pill-tag>
        </span>`}
      </dd>
    </dl>`;
  }
}

define('sk-metric', SkMetric);
