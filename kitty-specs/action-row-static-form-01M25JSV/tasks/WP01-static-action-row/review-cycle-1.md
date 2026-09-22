---
affected_files: []
cycle_number: 1
mission_slug: action-row-static-form-01M25JSV
reproduction_command:
reviewed_at: '2026-09-10T13:24:19Z'
reviewer_agent: user
wp_id: WP01
---

# Independent review — WP01, mission action-row-static-form-01M25JSV (#307)

**Verdict: REJECT (MEDIUM).** One MEDIUM finding stands; everything else attacked in the review
brief was independently verified and holds up, including live mutation-testing of every claimed
"mutation-proven" assertion.

## MEDIUM — the docs.md copy of `.sk-action-row-host` is not actually pinned, despite the claim

Both `fixtures/elements-behaviour/src/sk-action-row.test.ts` (comment above `LOCAL_ACTION_ROW_HOST_CSS`,
~line 872) and `docs/design-system/using-components.md` ("Action row static form" section) state
that the docs' literal `.sk-action-row-host { ... }` CSS block is "textually pinned" /
"pinned word-for-word" against `sk-action-row.css`'s header comment **by
`fixtures/elements-behaviour/src/sk-action-row.test.ts`**.

This is not true. The test's anti-drift pin (`[T004][FR-004][FR-005]` test, ~line 902) only
compares its own local `LOCAL_ACTION_ROW_HOST_CSS` constant against `sk-action-row.css`. It never
reads, imports, or parses `docs/design-system/using-components.md`. I grepped the whole test file
and every `scripts/check-*.mjs` gate script for any reference to `using-components.md` or to
`.sk-action-row-host` — none exists. Today the two copies happen to match (verified by diff), but
nothing enforces that going forward: someone could change the pinned test constant (in step with a
future `:host` change) and never touch the docs copy, and no gate would catch it.

This is exactly the failure mode the mission's own design is proudest of avoiding ("a pin that
cannot detect drift is worse than none, because it reads as protection") — it just applies to the
second copy, not the one that was actually tested. Fix: either add a real check (parse the doc's
fenced code block the same way the test parses the CSS comment and assert equality), or correct
the prose/comment claims in both files to stop asserting protection that doesn't exist.

## Everything else attacked — verified, holds up

All of the following were independently re-derived, not taken on the implementer's word:

- **Anti-drift pin (real CSS vs. test literal)**: mutated the shipped `sk-action-row.css` header
  comment (dropped `min-width: 0`) and reran — the pin reds with a clean expected/received diff.
  Reverted, reran — 40/40 green. The pin genuinely discriminates.
- **Reflow-parity test**: collapsed `actionRowStaticHtml` to a single-element return (no
  `.sk-action-row-host` wrapper) and reran — reproduced the implementer's exact claimed failure,
  `flex-wrap mismatch at 360px: expected 'nowrap' to be 'wrap'`. Reverted, reran — 40/40 green.
