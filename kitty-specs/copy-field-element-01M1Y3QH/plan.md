# Implementation Plan: `sk-copy-field`

- **Branch:** `mission/copy-field-element`
- **Date:** 2026-09-07
- **Spec:** [`spec.md`](./spec.md)
- **Research:** [`research.md`](./research.md)
- **Data model:** [`data-model.md`](./data-model.md)

## Summary

Add one Lit custom element whose reactive `value` is both the rendered code and exact Clipboard API
argument. One native button uses the existing `sk-button` generated sheet/class vocabulary. A
secure-context clipboard write yields success only on fulfillment; every unavailable/rejected path
falls back to focusing and selecting the visible `<code>`, with a distinct honest failure result
if selection is impossible. One stable per-instance polite live region reports the result, and one
typed privacy-safe event exposes only the literal outcome union.

The component, authored CSS, stories, behavior/browser tests, registration, package wiring, and
generated integrations are one indivisible public API addition. They ship as WP01 and one PR. A
split would leave either behavior without distribution or integration surfaces without an element,
while all files change for the same contract and can be reviewed as one coherent diff.

## Planning Questions Resolved

| Question | Resolution | Authority |
|---|---|---|
| What is copied? | The exact current `value` string snapshot, without normalization; Lit interpolates the same property into visible `<code>`. | FR-001, FR-004; issue #257 |
| Is whitespace-only empty? | No. Only `value.length === 0` is empty; whitespace is visible/copyable source data. | FR-001, FR-008; exact-string contract |
| Which control owns semantics? | One shadow-root native `button`, styled with the existing exported button sheet and `buttonClasses('secondary', 'sm')`; no nested `sk-button` and no host tab stop. | FR-002; #79, #153, #154 |
| When is success truthful? | Only after a secure-context callable `navigator.clipboard.writeText(snapshot)` fulfills. | FR-004, FR-005 |
| What is fallback? | Focus the visible `<code tabindex="-1">`, select all its contents through `Range`/`Selection`, verify focus and selection, then report `manual`; otherwise report `failed`. No `execCommand`. | FR-006, FR-007, FR-015 |
| How is async staleness prevented? | A custom reactive `value` accessor increments a private revision synchronously on every actual change (including batched A→B→A) and clears feedback. An in-flight attempt still emits exactly one terminal event but cannot repopulate status for another revision. Same-revision overlaps use completion-order status semantics. | FR-009, FR-012 |
| How are messages surfaced? | `successMessage`, `manualMessage`, and `failureMessage` are reflected to kebab-case attributes with documented generic defaults; blank/whitespace-only values fail open to those defaults. The label defaults generically and blank text warns once per invalid transition before using that default. | FR-003, FR-011 |
| Does the event contain text? | Never. Freeze a fresh readonly detail object containing only `outcome`; dispatch a bubbling, composed, non-cancelable `CustomEvent`. | FR-012, FR-013 |
| Is static markup published? | No. An inert copy button is dishonest under ADR-10; only the JavaScript element ships. | FR-022; ADR-10 |
| Are new tokens needed? | No planned token addition. Existing input/card/button/focus/feedback tokens are sufficient; implementation must stop and document evidence before adding any token. | NFR-006; issue #257 |
| Is #213 a dependency? | No. Its prose primitive excludes copy buttons. This field remains a small actionable value surface, not prose. | C-003/C-004; #213 |
| Is any architecture decision open? | No. Browser selection differences are verification/calibration work inside this design, not an API fork. | Research risks |

## Technical Context

- **Language/runtime:** TypeScript + Lit 3, authored CSS, Storybook Web Components; repository Node
  runtime/package manager as locked by the checkout
- **Primary dependencies:** `lit`, the repository `define()` helper, generated constructable CSS
  sheets, existing button style/class helper, Storybook, Vitest browser mode, Playwright, axe-core,
  Nx
- **Storage:** None
- **Target platform:** The repository-supported Chromium and Firefox browser projects; default
  dark, `.sk-light`/`LightMode`, forced colors, reduced motion, narrow and real-browser-zoomed
  layouts
- **Performance:** One write and at most one selection attempt per activation; no timers, retries,
  queues, observers, or background work
- **Scale/scope:** One custom element, five string inputs, one event, four parts, no slots or public
  methods, one coherent work package
- **Security/privacy:** Copy only a consumer-supplied visible non-sensitive value; never execute,
  persist, validate, mask, infer, log, analyze, or bubble the value

## Charter Check

The pre-design and post-design charter checks pass without exception.

