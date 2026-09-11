# Tasks: Zoom Emulation And CLI Commit Scopes

**Mission**: `zoom-emulation-and-cli-commit-scopes-01M28YQ6`
**Input**: `spec.md`, `plan.md`
**Planning base / merge target**: `mission/zoom-emulation-and-cli-commit-scopes` (single_branch topology)

One bounded Work Package, implementing two unrelated harness/config fixes together per the
mission brief: neither collides with the other or with a sibling mission in flight, both are
mechanical, low-risk, reviewable-in-one-pass edits, and neither depends on the other's
completion.

## Subtask Index

| ID | Description | Requirements | Status this pass |
|---|---|---|---|
| T001 | Rewrite the CLI Auth pattern's two "200% CSS zoom" tests in `visual.spec.ts` to drive real "200% zoom" via a fresh browser context (halved viewport, `deviceScaleFactor: 2`) instead of `document.documentElement.style.zoom`; read the breakpoint pixel value/token from `cli-auth.stories.ts` at run time rather than hardcoding either side of the in-flight 390px→480px sibling migration | FR-001, FR-002, C-001 | Done |
| T002 | Add the load-bearing padding-narrows assertion (zoomed padding strictly less than an un-zoomed reference); red-first proof executed (deliberately widened the zoomed viewport past the breakpoint, confirmed the assertion failed with the exact expected/received values, reverted, confirmed it passes again) | FR-003 | Done |
| T003 | Confirm `expect.soft(...)` preserved on the screenshot call; `node scripts/check-visual-screenshot-softness.mjs` passes | FR-004, NFR-001 | Done |
| T004 | Sweep every other `style.zoom` use in `visual.spec.ts` (Mission Reading, Repository Dossier ×2, Work Explorer, Connectors); classify each against #422's defect and record the classification inline as a code comment; empirically probed (not just read by title) — Repository Dossier's `@container` query genuinely crosses under CSS zoom (verified identical result to a real halved viewport), Connectors' overflow check does not (verified `clientWidth`/`scrollWidth` unchanged under CSS zoom at the same width) | FR-005 | Done |
| T005 | Fix the Connectors 200%-zoom test the same way as T001 (halved viewport, `deviceScaleFactor: 2`); no breakpoint token to assert on, so the fix is the mechanism change plus the existing overflow assertion, now reading real narrowed-viewport dimensions | FR-005 | Done |
| T006 | Add the new bounded, end-of-line-anchored `chore(spec-kitty): materialize WP\d+ approval note into status\.json` pattern to `commitlint.config.cjs`'s `SPEC_KITTY_AUTO_COMMIT_PATTERNS`; document that (unlike its three siblings) this one's source template could not be independently re-derived from the installed CLI despite an exhaustive read, and rests on the operator-reported real failing message instead; `scope-enum` untouched | FR-006, C-002, C-003, C-006 | Done |
| T007 | Document, without exempting, `MissionStatusAggregate.save(*, operation: str)` as a confirmed, currently-uncalled, structurally unbounded commit-message escape hatch (`txn.commit(operation)` — the caller's string becomes the entire message) | FR-008 | Done |
| T008 | Add `generatedMessages`/`nearMisses` cases to `scripts/check-commitlint-config.mjs` for the new pattern; red-first proof executed (temporarily disabled the new pattern in `commitlint.config.cjs`, ran the script, observed the exact expected `AssertionError` on the new `generatedMessages` case, restored the pattern, confirmed the whole script passes including the three new `nearMisses`) | FR-007 | Done |

`npm run quality:lint` (never `nx run storybook:lint`) run clean (0 errors, pre-existing
`security/detect-object-injection` warnings only, unrelated to this mission's files). Port
6006/6100 hygiene confirmed clean (`ss -ltnp`) after the manually-started `http-server` used
for local Playwright verification was killed. `npx commitlint --from=<branch base> --to=HEAD`
run clean over every commit this mission made.
