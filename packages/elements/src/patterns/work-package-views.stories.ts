import type { Meta, StoryObj } from '@storybook/web-components';
import { expect, fn } from 'storybook/test';
import { html, nothing, type TemplateResult } from 'lit';
import '../action-row/sk-action-row.js';
import '../card/sk-card.js';
import '../check-bullet/sk-check-bullet.js';
import '../entity-marker/sk-entity-marker.js';
import '../notice/sk-notice.js';
import '../page-header/sk-page-header.js';
import '../pill-tag/sk-pill-tag.js';
import '../status-indicator/sk-status-indicator.js';
import type { ActionRowActivateDetail } from '../action-row/sk-action-row.js';

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type DeepReadonly<T> = T extends Primitive | ((...args: never[]) => unknown)
  ? T
  : T extends ReadonlyArray<infer Item>
    ? ReadonlyArray<DeepReadonly<Item>>
    : { readonly [Key in keyof T]: DeepReadonly<T[Key]> };

type Lane = Readonly<{ id: string; label: string }>;
type Claim = Readonly<{
  state: 'live' | 'stale';
  tone: 'success' | 'attention';
  label: string;
  claimant: string;
  advisory?: string;
}>;
type WorkPackage = Readonly<{
  id: string;
  laneId: string;
  title: string;
  reference: string;
  marker: string;
  markerLabel: string;
  tags: ReadonlyArray<string>;
  metadata: string;
  claim?: Claim;
}>;
type Subtask = Readonly<{ id: string; text: string; state: 'complete' | 'pending' }>;
type Fact = Readonly<{ term: string; value: string }>;
type HistoryEvent = Readonly<{
  id: string;
  summary: string;
  actor: string;
  datetime: string;
  time: string;
  trust: string;
  content?: string;
}>;
type DetailFixture = Readonly<{
  repository: string;
  mission: string;
  workPackageId: string;
  title: string;
  supporting: string;
  status: string;
  statusTone: 'neutral' | 'info' | 'success' | 'attention' | 'danger' | 'recovery';
  subtasks: ReadonlyArray<Subtask>;
  prompt: TemplateResult | null;
  longPrompt: TemplateResult;
  facts: ReadonlyArray<Fact>;
  events: ReadonlyArray<HistoryEvent>;
  longEvents: ReadonlyArray<HistoryEvent>;
  historyUnavailable?: Readonly<{ heading: string; message: string; announce: 'polite' }>;
}>;
type WorkPackageViewFixture = Readonly<{
  overview: Readonly<{
    title: string;
    supporting: string;
    lanes: ReadonlyArray<Lane>;
    completedLaneId: string;
    workPackages: ReadonlyArray<WorkPackage>;
    scaleWorkPackages: ReadonlyArray<WorkPackage>;
    snapshotNotice: Readonly<{ heading: string; message: string; announce: 'polite' }>;
  }>;
  detail: DetailFixture;
}>;

export const deepFreezeWorkPackageFixture = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreezeWorkPackageFixture(nested);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

const isDeeplyFrozen = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object') return true;
  return Object.isFrozen(value) && Object.values(value as Record<string, unknown>).every(isDeeplyFrozen);
};

const LANES = [
  { id: 'planned', label: 'Planned' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'for-review', label: 'For review' },
  { id: 'approved', label: 'Approved' },
  { id: 'done', label: 'Done' },
] as const;

