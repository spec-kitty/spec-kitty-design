---
affected_files: []
cycle_number: 2
mission_slug: flow-health-transition-matrix-01M1PGNJ
reproduction_command:
reviewed_at: '2026-09-05T00:16:57Z'
reviewer_agent: user
wp_id: WP02
---

# WP02 review feedback — cycle 2

Reviewed commit: `3659c3f6849c35115c94356565d1507350d82b1a`

Comparison base: approved WP01 commit `b7a20a96ab3f7a3f436ace41bc05b58f3488b073`

## Blocking finding

### 1. HIGH — Scrolled magnitude bars paint over the sticky route owner at the required narrow viewport

At the approved 390×844 viewport and maximum horizontal scroll, the route header remains
geometrically fixed, but earlier magnitude cells paint above it. The existing diagnostic capture
`/tmp/wp02-cycle1-visuals/sk-transition-matrix-narrow-scrolled-actual.png` visibly shows bars and
counts crossing route labels such as `Planned → In progress` and `In progress → For review`.

An independent Chromium probe against the built `ApprovedExample` confirmed the paint-order defect:

```text
scrollLeft: 380
routeRect: left 1, right 149.0625
route z-index: auto
overlapping bar 1: left -78.9375, right 6.765625
shadowRoot.elementFromPoint(overlap): .sk-transition-matrix__bar
route owns hit: false
overlapping bar 2: left 65.0625, right 165.0625
shadowRoot.elementFromPoint(overlap): .sk-transition-matrix__bar
route owns hit: false
```

`packages/styles/src/transition-matrix/sk-transition-matrix.css:132-142` makes the route cell sticky
and opaque but gives it no effective paint-order ownership. The functional assertion at
`apps/storybook/src/tests/sk-transition-matrix.spec.ts:258-274` compares the sticky header only with
the *last* magnitude cell. It therefore passes even while earlier scrolled cells and their bars are
on top of the route label. This violates FR-016, T007 step 9, T010 step 3, the narrow-layout
Definition of Done, and the plan's explicit `Sticky labels paint under cells` risk.

Remediation:

1. Make every sticky route header, including the column heading and selected/hovered/pressed rows,
   own the foreground paint order while retaining an opaque token surface. Stay inside the existing
   token/scope contract; do not add token, package, lockfile, ADR, or sibling-source changes.
2. Strengthen the named narrow Playwright test at maximum scroll so it checks every visible
   route-label/data overlap and proves hit-testing/paint ownership belongs to the sticky route cell,
   not to a magnitude bar, value, or data cell. Keep the existing displacement assertion as a
   separate condition.
3. Record a real source/style mutation that removes the repaired paint-order protection and makes
   that exact named test fail for overlap, then restore byte-for-byte and rerun it green. The existing
   `position: sticky` → `static` mutation proves displacement only; it does not catch this defect.
4. Rebuild Storybook and rerun the narrow test in Chromium and Firefox. Produce a fresh local
   diagnostic capture, verify labels and magnitudes no longer cross, and remove local writes. The
   nine CI-authoritative baselines remain correctly deferred until the post-WP03 draft PR.

## Prior cycle HIGH findings

All four cycle-1 blockers are closed at the reviewed SHA:

1. **Theme parity — PASS.** `Default` and `LightMode` use the same compact data and interaction/copy
   configuration. The focused Playwright assertion compares content, route/value/total/group/header
   relationships and proves both paired surface and foreground computed token values differ across
   dark/light. It passed in Chromium and Firefox.
2. **Per-instance table/group ownership — PASS.** Every magnitude has an `aria-describedby` that
   resolves to its route's component-owned total id; every named grouped `tbody` is
   `aria-labelledby` by its visible heading; ids are unique and resolve across two live instances.
   The focused real-element test passed within the 28/28 behavior suite.
3. **NI-09 — PASS.** The canonical local command is qualified to Chromium and Firefox, selects the
   real-input test, and passed 2/2. The test exercises hover, pointer down/up, attempted focus, Enter
   and Space and proves zero tab stop, hint, event, focus acquisition, pressed marker, cursor, and
   hover/focus/active style residue.
4. **Per-arm mutation records — PASS.** Governed WP activity now records source before→after,
   named command/test red, observed failure, restoration hash/diff and green rerun for totals,
   ratio/max reassignment, validation, legend, controlled selection, route-total/group ownership,
   NI-09, 50-WP aggregation, theme parity, hover, focus, pressed, and sticky displacement. Recorded
   restoration hashes match the reviewed bytes: element `dc359c6d...`, stories `1e6b0a4c...`, CSS
   `f2624ced...`, and generated CSS module `e2432064...`.

## WP anti-pattern checklist

1. **Dead code — PASS.** The new element is registered and exported, and its source, generated
   stylesheet, manifest, React wrapper, stories and distribution entries all have live consumers.
2. **Synthetic-fixture test — PASS.** Behavior tests mount the package element and browser tests
   exercise the built Storybook story rather than a copied implementation. The narrow test is
   non-vacuous for displacement but incomplete for paint-order overlap, as finding 1 explains.
3. **Silent empty return — PASS.** The validation null result is the specified fail-closed state;
   no new caught exception becomes an undocumented empty success.
4. **FR coverage — FAIL.** FR-016 is not protected: the current assertion passes while scrolled
   cells paint over route labels.
5. **Frozen surface — PASS.** WP02 changes no token, package, lockfile, ADR, historical record, or
   sibling authored component source. `fixtures/react-consumer/src/wrappers.test.tsx` remains
   byte-identical to approved WP01, and no forbidden transition-matrix static markup/style index or
   local PNG baseline is present.
6. **Locked decision — PASS.** The public surface remains exactly seven properties; the event is
   typed, bubbling, composed and non-cancelable; selection remains consumer-controlled; no current
   inventory or application ownership enters the element.
7. **Shared-file ownership — PASS with coordination.** Generator/registry/generated changes stay
   within the amended serial WP02→WP03 lane contract; consolidation remains after WP03.
8. **Production fragility — PASS.** No new production throw or transient external dependency was
   introduced.

## Independent verification at the reviewed SHA

Green:

- generated CSS/markup drift checks; deterministic second CEM analyze (manifest SHA-256
  `5463920b...`); generated React drift plus all 25 probes; manifest gate plus all 14 probes; entry
  gate plus all 14 probes; 33-part ratchet; adopted-CSS gate plus all 31 probes; CSS hygiene;
  no-CSS-in-source; theme-wrapper gate; gate wiring; four-project typecheck; and size drift check
- `npm run quality:all` (no errors) and full Vitest: 16 files, 179/179 tests, node 29 and browser 150
- main mutation harness: baseline 150/150; all 62/62 registered mutations produced only their named
  red; 190.9 seconds under the 360-second ceiling
- Storybook build; exactly 31 ratcheted ids including all nine transition-matrix stories; axe
  127/127 rendered stories with zero WCAG 2.1 AA violations
- exact qualified NI-09: Chromium+Firefox 2/2; full component Playwright: Chromium+Firefox 22/22
- tracked/staged lane diff clean after all checks; only the expected active Spec Kitty
  `.spec-kitty/review-lock.json` is untracked in the lane worktree

Explicitly deferred, not reported green and not the reason for this rejection:

- local WebKit remains unavailable because its approved Fedora runtime libraries are absent; final
  unqualified CI must pass WebKit
- `node scripts/suite-selftest.mjs --selftest` retains the approved local guard-4 hang record and
  must pass in final exact-head CI
- nine baseline PNG bytes remain CI-authoritative after WP03; local captures are diagnostic only

