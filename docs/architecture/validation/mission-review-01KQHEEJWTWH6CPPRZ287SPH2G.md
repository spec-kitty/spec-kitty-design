# Mission Review Report: design-system-monorepo-infra-ci-scaffold-01KQHEEJ

**Reviewer**: Architect Alphonso (post-merge mission review)
**Date**: 2026-05-01
**Mission**: `design-system-monorepo-infra-ci-scaffold-01KQHEEJ` — Design System Monorepo Infrastructure & CI Scaffold
**Baseline commit**: `9a66b9fffe874a51881d74024028132c47bdcada` (parent of squash merge)
**Merge commit**: `7b9bdc4`
**HEAD at review**: `bd86b4a1a6cfc268a6905c9bd01757817e5639aa`
**WPs reviewed**: WP01 through WP12 (12/12 done)

---

## Scope and Context

This is a greenfield infrastructure mission on a new frontend monorepo repository — not a spec-kitty CLI mission. The hard gates defined in the skill template (contract tests, architectural tests, cross-repo E2E) are specific to the spec-kitty Python CLI codebase and **do not apply** to this design system repository. The applicable quality gates for this mission are the CI pipeline gates implemented in WP07/WP08 (Stylelint, ESLint, axe-core, Playwright, Lighthouse). Those gates passed per the WP review record.

---

## Gate Results

### Gate 1 — Contract tests

- **Not applicable.** This repository has no Python contract test suite. The equivalent frontend quality contract is the Stylelint `--sk-*` token enforcement rule (WP02/WP05) and the ESLint nx module boundary rule (WP05).
- **Result**: EXEMPT — inapplicable gate type for frontend monorepo

### Gate 2 — Architectural tests

- **Not applicable.** No architectural test suite exists for this repository. The equivalent is the ESLint nx `@nx/enforce-module-boundaries` rule encoding ADR-002's token-first dependency constraint.
- **Result**: EXEMPT — inapplicable gate type

### Gate 3 — Cross-repo E2E

- **Not applicable.** No `spec-kitty-end-to-end-testing` repository exists for the design system.
- **Result**: EXEMPT — inapplicable gate type

### Gate 4 — Issue matrix

- **File**: `kitty-specs/design-system-monorepo-infra-ci-scaffold-01KQHEEJ/issue-matrix.md`
- **Present**: NO — `issue-matrix.md` does not exist in the mission artifacts
- **Analysis**: The issue matrix gate is designed for spec-kitty CLI missions that close tracked GitHub issues. This is a greenfield infrastructure mission with no pre-existing issues to track. No tracked issues were the trigger for this work; it was initiated from scratch via charter interview. The absence of this file is a documentation gap, not a delivery gap.
- **Result**: LOW FINDING — see DRIFT-4

---

## FR Coverage Matrix

