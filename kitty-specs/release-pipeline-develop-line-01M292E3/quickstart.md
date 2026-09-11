# Quickstart: verifying the promotion mechanism

This mission ships no user-facing feature — the "quickstart" is how an implementer or reviewer
exercises the promotion algorithm locally, and how the orchestrator carries out its post-merge
Sequencing steps (`plan.md`). Both are commands, not a UI walkthrough.

## Running the self-test locally

```bash
node scripts/promote-develop.mjs --selftest
node scripts/check-develop-ruleset-parity.mjs --selftest
```

Both are network-free and create their own scratch repositories under `os.tmpdir()`, cleaned up on
exit. Expect probe 5 in `contracts/promotion-script.contract.md`'s table to report a **deliberate**
conflict (it is asserting that the withdrawn squash approach fails, not that something is broken).

## Exercising a promotion by hand against a scratch repo (no GitHub calls)

```bash
tmp=$(mktemp -d)
git init -q "$tmp" && cd "$tmp"
git commit -q --allow-empty -m "chore: seed"
git branch develop
echo a > file.txt && git add file.txt && git commit -q -m "chore: a"   # train advances
node /path/to/scripts/promote-develop.mjs decide --cwd "$tmp" --train HEAD --develop develop
# prints the PromotionDecision JSON (data-model.md) without touching git or the network further
```

This is the same code path `--selftest` drives; running it by hand is useful when reviewing a
change to the decision logic and wanting to see one concrete `PromotionDecision` object rather
than a pass/fail probe-table line.

## Orchestrator: applying the ruleset (after this mission's PR merges — Sequencing, `plan.md`)

```bash
# 1. Confirm the committed artifact still matches the live main-is-safe rule-for-rule
node scripts/check-develop-ruleset-parity.mjs --check

# 2. Cut develop (from train/elements-first's new head) — a normal branch push, no PR
git fetch origin train/elements-first
git push origin origin/train/elements-first:refs/heads/develop

# 3. Apply the ruleset artifact
gh api -X POST repos/spec-kitty/spec-kitty-design/rulesets \
  --input .github/rulesets/develop-ruleset.json

# 4. Bootstrap CodeQL coverage before the first promotion PR (spec.md Sequencing, code_scanning
#    bootstrap mitigation) — a trivial, no-op-content push is enough to seed a baseline scan.
git commit -q --allow-empty -m "chore(release): seed CodeQL baseline scan on develop"
git push origin HEAD:refs/heads/develop

# 5. Confirm before letting the promotion workflow run for real
gh api repos/spec-kitty/spec-kitty-design/branches/develop --jq .protected   # expect: true
gh api "repos/spec-kitty/spec-kitty-design/code-scanning/analyses?ref=refs/heads/develop"
```

## Operator: creating the App (before any of the above)

1. GitHub → Organization settings → Developer settings → GitHub Apps → New GitHub App, named
   `spec-kitty-design-release`.
2. Permissions: Contents (Read & write), Pull requests (Read & write), Workflows (Read & write).
   Metadata (Read) is added automatically.
3. Install it on `spec-kitty/spec-kitty-design` **only** — do not select "All repositories" and do
   not add any other repository to the install.
4. Generate a private key; add `SK_DESIGN_RELEASE_APP_ID` (the App's numeric ID) and
   `SK_DESIGN_RELEASE_APP_PRIVATE_KEY` (the PEM contents) as repository secrets on
   `spec-kitty/spec-kitty-design`.
