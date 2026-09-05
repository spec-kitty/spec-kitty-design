# Elements-First Run Prompt

The loop prompt for driving the elements-first programme. One iteration = one mission. Paste it as-is, or point a loop at this file.

**Repo:** `spec-kitty/spec-kitty-design` · **Integration branch:** `train/elements-first`

**Live programmes** — the loop draws from all three, not from a number range:

| epic | scope | children |
|---|---|---|
| #66 | Elements-first foundation | #82 only; the rest are closed |
| #144 | Team overview (Team Kitty redesign) | #145–#150 |
| #183 | Factory dashboard (operational components) | #176–#180, #182 |

---

## The prompt

> Drive one mission from the live programmes in `spec-kitty/spec-kitty-design` — epics #66, #144 and #183. Follow the procedure in `docs/architecture/elements-first-run-prompt.md` exactly: select an unclaimed, unblocked issue, claim it before doing any work, drive it to a PR into `train/elements-first`, then release or close the claim. Do not make architectural decisions — every one you need is already in an ADR, and if one is missing, stop and say so.

---

## 1. Select

The eligible set is an **explicit list**, kept in this file beside the dependency table. Update both
together.

```sh
# Every issue the loop may drive. Membership is curated — see "why this is a list" below.
CANDIDATES="82 145 146 147 148 149 150 176 177 178 179 180 182"

for n in $CANDIDATES; do
  gh issue view "$n" --repo spec-kitty/spec-kitty-design \
    --json number,title,state,assignees --jq \
    'select(.state == "OPEN") | select(.assignees | length == 0) | "\(.number)\t\(.title)"'
done
```

That prints **candidates, not eligible missions**. Apply the dependency table before claiming: an
issue whose prerequisites are open is not eligible, however inviting it looks.

### Why this is a list and not a query

Three derivations were tried and each is broken:

- **A number range.** `select(.number >= 67 and .number <= 82)` was here, and it silently excluded
  every issue in #144 and #183 — the loop reported "nothing unblocked" while two whole programmes
  sat open. This is the failure that motivated the rewrite.
- **Grepping `#NNN` out of the epic bodies.** Measured across #66, #144 and #183 it returns 38
  numbers, among them `1 2 3 4` (ADR section references), `92`, `125`, and `648`/`650` from another
  repository. The noise is not filterable without knowing the answer already.
- **GitHub's native sub-issues.** `repos/.../issues/183/sub_issues` is empty for all three epics;
  the relationship is not modelled. #144 does not even mention #145–#150 in its body — its children
  are identifiable only from their `[TKO*]` title prefixes.

So the list is curated. That is a real maintenance cost, paid deliberately: a wrong list fails
loudly at the next iteration, whereas a clever derivation fails silently and did.

### Dependency state

Prerequisites are stated in prose in the issue bodies (`Depends on:`, `after #N`), which is not
reliably machine-readable. **Re-verify against the issue before trusting this table** — it is a
convenience, not the source of truth.

| issue | programme | depends on | state |
|---|---|---|---|
| #82 | #66 | — | eligible; rescoped by the operator to the demo-site dashboard, `apps/demo/dashboard-demo.html` |
| #145 | #144 | #79 ✅ | eligible |
| #146 | #144 | #79 ✅ | eligible |
| #147 | #144 | #79 ✅ | eligible; shares the `ssrSafe` boundary with #179/#180 |
| #148 | #144 | #79 ✅ | claimed; establishes shared visualization conventions first |
| #149 | #144 | #79 ✅ | **work already merged in #171** — close it, do not start it |
| #150 | #144 | #145–#149 | blocked; the composition story, genuinely last |
| #176 | #183 | — | wave 1 |
| #180 | #183 | — | wave 1; consumes #176's forced-colors baseline |
| #177 | #183 | #176, #146 | wave 2 |
| #178 | #183 | #177, #146 | wave 3 |
| #182 | #183 | #145, #176 | wave 3 |
| #179 | #183 | #148, #176 | wave 4 |

