import type { Meta, StoryObj } from '@storybook/web-components';
import { expect, fn, within } from 'storybook/test';
import { html, nothing, type TemplateResult } from 'lit';
import '../action-row/sk-action-row.js';
import '../app-shell/sk-app-shell.js';
import '../bar-chart/sk-bar-chart.js';
import '../button/sk-button.js';
import '../card/sk-card.js';
import '../context-sidebar/sk-context-sidebar.js';
import '../entity-marker/sk-entity-marker.js';
import '../evidence-chain/sk-evidence-chain.js';
import '../grid/sk-grid.js';
import '../metric/sk-metric.js';
import '../nav-pill/sk-nav-pill.js';
import '../page-header/sk-page-header.js';
import '../personal-rail/sk-personal-rail.js';
import '../pill-tag/sk-pill-tag.js';
import '../section-header/sk-section-header.js';
import '../status-indicator/sk-status-indicator.js';
import '../transition-matrix/sk-transition-matrix.js';
import type { ActionRowActivateDetail } from '../action-row/sk-action-row.js';
import type { BarChartSelectDetail, BarSeries } from '../bar-chart/sk-bar-chart.js';
import type { EvidenceStage } from '../evidence-chain/sk-evidence-chain.js';
import type {
  TransitionColumn,
  TransitionMatrixSelectDetail,
  TransitionRoute,
  TransitionTone,
} from '../transition-matrix/sk-transition-matrix.js';

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type DeepReadonly<T> = T extends Primitive | ((...args: never[]) => unknown)
  ? T
  : T extends ReadonlyArray<infer Item>
    ? ReadonlyArray<DeepReadonly<Item>>
    : { readonly [Key in keyof T]: DeepReadonly<T[Key]> };

type DeliveryFixture = Readonly<{
  title: string;
  windowLabel: string;
  illustrativeLabel: string;
  description: string;
  totalInvestment: number;
  unattributedInvestment: number;
  completedWorkPackages: number;
  deployedMissions: number;
  verifiedOutcomes: number;
  firstPass: number;
  awaitingEvidence: number;
  buckets: ReadonlyArray<Readonly<{
    id: string;
    label: string;
    value: number;
    deployed: number;
  }>>;
  outcomes: ReadonlyArray<Readonly<{
    id: string;
    title: string;
    detail: string;
    state: string;
    tone: 'info' | 'success' | 'attention';
  }>>;
}>;

type FlowFixture = Readonly<{
  description: string;
  windowLabel: string;
  selectionHint: string;
  columns: ReadonlyArray<TransitionColumn>;
  routes: ReadonlyArray<TransitionRoute>;
  statuses: ReadonlyArray<Readonly<{
    id: string;
    label: string;
    count: number;
    tone: 'neutral' | 'info' | 'success' | 'attention';
  }>>;
}>;

type OperationalPill = Readonly<{
  label: string;
  kind: 'pill' | 'status';
  variant?: 'green' | 'purple' | 'yellow';
  tone?: 'neutral' | 'info' | 'success' | 'attention';
}>;

type OperationalRow = Readonly<{
  id: string;
  marker: string;
  markerLabel: string;
  title: string;
  reference: string;
  pills: ReadonlyArray<OperationalPill>;
  time: string;
  selectable: boolean;
  warning?: string;
  repeatReason?: string;
}>;

type OperationalSection = Readonly<{
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  emptyMessage: string;
  rows: ReadonlyArray<OperationalRow>;
}>;

type TeamOverviewFixture = Readonly<{
  team: Readonly<{
    name: string;
    repository: string;
    syncLabel: string;
  }>;
  shell: Readonly<{
    eyebrow: string;
    title: string;
    supporting: string;
    accountName: string;
    accountInitials: string;
    primaryNavigation: ReadonlyArray<Readonly<{ label: string; href: string; glyph: string }>>;
    contextNavigation: ReadonlyArray<Readonly<{ label: string; href: string }>>;
  }>;
  delivery: DeliveryFixture;
  flow: FlowFixture;
  operational: Readonly<{
    attentionMeanings: ReadonlyArray<string>;
    sections: ReadonlyArray<OperationalSection>;
  }>;
}>;

export const deepFreeze = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

const isDeeplyFrozen = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object') return true;
  return Object.isFrozen(value) && Object.values(value as Record<string, unknown>).every(isDeeplyFrozen);
};

