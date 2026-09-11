# Tasks: Zoom Emulation And CLI Commit Scopes

**Mission**: `zoom-emulation-and-cli-commit-scopes-01M28YQ6`
**Input**: `spec.md`, `plan.md`
**Planning base / merge target**: `mission/zoom-emulation-and-cli-commit-scopes` (single_branch topology)

One bounded Work Package. **Originally** two unrelated harness/config fixes bundled per the
mission brief; **the commitlint half (T006, T008) was withdrawn post-implementation** — see the
correction below the table. The mission is #422 only.

## Subtask Index

| ID | Description | Requirements | Status this pass |
|---|---|---|---|
| T001 | Rewrite the CLI Auth pattern's two "200% CSS zoom" tests in `visual.spec.ts` to drive real "200% zoom" via a fresh browser context (halved viewport, `deviceScaleFactor: 2`) instead of `document.documentElement.style.zoom`; read the breakpoint pixel value/token from `cli-auth.stories.ts` at run time rather than hardcoding either side of the in-flight 390px→480px sibling migration | FR-001, FR-002, C-001 | Done |
| T002 | Add the load-bearing padding-narrows assertion (zoomed padding strictly less than an un-zoomed reference); red-first proof executed (deliberately widened the zoomed viewport past the breakpoint, confirmed the assertion failed with the exact expected/received values, reverted, confirmed it passes again) | FR-003 | Done |
| T003 | Confirm `expect.soft(...)` preserved on the screenshot call; `node scripts/check-visual-screenshot-softness.mjs` passes | FR-004, NFR-001 | Done |
| T004 | Sweep every other `style.zoom` use in `visual.spec.ts` (Mission Reading, Repository Dossier ×2, Work Explorer, Connectors); classify each against #422's defect and record the classification inline as a code comment; empirically probed (not just read by title) — Repository Dossier's `@container` query genuinely crosses under CSS zoom (verified identical result to a real halved viewport), Connectors' overflow check does not (verified `clientWidth`/`scrollWidth` unchanged under CSS zoom at the same width) | FR-005 | Done |
| T005 | Fix the Connectors 200%-zoom test the same way as T001 (halved viewport, `deviceScaleFactor: 2`); no breakpoint token to assert on, so the fix is the mechanism change plus the existing overflow assertion, now reading real narrowed-viewport dimensions | FR-005 | Done |
| T006 | ~~Add the new bounded, end-of-line-anchored `chore(spec-kitty): materialize WP\d+ approval note into status\.json` pattern to `commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS`~~ | ~~FR-006, C-002, C-003, C-006~~ | **Withdrawn** — implemented, then reverted in full; the underlying message was hand-authored and passed to `spec-kitty safe-commit --message`, not CLI-emitted. `commitlint.config.cjs` confirmed byte-identical to pre-mission (`9c269b3c`) |
| T007 | Document, without exempting, `MissionStatus.save(*, operation: str)` (`specify_cli/status/aggregate.py:164,797`) as a confirmed, currently-uncalled, structurally unbounded commit-message escape hatch (`txn.commit(operation)` — the caller's string becomes the entire message) | FR-008 | Done — **relocated** to `research.md` (no commitlint pattern remains for a code comment to sit beside); class name corrected post-review from a misrecorded `MissionStatusAggregate` (reviewer Medium finding, zero source hits for that identifier) |
| T008 | ~~Add `generatedMessages`/`nearMisses` cases to `scripts/check-commitlint-config.mjs` for the new pattern~~ | ~~FR-007~~ | **Withdrawn** along with T006 — implemented, then reverted; `check-commitlint-config.mjs` confirmed byte-identical to pre-mission (`9c269b3c`) and still passes |

## Correction — the commitlint half (T006, T008) was withdrawn

The mission brief asserted `chore(spec-kitty): materialize WP01 approval note into status.json`
was a CLI-emitted auto-commit, the same class as #420's `chore(tracer)`/`chore(retrospective)`
gaps. This WP's own source audit of the installed CLI could not re-derive that literal message
from any call site reaching `BookkeepingTransaction`'s implicit-commit fallback, despite reading
every relevant module — and said so plainly rather than shipping unverified coverage (T006/T008
were still implemented and marked Done in this pass, per the brief as given at the time). The
coordinator then independently established the true origin: `spec-kitty safe-commit
--message`/`-m` is a caller-supplied, required argument. The message was hand-authored by a
sibling mission's implementer and passed to `safe-commit`; it was never CLI-emitted. Exempting a
hand-authored, caller-supplied sentence would have weakened the exact rule #420 exists to
uphold. T006 and T008's changes were reverted in full (confirmed byte-identical to
`git show 9c269b3c:commitlint.config.cjs` / `:scripts/check-commitlint-config.mjs`). T007's
`MissionStatus.save()` (`specify_cli/status/aggregate.py:164,797`) finding is real and
independent of the false premise, so it is kept — relocated to `research.md` as documentation
only, per the coordinator's explicit instruction. Full detail: `research.md`, `spec.md`'s
correction note, and this WP file's own `history` frontmatter entry and Part C/D withdrawal
notes.

**Second correction (post-review, Medium finding)**: the class above was first recorded
everywhere as `MissionStatusAggregate` — the reviewer verified that identifier has zero hits
anywhere in the installed CLI; the real class is `MissionStatus`. Corrected across `research.md`,
`spec.md`, `plan.md`, this file, and the WP01 task file.

`npm run quality:lint` (never `nx run storybook:lint`) run clean (0 errors, pre-existing
`security/detect-object-injection` warnings only, unrelated to this mission's files). Port
6006/6100 hygiene confirmed clean (`ss -ltnp`) after the manually-started `http-server` used
for local Playwright verification was killed. `npx commitlint --from=<branch base> --to=HEAD`
run clean over every commit this mission made, including the revert and correction commits.
