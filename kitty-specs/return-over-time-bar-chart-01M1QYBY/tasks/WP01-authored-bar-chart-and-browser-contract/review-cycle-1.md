---
affected_files: []
cycle_number: 1
mission_slug: return-over-time-bar-chart-01M1QYBY
reproduction_command:
reviewed_at: '2026-09-06T19:56:30Z'
reviewer_agent: codex
wp_id: WP01
---

---
affected_files:
  - packages/styles/src/bar-chart/sk-bar-chart.css
  - packages/elements/src/bar-chart/sk-bar-chart.ts
  - packages/elements/src/bar-chart/sk-bar-chart.css.js
  - packages/elements/src/bar-chart/sk-bar-chart.css.d.ts
  - fixtures/elements-behaviour/src/sk-bar-chart.test.ts
  - apps/storybook/src/tests/sk-bar-chart.spec.ts
cycle_number: 1
mission_slug: return-over-time-bar-chart-01M1QYBY
reviewed_commit: 8ccedf7ed82613d26588d3435d2fd126f40cd367
reviewer_agent: codex-reviewer
wp_id: WP01
---

# WP01 review feedback — cycle 1

Independent review rejected `8ccedf7ed82613d26588d3435d2fd126f40cd367` with four blocking findings.

## 1. Vertical chart containment and label overlap

The plot's grid and SVG rows are not vertically constrained strongly enough. Repair the chart so
bars, grid lines, the zero baseline, values, and labels remain within their own item without
overlap. Add browser assertions for vertical containment, no label overlap, and a visible baseline.

## 2. Presentational narrow overflow

Horizontal overflow currently exists only when `selectable` is enabled. Make the narrow plot
horizontally scrollable in presentational mode as well, and add a 390 x 844 presentational
viewport/ownership test.

## 3. Canonical focus token

Use `--sk-border-focus` for the keyboard focus outline instead of `--sk-color-accent`. Update the
element's token-dependency documentation and generated CSS, and assert the actual outline color in
both dark and light themes.

## 4. Durable red-first/source-break evidence and honest gate bookkeeping

Persist named red-first/source-break evidence for ratio calculation, whole-series validation,
pre-upgrade delivery, part existence/targetability, adopted-sheet length and identity, controlled
selection non-mutation, exact event dispatch, theme parity and token bindings, forced-colors focus,
reduced motion, and narrow ownership. Each record must name the command, assertion and observed
failure, plus restoration and the green rerun. Correct any misleading `0/1` or `no_coverage`
bookkeeping only through supported canonical surfaces; do not fabricate unavailable evidence.