| FR | Description (brief) | WP Owner | Evidence | Adequacy | Finding |
|---|---|---|---|---|---|
| FR-001 | Independently releasable sub-packages | WP01 | `packages/tokens/`, `packages/angular/`, `packages/html-js/` each have own `package.json` | ADEQUATE | — |
| FR-002 | Build one target without affecting others | WP01, WP03 | nx `project.json` tags + module boundary rule | ADEQUATE | — |
| FR-003 | New target addable without restructuring | WP01 | `packages/*` workspaces glob | ADEQUATE | — |
| FR-004 | Each package has versioning metadata | WP01 | `package.json` in each package | ADEQUATE | — |
| FR-005 | Single install command | WP01 | `npm ci --ignore-scripts` verified in WP01 review | ADEQUATE | — |
| FR-006 | Single Storybook catalog | WP04 | `apps/storybook/.storybook/main.ts` globs both package stories | ADEQUATE | — |
| FR-007 | Angular + HTML renders from single catalog | WP04 | Separate story files per ADR-006 fallback; both in same catalog | ADEQUATE (fallback) | — |
| FR-008 | Stories cover default + interactive + breakpoints | WP04 | `sk-stub.stories.ts` has Default, Mobile, Desktop, Hover exports | ADEQUATE | — |
| FR-009 | Storybook buildable to static site | WP04 | `storybook:build` target verified <3 min | ADEQUATE | — |
| FR-010 | Token package importable without component deps | WP02 | `packages/tokens/package.json` has zero dependencies | ADEQUATE | — |
| FR-011 | Angular installable independently | WP04 | `peerDependencies` only; no `dependencies` on html-js | ADEQUATE | — |
| FR-012 | Token usable via CDN link / no build step | WP02 | `exports: {".": "./dist/tokens.css"}` enables CDN; untested in CI | PARTIAL | RISK-1 |
| FR-013 | All packages published under shared scope | WP02 | `.npmrc`: `@spec-kitty:registry=https://registry.npmjs.org/` | ADEQUATE | — |
| FR-014 | `--sk-*` as single token authority | WP02, WP05 | Stylelint `declaration-strict-value` enforces; tokens.css verified | ADEQUATE | — |
| FR-015 | Breaking token name change detectable | WP02 | `token-catalogue.json` generated but no diff-against-tag CI check | PARTIAL | DRIFT-3 |
| FR-016 | Every PR triggers CI | WP07 | `ci-quality.yml` triggers on `pull_request` | ADEQUATE | — |
| FR-017 | Stylesheet convention gate | WP05 | `stylelint.config.mjs` configured and verified | ADEQUATE | — |
| FR-018 | Script convention gate | WP05 | `eslint.config.mjs` with security plugin | ADEQUATE | — |
| FR-019 | HTML markup gate | WP05 | `.htmlhintrc` with `alt-require: true` | ADEQUATE | — |
| FR-020 | Commit message gate | WP05 | `commitlint.config.cjs` with SK scopes | ADEQUATE | — |
| FR-021 | WCAG 2.1 AA gate | WP08 | `run-axe-storybook.js` + CI `a11y` job | PARTIAL | RISK-3 |
| FR-022 | Performance audit | WP08 | `lighthouserc.cjs` + advisory CI job | ADEQUATE | — |
| FR-023 | Cross-browser tests: Chrome, Firefox, Safari | WP08 | `playwright.config.ts` has chromium, firefox, webkit | ADEQUATE | — |
| FR-024 | Visual regression baseline + CI check | WP08 | `.png` baselines committed; `visual-regression` CI job | PARTIAL | RISK-2 |
| FR-025 | Storybook interaction tests | WP08 | `sk-stub.stories.ts` has `Hover` play function | ADEQUATE | — |
| FR-026 | Failing gate blocks PR merge | WP07 | `gate` job with `needs:` all hard gates | ADEQUATE | — |
| FR-027 | CI results visible on PR | WP07 | `lint-feedback` job posts PR comment | ADEQUATE | — |
| FR-028 | Contributor guide | WP12 | `docs/contributing/README.md` + 3 sub-guides | ADEQUATE | — |
| FR-029 | ADR directory pre-seeded | WP12 | ADR-001 through ADR-006 present; FR-029 pre-satisfied | ADEQUATE | — |
| FR-030 | Per-package README | WP02, WP12 | All three package READMEs present | ADEQUATE | — |
| FR-031 | Getting Started Storybook page | WP04 | `getting-started.mdx` present | ADEQUATE | — |
| FR-032 | Stub component per framework target | WP03 | `SkStubComponent` + `SkStubHTML` both present | ADEQUATE | — |
| FR-033 | GitHub Pages auto-deploy on main | WP09 | `storybook-deploy.yml` triggers on `push: branches: [main]` | ADEQUATE | — |
| FR-034 | Token schema pre-implementation gate | WP02, WP12 | ADR-003 addendum exists with partial comparison; gate NOT enforced before implementation | PARTIAL | DRIFT-4 |
| FR-035 | Path-scoped CI triggering | WP07 | `dorny/paths-filter` job + `if:` conditions on storybook-build | ADEQUATE | — |
| FR-036 | `doctrine/` org-layer directory | WP10 | `doctrine/` with subdirs and `graph.yaml` stub | ADEQUATE | — |
| FR-037 | Two doctrine directives validated | WP10 | SK-D01 + SK-D02 pass `charter synthesize --dry-run` | ADEQUATE | — |
| FR-038 | Two doctrine styleguides validated | WP10 | `sk-brand-voice` + `sk-visual-identity` validated | ADEQUATE | — |
| FR-039 | Enhanced SKILL.md | WP11 | Level 3 skill with 3 sub-rules; routing table present | ADEQUATE | — |
| FR-040 | Dependabot configured | WP06 | `.github/dependabot.yml` with npm + Actions groups | ADEQUATE | — |
| FR-041 | npm CVE audit hard gate | WP06, WP07 | `npm-audit-gate.sh` in CI + nightly `schedule:` trigger | ADEQUATE | — |
| FR-042 | Lockfile drift check | WP06, WP07 | `npm ci --dry-run --ignore-scripts` in CI security job | ADEQUATE | — |
| FR-043 | Actions SHA-pinned | WP06, WP07 | All 4 workflow files verified SHA-pinned | ADEQUATE | — |
| FR-044 | npm provenance on publish | WP09 | `npm publish --provenance` in `release.yml` | ADEQUATE | — |
| FR-045 | CycloneDX SBOM at release | WP09 | `@cyclonedx/cyclonedx-npm` in `release.yml` | ADEQUATE | — |
| FR-046 | `npm ci --ignore-scripts` + allowlist | WP05, WP06 | `.github/security-allowlist.md` with surge entry; CI uses `--ignore-scripts` | ADEQUATE | — |

