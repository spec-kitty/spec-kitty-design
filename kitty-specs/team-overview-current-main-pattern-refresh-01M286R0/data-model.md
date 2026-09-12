# Data model: Team Overview current-main pattern refresh

All source records and returned projections are deeply readonly. Projections read no clock, DOM,
network, router, store, locale service, permission service, or clipboard API.

## Populated overview input

- Team identity and supplied Overview/Work/Connectors/Members routes.
- Retention input: supplied hour count, title/description copy, and ordered day cells.
- TeamMoment rows: stable ID, supplied observed label, activity copy, repository fact, optional
  supplied in-flight Mission reference/route, and display metadata.
- Admitted repository rows: supplied repository identity/route, branch, short SHA, pushed label,
  and factual status copy.
- Shell/navigation/freshness/empty/accessibility copy.

## Populated overview projection

- Velocity total is the sum of supplied cell counts; labels use supplied retention copy.
- In-flight Missions are stable-order distinct by supplied Mission ID and capped at two.
- Recent activity is stable-order source data capped at six and remains passive.
- Repository facts are copied as local facts; observed freshness decorates TeamMoment regions only.
- Unsafe or unauthorized routes fail closed before rendering.

## First-run response input

Exactly six deeply frozen records: administrator install, joined, administrator repository,
administrator Mission, member repository, and private installation. Each supplies role, privacy,
`canManage`, completed/current step IDs, ordered steps, commands, routes, and all visible/a11y copy.

## First-run projection

- Preserve completed/current/future order and state exactly as supplied.
- Admission is visible only when the supplied response authorizes it.
- Members is visible only when the supplied response authorizes it; private installation excludes it.
- Commands remain opaque strings passed to public `sk-copy-field` with supplied result messages.
- The review selector changes only which immutable response is displayed; it is not a product API.

## Invariants

1. Source data cannot be mutated; projection is deterministic and frozen.
2. Retention is parameterized and a non-72-hour fixture changes dependent values.
3. Mission and activity caps are applied without changing source records.
4. Activity has no link/button semantics.
5. Only supplied safe routes appear, and unauthorized labels/routes are absent from hidden/focus/a11y
   surfaces.
6. Every rendered string comes from a fixture copy record.
