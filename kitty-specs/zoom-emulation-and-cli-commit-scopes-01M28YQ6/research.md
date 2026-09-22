# Research: Zoom Emulation And CLI Commit Scopes

## Correction — the commitlint half of this mission's brief rested on a false premise

The mission's original brief asserted the CLI itself emitted
`chore(spec-kitty): materialize WP01 approval note into status.json`, and framed the gap as a
third instance of #420's class (a CLI-authored, non-conventional message this project does not
control). WP01's own source audit (below, preserved as-run) could not independently re-derive
that message from the installed CLI's source despite reading every call site that reaches
`BookkeepingTransaction`'s `chore(spec-kitty): {operation}` implicit-commit fallback, and said
so plainly rather than shipping unverified coverage.

That gap was then closed independently by the coordinator: `spec-kitty safe-commit --help`
shows `--message`/`-m` as a **caller-supplied, required** argument — the CLI commits whatever
text the caller passes, it does not generate this message. The only `materialize` hits found in
the installed package are unrelated migration internals (`materialize_snapshot`,
`materialize_to_json` in `specify_cli/status/reducer.py` — pure snapshot→JSON functions, not
commit-message producers). **The message was hand-authored by a sibling mission's implementer
and passed to `safe-commit` as `-m`; it is not a CLI-emitted shape.** The implementer who hit it
described it as CLI-auto-generated, that description was relayed without independent
verification, and the mission brief repeated it. Exempting it from commitlint would have been
actively wrong: it would have exempted an arbitrary sentence an agent invented, under a config
whose entire design is that only exact, anchored, CLI-emitted messages get exemptions —
weakening the exact rule #420 exists to uphold. The correct response to an agent writing a
non-conforming commit message is for the agent to write a conforming one, which is what
happened at the time (the message was reworded).

**Action taken**: the `chore(spec-kitty): materialize WP\d+ approval note into status\.json`
pattern added to `commitlint.config.cjs` and its `generatedMessages`/`nearMisses` cases in
`scripts/check-commitlint-config.mjs` were reverted in full — confirmed via `diff` against
`git show 9c269b3c:commitlint.config.cjs` / `git show 9c269b3c:scripts/check-commitlint-config.mjs`
to be byte-identical to the pre-mission state, with `node scripts/check-commitlint-config.mjs`
re-run green afterward. `spec.md` and WP01's task file were updated to drop the commitlint
requirements (FR-006, FR-007, C-002, C-003, C-006, NFR-002) and record this correction. The
mission is #422 only.

## CLI `chore(spec-kitty)` operation-vocabulary audit — preserved as-run, for the record

Source: `spec-kitty-cli` 3.2.6rc4, installed at
`~/.local/share/uv/tools/spec-kitty-cli/lib/python3.14/site-packages/specify_cli/` (read-only).

`specify_cli/coordination/transaction.py:561`'s `BookkeepingTransaction.__exit__` emits
`f"chore(spec-kitty): {self.operation}"` only when a transaction is never explicitly
`.commit()`/`.commit_idempotent()`-ed, and `operation` is a free-form `str` at that API boundary
(not an enum). Grepping every `operation=` literal across the installed CLI and tracing each
call site's commit path found:

- `specify_cli/coordination/status_transition.py`'s three `operation or f"..."` defaults
  (`status transition {wp_id}`, `inner-state annotation {wp_id}`, `status transition batch
  {first.wp_id}`) all reach the implicit-commit fallback. All three are already covered by
  `commitlint.config.cjs`'s existing patterns (added by #420 and its predecessor work).
- `specify_cli/cli/commands/implement.py:839` and
  `specify_cli/cli/commands/agent/workflow_executor.py:884/1095/1762` pass `operation=` but
  always call `txn.commit_idempotent(message)` explicitly with a *different*, non-`chore
  (spec-kitty)` message — the `operation` string never reaches a real commit through those call
  sites.
- No other call site anywhere in `specify_cli` passes `operation=` to this fallback path.

**Conclusion at the time**: the three existing commitlint patterns already fully enumerate what
the installed CLI's *current* shipped call sites can default to through this specific
mechanism. No fourth pattern was warranted by this audit alone — see the Correction above for
how the (mistaken) fourth pattern actually got added and then reverted.

## Connectors zoom test — CI-only render instability, mechanism reverted