const BASE_WORK_PACKAGES = [
  { id: 'wp-01', laneId: 'planned', title: 'Define route acceptance evidence', reference: 'WP01 · specification', marker: '01', markerLabel: 'Work Package 01', tags: ['Specification'], metadata: 'Queued' },
  { id: 'wp-02', laneId: 'in-progress', title: 'Compose the Work Package overview', reference: 'WP02 · composition', marker: '02', markerLabel: 'Work Package 02', tags: ['Elements first'], metadata: 'Updated 09:12 UTC', claim: { state: 'live', tone: 'success', label: 'Live claim', claimant: 'Mia' } },
  { id: 'wp-03', laneId: 'for-review', title: 'Verify native lane semantics', reference: 'WP03 · accessibility', marker: '03', markerLabel: 'Work Package 03', tags: ['Review'], metadata: 'Updated 09:28 UTC' },
  { id: 'wp-04', laneId: 'done', title: 'Author immutable route fixtures', reference: 'WP04 · fixtures', marker: '04', markerLabel: 'Work Package 04', tags: ['Complete'], metadata: 'Completed 10:01 UTC' },
  { id: 'wp-05', laneId: 'done', title: 'Deliver progress primitive', reference: 'WP05 · public surface', marker: '05', markerLabel: 'Work Package 05', tags: ['Complete'], metadata: 'Completed 10:14 UTC' },
  { id: 'wp-06', laneId: 'done', title: 'Deliver workflow board primitives', reference: 'WP06 · public surface', marker: '06', markerLabel: 'Work Package 06', tags: ['Complete'], metadata: 'Completed 10:31 UTC' },
  { id: 'wp-07', laneId: 'done', title: 'Deliver detail content primitives', reference: 'WP07 · public surface', marker: '07', markerLabel: 'Work Package 07', tags: ['Complete'], metadata: 'Completed 10:46 UTC' },
  { id: 'wp-08', laneId: 'done', title: 'Deliver compact Work Package items', reference: 'WP08 · public surface', marker: '08', markerLabel: 'Work Package 08', tags: ['Complete'], metadata: 'Completed 11:02 UTC', claim: { state: 'stale', tone: 'attention', label: 'Stale claim', claimant: 'Ada', advisory: 'Claim signal is stale; activation remains available.' } },
] as const;

const SCALE_WORK_PACKAGES = Array.from({ length: 50 }, (_, index) => {
  const lane = LANES[index % LANES.length]!;
  const number = index + 1;
  return {
    id: `scale-wp-${String(number).padStart(2, '0')}`,
    laneId: lane.id,
    title: `Fixture-owned scale Work Package ${number}`,
    reference: `WP${String(number).padStart(2, '0')} · scale evidence`,
    marker: String(number).padStart(2, '0'),
    markerLabel: `Scale Work Package ${number}`,
    tags: ['Scale'],
    metadata: `Supplied position ${number} of 50`,
  };
});

const LONG_PROMPT = html`
  <article class="sk-prose sk-work-package-pattern__prompt" data-work-package-prompt>
    <h2>Long implementation prompt</h2>
    <p>A long consumer-authored prompt remains ordinary Lit HTML and is never parsed by the pattern.</p>
    <pre
      data-long-code
      role="region"
      aria-label="Long Work Package prompt code"
      tabindex="0"
    ><code>const extremelyLongConsumerOwnedIdentifier = 'work-package-view-pattern-stories-keeps-this-unbroken-code-line-inside-its-own-scroll-container-without-widening-the-route';</code></pre>
  </article>
`;

const LONG_EVENTS = Array.from({ length: 20 }, (_, index) => ({
  id: `long-event-${index + 1}`,
  summary: `${index + 1}. Consumer-supplied transition with a deliberately descriptive label`,
  actor: `Actor ${index + 1}`,
  datetime: `2026-09-07T${String(index).padStart(2, '0')}:00:00Z`,
  time: `${String(index).padStart(2, '0')}:00 UTC`,
  trust: `Supplied trust label ${index + 1}`,
  content: `Event ${index + 1} remains in fixture order.`,
}));

