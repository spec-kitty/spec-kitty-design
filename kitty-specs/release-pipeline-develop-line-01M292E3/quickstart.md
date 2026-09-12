# Quickstart: verifying the promotion mechanism

**Revised** after the post-plan squad's M1 bootstrap-resequence finding — the previous version's
"push one plain commit to seed CodeQL" step does not work once `develop`'s ruleset is fully active
(a direct push is rejected, and an empty commit risks being dropped by a rebase-merge). See
research.md R16 for the full analysis.

## Running the self-test locally

```bash
node scripts/promote-develop.mjs --selftest
node scripts/check-develop-ruleset-parity.mjs --selftest
```

Both are network-free, create their own scratch repositories under `os.tmpdir()`, and set commit
identity via `GIT_AUTHOR_*`/`GIT_COMMITTER_*` environment variables (never `git config --global`,
which would touch a real developer's own git identity). Probe 5 (`contracts/promotion-script
.contract.md`) is `expect: 'fail'` **on purpose** — it is asserting that the withdrawn squash
approach really does conflict, not reporting a bug in this mechanism.

## Exercising a promotion decision by hand (no GitHub calls)

```bash
tmp=$(mktemp -d)
git init -q "$tmp" && cd "$tmp"
GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.invalid \
GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.invalid \
  git commit -q --allow-empty -m "chore: seed"
git branch develop
echo a > file.txt && git add file.txt && GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.invalid \
GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.invalid git commit -q -m "chore: a"
node /path/to/scripts/promote-develop.mjs decide --cwd "$tmp" --train HEAD --develop develop
# prints the PromotionDecision JSON (data-model.md) without touching git or the network further
```

## Operator: creating the App (before anything below)

1. GitHub -> Organization settings -> Developer settings -> GitHub Apps -> New GitHub App, named
   `spec-kitty-design-release`.
2. Permissions: Contents (Read & write), Pull requests (Read & write), Workflows (Read & write).
   Metadata (Read) is added automatically.
3. Install it on `spec-kitty/spec-kitty-design` **only** — do not select "All repositories" and do
   not add any other repository. (The workflow's own runtime guard, `assert-scope`, fails closed
   at every run if this is ever widened — plan.md's Failure modes.)
4. Generate a private key; add `SK_DESIGN_RELEASE_APP_ID` (the App's numeric ID) and
   `SK_DESIGN_RELEASE_APP_PRIVATE_KEY` (the PEM contents) as repository secrets on
   `spec-kitty/spec-kitty-design`.
5. **Leave `PROMOTE_DEVELOP_ENABLED` unset (or `false`)** until step 5 of the orchestrator sequence
   below — this is the freeze switch, and the bootstrap sequence depends on it staying off until
   the ruleset is confirmed to have a CodeQL baseline.

## Orchestrator: the bootstrap sequence (revised order — research.md R16)

```bash
# 1. Cut develop from train/elements-first's new head (a normal branch push, no PR — this step
#    happens BEFORE any ruleset exists on develop, so a direct push is not yet rejected).
git fetch origin train/elements-first
git push origin origin/train/elements-first:refs/heads/develop

# 2. Apply the ruleset in EVALUATE mode (non-blocking) — or, as a named alternative, ACTIVE with
#    code_scanning omitted. Either lets the pull_request rule (0 required reviews) still gate
#    normally while the one rule that needs a baseline analysis is not yet asked to block anything.
jq '.enforcement = "evaluate"' .github/rulesets/develop-ruleset.json > /tmp/develop-ruleset.bootstrap.json
gh api -X POST repos/spec-kitty/spec-kitty-design/rulesets --input /tmp/develop-ruleset.bootstrap.json
# Record the returned ruleset id — needed for steps 5 and 6.
ruleset_id=<id from the response above>

# 3. Flip the enable switch.
gh variable set PROMOTE_DEVELOP_ENABLED --body true --repo spec-kitty/spec-kitty-design

# 4. Wait for the first REAL promotion PR to open (the promotion job's normal push-triggered run
#    does this on its own, now that step 3 is done) — then confirm it produced a CodeQL analysis
#    of its own head, not develop's push ref:
gh pr list --repo spec-kitty/spec-kitty-design --base develop --state open --json number,headRefOid
gh api "repos/spec-kitty/spec-kitty-design/code-scanning/analyses?ref=refs/pull/<N>/head"
# If nothing appears after a reasonable wait: trigger CodeQL default setup manually
# (`gh api -X PUT repos/.../code-scanning/default-setup`) or wait for the weekly default-setup
# schedule — named fallbacks, not assumed away (research.md R16, plan B).

# 5. Once step 4 is confirmed, PATCH the ruleset back to the committed artifact (active, full
#    five-rule set) — a PATCH against the id from step 2, never a second POST (a second POST
#    creates a SECOND ruleset object, which M10's post-apply check exists to catch).
node scripts/check-develop-ruleset-parity.mjs --check   # confirm the artifact still matches
                                                          # main-is-safe rule-for-rule before applying
gh api -X PATCH "repos/spec-kitty/spec-kitty-design/rulesets/${ruleset_id}" \
  --input .github/rulesets/develop-ruleset.json

# 6. Post-apply verification (M10): exactly one active ruleset targets develop, and it equals the
#    committed artifact.
gh api repos/spec-kitty/spec-kitty-design/rulesets --jq '[.[] | select(.target=="branch")] | length'
gh api "repos/spec-kitty/spec-kitty-design/rulesets/${ruleset_id}"
# Record ${ruleset_id} in docs/architecture/branch-model.md.
```

## Optional: changing the promotion source (future — research.md R17)

Changing `vars.PROMOTE_DEVELOP_SOURCE_BRANCH` alone is **not** a complete cutover — the workflow's
own `on.push.branches` trigger is a literal string GitHub Actions cannot read from a variable.
Changing the source requires **both**:

```bash
gh variable set PROMOTE_DEVELOP_SOURCE_BRANCH --body '<new-branch>' --repo spec-kitty/spec-kitty-design
```

**and** a follow-up PR editing `ci-quality.yml`'s `promote-develop` job's `if:` and the workflow's
`push.branches` entry to match. `branch-model.md` states this explicitly.
