# Data model: Mission Kanban story fixture

All types are Storybook-only display input. They are deeply readonly and are not a Team Kitty API,
backend schema, public package export, or state store.

```ts
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

type StageFixture = Readonly<{
  id: StageId;
  label: 'Planned' | 'Doing' | 'For review' | 'Approved' | 'Done';
  detailedLaneIds: ReadonlyArray<DetailedLaneId>;
}>;

type DetailedLaneFixture = Readonly<{
  id: DetailedLaneId;
  label: string;
}>;

type TrackerReferenceFixture = Readonly<{
  label: string;
  href: string;
}>;

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

type SnapshotFixture = Readonly<{
  classification: 'snapshot-behind-log';
  heading: string;
  message: string;
  announce: 'polite';
}>;

type ReportedActivityFixture = Readonly<{
  classification: 'reported-live';
  actorLabel: string;
  repositoryLabel: string;
  branchLabel: string;
  ageLabel: string;
  trustLabel: string;
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
  stages: ReadonlyArray<StageFixture>;
  detailedLanes: ReadonlyArray<DetailedLaneFixture>;
  workPackages: ReadonlyArray<WorkPackageFixture>;
  k3SelectedLaneIds: readonly ['in_review', 'blocked'];
  snapshot: SnapshotFixture;
  reportedActivity: ReadonlyArray<ReportedActivityFixture>;
  copy: Readonly<{
    boardHeading: string;
    boardHelp: string;
    emptyLane: string;
    emptyActivity: string;
  }>;
}>;
```

## Exact fixture records

### Stage reduction

```ts
const stages = [
  { id: 'planned', label: 'Planned', detailedLaneIds: ['planned', 'blocked'] },
  { id: 'doing', label: 'Doing', detailedLaneIds: ['claimed', 'in_progress'] },
  { id: 'for_review', label: 'For review', detailedLaneIds: ['for_review', 'in_review'] },
  { id: 'approved', label: 'Approved', detailedLaneIds: ['approved'] },
  { id: 'done', label: 'Done', detailedLaneIds: ['done', 'canceled'] },
] as const;
```

`genesis` remains an explicit zero-count filter lane but has no Work Package in K1–K6. It is not
assigned a presentation stage in this fixture because neither the approved family nor the pinned
application mapping supplies one. The projection guard rejects a non-empty unmapped lane.

### Work Packages

The approved fixture contains exactly these committed records, in source order within each stage:

| Stage | Work Package | Exact lane | Profile | Tracker |
|---|---|---|---|---|
| Planned | WP04 | `planned` | `implementer-ivan` | `#1051` |
| Planned | WP05 | `blocked` | `researcher-robbie` | `#1054` |
| Planned | WP06 | `planned` | `implementer-ivan` | none |
| Doing | WP03 | `in_progress` | `implementer-ivan` | `#1048` |
| Doing | WP07 | `claimed` | `reviewer-rachel` | none |
| Doing | WP08 | `in_progress` | `implementer-ivan` | none |
| Doing | WP09 | `in_progress` | `implementer-ivan` | none |
| For review | WP02 | `for_review` | `reviewer-rachel` | `#1046` |
| For review | WP10 | `in_review` | `reviewer-rachel` | none |
| For review | WP11 | `for_review` | `reviewer-rachel` | none |
| Approved | WP01 | `approved` | `reviewer-rachel` | `#1043` |
| Done | WP12 | `done` | `implementer-ivan` | none |
| Done | WP13 | `done` | `implementer-ivan` | none |
| Done | WP14 | `done` | `implementer-ivan` | none |
| Done | WP15 | `done` | `implementer-ivan` | none |

The WP03 record alone has the approved observed overlay:

```ts
{
  classification: 'observed',
  actorLabel: 'lynn',
  targetLaneId: 'for_review',
  lagLabel: 'up to 60 s behind',
  message: 'lynn → for_review, not yet pushed',
}
```

Its `committedLaneId` remains `in_progress`; the observation never changes its projected Doing
stage.

### Detailed filters and counts

Detailed lane source order is Genesis, Planned, Claimed, In progress, For review, In review,
Approved, Done, Blocked, Canceled. Counts derived from K1 are respectively:

```text
0, 2, 1, 3, 2, 1, 1, 4, 1, 0
```

K3's controlled checked set is exactly `['in_review', 'blocked']`. Its projection contains WP10
and WP05, total 2 of 15, and renders only the For review and Planned stages that contain them.

## Pure projections

`deriveKanban(fixture, options)` returns a deeply frozen projection and never mutates the fixture.
Supported story-only options are:

```ts
type KanbanProjectionOptions = Readonly<{
  includedWorkPackages?: ReadonlyArray<WorkPackageFixture>;
  selectedLaneIds?: ReadonlyArray<DetailedLaneId>;
  includeSnapshot?: boolean;
  includeObservedActivity?: boolean;
  includeReportedActivity?: boolean;
}>;
```

The projection:

- filters only when `selectedLaneIds` is explicitly supplied by a story;
- maps each included Work Package's exact committed lane to one supplied stage;
- preserves stage order and Work Package source order;
- derives detailed-lane and stage counts from included records;
- retains exact committed lane on every projected card;
- includes snapshot and observed records only when the story requests them; and
- returns empty arrays/counts without substituting invented data.

`renderMissionKanban(projection, presentation)` is a pure Lit render helper. Presentation options
may choose dark/light, desktop/compact, long labels, and whether the known rendered composition
genuinely overflows. They do not change domain data.

## Relationships

```text
MissionKanbanFixture
├── 1 Commit context
├── 5 StageFixture records (ordered)
│   └── maps 0..n DetailedLaneIds
├── 10 DetailedLaneFixture records (ordered)
├── 15 WorkPackageFixture records
│   ├── exactly 1 committed DetailedLaneId
│   ├── exactly 1 consumer-supplied native route
│   ├── 0..n tracker references
│   └── 0..1 observed activity record
├── 1 SnapshotFixture
└── 0..n ReportedActivityFixture records
```

Snapshot, observed activity, reported activity, and committed lane are siblings. None derives or
overwrites another.

## Invariants

- stage ids, detailed lane ids, Work Package ids, DOM ids, and route labels are unique;
- stage order is exactly Planned, Doing, For review, Approved, Done;
- every non-empty committed detailed lane maps to exactly one stage;
- every Work Package appears in exactly one native ordered list;
- stage counts equal direct `<li>` counts and detailed counts equal fixture membership;
- the K1 stage vector is exactly `3/4/3/1/4` and totals 15;
- the K3 checked set is exactly `in_review` and `blocked`, yielding WP10 and WP05 only;
- WP03 remains committed to `in_progress`/Doing even when its observed target is `for_review`;
- K4 carries the same commit record as K1 and introduces no second SHA;
- route-mode action rows have non-blank `href` and do not opt into selectable-button mode;
- tracker links remain independent of the primary Work Package route;
- K6 preserves five sections and five empty lists with no CTA;
- time/freshness strings are supplied opaque labels; no clock or threshold is evaluated;
- no renderer mutates the fixture or a prior projection; and
- no fixture field exists for unsupported title, reason, description, owner, due date, estimate,
  priority, percentage, mutation action, or transition history.