**Outcome**: the Connectors "200% zoom" test's mechanism (halved viewport + `deviceScaleFactor:
2`, the same fix as CLI Auth) was reverted back to the original `document.documentElement.style
.zoom = '2'` emulation, and the test was **renamed** to `'Connectors 200% CSS zoom stress — C8
project routing baseline, no document-level horizontal overflow'` — #422's own second option
("keep the current emulation and rename the evidence to what it actually establishes"), the same
honest-naming treatment already applied to the Mission Reading and Work Explorer sites in this
same sweep. CLI Auth's fix (the same mechanism) is unaffected and stands on its own merits — its
two baselines are stable in CI.

**Why.** The coordinator harvested CI's `visual-regression-diffs` artifact after the halved-
viewport mechanism was first shipped for Connectors and found a genuine render instability, not
a harvesting problem. From CI's own call log, the SAME element (`[data-connectors-pattern]`,
story `c-8-project-routing-populated`) on the SAME page, inside a **single**
`toHaveScreenshot` call's internal stability-retry loop, captured two different heights seconds
apart:

```
- Expected an image 1376px by 2310px, received 688px by 1150px.
- waiting 100ms before taking screenshot
  ... taking element screenshot / waiting for element to be stable
- Expected an image 1376px by 2310px, received 688px by 1165px.
- waiting 250ms before taking screenshot
  ... taking element screenshot / waiting for element to be stable
- Expected an image 688px by 1165px, received 688px by 1150px.
```

A 15px height oscillation (1150 → 1165 → 1150) that Playwright's own stability check could not
settle. This appeared **only** at the halved viewport (720 CSS px wide) under
`deviceScaleFactor: 2` — it is not present in the reverted test's full-size (1440px,
`deviceScaleFactor: 1`) capture, which is stable both in this investigation's local runs and,
implicitly, in every prior CI run before this mission touched the mechanism (the baseline
predates this mission and was never flaky before).

**What was ruled out, and how (source, not just failed reproduction).** The most likely
candidate — a web font swapping metrics after the "fonts loaded" step (`font-display: swap`
FOUT/FOIT) — is ruled out by reading the source, not merely by failing to reproduce it:
`connectors.stories.ts` and `packages/styles/src/data-table/sk-data-table.css` both resolve text
via `--sk-font-sans` / `--sk-font-mono`, and both tokens
(`packages/tokens/src/tokens.css`) are pure system-font stacks (`ui-sans-serif, system-ui,
-apple-system, "Segoe UI", Helvetica, Arial, sans-serif` / `'JetBrains Mono', ui-monospace, "SF
Mono", Menlo, Consolas, monospace`). `tokens.css`'s own comment confirms the `JetBrains Mono`
`@import` from Google Fonts "never fired" (0 import rules), so it always falls through to
`ui-monospace`. The only `@font-face` rules anywhere in the codebase (`Falling Sky`, `Swansea`,
30+ weight/style variants, all `font-display: swap`) are declared in `tokens.css` but referenced
by no `font-family` value anywhere else in the repository (`grep -rln "Falling Sky\|Swansea"
packages/ apps/` returns only `tokens.css`/its compiled `dist`/bundle copies) — confirmed nothing
on this page ever loads or swaps a custom webfont. This elimination saves the next investigator
the entire font-swap search.