export const WORK_PACKAGE_VIEW_FIXTURE = deepFreezeWorkPackageFixture({
  overview: {
    title: 'Work Packages',
    supporting: 'Follow each package from planned work to completed evidence.',
    lanes: LANES,
    completedLaneId: 'done',
    workPackages: BASE_WORK_PACKAGES,
    scaleWorkPackages: SCALE_WORK_PACKAGES,
    snapshotNotice: {
      heading: 'Snapshot behind activity log',
      message: 'This supplied snapshot may not include the latest recorded transition.',
      announce: 'polite',
    },
  },
  detail: {
    repository: 'spec-kitty/spec-kitty-design',
    mission: 'work-package-view-pattern-stories',
    workPackageId: 'WP01',
    title: 'Work Package view patterns and proof',
    supporting: 'Compose approved overview and detail routes from public surfaces.',
    status: 'In progress',
    statusTone: 'info',
    subtasks: [
      { id: 'task-spec', text: 'Specification and boundary accepted', state: 'complete' },
      { id: 'task-fixture', text: 'Immutable route fixture implemented', state: 'complete' },
      { id: 'task-proof', text: 'Cross-browser evidence recorded', state: 'pending' },
    ],
    prompt: html`
      <article class="sk-prose sk-work-package-pattern__prompt" data-work-package-prompt>
        <h2>Implementation prompt</h2>
        <p>Compose public surfaces while preserving native semantics and consumer ownership.</p>
        <h3>Required proof</h3>
        <ul><li>Keep route data immutable.</li><li>Keep overflow local.</li></ul>
        <pre><code>const selectedWorkPackageId = 'wp-02';</code></pre>
      </article>
    `,
    longPrompt: LONG_PROMPT,
    facts: [
      { term: 'Status', value: 'In progress' },
      { term: 'Assignee', value: 'Mia' },
      { term: 'Branch', value: 'mission/work-package-view-pattern-stories' },
      { term: 'Evidence', value: 'Consumer supplied' },
    ],
    events: [
      { id: 'event-created', summary: '1. Work Package created', actor: 'Planner Priti', datetime: '2026-09-07T09:00:00Z', time: '09:00 UTC', trust: 'Repository evidence', content: 'Scope and acceptance checks recorded.' },
      { id: 'event-started', summary: '2. Implementation started', actor: 'Implementer Ivan', datetime: '2026-09-07T10:15:00Z', time: '10:15 UTC', trust: 'Runtime event' },
      { id: 'event-review', summary: '3. Review requested', actor: 'Reviewer Renata', datetime: '2026-09-07T11:30:00Z', time: '11:30 UTC', trust: 'Consumer-supplied label' },
    ],
    longEvents: LONG_EVENTS,
    historyUnavailable: {
      heading: 'Transition history unavailable',
      message: 'Events outside the supplied retention window are unavailable.',
      announce: 'polite',
    },
  },
} satisfies WorkPackageViewFixture);

export const deriveOverview = (
  fixture: DeepReadonly<WorkPackageViewFixture['overview']>,
  workPackages: ReadonlyArray<DeepReadonly<WorkPackage>> = fixture.workPackages,
  visibleLaneId?: string,
) => {
  const laneIds = new Set(fixture.lanes.map((lane) => lane.id));
  if (laneIds.size !== fixture.lanes.length) throw new TypeError('Lane identifiers must be unique.');
  if (!laneIds.has(fixture.completedLaneId)) throw new TypeError('completedLaneId must identify a supplied lane.');

  const workPackageIds = new Set<string>();
  for (const workPackage of workPackages) {
    if (workPackageIds.has(workPackage.id)) throw new TypeError(`Duplicate Work Package identifier: ${workPackage.id}.`);
    if (!laneIds.has(workPackage.laneId)) throw new TypeError(`Unknown lane identifier: ${workPackage.laneId}.`);
    workPackageIds.add(workPackage.id);
  }

  if (visibleLaneId !== undefined && !laneIds.has(visibleLaneId)) {
    throw new TypeError(`Unknown visible lane identifier: ${visibleLaneId}.`);
  }

  const lanes = fixture.lanes.map((lane) => ({
    ...lane,
    workPackages: workPackages.filter((workPackage) => workPackage.laneId === lane.id),
  })).filter((lane) => visibleLaneId === undefined || lane.id === visibleLaneId);
  const total = workPackages.length;
  const completed = workPackages.filter((workPackage) => workPackage.laneId === fixture.completedLaneId).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return deepFreezeWorkPackageFixture({ lanes, total, completed, percentage });
};

export const deriveDetail = (detail: DeepReadonly<DetailFixture>) => {
  const subtaskIds = new Set<string>();
  for (const subtask of detail.subtasks) {
    if (subtaskIds.has(subtask.id)) throw new TypeError(`Duplicate subtask identifier: ${subtask.id}.`);
    subtaskIds.add(subtask.id);
  }
  const completed = detail.subtasks.filter((subtask) => subtask.state === 'complete').length;
  return deepFreezeWorkPackageFixture({
    completed,
    total: detail.subtasks.length,
    percentage: detail.subtasks.length === 0 ? 0 : Math.round((completed / detail.subtasks.length) * 100),
    events: detail.events.map((event) => ({ ...event })),
  });
};

