---
affected_files:
- packages/elements/src/app-shell/sk-app-shell.ts
- fixtures/elements-behaviour/src/sk-app-shell.test.ts
- apps/storybook/src/tests/sk-app-shell-compact-navigation.spec.ts
- mutations.json
- packages/elements/SIZES.md
- docs/architecture/validation/issue-254-compact-navigation/evidence.md
- kitty-specs/repository-dossier-compact-navigation-shell-01M1Y3FY/acceptance-matrix.json
cycle_number: 4
mission_slug: repository-dossier-compact-navigation-shell-01M1Y3FY
reproduction_command: TMPDIR=/home/jeroennouws/dev/spec-kitty-design-missions/254/.tmp npx vitest run fixtures/elements-behaviour/src/sk-app-shell.test.ts -t 'removing the native presentation attribute' --reporter=default
reviewed_at: '2026-09-08T02:13:00Z'
reviewer_agent: codex
wp_id: WP01
---

Review result: one contract blocker.

SHA verification:

- HEAD is exactly `fc4187e5a926b343f96f7f8a27b0f40fdedb831e`.
- Base/merge-base is exactly `061f9c1757c5e600b03a9ea26ddb66df4ddbbe8e`.
- Worktree remained clean throughout the review.

Findings, by severity:

- Medium — removing the reflected `presentation` attribute does not restore the declared absent state. [`sk-app-shell.ts:40`](/home/jeroennouws/dev/spec-kitty-design-missions/254/.worktrees/repository-dossier-compact-navigation-shell-01M1Y3FY-lane-a/packages/elements/src/app-shell/sk-app-shell.ts:40) uses Lit’s default string converter, which converts attribute removal to `null`, while the public property is declared as `'compact' | undefined` and the warning logic at [`sk-app-shell.ts:100`](/home/jeroennouws/dev/spec-kitty-design-missions/254/.worktrees/repository-dossier-compact-navigation-shell-01M1Y3FY-lane-a/packages/elements/src/app-shell/sk-app-shell.ts:100) treats `null` as unknown. An exact-build Chromium probe running `removeAttribute('presentation')` produced `presentation === null` and `unknown sk-app-shell presentation "null"`. The visual layout correctly returned to legacy mode, but the runtime type and omission/no-warning contract are violated during a normal native or framework-controlled transition. Existing tests use property assignment to `undefined` at [`sk-app-shell.test.ts:434`](/home/jeroennouws/dev/spec-kitty-design-missions/254/.worktrees/repository-dossier-compact-navigation-shell-01M1Y3FY-lane-a/fixtures/elements-behaviour/src/sk-app-shell.test.ts:434), so attribute removal is untested. Normalize removed attributes to `undefined` or otherwise recognize `null` as absence, then add an attribute-removal regression.

- Low — committed evidence metadata is not fully current. [`evidence.md:11`](/home/jeroennouws/dev/spec-kitty-design-missions/254/.worktrees/repository-dossier-compact-navigation-shell-01M1Y3FY-lane-a/docs/architecture/validation/issue-254-compact-navigation/evidence.md:11) says cycle-2 was superseded only by state/evidence/containment work, omitting the later SVG and focus source fixes. Acceptance rows retain pre-final timestamps, for example [`acceptance-matrix.json:194`](/home/jeroennouws/dev/spec-kitty-design-missions/254/.worktrees/repository-dossier-compact-navigation-shell-01M1Y3FY-lane-a/kitty-specs/repository-dossier-compact-navigation-shell-01M1Y3FY/acceptance-matrix.json:194). This weakens the committed audit trail, although the supplied immutable exact-SHA logs compensate.

Acceptance coverage:

- Confirmed the prior false-slot fix uses actual `assignedSlot` relationships, including direct, wrapped, false-slot, cross-root, and cross-shell cases.
- Confirmed CSS and JavaScript share the content-box `<=860px` boundary, with 861px exiting compact presentation.
- Confirmed reflected controlled `open`, property-only `compactTrigger`, non-cancelable/bubbling/composed Escape intent, consumer-owned state, accepted-Escape restoration, ordinary/rejected-close focus release, inert/hidden navigation, and resize cleanup.
- Confirmed deterministic aria-hidden SVG plus accessible `Menu`, dark/LightMode, forced colors, reduced motion, 390px containment, real 200%/400% zoom evidence, generated wrappers/manifests/CSS, ratchets, sizes, release gates, and absence of Team Kitty routing or repository state.
- The only product coverage gap found is native `presentation` attribute removal.

Evidence integrity:

- All 12 supplied SHA-256 values matched.
- The full mutation result plus isolated 179/180 retry credibly covers all 187 mutations; the initial incomplete baseline and unit-log command typo were preserved honestly.
- Final focused browser evidence is correctly 36/36; full browser evidence is 563 passed/15 skipped, axe is 435/435 with zero violations, and the ordinary-close regression is present.
- The known local 87-case visual-host drift is not a code finding. After fixing this blocker and producing a new candidate SHA, the exact PR CI visual regression must pass before merge.

Final verdict:

REJECTED
