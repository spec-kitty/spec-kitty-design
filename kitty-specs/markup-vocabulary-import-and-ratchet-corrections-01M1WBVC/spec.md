# Mission Specification: A markup module imports the one vocabulary, and two records stop disagreeing

**Mission Branch**: `mission/markup-vocabulary-import-and-ratchet-corrections`
**Created**: 2026-09-06
**Status**: Draft
**Input**: Close three operator-approved follow-up issues in `spec-kitty/spec-kitty-design`: #216, #219, #220.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A markup module consumes the one authored vocabulary (Priority: P1)

`scripts/build-element-markup.mjs` evaluates every `packages/elements/src/*/sk-*.markup.ts` from a
`data:` URL. A `data:` URL has no hierarchical base, so a relative import there dies, and the
generator says so in a named error: *"a `*.markup.ts` is evaluated from a data: URL and therefore
has NO module base — it must be a leaf module with no relative imports."*

The consequence, recorded in #216, is that a markup module cannot consume a value another module
owns — including a shared **vocabulary**. #146 landed one tone vocabulary (`STATUS_TONES`, six
tones, in presentation order). #177 needed the same six for `sk-card`'s status axis, could not
import them, and restated them as `CARD_STATUSES` in `sk-card.markup.ts`, pinned by an
order-sensitive equality assertion in `fixtures/elements-behaviour/src/sk-card.test.ts`.

That assertion works and does not generalise: the next component to consume the vocabulary must
remember to write its own copy, and nothing detects that it did not.

The operator ruled on 2026-09-06: **fix the generator** — evaluate markup modules from a real
module URL so relative imports resolve — and then **convert the consumers**, which is the proof
the fix works.

**Why this priority**: this generator produces committed artifacts for every element in the
repository. Everything else in this mission is a record correction; this is a contract change.

**Independent Test**: `sk-card.markup.ts` imports `STATUS_TONES` and derives `CARD_STATUSES` from
it; `node scripts/build-element-markup.mjs` regenerates every component's `.html` and `index.ts`
with no byte changed; `--check` exits 0; and the parity test is gone because there is no longer a
second authored list for it to guard.

**Acceptance Scenarios**:

1. **Given** a `*.markup.ts` with a relative import of a leaf module, **When** the generator runs,
   **Then** it resolves the import and emits the same artifacts it would have emitted from an
   inlined copy.
2. **Given** the converted `sk-card.markup.ts`, **When** the generator regenerates all components
   cache-free, **Then** `git diff --stat` over `packages/styles/src/**` is empty.
3. **Given** the regenerated tree, **When** `build-element-markup.mjs --check` runs, **Then** it
   exits 0 and names the component count.
4. **Given** a `*.markup.ts` whose relative import cannot be resolved, **When** the generator runs,
   **Then** it exits non-zero with a message naming the file and the unresolved specifier — the
   failure stays named, it does not become a raw stack.
5. **Given** a tone added to, removed from, or reordered in `STATUS_TONES`, **When** the card's
   static forms are regenerated, **Then** the card's status forms follow automatically and no
   assertion has to be maintained to notice.
6. **Given** `sk-notice`, **When** its tone handling is inspected, **Then** it is confirmed to
   already consume `STATUS_TONES` by import (it authors no `*.markup.ts`), or converted if it does
   not.

---

### User Story 2 - A story cited as acceptance evidence cannot be retired silently (Priority: P2)

`expected-stories.json` is the shrink-only story ratchet: every id listed must exist in the built
Storybook index, so removing a listed story fails `run-axe-storybook.js` by name. Its measured id
prefixes are exactly `elements` and `primitives`.

#177's own implementation evidence names the greyscale stories as its proof that a status tone is
never the sole carrier of meaning. The element-layer one (`elements-skcard--greyscale`) is
ratcheted. The static-path one (`components-card--statuses-greyscale`) is not — and the static path
is the no-JavaScript consumer ADR-10 §3 exists to serve, so it is the half where a reader has no
element to fall back on.

The file's own `$comment` records the original scope decision — "scoped to the ELEMENTS, not the
whole catalogue" because the `packages/styles` story files predate the ratchet and "#77-#79 migrate
them and can opt each in as it lands". Those migrations have landed, so the recorded reason for the
exclusion no longer holds as written.

**Why this priority**: it is a one-line ratchet entry that closes a named hole in already-shipped
acceptance evidence.

