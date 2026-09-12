#!/usr/bin/env bash
# check-token-breaking-changes.sh — detects removed or renamed --sk-* tokens
# between the current HEAD and a previous git tag or commit.
#
# Usage:
#   bash scripts/check-token-breaking-changes.sh              # compare to previous tag
#   bash scripts/check-token-breaking-changes.sh v0.1.0       # compare to specific tag
#   bash scripts/check-token-breaking-changes.sh --selftest   # probe table (#435)
#
# FR-015: breaking token name changes must be blocked without a major version bump.
# This script is the manual enforcement mechanism until automated CI is added.
#
# Exit codes:
#   0 — no breaking changes (no tokens removed from the current catalogue)
#   1 — breaking changes detected (tokens present in previous version are missing now)
#   2 — cannot compare (ref does not resolve, or catalogue not generated yet)
set -euo pipefail

CATALOGUE_PATH="packages/tokens/dist/token-catalogue.json"

# ── --selftest: a probe table against real scratch git repos, floor OUTSIDE the table ──────
#
# Same shape as scripts/check-develop-ruleset-parity.mjs's --selftest (expect-pass and
# expect-fail probes, a floor the table cannot silently shrink under) — this script had no
# self-test convention of its own to follow. Each probe runs THIS FILE as a real subprocess
# against a throwaway git repo, so it exercises the actual code path (git resolution, the
# node token-diffing, the exit codes) rather than a reimplementation of it — the #434 mistake
# this mission was warned not to repeat.
if [ "${1:-}" = "--selftest" ]; then
  SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  SCRATCH="$(mktemp -d)"
  trap 'rm -rf "$SCRATCH"' EXIT

  TOTAL=0
  BAD=0

  # probe <name> <expect_exit> <expect_grep|""> <cwd> [args...]
  probe() {
    local name="$1" expect_exit="$2" expect_grep="$3" cwd="$4"
    shift 4
    TOTAL=$((TOTAL + 1))
    local out rc ok=1
    set +e
    out="$(cd "$cwd" && bash "$SELF" "$@" 2>&1)"
    rc=$?
    set -e
    [ "$rc" -eq "$expect_exit" ] || ok=0
    if [ -n "$expect_grep" ] && ! printf '%s\n' "$out" | grep -qF "$expect_grep"; then
      ok=0
    fi
    if [ "$ok" -eq 1 ]; then
      echo "  ✓ [$TOTAL] $name"
    else
      BAD=$((BAD + 1))
      echo "  ✗ [$TOTAL] $name — expected exit $expect_exit${expect_grep:+, output containing '$expect_grep'}; got exit $rc"
      printf '%s\n' "$out" | sed 's/^/      /'
    fi
  }

  write_catalogue() {
    # write_catalogue <path> <token...> — a minimal real catalogue shape, node reads it via
    # Object.values(d.categories).flatMap(c => c.tokens), which this satisfies.
    local path="$1"
    shift
    mkdir -p "$(dirname "$path")"
    local json="" first=1
    for t in "$@"; do
      if [ "$first" -eq 1 ]; then json="\"$t\""; first=0; else json="$json,\"$t\""; fi
    done
    printf '{"categories":{"c":{"tokens":[%s]}}}' "$json" > "$path"
  }

  # ── Repo A: a real tag history, to drive most probes by editing the working tree between
  #    calls (HEAD and tags never move, so "current" can vary freely per probe). ──────────────
  REPO_A="$SCRATCH/repo-a"
  mkdir -p "$REPO_A"
  git -C "$REPO_A" init -q
  git -C "$REPO_A" config user.email selftest@example.invalid
  git -C "$REPO_A" config user.name selftest

  echo "root" > "$REPO_A/README.md"
  git -C "$REPO_A" add README.md
  git -C "$REPO_A" commit -q -m "root (no catalogue yet)"
  git -C "$REPO_A" tag v0.0.0

  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c
  git -C "$REPO_A" add -A
  git -C "$REPO_A" commit -q -m "catalogue: a b c"
  git -C "$REPO_A" tag v0.1.0

  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c d
  git -C "$REPO_A" add -A
  git -C "$REPO_A" commit -q -m "catalogue: a b c d"
  git -C "$REPO_A" tag v0.2.0
  # HEAD is now v0.2.0 = [a b c d]. Everything below edits the WORKING TREE only (uncommitted)
  # to vary "current", exactly like a real PR that has not yet committed its catalogue change.

  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c d e
  probe "auto-detected tag (v0.2.0), addition only -> clean, exit 0" 0 "No tokens removed" "$REPO_A"

  write_catalogue "$REPO_A/$CATALOGUE_PATH" a c d
  probe "auto-detected tag (v0.2.0), 'b' removed -> BREAKING, exit 1" 1 "b" "$REPO_A"

  probe "explicit valid older tag (v0.1.0), 'b' removed -> BREAKING, exit 1" 1 "BREAKING CHANGE" "$REPO_A" v0.1.0

  # THE FIX UNDER TEST: an explicit ref that plain does not resolve — the shape of the #362
  # incident (a SHA/branch a squash merge destroyed). Before the fix this exited 0 ("skipping
  # breaking change check"), a green over zero comparisons; it must now be loud.
  probe "unresolvable explicit ref -> loud 'cannot compare', exit 2 (#362/#434 class)" 2 "Cannot compare" "$REPO_A" "not-a-real-ref-zzz"

  # THE OTHER HALF OF THE SPLIT: a ref that resolves fine, but never had the file — a
  # legitimate, distinct outcome that must NOT share a message with the unresolvable-ref case.
  probe "valid ref, file absent there -> distinct exit 0, 'did not exist'" 0 "did not exist at" "$REPO_A" v0.0.0

  # ── Repo B: no catalogue file at all — regression, unaffected by this fix. ─────────────────
  REPO_B="$SCRATCH/repo-b"
  mkdir -p "$REPO_B"
  git -C "$REPO_B" init -q
  git -C "$REPO_B" config user.email selftest@example.invalid
  git -C "$REPO_B" config user.name selftest
  echo "root" > "$REPO_B/README.md"
  git -C "$REPO_B" add README.md
  git -C "$REPO_B" commit -q -m root
  git -C "$REPO_B" tag v0.1.0
  probe "current catalogue missing entirely -> exit 2 (regression, pre-existing)" 2 "Token catalogue not found" "$REPO_B"

  # ── Repo C: a catalogue exists, but no tag has ever been cut — the documented first-release
  #    case. Regression, unaffected by this fix. ─────────────────────────────────────────────
  REPO_C="$SCRATCH/repo-c"
  mkdir -p "$REPO_C"
  git -C "$REPO_C" init -q
  git -C "$REPO_C" config user.email selftest@example.invalid
  git -C "$REPO_C" config user.name selftest
  write_catalogue "$REPO_C/$CATALOGUE_PATH" a b
  git -C "$REPO_C" add -A
  git -C "$REPO_C" commit -q -m "catalogue: a b"
  probe "no tag exists at all (first release) -> exit 0 (regression, pre-existing)" 0 "No previous tag found" "$REPO_C"

  # Floor OUTSIDE the table (same shape as check-develop-ruleset-parity.mjs's PROBE_FLOOR): a
  # probe count silently shrinking to zero must itself be caught.
  FLOOR=7
  if [ "$TOTAL" -lt "$FLOOR" ]; then
    echo ""
    echo "❌ the probe set has shrunk: $TOTAL probe(s) against a floor of $FLOOR."
    exit 1
  fi

  if [ "$BAD" -gt 0 ]; then
    echo ""
    echo "❌ $BAD of $TOTAL probe(s) did not behave as recorded."
    exit 1
  fi
  echo ""
  echo "✅ All $TOTAL check-token-breaking-changes.sh probes behaved as recorded."
  exit 0
