# Mission Specification: elements-first-release

**Mission Branch**: `mission/elements-first-release`
**Created**: 2026-09-04
**Status**: Draft
**Input**: Issue #80 (M14), part of epic #66, as revised by its own correction of 2026-09-02.

## Scope, and the prerequisite this mission does not have

This mission **prepares** the release. It does not perform one, and it needs no npm credentials.

Issue #80 was originally written with `npm view @spec-kitty/elements returns a version` as its exit
criterion. Its 2026-09-02 correction withdrew that, on two grounds: `release.yml` fires on
`push: tags: ['v*.*.*']` rather than on a merge, so satisfying it would mean tagging 1.0.0 out of
an integration branch before that branch has been reviewed as a whole; and it would put publish
credentials inside a mission when releasing is an operator act. The correction states the general
consequence for the programme — **no mission needs npm write access** — and this one does not.

The `@spec-kitty` npm scope therefore gates the **tag** that follows this mission, not the mission.
Creating the org, adding `NPM_TOKEN` and tagging remain the operator's, unchanged.

## The problem, measured

Every finding below was measured on `75ca61e` and is reproducible from this branch. One earlier
finding — that a missing `repository` field would fail provenance — was **retracted** after reading
`libnpmpublish@11.17.0`; it does not appear as a requirement here.

**`release.yml` has never been executed by any check.** It runs only on a `v*.*.*` tag, so no PR
exercises it. That is not incidental: the `cp packages/html-js/src/nav-pill/sk-nav-pill.js` step
that #73 removed would have hard-failed the next release, and it was found by a lens reading the
file rather than by anything running it. Whatever else this mission does, it must end that.

**The two packages the epic exists to ship cannot be published, and the failure is silent.**
`@spec-kitty/elements` and `@spec-kitty/react` are `"private": true`. `npm publish` on a private
package does not error:

```
$ cd packages/elements && npm publish --dry-run; echo $?
npm warn publish Skipping workspace @spec-kitty/elements, marked as private
0
```

So #80's revised criterion — *"`npm publish --dry-run` passes for every package in the new graph"* —
is **already satisfied**, by two packages that publish nothing. Any gate that reads exit codes is
green over an empty set.

**`release.yml`'s three lists disagree.** It builds `tokens,styles,elements`, publishes `tokens` and
`styles`, and audits `for pkg in tokens styles`. `elements` is built on every release and dropped;
`react` is neither built nor published.

**`tokens.css` carries a dead `@import`, and JetBrains Mono has never loaded.** Line 162 is
`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono…')`; `:root {` opens at line 3.
CSS requires `@import` to precede every style rule, so it is dropped. Verified in Chromium — 32 rules
parsed, 0 import rules, and a route watching `fonts.googleapis.com` never fired. `--sk-font-mono`
falls through to `ui-monospace` everywhere.

This one contains a trap, and the trap is the reason it belongs in this mission rather than a
tokens one. The `file://` no-network criterion currently passes **by accident**: the graph's only
network dependency is dead code. Moving the `@import` to the top of the file would make the font
load and break that criterion in the same edit, and would add an unpinned third-party runtime
request that ADR-5's control table does not sanction.

**`@spec-kitty/tokens` packs 3.9 MB, 5.6 MB unpacked, 37 files.** `assets/logo.png` is 1.48 MB of
that and is referenced nowhere — every use in the repo is `logo.webp` at 29 KB. FR-105 records the
three brand assets as a deliberate deliverable, so this is a decision to take, not an obvious
deletion.

**`@spec-kitty/styles` exposes subpath exports for 3 of its 15 component directories** — `button`,
`site-footer`, `stub`. The other twelve are unreachable by subpath.

## User Scenarios & Testing

### User Story 1 — the release pipeline is exercised before it is trusted (Priority: P1)

A maintainer opens a PR that changes packaging — a `files` array, an `exports` map, a
`private` flag, a build target. CI tells them, on that PR, whether the release still produces the
tarballs it is supposed to produce.

**Why this priority**: it is the only story that changes the *class* of defect. Every other finding
in this spec is an instance of "nothing ran the release path". Fixing the instances without fixing
that leaves the next instance to be found by a failed release.

