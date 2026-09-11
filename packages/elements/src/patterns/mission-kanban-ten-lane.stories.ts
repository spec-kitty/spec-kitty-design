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
import {
  STATUS_TONES,
  type StatusIndicatorTone,
} from '../status-indicator/sk-status-indicator.js';
// #278's immutable fixture is the single source of committed truth for this projection: its ten
// detailed lanes, fifteen Work Packages, routes, profiles, tracker references, commit, snapshot and
// reported-live records. It is imported, never copied, so no lane, count or route is restated here.
import {
  MISSION_KANBAN_FIXTURE,
  deepFreezeMissionKanban,
  isMissionKanbanDeeplyFrozen,
} from './mission-kanban.stories.js';

type BaseFixture = typeof MISSION_KANBAN_FIXTURE;
type LaneId = BaseFixture['detailedLanes'][number]['id'];
type BaseWorkPackage = BaseFixture['workPackages'][number];

type UnverifiedOverlayFixture = Readonly<{
  workPackageId: string;
  classification: 'unverified';
  tierLabel: string;
  tierTone: StatusIndicatorTone;
  actorLabel: string;
  targetLaneId: LaneId;
}>;

type TenLaneExtensionFixture = Readonly<{
  copy: Readonly<{
    railLabel: string;
    railWorkLink: string;
    railWorkName: string;
    railAccountLink: string;
    sidebarLabel: string;
    sidebarEyebrow: string;
    missionNavigationLabel: string;
    unavailableAnnotation: string;
    pageTitle: string;
    breadcrumbLabel: string;
    breadcrumbRoot: string;
    truthTierLabel: string;
    statusMarker: string;
    overlayMarker: string;
    liveOverlaysShown: string;
    filterSummary: string;
    filterLegend: string;
    filterApply: string;
    filterClear: string;
    boardHeading: string;
    boardRegionName: string;
    emptyLane: string;
    reportedHeading: string;
    reportedTierLabel: string;
  }>;
  // Consumer-owned message functions: the i18n seam a Team Kitty catalogue would fill (#286's
  // boundary applied to a pattern). Pluralisation lives here, never in the render code.
  format: Readonly<{
    eyebrow: (missionId: string) => string;
    subtitle: (repositoryLabel: string) => string;
    compactBrand: (teamLabel: string) => string;
    laneCount: (count: number) => string;
    detailedLane: (laneId: LaneId) => string;
    overlayDestination: (laneId: LaneId) => string;
  }>;
  routes: Readonly<{
    work: string;
    account: string;
    repositories: string;
    repository: string;
    mission: string;
  }>;
  tones: Readonly<{
    commitTrust: StatusIndicatorTone;
    reportedLive: StatusIndicatorTone;
  }>;
  unverifiedOverlays: ReadonlyArray<UnverifiedOverlayFixture>;
  stress: Readonly<{ laneLabels: Readonly<Record<LaneId, string>> }>;
}>;

/**
 * Only what the #278 fixture does not carry: ten-lane composition copy (Family 2 COPY-CATALOG K
 * rows where they exist), the unverified not-yet-pushed overlay claim, and long localized lane
 * labels. Every string is a fixture value a consumer supplies, not a design-system default.
 * Deep freezing covers every object; the `format` functions are not objects, so they are pinned
 * only by their frozen container. They hold no state.
 */
export const MISSION_KANBAN_TEN_LANE_FIXTURE = deepFreezeMissionKanban({
  copy: {
    railLabel: 'Personal navigation',
    railWorkLink: 'WK',
    railWorkName: 'Work',
    railAccountLink: 'CD',
    sidebarLabel: 'Mission context',
    sidebarEyebrow: 'Mission',
    missionNavigationLabel: 'Mission pages',
    unavailableAnnotation: 'Unavailable',
    pageTitle: 'Work packages',
    breadcrumbLabel: 'Breadcrumb',
    breadcrumbRoot: 'Repos',
    truthTierLabel: 'Git activity · factual · rendered',
    statusMarker: '●',
    overlayMarker: '◌',
    liveOverlaysShown: 'live overlays shown',
    filterSummary: 'Filter lanes',
    filterLegend: 'Committed detailed lanes',
    filterApply: 'Apply',
    filterClear: 'Clear',
    boardHeading: 'Work package kanban board',
    boardRegionName: 'Kanban lanes. Scroll horizontally to see all lanes.',
    emptyLane: 'No work packages in this lane.',
    reportedHeading: 'Live now',
    reportedTierLabel: 'Reported live · ≤90s',
  },
  format: {
    eyebrow: (missionId: string) => `Mission · ${missionId}`,
    subtitle: (repositoryLabel: string) => `Work packages reduced from ${repositoryLabel}’s committed diary.`,
    compactBrand: (teamLabel: string) => `SK · ${teamLabel}`,
    laneCount: (count: number) => (count === 1 ? '1 work package' : `${count} work packages`),
    detailedLane: (laneId: LaneId) => `Detailed lane · ${laneId}`,
    overlayDestination: (laneId: LaneId) => `→ ${laneId}, not yet pushed`,
  },
  routes: {
    work: '#work',
    account: '#account',
    repositories: '#repositories',
    repository: '#repository',
    mission: '#mission',
  },
  tones: {
    commitTrust: 'success',
    reportedLive: 'success',
  },
  unverifiedOverlays: [
    {
      workPackageId: 'WP03',
      classification: 'unverified',
      tierLabel: 'Presence · unverified',
      tierTone: 'neutral',
      actorLabel: 'lynn',
      targetLaneId: 'for_review',
    },
  ],
  stress: {
    laneLabels: {
      genesis: 'Entstehungsphase des Arbeitspakets',
      planned: 'Eingeplante Arbeitspakete dieser Mission',
      claimed: 'Von einem Agentenprofil übernommene Arbeitspakete',
      in_progress: 'Arbeitspakete in laufender Bearbeitung',
      for_review: 'Zur Überprüfung eingereichte Arbeitspakete',
      in_review: 'Arbeitspakete in laufender Qualitätssicherungsüberprüfung',
      approved: 'Freigegebene Arbeitspakete',
      done: 'Abgeschlossene Arbeitspakete',
      blocked: 'Blockierte Arbeitspakete',
      canceled: 'Abgebrochene Arbeitspakete',
    },
  },
} satisfies TenLaneExtensionFixture);

