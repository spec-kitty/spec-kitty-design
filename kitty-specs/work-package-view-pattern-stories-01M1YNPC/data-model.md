# Data model: Work Package view pattern fixture

All types are Storybook-only and deeply readonly. They model display input, not a Team Kitty API.

```ts
type LaneId = string;
type WorkPackageId = string;

type ClaimFixture = Readonly<{
  classification: 'live' | 'stale';
  actorLabel: string;
  timeLabel: string;
  advisory: string;
}>;

type SubtaskFixture = Readonly<{
  id: string;
  label: string;
  state: 'complete' | 'pending';
}>;

type HistoryEventFixture = Readonly<{
  id: string;
  summary: string;
  actorLabel: string;
  timeLabel: string;
  datetime: string;
  trustLabel?: string;
  supporting?: string;
}>;

type WorkPackageFixture = Readonly<{
  id: WorkPackageId;
  reference: string;
  title: string;
  laneId: LaneId;
  tags: ReadonlyArray<string>;
  marker: Readonly<{ label: string; text: string }>;
  claim?: ClaimFixture;
  subtasks: ReadonlyArray<SubtaskFixture>;
  prompt?: TemplateResult;
  facts: ReadonlyArray<Readonly<{ term: string; value: string }>>;
  history: ReadonlyArray<HistoryEventFixture>;
}>;

type WorkPackageViewFixture = Readonly<{
  repositoryLabel: string;
  missionLabel: string;
  lanes: ReadonlyArray<Readonly<{ id: LaneId; label: string }>>;
  workPackages: ReadonlyArray<WorkPackageFixture>;
  selectedWorkPackageId: WorkPackageId;
  snapshotMessage?: Readonly<{ text: string; announce: 'polite' | 'assertive' }>;
  retentionMessage?: Readonly<{ text: string; announce: 'polite' | 'assertive' }>;
}>;
```

## Derived projections

`deriveOverview(fixture, { visibleLaneId, selectedWorkPackageId, empty, scale })` returns the lane
records with their item arrays and derived counts, plus `completed`, `total`, `percentage`, and the
controlled selection/visible-lane values. Percentage is `0` when total is zero; otherwise
`Math.round(completed / total * 100)`.

`deriveDetail(workPackage, { noSubtasks, absentPrompt, historyUnavailable, longContent })` returns
the same ordered data with availability substitutions and `completedSubtasks`/`totalSubtasks`
derived from its subtask array.

## Invariants

- every Work Package id and every DOM id derived from it is unique;
- every Work Package belongs to exactly one declared lane;
- the `done` lane is the sole completed source for overview progress;
- lane counts equal their projected item-array lengths;
- checklist totals equal the selected Work Package's projected subtask array;
- claim classification and all time/trust strings are supplied, never derived;
- events remain in fixture order;
- renderers do not mutate either fixture or projections;
- controlled selection changes only through a new render input;
- prompt content is already-renderable trusted story input, never a Markdown string to parse;
- empty and unavailable states contain no fabricated fallback domain values.