export const TEAM_OVERVIEW_FIXTURE = deepFreeze({
  team: {
    name: 'Collaborative Demo Team',
    repository: 'spec-kitty/e2e-team-landing',
    syncLabel: 'Last synced 1 min ago',
  },
  shell: {
    eyebrow: 'Overview',
    title: 'Collaborative Demo Team',
    supporting: 'What needs you, and what is moving.',
    accountName: 'Collaborative Demo account',
    accountInitials: 'CD',
    primaryNavigation: [
      { label: 'Overview', href: '#overview', glyph: '⌘' },
      { label: 'Work', href: '#work', glyph: '↗' },
      { label: 'Connectors', href: '#connectors', glyph: '◇' },
    ],
    contextNavigation: [
      { label: 'Overview', href: '#overview' },
      { label: 'Delivery return', href: '#delivery-return' },
      { label: 'Flow health', href: '#flow-health' },
      { label: 'Operational activity', href: '#operational-activity' },
    ],
  },
  delivery: {
    title: 'Delivery return',
    windowLabel: 'Last 30 days',
    illustrativeLabel: 'Illustrative data',
    description: 'What this investment produced — and what is proven.',
    totalInvestment: 1840,
    unattributedInvestment: 166,
    completedWorkPackages: 42,
    deployedMissions: 6,
    verifiedOutcomes: 2,
    firstPass: 34,
    awaitingEvidence: 4,
    buckets: [
      { id: 'aug-11', label: 'Aug 11', value: 320, deployed: 1 },
      { id: 'aug-18', label: 'Aug 18', value: 410, deployed: 2 },
      { id: 'aug-25', label: 'Aug 25', value: 340, deployed: 1 },
      { id: 'sep-1', label: 'Sep 1', value: 604, deployed: 2 },
    ],
    outcomes: [
      {
        id: 'local-setup',
        title: 'Local setup under 10 min',
        detail: 'Setup time · 24m → 8m',
        state: 'Verified',
        tone: 'success',
      },
      {
        id: 'team-status',
        title: 'Faster team-status assembly',
        detail: 'Observation closes in 12 days',
        state: 'Measuring',
        tone: 'info',
      },
      {
        id: 'blocked-visible',
        title: 'Blocked work visible within 1 min',
        detail: 'Deployment evidence required',
        state: 'Pending',
        tone: 'attention',
      },
    ],
  },
  flow: {
    description: 'Moves grouped by route and day.',
    windowLabel: 'last 72 hours',
    selectionHint: 'Select any row to inspect its WPs.',
    columns: [
      { id: 'tue-1', label: 'Tue 1' },
      { id: 'wed-2', label: 'Wed 2' },
      { id: 'thu-3', label: 'Thu 3' },
      { id: 'fri-4', label: 'Today · Fri 4' },
    ],
    routes: [
      {
        id: 'planned-progress',
        label: 'Planned → In progress',
        tone: 'forward',
        values: { 'tue-1': 3, 'wed-2': 6, 'thu-3': 7, 'fri-4': 5 },
      },
      {
        id: 'progress-review',
        label: 'In progress → For review',
        tone: 'forward',
        values: { 'tue-1': 2, 'wed-2': 5, 'thu-3': 6, 'fri-4': 4 },
      },
      {
        id: 'review-done',
        label: 'For review → Done',
        tone: 'completed',
        values: { 'tue-1': 1, 'wed-2': 3, 'thu-3': 4, 'fri-4': 3 },
      },
      {
        id: 'blocked',
        label: 'Any lane → Blocked',
        tone: 'blocked',
        group: 'Exceptions & recovery',
        values: { 'tue-1': 1, 'wed-2': 3, 'thu-3': 2, 'fri-4': 0 },
      },
      {
        id: 'recovery',
        label: 'Blocked → In progress',
        tone: 'recovery',
        group: 'Exceptions & recovery',
        values: { 'tue-1': 0, 'wed-2': 1, 'thu-3': 1, 'fri-4': 2 },
      },
      {
        id: 'backward',
        label: 'Any lane → Any lane (backward)',
        tone: 'backward',
        group: 'Exceptions & recovery',
        values: { 'tue-1': 0, 'wed-2': 1, 'thu-3': 1, 'fri-4': 1 },
      },
    ],
    statuses: [
      { id: 'planned', label: 'Planned', count: 12, tone: 'neutral' },
      { id: 'in-progress', label: 'In progress', count: 21, tone: 'info' },
      { id: 'for-review', label: 'For review', count: 13, tone: 'success' },
      { id: 'blocked', label: 'Blocked', count: 4, tone: 'attention' },
    ],
  },
  operational: {
    attentionMeanings: ['awaiting-evidence', 'off-default-branch'],
    sections: [
      {
        id: 'in-flight',
        eyebrow: 'In flight',
        title: 'Work moving now',
        description: 'Current work with a consumer-owned activation seam.',
        emptyMessage: 'No work is currently in flight.',
        rows: [
          {
            id: 'flight-team-landing',
            marker: 'SP',
            markerLabel: 'Spec Kitty repository',
            title: 'team-landing-pivots',
            reference: 'spec-kitty/e2e-team-landing',
            pills: [
              { label: 'WP status changed', kind: 'pill' },
              { label: 'Presence · unverified', kind: 'pill', variant: 'purple' },
            ],
            time: '2 hours ago',
            selectable: true,
          },
        ],
      },
      {
        id: 'admitted-repos',
        eyebrow: 'Admitted repos',
        title: 'Repository evidence',
        description: 'Observed repository facts, separate from product actions.',
        emptyMessage: 'No repositories have been admitted.',
        rows: [
          {
            id: 'admitted-team-landing',
            marker: 'SP',
            markerLabel: 'Spec Kitty repository',
            title: 'spec-kitty/e2e-team-landing',
            reference: '17bd28375d5f',
            pills: [{ label: 'Git activity · factual', kind: 'pill' }],
            time: 'pushed 1 minute ago',
            selectable: false,
            warning: '1 mission off default branch',
          },
        ],
      },
      {
        id: 'recent-activity',
        eyebrow: 'Recent activity',
        title: 'Latest verified changes',
        description: 'Distinct events ordered by their fixture timestamps.',
        emptyMessage: 'No recent activity is available.',
        rows: [
          {
            id: 'recent-dashboard-polish',
            marker: 'SK',
            markerLabel: 'Spec Kitty dashboard repository',
            title: 'dashboard-polish',
            reference: 'ccb055c52429',
            pills: [
              { label: 'Review passed', kind: 'pill' },
              { label: 'Fresh', kind: 'status', tone: 'success' },
            ],
            time: '1 day ago',
            selectable: false,
          },
          {
            id: 'recent-docs-refresh',
            marker: 'SD',
            markerLabel: 'Spec Kitty design repository',
            title: 'docs-surface-refresh',
            reference: '70c1d5d23aee',
            pills: [
              { label: 'Evidence recorded', kind: 'pill', variant: 'green' },
              { label: 'Available', kind: 'status', tone: 'success' },
            ],
            time: '2 days ago',
            selectable: false,
          },
        ],
      },
    ],
  },
} satisfies TeamOverviewFixture);

