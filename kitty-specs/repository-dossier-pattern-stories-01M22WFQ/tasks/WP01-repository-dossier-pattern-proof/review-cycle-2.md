---
affected_files:
  - packages/elements/src/patterns/repository-dossier.fixture.ts
  - packages/elements/src/patterns/repository-dossier.stories.ts
  - fixtures/elements-behaviour/src/pattern-repository-dossier.test.ts
  - apps/storybook/src/tests/sk-repository-dossier-pattern.spec.ts
  - apps/storybook/src/tests/visual.spec.ts
  - expected-stories.json
  - docs/design-system/using-components.md
  - kitty-specs/repository-dossier-pattern-stories-01M22WFQ/data-model.md
  - kitty-specs/repository-dossier-pattern-stories-01M22WFQ/plan.md
cycle_number: 2
mission_slug: repository-dossier-pattern-stories-01M22WFQ
reproduction_command: npx playwright test apps/storybook/src/tests/sk-repository-dossier-pattern.spec.ts --project=chromium --project=firefox
reviewed_at: '2026-09-09T15:25:00Z'
reviewer_agent: codex-review-squad
wp_id: WP01
---

# WP01 review feedback — cycle 2

**Verdict:** REJECT
**Reviewed SHA:** `e988894a714bbf47d77b5aa69436d0c6152ce41c`
**Reviewed base:** `7a44c7037569ce149d9a1f1125a7da6f70b47508` (`origin/train/elements-first`)
**Review seats:** independent Codex seats with `architect-alphonso` and `debugger-debbie` profiles

The first-cycle truth, navigation, announcement, fixture, responsive, zoom, and packaging findings
are substantively corrected. The reviewers independently reproduced the remaining gaps below.

## Blocking findings

1. **[HIGH] The threshold proof targets progress rather than the shell layout seam.**
   The 59/60/61 progress fixture is supplemental data proof, but it does not exercise #255's
   required threshold-edge layouts. Add Dossier stories and Chromium/Firefox assertions at the
   public `sk-app-shell` compact seam (860/861, optionally 859), covering compact-versus-wide
   exposure, gutters, reflow, registration, and visual evidence.

2. **[HIGH] The safe-tracker rendered branch is unreachable.**
   Pure projection tests cover HTTP(S) validation, but every current story omits `tracker.href`, so
   the public rendered anchor branch and no-nested-anchor guarantee are not executable. Add an
   immutable resilience fixture/story that supplies a safe HTTPS tracker, prove its exact
   destination and keyboard behavior, and retain unsafe/missing static fallbacks.

3. **[HIGH] Keyboard order, keyboard activation, and focus-outline containment are unproved.**
   Pointer clicks, programmatic focus, and Escape do not prove visible-reading-order traversal.
   In Chromium and Firefox, use real Tab/Shift+Tab and Enter/Space interactions for compact closed
   and open navigation, Mission/document links, and copy controls. Assert the focused element's
   computed outline and expanded outline rectangle remain inside the visible page/drawer bounds.

4. **[HIGH] Application-owned breadcrumb and setup copy remain hard-coded in the renderer.**
   `#repos`, the setup section heading, and setup introduction must be immutable fixture input,
   consistent with the live issue and the public documentation. Render only supplied values and
   directly assert their state-specific presence and absence.

## Additional findings

5. **[MEDIUM] Progress documentation contradicts the corrected contract.**
   The fixture correctly supplies only Work Package total and percent. Update `data-model.md`,
   `plan.md`, and `using-components.md` to state that the pattern deterministically formats the
   visible total/percent labels and maps percent to native `value` with `max=100`. Remove unsupported
   progress tone/threshold ownership wording.

6. **[MEDIUM] The pushed fact duplicates its term.**
   The fixture value `pushed 6 minutes ago` is rendered after `<dt>Pushed</dt>`, producing
   “Pushed pushed 6 minutes ago.” Normalize the supplied display value and assert the accessible
   fact phrase.

## Required rerun

- Direct fixture tests and focused Chromium/Firefox behavior tests with new branches mutation-pinned.
- Regenerate and review only affected Dossier visual baselines; run focused axe and Storybook build.
- Rerun composition, generated-artifact, lint, type, package, size, security, mutation, and exact-head
  integration gates after the final train rebase.
- Populate acceptance evidence for FR, NFR, constraint, and success-criterion coverage before accept.

No reviewer edited the checkout or mission state. Both seats used Codex only; no Claude, Hermes, or
`/tk` transport was used.
