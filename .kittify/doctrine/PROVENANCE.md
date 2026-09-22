# Spec Kitty Doctrine — project layer

> **This file is generated.** `spec-kitty charter synthesize` rewrites it from a
> template, which restores text asserting this tree is empty and that the runtime
> falls back entirely to packaged doctrine. Both are false while the overrides below
> exist, so do not record anything here and do not trust it after a synthesize run.
>
> The durable record is
> [`docs/architecture/adversarial-squad-gate.md`](../../docs/architecture/adversarial-squad-gate.md),
> which is indexed from `docs/architecture/README.md` and `CLAUDE.md` — pointers that
> survive regeneration, unlike this one.

This `.kittify/doctrine/` tree carries three project-layer overrides that make the
adversarial review squad a merge gate in this repository: `DIRECTIVE_046`, the
`adversarial-squad-deployment` procedure, and the `adversarial-squad-cadence`
styleguide. Each reuses the packaged artifact's ID and merges field-level over it.

References
----------
- GitHub issue: https://github.com/Priivacy-ai/spec-kitty/issues/839
- Project-root resolution: `src/charter/_doctrine_paths.py`.