type CoverageMode = 'full' | 'partial';

export const deriveDelivery = (
  delivery: DeepReadonly<DeliveryFixture>,
  coverageMode: CoverageMode = 'full',
) => {
  if (
    !Number.isFinite(delivery.totalInvestment) ||
    delivery.totalInvestment <= 0 ||
    !Number.isFinite(delivery.unattributedInvestment) ||
    delivery.unattributedInvestment < 0 ||
    delivery.unattributedInvestment >= delivery.totalInvestment
  ) {
    throw new RangeError('Delivery totals cannot produce an honest attribution percentage.');
  }

  const attributed = delivery.totalInvestment - delivery.unattributedInvestment;
  const attributionPercent = Math.round((attributed / delivery.totalInvestment) * 100);
  const fullBucketTotal = delivery.buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  if (fullBucketTotal !== attributed) {
    throw new RangeError('Full-coverage delivery buckets must equal the attributed investment.');
  }

  const selectedBuckets = coverageMode === 'partial' ? delivery.buckets.slice(0, 2) : delivery.buckets;
  const bucketTotal = selectedBuckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const currency = (value: number) => `€${value.toLocaleString('en-US')}`;
  const evidenceStages = deepFreeze([
    {
      id: 'investment',
      label: 'Investment',
      displayValue: currency(delivery.totalInvestment),
      annotation: `${currency(delivery.unattributedInvestment)} unattributed`,
      tone: 'neutral',
    },
    {
      id: 'completed',
      label: 'Completed',
      displayValue: `${delivery.completedWorkPackages} WPs`,
      annotation: `${delivery.firstPass} first pass`,
      tone: 'info',
    },
    {
      id: 'deployed',
      label: 'Deployed',
      displayValue: `${delivery.deployedMissions} missions`,
      annotation: 'Production evidence',
      tone: 'success',
    },
    {
      id: 'verified',
      label: 'Verified outcomes',
      displayValue: coverageMode === 'partial' ? 'Evidence pending' : `${delivery.verifiedOutcomes} verified`,
      annotation: `${delivery.awaitingEvidence} awaiting evidence`,
      tone: coverageMode === 'partial' ? 'attention' : 'success',
    },
  ] satisfies ReadonlyArray<EvidenceStage>);
  const barSeries = deepFreeze(
    selectedBuckets.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      value: bucket.value,
      displayValue: currency(bucket.value),
    })) satisfies BarSeries,
  );

  return deepFreeze({
    attributed,
    attributionPercent,
    bucketTotal,
    coverageMode,
    coverageLabel: coverageMode === 'partial'
      ? `Partial coverage · ${currency(bucketTotal)} of ${currency(attributed)} attributed`
      : 'Full attributed coverage',
    evidenceStages,
    barSeries,
  });
};

export const deriveFlow = (flow: DeepReadonly<FlowFixture>) => {
  const columnIds = new Set(flow.columns.map((column) => column.id));
  const moveTotal = flow.routes.reduce((total, route) => {
    if (!route.label.includes(' → ')) throw new TypeError('Every route must use the A → B grammar.');
    const valueKeys = Object.keys(route.values);
    if (valueKeys.length !== columnIds.size || valueKeys.some((key) => !columnIds.has(key))) {
      throw new TypeError(`Route ${route.id} does not own one cell for every time column.`);
    }
    return total + Object.values(route.values).reduce((sum, value) => sum + value, 0);
  }, 0);
  const openTotal = flow.statuses.reduce((sum, status) => sum + status.count, 0);
  const legendTones = flow.routes.reduce<TransitionTone[]>((tones, route) => {
    if (!tones.includes(route.tone)) tones.push(route.tone);
    return tones;
  }, []);

  return deepFreeze({
    moveTotal,
    openTotal,
    columns: flow.columns.map((column) => ({ ...column })),
    routes: flow.routes.map((route) => ({ ...route, values: { ...route.values } })),
    statuses: flow.statuses.map((status) => ({ ...status })),
    legendTones,
  });
};

