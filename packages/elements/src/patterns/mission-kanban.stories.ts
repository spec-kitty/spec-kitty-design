import type { Meta, StoryObj } from '@storybook/web-components';
import { expect } from 'storybook/test';
import { html, nothing, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../action-row/sk-action-row.js';
import '../app-shell/sk-app-shell.js';
import '../button/sk-button.js';
import '../context-sidebar/sk-context-sidebar.js';
import '../notice/sk-notice.js';
import '../page-header/sk-page-header.js';
import '../personal-rail/sk-personal-rail.js';
import '../pill-tag/sk-pill-tag.js';
import '../status-indicator/sk-status-indicator.js';

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type DeepReadonly<T> = T extends Primitive | ((...args: never[]) => unknown)
  ? T
  : T extends ReadonlyArray<infer Item>
    ? ReadonlyArray<DeepReadonly<Item>>
    : { readonly [Key in keyof T]: DeepReadonly<T[Key]> };

type StageId = 'planned' | 'doing' | 'for_review' | 'approved' | 'done';
type DetailedLaneId =
  | 'genesis'
  | 'planned'
  | 'claimed'
  | 'in_progress'
  | 'for_review'
  | 'in_review'
  | 'approved'
  | 'done'
  | 'blocked'
  | 'canceled';

type TrackerReferenceFixture = Readonly<{ label: string; href: string }>;
type ObservedActivityFixture = Readonly<{
  classification: 'observed';
  actorLabel: string;
  targetLaneId: DetailedLaneId;
  lagLabel: string;
  message: string;
}>;
type WorkPackageFixture = Readonly<{
  id: string;
  href: string;
  committedLaneId: Exclude<DetailedLaneId, 'genesis'>;
  agentProfileLabel: string;
  trackerReferences: ReadonlyArray<TrackerReferenceFixture>;
  observedActivity?: ObservedActivityFixture;
}>;
type MissionKanbanFixture = Readonly<{
  teamLabel: string;
  repositoryLabel: string;
  missionId: string;
  missionLabel: string;
  commit: Readonly<{ shaLabel: string; branchLabel: string; trustLabel: string }>;
  navigation: ReadonlyArray<Readonly<{
    label: string;
    href: string;
    current?: boolean;
    available?: boolean;
  }>>;
  stages: ReadonlyArray<Readonly<{
    id: StageId;
    label: string;
    detailedLaneIds: ReadonlyArray<DetailedLaneId>;
  }>>;
  detailedLanes: ReadonlyArray<Readonly<{ id: DetailedLaneId; label: string }>>;
  workPackages: ReadonlyArray<WorkPackageFixture>;
  k3SelectedLaneIds: readonly ['in_review', 'blocked'];
  snapshot: Readonly<{
    classification: 'snapshot-behind-log';
    heading: string;
    message: string;
    announce: 'polite';
  }>;
  reportedActivity: ReadonlyArray<Readonly<{
    classification: 'reported-live';
    actorLabel: string;
    repositoryLabel: string;
    branchLabel: string;
    ageLabel: string;
    trustLabel: string;
  }>>;
  copy: Readonly<{
    boardHeading: string;
    boardHelp: string;
    emptyLane: string;
    emptyActivity: string;
  }>;
  stress: Readonly<{
    teamLabel: string;
    repositoryLabel: string;
    missionLabel: string;
    branchLabel: string;
  }>;
}>;

type ProjectionOptions = Readonly<{
  includedWorkPackageIds?: ReadonlyArray<string>;
  selectedLaneIds?: ReadonlyArray<DetailedLaneId>;
  hideEmptyStages?: boolean;
  includeSnapshot?: boolean;
  includeObservedActivity?: boolean;
  includeReportedActivity?: boolean;
}>;

type PresentationOptions = Readonly<{
  state: string;
  compact?: boolean;
  light?: boolean;
  long?: boolean;
  filters?: boolean;
}>;

export const deepFreezeMissionKanban = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreezeMissionKanban(nested);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
};

export const isMissionKanbanDeeplyFrozen = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object') return true;
  return Object.isFrozen(value) &&
    Object.values(value as Record<string, unknown>).every(isMissionKanbanDeeplyFrozen);
};

