---
affected_files: []
cycle_number: 1
mission_slug: confirm-dialog-element-01M248TN
reproduction_command:
reviewed_at: '2026-09-10T03:29:18Z'
reviewer_agent: claude
wp_id: WP01
---

# WP01 sk-confirm-dialog — Independent review verdict: REJECT

Fresh review pass (prior reviewer attempt was killed by an infra rate limit and produced no
findings; this is not a continuation). Verdict: **REJECT** — two HIGH, mechanically reproducible
CI-gate failures stand. Everything else checked out; see the "confirmed clean" section below so
the next pass does not need to re-litigate it.

## HIGH — `packages/elements/vue.d.ts` references an unimported type; two ENFORCED gates are RED

`sk-confirm-dialog.ts` declares `initialFocus` using an exported named type alias
(`declare initialFocus: ConfirmDialogInitialFocus;`), unlike every other property on this element
(e.g. `confirmVariant: 'primary' | 'secondary' | 'ghost' | undefined` — an inline literal union).
The custom-elements-manifest analyzer copies that type name verbatim into
`packages/elements/custom-elements.json` (see the two `"text": "ConfirmDialogInitialFocus"`
entries), and `scripts/build-vue-types.mjs` copies it verbatim into
`packages/elements/vue.d.ts` line 243 — but never imports the type. `build-vue-types.mjs --check`
is happy (its own output is internally consistent), but the two gates that actually try to
*compile* the generated file both fail on a clean run:

```
$ node scripts/check-vue-template-types.mjs
❌ Vue template types:
   packages/elements/vue.d.ts(243,25): error TS2304: Cannot find name 'ConfirmDialogInitialFocus'.

$ node scripts/check-vue-packed-types.mjs
❌ Packed Vue types: the packed @spec-kitty/elements declaration does not compile with paths disabled:
node_modules/@spec-kitty/elements/vue.d.ts(243,25): error TS2304: Cannot find name 'ConfirmDialogInitialFocus'.
```