export const deriveOperationalSections = (
  operational: DeepReadonly<TeamOverviewFixture['operational']>,
  empty = false,
) => {
  if (new Set(operational.attentionMeanings).size > 2) {
    throw new RangeError('Attention amber is limited to two documented meanings.');
  }

  const fingerprints = new Map<string, OperationalRow>();
  for (const section of operational.sections) {
    for (const row of section.rows) {
      if (row.reference !== row.reference.toLowerCase()) {
        throw new TypeError(`Operational reference ${row.reference} must remain lowercase.`);
      }
      const fingerprint = JSON.stringify([
        row.title,
        row.reference,
        row.pills.map((pill) => pill.label),
        row.time,
      ]);
      const prior = fingerprints.get(fingerprint);
      if (prior && (!prior.repeatReason || prior.repeatReason !== row.repeatReason)) {
        throw new TypeError(`Operational row ${row.id} duplicates ${prior.id} without a repeat reason.`);
      }
      fingerprints.set(fingerprint, row);
    }
  }

  return deepFreeze(operational.sections.map((section) => ({
    ...section,
    rows: empty ? [] : section.rows.map((row) => ({ ...row, pills: row.pills.map((pill) => ({ ...pill })) })),
  })));
};

type StoryArgs = Readonly<{
  selectedRowId: string;
  selectedBarId: string;
  selectedRouteId: string;
  onRowActivate: (detail: ActionRowActivateDetail) => void;
  onBarSelect: (detail: BarChartSelectDetail) => void;
  onRouteSelect: (detail: TransitionMatrixSelectDetail) => void;
}>;

type RenderOptions = Readonly<{
  light?: boolean;
  coverageMode?: CoverageMode;
  emptyOperational?: boolean;
  scale?: boolean;
}>;

const patternStyles = html`<style>
  .sk-pattern-overview {
    box-sizing: border-box;
    min-height: 100vh;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }

  .sk-pattern-overview *,
  .sk-pattern-overview *::before,
  .sk-pattern-overview *::after {
    box-sizing: border-box;
  }

  .sk-pattern-overview :where(h2, h3, p) {
    margin: 0;
  }

  .sk-pattern-overview sk-app-shell::part(shell) {
    min-height: 100vh;
  }

  .sk-pattern-overview__rail-link,
  .sk-pattern-overview__account,
  .sk-pattern-overview__context-link {
    color: var(--sk-fg-default);
    font: inherit;
    text-decoration: none;
  }

  .sk-pattern-overview__rail-link,
  .sk-pattern-overview__account,
  .sk-pattern-overview__rail-control {
    display: grid;
    place-items: center;
    min-inline-size: var(--sk-space-8);
    min-block-size: var(--sk-space-8);
    padding: var(--sk-space-1);
    color: var(--sk-fg-default);
    background: var(--sk-surface-pill);
    border: var(--sk-border-width-1) solid var(--sk-border-default);
    border-radius: var(--sk-radius-pill);
    font: inherit;
  }

  .sk-pattern-overview__context-title {
    display: grid;
    gap: var(--sk-space-1);
  }

  .sk-pattern-overview__context-title span,
  .sk-pattern-overview__muted,
  .sk-pattern-overview__outcome-detail,
  .sk-pattern-overview__chart-note,
  .sk-pattern-overview__empty {
    color: var(--sk-fg-muted);
  }

  .sk-pattern-overview__context-link {
    display: block;
    padding: var(--sk-space-2) var(--sk-space-3);
    border-radius: var(--sk-radius-sm);
  }

  .sk-pattern-overview__context-link[aria-current='page'] {
    color: var(--sk-fg-default);
    background: var(--sk-surface-pill);
    border-inline-start: var(--sk-border-width-4) solid var(--sk-color-accent);
  }

  .sk-pattern-overview__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
    gap: var(--sk-space-7);
    padding: var(--sk-space-7);
  }

  .sk-pattern-overview__card-content,
  .sk-pattern-overview__section,
  .sk-pattern-overview__delivery,
  .sk-pattern-overview__flow,
  .sk-pattern-overview__outcomes,
  .sk-pattern-overview__current {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
    gap: var(--sk-space-4);
  }

  .sk-pattern-overview [data-visual-region] {
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  .sk-pattern-overview__delivery-heading,
  .sk-pattern-overview__chart-heading,
  .sk-pattern-overview__outcomes-heading,
  .sk-pattern-overview__current-heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--sk-space-3);
  }

  .sk-pattern-overview__title-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sk-space-3);
  }

  .sk-pattern-overview__title-line h2,
  .sk-pattern-overview__outcomes h3,
  .sk-pattern-overview__current h3 {
    color: var(--sk-fg-default);
    font-family: var(--sk-font-display);
    font-weight: var(--sk-weight-semibold);
  }

  .sk-pattern-overview__outcome-list,
  .sk-pattern-overview__operational-list,
  .sk-pattern-overview__bar-notes,
  .sk-pattern-overview__chart-legend {
    display: grid;
    gap: var(--sk-space-2);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .sk-pattern-overview__outcome-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sk-space-2) var(--sk-space-4);
    padding-block: var(--sk-space-3);
    border-block-end: var(--sk-border-width-1) solid var(--sk-border-default);
  }

  .sk-pattern-overview__outcome-row:last-child {
    border-block-end: 0;
  }

  .sk-pattern-overview__outcome-detail {
    grid-column: 1;
    font-size: var(--sk-text-sm);
  }

  .sk-pattern-overview__outcome-row sk-status-indicator {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
  }

  .sk-pattern-overview__bar-notes {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-xs);
    text-align: center;
  }

  .sk-pattern-overview__bar-notes li,
  .sk-pattern-overview__chart-legend li {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sk-space-1);
  }

  .sk-pattern-overview__chart-legend {
    display: flex;
    flex-wrap: wrap;
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-xs);
  }

  .sk-pattern-overview__legend-key {
    inline-size: var(--sk-space-2);
    block-size: var(--sk-space-2);
    background: var(--sk-color-data-series-primary);
    border-radius: var(--sk-radius-pill);
  }

  .sk-pattern-overview__legend-key--deployed {
    background: var(--sk-color-green);
  }

  .sk-pattern-overview__current-total {
    color: var(--sk-fg-default);
    font-family: var(--sk-font-display);
    font-size: var(--sk-text-2xl);
    font-weight: var(--sk-weight-bold);
  }

  .sk-pattern-overview__operational-list li {
    min-inline-size: 0;
  }

  .sk-pattern-overview__warning {
    display: inline-flex;
    cursor: default;
    text-decoration: none;
  }

  .sk-pattern-overview__empty {
    padding: var(--sk-space-6);
    border: var(--sk-border-width-1) dashed var(--sk-border-default);
    border-radius: var(--sk-radius-md);
  }

  .sk-pattern-overview__intent-log {
    display: block;
    padding: var(--sk-space-3);
    color: var(--sk-fg-muted);
    background: var(--sk-surface-muted);
    border-radius: var(--sk-radius-sm);
    font-family: var(--sk-font-mono);
    font-size: var(--sk-text-xs);
  }

  @media (max-width: 720px) {
    .sk-pattern-overview__content {
      gap: var(--sk-space-4);
      padding: var(--sk-space-4);
    }

    .sk-pattern-overview__bar-notes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>`;