type TenLaneSource = typeof MISSION_KANBAN_TEN_LANE_FIXTURE;

type TenLaneOptions = Readonly<{
  includedWorkPackageIds?: ReadonlyArray<string>;
  selectedLaneIds?: ReadonlyArray<LaneId>;
  includeSnapshot?: boolean;
  includeUnverifiedOverlays?: boolean;
  includeReportedActivity?: boolean;
}>;

const nonBlank = (value: string): boolean => value.trim().length > 0;

// Structural integrity only. The guard holds no lane vocabulary, order or count of its own: Team
// Kitty owns those, and the expected values live in the tests as the oracle.
const guardTenLaneSources = (base: BaseFixture, extension: TenLaneSource): true => {
  const laneIds = base.detailedLanes.map(({ id }) => id);
  if (laneIds.length === 0 || new Set(laneIds).size !== laneIds.length) {
    throw new TypeError('Detailed lanes must be supplied, each exactly once.');
  }
  if (!base.detailedLanes.every(({ label }) => nonBlank(label))) {
    throw new TypeError('Every detailed lane needs a supplied label.');
  }
  if (base.navigation.filter(({ current }) => current === true).length !== 1) {
    throw new TypeError('Exactly one supplied navigation entry must be current.');
  }
  const knownLanes = new Set<string>(laneIds);
  const workPackageIds = new Set<string>();
  const routes = new Set<string>();
  for (const workPackage of base.workPackages) {
    if (workPackageIds.has(workPackage.id)) {
      throw new TypeError(`Duplicate Work Package identifier: ${workPackage.id}.`);
    }
    if (!nonBlank(workPackage.href) || routes.has(workPackage.href)) {
      throw new TypeError(`Blank or duplicate Work Package route: ${workPackage.href}.`);
    }
    if (!knownLanes.has(workPackage.committedLaneId)) {
      throw new TypeError(`Unknown committed lane for ${workPackage.id}: ${workPackage.committedLaneId}.`);
    }
    const trackerKeys = workPackage.trackerReferences.map(({ label, href }) => `${label}\u0000${href}`);
    if (
      !workPackage.trackerReferences.every(({ label, href }) => nonBlank(label) && nonBlank(href)) ||
      new Set(trackerKeys).size !== trackerKeys.length
    ) {
      throw new TypeError(`Blank or duplicate tracker control for ${workPackage.id}.`);
    }
    workPackageIds.add(workPackage.id);
    routes.add(workPackage.href);
  }
  const overlaid = new Set<string>();
  for (const overlay of extension.unverifiedOverlays) {
    if (!workPackageIds.has(overlay.workPackageId)) {
      throw new TypeError(`Overlay names an unknown Work Package: ${overlay.workPackageId}.`);
    }
    if (overlaid.has(overlay.workPackageId)) {
      throw new TypeError(`More than one overlay for ${overlay.workPackageId}.`);
    }
    if (!knownLanes.has(overlay.targetLaneId)) {
      throw new TypeError(`Overlay names an unknown lane: ${overlay.targetLaneId}.`);
    }
    if (overlay.classification !== 'unverified') {
      throw new TypeError('A ten-lane overlay must stay classified as unverified.');
    }
    if (!STATUS_TONES.includes(overlay.tierTone)) {
      throw new TypeError(`Unknown overlay tier tone: ${overlay.tierTone}.`);
    }
    if (!nonBlank(overlay.tierLabel) || !nonBlank(overlay.actorLabel)) {
      throw new TypeError('An overlay needs a supplied tier label and actor.');
    }
    overlaid.add(overlay.workPackageId);
  }
  const stressLabels = new Map<string, string>(Object.entries(extension.stress.laneLabels));
  if (
    stressLabels.size !== laneIds.length ||
    !laneIds.every((id) => nonBlank(stressLabels.get(id) ?? ''))
  ) {
    throw new TypeError('Stress lane labels must cover exactly the supplied lanes.');
  }
  if (!Object.values(extension.tones).every((tone) => STATUS_TONES.includes(tone))) {
    throw new TypeError('Unknown supplied indicator tone.');
  }
  return true;
};

/**
 * Pure ten-lane projection: renders every supplied lane in supplied order (or the supplied
 * selection, still in supplied order) and places each Work Package by its committed lane only.
 * It never reads #278's observed-activity classification and never mutates either fixture.
 */
