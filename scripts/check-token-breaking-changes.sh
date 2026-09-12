#!/usr/bin/env bash
# check-token-breaking-changes.sh — detects removed or renamed --sk-* tokens
# between the current HEAD and the previous git RELEASE tag.
#
# Usage:
#   bash scripts/check-token-breaking-changes.sh              # compare to previous release tag
#   bash scripts/check-token-breaking-changes.sh v0.1.0       # compare to a specific tag/ref
#   bash scripts/check-token-breaking-changes.sh --selftest   # probe table (#435, #438)
#
# FR-015: breaking token name changes must be blocked without a major version bump.
# Automated: wired into the `release-gate` job of ci-quality.yml (#435, #438) — this is no
# longer a manual pre-publish step; see docs/contributing/running-quality-checks.md.
#
# Exit codes:
#   0 — no breaking changes (no tokens removed from the current catalogue), including the
#       legitimate "nothing to compare against yet" cases (first release; ref predates the
#       catalogue's existence)
#   1 — breaking changes detected (tokens present in previous version are missing now)
#   2 — cannot compare: the ref does not resolve, tag reachability is ambiguous (shallow clone,
#       or a release tag exists but is unreachable from HEAD), or a catalogue that should be
#       comparable is not well-formed (unparseable JSON, or a directory where a file belongs)
set -euo pipefail

CATALOGUE_PATH="packages/tokens/dist/token-catalogue.json"
# The SAME glob release.yml's own `push: tags: ['v*.*.*']` trigger uses (#438 F1) — "what counts
# as a release" has exactly one definition in this repo, and this script reuses it rather than
# inventing a second one that can drift from the first.
RELEASE_TAG_GLOB='v*.*.*'

# extract_tokens <file> — prints sorted token names on stdout; on anything that is not a
# well-formed catalogue (unparseable JSON, or a missing/non-object `categories` key), prints a
# one-line diagnostic to stderr and returns non-zero. Shared by --selftest fixtures and the real
# run below, so a probe against it exercises the actual extraction code (#438 F7).
extract_tokens() {
  node -e '
    const fs = require("fs");
    let d;
    try {
      d = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    } catch (e) {
      console.error("not valid JSON: " + e.message);
      process.exit(1);
    }
    if (!d || typeof d !== "object" || typeof d.categories !== "object" || d.categories === null) {
      console.error("missing or non-object \"categories\" key");
      process.exit(1);
    }
    const tokens = Object.values(d.categories)
      .flatMap((c) => (c && Array.isArray(c.tokens) ? c.tokens : []))
      .sort();
    tokens.forEach((t) => console.log(t));
  ' "$1"
}

