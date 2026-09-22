# Implementation Plan: ADR Index Reconciliation and Coverage Gate

**Mission**: adr-index-reconciliation-and-gate-01M1TAA0
**Branch**: `mission/adr-index-reconciliation-and-gate`
**Base**: `train/elements-first` @ `15c4abf`
**Spec**: [spec.md](spec.md)
**Issue**: spec-kitty/spec-kitty-design#193

## Summary

Two hand-maintained ADR indexes have drifted from `docs/architecture/decisions/`. Reconcile both
against the directory, transcribing each record's own H1 title and `**Status:**` value; replace
the programme doc's hard-coded `ADR-8–13` enumeration with a pointer that cannot go stale; and
ship `scripts/check-adr-index.mjs`, wired into `ci-quality.yml`'s `lint-code` job, that fails when
either direction of the correspondence breaks or when the check would otherwise run over an empty
set.

## Technical Context

**Language/Runtime**: Node 22, ESM `.mjs`, no new dependencies. `yaml` (already a devDependency,
used by `check-release-graph.mjs` and `check-gate-wiring.mjs`) parses the workflow for the
wiring check.

**Existing pattern this follows**: `scripts/check-release-graph.mjs`. Specifically
`checkSubpathCoverage(componentDirs, exportKeys, pkgName)` — coverage derived from a directory
listing rather than a hand list, with an explicit `componentDirs.length === 0` floor that returns
a problem rather than an empty problem list. The whole file's design ("THE CHECKS ARE PURE
FUNCTIONS over a model, so `--selftest` can feed them synthetic failures … the probes are the
evidence") is the shape adopted here: exported pure functions returning arrays of problem
strings, a `main()` that reads the real tree, a `--selftest` that feeds each check a synthetic
defect, a probe-count floor, and a run-as-CLI guard so importing the module does not execute
`main()`.

