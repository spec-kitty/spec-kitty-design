# WP01 review feedback — cycle 5

- Reviewed exact HEAD: `60d5261bb0c50f4af0d20ac6de850cef240d92d4`
- Base: `7032cf7792a83ee20d9fd70ddcfb28a057c72884`
- Reviewer transport/profile: fresh read-only Codex / `debugger-debbie`
- Verdict: **REJECT**

## Medium finding — load-sensitive axe test harness

`apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts` calls `getViolations`
immediately after Storybook navigation. Under concurrent browser load this races
Storybook addon-a11y's same-page axe run and throws before producing an accessibility
result.

Independent reproduction:

```text
STORYBOOK_PORT=63357 npx playwright test \
  apps/storybook/src/tests/sk-theme-toggle-pattern.spec.ts \
  --project=chromium --grep='axe-clean' --repeat-each=12 --workers=12 --reporter=line

4 failed, 8 passed
all failures: Error: Axe is already running
```

This is a test-harness reliability defect, not a component or accessibility violation.
The focused accessibility test passed without contention, and the independent full-story
axe gate rendered all 637 stories with zero WCAG 2.1 AA violations.

Required disposition: change only the mission-owned test to use a bounded poll/retry for
the exact `Axe is already running` transient, following the repository's established
`axeIsClean` helpers. Rethrow every other error immediately and retain the exact final
zero-violations assertion. Prove the fix with the stressed reproduction and the full
Chromium matrix.

## Runtime scan

No other High or Medium findings were found in the resolver, invalid/stored-value paths,
throwing storage, modern or legacy media-query listener lifecycle, SSR import safety,
pre-paint bootstrap, or overlapping story-session cleanup.
