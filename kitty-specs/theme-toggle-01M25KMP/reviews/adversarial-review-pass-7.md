# Pre-merge adversarial squad — pass 7 (exact rebased head)

- Point-cut: `e0fe1949f2e93e188b114ab6afdda55e22f88bee`, tree `902b7cb81620fe82fc12bd9fd1a65da25b3c5616`.
  A later message-only reword of one commit (see below) moved the head to `6c58764c` without
  changing that tree.
- Base: `origin/train/elements-first` at `132163ff51450594c95ec0b538c9ae15a86a03c9`, the train
  after #380, #359, #369, #376, #378 and #372 landed. The mission was rebased onto it before this
  pass.
- Lenses: five fresh, read-only Claude Code seats reviewing one separate clone at the point-cut.
  They performed no test execution; every runtime claim was handed back as a probe.
  - `architect-alphonso` (Sonnet);
  - `reviewer-renata` (Opus);
  - `debugger-debbie` (Opus);
  - `randy-reducer` (Sonnet);
  - `designer-dagmar` (Sonnet).
- Orchestrator: Claude Code, which took over the stalled Codex orchestrator session
  `01a08b2c-a185-76d3-bae0-969526dcaeb0` at the operator's request on 2026-09-11. The
  orchestrator ran every probe itself before accepting a finding.
- Verdict: **REJECT**. There are three in-scope Mediums and two out-of-scope Mediums (deferred
  with issues), plus Lows.

| Lens | Verdict | Concedes |
|---|---|---|
| architect-alphonso | APPROVE WITH LOWS | Executed nothing; runtime, accessibility and mutation coverage are outside the lens |
| reviewer-renata | REJECT | M1 test and `live()` fix are real red-first work; isolation, bootstrap, listener and ratchet arithmetic hold |
| debugger-debbie | REJECT | Element and bootstrap resolve identically for every input; listener lifecycle and SSR sheet wrapper are sound |
| randy-reducer | APPROVE WITH LOWS | Consolidating the guards touches the DOM-free contract's identity and the pre-paint bundle; reported as follow-up evidence |
| designer-dagmar | APPROVE WITH LOWS | No High or Medium in semantics, keyboard, colour-independent state, i18n, stories or tokens |

## Findings and dispositions

### Mediums

1. **[MEDIUM] `packages/elements/src/theme-toggle/sk-theme-toggle.ts:117` — a manual preference
   is lost across a zero-control gap.** Raised by debugger-debbie and reviewer-renata.
   - `connect()` publishes the joining control's constructor-time `preference`.
   - The pass-6 fix keys on "can storage be read", but the question that matters is whether the
     dormant choice was persisted. The write result at `:299` is discarded.
   - Confirmed by orchestrator probes in a fresh test file at the point-cut. Both went red:
     - (a) Write-denied storage (`setItem` throws `QuotaExceededError`, reads allowed). Choose
       Dark, remove, remount:
       `expected { pref: 'system', root: 'light' } to deeply equal { pref: 'dark', root: 'dark' }`.
     - (b) Stale detached instance. Mount `a`, remove it; mount `b`, choose Dark, remove `b`;
       reattach `a`: `expected { pref: 'system', root: 'light', stored: 'dark' }`, where
       `{ pref: 'dark', root: 'dark', stored: 'dark' }` was expected.
   - Both contradict US2-7, US2-9 and `docs/design-system/using-components.md:84-85`.
   - → pass-7 remediation, Op `01M275TD2FV77BEVH8D65XW4DC`.
