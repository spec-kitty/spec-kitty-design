# Implementation evidence — card status tone axis (#177)

**Branch**: `mission/card-status-tone-axis` → `train/elements-first` (PR #215)
**Branch point**: `train/elements-first@32fa495`
**Recorded**: 2026-09-06

## Measurements taken, and where they differed from the brief

Every ground-truth claim the mission was handed was re-derived before any code was written. All of
them held:

| claim | verified |
|---|---|
| #146's tone vocabulary is `neutral \| info \| success \| attention \| danger \| recovery` | `sk-status-indicator.ts:5-11`, frozen ordered array at `:14-20` |
| `sk-card` declares two axes | `sk-card.ts:37-40` |
| the extension point is `CARD_VARIANTS` | `sk-card.markup.ts:22`; `cardClasses()` at `:60` |
| `--sk-status-*` does not exist | `grep -c 'sk-status-' packages/tokens/src/tokens.css` → `0` |
| #176's primitives are on the train | `packages/styles/src/{facts,disclosure}/` both present |

**Three things differed** and are recorded here rather than absorbed silently.

1. **`sk-card.html` does not change.** The brief asked for confirmation that it regenerates rather
   than being hand-edited. It does regenerate — byte-identically — because
   `build-element-markup.mjs` emits only `call({}, 'the base form')` into the `.html` and the full
   variant/axis matrix into `index.ts`. The barrel gains six `SkCardStatus<Tone>HTML` exports; the
   `.html` is untouched by construction, not by omission.

2. **"Import or derive it, do not restate it" is not fully reachable.** Two toolchain constraints
   force a second spelling of the vocabulary, and both were measured:
   - `build-element-markup.mjs` evaluates every `*.markup.ts` from a `data:` URL, which has no
     module base, so `CARD_STATUSES` cannot import `STATUS_TONES`. Relative *and* bare specifiers
     both fail; the generator has a named error for it.
   - `build-vue-types.mjs` copies the manifest's type text verbatim into a `vue.d.ts` that imports
     nothing, so the element's field annotation cannot be a type alias. #146 spelled `tone`'s union
     out inline for the same reason.

   Both copies are pinned mechanically instead — an order-sensitive equality assertion in the
   behaviour fixture, and a compile-time mutual-assignability proof in the React type test. The
   underlying gap is filed as **#216**.

3. **`docs/contributing/adding-a-token.md` step 5 was false before this mission touched it.** It
   said to check `tokens.css` stays under 20 KB; no gate enforces that, and the file measured
   23,857 bytes at the branch point. Corrected in place with the measurement.

## The one judgement call, with its measurement

Five of the six tones alias a surface that already existed. **Danger had none**: `--sk-color-red`
exists and is already `sk-status-indicator`'s danger marker, but the `--sk-surface-tint-*` family
had mint, butter, lilac and sky and no rose member.

`--sk-surface-tint-rose` / `--sk-on-tint-rose` complete that family from the existing hue, by the
rule the four siblings already follow — measured in HLS: the hue's own angle, dark tints at
L 0.11–0.14 (mint 0.112, butter 0.114, sky 0.129, lilac 0.141 → rose 0.125), light tints at
L 0.93–0.95, inks at L 0.24–0.36. No new brand hue: the hue is unchanged and nothing else in the
palette moved.

## Measured contrast (sRGB, WCAG 2.x)

**(a)** the card's own foreground `--sk-fg-body` on the status surface · **(b)** the semantic pair
itself · **(c)** the edge against the page ground.

| tone | dark (a) | dark (b) | dark (c) | light (a) | light (b) | light (c) |
|---|---:|---:|---:|---:|---:|---:|
| neutral | 9.69 | 6.01 | 8.26 | 11.17 | 5.22 | 6.20 |
| info | 11.36 | 9.42 | 11.05 | 12.23 | 7.70 | 8.35 |
| success | 11.15 | 8.55 | 10.21 | 12.76 | 7.10 | 7.38 |
| attention | 10.67 | 11.18 | 13.95 | 13.38 | 6.28 | 6.23 |
| danger | 11.87 | 5.87 | 6.58 | 11.93 | 9.11 | 10.12 |
| recovery | 11.66 | 7.88 | 9.00 | 12.27 | 8.00 | 8.64 |

AA needs 4.5 for (a) and (b); WCAG 1.4.11 needs 3 for (c). Minimums: **9.69 / 5.22 / 6.20**.

## How each exit criterion is discharged

| criterion | discharged by |
|---|---|
| one axis, #146's vocabulary, no second vocabulary | the order-sensitive equality assertion in `sk-card.test.ts` plus the type test's mutual assignability |
| `--sk-status-*` in both themes, AA, in the catalogue | the table above; `token-catalogue.json` gains a `status` category |
| the status card is reproducible by composition, `<dl>`/`<details>` in light DOM | `StatusCardComposition` story; assigned-node assertions |
| no tone is the sole carrier of meaning | `Greyscale` and `StatusesGreyscale` stories; `ForcedColors` baseline; the meaning lives in the slotted indicator's text |
| fail-open is proved, not described | `[SC-013]` mounts a plain **and** an unknown-status card; the mutation arm replaces the fail-open branch with a `throw`, which blanks the shadow root so the part stops being targetable |
| type, manifest, wrapper, behaviour, axe, visual gates | see below |

## Gate results, run locally before the PR

`build-elements-css --check`, `build-element-markup --check`, `build-react-wrappers --check` and
`--selftest`, `build-vue-types --check`, `build-styles-only-markup --check`,
`measure-elements-sizes --check`, `check-manifest-content` and `--selftest`, `check-no-css-in-source`,
`check-elements-entries` and `--selftest`, `check-adopted-css-boundaries` and `--selftest`,
`check-element-css-hygiene`, `check-part-ratchet`, `check-story-theme-wrapper` and `--selftest`,
`check-gate-wiring`, `check-adr-index`, `check-llms-adr-surface`, `check-vue-template-types`,
`check-vue-packed-types`, `check-offline-load`, `check-release-graph --selftest`,
`check-token-breaking-changes`, `gate-selftest`, `typecheck-all`, `quality:all`, `npm test`
(361 tests), `run-axe-storybook` (zero violations across 243 stories), `assemble-demo-dist`,
`suite-selftest` (both new arms red-first with no collateral), and
`commitlint --from origin/train/elements-first --to HEAD` (0 problems).

## Two defects this mission introduced and a gate caught

Recorded because "the gate caught it" is only useful if what it caught is written down.

1. **`SIZES.md` went stale by 581 bytes.** `tokens.css` lost a duplicated comment block *after*
   `measure-elements-sizes.mjs` had run, and the committed `@spec-kitty/tokens` figure was never
   re-derived. CI's `--check` failed. This is the script's own documented non-reproducibility
   symptom, reached from the other direction: not a stale `dist/`, a stale *source*.
2. **`[SC-010]` was anchored on another behaviour's node.** It read the status class through
   `[part="card"]`, so the pre-existing `[SC-013]` arm that drops that attribute red both ids and
   the harness rejected it as collateral. Correctly: one mutation reddening two ids hides which one
   broke. It reads `firstElementChild` now.

A third, found by reading the cascade rather than by a gate: `.sk-card--blue:hover` and
`.sk-card--purple:hover` set `border-color` at specificity (0,2,0), which outranks the (0,1,0)
status rules — so on a card carrying **both** axes, hovering swapped the operational edge for the
brand accent and the status hue disappeared under the pointer. Exactly the combination the
`StatusWithVariant` story renders. Six `:hover` rules at equal specificity, authored after the
variant ones, keep the operational tone stable. No gate would have caught this: axe does not
hover, and the orthogonality test asserts at rest.

**And the base case was the same bug, caught at review, not by me.** `.sk-card--blue` declares
exactly `background` and `border-color`; the status rules declare both, later, at equal
specificity. So `variant` never reached the pixel while a `status` was set, at rest as well as on
hover — I fixed the hover collision and did not check the case it was a special case of.

Measured in-engine: `variant="blue" status="attention"`, `variant="purple" status="attention"` and
`status="attention"` alone all compute
`rgb(42, 36, 16) | rgb(255, 216, 77) | rgb(255, 216, 77) | 4px`.

The fix is documentation, not design. **The two axes are orthogonal as INPUTS — both settable,
both reflected, neither erroring, both modifiers on the node — and PRECEDENCE in rendering: the
operational tone supersedes the brand variant's surface and edge entirely.** Deciding that a brand
accent should survive under an operational tone is a design decision and belongs to whoever owns
the palette; it is filed rather than taken.

Three artefacts said otherwise and are corrected: `sk-card.css`'s comment ("the brand variant keeps
its own hover accent … nothing is silently dropped"), the `StatusWithVariant` story (whose two
cells rendered pixel-identically while its docstring claimed it varied the brand variant), and the
behaviour test, which asserted only `both-axes !== variant-only` — an assertion that passes for a
card whose `variant` is ignored outright. It now asserts `both-axes === status-only`, which is the
direction that can actually fail; `!==` is unassertable without first making the design change.

