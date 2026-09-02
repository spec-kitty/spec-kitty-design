# System Context Canvas: Spec Kitty Design System

| Field | Value |
|---|---|
| **Initiative** | Spec Kitty Design System |
| **Owner** | Stijn Dejongh |
| **Date** | 2026-05-01 |
| **Status** | Accepted |
| **Related prestudy** | `docs/architecture/research/001-design-system-architectural-evaluation.md` |
| **Related ADRs** | ADR-001, ADR-002, ADR-003, ADR-004, ADR-005 |

---

![C4 Level 1 — System Context](assets/c4-l1-system-context.svg)
> Source: [`assets/c4-l1-system-context.mmd`](assets/c4-l1-system-context.mmd)

## 1. Problem Statement

**Current reality:** Three Spec Kitty surfaces — the operator dashboard, the marketing website, and the documentation site — have diverged visually and terminologically. The dashboard uses an informal, ad-hoc CSS token vocabulary (`--baby-blue`, `--sunny-yellow`). The marketing site uses a distinct `--sk-*` namespace. The docs site uses an older unrelated theme. AI agents working on these surfaces have no shared brand governance reference.

**Desired state:** A single, versioned source of truth for all Spec Kitty visual decisions. Any surface — dashboard, docsite, blog, slidedecks — can consume the same token layer. Any AI agent working on a Priivacy-ai project has brand governance context automatically available.

