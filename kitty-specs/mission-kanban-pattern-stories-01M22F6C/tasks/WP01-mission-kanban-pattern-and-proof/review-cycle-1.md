---
affected_files: []
cycle_number: 1
mission_slug: mission-kanban-pattern-stories-01M22F6C
reproduction_command:
reviewed_at: '2026-09-09T12:24:12Z'
reviewer_agent: codex
wp_id: WP01
---

# WP01 independent review — changes requested

Exact implementation tree reviewed: `0d998d7268e0b37132a2099fabd32c8e99f89270`.

## Finding 1 — K6 creates a dead board tab stop when the desktop board fits

- Severity: HIGH
- Files: `packages/elements/src/patterns/mission-kanban.stories.ts:701-703,834-837`; `apps/storybook/src/tests/sk-mission-kanban-pattern.spec.ts:425-441`
- Requirements: FR-009, NFR-002, NI-006
- Explanation: K6 unconditionally passes `overflowing: true`, and the render helper turns that presentation flag directly into the region/name/tab-stop triad. Independent Chromium measurement of the built K6 story at its committed 1600x1000 visual viewport returned `scrollWidth=1256` and `clientWidth=1256` while the scroller still had `role="region"`, `aria-label="Work package Kanban"`, and `tabindex="0"`. The board therefore fits but remains a redundant keyboard stop, which FR-009 and NI-006 explicitly forbid. At 1280x800 it did genuinely overflow (`scrollWidth=1172`, `clientWidth=936`), demonstrating that one hard-coded semantic state cannot truthfully cover both layouts. The focused test currently codifies the incorrect unconditional triad instead of measuring overflow.
- Required remediation: derive or update the overflow semantics from actual rendered overflow so the triad exists only when `scrollWidth > clientWidth`; preserve K2's genuine named focusable overflow. Add browser assertions covering both a fitting K6 desktop viewport (triad absent) and a K6 viewport that genuinely overflows (triad present and focus remains contained). Do not add a dead tab stop merely to make the empty state keyboard-focusable.
- Disposition: must_fix_before_approval

## Finding 2 — Required story-total maintenance changes an unowned frozen surface

- Severity: HIGH (governance/frozen-surface)
- File: `apps/storybook/src/tests/sk-checkbox-choice-group.spec.ts:354`
- Requirements: WP01 Files and ownership clause; T012 exact-head/no-drift gate; NFR-009
- Explanation: the implementation changes the predecessor #277 assertion from total 391 to 401, but this file is absent from WP01 `owned_files`, and the prompt says only the six listed authored/product evidence surface groups may change. The update is behaviorally necessary because #278 adds exactly ten discovered stories, so simply reverting it would leave the existing global ratchet failing. Remote train movement does not retroactively authorize this exact reviewed diff, and the integration total must in any case be recomputed after the final train refresh.
- Required remediation: amend WP01 ownership through the Spec Kitty-authorized mission/task workflow to include this exact predecessor test, document why the global-total ratchet is an integration-sensitive shared assertion, then update it to the exact refreshed-train total plus ten and rerun both #277/#278 focused suites. This bounded ownership amendment is preferable to redesigning/removing the global-total assertion: changing that test design would alter #277's accepted evidence semantics beyond #278's scope and should require a separate owned decision/mission if desired.
- Disposition: must_fix_before_approval

## Independent evidence

- `node scripts/check-pattern-composition.mjs`: PASS (5 fixture modules; Mission Kanban composition recognized; no reach-through/copied CSS).
- `node scripts/typecheck-all.mjs`: PASS (5 projects).
- `npm run quality:all`: PASS (lint/stylelint/htmlhint; controlled-key object-injection warning only).
- `npx nx run storybook:storybook:build`: PASS; built index contains exactly ten user-facing Mission Kanban entries plus docs.
- Pinned `mcr.microsoft.com/playwright:v1.62.1-noble` focused replay: 48/48 PASS across Chromium, Firefox, and WebKit. This does not clear Finding 1 because the current K6 test asserts the defective unconditional semantics.
- Pinned Noble owned visual replay: 10/10 PASS in Chromium against the committed PNGs.
- All ten PNGs were directly inspected against the durable UX evidence. K1-K5, LightMode, long-content, forced-colors, and reduced-motion are visually acceptable; K6 correctly shows five empty lanes and no CTA, but its fitting desktop image corroborates Finding 1's dead semantic tab stop. No legacy PNG was changed.
- No public/generated element, wrapper, token, CSS-module, barrel, manifest, or application surface is present in the reviewed diff. No #279-#284 implementation was found.

## WP anti-pattern checklist

1. Dead code: PASS — Storybook-owned helpers are used by the discovered story family/tests and no public production API is added.
2. Synthetic-fixture test: PASS — the focused suite exercises built Storybook output; source guards are supplemental.
3. Silent empty return: PASS — no silent production return/catch path was introduced.
4. FR coverage: FAIL — FR-009/NI-006 are contradicted by K6's fitting-desktop dead tab stop (Finding 1).
5. Frozen surface: FAIL — an explicitly unowned predecessor test is modified (Finding 2).
6. Locked decision: FAIL — the unconditional K6 triad violates the locked conditional-overflow decision (Finding 1); the no-app/public-API and consumer-owned behavior boundaries otherwise pass.
7. Shared-file ownership: N/A for cross-WP conflicts because this mission has one WP; the unowned predecessor file is recorded under frozen-surface Finding 2.
8. Production fragility: PASS — the story-only fixture guards fail closed and no production runtime exception path is added.

Verdict: **REJECT**. Both findings require a corrected successor SHA and fresh independent review.