# ── --selftest: a probe table against real scratch git repos, floored OUTSIDE the table ────
#
# Same shape as scripts/check-develop-ruleset-parity.mjs's --selftest (expect-pass and
# expect-fail probes, a total floor the table cannot silently shrink under, AND a check that
# neither the pass nor the fail population can be silently emptied — #438 F8, ported from that
# same file rather than only checking the total). Each probe runs THIS FILE as a real subprocess
# against a throwaway git repo, so it exercises the actual code path (git resolution, the node
# token-diffing, the exit codes) rather than a reimplementation of it — the #434 mistake this
# mission was warned not to repeat.
if [ "${1:-}" = "--selftest" ]; then
  SELF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  SCRATCH="$(mktemp -d)"
  trap 'rm -rf "$SCRATCH"' EXIT

  TOTAL=0
  BAD=0
  PASS_KIND_COUNT=0
  FAIL_KIND_COUNT=0

  # probe <name> <expect_exit> <expect_grep|""> <cwd> [args...]
  # "expect_exit 0" is the PASS kind (clean/legitimate-skip); any non-zero is the FAIL kind (a
  # real violation caught, or a refusal). Classified by expectation, not by whether the probe
  # itself behaved as recorded — #438 F8's table-composition floor needs the EXPECTED shape.
  #
  # #438 F6: a plain substring grep for a single removed-token LETTER (e.g. "b") also matches the
  # boilerplate sentence printed on every failure ("...constitute a BREAKING change..."), so a
  # mutant that renders the WRONG token name stays green as long as that word contains the same
  # letter somewhere. An `expect_grep` prefixed with `EXACT:` is matched as a whole LINE
  # (`grep -qxF`) against the RENDERED "   - <token>" line instead of a loose substring.
  probe() {
    local name="$1" expect_exit="$2" expect_grep="$3" cwd="$4"
    shift 4
    TOTAL=$((TOTAL + 1))
    if [ "$expect_exit" -eq 0 ]; then PASS_KIND_COUNT=$((PASS_KIND_COUNT + 1)); else FAIL_KIND_COUNT=$((FAIL_KIND_COUNT + 1)); fi
    local out rc ok=1
    set +e
    out="$(cd "$cwd" && bash "$SELF" "$@" 2>&1)"
    rc=$?
    set -e
    [ "$rc" -eq "$expect_exit" ] || ok=0
    if [ -n "$expect_grep" ]; then
      case "$expect_grep" in
        EXACT:*)
          printf '%s\n' "$out" | grep -qxF "${expect_grep#EXACT:}" || ok=0
          ;;
        *)
          printf '%s\n' "$out" | grep -qF "$expect_grep" || ok=0
          ;;
      esac
    fi
    if [ "$ok" -eq 1 ]; then
      echo "  ✓ [$TOTAL] $name"
    else
      BAD=$((BAD + 1))
      echo "  ✗ [$TOTAL] $name — expected exit $expect_exit${expect_grep:+, output matching '$expect_grep'}; got exit $rc"
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

  new_repo() {
    # new_repo <path> — an empty git repo with a deterministic identity and gpgsign OFF (#438
    # F9): a machine with `commit.gpgsign` set globally would otherwise abort every commit below
    # trying to sign with a key/agent that has nothing to do with this probe table.
    mkdir -p "$1"
    git -C "$1" init -q
    git -C "$1" config user.email selftest@example.invalid
    git -C "$1" config user.name selftest
    git -C "$1" config commit.gpgsign false
  }

  # ── Repo A: a tag history mirroring the real shape (#438 F1) — a true release tag one commit
  #    behind HEAD, and a NON-release "landing marker" tag (mirroring parity-anchor/relN) sitting
  #    exactly AT HEAD, whose own commit already carries a regression. ───────────────────────────
  REPO_A="$SCRATCH/repo-a"
  new_repo "$REPO_A"

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
  # v0.2.0 = [a b c d] is the TRUE last release, one commit behind what follows.

  write_catalogue "$REPO_A/$CATALOGUE_PATH" a c d
  git -C "$REPO_A" add -A
  git -C "$REPO_A" commit -q -m "catalogue: a c d (b silently dropped in this commit)"
  git -C "$REPO_A" tag landing-marker/rel1
  # HEAD is now this commit: [a c d], with a NON-release tag AT distance 0 and the real release
  # tag ONE commit back. Everything below this point edits the WORKING TREE only (uncommitted),
  # exactly like a real PR that has not yet committed its catalogue change.

  # THE FIX UNDER TEST (F1). No uncommitted edits: current == HEAD's own committed catalogue.
  # Pre-fix (`git describe --tags --abbrev=0`, no --match): the NEAREST tag is `landing-marker/
  # rel1`, at distance 0 — comparing current to a snapshot of ITSELF, forever "no tokens removed"
  # no matter what HEAD's own commit did. Post-fix (`--match 'v*.*.*'`): the search is restricted
  # to release tags, correctly landing on v0.2.0 one commit back, and 'b' — dropped in HEAD's own
  # commit — is caught.
  probe "F1: auto-detect ignores the nearer non-release tag, compares against v0.2.0 -> catches the regression HEAD's own commit made" 1 "previous release tag: v0.2.0" "$REPO_A"
  probe "F1 (F6 exact line): the rendered removal names 'b' precisely, not just the boilerplate" 1 "EXACT:   - b" "$REPO_A"

  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c d e
  probe "auto-detect (v0.2.0), working tree restores 'b' and adds 'e' -> clean, exit 0" 0 "No tokens removed" "$REPO_A"

  write_catalogue "$REPO_A/$CATALOGUE_PATH" a c d e
  probe "explicit valid older tag (v0.1.0), 'b' still missing -> BREAKING, exit 1" 1 "EXACT:   - b" "$REPO_A" v0.1.0

  # F5: the `^{commit}` peel is what makes an unresolvable-as-commit ref (here, a TREE object)
  # refuse rather than silently treat it as if `git show` had simply found nothing. Dropping
  # `^{commit}` from the resolution check reopens exactly this: `v0.2.0^{tree}` would otherwise
  # resolve fine (git show accepts a tree-ish target), and comparison would proceed against the
  # wrong kind of object.
  probe "F5: a tree-ish ref (v0.2.0^{tree}) is refused, not silently accepted -> exit 2" 2 "Cannot compare" "$REPO_A" "v0.2.0^{tree}"

  # THE #362/#434-CLASS FIX ITSELF: an explicit ref that plain does not resolve. Before the fix
  # this exited 0 ("skipping breaking change check"), a green over zero comparisons.
  probe "the #362/#434 class fix: unresolvable explicit ref -> loud 'Cannot compare', exit 2" 2 "Cannot compare" "$REPO_A" "not-a-real-ref-zzz"

  # THE OTHER HALF OF THAT SPLIT: a ref that resolves fine but never had the file — legitimate,
  # distinct, must not share a message with the unresolvable-ref case.
  probe "valid ref, file absent there -> distinct exit 0, 'did not exist'" 0 "did not exist at" "$REPO_A" v0.0.0

  # ── F7: parse-guards on both sides. All committed on a NON-release tag/branch so they cannot
  #    accidentally become the auto-detected release tag in any of the probes above. ────────────
  printf 'not valid json {' > "$REPO_A/$CATALOGUE_PATH"
  git -C "$REPO_A" add -A
  git -C "$REPO_A" commit -q -m "bad catalogue: unparseable JSON"
  git -C "$REPO_A" tag bad-catalogue/unparseable
  probe "F7: previous ref's catalogue is unparseable JSON -> exit 2, not a bare node crash" 2 "not a well-formed catalogue" "$REPO_A" bad-catalogue/unparseable

  git -C "$REPO_A" rm -rq "$CATALOGUE_PATH" > /dev/null
  mkdir -p "$REPO_A/$CATALOGUE_PATH"
  echo "oops" > "$REPO_A/$CATALOGUE_PATH/not-a-catalogue.txt"
  git -C "$REPO_A" add -A
  git -C "$REPO_A" commit -q -m "bad catalogue: a directory sits where the file belongs"
  git -C "$REPO_A" tag bad-catalogue/is-a-directory
  git -C "$REPO_A" rm -rqf "$CATALOGUE_PATH" > /dev/null
  git -C "$REPO_A" commit -q -m "restore catalogue directory removal"
  rm -rf "${REPO_A:?}/${CATALOGUE_PATH:?}"   # git rm leaves the now-empty directory on disk
  # Restore CURRENT to a normal, valid file BEFORE probing: this probe is about the PREVIOUS
  # ref's tree shape, not the current one, and the earlier "-f" existence check would otherwise
  # intercept it first with an unrelated message.
  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c d e
  probe "F7: previous ref's catalogue path is a directory, not a file -> exit 2, distinct from 'did not exist'" 2 "not a file" "$REPO_A" bad-catalogue/is-a-directory

  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b
  printf 'not valid json either' > "$REPO_A/$CATALOGUE_PATH"
  probe "F7: the CURRENT catalogue on disk is unparseable -> exit 2, not exit 1" 2 "CURRENT catalogue" "$REPO_A" v0.1.0
  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c d e

  # ── Repo B: no catalogue file at all — regression, unaffected by this fix. ─────────────────
  REPO_B="$SCRATCH/repo-b"
  new_repo "$REPO_B"
  echo "root" > "$REPO_B/README.md"
  git -C "$REPO_B" add README.md
  git -C "$REPO_B" commit -q -m root
  git -C "$REPO_B" tag v0.1.0
  probe "current catalogue missing entirely -> exit 2 (regression, pre-existing)" 2 "Token catalogue not found" "$REPO_B"

  # ── Repo C: a catalogue exists, but no release tag has ever been cut anywhere — the documented
  #    first-release case. Regression, unaffected by this fix. ───────────────────────────────────
  REPO_C="$SCRATCH/repo-c"
  new_repo "$REPO_C"
  write_catalogue "$REPO_C/$CATALOGUE_PATH" a b
  git -C "$REPO_C" add -A
  git -C "$REPO_C" commit -q -m "catalogue: a b"
  probe "no release tag exists at all (first release) -> exit 0 (regression, pre-existing)" 0 "No 'v*.*.*' release tag found" "$REPO_C"

  # ── F2a: a genuinely shallow clone. Tags are not fetched at all, `is-shallow-repository` is
  #    true, and the pre-fold code read that as "first release" over a real, truncated history.
  REPO_D_SRC="$SCRATCH/repo-d-src"
  new_repo "$REPO_D_SRC"
  write_catalogue "$REPO_D_SRC/$CATALOGUE_PATH" a b
  git -C "$REPO_D_SRC" add -A
  git -C "$REPO_D_SRC" commit -q -m "catalogue: a b"
  git -C "$REPO_D_SRC" tag v0.1.0
  echo more >> "$REPO_D_SRC/README.md"
  git -C "$REPO_D_SRC" add -A
  git -C "$REPO_D_SRC" commit -q -m "second commit, one past the tag"
  REPO_D="$SCRATCH/repo-d-shallow"
  git clone --depth 1 -q "file://$REPO_D_SRC" "$REPO_D"
  git -C "$REPO_D" config commit.gpgsign false
  probe "F2a: a shallow clone refuses rather than reporting 'first release' -> exit 2" 2 "SHALLOW clone" "$REPO_D"

  # ── F2b: a release tag exists SOMEWHERE in the repo (on an orphan history) but is unreachable
  #    from HEAD — a full, non-shallow clone can still hit this (a detached/rebased checkout).
  REPO_E="$SCRATCH/repo-e"
  new_repo "$REPO_E"
  write_catalogue "$REPO_E/$CATALOGUE_PATH" a b
  git -C "$REPO_E" add -A
  git -C "$REPO_E" commit -q -m "catalogue: a b"
  git -C "$REPO_E" tag v0.1.0
  git -C "$REPO_E" checkout -q --orphan other
  git -C "$REPO_E" rm -rqf . > /dev/null
  write_catalogue "$REPO_E/$CATALOGUE_PATH" a
  git -C "$REPO_E" add -A
  git -C "$REPO_E" commit -q -m "unrelated orphan history"
  probe "F2b: a release tag exists but is unreachable from HEAD -> exit 2, not 'first release'" 2 "not reachable" "$REPO_E"

  # Total floor OUTSIDE the table (same shape as check-develop-ruleset-parity.mjs's PROBE_FLOOR):
  # a probe count silently shrinking must itself be caught.
  FLOOR=14
  if [ "$TOTAL" -lt "$FLOOR" ]; then
    echo ""
    echo "❌ the probe set has shrunk: $TOTAL probe(s) against a floor of $FLOOR."
    exit 1
  fi

  # #438 F8: the total floor alone lets a must-catch (expect-fail) row be swapped for a
  # must-pass row with the same total — including the single probe covering the #362-class fix.
  # Ported from check-develop-ruleset-parity.mjs: refuse to report green over a degenerate split.
  if [ "$PASS_KIND_COUNT" -eq 0 ] || [ "$FAIL_KIND_COUNT" -eq 0 ]; then
    echo ""
    echo "❌ refusing to report green over a degenerate probe set: $PASS_KIND_COUNT expect-pass, $FAIL_KIND_COUNT expect-fail."
    exit 1
  fi

  if [ "$BAD" -gt 0 ]; then
    echo ""
    echo "❌ $BAD of $TOTAL probe(s) did not behave as recorded."
    exit 1
  fi
  echo ""
  echo "✅ All $TOTAL check-token-breaking-changes.sh probes behaved as recorded ($PASS_KIND_COUNT expect-pass, $FAIL_KIND_COUNT expect-fail)."
  exit 0
