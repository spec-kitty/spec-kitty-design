# Data Model: Release pipeline develop-line governance (REL1, #362)

Phase 1 output. This mission has no application data model — it is CI/governance tooling — but
`scripts/promote-develop.mjs`'s algorithm and the `develop` ruleset artifact are both structured
enough to benefit from being stated as entities before implementation, so the tasks phase can
slice work packages against a fixed shape rather than an implicit one.

## PromotionDecision

The pure-function core of `scripts/promote-develop.mjs` computes one of these per run, given the
current state of `train/elements-first`, `develop`, and any existing `promote/*` branch/PR. It is
a plain object, not a persisted record — nothing in this mission adds storage.

| Field | Type | Meaning |
|---|---|---|
| `outcome` | `'no-op-missing-develop' \| 'no-op-in-sync' \| 'reuse-existing-pr' \| 'supersede-and-open' \| 'open-new'` | Which of the five branches (Plan §Algorithm) applied. |
| `trainSha` | string (40-hex) or `null` | The train tip commit this decision was computed against. `null` only for `no-op-missing-develop`. |
| `trainTree` | string (40-hex) or `null` | `train^{tree}` at `trainSha`. |
| `developSha` | string (40-hex) or `null` | `develop`'s tip at decision time. `null` when `develop` does not exist. |
| `developTree` | string (40-hex) or `null` | `develop^{tree}` at `developSha`. |
| `existingPr` | `{ number, headSha, headTree, branch } \| null` | An open `base:develop` PR from a `promote/*` branch, if one exists, read via `gh pr list`. |
| `commitMessage` | string or `null` | Built only for `supersede-and-open` / `open-new` (R-format below). |
| `branchName` | string or `null` | `promote/<trainSha>` for the two "open" outcomes. |

**Invariant**: exactly one of the five `outcome` values is ever returned, and every field not
meaningful for that outcome is `null` — a caller (the CLI entry point, or a test) can assert on
`outcome` and get a fully-determined record, never a partial one it has to further branch on.

## PromotionCommitMessage

The conventional-commit message format `buildCommitMessage(trainSha)` produces, checked against
`commitlint.config.cjs` (Plan §Message Format).

| Part | Value | Constraint |
|---|---|---|
| type | `chore` | Member of `commitlint.config.cjs`'s default `type-enum` (from `@commitlint/config-conventional`). |
| scope | `release` | Member of the project's `scope-enum` list (`commitlint.config.cjs`, already includes `release`). |
| subject | `` promote `<trainSha short 7>` to develop `` | Lowercase (subject-case rule), header total length well under the 100-char `header-max-length` ceiling. |
| body | `Promotes train/elements-first@<trainSha full 40> to develop via tree-sync promotion.` | Full SHA for provenance; the short SHA in the header is for readability only. |

Example: header `chore(release): promote a1b2c3d to develop` (43 chars).

## DevelopRulesetArtifact

The JSON body committed at `.github/rulesets/develop-ruleset.json`, applied verbatim by the
orchestrator (`gh api -X POST repos/spec-kitty/spec-kitty-design/rulesets --input
.github/rulesets/develop-ruleset.json`, Sequencing). Shape mirrors the live `main-is-safe`
(`gh api repos/spec-kitty/spec-kitty-design/rulesets/15855418`) rule-for-rule, with two named,
justified differences.

| Field | `main-is-safe` (live) | `develop-ruleset.json` (this mission) | Same or different? |
|---|---|---|---|
| `name` | `main-is-safe` | `develop-is-safe` | Different (identifies the target). |
| `target` | `branch` | `branch` | Same. |
| `conditions.ref_name.include` | `["~DEFAULT_BRANCH"]` | `["refs/heads/develop"]` | Different (by necessity — `develop` is never the default branch). |
| `enforcement` | `active` | `active` | Same. |
| rule types present | `deletion`, `non_fast_forward`, `required_linear_history`, `pull_request`, `code_scanning` | identical five | Same (SC-001). |
| `pull_request.required_approving_review_count` | `0` | `0` | Same. |
| `pull_request.allowed_merge_methods` | `["squash","rebase"]` | `["rebase"]` | **Narrower** (R6, research.md) — a named, stricter deviation, not a weaker one; does not trigger C-005's approval requirement (which is scoped to bypass actors, linear-history, and code_scanning). |
| `code_scanning.code_scanning_tools` | CodeQL, `high_or_higher`, `alerts_threshold: errors` | identical | Same. |
| `bypass_actors` | `[]` | `[]` | Same (spec.md Recorded Decision #6: Option D needs no bypass actor). |
| `current_user_can_bypass` | `never` | `never` | Same. |

`scripts/check-develop-ruleset-parity.mjs` encodes exactly this table as a pure comparison
function (`diffRulesetParity(live, artifact)`), returning the empty list only when every row
matches its expected same/different verdict — see `contracts/promotion-script.contract.md`.
