---
work_package_id: WP02
title: Entity marker, inline empty state and bounded axe seam
dependencies:
- WP01
requirement_refs:
- FR-013
- FR-014
- FR-015
- FR-016
- FR-017
- FR-018
- FR-019
- FR-024
- FR-025
- FR-026
- FR-027
- FR-028
- FR-029
- FR-030
- FR-031
- NFR-001
- NFR-002
- NFR-004
- NFR-005
- NFR-007
- NFR-008
- NFR-009
- C-001
- C-002
- C-003
- C-005
- C-006
- C-007
- C-008
- C-009
- C-010
- C-011
- C-012
- C-015
- C-016
- C-017
planning_base_branch: mission/compact-work-item-extensions
merge_target_branch: mission/compact-work-item-extensions
branch_strategy: Planning artifacts for this mission were generated on mission/compact-work-item-extensions. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/compact-work-item-extensions unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
- T010
- T011
- T012
phase: Phase 2 - entity marker, inline empty state and bounded axe seam
history:
- at: '2026-09-07T00:00:00Z'
  actor: codex
  action: Prompt authored for issue #212
agent_profile: frontend-freddy
authoritative_surface: packages/elements/src/entity-marker/
create_intent:
- packages/styles/src/empty-state/sk-empty-state-inline.html
- apps/storybook/src/tests/sk-empty-state-inline.spec.ts
execution_mode: code_change
owned_files:
- packages/styles/src/entity-marker/sk-entity-marker.css
- packages/elements/src/entity-marker/sk-entity-marker.ts
- packages/elements/src/entity-marker/sk-entity-marker.stories.ts
- packages/elements/src/entity-marker/sk-entity-marker.css.js
- packages/elements/src/entity-marker/sk-entity-marker.css.d.ts
- fixtures/elements-behaviour/src/sk-entity-marker.test.ts
- packages/styles/src/empty-state/sk-empty-state.css
- packages/styles/src/empty-state/sk-empty-state-inline.html
- packages/styles/src/empty-state/sk-empty-state-html.stories.ts
- packages/styles/src/empty-state/index.ts
- apps/storybook/src/tests/sk-empty-state-inline.spec.ts
- scripts/run-axe-storybook.js
- scripts/gate-selftest.mjs
- packages/elements/src/__fixtures__/shapes.mjs
- docs/design-system/using-components.md
priority: P1
role: implementer
tags:
- elements-first
- native-semantics
- axe-anti-vacuity
task_type: implement
tracker_refs:
- '#212'
- '#208'
---

# Work Package Prompt: WP02 — Entity marker, inline empty state and bounded axe seam

## Do this first: governed Codex context

Begin only after WP01 is approved. Load `frontend-freddy` through the installed Spec Kitty resolver
and load implementation-scoped charter context. Read `AGENTS.md`, `CLAUDE.md`, issue #212,
`spec.md`, corrected `plan.md`, ADR-9/10/11 and the current component-authoring recipe in full. Use
the Spec Kitty runtime CLI for action, status and verdict state; never hand-edit runtime artifacts.

Use a Codex subagent only. Do not invoke Claude, `spec-kitty dispatch`, an Op, a review driver or a
git worktree. Work only in the existing fresh primary clone and mission branch. Verify a clean
approved WP01 baseline before editing. Do not write to GitHub or merge.

## Outcome and independent review boundary

Deliver three cohesive results:

1. independent reflected `size="sm"` and `shape="circle"` axes plus predictable directly slotted
   image cover/crop presentation on `sk-entity-marker`;
2. native `.sk-empty-state--inline`, an authored passive exemplar and generated styles-only barrel;
3. one strictly conjunctive correction to the existing axe render-verdict seam so only the valid,
   upgraded, meaningfully labelled marker with a loaded direct `img[alt=""]` is admitted.

WP02 owns these sources, their focused tests/stories/local generated outputs, the bounded axe seam,
the focused three-browser inline-empty Playwright file and `using-components.md`. It does not reopen
WP01 product sources and does not own central manifest/wrappers/ratchets/mutations or WP03's
integrated T10/visual evidence. WP03 consumes the stable result without changing these authored
contracts. WP02 is independently reviewable and eligible for an intermediate `approved` verdict,
but it MUST remain not `done`; full all-story axe/visual evidence belongs to WP03 after shared
ratchets and the coherent mission are current.