const projectionGuardProof = () => {
  const overview = WORK_PACKAGE_VIEW_FIXTURE.overview;
  const checks = [
    ['duplicateLane', () => deriveOverview({ ...overview, lanes: [...overview.lanes, overview.lanes[0]!] })],
    ['unknownCompletedLane', () => deriveOverview({ ...overview, completedLaneId: 'not-supplied' })],
    ['duplicateWorkPackage', () => deriveOverview(overview, [overview.workPackages[0]!, overview.workPackages[0]!])],
    ['unknownWorkPackageLane', () => deriveOverview(overview, [{ ...overview.workPackages[0]!, laneId: 'not-supplied' }])],
    ['unknownVisibleLane', () => deriveOverview(overview, overview.workPackages, 'not-supplied')],
  ] as const;
  return Object.fromEntries(checks.map(([name, check]) => {
    try {
      check();
      return [name, false];
    } catch {
      return [name, true];
    }
  }));
};

type OverviewArgs = Readonly<{
  selectedWorkPackageId: string;
  selectedLaneId: string;
  onWorkPackageActivate: (detail: ActionRowActivateDetail) => void;
  onLaneChange: (laneId: string) => void;
}>;

type OverviewOptions = Readonly<{
  light?: boolean;
  empty?: boolean;
  scale?: boolean;
  claimState?: Claim['state'];
  snapshotNotice?: boolean;
  narrow?: boolean;
}>;

const patternStyles = html`<style>
  .sk-work-package-pattern {
    box-sizing: border-box;
    min-inline-size: 0;
    inline-size: 100%;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }
  .sk-work-package-pattern *,
  .sk-work-package-pattern *::before,
  .sk-work-package-pattern *::after { box-sizing: border-box; }
  .sk-work-package-pattern :where(h2, h3, p, ol, ul, dl) { margin: 0; }
  .sk-work-package-pattern__page { display: grid; min-inline-size: 0; gap: var(--sk-space-6); padding: var(--sk-space-6); }
  .sk-work-package-pattern__summary { display: grid; min-inline-size: 0; gap: var(--sk-space-4); }
  .sk-work-package-pattern__selector { max-inline-size: var(--sk-layout-workflow-lane-min-inline-size); }
  .sk-work-package-pattern__board-frame { min-inline-size: 0; max-inline-size: 100%; }
  .sk-work-package-pattern__board-frame--overflow-proof {
    max-inline-size: calc(
      var(--sk-layout-workflow-lane-min-inline-size) +
      var(--sk-layout-workflow-lane-min-inline-size) +
      var(--sk-layout-workflow-lane-min-inline-size) +
      var(--sk-layout-workflow-lane-min-inline-size)
    );
  }
  .sk-work-package-pattern__empty { margin-block-start: var(--sk-space-3); }
  .sk-work-package-pattern__detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sk-space-6); min-inline-size: 0; }
  .sk-work-package-pattern__detail-column { display: grid; align-content: start; min-inline-size: 0; gap: var(--sk-space-5); }
  .sk-work-package-pattern__section { display: grid; min-inline-size: 0; max-inline-size: 100%; gap: var(--sk-space-3); }
  .sk-work-package-pattern__prompt { min-inline-size: 0; max-inline-size: 100%; }
  .sk-work-package-pattern__prompt > pre { min-inline-size: 0; max-inline-size: 100%; }
  .sk-work-package-pattern__checklist { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sk-space-3); }
  .sk-work-package-pattern__facts { margin-block-start: var(--sk-space-4); }
  .sk-work-package-pattern__long { overflow-wrap: anywhere; }
  .sk-work-package-pattern--narrow .sk-work-package-pattern__page { padding: var(--sk-space-4); }
  .sk-work-package-pattern--narrow .sk-work-package-pattern__detail-grid { grid-template-columns: minmax(0, 1fr); }
</style>`;

