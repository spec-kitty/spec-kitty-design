# Risk Register: Spec Kitty Design System

| Field | Value |
|---|---|
| **Initiative** | Spec Kitty Design System |
| **Owner** | Stijn Dejongh |
| **Date** | 2026-05-01 |
| **Status** | Accepted — risks reviewed and formally accepted by maintainer |
| **Related ADRs** | ADR-005 (supply chain); ADR-002 (topology); ADR-003 (token schema) |
| **Scope** | All risks identified across three research evaluations and architectural review |

---

## Destructive Prompt

> If this design system fails badly, what are the most likely and most damaging ways it fails?

1. The `@spec-kitty` npm scope is taken over before we claim it, enabling dependency confusion attacks against every Priivacy-ai project.
2. The token reconciliation reveals deep divergence between the Claude Design reference and the live marketing site — v1 ships the wrong values, poisoning every downstream consumer.
3. A supply chain attack via a compromised transitive Storybook or Playwright dependency exfiltrates contributor credentials during `npm install`.
4. ~~The Angular LTS expires before the design system team initiates the upgrade — consuming projects are left dependent on an unpatched framework version.~~ **DISCHARGED by ADR-8** (2026-09-02): the component layer became a custom element with no framework runtime, and `packages/angular` was deleted in #102. There is no LTS to expire.
5. The CI pipeline becomes too slow to be useful as the component count grows, contributors start bypassing checks, and the quality gates become theatre.

---

## Full Risk Inventory

| ID | Failure Scenario | Category | Impact | Likelihood |
|---|---|---|---|---|
| R01 | `@spec-kitty` npm scope unclaimed; attacker publishes under it before we do | Security | Critical | Medium |
| R02 | Token reconciliation (FR-034) reveals significant divergence; token values incorrect at v1 publish | Correctness | High | Medium |
| R03 | Supply chain attack via compromised transitive dev-tool (Storybook, Playwright) dependency | Security | High | Low-Medium |
| R04 | ~~Angular LTS expiry before upgrade is initiated; consumers blocked on unpatched framework~~ **DISCHARGED by ADR-8 — no framework runtime remains** | Delivery / Security | — | — |
| R05 | CI pipeline breaches 10-minute NFR-002 as component count scales | Performance | Medium | High |
| R06 | Storybook major version upgrade (v8→v9) breaks visual regression baseline and CI | Delivery | Medium | High |
| R07 | Three-repo version synchronization gap: SK dashboard pins old design system version; diverges again | Correctness | Medium | Medium |
| R08 | PR preview deployment tooling (NFR-008) cannot fit within CI budget; visual review degrades | Quality | Medium | Medium |
| R09 | Illustration assets (mascot) inadvertently included in distribution package | Brand / Compliance | Medium | Low-Medium |
| R10 | Token schema ADR-003 value reconciliation delayed by external dependency (marketing site audit requires third-party access) | Delivery | Medium | Low |
| R11 | Postinstall script in a new direct dependency exfiltrates environment or credentials | Security | High | Low |
| R12 | Dependabot generates excessive PR noise; maintainer disables it | Security (erosion) | Medium | Medium |
| R13 | GitHub Actions account compromise via un-pinned Action | Security | High | Low |
| R14 | WCAG 2.1 AA gate blocks every PR due to known browser-level limitation in a core component | Quality / Delivery | Low | Low-Medium |
| R15 | Community framework port (Vue/Svelte) fails visually; accepted due to no visual reviewer | Brand | Medium | Low |

---

## Prioritised Risks

**Three most likely:** R05, R06, R12 — CI performance degradation, Storybook churn, and Dependabot noise are near-certainties at scale.

**Two highest-impact surprises:** R01, R03 — npm scope takeover and supply chain attack are low-probability but existential if realised.

| Risk ID | Why Prioritised | Trigger Signal |
|---|---|---|
| R01 | Unclaimed scope is an open attack surface from day zero | Pre-flight check not completed before release pipeline is built |
| R03 | Postinstall execution is unique to npm; no equivalent exists in SK's Python stack | `npm audit` reports a new CVE in a transitive dev-tool; `--ignore-scripts` produces an unexpected failure |
| R05 | Component count grows predictably; CI budget is finite | CI wall time exceeds 8 minutes in a routine PR |
| R06 | Storybook has a documented pattern of breaking visual regression in major upgrades | Dependabot opens a Storybook major version PR |
| R12 | Alert fatigue is the silent killer of security posture | Maintainer closes >3 Dependabot PRs without review in a single week |

---

## CI Quality Pipeline

![CI Quality Pipeline](assets/ci-quality-pipeline.svg)
> Source: [`assets/ci-quality-pipeline.mmd`](assets/ci-quality-pipeline.mmd)

## Mitigation Plan

