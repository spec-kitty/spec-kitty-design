---
affected_files: []
cycle_number: 1
mission_slug: flow-health-transition-matrix-01M1PGNJ
reproduction_command:
reviewed_at: '2026-09-04T19:37:34Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback — cycle 1

Reviewed commit: `778a06fc17515637878879ea989d6eff209510c6`

## Blocking findings

### 1. HIGH — The browser acceptance test exercises a test-local copy, not the generated runtime

`fixtures/react-consumer/src/wrappers.test.tsx:98-126` defines `useSyntheticProperties` and
`PropertyOnlyProbe` locally. The identity/reassignment/removal assertions at lines 128-163 therefore
stay green if the production `applyPropertyOnlyResets()` transformation or generated
`useProperties` runtime is deleted or broken. That fails the WP's production-path requirement for
FR-019 and the review prompt's synthetic-fixture check: the browser proof currently certifies the
test's paraphrase of the implementation.

Remediation:

1. Make the existing browser fixture exercise a wrapper/property hook emitted through the
   production generator seam for a synthetic test-owned element. Do not add a test-only public
   field to a production element and do not hand-edit `packages/react/src/**`.
2. Keep the current observable sequence: original identity before upgrade, identity after upgrade,
   replacement identity after rerender, omission to a fresh frozen empty array, and zero structured
   attributes throughout.
3. In an isolated mutation run, remove/break the production generated property assignment/reset
   path and show that this named browser test fails for the intended reason; restore the source and
   show the green rerun.

### 2. HIGH — A computed decorated property is silently skipped instead of failing closed

`scripts/normalise-manifest.mjs:280-283` obtains `plainName()` and immediately `continue`s when a
decorated property has a computed name. A declaration such as
`@property({ attribute: false }) [name]: ReadonlyArray<string> = Object.freeze([])` therefore reaches
the exact unresolvable decorator boundary and produces no marker and no actionable error. A direct
TypeScript-AST probe confirmed that branch as `continue-without-error`. This contradicts T001/T002's
requirement that computed/unresolvable property declarations fail closed rather than silently drop a
public structured input.

Remediation:

1. Detect a relevant `@property(...)` decorator before silently skipping an unresolvable member
   name and throw a source-located, actionable classification error.
2. Add a direct normalizer probe for a computed decorated `attribute: false` field and require the
   command to fail for that named reason. Preserve the intentional exclusions for private,
   protected, readonly, and static fields.

### 3. HIGH — Required red-first evidence was not recorded

`tasks/WP01-generic-property-only-manifest-react-pipeline.md:166-184` requires the initial property-
only probes to be observed red and the output recorded in WP implementation/review evidence. The
authoritative WP transition has `evidence: null` and only the generic note “Ready for review ...
with red/green coverage”; no command, intended failing test, failure output, restoration reference,
or green rerun is recorded. That does not satisfy FR-021/NFR-009.

Remediation:

1. Record concrete evidence for each relevant source break: command, mutation/broken production
   anchor, exact named failing test/assertion, red output, restoration reference, and green rerun.
2. Include the production-backed browser mutation from finding 1 and the computed-decorator
   fail-closed probe from finding 2. Store the evidence through the Spec Kitty-owned status/review
   workflow; do not hand-edit event logs.

## WP anti-pattern checklist

1. **Dead code — PASS.** New production helpers have live callers in the normalizer/generator.
2. **Synthetic-fixture test — FAIL.** Finding 1: runtime behavior is asserted against a local copy.
3. **Silent empty return — PASS.** Guard returns are documented predicates; no swallowed exception
   returns an empty value.
4. **FR coverage — FAIL.** FR-019 lacks production-backed browser proof and FR-021/NFR-009 lacks
   durable red evidence.
5. **Frozen surface — PASS.** No production manifest, generated React file, token, package,
   lockfile, ADR, or transition-matrix source changed.
6. **Locked decision — PASS.** No component allowlist, JSON structured attribute, Team Kitty state,
   or forbidden transition-matrix source entered WP01.
7. **Shared-file ownership — PASS with coordination.** WP02 intentionally shares the three scripts
   and `expected-docs.json` in the same serial lane. WP02 must remain blocked and use the corrected
   WP01 head after re-review; if it has started elsewhere, rebase it after WP01 is approved.
8. **Production fragility — PASS.** New throws/process failures are deliberate build-time fail-loud
   guards with explanatory messages, not transient runtime paths.

## Verification already green at the reviewed SHA

- wrapper selftest: 24/24 probes
- manifest-content selftest: 14/14 probes
- element analyze, manifest-content gate, wrapper drift/determinism, and `git diff --check`
- focused Node suite: 10/10 tests
- focused Chromium React fixture: 6/6 tests
- `typecheck-all`: 4/4 projects
- `quality:all`: success (existing warnings only)
- full `npm run test`: 15 files, 144/144 tests, both suite-floor lanes non-empty
- six modified files exactly match WP01 ownership; generated production CEM/React bytes are stable
- no mission `contracts/` directory is present

The focused Vitest commands printed expected global floor warnings because each intentionally ran
only one test file; both commands exited zero and the full suite's floor passed. Those warnings are
not the reason for rejection.