const renderProgress = (completed: number, total: number, percentage: number, id: string) => html`
  <div class="sk-progress" data-work-package-progress>
    <label class="sk-progress__label" for=${id}>${completed} of ${total} Work Packages done</label>
    <progress class="sk-progress__bar" id=${id} value=${completed} max=${total === 0 ? 1 : total}>${percentage}%</progress>
    <span class="sk-progress__meta">${percentage}%</span>
  </div>
`;

const renderClaim = (claim: DeepReadonly<Claim>) => html`
  <sk-status-indicator
    slot="tags"
    tone=${claim.tone}
    ?pulsing=${claim.state === 'live'}
    data-claim-state=${claim.state}
  ><span slot="marker">●</span>${claim.label}</sk-status-indicator>
`;

const renderWorkPackage = (
  workPackage: DeepReadonly<WorkPackage>,
  args: OverviewArgs,
  rootId: string,
) => html`
  <li data-work-package-id=${workPackage.id}>
    <sk-action-row
      layout="card"
      row-id=${workPackage.id}
      selectable
      ?selected=${args.selectedWorkPackageId === workPackage.id}
      @sk-action-row-activate=${(event: CustomEvent<ActionRowActivateDetail>) => {
        args.onWorkPackageActivate(event.detail);
        const log = document.querySelector<HTMLElement>(`#${rootId} [data-activation-log]`);
        if (log) {
          const count = Number(log.dataset['count'] ?? '0') + 1;
          log.dataset['count'] = String(count);
          log.dataset['id'] = event.detail.id;
        }
      }}
    >
      <sk-entity-marker slot="marker" label=${workPackage.markerLabel} size="sm" shape="circle">${workPackage.marker}</sk-entity-marker>
      <span slot="title">${workPackage.title}</span>
      <code slot="reference">${workPackage.reference}</code>
      ${workPackage.tags.map((tag) => html`<sk-pill-tag slot="tags">${tag}</sk-pill-tag>`)}
      ${workPackage.claim ? renderClaim(workPackage.claim) : nothing}
      <span slot="metadata">${workPackage.metadata}</span>
      ${workPackage.claim ? html`<span slot="supporting">Claimed by ${workPackage.claim.claimant}${workPackage.claim.advisory ? html` · ${workPackage.claim.advisory}` : nothing}</span>` : nothing}
    </sk-action-row>
  </li>
