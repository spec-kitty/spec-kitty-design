/**
 * THE COMPOSITION FIXTURE FOR #183's LAST EXIT CRITERION (#259).
 *
 * > A composition fixture demonstrates that the [operational dashboard] patterns can be
 * > assembled from public surfaces without private shadow-root reach-through or duplicated
 * > component CSS.
 *
 * Four shapes, assembled from the six closed children of #183 and nothing else:
 *
 *   * an operational page header            sk-page-header[density=compact][sticky]   (#182)
 *   * a live status / alert region          sk-notice[announce]                       (#178)
 *   * toned status cards carrying a fact
 *     block and collapsible detail          sk-card[status] + .sk-facts/.sk-disclosure (#177/#176)
 *                                           + sk-status-indicator                      (#146)
 *   * a gap-aware time series               sk-time-series-chart                       (#179)
 *
 * WHY THIS IS A MODULE AND NOT ONLY A STORY. `team-overview.stories.ts`, the one existing
 * pattern fixture, carries six ratcheted story ids and no behaviour test. A story id proves a
 * story EXISTS; it proves nothing about whether the composition still works. This module is
 * imported by BOTH `operational-status.stories.ts` (visual, a11y, LightMode, narrow) and
 * `fixtures/elements-behaviour/src/pattern-operational-status.test.ts` (slot assignment, list
 * semantics across the slot boundary, native disclosure state, the published gap literal), and
 * `mutations.json` carries a red-first arm against it. One artefact, three consumers, so the
 * evidence cannot drift into three descriptions of three different things.
 *
 * PUBLIC SURFACES ONLY, and the rule is enforced rather than asserted:
 * `scripts/check-pattern-composition.mjs` rejects `.shadowRoot`, `attachShadow(`, `::shadow`,
 * `/deep/` and `>>>`; rejects a `::part()` that `expected-parts.json` does not record for that
 * element; and rejects any inline-`<style>` selector that writes rules for a class a
 * `packages/styles` sheet owns. That gate exists because NOTHING covered either claim — see
 * #259 for the planted-violation measurement against `check-adopted-css-boundaries.mjs`.
 *
 * THE `<dl>` AND `<details>` ARE IN LIGHT DOM, assigned to the card's default slot, exactly as
 * #177's own composition story establishes: a shadow root between a `<dl>` and its `<dt>`/`<dd>`
 * severs the list, and `<details>` open state is UA-owned. Their CSS is loaded by the Storybook
 * preview — `packages/elements` may not import a stylesheet (ADR-10 §1) and `packages/styles`
 * may not import an element, so `scope:storybook` is the only layer that can see both.
 *
 * VOCABULARY. #183 criterion 4 forbids consumer-specific role, failure, queue, signal,
 * authentication and refresh vocabulary in public contracts, and puts consumer adoption out of
 * scope entirely. So this fixture demonstrates the SHAPES in generic operational terms and names
 * no consumer domain. It is evidence about the library's surfaces; naming a consumer would make
 * it evidence about that consumer instead.
 */
import { html, nothing, type TemplateResult } from 'lit';
import '../card/sk-card.js';
import '../notice/sk-notice.js';
import '../page-header/sk-page-header.js';
import '../status-indicator/sk-status-indicator.js';
import '../time-series-chart/sk-time-series-chart.js';
import type { TimeSeriesDatum } from '../time-series-chart/sk-time-series-chart.js';

/** One operational tone from the library's own public enum. The fixture invents none. */
export type OperationalTone = 'neutral' | 'info' | 'success' | 'attention' | 'danger' | 'recovery';

export type OperationalFact = Readonly<{ term: string; value: string }>;

export type OperationalUnit = Readonly<{
  id: string;
  name: string;
  tone: OperationalTone;
  marker: string;
  state: string;
  facts: ReadonlyArray<OperationalFact>;
  detail: string;
}>;

export type OperationalModel = Readonly<{
  eyebrow: string;
  title: string;
  supporting: string;
  updated: string;
  actionLabel: string;
  banner: Readonly<{ tone: OperationalTone; heading: string; message: string }> | null;
  units: ReadonlyArray<OperationalUnit>;
  series: ReadonlyArray<TimeSeriesDatum>;
  seriesLabel: string;
  seriesDescription: string;
  gapThreshold: number;
}>;

const HOUR = 3_600_000;
const START = Date.UTC(2026, 8, 7, 6, 0, 0);

/**
 * A no-observation point still has to carry a non-empty `displayValue`.
 *
 * `validateChart` requires `validText(point.displayValue)` of EVERY point, and the chart fails
 * closed on the whole collection if one fails — so `''` takes the entire composition to the
 * labelled unavailable state. The element never RENDERS this string for a null point (it
 * publishes its own "No data" literal instead), so the value is a placeholder by contract.
 * `sk-time-series-chart.stories.ts` spells it the same way; the composition follows the
 * element's own convention rather than inventing a second one.
 */