export const deriveMissionKanbanTenLanes = (
  base: BaseFixture,
  extension: TenLaneSource,
  options: TenLaneOptions = {},
) => {
  guardTenLaneSources(base, extension);
  const knownIds = new Set(base.workPackages.map(({ id }) => id));
  const included = options.includedWorkPackageIds;
  if (included && (!included.every((id) => knownIds.has(id)) || new Set(included).size !== included.length)) {
    throw new TypeError('A projection requested an unknown or repeated Work Package.');
  }
  const knownLanes = new Set<string>(base.detailedLanes.map(({ id }) => id));
  const selection = options.selectedLaneIds;
  if (selection && (!selection.every((id) => knownLanes.has(id)) || new Set(selection).size !== selection.length)) {
    throw new TypeError('A projection requested an unknown or repeated lane.');
  }

  const includedIds = included ? new Set(included) : knownIds;
  const selectedIds = selection ? new Set<string>(selection) : undefined;
  const overlays = new Map(
    options.includeUnverifiedOverlays
      ? extension.unverifiedOverlays.map((overlay) => [overlay.workPackageId, overlay] as const)
      : [],
  );
  const committed = base.workPackages.filter(({ id }) => includedIds.has(id));
  const committedIn = (laneId: LaneId): ReadonlyArray<BaseWorkPackage> =>
    committed.filter(({ committedLaneId }) => committedLaneId === laneId);

  const lanes = base.detailedLanes
    .filter(({ id }) => selectedIds === undefined || selectedIds.has(id))
    .map((lane) => {
      const workPackages = committedIn(lane.id).map((workPackage) => ({
        id: workPackage.id,
        href: workPackage.href,
        committedLaneId: workPackage.committedLaneId,
        agentProfileLabel: workPackage.agentProfileLabel,
        trackerReferences: workPackage.trackerReferences,
        unverifiedOverlay: overlays.get(workPackage.id),
      }));
      return { id: lane.id, label: lane.label, count: workPackages.length, workPackages };
    });

  return deepFreezeMissionKanban({
    commit: base.commit,
    choices: base.detailedLanes.map((lane) => ({
      id: lane.id,
      label: lane.label,
      count: committedIn(lane.id).length,
      checked: selectedIds?.has(lane.id) ?? false,
    })),
    lanes,
    selectedLaneIds: base.detailedLanes
      .map(({ id }) => id)
      .filter((id) => selectedIds?.has(id) ?? false),
    renderedWorkPackageIds: lanes.flatMap(({ workPackages }) => workPackages.map(({ id }) => id)),
    snapshot: options.includeSnapshot ? base.snapshot : undefined,
    unverifiedOverlays: lanes.flatMap(({ workPackages }) =>
      workPackages.flatMap(({ unverifiedOverlay }) => (unverifiedOverlay ? [unverifiedOverlay] : [])),
    ),
    reportedActivity: options.includeReportedActivity ? base.reportedActivity : [],
  });
};

type TenLaneProjection = ReturnType<typeof deriveMissionKanbanTenLanes>;
type TenLaneCard = TenLaneProjection['lanes'][number]['workPackages'][number];

/**
 * Every guard, each fed a mutated clone of the fixtures. A check counts as proven only when the
 * projection throws that guard's own error, so a later guard cannot mask a deleted earlier one.
 */
export const missionKanbanTenLaneGuardProof = () => {
  const base = MISSION_KANBAN_FIXTURE;
  const extension = MISSION_KANBAN_TEN_LANE_FIXTURE;
  const first = base.workPackages[0]!;
  const second = base.workPackages[1]!;
  const overlay = extension.unverifiedOverlays[0]!;
  const withBase = (next: BaseFixture) => () => deriveMissionKanbanTenLanes(next, extension);
  const withExtension = (next: TenLaneSource) => () => deriveMissionKanbanTenLanes(base, next);
  const withOptions = (options: TenLaneOptions) => () => deriveMissionKanbanTenLanes(base, extension, options);
  const firstReplaced = (patch: Partial<BaseWorkPackage>): BaseFixture => ({
    ...base,
    workPackages: [{ ...first, ...patch }, ...base.workPackages.slice(1)],
  });
  const overlayReplaced = (patch: Partial<UnverifiedOverlayFixture>): TenLaneSource => ({
    ...extension,
    unverifiedOverlays: [{ ...overlay, ...patch }],
  });
  const checks = [
    ['duplicateLane', /each exactly once/, withBase({ ...base, detailedLanes: [...base.detailedLanes, base.detailedLanes[0]!] })],
    ['emptyLanes', /each exactly once/, withBase({ ...base, detailedLanes: [] })],
    ['blankLaneLabel', /needs a supplied label/, withBase({ ...base, detailedLanes: [{ ...base.detailedLanes[0]!, label: ' ' }, ...base.detailedLanes.slice(1)] })],
    ['noCurrentNavigation', /navigation entry must be current/, withBase({ ...base, navigation: base.navigation.map((item) => ({ ...item, current: false })) })],
    ['duplicateWorkPackage', /Duplicate Work Package identifier/, withBase({ ...base, workPackages: [...base.workPackages, first] })],
    ['blankRoute', /Work Package route/, withBase(firstReplaced({ href: ' ' }))],
    ['duplicateRoute', /Work Package route/, withBase(firstReplaced({ href: second.href }))],
    ['unknownCommittedLane', /Unknown committed lane/, withBase(firstReplaced({ committedLaneId: 'not-supplied' as BaseWorkPackage['committedLaneId'] }))],
    ['duplicateTrackerControl', /tracker control/, withBase(firstReplaced({ trackerReferences: [first.trackerReferences[0]!, first.trackerReferences[0]!] }))],
    ['blankTrackerControl', /tracker control/, withBase(firstReplaced({ trackerReferences: [{ label: ' ', href: first.trackerReferences[0]!.href }] }))],
    ['blankTrackerHref', /tracker control/, withBase(firstReplaced({ trackerReferences: [{ label: first.trackerReferences[0]!.label, href: ' ' }] }))],
    ['overlayUnknownWorkPackage', /unknown Work Package/, withExtension(overlayReplaced({ workPackageId: 'WP99' }))],
    ['overlayUnknownLane', /Overlay names an unknown lane/, withExtension(overlayReplaced({ targetLaneId: 'not-supplied' as LaneId }))],
    ['duplicateOverlay', /More than one overlay/, withExtension({ ...extension, unverifiedOverlays: [overlay, overlay] })],
    ['overlayNotUnverified', /classified as unverified/, withExtension(overlayReplaced({ classification: 'observed' as 'unverified' }))],
    ['overlayUnknownTone', /overlay tier tone/, withExtension(overlayReplaced({ tierTone: 'unknown' as StatusIndicatorTone }))],
    ['blankOverlayLabel', /tier label and actor/, withExtension(overlayReplaced({ actorLabel: ' ' }))],
    ['blankOverlayTier', /tier label and actor/, withExtension(overlayReplaced({ tierLabel: ' ' }))],
    ['incompleteStressLabels', /Stress lane labels/, withExtension({ ...extension, stress: { laneLabels: { genesis: 'Genesis' } as TenLaneSource['stress']['laneLabels'] } })],
    ['blankStressLabel', /Stress lane labels/, withExtension({ ...extension, stress: { laneLabels: { ...extension.stress.laneLabels, genesis: ' ' } } })],
    ['unknownIndicatorTone', /indicator tone/, withExtension({ ...extension, tones: { ...extension.tones, commitTrust: 'unknown' as StatusIndicatorTone } })],
    ['unknownSelection', /unknown or repeated lane/, withOptions({ selectedLaneIds: ['not-supplied' as LaneId] })],
    ['repeatedSelection', /unknown or repeated lane/, withOptions({ selectedLaneIds: ['blocked', 'blocked'] })],
    ['unknownWorkPackage', /unknown or repeated Work Package/, withOptions({ includedWorkPackageIds: ['WP99'] })],
    ['repeatedInclusion', /unknown or repeated Work Package/, withOptions({ includedWorkPackageIds: [first.id, first.id] })],
  ] as const;
  return deepFreezeMissionKanban(Object.fromEntries(checks.map(([name, expected, check]) => {
    try {
      check();
      return [name, false];
    } catch (error) {
      return [name, error instanceof TypeError && expected.test(error.message)];
    }
  })));
};

