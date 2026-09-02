# The adversarial squad is a merge gate in this repository

Status: active. Applies to `spec-kitty/spec-kitty-design` only.

This is the durable home for the reasoning behind the project-layer doctrine
overrides under `.kittify/doctrine/`. It lives here, not in
`.kittify/doctrine/PROVENANCE.md`, because that file is **generated** — `spec-kitty
charter synthesize` rewrites it from a template and would destroy this record while
restoring the (then false) claim that the project doctrine tree "is intentionally
empty".

## The ruling

Packaged spec-kitty doctrine makes the adversarial review squad explicitly optional:

- `DIRECTIVE_046` — *"The adversarial review squad (adversarial-squad-deployment) is
  the RECOMMENDED review mechanism — not a mandated gate; it stays optional per its
  own doctrine."*
- `adversarial-squad-cadence` styleguide — *"No enforcement of squad participation is
  permitted"*, and it names gate-hardwiring as an anti-pattern.
- `adversarial-squad-deployment` procedure — *"it enriches the flow, it does not gate
  it"*, *"the orchestrator opts in; nothing forces the squad"*, plus a named
  anti-pattern **"Hard-wiring the squad as a gate"**.

In the elements-first programme the operator ruled the squad **is** a gate. The three
overrides implement that ruling. They are scoped to this repository; nothing upstream
changes.

Two mechanics were added on top of the bare ruling, both learned the hard way here:

1. **Every dispatched lens must report before the merge decision.** PR #85 was merged
   on three of four lenses; the fourth then found two further gate holes (fixed in
   #95).
2. **Squad evidence is pinned to the head SHA it was taken against.** A push after
   the squad reports invalidates the verdict.

## How the overrides bind

Each override reuses the **packaged artifact's ID**. Doctrine loads built-in → org →
project with **field-level merge** keyed on `id` (`charter/offering/base.py`, ADR
`2026-05-16-1-doctrine-layer-merge-semantics`): fields present in the project YAML
replace same-named fields, absent fields are inherited, and a
`DoctrineLayerCollisionWarning` reports the replaced/inherited counts.

Two consequences worth knowing before editing these files:

- The merge is **shallow** (`{**built_in.model_dump(), **project_data}`). Changing one
  entry of a list field requires restating the whole list, so parts of these overrides
  are necessarily verbatim copies of packaged text and **will drift when the package
  updates**. Forked from spec-kitty-cli **3.2.6rc4**; re-diff against the packaged
  artifacts after a CLI upgrade.
- Project kind directories are **singular** — `directive/`, `styleguide/`,
  `procedure/` — not the plural names used under `packs/built-in/`.

| Artifact | File | Reaches agents? |
| --- | --- | --- |
| `DIRECTIVE_046` | `directive/046-readable-consistent-prs.directive.yaml` | **Yes — load-bearing** |
| `adversarial-squad-deployment` | `procedure/adversarial-squad-deployment.procedure.yaml` | Yes, via explicit `--include` and reference-following |
| `adversarial-squad-cadence` | `styleguide/adversarial-squad-cadence.styleguide.yaml` | **No** — see below |

## What was verified, and what was not

`spec-kitty doctrine validate` passing is **not** evidence that an override binds. It
parses one file and calls `model_validate` on it; it never loads the built-in layer
and never merges. It would green-light an inert override. It also demands the full
required field set even where the runtime would inherit it — which is why the
procedure override restates `exit_condition` and all seven `steps` verbatim despite
changing neither. (Directive `scope` turned out **not** to be required, so it was
dropped and is inherited; verified as 404 chars matching the packaged text.)

Use `doctrine validate`, not `charter validate`: the CLI prints a deprecation notice
steering `doctrine` → `charter`, but `spec-kitty charter` has **no `validate`
subcommand**. `doctrine validate` remains the only artifact validator in 3.2.6rc4.

Binding was therefore established empirically:

- **`DIRECTIVE_046` binds and reaches agents.** `spec-kitty charter context --action
  review --mission-type software-dev --json` carries the directive with `source:
  project` and the gate wording. Precise scope of that claim: the `all_directives`
  array is **byte-identical across all actions**, so checking four actions is one
  observation, not four. The action-scoped `directives` list requires
  `--mission-type`; there `DIRECTIVE_046` is present for **`implement` and `review`**,
  and absent for `specify` and `plan`.
- **Only the `intent` field travels.** The action context exposes `id`, `source`,
  `summary`, `title` — and `summary` is `intent` verbatim. The `procedures`,
  `integrity_rules` and `validation_criteria` arrays do **not** reach a lens. That is
  why the two gate mechanics above are stated inside `intent` and not only in the
  structured fields where they belong.
- **The procedure override binds and closes the reference chain.** `DIRECTIVE_046`
  lists `adversarial-squad-deployment` in its `references`, so an agent following that
  chain previously landed on packaged text calling the gate a named anti-pattern.
  After the override, `spec-kitty charter context --include
  procedure:adversarial-squad-deployment` renders the gate wording; the merged model
  resolves with provenance `project`, "does not gate it" and "nothing forces the
  squad" are gone, and `Hard-wiring the squad as a gate` is replaced by
  `Merging on a partial squad` and `Stale-SHA evidence`.
- **The generated charter bundle must be regenerated after any override change.**
  `charter.yaml` snapshots doctrine text. It was first committed *before* these
  overrides existed and therefore shipped the packaged "it stays optional" wording —
  a governance bundle asserting the negation of the rule it was meant to carry. Re-run
  `spec-kitty charter generate --no-from-interview` whenever a doctrine override
  changes, and check: `grep -c "not a mandated gate" .kittify/charter/charter.yaml`
  must be 0. (`charter.md` is hand-curated and is not rewritten by that command —
  verified unchanged.)
- **The styleguide override does not reach action contexts.** It resolves correctly at
  the repository layer (provenance `project`, 7 fields replaced, 5 inherited), but
  `resolver.py` hardcodes `styleguides=[]` on the action path, including under
  `--include-all`. It is kept because deleting it would leave project `DIRECTIVE_046`
  saying "merge GATE" beside a packaged styleguide still saying "No enforcement of
  squad participation is permitted" — a worse contradiction than the cost of the file.
  It is not what carries the rule to agents.

## Running `charter synthesize` is safe for the overrides

Tested in a throwaway copy: `spec-kitty charter synthesize` **does not prune or
rewrite** the three override YAMLs (md5 unchanged for all three), even though
`synthesis-manifest.yaml` records `artifacts: []` / `built_in_only: true` and does not
know about them. `charter status` reports the delta honestly as
`Artifacts: 0 (live doctrine files: 3)`.

It **does** rewrite `.kittify/doctrine/PROVENANCE.md` from its template — observed
58 lines → 17 — which is why this document exists outside that tree.

## Known unreachable surface

The authored harness skill `adversarial-squad` lives **outside this repository** at
`~/.claude/skills/adversarial-squad/SKILL.md` and states *"it never gates a mission"*,
*"do NOT wire it as a mandatory gate"*, and *"never a mission gate"*. Its description
is injected into an agent's context automatically, whereas the project doctrine
override only arrives if the agent runs `spec-kitty charter context`. A project
doctrine layer cannot reach it.

This is an open divergence, recorded rather than papered over. Agents working in this
repository take the project doctrine as governing. The fix belongs upstream or in the
harness, not here — changing it from this repo would violate the repo-scoping these
overrides deliberately keep.