const renderPill = (pill: DeepReadonly<OperationalPill>): TemplateResult =>
  pill.kind === 'status'
    ? html`<sk-status-indicator slot="tags" tone=${pill.tone ?? 'neutral'}>${pill.label}</sk-status-indicator>`
    : html`<sk-pill-tag slot="tags" variant=${pill.variant ?? nothing}>${pill.label}</sk-pill-tag>`;

const renderOperationalRow = (
  row: DeepReadonly<OperationalRow>,
  selectedRowId: string,
): TemplateResult => html`
  <sk-action-row
    row-id=${row.id}
    ?selectable=${row.selectable}
    ?selected=${selectedRowId === row.id}
  >
    <sk-entity-marker slot="marker" label=${row.markerLabel}>${row.marker}</sk-entity-marker>
    <span slot="title">${row.title}</span>
    <code slot="reference">${row.reference}</code>
    ${row.pills.map(renderPill)}
    ${row.warning
      ? html`<span
          slot="tags"
          class="sk-pattern-overview__warning"
          data-non-link-warning
          data-attention-meaning="off-default-branch"
        ><sk-pill-tag variant="yellow">${row.warning}</sk-pill-tag></span>`
      : nothing}
    <time slot="metadata">${row.time}</time>
  </sk-action-row>`;

const renderOperationalSection = (
  section: ReturnType<typeof deriveOperationalSections>[number],
  selectedRowId: string,
): TemplateResult => html`
  <section
    class="sk-pattern-overview__section"
    data-operational-section=${section.id}
    aria-labelledby=${`operational-${section.id}`}
  >
    <sk-section-header>
      <span slot="eyebrow">${section.eyebrow}</span>
      <h2 slot="title" id=${`operational-${section.id}`}>${section.title}</h2>
      <p slot="description">${section.description}</p>
    </sk-section-header>
    ${section.rows.length > 0
      ? html`<ul class="sk-pattern-overview__operational-list">
          ${section.rows.map((row) => html`<li>${renderOperationalRow(row, selectedRowId)}</li>`)}
        </ul>`
      : html`<p class="sk-pattern-overview__empty" role="status">${section.emptyMessage}</p>`}
  </section>`;

