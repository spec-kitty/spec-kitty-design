# Tasks: markup-vocabulary-import-and-ratchet-corrections

**Input**: `plan.md`, `spec.md`
**Branch**: `mission/markup-vocabulary-import-and-ratchet-corrections` (planning base **and** merge
target — `single_branch` topology; the PR onto `train/elements-first` is the operator's step, not
this loop's).

Three approved follow-up issues. #216 is a generator contract change plus the conversion that
proves it; #219 and #220 are record corrections on disjoint files.

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | `status-tones.ts` — the tone vocabulary as a leaf module, re-exported unchanged from `sk-status-indicator.ts` (FR-004) | WP01 | |
| T002 | `build-element-markup.mjs` evaluates each `*.markup.ts` from `pathToFileURL(src)`, with `registerHooks` resolve/load so the repo's `.js`-over-`.ts` convention resolves and esbuild stays the transformer (FR-001, FR-002, C-003) | WP01 | |
| T003 | The leaf-module error is replaced by a named unresolved-import failure, demonstrated red-first on a scratch module (FR-003, NFR-001) | WP01 | |
| T004 | `sk-card.markup.ts` imports `STATUS_TONES` and derives `CARD_STATUSES`; `CardStatus` stays a union (FR-005) | WP01 | |
| T005 | The order-sensitive parity test is removed; the BEM-family assertion is kept standing alone (FR-006) | WP01 | |
| T006 | `sk-notice` verified against the same standard and the result recorded (FR-007) | WP01 | |
| T007 | Regenerate every markup artifact cache-free; prove byte-identity and `--check` green; confirm whether the `build-vue-types.mjs` half remains (FR-008, NFR-001, NFR-002) | WP01 | |
| T008 | `expected-stories.json` opts in `components-card--statuses-greyscale`, `total` 160 → 161 (FR-009, NFR-004) | WP02 | [P] |
| T009 | The `$comment` states the ratchet's scope now, and the principle that a cited story is ratcheted in the commit that cites it (FR-010) | WP02 | [P] |
| T010 | `docs/contributing/adding-a-token.md`'s category table matches the catalogue's prefix binning, and the pairing convention is explained (FR-011, NFR-003) | WP03 | [P] |

T001–T007 are sequential: T004 cannot compile until T001 and T002 exist, T005 follows T004, and
T007 is the proof for all of them. T008–T010 touch disjoint files and carry `[P]`.

## Work Packages

### WP01 — One authored vocabulary, imported

- **Goal**: close #216 — a `*.markup.ts` evaluates from a real module URL, so `sk-card` consumes
  `STATUS_TONES` instead of restating it, and the assertion that held the copy honest goes.
- **Priority**: P0 — the generator produces committed artifacts for every element.
- **Independent test**: `node scripts/build-element-markup.mjs` regenerated cache-free leaves
  `git status --short packages/styles` empty; `--check` exits 0; `npm test` green.
- **Included subtasks**: T001–T007.
- **Dependencies**: none.
- **Risks**: a loader hook with too wide a reach; byte-identity asserted from cache. Both are
  addressed in `plan.md` §6.

### WP02 — The cited story is ratcheted

- **Goal**: close #219 for the story #177 named as acceptance evidence, and write the principle
  into the file so the next mission does not re-derive it.
- **Priority**: P1.
- **Independent test**: the built Storybook index contains `components-card--statuses-greyscale`;
  `total` equals the flattened list length.
- **Included subtasks**: T008, T009.
- **Dependencies**: none.
- **Risks**: widening the ratchet past cited evidence — bounded by the sweep in `plan.md` §1.

### WP03 — The guide and the catalogue agree

- **Goal**: close #220 in the doc, leaving the published artifact's shape untouched.
- **Priority**: P2.
- **Independent test**: every prefix row in the guide's table names the category the generated
  catalogue assigns that prefix to; `token-catalogue.json` unchanged.
- **Included subtasks**: T010.
- **Dependencies**: none.
- **Risks**: none beyond the scope boundary — binning by pair is the operator's call, not this
  mission's.