// #209's contract, applied locally: the scroller carries role, one supplied name and a tab stop
// only while it genuinely overflows, and loses all three together when it fits.
const syncBoardRegion = (scroller: HTMLElement, name: string): void => {
  if (scroller.scrollWidth > scroller.clientWidth) {
    scroller.setAttribute('role', 'region');
    scroller.setAttribute('aria-label', name);
    scroller.setAttribute('tabindex', '0');
    return;
  }
  scroller.removeAttribute('role');
  scroller.removeAttribute('aria-label');
  scroller.removeAttribute('tabindex');
};

// One callback ref per render. The ResizeObserver sees viewport and lane-box changes; the content
// observer sees lanes added or removed, which change scrollWidth without resizing the scroller's
// own box. It never observes attributes, so its own writes cannot re-trigger it. Storybook
// force-remounts without disconnecting Lit parts, so a body watcher releases everything once the
// scroller leaves the document.
const createBoardRegionRef = (name: string) => {
  let resizeObserver: ResizeObserver | undefined;
  let contentObserver: MutationObserver | undefined;
  let mountObserver: MutationObserver | undefined;
  const disconnect = (): void => {
    resizeObserver?.disconnect();
    contentObserver?.disconnect();
    mountObserver?.disconnect();
    resizeObserver = undefined;
    contentObserver = undefined;
    mountObserver = undefined;
  };
  return (element?: Element): void => {
    disconnect();
    if (!(element instanceof HTMLElement)) return;
    const sync = (): void => syncBoardRegion(element, name);
    const lanes = new ResizeObserver(sync);
    resizeObserver = lanes;
    lanes.observe(element);
    for (const lane of Array.from(element.children)) lanes.observe(lane);
    contentObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (record.target !== element) continue;
        for (const node of Array.from(record.removedNodes)) {
          if (node instanceof Element) lanes.unobserve(node);
        }
        for (const node of Array.from(record.addedNodes)) {
          if (node instanceof Element) lanes.observe(node);
        }
      }
      sync();
    });
    contentObserver.observe(element, { childList: true, subtree: true, characterData: true });
    const mountBoundary = document.body;
    mountObserver = new MutationObserver(() => {
      if (!mountBoundary.contains(element)) disconnect();
    });
    mountObserver.observe(mountBoundary, { childList: true, subtree: true });
    sync();
  };
};

