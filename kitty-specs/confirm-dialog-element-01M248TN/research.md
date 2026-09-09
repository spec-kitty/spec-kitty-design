# Phase 0 Research: sk-confirm-dialog

All repo-file evidence below is verified at `train/elements-first@2b59c8c`, the commit this
mission's checkout is branched from (confirmed via `git merge-base mission/confirm-dialog-element
train/elements-first` = `2b59c8ccd727ac13475d34eed9a1f6adfaf1a6a1`). The Family 4 design-provenance
pin `ce5823c` cited by issue #308 predates this and is provenance only, not a code reference.

## Decision: single reporting mechanism — native `close` + `returnValue`

- **Decision**: `sk-confirm-dialog` reports its outcome exclusively through the native `<dialog>`
  `close` event, read via `HTMLDialogElement.returnValue` (`'confirm' | 'cancel'`). No parallel
  custom event is added.
- **Rationale**: Every dismissal path the element must support (confirm click, cancel click,
  Escape, backdrop dismissal, programmatic `close()`) already terminates in the platform calling
  or being told to call `HTMLDialogElement.close(returnValue)`. The `close` event is therefore the
  one point every path funnels through, at zero additional public-surface cost (no new
  `@fires` JSDoc, no new event-detail type, no new `expected-docs.json`/`expected-parts.json`
  rows beyond what the dialog needs anyway). A custom event would either duplicate this
  information or become the "half-supported second mechanism" issue #308 explicitly forbids.
- **Alternatives considered**:
  - *A named custom event only* (e.g., `sk-confirm-dialog-result` with `detail: { outcome }`),
    dialog closed as an implementation detail. Rejected: adds an event contract (ADR-11 SC-006/007/008
    apply to it either way, so no test is saved) purely to avoid reading `returnValue`, which is a
    one-line, well-understood platform idiom. Precedent `sk-copy-field` (#257) does mint a custom
    event (`sk-copy-field-result`) but for a very different reason — there is no native "did the
    clipboard write succeed" event to observe. `sk-confirm-dialog` has exactly such a native
    signal already (`close`), so the precedent argues for using it, not against it.
  - *Both, "for convenience"*: explicitly the shape issue #308 forbids ("chosen and documented
    explicitly rather than both being half-supported").
- **Evidence for "the platform funnels every path through `close`"**: MDN `HTMLDialogElement`:
  Escape triggers a cancelable `cancel` event followed unconditionally by `close`; calling
  `.close(returnValue)` programmatically fires `close` directly with `returnValue` set to the
  passed argument (or left unchanged if omitted — which is exactly why FR-007's "programmatic
  close with no explicit outcome must resolve as cancel" is a requirement the ELEMENT must
  enforce, by defaulting a to-be-set `returnValue` to `'cancel'` before it can be read as anything
  else, not something the platform gives for free). Backdrop dismissal has no native handler at
  all — native `<dialog>` does not close on an outside click — so the element must attach its own
  listener (typically a `click` on the dialog element itself, checking whether the event target is
  the dialog and not its content) and call `.close()` (leaving `returnValue` at its
  already-defaulted `'cancel'`) when backdrop dismissal is enabled.

## Decision: static-twin question deferred to #301 (not resolved here)

- **Decision**: This mission specifies and authors `sk-confirm-dialog`'s stylesheet
  (`packages/styles/src/confirm-dialog/sk-confirm-dialog.css`) in full, but does **not** author a
  `sk-confirm-dialog.markup.ts`, and therefore generates no static `sk-confirm-dialog.html` /
  `index.ts` for the styles-layer package. The question "does a static (light-DOM,
  server-rendered) twin of this presentation need to exist, and in what form" is recorded as
  explicitly open, tracked at issue #301 (epic #300's TKT1/G0), and is not answered by this
  mission.
- **Rationale**: Issue #308 states directly: "if that needs a static twin, follow #301's ruling
  rather than inventing one here." #301 is open as of this research (verified via `gh issue view
  301` — status OPEN). #301's own text says it gates static-API finalization for TKT2/TKT4/TKT5/
  TKT7 but explicitly does **not** gate TKT8/#308 ("no #301 dependency; JS-bearing by nature") —
  because the *interactive* dialog (`showModal()`) has no server-rendered equivalent at all,
  regardless of how #301 rules. The open question is narrower than the whole component: only
  whether the **stylesheet's presentation** (the dialog's visual box — surface, border, spacing,
  action layout) needs a generated light-DOM twin for a consumer who renders their own
  non-interactive or progressively-enhanced `<dialog>` markup.
- **Precedent for "generated static form has a formal opt-in step"**: `adding-a-component.md` step
  2 — the markup module is optional; the generator derives its work set by glob from elements that
  have one, and "#72 and #73 both declined it." `sk-notice` (#178) also has no `.markup.ts` and no
  static form, for a related but distinct reason (a live region and a dismiss control are
  meaningless without JavaScript). `sk-confirm-dialog` is the same shape for its *interactive*
  form, but issue #308 raises a narrower, second question specifically about the *stylesheet*
  being reusable — which is why this mission does not simply cite `sk-notice`'s precedent and
  move on; it must name the deferral explicitly (spec.md FR-016, decision `01M2491J55FKRXGT8E1KP5X2V1`).
- **What is NOT deferred**: The stylesheet itself is fully authored and reviewable now (IC-02).
  Nothing about how the CSS is written should need to change once #301 rules — it already uses
  only tokens and needs no theme selector, host-attribute axis, `::slotted()` rule, or
  host-owned `container-type` (the three constructs #301 is specifically about). If #301 rules
  "generated static form," a future mission runs the same generator this repo already has for
  every other component; if #301 rules "shadow-only," this component's docs gain one line saying
  so, and nothing else changes.

## Decision: applicable ADR-11 required-behaviours for this element

Per `tests/node/config-contract.test.ts`'s pinned list and ADR-11 itself, this element's
declared subject set in `behaviours.json` is:

| id | applies? | why |
|---|---|---|
| SC-002/003/004 (form association) | No | `sk-confirm-dialog` is not form-associated; it has no `<form>` participation. |
| SC-005 (focus and keyboard) | **Yes** | Escape closes (as cancel), focus returns to invoker, `open` (or equivalent) state attribute tracks real state. |
| SC-006/007/008 (event contract) | **Yes** | The native `close` event: fires exactly once per close, `returnValue` is the documented `'confirm'`/`'cancel'` shape. `close` is **not** cancelable per the platform, so SC-009 (`preventDefault` demonstrably prevents) is **not** claimed — same reasoning `sk-action-row` used to correctly decline SC-009 for its own non-cancelable event. |
| SC-013 (styling API / parts) | **Yes** | Every declared `::part()` must be present and targetable. |
| SC-014 (style adoption) | **Yes** | Adopts the generated stylesheet, injects no `<style>` element. |
| SC-015 (registry guard) | **Yes** | A second `define()` of `sk-confirm-dialog` warns and no-ops. |
| SC-016 (delegate/rendered-control correspondence) | No | No detached probe or re-derived validity object exists in this element. |
| SC-017 (responsive threshold) | **Decide in tasks** | Only if the narrow-width/200%-zoom layout requirement (FR-010) is implemented as a documented breakpoint rather than fluid CSS. Declaring this subject creates the obligation (per the recipe); tasks must decide deliberately, not by default. |

## Decision: component-scoped "no literal text" test, not a repo-wide gate

- **Decision**: Add one automated, red-first-demonstrated test in
  `fixtures/elements-behaviour/src/sk-confirm-dialog.test.ts` asserting the rendered shadow tree
  contains no bare user-visible text node beyond the exact consumer-supplied strings (title, body,
  confirm label, cancel label), across the omitted-string edge cases (FR-017). This test carries
  no ADR-11 `[SC-NNN]` marker — following the exact precedent `sk-notice`'s unmarked
  re-announcement test sets (#178: "ADR-11 has no id for 'a live region re-announces a changed
  message' ... the re-announcement and node-stability tests in sk-notice.test.ts therefore carry
  no [SC-NNN] marker"). Minting a new ADR-11 id is `#67`'s process to run, not this mission's.