2. **[MEDIUM] `apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts:110,119,124` — SC-004
   surface luminance is not asserted for the system-light, system-dark, manual-light and
   manual-dark compositions.** Raised by reviewer-renata.
   - The LightMode luminance check is confounded by the `.sk-light` wrapper class, so no test
     proves that root `data-theme` alone re-themes the surface (the #93 guard).
   - → pass-7 remediation.
3. **[MEDIUM] `scripts/build-elements-css.mjs:135-142` — the generator-wide SSR-safe sheet change
   rewrote every element's `*.css.js`, and the mission artifacts never record why.** Raised by
   architect-alphonso.
   - → **folded as documentation**, here, in the operator log and in the PR body. There is no
     code change. Rationale:
     - FR-008 and NFR-004 require importing the element with no DOM globals.
       `tests/node/theme-preference-contract.test.ts:98` asserts `'CSSStyleSheet' in globalThis`
       is false in that runtime.
     - The element imports its generated sheet module, and the previous shape called
       `new CSSStyleSheet()` at module scope.
     - Every sheet module is emitted by the one shared generator. A per-element special case
       would create two generator output modes behind one `--check`.
     - `plan.md:213` names the generator's `--check` among the gates, but not this rationale.
   - The generated `.d.ts` still types the default export as `CSSStyleSheet`. That is true in
     every browser, and deliberately imprecise only on the SSR path, where the value is Lit's
     DOM-free `CSSResult` (the generator comment at `:156-163`).
4. **[MEDIUM] `packages/styles/src/public-header/sk-public-header-html.stories.ts:78` — the train's
   public-header story still says it is blocked on #323.** Raised by architect-alphonso.
   - The lens could not find the recorded ruling under `kitty-specs/`. It exists as the
     train-integration audit, Op `01M272SBG547GP2ET7XJ780Q87`: APPROVE DEFER. The evidence is in
     `.kittify/evidence/01M272SBG547GP2ET7XJ780Q87/evidence.md`.
   - → **deferred, filed as #404.**
5. **[MEDIUM] The storage and `matchMedia` access guards are hand-written in
   `theme-bootstrap.ts:12-25`, `sk-theme-toggle.ts:27-43` and
   `theme-story-environment.fixture.ts:99-106`.** Raised by randy-reducer.
   - Resolution itself is single-sourced, and debugger-debbie verified identical results across
     all inputs.
   - → **deferred, filed as #405.** Consolidating it touches the size-budgeted pre-paint bundle.

### Lows

- **[LOW, confirmed] A synchronous `sk-theme-change` revert leaves storage `light` while the page
  shows `dark`** (debugger-debbie).
  - Orchestrator probe: `expected { stored: 'light', root: 'dark' }`.
  - → pass-7 remediation.
- **[LOW, confirmed] The dormant coordinator leaks between tests** (debugger-debbie and
  reviewer-renata). The tests at `sk-theme-toggle.test.ts:454,711,729` depend on the previous
  test's state.
  - Orchestrator probe: a new denied-storage test started at `'dark'`.
  - → pass-7 remediation.
- **[LOW] Seams killed only by leftover state** (debugger-debbie):
  - the readable-storage branch of `:117`;
  - the `#media` re-query at `:115`, since the test at `:743` reuses one fake;
  - the modern-pair completeness check, which has no arm.
  - → pass-7 remediation.
- **[LOW, confirmed] Pass-6 L2 is not closed** (reviewer-renata). On a rendered element,
  `setAttribute('preference', 'sepia')` leaves the attribute `sepia` while the property is
  `system`.
  - Orchestrator probe: `expected { pref: 'system', attr: 'sepia' }`.
  - → pass-7 remediation.
- **[LOW] `packages/elements/src/patterns/operational-status.ts:371` always binds `preference`
  (default `'dark'`)**, contradicting the new L3 guidance (reviewer-renata).
  - → pass-7 remediation.
- **[LOW] The greyscale proof (`sk-theme-toggle-pattern.spec.ts:153`) checks only the
  accessibility state** (reviewer-renata), **and the forced-colours proof never asserts that the
  checked choice is visibly distinct** (designer-dagmar).
  - → pass-7 remediation.
- **[LOW] The `preference` accessors re-spell the `ThemePreference` union** (randy-reducer).
  - → pass-7 remediation, conditional on byte-identical generated typings.
- **[LOW] The generator `--check`/`--selftest` CLI plumbing is repeated three times**
  (randy-reducer).
  - → recorded in #405.
- **[LOW] The genuine zoom captures are dark-only** (designer-dagmar).
  - → pass-7 remediation, if its recapture procedure supports LightMode; otherwise a follow-up.

## Pass-6 dispositions (reviewer-renata)

- **M1:** closed as scoped. The residual defect class is Medium 1 above.
- **L1:** closed.
- **L2:** not closed.
- **L3:** closed in the docs, but the pattern exemplar contradicts it.

## Rebase integration (reviewer-renata)

- `expected-docs.json`: 134 + 5 = 139. The per-element entries sum to 139.
- `expected-stories.json`: 560 + 14 = 574 (7 element and 7 pattern ids). The lists sum to 574
  with no duplicates.
- The regenerated `sk-site-footer.css.js` carries both the train's compact-presentation rules and
  the mission's SSR wrapper, byte-identical to the generator's own output.

## Commit-message remediation

- `lint-code`'s commitlint step rejected one mission commit: `docs(review): record pass six
  rejection`. `review` is not in the scope enum.
- It was reworded to `docs(acceptance): …` with `git filter-branch --msg-filter`, and the tree was
  verified byte-identical before and after (`902b7cb8`).
- `npx commitlint --from=132163ff --to=HEAD` is now green.
