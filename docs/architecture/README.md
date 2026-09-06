# Architecture Documentation

This directory contains the architectural record for the Spec Kitty Design System.

## Reading order

| Document | What it answers |
|---|---|
| [sad-lite.md](sad-lite.md) | **Start here.** System context, package topology, bounded contexts, quality attributes, risk landscape |
| [system-context-canvas.md](system-context-canvas.md) | Organisational context, stakeholders, external forces, constraints |
| [quality-attribute-assessment.md](quality-attribute-assessment.md) | AMMERSE impact analysis of the core architectural choices |
| [risk-register.md](risk-register.md) | Full risk inventory with mitigations and owners |
| [adversarial-squad-gate.md](adversarial-squad-gate.md) | Why the adversarial squad is a merge gate here, how the `.kittify/doctrine/` overrides bind, and what was verified |

## Decisions (ADRs)

The decision records are in [`decisions/`](decisions/), and the table below is that directory — `scripts/check-adr-index.mjs` fails CI when a record has no row, when a row points at no record, or when a row's **Status** disagrees with the record's own. The status is the record's, not the table's: only **Accepted** records bind. Any mission spec that would contradict an Accepted ADR must include an ADR amendment as a tracked work item before implementation — see charter `architectural_review_requirement`. A **Proposed** record describes a decision that has been written down but not ratified by the operator; it informs a mission and does not constrain it.

Identifiers below are the ones each record uses in its own H1, unpadded — `ADR-8`, not `ADR-008`.

| ADR | Title | Status |
|---|---|---|
| [ADR-1](decisions/2026-05-01-1-token-distribution-format.md) | Token Distribution Format — CSS Custom Properties over Utility Frameworks | Accepted |
| [ADR-2](decisions/2026-05-01-2-monorepo-package-topology.md) | Monorepo Package Topology — Separate Publishable Packages per Framework Target | Accepted |
| [ADR-3](decisions/2026-05-01-3-token-schema-naming-convention.md) | Token Schema and Naming Convention — Precondition for Implementation | Accepted |
| [ADR-003 addendum](decisions/ADR-003-addendum-token-values.md) | Token value reconciliation results | Complete |
| [ADR-4](decisions/2026-05-01-4-org-layer-doctrine-distribution.md) | Org-Layer Doctrine Distribution — Design System as Priivacy-ai Org Doctrine Source | Accepted |
| [ADR-5](decisions/2026-05-01-5-npm-supply-chain-security-posture.md) | npm Supply Chain Security Posture — Accepted Controls and Residual Risk | Accepted |
| [ADR-6](decisions/2026-05-01-6-storybook-multi-framework-rendering.md) | Storybook Multi-Framework Rendering Strategy | Accepted |
| [ADR-7](decisions/2026-05-01-7-storybook-version-10x-adoption.md) | Storybook 10.x Adoption — Angular 21 Compatibility | Accepted |
| [ADR-8](decisions/2026-09-02-8-custom-elements-base-layer.md) | Custom Elements as the Shared Component Base Layer | Accepted |
| [ADR-9](decisions/2026-09-02-9-shadow-dom-and-styling-api.md) | Shadow DOM, the Styling API, and Label Ownership | Proposed |
| [ADR-10](decisions/2026-09-02-10-distribution-and-canonical-markup.md) | Distribution, Build Artifacts, and Canonical Markup | Accepted |
| [ADR-11](decisions/2026-09-02-11-verification-stack-and-wrapper-generation.md) | Verification Stack for Elements, and Generated Wrappers | Proposed |
| [ADR-12](decisions/2026-09-02-12-consumer-audit-of-record.md) | Consumer Audit of Record, and Diagram Corrections | Proposed |
| [ADR-13](decisions/2026-09-02-13-storybook-web-components-builder.md) | Storybook Moves to the Web-Components Renderer on Vite | Proposed |
| [ADR-14](decisions/2026-09-06-14-detached-probe-validation-seam.md) | The Detached-Probe Validation Seam | Proposed |

## Research

Background evaluations that informed the ADRs and charter are in [`research/`](research/).

| Document | Topic |
|---|---|
| [001-design-system-architectural-evaluation.md](research/001-design-system-architectural-evaluation.md) | Distribution, reuse, deployment, consistency, adaptability |
| [002-llm-doctrine-bundle-evaluation.md](research/002-llm-doctrine-bundle-evaluation.md) | LLM/agent artifact patterns; shadcn-ui comparison; #832 org-layer alignment |
| [003-npm-supply-chain-security-evaluation.md](research/003-npm-supply-chain-security-evaluation.md) | npm attack surface, frontend volatility, security controls |

## Governance

The architectural vision is **token-first, framework-progressive**: `@spec-kitty/tokens` is the long-lived foundation; framework packages are short-lived lifecycle adapters.

All agents working on missions in this repository must review the relevant ADRs before speccing or planning work. The charter's `architectural_review_requirement` enforces this.
