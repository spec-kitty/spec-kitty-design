---
affected_files: []
cycle_number: 1
mission_slug: webkit-timing-deflake-01M2T31J
reproduction_command:
reviewed_at: '2026-09-18T15:03:57Z'
reviewer_agent: user
wp_id: WP02
---

# WP02 review — changes requested

**Scope of this review**: T010–T016 (incl. T015a), FR-001..004, NFR-003/005/007, C-001/002/003/007/010/011/012.
Verified independently: CSS diff against mission base is empty; test-only fix; all 5 rig selectors
(416/487/503/522/567) resolve to the intended tests; red-first run `35358002926` completed (not
cancelled) at 0/10 for all five items; post-fix runs `35356189046`/`35357249473` exist; C-001/C-002/C-003
hold (no skip/fixme/.only/retries anywhere in the file; the two retained `waitForTimeout` durations in
each of items 1/2/4 — 300/300/400/400ms — are byte-identical to the pre-mission file, confirmed by
diffing against `kitty/mission-webkit-timing-deflake-01M2T31J:apps/storybook/src/tests/sk-progress.spec.ts`;
`pinAnimationPhase` is event-driven (double `requestAnimationFrame`), not a disguised timeout, and it
*replaces* two of the six original waits rather than lengthening any); C-010 symlink is real and points
at the repo root's `tmp/finding/`.

## Blocking issue: `pinAnimationPhase`'s doc comment claims CI evidence that the code does not produce

`apps/storybook/src/tests/sk-progress.spec.ts` lines 81–83 (the doc comment above `pinAnimationPhase`):

> "...via `pseudoElement` on each returned `KeyframeEffect`, **attached as a test annotation so the CI
> record proves which layer webkit actually returned animations for**"

This is the one piece of evidence that would resolve — or at least narrow — disclosed-unknown (b) (T013's
claim that `getAnimations({subtree: true})` reaches the vendor pseudo-element under webkit). The comment
says it is captured on every CI run.

It is not. `pinAnimationPhase` computes and returns `{ pseudoElement, durationMs }` per animation, but at
both call sites (item 3, lines 511–517, and item 5, lines 583–588) the returned array is used **only**
via `.length` and `.map(a => a.durationMs)`. `pseudoElement` is never read, logged, or attached anywhere.
Confirmed by grep across the whole file: zero hits for `console.`, `.attach(`, `testInfo`, or
`annotations`. So no CI run — clean or otherwise — has ever recorded which pseudo-element(s) webkit
actually returned, despite the comment's claim that this "proves" it and is CI-visible.

This is exactly the failure mode this mission's evidentiary bar exists to catch: a claim of proof that
does not correspond to any artifact. It needs one of:

1. **Preferred** — actually wire it up: `test.info().annotations.push({ type: 'sk-progress-pseudo-elements', description: JSON.stringify(atStart) })` (or equivalent) at both call sites, so a future CI record genuinely contains the pseudo-element list and this becomes real, checkable evidence toward closing unknown (b) — cheap, low-risk, and it's within WP02's owned file.
2. Or, if that's out of scope for this WP, strike the "attached as a test annotation so the CI record
   proves..." clause from the comment and replace it with an accurate statement (e.g., "the returned
   `pseudoElement` values are available to a caller for future instrumentation but are not currently
   logged or asserted on — see disclosed unknown (b)").

Either is acceptable; leaving the comment as-is is not, because it misrepresents the evidentiary state of
unknown (b) to the next reader of this file.

## Non-blocking, please carry forward (does not block approval, but must not be lost)

- **Item 3 (SC-001/FR-013)**: post-fix samples are 10/10 then 9/10 across two separate runs — not the
  clean 10/10 SC-001 and this WP's own "Independent test" bar ask for. `evidence/WP02-sk-progress.md`
  discloses this honestly (two samples shown, not the better one, with the residual 1-in-10 marked as
  undiagnosed — unknown (c)). Please make sure WP02's own move-task/completion note carries the same
  explicit caveat (not just the shared evidence file), so item 3 is tracked at mission close-out as
  "substantially improved, not fully fixed" under FR-013, not silently folded into "5/5 fixed."
- **NFR-005 paper trail**: the fix widens `samplePixels`' offsets from `x=2`/`x=w-3` to `x=10`/`x=w-11`
  on the strength of "10px clears the dead band." The band's own outer edge was never mapped (e.g. by
  sampling at 4/6/8px) — reasonable given webkit doesn't run locally and CI time is expensive, but the
  claim "the after-form covers at least the before-form" rests on an unstated premise (the old offsets
  were already non-discriminating in that band on every fixture, so there is no real coverage being
  given up) that's worth one explicit sentence in the evidence doc rather than left implicit.

## The mission-carrying claim ("#451 introduced no component defect")

The Complete-fixture control (100%-filled, no clip-path, still reads track background at the old
offsets on all 10 measured repeats) is a genuinely good control for the *scoped* claim — nothing #451
touched could explain a dead band that reproduces identically on a fixture with no clip geometry to
break. Read narrowly ("no #451-introduced regression, and no CSS edit within this WP's ownership could
fix this"), the claim holds. Read broadly ("WebKit's rendering of `::-webkit-progress-value` at this
edge is not itself a rendering limitation worth someday fixing"), it is not established either way — the
WP does not claim the broader reading, so no correction is required to the WP's own wording, but the
next reader should not extend the claim past what was tested.
