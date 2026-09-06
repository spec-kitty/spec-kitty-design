# Implementation Plan: Gate wiring shell shape, and four approved follow-ups

**Mission**: `gate-wiring-shell-shape-01M1W3QH`
**Branch**: `mission/gate-wiring-shell-shape` → PR base `train/elements-first`
**Spec**: [`spec.md`](spec.md)

## 1. Measurement first — what the tree does today

Every claim below was reproduced against `1f587b7` before any code was written, by mutating
`.github/workflows/ci-quality.yml` and running the unmodified `scripts/check-gate-wiring.mjs`:

| Defeat | Pre-fix result |
|---|---|
| `[ "${{ needs.lint-code.result }}" != "success" ] && [ 1 = 2 ] \|\| \` | exit 0, ✅ line |
| same conjunct on the `test` disjunct | exit 0, ✅ line |
| same conjunct on the `release-gate` disjunct | exit 0, ✅ line |
| `if false && [ "${{ needs.changes.result }}" …` | exit 0, ✅ line |
| the failure branch's `exit 1` weakened to `exit 0` | **exit 1** — already refused by the inverted `[ENFORCED]` rule |
| `node scripts/check-adr-index.mjs \|\| /bin/true` | exit 0, ✅ line |
| `set +e` / `node …` / `exit 0` body | exit 0, ✅ line |
| `node scripts/check-adr-index.mjs \|\| cmp /dev/null /dev/null` | exit 0, ✅ line |

Seven of the eight pass a neutered gate. The eighth is included as a regression guard, because
the rule that catches it is the rule this mission generalises.

## 2. Architecture of the fix

Both holes have one cause — shell read as text — and two different treatments, because the two
levels have different shapes.

### 2.1 `#202` — assert the clause's SHAPE, not its spelling

No shell parser (C-001). The gate's `[ENFORCED]` body is a small, closed shell dialect, so the
checker reads it as **logical lines** and asserts structure:

1. Strip whole-line `#` comments; join `\`-continuations into logical lines.
2. Track block depth with a word-level token count (`if`/`case`/`for`/`while`/`until` open,
   `fi`/`esac`/`done` close), over a copy with `${{ … }}` expressions masked so an expression
   containing a keyword cannot move the depth.
3. A **gating conditional** is a depth-0 `if <cond>; then` whose then-branch (up to a depth-0
   `else`/`elif`/`fi`) contains a bare `exit <non-zero>`. That definition is what makes the
   `sb_ok`/`a11y_ok` normalisation `if`s — depth-0, but not gating — irrelevant, and what makes
   `exit 0` (`#202-e`) and an `if false; then … fi` wrapper (no depth-0 gating conditional)
   both fail closed.
4. A gating conditional's condition must be a pure `||` chain of single bracket tests. Any
   `&&`, `!`, subshell, or non-bracket disjunct is a **problem**, not a pass. That single rule
   refuses the appended conjunct and the `if false &&` wrapper together.
5. Each required job's clause must appear as a whole disjunct, compared after whitespace
   normalisation (including inside `${{ … }}`), so alignment and reflow are free and
   `-a 1 = 2` inside the brackets is not.

`strict` and `lintStrict` — the two regexes #202 names — are replaced by membership in that
disjunct set. The known-limitation comment #202 asked for is replaced by the fix.

### 2.2 `#205` — invert `neutered()`, and share one rule with the `[ENFORCED]` loop

The repo already contains the stronger shape, applied at `:434-455` to `[ENFORCED]` steps in
`test`, `release-gate` and `gate`; `lint-code`'s registered gates were audited by the older
enumeration. The two are merged into one `swallows(body)` helper used by both, so they cannot
drift apart again:

- `set +e` anywhere → swallow.
- a trailing `exit 0` → swallow.
- a `||` on a logical line that is **not** an `if`/`elif`/`while`/`until` condition → swallow,
  **unless** its right-hand side is a form that provably raises: `exit <non-zero>` or
  `{ …; exit <non-zero>; }`.

The exception is an allow-list of one recognised shape, not an enumeration of swallows, so
`|| /bin/true`, `|| cmp /dev/null /dev/null` and anything else unrecognised fail closed. The
allow-list exists because the tree legitimately contains one: `lint-code`'s manifest step is
`git diff --exit-code … || { echo "::error::…"; exit 1; }`, a fallback that *strengthens* the
step. A blanket `||` ban would red a healthy tree (NFR-002).

### 2.3 The probe table

`scripts/check-gate-wiring-defeats.mjs` makes the eight defeats re-runnable, the way every
other gate in this repo that survived a defeat carries a `--selftest`. It writes a mutated copy
of the workflow into a temp directory and runs the **unmodified** checker with that directory as
`cwd` — the checker's path is relative, so no environment variable, argument or seam is added to
the checker itself (a seam would be a new way to point it at a benign file). A **control** case
requires the unmodified workflow to pass, so a checker that reds on everything cannot satisfy a
table of red expectations, and the table refuses its own empty set.

It is registered in `REQUIRED_LINT` and given a CI line in the same change, per the rule the
file's own comments record learning three times.

## 3. `#218` — sk-card forced colors

- **The CSS block is removed, not rewritten.** Both its declarations are no-ops: the
  forced-colors remap already computes `border-inline-start-color: CanvasText`, and
  `border-inline-start-width` is set by the status rule outside the query for a property forced
  colors never touches. Making it load-bearing would mean choosing a *different* system colour
  (`Highlight`, as `sk-action-row` does for selection) — a design decision this mission is not
  authorised to take. The comment is rewritten in place to say what actually differentiates a
  status card in this mode: the 4px inline-start step, set unconditionally.
- **The story keeps its id** (`elements-skcard--forced-colors`, already in
  `expected-stories.json`, which is not touched) and stops being a byte-identical copy of
  `AllStatuses`: it renders the base card beside the six tones, because the base card is what
  the claim is a comparison against.
- **The assertion** goes beside the existing forced-colors precedent in
  `apps/storybook/src/tests/elements-load.spec.ts`, emulating `forcedColors: 'active'` in both
  colour schemes. It asserts the mechanism (every status card's inline-start border strictly
  wider than the base card's) unconditionally, and the tone collapse only where the feature
  actually engaged — with a **floor**: Chromium must engage, so the collapse assertion can never
  be a green line over zero inputs.

## 4. `#201` — sad-lite.md

The document's own body cites ADR-6, ADR-7 and ADR-8 through ADR-13 (lines 24, 61, 105, 109,
176–199, 210–224), added by commits after its v1.0 date. So `ADR-001 through ADR-005` is **not**
a scoped statement about what informed v1.0 — the document has already outgrown it. It is
replaced by a pointer at the table `scripts/check-adr-index.mjs` holds to `decisions/` in both
directions, which is `elements-first-programme.md:5`'s shape and #197's ruling.

## 5. `#221` — the card mission's issue matrix

- `#177`'s row is filled through `spec-kitty agent issue-verdict` (the CLI seam), verdict
  `fixed`, evidence: the pull request that shipped the card status axis.
  (Written without its `#` number deliberately — see the note below.)
- The `#146` row is removed. It is a referenced dependency, not a delivery target, and the
  verdict enum (`fixed | verified-already-fixed | deferred-with-followup | in-mission`) has no
  value that is true of it — leaving it `unknown` and asserting a verdict are both false records.
- The **generic** behaviour is reported with a proposed shape rather than swept across every past
  mission's file. It was reproduced on THIS mission, twice over:
  - `spec-kitty tasks` scraped `#177` and `#225` from `spec.md` prose into rows. Neither is a
    delivery target: `#177` is the mission whose output `#218` is about, `#225` is an operator
    ruling this mission is instructed not to touch.
  - The approval gate then refuses to advance ANY work package while a scraped row is missing or
    unfilled — `--force` does not bypass it — and it demanded a row for **`#215`, a pull request
    number**, picked out of this file's own prose. There is no verdict in the enum
    (`fixed | verified-already-fixed | deferred-with-followup | in-mission`) that is true of a PR.
    The only ways past are a false record or rewording the prose, which is why the reference above
    no longer carries its number. A scraper that cannot tell a delivery target from a citation
    turns a governance artefact into a thing authors write around.

## 6. Order of work

1. WP01 — `#202` + `#205` + the probe table (one change: they share the logical-line reader).
2. WP02 — `#218`.
3. WP03 — `#201` and `#221`.

Then: regenerate any generated artefact cache-free, `npx commitlint --from origin/train/elements-first --to HEAD`, PR onto `train/elements-first`.

## 7. Risks

| Risk | Handling |
|---|---|
| The shape rules red the shipped tree | The control case in the probe table, run before every defeat, plus a full `lint-code` gate sweep locally. |
| Forced-colors emulation differs per browser | Mechanism asserted unconditionally; collapse asserted behind an engaged-check with a Chromium floor. |
| Another session moves the train | Re-fetch and rebase before the PR is finished. |
| Concurrent `sk-notice` mission | No file under `packages/*/src/notice/**`, `expected-stories.json` or the token catalogue is touched. |
