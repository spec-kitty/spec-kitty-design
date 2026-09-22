# Tracer: design-decisions

One entry per finding: `YYYY-MM-DD · actor · <text>`.

---

2026-09-11 · claude · The pre-merge squad's most valuable finding (round 1, finding #2) was that the forced-colors border-width assertion, as first written, compared danger-secondary's width only against an implicit expectation rather than against secondary's own measured width in the SAME emulation/colour-scheme pass -- an expect(x).toBeGreaterThan(0)-style shape that could never fail, since any non-zero computed width would satisfy it regardless of whether the real distinguishability property held. The fix added an absolute anchor (secondary's own border asserted to be exactly 1 in both modes) so the comparison could not be satisfied by degrading the comparator, and the squad demanded and got red-first proof: reverting the CSS block reproduced a real failure ('Expected: > 1, Received: 1') before the fix was restored. General lesson: a comparative/threshold assertion is not verified as a real gate until someone has watched it fail.
