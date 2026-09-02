# Decision Moment `01M1J00KHF3Z957ATR1QSZ744N`

- **Mission:** `storybook-renderer-and-angular-retirement-01M1HVX4`
- **Origin flow:** `plan`
- **Step id:** `story-file-edits`
- **Input key:** `story-file-edits`
- **Status:** `resolved`
- **Created:** `2026-09-02T21:22:16.751390+00:00`
- **Resolved:** `2026-09-02T21:22:30.601093+00:00`
- **Resolved by:** `operator`
- **Opened by:** `operator`
- **Other answer:** `false`

## Question

NFR-003 forbids content edits to story files, which blocks fixing the missing sk-stub.css import. Operator reports a redesign is coming that will edit story files anyway. Should NFR-003 be lifted, narrowed, or kept?

## Options

- Narrow NFR-003 to renderer-driven rewrites; permit unrelated story edits
- Keep NFR-003 as an absolute bar on story edits
- Drop NFR-003 entirely

## Final answer

Narrow NFR-003 to renderer-driven rewrites; permit unrelated story edits

## Rationale

Operator, 2026-09-02: a big redesign is coming and will edit story files regardless, so an absolute bar is not worth defending. NFR-003's evidentiary purpose is preserved by narrowing rather than dropping it: ADR-13's load-bearing claim is that no story needed rewriting TO RENDER under the web-components renderer, and that claim is still measured. Unrelated fixes (a missing CSS import, the type-import source) no longer breach it.

## Change log

- `2026-09-02T21:22:16.751390+00:00` — opened
- `2026-09-02T21:22:30.601093+00:00` — resolved (final_answer="Narrow NFR-003 to renderer-driven rewrites; permit unrelated story edits")