const UNUSED_DISPLAY_VALUE = 'unused';

const at = (index: number) => START + index * HOUR;
const clock = (index: number) =>
  new Date(at(index)).toISOString().slice(11, 16).concat(' UTC');

/**
 * Two intervals with no observation, deliberately placed.
 *
 * `value: null` is #179's contract for "no observation in this interval" — never zero, never
 * interpolated, and published in the paired table as the literal "No data". The run between
 * 09:00 and 12:00 is three hours wide and so clears `gapThreshold`, which earns it a visible
 * note; the single hour at 15:00 does not, and must not. A composition that only ever showed
 * complete data would be evidence that the chart renders, not that its gap contract survives
 * being composed.
 */
const READINGS: ReadonlyArray<TimeSeriesDatum> = Object.freeze([
  Object.freeze({
    id: 'north',
    name: 'North region',
    points: Object.freeze(
      [62, 64, 61, null, null, 58, 66, 69, null, 71, 73].map((value, index) =>
        Object.freeze({
          id: `north-${index}`,
          at: at(index),
          value,
          displayValue: value === null ? UNUSED_DISPLAY_VALUE : `${value} units`,
          label: clock(index),
          resolution: 'raw' as const,
        }),
      ),
    ),
  }),
  Object.freeze({
    id: 'south',
    name: 'South region',
    points: Object.freeze(
      [48, 47, 50, 52, 51, 53, 55, 54, 56, 58, 57].map((value, index) =>
        Object.freeze({
          id: `south-${index}`,
          at: at(index),
          value,
          displayValue: `${value} units`,
          label: clock(index),
          resolution: 'raw' as const,
        }),
      ),
    ),
  }),
]);

export const OPERATIONAL_MODEL: OperationalModel = Object.freeze({
  eyebrow: 'Operations',
  title: 'Regional service status',
  supporting: 'Every value below is supplied by the application. The library styles none of it.',
  updated: 'Updated 4 minutes ago',
  actionLabel: 'Open runbook',
  banner: Object.freeze({
    tone: 'attention' as const,
    heading: 'One region needs attention',
    message: 'North region has been below its expected range since 09:00 UTC.',
  }),
  units: Object.freeze([
    Object.freeze({
      id: 'north',
      name: 'North region',
      tone: 'attention' as const,
      marker: '▲',
      state: 'Below expected range',
      facts: Object.freeze([
        Object.freeze({ term: 'Owner', value: 'Platform operations' }),
        Object.freeze({ term: 'Since', value: '09:00 UTC' }),
        Object.freeze({ term: 'Capacity', value: '58 of 80 units' }),
      ]),
      detail: 'Two of six nodes are draining. Capacity returns when the drain completes.',
    }),
    Object.freeze({
      id: 'south',
      name: 'South region',
      tone: 'success' as const,
      marker: '●',
      state: 'Within expected range',
      facts: Object.freeze([
        Object.freeze({ term: 'Owner', value: 'Platform operations' }),
        Object.freeze({ term: 'Since', value: '06:00 UTC' }),
        Object.freeze({ term: 'Capacity', value: '57 of 60 units' }),
      ]),
      detail: 'All nodes reporting. No action outstanding.',
    }),
    Object.freeze({
      id: 'west',
      name: 'West region',
      tone: 'recovery' as const,
      marker: '◆',
      state: 'Returning to range',
      facts: Object.freeze([
        Object.freeze({ term: 'Owner', value: 'Regional operations' }),
        Object.freeze({ term: 'Since', value: '11:20 UTC' }),
        Object.freeze({ term: 'Capacity', value: '44 of 60 units' }),
      ]),
      detail: 'Capacity has climbed for three consecutive intervals.',
    }),
  ]),
  series: READINGS,
  seriesLabel: 'Throughput by region',
  seriesDescription: 'Hourly readings. Intervals with no observation are drawn as gaps.',
  gapThreshold: 2 * HOUR,
});

/**
 * LAYOUT SCAFFOLDING ONLY — and that boundary is the point of the second half of the criterion.
 *
 * Every selector here names a class this fixture owns. None writes a rule for a class a
 * `packages/styles` sheet owns, so no component's CSS is restated or overridden here: the cards,
 * the notice, the header, the indicators and the chart carry their own appearance in their own
 * adopted sheets, and this file supplies page grid, gaps and padding and nothing else. That is
 * the rule `scripts/check-pattern-composition.mjs` enforces, and it is what lets the fixture
 * claim "no duplicated component CSS" as a checked property rather than as a promise.
 *
 * Every value here is a `--sk-*` token, and that is CONVENTION RATHER THAN ENFORCEMENT — a
 * correction to what this comment used to claim. An inline `<style>` inside a `.ts` is not reached
 * by `quality:stylelint` (it globs `packages/**\/*.css`), and the earlier revision went on to say
 * "the pattern-composition gate checks it instead, for this directory". It does not. That gate
 * checks reach-through, part visibility and duplicated component CSS; SK-D01's tokens-only rule is
 * enforced over this directory by nothing, which the gate's own docstring now records as an open
 * limit rather than leaving a false reassurance sitting beside the CSS it was about.
 */