**Independent Test**: revert any single packaging fact on a branch — re-add `"private": true`, drop
a package from the publish set, empty a `files` array — and the new gate reds on the PR.

**Acceptance Scenarios**:

1. **Given** a PR that marks a publishable package `"private": true`, **When** CI runs, **Then** the release gate fails and names the package.
2. **Given** a PR that removes a package from `release.yml`'s publish set while leaving it publishable, **When** CI runs, **Then** the gate fails on the disagreement rather than on either list alone.
3. **Given** an unchanged tree, **When** the gate runs, **Then** it asserts a non-empty set of packages and fails if that set is empty.

---

### User Story 2 — every package in the new graph actually ships (Priority: P1)

A consumer runs `npm install @spec-kitty/elements` and gets the custom-element base layer; a React
consumer installs `@spec-kitty/react` and gets the generated wrappers.

**Why this priority**: without it the epic has no output. Forty components across fifteen missions
currently sit behind `"private": true`.

**Independent Test**: `npm pack` each package and assert the tarball's contents against a declared
manifest — entry points resolve, the IIFE is present, no dev files or sourcemaps.

**Acceptance Scenarios**:

1. **Given** the built graph, **When** each package is packed, **Then** all four produce a tarball and none is skipped as private.
2. **Given** `@spec-kitty/elements`' tarball, **When** its `exports` entries are resolved against the extracted contents, **Then** every declared entry point exists — including `./elements.js`, the classic-script build.
3. **Given** any tarball, **When** its file list is audited, **Then** it contains no sourcemap, no test file, and no dotfile outside those explicitly allowed.

---

### User Story 3 — the no-build consumer loads it from disk (Priority: P2)

Someone with no bundler, no npm install and no network opens an HTML file that uses a `<script>` tag
and gets working components.

**Why this priority**: it is ADR-10 §2's second distribution entry and #82's entire premise. It is P2
only because it depends on Story 2 having produced the artifact.

**Independent Test**: serve nothing. Open a `file://` page in a browser with network blocked, and
assert the components upgraded and are styled.

**Acceptance Scenarios**:

1. **Given** a `file://` page referencing the locally built IIFE and `tokens.css`, **When** it loads with all network blocked, **Then** the custom elements upgrade and render styled.
2. **Given** that page, **When** network requests are recorded, **Then** the count is zero — no font CDN, no registry, nothing.
3. **Given** the same bundle served over HTTP with a Subresource Integrity hash, **When** the hash is the recorded one, **Then** the browser executes it; when it is altered, the browser refuses it.

---

### User Story 4 — the operator can run the release from the runbook (Priority: P2)

The operator creates the npm org, adds the token, and follows a written sequence to a published
release, without reconstructing intent from workflow YAML.

**Why this priority**: it is the handoff this mission exists to produce. P2 because it documents
work the other stories must first make true.

**Independent Test**: a reader who has not seen this mission can carry out the sequence, and every
command in it either runs or is explicitly marked as the operator's to run.

**Acceptance Scenarios**:

1. **Given** the runbook, **When** the post-merge sequence is followed, **Then** it states in order: land the train on `main`, tag, workflow publishes — with the tag as the trigger, not the merge.
2. **Given** the runbook, **When** a reader looks for what a dry run proves, **Then** it states the limit explicitly: packing, not publishing.
3. **Given** the runbook, **When** a consumer looks for the version policy, **Then** it states that two majors on one page is a hard runtime failure, because `customElements.define` is global and throws on a duplicate tag.

### Edge Cases

- The publishable set becomes empty, or a filter matches nothing — the gate must fail, not report success over zero packages.
- A package is added to `packages/` and to neither list. The gate must derive the set rather than compare two hand-written lists, or it cannot see the omission.
- `npm pack` succeeds while an `exports` target does not exist in the tarball — packing does not resolve entry points.
- A dry run is read as proof of publishability. It short-circuits before provenance, auth and registry acceptance; the runbook must say so.
- The mono `@import` is "fixed" by moving it up, silently introducing a network dependency and breaking SC-006.
- `logo.png` is removed as dead weight, breaking FR-105's brand-asset deliverable.