const recordIntent = <Detail extends object>(
  event: CustomEvent<Detail>,
  kind: 'row' | 'bar' | 'route',
  callback: (detail: Detail) => void,
): void => {
  callback(event.detail);
  const root = event.currentTarget as HTMLElement;
  const log = root.querySelector<HTMLOutputElement>('[data-intent-log]');
  if (!log) return;
  const attribute = `data-${kind}-event`;
  const prior = JSON.parse(log.getAttribute(attribute) ?? '{}') as { count?: number };
  const record = {
    count: (prior.count ?? 0) + 1,
    detail: event.detail,
    bubbles: event.bubbles,
    composed: event.composed,
    cancelable: event.cancelable,
  };
  log.setAttribute(attribute, JSON.stringify(record));
  log.value = `${kind} intent: ${JSON.stringify(event.detail)}`;
};

export const renderTeamOverview = (
  fixture: DeepReadonly<TeamOverviewFixture>,
  args: StoryArgs,
  options: RenderOptions = {},
): TemplateResult => {
  const delivery = deriveDelivery(fixture.delivery, options.coverageMode ?? 'full');
  const flow = deriveFlow(fixture.flow);
  const operational = deriveOperationalSections(fixture.operational, options.emptyOperational ?? false);
  const semanticSignature = JSON.stringify({
    team: fixture.team,
    shell: fixture.shell,
    delivery: {
      attributed: delivery.attributed,
      attributionPercent: delivery.attributionPercent,
      bucketTotal: delivery.bucketTotal,
      coverageMode: delivery.coverageMode,
      evidenceStages: delivery.evidenceStages,
      barSeries: delivery.barSeries,
      outcomes: options.coverageMode === 'partial' ? [] : fixture.delivery.outcomes,
    },
    flow,
    operational,
  });

  return html`
    <div
      class=${`sk-pattern-overview${options.light ? ' sk-light' : ''}`}
      data-team-overview-pattern
      data-story-variant=${options.scale ? 'scale-50-wps' : options.coverageMode ?? 'approved'}
      data-render-complete="true"
      data-fixture-deeply-frozen=${String(isDeeplyFrozen(fixture))}
      data-investment-total=${String(fixture.delivery.totalInvestment)}
      data-unattributed-total=${String(fixture.delivery.unattributedInvestment)}
      data-attributed-total=${String(delivery.attributed)}
      data-attribution-percent=${String(delivery.attributionPercent)}
      data-bucket-total=${String(delivery.bucketTotal)}
      data-coverage-mode=${delivery.coverageMode}
      data-move-total=${String(flow.moveTotal)}
      data-open-total=${String(flow.openTotal)}
      data-columns=${JSON.stringify(flow.columns.map((column) => column.label))}
      data-legend-tones=${JSON.stringify(flow.legendTones)}
      data-semantic-signature=${semanticSignature}
      @sk-action-row-activate=${(event: CustomEvent<ActionRowActivateDetail>) =>
        recordIntent(event, 'row', args.onRowActivate)}
      @sk-bar-chart-select=${(event: CustomEvent<BarChartSelectDetail>) =>
        recordIntent(event, 'bar', args.onBarSelect)}
      @sk-transition-matrix-select=${(event: CustomEvent<TransitionMatrixSelectDetail>) =>
        recordIntent(event, 'route', args.onRouteSelect)}
    >
      ${patternStyles}
      <sk-app-shell>
        <sk-personal-rail
          slot="personal-rail"
          label="Product areas"
          data-visual-region="rail-identity"
        >
          ${fixture.shell.primaryNavigation.map((item) => html`
            <a
              slot="primary"
              class="sk-pattern-overview__rail-link"
              href=${item.href}
              aria-label=${item.label}
              aria-current=${item.label === 'Overview' ? 'page' : nothing}
            ><span aria-hidden="true">${item.glyph}</span></a>`)}
          <button
            slot="utilities"
            class="sk-pattern-overview__rail-control"
            type="button"
            aria-label="Notifications"
          >♢</button>
          <a
            slot="account"
            class="sk-pattern-overview__account"
            href="#account"
            aria-label=${fixture.shell.accountName}
            data-account-identity
          >${fixture.shell.accountInitials}</a>
          <button
            slot="logout"
            class="sk-pattern-overview__rail-control"
            type="button"
            aria-label="Log out"
          >↪</button>
        </sk-personal-rail>

        <sk-context-sidebar slot="context-sidebar" label="Team context">
          <div slot="header" class="sk-pattern-overview__context-title">
            <strong>${fixture.team.name}</strong>
            <span>${fixture.team.repository}</span>
          </div>
          <sk-nav-pill label="Team sections">
            ${fixture.shell.contextNavigation.map((item) => html`
              <a
                class="sk-pattern-overview__context-link"
                href=${item.href}
                aria-current=${item.label === 'Overview' ? 'page' : nothing}
              >${item.label}</a>`)}
          </sk-nav-pill>
          <sk-button slot="footer" variant="ghost" size="sm">Manage team</sk-button>
        </sk-context-sidebar>

        <sk-page-header slot="page-header">
          <span slot="eyebrow">${fixture.shell.eyebrow}</span>
          <h1 slot="title">${fixture.shell.title}</h1>
          <p slot="supporting">${fixture.shell.supporting}</p>
          <sk-status-indicator slot="sync" tone="success">${fixture.team.syncLabel}</sk-status-indicator>
          <sk-button slot="actions" variant="ghost" size="sm">Refresh evidence</sk-button>
        </sk-page-header>

        <div class="sk-pattern-overview__content" data-page-content id="overview">
          <section id="delivery-return" aria-labelledby="delivery-return-title">
            <sk-card>
              <div class="sk-pattern-overview__card-content sk-pattern-overview__delivery">
                <header class="sk-pattern-overview__delivery-heading">
                  <div class="sk-pattern-overview__title-line">
                    <h2 id="delivery-return-title">${fixture.delivery.title}</h2>
                    <span>${fixture.delivery.windowLabel}</span>
                    <sk-pill-tag>${fixture.delivery.illustrativeLabel}</sk-pill-tag>
                  </div>
                  <div>
                    <strong>${delivery.attributionPercent}% spend attributed</strong>
                    <p class="sk-pattern-overview__muted">Observed · evidence, not guaranteed ROI</p>
                  </div>
                </header>
                <p>${fixture.delivery.description}</p>
                <div data-visual-region="delivery-evidence">
                  <sk-evidence-chain .stages=${delivery.evidenceStages}></sk-evidence-chain>
                </div>
                <sk-grid variant="cols-2" gap="6">
                  <section
                    class="sk-pattern-overview__section"
                    aria-labelledby="return-over-time-title"
                    data-visual-region="return-chart"
                  >
                    <div class="sk-pattern-overview__chart-heading">
                      <h3 id="return-over-time-title">Return over time</h3>
                      <ul class="sk-pattern-overview__chart-legend" aria-label="Return chart legend">
                        <li><span class="sk-pattern-overview__legend-key"></span>Attributed spend</li>
                        <li><span class="sk-pattern-overview__legend-key sk-pattern-overview__legend-key--deployed"></span>Missions deployed</li>
                      </ul>
                    </div>
                    <sk-bar-chart
                      label="Return over time"
                      description=${delivery.coverageLabel}
                      ?selectable=${true}
                      .selectedId=${args.selectedBarId}
                      .series=${delivery.barSeries}
                    ></sk-bar-chart>
                    <ul class="sk-pattern-overview__bar-notes" aria-label="Missions deployed by date">
                      ${(options.coverageMode === 'partial'
                        ? fixture.delivery.buckets.slice(0, 2)
                        : fixture.delivery.buckets
                      ).map((bucket) => html`<li><span class="sk-pattern-overview__legend-key sk-pattern-overview__legend-key--deployed"></span>${bucket.deployed} deployed</li>`)}
                    </ul>
                  </section>

                  <section class="sk-pattern-overview__outcomes" aria-labelledby="outcomes-title">
                    <header class="sk-pattern-overview__outcomes-heading">
                      <h3 id="outcomes-title">Recent outcome evidence</h3>
                      ${options.coverageMode === 'partial'
                        ? nothing
                        : html`<sk-button variant="ghost" size="sm">View evidence →</sk-button>`}
                    </header>
                    ${options.coverageMode === 'partial'
                      ? html`<p class="sk-pattern-overview__empty" role="status">Outcome evidence pending</p>`
                      : html`<ul class="sk-pattern-overview__outcome-list">
                          ${fixture.delivery.outcomes.map((outcome) => html`
                            <li class="sk-pattern-overview__outcome-row">
                              <strong>${outcome.title}</strong>
                              <p class="sk-pattern-overview__outcome-detail">${outcome.detail}</p>
                              <sk-status-indicator
                                tone=${outcome.tone}
                                data-attention-meaning=${outcome.tone === 'attention'
                                  ? 'awaiting-evidence'
                                  : nothing}
                              >${outcome.state}</sk-status-indicator>
                            </li>`)}
                        </ul>`}
                  </section>
                </sk-grid>
              </div>
            </sk-card>
          </section>

          <section id="flow-health" aria-label="Flow health and current inventory">
            <sk-card>
              <div class="sk-pattern-overview__card-content sk-pattern-overview__flow">
                <sk-grid variant="cols-2" gap="6">
                  <div data-visual-region="flow-matrix">
                    <sk-transition-matrix
                      .columns=${flow.columns}
                      .routes=${flow.routes}
                      .selectedRouteId=${args.selectedRouteId || undefined}
                      ?selectable=${true}
                      .windowLabel=${fixture.flow.windowLabel}
                      .description=${fixture.flow.description}
                      .selectionHint=${fixture.flow.selectionHint}
                    ></sk-transition-matrix>
                  </div>
                  <aside class="sk-pattern-overview__current" aria-labelledby="current-inventory-title">
                    <div class="sk-pattern-overview__current-heading">
                      <h3 id="current-inventory-title">Current</h3>
                      <span class="sk-pattern-overview__muted">Items, not moves</span>
                    </div>
                    <p class="sk-pattern-overview__current-total">${flow.openTotal} open WPs</p>
                    <sk-grid variant="cols-2" gap="4">
                      ${flow.statuses.map((status) => html`
                        <sk-metric
                          compact
                          .label=${status.label}
                          .displayValue=${String(status.count)}
                          .annotation=${status.id === 'blocked' ? 'Needs attention' : ''}
                          .tone=${status.tone}
                        ></sk-metric>`)}
                    </sk-grid>
                    <sk-button variant="ghost" size="sm">View 50 WPs</sk-button>
                    <p class="sk-pattern-overview__muted">Observer · up to 60 s behind</p>
                  </aside>
                </sk-grid>
              </div>
            </sk-card>
          </section>

          <div id="operational-activity" class="sk-pattern-overview__section">
            ${operational.map((section) => renderOperationalSection(section, args.selectedRowId))}
          </div>

          <output
            class="sk-pattern-overview__intent-log"
            data-intent-log
            data-row-event='{"count":0}'
            data-bar-event='{"count":0}'
            data-route-event='{"count":0}'
            aria-live="polite"
          >No selection intent yet.</output>
        </div>
      </sk-app-shell>
    </div>`;
};