`;

export const renderWorkPackageOverview = (args: OverviewArgs, options: OverviewOptions = {}) => {
  const overview = WORK_PACKAGE_VIEW_FIXTURE.overview;
  const source = options.empty
    ? []
    : options.scale
      ? overview.scaleWorkPackages
      : options.claimState
        ? overview.workPackages.filter((workPackage) => workPackage.claim?.state === options.claimState)
        : overview.workPackages;
  const projection = deriveOverview(overview, source, options.narrow ? args.selectedLaneId : undefined);
  const rootId = `work-package-overview-${options.narrow ? 'narrow' : options.scale ? 'scale' : options.claimState ?? 'default'}`;
  const demonstratesBoardOverflow = options.scale === true;

  return html`
    <main
      id=${rootId}
      class="sk-work-package-pattern${options.light ? ' sk-light' : ''}${options.narrow ? ' sk-work-package-pattern--narrow' : ''}"
      data-work-package-overview
      data-render-complete="true"
      data-fixture-deeply-frozen=${String(isDeeplyFrozen(WORK_PACKAGE_VIEW_FIXTURE))}
      data-completed-count=${projection.completed}
      data-total-count=${projection.total}
      data-percentage=${projection.percentage}
      data-work-package-ids=${JSON.stringify(source.map((workPackage) => workPackage.id))}
      data-projection-guards=${JSON.stringify(projectionGuardProof())}
      data-selected-work-package-id=${args.selectedWorkPackageId}
      data-visible-lane-id=${options.narrow ? args.selectedLaneId : ''}
    >
      ${patternStyles}
      <div class="sk-work-package-pattern__page">
        <sk-page-header>
          <span slot="eyebrow">Mission execution</span>
          <h1 slot="title">${overview.title}</h1>
          <p slot="supporting">${overview.supporting}</p>
          <span slot="sync">Fixture snapshot · supplied by the consumer</span>
        </sk-page-header>

        <section class="sk-work-package-pattern__summary" aria-label="Work Package completion">
          ${renderProgress(projection.completed, projection.total, projection.percentage, `${rootId}-progress`)}
          ${options.snapshotNotice ? html`
            <sk-notice tone="attention" announce=${overview.snapshotNotice.announce} message=${overview.snapshotNotice.message} data-snapshot-notice>
              <h2 slot="heading">${overview.snapshotNotice.heading}</h2>
            </sk-notice>
          ` : nothing}
        </section>

        ${options.narrow ? html`
          <div class="sk-form-field sk-work-package-pattern__selector">
            <label class="sk-form-field__label" for="${rootId}-lane">Lane</label>
            <select
              class="sk-form-select"
              id="${rootId}-lane"
              name="lane"
              .value=${args.selectedLaneId}
              @change=${(event: Event) => {
                const laneId = (event.currentTarget as HTMLSelectElement).value;
                args.onLaneChange(laneId);
                const log = document.querySelector<HTMLElement>(`#${rootId} [data-lane-intent-log]`);
                if (log) {
                  log.dataset['count'] = String(Number(log.dataset['count'] ?? '0') + 1);
                  log.dataset['laneId'] = laneId;
                }
              }}
              aria-describedby="${rootId}-lane-help"
            >
              ${overview.lanes.map((lane) => html`<option value=${lane.id} ?selected=${lane.id === args.selectedLaneId}>${lane.label}</option>`)}
            </select>
            <span class="sk-form-field__description" id="${rootId}-lane-help">Choose which supplied lane to inspect.</span>
          </div>
        ` : nothing}

        <div class="sk-work-package-pattern__board-frame${demonstratesBoardOverflow ? ' sk-work-package-pattern__board-frame--overflow-proof' : ''}">
          <section class="sk-workflow-board" aria-labelledby="${rootId}-board-title">
            <h2 id="${rootId}-board-title">Work Package workflow</h2>
            <div
              class="sk-workflow-board__scroller"
              role=${demonstratesBoardOverflow ? 'region' : nothing}
              aria-labelledby=${demonstratesBoardOverflow ? `${rootId}-board-title` : nothing}
              tabindex=${demonstratesBoardOverflow ? '0' : nothing}
            >
              ${projection.lanes.map((lane) => html`
                <section class="sk-workflow-lane" aria-labelledby="${rootId}-${lane.id}-title" data-lane-id=${lane.id}>
                  <header class="sk-workflow-lane__header">
                    <h3 class="sk-workflow-lane__title" id="${rootId}-${lane.id}-title">${lane.label}</h3>
                    <span class="sk-workflow-lane__count" aria-label="${lane.workPackages.length} Work Packages">${lane.workPackages.length}</span>
                  </header>
                  <ol class="sk-workflow-lane__list">
                    ${lane.workPackages.map((workPackage) => renderWorkPackage(workPackage, args, rootId))}
                  </ol>
                  ${lane.workPackages.length === 0 ? html`
                    <div class="sk-empty-state sk-empty-state--inline sk-work-package-pattern__empty">
                      <p class="sk-empty-state__heading">No Work Packages in ${lane.label}</p>
                      <p class="sk-empty-state__body">This supplied lane is empty.</p>
                    </div>
                  ` : nothing}
                </section>
              `)}
            </div>
          </section>
        </div>
      </div>
      <output data-activation-log data-count="0" hidden></output>
      <output data-lane-intent-log data-count="0" hidden></output>
    </main>
  `;
};

type DetailOptions = Readonly<{
  light?: boolean;
  noSubtasks?: boolean;
  absentPrompt?: boolean;
  historyUnavailable?: boolean;
  long?: boolean;
  narrow?: boolean;
}>;

