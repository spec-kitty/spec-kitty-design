# Implementation Plan: The notice heading is announced, and the tint doctrine stops forbidding what the palette does

**Branch**: `mission/notice-heading-in-region-and-tint-doctrine` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/notice-heading-in-region-and-tint-doctrine-01M1WHG4/spec.md`

## Summary

Move `sk-notice`'s heading box inside the `keyed()` live region so the whole notice is announced,
heading first; keep the four existing announcement guarantees; add the red-first test the ruling
names; keep the render pixel-identical; record the change for consumers. Then amend two sentences
of token doctrine so they permit what the ratified palette already does, and give the permission a
test a future mission can apply.

## Technical Context

**Language/Version**: TypeScript 5.x, Lit 3.3.3, ES2022 modules
**Primary Dependencies**: `lit`, `lit/directives/keyed.js`, Vitest 4 browser mode (`@vitest/browser-playwright`), Nx 22, Storybook 10
**Storage**: N/A
**Testing**: `fixtures/elements-behaviour/src/sk-notice.test.ts` (browser lane, real shadow DOM, real computed styles); Playwright specs in `apps/storybook/src/tests/`; axe over the built Storybook
**Target Platform**: Browsers — chromium locally, chromium + webkit in CI
**Project Type**: Nx monorepo, four packages, `tokens → styles → elements → react`
**Performance Goals**: `suite-budget.json`'s two ceilings unchanged; Storybook build under 3 min (NFR-003)
**Constraints**: no visual change; no new behaviour id; no edits to the concurrently-owned surfaces listed in C-003
**Scale/Scope**: one element template, one stylesheet rule, one behaviour fixture, two docs, one changelog, the generated artefacts that follow

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Charter obligation | How this mission meets it |
|---|---|
| **Hard rule 1 — tokens first** | The one CSS change is `margin-block-end: var(--sk-space-2)`. No literal. |
| **Hard rule 3 — semantic pairing** | No token added or changed. #217 is a *doctrine* amendment; the ratified literals already shipped in #177/#215. |
| **Hard rule 5 — conventional commits** | Scopes used: `elements`, `styles`, `docs` (unscoped `docs:` for kitty-specs and for prose-only docs). `docs(adr)`/`docs(specs)` are not in the enum and are not used. |
| **Hard rule 6 — every story has a LightMode variant** | No story is added or removed; `LightMode` is untouched. |
| **Generated artefacts are checked, not authored** | `elements:analyze`, `build-react-wrappers.mjs`, the generated CSS modules and `SIZES.md` are regenerated from a real build with `--skip-nx-cache`. |
| **ADR-11 behaviour registry is exact** | No id is minted. The new test carries no marker, joining the four existing unmarked announcement-contract tests, and `behaviours.json`/`mutations.json` are not touched (also C-003). |

## Approach

### A. The template move (#228)

The heading box moves from a sibling of the body into the body — that is, inside the node
`keyed()` builds and the node that carries the role.

```
BEFORE                                        AFTER
<div part="content">                          <div part="content">
  <div part="heading"><slot name=heading>        keyed(announce,
  keyed(announce,                                  <div part="body" role=…>
    <div part="body" role=…>                         <div part="heading"><slot name=heading>
      {message}<slot>                                {message}<slot>
    </div>)                                        </div>)
  <div part="actions"><slot name=actions>        <div part="actions"><slot name=actions>