const PATTERN_STYLES = html`<style>
  .sk-mission-kanban-ten-lane-pattern {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: 100vh;
    color: var(--sk-fg-body);
    background: var(--sk-surface-page);
    font-family: var(--sk-font-sans);
  }
  .sk-mission-kanban-ten-lane-pattern *,
  .sk-mission-kanban-ten-lane-pattern *::before,
  .sk-mission-kanban-ten-lane-pattern *::after { box-sizing: border-box; }
  .sk-mission-kanban-ten-lane-pattern__shell::part(shell) { min-block-size: 100vh; }
  .sk-mission-kanban-ten-lane-pattern__rail-link,
  .sk-mission-kanban-ten-lane-pattern__compact-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--sk-space-9);
    min-block-size: var(--sk-space-9);
    padding: var(--sk-space-2);
    color: var(--sk-fg-default);
    border-width: var(--sk-border-width-1);
    border-style: solid;
    border-color: var(--sk-border-default);
    border-radius: var(--sk-radius-md);
    text-decoration-line: none;
    overflow-wrap: anywhere;
  }
  .sk-mission-kanban-ten-lane-pattern__rail-link:focus-visible,
  .sk-mission-kanban-ten-lane-pattern__compact-link:focus-visible,
  .sk-mission-kanban-ten-lane-pattern__tracker-link:focus-visible {
    outline-width: var(--sk-border-width-2);
    outline-style: solid;
    outline-color: var(--sk-border-focus);
    outline-offset: var(--sk-border-width-1);
  }
  .sk-mission-kanban-ten-lane-pattern__sidebar-heading {
    display: grid;
    gap: var(--sk-space-1);
    min-inline-size: 0;
  }
  .sk-mission-kanban-ten-lane-pattern__eyebrow {
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-xs);
    font-weight: var(--sk-weight-semibold);
  }
  .sk-mission-kanban-ten-lane-pattern__mission-label {
    color: var(--sk-fg-default);
    font-size: var(--sk-text-lg);
    overflow-wrap: anywhere;
  }
  .sk-mission-kanban-ten-lane-pattern__compact-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sk-space-3);
    min-inline-size: 0;
  }
  .sk-mission-kanban-ten-lane-pattern__compact-link {
    flex: 0 0 auto;
    max-inline-size: 50%;
  }
  .sk-mission-kanban-ten-lane-pattern__compact-brand {
    min-inline-size: 0;
    color: var(--sk-fg-default);
    font-weight: var(--sk-weight-semibold);
    overflow-wrap: anywhere;
  }
  .sk-mission-kanban-ten-lane-pattern__page {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-inline-size: 0;
    gap: var(--sk-space-6);
    padding: var(--sk-space-6);
  }
  .sk-mission-kanban-ten-lane-pattern__compact-header:not([inert])
    ~ .sk-mission-kanban-ten-lane-pattern__page {
    gap: var(--sk-space-4);
    padding-inline: var(--sk-space-4);
  }
  .sk-mission-kanban-ten-lane-pattern__truth {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sk-space-2);
    min-inline-size: 0;
  }
  .sk-mission-kanban-ten-lane-pattern__truth-label {
    color: var(--sk-fg-muted);
    font-size: var(--sk-text-sm);
    font-weight: var(--sk-weight-semibold);
  }
  .sk-mission-kanban-ten-lane-pattern__code { overflow-wrap: anywhere; }
  .sk-mission-kanban-ten-lane-pattern__branch-pill {
    min-inline-size: 0;
    max-inline-size: 100%;
  }
  .sk-mission-kanban-ten-lane-pattern__branch-pill::part(tag) {
    box-sizing: border-box;
    max-inline-size: 100%;
    overflow-wrap: anywhere;
    white-space: normal;
  }
  .sk-mission-kanban-ten-lane-pattern__overlay-presence { margin: 0; }
  .sk-mission-kanban-ten-lane-pattern__filter-body {
    display: grid;
    gap: var(--sk-space-4);
  }
  .sk-mission-kanban-ten-lane-pattern__filter-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sk-space-2);
  }
  .sk-mission-kanban-ten-lane-pattern__board-title {
    margin: 0;
    color: var(--sk-fg-default);
    font-size: var(--sk-text-xl);
  }
  .sk-mission-kanban-ten-lane-pattern__lane-list {
    display: grid;
    gap: var(--sk-space-3);
    padding: 0;
    list-style: none;
  }
  .sk-mission-kanban-ten-lane-pattern__overlay {
    display: grid;
    justify-items: start;
    gap: var(--sk-space-1);
    padding: var(--sk-space-2);
    border-width: var(--sk-border-width-1);
    border-style: dashed;
    border-color: var(--sk-border-default);
    border-radius: var(--sk-radius-sm);
    background: var(--sk-surface-muted);
  }
  .sk-mission-kanban-ten-lane-pattern__overlay-actor {
    color: var(--sk-fg-default);
    font-weight: var(--sk-weight-semibold);
  }
  .sk-mission-kanban-ten-lane-pattern__tracker-link {
    color: var(--sk-fg-body);
    text-underline-offset: var(--sk-space-1);
  }
  .sk-mission-kanban-ten-lane-pattern__reported {
    display: grid;
    gap: var(--sk-space-3);
    min-inline-size: 0;
    padding: var(--sk-space-4);
    border-width: var(--sk-border-width-1);
    border-style: solid;
    border-color: var(--sk-border-default);
    border-radius: var(--sk-radius-md);
    background: var(--sk-surface-card);
  }
  .sk-mission-kanban-ten-lane-pattern__reported-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sk-space-3);
  }
  .sk-mission-kanban-ten-lane-pattern__reported-title {
    margin: 0;
    color: var(--sk-fg-default);
    font-size: var(--sk-text-lg);
  }
  .sk-mission-kanban-ten-lane-pattern__reported-list {
    display: grid;
    gap: var(--sk-space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sk-mission-kanban-ten-lane-pattern__reported-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 2fr) auto;
    gap: var(--sk-space-3);
    padding-block: var(--sk-space-2);
    border-block-start-width: var(--sk-border-width-1);
    border-block-start-style: solid;
    border-block-start-color: var(--sk-border-default);
    overflow-wrap: anywhere;
  }
  .sk-mission-kanban-ten-lane-pattern__compact-header:not([inert])
    ~ .sk-mission-kanban-ten-lane-pattern__page
    .sk-mission-kanban-ten-lane-pattern__reported-row {
    grid-template-columns: minmax(0, 1fr);
  }
  .sk-mission-kanban-ten-lane-pattern__reported-who {
    display: grid;
    gap: var(--sk-space-1);
  }
  .sk-mission-kanban-ten-lane-pattern__reported-empty {
    margin: 0;
    color: var(--sk-fg-muted);
  }
  @media (forced-colors: active) {
    .sk-mission-kanban-ten-lane-pattern__overlay,
    .sk-mission-kanban-ten-lane-pattern__reported { border-color: CanvasText; }
    .sk-mission-kanban-ten-lane-pattern__rail-link:focus-visible,
    .sk-mission-kanban-ten-lane-pattern__compact-link:focus-visible,
    .sk-mission-kanban-ten-lane-pattern__tracker-link:focus-visible { outline-color: Highlight; }
  }
</style>`;

type Presentation = Readonly<{
  state: string;
  light?: boolean;
  long?: boolean;
  rtl?: boolean;
  filtersOpen?: boolean;
}>;

type Labels = Readonly<{
  team: string;
  repository: string;
  mission: string;
  branch: string;
  lane: (lane: Readonly<{ id: LaneId; label: string }>) => string;
}>;

const renderCard = (card: TenLaneCard) => {
  const { copy, format } = MISSION_KANBAN_TEN_LANE_FIXTURE;
  const overlay = card.unverifiedOverlay;
  return html`
    <li data-work-package-id=${card.id} data-committed-lane=${card.committedLaneId}>
      <sk-action-row layout="card" href=${card.href}>
        <span slot="title">${card.id}</span>
        <code slot="reference">${format.detailedLane(card.committedLaneId)}</code>
        <span slot="metadata">${card.agentProfileLabel}</span>
        ${overlay ? html`
          <span class="sk-mission-kanban-ten-lane-pattern__overlay" slot="supporting" data-unverified-overlay>
            <sk-status-indicator tone=${overlay.tierTone}><span slot="marker">${copy.overlayMarker}</span>${overlay.tierLabel}</sk-status-indicator>
            <span class="sk-mission-kanban-ten-lane-pattern__overlay-actor">${overlay.actorLabel}</span>
            <span>${format.overlayDestination(overlay.targetLaneId)}</span>
          </span>
        ` : nothing}
        ${card.trackerReferences.map((reference) => html`
          <a class="sk-mission-kanban-ten-lane-pattern__tracker-link" slot="controls" href=${reference.href}>${reference.label}</a>
        `)}
      </sk-action-row>
    </li>
  `;
};

