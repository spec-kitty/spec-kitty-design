# Implementation Plan: The LLM Surfaces Point at the ADR Index, and Are Gated

**Mission**: llms-surfaces-point-at-the-adr-index-and-are-gated-01M1V4PV
**Branch**: `mission/llms-adr-index-pointer-and-gate`
**Base**: `train/elements-first` @ `65a92f6`
**Spec**: [spec.md](spec.md)
**Issue**: spec-kitty/spec-kitty-design#197

## Summary

`llms.txt` and `llms-full.txt` are a third and fourth hand-maintained ADR index. Per the
operator's ruling on #197, both stop restating the set and point at `docs/architecture/README.md`'s
table, which #193 made authoritative and gated. `llms.txt` drops its three record links and its
false "All Accepted" description. `llms-full.txt` keeps its per-record prose — that content is the
file's purpose — but its directory-map range, its two reading-order ranges and its set-wide
`Status … is Accepted` claim are replaced by the pointer, and the summary set is completed with
ADR-14 so the file references all fifteen records rather than fourteen. `scripts/
check-llms-adr-surface.mjs` then holds both files to that shape, wired as an `[ENFORCED]` step of
`ci-quality.yml`'s `lint-code` job and registered in `check-gate-wiring.mjs`'s `REQUIRED_LINT`.

## Technical Context

**Language/Runtime**: Node 22, ESM `.mjs`, no new dependencies.

