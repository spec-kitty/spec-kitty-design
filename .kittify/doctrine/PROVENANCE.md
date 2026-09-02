# Spec Kitty Doctrine — Fresh Project Seed

This `.kittify/doctrine/` tree was materialized by `spec-kitty charter
synthesize` running against a **fresh project** (no LLM-authored YAML under
`.kittify/charter/generated/`). It exists so `DoctrineService` discovers a
project layer and the runtime can advance. It was initially empty; it now
carries two deliberate project-layer overrides, documented below.

The runtime falls back to the packaged built-in doctrine
(`packs/built-in/`) for all artifact lookups until the LLM harness writes
project-local artifacts under `.kittify/charter/generated/` and you re-run
`spec-kitty charter synthesize`.

References
----------
- GitHub issue: https://github.com/Priivacy-ai/spec-kitty/issues/839
- Spec assumption A2: public CLI synthesize works on a fresh project.
- Project-root resolution: `src/charter/_doctrine_paths.py`.

Project-layer overrides
-----------------------

Two artifacts in this tree deliberately shadow packaged built-ins by reusing
their IDs. Loading is built-in -> org -> project with **field-level merge**
(ADR `2026-05-16-1-doctrine-layer-merge-semantics`): fields present in the
project YAML replace same-named fields; absent fields are inherited. Each load
emits a `DoctrineLayerCollisionWarning` naming the replaced/inherited counts.

**Why.** The packaged doctrine makes the adversarial review squad optional --
`DIRECTIVE_046` says it "is the RECOMMENDED review mechanism -- not a mandated
gate; it stays optional per its own doctrine", and the packaged
`adversarial-squad-cadence` styleguide names gate-hardwiring as an anti-pattern
and states "No enforcement of squad participation is permitted." In the
elements-first programme the operator has ruled the squad is a **gate**. These
overrides are scoped to this repository and change nothing upstream.

| Artifact | File | Effect |
| --- | --- | --- |
| `DIRECTIVE_046` | `directive/046-readable-consistent-prs.directive.yaml` | **Load-bearing.** Reaches agents. |
| `adversarial-squad-cadence` | `styleguide/adversarial-squad-cadence.styleguide.yaml` | Shadows at the repository layer only. |

**What was verified, and what was not.** Passing `spec-kitty doctrine validate`
proves only that each file is independently well-formed -- it validates files
standalone, not the merged result -- so it is *not* evidence that an override
binds. Both were therefore checked empirically:

- `DIRECTIVE_046`: `spec-kitty charter context --action <a> --json` was captured
  before and after. `all_directives[].summary` for `DIRECTIVE_046` changes from
  "not a mandated gate; it stays optional" to the gate wording, for `specify`,
  `plan`, `implement` and `review`. `review` is the action used to brief squad
  lenses, so this override does reach them.
- `adversarial-squad-cadence`: loading `StyleguideRepository` with this project
  dir resolves the artifact with provenance `project` (7 fields replaced, 5
  inherited, `patterns` among the inherited). However, `charter context` emits
  directives and does not emit styleguides, so **this override does not reach
  action contexts**. It binds for anything that reads the styleguide repository
  directly, and it keeps the two artifacts from contradicting each other; it is
  not what carries the rule to agents. `DIRECTIVE_046` is.
