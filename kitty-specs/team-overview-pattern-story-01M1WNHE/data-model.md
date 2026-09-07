# Data model: Team overview pattern story

All records are deeply readonly fixture data. Selectors return new readonly projections and do not
read the clock, DOM, network, router, or application store.

## TeamOverviewFixture

- `team`: name, repository identity, synchronization label.
- `shell`: primary navigation, context navigation, one account identity, logout, header copy.
- `delivery`: total investment, unattributed investment, completion/deployment/outcome counts,
  quiet annotations, ordered time buckets, and coverage mode.
- `flow`: fixed columns, ordered transition routes/cells/tones/groups, and current status counts.
- `operational`: ordered section definitions and stable event records.

## Delivery projection

- `attributed = totalInvestment - unattributed`
- `attributionPercent = Math.round(attributed / totalInvestment * 100)`
- `bucketTotal = sum(timeBuckets.value)`
- `coverageLabel`: absent only when full coverage is valid; explicit for partial coverage
- `evidenceStages`: 1,840 → 42 WPs → 6 missions → 2 verified
- `barSeries`: stable ID, literal label, numeric value, formatted display string

Invalid totals fail closed during selector assertion; they never generate `NaN`, negative
attribution, or a false percentage.

## Flow projection

- `moveTotal = sum(all route cells)`
- `openTotal = sum(status counts)`
- `legendTones = ordered unique tones actually used by routes`
- `columns`: literal `Tue 1`, `Wed 2`, `Thu 3`, `Today · Fri 4`
- `routes`: stable route ID, exact `A → B` label, tone, group, and four non-negative cells

`moveTotal` and `openTotal` have no shared calculation path.

## Operational event

- stable `id`
- section membership
- marker initials/label
- title/name
- lowercase monospace repository or commit reference
- ordered status/tag records
- literal timestamp
- optional control
- optional `repeatReason` when the same underlying event intentionally appears in two sections

Rendered row order is marker → title → reference → tags → metadata → controls. Accidental
byte-identical cross-section duplicates are invalid.

## Controlled story state

- `selectedRowId?: string`
- `selectedBarId?: string`
- `selectedRouteId?: string`
- `onRowActivate`, `onBarSelect`, `onRouteSelect`: Storybook spies

Events do not mutate these values. Only Storybook args or an explicit consumer rerender changes a
selected projection.

## Invariants

1. Fixture and nested arrays/records cannot be mutated.
2. Every displayed repeated number is selector-derived.
3. Full bucket coverage equals attributed investment exactly.
4. Route cells total 62; status counts independently total 50.
5. Exactly one account identity is rendered above logout.
6. Only present route tones appear in the legend.
7. Amber maps to at most two documented meanings.
8. No warning gains link semantics without a target.
9. No Team Kitty or runtime-time dependency exists.

