# Spec Kitty Doctrine — Fresh Project Seed

> **This file is generated.** `spec-kitty charter synthesize` rewrites it from a
> template. Do not record reasoning here — it will be destroyed, and the template
> restores the "intentionally empty" wording below, which is no longer true.
>
> **This tree is no longer empty.** It carries three project-layer overrides that make
> the adversarial review squad a merge gate in this repository. The rationale, the
> binding mechanism, the evidence, and the known unreachable surface are recorded in
> [`docs/architecture/adversarial-squad-gate.md`](../../docs/architecture/adversarial-squad-gate.md),
> which is not generated.

This `.kittify/doctrine/` tree was materialized by `spec-kitty charter
synthesize` running against a **fresh project** (no LLM-authored YAML under
`.kittify/charter/generated/`). It exists so `DoctrineService` discovers a
project layer and the runtime can advance; it is intentionally empty.

The runtime falls back to the packaged built-in doctrine
(`packs/built-in/`) for all artifact lookups until the LLM harness writes
project-local artifacts under `.kittify/charter/generated/` and you re-run
`spec-kitty charter synthesize`.

References
----------
- GitHub issue: https://github.com/Priivacy-ai/spec-kitty/issues/839
- Spec assumption A2: public CLI synthesize works on a fresh project.
- Project-root resolution: `src/charter/_doctrine_paths.py`.
