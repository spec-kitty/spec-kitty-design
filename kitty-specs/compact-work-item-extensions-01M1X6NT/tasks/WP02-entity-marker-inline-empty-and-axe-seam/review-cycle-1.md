---
affected_files: []
cycle_number: 1
mission_slug: compact-work-item-extensions-01M1X6NT
reproduction_command:
reviewed_at: '2026-09-07T09:07:17Z'
reviewer_agent: user
wp_id: WP02
---

# WP02 Reviewer Renata feedback

Verdict: REJECT

## Findings

- [HIGH] `scripts/run-axe-storybook.js:394` — The bounded image exception recognizes the real `sk-entity-marker` host, but the unchanged per-host scan also enumerates its shadow `<span class="sk-entity-marker">` as a separate BEM component host. For an image-only `img[alt=""]` composition, that internal span has neither generic text/media evidence nor access to the host-only exception, so the real built `elements-skentitymarker--image-naming` story fails with `component host(s) rendered nothing: span.sk-entity-marker`. The new positive self-test is not production-faithful because its fake marker internals omit the `sk-entity-marker` block class. Recommendation: make the positive fixture preserve the production internal block class and thread the same strict validated-host evidence through the internal marker host check (or otherwise narrowly avoid double-classifying that exact authored marker root), while retaining every constructor/name/direct-slot/load/paint negative and the global fail-closed rules. Disposition: must fold before resubmission.

## Evidence

- Actual built Storybook `ImageNaming` composition evaluated through exported `computeRenderVerdict`: `{ "ok": false, "reason": "component host(s) rendered nothing: span.sk-entity-marker" }`.
- Synthetic gate self-test: 48/48 classified (7 accept, 41 reject), demonstrating the fixture gap rather than satisfying the production story.
- Entity-marker fixture: 18/18 passed with the default reporter; repository floor reporter exits nonzero on the intentionally unpersisted WP03-owned behavior registry.
- Mutation replay in disposable clones: removing `reflect` from `size` killed only the named size `[SC-010]` test while shape passed; removing it from `shape` killed only the named shape `[SC-010]` test while size passed.
- Storybook budget build passed in 8.47s; CSS/styles-only generation checks, typecheck, source/adopted-CSS hygiene, and `npm run quality:all` passed.
- Inline-empty Playwright: Chromium and Firefox 8/8 passed; WebKit 4 cases could not launch because this host lacks Playwright WebKit system libraries, not because an assertion failed.