Loose defect, CI and a11y issues (#151–#168, #173, #174) belong to no epic and are **not** in the
loop's eligible set. They are operator-scheduled: take one only when told to.

If nothing is open, unassigned and unblocked, **stop and report which issues are blocked on what.**
Do not invent work, and do not start a blocked issue because its prerequisite "looks nearly done".

## 2. Claim it — before any other action

Claiming is not bookkeeping; it is the concurrency guard. Two loop iterations that both start work on #176 will both author five new `packages/styles/src` directories and both regenerate the same barrels.

**The guard is blind between sessions sharing a GitHub account.** Observed 2026-09-05: two
concurrent loops both ran as `MOES-Media`, so "an issue with an assignee is claimed — skip it"
could not distinguish one session's claims from the other's, and each saw the other's in-flight
work as its own. If more than one loop runs under one account, the assignee field is not a guard.
Compensate by naming the session in the claim comment (below) and reading the comments, not just
the assignee — and prefer distinct accounts per loop, which restores the guard properly.

```sh
gh issue edit <N> --repo spec-kitty/spec-kitty-design --add-assignee @me
```

Then **verify you are the sole assignee** — the API is last-write-wins, so a race is possible:

```sh
gh issue view <N> --repo spec-kitty/spec-kitty-design --json assignees --jq '.assignees[].login'
```

If that returns anyone other than you, **release and pick another issue**:

```sh
gh issue edit <N> --repo spec-kitty/spec-kitty-design --remove-assignee @me
```

Then post the claim comment. It exists so a human watching the epic can see what is in flight without opening a PR list:

```sh
gh issue comment <N> --repo spec-kitty/spec-kitty-design --body "$(cat <<'EOF'
🔨 **Claimed** — starting this mission. _(session `<short session id>`)_

- **Branch:** `mission/<slug>` off `train/elements-first`
- **Squad tier:** <tier from the issue body>
- **Reading first:** <the ADRs the issue names>

Will comment at each point-cut. If I hit a decision that is not already in an ADR, I will stop and say so here rather than decide it.
EOF
)"
```

## 3. Set up — in a primary checkout, never a git worktree

**This matters more than it looks.** The `spec-kitty` CLI resolves the project root via the git **primary checkout**, not the working directory. Run from inside a `git worktree`, its commands read and *write* into whichever checkout owns the repository — not the one you are standing in.

Observed twice while preparing this programme: `spec-kitty charter generate`, run from a worktree, wrote a 137 KB `charter.yaml` and modified `.kittify/config.yaml` in a *different* checkout, staging the new file; and `spec-kitty charter lint`, which only reads, still dropped a `.kittify/lint-report.json` there. In this ecosystem that other checkout is the one every SaaS mission's `design:guardrails` resolves through, so the blast radius is another repo's CI.

So: **clone, do not add a worktree.**

```sh
git clone --branch train/elements-first \
  https://github.com/spec-kitty/spec-kitty-design.git <workdir>
cd <workdir>
[ -d .git ] || { echo "worktree, not a primary checkout — stop"; exit 1; }
npm ci --ignore-scripts
git checkout -b mission/<slug>
```

If you are resuming in an existing clone: `git checkout train/elements-first && git pull --ff-only` first, then branch.

Never branch from `main`, and never PR into `main` — the train lands on `main` once, at the end, by the operator.

## 4. Drive

Follow the issue body. It is written to be complete: intent, in-scope, explicitly out-of-scope, what is already proven, work-package shape, exit criteria.

- `spec-kitty specify` → `plan` → `tasks`, seeded from the issue. Never hand-edit `kitty-specs/` artefacts (CLAUDE.md §7).
- Conventional commits; scopes from `commitlint.config.cjs` (`styles`, `elements` and `react` were added ahead of their packages).
- Deploy the adversarial squad at the **earlier** point-cuts the issue's tier declares — not more, not fewer. Report-only; fold findings before the next phase. The pre-merge gate in step 6 is separate and is never skipped, whatever the tier.
- **Model routing:** the smaller model for every delegated seat; the larger one only for squad lenses and synthesis, arbiter escalation, and plan-phase architecture on risky missions. When in doubt, route down.

Comment on the issue at each point-cut with a one-line status. That is what makes the loop observable while it runs.

### The rule that keeps this autonomous

**Do not make architectural decisions.** ADRs 8–13 pin every decision these missions need, and ADRs are written only in #67. If you hit a fork that no ADR covers:

1. Stop work on that thread.
2. Comment on the issue with the fork, the options, and what you would recommend and why.
3. If the rest of the mission can proceed without it, proceed and note what you deferred. If it cannot, go to step 8 and release the claim.

Discovering a decision is a legitimate outcome. Deciding one silently is not — it produces exactly the drift this programme exists to remove.

## 5. Open the PR

```sh
gh pr create --repo spec-kitty/spec-kitty-design \
  --base train/elements-first --head mission/<slug> \
  --title "<type>(<scope>): <subject>" \
  --body "Refs #<N> · part of #66 ..."
```

**Use `Refs #<N>`, not `Closes`.** A PR merging into the train does not auto-close anything — GitHub only honours closing keywords on merges into the default branch. The issue is closed by hand in step 8.

CI Quality runs on train PRs; the workflow's branch filters were extended to `train/**` for exactly this. A PR that touches a new package directory must also extend `ci-quality.yml`'s `components` path filter, or its component gates silently skip.

## 6. Run the full adversarial gate and post its evidence — every PR, no exceptions

**No PR merges into the train until the gate has run against its head SHA and the evidence is a comment on that PR.** This is uniform: tier governs the earlier point-cuts, never this one.

Dispatch all four lenses in parallel, each prompt opening with the profile load:

> FIRST run `spec-kitty agent profile show <id>` and `spec-kitty charter context --action review --json`; apply the resolved initialization, boundaries, directives and tactics, then state which you applied. You are read-only. Review the diff of PR #<N> at `<head SHA>`. Return findings as `[SEVERITY] file:line — issue — recommendation`, end with a verdict, and state honestly where your lens does not apply.

Lenses: `architect-alphonso` (structure, seams, topology) · `reviewer-renata` (contract-versus-implementation, fakeable assertions) · `debugger-debbie` (would this catch the regression?) · `randy-reducer` (duplication and dead code — read critically, it has a known duct-tape bias). Swap in `doctrine-daphne` for charter- or doctrine-touching PRs.

Then post the evidence:

```sh
gh pr comment <PR> --repo spec-kitty/spec-kitty-design --body "$(cat <<'EOF'
## Adversarial gate — pass 1

**Reviewed at:** `<head SHA>`  ·  **Lenses:** architect-alphonso, reviewer-renata, debugger-debbie, randy-reducer

| Lens | Verdict | Concedes |
|---|---|---|
| architect-alphonso | <verdict> | <where the lens does not apply> |
| reviewer-renata | <verdict> | ... |
| debugger-debbie | <verdict> | ... |
| randy-reducer | <verdict> | ... |

### Findings

- `[MAJOR] path/file.ts:120` — <issue> — <recommendation> → **folded** in `<sha>`
- `[MINOR] path/other.css:8` — <issue> — <recommendation> → **deferred**, filed as #<n>

### Severity trend

Pass 1: <n> major, <n> minor. <On a second pass: the trend against pass 1, and the halt decision.>
EOF
)"
```

**Rules that make this evidence rather than ceremony:**

- **The SHA must be the PR head.** Without it the evidence silently decouples from the diff the moment anyone pushes — the same failure `[ci] green @<sha>` exists to prevent. Push after the gate, and the gate is stale: re-run it.
- **Every finding needs `file:line`.** An ungrounded finding is not evidence.
- **Every finding needs a disposition** — folded here, or deferred with an issue number. "Noted" is not a disposition.
- **A lens that concedes nothing is noise.** Four confident verdicts on a docs-only PR means the squad told you nothing.
- **Two passes maximum, and no severity arithmetic.** A pass is done when every finding it raised is folded or filed. If pass 2 raises new in-scope findings, fold them and merge — do not run a third, and do not escalate because a count failed to fall. Escalate only when a lens names a specific blocker you cannot resolve, or when a governing document contradicts another.
- **Re-read a second-pass review against the current head before acting on it.** A reviewer pinned to an older SHA will report findings you have already fixed; that is the SHA pin working, not the reviewer being wrong.

## 7. Merge — mission branch into the train, and only that

**Operator standing order, 2026-09-02.** The loop **may** merge a mission branch into `train/elements-first`. The loop **never** merges the train into `main` — that is an operator act and is not delegated.

Both conditions must hold, and neither substitutes for the other:

1. **CI is green** on the PR head.
2. **The adversarial gate's evidence is posted** on the PR and its SHA matches the head.

```sh
gh pr checks <PR> --repo spec-kitty/spec-kitty-design          # 1 — green?
gh pr view <PR> --repo spec-kitty/spec-kitty-design --json headRefOid --jq .headRefOid
# 2 — does the gate comment name that same SHA?
gh pr merge <PR> --repo spec-kitty/spec-kitty-design --squash --delete-branch
```

If either condition fails, do not merge. If CI went green *before* a later push, it is stale in the same way the gate is: both are pinned to a SHA, and both re-run.

## 8. Close out — always release the claim

**On success**, after the PR merges into the train:

```sh
gh issue comment <N> --repo spec-kitty/spec-kitty-design --body "✅ **Done** — merged to \`train/elements-first\` in <PR link>.

Exit criteria: <one line per criterion, with the evidence>.
<Anything the next mission should know that is not already in an ADR.>"
gh issue close <N> --repo spec-kitty/spec-kitty-design
```

**On blocked**, release the claim so the next iteration can see it is available and why it stalled:

```sh
gh issue comment <N> --repo spec-kitty/spec-kitty-design --body "⛔ **Blocked** — releasing the claim.

- **Blocker:** <what, specifically>
- **Needs:** <operator decision / another mission / an ADR>
- **Done so far:** <branch name and what is on it, or 'nothing committed'>"
gh issue edit <N> --repo spec-kitty/spec-kitty-design --remove-assignee @me
```

**Never leave an issue assigned to a finished or abandoned iteration.** A stale assignee is indistinguishable from work in progress, and the loop will skip it forever.

## 9. Loop

Return to step 1.

---

## Running more than one loop at a time

The claim protocol already makes concurrent loops *safe*. These four rules make them *useful*.

### 1. Cap it at two

The dependency graph rarely permits more than two independent missions — currently `#176 ∥ #180`, and `#145 ∥ #146` once those land. A third loop spends its time losing claim races and reporting "nothing unblocked". Two is the number.

### 2. Every loop gets its own clone

Two loops sharing a checkout will fight over `HEAD` and `node_modules`, and the `spec-kitty` CLI's primary-checkout resolution turns that into cross-contamination. Path per iteration, never reused while another loop is live:

```sh
git clone --branch train/elements-first \
  https://github.com/spec-kitty/spec-kitty-design.git ~/work/ef-$(date +%s)-$$
```

### 3. Select with jitter, not always-lowest

Step 1's "lowest-numbered eligible" rule makes two loops collide on the same issue every single time — one always wins, the other always retries. With more than one loop running, pick **at random from the eligible set** instead, and sleep 2–5 seconds before claiming. The claim check still resolves any genuine race; jitter just stops you paying for one on every iteration.

### 4. A rebase invalidates the gate

This is the rule that actually bites. Both the CI verdict and the adversarial-gate evidence are **pinned to a SHA**. If your PR needs a rebase because the other loop merged into the train first, the rebase produces a new head — and both the green check and the gate evidence now refer to a commit that is no longer the head.

```sh
git fetch origin && git rebase origin/train/elements-first
git push --force-with-lease
# the PR head changed → CI re-runs, and the gate MUST re-run
```

**Re-run the gate and post fresh evidence.** Do not merge on evidence whose SHA is not the head, and do not hand-wave it as "the rebase was trivial" — that is precisely the reasoning the SHA pin exists to refuse. If two loops are merging often enough that this hurts, the answer is fewer loops, not looser evidence.

### Which pairs are actually safe

The named pairs that used to live here — `#69 ∥ #70`, `#73 ∥ #74`, `#77 ∥ #78 ∥ #79` — are all
merged. The current answer:

- **`#176 ∥ #180`** — sanctioned by #180's own sequencing note; authored sources are disjoint
  (`packages/styles/src/{facts,disclosure,data-table,empty-state,skip-link}` versus
  `packages/elements/src/form-input`). #180 consumes #176's forced-colors baseline, so if #176 has
  not landed it, #180 records the dependency rather than re-deciding it.
- **`#145 ∥ #146`** — disjoint component directories, both depending only on the closed #79. #145
  additionally extends `sk-button` with an icon-only size; #146 does not touch it.
- **`#147`** — disjoint from both, and it shares the React-wrapper `ssrSafe` boundary with #179 and
  #180. Per epic #183, whichever mission resolves that boundary first records the reusable answer
  for the others; the later ones consume it rather than re-measuring.
- **Everything in #183's waves 2–4** is a chain. Do not start one because its prerequisite looks
  nearly done.

**All concurrent missions collide on the generated artifacts** regardless of how disjoint their
authored sources are: `custom-elements.json`, `SIZES.md`, the generated `sk-*.css.js`,
`packages/react/src`, and every `expected-*.json`. That collision is handled by rule 4 below —
the second to merge rebases, regenerates, and re-runs its gate — not by avoiding parallelism. Both
#176 and #183's programme requirements state this as an exit criterion.

Do not invent parallelism the dependency lines do not permit; they encode real coupling, not
caution. Stop when nothing is both unassigned and unblocked, and report the state of the epics.

---

## What this loop must never do

- **Push to `main`, open a PR against `main`, or merge the train into `main`.** The train lands once, by the operator. Merging mission branches into the train is permitted, under step 7's two conditions.
- **Merge its own PR** without the full adversarial gate having run against the head SHA and its evidence posted on the PR.
- **Write an ADR** outside #67.
- **Hand-edit `kitty-specs/`.** Those artefacts desync runtime state (CLAUDE.md §7). The charter is different: `charter.md` is curated by hand and is the only home of project policy — but changing it is never part of a mission's diff.
- **Touch `kitty-specs/**`, `docs/architecture/validation/**` or `docs/learnings/**`** — frozen historical record, including during the rename in #68.
- **Start a mission whose dependencies are still open**, however tempting the parallelism looks. The dependency lines encode real coupling: #176 before #177 because the tone axis needs the primitives it colours; #148 before #179 because the bar chart establishes the visualization conventions the line chart follows; #146 before #178 because a block-level notice and an inline status indicator must not each invent a tone vocabulary.
