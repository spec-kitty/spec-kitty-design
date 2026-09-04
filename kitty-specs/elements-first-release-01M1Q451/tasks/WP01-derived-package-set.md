---
work_package_id: WP01
title: One derived package set, and the two packages that were excluded from it
dependencies: []
requirement_refs:
- FR-001
- FR-002
planning_base_branch: mission/elements-first-release
merge_target_branch: mission/elements-first-release
branch_strategy: Planning artifacts for this mission were generated on mission/elements-first-release. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/elements-first-release unless the human explicitly redirects the landing branch.
subtasks: []
phase: Phase 1 - Graph
history:
- timestamp: '2026-09-04T21:23:41Z'
  agent: system
  action: Prompt generated via spec-kitty tasks
authoritative_surface: scripts/release-graph.mjs
create_intent:
- scripts/release-graph.mjs
execution_mode: code_change
owned_files:
- scripts/release-graph.mjs
- .github/workflows/release.yml
- packages/elements/package.json
- packages/react/package.json
tags: []
tracker_refs:
- '#80'
---

# WP01 — One derived package set

`release.yml` carries **three** hand-written package lists and they already disagree:

| step | list |
|---|---|
| build | `--projects=tokens,styles,elements` |
| publish | two steps: `tokens`, `styles` |
| contents audit | `for pkg in tokens styles` |

So `elements` is built on every release and then dropped, and `react` is neither built nor
published. Both are `"private": true`, which is *why* they are absent — and the absence is
silent, because `npm publish` on a private package does not error:

```
$ cd packages/elements && npm publish --dry-run; echo $?
npm warn publish Skipping workspace @spec-kitty/elements, marked as private
0
```

## What to build

`scripts/release-graph.mjs` — **the** source of the publishable set. It reads
`packages/*/package.json`, selects those without `private: true`, and exposes the result both as
a module export and as `--list` for the workflow to consume.

Then rewrite `release.yml` so its build, publish and audit steps all iterate that one list. Not
three lists checked against each other — one list, consumed three times. A gate that reconciles
three hand-written lists is a gate that must be kept in step with three hand-written lists.

Remove `"private": true` from `@spec-kitty/elements` and `@spec-kitty/react`.

## What will bite

**The empty set.** If the filter is wrong, or a glob matches nothing, `--list` returns `[]` and
every downstream loop runs zero times and succeeds. `release-graph.mjs` must **refuse** to emit an
empty set, and the refusal is WP02's to prove, not to assume.

**The rationale for `private` is not recorded anywhere.** It has been on `elements` since `b99c293`
(#70) and `react` since `4289fd1` (#126), with no ADR, charter entry or commit message giving a
reason. Raised as a fork on #80. Proceed on "not ready to publish yet"; if the operator says
otherwise, this WP is where it changes.

**`--provenance` does not need a `repository` field.** An earlier survey comment of mine said it
did and is retracted: `libnpmpublish@11.17.0`'s `lib/provenance.js:37` builds the URL from
`GITHUB_SERVER_URL`/`GITHUB_REPOSITORY`, and `ensureProvenanceGeneration` guards only the GHA OIDC
token and `--access public`. Both are already set. Do not "fix" a non-problem here.
