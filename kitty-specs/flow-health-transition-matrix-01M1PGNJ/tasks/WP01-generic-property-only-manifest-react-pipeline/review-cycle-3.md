---
affected_files: []
cycle_number: 3
mission_slug: flow-health-transition-matrix-01M1PGNJ
reproduction_command:
reviewed_at: '2026-09-04T20:21:41Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — cycle 3

Reviewed implementation SHA: `93879b478d783a4f0ed71668c1c0fc6abec18fa0`  
Reviewer profile: `reviewer-renata` (Codex)  
Verdict: changes requested

## Blocking finding — HIGH: computed decorated fields still bypass unresolved-option fail-closed handling

`scripts/normalise-manifest.mjs:316-359` uses a separate, weaker options check after a decorated
field name is found to be computed. That branch throws for a literal `attribute: false`, but it
does not reject an unresolved `attribute` expression. This source therefore exits successfully:

```ts
const fieldName = 'structured';
const shouldObserve = false;

export class SkProbe {
  @property({ attribute: shouldObserve })
  [fieldName]: ReadonlyArray<string> = Object.freeze([]);
}
```

An isolated run against the committed normalizer exited `0`, printed `0 property-only field(s)`,
and rewrote the supplied manifest normally instead of failing with a source-located classification
error. No marker was added, but silently omitting a value that can resolve to `attribute: false`
still violates T001/T002's requirement that computed/unresolvable declarations fail closed. It is
also the same cycle-2 defect class: unresolved decorator metadata takes a non-failing path.

Required remediation:

1. Make the computed-decorator branch validate `attribute` and `state` option values with the same
   literal-only policy used by `inspectOptions()` before deciding whether the field is a
   property-only candidate. An unresolved option must fail with the option's source location; it
   must not silently continue.
2. Add direct tests for a computed decorated field with unresolved `attribute` and with
   `attribute: false` plus unresolved `state`. Require both to fail for their named, source-located
   reason and leave the manifest byte-identical with no property-only/reset marker.
3. Re-run the normalizer cases, both focused `--reporter=default` commands, generator/content
   selftests, full type/quality/test gates, and production CEM/React byte-stability checks.

## Prior cycle blockers — verified closed at this SHA

- PASS: all four named static/decorator unresolved-state/attribute probes pass and assert a
  source-located error, unchanged manifest bytes, and absence of both extension markers.
- PASS: the corrected focused Node command exits `0` with 15/15 tests; the corrected browser
  command exits `0` with 6/6 tests. Both use `--reporter=default`; the complete `npm run test`
  retains the suite-floor reporter and passes 149/149 tests (`node=27`, `browser=122`).
- PASS: the browser fixture block is freshly emitted through the production generator and checked
  for drift. The cycle-1 production-assignment mutation and cycle-2 weakened-state mutation remain
  durably recorded in the WP activity log and Spec Kitty events; wrapper/content selftests pass
  24/24 and 14/14 probes.
- PASS: two analyze/wrapper-check passes retained CEM SHA-256
  `828d748d14b547015d7438d10144e6dbd8d045b8b91926b9139688357ba574f0` and React-tree SHA-256
  `5e73cd49d5d6e20bc8ab382f01dfa0f8da5800e37e3fc7f36b2e3598565f2359`.

## Verification results

- `node scripts/build-react-wrappers.mjs --selftest`: PASS, 24/24 probes.
- `node scripts/check-manifest-content.mjs --selftest`: PASS, 14/14 probes.
- `npx nx run elements:analyze` twice, manifest-content gate and wrapper `--check` twice: PASS.
- Focused Node/browser Vitest commands with `--reporter=default`: PASS, 15/15 and 6/6.
- `node scripts/typecheck-all.mjs`: PASS, 4/4 projects.
- `npm run quality:all`: PASS with existing warning-only findings.
- `npm run test`: PASS, 15 files and 149 tests; suite floor green.
- `git diff --check`: PASS.
- Scope: PASS, exactly the six WP01-owned files; no production CEM, generated React source,
  element, style/token, package/lockfile, ADR, or transition-matrix source changed.
- Contracts: no `contracts/` artifact exists for this mission.

## WP anti-pattern checklist

1. **Dead code — PASS.** New helpers have live normalizer/generator callers.
2. **Synthetic-fixture test — PASS.** The executable browser fixture is production-generated and
   drift-checked; the prior direct assignment mutation made the named browser test red.
3. **Silent empty return — FAIL.** The computed-decorator branch silently continues for unresolved
   `attribute` metadata; this is the blocking finding above.
4. **FR coverage — FAIL.** FR-002's fail-closed generic property-only boundary has an uncovered
   computed-decorator path.
5. **Frozen surface — PASS.** The six-file diff does not touch a frozen/generated production
   surface.
6. **Locked decision — FAIL.** The unresolved computed decorator contradicts the explicit
   fail-closed requirement in the WP/spec/plan boundary.
7. **Shared-file ownership — PASS with coordination.** WP02 and WP03 remain downstream in the same
   serial lane. They must consume the corrected, approved WP01 head.
8. **Production fragility — PASS.** New failures are deliberate build-time checks, not transient
   runtime paths.

## Downstream warning

WP02 depends on WP01 and WP03 depends on WP02. Keep both planned until this generic seam is fixed
and approved; because all three share lane `lane-a`, no parallel rebase should be started.
