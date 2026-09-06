# Mission Specification: notice element

**Mission Branch**: `mission/notice-element`
**Created**: 2026-09-06
**Status**: Draft
**Input**: Issue #178 — `[elements] sk-notice — accessible block-level live status and alert element`

## Context

Issue #178 asks for one new element, `sk-notice`: a **block-level, optionally announced** status
surface for a message about the page or a region of it. Its origin is a Factory Dashboard
component-gap audit pinned to `factory-dashboard@1fb95bc`, where build/deploy failure banners,
degraded-queue warnings and "connection lost, retrying" strips are hand-rolled per page, **none of
them carries a live region**, and dismiss controls where present are unlabelled `×` glyphs.

The announcement contract is the heart of this mission. A notice that renders correctly but is
never announced is decorative — it is exactly the state the dashboard is already in.

### Measurements taken against `train/elements-first@1f587b7`

Every claim this mission is built on was re-measured in this checkout rather than inherited:

| Claim | Result |
|---|---|
| `STATUS_TONES` is exported | **Confirmed** — `packages/elements/src/status-indicator/sk-status-indicator.ts:24`, `Object.freeze`d, six values in presentation order, re-exported from `src/index.ts:27` |
| `--sk-status-*` / `--sk-on-status-*` exist in both themes | **Confirmed** — `packages/tokens/src/tokens.css:109-121` (default) and `:404-416` (`.sk-light`), 12 declarations per theme |
| `sk-notice` does not exist | **Confirmed** — absent from `packages/elements/src` and `packages/styles/src`; the only occurrence of the string repo-wide is a forward reference in #177's own spec |
| The re-announcement trap is recorded twice in `sk-form-input.ts` | **Confirmed** — `:67-73` (a getter Lit cannot observe left `aria-describedby` pointing at stale text and `role="alert"` never re-announced) and `:193-198` (`label` missing from `willUpdate`'s change set left the alert node showing the OLD label until an unrelated trigger re-ran `validate()`). Both are the same class of defect: **the announced text changed and nothing re-rendered.** |

One measurement differs from the mission brief and is recorded rather than silently accepted: the
brief states "15 status references" in `tokens.css`; the actual figure is **28 matching lines** —
24 token declarations (12 per theme) plus 4 comment mentions. The substantive claim the number was
offered in support of (the token family exists, in both themes) holds, so this mission proceeds.

### The constraint that shapes how the tone vocabulary is consumed

#216 records that `scripts/build-element-markup.mjs` evaluates every `*.markup.ts` from a `data:`
URL, which has no module base, so such a module cannot import a shared vocabulary — and #177 had to
restate the six tones in `sk-card.markup.ts`, pinned by an order-sensitive assertion.

**That constraint does not bite here, and the reason is worth stating rather than assuming.** A
`*.markup.ts` exists only for a component with a **static form** in `packages/styles`; the recipe
says so explicitly and `sk-status-indicator` and `sk-form-input` both ship without one. `sk-notice`
is an announcement-bearing interactive element with no server-rendered form to generate — a live
region and a dismiss button are meaningless without JavaScript — so it authors **no** `.markup.ts`
and can therefore `import { STATUS_TONES }` directly. This mission adds **no third copy** of the
vocabulary.

A second, independent copy is still forced, and it is not the same thing: `scripts/build-vue-types.mjs`
emits the manifest's type text verbatim into a `vue.d.ts` that imports nothing, so the `tone`
field's **type annotation** must spell the union inline. That copy is pinned by a compile-time
mutual-assignability proof in the React type tests, the way #177 pinned `sk-card`'s.

### Why this is not `sk-status-indicator` widened

#146's `sk-status-indicator` is an **inline** marker+text pairing that lives inside a row or header:
no live region, no dismissal, no block layout, no heading affordance, by design. Widening it would
break its inline row grammar. Both ship. A notice **may slot** an indicator; an indicator never
becomes a notice. This mission does not touch `sk-status-indicator` beyond importing its exported
vocabulary.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — a failure that appears after load is announced (Priority: P1)

A deploy fails while the operator is reading the page. The dashboard sets a notice's message and
announcement level. A screen-reader user hears the message without re-navigating the page.

**Why this priority**: this is the entire reason the element exists. Every other story is
presentation; this one is the defect the audit found.

**Independent Test**: mount a notice with `announce="assertive"`, set `message`, and assert the
live-region node in the shadow root carries `role="alert"` and now contains the text — and that the
node carrying the role **existed before the message arrived**.

**Acceptance Scenarios**:

1. **Given** a notice rendered with `announce="polite"` and no message, **When** a message is set,
   **Then** the shadow root's live-region node — which already carried `role="status"` at first
   render — contains the message text.
2. **Given** a notice with `announce="off"` (the default), **When** a message is set, **Then** no
   node in the shadow root carries `role="alert"` or `role="status"`, because announcement is an
   explicit opt-in and not a side effect of having a message.
3. **Given** a notice with `announce="assertive"`, **When** it first renders, **Then** the node
   carrying `role="alert"` is present in the shadow root **before** any message is assigned.

---

### User Story 2 — a changed message is announced again (Priority: P1)

The same notice stays on the page; only its text changes — "Retrying in 5s" becomes "Retrying in
2s", or "Build failed" becomes "Build failed on 3 of 12 targets". The tone does not change.

**Why this priority**: this is the exact defect `sk-form-input` records **twice**, and #178 names
it as the failure this mission must not reproduce. A notice that announces once and then goes quiet
is worse than one that never announces, because the consumer believes it is working.

**Independent Test**: set `message`, await the update, set a **different** `message` with no other
change, await again, and assert the live region's text is the new one. The test's red is a stale
message.

**Acceptance Scenarios**:

1. **Given** an announced notice showing message A, **When** `message` is set to B with no tone
   change, **Then** the live region's text content is B.
2. **Given** an announced notice, **When** the message changes, **Then** the live-region node is the
   **same node object** it was before — proven by identity, not by structure — because a live region
   recreated with its content is not reliably announced.
3. **Given** a notice whose message changes, **When** the tone is also changed in the same update,
   **Then** the live region still shows the new message and is still the same node.

---

### User Story 3 — dismissal is controlled, labelled and keyboard-operable (Priority: P1)

An operator dismisses a notice with the keyboard. The consumer decides whether the notice is
removed; the element does not remove itself.

**Why this priority**: the audited dashboards ship unlabelled `×` glyphs, and an element that
removes itself takes the decision away from the consumer that owns the state.

**Independent Test**: activate the dismiss control by keyboard, assert exactly one
`sk-notice-dismiss` event with the documented detail, and assert the notice is **still in the
document**.

**Acceptance Scenarios**:

1. **Given** a dismissible notice, **When** the dismiss control is activated by `Enter` or `Space`,
   **Then** exactly one `sk-notice-dismiss` event fires, it bubbles, it is composed, and it is
   cancelable.
2. **Given** a consumer that calls `preventDefault()` on the event, **When** the control is
   activated, **Then** `defaultPrevented` is true and the element's own behaviour is unchanged —
   the element never removed itself in either branch.
3. **Given** a dismissible notice, **When** it renders, **Then** the dismiss control is a real
   `<button>` with a non-empty accessible name, and a notice that is dismissible without a supplied
   label still produces a named control from a documented default.
4. **Given** a dismiss control that is activated, **When** the event has fired, **Then** focus has
   moved to a **documented** destination rather than being destroyed.

---

### User Story 4 — the tone is never the only carrier of meaning (Priority: P1)

A user with a colour-vision difference, a user in greyscale, and a user in Windows High Contrast
all read the same notice and get the same information.

**Why this priority**: the audit found colour-only strips — "the border/background hue is the sole
difference between info and failed". Reproducing that in the replacement would be the whole point
missed.

**Independent Test**: a greyscale story and a forced-colors story, plus a computed-style assertion
that the forced-colors fallback is **load-bearing** rather than present-and-inert.

**Acceptance Scenarios**:

1. **Given** any tone, **When** the notice renders, **Then** a marker and the message text carry the
   tone, so the surface colour is redundant rather than sole.
2. **Given** `forced-colors: active`, **When** the notice renders, **Then** the tone survives via a
   **system-colour border** and the marker, not via a background — which flattens to `Canvas`.
3. **Given** `forced-colors: active`, **When** the dismiss control is focused, **Then** it retains a
   visible focus ring drawn with `outline`, because `box-shadow` computes to `none` there.

---

### User Story 5 — the consumer owns the heading and the actions (Priority: P2)

A notice appears inside a section that already has an `<h2>`. The consumer slots an `<h3>`; the
element does not generate a heading level that would break the document outline.

**Why this priority**: a fixed `<h2>` is an outline defect the consumer cannot repair, and #146
applies the same rule to `sk-section-header`.

**Independent Test**: slot a native heading and trailing actions, and assert each lands in its
intended slot with no element-generated heading anywhere in the shadow root.

**Acceptance Scenarios**:

1. **Given** a consumer-slotted `<h3>`, **When** the notice renders, **Then** that heading is the
   only heading, and the shadow root generates none.
2. **Given** slotted trailing actions, **When** the notice renders, **Then** they are assigned to
   the actions slot and remain the consumer's own elements.
3. **Given** a slotted `sk-status-indicator`, **When** the notice renders, **Then** it composes
   without either element altering the other.

---

### User Story 6 — the contract survives into React without `any` (Priority: P2)

A React consumer sets a tone and handles a dismiss. Their editor knows both types.

**Why this priority**: ADR-11's wrapper invariant exists so a typed contract is not silently lost at
the framework boundary.

**Independent Test**: a compile-time type test asserting the tone union and the dismiss event detail
reach the generated wrapper, with mutual assignability against `STATUS_TONES` so a fork on either
side fails to compile.

**Acceptance Scenarios**:

1. **Given** the generated React wrapper, **When** a consumer passes a tone outside the union,
   **Then** it is a compile error.
2. **Given** the generated wrapper's dismiss handler, **When** a consumer reads the event detail,
   **Then** its type is the documented detail shape and not `any` or a bare `CustomEvent`.

---

### Edge Cases

- **An entrance animation must not delay the announcement.** Under `prefers-reduced-motion: reduce`
  the entrance transition is suppressed; in either case the live region is populated by the same
  update, never gated on a transition end.
- **An unknown tone** degrades to `neutral` with a warning rather than painting an unstyled box —
  the same failure policy `sk-status-indicator` and `sk-card` already use.
- **A message set before the element definition loads** is still applied on upgrade (ADR-11 required
  behaviour 3) — the dashboard has no controlled script order.
- **A notice that is not dismissible** renders no button at all, rather than a hidden or disabled one.
- **Announcement changed after first render** — moving from `off` to `polite` must produce a live
  region that is then reliably announced on the next message.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | `sk-notice` is a new custom element in `packages/elements/src/notice/`, registered through `define()`, exported from `src/index.ts` and side-effect imported in `src/elements.ts`. |
| FR-002 | A `tone` property accepts exactly the six values of the exported `STATUS_TONES` and degrades to `neutral` with a console warning on an unknown value. The runtime list is **imported**, not restated. |
| FR-003 | An `announce` property with three documented values — `off` (default), `polite`, `assertive` — controls announcement explicitly and independently of `tone`. |
| FR-004 | When `announce` is not `off`, a live-region node carrying `role="status"` (polite) or `role="alert"` (assertive) exists in the shadow root **at first render**, before any message is assigned. |
| FR-005 | The role is **never** toggled onto a node that already exists holding content; the live-region node is stable across renders, provable by node identity. |
| FR-006 | `message` is a reactive property, so a changed message re-renders the live region and is announced again with no tone change and no other trigger. |
| FR-007 | A `dismissible` property renders a real `<button>` with a required accessible name, defaulting to a documented label when none is supplied. |
| FR-008 | Activating the dismiss control emits exactly one `sk-notice-dismiss` — bubbling, composed, cancelable, with a typed `detail`. |
| FR-009 | The element **never** removes itself from the DOM, in either the default or the `preventDefault()` branch. |
| FR-010 | Focus moves to a single documented destination on dismissal and that destination is stated in the element's published docs. |
| FR-011 | Slots exist for a consumer-supplied heading, the message body and trailing actions; the element generates no heading of its own. |
| FR-012 | `:host { display: block }` is declared in the component CSS (#135). |
| FR-013 | Tone is carried by a marker and the message text in addition to colour, verified by a greyscale story. |
| FR-014 | Under `forced-colors: active` the tone survives via a longhand system-colour border plus the marker, and the dismiss control keeps an `outline`-drawn focus ring. |
| FR-015 | Any entrance transition is suppressed under `prefers-reduced-motion: reduce` and never gates the announcement. |
| FR-016 | Every `::part()` is declared with `@csspart` and documented; every slot with `@slot`; the event with `@fires {CustomEvent<…>}`. |
| FR-017 | Tone surfaces consume `--sk-status-*` / `--sk-on-status-*`; **no `--sk-notice-*` token family is created**. |
| FR-018 | Stories cover: one per tone, a `LightMode` wrapped in `class="sk-light"`, announcement off/polite/assertive, a message-change story, a dismissible story with action logging, long message, multi-paragraph body, trailing actions, a slotted `sk-status-indicator`, greyscale, and forced-colors. |
| FR-019 | Behaviour tests cover keyboard dismissal, typed event detail and cancelation, live-region node stability, re-announcement on message change, and focus destination after dismissal. |
| FR-020 | A compile-time type test proves the tone union and the dismiss event detail reach the generated React wrapper without `any`. |
| FR-021 | The component is registered in `expected-parts.json`, `expected-docs.json`, `behaviours.json` and `mutations.json`, with every total bumped. |
| FR-022 | Generated artifacts are regenerated and committed: `.css.js`/`.css.d.ts`, `custom-elements.json`, `packages/react/src/**`, `packages/elements/vue.d.ts`, and `SIZES.md` — the last measured **after** a real build. |

### Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-001 | Zero axe violations on every story, per the charter's absolute accessibility gate. |
| NFR-002 | No hardcoded colour values; every value from a `--sk-*` token, with system-colour keywords added to `stylelint.config.mjs`'s `ignoreValues` if new ones are used. |
| NFR-003 | No selector crosses the shadow boundary — no `:root`, `html`, `body` or `:host-context()` in the component CSS (ADR-9 §3). |
| NFR-004 | The element adopts a constructed stylesheet and injects no `<style>` element (ADR-10 §1). |
| NFR-005 | The forced-colors block is verified **load-bearing** rather than assumed — a fallback resting on `transparent` on a `border-*-color` or on `box-shadow` is inert and does not satisfy FR-014. |

### Constraints

| ID | Constraint |
|---|---|
| C-001 | `sk-status-indicator` is not widened, replaced or otherwise changed. Both elements ship. |
| C-002 | No toast/snackbar behaviour: no positioning, stacking, queueing, auto-dismiss timer or portal. |
| C-003 | No application state, no retry/reconnect logic, no domain→tone mapping, no undo. |
| C-004 | The CSS source of record is `packages/styles/src/notice/sk-notice.css`; no `css\`\`` in the `.ts`. |
| C-005 | No architectural decision is taken by this mission. A genuine fork is filed as an issue with the measurement attached. |
| C-006 | The PR targets `train/elements-first`; commit types/scopes are drawn from the repo's enum, and `docs(adr)`/`docs(specs)` are invalid. |

### Key Entities

- **`sk-notice`** — the element: tone, announcement level, message, dismissibility, slots, parts.
- **`SkNoticeDismissDetail`** — the typed detail of the `sk-notice-dismiss` event.
- **`STATUS_TONES`** — the library's one authored tone vocabulary, imported here, owned by #146/#177.

## Success Criteria *(mandatory)*

### Measurable Outcomes

| ID | Outcome |
|---|---|
| SC-A | A notice appearing after load is announced once at the requested politeness, and a **changed** message is announced again — proven by a test that is red without the fix. |
| SC-B | The live-region node is the same node object across a message change, a tone change and a combined change. |
| SC-C | Exactly one tone vocabulary exists across `sk-status-indicator`, `sk-card[status]` and `sk-notice`, over one `--sk-status-*` token family — and `sk-notice` adds no new copy of it. |
| SC-D | Dismissal is controlled, labelled, keyboard-operable, and lands focus on a documented destination; the element never removes itself. |
| SC-E | The notice is interpretable in greyscale and in forced-colors, with the forced-colors block demonstrated load-bearing. |
| SC-F | No timer, positioning or application state exists in the element source. |
| SC-G | Every gate in the recipe's step 7 passes, and `git status --porcelain` is empty before the PR opens. |

## Out of Scope

Toast/snackbar positioning, stacking or queueing. Auto-dismiss timers. Application state — the
consumer owns whether a notice exists. Retry/reconnect logic. Domain→tone mapping. Undo semantics.
Any change to `sk-status-indicator`. A `.sk-empty-state` variant, a `sk-card[status]` variant, an
`sk-toolbar` or an `sk-status-card`. A static `.markup.ts` form, which an announcement-bearing
interactive element cannot meaningfully have.
