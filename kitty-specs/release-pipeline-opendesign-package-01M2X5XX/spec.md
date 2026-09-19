# REL4 — the Spec Kitty library as an OpenDesign design-system package

**Mission branch**: `mission/release-pipeline-opendesign-package` · **Issue**: #396 · **Epic**: #361
**Created**: 2026-09-19 · **Status**: Draft · **Base**: `train/elements-first` @ `4c22b307`

## Purpose

OpenDesign (self-hosted `nexu-io/open-design`, the tool the `ux_redesign` pipeline drives) consumes a
design system as a folder: prose, compiled tokens and, optionally, a **components fixture** that its
agent reads to emit real components. The `spec-kitty-train` package OpenDesign uses today ships
tokens only, so a generation can match Spec Kitty's colours and type but cannot emit a single library
component. This mission makes the library itself the source of that package — including the
components fixture — and keeps it current from the same derived package set the release path uses.

## State of the world, verified 2026-09-19 (not assumed)

| Fact | Evidence |
|---|---|
| OpenDesign 0.21.1 runs locally, loopback-only | podman container `open-design`, `127.0.0.1:7456`; `GET /api/health` → `{"ok":true,"version":"0.21.1"}` |
| Its API requires a token | every other route → 401 `API_TOKEN_REQUIRED`; the token lives in `~/dev/open-design-local/.env`, whose README forbids copying it into design artifacts or commits |
| The current package is tokens-only | `ux_redesign/open-design-systems/spec-kitty-train/` holds `DESIGN.md`, `tokens.css`, `manifest.json`, `metadata.json`, `USAGE.md`, `fonts/` — no `components.html`, no `components.manifest.json` |
| It is pinned to a stale commit | its `manifest.json` records `source.commit: a9f385d…`; its `tokens.css` differs from `packages/tokens/src/tokens.css` at the base by **168 lines** |
| It lives in another repo | `spec-kitty/team-kitty-ux` (private), mounted into the container at `/workspace/team-kitty-ux`; imported into the instance as project `ds-spec-kitty-train` |
| The contract | `design-systems/_schema/manifest.schema.ts`: project manifest `od-design-system-project/v1`, optional `files.components: "components.html"`, optional `componentsManifest` path described as *"a rebuildable cache derived from components.html + tokens.css"* |
| What a mature package ships | every inspected reference package (`agentic`, `ant`, `apple`, …) carries `components.html` + `components.manifest.json` + `preview/`; the latter has `schemaVersion: 1`, `brandId`, `source{componentsHtml,tokensCss}`, `fixture{styleBlockCount,selectorCount,classCount,elementCount}`, `tokens{declared,referenced}` |
| Static forms available | **34** components carry generated static forms under `packages/styles/src/<name>/*.html` — **159** forms in all (ADR-10 §3: the static `.html` is generated build output, never hand-edited) |
| Not everything has one | of the library's custom elements, **18** have no static form (for example `sk-theme-toggle`, `sk-notice`, the charts); they are shadow-DOM-only today |

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | A generator in `scripts/` builds the complete OpenDesign package — `manifest.json`, `DESIGN.md`, `tokens.css`, `components.html`, `components.manifest.json`, `USAGE.md` and fonts — into a committed directory in this repository. | High |
| FR-002 | `components.html` is assembled from the library's **generated static forms only** (ADR-10 §3). No custom element, shadow root, `<script>` or runtime dependency may appear in it. | High |
| FR-003 | The fixture covers **every** component that has a generated static form, with every variant form, derived from the source tree rather than listed by hand. At the base that is 34 components and 159 forms. | High |
| FR-004 | Components without a static form are **named as excluded** in the package — in `DESIGN.md` and in the components manifest — derived rather than listed, so OpenDesign's agent knows they exist and why it cannot emit them. | High |
| FR-005 | `tokens.css` in the package is **byte-identical** to the token stylesheet the library ships, verified by digest. | High |
| FR-006 | `components.manifest.json` is **derived by OpenDesign's own code** from `components.html` + `tokens.css` where OpenDesign exposes that derivation, and validated by OpenDesign's own validator — never by a re-implementation of the schema in this repository. | High |
| FR-007 | The project `manifest.json` validates against `od-design-system-project/v1` using OpenDesign's exported validator, and declares `files.components` and `componentsManifest`. | High |
| FR-008 | The package records **which library version it was generated from** — the `@spec-kitty/*` version and branch — and does not record a commit SHA of itself, which a committed artifact cannot know. | Medium |
| FR-009 | A `--check` mode regenerates the package and fails on any difference from what is committed, and CI runs it on every PR, wired through all three gate-wiring layers (CI step, `REQUIRED_LINT` entry, defeat case). | High |
| FR-010 | The generator refuses an empty or shrunken component set: a green run over zero components is a defect. | High |
| FR-011 | The release path regenerates the package from the same derived package set it publishes, so a release can never ship a stale package. | Medium |
| FR-012 | `docs/` documents how to install the package into the self-hosted OpenDesign instance and how to refresh it after a release, including re-importing the existing `ds-spec-kitty-train` project. | Medium |

