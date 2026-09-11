# Mission Specification: Zoom Emulation And CLI Commit Scopes

**Mission Branch**: `mission/zoom-emulation-and-cli-commit-scopes`
**Created**: 2026-09-11
**Status**: Draft
**Input**: Originally two unrelated harness/config fixes bundled because neither collided with the other or with a sibling mission in flight: (1) #422 — the CLI-auth pattern's 200%-zoom visual-regression evidence uses CSS `zoom` emulation, which magnifies uniformly but never narrows the reported CSS viewport, so the pattern's own `@media (max-width: …)` breakpoint never fires; the evidence proves "survives uniform magnification", not "survives 200% zoom". (2) — **DROPPED, see correction below** — a claimed `commitlint.config.cjs` allowlist gap for a CLI-emitted `chore(spec-kitty): {operation}` message.

> **CORRECTION (post-implementation, before review).** The mission brief asserted that `chore(spec-kitty): materialize WP01 approval note into status.json` was a CLI-emitted auto-commit message, the same class as #420's `chore(tracer)`/`chore(retrospective)` gaps. WP01's own source audit of the installed CLI (`spec-kitty-cli` 3.2.6rc4) could not independently re-derive that literal message from any call site reaching `BookkeepingTransaction`'s `chore(spec-kitty): {operation}` implicit-commit fallback, despite reading every relevant module — and said so plainly rather than shipping unverified coverage. The coordinator then independently confirmed the true origin: `spec-kitty safe-commit --help` shows `--message`/`-m` as a **caller-supplied, required** argument, and the only `materialize` hits anywhere in the installed package are unrelated migration internals (`materialize_snapshot`/`materialize_to_json`, pure snapshot→JSON functions). **The message was hand-authored by a sibling mission's implementer and passed to `safe-commit`; it was never CLI-emitted.** The implementer who hit it described it as CLI-auto-generated, that description was relayed to this mission's brief without independent verification, and this mission's own audit is what surfaced the discrepancy. Exempting a hand-authored, caller-supplied sentence from commitlint would have been actively wrong — it would have exempted an arbitrary sentence an agent invented, under a config whose entire design is that only exact, anchored, CLI-emitted messages get exemptions, weakening the exact rule #420 exists to uphold. The correct response to an agent writing a non-conforming commit message is for the agent to write a conforming one, which is what happened at the time (the message was reworded before merge).
>
> **Action taken**: the `commitlint.config.cjs` pattern and its `scripts/check-commitlint-config.mjs` regression cases (formerly FR-006, FR-007, C-002, C-003, C-006, NFR-002, User Story 3, SC-003 below) were reverted in full, confirmed byte-identical to the pre-mission `commitlint.config.cjs`/`check-commitlint-config.mjs` via `diff` against `git show 9c269b3c:<path>`. The confirmed, currently-uncalled, structurally unbounded `MissionStatus.save(*, operation: str)` (`specify_cli/status/aggregate.py:164,797`) escape hatch found during that audit is preserved as documentation only, in `research.md` — a real finding worth keeping even though the premise around it was wrong. **This mission is #422 only.**
>
> **SECOND CORRECTION (post-review, Medium finding).** The class above was first recorded as `MissionStatusAggregate`; the reviewer verified that identifier does not exist anywhere in the installed CLI (zero `grep` hits) — the real class is `MissionStatus`. Corrected here and in `research.md`/`plan.md`/`tasks.md`/the WP01 task file, each now also carrying the `specify_cli/status/aggregate.py:164` file:line pointer.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - CLI Auth 200%-zoom evidence actually crosses the pattern's breakpoint (Priority: P1)

A reviewer or future maintainer looks at the CLI Auth pattern's "200% CSS zoom baseline" visual-regression test and needs to trust that a green result means the pattern's narrow-gutter (`max-width` breakpoint) regime was actually exercised, not merely that the wide-gutter regime survived being magnified.

