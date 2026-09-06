# Implementation Plan: notice element

**Mission**: `notice-element-01M1W0WB` · **Branch**: `mission/notice-element` · **Issue**: #178
**Base**: `train/elements-first@1f587b7`

## Technical Context

**Language/stack**: TypeScript, Lit 3 custom elements, plain CSS authored in `packages/styles`.
**Testing**: Vitest browser mode (Playwright/chromium) for behaviour; `tsc --noEmit` for the React
type contract; Playwright for visual/axe; `scripts/suite-selftest.mjs` for the mutation harness.
**Target packages**: `packages/styles` (CSS source of record), `packages/elements` (element,
stories, barrels), `packages/react` (generated + one authored type-test file), root ratchets.

### Architecture facts this plan is built on (each verified in this checkout)

1. **CSS is authored in `packages/styles/src/notice/sk-notice.css`** and converted to a constructed
   stylesheet by `scripts/build-elements-css.mjs`, which globs the **elements** and reads the
   matching styles file. `css``` in the `.ts` is refused by `check-no-css-in-source.mjs`.
2. **No selector may cross the shadow boundary** (ADR-9 §3). No `:root`, `html`, `body`,
   `:host-context()`. Theme variance lives in tokens, which inherit through the boundary.
3. **`sk-notice` authors no `*.markup.ts`.** That module exists only for a component with a
   server-rendered static form; the generator derives its work set by glob from the elements that
   have one, and `sk-status-indicator` and `sk-form-input` both ship without. An announcement-bearing
   interactive element has no meaningful no-JavaScript form. **Consequence: #216's data:-URL
   constraint does not bite, and `STATUS_TONES` is imported rather than restated.**
4. **The `tone` field's type annotation must still spell the union inline**, because
   `scripts/build-vue-types.mjs` copies the manifest's type text verbatim into a `vue.d.ts` that
   imports nothing. That copy is pinned by mutual assignability in the React type test, exactly as
   #177 pinned `sk-card`'s.
5. **No new `SC-NNN` behaviour id may be minted.** `tests/node/config-contract.test.ts` asserts
   `behaviours.json`'s applicable id set equals ADR-11's list exactly, and `suite-selftest.mjs`
   guard 7 rejects any mutation naming an undeclared `(id, subject)` pair while guard 4 requires the
   red test to carry an `[SC-NNN]` marker.
6. **Declaring a subject creates the obligation, and omitting one is now detected**:
   `config-contract.test.ts` requires every element under `packages/elements/src/**/sk-*.ts` to be a
   subject of at least one applicable behaviour, with a subject file naming the element.
7. **Forced colors**: `border` and `outline` survive and are auto-remapped; `background` flattens to
   `Canvas`; `box-shadow` computes away entirely. Longhand `-color` properties only — stylelint's
   `declaration-strict-value` does not inspect the `border`/`outline` shorthands at all, so a
   shorthand passes by being invisible to the gate rather than by satisfying it. System-colour
   keywords must be in `stylelint.config.mjs`'s `ignoreValues`.
8. **`measure-elements-sizes.mjs` reads `dist/` and does not build it.** Build first, or `SIZES.md`
   records stale bytes and CI looks non-reproducible.

## The announcement design — the mission's core decision

### The defect being avoided

`sk-form-input` records the same failure twice: `:67-73` (the announced node interpolated a getter
Lit cannot observe, so a changed message never repainted, `aria-describedby` pointed at stale text
and `role="alert"` never fired again) and `:193-198` (`label` missing from `willUpdate`'s change set
left the alert node showing the OLD label until an unrelated trigger re-ran `validate()`). Both
reduce to: **the announced text changed and nothing re-rendered.**

### The design

- `announce` is an explicit property — `off` (default) | `polite` | `assertive` — independent of
  `tone`. `off` renders **no** live region at all; announcement is never a side effect of having a
  message or of being `danger`.
- The live region **is** the visible message container. One node, one copy of the text: a separate
  visually-hidden mirror would duplicate the message in the accessibility tree, and `aria-hidden`ing
  it would stop the announcements it exists for.
- The container is rendered with its `role` **from that node's first render**, whenever
  `announce !== 'off'`. It is **`keyed()` on the announce level**, so changing politeness discards
  the node and births a new one carrying its role — a role is never toggled onto a node that already
  holds text.
- **`message` is a reactive property.** A message change re-renders only the text child; Lit keeps
  the container node itself. That is simultaneously the re-announcement mechanism and the
  node-stability guarantee, and it is the direct repair of the `sk-form-input` defect.

### Why cancelation is load-bearing rather than decorative

