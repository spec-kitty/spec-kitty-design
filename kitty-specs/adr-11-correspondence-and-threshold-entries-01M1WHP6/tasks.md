# Tasks: ADR-11 correspondence and threshold entries

**Mission**: `adr-11-correspondence-and-threshold-entries-01M1WHP6`
**Branch / merge target**: `mission/adr-11-correspondence-and-threshold-entries` → `train/elements-first`

Four work packages, one implementer, no parallelism. WP01 and WP02 are independent; WP03 records
the amendment once both entries exist; WP04 is independent of all three except for the test count
it records.

| WP | Title | Requirements | Depends on |
|---|---|---|---|
| WP01 | SC-016 — delegate/rendered-control correspondence | FR-001, FR-003, FR-004, NFR-001 | — |
| WP02 | SC-017 — the responsive threshold | FR-002, FR-003, FR-004, NFR-002 | — |
| WP03 | The amendment, its authorization, and the records that pointed at the gap | FR-005, C-002, C-003 | WP01, WP02 |
| WP04 | `ceilingSeconds`, raised on measured growth | FR-006, NFR-003, C-001 | — |

## Phase 1 — the two entries

- **WP01** — mint SC-016 from ADR-14's three measured bugs; register, pin, test, mutate.
- **WP02** — mint SC-017 from #182's two drop blocks; register, pin, test, mutate twice.

## Phase 2 — the record

- **WP03** — ADR-11's amendment section and item list; ADR-14's stale Negative consequence.

## Phase 3 — the budget

- **WP04** — raise `ceilingSeconds`, record the three measurements, the arithmetic, the headroom
  and the test count. `selftestCeilingSeconds` untouched.
