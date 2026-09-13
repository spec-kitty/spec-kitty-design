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
#
# #438 pass 2, finding F: `typeof [] === "object"` in JavaScript, so `categories: []` (and, via
# `Object.values`, `categories: {}`) both satisfied the ORIGINAL `typeof !== "object"` guard and
# silently extracted zero tokens. `Array.isArray` is now checked explicitly on both `d` and
# `d.categories`, and the CALL SITES below refuse an empty result outright — the generator itself
# refuses to WRITE a zero-token catalogue (see its own `tokenCount === 0` check), so a hand-edited
# or foreign catalogue that has none is not a legitimate empty state to compare against.
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
    if (!d || typeof d !== "object" || Array.isArray(d) || typeof d.categories !== "object" || d.categories === null || Array.isArray(d.categories)) {
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
  # #438 pass 4 (architect + debugger lenses). The assertion logic is now a PURE function, for two
  # measured reasons.
  #
  # (a) The old inline form was `printf '%s\n' "$out" | grep -q …` under this file's own
  #     `set -o pipefail` — the exact SIGPIPE-under-pipefail shape this script condemns at the
  #     `for-each-ref` site below. `grep -q` exits on first match, the writer gets SIGPIPE,
  #     pipefail surfaces 141, and `|| ok=0` converts a PASSING probe into a false red. Measured:
  #     1.6 MB of output with a first-line match -> pipeline status 141; last-line match -> 0;
  #     small input -> 0. No shipped probe is big enough to trip it today, which is exactly why it
  #     would have survived. A herestring redirects from a temp file, not a pipe, so it cannot
  #     SIGPIPE at all.
  #
  # (b) The whole assertion block could be replaced with `if false; then` and the suite still
  #     reported 18/18 green — re-opening the very mutant this file exists to kill. A pure
  #     function can be meta-probed with known-good and known-bad inputs; an inline block cannot.
  #
  # Matchers: EXACT: whole line, fixed string · EXACTRE: whole line, ERE — lets a probe pin the
  # RENDERING without pinning a value git chose for us · MAXLINES:n output is at most n lines ·
  # anything else, loose substring.
  # Counts its own invocations. Pass 5, debugger lens: `assert_probe` was meta-probed eleven ways,
  # but NOTHING asserted that `probe()` ever calls it — deleting the single call site left all 19
  # probes reporting green while the real gate returned exit 0 over a genuinely removed token. A
  # correct assertion that is never reached is the same defect as a wrong one, one level up. The
  # ASSERT_CALLS == TOTAL invariant below closes it: the counter lives INSIDE this function, so
  # removing the call stops the count.
  ASSERT_CALLS=0
  PROBE_NAMES=""
  assert_probe() {
    local rc="$1" expect_exit="$2" expect_grep="$3" out="$4" ok=1
    ASSERT_CALLS=$((ASSERT_CALLS + 1))
    [ "$rc" -eq "$expect_exit" ] || ok=0
    if [ -n "$expect_grep" ]; then
      case "$expect_grep" in
        EXACT:*)    grep -qxF "${expect_grep#EXACT:}" <<< "$out" || ok=0 ;;
        EXACTRE:*)  grep -qxE "${expect_grep#EXACTRE:}" <<< "$out" || ok=0 ;;
        MAXLINES:*) [ "$(wc -l <<< "$out")" -le "${expect_grep#MAXLINES:}" ] || ok=0 ;;
        *)          grep -qF "$expect_grep" <<< "$out" || ok=0 ;;
      esac
    fi
    [ "$ok" -eq 1 ]
  }

  probe() {
    local name="$1" expect_exit="$2" expect_grep="$3" cwd="$4"
    shift 4
    TOTAL=$((TOTAL + 1))
    PROBE_NAMES="$PROBE_NAMES
$name"
    if [ "$expect_exit" -eq 0 ]; then PASS_KIND_COUNT=$((PASS_KIND_COUNT + 1)); else FAIL_KIND_COUNT=$((FAIL_KIND_COUNT + 1)); fi
    local out rc ok=1
    set +e
    out="$(cd "$cwd" && bash "$SELF" "$@" 2>&1)"
    rc=$?
    set -e
    assert_probe "$rc" "$expect_exit" "$expect_grep" "$out" || ok=0
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

  # ── Finding F (#438 pass 2), TWO INDEPENDENT MECHANISMS. `typeof [] === "object"` in JS, so
  #    `categories: []` slipped past the ORIGINAL type check entirely (fixed with Array.isArray,
  #    below) — but `categories: {}` (a genuinely empty plain object) is not an array and still
  #    extracts zero tokens, needing the SEPARATE floor on the extracted result. Both, on a
  #    non-release tag/branch, same reason as the F7 fixtures above. ─────────────────────────────
  printf '{"categories":[]}' > "$REPO_A/$CATALOGUE_PATH"
  git -C "$REPO_A" add -A
  git -C "$REPO_A" commit -q -m "bad catalogue: categories is an array, zero tokens"
  git -C "$REPO_A" tag bad-catalogue/empty-array-categories
  probe "F: previous ref's categories:[] -> the Array.isArray type-check rejects it, exit 2" 2 "not a well-formed catalogue" "$REPO_A" bad-catalogue/empty-array-categories
  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c d e

  printf '{"categories":{"c":{"tokens":[]}}}' > "$REPO_A/$CATALOGUE_PATH"
  probe "F: the CURRENT catalogue's categories is a well-formed object with zero tokens -> the FLOOR rejects it, exit 2" 2 "contains zero tokens" "$REPO_A" v0.1.0
  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c d e

  # ── #438 pass 2, finding F (other half): the CURRENT-side floor above has a probe; the
  #    PREVIOUS-side floor (below, at the `PREVIOUS_TOKENS` check) did not — a release tag whose
  #    catalogue is a well-formed object with zero tokens compared against a real CURRENT
  #    catalogue fell through to "No tokens removed", exit 0: the exact fail-open shape this
  #    script exists to close, just on the other side of the diff. CURRENT is restored to a
  #    normal catalogue first so the CURRENT-side check above does not intercept this first.
  printf '{"categories":{"c":{"tokens":[]}}}' > "$REPO_A/$CATALOGUE_PATH"
  git -C "$REPO_A" add -A
  git -C "$REPO_A" commit -q -m "bad catalogue: PREVIOUS side has zero tokens"
  git -C "$REPO_A" tag bad-catalogue/previous-zero-tokens
  write_catalogue "$REPO_A/$CATALOGUE_PATH" a b c d e
  probe "F (previous side): the ref's catalogue is well-formed with zero tokens -> the FLOOR rejects it, exit 2" 2 "the catalogue at" "$REPO_A" bad-catalogue/previous-zero-tokens

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

  # ── #438 pass 2, finding D: reproduce the SIGPIPE-under-`pipefail` defect this fix closes,
  #    against the ACTUAL vulnerable shape (an unreachable-from-HEAD release tag — the same
  #    branch F2b probes above), at a scale that reproduces the defect. A handful of unreachable
  #    tags is not enough: the pre-fix `git tag --list "$GLOB" | head -1` only SIGPIPEs when
  #    `head -1` closes the pipe's read end before `git` finishes writing all matching refs, which
  #    needs enough output to exceed the pipe buffer. MEASURED (pass 4, reducer lens, 10 runs per
  #    scale against the pre-fix shape): 20,000 tags -> 10/10, 2,000 -> 10/10, 500 -> intermittent
  #    (~50-70%: separate runs gave 7/10, 5/10 and 24/40 — it is a race, not a stable figure); the
  #    post-fix `for-each-ref --count=1` is 0/10 at every scale. An earlier revision of this
  #    comment claimed "fewer did not reproduce reliably", which was false — 2,000 reproduces just
  #    as consistently. The probe stays at 20,000 anyway: the whole 19-probe table runs in ~1.6 s,
  #    so the margin costs nothing and buys headroom against a smaller pipe buffer elsewhere.
  #    Built with `git update-ref --stdin` against one throwaway
  #    orphan commit (sub-second, so this stays cheap enough for CI) rather than 20,000 individual
  #    `git tag` invocations. On the reverted code this probe is RED: the script aborts with exit
  #    141, not the exit 2 this asserts — a silent crash inside the branch whose entire job is to
  #    refuse LOUDLY. `for-each-ref --count=1` needs no pipe at all, so it cannot SIGPIPE here.
  REPO_F="$SCRATCH/repo-f-sigpipe"
  new_repo "$REPO_F"
  echo "root" > "$REPO_F/README.md"
  git -C "$REPO_F" add README.md
  git -C "$REPO_F" commit -q -m "root, no reachable release tag"
  ORPHAN_SHA="$(git -C "$REPO_F" commit-tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904 -m "unreachable orphan carrying the release tags")"
  { for i in $(seq 1 20000); do printf 'create refs/tags/v%d.0.0 %s\n' "$i" "$ORPHAN_SHA"; done; } | git -C "$REPO_F" update-ref --stdin
  #    Pass 4: asserts the rendered line as a whole LINE, not the substring 'not reachable'. With
  #    only the loose substring, dropping `--count=1` survived: the mutant still exits 2 and still
  #    says "not reachable", it just interpolates all 20,000 tag names across 20,002 lines.
  #
  #    Two corrections from the pass-4 gate. (1) The tag name is a PATTERN, not the literal
  #    `v1.0.0`. `v1.0.0` is genuinely deterministic — `for-each-ref` sorts by refname, '.' (0x2E)
  #    < '0' (0x30), and hostile config (`tag.sort=version:refname`, `versionsort.suffix`) does not
  #    move it, because `tag.sort` governs `git tag -l` and not `for-each-ref`. But determinism was
  #    never the objection: pinning the literal couples this probe to git's COLLATION, so a
  #    behaviour-neutral improvement (say `--sort=version:refname`, to report the newest release
  #    tag) would red it for a reason unrelated to SIGPIPE or legibility. The pattern pins the
  #    rendering — one line, right shape, right sentence — and leaves the choice of tag free.
  #    (2) `EXACT:`/`EXACTRE:` assert only that SOME line matches; neither bounds output size, so
  #    the probe's own name ("ONE legible line") was a claim it did not make. A mutant keeping
  #    `--count=1` while dumping the tag list on another line satisfied it. The MAXLINES probe
  #    below is what actually holds the legibility half.
  probe "D: ~20,000 unreachable release tags don't SIGPIPE the lookup -> exit 2, and the refusal names ONE tag (not a silent 141)" 2 "EXACTRE:   A release tag exists in this repository \(v[0-9]+\.[0-9]+\.[0-9]+\) but is not reachable" "$REPO_F"
  #    MAXLINES is 6 against a MEASURED 3: the real refusal is exactly three lines (the headline,
  #    the named tag, and the "verify this checkout" line). 6 leaves room for one more explanatory
  #    line without permitting a tag dump. An earlier revision used 12, which was 4x the measured
  #    value and left nine lines a mutant could hide in (pass 5, reviewer lens).
  probe "D2: that same refusal stays LEGIBLE -> the whole output is a handful of lines, not 20,000 tag names" 2 "MAXLINES:6" "$REPO_F"

  # ── Meta-probes: assert_probe itself (#438 pass 4, debugger lens finding 2) ──────────────────
  # Neutering the assertion block (`if [ -n "$expect_grep" ]` -> `if false`, or blanking the
  # EXACT: arm, or dropping the exit-code comparison) left all 18 probes reporting green — which
  # re-opens every mutant the table is supposed to catch. Probes assert the SCRIPT; these assert
  # the thing that asserts. Known-good and known-bad inputs, driven directly, no subprocess.
  META_TOTAL=0
  META_BAD=0
  meta() {
    local name="$1" expect="$2"
    shift 2
    META_TOTAL=$((META_TOTAL + 1))
    local got=ok
    assert_probe "$@" || got=fail
    if [ "$got" = "$expect" ]; then
      echo "  ✓ [meta] $name"
    else
      META_BAD=$((META_BAD + 1))
      echo "  ✗ [meta] $name — expected assert_probe to report '$expect', got '$got'"
    fi
  }
  meta "matching exit + matching EXACT whole line -> ok"          ok   0 0 "EXACT:hello"     "hello"
  meta "exit code differs -> fail"                                 fail 1 0 ""                "hello"
  meta "EXACT line absent -> fail"                                 fail 0 0 "EXACT:nope"      "hello"
  meta "EXACT is a WHOLE-line match, not a substring -> fail"      fail 0 0 "EXACT:hell"      "hello"
  meta "EXACT finds its line among several -> ok"                  ok   0 0 "EXACT:b"         $'a\nb\nc'
  meta "EXACTRE matches a whole line by pattern -> ok"             ok   0 0 "EXACTRE:h.llo"   "hello"
  meta "EXACTRE is anchored: a partial-line pattern -> fail"       fail 0 0 "EXACTRE:h.l"     "hello"
  meta "MAXLINES satisfied -> ok"                                  ok   0 0 "MAXLINES:2"      $'a\nb'
  meta "MAXLINES exceeded -> fail"                                 fail 0 0 "MAXLINES:2"      $'a\nb\nc'
  meta "loose substring present -> ok"                             ok   0 0 "ell"             "hello"
  meta "loose substring absent -> fail"                            fail 0 0 "zzz"             "hello"
  META_FLOOR=11
  if [ "$META_TOTAL" -lt "$META_FLOOR" ] || [ "$META_BAD" -gt 0 ]; then
    echo ""
    echo "❌ assert_probe meta-probes: $META_BAD of $META_TOTAL failed (floor $META_FLOOR) — the"
    echo "   probe harness's own assertions are not trustworthy, so the table above proves nothing."
    exit 1
  fi

  # Every probe must actually have run its assertions (pass 5, debugger lens — see assert_probe).
  # Both callers count: the table calls assert_probe once per probe, and meta() once per meta-row,
  # so the invariant is TOTAL + META_TOTAL. (Written as bare TOTAL first, which reds on correct
  # code — a guard that fires on a healthy tree is worse than none, and the baseline caught it.)
  EXPECTED_ASSERT_CALLS=$((TOTAL + META_TOTAL))
  if [ "$ASSERT_CALLS" -ne "$EXPECTED_ASSERT_CALLS" ]; then
    echo ""
    echo "❌ $TOTAL probe(s) and $META_TOTAL meta-probe(s) ran, but assert_probe was called"
    echo "   $ASSERT_CALLS time(s) instead of $EXPECTED_ASSERT_CALLS — results are being reported"
    echo "   without being asserted. Every ✓ above is meaningless."
    exit 1
  fi

  # ── Branch coverage: the shell analogue of VERDICT_KINDS / REQUIRED_CAUSES ───────────────────
  # Pass 5, reviewer lens: the total floor and the pass/fail split both survive swapping probes D
  # and D2 for filler expect-fail probes — TOTAL stays 19, the split stays non-degenerate, and the
  # ENTIRE #438 SIGPIPE fix can then be reverted with the suite reporting "All 19 ... behaved as
  # recorded". Counting probes never protected any particular refusal branch. This does.
  REQUIRED_BRANCHES="SIGPIPE
LEGIBLE
shallow clone
unreachable from HEAD
zero tokens
categories:\[\]"
  MISSING_BRANCHES=""
  while IFS= read -r branch; do
    [ -n "$branch" ] || continue
    printf '%s\n' "$PROBE_NAMES" | grep -qE "$branch" || MISSING_BRANCHES="$MISSING_BRANCHES $branch;"
  done <<< "$REQUIRED_BRANCHES"
  if [ -n "$MISSING_BRANCHES" ]; then
    echo ""
    echo "❌ refusing to report green: no probe covers refusal branch(es):$MISSING_BRANCHES"
    exit 1
  fi

  # Total floor OUTSIDE the table (same shape as check-develop-ruleset-parity.mjs's PROBE_FLOOR):
  # a probe count silently shrinking must itself be caught.
  PROBE_FLOOR=19
  if [ "$TOTAL" -lt "$PROBE_FLOOR" ]; then
    echo ""
    echo "❌ the probe set has shrunk: $TOTAL probe(s) against a floor of $PROBE_FLOOR."
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
    # #438 pass 2, finding D: NOT `git tag --list "$GLOB" | head -1`. Under `set -o pipefail`,
    # `head -1` closes the pipe after its first line; on a repo with enough matching tags, `git`
    # gets SIGPIPE writing the rest and exits 141, which `pipefail` propagates as THIS SCRIPT's
    # exit code — a silent, undocumented abort inside the exact branch meant to refuse LOUDLY.
    # Reproduced locally with 2000 tags. `for-each-ref --count=1` needs no pipe at all: git itself
    # stops after the first match.
    ANY_RELEASE_TAG="$(git for-each-ref --count=1 --format='%(refname:short)' "refs/tags/$RELEASE_TAG_GLOB" 2>/dev/null || echo "")"
    if [ "$IS_SHALLOW" = "true" ] || [ -n "$ANY_RELEASE_TAG" ]; then
      echo "❌ Cannot compare: no '$RELEASE_TAG_GLOB' release tag is reachable from HEAD."
      if [ "$IS_SHALLOW" = "true" ]; then
        # Deliberately NOT "a release tag may exist" as if that were the likely case: a shallow
        # clone gives no evidence either way, so asserting a direction here would be a guess this
        # script does not have (a lens caught an earlier draft implying "probably a real release
        # tag" when the honest answer is "cannot tell").
        echo "   This checkout is a SHALLOW clone — history is truncated, so tag reachability"
        echo "   cannot be computed. This could genuinely be the first release, or a real"
        echo "   release tag could exist that this checkout simply cannot see; a shallow clone"
        echo "   cannot tell the two apart, so this refuses rather than guessing either way."
        echo "   'release-gate' must carry 'fetch-depth: 0'; locally, run"
        echo "   'git fetch --tags --unshallow' to get a real answer."
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
# #438 pass 2, finding F: a floor OUTSIDE extract_tokens itself — an empty result is a legitimate
# JS value (`[]`), not an error extract_tokens can refuse on its own, so it must be refused here.
if [ -z "$CURRENT_TOKENS" ]; then
  echo "❌ Cannot compare: the CURRENT catalogue at ${CATALOGUE_PATH} contains zero tokens."
  echo "   scripts/generate-token-catalogue.js itself refuses to WRITE a zero-token catalogue —"
  echo "   this looks hand-edited or foreign, not a legitimate empty state."
  exit 2
fi

if ! PREVIOUS_TOKENS=$(extract_tokens "$PREVIOUS_TMP" 2>&1); then
  echo "❌ Cannot compare: the catalogue at ${PREVIOUS_REF} (${REF_SHA}) is not a well-formed catalogue."
  echo "$PREVIOUS_TOKENS" | sed 's/^/   /'
  exit 2
fi
if [ -z "$PREVIOUS_TOKENS" ]; then
  echo "❌ Cannot compare: the catalogue at ${PREVIOUS_REF} (${REF_SHA}) contains zero tokens."
  echo "   A real catalogue always has tokens — this looks hand-edited or foreign, not a"
  echo "   legitimate empty state to compare against."
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