| Gate | Planned proof |
|---|---|
| Native, accessible semantics | One real button; code remains browse-readable; one stable polite atomic status; host and fallback target are not sequential tab stops. |
| Truthful state | Clipboard success requires fulfillment; deterministic `manual`/`failed` fallback; empty guard; value-change reset; no timer or retry. |
| Framework-neutral source | Lit element is canonical; React/Vue surfaces are generated and type-tested. |
| Token-first styling | Authored CSS uses existing `--sk-*` tokens, adopts the existing button sheet, adds no component palette, and passes source/hygiene checks. |
| Complete supported modes | Browser/Storybook coverage for dark, `LightMode`, forced colors, reduced motion, focus, empty, manual/failure, 390px and zoom. |
| Generated integrity | Generators precede checks; manifest, wrappers, Vue, CSS module, story indexes, ratchets, and size output are committed from source. |
| Test-first behavior | Focused tests are authored before production behavior and each applicable ADR-11/mutation arm is demonstrated to fail under its configured mutation before passing. |
| Review/delivery | Tier-B report-only squad post-tasks; independent Codex implement/review loop; exact-head pre-merge Codex squad; one PR with `Refs #257`, left unmerged. |

Form association and slots are explicitly not applicable: this is not a form-associated editable
control and accepts no consumer content. Cancelation is also not applicable because the required
event is non-cancelable and owns no preventable default action.

## Architecture and Data Flow

```text
consumer
├── assigns value, label, and optional result messages
├── listens for sk-copy-field-result (outcome only)
└── never delegates execution/application state to the field

sk-copy-field
├── one reactive value
│   ├── Lit text interpolation -> code[part=value][tabindex=-1]
│   └── activation snapshot -> Clipboard.writeText(snapshot)
├── one native button[part=copy-control]
│   └── existing button sheet/classes -> presentation and focus vocabulary
├── private attempt flow
│   ├── exact empty -> no operation/event
│   ├── secure callable clipboard fulfills -> copied
│   └── unavailable/throws/rejects
│       ├── focus + verified full visible selection -> manual
│       └── selection/focus failure -> failed
├── synchronous value revision
│   └── every actual change (including batched A→B→A) clears status and prevents stale async status
│       reappearance
├── stable status[part=status][role=status][aria-live=polite][aria-atomic=true]
└── CustomEvent -> Object.freeze({ outcome }), once per completed attempt
```

### Attempt invariants

1. Snapshot `value` and the private value revision at native-button activation.
2. Return before any side effect if the exact snapshot is empty.
3. Test `globalThis.isSecureContext`, `navigator.clipboard`, and callable `writeText` without
   invoking getters repeatedly; contain synchronous and asynchronous errors.
4. Treat only fulfilled `writeText` as `copied`; make no legacy `execCommand` attempt.
5. On any negative clipboard branch, focus and select the rendered node whose text is derived from
   the same value. Verify the field still represents the same snapshot/revision before selection.
6. Complete with one outcome and one event. Update the stable status only if the revision/current
   value still match; this prevents a late promise from relabeling a newer value.
7. Keep focus on the native button after success; manual focus is intentional and lands only on the
   programmatically focusable visible value.

Repeated activations are independent attempts and each produces one result. The implementation does
not serialize, debounce, retry, or invent a busy state. For attempts on the same revision, each
completion applies its truthful result and the last completion owns status/focus; an older
completion cannot overwrite status for a changed revision.

## Public API Design

| Surface | Shape |
|---|---|
| Tag | `sk-copy-field` |
| Class | `SkCopyField` |
| `value` | `string`, attribute `value`, default `''` |
| `label` | `string`, attribute `label`, generic documented default/fail-open name |
| `successMessage` | `string`, attribute `success-message`, default `Value copied.` |
| `manualMessage` | `string`, attribute `manual-message`, default `Value selected. Use your system copy shortcut to copy it.` |
| `failureMessage` | `string`, attribute `failure-message`, default `Unable to copy or select the value.` |
| Event | `sk-copy-field-result`, detail `Readonly<{ outcome: 'copied' \| 'manual' \| 'failed' }>`, bubbles/composed, not cancelable |
| Parts | `field`, `value`, `copy-control`, `status` |
| Slots/methods | None |

The label generic default is `Copy value`. A blank string uses the same value and emits the
repository-standard development warning pattern. Blank/whitespace-only result-message overrides
resolve to their respective defaults. All public declarations receive manifest-readable JSDoc.
`HTMLElementTagNameMap` and `GlobalEventHandlersEventMap` extensions follow current element
precedent. Generated React typing must retain the literal detail union; generated Vue declarations
must retain the tag and input properties (the current Vue generator does not expose custom-event
listener types).