- **Evidence this is currently ungated repo-wide**: at `train/elements-first@2b59c8c`, no script
  under `scripts/` inspects rendered/rendered-shadow-DOM text for literal user-visible content.
  `scripts/check-component-token-literals.mjs` (read in full) polices CSS **design-value**
  literals — raw colors/spacing/etc. in stylesheets — an entirely different concern from copy
  text. `scripts/check-component-public-contract.mjs` polices `::part()` sets, also unrelated.
  Issue #286 (open, verified via `gh issue view 286`) proposes exactly a repo-wide version of this
  check as one of its own acceptance criteria ("Add the gate: for every element, assert `render()`
  emits no bare user-visible text node ... with an explicit empty-set floor") — this mission must
  not build that gate; doing so would be scope theft from #286's own deliverable.
- **Scope boundary, stated explicitly so a reviewer does not conflate the two**: this mission's
  test asserts a property of exactly one element (`sk-confirm-dialog`). It has no probe table, no
  empty-set floor, and does not scan any other component. If #286 later ships its repo-wide gate,
  this mission's test becomes redundant with (but not in conflict with) that gate and can be
  retired then — not now.

## Decision: `packages/styles/package.json` exports subpath is a required, hand-maintained, enforced edit

- **Decision**: Add `"./confirm-dialog/*": "./dist/confirm-dialog/*"` to `packages/styles/
  package.json`'s `exports` map in the same PR that adds `packages/styles/src/confirm-dialog/`.
- **Evidence it is hand-maintained**: `packages/styles/package.json`'s `exports` map (48 entries at
  `2b59c8c`, alphabetically ordered by component name, e.g. `"./notice/*": "./dist/notice/*"`,
  `"./copy-field/*": "./dist/copy-field/*"`) has no generator script — `grep -rn
  "packages/styles/package.json" scripts/*.mjs` at `2b59c8c` returns exactly one hit, a
  **read**, not a write (see next line).