export const renderWorkPackageDetail = (options: DetailOptions = {}) => {
  const base = WORK_PACKAGE_VIEW_FIXTURE.detail;
  const detail = {
    ...base,
    subtasks: options.noSubtasks ? [] : base.subtasks,
    prompt: options.absentPrompt ? null : options.long ? base.longPrompt : base.prompt,
    events: options.long ? base.longEvents : base.events,
    historyUnavailable: options.historyUnavailable ? base.historyUnavailable : undefined,
  };
  const projection = deriveDetail(detail);

  return html`
    <main
      class="sk-work-package-pattern${options.light ? ' sk-light' : ''}${options.narrow ? ' sk-work-package-pattern--narrow' : ''}"
      data-work-package-detail
      data-render-complete="true"
      data-fixture-deeply-frozen=${String(isDeeplyFrozen(WORK_PACKAGE_VIEW_FIXTURE))}
      data-subtask-completed=${projection.completed}
      data-subtask-total=${projection.total}
      data-subtask-percentage=${projection.percentage}
      data-event-order=${JSON.stringify(projection.events.map((event) => event.id))}
    >
      ${patternStyles}
      <div class="sk-work-package-pattern__page">
        <nav class="sk-breadcrumbs" aria-label="Breadcrumb">
          <ol class="sk-breadcrumbs__list">
            <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="#repository">${detail.repository}</a></li>
            <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="#mission">${detail.mission}</a></li>
            <li class="sk-breadcrumbs__item"><span aria-current="page">${detail.workPackageId}</span></li>
          </ol>
        </nav>

        <sk-page-header>
          <span slot="eyebrow">${detail.workPackageId}</span>
          <h1 slot="title">${detail.title}</h1>
          <p slot="supporting">${detail.supporting}</p>
          <sk-status-indicator slot="sync" tone=${detail.statusTone}><span slot="marker">●</span>${detail.status}</sk-status-indicator>
        </sk-page-header>

        <div class="sk-work-package-pattern__detail-grid">
          <div class="sk-work-package-pattern__detail-column">
            <section class="sk-work-package-pattern__section" aria-labelledby="work-package-subtasks-heading">
              <h2 id="work-package-subtasks-heading">Subtasks</h2>
              ${detail.subtasks.length > 0 ? html`
                <ul class="sk-work-package-pattern__checklist" role="list">
                  ${detail.subtasks.map((subtask) => html`
                    <sk-check-bullet role="listitem" state=${subtask.state} data-subtask-id=${subtask.id}>${subtask.text}</sk-check-bullet>
                  `)}
                </ul>
              ` : html`
                <div class="sk-empty-state sk-empty-state--inline" data-no-subtasks>
                  <p class="sk-empty-state__heading">No subtasks</p>
                  <p class="sk-empty-state__body">This Work Package has no supplied subtasks.</p>
                </div>
              `}
            </section>

            <section class="sk-work-package-pattern__section" aria-labelledby="work-package-prompt-heading">
              <h2 id="work-package-prompt-heading">Prompt</h2>
              ${detail.prompt ?? html`
                <div class="sk-empty-state sk-empty-state--inline" data-absent-prompt>
                  <p class="sk-empty-state__heading">No prompt supplied</p>
                  <p class="sk-empty-state__body">The application has not supplied prompt content.</p>
                </div>
              `}
            </section>
          </div>

          <div class="sk-work-package-pattern__detail-column">
            <sk-card>
              <h2>Work Package facts</h2>
              <dl class="sk-facts sk-facts--two-col sk-work-package-pattern__facts">
                ${detail.facts.map((fact) => html`<dt class="sk-facts__term">${fact.term}</dt><dd class="sk-facts__value sk-work-package-pattern__long">${fact.value}</dd>`)}
              </dl>
            </sk-card>

            <section class="sk-work-package-pattern__section" aria-labelledby="work-package-history-heading">
              <h2 id="work-package-history-heading">Transition history</h2>
              ${detail.historyUnavailable ? html`
                <sk-notice tone="neutral" announce=${detail.historyUnavailable.announce} message=${detail.historyUnavailable.message} data-history-unavailable>
                  <h3 slot="heading">${detail.historyUnavailable.heading}</h3>
                </sk-notice>
              ` : html`
                <ol class="sk-event-timeline">
                  ${detail.events.map((event) => html`
                    <li class="sk-event-timeline__item" data-event-id=${event.id}>
                      <p class="sk-event-timeline__summary">${event.summary}</p>
                      <p class="sk-event-timeline__metadata"><span>${event.actor}</span><time datetime=${event.datetime}>${event.time}</time><span>${event.trust}</span></p>
                      ${event.content ? html`<p class="sk-event-timeline__content">${event.content}</p>` : nothing}
                    </li>
                  `)}
                </ol>
              `}
            </section>
          </div>
        </div>
      </div>
    </main>
  `;
};