export const operationalStatusStyles = html`<style>
  .sk-pattern-operations {
    box-sizing: border-box;
    min-height: 100vh;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }

  .sk-pattern-operations *,
  .sk-pattern-operations *::before,
  .sk-pattern-operations *::after {
    box-sizing: border-box;
  }

  .sk-pattern-operations :where(h1, h2, h3, p) {
    margin: 0;
  }

  .sk-pattern-operations__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sk-space-6);
    padding: var(--sk-space-6);
  }

  .sk-pattern-operations__units {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--sk-space-12), 1fr));
    gap: var(--sk-space-4);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .sk-pattern-operations__unit {
    display: grid;
    gap: var(--sk-space-3);
    min-inline-size: 0;
  }

  .sk-pattern-operations__chart {
    display: grid;
    gap: var(--sk-space-3);
    min-inline-size: 0;
  }

  .sk-pattern-operations__action {
    color: var(--sk-fg-default);
    background: var(--sk-surface-pill);
    border: var(--sk-border-width-1) solid var(--sk-border-default);
    border-radius: var(--sk-radius-pill);
    padding: var(--sk-space-1) var(--sk-space-3);
    font: inherit;
  }

  @media (max-width: 720px) {
    .sk-pattern-operations__body {
      gap: var(--sk-space-4);
      padding: var(--sk-space-4);
    }

    .sk-pattern-operations__units {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>`;

const renderUnit = (unit: OperationalUnit): TemplateResult => html`
  <li class="sk-pattern-operations__unit">
    <sk-card status=${unit.tone} data-unit=${unit.id}>
      <h3>${unit.name}</h3>
      <sk-status-indicator tone=${unit.tone}>
        <span slot="marker">${unit.marker}</span>${unit.state}
      </sk-status-indicator>
      <dl class="sk-facts sk-facts--two-col" data-facts=${unit.id}>
        ${unit.facts.map(
          (fact) => html`
            <dt class="sk-facts__term">${fact.term}</dt>
            <dd class="sk-facts__value">${fact.value}</dd>
          `,
        )}
      </dl>
      <details class="sk-disclosure" data-detail=${unit.id}>
        <summary class="sk-disclosure__summary">Detail</summary>
        <div class="sk-disclosure__body"><p>${unit.detail}</p></div>
      </details>
    </sk-card>
  </li>
`;

/**
 * The whole composition, as one light-DOM tree the consumer owns.
 *
 * Nothing here reaches into a shadow root, and nothing restyles a component through anything but
 * its documented attributes, slots and tokens. `sticky` and `density="compact"` are #182's own
 * public attributes; `announce` and `tone` are #178's; `status` is #177's; `gap-threshold` and
 * `series` are #179's.
 *
 * `options.light` adds `class="sk-light"` to the wrapper — NOT `data-theme="light"`,
 * which activates nothing on a wrapper because `@spec-kitty/tokens` anchors its light block
 * on `:root[data-theme="light"], .sk-light` and `:root` only matches `<html>` (#93).
 */
export const renderOperationalStatus = (
  model: OperationalModel = OPERATIONAL_MODEL,
  options: Readonly<{ light?: boolean }> = {},
): TemplateResult => html`
  ${operationalStatusStyles}
  <div class=${options.light ? 'sk-pattern-operations sk-light' : 'sk-pattern-operations'}>
    <sk-page-header density="compact" sticky>
      <span slot="eyebrow">${model.eyebrow}</span>
      <h1 slot="title">${model.title}</h1>
      <p slot="supporting">${model.supporting}</p>
      <span slot="sync">${model.updated}</span>
      <button slot="actions" type="button" class="sk-pattern-operations__action">
        ${model.actionLabel}
      </button>
    </sk-page-header>

    <div class="sk-pattern-operations__body">
      ${model.banner === null
        ? nothing
        : html`
            <sk-notice
              tone=${model.banner.tone}
              announce="polite"
              message=${model.banner.message}
              data-banner
            >
              <h2 slot="heading">${model.banner.heading}</h2>
            </sk-notice>
          `}

      <ul class="sk-pattern-operations__units">
        ${model.units.map(renderUnit)}
      </ul>

      <section class="sk-pattern-operations__chart" aria-label=${model.seriesLabel}>
        <sk-time-series-chart
          .series=${model.series}
          label=${model.seriesLabel}
          description=${model.seriesDescription}
          gap-threshold=${model.gapThreshold}
          data-series
        ></sk-time-series-chart>
      </section>
    </div>
  </div>
`;