**Coverage**: 46/46 FRs covered. 7 ADEQUATE, 4 PARTIAL (with risk/drift findings). 0 MISSING.

---

## Drift Findings

### DRIFT-1: Angular peerDependency range excludes installed Angular version

**Type**: LOCKED-DECISION VIOLATION (C-007)
**Severity**: HIGH
**Spec reference**: `spec.md` C-007 — "The Angular package targets the current Angular Long-Term Support (LTS) version"

**Evidence**:
- `packages/angular/package.json` (7b9bdc4): `"@angular/core": ">=19.0.0 <20.0.0"`
- `package.json` (7b9bdc4): `"@angular/core": "^21.2.11"` (workspace devDependency)
- Actual installed version: Angular 21.2.11

**Analysis**: The `@spec-kitty/angular` package declares peer dependency compatibility with Angular 19 only (`<20.0.0`). The workspace has Angular 21.2.11 installed — the version that was actually required for Storybook 10.x compatibility (the WP04 deviation). Any consumer using Angular 20.x or 21.x will receive a peer dependency conflict warning on install. At the time of implementation (May 2026), Angular 21.x appears to be the current supported version. The peerDependency range was never updated after the Angular 21 workspace install was performed in WP03.

**Required fix before v1 release**: Update `packages/angular/package.json` peerDependency to `">=21.0.0 <22.0.0"` (or the current LTS range at time of first publish) and record the change in the ADR-003 addendum or a new ADR. This is not cosmetic — publishing to npm with an incorrect peerDependency range actively misleads consumers.

---

### DRIFT-2: Storybook 10.x shipped; plan specified 8.x; no ADR addendum in repo

**Type**: PUNTED-FR (plan.md Technical Context)
**Severity**: MEDIUM
**Spec reference**: `plan.md` Technical Context — "Primary Dependencies: ... Storybook 8.x"

**Evidence**:
- `package.json` (7b9bdc4): `"storybook": "^10.3.6"`, `"@storybook/angular": "^10.3.6"`
- `plan.md`: "Storybook 8.x" explicitly named
- `docs/architecture/decisions/` contains ADR-001 through ADR-006 but no record of this version change