- **Evidence it IS enforced, not silently missable**: `scripts/check-release-graph.mjs`, function
  `checkSubpathCoverage` (lines 175-186), called at line ~778 with the directories under
  `packages/styles/src/` compared against `Object.keys(...exports)`. A directory with no matching
  `./<name>/*` or `./<name>` key produces the problem string `` `${pkgName}: component "${dir}" has
  no subpath export — its CSS is unreachable` ``, and `main()` (bottom of the file) exits 1 when
  `problems.length` is non-zero. **Correction to an initial hypothesis raised during planning**:
  this is not an unenforced gap — the gate exists and is `check-release-graph.mjs`, part of the
  release-path check run on pull requests (per that script's own header comment: "The release
  path, exercised on a pull request"). It is still worth stating explicitly in the spec/plan
  because it is a one-line hand-edit in a file the recipe (`adding-a-component.md`) does not
  itself mention, so an implementer following only the recipe's four ratchets could still miss it
  and be caught by CI rather than by review.
- **`main`/root `exports["."]` note**: the package root export (`./dist/src/index.js`) is
  separately broken per open issue #161 (verified: that file path is never emitted by the build).
  This mission does not build any requirement on top of the root entry point — only the new
  subpath entry, which is independent of #161's defect.

## Adversarial evidence — no security-impacting dependency decision

No new npm dependency, no dependency upgrade, no dependency removal. `sk-confirm-dialog` composes
existing `lit` and the existing `.sk-button` contract only. Per the plan prompt's Supply-Chain
Security section, an adversarial-squad challenge pass over a dependency decision is not triggered
by this mission — there is no dependency decision to challenge.

## Open questions carried into tasks

1. Exact attribute/property names and their `expected-docs.json` count (FR-001 through FR-009,
   FR-013) — finalized in tasks, sized in plan.md's Technical Context as "roughly 6" pending the
   tasks phase's exact enumeration.
2. Exact `::part()` set and its `expected-parts.json` entries — sized as "roughly 5-7" in plan.md,
   finalized in tasks.
3. Whether the narrow-width/200%-zoom layout requirement (FR-010) is implemented as a documented
   breakpoint (claiming SC-017) or as fluid, threshold-free CSS (not claiming it) — a tasks-phase
   decision, not defaulted here (see the ADR-11 applicability table above).
4. The exact backdrop-dismissal opt-in shape (an attribute such as `dismissible`/`backdrop-dismiss`,
   default value, and whether it is even exposed as a toggle vs. always-on) — a tasks/implementation
   design decision within the FR-007 contract, not a product-level fork the spec needs to resolve.