**Independent Test**: `components-card--statuses-greyscale` is present in the built Storybook
index and listed in `expected-stories.json`; `total` equals the flattened list length; deleting the
story from `sk-card-html.stories.ts` fails the gate by name.

**Acceptance Scenarios**:

1. **Given** the built Storybook index, **When** the declared set is checked against it, **Then**
   every declared id including `components-card--statuses-greyscale` is present.
2. **Given** `expected-stories.json`, **When** `total` is compared with the flattened `byElement`
   lists, **Then** they agree.
3. **Given** the `$comment`, **When** a reader asks what the ratchet's scope now is, **Then** the
   file says so in its own words, and states the principle: a story cited as acceptance evidence is
   ratcheted in the same commit that cites it.

---

### User Story 3 - The catalogue and the contributing guide describe the same categories (Priority: P3)

`scripts/generate-token-catalogue.js` bins tokens by **prefix**, so #177's semantic pair is split:
`--sk-status-*` under `status`, `--sk-on-status-*` under `on`, alongside `--sk-on-tint-*`.
`docs/contributing/adding-a-token.md:23` — added by the same PR — presents the two as **one**
category.

Both are defensible alone; together they are inconsistent, and the catalogue is a published
artifact consumed by stylelint and by the docs site, so the split is what a consumer sees. This is
not new with `--sk-status-*`: the `on` category has always been the union of every `--sk-on-*`
token, so `--sk-on-tint-*` already sits away from `--sk-surface-tint-*`.

**Why this priority**: a doc correction against a published artifact, with no consumer impact.

**Independent Test**: every prefix row in the contributing guide's category table names a category
that `packages/tokens/dist/token-catalogue.json` actually contains, with a token that is actually
binned there.

**Acceptance Scenarios**:

1. **Given** the guide's category table, **When** each row's prefix is looked up in the generated
   catalogue, **Then** the category the row implies is the category the catalogue uses.
2. **Given** a reader who adds a paired surface/foreground token, **When** they read the guide,
   **Then** they are told the pair spans two categories and why, rather than being surprised by the
   artifact.

---

### Edge Cases

- **A markup module that imports a module which cannot be evaluated outside a browser.** The
  element files import `lit` and register custom elements at module scope; importing one from the
  generator would crash. The vocabulary a markup module may import must therefore be a leaf with no
  imports of its own, and the generator's error must say that when resolution or evaluation fails.
- **Repo import convention.** Every relative import in this repository carries a `.js` extension
  over a `.ts` source (NodeNext style). A generator that evaluates the authored `.ts` must resolve
  that convention or the first import fails on a file that type-checks perfectly.
- **A vocabulary module that is not frozen.** The generator evaluates authored source; a mutable
  exported array would let one markup module's evaluation change another's. `STATUS_TONES` is
  already `Object.freeze`d and must stay so.
- **The ratchet must not be widened by accident.** Opting the whole `packages/styles` catalogue in
  is a larger scope decision #219 raises as an open question; this mission opts in only ids a
  mission has explicitly named as acceptance evidence.