fi

PREVIOUS_REF="${1:-}"

# ── Resolve the reference to compare against ─────────────────────────────────

if [ -z "$PREVIOUS_REF" ]; then
  # No argument: find the most recent tag
  PREVIOUS_REF=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
  if [ -z "$PREVIOUS_REF" ]; then
    echo "⚠  No previous tag found. Cannot detect breaking changes — this may be the first release."
    echo "   Once you create your first tag (e.g. v1.0.0), future runs will compare against it."
    exit 0
  fi
  echo "Comparing against previous tag: $PREVIOUS_REF"
else
  echo "Comparing against: $PREVIOUS_REF"
fi

# ── Check current catalogue exists ───────────────────────────────────────────

if [ ! -f "$CATALOGUE_PATH" ]; then
  echo "❌ Token catalogue not found at $CATALOGUE_PATH."
  echo "   Run: npm run tokens:catalogue"
  exit 2
fi

# ── Confirm the reference actually resolves before dereferencing it ─────────────
#
# #362/#434 class defect: this script used to run `git show REF:PATH` and treat an empty
# result as one thing — "skip, nothing to compare" — no matter WHY it was empty. That
# conflated two outcomes that must not share an exit code:
#   - REF does not resolve to a commit at all (deleted branch, typo, a SHA a squash merge
#     destroyed — the #362 incident's exact shape). This is "cannot compare" and must be
#     loud: exit 2, the code this script's own header already reserves for it.
#   - REF resolves fine, but the file genuinely never existed there (e.g. a tag cut before
#     the token catalogue was introduced). Nothing existed at that ref to remove, so no
#     breaking change is POSSIBLE against it — a legitimate, non-alarming skip.
# The old code could not tell these apart, by its own admission in the message it printed.
if ! REF_SHA=$(git rev-parse --verify --quiet "${PREVIOUS_REF}^{commit}" 2>/dev/null); then
  echo "❌ Cannot compare: '${PREVIOUS_REF}' does not resolve to a commit in this checkout."
  echo "   Either the ref never existed or was a typo, it was deleted (e.g. a mission branch"
  echo "   removed by a squash merge — see #362), or this checkout lacks the history to"
  echo "   resolve it (a shallow clone needs 'fetch-depth: 0' / 'git fetch --tags --unshallow')."
  exit 2
