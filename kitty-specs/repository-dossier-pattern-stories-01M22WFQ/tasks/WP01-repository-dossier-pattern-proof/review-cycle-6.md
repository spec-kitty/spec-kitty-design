---
affected_files: []
cycle_number: 6
mission_slug: repository-dossier-pattern-stories-01M22WFQ
reproduction_command:
reviewed_at: '2026-09-09T18:40:44Z'
reviewer_agent: codex
wp_id: WP01
---

# Review finding — compact trigger label wraps at 390 px

Independent Codex review rejected
`0c001f5ff080be4772e60e6a406b4e03ecf32f38` after inspecting the
CI-authoritative images from run `34388381057`.

At 390 px, the compact drawer trigger rendered `Menu` on two lines in both D2
states and in the zoom fixtures. The trigger was shrinkable and did not protect
its short control label from the compact shell's wrapping behavior.

Remediation:

- make the native trigger a non-shrinking flex item;
- keep its visible label on one line;
- assert the computed flex and white-space contract plus a single rendered text
  line at 390 px in Chromium and Firefox;
- rebuild Storybook, recapture the affected images from hosted CI, and review
  them again before approval.

All review work used Codex; no Claude, Hermes, or `/tk` transport was used.