The element does not remove itself, so if dismissal did nothing but dispatch, `cancelable: true`
would prevent nothing and `preventDefault()` would be an inert affordance — the shape this repo
repeatedly flags. The element owns exactly one post-dismiss effect: **the focus move**.
`preventDefault()` abandons it, which is the honest meaning ("I am handling this; do not touch
focus") and gives SC-009 a real default action to prevent.

### Where focus lands, and why

**On the notice host**, which the element makes programmatically focusable (`tabindex="-1"`, set in
`connectedCallback` only when the consumer has not supplied their own `tabindex`).

The reasoning, stated because the alternatives are not obviously worse: the dismiss button is inside
the shadow root and is the node most likely to stop existing the instant the consumer acts on the
event. Leaving focus there means focus falls to `<body>` the moment the consumer removes the notice —
the classic post-dismissal focus-loss defect. Moving focus to the host keeps it on a node that is
still in the document at the moment the consumer's handler runs, so the consumer has a defined,
synchronous place to redirect from rather than discovering focus has already been lost. The element
cannot know what should receive focus next; it can guarantee focus is somewhere deliberate when it
hands control back.

### The residual this design does not close, stated rather than hidden

If a consumer constructs a notice with `message` already set and inserts it in one step, the live
region and its content enter the DOM together, which is the case #178 names as unreliable. The
element cannot repair that without deferring its own first paint across a frame boundary, which
would need a timer this mission is barred from adding. It is therefore **documented on the element**:
insert the notice, then assign `message`. If a lens judges that insufficient, it is an architectural
question about the element base layer and gets filed, not decided here.

## Component design

### Public surface

| member | kind | notes |
|---|---|---|
| `tone` | attribute, reflected string | six values from `STATUS_TONES`; unknown → `neutral` + `console.warn` |
| `announce` | attribute, reflected string | `off` \| `polite` \| `assertive`; unknown → `off` + warn |
| `message` | attribute, string | the announced/visible message; reactive, so a change re-announces |
| `dismissible` | attribute, boolean, reflected | renders the dismiss control |
| `dismissLabel` | attribute, string | accessible name for the control; documented default |
| `sk-notice-dismiss` | event | `CustomEvent<SkNoticeDismissDetail>`, bubbles, composed, cancelable |

### Parts and slots

Parts: `notice` (root), `marker`, `content`, `heading`, `body`, `actions`, `dismiss`.
Slots: `heading` (consumer's native heading — the element generates none), `marker` (fallback glyph),
default (message body), `actions` (trailing controls).

### CSS

`:host { display: block }` (#135). Surface from `--sk-status-<tone>`, foreground from
`--sk-on-status-<tone>`; **no `--sk-notice-*` family**. Tone edge on the longhand
`border-inline-start-color`. Forced-colors block widens `border-inline-start-width` and pins
`border-inline-start-color: CanvasText`, plus `outline-color: Highlight` on the dismiss control's
`:focus-visible`. Reduced-motion cancels the one entrance transition the component owns, scoped to
that selector and that property.

## Behaviour ids claimed

| id | why sk-notice owns it |
|---|---|
| SC-006 | dismiss fires exactly once |
| SC-007 | the documented detail shape |
| SC-008 | bubbles and composed as documented |
| SC-009 | `preventDefault()` abandons the focus move — a real default action |
| SC-010 | `tone`/`announce`/`dismissible` assigned before upgrade reach the attribute |
| SC-011 | the marker slot's fallback appears when empty and is replaced when filled; heading/body/actions reach their slots. **sk-notice becomes the first shipped-element subject of SC-011**, which until now only the synthetic fixture carried |
| SC-012 | keyboard dismissal and the documented focus destination |
| SC-013 | every declared part is targetable from outside |
| SC-014 | adopts the generated sheet by identity, injects no `<style>` |

The announcement and re-announcement tests carry **no** `[SC-NNN]` marker, because ADR-11 has no id
for "a live region re-announces a changed message" and minting one would extend the behaviour set
#67 owns. This is the **fifth** time this programme has reached that boundary (#140, #143, #77,
#177), and the answer is the same: the coverage is real and held by an ordinary test. The
`SC-010@sk-notice` mutation that de-registers `message` reds both the marked SC-010 test and the
unmarked re-announcement test, and `mutations.json` records that.

## Risks

| risk | mitigation |
|---|---|
| A forced-colors block that is present but inert (a sibling mission shipped one) | The block changes `border-inline-start-width`, which the automatic remap cannot supply. Verified by a Playwright assertion under `page.emulateMedia({ forcedColors: 'active' })` comparing computed width against the normal-mode value — not assumed. |
| `SIZES.md` measured before a build | Build `tokens,styles,elements` first; the SRI figure of record is CI's. |
| Another session merging to the train mid-mission | Re-fetch and rebase before the PR; a `kitty-ops/ops-index.jsonl` conflict is a **union**, then verify every line parses and every `invocation_id` is unique. |
| `expected-docs.json` is exact in both directions | Count the published surface after `elements:analyze`, from the manifest, not by hand. |
| Suite/selftest ceilings in `suite-budget.json` | Adding ~10 mutations grows the selftest run; if CI breaches, append a measurement row with the CI figure and raise the ceiling in the same commit. |

## Work packages

1. **WP01 — CSS + tokens consumption.** `packages/styles/src/notice/sk-notice.css`; stylelint
   `ignoreValues` if a new system colour is used.
2. **WP02 — the element.** `sk-notice.ts`, barrels, generated `.css.js`.
3. **WP03 — stories.** Element stories incl. LightMode, greyscale, forced-colors, message-change,
   dismissible with action logging.
4. **WP04 — behaviour tests + type test.** `fixtures/elements-behaviour/src/sk-notice.test.ts`,
   the forced-colors Playwright assertion, `wrappers.type-test.tsx` additions.
5. **WP05 — ratchets + generated artefacts.** All six root JSONs, regenerate everything, docs
   inventory, gates green, PR.