| Risk ID | Prevention | Detection | Response | Owner |
|---|---|---|---|---|
| R01 | Claim `@spec-kitty` npm scope as first action before release pipeline work | Verify scope ownership before any `npm publish` step is written | Immediately claim scope; revoke any packages published under it | Maintainer |
| R02 | FR-034 token reconciliation is a hard pre-implementation gate (ADR-003) | Diff `tmp/colors_and_type.css` against live site CSS; flag every divergence | Update ADR-003 addendum with resolution; republish corrected tokens as a patch | Maintainer |
| R03 | `npm ci --ignore-scripts` in CI; security allowlist for postinstall exceptions; nightly `npm audit` | Dependabot security alert; `npm audit` output in CI | Immediate: pin to last safe version; assess blast radius; upgrade or remove dependency | Maintainer |
| R04 | ~~Monitor Angular LTS calendar~~ — no mitigation required; the risk is discharged, not merely mitigated | Remove the LTS review from the calendar cadences below | Begin `@spec-kitty/angular` major upgrade mission; communicate window to consumers | Package maintainer |
| R05 | FR-035: path-scoped CI triggering from day one; not added retroactively | CI wall time tracked in each run; alert if >8 minutes | Tune CI job parallelism; re-evaluate which checks run on which paths | CI maintainer |
| R06 | Dependabot excludes Storybook major bumps from auto-merge; pin current major | Dependabot opens major version PR | Planned upgrade: test on a branch, re-establish visual baseline, then merge | Maintainer |
| R07 | Charter consumer update policy: one major version compatibility window | Audit consuming repos quarterly for pinned version lag | Create a compatibility migration guide; alert consuming repo maintainers | Maintainer |
| R08 | Defer tooling selection to planning (NFR-008); evaluate Chromatic vs Netlify vs Surge | CI runtime monitoring | If PR preview cannot fit in budget, fall back to attached CI diff screenshots | Planner / Maintainer |
| R09 | `SK-D02` directive encodes the boundary; CI should check for illustration asset types in dist output | Manual review in PR + automated check as part of `npm pack --dry-run` gate | Remove illustration assets from distribution; flag in CHANGELOG | Maintainer |
| R10 | FR-034 gate set early; marketing site CSS is publicly accessible | Check access to `spec-kitty.ai` CSS before scheduling the reconciliation | Request access via maintainer / PR if needed; use browser dev tools as fallback | Maintainer |
| R11 | `npm ci --ignore-scripts`; new direct dependencies require postinstall review | Allowlist check in CI: any `postinstall` not in allowlist fails the build | Review the script; allowlist if safe; remove dependency if malicious | Maintainer |
| R12 | Dependabot grouped by framework family (fewer PRs); major bumps excluded from auto-merge | Review open Dependabot PR count weekly | If >5 open Dependabot PRs, schedule a dependency review sprint; never bulk-close without review | Maintainer |
| R13 | All Actions pinned to commit SHAs from day one (FR-043); Dependabot for Actions | `grep uses: .github/workflows/**` — any `@v` tag fails a lint check | Update SHA pin; audit workflow run logs for anomalous behaviour | CI maintainer |
| R14 | Exception policy in charter: known browser-limitation WCAG waivers documented in story + tracking issue | axe-core reports a violation from a known-issue component | File tracking issue; add waiver annotation to the story; do not suppress globally | Contributor |
| R15 | `@experimental` tag required for community ports; visual review against reference Storybook story before stable export | Visual comparison on PR | Reject port until visual match is achieved; offer guidance | Reviewer |

---

## Monitoring Cadence

- **Pre-flight checks** (one-time, before implementation): npm scope ownership, token reconciliation
- **Each PR**: `npm audit`, lockfile integrity, SAST, axe-core, Playwright, Lighthouse, Actions SHA check
- **Weekly**: Dependabot PR review; Storybook release-cadence check
- **Nightly**: Scheduled `npm audit` on default branch
- **Quarterly**: Consumer repo version audit
- **At release**: CycloneDX SBOM, `npm pack --dry-run` dist contents audit, `--provenance` attestation

**Escalation threshold:** Any HIGH impact risk moving from Low-Medium to Medium likelihood triggers an immediate mitigation review before the next PR is merged.

---

## Accepted Residual Risks

The following risks are explicitly accepted with rationale. Accepted by: Stijn Dejongh, 2026-05-01.

| Risk ID | Residual state | Rationale |
|---|---|---|
| R03 | Low probability; `--ignore-scripts` mitigates most attack paths | Dev-tool transitive tree is not published to consumers; blast radius is contributor workstations |
| R06 | Medium probability; planned mitigation sufficient | Storybook churn is endemic to the ecosystem; pinning and planned upgrades are the industry-standard response |
| R13 | Low probability with SHA pinning | SHA pinning eliminates the tag-redirect vector; remaining risk requires compromise of the Actions provider itself |
