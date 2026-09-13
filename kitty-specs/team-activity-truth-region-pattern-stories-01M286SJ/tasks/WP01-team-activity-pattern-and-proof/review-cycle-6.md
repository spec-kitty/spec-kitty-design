---
affected_files:
  - packages/elements/src/patterns/team-activity.stories.ts
  - apps/storybook/src/tests/sk-team-activity-pattern.spec.ts
  - apps/storybook/src/tests/visual.spec.ts
  - apps/storybook/src/tests/visual.spec.ts-snapshots/team-activity-*.png
  - kitty-specs/team-activity-truth-region-pattern-stories-01M286SJ/acceptance-matrix.json
  - kitty-specs/team-activity-truth-region-pattern-stories-01M286SJ/issue-matrix.json
  - kitty-specs/team-activity-truth-region-pattern-stories-01M286SJ/plan.md
cycle_number: 6
mission_slug: team-activity-truth-region-pattern-stories-01M286SJ
reproduction_command:
reviewed_at: '2026-09-11T15:18:32Z'
reviewer_agent: codex
wp_id: WP01
---

# Adversarial squad corrective feedback

Three independent pre-merge lenses returned `CONCERNS` / `HOLD` against PR #416 at
`efd2e898976b21fdbb58bc451b9894784071a53f`.

- Remove every payload-bearing property from the L5 denied root, including the compiled fixture,
  projection, validation seam, and shared proof attributes. Prove L5 only from the complete DOM,
  complete attributes, and a minimal `Object.getOwnPropertyNames` allowlist.
- Make projection ownership real: deep-freezing a returned projection must never freeze or mutate
  caller-owned nested fixture objects. Add before/after descriptor, deep-equality, and mutability
  regressions through the authorized non-L5 story seam.
- Accept a DM1 decision record only when its exact own-key set is `id`,`label`; reject every extra
  field with exact errors through the built seam.
- Replace the CSS-zoom-only acceptance claim with the repository's explicit fixed-window
  200%-zoom-equivalent reflow convention, retaining CSS zoom only as supplemental stress.
- Regenerate and inspect every owned Chromium/Linux visual baseline on the rebased PR head, and
  reconcile all mission matrices and canonical event-log documentation with verifiable evidence.

Reviewer provenance: the fifth independent review was claimed with the `reviewer-renata` profile,
while the approval transition was emitted by the CLI's human `user` / `MOES-Media` surface. The
canonical status event log remains authoritative and is not edited by hand.

## Corrective author response

Implementation commit: `aa2bfe15a96550bb9ef5bfe8892cbd29f1268392`.

Commit-policy reconciliation rewrote only the two local corrective subjects. The old implementation
object `2ad2277f` maps to `aa2bfe15`; the old handoff object `58cb2cbf` maps to `522638a8`.
`HEAD^{tree}` remained byte-identical (`2a740d8054c264ed3f06a0cdc007304c1986a13a`) across that
rewrite. Canonical status events retain the predecessor hashes because those events are append-only
historical records; they were not fabricated or edited by hand.

- L5 now returns before the authorized story seam is created. Its root has exactly a `class`
  attribute, no story/proof attributes, and no own property or symbol; the focused test asserts the
  complete MAIN/STYLE/P surface and protected-value absence from serialized output. Mutations are
  driven only through the authorized Default story.
- Every projection is detached with `structuredClone` before recursive freezing. A real-seam test
  records caller descriptors/deep equality before and after three projection paths, confirms all
  watched nested nodes remain unfrozen, mutates them successfully, and confirms the already-created
  projections retain their original values.
- DM1 validation now requires the exact sorted own-key set `id,label`. The valid control projects
  exactly `Decision` / `dp-42`; question, title, owner, action, and source each fail with
  `TypeError: Decision data must contain exactly id and label.`
- The responsive test now uses a fixed 640 CSS-pixel window—the remaining layout width of a 1280
  CSS-pixel desktop at 200% zoom—and proves exact root containment and long-content visibility. It
  expressly does not claim Playwright controlled browser-chrome zoom. CSS `zoom: 2` remains only
  supplemental rendering stress.

## Hosted visual diagnosis and reviewed baseline ledger

