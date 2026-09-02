# Elements-First Run Prompt

The loop prompt for driving the elements-first programme. One iteration = one mission. Paste it as-is, or point a loop at this file.

**Repo:** `spec-kitty/spec-kitty-design` · **Epic:** #66 · **Integration branch:** `train/elements-first`

---

## The prompt

> Drive one mission from epic #66 in `spec-kitty/spec-kitty-design`. Follow the procedure in `docs/architecture/elements-first-run-prompt.md` exactly: select an unclaimed, unblocked issue, claim it before doing any work, drive it to a PR into `train/elements-first`, then release or close the claim. Do not make architectural decisions — every one you need is already in an ADR, and if one is missing, stop and say so.

---

## 1. Select

```sh
gh issue list --repo spec-kitty/spec-kitty-design --state open \
  --json number,title,assignees --jq \
  '.[] | select(.number >= 67 and .number <= 82) | select(.assignees | length == 0) | "\(.number)\t\(.title)"'
```

Take the **lowest-numbered** issue whose dependencies (listed in its body as `Depends on:`) are all **closed**. Lower numbers are earlier in the critical path, so this walks the graph in order without needing a scheduler.

An issue with an assignee is claimed — skip it, even if it looks stalled. If nothing is both unassigned and unblocked, **stop and report which issues are blocked on what.** Do not invent work.

## 2. Claim it — before any other action

Claiming is not bookkeeping; it is the concurrency guard. Two loop iterations that both start work on #70 will both scaffold `packages/elements`.

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
🔨 **Claimed** — starting this mission.

- **Branch:** `mission/<slug>` off `train/elements-first`
- **Squad tier:** <tier from the issue body>
- **Reading first:** <the ADRs the issue names>

Will comment at each point-cut. If I hit a decision that is not already in an ADR, I will stop and say so here rather than decide it.
EOF
)"
```

## 3. Set up

```sh
git fetch origin
git checkout train/elements-first && git pull --ff-only
git checkout -b mission/<slug>
```

Never branch from `main`, and never PR into `main` — the train lands on `main` once, at the end, as a single rebase-merge.

## 4. Drive

Follow the issue body. It is written to be complete: intent, in-scope, explicitly out-of-scope, what is already proven, work-package shape, exit criteria.

- `spec-kitty specify` → `plan` → `tasks`, seeded from the issue. Never hand-edit `kitty-specs/` artefacts (CLAUDE.md §7).
- Conventional commits; scopes from `commitlint.config.cjs` (`styles`, `elements` and `react` were added ahead of their packages).
- Deploy the adversarial squad at the point-cuts **the issue's tier declares** — not more, not fewer. Report-only; fold findings before the next phase.
- **Model routing:** the smaller model for every delegated seat; the larger one only for squad lenses and synthesis, arbiter escalation, and plan-phase architecture on risky missions. When in doubt, route down.

Comment on the issue at each point-cut with a one-line status. That is what makes the loop observable while it runs.

### The rule that keeps this autonomous

**Do not make architectural decisions.** ADRs 8–13 pin every decision these missions need, and ADRs are written only in #67. If you hit a fork that no ADR covers:

1. Stop work on that thread.
2. Comment on the issue with the fork, the options, and what you would recommend and why.
3. If the rest of the mission can proceed without it, proceed and note what you deferred. If it cannot, go to step 6 and release the claim.

Discovering a decision is a legitimate outcome. Deciding one silently is not — it produces exactly the drift this programme exists to remove.

## 5. Open the PR

```sh
gh pr create --repo spec-kitty/spec-kitty-design \
  --base train/elements-first --head mission/<slug> \
  --title "<type>(<scope>): <subject>" \
  --body "Refs #<N> · part of #66 ..."
```

**Use `Refs #<N>`, not `Closes`.** A PR merging into the train does not auto-close anything — GitHub only honours closing keywords on merges into the default branch. The issue is closed by hand in step 6.

CI Quality runs on train PRs; the workflow's branch filters were extended to `train/**` for exactly this. A PR that touches a new package directory must also extend `ci-quality.yml`'s `components` path filter, or its component gates silently skip.

## 6. Close out — always release the claim

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

## 7. Loop

Return to step 1. Stop when nothing is both unassigned and unblocked, and report the state of the epic.

---

## What this loop must never do

- **Push to `main`, or open a PR against `main`.** The train lands once, by a human.
- **Merge its own PR** without the mission's declared squad point-cuts having run.
- **Write an ADR** outside #67.
- **Hand-edit `kitty-specs/`, the charter, or the glossary.** Those go through the CLI.
- **Touch `kitty-specs/**`, `docs/architecture/validation/**` or `docs/learnings/**`** — frozen historical record, including during the rename in #68.
- **Start a mission whose dependencies are still open**, however tempting the parallelism looks. The dependency lines encode real coupling: #70 before #71 because a gate cannot precede the thing it gates; #76 before the batches because nine components authored from the old recipe rebuild the duplication.