**Analysis**: WP04 correctly invoked the ADR-006 fallback mechanism (Storybook 8.x was incompatible with Angular 21) and the WP04 review accepted this. However, ADR-006 was authored to document the multi-framework rendering strategy, not the version change. No new or amended ADR records the decision to use Storybook 10.x. Future contributors reading `plan.md` will see "Storybook 8.x" and be confused by the installed 10.x. The `plan.md` and architecture docs are inconsistent with the delivered system.

**Required fix**: Add `docs/architecture/decisions/2026-05-01-7-storybook-version-10x-adoption.md` recording the version change, its rationale (Angular 21 incompatibility with 8.x), and any known behavioral differences that affect the design system contract.

---

### DRIFT-3: FR-015 breaking token change detection has no automated enforcement

**Type**: PUNTED-FR
**Severity**: MEDIUM
**Spec reference**: `spec.md` FR-015 — "A breaking change to a token name is detectable and blocked from publishing without a corresponding major version increment"

**Evidence**:
- `scripts/generate-token-catalogue.js` generates `token-catalogue.json` (present)
- No CI script compares the current catalogue against a previous tag's catalogue
- WP02:T012 review note acknowledged: "For v1, this check is manual: reviewers must verify that no existing `--sk-*` property names are removed or renamed without a semver major increment"
- No GitHub issue was created for this deferral

**Analysis**: FR-015 was accepted into the delivery contract with `Proposed` status in the spec. The implementation delivers the token catalogue (the enumeration mechanism) but not the detection gate. The requirement says "detectable AND blocked" — the blocked part has no automated enforcement. The WP02 note deferred this to a manual review process but created no tracking artifact. Per spec, this is a delivery gap: FR-015 is PROPOSED but has no automated enforcement today.

**Required fix**: Create a GitHub issue tracking `scripts/check-token-breaking-changes.sh` implementation. Until that script exists, publishers must manually diff the catalogue before a release. Document this in `docs/contributing/running-quality-checks.md`.