const renderFilters = (projection: TenLaneProjection, rootId: string, labels: Labels, open: boolean) => {
  const { copy } = MISSION_KANBAN_TEN_LANE_FIXTURE;
  return html`
    <details class="sk-disclosure" ?open=${open} data-lane-filters>
      <summary class="sk-disclosure__summary">${copy.filterSummary}</summary>
      <div class="sk-disclosure__body sk-mission-kanban-ten-lane-pattern__filter-body">
        <fieldset class="sk-checkbox-choice-group">
          <legend class="sk-checkbox-choice-group__legend">${copy.filterLegend}</legend>
          <div class="sk-checkbox-choice-group__options">
            ${projection.choices.map((choice) => html`
              <label class="sk-checkbox-choice-group__choice" for="${rootId}-lane-choice-${choice.id}">
                <input
                  class="sk-checkbox-choice-group__control"
                  id="${rootId}-lane-choice-${choice.id}"
                  type="checkbox"
                  name="lanes"
                  value=${choice.id}
                  ?checked=${choice.checked}
                >
                <span class="sk-checkbox-choice-group__label">${labels.lane(choice)}</span>
                <span class="sk-checkbox-choice-group__metadata">${choice.count}</span>
              </label>
            `)}
          </div>
        </fieldset>
        <div class="sk-mission-kanban-ten-lane-pattern__filter-actions">
          <sk-button variant="primary">${copy.filterApply}</sk-button>
          ${projection.selectedLaneIds.length > 0 ? html`<sk-button variant="secondary">${copy.filterClear}</sk-button>` : nothing}
        </div>
      </div>
    </details>
  `;
};

const renderBoard = (projection: TenLaneProjection, rootId: string, labels: Labels) => {
  const { copy, format } = MISSION_KANBAN_TEN_LANE_FIXTURE;
  return html`
    <section class="sk-workflow-board" aria-labelledby="${rootId}-board-title" data-committed-board>
      <h2 class="sk-mission-kanban-ten-lane-pattern__board-title" id="${rootId}-board-title">${copy.boardHeading}</h2>
      <div
        class="sk-workflow-board__scroller"
        data-board-scroller
        ${ref(createBoardRegionRef(copy.boardRegionName))}
      >
        ${projection.lanes.map((lane) => html`
          <section class="sk-workflow-lane" aria-labelledby="${rootId}-lane-${lane.id}" data-lane-id=${lane.id}>
            <header class="sk-workflow-lane__header">
              <h3 class="sk-workflow-lane__title" id="${rootId}-lane-${lane.id}">${labels.lane(lane)}</h3>
              <span class="sk-workflow-lane__count" aria-label=${format.laneCount(lane.count)}>${lane.count}</span>
            </header>
            <ol class="sk-workflow-lane__list sk-mission-kanban-ten-lane-pattern__lane-list">
              ${lane.workPackages.map(renderCard)}
            </ol>
            ${lane.count === 0 ? html`
              <div class="sk-empty-state sk-empty-state--inline" data-empty-lane>${copy.emptyLane}</div>
            ` : nothing}
          </section>
        `)}
      </div>
    </section>
  `;
};

const renderReportedActivity = (
  projection: TenLaneProjection,
  rootId: string,
  long: boolean,
) => {
  const base = MISSION_KANBAN_FIXTURE;
  const { copy, tones } = MISSION_KANBAN_TEN_LANE_FIXTURE;
  return html`
    <section class="sk-mission-kanban-ten-lane-pattern__reported" aria-labelledby="${rootId}-reported-title" data-reported-activity>
      <header class="sk-mission-kanban-ten-lane-pattern__reported-header">
        <h2 class="sk-mission-kanban-ten-lane-pattern__reported-title" id="${rootId}-reported-title">${copy.reportedHeading}</h2>
        <sk-status-indicator tone=${tones.reportedLive}><span slot="marker">${copy.statusMarker}</span>${copy.reportedTierLabel}</sk-status-indicator>
      </header>
      ${projection.reportedActivity.length > 0 ? html`
        <ol class="sk-mission-kanban-ten-lane-pattern__reported-list">
          ${projection.reportedActivity.map((activity) => html`
            <li class="sk-mission-kanban-ten-lane-pattern__reported-row" data-reported-live>
              <span class="sk-mission-kanban-ten-lane-pattern__reported-who"><strong>${activity.actorLabel}</strong><span>${activity.trustLabel}</span></span>
              <code class="sk-mission-kanban-ten-lane-pattern__code">${long ? base.stress.repositoryLabel : activity.repositoryLabel}</code>
              <code class="sk-mission-kanban-ten-lane-pattern__code">${long ? base.stress.branchLabel : activity.branchLabel}</code>
              <span>${activity.ageLabel}</span>
            </li>
          `)}
        </ol>
      ` : html`<p class="sk-mission-kanban-ten-lane-pattern__reported-empty">${base.copy.emptyActivity}</p>`}
    </section>
  `;
};

