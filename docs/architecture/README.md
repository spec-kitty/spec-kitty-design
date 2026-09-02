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

All Accepted decisions are in [`decisions/`](decisions/). Any mission spec that would contradict an Accepted ADR must include an ADR amendment as a tracked work item before implementation — see charter `architectural_review_requirement`.

| ADR | Title | Status |
|---|---|---|
| [ADR-001](decisions/2026-05-01-1-token-distribution-format.md) | Token Distribution Format — CSS Custom Properties | Accepted |
| [ADR-002](decisions/2026-05-01-2-monorepo-package-topology.md) | Monorepo Package Topology — Separate Publishable Packages | Accepted |
| [ADR-003](decisions/2026-05-01-3-token-schema-naming-convention.md) | Token Schema and Naming Convention | Accepted |
| [ADR-004](decisions/2026-05-01-4-org-layer-doctrine-distribution.md) | Org-Layer Doctrine Distribution | Accepted |
| [ADR-005](decisions/2026-05-01-5-npm-supply-chain-security-posture.md) | npm Supply Chain Security Posture | Accepted |
| [ADR-006](decisions/2026-05-01-6-storybook-multi-framework-rendering.md) | Storybook Multi-Framework Rendering Strategy | Accepted |
| [ADR-007](decisions/2026-05-01-7-storybook-version-10x-adoption.md) | Storybook 10.x Adoption — Angular 21 Compatibility | Accepted |

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
