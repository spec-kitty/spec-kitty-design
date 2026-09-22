# Tracer: approach

One entry per finding: `YYYY-MM-DD · actor · <text>`.

---

2026-09-11 · claude · PR #339's own body was wrong twice about the work-explorer visual-baseline height growth before it was right. First claim: baselines were untouched. Second claim, after correction: the growth was 'exactly one device pixel, uniformly... a font-metric-driven sub-pixel mechanism' -- this was itself falsified by a lens that decoded the committed baseline PNGs' border rows pixel-by-pixel instead of reasoning about the plausible mechanism. The real cause: a genuine 45px-to-48px height change from pinning min-block-size to --sk-space-9, with layout-dependent growth of +1px (11 baselines, shared grid row >=1101px), +3px (6 baselines, own row), and +6px (1 baseline, css-zoom-200 = 2x the +3px case). Lesson: decode the pixel evidence directly before accepting a plausible-sounding rendering-mechanism explanation, even a corrected one.