**Sibling precedents consulted**: `check-gate-wiring.mjs` (fail-closed regex — "refusing to
certify its absence"; the job's absence is a failure, not a pass), `expected-docs.json`'s
`$comment` (the anti-vacuity half of a counting gate), `checkTarballsNonEmpty` ("refusing to
report green over an empty set").

**CI**: `.github/workflows/ci-quality.yml`. `lint-code` carries no `if:` and hangs off no
`changes` output, so it runs on every `pull_request` to `main` or `train/**` — including a
docs-only PR. It is in `gate.needs` and is tested **strictly** in the gate's failure disjunction
(`needs.lint-code.result != success`), so a failure there blocks the merge. No new workflow.

## Project Structure

### Files this mission changes

| Path | Change |
|---|---|
| `docs/architecture/README.md` | ADR table rebuilt: 8 rows → 15; identifiers unpadded; titles and Statuses transcribed from the records. Section preamble corrected (it currently says the directory holds "All Accepted decisions", which five Proposed records contradict). |
| `docs/architecture/elements-first-programme.md` | Line 5 only. The `ADR-8`…`ADR-14` enumeration becomes a pointer to the directory and the table. |
| `scripts/check-adr-index.mjs` | **New.** The gate. |
| `.github/workflows/ci-quality.yml` | Two steps in `lint-code`: the gate's `--selftest`, then the gate. |
| `CLAUDE.md`, `docs/contributing/*` | Only if they enumerate the gates a contributor must satisfy — checked, not assumed. |

### Files this mission must NOT change

- Anything under `docs/architecture/decisions/`. `git diff` over that path must be empty at the
  end. This is the mission's hard boundary: indexing a record is not ratifying it.
- `docs/architecture/elements-first-programme.md:98` — "ADRs 8–13 are committed", a true
  historical statement about O1.
- `docs/architecture/elements-first-run-prompt.md:163` — fixed by #194.

## Phase 0: Research — the measurement

Done before the spec was written; recorded in spec.md. Fifteen records, eight rows, seven records
unindexed (ADR-8, 9, 10, 11, 12, 13 and the ADR-003 addendum), zero stale rows. Every record's H1
and `**Status:**` field was read directly:

| File | H1 identifier | Status field, verbatim |
|---|---|---|
| `2026-05-01-1-token-distribution-format.md` | `ADR 1` | `Accepted` |
| `2026-05-01-2-monorepo-package-topology.md` | `ADR 2` | `Accepted` |
| `2026-05-01-3-token-schema-naming-convention.md` | `ADR 3` | `Accepted` |
| `ADR-003-addendum-token-values.md` | `ADR-003 addendum` | `Complete (pre-implementation gate FR-034 satisfied — WP01 delivered)` |
| `2026-05-01-4-org-layer-doctrine-distribution.md` | `ADR 4` | `Accepted` |
| `2026-05-01-5-npm-supply-chain-security-posture.md` | `ADR 5` | `Accepted` |
| `2026-05-01-6-storybook-multi-framework-rendering.md` | `ADR 6` | `Accepted` |
| `2026-05-01-7-storybook-version-10x-adoption.md` | `ADR 7` | `Accepted` |
| `2026-09-02-8-custom-elements-base-layer.md` | `ADR 8` | `Accepted (ratified by the operator, 2026-09-02)` |
| `2026-09-02-9-shadow-dom-and-styling-api.md` | `ADR 9` | `Proposed` |
| `2026-09-02-10-distribution-and-canonical-markup.md` | `ADR 10` | `Accepted (ratified by the operator, 2026-09-02)` |
| `2026-09-02-11-verification-stack-and-wrapper-generation.md` | `ADR 11` | `Proposed. …` (paragraph) |
| `2026-09-02-12-consumer-audit-of-record.md` | `ADR 12` | `Proposed` |
| `2026-09-02-13-storybook-web-components-builder.md` | `ADR 13` | `Proposed` |
| `2026-09-06-14-detached-probe-validation-seam.md` | `ADR 14` | `Proposed. Descriptive record only …` |

Nine Accepted, five Proposed, one Complete. No number is used twice; no two records contradict on
their face; nothing here is a fork requiring an operator decision. Two observations that are
**not** forks and are therefore recorded rather than fixed:

- ADR-4's H1 reads `Design System as Priivacy-ai Org Doctrine Source` — a typo in the record's own
  title. The table transcribes titles from the records, so it is transcribed verbatim rather than
  silently corrected; correcting it would be editing an ADR.
- `llms.txt` and `llms-full.txt` are a **third and fourth** ADR index, both also stale
  (`llms-full.txt` line 48 says "ADR-1 through ADR-13 + ADR-3 addendum"; `llms.txt` lists three
  records). Outside this mission's two named indexes — filed, not fixed.

## Phase 1: Design

### The table

Rows in reading order: ADR-1, ADR-2, ADR-3, **ADR-003 addendum** (placed with its parent record),
ADR-4 … ADR-14. Identifier per record's own H1, normalised to the `ADR-N` hyphen form the rest of
the repo uses (`# ADR 10` → `ADR-10`); the addendum keeps `ADR-003 addendum`, because that string
is what its H1 says. Title is the H1 text after the identifier prefix. Status is the leading token
of the `**Status:**` field.

### The programme line

Replaced with a statement of the rule plus a pointer to the directory and the table, and an
explicit instruction to read the Status column — which is what #194's ADR-14 annotation was
doing by hand for one record, generalised so it covers every record without naming any.

### The gate — `scripts/check-adr-index.mjs`

Pure functions, each returning `string[]` of problems:

| Function | Asserts | Empty-set floor |
|---|---|---|
| `parseAdrTable(readmeText)` | — (parser) | throws-free; returns `{ rows, sectionFound }` so the caller can distinguish "no section" from "no rows" |
| `parseRecord(text)` | — (parser) | returns `{ title: null, status: null }` rather than guessing |
| `checkIndexCoverage(files, rows)` | every file has a row; every row targets an existing file; no file has two rows | **`files.length === 0`** and **`rows.length === 0`** each return a problem |
| `checkStatusAgreement(rows, records)` | each row's Status equals its record's Status token | `records.length === 0` returns a problem |
| `checkGateIsWired(workflowText)` | `ci-quality.yml` still runs this script, and from a job the `gate` job strictly requires | a workflow with no such step is a problem; an unparseable workflow is a problem |

`main()` reads `docs/architecture/decisions/`, `docs/architecture/README.md` and
`.github/workflows/ci-quality.yml`, prints the counts it examined, and exits 1 with a
`- <problem>` list on any problem. `--selftest` runs a probe per defect class and exits 1 if any
probe fails to trip **or** if the probe list falls under its floor.

Deliberately **not** asserted: row titles and row identifiers. A title is editorial and an
identifier form is stylistic; asserting either would red the gate on a harmless edit, which is how
gates get disabled. Status **is** asserted, because that is the field whose drift would let an
index promote a record the operator has not ratified — the exact boundary this mission is told not
to cross.

### Wiring

Two steps in `lint-code`, adjacent to the other self-checking gates
(`check-story-theme-wrapper.mjs --selftest` / `check-story-theme-wrapper.mjs`,
`check-gate-wiring.mjs`), placed before `commitlint`:

```yaml
- name: "[ENFORCED] ADR index gate self-test (#193)"
  run: node scripts/check-adr-index.mjs --selftest
- name: "[ENFORCED] Every ADR is in the index, and every index row is an ADR (#193)"
  run: node scripts/check-adr-index.mjs
```

`lint-code` is unconditional, so this runs on a docs-only PR. `checkGateIsWired` closes the
inverse: a later PR deleting the step reds the gate that the step runs — so it must be deleted
deliberately, in the same commit as the script, rather than quietly.

## Phase 2: Implementation

One work package. The change is small, single-purpose and interlocking (the gate asserts the
table the same commit rewrites), and splitting it would produce a commit whose CI is red by
construction.

## Success Criteria Validation

| SC | How it is checked |
|---|---|
| SC-001 | `node scripts/check-adr-index.mjs` prints `15 record(s), 15 row(s)` |
| SC-002 | `git diff origin/train/elements-first -- docs/architecture/decisions/` is empty |
| SC-003 | exit 0 on the reconciled tree |
| SC-004 | `--selftest` green, floor asserted |
| SC-005 | two deliberate breakages, output recorded verbatim in the mission evidence |
| SC-006 | the PR's own CI run shows `lint-code` executed, not skipped |
| SC-007 | `npx commitlint --from origin/train/elements-first --to HEAD` |

## Charter Check

- `architectural_review_requirement`: this mission makes that requirement satisfiable from the
  index for the first time since ADR-8. It decides nothing architectural, so it needs no ADR and
  no ADR amendment.
- Adversarial-squad cadence: one pre-merge self-review pass, recorded as a governed Op via
  `spec-kitty dispatch`.

## Risks & Dependencies

- **R1 — the gate's table parser is too strict and reds on a legitimate README edit.** Mitigated
  by scoping the parse to the `## Decisions (ADRs)` section and by asserting only link target and
  Status, never prose. A missing section fails closed with a message saying so.
- **R2 — the Status assertion fights a future ratification PR.** By design: ratifying a record and
  leaving the index saying `Proposed` is drift. The fix is one table cell in the same commit.
- **R3 — the gate never runs.** Two mitigations, one static (`checkGateIsWired`), one empirical
  (SC-006, read off this PR's own run).
- **R4 — a PR based on the wrong branch runs zero gates.** The PR bases on `train/elements-first`;
  `ci-quality.yml` filters `pull_request` to `[main, 'train/**']`.