## Hard boundaries

- Do not couple marker size and shape into one enum. Do not fetch/cache/generate image bytes,
  derive initials, perform identity lookup, rewrite `alt`, infer trust/liveness or add a tone.
- Preserve the current trimmed host-label accessible-name algorithm. A nonblank host `label` is the
  single name; supported image markup uses consumer-owned `alt=""`. Blank/absent labels remain
  decorative. Nonempty image alt is documented as a duplicate-name consumer error.
- Keep `.sk-empty-state--inline` a styles-only BEM modifier on consumer-authored light DOM. It adds
  no element, role, live region, heading, status, notice, action, fallback text, `nowrap`, ellipsis
  or clipping. Supplied long copy wraps completely.
- Do not add `img[alt=""]` to the global content/media selector. Do not admit a bare role/label,
  broken/zero-intrinsic/hidden/zero-rect/nonpaintable image, indirect/descendant image, nonempty alt,
  blank label, unregistered/counterfeit host or unupgraded host. An open shadow root alone is not
  upgrade proof. Keep non-empty-root and per-host fail-closed behavior and axe rules unchanged.
- Do not add an entity-marker SC-011 subject or any slot-misroute mutation. Only `size` and `shape`
  receive new SC-010 arms. Projection, crop and naming are direct tests.
- Use existing authoritative tokens only. Do not hand-edit generated outputs; invoke the CSS and
  styles-only generators for the owned local artifacts.

## T007 — Red-first marker contract

Confirm the inherited baseline is green, then extend the existing marker fixture before production
changes:

```bash
npx vitest run --project browser fixtures/elements-behaviour/src/sk-entity-marker.test.ts
node scripts/build-elements-css.mjs --check
```

Run again and retain exact red evidence for the absent new contract. The completed tests cover:

- omitted/current default `size` and `shape`; accepted `sm` and `circle`; unknown values that warn
  and fail open on only their own axis; attribute/property reflection, toggle-after-upgrade and
  property-before-upgrade assignment for each axis independently;
- a full 2×2 size/shape matrix proving each BEM modifier affects only its own dimension;
- initials, icons and images projected verbatim; no derived or fetched identity content;
- portrait and landscape direct-slot images bounded in default/compact square/circle markers,
  `object-fit: cover`, no aspect-ratio-driven host growth and clipping at the marker boundary;
- existing marker/content parts; trimmed meaningful host label gives marker `role="img"` and the
  same single `aria-label`; absent/blank/whitespace label preserves decorative behavior;
- supported meaningful image composition is nonblank host label plus direct `img alt=""`; a
  nonempty image alt is identified as duplicate-name consumer misuse rather than rewritten.

Use DOM, computed-style and geometry assertions, not shadow-markup snapshots. Tests for projection,
crop and naming are ordinary direct assertions; do not attach invented ADR-11 ids.

Requirements: FR-013–FR-019; NFR-004–NFR-005, NFR-007; C-011–C-012, C-015, C-017; SC-004;
NI-001, NI-005–NI-006.

## T008 — Implement independent axes and image containment

Add reflected `size: 'sm' | undefined` and `shape: 'circle' | undefined` using the existing
validation/warning pattern. Omitted, empty and unsupported values retain the corresponding default
axis without suppressing the other valid axis or supplied content. Apply separate BEM modifiers so
compact-square, default-circle and compact-circle are real compositions.

Keep internal `part="marker"` as the bounded box. Reuse existing token-backed default/compact
dimensions and an existing radius token for circle; do not infer Stitch pixels or add a token.
Style only a directly slotted default-slot image with the narrowest valid `::slotted(img)` selector.
Constrain it to the marker content box, apply cover/crop, and clip at the host/marker boundary in all
four combinations without selecting an image inside a descendant component.

Make T007 green without changing the label algorithm or consumer content. Run the entire marker
fixture and authored CSS boundary/hygiene checks. Preserve existing default computed geometry.
Derive the exact unique `--sk-*` references from the entity-marker authored stylesheet and reconcile
them as a set with its existing `Token dependencies:` JSDoc. Update that comment so it contains no
missing, stale or duplicate name; use no new token or token file, and record both compared sets.