**Why this priority**: This is the mission's own accessibility-evidence integrity finding (#422). A silently weaker check is worse than no check, because it certifies a property the record claims was verified but was not — exactly the failure mode #422 documents (padding scaled 24px→48px, the *unbreakpointed* `--sk-space-6` doubled, never 16px→32px, the breakpointed `--sk-space-4` pair).

**Independent Test**: Run the CLI Auth zoom tests (`code-entry-default`, `authorization-decision`) under `PW_INCLUDE_VISUAL=1`, and separately assert — inside the test, not just by eyeballing a screenshot — that the pattern's computed padding under the zoomed viewport differs from (is strictly less than) its computed padding under an un-zoomed reference viewport. A regression that reverts the breakpoint (or the fix) must turn this assertion red, independent of the screenshot diff.

**Acceptance Scenarios**:

1. **Given** the CLI Auth pattern's story frame at its own current breakpoint (read from `packages/elements/src/patterns/cli-auth.stories.ts` at test run time, never hardcoded), **When** the zoom test drives "200% zoom" by halving the CSS viewport width (via a fresh browser context at `deviceScaleFactor: 2`) rather than applying `document.documentElement.style.zoom`, **Then** the resolved `.sk-cli-auth-pattern` padding under that halved viewport is measurably smaller than its padding under a viewport comfortably above the breakpoint, proving the media query fired.
2. **Given** a sibling, not-yet-merged mission that will move this same breakpoint from `390px` to `480px` (to mirror `sk-boundary-page`), **When** this mission's zoom test runs before or after that sibling merges, **Then** the test passes unchanged in both states, because the breakpoint pixel value and the test's viewport width are both derived from the pattern's real source at run time, never independently hardcoded.
3. **Given** the repo-wide gate `scripts/check-visual-screenshot-softness.mjs` (every `toHaveScreenshot` call site in `apps/storybook/src/tests/*.spec.ts` must be `expect.soft(...)`), **When** the rewritten zoom test is scanned, **Then** it still complies (hard failure of the new padding assertion must not abort the test before the soft screenshot call executes, and vice versa).

---

### User Story 2 - The zoom-emulation defect is not unique to CLI Auth (Priority: P2)

The #422 issue text explicitly frames the defect as harness-level: "the same emulation pattern is used by other families, so a fix belongs at the harness level." A maintainer needs a definitive answer — not a guess — about which other pattern families' visual tests share the same mis-naming/mis-proving defect, so nothing already known to be wrong is left unlisted.

**Why this priority**: Directly requested by the operator brief ("this round's operator directive is 'no more deferrals' — a sweep you discover is a sweep you finish"). Scoped to P2 because #422 itself is filed against CLI Auth only; the sweep's job is to report and, where the SAME mis-naming defect exists (a test that claims unqualified "200% zoom" coverage while only proving uniform magnification), fix it too — without expanding scope to tests that are already honestly named as "CSS zoom stress" and disclaim real-zoom-equivalence in their own title/comments.

> **CORRECTION (post-CI, no re-review required).** The Connectors site was initially fixed with the mechanism change (real halved-viewport + `deviceScaleFactor: 2`), the same as CLI Auth. CI then surfaced a real, CI-only render instability specific to that mechanism at that site: the same element, same page, captured two different heights (688x1150 then 688x1165 device px, a 15px oscillation) within a single `toHaveScreenshot` stability-retry loop — not present in the original, full-size (unhalved-viewport) capture. Root-cause investigation (recorded in `research.md`) ruled out the leading candidate (web-font swap) by source, found no other confirmed cause, and could not reproduce the instability locally because of a measured local/CI rendering gap. Per #422's own second resolution option ("keep the current emulation and rename the evidence to what it actually establishes"), the Connectors mechanism change was reverted and the test renamed instead — landing it in the same honestly-named state as Mission Reading and Work Explorer. A stable test proving a slightly weaker property was judged to beat a flaky test proving a stronger one. CLI Auth's fix (the same mechanism, at a different site) is unaffected and its baselines are CI-confirmed stable.