fi

PREVIOUS_REF="${1:-}"

# ── Resolve the reference to compare against ─────────────────────────────────

if [ -z "$PREVIOUS_REF" ]; then
  # No argument: find the most recent RELEASE tag. #438 F1: `--abbrev=0` alone returns the
  # NEAREST reachable tag by commit distance, not the most recent release — on this repo that is
  # `parity-anchor/rel1` (3 commits away) rather than `v1.0.0` (2065 commits away), and
  # docs/release-runbook.md mints a fresh `parity-anchor/relN` at EVERY main-landing commit, so
  # after landing this would permanently resolve to a tag sitting AT HEAD — comparing HEAD
  # against itself, forever. `--match` restricts the search to release tags only, using the SAME
  # glob release.yml's own `push: tags:` trigger uses.
  PREVIOUS_REF=$(git describe --tags --abbrev=0 --match "$RELEASE_TAG_GLOB" 2>/dev/null || echo "")
  if [ -z "$PREVIOUS_REF" ]; then
    # #438 F2: "no reachable release tag" has two very different causes, and only one of them is
    # safe to treat as "first release, exit 0". A shallow clone (or a checkout where a release
    # tag exists but its connecting history was never fetched) can make a real release tag
    # UNREACHABLE without it being absent. `release-gate`'s checkout carries `fetch-depth: 0`
    # (asserted by check-gate-wiring.mjs) precisely so this branch is never hit there — but this
    # script must not depend on that alone; if that one line is ever dropped, it must refuse
    # rather than silently report "first release" over real, truncated history.
    IS_SHALLOW="$(git rev-parse --is-shallow-repository 2>/dev/null || echo "false")"
    ANY_RELEASE_TAG="$(git tag --list "$RELEASE_TAG_GLOB" | head -1)"
    if [ "$IS_SHALLOW" = "true" ] || [ -n "$ANY_RELEASE_TAG" ]; then
      echo "❌ Cannot compare: no '$RELEASE_TAG_GLOB' release tag is reachable from HEAD."
      if [ "$IS_SHALLOW" = "true" ]; then
        echo "   This checkout is a SHALLOW clone — history is truncated, so tag reachability"
        echo "   cannot be computed even though a release tag may exist. 'release-gate' must"
        echo "   carry 'fetch-depth: 0'; locally, run 'git fetch --tags --unshallow'."
      else
        echo "   A release tag exists in this repository ($ANY_RELEASE_TAG) but is not reachable"
        echo "   from HEAD — verify this checkout's branch and history."
      fi
      exit 2
    fi
    echo "⚠  No '$RELEASE_TAG_GLOB' release tag found anywhere in this repository. Cannot detect"
    echo "   breaking changes — this may genuinely be the first release."
    echo "   Once you create your first tag (e.g. v1.0.0), future runs will compare against it."
    exit 0
  fi
  echo "Comparing against previous release tag: $PREVIOUS_REF"
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
#     destroyed — the #362 incident's exact shape — or, #438 F5, a tree-ish/blob-ish ref that
#     cannot dereference to a commit). This is "cannot compare" and must be loud: exit 2, the
#     code this script's own header already reserves for it.
#   - REF resolves fine, but the file genuinely never existed there (e.g. a tag cut before
#     the token catalogue was introduced). Nothing existed at that ref to remove, so no
#     breaking change is POSSIBLE against it — a legitimate, non-alarming skip.
# The old code could not tell these apart, by its own admission in the message it printed.
if ! REF_SHA=$(git rev-parse --verify --quiet "${PREVIOUS_REF}^{commit}" 2>/dev/null); then
  echo "❌ Cannot compare: '${PREVIOUS_REF}' does not resolve to a commit in this checkout."
  echo "   Either the ref never existed or was a typo, it does not dereference to a commit (a"
  echo "   tree/blob-ish ref), it was deleted (e.g. a mission branch removed by a squash merge —"
  echo "   see #362), or this checkout lacks the history to resolve it (a shallow clone needs"
  echo "   'fetch-depth: 0' / 'git fetch --tags --unshallow')."
  exit 2