Requirements: FR-013–FR-019; NFR-002, NFR-004, NFR-007; C-001–C-003, C-007–C-008,
C-011–C-012, C-015, C-017; SC-004, SC-007; NI-001, NI-005–NI-006, NI-011–NI-012.

## T009 — Native inline empty state

First add focused source/browser assertions that red because the modifier, exemplar and story do
not exist. Create `apps/storybook/src/tests/sk-empty-state-inline.spec.ts` as the durable browser
surface, then:

- add token-only `.sk-empty-state--inline` to the existing stylesheet as one compact structural
  message; allow natural wrapping and prohibit `white-space: nowrap`, ellipsis, clipping and fixed
  physical one-line assumptions;
- author `sk-empty-state-inline.html` as passive native content carrying both base and modifier
  classes and consumer-supplied copy; include no role/live-region/heading/action/fallback;
- run `node scripts/build-styles-only-markup.mjs` to produce the local `index.ts`; never edit the
  barrel by hand;
- add `Inline`, `InlineLongNarrow`, `InlinePreferences` and `InlineLightMode` stories while keeping
  existing heading/body/action examples byte- and behavior-compatible. LightMode uses `.sk-light`;
  preference proof later uses actual media emulation.

In that focused Playwright file, prove short copy and long supplied copy at 220px, an intermediate
width and 360px, with no clipped text or page-level horizontal overflow, in default dark,
`.sk-light`, and real `page.emulateMedia({ forcedColors: 'active' })` contexts. Assert the authored
light-DOM exemplar remains passive native content with no role, live region, heading, action,
fallback or synthesized text. Empty content stays empty: the primitive invents nothing. T012 owns
the exact required build and three-browser execution command.

Requirements: FR-024–FR-028; NFR-001–NFR-002, NFR-004, NFR-007–NFR-008; C-005,
C-008–C-010; SC-003, SC-006–SC-007, SC-009; NI-009–NI-010.

## T010 — Strict conjunctive axe render evidence

At the existing self-contained, module-exported `computeRenderVerdict`/`hasOwnContent` seam, add
exactly one special case. It returns positive only when every condition holds in the rendered page:

1. the host's exact local name is `sk-entity-marker`;
2. `customElements.get('sk-entity-marker')` returns the registered constructor, the host matches
   `:defined`, `host instanceof customElements.get('sk-entity-marker')` is true, and the host has
   the open shadow root containing its authored internals;
3. the reflected host `label`, trimmed, is nonblank;
4. shadow `[part~="marker"]` has `role="img"`, the exact same nonblank `aria-label`, and is not
   `aria-hidden`;
5. the default slot directly assigns the candidate `img`, and `assignedSlot`, parent/host
   relationships and direct assignment exclude indirect or descendant-component images;
6. that image's `alt` is exactly empty;
7. it is `complete` with positive `naturalWidth` and `naturalHeight`;
8. it has a positive rendered rectangle; and
9. computed `display` and `visibility` are capable of paint.

Both readiness waiting and final root/host assertion must call this exact module-exported verdict
function. Do not create a second predicate, closure-only exception, story allow-list or global
`img[alt=""]` acceptance.

In `packages/elements/src/__fixtures__/shapes.mjs`, add a deterministic embedded data-image positive
fixture. Add a counterfeit, unregistered marker with an open shadow root and otherwise matching
marker role/name, direct loaded `img[alt=""]`, positive intrinsic dimensions and paint geometry; it
must fail the constructor/instance proof. Add independent negatives that falsify each conjunct or
subcondition: wrong local name, missing registered constructor, non-`:defined` or non-instance host,
missing authored shadow internals, blank/whitespace label, wrong marker role, marker/host
`aria-label` mismatch, `aria-hidden`, descendant image, indirectly assigned image, nonempty alt,
broken image, zero intrinsic dimensions, hidden image, zero rectangle, and otherwise nonpaintable
image. Retain `shadow-img-empty-alt`, `light-img-empty-alt`, blank host, unupgraded host and bare-
attribute shapes as rejected.