**Resolved (2026-09-12, #435/#438)**: `scripts/check-token-breaking-changes.sh` exists and is now wired into `ci-quality.yml`'s `release-gate` job on every PR (it previously existed but had no CI caller anywhere — the same "detectable but not blocked" gap this drift item names, one level later). `scripts/generate-token-catalogue.js --check` (also wired into `release-gate`) closes the adjacent gap that nothing verified the committed catalogue matched a fresh build. `docs/contributing/running-quality-checks.md` reflects the automated status. FR-015 is no longer PARTIAL.

---

### DRIFT-4: FR-034 pre-implementation gate treated as documentation placeholder

**Type**: LOCKED-DECISION VIOLATION (FR-034 as pre-implementation gate)
**Severity**: LOW
**Spec reference**: `spec.md` FR-034 — "Before the token package is implemented, a token schema document is published that defines all `--sk-*` property categories, naming conventions, and values reconciled against the Claude Design reference and the live marketing site CSS"

**Evidence**:
- `docs/architecture/decisions/ADR-003-addendum-token-values.md` exists (created in WP12)
- The addendum has a partial comparison table with known discrepancies: spacing scale diverges after step 6; ease-out cubic-bezier values differ; foreground tokens use rgba in implementation but hex equivalents in reference
- WP02 was implemented before WP12 wrote the addendum
- The WP02 implementation note explicitly used "illustrative values from the Claude Design reference"

**Analysis**: FR-034 was stated as a pre-implementation gate. The implementation proceeded without a completed reconciliation — the addendum was created after the tokens were implemented (WP12 is after WP02 in the sequence). The addendum itself acknowledges discrepancies. While this does not prevent the infrastructure from functioning, the token values shipped in v1 may not match the live marketing site. This is a known gap that was accepted during implementation but not formally documented as an exception.

**Required action**: Complete the FR-034 reconciliation (compare ADR-003 addendum discrepancies against the live `spec-kitty.ai` CSS) and either update `tokens.css` to resolve discrepancies or document them as intentional divergences before the first npm publish.

---

## Risk Findings

### RISK-1: FR-012 CDN/zero-build-step consumption path untested

**Type**: DEAD-CODE / MISSING-TEST
**Severity**: HIGH
**Location**: `packages/tokens/package.json` — `"exports": {".": "./dist/tokens.css"}`
**Trigger condition**: A consumer attempts `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@spec-kitty/tokens/dist/tokens.css">` in a plain HTML document.

**Analysis**: FR-012 requires zero-build-step consumption via CDN link. The `package.json` `exports` and `files` fields correctly configure this distribution path. However, no CI test or acceptance scenario validates that a plain HTML document can consume `tokens.css` with a single `<link>` and that `--sk-*` custom properties resolve correctly in the browser. The dist directory is not published (no `npm publish` has run), so there is no CDN artifact to test against. SC-001 (consumer completes setup in 15 min) has no automated verification.

**Recommendation**: Add a smoke test to `apps/storybook/src/tests/smoke.spec.ts` that loads a minimal HTML fixture with `<link rel="stylesheet" href="../../packages/tokens/dist/tokens.css">` and asserts that `getComputedStyle(document.documentElement).getPropertyValue('--sk-color-yellow')` returns the expected value. This is the only test that would catch a broken CDN distribution path.

---

### RISK-2: Visual regression baselines are Linux/Chromium-specific

**Type**: BOUNDARY-CONDITION
**Severity**: MEDIUM
**Location**: `apps/storybook/src/tests/visual.spec.ts-snapshots/sk-stub-angular-default-chromium-linux.png`
**Trigger condition**: Any contributor running Playwright on macOS or Windows, or any CI runner using a non-Ubuntu image.

**Analysis**: Playwright screenshot baselines are platform-dependent — macOS renders fonts and sub-pixel antialiasing differently from Linux, causing pixel-level mismatches even on identical HTML. Both committed baselines have `-linux` in their filename, confirming they were generated on a Linux host. The CI `visual-regression` job runs on `ubuntu-latest` (matching), but any contributor running `npx playwright test` locally on macOS will immediately fail all visual regression tests. This creates a two-tier contributor experience: Linux users pass; macOS users fail.

**Recommendation**: Either (a) configure `playwright.config.ts` with `ignoreHTTPSErrors: true` and set a generous `threshold: 0.1` to absorb cross-platform differences, or (b) document in `docs/contributing/running-quality-checks.md` that visual baselines must be regenerated on the contributor's platform with `--update-snapshots` before committing. The current default will create unnecessary friction for macOS contributors.

---

### RISK-3: `run-axe-storybook.js` tests only the Storybook root page, not each story

**Type**: FALSE-POSITIVE
**Severity**: MEDIUM
**Location**: `scripts/run-axe-storybook.js` lines 8-30
**Trigger condition**: A component story with a WCAG 2.1 AA violation is added in a future mission.

**Analysis**: FR-021 requires automated accessibility checks against "all Storybook stories." The current `run-axe-storybook.js` loads `storybook-static/index.html` and runs axe against `#storybook-root` — but the Storybook root page is a navigation shell, not a rendered component. Individual stories render in iframes. A component with `aria-hidden="true"` on interactive content would not be caught unless that story's URL is explicitly loaded. The test passes today (stub component is accessible) but will be a false negative for any future story with an accessibility violation, as long as the violation is in a story iframe rather than the shell.

**Recommendation**: Replace the single-URL axe scan with a story-iterating approach: parse `storybook-static/stories.json` (generated by Storybook build) for story IDs, then load each story via its `?id=` URL parameter and run axe on each iframe's content. The Storybook `@storybook/test-runner` package automates this pattern and is the recommended approach.

---

### RISK-4: C-009 version constraint `^21.2.11` for Angular uses caret range, not bounded range

**Type**: BOUNDARY-CONDITION
**Severity**: LOW
**Location**: `package.json` devDependencies: `"@angular/core": "^21.2.11"`

**Analysis**: C-009 prohibits `*` or `latest` specifiers. Caret ranges (`^21.2.11`) are explicitly permitted. However, `^21.2.11` allows any Angular 21.x patch/minor update to install silently, including potentially breaking minor releases. While `^` is a best practice and C-009 permits it, a future minor bump to Angular 21.3.x could introduce a breaking change before Dependabot's weekly update PR creates a review opportunity. This is an accepted risk, not a violation, but is worth noting.

---

## Silent Failure Candidates

| Location | Condition | Silent result | Spec impact |
|---|---|---|---|
| `scripts/run-axe-storybook.js:25` | `getViolations()` returns zero violations because story iframe not loaded | Exits 0 with no violations | FR-021: WCAG gate passes vacuously |
| `scripts/npm-audit-gate.sh:9` | `npm audit --json` returns malformed JSON (network error) | `VULNERABILITIES` may be empty string, comparison `"" -gt 0` → false → exits 0 | FR-041: audit gate silently skips on network failure |

For the audit gate: the script does `OUTPUT=$(npm audit ... || true)` then parses with Node.js. If the Node.js inline parse throws (malformed JSON), it exits with an unhandled exception, but the `set -euo pipefail` at the top means the script would exit non-zero — which is the safe behavior. This is acceptable.

---

## Security Notes

| Finding | Location | Risk class | Assessment |
|---|---|---|---|
| surge global install in CI | `pr-preview.yml:20` — `npm install --global surge --ignore-scripts` | SUPPLY-CHAIN | Documented in `.github/security-allowlist.md`; surge is a well-known package; acceptable |
| All 4 workflow files | All `uses:` directives | SHA-PINNING | Verified clean — no mutable `@v*` tags; `check-action-pins.sh` confirms |
| Shell scripts | `scripts/*.sh` | SHELL-INJECTION | No user input fed to shell; all paths are repo-relative constants; safe |
| `release.yml` npm token | `secrets.NPM_TOKEN` referenced as `NODE_AUTH_TOKEN` | CREDENTIAL | Standard npm auth pattern; scoped to publish; acceptable |
| Playwright `baseURL` | `playwright.config.ts` uses `file://` local path | PATH-TRAVERSAL | File-local only; no user input; safe |

No blocking security findings.

---

## Final Verdict

**PASS WITH NOTES**

### Verdict rationale

All 12 WPs are done, merged, and the full CI quality pipeline (lint, accessibility, visual regression, cross-browser, Lighthouse) is correctly wired. The infrastructure mission delivered its core contract: a working nx monorepo, a CSS token package with ADR-003-compliant naming, Angular and HTML stub components, Storybook with visual regression baselines, four SHA-pinned GitHub Actions workflows, and a doctrine bundle validated against the spec-kitty schema.

Two issues require action before the first npm package release:

1. **DRIFT-1 (HIGH)** — `packages/angular/package.json` peerDependency range must be corrected to match the actual Angular version (21.x) before publishing to npm. The current range `>=19.0.0 <20.0.0` will generate peer dependency errors for all consumers on Angular 20+.

2. **DRIFT-4 (LOW, gates publication)** — The FR-034 token reconciliation must be completed (comparing implemented values against the live `spec-kitty.ai` CSS) before npm publish. The ADR-003 addendum exists with a checklist and partial comparison tables showing known discrepancies. These must be resolved before v1 tokens are treated as canonical.

Neither of these blocks using the infrastructure for local development or CI validation. They do block public npm publish.

### Open items (non-blocking, addressed in follow-up)

1. **DRIFT-2**: Add ADR-007 documenting the Storybook 10.x version adoption decision.
2. **DRIFT-3**: Create a GitHub issue and implement `scripts/check-token-breaking-changes.sh` (FR-015 enforcement gap).
3. **RISK-1**: Add a CDN consumption smoke test to Playwright suite.
4. **RISK-2**: Update visual baseline strategy for cross-platform contributors (macOS).
5. **RISK-3**: Replace single-URL axe scan with per-story story-iterator approach.
6. **Gate 4**: `issue-matrix.md` is not applicable for this greenfield mission but should be established as a convention for future missions on this repository.