Also checked and ruled out: lazy/virtualized rows (the table rows render synchronously from a
plain array `.map()`, no virtualization), images/icons without intrinsic dimensions (none found
in the composed tree), and any `ResizeObserver` / `MutationObserver` / `setInterval` /
`requestAnimationFrame` / CSS `animation` / `transition` anywhere in `connectors.stories.ts`,
`sk-data-table.css`, or `sk-page-header.ts` (none found; `sk-page-header.ts` has no async
lifecycle hook beyond Lit's standard synchronous-by-screenshot-time render).

**Unconfirmed structural theory — clearly labelled as unconfirmed, not a finding.**
`.sk-data-table__scroller` (`packages/styles/src/data-table/sk-data-table.css`) sets
`overflow-x: auto; overflow-y: auto;` with no `max-height`/`max-block-size` anywhere constraining
it. A horizontal scrollbar toggling in/out reserves/releases vertical space at the bottom of the
scroller; if the table's rendered content width sits right at the scroller's 640px boundary
under CI's specific font rendering (glyph widths differ from local — see below), a
scrollbar-appears/disappears oscillation is structurally possible and would plausibly produce a
height delta in the range observed. **This was never confirmed.** No CI-equivalent environment
was available to test it against, and it is recorded here only so a future investigator with CI
access has a concrete first thing to check, not as an established cause.

**Why local reproduction was not possible.** Three separate local attempts — five independent
full Playwright test invocations, a custom 2-second polling timeline sampling
`getBoundingClientRect().height` every ~50ms, and the same probe under
`Emulation.setCPUThrottlingRate: 6` (simulating a loaded CI runner) — found zero instability:
the pattern's height was bit-identical across every sample. This is not evidence of stability in
CI. The local element height measured throughout was `1224.375` CSS px; CI's own log shows
`~575-582` CSS px (`688x1150`/`688x1165` device px ÷ `deviceScaleFactor: 2`) for the same
element, story, and viewport width — a roughly 2x gap that can only mean local Chromium and CI's
`ubuntu-latest` runner resolve the page's fonts (and therefore its whole layout) very
differently. That gap is itself the reason local reproduction failed, not evidence the
instability is somehow CI-infrastructure noise unrelated to rendering — any future attempt to
root-cause this for real needs to run inside CI itself, or an environment that reproduces CI's
font stack, not a local workstation.

## `MissionStatus.save(*, operation: str)` — a real, currently-uncalled, unbounded escape hatch

> **CORRECTION (post-review, Medium finding).** This section originally named the class
> `MissionStatusAggregate` throughout. The reviewer verified that identifier does not exist
> anywhere in the installed CLI (`grep -rn "MissionStatusAggregate"` across the whole package:
> zero hits) — the real class is `MissionStatus`, defined at
> `specify_cli/status/aggregate.py:164` and exported via that module's `__all__`. The
> behavioral claim below (uncalled, structurally unbounded, correctly un-exempted) was verified
> correct by the reviewer independently; only the identifier was wrong, consistently, everywhere
> it appeared. Corrected here and everywhere else it appeared in this mission's artifacts.

Kept as documentation per the coordinator's explicit instruction ("you were right not to exempt
it... record it wherever this mission's notes live, so that if it ever does get called, the
next person knows the shape").

`specify_cli/status/aggregate.py:164`'s `MissionStatus.save(*, operation: str)` is a
documented "low-level escape hatch" (its own docstring: *"Human-readable operation label for the
commit message"*) that calls `txn.commit(operation)` directly:

```python
def save(self, *, operation: str) -> CommitReceipt:
    ...
    with BookkeepingTransaction.acquire(
        repo_root=self.repo_root,
        mission_id=self.mission_id,
        mission_slug=self.mission_slug,
        mid8=self.mid8,
        destination_ref=destination_ref,
        operation=operation,
    ) as txn:
        for artifact_name in (EVENTS_FILENAME, SNAPSHOT_FILENAME):
            artifact = txn.feature_dir / artifact_name
            if artifact.exists():
                txn.stage_path(artifact)
        return txn.commit(operation)
```

The caller's `operation` string becomes the **entire** commit message via `txn.commit(operation)`
— not a `chore(spec-kitty):`-prefixed suffix the way the implicit-`__exit__` fallback produces
it. Confirmed via `grep -rn "\.save(operation=" specify_cli/` (and a broader `grep -rn
"operation=" specify_cli/`, reviewed call-by-call): **zero callers** anywhere in `specify_cli`
3.2.6rc4 currently invoke it. No message from this path has ever been observed.

This is nonetheless a real, shipped, structurally unbounded surface: if a future CLI version (or
an external caller of the CLI's public API, e.g. `orchestrator-api`) wires a caller to
`MissionStatus.save()` (`specify_cli/status/aggregate.py:797`), whatever string that caller passes becomes a real git commit
message with no template constraint at all — commitlint has no way to distinguish it from an
arbitrary human sentence, because structurally it *is* one. No closed regex could honestly
cover it without becoming exactly the blanket exemption `commitlint.config.cjs`'s own anchoring
comments warn against, so it was correctly left un-exempted rather than guessed at.

**If this ever gets called and its real output fails `lint-code`**: that is this config working
as intended (an uncontrolled message correctly failing normal conventional-commit rules), not a
gap in it. The fix at that point is either (a) the CLI call site reworded to a conventional
message before calling `.save()`, or (b) if the CLI genuinely cannot avoid emitting this
uncontrolled shape as an unavoidable auto-commit, a *narrow* pattern added at that time, bound to
the real observed message and re-verified against source the way this file's other patterns are
— not a preemptive open exemption for the parameter's type signature.