**Independent Test**: Grep `apps/storybook/src/tests/visual.spec.ts` for every `style.zoom` use, read each site's test name and any explanatory comment, and classify each as either (a) already honestly named/scoped as a magnification stress probe, no claim of real-zoom breakpoint coverage, left alone, or (b) claiming unqualified "N% zoom" evidence while actually only using CSS-zoom magnification, which is the #422 defect and must be fixed the same way as User Story 1.

**Acceptance Scenarios**:

1. **Given** every `document.documentElement.style.zoom` (or equivalent `CSSStyleDeclaration.zoom`) call site in `apps/storybook/src/tests/visual.spec.ts`, **When** each is classified, **Then** the mission report states the classification and rationale for every one, not just the CLI Auth site named in #422.
2. **Given** a call site classified as sharing #422's defect (unqualified "200%/400% zoom" claim, CSS-zoom mechanism, and a story with its own responsive breakpoint the zoom claim implies was exercised), **When** the sweep concludes, **Then** that site is fixed the same way as User Story 1, or the mission explicitly records why it was left as-is (e.g., the pattern has no breakpoint of its own to cross, so there is nothing for the mechanism difference to prove) — **or**, per the correction above, resolved by #422's own second option (revert the mechanism, rename the evidence honestly) when the mechanism fix itself is shown to introduce a worse defect (a flaky baseline) than the one it closes, with the full reasoning recorded.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | CLI Auth zoom tests drive real viewport-halving zoom | As a maintainer, I want the CLI Auth "200% zoom" visual tests to actually narrow the CSS viewport (half-width viewport + `deviceScaleFactor: 2`, per a fresh browser context) so that the pattern's own `max-width` breakpoint fires, instead of `document.documentElement.style.zoom` which only magnifies uniformly. | P1 | Open |
| FR-002 | Zoom test's breakpoint is read from source, not hardcoded | As a maintainer, I want the zoom test to read the CLI Auth pattern's real breakpoint pixel value (and, where practical, its padding token) from `packages/elements/src/patterns/cli-auth.stories.ts` at run time, so the test is correct whether the sibling 390px→480px breakpoint migration has merged or not. | P1 | Open |
| FR-003 | Zoom test asserts on resolved padding, not a hardcoded pixel diff | As a maintainer, I want the zoom test to assert the pattern's own computed padding narrows under the halved-viewport zoom state relative to an un-zoomed reference, so a regression that stops the breakpoint firing turns the test red on its own merits, independent of the (CI-authoritative) screenshot baseline. | P1 | Open |
| FR-004 | Every `toHaveScreenshot` call site stays soft | As a maintainer, I want the rewritten zoom test(s) to keep using `expect.soft(...).toHaveScreenshot(...)`, so `scripts/check-visual-screenshot-softness.mjs` keeps passing. | P1 | Open |
| FR-005 | Harness-level sweep of the same zoom-emulation idiom | As a maintainer, I want every other `style.zoom` use in `apps/storybook/src/tests/visual.spec.ts` reviewed and classified (shares #422's mis-naming defect vs. already honestly scoped), with the defect closed wherever it is shared — either by the mechanism fix (User Story 1's real halved-viewport approach) or, where that mechanism is shown to introduce a worse defect than it closes (a CI-only flaky baseline), by #422's own second option (revert the mechanism, rename the evidence honestly) — so #422's own framing ("a fix belongs at the harness level") is actually honored rather than narrowly patched at one call site. Connectors resolved via the second option; see the correction note under User Story 2 and `research.md`. | P2 | Done |
| FR-008 | Unbounded CLI commit-message escape hatch is documented, not exempted | As a maintainer, I want `specify_cli`'s confirmed structurally-unbounded commit-message surface (`MissionStatus.save`, `specify_cli/status/aggregate.py:164,797`, `txn.commit(operation)` with the caller's string as the entire message) named as a known, deliberately-unclosed limitation, so a future reader does not mistake commitlint's silence on it for coverage. Recorded in `research.md` (not a `commitlint.config.cjs` code comment — no commitlint pattern exists in this mission for it to sit beside). | P2 | Done |