## Acceptance essentials

- **Contract**: `manifest.json` and `components.manifest.json` pass OpenDesign's own validation, run from `~/dev/open-design` at the version the local instance runs (0.21.1).
- **Static-only**: `components.html` contains zero custom-element tags, `<script>` elements or `:host`/`::slotted` selectors, asserted by a check with a control that proves the assertion can fail.
- **Coverage**: the fixture's component count equals the number of components with a static form, and every excluded element is named.
- **Tokens**: `tokens.css` digest equals the library's.
- **Drift**: `--check` reds on a one-byte change to any generated file and on a new static form that was not regenerated.
- **Consumability**: one real generation on the local OpenDesign instance imports the package and emits at least one library component, recorded with the prompt, the output and the component it used. The API token is read at call time and never written to a file, a commit, a log or this repository.

## Constraints and consequences the operator must know

- **The package moves repositories.** Operator decision 2026-09-19: the package is committed in the design repository, not in `team-kitty-ux`. The existing copy there becomes stale the moment this lands; retiring it or replacing it with a pointer is part of this mission's documentation, but changing that private repository is not in scope without a separate instruction.
- **The instance holds an imported copy.** OpenDesign stores `ds-spec-kitty-train` in its data volume; editing a mounted folder does not update it. The proof therefore re-imports, and the documentation says so.
- **Static-only means incomplete by design.** 18 elements cannot appear in the fixture until they grow a static form. The exclusion list is the honest record of that, not a defect of this mission.
- **The OpenDesign schema is upstream's.** A future OpenDesign release may change the contract; the gate validates against the vendored reference, so an upstream change surfaces as a red check rather than a silent mismatch.

## Out of scope

- Adding static forms to the 18 shadow-only elements (separate component work).
- Overturning the token self-containment ruling (epic #384 / DKM0).
- Publishing the package to the upstream OpenDesign repository.
- Changing the `team-kitty-ux` repository.
- Making the npm packages public (REL3, #364).

## Recorded decisions this mission inherits

| Decision | Ruling | Source |
|---|---|---|
| Package home | committed in the design repository with a drift gate | operator, 2026-09-19, multiple choice |
| Merge authority | may merge into `train/elements-first` on CI green + four-lens gate evidence on the head SHA; train→main stays the operator's | operator, 2026-09-19; recorded on #361 |
| OpenDesign access | use the local instance's existing configuration; report before use | operator, 2026-09-19 |
| Coverage | all components with a static form; the rest named as excluded | operator, 2026-09-19 |
| Static-form authority | ADR-10 §3 (ratified). ADR-15 is `Proposed` and is not relied on. | ADR records |
