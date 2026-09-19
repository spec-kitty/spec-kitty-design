# Tasks: REL4 — the library as an OpenDesign design-system package

**Mission**: `release-pipeline-opendesign-package-01M2X5XX`
**Input**: `spec.md` (`6aa45c00`), `plan.md` (`6aa45c00`)
**Planning base / merge target**: `mission/release-pipeline-opendesign-package` (topology `single_branch` — verified in `meta.json`); the mission PR targets `train/elements-first`, never `main`.

## Subtask Index

| ID | Description | Requirements | Parallel |
|---|---|---|---|
| T001 | Vendor OpenDesign's `components-manifest.ts` and `manifest.schema.ts` byte-for-byte at upstream `c5ae6292c4`, with a digest manifest and a runner using Node's type stripping; a selftest proves a one-byte change is refused | FR-006, FR-007 | |
| T002 | Derive the component set and its static forms from the tree; refuse an empty or shrunken set; derive the excluded elements and the `:host`/`::slotted` fidelity-caveat set | FR-003, FR-004, FR-010 | |
| T003 | Build `components.html`: one `<style>` (tokens + every component's CSS verbatim, sorted), one `<section>` per component, one block per static form; deterministic output | FR-001, FR-002, FR-003 | |
| T004 | Build `tokens.css` (byte copy), `fonts/`, `manifest.json` (no self-SHA; library version recorded) and `components.manifest.json` via OpenDesign's own `extractComponentsManifest()` | FR-001, FR-005, FR-006, FR-007, FR-008 | |
| T005 | Build `DESIGN.md` (authored prose carried over + a generated section between markers) and `USAGE.md`; record, do not silently fix, any contradiction between the carried prose and the current library | FR-001, FR-004 | |
| T006 | Generate and commit `opendesign/spec-kitty-train/`; prove OpenDesign's validator accepts `manifest.json` and its extractor reproduces `components.manifest.json` exactly | FR-001, FR-006, FR-007 | |
| T007 | `--check`: regenerate into a temp dir and diff every file; probe table (one-byte change per output, an unregenerated new static form, a deleted file) with a floor outside the table | FR-009 | |
| T008 | Gates: static-only markup (no hyphenated element tags, no `<script>`, no declarative shadow root) with a control; tokens digest equality; OpenDesign validator and extractor equality | FR-002, FR-005, FR-006, FR-007 | |
| T009 | Wire every new gate through all three layers (CI step, `REQUIRED_LINT` entry, defeat case); `MIN_CASES` from the table's own reported count | FR-009 | |
| T010 | Run `--check` on the release path (`publish-packages.yml`, `release.yml`) and register it where the release-graph checker requires every-stream steps | FR-011 | |
| T011 | `docs/opendesign-package.md`: install, refresh after a release, re-importing `ds-spec-kitty-train`; note the `team-kitty-ux` copy is superseded | FR-012 | |
| T012 | Re-import the package into the local OpenDesign instance; the API token is read at call time and never written, echoed or committed | FR-012 | |
| T013 | Consumability proof: one real generation emits at least one library component; record prompt, output and component in the mission directory | acceptance | |

## Work Packages

### WP01 — Generator, vendored OpenDesign reference, committed package

- **Goal**: produce `opendesign/spec-kitty-train/` from the library's own sources, with `components.manifest.json` derived by OpenDesign's own code.
- **Depends on**: —
- **Independent test**: OpenDesign's vendored validator accepts `manifest.json`; its extractor over the committed fixture reproduces `components.manifest.json` byte-for-byte; the fixture covers every component with a static form.

- [ ] T001 Vendor OpenDesign's reference files with a digest manifest
- [ ] T002 Derive the component set, exclusions and fidelity caveats
- [ ] T003 Build components.html
- [ ] T004 Build tokens.css, fonts, manifest.json, components.manifest.json
- [ ] T005 Build DESIGN.md and USAGE.md
- [ ] T006 Generate and commit the package; prove OpenDesign accepts it

### WP02 — Gates and the release path

- **Goal**: make a stale or malformed package impossible to merge or release.
- **Depends on**: WP01
- **Independent test**: every probe reds on its mutation; every gate is wired through all three layers; the release path runs `--check`.

- [ ] T007 --check mode with probe table and floor
- [ ] T008 Static-only, tokens-digest and OpenDesign-equality gates
- [ ] T009 Three-layer gate wiring
- [ ] T010 Release-path wiring

### WP03 — Documentation and the consumability proof

- **Goal**: an operator can install and refresh the package, and one real OpenDesign generation proves it is consumable.
- **Depends on**: WP02
- **Independent test**: a re-import succeeds and one generation emits a library component, recorded.

- [ ] T011 Documentation
- [ ] T012 Re-import into the local instance
- [ ] T013 Consumability proof

## Parallelization

None. WP02's gates check WP01's output; WP03's proof needs the gated package.

## MVP Scope

All three WPs. The package without its gates would repeat the stale-pin failure this mission exists to end; the gates without the proof would certify a package nobody has shown OpenDesign can use.
