---
affected_files: []
cycle_number: 4
mission_slug: mission-reading-pattern-stories-01M21HSX
reproduction_command:
reviewed_at: '2026-09-09T03:24:42Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 acceptance-gate feedback — cycle 4

Verdict: **REOPEN** after the final train rebase, at exact lane head
`3a975e348f152a533425258a5e3a49cfc1d6846a`.

## Medium — WebKit route-loop helper resizes a still-connected prior shell

- Affected surface: `apps/storybook/src/tests/sk-mission-reading-pattern.spec.ts`, the shared
  `openStory` helper used by the all-story axe route loop.
- Evidence: after the Default story completes axe-clean at 1440px, the helper changes the viewport
  to 390px while Default's `sk-app-shell` and its `ResizeObserver` are still connected. WebKit emits
  `ResizeObserver loop completed with undelivered notifications` during that viewport change,
  before navigation to M2. All fourteen Mission Reading stories themselves render and axe-scan with
  zero violations.
- Required fix: disconnect the previous story document before changing viewport dimensions, then
  navigate to the requested story. Keep the correction inside the #265-owned test helper; do not
  suppress page errors globally, change production code, or touch #288.
- Verification: prove the route loop across Chromium, Firefox, and pinned-container WebKit; rerun
  the all-story axe case, the focused Mission Reading suite, and all 18 Mission visual cases. Any
  new commit invalidates the prior exact-head approval and requires a fresh independent review.