**FR-006 and FR-007 are WITHDRAWN, not merely struck through, per this repo's own rule that a struck-through FR table row still counts as a live row to `finalize-tasks` — only removing the row and recording the withdrawal in prose actually exempts it.** They read, before withdrawal: FR-006 "`chore(spec-kitty)` allowlist covers the CLI's real `{operation}` vocabulary" and FR-007 "Regression coverage for the new commitlint pattern". Both depended on the premise in the correction note above (a CLI-emitted message needing a commitlint exemption), which was false — the message was hand-authored by a sibling mission's implementer and passed to `spec-kitty safe-commit --message`, never emitted by the CLI. No allowlist gap exists to close, so there is nothing for FR-006/FR-007 to require; withdrawn in full, not partially retained.

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No new hard visual assertions | Every `toHaveScreenshot` call site touched or added by this mission remains `expect.soft(...)`, verified by `node scripts/check-visual-screenshot-softness.mjs` passing. | Reliability | High | Open |
| NFR-003 | No local `--update-snapshots` | Any zoom baseline PNGs invalidated by the FR-001 mechanism change are named in the mission report as expected-to-move and harvested from CI, never regenerated locally. | Process | High | Open |

*(NFR-002, "commitlint self-test is executable and green", is withdrawn along with FR-006/FR-007 — there is no new commitlint case to keep green.)*

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No breakpoint value hardcoded across the sibling-mission dependency | The zoom test must not assume either state (390px or 480px) of the concurrently in-flight cli-auth breakpoint migration; it must read the real value from source at run time. | Technical | High | Open |
| C-004 | Never run `nx run storybook:lint` | That target launches `storybook dev` and never exits; use `npm run quality:lint` instead. | Process | High | Open |
| C-005 | Port 6006 is shared across checkouts on this machine | Any local Storybook use must use a unique port, and the mission must leave nothing listening on 6006 at the end (`ss -ltnp \| grep 6006`). | Process | Medium | Open |

*(C-002 "no `scope-enum` widening", C-003 "no unanchored `chore(spec-kitty)` regex", and C-006 "CLI source is read-only" governed the withdrawn commitlint work specifically; C-006's substance — the CLI source is read-only — still held true for the audit that produced the correction above, but it is no longer a live constraint on any remaining deliverable.)*

### Key Entities

- **CLI Auth pattern zoom test**: The two Playwright tests (`code-entry-default`, `authorization-decision`) in `apps/storybook/src/tests/visual.spec.ts` currently named `` `CLI Auth ${zoom.name} — 200% CSS zoom baseline` ``, the direct subject of #422.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The two CLI Auth zoom tests, run under `PW_INCLUDE_VISUAL=1`, execute a padding assertion that fails when the test is deliberately run against a viewport that does NOT cross the breakpoint (proven by executing the probe both ways, not just reasoning about it).
- **SC-002**: `node scripts/check-visual-screenshot-softness.mjs` exits 0 after the change.
- **SC-004**: `npm run quality:lint` (never `nx run storybook:lint`) exits 0, or every remaining failure is pre-existing and named as such.
- **SC-005**: `ss -ltnp | grep 6006` shows nothing owned by this mission's processes at hand-off.

*(SC-003, "`check-commitlint-config.mjs` exits 0 after the change ... red-first", is withdrawn along with FR-006/FR-007. `check-commitlint-config.mjs` was reverted to its pre-mission state and still passes — it simply carries no new case from this mission.)*
