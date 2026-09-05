---
affected_files: []
cycle_number: 3
mission_slug: flow-health-transition-matrix-01M1PGNJ
reproduction_command:
reviewed_at: '2026-09-05T00:40:56Z'
reviewer_agent: user
wp_id: WP02
---

# WP02 review feedback — cycle 3

Reviewed commit: `9128db6fe623295a3eb14d5ab55643b75a229995`

Comparison base: approved WP01 commit `b7a20a96ab3f7a3f436ace41bc05b58f3488b073`

## Blocking finding

### 1. HIGH — The paint-order repair introduces the raw stacking value that WP02 explicitly forbids

The cycle-2 functional defect is repaired, but its sole authored CSS change is:

```css
.sk-transition-matrix__route {
  position: sticky;
  z-index: 1;
}
```

`packages/styles/src/transition-matrix/sk-transition-matrix.css:134` therefore violates T007 step
2, which says to use only existing `--sk-*` tokens and explicitly forbids a raw stacking value.
The loaded project visual-identity rule is even stronger: all CSS values must use `--sk-*` custom
properties, with no exceptions outside the token source. This is not an inferred preference: the
WP names stacking values specifically.

A search of `packages/tokens/src/tokens.css` and the generated token catalogue found no existing
`--sk-z-*`, `--sk-layer-*`, or `--sk-stack-*` token. Using an unrelated numeric token or hiding the
literal behind an internal custom-property fallback would not satisfy semantic token use. At the
same time, WP02 explicitly excludes token-file changes. The current fix consequently resolves
FR-016 by crossing an approved hard boundary, and it cannot be approved as written.

Remediation:

1. Preserve the now-correct foreground ownership and the non-vacuous seven-owner regression test.
2. Replace the literal stacking value with a contract-compliant structural solution. If a
   semantically named layer token is genuinely required, stop and reconcile the token-file scope
   through the governed mission artifacts rather than silently widening WP02 or reusing a font
   weight as a layer value.
3. Regenerate the constructed CSS module and size evidence, then rerun CSS drift/hygiene/stylelint,
   the exact Chromium+Firefox narrow-scroll test, and the `z-index`/paint-protection source mutation.
   The mutation must still fail for hit ownership across all four states and restore byte-for-byte.

## Cycle-2 blocker verification

The original paint-order behavior is otherwise **closed functionally**. At 390×844 and maximum
horizontal scroll, the current test enumerates all seven real sticky owners (the Route heading plus
six route rows), requires every owner to overlap scrolled data, and checks every overlapping cell,
bar, and value using shadow-root hit testing. It repeats the proof in rest, selected, genuinely
hovered, and genuinely pressed states. Chromium and Firefox passed 2/2 independently.

The recorded `z-index: 1` → `z-index: auto` mutation is non-vacuous: it produced bar/track-owned
hits in the exact named test. The reviewed bytes match its restoration evidence:

- authored CSS `69a7e418d6f45b1616009e6782e30deb3ebac345a225581184db3212b19a1a99`
- generated CSS `5d49ad6422c209e20b3312536cffcc262be916979dcabbf4b8bde396f9ea3d2e`
- Playwright subject `39b1ec85a25be2a907549551c8fba565ec99c2745e8c51d229d9f049ad1a7205`

## Prior cycle HIGH findings

All four cycle-1 findings remain closed:

1. **Theme parity — PASS.** Default and LightMode preserve equal content/table relationships and
   differ in paired computed surface/foreground values; Chromium+Firefox passed 2/2.
2. **Table/group ownership — PASS.** The real-element suite proves unique per-instance ids, route
   total descriptions for every magnitude, and visible-heading labelling of grouped bodies; 28/28.
3. **NI-09 — PASS.** The canonical primary acceptance command is qualified to Chromium+Firefox and
   selected the real-input zero-residue assertion; 2/2 passed.
4. **Per-arm evidence — PASS.** Governed activity retains command, red observation, restoration
   hash/diff, and green rerun for every required non-registry arm. Current element/story hashes
   remain `dc359c6d...` and `1e6b0a4c...`.

## WP anti-pattern checklist

1. **Dead code — PASS.** The component, sheet, entries, generated wrapper, stories, and docs have
   live package/build consumers.
2. **Synthetic-fixture test — PASS.** Behavior tests mount the package element; Storybook tests
   exercise the built component. The repaired narrow assertion is explicitly non-vacuous.
3. **Silent empty return — PASS.** Validation's `null` is the specified fail-closed state, not a
   swallowed exception.
4. **FR coverage — PASS.** FR-016 is now behaviorally protected, and all earlier FR gaps remain
   closed. Approval is blocked by the separate hard CSS-value contract.
5. **Frozen surface — PASS.** No token, package, lockfile, ADR, sibling authored source, forbidden
   React fixture, transition static form, or local PNG baseline changed.
6. **Locked decision — FAIL.** The literal `z-index: 1` contradicts T007's explicit prohibition on
   raw stacking values and the project token-only rule.
7. **Shared-file ownership — PASS with coordination.** Changes stay in the serial WP02→WP03 lane;
   whole-branch consolidation remains deferred until after WP03.
8. **Production fragility — PASS.** No new throw or transient runtime dependency was introduced.

## Independent verification at the reviewed SHA

Green:

- generated CSS and size drift checks; CSS hygiene and stylelint
- manifest, entry, parts, adopted-sheet, and generated React drift checks, including applicable
  selftests
- Storybook build in 3.87 seconds; exactly nine transition-matrix stories
- focused behavior suite 28/28 and full Vitest 179/179
- exact qualified NI-09 Chromium+Firefox 2/2
- exact narrow paint/hit ownership Chromium+Firefox 2/2
- full component Playwright Chromium+Firefox 22/22
- axe: 127/127 non-empty rendered stories, zero WCAG 2.1 AA violations
- full WP02 scope has no forbidden React fixture, token, package, lockfile, ADR, sibling-source, or
  transition-matrix baseline change; tracked and staged lane state is clean

The prior 62-arm registered mutation result remains applicable: `3659c3f..9128db6` changes neither
`behaviours.json`, `mutations.json`, the behavior subject, nor the element source. The cycle-2 CSS
defect has its distinct exact mutation described above.

Explicitly deferred and not claimed green: local WebKit, the guard-4
`suite-selftest.mjs --selftest` hang, and all nine CI-authoritative PNG baselines. Those remain the
approved post-WP03/exact-head CI obligations and are not the reason for this rejection.