</div>                                        </div>
```

`[part="content"]`, `[part="heading"]`, `[part="body"]`, `[part="actions"]` all survive, so
`expected-parts.json` (seven parts) is unchanged and `[SC-013]` needs no edit.

### B. Keeping the render pixel-identical (NFR-001)

`.sk-notice__content` is `display: grid; gap: var(--sk-space-2)`. Today its three items are
heading, body, actions, so the heading→body space is one grid gap — **including when no heading is
slotted**, where the heading is a zero-height item that still contributes a gap. With the heading
inside the body that gap disappears, so it is replaced by an equal margin on the same box:

```css
.sk-notice__heading { margin-block-end: var(--sk-space-2); }
```

This reproduces today's geometry in every case, including the two that look like edge cases:

- **no heading slotted** — the box is zero-height and its bottom margin supplies the same
  `--sk-space-2` the vanished grid gap did;
- **heading, no message, no default slot, actions present** — the heading's bottom margin collapses
  out of the (border-free, padding-free) body box, and the body is a grid *item*, whose margins do
  not collapse with the grid container. Total heading→actions space stays `space-2 + space-2`.

`sk-notice` has no visual-regression baseline (`apps/storybook/src/tests/visual.spec.ts-snapshots/`
contains none), so the gate cannot red on it — which is why the geometry is argued here rather than
left to a screenshot to notice.

### C. What "announced" is measured with

`Element.textContent` does **not** flatten slots. The message is a text node in the shadow tree, so
today's assertions read it directly; a slotted heading lives in the light tree and would be invisible
to the same call. A test asserting `region.textContent` contained the heading text would therefore be
**red for the wrong reason before the change and impossible to make green after it**.

The new test walks the region and follows `HTMLSlotElement.assignedNodes({ flatten: true })`, which
is the subtree an assistive technology actually flattens. It asserts two things, structure and text:
`[part="heading"]` is a descendant of the role-carrying node, and the flattened text is
`Deploy failed Retrying in 5s` — heading first.

### D. The `keyed()` caveat

Re-read against the new shape, not assumed. Two facts decide whether the wording is still adequate:

1. `role="alert"` and `role="status"` both carry an implicit **`aria-atomic="true"`** (WAI-ARIA
   1.2). So once the heading is inside, *every* re-announcement re-reads the heading as well as the
   message. That is what makes the ruling work — and it is a new, permanent cost, not a transient.
2. The caveat's stated reliable path — "set the politeness first, then assign the message" — assumed
   the region could be born empty. With a heading slotted it cannot be: the region is born holding
   the heading. The hazard the caveat describes is therefore **reachable on the documented happy
   path**, which it was not before.

Both are widenings of the recorded hazard, so the comment is widened. The conclusion is written into
the file and reported.

### E. The doctrine amendment (#217)

The fact the amended rule turns on, verified in `packages/tokens/src/tokens.css` before writing:

| claim | measured |
|---|---|
| `--sk-color-blue-bg` = `--sk-surface-tint-sky` | `#14202E` = `#14202E` ✓ |
| `--sk-color-purple-bg` = `--sk-surface-tint-lilac` | `#1E1A2E` = `#1E1A2E` ✓ |
| `--sk-color-green-bg` = `--sk-surface-tint-mint` | `#15241A` = `#15241A` ✓ |
| `--sk-color-red` is a foreground | `#E97373`, commented "validation errors", and is `--sk-on-tint-rose` ✓ |
| no red/danger **surface** token exists | there is no `--sk-color-red-bg`, and no other dark-red surface ✓ |

One correction the ruling's own framing invites and the tree refutes: **butter was already a
literal.** There is no `--sk-color-yellow-bg`; `--sk-surface-tint-butter: #2A2410` is a literal in
the dark block, and in the light block **all five** tint surfaces are literals. So rose is not the
first literal in the family — it is the fourth (dark) and fifth (light). That strengthens the
amendment rather than weakening it, and it is recorded rather than smoothed over.

The amended rule is written as an applicable **three-question test**, so a future mission reaches a
yes/no without asking who owns the palette.

`docs/design-system/using-tokens.md` is corrected to say which `--sk-status-*` tokens resolve to
aliases and which bottom out in literals.

## Project Structure

### Documentation (this mission)

```
kitty-specs/notice-heading-in-region-and-tint-doctrine-01M1WHG4/
├── plan.md              # This file
├── spec.md
├── meta.json
└── tasks/               # Work packages
```

### Source Code (repository root)

```
packages/elements/src/notice/
├── sk-notice.ts             # template move, JSDoc, keyed() caveat        (edited)
├── sk-notice.stories.ts     # story prose describing the new behaviour     (edited)
└── sk-notice.css.js|.d.ts   # GENERATED from the styles sheet              (regenerated)

packages/styles/src/notice/
└── sk-notice.css            # the one heading-margin rule                  (edited)

fixtures/elements-behaviour/src/
└── sk-notice.test.ts        # new red-first test + the announce=off sweep  (edited)

packages/elements/
└── custom-elements.json     # GENERATED manifest                           (regenerated)

packages/react/src/          # GENERATED wrappers                           (regenerated)
SIZES.md                     # GENERATED from a real build                  (regenerated)

docs/contributing/adding-a-token.md      # #217 amendment                   (edited)
docs/design-system/using-tokens.md       # #217 correction                  (edited)
docs/design-system/changelog.md          # #228 entry + migration line      (edited)
```

Untouched, by C-003: `docs/architecture/decisions/`, `behaviours.json`, `mutations.json`,
`scripts/suite-selftest.mjs`, `fixtures/*/src/config-contract.test.ts`, `suite-budget.json`.

## Risks

| Risk | Mitigation |
|---|---|
| A `textContent` assertion is vacuous for slotted content | The test flattens `assignedNodes({ flatten: true })`; the red is captured verbatim before the fix. |
| The move changes vertical rhythm | The replacement margin is derived from the gap it replaces, and both zero-height cases are worked through in §B. |
| axe rejects a heading inside `role="alert"` | Neither `alert` nor `status` constrains its owned children; the a11y gate runs over the built Storybook and will say so. |
| A generated artefact is regenerated from a cached build | Every regeneration uses `--skip-nx-cache`; `SIZES.md` is regenerated only after a real `elements:build`. |
| The train moves under the mission | Re-fetch and rebase before the PR is finished; regenerate rather than hand-merge any generated artefact. |