const meta = {
  title: 'Patterns/Team Overview',
  tags: ['autodocs'],
  excludeStories: [
    'deepFreeze',
    'TEAM_OVERVIEW_FIXTURE',
    'deriveDelivery',
    'deriveFlow',
    'deriveOperationalSections',
    'renderTeamOverview',
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'A Storybook-only composition proving the Team overview through existing public elements, one immutable fixture, and consumer-controlled intent.',
      },
    },
  },
  args: {
    selectedRowId: '',
    selectedBarId: '',
    selectedRouteId: '',
    onRowActivate: fn(),
    onBarSelect: fn(),
    onRouteSelect: fn(),
  },
  render: (args) => renderTeamOverview(TEAM_OVERVIEW_FIXTURE, args),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'ApprovedDark',
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: (args) => renderTeamOverview(TEAM_OVERVIEW_FIXTURE, args, { light: true }),
};

export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const Scale50WPs: Story = {
  render: (args) => renderTeamOverview(TEAM_OVERVIEW_FIXTURE, args, { scale: true }),
};

export const ControlledInteractions: Story = {
  args: {
    selectedRowId: 'recent-dashboard-polish',
    selectedBarId: 'aug-11',
    selectedRouteId: 'planned-progress',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // Emit at the public hosts here so the story never queries child shadow roots. The Playwright
    // contract below activates each real rendered control with pointer and keyboard input.
    const row = canvasElement.querySelector<HTMLElement & { selected: boolean }>(
      'sk-action-row[row-id="flight-team-landing"]',
    );
    const chart = canvasElement.querySelector<HTMLElement & { selectedId: string }>('sk-bar-chart');
    const matrix = canvasElement.querySelector<HTMLElement & { selectedRouteId?: string }>(
      'sk-transition-matrix',
    );
    row?.dispatchEvent(new CustomEvent<ActionRowActivateDetail>('sk-action-row-activate', {
      detail: { id: 'flight-team-landing' },
      bubbles: true,
      composed: true,
    }));
    chart?.dispatchEvent(new CustomEvent<BarChartSelectDetail>('sk-bar-chart-select', {
      detail: { id: 'aug-18' },
      bubbles: true,
      composed: true,
    }));
    matrix?.dispatchEvent(new CustomEvent<TransitionMatrixSelectDetail>('sk-transition-matrix-select', {
      detail: { routeId: 'progress-review' },
      bubbles: true,
      composed: true,
    }));

    await expect(args.onRowActivate).toHaveBeenCalledTimes(1);
    await expect(args.onRowActivate).toHaveBeenCalledWith({ id: 'flight-team-landing' });
    await expect(args.onBarSelect).toHaveBeenCalledTimes(1);
    await expect(args.onBarSelect).toHaveBeenCalledWith({ id: 'aug-18' });
    await expect(args.onRouteSelect).toHaveBeenCalledTimes(1);
    await expect(args.onRouteSelect).toHaveBeenCalledWith({ routeId: 'progress-review' });

    const root = canvasElement.querySelector<HTMLElement>('[data-team-overview-pattern]');
    const log = canvas.getByText(/route intent:/);
    await expect(JSON.parse(log.getAttribute('data-row-event') ?? '{}')).toEqual({
      count: 1,
      detail: { id: 'flight-team-landing' },
      bubbles: true,
      composed: true,
      cancelable: false,
    });
    await expect(JSON.parse(log.getAttribute('data-bar-event') ?? '{}')).toEqual({
      count: 1,
      detail: { id: 'aug-18' },
      bubbles: true,
      composed: true,
      cancelable: false,
    });
    await expect(JSON.parse(log.getAttribute('data-route-event') ?? '{}')).toEqual({
      count: 1,
      detail: { routeId: 'progress-review' },
      bubbles: true,
      composed: true,
      cancelable: false,
    });
    await expect(row?.selected).toBe(false);
    await expect(chart?.selectedId).toBe('aug-11');
    await expect(matrix?.selectedRouteId).toBe('planned-progress');
    root?.setAttribute('data-play-proof', 'passed');
  },
};

export const EmptyPartialData: Story = {
  render: (args) => renderTeamOverview(TEAM_OVERVIEW_FIXTURE, args, {
    coverageMode: 'partial',
    emptyOperational: true,
  }),
};
