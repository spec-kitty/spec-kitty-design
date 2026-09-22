---
affected_files: []
cycle_number: 1
mission_slug: team-overview-feed-elements-01M1S8T0
reproduction_command:
reviewed_at: '2026-09-05T20:31:36Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — cycle 1

## Blocking finding

1. `packages/elements/vue.d.ts:297` emits `tone?: StatusIndicatorTone | undefined`, but the generated declaration neither declares nor imports `StatusIndicatorTone`. The required consumer gate fails with `TS2304: Cannot find name 'StatusIndicatorTone'`:

   ```text
   $ node scripts/check-vue-template-types.mjs
   ❌ Vue template types:
      packages/elements/vue.d.ts(297,16): error TS2304: Cannot find name 'StatusIndicatorTone'.
   ```

   Fix the authoritative element/generation path so the regenerated Vue declaration is self-contained. A local option is to keep the exported `StatusIndicatorTone` alias for consumers while expressing the `tone` field's manifest-facing type as the literal six-tone union; alternatively, teach the generator to import every referenced public alias. Do not hand-edit `vue.d.ts`. Regenerate CEM, React wrappers, Vue declarations and size evidence, then require `node scripts/check-vue-template-types.mjs`, the existing generated-drift gates, focused tests and typechecks to pass at the new exact head.

## Review evidence retained

- Frozen implementation SHA reviewed: `0bf6bfa631d02c002751fda5b486f984b21356f4`.
- Focused browser fixtures: 20/20 passed; full Vitest: 264/264 passed.
- Mutation harness: all 90 mutations produced their named red with no collateral; this includes all 11 WP01 arms.
- CSS/React/Vue byte-drift checks, manifest-content, entry, part, story-theme, adopted-CSS, CSS-hygiene, typecheck, lint/style and Storybook build gates passed. The byte-drift check alone did not catch the unresolved Vue type, which is why the consumer compile gate remains mandatory.
- All 12 new stories completed axe with no violations. The separate axe runner had one known scanner-concurrency fault on untouched `elements-skblogcard--default`; it is not evidence against these components.
- The two isolated Playwright failures in untouched repo-wide probes were environmental: Playwright reused an unrelated Storybook dev server already bound to port 6006, whose served `elements.js` bytes/story index did not match this lane. They are not the rejection reason.

WP02 depends on WP01 and must consume/rebase onto the corrected WP01 head before implementation proceeds.