**A defect the review did not have, found while writing that assertion.** `.sk-card` transitions
`border-color`, so a computed border colour read straight after an attribute change is the value
mid-flight. With the status attribute removed, `backgroundColor` had snapped to the purple tint
while `borderTopColor` still read `rgb(255, 216, 77)`. The old test never saw it because it
compared only `backgroundColor`, which this component does not transition. The test now finishes
the element's animations before reading, which is deterministic where a timeout is a flake.

A fourth was caught before it reached CI: the `[SC-013]` arm's `from` string still quoted
`cardClasses(this.variant, this.inset)`, which the widened render call had replaced. The harness
reported `PATTERN NOT FOUND` rather than a false green. A mutation anchor is the one test input a
source edit silently invalidates.

## The story ratchet paid for itself, in this mission, on this fold

Worth recording because #219 asks whether the ratchet should be widened, and this is the evidence.

While applying the review fold I truncated `packages/elements/src/card/sk-card.stories.ts` **to
zero bytes** — a `open(p,'w').write(open(p).read()...)` in a rewrite script, where the `'w'` empties
the file before the read runs. All seventeen `sk-card` element stories disappeared.

What did **not** notice:

- `nx run elements:lint` — passed. An empty file has nothing to lint.
- `scripts/typecheck-all.mjs` — passed. An empty module is valid TypeScript.
- `npm test` — **361 tests, all green.** Stories are not imported by the behaviour fixture.
- every drift check, every hygiene gate, the manifest, the React wrappers, the Vue types.

What did: `expected-stories.json`, via `run-axe-storybook.js`, which named all seventeen missing
ids. Without #177 opting `sk-card` into that ratchet — which was optional, and which the recipe
explicitly says a component may decline — a commit deleting every story of the component the
mission exists to change would have reached CI with sixteen gates green.

That is the certifying-absence class this programme keeps finding, and it is the direct argument
for #219: the styles-layer greyscale story cited in this very document as acceptance evidence is
**not** ratcheted, so the same deletion there would still be silent today.

## Not done, deliberately

No new visual baseline. #177 asks for "a greyscale/desaturated story **or** visual baseline"; the
`Greyscale` and `StatusesGreyscale` stories are it, and baselines in this repo are CI-authoritative
— a locally generated one would be wrong by construction.

`sk-card` was not added to `SC-014`. It adopts a generated sheet, but that claim is already asserted
for it indirectly by `sk-blog-card`'s two-sheet identity case, which imports `sk-card`'s sheet by
name; a duplicate subject would grow the registry without adding an assertion.

## Filed

- **#216** — a `*.markup.ts` cannot import a shared vocabulary, so a second component must restate
  one, and nothing detects a fork. Three options costed; none chosen by this mission.