fi

# ── Extract previous catalogue from git history, parse-guarded (#438 F7) ───────

PREVIOUS_KIND="$(git cat-file -t "${REF_SHA}:${CATALOGUE_PATH}" 2>/dev/null || echo "")"
if [ -z "$PREVIOUS_KIND" ]; then
  echo "ℹ  ${CATALOGUE_PATH} did not exist at ${PREVIOUS_REF} (${REF_SHA})."
  echo "   Nothing existed there to remove, so no breaking change is possible against this ref."
  echo "   Skipping breaking change check."
  exit 0
fi
if [ "$PREVIOUS_KIND" != "blob" ]; then
  echo "❌ Cannot compare: ${CATALOGUE_PATH} at ${PREVIOUS_REF} (${REF_SHA}) is a git '${PREVIOUS_KIND}',"
  echo "   not a file. This is a structural anomaly, not a legitimate absence — refusing rather"
  echo "   than silently treating it as either 'no breaking changes' or 'file did not exist'."
  exit 2
fi

PREVIOUS_TMP="$(mktemp)"
trap 'rm -f "$PREVIOUS_TMP"' EXIT
git show "${REF_SHA}:${CATALOGUE_PATH}" > "$PREVIOUS_TMP"

# ── Extract token names from both versions, parse-guarded on both sides ────────

if ! CURRENT_TOKENS=$(extract_tokens "$CATALOGUE_PATH" 2>&1); then
  echo "❌ Cannot compare: the CURRENT catalogue at ${CATALOGUE_PATH} is not a well-formed catalogue."
  echo "$CURRENT_TOKENS" | sed 's/^/   /'
  exit 2
fi

if ! PREVIOUS_TOKENS=$(extract_tokens "$PREVIOUS_TMP" 2>&1); then
  echo "❌ Cannot compare: the catalogue at ${PREVIOUS_REF} (${REF_SHA}) is not a well-formed catalogue."
  echo "$PREVIOUS_TOKENS" | sed 's/^/   /'
  exit 2
fi

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
