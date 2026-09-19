# Plan — REL4: the library as an OpenDesign design-system package

**Spec**: `spec.md` · **Base**: `train/elements-first` @ `4c22b307` · **Date**: 2026-09-19

## What research settled (each measured, not assumed)

| Question | Answer | Evidence |
|---|---|---|
| Does OpenDesign expose the function that derives `components.manifest.json`? | **Yes** — `extractComponentsManifest({brandId, fixtureHtml, tokensCss})` | `packages/contracts/src/design-systems/components-manifest.ts:147` |
| Can it run outside OpenDesign's monorepo? | **Yes** — the file has zero imports | `grep '^import' components-manifest.ts` → empty |
| And the project-manifest validator? | `validateDesignSystemProjectManifest()` and `parseDesignSystemProjectManifest()`, also import-free | `design-systems/_schema/manifest.schema.ts:179,195` |
| Can CI reach upstream? | Upstream `nexu-io/open-design` is **public**; the local commit `c5ae6292c4` exists there | GitHub API |
| Is the fixture self-contained or linked? | **Self-contained** — one `<style>` block with `:root` inline, no `<link>`, in every reference inspected (`agentic`, `ant`, `bento`; `apple` has two blocks) | reference packages |
| What happens to our manifest on import? | **OpenDesign regenerates it** and overwrites the file, discarding keys it did not produce | `apps/daemon/src/design-systems/import.ts:156-173` |
| How does the instance load a prepared package? | **By discovery, not import.** Its user design-systems root holds a *symlink* `spec-kitty-train -> /workspace/team-kitty-ux/open-design-systems/spec-kitty-train`, read verbatim (`index.ts:604`) and listed as `user:spec-kitty-train`. `od design-systems import local` is the WRONG path: it scans a source codebase and generates its own DESIGN.md, generic-schema tokens.css and generic components.html (`import.ts:119-178`), discarding every file we build. *(Corrected during WP01; the first version of this row named `import local`.)* | data-volume listing; `GET /api/design-systems`; `import.ts` |
| Why was the old package pinned to `a9f385d`? | The container mounts a design-repo clone at `/workspace/spec-kitty-design`; it sits on `train/elements-first` at **`a9f385d4`** and has not been pulled since 2026-09-11. The package was generated from it and never refreshed. | `git -C references/spec-kitty-design-train log -1` |
| Which fonts does the library use? | **Falling Sky** (`--sk-font-display`), **Inter** (`--sk-font-sans`) and **Swansea**, via 40 `@font-face` rules over files in `packages/tokens/src/fonts/`; every referenced file is present. JetBrains Mono (`--sk-font-mono`) is not loaded — a comment in `tokens.css` records that its old `@import` was always dropped by the browser. | `tokens.css:276-283`, `@font-face` scan, reference-vs-file diff |
| Which fonts does today's package ship? | 30 Falling Sky `.otf` files — **exactly what its own stale `tokens.css` references**, so the package is internally consistent. It lacks Inter and Swansea only because that `tokens.css` predates them. | reference-vs-file diff: 30 referenced, 30 shipped, 0 missing |
| Does the static-only line in the spec hold as first written? | **No** — 13 of 34 components ship `:host`/`::slotted` rules in their CSS; spec amended | per-component grep, control on `action-row` (14) |

## Architecture

```
packages/tokens/src/tokens.css ─────────────┐  (byte copy, digest-checked)
packages/tokens/src/fonts/*.woff2 ──────────┤  (byte copy)
packages/styles/src/<c>/sk-<c>.css ─────────┤  (verbatim, sorted by component)
packages/styles/src/<c>/sk-<c>-*.html ──────┤  (the generated static forms — input only)
                                            ▼
                  scripts/build-opendesign-package.mjs
                                            │
          ┌─────────────────────────────────┼───────────────────────────────┐
          ▼                                 ▼                               ▼
   components.html                 components.manifest.json         manifest.json
   one <style>: tokens + all       = OpenDesign's own                od-design-system-project/v1,
   component CSS; one <section>      extractComponentsManifest()     validated by OpenDesign's
   per component, one block per      over the file beside it         own validator
   static form
                                            │
                                            ▼
                   opendesign/spec-kitty-train/   (committed; --check drift gate)
```