## Requirements

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Publishable packages are publishable | As a consumer, I want `@spec-kitty/elements` and `@spec-kitty/react` installable from npm so that the epic's output is usable. | High | Open |
| FR-002 | One derived package set | As a maintainer, I want `release.yml`'s build, publish and audit steps driven by one derived list so that a package cannot be in one and not another. | High | Open |
| FR-003 | PR-time release gate | As a maintainer, I want the release path exercised on every PR so that packaging defects are found before a tag. | High | Open |
| FR-004 | Tarball contents asserted | As a maintainer, I want each tarball's contents checked against its declared `exports` and `files` so that a package cannot ship missing its entry points. | High | Open |
| FR-005 | Integrity hash recorded | As a CDN consumer, I want a published SRI hash for the classic-script bundle so that I can pin what I execute. | Medium | Open |
| FR-006 | Release runbook | As the operator, I want the post-merge sequence written down so that releasing does not require reading workflow YAML. | Medium | Open |
| FR-007 | Single-version policy stated | As a consumer, I want the one-major-per-page constraint documented so that I do not discover it as a runtime throw. | Medium | Open |
| FR-008 | CHANGELOG | As a consumer, I want a changelog for 1.0.0 so that I can see what the first release contains. | Medium | Open |
| FR-009 | Mono font resolved without a network call | As a consumer, I want `--sk-font-mono` to resolve without a third-party request so that the no-network guarantee holds and the token means what it says. | Medium | Open |
| FR-010 | styles subpath exports complete | As a consumer, I want every component's CSS reachable by subpath so that the export map is not a partial list. | Low | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Gate refuses an empty set | The release gate fails when its derived package set is empty, and a test proves that by supplying one. | Reliability | High | Open |
| NFR-002 | No network at runtime | A `file://` load of the classic-script bundle plus `tokens.css` issues **zero** network requests, asserted by request interception rather than by inspection. | Security | High | Open |
| NFR-003 | Supply-chain controls preserved | ADR-5's release controls — `npm audit` gate, `--provenance`, CycloneDX SBOM, contents audit — apply to every package in the derived set, not a subset. | Security | High | Open |
| NFR-004 | Install size is stated | Each package's packed and unpacked size is recorded from a real `npm pack`, and the record is regenerated rather than transcribed. | Performance | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No npm write access | This mission performs no publish and requires no registry credentials. Dry runs and local packs only. | Technical | High | Open |
| C-002 | No tag, no train landing | Tagging and landing `train/elements-first` on `main` are the operator's acts and are out of scope. | Business | High | Open |
| C-003 | Version stays 1.0.0 | Nothing was ever installed, so there is no compatibility window and no deprecation cycle. | Business | Medium | Open |
| C-004 | Brand assets are a deliverable | FR-105 records `logo.png`, `logo.webp` and `favicon.png` as intended package contents; any size reduction must preserve that or raise it as a fork. | Business | Medium | Open |

### Key Entities

- **Derived package set**: the publishable packages, computed from `packages/*/package.json` rather than hand-listed. The single input to build, publish, audit and gate.
- **Tarball manifest**: per package, the assertions its `npm pack` output must satisfy — entry points resolve, required files present, forbidden patterns absent.
- **Release runbook**: the operator-facing sequence from merged train to published release, including what each step proves and what it does not.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `npm pack` produces a tarball for all four packages, and **none** is skipped as private. Asserted on the tarball, never on an exit code.
- **SC-002**: Every path in every package's `exports` map resolves to a file that exists inside that package's own tarball.
- **SC-003**: The release gate derives its package set and **fails on an empty set**, proven by a test that supplies one.
- **SC-004**: `release.yml`'s build, publish and audit steps consume one derived list; a test detects a package present in one and absent from another.
- **SC-005**: The release gate runs on pull requests, and reverting any one packaging fact reds it.
- **SC-006**: A `file://` page using the built classic-script bundle and `tokens.css` renders upgraded, styled components with **zero** intercepted network requests.
- **SC-007**: The SRI hash for the classic-script bundle is generated from the built artifact, recorded, and re-derived by a check rather than transcribed.
- **SC-008**: `--sk-font-mono` resolves to its intended family with no network request, or the token's declared family matches what actually loads.
- **SC-009**: The runbook states the trigger is the tag and not the merge, and states that a dry run proves packing and not publishing.
- **SC-010**: No tarball contains a sourcemap, a test file, or a dev-only dotfile.
