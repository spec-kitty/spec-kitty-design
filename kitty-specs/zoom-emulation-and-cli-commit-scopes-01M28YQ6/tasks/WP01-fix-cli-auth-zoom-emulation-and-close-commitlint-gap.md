---
work_package_id: WP01
title: "Fix #422's CLI-auth zoom emulation (real halved-viewport zoom, breakpoint read from source), sweep visual.spec.ts for the same defect [commitlint half WITHDRAWN post-implementation — false premise, see history]"
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-008
- NFR-001
- NFR-003
- C-001
- C-004
- C-005
planning_base_branch: mission/zoom-emulation-and-cli-commit-scopes
merge_target_branch: mission/zoom-emulation-and-cli-commit-scopes
branch_strategy: Planning artifacts for this mission were generated on mission/zoom-emulation-and-cli-commit-scopes. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/zoom-emulation-and-cli-commit-scopes unless the human explicitly redirects the landing branch.
base_branch: mission/zoom-emulation-and-cli-commit-scopes
base_commit: 53df95f9fc7cca7621feff4f459b5a3357597105
created_at: '2026-09-11T19:35:00Z'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
phase: Phase 1 - Fix and gate
history:
- timestamp: '2026-09-11T19:35:00Z'
  agent: system
  action: WP authored by hand following the visual-evidence-gate-integrity-01M28PTY precedent, per instruction that spec-kitty tasks --json overwrites hand-authored tasks.md prose
- timestamp: '2026-09-11T22:10:00Z'
  agent: system
  action: 'CORRECTION: the commitlint half (Part C/D, T005-T007 below, FR-006/FR-007/NFR-002/C-002/C-003/C-006) is WITHDRAWN. The mission brief asserted chore(spec-kitty): materialize WP01 approval note into status.json was CLI-emitted; this WPs own source audit could not re-derive it from the installed CLI despite an exhaustive read, and said so rather than shipping unverified coverage. The coordinator then established the true origin: spec-kitty safe-commit --message/-m is a caller-supplied argument -- the message was hand-authored by a sibling missions implementer and passed to safe-commit, never CLI-emitted. Exempting it would have weakened the exact rule #420 exists to uphold. commitlint.config.cjs and scripts/check-commitlint-config.mjs were reverted to their pre-mission (9c269b3c) content, confirmed byte-identical via diff. The MissionStatusAggregate.save(*, operation: str) finding (FR-008) is kept, relocated to research.md as documentation only, per the coordinators explicit instruction. Mission is #422 only.'
authoritative_surface: apps/storybook/src/tests/visual.spec.ts
create_intent: []
execution_mode: code_change
owned_files:
- apps/storybook/src/tests/visual.spec.ts
tags: []
tracker_refs: []
---

# Work Package Prompt: WP01 - Fix #422's zoom emulation and close the third chore(spec-kitty) commitlint gap

## Scope for this pass

### Part A — #422: CLI Auth 200%-zoom tests must actually cross the pattern's breakpoint

`apps/storybook/src/tests/visual.spec.ts` has a `for (const zoom of [...])` loop (currently
around line 2729) with two tests titled `` `CLI Auth ${zoom.name} — 200% CSS zoom baseline` ``
(`code-entry-default`, `authorization-decision`). Each sets viewport `{width: 780, height:
1000}` then `page.evaluate(() => { document.documentElement.style.zoom = '2'; })`. CSS `zoom`
magnifies rendering uniformly but never narrows the *CSS* viewport a `@media (max-width: …)`
query reads — confirmed by decoding the existing baselines: padding scales 24px→48px (the
*unbreakpointed* `--sk-space-6` doubled), never 16px→32px (the breakpointed `--sk-space-4`
pair, which would only appear if the breakpoint had actually fired). The evidence proves
"survives uniform magnification", not "survives 200% zoom".

`packages/elements/src/patterns/cli-auth.stories.ts` currently has:

```css
@media (max-width: 390px) {
  .sk-cli-auth-pattern {
    padding: var(--sk-space-4);
  }
}
```

(unbreakpointed `padding: var(--sk-space-6)` above it.) A **sibling, not-yet-merged mission**
is migrating this `390px` to `480px` to mirror `sk-boundary-page`. **Do not hardcode either
value.** Read the breakpoint pixel value and its padding token out of
`cli-auth.stories.ts`'s own source text at test run time (`readFileSync`, matching the
existing `node:fs` idiom already used in `apps/storybook/src/tests/sk-cli-auth-pattern.spec.ts`
line 1), so the test passes unchanged whichever side of that migration has landed.

Fix per the issue's own preferred option (rename-the-evidence is the fallback the issue itself
calls weaker): drive "200% zoom" with a real halved CSS viewport. Playwright's
`deviceScaleFactor` is fixed at browser-context creation, so this requires a fresh context —
use the `browser` fixture (not `page.context()`, which cannot change `deviceScaleFactor` after
creation), pass the `baseURL` fixture through explicitly (a manually-created context does not
inherit `playwright.config.ts`'s `use.baseURL`), and close the context at the end of the test.

Structure:

1. Read `cli-auth.stories.ts`, regex-extract the breakpoint's pixel value from the
   `@media (max-width: Npx) { .sk-cli-auth-pattern { padding: var(--sk-space-N) }` rule. Throw
   a descriptive error (not a silent fallback) if the regex does not match — a source shape
   change must fail this test loudly, not silently stop testing anything.
2. Derive a narrow viewport width safely under the breakpoint (e.g. `Math.floor(breakpoint /
   2)`) and a wide reference width safely above it (e.g. `breakpoint * 2`) — both computed from
   the read value, never independently hardcoded.
3. For the wide reference: use the existing `page` fixture (default `deviceScaleFactor: 1`) at
   the wide width, capture the pattern root's computed `paddingLeft` (or
   `paddingInlineStart`).
4. For the zoomed state: `browser.newContext({ baseURL, deviceScaleFactor: 2 })`, a fresh page
   from it, `cliAuthStory(zoomPage, zoom.id, { width: narrowWidth, height: 1000 })`, capture
   the same computed padding property.
5. **Load-bearing assertion**: the zoomed padding must be strictly less than the wide-reference
   padding (numeric comparison, not just `.not.toBe` — direction matters, not just difference).
   This is what makes the test fail if the breakpoint stops firing, independent of the (CI-
   authoritative) screenshot baseline.
6. Keep `await expect.soft(root).toHaveScreenshot(zoom.name, {...})` for the screenshot itself
   — same options as before — so `scripts/check-visual-screenshot-softness.mjs` still passes.
7. Close the zoomed context (`await zoomContext.close()`) — a `try/finally` around the zoomed
   portion is fine, but do not let a screenshot mismatch skip the close.

Rename the test title to state what it now actually proves, e.g.
`` `CLI Auth ${zoom.name} — 200% zoom (halved viewport, deviceScaleFactor 2) crosses the
pattern's own breakpoint` `` — the #422 finding is precisely that the old name overclaimed.

**Red-first proof required**: before finalizing, deliberately break the mechanism (e.g.
temporarily widen the narrow viewport past the breakpoint, or comment out the media query) and
confirm the new padding assertion actually fails. Then restore and confirm it passes. Record
both runs' real output in the WP history / mission report — do not claim this without having
executed it.

### Part B — Sweep: does the same defect appear elsewhere in `visual.spec.ts`?

#422's own text: "the same emulation pattern is used by other families, so a fix belongs at
the harness level." Every other `document.documentElement.style.zoom` /
`(document.documentElement.style as ...).zoom` use in `apps/storybook/src/tests/visual.spec.ts`
must be read and classified:

- **Mission Reading long-content zoom stress** (~L1920, `sk-mission-reading-long-css-zoom-stress.png`)
  — comment above it already states: *"This is an additional rendering stress baseline only.
  The mission's actual 200% browser-UI zoom evidence is captured separately with headed Chrome
  UI and native Ctrl+Plus key chords."* Title says "CSS zoom stress", not "200% zoom". No
  breakpoint-crossing claim is made. **Preliminary read: already honestly scoped, no fix
  needed** — confirm this holds (re-read the comment and title against #422's actual defect
  definition) and state so explicitly in the report, do not silently skip it.
- **Repository Dossier zoom-200/zoom-400** (~L2145-2159, `sk-repository-dossier-zoom-*.png`)
  — test titles are `` `Repository Dossier ${zoom.value}00% CSS zoom stress — visual baseline` ``
  — "CSS zoom stress", not "200%/400% zoom" unqualified. **Preliminary read: already honestly
  scoped.** Confirm whether `patterns-repository-dossier` has its own `max-width` breakpoint
  this evidence might be implicitly expected to cover despite the honest naming — if so, note
  the gap even though the title itself is not misleading.
- **Work Explorer zoom stress** (~L2433, `work-explorer-css-zoom-200.png`) — title is
  `"Work Explorer effective 200 percent CSS zoom stress — visual baseline"` — "effective ...
  CSS zoom stress", same honest-naming shape. **Preliminary read: already honestly scoped.**
- **Connectors 200% zoom** (~L2909, `sk-connectors-zoom-200.png`) — title is `'Connectors 200%
  zoom — C8 project routing baseline, no document-level horizontal overflow'`. This one is
  **not** hedged as "stress" — it claims unqualified "200% zoom" and asserts
  `document.documentElement.scrollWidth > document.documentElement.clientWidth` is false "at
  200% zoom". Read `patterns-connectors` C8's own source for any `max-width` breakpoint this
  claim might be silently failing to cross the same way #422 describes. If the pattern has no
  breakpoint of its own (the overflow assertion may be independently valid under CSS-zoom
  magnification regardless of breakpoint-crossing, since `scrollWidth`/`clientWidth` respond to
  the SAME CSS viewport `zoom` does not narrow — confirm this by reading how CSS `zoom` affects
  `document.documentElement.clientWidth` before concluding either way), state the finding
  precisely; do not assume by title-similarity alone.

Fix (same mechanism as Part A) any site whose classification concludes it shares #422's
defect: an unqualified zoom-percentage claim that implies a breakpoint was exercised, proven
only by CSS-zoom magnification. Leave — with the classification recorded in the mission report
— any site that already discloses it is a magnification-only stress probe, or that provably has
no breakpoint for the mechanism difference to matter to.

### Part C — WITHDRAWN post-implementation: `chore(spec-kitty)` commitlint gap (preserved as historical record; do not re-implement)

> **This part is withdrawn.** The premise below — that `chore(spec-kitty): materialize WP01
> approval note into status.json` was a CLI-emitted auto-commit — was false. This WP's own
> source audit (immediately below) could not re-derive that literal message from the installed
> CLI's source despite reading every relevant call site, and said so rather than shipping
> unverified coverage. The coordinator then established the true origin: `spec-kitty safe-commit
> --message`/`-m` is a **caller-supplied, required** argument — the message was hand-authored by
> a sibling mission's implementer and passed to `safe-commit`, never emitted by the CLI. No
> #420-class allowlist gap exists. The `commitlint.config.cjs` pattern this Part describes (and
> Part D's regression coverage for it) were implemented, then **reverted in full** — confirmed
> byte-identical to `git show 9c269b3c:commitlint.config.cjs` /
> `:scripts/check-commitlint-config.mjs` via `diff`. The `MissionStatusAggregate.save()` finding
> below is real and is kept, relocated to `research.md` as documentation only. The text below
> this note is preserved unedited as the historical record of the (mistaken) work, per this
> repo's convention of correcting forward rather than erasing — see the WP frontmatter `history`
> entry and `research.md` for the full correction.

`commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS` (search
`SPEC_KITTY_AUTO_COMMIT_PATTERNS`) currently enumerates exactly four `chore(spec-kitty):` and
`chore(spec-kitty)`-class shapes (plus the unrelated `chore(tracer)`/`chore(retrospective)`
pair from #420): `status transition WP\d+`, `status transition batch WP\d+`, `inner-state

`commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS` (search
`SPEC_KITTY_AUTO_COMMIT_PATTERNS`) currently enumerates exactly four `chore(spec-kitty):` and
`chore(spec-kitty)`-class shapes (plus the unrelated `chore(tracer)`/`chore(retrospective)`
pair from #420): `status transition WP\d+`, `status transition batch WP\d+`, `inner-state
annotation WP\d+`, `record WP\d+ remediation state`. This round, a sibling mission's real CLI
auto-commit — `chore(spec-kitty): materialize WP01 approval note into status.json` — failed
`lint-code` and had to be reworded, because none of the four patterns match it.

**Source audit already performed (do not re-derive from scratch; verify and extend)**:
`specify_cli/coordination/transaction.py:561`'s `BookkeepingTransaction.__exit__` emits
`f"chore(spec-kitty): {self.operation}"` only when a transaction is never explicitly
`.commit()`/`.commit_idempotent()`-ed. Grepping every `operation=` literal across the installed
CLI (`spec-kitty-cli` 3.2.6rc4, `~/.local/share/uv/tools/spec-kitty-cli/lib/python3.14/site-
packages/specify_cli/` — READ ONLY, never write) and tracing each call site's commit path found:

- `status_transition.py`'s three `operation or f"..."` defaults (`status transition {wp_id}`,
  `inner-state annotation {wp_id}`, `status transition batch {first.wp_id}`) all reach the
  implicit-commit fallback and are already covered by the four existing patterns.
- `implement.py:839` and `workflow_executor.py:884/1095/1762` pass `operation=` but always call
  `txn.commit_idempotent(message)` explicitly with a *different*, non-`chore(spec-kitty)`
  message — the `operation` string never reaches a real commit there.
- `status/aggregate.py`'s `MissionStatusAggregate.save(*, operation: str)` is a documented
  "low-level escape hatch" that calls `txn.commit(operation)` — the caller's string becomes
  the **entire** commit message (not a `chore(spec-kitty):` suffix at all). It currently has
  **zero callers** anywhere in `specify_cli`. This is a confirmed, structurally unbounded
  surface: no regex can honestly claim to bound arbitrary caller-supplied text.
- The literal text `materialize WP01 approval note into status.json` could **not** be matched
  to any `operation=` literal or f-string template found via this audit, despite reading
  `transaction.py`, `status_transition.py`, `workflow_executor.py`, `workflow.py`,
  `status/aggregate.py`, `implement.py`, `review/cycle.py`, `tasks_verdict_persistence.py`, and
  `tasks_move_task.py`.

**Given this, add the new pattern bound exactly to the observed real text** (fixed verb phrase
`materialize WP\d+ approval note into status\.json`, `WP\d+` the only variable token) —
matching the discipline of the four existing patterns (fixed phrase + bounded id/count token,
anchored to end-of-line via `\s*(\n|$)`, never `\S+` and never an unanchored
`/^chore\(spec-kitty\):/`). Add a code comment stating plainly that this pattern's source
grounding differs from its siblings: the other three were matched to a literal f-string
template read directly from the installed CLI; this one is bound to the operator-reported real
failing message from this round's sibling mission, which could not be independently re-derived
from a source match despite the audit above — so if a future reader needs to verify or extend
it, they should look for the actual originating commit/CLI version rather than assume this
audit found it.

**Also add, as a comment near `MissionStatusAggregate.save`'s mention** (or in a suitable spot
in the same block), a "known limitation, stated rather than left silent" note — matching this
repo's own convention (see `scripts/check-visual-screenshot-softness.mjs`'s "KNOWN REMAINING
LIMIT" doc comment) — that `MissionStatusAggregate.save(*, operation: str)` is a confirmed,
currently-uncalled, structurally unbounded commit-message surface that this config deliberately
does NOT exempt, because no bounded pattern could honestly cover arbitrary caller text; if a
future CLI version wires a caller to it and its real output fails lint, that is expected and
correct, not a gap in this config.

**Do not touch `scope-enum`.** Do not write an unanchored `/^chore\(spec-kitty\):/`.

### Part D — WITHDRAWN along with Part C (preserved as historical record; do not re-implement)

Add to `scripts/check-commitlint-config.mjs`:

- `generatedMessages`: `'chore(spec-kitty): materialize WP01 approval note into status.json'`
  — asserted `isIgnored` true and lint-valid.
- `nearMisses` (each must still fail lint, proving the pattern is closed, not blanket):
  - `'chore(spec-kitty): materialize WP01 approval note into settings.json'` (wrong file name)
  - `'chore(spec-kitty): materialize approval note into status.json'` (missing the `WP\d+` token)
  - `'chore(spec-kitty): materialize WP01 approval note into status.json and bypass checks'`
    (trailing content after the matched shape, same shape of near-miss as the existing
    `'chore(spec-kitty): status transition batch WP04 and bypass checks'` case already in the
    file)

**Red-first proof required**: run `node scripts/check-commitlint-config.mjs` with the new
`generatedMessages` case added but BEFORE the new pattern is added to
`SPEC_KITTY_AUTO_COMMIT_PATTERNS` — confirm it fails (the assertion for that message). Then add
the pattern and confirm the whole script passes, including the new `nearMisses` cases still
failing lint as expected. Record both runs' real output.

## Definition of Done

- [ ] T001: CLI Auth zoom tests rewritten to use a halved-viewport + `deviceScaleFactor: 2`
      fresh browser context; breakpoint/padding-token read from `cli-auth.stories.ts` source at
      run time, never hardcoded.
- [ ] T002: New load-bearing padding-narrows assertion added; red-first proof executed and
      recorded (deliberately broken → red; restored → green).
- [ ] T003: `expect.soft(...)` preserved on the screenshot call; `node
      scripts/check-visual-screenshot-softness.mjs` passes.
- [ ] T004: All four other `style.zoom` sites in `visual.spec.ts` read and classified in the
      mission report; any sharing #422's defect fixed the same way; Connectors C8's
      breakpoint/CSS-zoom-and-`clientWidth` interaction specifically investigated (not assumed)
      before concluding it needs no fix.
- [x] T005: **WITHDRAWN.** New `chore(spec-kitty)` commitlint pattern — implemented, then
      reverted in full once the coordinator established the underlying message was
      hand-authored and passed to `spec-kitty safe-commit --message`, not CLI-emitted.
      `commitlint.config.cjs` confirmed byte-identical to its pre-mission (`9c269b3c`) content.
- [x] T006: `MissionStatusAggregate.save` escape hatch documented as a known, deliberately
      un-exempted limitation — **relocated** to `research.md` (not a `commitlint.config.cjs`
      comment, since no pattern exists there for it to sit beside).
- [ ] T007: **WITHDRAWN.** `generatedMessages`/`nearMisses` cases for the withdrawn pattern —
      implemented, then reverted in full along with T005; `check-commitlint-config.mjs`
      confirmed byte-identical to its pre-mission (`9c269b3c`) content and still passes.
      (Original acceptance text: ~~red-first proof executed and recorded (new generatedMessages
      case fails before the pattern is added, whole script passes after)~~ — preserved for the
      historical record; superseded by the revert.)
- [ ] T008: `npm run quality:lint` run (never `nx run storybook:lint`); `ss -ltnp | grep 6006`
      confirmed clean at hand-off; real command output recorded in the mission report, not
      reasoned about.