**The OpenDesign reference is vendored, byte-for-byte.** `scripts/vendor/open-design/` holds
`components-manifest.ts` and `manifest.schema.ts` exactly as upstream has them at `c5ae6292c4`, with
a digest manifest recording the upstream path, commit and sha256 of each. The gate verifies those
digests before running them. This is the reference implementation itself, not a rewrite of its
logic, so it cannot drift from the validator OpenDesign runs — and it keeps every gate network-free.
Node 22's type stripping runs the `.ts` directly; no build step, no new dependency.

## Implementation concerns

**IC-01 — the generator** (`scripts/build-opendesign-package.mjs`). Derives the component set from
the tree: every directory under `packages/styles/src/` with at least one generated `.html` form.
Refuses an empty set, and refuses a set smaller than the number of such directories. Output is
deterministic: sorted inputs, no timestamps, stable whitespace. Writes the whole package.
- `components.html`: one `<style>` = `tokens.css` + each component's CSS in sorted order, each preceded
  by a `/* component: <name> */` marker; one `<section data-od-component="<name>">` per component with
  a heading and one block per static form, labelled by variant.
- `DESIGN.md`: the current prose, carried over as the authored part, plus a **generated section between
  markers** listing emittable components with their variants, the excluded elements (derived), and the
  13-component fidelity caveat (derived by the same `:host`/`::slotted` scan).
- `manifest.json`: `id: spec-kitty-train`, `files` including `components`, `componentsManifest`, and
  `source: {type: github, url, branch}` — **no `commit`** (a committed file cannot know its own SHA);
  the `@spec-kitty/tokens` version goes in the description.

**IC-02 — the vendored reference.** Copy the two files at `c5ae6292c4`, record digests, and a small
runner that imports them. A `--selftest` proves the digest check reds on a one-byte change.

**IC-03 — the gates.** `--check` regenerates in a temp dir and diffs every file, reporting the first
differing path. Plus: a static-only markup assertion (no hyphenated element tags, no `<script>`, no
`<template shadowrootmode>`); a tokens digest equality; OpenDesign's own validator over
`manifest.json`; and `components.manifest.json` equal to `extractComponentsManifest()` over the
committed fixture. Each with a probe table and a floor outside it. Wired through all three
gate-wiring layers (CI step, `REQUIRED_LINT`, defeat case) with `MIN_CASES` taken from the table's
own count.

**IC-04 — the release path.** `--check` runs in `publish-packages.yml` and `release.yml` alongside the
existing size check, so a release cannot ship while the committed package is stale.

**IC-05 — docs and proof.** `docs/opendesign-package.md`: install by pointing the instance's
`spec-kitty-train` symlink at `opendesign/spec-kitty-train` inside the mounted design-repo clone; refresh
by pulling that clone. No import. The pre-merge proof installs a copy under a NEW id in the data volume
so the live `spec-kitty-train` symlink and the `team-kitty-ux` repository are untouched, and removes it
afterwards. The consumability proof runs one real
generation on the local instance; the token is read from `~/dev/open-design-local/.env` into a shell
variable at call time and is never written, echoed or committed.

## Work packages

| WP | Delivers | Depends on |
|---|---|---|
| WP01 | IC-01 + IC-02: generator, vendored reference, committed package | — |
| WP02 | IC-03 + IC-04: every gate, wiring, release path | WP01 |
| WP03 | IC-05: documentation, install into the local instance, consumability proof | WP02 |

## Risks

- **Verbatim CSS carries 13 components' inert `:host` rules into OpenDesign's prompt summary.**
  `summarizeComponentsManifestForPrompt` reports selector counts to the agent. Accepted: the
  alternative is a fixture built on a stylesheet no consumer installs. `DESIGN.md` names the caveat.
- **Upstream can change the contract.** The vendored copy is pinned; a newer OpenDesign may derive a
  different manifest. The proof run against the live 0.21.1 instance is the check that the pin still
  matches what is deployed.
- **The imported project in the instance is a copy.** Refreshing needs a re-import, not a file edit;
  the docs say so and the proof exercises it.
- **The font set grows from 30 files to the library's 40+**, adding Inter and Swansea. That is the
  current `tokens.css` catching up with the fonts it declares, not a change of typeface.

## Open question deliberately left to WP01

Whether `DESIGN.md`'s authored prose (10 KB in today's package) should be carried over as-is or
reviewed first. It was written against the stale `a9f385d` pin, so it may describe tokens that have
since changed; WP01 records any contradiction it finds rather than silently editing the prose.