**Why this matters now:** The dashboard UI overhaul (#650) and docsite refresh (#648) are active epics. Without a shared design system, each will independently re-implement visual rules that will immediately diverge again.

---

## 2. Organisational Context

**Team / ownership:** Single maintainer (Stijn Dejongh) with open-source contributors. Priivacy-ai organisation on GitHub. Design system is a cross-cutting concern serving all Spec Kitty repositories.

**Product / domain context:** Part of the broader Spec Kitty ecosystem: an open-source CLI for spec-driven AI development. The design system is a support layer, not the core product — it must not introduce friction to the primary development workflow.

**Cultural forces:** The project community values developer autonomy and low-overhead tooling (issue #338: "Little overhead for developers/maintainers"). Governance must be light-touch and automated. The "quirky-but-serious" brand voice must be preserved — design quality matters, but never at the cost of practicality.

---

## 3. Stakeholders

| Stakeholder group | Primary concern | Success looks like |
|---|---|---|
| SK dashboard developers | Can import design tokens and Angular components without re-implementing visual rules | Dashboard restyling requires only token value changes, not CSS archaeology |
| Docsite / static HTML contributors | Can use token CSS with no build step; Jekyll/Hugo compatible | One `<link>` gives them the full token set |
| AI coding agents (Claude Code, Codex, Cursor, etc.) | Have brand voice and visual identity rules as governance context during mission execution | Agents produce brand-compliant output without explicit per-task instruction |
| Community contributors | Can add a new framework target without restructuring existing packages | A Vue or Svelte adapter can be contributed as an additive package |
| End users of SK-powered UIs | Consistent, accessible, on-brand UX across dashboard, docs, and marketing | No visible visual inconsistency across surfaces |

**Stakeholder tensions:** Dashboard developers favour quick wins and incremental adoption; the design system's pre-implementation gate (token reconciliation, FR-034) may feel like friction. This tension is accepted: the gate exists to prevent a repeat of the current multi-vocabulary problem.

---

## 4. Current System State

**What exists:** A 1,392-line monolithic `dashboard.css` with a self-contained, informal token vocabulary. A marketing site with a `--sk-*` custom property namespace. A Claude Design reference (`tmp/`) capturing the current marketing site's visual language. A Spec Kitty CLI with a shipped `deployable-skill-authoring` styleguide.

**Key frictions:**
- Visual restyling requires editing a single large CSS file with no component boundaries
- Terminology drift: dashboard uses `Feature:` and `Feature Overview` where spec says Mission
- No shared token layer: every surface re-invents color values independently
- AI agents have no brand governance reference; each session requires manual brand briefing

**Known technical debt relevant to this initiative:** The dashboard CSS is tightly coupled to the Django template shell. Extracting it is out of scope for the design system; the design system provides the destination to migrate to.

---

## 5. System Boundaries

**In scope:**
- CSS custom property token package (`@spec-kitty/tokens`)
- Angular component library (`@spec-kitty/angular`)
- Plain HTML/JS primitive package (`@spec-kitty/styles`)
- Storybook (documentation + CI visual regression)
- Brand voice and visual identity doctrine bundle
- CI quality pipeline (lint, a11y, visual regression, cross-browser, Lighthouse, security)
- GitHub Pages Storybook deployment

**Out of scope:**
- Jekyll/Hugo docsite theme implementation (follow-up mission)
- Dashboard-to-design-system migration (consuming project's responsibility)
- FastAPI/OpenAPI migration in spec-kitty (#645)
- spec-kitty CLI runtime or governance engine changes
- Marketing site restyling

**External integration points:**

| Adjacent system | Relationship | Interface type | Notes |
|---|---|---|---|
| `spec-kitty` repo (dashboard) | Primary consumer | npm package dependency | Version pinning governed by charter consumer update policy |
| Future docsite repo | Secondary consumer | npm package + CDN link | Jekyll/Hugo integration deferred; token-only consumption in scope |
| npm registry (`@spec-kitty` scope) | Distribution channel | npm publish / npm install | Scope ownership is a pre-flight security check |
| GitHub Pages | Storybook hosting | GitHub Actions deploy | Auto-deploy on merge to `main` |
| `spec-kitty.ai` marketing site | Token value reference | Manual reconciliation (FR-034) | Not a runtime dependency; one-time reconciliation |
| spec-kitty doctrine system | Org-layer doctrine consumer | `spec-kitty doctrine fetch` (post-#832) | `doctrine/` structured for compatibility now |

---

## 6. External Forces

**Market / competitive forces:** The frontend design system space is mature and crowded (shadcn, Tailwind, MUI, Radix). The design system does not compete with these — it complements them. The architecture explicitly accommodates Tailwind consumers mapping `--sk-*` into their config (ADR-001).

**Technology shifts:** Angular's 6-month LTS cycle creates a recurring maintenance obligation for `@spec-kitty/angular`. Storybook's historically aggressive major release cadence (v6→v7→v8→v9) creates periodic CI tooling update risk. Both are addressed by the Dependabot configuration and major-version-bump policy (ADR-005).

**Organisational mandates:** All Priivacy-ai projects adopting Spec Kitty will inherit the org-layer doctrine bundle once #832 ships — making brand governance automatic rather than manual.

---

## 7. Constraints

| Constraint type | Description | Source |
|---|---|---|
| Technology | `--sk-*` custom properties are the only token distribution format; no hardcoded values | ADR-001, C-003 |
| Technology | Angular targets current LTS only | C-007 |
| Technology | Cartoon/mascot illustrations excluded from distribution packages | C-008, SK-D02 |
| Security | All GitHub Actions pinned to commit SHAs | ADR-005, FR-043 |
| Security | No `*` or `latest` version specifiers in `package.json` | C-009 |
| Pre-implementation gate | Token schema value reconciliation (FR-034) must complete before `@spec-kitty/tokens` v1 implementation begins | ADR-003 |
| Pre-implementation gate | `@spec-kitty` npm scope must be confirmed owned before release pipeline is built | ADR-005 |
| Publishing | npm packages published with `--provenance`; SBOM generated at release | FR-044, FR-045 |

---

## 8. Key Uncertainties and Assumptions

| Assumption / Uncertainty | Risk if wrong | Owner | Validation approach |
|---|---|---|---|
| `@spec-kitty` npm scope is available and will be owned | Dependency confusion attack surface; all publishing blocked | Maintainer | Pre-flight check before release pipeline work |
| Claude Design reference token values closely match live marketing site CSS | Token reconciliation (FR-034) requires significant rework before v1 | Maintainer | FR-034: audit and compare before implementation |
| Angular LTS remains stable for the 18-month consumer update window | Consumers forced to upgrade earlier than planned | Package maintainer | Monitor Angular LTS calendar; initiate upgrade 3 months pre-expiry |
| PR preview deployment is achievable within the 10-minute CI budget (NFR-002) | NFR-002 breach; slow contributor feedback loop | Planner | Tooling selection deferred to planning (NFR-008) |
| Storybook multi-framework rendering (Angular + plain HTML in one story) is achievable with the v8/v9 API | Storybook story count doubles (one per framework target) | Planner | Proof-of-concept in stub component (FR-032) |