## Layout and Styling

The shadow field is a bordered grid/flex surface using current surface, border, foreground, muted,
spacing, radius, typography, status-tone, and focus tokens. The value cell gets `min-inline-size: 0`,
`white-space: pre-wrap`, and `overflow-wrap: anywhere`; the action neither clips nor forces page
overflow. The field may stack its action at sufficiently constrained available width only through a
container-safe layout, never a page breakpoint that contradicts zoom behavior.

`:host { display: block }` is explicit. The status remains in layout/read order and communicates
state through text, not colour alone. The adopted button sheet currently includes an unguarded
transition, so the copy-field sheet locally neutralizes it with `transition: none` for this
component's native button. The shared button contract is not edited. Forced-colors rules use system
colors/semantic borders only where current repository precedent requires them and never hide focus.

## Project Structure and Artifact Ownership

All paths are repository-relative; exact generator-managed filenames follow live scripts.

```text
AUTHORED element and stories
packages/elements/src/copy-field/
├── sk-copy-field.ts
└── sk-copy-field.stories.ts

AUTHORED stylesheet
packages/styles/src/copy-field/sk-copy-field.css

GENERATED element stylesheet module
packages/elements/src/copy-field/
├── sk-copy-field.css.js
└── sk-copy-field.css.d.ts

AUTHORED element/package wiring
packages/elements/src/index.ts
packages/elements/src/elements.ts
packages/elements/package.json
packages/styles/package.json

AUTHORED focused contract tests
fixtures/elements-behaviour/src/sk-copy-field.test.ts
fixtures/react-consumer/src/sk-copy-field.test.tsx
apps/storybook/src/tests/sk-copy-field.spec.ts
apps/storybook/src/tests/sk-copy-field-forced-colors.spec.ts
apps/storybook/src/tests/visual.spec.ts

AUTHORED conformance/ratchet inputs
behaviours.json
mutations.json
mutations.selftest.json
expected-parts.json
expected-docs.json
expected-stories.json

GENERATED distribution and reports
packages/elements/custom-elements.json
packages/react/src/SkCopyField.js
packages/react/src/SkCopyField.d.ts
packages/react/src/index.js
packages/react/src/index.d.ts
packages/react/.wrapper-floor
packages/elements/vue.d.ts
packages/elements/SIZES.md
```

Generator discovery determines whether additional sorted indexes or export maps change. There is
deliberately no `sk-copy-field.markup.ts`, styles HTML fixture, or static markup export.

## Story and Fixture Design

The Storybook module exposes separately addressable states for `Default`, `Hover`, `Focused`,
`Active`, `DisabledEmpty`, `LongWrappingCommand`, `QuotesAndUnicode`, `CopiedSuccess`,
`ManualFallback`, `Failure`, `RepeatedAndMultiple`, `Narrow`, `ForcedColors`, `DefaultDark`, and
`LightMode`. Interactive state stories install scoped, deterministic clipboard/test seams before
activation and restore them; none reads or modifies the developer clipboard. The story docs name
every exact `--sk-*` token dependency used by the authored sheet and explain inputs, event, parts,
exactness, fallback, and the JavaScript-only boundary. The canvas documents that
copied/manual/failure examples are controlled evidence, not persisted initial outcomes in the
public API.

Focused browser tests drive the public control and assert DOM/accessibility/geometry outcomes in
Chromium and Firefox. Visual baselines cover dark/light, long/narrow, focus, empty, manual, failure,
and forced colors. Local image review compares the immediate bordered-value/Copy hierarchy and D2's
narrow wrapping against approved Dossier artifacts; CI snapshots remain canonical.

## Behavior and Mutation Mapping

The implementation claims only applicable ADR-11 behavior IDs in `behaviours.json` and binds every
claim to an independently meaningful mutation arm in `mutations.json`:

- event once/flags/detail and privacy boundary;
- all reactive properties assigned before upgrade;
- native focus/keyboard path and empty disabled state;
- every public part present and targetable;
- generated constructable-sheet adoption by named identity with no injected `<style>`;
- duplicate registration safety;
- the documented `20rem` available-inline-size threshold, including container-safe one-column
  reflow and end alignment, under SC-017.

Ordinary focused tests cover stable-node re-announcement, clipboard capability/rejection arms,
selection verification, value-revision reset, message overrides, and multiple instances. The
SC-017 ordinary assertion reads the generated container rule and applies it to a constrained host;
Chromium/Firefox browser coverage proves a roughly 115px host reflows inside a wide page without
component or page overflow. Mutation self-tests prove each configured source transform is effective
and the intended behavior test goes red; no unrelated ID is minted or mislabeled.