const baseArgs: OverviewArgs = {
  selectedWorkPackageId: 'wp-02',
  selectedLaneId: 'in-progress',
  onWorkPackageActivate: fn(),
  onLaneChange: fn(),
};

const meta: Meta<OverviewArgs> = {
  title: 'Patterns/Work Package Views',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: { description: { component: 'Story-only T10 overview and T11 detail compositions built from public elements, styles, native semantics, immutable fixtures, and pure projections.' } },
  },
  args: baseArgs,
  excludeStories: [
    'deepFreezeWorkPackageFixture',
    'WORK_PACKAGE_VIEW_FIXTURE',
    'deriveOverview',
    'deriveDetail',
    'renderWorkPackageOverview',
    'renderWorkPackageDetail',
  ],
  render: (args) => renderWorkPackageOverview(args),
};

export default meta;
type Story = StoryObj<OverviewArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-work-package-overview]');
    await expect(root).not.toBeNull();
    await expect(root?.dataset.fixtureDeeplyFrozen).toBe('true');
    await expect(root?.dataset.workPackageIds).toBe(JSON.stringify(BASE_WORK_PACKAGES.map(({ id }) => id)));
    const lanes = root?.querySelectorAll<HTMLElement>(':scope section.sk-workflow-lane[data-lane-id]');
    await expect(lanes).toHaveLength(LANES.length);
    for (const lane of lanes ?? []) {
      const labelledBy = lane.getAttribute('aria-labelledby');
      await expect(labelledBy).toBeTruthy();
      await expect(lane.querySelector(`:scope > header > h3#${CSS.escape(labelledBy ?? '')}`)).not.toBeNull();
      await expect(lane.querySelectorAll(':scope > ol.sk-workflow-lane__list')).toHaveLength(1);
    }
    await expect(root?.querySelectorAll(':scope sk-action-row')).toHaveLength(BASE_WORK_PACKAGES.length);
    root?.setAttribute('data-play-proof', 'passed');
  },
};
export const LightMode: Story = { parameters: { backgrounds: { default: 'sk-light' } }, render: (args) => renderWorkPackageOverview(args, { light: true }) };
export const AllLanesEmpty: Story = { render: (args) => renderWorkPackageOverview(args, { empty: true }) };
export const Scale50WorkPackages: Story = { render: (args) => renderWorkPackageOverview(args, { scale: true }) };
export const LiveClaim: Story = { render: (args) => renderWorkPackageOverview(args, { claimState: 'live' }) };
export const StaleClaim: Story = { render: (args) => renderWorkPackageOverview(args, { claimState: 'stale' }) };
export const SnapshotBehindLog: Story = { render: (args) => renderWorkPackageOverview(args, { snapshotNotice: true }) };
export const NarrowOverview: Story = { render: (args) => renderWorkPackageOverview(args, { narrow: true }) };
export const DetailPopulated: Story = { render: () => renderWorkPackageDetail() };
export const DetailLightMode: Story = { parameters: { backgrounds: { default: 'sk-light' } }, render: () => renderWorkPackageDetail({ light: true }) };
export const DetailNoSubtasks: Story = { render: () => renderWorkPackageDetail({ noSubtasks: true }) };
export const DetailAbsentPrompt: Story = { render: () => renderWorkPackageDetail({ absentPrompt: true }) };
export const DetailHistoryUnavailable: Story = { render: () => renderWorkPackageDetail({ historyUnavailable: true }) };
export const DetailLongContent: Story = { render: () => renderWorkPackageDetail({ long: true }) };
export const DetailNarrow: Story = { render: () => renderWorkPackageDetail({ narrow: true, long: true }) };
