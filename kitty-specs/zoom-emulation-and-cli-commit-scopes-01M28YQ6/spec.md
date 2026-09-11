# Mission Specification: Zoom Emulation And CLI Commit Scopes

**Mission Branch**: `mission/zoom-emulation-and-cli-commit-scopes`
**Created**: 2026-09-11
**Status**: Draft
**Input**: Two unrelated harness/config fixes bundled because neither collides with the other or with a sibling mission in flight: (1) #422 — the CLI-auth pattern's 200%-zoom visual-regression evidence uses CSS `zoom` emulation, which magnifies uniformly but never narrows the reported CSS viewport, so the pattern's own `@media (max-width: …)` breakpoint never fires; the evidence proves "survives uniform magnification", not "survives 200% zoom". (2) `commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS` allowlist enumerates only four of the CLI's `chore(spec-kitty): {operation}` auto-commit shapes; a real CLI-emitted message from this round's sibling mission failed `lint-code` because its exact operation text (`materialize WP01 approval note into status.json`) was not covered.

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

**Independent Test**: Grep `apps/storybook/src/tests/visual.spec.ts` for every `style.zoom` use, read each site's test name and any explanatory comment, and classify each as either (a) already honestly named/scoped as a magnification stress probe, no claim of real-zoom breakpoint coverage, left alone, or (b) claiming unqualified "N% zoom" evidence while actually only using CSS-zoom magnification, which is the #422 defect and must be fixed the same way as User Story 1.

**Acceptance Scenarios**:

1. **Given** every `document.documentElement.style.zoom` (or equivalent `CSSStyleDeclaration.zoom`) call site in `apps/storybook/src/tests/visual.spec.ts`, **When** each is classified, **Then** the mission report states the classification and rationale for every one, not just the CLI Auth site named in #422.
2. **Given** a call site classified as sharing #422's defect (unqualified "200%/400% zoom" claim, CSS-zoom mechanism, and a story with its own responsive breakpoint the zoom claim implies was exercised), **When** the sweep concludes, **Then** that site is fixed the same way as User Story 1, or the mission explicit ly records why it was left as-is (e.g., the pattern has no breakpoint of its own to cross, so there is nothing for the mechanism difference to prove).

---

### User Story 3 - The CLI's open-ended `chore(spec-kitty): {operation}` auto-commits do not red `lint-code` (Priority: P1)