fi

# ── Extract previous catalogue from git history ───────────────────────────────

if ! git cat-file -e "${REF_SHA}:${CATALOGUE_PATH}" 2>/dev/null; then
  echo "ℹ  ${CATALOGUE_PATH} did not exist at ${PREVIOUS_REF} (${REF_SHA})."
  echo "   Nothing existed there to remove, so no breaking change is possible against this ref."
  echo "   Skipping breaking change check."
  exit 0
fi

PREVIOUS_CATALOGUE=$(git show "${REF_SHA}:${CATALOGUE_PATH}")

# ── Extract token names from both versions ────────────────────────────────────

CURRENT_TOKENS=$(node -e "
const d = require('./${CATALOGUE_PATH}');
const tokens = Object.values(d.categories).flatMap(c => c.tokens).sort();
tokens.forEach(t => console.log(t));
")

PREVIOUS_TOKENS=$(node -e "
const d = JSON.parse($(printf '%s' "$PREVIOUS_CATALOGUE" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const s = JSON.stringify(Buffer.concat(chunks).toString());
  console.log(s);
});
"));
const tokens = Object.values(d.categories).flatMap(c => c.tokens).sort();
tokens.forEach(t => console.log(t));
" 2>/dev/null || echo "$PREVIOUS_CATALOGUE" | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const tokens = Object.values(d.categories).flatMap(c => c.tokens).sort();
tokens.forEach(t => console.log(t));
")

# ── Find removed tokens ────────────────────────────────────────────────────────

REMOVED=$(comm -23 \
  <(echo "$PREVIOUS_TOKENS" | sort) \
  <(echo "$CURRENT_TOKENS" | sort))

ADDED=$(comm -13 \
  <(echo "$PREVIOUS_TOKENS" | sort) \
  <(echo "$CURRENT_TOKENS" | sort))

# ── Report ────────────────────────────────────────────────────────────────────

if [ -n "$ADDED" ]; then
  echo "✅ New tokens added (non-breaking):"
  echo "$ADDED" | sed 's/^/   + /'
fi

if [ -z "$REMOVED" ]; then
  echo "✅ No tokens removed — no breaking changes detected."
  exit 0
fi

echo ""
echo "❌ BREAKING CHANGE: the following tokens were removed or renamed:"
echo "$REMOVED" | sed 's/^/   - /'
echo ""
echo "Removed token names constitute a breaking change (ADR-003, FR-015)."
echo "Required action before publishing:"
echo "  1. If this is intentional: bump the major version in all packages."
echo "  2. If this is accidental: restore the removed tokens."
echo "  3. Record the change in CHANGELOG.md and ADR-003 addendum."
exit 1