Original run [34613945286](https://github.com/spec-kitty/spec-kitty-design/actions/runs/34613945286)
checked PR merge SHA `090b86b6` (head `efd2e898`, base `16948194`). The visual job had exactly 17
Team Activity failures, L5 passing, and 270 unrelated visual passes. Artifact `10270097200`, digest
`4382048fa02c94e5c6decd81630643797c8b10909bea7276e61191241dba48bc`, was decoded and each
`*-actual.png` joined to its test by the Playwright report manifest—not by archive order.

The drift source is CI/local font rasterization, not #368 CSS. `git diff 0a232a01..16948194` over
Storybook configuration, tokens, shared elements, and styles shows #368 added only its scoped
section-nav export/files (plus inventories/evidence), with no Team Activity or shared theme rule.
The #368 landed commit itself records that its locally generated images differ from the Ubuntu
runner and therefore harvested CI-authoritative baselines. Representative expected/actual/diff
inspection shows the same systematic text weight/rasterization and downstream wrap-height change;
it is present across all non-L5 Team Activity images and nowhere else in the job.

After the corrective changes, all 18 images were regenerated and replayed from this exact tree with
the pinned `mcr.microsoft.com/playwright:v1.62.1-noble` environment: 18/18 passed. The 17
environment-sensitive files were then restored to the directly paired Ubuntu 24.04 CI actuals;
L5 was already byte-identical. Every final image was inspected for hierarchy, state distinction,
wrapping, clipping, theme, RTL, forced-colors, and reduced-motion presentation.

| Baseline | Final SHA-256 |
|---|---|
| `team-activity-dm1-decision` | `2550e0bf419f6a7b3e0080c387b40695761f74649d94b5d26ff67cfdd1d758bb` |
| `team-activity-forced-colors` | `fc64a24e7c93f44383d5a14478edf48c8bc85f7ef1b2bf82b121355e0c2561eb` |
| `team-activity-intermediate` | `9c46e4ada07989fa40dccfaefe2cde4a4ba3d8570ee93aa01e9e5df2c299a602` |
| `team-activity-l1-default` | `66f28173b20809500ea05dd4902537baf10c488a06f787c2763a47eaefbaeffa` |
| `team-activity-l2-quiet` | `4f7c53234167b5c5dceefe023aa00ced9502c91f8aef046509c2336221400f98` |
| `team-activity-l3-degraded` | `4212003cc8417b0a3ea312f27d28bee32d4d5ca0ac04aa18e2c784a9c5fd9912` |
| `team-activity-l4-gap` | `797a630f96ed18df6a97e4cd2a549ce68c6a382a0219bebc04d6b842944c7e49` |
| `team-activity-l5-denial` | `a67d583b0f9ef3f5ae85422d4b5be30ae94298c86f316af4b43be310a721720a` |
| `team-activity-light-mode` | `1d2c547b410b4d97cfb1bb8037acc0391f44402b2bbfa34e30864c5bdf03053e` |
| `team-activity-long-content` | `fb52d3df5637e39f0b24fa722997d3f72c2d0d32cc2f189fa1447e037dfbd895` |
| `team-activity-narrow` | `e1d8e74f3b82b936c434592be836db48ab8efcc7326bccd46ddbc74af6a0a186` |
| `team-activity-oa1-degraded` | `e16b3a02556f1e408440a00f13395fd7faedd2793a445fd42e1f6b08a0946e9f` |
| `team-activity-oa1-loading` | `a6eb97149484365fdb3988a240a88613da7c96201c0ec5a7730e047812684e7e` |
| `team-activity-oa1-populated` | `fd35fde5ef501f1a18799c2cd726e0e3f3a080af548b11ede2c4eaf77db85664` |
| `team-activity-oa1-quiet` | `d2452d3b1fb6f75afa2832f72ca71281f354f240dbcc1555b86e649b65ce64cb` |
| `team-activity-reduced-motion` | `339327be2cd44d03b7a52213d8f5ef800e20d175ab64aa267d1cf3c0370092f6` |
| `team-activity-rtl` | `ab6931b0e3a066fdce1aa3c421dc5ef10de883243d5769ca7223c9586ff242dc` |
| `team-activity-tl1-mixed` | `d12a3652c9d8ff40645112e0b8315b94a5baad05ae7dc2d49f9c5a48e4bf95af` |

## Gate evidence

- `npm run quality:all`: pass; 8 lint projects, stylelint, and 163 HTML files.
- `node scripts/typecheck-all.mjs`: 5/5 projects pass.
- `npm run test`: 55 files, 773/773 tests, both lanes non-empty, zero skipped.
- Pattern composition selftest/live gate: 47/47 probes; 10 fixtures, 306 inline rules, 22
  public tags, zero reach-through/copied CSS.
- Generated markup, static-form selftest/check/equivalence, and element size check: pass.
- Current Storybook build: pass.
- Pinned Noble focused Chromium/Firefox/WebKit: 62 passed, 4 expected skips.
- Accessibility gate selftest: 50/50 shapes; axe: 747/747 rendered, zero WCAG 2.1 AA violations.
- Pinned Noble current-tree visual regeneration and replay: 18/18 pass; final committed hashes are
  the CI-authoritative ledger above and require the hosted rerun for exact raster comparison.

The original run's only other red was not a mutation defect: all 272 mutations produced their
named red with a green baseline, then the harness took 1658.7 seconds against a 1649.8-second
ceiling (8.9 seconds / 0.54% over). No budget or workflow/config change is made. The aggregate gate
merely propagated that timing result and the visual job; release, lint, security, Storybook,
Playwright, a11y, and all other jobs passed.

## Lifecycle and provenance

Cycle 6 was reopened through the supported CLI (`approved` -> `planned` -> `doing`), not by editing
the event log. `status.events.jsonl` is canonical; `mission-events.jsonl` is absent and the plan has
been corrected rather than fabricating it. Cycle 5's claim events carry `reviewer-renata`; its
approval materialization correctly renders the human CLI actor as `user` / `MOES-Media`. This
cycle is handed back to `for_review`; it is not self-approved.