- **Generated artifacts must be regenerated cache-free.** `nx` caching can serve a stale
  `analyze`/`build`, which would make a `--check` compare an artifact against itself.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Markup modules are evaluated from a real module URL | As a maintainer, I want `build-element-markup.mjs` to evaluate each `*.markup.ts` from its own file URL rather than a `data:` URL, so that a relative import has a module base to resolve against (#216). | High | Open |
| FR-002 | The repo's `.js`-over-`.ts` import convention resolves | As a maintainer, I want the generator to resolve a relative `./x.js` specifier to the authored `./x.ts` when that is what exists on disk, so that a markup module's imports are written the way every other file in the repo writes them. | High | Open |
| FR-003 | Import failures stay named | As a maintainer, I want an unresolvable or unevaluable import to exit non-zero with a message naming the markup file, the specifier and the leaf-module requirement, so that the class of named failure the generator already guarantees is preserved rather than replaced by a raw stack. | High | Open |
| FR-004 | The tone vocabulary is importable without the element | As a maintainer, I want `STATUS_TONES` to live in a leaf module with no imports, re-exported unchanged from `sk-status-indicator.ts` and from the package barrel, so that a generator-evaluated module can consume it without pulling in `lit` or a custom-element registration. | High | Open |
| FR-005 | `sk-card` derives its status map from the vocabulary | As a maintainer, I want `CARD_STATUSES` derived from `STATUS_TONES` rather than restated, so that the six tones are authored exactly once (#216). | High | Open |
| FR-006 | The parity test goes because it has nothing to guard | As a maintainer, I want the order-sensitive `CARD_STATUSES` ↔ `STATUS_TONES` equality test removed once the map is a derivation, so that the repo does not carry an assertion that can no longer fail for the reason it was written. | High | Open |
| FR-007 | `sk-notice` is verified rather than assumed | As a reviewer, I want `sk-notice`'s tone handling checked against the same standard and reported, so that "it was already clean" is a measurement and not an assumption (#216, #178). | Medium | Open |
| FR-008 | Generated markup is unchanged | As a consumer, I want every generated `.html` and `index.ts` to be byte-identical after the conversion, so that a contract change to a generator every element depends on is proved to be behaviour-preserving. | High | Open |
| FR-009 | The cited static story is ratcheted | As a reviewer, I want `components-card--statuses-greyscale` listed in `expected-stories.json` with `total` reconciled, so that the static half of #177's stated acceptance evidence cannot be retired silently (#219). | Medium | Open |
| FR-010 | The ratchet records its own scope | As a reader, I want the `$comment` to say what the ratchet's scope now is and to state the principle that a story cited as acceptance evidence is ratcheted in the same commit that cites it, so that the next mission does not have to re-derive the rule (#219). | Medium | Open |
| FR-011 | The contributing guide matches the catalogue | As a consumer, I want `docs/contributing/adding-a-token.md`'s category table to describe the binning `generate-token-catalogue.js` actually performs, and to explain that a semantic pair spans two categories, so that the doc and the published artifact agree (#220). | Low | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | The generator change is proved end-to-end | All markup artifacts are regenerated cache-free and shown byte-identical, `--check` exits 0, and the generator is shown to still fail closed on an unresolvable import. | Verification | High | Open |
| NFR-002 | The vue.d.ts half is confirmed, not forced | Whether `build-vue-types.mjs` still requires the element's `declare` line to spell the union inline is measured and recorded; the second constraint in #216 is not addressed speculatively. | Verification | High | Open |
| NFR-003 | The published token catalogue is unchanged | `packages/tokens/dist/token-catalogue.json` is byte-identical; #220 is resolved in the doc, not in the artifact's shape. | Compatibility | High | Open |
| NFR-004 | The ratchet is not widened beyond cited evidence | Only story ids a mission has explicitly named as acceptance evidence are opted in; the wholesale-styles question is left to the operator. | Process | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No architecture records touched | The mission's diff contains no change under `docs/architecture/**`; a concurrent mission owns that surface. | Process | High | Open |
| C-002 | Suite budget untouched | The suite-time ceiling stays at 881.9s; #225 carries the operator's ruling that funds the filtered-suite redesign instead. | Process | High | Open |
| C-003 | No new runtime dependency | The generator fix uses the Node and esbuild versions already pinned in the repo; no loader package is added. | Technical | High | Open |
| C-004 | Generated surfaces stay generated | `packages/styles/src/*/sk-*.html`, `packages/styles/src/*/index.ts`, `packages/react/src/**` and `vue.d.ts` are regenerated, never hand-edited. | Technical | High | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `sk-card.markup.ts` contains no literal tone list; `CARD_STATUSES` is derived from an imported `STATUS_TONES`.
- **SC-002**: `node scripts/build-element-markup.mjs` regenerated cache-free leaves `git status --short packages/styles` empty, and `--check` exits 0 naming every component.
- **SC-003**: A markup module with an unresolvable relative import exits the generator non-zero with a message naming the file and the specifier (demonstrated red-first on a scratch module, which is then removed).
- **SC-004**: `fixtures/elements-behaviour/src/sk-card.test.ts` contains no `CARD_STATUSES` ↔ `STATUS_TONES` equality assertion, and the fixture's remaining status coverage still derives its loops from `CARD_STATUSES`.
- **SC-005**: `npm test` is green, and the type tests, manifest, React wrappers and Vue types regenerate with no drift.
- **SC-006**: `expected-stories.json` lists `components-card--statuses-greyscale`, `total` equals the flattened list length, and the built Storybook index contains the id.
- **SC-007**: Every prefix row in `docs/contributing/adding-a-token.md`'s category table names the category the generated catalogue actually assigns that prefix to.
- **SC-008**: `packages/tokens/dist/token-catalogue.json` is unchanged by this mission.