Run `node scripts/gate-selftest.mjs` red before the verdict change and green after it. Modify
`scripts/gate-selftest.mjs` only if deterministic image-load orchestration genuinely requires a
focused harness change; never duplicate or relax the verdict there. The positive must pass and each
independent negative must fail through the same exported function used by readiness and final
assertion.

Requirements: FR-030–FR-031; NFR-001; C-016; mission success criterion SC-011; NI-013. Mission
SC-011 is not ADR-11 fallback scenario SC-011 and grants no new behavior subject.

## T011 — Focused component documentation

Update `docs/design-system/using-components.md` once for all stable authored usage contracts:

- action-row card/supporting markup from approved WP01, preserving controls and consumer state;
- status pulsing as a supplied marker-only presentation flag with visible text and no liveness;
- independent marker axes, direct image cover/crop, canonical host-label plus `img alt=""` markup,
  decorative blank-label behavior and the nonempty-alt duplicate-name consumer error;
- inline empty-state markup, native/passive semantics, complete wrapping copy and distinction from
  announced block-level `sk-notice`; and
- the inline modifier's exact `--sk-*` token-dependency contract, derived from its authored CSS and
  recorded in this existing guide with no missing, stale or duplicate token name.

State that consumers own image bytes, alt choice, initials, identity, tones, status text, liveness,
copy and application data. Reconcile the documented inline token list against the authored modifier
before handoff. Do not create a token file or add a token. Do not document any route, fetching,
timer, claim/trust, lane movement, progress or Markdown contract. WP03 owns generated React usage
details and changelog.

Requirements: FR-017–FR-019, FR-022, FR-024–FR-027; C-005–C-006, C-011–C-012, C-014;
NI-004–NI-009, NI-012.

## T012 — Mutation handoff, owned generation and focused green

Do not edit `mutations.json`. Use one reversible source change at a time to prove exactly two future
SC-010 arms: one breaks only `size` property-before-upgrade preservation and one breaks only `shape`
property-before-upgrade preservation. Capture exact source `from`/`to`, subject fixture, named
`[SC-010]` test, focused failing output, zero unexplained behavior collateral and restored-green
output. Reflection, projection, crop and naming remain direct T007/T010 assertions. Do not create
SC-011 or slot-misroute arms. Hand exactly these two records to WP03 for single-writer persistence.

Regenerate/check the WP-owned outputs and run focused gates:

```bash
node scripts/build-elements-css.mjs
node scripts/build-elements-css.mjs --check
node scripts/build-styles-only-markup.mjs
node scripts/build-styles-only-markup.mjs --check
npx vitest run --project browser fixtures/elements-behaviour/src/sk-entity-marker.test.ts
node scripts/build-storybook-with-budget.mjs
npx playwright test apps/storybook/src/tests/sk-empty-state-inline.spec.ts \
  --project=chromium --project=firefox --project=webkit
node scripts/gate-selftest.mjs
node scripts/typecheck-all.mjs
npm run quality:stylelint
npm run quality:htmlhint
npm run quality:lint
```

The Storybook build and three-browser inline suite are mandatory. Require the focused suite to prove
short/long copy, 220px/intermediate/360px widths, default dark/`.sk-light`/forced colors, passive
native semantics and zero page overflow. Do not add central baselines or ratchet rows. Audit the diff
for no token/element/identity/notice/app-state expansion, no legacy empty-state regression, no global
empty-alt relaxation and no hand-edited generated bytes. Record red/green evidence through supported
Spec Kitty surfaces and leave only WP02-owned changes. Do not run the full all-story axe or visual-
baseline workflow against intentionally stale shared story ratchets; T016 owns that final proof.

## Review handoff

Submit WP02 for independent read-only review. An intermediate `approved` verdict requires the
registered-instance conjunction, the positive and every independent negative shape, the mandatory
Storybook/three-browser inline-empty evidence, both token-list reconciliations, passive semantics,
exactly two marker-axis handoffs and the disjoint owned-file set. Fold every rejection before
resubmission; approval permits WP03 to begin, but WP02 MUST remain not `done`. No WP transitions to
`done` until WP03 has run the coherent mission's full Storybook, axe and visual gates. The programme
orchestrator owns GitHub, CI artifact transport, merge and issue/epic closeout.

## Activity Log

- 2026-09-07 — Authored during the Spec Kitty tasks phase; implementation unclaimed.
