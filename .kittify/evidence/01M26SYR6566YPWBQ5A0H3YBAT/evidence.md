# Final remediation review — pass 6

- Governed review Op: `01M26SYR6566YPWBQ5A0H3YBAT`
- Profile / transport: `reviewer-renata` / fresh Claude Code read-only seat
- Rejected point-cut: `9510b74e6103aec15aa187d3121a73f91fe84d3e`
- Compared from: pass-5 rejected point-cut `c5337dd9f82e5f1467616f2563f0ac9b177b3794`
- Verdict: **REJECT** — zero High, one Medium, five Low findings
- Tree: clean at reviewer start and finish; the reviewer made no repository or mission-state changes

## Medium finding requiring remediation

### M1 — a denied-storage preference does not survive a zero-control gap

`DocumentTheme.disconnect()` deletes the per-document coordinator when the last connected control
disconnects. If storage access throws, a later new control therefore constructs with `system` and,
as the new first control, resets the root. A real-Chromium black-box probe reproduced:

1. deny both storage reads and writes;
2. select Dark and observe the dark root;
3. remove the only control;
4. mount a new control;
5. observe preference `system` and root Light.

This contradicts US2-9 and the documented claim that a current-page choice continues when storage
is denied. It is user-visible in SPAs that remount a header during navigation. The existing denied-
storage test covers only a later control mounted while another control remains connected.

Disposition: fresh implementation seat. Preserve the per-document preference through a zero-
control gap while releasing the System listener at the last disconnect, and add a red-first test
covering denied storage, manual Dark, last disconnect, and later new mount.

## Low findings

- L1: a synchronous `sk-theme-change` handler that reverts `preference` can leave Lit's radio
  `.checked` binding stale. The reviewer recommends `live(this.preference === value)` and a test.
- L2: a connected invalid markup attribute normalizes behavior to System but Lit retains the
  literal invalid attribute during attribute-to-property conversion; narrow the documentation's
  “never reflected” wording or explicitly canonicalize it.
- L3: an explicit authored `preference` overrides the saved preference without persisting the
  override, which can produce bootstrap-to-upgrade theme change. Document that ordinary consumers
  should omit the attribute unless they intentionally own the initial preference.
- L4: the runtime lane ownership list predates some accepted test/bootstrap files. One bounded WP
  means there is no ownership conflict; reconcile generated/runtime scope if the accept step
  exposes a supported mechanism rather than hand-editing mission state.
- L5: the one-query-authority Node test counts literal source occurrences and is intentionally
  structural but brittle to comments.

L1-L3 should be folded into the bounded remediation because they touch the same control contract.
L4-L5 do not justify scope expansion.

## Pass-5 disposition verified

- High zoom/content finding: closed. The reviewer injected `density="compact"` and independently
  made the new line-box/clipping-ancestor detector fail at desktop, measured 200% geometry, and
  narrow width. The committed source tree and diff hashes reproduced, both PNGs were inspected,
  and all four header strings were complete without ellipsis.
- Connected multi-control coherence: closed for connected controls; M1 is the remaining gap.
- Invalid direct and pre-upgrade property normalization: closed.
- Single media-query authority and exact adapter arguments: closed.
- Manifest, root barrel, built export/declaration, React/Vue types, bootstrap, size/SRI, and package
  exports: closed.

## Independent checks

- Focused browser behavior: 54/54 passed.
- Node contract and root barrel: 11/11 passed.
- Direct temporary Storybook build plus Chromium composition/no-JS: 14/14 passed.
- Uncached typecheck: 5/5 projects.
- Bootstrap, Vue, CSS, static markup, manifest-content, pattern-composition, behavior-import, lint,
  commitlint, temporary bundle identity, package size and SRI checks passed.
- React wrapper check produced all 65 files for 31 elements byte-identically twice when
  `FORCE_COLOR` and `NO_COLOR` were both unset. With the session's contradictory color variables,
  the third-party generator returned but kept the Node event loop alive; this is tooling friction,
  not output drift.
- WebKit, full Playwright/axe/release/audit, and the full 260-arm mutation sweep were not run by
  this read-only seat. They remain operator gates.