export const MISSION_KANBAN_FIXTURE = deepFreezeMissionKanban({
  teamLabel: 'Collaborative Demo Team',
  repositoryLabel: 'EXPERIMENTAL-spec-kitty-saas',
  missionId: '#1042',
  missionLabel: 'Launch resilience tranche A',
  commit: {
    shaLabel: '72c4e9a',
    branchLabel: 'feature/launch-resilience',
    trustLabel: 'Mission state · verified',
  },
  navigation: [
    { label: 'Overview', href: '#mission-overview', available: true },
    { label: 'Specify', href: '#mission-specify', available: true },
    { label: 'Plan', href: '#mission-plan', available: true },
    { label: 'Tasks', href: '#mission-tasks', available: true },
    { label: 'Kanban', href: '#mission-kanban-content', current: true, available: true },
    { label: 'Research', href: '#mission-research', available: true },
    { label: 'Contracts', href: '#mission-contracts', available: true },
    { label: 'Checklists', href: '#mission-checklists', available: false },
    { label: 'Quickstart', href: '#mission-quickstart', available: false },
    { label: 'Data Model', href: '#mission-data-model', available: false },
    { label: 'Other artifacts', href: '#mission-artifacts', available: false },
    { label: 'Ops', href: '#mission-ops', available: true },
  ],
  stages: [
    { id: 'planned', label: 'Planned', detailedLaneIds: ['planned', 'blocked'] },
    { id: 'doing', label: 'Doing', detailedLaneIds: ['claimed', 'in_progress'] },
    { id: 'for_review', label: 'For review', detailedLaneIds: ['for_review', 'in_review'] },
    { id: 'approved', label: 'Approved', detailedLaneIds: ['approved'] },
    { id: 'done', label: 'Done', detailedLaneIds: ['done', 'canceled'] },
  ],
  detailedLanes: [
    { id: 'genesis', label: 'Genesis' },
    { id: 'planned', label: 'Planned' },
    { id: 'claimed', label: 'Claimed' },
    { id: 'in_progress', label: 'In progress' },
    { id: 'for_review', label: 'For review' },
    { id: 'in_review', label: 'In review' },
    { id: 'approved', label: 'Approved' },
    { id: 'done', label: 'Done' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'canceled', label: 'Canceled' },
  ],
  workPackages: [
    { id: 'WP04', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP04/', committedLaneId: 'planned', agentProfileLabel: 'implementer-ivan', trackerReferences: [{ label: '#1051', href: 'https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty-saas/issues/1051' }] },
    { id: 'WP05', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP05/', committedLaneId: 'blocked', agentProfileLabel: 'researcher-robbie', trackerReferences: [{ label: '#1054', href: 'https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty-saas/issues/1054' }] },
    { id: 'WP06', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP06/', committedLaneId: 'planned', agentProfileLabel: 'implementer-ivan', trackerReferences: [] },
    {
      id: 'WP03',
      href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP03/',
      committedLaneId: 'in_progress',
      agentProfileLabel: 'implementer-ivan',
      trackerReferences: [{ label: '#1048', href: 'https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty-saas/issues/1048' }],
      observedActivity: {
        classification: 'observed',
        actorLabel: 'lynn',
        targetLaneId: 'for_review',
        lagLabel: 'up to 60 s behind',
        message: 'lynn → for_review, not yet pushed',
      },
    },
    { id: 'WP07', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP07/', committedLaneId: 'claimed', agentProfileLabel: 'reviewer-rachel', trackerReferences: [] },
    { id: 'WP08', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP08/', committedLaneId: 'in_progress', agentProfileLabel: 'implementer-ivan', trackerReferences: [] },
    { id: 'WP09', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP09/', committedLaneId: 'in_progress', agentProfileLabel: 'implementer-ivan', trackerReferences: [] },
    { id: 'WP02', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP02/', committedLaneId: 'for_review', agentProfileLabel: 'reviewer-rachel', trackerReferences: [{ label: '#1046', href: 'https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty-saas/issues/1046' }] },
    { id: 'WP10', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP10/', committedLaneId: 'in_review', agentProfileLabel: 'reviewer-rachel', trackerReferences: [] },
    { id: 'WP11', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP11/', committedLaneId: 'for_review', agentProfileLabel: 'reviewer-rachel', trackerReferences: [] },
    { id: 'WP01', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP01/', committedLaneId: 'approved', agentProfileLabel: 'reviewer-rachel', trackerReferences: [{ label: '#1043', href: 'https://github.com/spec-kitty/EXPERIMENTAL-spec-kitty-saas/issues/1043' }] },
    { id: 'WP12', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP12/', committedLaneId: 'done', agentProfileLabel: 'implementer-ivan', trackerReferences: [] },
    { id: 'WP13', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP13/', committedLaneId: 'done', agentProfileLabel: 'implementer-ivan', trackerReferences: [] },
    { id: 'WP14', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP14/', committedLaneId: 'done', agentProfileLabel: 'implementer-ivan', trackerReferences: [] },
    { id: 'WP15', href: '/a/collaborative-demo/repos/EXPERIMENTAL-spec-kitty-saas/m/launch-resilience-tranche-a/w/WP15/', committedLaneId: 'done', agentProfileLabel: 'implementer-ivan', trackerReferences: [] },
  ],
  k3SelectedLaneIds: ['in_review', 'blocked'],
  snapshot: {
    classification: 'snapshot-behind-log',
    heading: 'Snapshot behind log',
    message: 'The saved status summary and Mission history disagree at this same commit.',
    announce: 'polite',
  },
  reportedActivity: [
    {
      classification: 'reported-live',
      actorLabel: 'lynn',
      repositoryLabel: 'EXPERIMENTAL-spec-kitty-saas',
      branchLabel: 'feature/launch-resilience',
      ageLabel: '12s ago',
      trustLabel: 'Presence · unverified',
    },
    {
      classification: 'reported-live',
      actorLabel: 'priti',
      repositoryLabel: 'EXPERIMENTAL-spec-kitty-saas',
      branchLabel: 'feature/launch-resilience',
      ageLabel: '41s ago',
      trustLabel: 'Presence · unverified',
    },
  ],
  copy: {
    boardHeading: 'Five-stage view',
    boardHelp: 'Scroll horizontally when the lanes do not fit.',
    emptyLane: 'No work packages in this stage.',
    emptyActivity: 'No live activity reported.',
  },
  stress: {
    teamLabel: 'Collaborative Demo Team with a deliberately long supplied organization label',
    repositoryLabel: 'EXPERIMENTAL-spec-kitty-saas-with-a-deliberately-long-supplied-repository-label',
    missionLabel: 'Launch resilience tranche A with an unusually long supplied mission label that must wrap locally',
    branchLabel: 'feature/launch-resilience-with-a-deliberately-long-consumer-supplied-branch-name',
  },
} satisfies MissionKanbanFixture);

const fixtureGuard = (fixture: DeepReadonly<MissionKanbanFixture>): true => {
  const exactStageIds: ReadonlyArray<StageId> = ['planned', 'doing', 'for_review', 'approved', 'done'];
  const exactStageMemberships: ReadonlyArray<ReadonlyArray<DetailedLaneId>> = [
    ['planned', 'blocked'],
    ['claimed', 'in_progress'],
    ['for_review', 'in_review'],
    ['approved'],
    ['done', 'canceled'],
  ];
  const exactLaneIds: ReadonlyArray<DetailedLaneId> = [
    'genesis', 'planned', 'claimed', 'in_progress', 'for_review',
    'in_review', 'approved', 'done', 'blocked', 'canceled',
  ];
  const exactDetailedLaneCounts = [0, 2, 1, 3, 2, 1, 1, 4, 1, 0];
  const exactK3SelectedLaneIds: ReadonlyArray<DetailedLaneId> = ['in_review', 'blocked'];
  const stageIds = fixture.stages.map(({ id }) => id);
  const laneIds = fixture.detailedLanes.map(({ id }) => id);
  if (new Set(stageIds).size !== stageIds.length || JSON.stringify(stageIds) !== JSON.stringify(exactStageIds)) {
    throw new TypeError('Rendered stage identifiers must be unique and in the supplied order.');
  }
  if (new Set(laneIds).size !== laneIds.length || JSON.stringify(laneIds) !== JSON.stringify(exactLaneIds)) {
    throw new TypeError('Detailed lane identifiers must be unique and in the supplied order.');
  }
  if (JSON.stringify(fixture.stages.map(({ detailedLaneIds }) => detailedLaneIds)) !== JSON.stringify(exactStageMemberships)) {
    throw new TypeError('Detailed lanes must use the supplied five-stage reduction.');
  }

  const mappedLaneIds = fixture.stages.flatMap(({ detailedLaneIds }) => detailedLaneIds);
  if (new Set(mappedLaneIds).size !== mappedLaneIds.length || mappedLaneIds.includes('genesis')) {
    throw new TypeError('Each supplied non-Genesis lane may map to one stage only.');
  }
  const knownLaneIds = new Set(laneIds);
  const workPackageIds = new Set<string>();
  const routeIds = new Set<string>();
  for (const workPackage of fixture.workPackages) {
    if (workPackageIds.has(workPackage.id)) throw new TypeError(`Duplicate Work Package identifier: ${workPackage.id}.`);
    if (!workPackage.href.trim() || routeIds.has(workPackage.href)) throw new TypeError(`Invalid or duplicate Work Package route: ${workPackage.href}.`);
    if (!knownLaneIds.has(workPackage.committedLaneId) || !mappedLaneIds.includes(workPackage.committedLaneId)) {
      throw new TypeError(`Non-empty detailed lane is not mapped: ${workPackage.committedLaneId}.`);
    }
    const trackerKeys = workPackage.trackerReferences.map(({ label, href }) => `${label}\u0000${href}`);
    if (trackerKeys.some((key) => !key.split('\u0000').every((part) => part.trim())) || new Set(trackerKeys).size !== trackerKeys.length) {
      throw new TypeError(`Invalid or duplicate tracker control for ${workPackage.id}.`);
    }
    if (workPackage.observedActivity && !knownLaneIds.has(workPackage.observedActivity.targetLaneId)) {
      throw new TypeError(`Unknown observed target lane: ${workPackage.observedActivity.targetLaneId}.`);
    }
    workPackageIds.add(workPackage.id);
    routeIds.add(workPackage.href);
  }
  const detailedLaneCounts = exactLaneIds.map((id) =>
    fixture.workPackages.filter(({ committedLaneId }) => committedLaneId === id).length,
  );
  if (JSON.stringify(detailedLaneCounts) !== JSON.stringify(exactDetailedLaneCounts)) {
    throw new TypeError('Work Packages must preserve the supplied detailed-lane counts.');
  }
  if (JSON.stringify(fixture.k3SelectedLaneIds) !== JSON.stringify(exactK3SelectedLaneIds)) {
    throw new TypeError('K3 must select exactly In review and Blocked in the supplied order.');
  }
  return true;
};

const stageForLane = (
  fixture: DeepReadonly<MissionKanbanFixture>,
  laneId: DetailedLaneId,
): DeepReadonly<MissionKanbanFixture['stages'][number]> => {
  const stages = fixture.stages.filter(({ detailedLaneIds }) => detailedLaneIds.includes(laneId));
  if (stages.length !== 1) throw new TypeError(`Detailed lane must map to exactly one stage: ${laneId}.`);
  return stages[0]!;
};

export const deriveMissionKanban = (
  fixture: DeepReadonly<MissionKanbanFixture>,
  options: ProjectionOptions = {},
) => {
  fixtureGuard(fixture);
  const knownIds = new Set(fixture.workPackages.map(({ id }) => id));
  if (options.includedWorkPackageIds?.some((id) => !knownIds.has(id))) {
    throw new TypeError('A projection requested an unknown Work Package.');
  }
  const knownLaneIds = new Set(fixture.detailedLanes.map(({ id }) => id));
  if (options.selectedLaneIds?.some((id) => !knownLaneIds.has(id))) {
    throw new TypeError('A projection requested an unknown detailed lane.');
  }

  const includedIds = options.includedWorkPackageIds
    ? new Set(options.includedWorkPackageIds)
    : knownIds;
  const selectedLaneIds = options.selectedLaneIds ? new Set(options.selectedLaneIds) : undefined;
  const selected = fixture.workPackages.filter((workPackage) =>
    includedIds.has(workPackage.id) &&
    (selectedLaneIds === undefined || selectedLaneIds.has(workPackage.committedLaneId)),
  );
  const selectedIds = new Set(selected.map(({ id }) => id));
  if (selectedIds.size !== selected.length) throw new TypeError('A Work Package appears more than once.');

  const allDetailedLaneCounts = Object.fromEntries(
    fixture.detailedLanes.map(({ id }) => [
      id,
      fixture.workPackages.filter(({ committedLaneId }) => committedLaneId === id).length,
    ]),
  ) as Record<DetailedLaneId, number>;
  const stages = fixture.stages
    .map((stage) => ({
      id: stage.id,
      label: stage.label,
      workPackages: selected.filter(({ committedLaneId }) =>
        stageForLane(fixture, committedLaneId).id === stage.id,
      ).map((workPackage) => ({
        ...workPackage,
        observedActivity: options.includeObservedActivity ? workPackage.observedActivity : undefined,
      })),
    }))
    .filter(({ workPackages }) => !options.hideEmptyStages || workPackages.length > 0);

  return deepFreezeMissionKanban({
    commit: fixture.commit,
    stages,
    allDetailedLaneCounts,
    total: selected.length,
    workPackageIds: selected.map(({ id }) => id),
    selectedLaneIds: options.selectedLaneIds ?? [],
    snapshot: options.includeSnapshot ? fixture.snapshot : undefined,
    reportedActivity: options.includeReportedActivity ? fixture.reportedActivity : [],
  });
};

export const missionKanbanGuardProof = () => {
  const fixture = MISSION_KANBAN_FIXTURE;
  const checks = [
    ['duplicateStageId', () => deriveMissionKanban({ ...fixture, stages: [...fixture.stages, fixture.stages[0]!] })],
    ['duplicateDetailedLaneId', () => deriveMissionKanban({ ...fixture, detailedLanes: [...fixture.detailedLanes, fixture.detailedLanes[0]!] })],
    ['duplicateWorkPackageId', () => deriveMissionKanban({ ...fixture, workPackages: [...fixture.workPackages, fixture.workPackages[0]!] })],
    ['duplicateRoute', () => deriveMissionKanban({ ...fixture, workPackages: [{ ...fixture.workPackages[0]!, href: fixture.workPackages[1]!.href }, ...fixture.workPackages.slice(1)] })],
    ['blankRoute', () => deriveMissionKanban({ ...fixture, workPackages: [{ ...fixture.workPackages[0]!, href: ' ' }, ...fixture.workPackages.slice(1)] })],
    ['duplicateTrackerControl', () => deriveMissionKanban({ ...fixture, workPackages: [{ ...fixture.workPackages[0]!, trackerReferences: [fixture.workPackages[0]!.trackerReferences[0]!, fixture.workPackages[0]!.trackerReferences[0]!] }, ...fixture.workPackages.slice(1)] })],
    ['multipleStageMembership', () => deriveMissionKanban({ ...fixture, stages: fixture.stages.map((stage, index) => index === 1 ? { ...stage, detailedLaneIds: [...stage.detailedLaneIds, 'planned'] } : stage) })],
    ['wrongStageMembership', () => deriveMissionKanban({ ...fixture, stages: fixture.stages.map((stage, index) => index === 0 ? { ...stage, detailedLaneIds: ['planned'] } : index === 1 ? { ...stage, detailedLaneIds: [...stage.detailedLaneIds, 'blocked'] } : stage) })],
    ['nonEmptyUnmappedLane', () => deriveMissionKanban({ ...fixture, workPackages: [{ ...fixture.workPackages[0]!, committedLaneId: 'genesis' as Exclude<DetailedLaneId, 'genesis'> }, ...fixture.workPackages.slice(1)] })],
    ['wrongDetailedLaneCounts', () => deriveMissionKanban({ ...fixture, workPackages: [{ ...fixture.workPackages[0]!, committedLaneId: 'blocked' }, ...fixture.workPackages.slice(1)] })],
    ['wrongK3Selection', () => deriveMissionKanban({ ...fixture, k3SelectedLaneIds: ['planned', 'blocked'] })],
    ['unknownSelection', () => deriveMissionKanban(fixture, { selectedLaneIds: ['not-supplied' as DetailedLaneId] })],
    ['unknownWorkPackage', () => deriveMissionKanban(fixture, { includedWorkPackageIds: ['WP99'] })],
  ] as const;
  return deepFreezeMissionKanban(Object.fromEntries(checks.map(([name, check]) => {
    try {
      check();
      return [name, false];
    } catch {
      return [name, true];
    }
  })));
};

const PATTERN_STYLES = html`<style>
  .sk-mission-kanban-pattern {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: 100vh;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }
  .sk-mission-kanban-pattern *,
  .sk-mission-kanban-pattern *::before,
  .sk-mission-kanban-pattern *::after { box-sizing: border-box; }
  .sk-mission-kanban-pattern__shell::part(shell) { min-block-size: 100vh; }
  .sk-mission-kanban-pattern__rail-link,
  .sk-mission-kanban-pattern__context-link,
  .sk-mission-kanban-pattern__header-link,
  .sk-mission-kanban-pattern__tracker-link,
  .sk-mission-kanban-pattern__compact-link {
    color: var(--sk-fg-body);
    text-underline-offset: var(--sk-space-1);
  }
  .sk-mission-kanban-pattern__rail-link,
  .sk-mission-kanban-pattern__compact-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--sk-space-8);
    min-block-size: var(--sk-space-8);
    padding: var(--sk-space-2);
    border-width: var(--sk-border-width-1);
    border-style: solid;
    border-color: var(--sk-border-default);
    border-radius: var(--sk-radius-md);
    text-decoration: none;
  }
  .sk-mission-kanban-pattern__context-header,
  .sk-mission-kanban-pattern__context-list,
  .sk-mission-kanban-pattern__reported-list,
  .sk-mission-kanban-pattern__lane-list { margin: 0; }
  .sk-mission-kanban-pattern__context-header { display: grid; gap: var(--sk-space-2); }
  .sk-mission-kanban-pattern__eyebrow {
    margin: 0;
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-xs);
    font-weight: var(--sk-weight-semibold);
  }
  .sk-mission-kanban-pattern__context-title { margin: 0; color: var(--sk-fg-default); font-size: var(--sk-text-lg); overflow-wrap: anywhere; }
  .sk-mission-kanban-pattern__context-list { display: grid; gap: var(--sk-space-2); padding: 0; list-style: none; }
  .sk-mission-kanban-pattern__context-link { display: block; padding: var(--sk-space-2); border-radius: var(--sk-radius-sm); text-decoration: none; overflow-wrap: anywhere; }
  .sk-mission-kanban-pattern__context-link[aria-current="page"] { color: var(--sk-fg-default); background: var(--sk-surface-pill); font-weight: var(--sk-weight-semibold); }
  .sk-mission-kanban-pattern__unavailable { display: block; padding: var(--sk-space-2); color: var(--sk-fg-muted); overflow-wrap: anywhere; }
  .sk-mission-kanban-pattern__compact-header { display: flex; align-items: center; justify-content: space-between; gap: var(--sk-space-3); min-inline-size: 0; }
  .sk-mission-kanban-pattern__compact-brand { min-inline-size: 0; color: var(--sk-fg-default); font-weight: var(--sk-weight-semibold); overflow-wrap: anywhere; }
  .sk-mission-kanban-pattern__page { display: grid; min-inline-size: 0; max-inline-size: 100%; gap: var(--sk-space-6); padding: var(--sk-space-6); }
  .sk-mission-kanban-pattern--compact .sk-mission-kanban-pattern__page { gap: var(--sk-space-4); padding: var(--sk-space-4); }
  .sk-mission-kanban-pattern__breadcrumbs { min-inline-size: 0; }
  .sk-mission-kanban-pattern__header-links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--sk-space-2); }
  .sk-mission-kanban-pattern__header-link { padding: var(--sk-space-2) var(--sk-space-3); border-width: var(--sk-border-width-1); border-style: solid; border-color: var(--sk-border-default); border-radius: var(--sk-radius-md); text-decoration: none; }
  .sk-mission-kanban-pattern__header-link[aria-current="page"] { color: var(--sk-fg-default); background: var(--sk-surface-pill); border-color: var(--sk-border-strong); }
  .sk-mission-kanban-pattern__truth { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sk-space-2); min-inline-size: 0; }
  .sk-mission-kanban-pattern__truth-label { color: var(--sk-fg-muted); font-size: var(--sk-text-sm); font-weight: var(--sk-weight-semibold); }
  .sk-mission-kanban-pattern__commit { overflow-wrap: anywhere; }
  .sk-mission-kanban-pattern--long .sk-mission-kanban-pattern__branch-pill {
    min-inline-size: 0;
    max-inline-size: 100%;
  }
  .sk-mission-kanban-pattern--long .sk-mission-kanban-pattern__branch-pill::part(tag) {
    box-sizing: border-box;
    max-inline-size: 100%;
    overflow-wrap: anywhere;
    white-space: normal;
  }
  .sk-mission-kanban-pattern__filter-body { display: grid; gap: var(--sk-space-4); }
  .sk-mission-kanban-pattern__filter-actions { display: flex; flex-wrap: wrap; gap: var(--sk-space-2); }
  .sk-mission-kanban-pattern__board-intro { display: flex; align-items: end; justify-content: space-between; gap: var(--sk-space-4); min-inline-size: 0; }
  .sk-mission-kanban-pattern__board-title { margin: var(--sk-space-1) 0 0; color: var(--sk-fg-default); font-size: var(--sk-text-xl); }
  .sk-mission-kanban-pattern__board-help { margin: 0; color: var(--sk-fg-muted); font-size: var(--sk-text-sm); text-align: end; }
  .sk-mission-kanban-pattern__board-frame { min-inline-size: 0; max-inline-size: 100%; }
  .sk-mission-kanban-pattern--long .sk-mission-kanban-pattern__board-frame {
    max-inline-size: calc(var(--sk-layout-workflow-lane-min-inline-size) * 3 + var(--sk-space-8));
  }
  .sk-mission-kanban-pattern__lane-list { display: grid; gap: var(--sk-space-3); min-inline-size: 0; padding: 0; list-style: none; }
  .sk-mission-kanban-pattern__empty { margin-block-start: var(--sk-space-3); }
  .sk-mission-kanban-pattern__observation { display: grid; gap: var(--sk-space-1); padding-block-start: var(--sk-space-2); border-block-start-width: var(--sk-border-width-1); border-block-start-style: solid; border-block-start-color: var(--sk-border-default); }
  .sk-mission-kanban-pattern__observation-tier { color: var(--sk-fg-default); font-weight: var(--sk-weight-semibold); }
  .sk-mission-kanban-pattern__reported { display: grid; gap: var(--sk-space-3); padding: var(--sk-space-4); border-width: var(--sk-border-width-1); border-style: solid; border-color: var(--sk-border-default); border-radius: var(--sk-radius-md); background: var(--sk-surface-card); }
  .sk-mission-kanban-pattern__reported-header { display: flex; align-items: center; justify-content: space-between; gap: var(--sk-space-3); }
  .sk-mission-kanban-pattern__reported-title { margin: 0; color: var(--sk-fg-default); font-size: var(--sk-text-lg); }
  .sk-mission-kanban-pattern__reported-list { display: grid; gap: var(--sk-space-2); padding: 0; list-style: none; }
  .sk-mission-kanban-pattern__reported-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 2fr) auto; gap: var(--sk-space-3); padding-block: var(--sk-space-2); border-block-start-width: var(--sk-border-width-1); border-block-start-style: solid; border-block-start-color: var(--sk-border-default); overflow-wrap: anywhere; }
  .sk-mission-kanban-pattern__reported-empty { margin: 0; color: var(--sk-fg-muted); }
  .sk-mission-kanban-pattern--compact .sk-mission-kanban-pattern__board-intro,
  .sk-mission-kanban-pattern--compact .sk-mission-kanban-pattern__reported-header { align-items: start; }
  .sk-mission-kanban-pattern--compact .sk-mission-kanban-pattern__reported-row { grid-template-columns: minmax(0, 1fr); }
  .sk-mission-kanban-pattern--long .sk-mission-kanban-pattern__page,
  .sk-mission-kanban-pattern--long .sk-mission-kanban-pattern__commit,
  .sk-mission-kanban-pattern--long .sk-mission-kanban-pattern__reported-row { overflow-wrap: anywhere; }
  @media (forced-colors: active) {
    .sk-mission-kanban-pattern__observation { border-block-start-color: Highlight; }
    .sk-mission-kanban-pattern__reported { border-color: CanvasText; }
    .sk-mission-kanban-pattern__header-link:focus-visible,
    .sk-mission-kanban-pattern__tracker-link:focus-visible { outline-color: Highlight; }
  }
</style>`;

const renderContextNavigation = (
  fixture: DeepReadonly<MissionKanbanFixture>,
  long: boolean,
) => html`
  <sk-personal-rail slot="personal-rail" label="Personal navigation">
    <a class="sk-mission-kanban-pattern__rail-link" slot="primary" href="#work" aria-label="Work">WK</a>
    <a class="sk-mission-kanban-pattern__rail-link" slot="account" href="#account" aria-label=${long ? fixture.stress.teamLabel : fixture.teamLabel}>CD</a>
  </sk-personal-rail>
  <sk-context-sidebar slot="context-sidebar" label="Mission pages">
    <div class="sk-mission-kanban-pattern__context-header" slot="header">
      <p class="sk-mission-kanban-pattern__eyebrow">Mission</p>
      <h2 class="sk-mission-kanban-pattern__context-title">${long ? fixture.stress.missionLabel : fixture.missionLabel}</h2>
      <span>${fixture.missionId}</span>
    </div>
    <nav aria-label="Mission pages">
      <ul class="sk-mission-kanban-pattern__context-list">
        ${fixture.navigation.map((item) => html`<li>${item.available
          ? html`<a class="sk-mission-kanban-pattern__context-link" href=${item.href} aria-current=${item.current ? 'page' : nothing}>${item.label}</a>`
          : html`<span class="sk-mission-kanban-pattern__unavailable">${item.label} · Unavailable</span>`}</li>`)}
      </ul>
    </nav>
  </sk-context-sidebar>
  <div class="sk-mission-kanban-pattern__compact-header" slot="compact-header">
    <span class="sk-mission-kanban-pattern__compact-brand">SK · ${long ? fixture.stress.teamLabel : fixture.teamLabel}</span>
    <a class="sk-mission-kanban-pattern__compact-link" href="#mission-kanban-content">Kanban</a>
  </div>
`;

const renderFilters = (
  fixture: DeepReadonly<MissionKanbanFixture>,
  projection: ReturnType<typeof deriveMissionKanban>,
  rootId: string,
) => html`
  <details class="sk-disclosure" open data-detailed-filters>
    <summary class="sk-disclosure__summary">
      <span>Detailed lane filters</span>
      <span>${projection.total} of ${fixture.workPackages.length} work packages</span>
    </summary>
    <div class="sk-disclosure__body sk-mission-kanban-pattern__filter-body">
      <fieldset class="sk-checkbox-choice-group">
        <legend class="sk-checkbox-choice-group__legend">Committed detailed lanes</legend>
        <div class="sk-checkbox-choice-group__options">
          ${fixture.detailedLanes.map((lane) => html`
            <label class="sk-checkbox-choice-group__choice" for="${rootId}-filter-${lane.id}">
              <input
                class="sk-checkbox-choice-group__control"
                id="${rootId}-filter-${lane.id}"
                type="checkbox"
                name="lane"
                value=${lane.id}
                ?checked=${fixture.k3SelectedLaneIds.includes(lane.id as 'in_review' | 'blocked')}
              >
              <span class="sk-checkbox-choice-group__label">${lane.label}</span>
              <span class="sk-checkbox-choice-group__metadata">${projection.allDetailedLaneCounts[lane.id]}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <div class="sk-mission-kanban-pattern__filter-actions">
        <sk-button variant="primary">Apply</sk-button>
        <sk-button variant="secondary">Clear</sk-button>
      </div>
    </div>
  </details>
`;

const renderWorkPackage = (
  workPackage: ReturnType<typeof deriveMissionKanban>['stages'][number]['workPackages'][number],
) => html`
  <li data-work-package-id=${workPackage.id} data-committed-lane=${workPackage.committedLaneId}>
    <sk-action-row layout="card" href=${workPackage.href}>
      <span slot="title">${workPackage.id}</span>
      <code slot="reference">Committed lane · ${workPackage.committedLaneId}</code>
      <sk-status-indicator slot="tags"><span slot="marker">●</span>${workPackage.committedLaneId}</sk-status-indicator>
      <span slot="metadata">${workPackage.agentProfileLabel}</span>
      ${workPackage.observedActivity ? html`
        <span class="sk-mission-kanban-pattern__observation" slot="supporting" data-observed-activity>
          <span class="sk-mission-kanban-pattern__observation-tier">Observed · ${workPackage.observedActivity.lagLabel}</span>
          <span>${workPackage.observedActivity.message}</span>
        </span>
      ` : nothing}
      ${workPackage.trackerReferences.map((reference) => html`
        <a class="sk-mission-kanban-pattern__tracker-link" slot="controls" href=${reference.href}>${reference.label}</a>
      `)}
    </sk-action-row>
  </li>
`;

const renderReportedActivity = (
  fixture: DeepReadonly<MissionKanbanFixture>,
  projection: ReturnType<typeof deriveMissionKanban>,
  rootId: string,
  long: boolean,
) => html`
  <section class="sk-mission-kanban-pattern__reported" aria-labelledby="${rootId}-reported-title" data-reported-activity>
    <header class="sk-mission-kanban-pattern__reported-header">
      <h2 class="sk-mission-kanban-pattern__reported-title" id="${rootId}-reported-title">Live now</h2>
      <sk-status-indicator tone="success"><span slot="marker">●</span>Reported live · ≤90s</sk-status-indicator>
    </header>
    ${projection.reportedActivity.length > 0 ? html`
      <ol class="sk-mission-kanban-pattern__reported-list">
        ${projection.reportedActivity.map((activity) => html`
          <li class="sk-mission-kanban-pattern__reported-row" data-reported-live>
            <span><strong>${activity.actorLabel}</strong><br>${activity.trustLabel}</span>
            <code>${long ? fixture.stress.repositoryLabel : activity.repositoryLabel}</code>
            <code>${long ? fixture.stress.branchLabel : activity.branchLabel}</code>
            <span>${activity.ageLabel}</span>
          </li>
        `)}
      </ol>
    ` : html`<p class="sk-mission-kanban-pattern__reported-empty">${fixture.copy.emptyActivity}</p>`}
  </section>
`;

const syncWorkflowScrollerSemantics = (element?: Element): void => {
  if (!(element instanceof HTMLElement)) return;
  const overflowing = element.scrollWidth > element.clientWidth;
  if (overflowing) {
    element.setAttribute('role', 'region');
    element.setAttribute('aria-label', 'Work package Kanban');
    element.setAttribute('tabindex', '0');
    return;
  }
  element.removeAttribute('role');
  element.removeAttribute('aria-label');
  element.removeAttribute('tabindex');
};

const createWorkflowScrollerRef = () => {
  let observer: ResizeObserver | undefined;
  return (element?: Element): void => {
    // Lit clears callback refs before replacement/removal, keeping one observer per story render.
    observer?.disconnect();
    observer = undefined;
    if (!(element instanceof HTMLElement)) return;
    syncWorkflowScrollerSemantics(element);
    observer = new ResizeObserver(() => syncWorkflowScrollerSemantics(element));
    observer.observe(element);
  };
};

export const renderMissionKanban = (
  projection: ReturnType<typeof deriveMissionKanban>,
  presentation: PresentationOptions,
): TemplateResult => {
  const fixture = MISSION_KANBAN_FIXTURE;
  const rootId = `mission-kanban-${presentation.state}`;
  const stageCounts = projection.stages.map(({ workPackages }) => workPackages.length);
  const detailedCounts = fixture.detailedLanes.map(({ id }) => projection.allDetailedLaneCounts[id]);
  const long = presentation.long === true;
  const guardProof = missionKanbanGuardProof();
  const workflowScrollerRef = createWorkflowScrollerRef();

  return html`
    <div
      class="sk-mission-kanban-pattern${presentation.light ? ' sk-light' : ''}${presentation.compact ? ' sk-mission-kanban-pattern--compact' : ''}${long ? ' sk-mission-kanban-pattern--long' : ''}"
      data-mission-kanban-pattern
      data-story-state=${presentation.state}
      data-render-complete="true"
      data-fixture-deeply-frozen=${String(isMissionKanbanDeeplyFrozen(fixture))}
      data-projection-deeply-frozen=${String(isMissionKanbanDeeplyFrozen(projection))}
      data-stage-counts=${JSON.stringify(stageCounts)}
      data-detailed-lane-counts=${JSON.stringify(detailedCounts)}
      data-work-package-ids=${JSON.stringify(projection.workPackageIds)}
      data-selected-lane-ids=${JSON.stringify(projection.selectedLaneIds)}
      data-commit=${projection.commit.shaLabel}
      data-guard-proof=${JSON.stringify(guardProof)}
    >
      ${PATTERN_STYLES}
      <sk-app-shell
        class="sk-mission-kanban-pattern__shell"
        presentation=${presentation.compact ? 'compact' : nothing}
      >
        ${renderContextNavigation(fixture, long)}
        <sk-page-header slot="page-header">
          <span slot="eyebrow">Mission · ${fixture.missionId}</span>
          <h1 slot="title">Work packages</h1>
          <p slot="supporting">Work packages reduced from ${long ? fixture.stress.repositoryLabel : fixture.repositoryLabel}’s committed diary.</p>
          <sk-status-indicator slot="sync" tone="success"><span slot="marker">●</span>${fixture.commit.trustLabel}</sk-status-indicator>
          <nav class="sk-mission-kanban-pattern__header-links" slot="actions" aria-label="Mission workspace">
            <a class="sk-mission-kanban-pattern__header-link" href="#mission-overview">Overview</a>
            <a class="sk-mission-kanban-pattern__header-link" href="#mission-kanban-content" aria-current="page">Kanban</a>
            <a class="sk-mission-kanban-pattern__header-link" href="#workspace">Back to workspace</a>
          </nav>
        </sk-page-header>

        <div class="sk-mission-kanban-pattern__page" id="mission-kanban-content">
          <nav class="sk-breadcrumbs sk-mission-kanban-pattern__breadcrumbs" aria-label="Breadcrumb">
            <ol class="sk-breadcrumbs__list">
              <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="#repositories">Repos</a></li>
              <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="#repository">${long ? fixture.stress.repositoryLabel : fixture.repositoryLabel}</a></li>
              <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="#mission">${long ? fixture.stress.missionLabel : fixture.missionLabel}</a></li>
              <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href="#mission-kanban-content" aria-current="page">Kanban</a></li>
            </ol>
          </nav>

          <div class="sk-mission-kanban-pattern__truth" aria-label="Commit truth">
            <span class="sk-mission-kanban-pattern__truth-label">Git activity · factual · rendered</span>
            <sk-pill-tag><code>${fixture.commit.shaLabel}</code></sk-pill-tag>
            <sk-pill-tag class="sk-mission-kanban-pattern__branch-pill"><code class="sk-mission-kanban-pattern__commit">${long ? fixture.stress.branchLabel : fixture.commit.branchLabel}</code></sk-pill-tag>
          </div>

          ${projection.snapshot ? html`
            <sk-notice
              tone="attention"
              announce=${projection.snapshot.announce}
              message=${projection.snapshot.message}
              data-snapshot-behind-log
            ><h2 slot="heading">${projection.snapshot.heading}</h2></sk-notice>
          ` : nothing}

          ${presentation.filters ? renderFilters(fixture, projection, rootId) : nothing}

          <div class="sk-mission-kanban-pattern__board-intro">
            <div>
              <p class="sk-mission-kanban-pattern__eyebrow">Committed workflow</p>
              <h2 class="sk-mission-kanban-pattern__board-title" id="${rootId}-board-title">${presentation.filters ? 'Filtered stages' : fixture.copy.boardHeading}</h2>
            </div>
            <p class="sk-mission-kanban-pattern__board-help">${presentation.filters ? 'Showing blocked and in review.' : fixture.copy.boardHelp}</p>
          </div>

          <div class="sk-mission-kanban-pattern__board-frame">
            <section class="sk-workflow-board" aria-labelledby="${rootId}-board-title" data-committed-board>
              <div
                class="sk-workflow-board__scroller"
                ${ref(workflowScrollerRef)}
                data-board-scroller
              >
                ${projection.stages.map((stage) => html`
                  <section class="sk-workflow-lane" aria-labelledby="${rootId}-stage-${stage.id}" data-stage-id=${stage.id}>
                    <header class="sk-workflow-lane__header">
                      <h3 class="sk-workflow-lane__title" id="${rootId}-stage-${stage.id}">${stage.label}</h3>
                      <span class="sk-workflow-lane__count" aria-label="${stage.workPackages.length} work packages">${stage.workPackages.length}</span>
                    </header>
                    <ol class="sk-workflow-lane__list sk-mission-kanban-pattern__lane-list">
                      ${stage.workPackages.map(renderWorkPackage)}
                    </ol>
                    ${stage.workPackages.length === 0 ? html`
                      <div class="sk-empty-state sk-empty-state--inline sk-mission-kanban-pattern__empty">${fixture.copy.emptyLane}</div>
                    ` : nothing}
                  </section>
                `)}
              </div>
            </section>
          </div>

          ${renderReportedActivity(fixture, projection, rootId, long)}
        </div>
      </sk-app-shell>
    </div>
  `;
};

const allRecords = () => deriveMissionKanban(MISSION_KANBAN_FIXTURE, {
  includeReportedActivity: true,
});
const k3Records = () => deriveMissionKanban(MISSION_KANBAN_FIXTURE, {
  selectedLaneIds: MISSION_KANBAN_FIXTURE.k3SelectedLaneIds,
  hideEmptyStages: true,
  includeReportedActivity: true,
});

const basePlay = async (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector<HTMLElement>('[data-mission-kanban-pattern]');
  await expect(root).not.toBeNull();
  await expect(root?.dataset.renderComplete).toBe('true');
  await expect(root?.dataset.fixtureDeeplyFrozen).toBe('true');
  await expect(root?.dataset.projectionDeeplyFrozen).toBe('true');
  await expect(root?.dataset.guardProof).toBe(JSON.stringify({
    duplicateStageId: true,
    duplicateDetailedLaneId: true,
    duplicateWorkPackageId: true,
    duplicateRoute: true,
    blankRoute: true,
    duplicateTrackerControl: true,
    multipleStageMembership: true,
    wrongStageMembership: true,
    nonEmptyUnmappedLane: true,
    wrongDetailedLaneCounts: true,
    wrongK3Selection: true,
    unknownSelection: true,
    unknownWorkPackage: true,
  }));
  root?.setAttribute('data-play-proof', 'passed');
};

const meta: Meta = {
  title: 'Patterns/Mission Kanban',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: {
      description: {
        component: 'Story-only K1–K6 Mission Kanban compositions built from public surfaces, native semantics, one immutable fixture, and pure projections.',
      },
    },
  },
  excludeStories: [
    'deepFreezeMissionKanban',
    'isMissionKanbanDeeplyFrozen',
    'MISSION_KANBAN_FIXTURE',
    'deriveMissionKanban',
    'missionKanbanGuardProof',
    'renderMissionKanban',
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: 'K1 Populated desktop',
  render: () => renderMissionKanban(allRecords(), { state: 'k1' }),
  play: async ({ canvasElement }) => {
    await basePlay(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-mission-kanban-pattern]')!;
    await expect(root.dataset.stageCounts).toBe('[3,4,3,1,4]');
    await expect(root.dataset.detailedLaneCounts).toBe('[0,2,1,3,2,1,1,4,1,0]');
    await expect(root.querySelectorAll('[data-work-package-id]')).toHaveLength(15);
  },
};

export const K2NarrowContained: Story = {
  render: () => renderMissionKanban(allRecords(), { state: 'k2', compact: true }),
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const K3DetailedLaneFilters: Story = {
  render: () => renderMissionKanban(k3Records(), { state: 'k3', filters: true }),
  play: async ({ canvasElement }) => {
    await basePlay(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-mission-kanban-pattern]')!;
    await expect(root.dataset.stageCounts).toBe('[1,1]');
    await expect(root.dataset.workPackageIds).toBe('["WP05","WP10"]');
    await expect(root.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(2);
  },
};

export const K4SnapshotBehindLog: Story = {
  render: () => renderMissionKanban(deriveMissionKanban(MISSION_KANBAN_FIXTURE, {
    includeSnapshot: true,
    includeReportedActivity: true,
  }), { state: 'k4' }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const K5ObservedNotYetPushed: Story = {
  render: () => renderMissionKanban(deriveMissionKanban(MISSION_KANBAN_FIXTURE, {
    includeObservedActivity: true,
    includeReportedActivity: true,
  }), { state: 'k5' }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const K6StableEmptyBoard: Story = {
  render: () => renderMissionKanban(deriveMissionKanban(MISSION_KANBAN_FIXTURE, {
    includedWorkPackageIds: [],
  }), { state: 'k6' }),
  play: async ({ canvasElement }) => {
    await basePlay(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-mission-kanban-pattern]')!;
    await expect(root.dataset.stageCounts).toBe('[0,0,0,0,0]');
    await expect(root.querySelectorAll('[data-stage-id] > ol:empty')).toHaveLength(5);
  },
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => renderMissionKanban(allRecords(), { state: 'light', light: true }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const LongContent: Story = {
  render: () => renderMissionKanban(allRecords(), { state: 'long', compact: true, long: true }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const ForcedColors: Story = {
  render: () => renderMissionKanban(deriveMissionKanban(MISSION_KANBAN_FIXTURE, {
    includeSnapshot: true,
    includeObservedActivity: true,
    includeReportedActivity: true,
  }), { state: 'forced' }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const ReducedMotion: Story = {
  render: () => renderMissionKanban(deriveMissionKanban(MISSION_KANBAN_FIXTURE, {
    includeObservedActivity: true,
    includeReportedActivity: true,
  }), { state: 'reduced' }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};
