# Data Model: Release pipeline develop-line governance (REL1, #362)

Phase 1 output, **revised** after the post-plan squad's B1/B2/M6/M10 findings. This mission has no
application data model — it is CI/governance tooling — but the promotion algorithm's decision
shape, the commit-message format, the merge-readiness function, and the ruleset artifact are all
structured enough to fix before implementation.

## PromotionDecision

**Revised**: a sixth outcome, `refuse-diverged` (B1/FR-007(d)), and a `divergence` field carrying
why, when relevant.

| Field | Type | Meaning |
|---|---|---|
| `outcome` | `'no-op-missing-develop' \| 'no-op-in-sync' \| 'reuse-existing-pr' \| 'supersede-and-open' \| 'open-new' \| 'refuse-diverged'` | Which branch applied (plan.md's Promotion algorithm). |
| `trainSha` | string (40-hex) or `null` | The train tip this decision was computed against (via `git ls-remote`/`readRefTip` against `PROMOTE_SOURCE_REF`, never `github.sha` — research.md R18). `null` only for `no-op-missing-develop`. |
| `trainTree` | string (40-hex) or `null` | `train^{tree}` at `trainSha`. |
| `developSha` | string (40-hex) or `null` | `develop`'s tip at decision time. `null` when `develop` does not exist (confirmed absent via a prior remote check — research.md R19 — never merely "did not resolve locally"). |
| `developTree` | string (40-hex) or `null` | `develop^{tree}` at `developSha`. |
| `developHealthy` | `boolean \| null` | `null` when `developSha` is `null` (no health to assess). Otherwise the result of the health check (below) — `false` is what produces `refuse-diverged`. |
| `divergence` | `{ reason: string, developSha: string, checkedAgainst: 'train-first-parent' \| 'promotion-trailer' } \| null` | Populated only for `refuse-diverged` — human-readable reason plus which of the two health-check branches (research.md R12) failed, for the step-summary message (FR-010). |
| `existingPr` | `{ number, headSha, headTree, branch, createdAt } \| null` | An open `base:develop`, `promote/*`-headed PR, found via `findPromotionPRs` (research.md R21) — never `gh pr list --head`, which is an exact match, not a prefix search. |
| `commitMessage` | string or `null` | Built only for `supersede-and-open` / `open-new` (`PromotionCommitMessage`, below). |
| `branchName` | string or `null` | `promote/<trainSha>` for the two "open" outcomes. |

**`developHealthy` check** (`isDevelopHealthy(developSha, trainFirstParentShas, trailerLookup)`,
pure function, research.md R12): healthy iff `developSha` is in `trainFirstParentShas` (the
branch-cut commit or a later re-cut point), **or** `trailerLookup(developSha)` returns a
`Train-SHA` value whose corresponding train commit's tree equals `developSha`'s own tree. Anything
else is unhealthy — `refuse-diverged`, never merged over, never force-pushed.

**Invariant, unchanged**: exactly one `outcome` value is ever returned, and fields not meaningful
for that outcome are `null`.

## PromotionCommitMessage

**Revised** (B2 — the previous format's body line was 106 characters, over
`body-max-line-length`'s 100-character ceiling, `@commitlint/config-conventional`'s default,
confirmed 2026-09-11). The full SHA moves to a trailer.

| Part | Value | Constraint |
|---|---|---|
| type | `chore` | Member of `type-enum` (`@commitlint/config-conventional` default). |
| scope | `release` | Member of the project's `scope-enum` (`commitlint.config.cjs`). |
| subject | `` promote `<trainSha short 7>` to develop `` | Lowercase; header 43 chars, well under 100. |
| body | `Tree-sync promotion from train/elements-first.` | Fixed sentence, 48 chars — no variable-length data, so it cannot regress past the 100-char ceiling as the previous, SHA-embedding version did. |
| trailer | `Train-SHA: <trainSha full 40 hex>` | Read back by `isDevelopHealthy`'s trailer-lookup branch (above); 51 chars, checked against `body-max-line-length` like any other line, not assumed exempt. |

Full example:

```
chore(release): promote a1b2c3d to develop

Tree-sync promotion from train/elements-first.

Train-SHA: a1b2c3d4e5f6789012345678901234567890abcd
```

`buildCommitMessage(sha)` is a pure function; its `--selftest` probe (contracts/promotion-script
.contract.md probe 8) reaches `@commitlint/lint`/`@commitlint/load` via a **dynamic** `import()`
inside the selftest path only — `run` mode's module graph never depends on `@commitlint/*`
(research.md R13).

## MergeReadiness

**New entity** (B4/M4), the pure function `assessMergeReadiness({ mergeable, mergeStateStatus })`
that decides whether to attempt a merge, keep polling, or re-check divergence. Backed by GitHub's
own documented GraphQL `MergeStateStatus` enum (research.md R3, verified via live schema
introspection, 2026-09-11 — not the informally-documented REST `mergeable_state` string the first
revision proposed).

| `mergeable` | `mergeStateStatus` | Action | Why |
|---|---|---|
| `null` | (any) | `poll-again` | GitHub has not finished computing mergeability. |
| `true` | `CLEAN` or `HAS_HOOKS` | `attempt-merge` | "Mergeable and passing commit status." |
| `true` | `UNSTABLE` | `attempt-merge` | "Mergeable with non-passing commit status" — justified because the only checks that can be non-passing here are the redundant, non-required `ci-quality.yml` run (research.md R15); the ruleset itself requires nothing this state reflects. |
| `true` | `BLOCKED` | `poll-again` | A required rule (`code_scanning`) has not yet cleared. |
| `true` | `UNKNOWN` | `poll-again` | GitHub is still evaluating. |
| `true` | `BEHIND` | `recheck-divergence` | "The head ref is out of date" — in this shape, signals `develop` moved since the PR's commit was parented; re-run the divergence health check (`developHealthy`, above) rather than blindly re-polling. |
| `false` or `true` | `DIRTY` | `fail-anomaly` | Should be unreachable by construction (the promotion commit's parent is `develop`'s tip at creation time); if seen, exit non-zero with the raw state logged rather than retry blindly. |

`assessMergeReadiness` is probed for all seven named states plus the `mergeable: null` case (eight
probes total), each asserting the specific returned action — not just "did not crash."

## DevelopRulesetArtifact

**Revised comparison scope** (M10): `diffRulesetParity(live, artifact)` compares **every**
parameter at every nesting level, not only a curated subset — the table below is the *documentation*
of the two named, intentional differences; the function itself diffs the full structures and
reports every mismatch, ignoring only the fields GitHub's API adds to a *response* that never
appear in a POST/PATCH *body*: `id`, `node_id`, `_links`, `current_user_can_bypass`, `created_at`,
`updated_at`, `source`, `source_type`.

| Field | `main-is-safe` (live) | `develop-ruleset.json` | Same or different? |
|---|---|---|---|
| `name` | `main-is-safe` | `develop-is-safe` | Different (identifies the target). |
| `conditions.ref_name.include` | `["~DEFAULT_BRANCH"]` | `["refs/heads/develop"]` | Different (by necessity). |
| `pull_request.allowed_merge_methods` | `["squash","rebase"]` | `["rebase"]` | **Narrower** — a stricter, not weaker, deviation (research.md R6); does not trigger C-005's approval requirement. |
| every other field, both rule set and rule parameters | — | — | **Identical**, asserted structurally, not enumerated field-by-field here (see `diffRulesetParity`'s own exhaustive walk). |

**`enforcement`, not in the table above**: the *committed* artifact's `enforcement` is always
`"active"` — the bootstrap sequence's temporary `"evaluate"` state (research.md R16) is never
committed as a second artifact; it is a one-off, documented `jq` transformation of the same file,
applied and then superseded by a PATCH back to the committed artifact (quickstart.md).

`diffRulesetParity`'s `--selftest` gets the same floor-outside-table treatment as the promotion
script (research.md R8): a same-fixture and a different-fixture are both required, and both must
be correctly classified, not just present.

**Post-apply record** (M10): once applied, the live ruleset's numeric id is recorded in
`docs/architecture/branch-model.md`, so a future check re-fetches a known id rather than searching
by name.
