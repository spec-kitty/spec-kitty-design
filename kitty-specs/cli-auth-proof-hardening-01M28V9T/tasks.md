# Tasks: CLI Auth Proof Hardening

**Input**: `spec.md`, `plan.md` (both committed)
**Branch**: `mission/cli-auth-proof-hardening` (single_branch topology — this mission's WP
executes directly on this branch; no worktree, per `spec-kitty`'s own `single_branch` contract)

Per `plan.md`'s Implementation Concern Map, this mission is **one bounded Work Package and one
PR**. IC-01 (#417's breakpoint alignment + family sweep) and IC-02 (#418's derived DOM inventory)
touch disjoint files, but both are small, neither is independently more valuable to ship alone
than together, and the mission brief itself calls for exactly one bounded WP.

## Subtask Index

| ID | Description | WP | Parallel |
|----|---|----|----|
| T001 | `cli-auth.stories.ts`: change `.sk-cli-auth-pattern`'s narrow-width `@media` step from `max-width: 390px` to `max-width: 480px`, with a comment recording the deliberate mirror of `sk-boundary-page.css`'s own `480px` step | WP01 | |
| T002 | Sweep the five other named pattern families (`team-overview`, `mission-kanban`(+ten-lane), `repository-dossier`, `work-explorer`, `work-package-views`, `mission-reading`) for the same story-local-breakpoint-disagrees-with-composed-frame defect; record the finding (read-only — no divergence found) | WP01 | |
| T003 | `scripts/check-pattern-composition.mjs`: add a run-as-CLI guard (measured defect: importing the module for its exports ran the full CLI pass and could call `process.exit()`); export `tokensOwnedClasses()`, `localClassesIn()`, `knownElementTags()`, `bemBlockRoots()`, `skPrimitivesIn()` — the derived primitives #418's DOM arm needs, reusable by future pattern specs | WP01 | |
| T004 | `sk-cli-auth-pattern.spec.ts`: replace the five-name regex denylist with a derived enumeration using T003's exports; assert every `sk`-prefixed tag/class in the rendered markup is a known custom element, an owned styles/tokens class, a story-local class, or a BEM root of one of those | WP01 | |
| T005 | Execute the red-first proof: plant a fabricated `<sk-auth-panel class="sk-consent-row">` into the rendered markup, confirm the derived check fails and names both, revert, confirm green again — record real command output | WP01 | |

T001/T002 (#417) and T003/T004/T005 (#418) touch disjoint files and have no data dependency on
each other, but are sequenced within one WP per the mission brief's "exactly one bounded WP."

## Work Package WP01 — CLI-auth proof hardening: breakpoint alignment + derived composition inventory (single WP, single PR)

**Priority**: P1 for both User Story 1 (#417) and User Story 2 (#418) — both were filed by the
same pre-merge gate pass on #409 and both are explicitly named as "about to be copied four more
times" by in-flight sibling missions.

**Independent test**: read `cli-auth.stories.ts`'s narrow-width rule (expect `480px` + mirror
comment); run `sk-cli-auth-pattern.spec.ts` for real against a built Storybook (expect green,
including the new derived-inventory assertions); execute the red-first plant/revert proof for the
derived check and record both outputs.

## Incident Record — `git rebase` onto `origin/train/elements-first` orphaned three recorded
commit SHAs

**What happened.** After WP01 was approved, this mission ran `spec-kitty accept --lenient`
(clearing the sole pre-authorized `contracts/` path-convention item), which wrote concrete
40-char commit SHAs into `meta.json` (`accept_commit`, `accepted_from_commit`, and the
`acceptance_history` log). Per the coordinator's explicit ordering, `git fetch origin` +
`git rebase origin/train/elements-first` ran next. Re-running the local gates over the rebased
tree caught a real commitlint failure — `chore(spec-kitty): record WP01 agent metadata for
accept readiness` used a bare `spec-kitty` scope not covered by `commitlint.config.cjs`'s
closed allowlist of exact CLI-emitted message shapes — reworded non-interactively via
`git filter-branch --msg-filter` (old `34af59f1b477bfdca3b7ad3e6c8a68cd3bfc3393` → new
`f5b69ab768a7a60dea00ed559ff6f8a1340c0b76`, tree verified identical). But the rebase itself —
run *before* the reword, independent of it — had already rewritten every commit from the old
merge-base forward, including the `accept` chain and the pre-mission-start `chore(spec-kitty):
status transition WP01` commit that `lanes.json` had recorded as `planning_commit_sha`. The
reword's own filter-branch pass then rewrote that same range a second time. Net effect: three
recorded SHAs — `meta.json`'s first `acceptance_history` entry's `accept_commit`
(`eb02baa1acf1e4c4c9e2eadaed015d66764b0b14`) and `accepted_from_commit`
(`fc35e00c6c7d19e801d55c25b2693b314c5034e0`), plus `lanes.json`'s `planning_commit_sha`
(`c519e86d0f51af991c636457eb654270e68c09c2`) — pointed to commit objects still present in the
local store (so they kept resolving) but no longer ancestors of the pushed branch. Same defect
class as upstream #402: an acceptance record anchoring a SHA a history rewrite orphaned. The
coordinator caught it by checking ancestry directly rather than trusting that the SHAs merely
resolved meant they were reachable — two sibling missions (`visual-evidence-gate-integrity`,
`action-row-static-form`) hit the identical class before this one; the pattern is the rebase, not
the reword.

**Why it happened, precisely.** Any history rewrite — a `filter-branch` reword *or* a plain
`git rebase` — that runs after a command has already written a commit's (or a descendant's) hash
into mission state orphans that recorded hash, because the rewrite re-parents everything from
that point forward under new object IDs. Rewording before `accept`, as this mission did the
first time (round 3's `fea9a1df` → `8e20b23c` fix, done pre-accept), limits the blast radius but
does not prevent it: the rebase the coordinator's own sequencing calls for happens *after*
accept, so it re-orphans regardless of how clean the pre-accept history already was.

**How it was resolved.**
1. Checked for a CLI write path first. `spec-kitty accept --mission ... --diagnose` (confirming
   only the pre-authorized `contracts/` item remained) then `spec-kitty accept --mission ...
   --lenient` re-ran for real — WP01's readiness was unchanged, so this simply re-stamped fresh,
   reachable SHAs into `meta.json`'s TOP-LEVEL `accept_commit`/`accepted_from_commit` (new accept
   commit `5f09eeaf8dac437d6d733f437edc3afabab54f12`, parent
   `321edce9d455bae12c6c5e5dc700008dad33cba2`) — no hand-edit needed there.
2. Two fields had no CLI write path and were hand-edited, each disclosed here explicitly by
   name, matched to their post-rewrite equivalents by commit message, mission-subtree tree hash
   (`git rev-parse <sha>:kitty-specs/cli-auth-proof-hardening-01M28V9T`, exact match — the
   repo-root tree hash does not match after a rebase that also touched unrelated files, so the
   subtree hash is the correct comparison, not the whole-tree hash), and parent-chain
   continuity (the parent of each new candidate also message-matches the parent of the old one,
   checked explicitly):
   - `meta.json`'s `acceptance_history[0]` entry (the FIRST acceptance's own log record, which
     `accept`'s re-run appends to rather than rewrites) — `accept_commit` corrected from
     `eb02baa1acf1e4c4c9e2eadaed015d66764b0b14` to `9bcb5da81c0f56c27947e9732dfef033fdd93bda`,
     `accepted_from_commit` from `fc35e00c6c7d19e801d55c25b2693b314c5034e0` to
     `68514a7c01bf931ae1fe67e66189cd42515b49d8`.
   - `lanes.json`'s `planning_commit_sha` — corrected from
     `c519e86d0f51af991c636457eb654270e68c09c2` to `5f3b5305b7348edbea26ef265b52448aa7d390d5`.
3. Verified with the coordinator's exact check, run against the whole mission directory (not
   only the three affected files), zero output:
   ```
   grep -rhoE '\b[0-9a-f]{40}\b' kitty-specs/cli-auth-proof-hardening-01M28V9T/ \
     | sort -u | while read s; do
       git merge-base --is-ancestor "$s" HEAD 2>/dev/null || echo "NOT-ANCESTOR: $s"
     done
   ```
4. Pushed once more with `--force-with-lease` pinned to the SHA already on the remote (never
   bare `--force`), after confirming nobody else had touched the remote branch since this
   session's prior push.

**Carried forward.** A `git rebase` (or any other history rewrite) run after `accept` — or after
any other command that writes a commit hash into mission state — is not safe by default in this
tool's model. It must either happen before such a command runs, or be treated as its own version
of this incident immediately, with the same reconciliation discipline applied on the spot rather
than discovered later by an external ancestry check. This is now the third mission to hit this
exact class.
