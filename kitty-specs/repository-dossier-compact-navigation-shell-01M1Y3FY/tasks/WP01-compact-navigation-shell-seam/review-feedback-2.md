# WP01 independent Codex review — cycle 2

**Reviewed SHA:** `e870d0309d905c264ea963c2132e46a40575889f`

**Base:** `830fd3705b24bcf0db234a5693efec54300f94f5`

**Reviewer:** independent Codex seat

**Implementation verdict:** **APPROVE**

**Acceptance handoff:** **HOLD** until the final exact-SHA evidence ledger and full gate matrix are complete.

## Findings

1. **HIGH — acceptance-stage evidence remains non-final; implementation itself is not blocked.** `docs/architecture/validation/issue-254-compact-navigation/evidence.md` is still titled `PRE-REBASE`, lacks the reviewed SHA, records an interrupted mutation retry and unavailable real 200%/400% zoom proof, and promises a future rerun. The four zoom PNGs named by WP01 are absent. Final acceptance/handoff therefore remains on hold.

No implementation-blocking findings were found.

## Cycle-1 disposition

1. **Actual slot assignment: fixed.** Source uses real `assignedSlot` ancestry. Independent Chromium and Firefox probes confirmed direct and wrapped assignment succeeds while false-slot, cross-shell, and cross-root candidates receive no focus authority.
2. **Content-box boundary: fixed.** `ResizeObserver` observes and consumes content-box dimensions. Padded-shell probes in both engines were compact/open at exactly 860 content pixels and noncompact/hidden at 861.
3. **Evidence ledger: not fixed.** Carried as the acceptance-stage finding above.

The reviewer also independently verified compact-to-legacy transitions release both drawer and header focus in Chromium and Firefox without mutating `open`.

The `e870d03` `aria-hidden="true"` wait is an honest synchronization point: CSS can hide the region before the ResizeObserver/Lit render updates JS-owned exposure and focus state. It does not conceal a product defect.

## Commands and results

- `npx playwright test apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts --project=chromium --project=firefox --reporter=list` — 30 passed.
- `npx vitest run fixtures/elements-behaviour/src/sk-app-shell.test.ts fixtures/react-consumer/src/sk-app-shell.test.tsx --reporter=default` — 22 passed.
- Independent Chromium and Firefox probes — slot/root validation, focus cleanup, padded 860/861 content-box boundary, resize, and presentation-transition expectations passed.
- Generated CSS, markup, React wrappers, Vue types, manifest, size, entry/adoption, behavior, theme, gate and type checks — passed.
- `npm run quality:all` — passed with pre-existing warnings and no errors.
- `git diff --check 830fd3705b24bcf0db234a5693efec54300f94f5..e870d0309d905c264ea963c2132e46a40575889f` — passed.

One preliminary Playwright command used unsupported `--reporter=default` and failed before collection; the supported `list` reporter rerun passed 30/30. The reviewer deliberately did not run the complete mutation, full visual, or full axe suites; those remain acceptance work.

Final immutable-state check: exact requested HEAD, tracked tree clean, with only the known runtime lock `.spec-kitty/review-lock.json` untracked. No repository source, mission state, GitHub state, or history was modified by the reviewer.
