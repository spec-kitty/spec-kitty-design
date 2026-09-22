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

### Phase 1 — the two entries

## WP01 — SC-016, delegate/rendered-control correspondence

Mint SC-016 from ADR-14's three measured bugs; register it, pin it in `config-contract`, test it
against the rendered control, and prove it with a re-keyed red-first arm. No existing arm gains
`expectCollateral`.

- T001 — the correspondence test, four intended states, `badInput` excluded with the reason stated
- T002 — dual-mark the existing probe-ordering test `[SC-003][SC-016]`
- T003 — `behaviours.json` + `tests/node/config-contract.test.ts`
- T004 — re-key the type-before-value arm to SC-016; re-site the SC-013 arm onto `inputmode`

## WP02 — SC-017, the responsive threshold

Mint SC-017 from #182's two drop blocks; mark the sheet-reading test, add a live arm at the lane
viewport driven by the attribute rather than the property, and prove it with one mutation per
threshold against the generated stylesheet.

- T001 — mark and extend `sticky is declared on the host and dropped at both documented thresholds`
- T002 — `behaviours.json` + `tests/node/config-contract.test.ts`
- T003 — two arms, width and height, against `sk-page-header.css.js`

### Phase 2 — the record

## WP03 — the amendment, its authorization, and the records that pointed at the gap

- T001 — ADR-11 items 10 and 11
- T002 — the authorization subsection, citing the #196/#204 ruling by name
- T003 — ADR-14's now-stale Negative consequence, corrected and named as a correction

### Phase 3 — the budget

## WP04 — `ceilingSeconds`, raised on measured growth

- T001 — the raise and its arithmetic
- T002 — the three measurements, the straddle, the test count, the headroom.
  `selftestCeilingSeconds` untouched.