## Verification Strategy

Run focused tests red before implementation, then green. The exact runtime-lane SHA submitted for
WP review must regenerate from authored source before executing checks and complete:

1. Focused authored tests and configured mutation/selftest arms for `sk-copy-field`.
2. Chromium and Firefox behavior tests for exact success, absent/insecure/rejected/thrown clipboard,
   manual selection, unrecoverable failure, Enter/Space, focus, multiple instances, and async reset.
3. Storybook rendering plus axe/accessibility-tree checks in every required state.
4. Dark and `LightMode`, 390px, actual 200%/400% zoom, forced-colors, reduced-motion, long wrapping,
   selection, and page-overflow geometry checks in Chromium and Firefox. Browser zoom follows the
   issue-#211 precedent: a fixed physical window, browser UI reset then zoom to the named level,
   recorded CSS viewport/device-pixel-ratio/scroll/client measurements, and no CSS zoom, viewport
   resize, CDP emulation, or pinch/page-scale substitute.
5. Repository generators in dependency order:
   `build-elements-css`, `build-element-markup`, element analysis, React wrappers, Vue types,
   size measurement, and any current index/ratchet generators.
6. Every corresponding `--check`/selftest: manifest content/freshness, no CSS source, element
   entries, adopted CSS boundaries, CSS hygiene, expected parts/docs/stories, theme wrapper,
   wrapper/manifest selftests, typecheck-all, quality gates, lint, build, and repository tests.
7. Storybook production build and axe runner; CI-authoritative visual baseline job/checks where
   locally unavailable are reported exactly rather than inferred.
8. `git diff --check`, clean generated diff, read-only planning-base ancestry proof, and exact-lane-
   SHA independent Codex runtime-review evidence.

The exact repository command list is fixed in WP01 and the acceptance evidence records every result
against the SHA on which it completed.

## Risks and Mitigations

| Risk | Mitigation / stop condition |
|---|---|
| Firefox differs in shadow-root selection | Exercise real Firefox; implement standards-based Range/Selection verification. If full visible selection cannot be made reliably without hidden duplicate text, stop rather than publish false manual success. |
| Browser clipboard globals resist stubbing | Use the repository browser fixture/context seam and explicit secure-context injection; never touch the machine clipboard. Record a runner limitation if it cannot represent a branch. |
| A late clipboard promise restores stale feedback | Snapshot value/revision and gate status mutation; dedicated deferred-promise test changes value before settlement. |
| Batched A→B→A misses reactive invalidation | Advance revision synchronously in the custom `value` accessor and prove it with a deferred-promise test before the render cycle settles. |
| Reusing the button sheet creates conflicting local rules | Adopt the shared sheet first, keep local selectors limited to geometry/state context, and run button CSS boundary/hygiene plus forced-colors/reduced-motion checks. |
| Generated artifacts overlap Wave-A siblings | After WP approval, the mission orchestrator fetches/rebases the mission branch on latest train, regenerates every derived output from source, reruns exact-SHA gates, and resolves conflicts from authored source rather than choosing conflict sides. The runtime lane is never rebased. |
| Local visual baselines differ from CI environment | Use local screenshots for Dossier review, preserve repository canonical baselines, and require CI result or report exact unavailability. |
| Scope drifts into command/domain behavior | Diff audit rejects routing, execution, validation, telemetry, timing, toast, secret, and Repository Dossier component additions. |

## Work-Package Topology

### WP01 — Publish the exact-value copy field contract

One atomic implementation boundary includes tests, element, CSS, story evidence, conformance
registries, exports, generators, and consumer types. It depends only on already-closed #79/#153 and
#178 contracts. #154 is an observed non-blocking defect whose double-tab-stop class is explicitly
avoided; #213 is not a dependency. WP01 is complete when its own acceptance criteria and gates pass
on the exact runtime-lane SHA and an independent runtime reviewer approves it. Post-WP mission
integration, train rebase, accept, PR creation, and pre-merge review remain orchestrator gates. The
PR targets `train/elements-first`, says `Refs #257`, and remains unmerged.

## Acceptance Handoff

The programme orchestrator receives: mission slug/status, single-WP topology, PR URL, branch/head
SHA, base SHA, independent review cycles/findings/fixes, Spec Kitty accept output, full command
matrix, CI state, issue comment URL, and any exact blocker. The mission does not merge or close the
issue.