Both are `[ENFORCED]` steps in `.github/workflows/ci-quality.yml` (lines 222-223: "Vue types
reach a real SFC (#81)"). This is not the known repo-wide commitlint blocker — it is a defect
this WP's own source introduced, and CI will be red on a clean checkout.

**Fix options** (either is in-scope for this WP's owned files):
- Change `initialFocus`'s declared type back to an inline literal union
  (`'confirm' | 'cancel' | undefined`) matching this file's own `confirmVariant` convention, so
  the manifest never emits a bare, unimported type name — the cheapest, most consistent-with-repo
  fix; or
- Fix `scripts/build-vue-types.mjs` to import named types the manifest references (out of this
  WP's `owned_files` unless the operator authorizes touching the generator).

Either way, re-run both `check-vue-template-types.mjs` and `check-vue-packed-types.mjs` clean
before resubmitting, and re-run `build-vue-types.mjs --check` afterward too (it will need to
regenerate against whatever source shape you land on).

## HIGH — `packages/elements/SIZES.md` is stale; `measure-elements-sizes.mjs --check` is RED

Confirmed exactly the #301 failure mode named in this review's brief: the new
`packages/styles/src/confirm-dialog/sk-confirm-dialog.css` (152 lines, ships verbatim into the
built package) grew both bundles. After `rm -rf packages/{elements,styles,tokens}/dist &&
npx nx run tokens:build && npx nx run styles:build && npx nx run elements:build --skip-nx-cache`:

```
$ node scripts/measure-elements-sizes.mjs --check
❌ packages/elements/SIZES.md is stale. Run: node scripts/measure-elements-sizes.mjs
   line 10: ESM  223.0 KiB → 223.4 KiB (149.8 → 150.0 KiB minified)
   line 11: IIFE 243.2 KiB → 243.5 KiB (160.8 → 161.0 KiB minified)
   line 18: SRI hash changed (expected — artifact bytes changed)
   line 38: @spec-kitty/styles 592.0 → 592.3 KiB
   line 39: @spec-kitty/elements 909.2 → 909.9 KiB
```

`measure-elements-sizes.mjs --check` is `[ENFORCED]` in `ci-quality.yml` ("Artifact sizes are
current (NFR-001)") and again in `release.yml`. **Fix**: `npx nx run elements:build && node
scripts/measure-elements-sizes.mjs`, commit the regenerated `SIZES.md`. No compressed/gzip figure
needs hand-editing — the min+gzip column is already rounded to whole KiB by design and does not
drift with zlib build differences; only the raw/minified/unpacked figures and the SRI hash need
regenerating here.

(Aside, not this WP's fault, no action needed: the same `--check` also shows
`@spec-kitty/tokens` file count 37→36 and a ~5.6 KiB unpacked delta. Tokens isn't in this WP's
`owned_files` and isn't touched by this diff; that drift is pre-existing/environmental — flagging
it only so the next regeneration doesn't get blamed on this WP if it's still present.)

## LOW — three untracked working-tree files not folded into a commit

`kitty-ops/lifecycle.jsonl`, `kitty-ops/ops-index.jsonl`, and
`kitty-specs/confirm-dialog-element-01M248TN/status.events.jsonl` carry uncommitted tail entries
from the `in_progress → for_review` transition (`implementer-ivan`, 2026-09-10T01:00:35Z).
Every earlier transition on this branch was folded into its own `chore(spec-kitty): status
transition WP01` commit (see `4cb28f9`, `9924b91`, `e1893ac`, `795e16a`) — this is the one
transition that wasn't. Not a functional defect, but leaves working-tree state that doesn't match
any commit; fold it into a commit the same way the prior transitions were before opening the PR.

## LOW — the `installTokenSheet()` race comment is an unverified/likely-incorrect causal claim

This file's own `beforeEach` explicitly awaits `installTokenSheet()` with a comment claiming this
was "measured directly" as the fix for a real Escape-test timeout, contrasted against "every
existing caller['s]" allegedly-unawaited `beforeEach(installTokenSheet)`. I could not reproduce
any race: reverting this file's `beforeEach` to the bare `beforeEach(installTokenSheet);` form
used by all ~30 other files and running the target file 5x plus the full suite 1x (602/602) showed
zero flakiness. This is expected — Vitest (like Jest/Mocha) awaits whatever a hook function
returns whether it's passed directly or wrapped in an explicit `async () => { await ...; }`, so
the two forms are behaviourally identical here; there is no meaningful difference to have fixed.
This repo's own doctrine is unusually strict about "measured, not assumed" claims in exactly this
kind of comment (see e.g. `behaviours.json`'s `$comment` entries) — please either reproduce the
claimed timeout with a concrete repro and note it, or soften/remove the causal claim so a later
reader doesn't inherit a fabricated-sounding "measured" fact. This does not block approval by
itself and needs no code change, only a comment correction — bundling it with the two HIGH fixes
above rather than requiring a separate round trip.

## Confirmed CORRECT — do not re-litigate these on the next pass

- **FR-001/FR-017/FR-018 zero-literal enforcement is real.** Read `sk-confirm-dialog.ts` in full;
  no user-visible default/fallback/placeholder anywhere. Re-applied the red-first mutation
  (hardcoded `return 'Confirm'` in `#requiredText` for the omitted-`confirmLabel` branch): the
  FR-018 test goes red exactly as claimed, confirming the test can fail. Reverted cleanly.
- **FR-006 single reporting mechanism**: no custom event anywhere; every path (confirm, cancel,
  Escape, backdrop, programmatic close) resolves through native `close`/`returnValue`, verified by
  my own test runs.
- **The Chromium quirk is real and the fix is correctly sited.** Removed the `returnValue`
  re-normalization from `#handleClose` (leaving only the `showModal()` pre-set) and reran: the two
  Escape-return-value tests ([SC-005], [SC-007]) went red, confirming the pre-set alone is
  insufficient and the close-handler normalization is the actual, load-bearing fix.
- **FR-007 dismissal-as-cancellation**: Escape, backdrop, and programmatic close all verified to
  resolve `'cancel'`.
- **FR-008/FR-009 focus**: `resolveInitialFocus()` is genuinely wired into `showModal()` (not
  dead code); default-CANCEL, consumer-override via `initial-focus="confirm"`, and invoker-return
  all pass. The claim that native `<dialog>` restores focus on its own (making the FIRST SC-005
  focus test vacuous) is correctly not relied upon — the SECOND SC-005 test
  ("...overrides the platform-tracked previously-focused element") uses a decoy-focus setup that
  only this element's own `#invoker` tracking can satisfy, and it does.
- **FR-014 Team-deletion absence**: grepped independently; only prohibition
  comments/doc-strings reference "Team" + "delet*"; every exemplar is membership
  removal/leave/bearer-link-revoke.
- **The dropped `MissingConfirmLabel` story**: judged correct. Omitting `confirm-label` produces
  a control with zero accessible name — a real WCAG 4.1.2 violation this repo's own
  `run-axe-storybook.js` has no per-story opt-out for. The behavior is still proven mechanically
  by the automated (non-visual) test, which is where FR-018's enforcement is authoritative anyway.
- **Declined SC-008/SC-009/SC-017**: consistent with `behaviours.json`'s own precedent
  (sk-action-row's SC-009 decline for the same "not cancelable" reasoning) and each is
  individually justified in the `#308` docstring block, not merely convenient.
- **Every story has a real `LightMode` variant** wrapped in `class="sk-light"` (not
  `data-theme="light"`), and its claim is backed by a real computed-style assertion, not eyeballing.
- **`packages/styles/package.json`'s `./confirm-dialog/*` subpath** is present and
  `check-release-graph.mjs`'s subpath coverage passes.
- **`.wrapper-floor`** correctly reads `30` (was 29); `build-react-wrappers.mjs --check` passes,
  byte-identical across two runs.
- **No stray worktree**: `git worktree list` shows only the primary checkout on
  `mission/confirm-dialog-element`; the `spec-kitty next` topology discrepancy left no corrupted
  state.
- **Gates I re-ran clean, my own numbers**: `node scripts/typecheck-all.mjs` (pass, 5 projects);
  `npm run quality:all` / `npx nx run-many --target=lint --all --skip-nx-cache` (0 errors, only
  pre-existing unrelated `security/detect-object-injection` warnings); `npm test` → **49 files
  passed (49), 602 tests passed (602)**, floor `node=34 browser(chromium)=568`, 0 skipped —
  matches the implementer's reported numbers exactly, reproduced twice; `npx nx run
  storybook:storybook:build --skip-nx-cache` succeeds; `node scripts/run-axe-storybook.js` →
  **zero WCAG 2.1 AA violations across all 582 rendered stories**, render-wait 582/582 satisfied,
  matches reported numbers exactly; `check-manifest-content.mjs`, `check-part-ratchet.mjs`,
  `check-release-graph.mjs`, `check-elements-entries.mjs`, `check-element-css-hygiene.mjs`,
  `check-no-css-in-source.mjs`, `check-adopted-css-boundaries.mjs`,
  `check-behaviour-fixture-imports.mjs` (+ `--selftest`), `check-story-theme-wrapper.mjs`,
  `check-gate-wiring.mjs`, `check-gate-wiring-defeats.mjs`, `check-adr-index.mjs`,
  `check-llms-adr-surface.mjs`, `check-offline-load.mjs`, `check-pattern-composition.mjs`,
  `check-commitlint-config.mjs`, `build-react-wrappers.mjs --check`,
  `build-styles-only-markup.mjs --check`, `build-vue-types.mjs --check`,
  `build-elements-css.mjs --check`, `build-element-markup.mjs --check` all pass.
  `check-component-token-literals.mjs` and `check-component-public-contract.mjs` are NOT wired
  into any CI workflow in this repo (confirmed by grep) — the mission's own research.md correctly
  identifies the former as an unrelated CSS-design-value check; ran both manually against this
  component anyway and they pass/are not a concern (the two "raw design-bearing CSS values"
  `check-component-token-literals.mjs` flags — `min(92vw, 28rem)` fluid width and the
  forced-colors `calc(var(--sk-border-width-1) * 2)` doubled border — are exactly the kind of
  intentional, documented, non-color/spacing-token values this unenforced heuristic isn't tuned
  for, not a real defect).
- **The stray `__screenshots__/sk-confirm-dialog.test.ts/` directory** I found mid-review (which
  briefly crashed `check-behaviour-fixture-imports.mjs` with EISDIR) was leftover Playwright
  failure-screenshot output from an earlier run in this shared checkout — likely the killed prior
  reviewer attempt — not a symptom of current code failing. It is `.gitignore`d, and it does not
  reappear after a clean 602/602 run. Not a WP defect, but worth naming for the next agent in
  this checkout so it isn't mistaken for one.

Fix the two HIGH items (and fold the LOW items in while you're there — cheap, same PR), regenerate
`SIZES.md`, re-run `check-vue-template-types.mjs` + `check-vue-packed-types.mjs` +
`measure-elements-sizes.mjs --check` clean, and resubmit.