An agent running a Spec Kitty mission relies on the installed CLI to make status-bookkeeping auto-commits (`chore(spec-kitty): {operation}`, `specify_cli/coordination/transaction.py:561`, fired from `BookkeepingTransaction.__exit__` whenever a transaction is not explicitly `.commit()`-ed). `commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS` allowlist must recognize every operation shape the CLI can actually produce through that mechanism, closed over a bounded vocabulary — not widen `scope-enum`, and not an unanchored `/^chore\(spec-kitty\):/` that would exempt any commit with that scope from every rule (the config's own comments explain why at length, and #420 already established the anchored-end-of-line, closed-vocabulary pattern this mission must match).

**Why this priority**: A commit an agent cannot control (the CLI emitted it) redding a required gate blocks mission progress with no user-actionable fix except editing history the CLI itself wrote — the same class of defect #420 closed for `chore(tracer)`/`chore(retrospective)`. Observed this round: `chore(spec-kitty): materialize WP01 approval note into status.json` failed `lint-code` during a sibling mission and had to be reworded.

**Independent Test**: Run `node scripts/check-commitlint-config.mjs`. Every real operation shape the CLI's source can produce through the `chore(spec-kitty): {operation}` implicit-commit path is present in `generatedMessages` and asserted both `isIgnored` and lint-valid; a near-miss of the new pattern (violating its bound) is present in `nearMisses` and asserted to still fail lint (proving the pattern is closed, not a blanket exemption).

**Acceptance Scenarios**:

1. **Given** the CLI source installed at `/home/jeroennouws/.local/share/uv/tools/spec-kitty-cli/lib/python3.14/site-packages/specify_cli/` (spec-kitty-cli 3.2.6rc4), **When** every call site reaching `BookkeepingTransaction`'s implicit-commit fallback (i.e., every `BookkeepingTransaction.acquire(...)` whose `with` block never calls `.commit()`/`.commit_idempotent()` explicitly) is enumerated, **Then** the mission report lists each one, its default `operation` template, and whether commitlint's existing four patterns already cover it.
2. **Given** the operation shape observed this round (`materialize WP01 approval note into status.json`) could not be reproduced from a literal source match in the installed CLI despite an exhaustive read (documented in the report, not asserted without having actually searched), **When** the fix is authored, **Then** it is bound exactly as narrowly as the evidence supports — the exact observed verb phrase plus the `WP\d+` token, matching the discipline of the four existing patterns (fixed phrase + bounded id/count token, never an open category class) — and the spec/report says plainly that this one pattern rests on the operator-reported real message rather than an independently re-derived source match, distinguishing it from the three patterns whose source I did verify directly.
3. **Given** `specify_cli/status/aggregate.py`'s `MissionStatusAggregate.save(*, operation: str)`, **When** it is read, **Then** the report notes it as a confirmed, currently-uncalled, structurally unbounded escape hatch (`txn.commit(operation)` — the caller's string becomes the *entire* commit message, not just a `chore(spec-kitty):` suffix) that must NOT be exempted by any regex, because no bounded pattern could honestly cover arbitrary caller-supplied text — matching the "known limitation, stated rather than left silent" convention already used in this repo (e.g. `scripts/check-visual-screenshot-softness.mjs`'s own doc comment).
4. **Given** `scripts/check-commitlint-config.mjs`, **When** it is run after the fix, **Then** it passes, and a run against the pre-fix config (or a config missing the new pattern) demonstrably fails on the new `generatedMessages` case — the red-first proof that the new case is load-bearing.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | CLI Auth zoom tests drive real viewport-halving zoom | As a maintainer, I want the CLI Auth "200% zoom" visual tests to actually narrow the CSS viewport (half-width viewport + `deviceScaleFactor: 2`, per a fresh browser context) so that the pattern's own `max-width` breakpoint fires, instead of `document.documentElement.style.zoom` which only magnifies uniformly. | P1 | Open |
| FR-002 | Zoom test's breakpoint is read from source, not hardcoded | As a maintainer, I want the zoom test to read the CLI Auth pattern's real breakpoint pixel value (and, where practical, its padding token) from `packages/elements/src/patterns/cli-auth.stories.ts` at run time, so the test is correct whether the sibling 390px→480px breakpoint migration has merged or not. | P1 | Open |
| FR-003 | Zoom test asserts on resolved padding, not a hardcoded pixel diff | As a maintainer, I want the zoom test to assert the pattern's own computed padding narrows under the halved-viewport zoom state relative to an un-zoomed reference, so a regression that stops the breakpoint firing turns the test red on its own merits, independent of the (CI-authoritative) screenshot baseline. | P1 | Open |
| FR-004 | Every `toHaveScreenshot` call site stays soft | As a maintainer, I want the rewritten zoom test(s) to keep using `expect.soft(...).toHaveScreenshot(...)`, so `scripts/check-visual-screenshot-softness.mjs` keeps passing. | P1 | Open |
| FR-005 | Harness-level sweep of the same zoom-emulation idiom | As a maintainer, I want every other `style.zoom` use in `apps/storybook/src/tests/visual.spec.ts` reviewed and classified (shares #422's mis-naming defect vs. already honestly scoped), with the same fix applied wherever the defect is shared, so #422's own framing ("a fix belongs at the harness level") is actually honored rather than narrowly patched at one call site. | P2 | Open |
| FR-006 | `chore(spec-kitty)` allowlist covers the CLI's real `{operation}` vocabulary | As an agent running a Spec Kitty mission, I want `commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS` to recognize every `chore(spec-kitty): {operation}` shape the installed CLI can emit through `BookkeepingTransaction`'s implicit-commit fallback — closed over a bounded vocabulary, anchored to end-of-line, never widening `scope-enum` and never an unanchored `/^chore\(spec-kitty\):/` — so a CLI-authored bookkeeping commit an agent does not control cannot red `lint-code`. | P1 | Open |
| FR-007 | Regression coverage for the new commitlint pattern | As a maintainer, I want `scripts/check-commitlint-config.mjs` to carry a `generatedMessages` case proving the new pattern is ignored and lint-valid, and a `nearMisses` case proving a violation of its bound still fails lint, so the new exemption cannot silently degrade into a blanket one (per #418's lesson: an enumeration that lists what someone happened to see cannot catch what they did not). | P1 | Open |
| FR-008 | Unbounded CLI commit-message escape hatch is documented, not exempted | As a maintainer, I want `specify_cli`'s confirmed structurally-unbounded commit-message surface (`MissionStatusAggregate.save`, `txn.commit(operation)` with the caller's string as the entire message) named in a code comment as a known, deliberately-unclosed gap, so a future reader does not mistake commitlint's silence on it for coverage. | P2 | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No new hard visual assertions | Every `toHaveScreenshot` call site touched or added by this mission remains `expect.soft(...)`, verified by `node scripts/check-visual-screenshot-softness.mjs` passing. | Reliability | High | Open |
| NFR-002 | commitlint self-test is executable and green | `node scripts/check-commitlint-config.mjs` exits 0 after the fix, and is shown failing before it (red-first) on the new case. | Reliability | High | Open |
| NFR-003 | No local `--update-snapshots` | Any zoom baseline PNGs invalidated by the FR-001 mechanism change are named in the mission report as expected-to-move and harvested from CI, never regenerated locally. | Process | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No breakpoint value hardcoded across the sibling-mission dependency | The zoom test must not assume either state (390px or 480px) of the concurrently in-flight cli-auth breakpoint migration; it must read the real value from source at run time. | Technical | High | Open |
| C-002 | No `scope-enum` widening | `commitlint.config.cjs`'s `scope-enum` rule list is not touched by this mission. | Technical | High | Open |
| C-003 | No unanchored `chore(spec-kitty)` regex | Any new commitlint ignore pattern is anchored to end-of-line and closed over a bounded vocabulary/id shape, matching the discipline of the four patterns #420 already established. | Technical | High | Open |
| C-004 | Never run `nx run storybook:lint` | That target launches `storybook dev` and never exits; use `npm run quality:lint` instead. | Process | High | Open |
| C-005 | Port 6006 is shared across checkouts on this machine | Any local Storybook use must use a unique port, and the mission must leave nothing listening on 6006 at the end (`ss -ltnp \| grep 6006`). | Process | Medium | Open |
| C-006 | CLI source is read-only | `/home/jeroennouws/.local/share/uv/tools/spec-kitty-cli/...` may be read to confirm the operation vocabulary; it is never modified by this mission. | Technical | High | Open |

### Key Entities

- **CLI Auth pattern zoom test**: The two Playwright tests (`code-entry-default`, `authorization-decision`) in `apps/storybook/src/tests/visual.spec.ts` currently named `` `CLI Auth ${zoom.name} — 200% CSS zoom baseline` ``, the direct subject of #422.
- **`chore(spec-kitty): {operation}` auto-commit**: The CLI's implicit-commit fallback message, `specify_cli/coordination/transaction.py:561`, whose `operation` text varies by call site.
- **`SPEC_KITTY_AUTO_COMMIT_PATTERNS`**: The closed-vocabulary allowlist array in `commitlint.config.cjs` that `ignores` these CLI-authored commits from normal conventional-commit rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The two CLI Auth zoom tests, run under `PW_INCLUDE_VISUAL=1`, execute a padding assertion that fails when the test is deliberately run against a viewport that does NOT cross the breakpoint (proven by executing the probe both ways, not just reasoning about it).
- **SC-002**: `node scripts/check-visual-screenshot-softness.mjs` exits 0 after the change.
- **SC-003**: `node scripts/check-commitlint-config.mjs` exits 0 after the change, and the mission report shows the specific new assertion failing before the fix (red-first).
- **SC-004**: `npm run quality:lint` (never `nx run storybook:lint`) exits 0, or every remaining failure is pre-existing and named as such.
- **SC-005**: `ss -ltnp | grep 6006` shows nothing owned by this mission's processes at hand-off.