- **Sibling-not-descendant (#272)**: mutated the markup module to nest `.sk-action-row__controls`
  inside the trigger — the T005 test reds (`controls must never be a descendant of the trigger:
  expected <div> to be null`). Reverted, reran — 40/40 green.
- **Absent-state, controls axis (FR-014)**: mutated the markup module to render a `hidden`
  controls div instead of omitting it — T006/FR-014 reds (`expected <div hidden> to be null`).
  Reverted, reran — 40/40 green.
- **No `.sk-action-row-host` rule ships**: grepped every `.css`/`.scss` under `packages/` — the
  only occurrences are inside `sk-action-row.css`'s header *comment* text, never a live rule.
  `docs/design-system/using-components.md` states plainly the wrapper CSS "is documented here, not
  shipped by any `@spec-kitty/styles` file yet (#309/#310)."
- **#283 boundary**: stated in prose only, in `spec.md`'s "Boundary with #283" section — names
  `.sk-record-list`'s "row link/action" non-goal explicitly and states the seam. No file under
  `.sk-record-list`'s surface was touched (`git diff --name-only` confirms).
- **Hostile href escaping**: read the implementation and the DOMParser-based test — a hostile
  `href` produces exactly `['aria-labelledby','class','href']` on the anchor with the raw hostile
  string safely contained in the attribute value; a legitimate `&`-bearing URL round-trips.
- **Axe fix**: re-ran the full `scripts/run-axe-storybook.js` gate against a freshly-built
  `storybook-static` on an ephemeral port (no port-6006 contamination risk — verified
  `pgrep -af "storybook dev"` shows only a sibling workspace's dev server, and the axe script binds
  `listen(0, ...)`). Result: **"Zero WCAG 2.1 AA violations across all 601 rendered story/stories,"
  render wait 601/601 satisfied, 0 timed out** — independently reproduced, not taken on faith. All
  19 `primitives-skactionrow-html--*` stories pass, including the ones exercising the fixed
  dependency-free control and the `sk-pill-tag`-classed tag (unloaded `sk-pill-tag.css` in this
  story is harmless: the span just inherits the already-passing body text color). No other new
  story in this diff (only `sk-action-row-html.stories.ts` is new) carries a similar
  unloaded-dependency assumption.
- **Gates**: `commitlint --from <c>~1 --to <c>` exits 0 on all 5 authored commits (two carry a
  `footer-leading-blank` *warning*, zero errors — matches "exit 0" claim exactly).
  `check-manifest-content.mjs` and `check-part-ratchet.mjs` both green, and
  `git diff --name-only` confirms zero changes to `expected-docs.json`/`expected-parts.json`.
  `SIZES.md` diff is exactly `styles 599.1→610.4 KiB / 230→233 files`,
  `elements 864.2→878.0 KiB / 50→51 files`, with the ESM/IIFE raw/minified/min+gzip table
  untouched — matches the claim exactly.
- **Engine caveat**: grepped the test file and found no claim of firefox/webkit verification
  anywhere; `vitest.config.mts`'s own header comment names CI's unfiltered multi-engine run (plus
  `scripts/floor-reporter.mjs`) as the authority, consistent with the implementer's honesty here.
- **9 outstanding visual baselines**: confirmed no `sk-action-row-html-*` PNG exists anywhere in
  the working tree (only pre-existing shadow-form `sk-action-row-*` baselines are present); the
  `visual.spec.ts` diff adds exactly the 9 named snapshot calls.
- **Judgement call — story placement**: independently confirmed all 25 `*-html.stories.ts` files
  in the repo live under `packages/styles/`, none under `packages/elements/` — the WP frontmatter
  was simply wrong, and following it would have made this file the sole outlier. Agree the
  deviation is correct. (Minor, non-blocking: I could not find an explicit "frontmatter says X, I
  placed it at Y, here's why" rationale note anywhere reachable pre-PR; the commit message for
  `f9251f8` gives the underlying technical reasoning (scope:styles → scope:tokens dependency
  constraint, matches every sibling) but doesn't name the frontmatter discrepancy directly. Not
  cause for rejection on its own — the WP's own Definition of Done defers the explicit rationale
  note to the PR description, which does not exist yet at this review stage.)
- **Judgement call — no new `behaviours.json`/`mutations.json` entries**: independently confirmed
  correct. `plan.md`'s own IC-06 states the default expectation (ordinary assertions, not new
  formal ADR-11 behaviour ids) and that a ratchet change would be a signal to re-examine the
  design, not silently accommodate it. The new T004–T007 tests carry `[Txxx][FR-xxx]` tags, never
  new `[SC-xxx]` tags; `behaviours.json`'s existing `sk-action-row` rows only ever reference
  pre-existing `SC-xxx` tests. `git diff --name-only` confirms zero changes to either file.

## Not verified / out of scope for this pass

- Did not re-run the 15-minute `npm test` / `suite-selftest.mjs` harness (explicitly out of
  scope per the review brief); relying on the implementer's reported 237/237, 882.7s, exit 0,
  no mixed-revision refusal. A filtered single-file `vitest run` of `sk-action-row.test.ts` alone
  passed 40/40 cleanly each time (the cross-file `behaviours.json` floor check that fires on a
  filtered run is expected noise, not a real failure — it flags every *other* file's declared
  behaviour as "missing" because only one spec file ran).
- Did not attempt to launch webkit (this host cannot, per the implementer's own note, consistent
  with what I found in `vitest.config.mts`).
- Did not harvest/inspect the 9 outstanding visual baselines from CI (they don't exist yet by
  design — CI-authoritative per doctrine).