**Existing pattern this follows**: `scripts/check-adr-index.mjs` (#193), itself modelled on
`scripts/check-release-graph.mjs`. Adopted wholesale: exported pure functions returning arrays of
problem strings; a `main()` that reads the real tree; a `--selftest` whose probes each declare the
message they expect; probe-count floors; a run-as-CLI guard so importing the module for its checks
does not execute `main()`.

**The one thing carried over deliberately**: #193's mutation sweep found four guards deletable
while `--selftest` still printed a tick, because a probe was satisfied by *any* problem and a
neighbouring check tripped on the same synthetic input. The fix — `probe.expect`, a substring of
the problem that probe is supposed to provoke — is reproduced here, and every probe input is
narrowed so it provokes its own check as directly as it can. A probe table that cannot tell which
check fired is a smoke test wearing a probe table's clothes.

**CI**: `.github/workflows/ci-quality.yml`. `lint-code` carries no `if:` and hangs off no `changes`
output, so it runs on every `pull_request` to `main` or `train/**`, a docs-only PR included. It is
in `gate.needs` and is tested strictly in the gate's failure disjunction. No new workflow. That
`lint-code` actually ran is confirmed from the **job API** on this PR, not from reading the filter.

## Project Structure

### Files this mission changes

| Path | Change |
|---|---|
| `llms.txt` | The `ADR directory` entry becomes an `ADR index` pointer; the three `ADR-00N` record links are deleted. Nothing else in the file moves. |
| `llms-full.txt` | Directory-map ADR range removed; §2 preamble replaced by the pointer; the two reading-order ranges rewritten to keep their substance; an ADR-14 summary added so the referenced set equals the directory. |
| `scripts/check-llms-adr-surface.mjs` | **New.** The gate. |
| `scripts/check-gate-wiring.mjs` | Two `REQUIRED_LINT` entries — the gate and its probe table — in the two-entry shape #129 and #193 used. |
| `.github/workflows/ci-quality.yml` | Two `[ENFORCED]` steps in `lint-code`, next to the #193 pair. |

### Files this mission must NOT change

- Anything under `docs/architecture/decisions/`. Asserted by tree hash, not by `git diff` over a
  path — a path typo makes `git diff` exit 0 and prove nothing.
  `git rev-parse <ref>:docs/architecture/decisions` must be `038374d6…` on both sides.
- `docs/architecture/README.md` and `scripts/check-adr-index.mjs`. #193 owns both; both are gated.

## Phase 0: Research — the measurement

Taken independently on this tree before any edit, by extracting
`docs/architecture/decisions/<file>.md` occurrences from each surface and diffing against the
directory listing:

```
$ ls -1 docs/architecture/decisions/*.md | wc -l
15
$ grep -o 'docs/architecture/decisions/[A-Za-z0-9._-]*\.md' llms.txt | sort -u | wc -l
3
$ grep -o 'docs/architecture/decisions/[A-Za-z0-9._-]*\.md' llms-full.txt | sort -u | wc -l
14
```

The one record `llms-full.txt` does not reference is
`2026-09-06-14-detached-probe-validation-seam.md`, added by #194 four days ago. Statuses on disk:
nine `Accepted`, five `Proposed`, one `Complete`.

Index-shaped claims found, by line:

| Line | Text | Class |
|---|---|---|
| `llms.txt:27` | `All Accepted architectural decision records.` | set-wide status claim |
| `llms.txt:28-30` | three `ADR-00N` record links | partial link list |
| `llms-full.txt:48` | `decisions/    # ADRs (ADR-1 through ADR-13 + ADR-3 addendum)` | range |
| `llms-full.txt:81` | `ADR-1 through ADR-7 are the original design` | range |
| `llms-full.txt:83` | `ADR-8 through ADR-13 are the elements-first architecture` | range |
| `llms-full.txt:89-90` | `Status of every ADR below is **Accepted**.` | set-wide status claim |

The last row is not in #197's list. It is the most misleading of the six: it does not omit
records, it reports a ratification that did not happen for six of them.

Prose that names records without enumerating the set, and therefore stays: `llms-full.txt:17`
(`custom element (ADR-8)`), `:44` (`web-components renderer, ADR-13`), `:52` (`behaviour id
registry (ADR-11) — 15 ids, 14 applicable` — a count of behaviour ids, not ADRs), `:73-74`
(CLAUDE.md "points at the ADRs (ADR-001 token-only CSS, …)"), `:193-197` (the ADR-6/ADR-7
supersession note), and every `(ADR-N)` citation in §§3-9.

## Phase 1: Design

### The gate's model

Three inputs, all parsed before any check runs, so every check is a pure function:

- `records` — the sorted `.md` basenames in `docs/architecture/decisions/`, classified the way
  `check-adr-index.mjs` classifies them (non-markdown entries are assets; a non-empty subdirectory
  is a refusal, because this gate reads the top level only).
- `surfaces` — for each of `llms.txt` and `llms-full.txt`, its text split into lines.
- `patterns` — two named pattern sets, `RANGE_PATTERNS` and `CARDINALITY_PATTERNS`, each entry a
  `{ name, re }` so a problem message can say which pattern fired.

### The checks

| Function | Asserts | FR |
|---|---|---|
| `extractRecordRefs(lines)` | pure extractor: every `docs/architecture/decisions/<file>.md` occurrence, with its line number. Backticked, bare and markdown-linked forms all count; a path is only seen when contiguous on one line. | — |
| `checkRefSet(name, refs, records)` | the referenced set is **empty or exactly the directory**. A subset names every record it misses. A reference to a file not on disk is refused separately. | FR-007, FR-012 |
| `checkNoRanges(name, lines, patterns)` | no ADR range expression, quoting the line and naming the pattern | FR-008 |
| `checkNoCardinality(name, lines, patterns)` | no set-wide ADR count or status claim, quoting the line | FR-009 |
| `checkPointer(name, lines)` | at least one line names `docs/architecture/README.md`, names an ADR, and marks it authoritative | FR-010 |

### Why the pointer is a three-token conjunction rather than a fixed sentence

A fixed required sentence is a magic string: any rewording reds the gate and the next person
deletes the check. A bare `README.md` mention is too weak — `llms.txt:25` already links the
architecture index for a different reason and would satisfy it. So the pointer must be one line
carrying all three of: the path `docs/architecture/README.md`, the token `ADR`, and the word
`authoritative`. The failure message states all three, so the fix is obvious without reading the
source. This is asserted by a negative probe (a README mention that is not a pointer must NOT
satisfy the check) as well as a positive one.

### Why the range patterns are shaped the way they are

The hard case is the title dash. `llms-full.txt`'s headings read `### ADR-7 — Storybook 10.x
Adoption (Angular 21 Compatibility)`; a naive `ADR-\d+\s*[–—-]\s*\d+` matches that heading via
`ADR-7 — 10`. A gate that reds on a heading is a gate someone deletes. So the sets are:

- `word-range`: `ADR-N through|thru|to|.. [ADR-]M` — a word separator is unambiguous, and the
  second operand may be bare.
- `dash-range-both-sides`: `ADR-N <dash> ADR-M` — both operands ADR-prefixed, spacing free.
- `plural-numeric-range`: `ADRs N <dash> M` — the `ADRs 8–13` form.
- `tight-dash-range`: `ADR-N<dash>M` with **no whitespace** around the dash — the `ADR-8–13` form.
  Whitespace is what separates it from a title dash, and both cases get probes.

### Empty-set floors (FR-011)

Every one of these is a failure, not a pass, and every one has its own probe with its own expected
message:

1. zero records discovered in `docs/architecture/decisions/`;
2. the decisions directory missing entirely (refused in `main`, before any check);
3. a surface file missing from disk (refused in `main`, before any check);
4. `SURFACE_FILES` empty — the gate would check nothing and print green;
5. `RANGE_PATTERNS` or `CARDINALITY_PATTERNS` empty — the gate would find no defects in anything;
6. a surface that parsed to zero lines.

Floors 4 and 5 are the ones #193's sweep would have caught late: a pattern list that silently
emptied prints a tick over every file.

### Wiring

Two `[ENFORCED]` steps in `lint-code`, immediately after #193's pair, and two `REQUIRED_LINT`
entries, whole-command matched so `check-llms-adr-surface.mjs` as a substring of the `--selftest`
line cannot satisfy the bare entry:

```
[/node\s+scripts\/check-llms-adr-surface\.mjs(?!\s*--selftest)(\s|$)/, …]
[/node\s+scripts\/check-llms-adr-surface\.mjs\s+--selftest(\s|$)/, …]
```

## Phase 2: The edits

### `llms.txt`

Replace the `ADR directory` line with an `ADR index` pointer naming
`docs/architecture/README.md#decisions-adrs`, stating that the table is the authoritative index,
that each row's Status is transcribed from the record, that `check-adr-index.mjs` holds it to the
directory, and that individual records are deliberately not listed here. Delete lines 28-30.

### `llms-full.txt`

1. `:48` — `decisions/    # architectural decision records; the index is in docs/architecture/README.md`.
2. `:81-87` — the reading-order note keeps every substantive claim (the earlier records name
   Angular as written; the later ones are the elements-first architecture the repo runs on; where
   two disagree the later wins; nothing in this repo targets Angular, `packages/angular` was
   deleted in #102) and states the split by naming the two groups rather than by numeric range.
3. `:89-90` — replaced by the pointer: the table in `docs/architecture/README.md` is the
   authoritative ADR index and carries each record's own Status; the summaries below do not report
   status and are not an index.
4. A `### ADR-14 — The Detached-Probe Validation Seam` summary is added after ADR-13, in the shape
   of its siblings: record path, decision, why. Its content is transcribed from the record — the
   detached probe, the `willUpdate()` timing problem it closes, the type-before-value ordering
   rule, and that the record is descriptive and leaves three questions open. **No position is
   taken on those three open questions**; summarising a `Proposed` record is not ratifying it.

## Phase 3: Proving it fails

Each defect is reintroduced alone, the gate is run, and the output is recorded verbatim:

| # | Defect | Expected message fragment |
|---|---|---|
| 1 | `ADR-1 through ADR-13` re-added to `llms-full.txt` | `carries an ADR range expression` |
| 2 | one record reference deleted from `llms-full.txt` | `references 14 of 15` … `empty or complete` |
| 3 | the pointer line deleted from `llms.txt` | `carries no pointer to the authoritative ADR index` |
| 4 | `All Accepted architectural decision records` restored to `llms.txt` | `carries a set-wide ADR claim` |
| 5 | the gate's CI step deleted from `ci-quality.yml` | `the \`lint-code\` job never runs the LLM ADR-surface gate` |

Plus `--selftest`, which exercises every floor without touching the filesystem.

## Complexity Tracking

One new script, two new CI steps, two registry entries, two edited docs. No new dependency, no new
workflow, no generated artifact. The only judgement call is the range-pattern set's tolerance for
title dashes, and it is probed in both directions.

## Risks

| Risk | Mitigation |
|---|---|
| The gate reds on legitimate prose naming an ADR | Negative probes for the title dash, for `(ADR-8)` citations, for `ADR-6 and ADR-7`, and for the `15 ids, 14 applicable` behaviour count. |
| Completing `llms-full.txt`'s summary set makes every future ADR owe a summary | That is the point, and it is now a CI failure rather than four days of silent rot. The empty branch stays available if the operator later prefers §2 deleted. |
| A future prose rewrite loses the pointer's `authoritative` token | The gate reds and says which three tokens the line must carry. |
| Line-wrapping a record path across two lines silently drops it from the set | The gate reds with the incomplete-set message; the mission keeps every record path on one line. |