/** Renders one ten-lane state from public surfaces; every string comes from a fixture. */
export const renderMissionKanbanTenLanes = (
  projection: TenLaneProjection,
  presentation: Presentation,
): TemplateResult => {
  const base = MISSION_KANBAN_FIXTURE;
  const extension = MISSION_KANBAN_TEN_LANE_FIXTURE;
  const { copy, format, routes, tones } = extension;
  const long = presentation.long === true;
  const rootId = `mission-kanban-ten-lane-${presentation.state}`;
  const current = base.navigation.find((item) => item.current === true)!;
  const labels: Labels = {
    team: long ? base.stress.teamLabel : base.teamLabel,
    repository: long ? base.stress.repositoryLabel : base.repositoryLabel,
    mission: long ? base.stress.missionLabel : base.missionLabel,
    branch: long ? base.stress.branchLabel : base.commit.branchLabel,
    lane: (lane) => (long ? extension.stress.laneLabels[lane.id] : lane.label),
  };
  const testSeam = Object.freeze({
    base,
    extension,
    projection,
    derive: deriveMissionKanbanTenLanes,
  });
  const testSeamRef = (element?: Element): void => {
    if (!(element instanceof HTMLElement)) return;
    Object.defineProperty(element, '__missionKanbanTenLaneTestSeam', {
      configurable: true,
      value: testSeam,
    });
  };

  return html`
    <div
      class="sk-mission-kanban-ten-lane-pattern${presentation.light ? ' sk-light' : ''}"
      dir=${presentation.rtl ? 'rtl' : nothing}
      data-mission-kanban-ten-lane-pattern
      data-render-complete="true"
      data-fixture-deeply-frozen=${String(isMissionKanbanDeeplyFrozen(base) && isMissionKanbanDeeplyFrozen(extension))}
      data-projection-deeply-frozen=${String(isMissionKanbanDeeplyFrozen(projection))}
      data-lane-ids=${JSON.stringify(projection.lanes.map(({ id }) => id))}
      data-lane-counts=${JSON.stringify(projection.lanes.map(({ count }) => count))}
      data-choice-counts=${JSON.stringify(projection.choices.map(({ count }) => count))}
      data-work-package-ids=${JSON.stringify(projection.renderedWorkPackageIds)}
      data-selected-lane-ids=${JSON.stringify(projection.selectedLaneIds)}
      data-commit=${projection.commit.shaLabel}
      data-guard-proof=${JSON.stringify(missionKanbanTenLaneGuardProof())}
      ${ref(testSeamRef)}
    >
      ${PATTERN_STYLES}
      <sk-app-shell class="sk-mission-kanban-ten-lane-pattern__shell" presentation="compact">
        <sk-personal-rail slot="personal-rail" label=${copy.railLabel}>
          <a class="sk-mission-kanban-ten-lane-pattern__rail-link" slot="primary" href=${routes.work} aria-label=${copy.railWorkName}>${copy.railWorkLink}</a>
          <a class="sk-mission-kanban-ten-lane-pattern__rail-link" slot="account" href=${routes.account} aria-label=${labels.team}>${copy.railAccountLink}</a>
        </sk-personal-rail>
        <sk-context-sidebar slot="context-sidebar" label=${copy.sidebarLabel}>
          <div class="sk-mission-kanban-ten-lane-pattern__sidebar-heading" slot="header">
            <span class="sk-mission-kanban-ten-lane-pattern__eyebrow">${copy.sidebarEyebrow}</span>
            <strong class="sk-mission-kanban-ten-lane-pattern__mission-label">${labels.mission}</strong>
            <span>${base.missionId}</span>
          </div>
          <nav class="sk-context-nav" aria-label=${copy.missionNavigationLabel}>
            <ul class="sk-context-nav__list">
              ${base.navigation.map((item) => html`
                <li class="sk-context-nav__item">
                  ${item.available ? html`
                    <a class="sk-context-nav__link" href=${item.href} aria-current=${item.current ? 'page' : nothing}><span class="sk-context-nav__label">${item.label}</span></a>
                  ` : html`
                    <span class="sk-context-nav__unavailable" aria-disabled="true"><span class="sk-context-nav__label">${item.label}</span><span class="sk-context-nav__annotation">${copy.unavailableAnnotation}</span></span>
                  `}
                </li>
              `)}
            </ul>
          </nav>
        </sk-context-sidebar>
        <div class="sk-mission-kanban-ten-lane-pattern__compact-header" slot="compact-header">
          <span class="sk-mission-kanban-ten-lane-pattern__compact-brand">${format.compactBrand(labels.team)}</span>
          <a class="sk-mission-kanban-ten-lane-pattern__compact-link" href=${current.href} aria-current="page">${current.label}</a>
        </div>
        <sk-page-header slot="page-header">
          <span slot="eyebrow">${format.eyebrow(base.missionId)}</span>
          <h1 slot="title">${copy.pageTitle}</h1>
          <p slot="supporting">${format.subtitle(labels.repository)}</p>
          <sk-status-indicator slot="sync" tone=${tones.commitTrust}><span slot="marker">${copy.statusMarker}</span>${base.commit.trustLabel}</sk-status-indicator>
        </sk-page-header>

        <div class="sk-mission-kanban-ten-lane-pattern__page">
          <nav class="sk-breadcrumbs" aria-label=${copy.breadcrumbLabel}>
            <ol class="sk-breadcrumbs__list">
              <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href=${routes.repositories}>${copy.breadcrumbRoot}</a></li>
              <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href=${routes.repository}>${labels.repository}</a></li>
              <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href=${routes.mission}>${labels.mission}</a></li>
              <li class="sk-breadcrumbs__item"><a class="sk-breadcrumbs__link" href=${current.href} aria-current="page">${current.label}</a></li>
            </ol>
          </nav>

          <div class="sk-mission-kanban-ten-lane-pattern__truth" data-commit-truth>
            <span class="sk-mission-kanban-ten-lane-pattern__truth-label">${copy.truthTierLabel}</span>
            <sk-pill-tag><code>${projection.commit.shaLabel}</code></sk-pill-tag>
            <sk-pill-tag class="sk-mission-kanban-ten-lane-pattern__branch-pill"><code class="sk-mission-kanban-ten-lane-pattern__code">${labels.branch}</code></sk-pill-tag>
          </div>

          ${projection.unverifiedOverlays.length > 0 ? html`
            <p class="sk-mission-kanban-ten-lane-pattern__overlay-presence" data-live-overlays-shown>
              <sk-pill-tag>${copy.liveOverlaysShown}</sk-pill-tag>
            </p>
          ` : nothing}

          ${projection.snapshot ? html`
            <sk-notice
              tone="attention"
              announce=${projection.snapshot.announce}
              message=${projection.snapshot.message}
              data-snapshot-behind-log
            ><h2 slot="heading">${projection.snapshot.heading}</h2></sk-notice>
          ` : nothing}

          ${renderFilters(projection, rootId, labels, presentation.filtersOpen === true)}
          ${renderBoard(projection, rootId, labels)}
          ${renderReportedActivity(projection, rootId, long)}
        </div>
      </sk-app-shell>
    </div>
  `;
};

const committedBoard = (options: TenLaneOptions = {}) => deriveMissionKanbanTenLanes(
  MISSION_KANBAN_FIXTURE,
  MISSION_KANBAN_TEN_LANE_FIXTURE,
  { includeReportedActivity: true, ...options },
);

const patternRoot = (canvasElement: HTMLElement): HTMLElement => {
  const root = canvasElement.querySelector<HTMLElement>('[data-mission-kanban-ten-lane-pattern]');
  if (!root) throw new Error('The ten-lane pattern root did not render.');
  return root;
};

// The flag every spec and visual test waits on is set LAST, after the story's own checks, so a
// failing per-story assertion leaves it unset instead of racing past it.
const basePlay = async (
  canvasElement: HTMLElement,
  storyChecks: (root: HTMLElement) => Promise<void> = async () => {},
): Promise<void> => {
  const root = patternRoot(canvasElement);
  await expect(root.dataset.renderComplete).toBe('true');
  await expect(root.dataset.fixtureDeeplyFrozen).toBe('true');
  await expect(root.dataset.projectionDeeplyFrozen).toBe('true');
  const proof = JSON.parse(root.dataset.guardProof ?? '{}') as Record<string, boolean>;
  // The exact guard names are pinned by the focused suite; here only a non-empty floor.
  await expect(Object.keys(proof).length).toBeGreaterThan(0);
  await expect(Object.values(proof).every((failedClosed) => failedClosed)).toBe(true);
  await storyChecks(root);
  root.setAttribute('data-play-proof', 'passed');
};

const meta: Meta = {
  title: 'Patterns/Mission Kanban Ten-Lane',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: {
      description: {
        component: 'Story-only ten-lane Mission Kanban (#395): a pure projection of the #278 immutable fixture across all ten canonical detailed lanes, composed from public surfaces, with the board region triad applied only while the board overflows.',
      },
    },
  },
  excludeStories: [
    'MISSION_KANBAN_TEN_LANE_FIXTURE',
    'deriveMissionKanbanTenLanes',
    'missionKanbanTenLaneGuardProof',
    'renderMissionKanbanTenLanes',
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: 'K1 Populated ten lanes',
  render: () => renderMissionKanbanTenLanes(committedBoard(), { state: 'k1' }),
  play: async ({ canvasElement }) => basePlay(canvasElement, async (root) => {
    await expect(root.querySelectorAll('[data-lane-id]')).toHaveLength(MISSION_KANBAN_FIXTURE.detailedLanes.length);
    await expect(root.querySelectorAll('[data-work-package-id]')).toHaveLength(MISSION_KANBAN_FIXTURE.workPackages.length);
  }),
};

export const K2NarrowContained: Story = {
  name: 'K2 Narrow contained',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => renderMissionKanbanTenLanes(committedBoard(), { state: 'k2' }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const K3FilteredLanes: Story = {
  name: 'K3 Filtered lanes',
  render: () => renderMissionKanbanTenLanes(
    committedBoard({ selectedLaneIds: MISSION_KANBAN_FIXTURE.k3SelectedLaneIds }),
    { state: 'k3', filtersOpen: true },
  ),
  play: async ({ canvasElement }) => basePlay(canvasElement, async (root) => {
    await expect(root.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(MISSION_KANBAN_FIXTURE.k3SelectedLaneIds.length);
    await expect(root.querySelectorAll('[data-lane-id]')).toHaveLength(MISSION_KANBAN_FIXTURE.k3SelectedLaneIds.length);
  }),
};

export const K4SnapshotBehindLog: Story = {
  name: 'K4 Snapshot behind log',
  render: () => renderMissionKanbanTenLanes(committedBoard({ includeSnapshot: true }), { state: 'k4' }),
  play: async ({ canvasElement }) => basePlay(canvasElement, async (root) => {
    await expect(root.querySelectorAll('[data-snapshot-behind-log]')).toHaveLength(1);
  }),
};

export const K5UnverifiedOverlay: Story = {
  name: 'K5 Unverified overlay',
  render: () => renderMissionKanbanTenLanes(committedBoard({ includeUnverifiedOverlays: true }), { state: 'k5' }),
  play: async ({ canvasElement }) => basePlay(canvasElement, async (root) => {
    await expect(root.querySelectorAll('[data-unverified-overlay]')).toHaveLength(1);
  }),
};

export const K6EmptyLanes: Story = {
  name: 'K6 Empty lanes',
  render: () => renderMissionKanbanTenLanes(
    deriveMissionKanbanTenLanes(MISSION_KANBAN_FIXTURE, MISSION_KANBAN_TEN_LANE_FIXTURE, { includedWorkPackageIds: [] }),
    { state: 'k6' },
  ),
  play: async ({ canvasElement }) => basePlay(canvasElement, async (root) => {
    const counts = JSON.parse(root.dataset.laneCounts ?? '[]') as number[];
    await expect(counts.every((count) => count === 0)).toBe(true);
    await expect(root.querySelectorAll('[data-empty-lane]')).toHaveLength(MISSION_KANBAN_FIXTURE.detailedLanes.length);
  }),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => renderMissionKanbanTenLanes(committedBoard(), { state: 'light', light: true }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const LongContent: Story = {
  render: () => renderMissionKanbanTenLanes(committedBoard(), { state: 'long', long: true, filtersOpen: true }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const ForcedColors: Story = {
  render: () => renderMissionKanbanTenLanes(
    committedBoard({ includeSnapshot: true, includeUnverifiedOverlays: true }),
    { state: 'forced' },
  ),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const ReducedMotion: Story = {
  render: () => renderMissionKanbanTenLanes(committedBoard({ includeUnverifiedOverlays: true }), { state: 'reduced' }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};

export const RTL: Story = {
  render: () => renderMissionKanbanTenLanes(committedBoard(), { state: 'rtl', rtl: true }),
  play: async ({ canvasElement }) => basePlay(canvasElement),
};
