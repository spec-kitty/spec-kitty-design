# Mission Specification: sk-entity-marker size, border and image axis

**Mission Branch**: `mission/entity-marker-size-border-image-axis`
**Created**: 2026-09-10
**Status**: Draft
**Input**: spec-kitty/spec-kitty-design#304 ([TKT4], Gap G3 of the Family 4 component-gap audit, epic #300), ruled by ADR-15 (`docs/architecture/decisions/2026-09-10-15-static-form-of-element-backed-css.md`)

## Summary

Widen `sk-entity-marker` (the library's compact consumer-supplied mark) on the three axes Family
4 exposed as gaps — size, border, and image styling — while keeping its existing anatomy
(`part="marker"`/`part="content"`), BEM class contract, and accessible-naming rule intact. Per
ADR-15's direct ruling on this issue, the three axes do **not** get one uniform treatment: size
and border are ordinary root-class modifiers that freeze today as an equality-gated static API;
the image axis is a `::slotted()` construct that ADR-15 measured as shadow-only and may only be
frozen as a documented authoring instruction stating the cascade tie boundary generically.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A named, token-driven size scale (Priority: P1)

A Team Kitty screen author building any of Family 4's four marks (account-avatar, personal-mark,
entity-glyph, profile-avatar) needs `sk-entity-marker` to offer a named size for each context —
the compact top-bar/list contexts the existing default and `sm` already serve, and a page-scale
context (a real profile picture on the membership-detail page) that today has no named size to
reach for — without inventing local box CSS in the consuming application.

**Why this priority**: Every other axis (border, image) is demonstrated at "every size", so the
size scale is the foundation the other two acceptance criteria are verified against. It is also
the axis with the least ambiguity in ADR-15 (an ordinary root-class modifier), so it can ship even
if the image-axis instruction needed rework.

**Independent Test**: Apply each named size attribute to `sk-entity-marker` in isolation (no
shape, no border, no image) and verify the computed `inline-size`/`block-size` matches the named
token pair, that the existing default and `sm` boxes are byte-for-byte unchanged from today, and
that no additional size beyond what Family 4's evidence justifies is introduced.

**Acceptance Scenarios**:

1. **Given** an `sk-entity-marker` with no `size` attribute, **When** it renders, **Then** its
   computed box is identical to today's default (`--sk-space-7` content box plus `--sk-space-1`
   padding on every side) — unchanged.
2. **Given** an `sk-entity-marker` with `size="sm"`, **When** it renders, **Then** its computed
   box is identical to today's `sm` box (`--sk-space-5` content box plus `--sk-space-1` padding)
   — unchanged.
3. **Given** an `sk-entity-marker` with the new larger named size, **When** it renders, **Then**
   its computed box is strictly larger than the default box, expressed entirely in
   `--sk-space-*` tokens, and the component's own docs/CSS name the Family 4 screen (the
   membership-detail profile picture) that justifies it.
4. **Given** an unknown `size` value, **When** it is set, **Then** the component warns via
   `console.warn` and falls back to the default box, exactly as `sm`/unknown does today.

---

### User Story 2 - An optional bordered presentation with an unchanged outer box (Priority: P2)

A Team Kitty screen author needs a bordered presentation of `sk-entity-marker` — for example a
profile picture that must visually separate itself from a busy or similarly-toned background —
without the border pushing surrounding layout, because callers today size and position the
marker assuming its current `content-box` + padding geometry.

**Why this priority**: Depends on the size axis being stable (the border must not change any
size's box), but is independently valuable and independently testable without the image axis.

**Independent Test**: Render the marker bordered and unbordered at the same size/shape and
measure the outer box (`getBoundingClientRect()`the element exposes to layout) — it must be
pixel-identical between the two, proven with a visual-regression snapshot, not merely asserted in
prose.

**Acceptance Scenarios**:

1. **Given** an `sk-entity-marker` with the border modifier applied, **When** compared to the
   same marker unbordered, **Then** the outer `inline-size`/`block-size` are identical and the
   border is visually present inside that unchanged footprint.
2. **Given** the border modifier applied at every named size and both shapes (square and circle),
   **When** rendered, **Then** the border traces the shape's own radius (square corner radius or
   full circle) with no clipping or corner artifact.
3. **Given** forced-colors mode, **When** the border modifier is applied, **Then** the border
   remains visible and the marker remains distinguishable from its surroundings.
4. **Given** an unknown border value, **When** it is set, **Then** the component warns and falls
   back to the unbordered presentation without affecting the size or shape axes.

---

### User Story 3 - A documented, correctly-bounded image authoring instruction (Priority: P3)

A Team Kitty page author rendering `sk-entity-marker` through the server-rendered static path
(no shadow root) needs to know exactly what CSS rule reproduces the shadow form's image styling
(`object-fit: cover`, full-bleed, no distortion), and exactly when their own stylesheet will or
will not win a conflicting declaration — because ADR-15 measured that this is the one axis where
"just outbid it" is not a safe instruction.

**Why this priority**: Gated by ADR-15's ruling that this axis cannot be an equality-gated static
API; it is the axis most likely to be gotten wrong (per ADR-15's own account of its cycle-1 draft
transcribing the wrong figure), so it is scoped last and verified most carefully.

**Independent Test**: Render the element (shadow) form and a hand-authored static form of the
same image composition side by side; verify the appearance outcomes agree (per ADR-15's O1-O4);
verify a test exists that fails if one form styles the image and the other does not, per the
issue's explicit requirement.

**Acceptance Scenarios**:

1. **Given** the shadow-hosted `sk-entity-marker` with a slotted `<img>`, **When** compared to a
   static consumer's own descendant rule reproducing `sk-entity-marker.css`'s current
   `::slotted(img)` declarations, **Then** `display`/`inline-size`/`block-size`/`object-fit`
   match exactly, at every named size and both shapes.
2. **Given** the component's CSS header comment (the authoring instruction), **When** it is read
   by a static consumer, **Then** it states: the construct is shadow-only per ADR-15; the
   structurally faithful descendant rewrite for the flattened tree (`.sk-entity-marker__content >
   img`, not `.sk-entity-marker > img`); and the tie boundary **stated generically** — a consumer
   override needs strictly higher specificity than the shipped rewrite, a tie is resolved by
   stylesheet order (last wins), and the shadow form would have yielded unconditionally — computed
   from whatever selector the shipped CSS actually ships, including any combined size/shape
   selector this mission's own docs demonstrate.
3. **Given** the instruction, **When** it is reviewed against ADR-15's own #304 paragraph,
   **Then** it does **not** transcribe the literal `(0,1,1)`/`(0,2,1)` figures as if they were the
   spec's own asserted values — those figures live only in the CSS comment, computed from the
   selector actually shipped.
4. **Given** this axis, **When** the acceptance gate is designed, **Then** no CI check asserts
   shadow-vs-static cascade-position equality for the image rule (only appearance equality),
   because ADR-15 measured that equality does not hold at a tie.

---

### Edge Cases

- Combining the new larger size, circle shape, the border modifier, and a real `<img>`
  simultaneously: the outer box must still not grow from the border, the image must still cover
  and clip to the shape, and the border must trace the circle's radius, not the square's.
- Overlong initials text or a wide inline SVG glyph at the smallest (`sm`) size with a border
  applied: content clips inside the marker; neither the content nor the border push the box
  larger.
- A static consumer's own stylesheet declaration ties the shipped rewrite's specificity and is
  loaded **before** versus **after** the page's other stylesheets: per ADR-15, the two orders
  produce different winners. This is documented behavior to be verified and stated, not "fixed" —
  there is no rewrite that removes this divergence.
- An invalid `border` value alongside a valid `size`/`shape`: only the border axis falls open to
  unbordered; size and shape and slotted content are unaffected (existing per-axis fail-open
  pattern in `entityMarkerSize`/`entityMarkerShape` extends to the new axis).
- A decorative (unlabelled) marker with the border and largest size applied: `aria-hidden="true"`
  and no `role`/`aria-label` regardless of the size/border/image presentation — the naming
  contract is a pure function of `label` alone.
- Narrow width, 200% zoom, and RTL/logical-layout contexts: the marker's box, border and slotted
  content behave identically to today (the axes are additive, not layout-direction-sensitive) —
  regression, not new behavior, is what is being verified.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Named size scale, `--sk-space-*` only | As a screen author, I want a named size for each Family 4 mark context (compact top-bar/list, and a page-scale profile picture) so that I can pick a size instead of writing local box CSS. | High | Open |
| FR-002 | Existing default and `sm` boxes unchanged | As a screen author relying on today's marks, I want the default and `sm` computed boxes to stay pixel-identical so that no existing screen shifts. | High | Open |
| FR-003 | Square and circle compose with every size | As a screen author, I want `shape="circle"` to work identically at every named size, changing only the radius token, so that shape and size are independent decisions. | High | Open |
| FR-004 | Optional border modifier, unchanged outer box | As a screen author, I want an optional bordered presentation whose outer box is identical to the unbordered form, proven visually, so that adding a border never reflows a layout. | High | Open |
| FR-005 | Border uses existing border tokens only | As a design-system maintainer, I want the border modifier to consume the existing `--sk-border-*`/`--sk-border-tint-*` family with no new or raw-value token, so that the surface/foreground and border-color system stays consistent. | Medium | Open |
| FR-006 | Border remains visible and distinguishing under forced-colors | As a screen author, I want the border to stay visible and the marker to stay distinguishable from its surroundings in forced-colors mode, so that bordered marks remain accessible. | Medium | Open |
| FR-007 | Image styling equivalent to today's `::slotted(img)`, at every size/shape | As a screen author, I want a slotted `<img>` to cover and clip to the marker's box with no distortion, unchanged from today's behavior, at every named size and both shapes. | High | Open |
| FR-008 | Image axis frozen as a documented instruction, not an equality-gated static API | As a static-path page author, I want the component's docs/CSS to tell me exactly what descendant rule to author myself, because ADR-15 ruled the shadow-vs-static cascade position cannot be held equal for this construct kind. | High | Open |
| FR-009 | Tie boundary stated generically, computed from the shipped rewrite | As a static-path page author, I want the instruction to tell me I need *strictly higher* specificity than the shipped rewrite to override it reliably, and that a tie is resolved by stylesheet order while the shadow form would have yielded unconditionally — computed from the actual rewrite shipped (including any combined size/shape selector this mission documents), never a transcribed literal figure. | High | Open |
| FR-010 | Accessible-naming contract unchanged | As an assistive-technology user, I want a labelled marker to expose `role="img"` plus the supplied name, and an unlabelled marker to be `aria-hidden`, unaffected by size, shape, border or image presence. | High | Open |
| FR-011 | Invalid values fall back and warn, per axis, independently | As a screen author, I want an invalid `size`, `shape`, or `border` value to warn via `console.warn` and fall back to its own default/off state without affecting the other axes or the slotted content. | Medium | Open |
| FR-012 | No user-visible literal in `render()` | As a maintainer honoring #286's open cross-cutting constraint, I want none of the new axes to introduce a user-visible string in `render()` — they are class-name/attribute driven, not copy. | Medium | Open |
| FR-013 | Required stories, tests and ratchets updated | As a maintainer, I want every size × shape × border combination, initials/icon/image content, decorative/meaningful naming, overlong-content clipping, dark/`LightMode`, forced-colors, narrow-width/200%-zoom/RTL, and accessibility-tree cases covered by stories/tests, and the parts/docs/behaviour/story ratchets updated to match. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | No visual regression on existing marks | Every currently-shipped story/snapshot for `sk-entity-marker` (default/`sm` × square/circle, decorative/meaningful) renders pixel-identical before and after this mission, verified by the existing visual-regression suite (`apps/storybook/src/tests/visual.spec.ts-snapshots/sk-entity-marker-*`). | Reliability | High | Open |
| NFR-002 | Contrast maintained across new sizes/border | The marker's foreground/background contrast stays ≥ 4.5:1 in both themes at every new size and with the border modifier applied, mirroring the existing behaviour-test assertion. | Accessibility | High | Open |
| NFR-003 | No added runtime cost | The three new axes add no new fetch, timer, animation, or DOM node beyond the existing `part="marker"`/`part="content"` structure — CSS class/attribute changes only, so render cost is unchanged. | Performance | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | One Work Package, one PR | The entire mission ships as a single bounded Work Package and a single PR back into `train/elements-first`; if it genuinely cannot fit, the mission stops and reports rather than splitting. | Technical | High | Open |
| C-002 | Tokens-first, BEM, existing anatomy preserved | No raw hex/rgba/px anywhere in the new CSS; all three axes use existing token families (`--sk-space-*`, `--sk-radius-*`, `--sk-border-*`); class names follow the existing `.sk-entity-marker`/`.sk-entity-marker__content`/`.sk-entity-marker--<modifier>` BEM pattern; `part="marker"`/`part="content"` are unchanged. | Technical | High | Open |
| C-003 | `packages/react/src` is generated | No hand-edit under `packages/react/src`; any new public property/attribute is picked up by the existing generator once the manifest and ratchets are correct. | Technical | High | Open |
| C-004 | No repo-wide #286 gate | This mission does not build a repo-wide "no user-visible literal in `render()`" gate; #286 owns that. A component-scoped red-first test (the #308 precedent) may be added for `sk-entity-marker` specifically if the new axes introduce any render-time string risk. | Technical | Medium | Open |
| C-005 | No image-axis equality gate | No CI check asserts shadow-vs-static cascade-**position** equality for the image rule; ADR-15 measured that no such gate can be true. Appearance-equality checks (display/inline-size/block-size/object-fit) are in scope; cascade-position equality is not. | Technical | High | Open |
| C-006 | Does not re-litigate #311's scope | `sk-entity-marker`'s `::slotted()` instruction is already discharged (ADR-15/#301's own landing PR). This mission may only **update** that existing instruction if the new size/shape modifiers change the demonstrated rewrite's specificity or worked example; it does not touch any of #311's six other named sheets. | Technical | Medium | Open |
| C-007 | Non-goals are binding | No `sk-avatar` (explicit non-goal of #212, reaffirmed by #300); no Team/membership/identity model; no new component; no image fetch/crop/upload/loading-state/fallback chain; no initials generation from name/email; no presence/status/notification dot; no stacked/grouped marks; no hover cards. | Business | High | Open |
| C-008 | Adoption gated on Lynn's product verdict, filing is not | This mission may be specified, planned, tasked and even implemented at ready-for-Lynn status per #300/#304, but the mission report must not claim a product verdict exists — none is cited anywhere in this spec. | Business | Medium | Open |

### Key Entities

See `data-model.md` for the full presentation-attribute model. Summary:

- **`sk-entity-marker` presentation state**: the element's reflected attributes (`label`, `size`,
  `shape`, and the new `border`) and the fallback-and-warn behavior governing invalid values.
- **Named size scale**: a set of `{name, --sk-space-* token, justifying Family 4 screen, is-default?}`
  rows — existing `sm`/default plus one new larger size.
- **Border modifier**: a root-class modifier consuming existing border tokens, with an
  outer-box-unchanged guarantee that must be proven visually.
- **Image axis instruction**: a documentation artifact (the CSS header comment), not a runtime
  entity — states construct classification, the structurally faithful rewrite, and the tie
  boundary generically.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of today's `sk-entity-marker` stories and visual-regression snapshots remain
  pixel-identical after this mission (zero unintended diffs on default/`sm`/square/circle).
- **SC-002**: Every named size × both shapes × bordered/unbordered combination has a passing
  story and a passing behaviour-test assertion of its computed geometry (size scale × 2 shapes ×
  2 border states, all green).
- **SC-003**: The outer-box-unchanged claim for the border modifier is backed by a visual
  regression snapshot comparing bordered vs. unbordered at the same size/shape, not by an
  assertion in prose alone.
- **SC-004**: The image-axis authoring instruction in `sk-entity-marker.css`'s header comment
  states its tie boundary using the generic "strictly higher specificity than the shipped
  rewrite; ties resolve to last-stylesheet-wins; the shadow form yields unconditionally" language,
  with zero instances of a transcribed literal specificity tuple appearing in `spec.md`, `plan.md`,
  or any `tasks/` file produced by this mission (the tuple may appear only inside the CSS comment
  itself, where it is computed from the shipped selector).
- **SC-005**: A single test exists that fails if the shadow form and the static-consumer rewrite
  disagree on `display`/`inline-size`/`block-size`/`object-fit`, per the issue's explicit
  "fails if one form styles the image and the other does not" requirement.
- **SC-006**: `expected-parts.json`, `expected-docs.json`, `behaviours.json`/`mutations.json` (if
  behaviour ids apply), and `expected-stories.json` all show a shrink-safe or exact update
  matching the new axes, and every gate they enforce (`check-part-ratchet.mjs`,
  `check-manifest-content.mjs`, `floor-reporter.mjs`, `suite-selftest.mjs`,
  `check-story-theme-wrapper.mjs` where applicable) passes.
- **SC-007**: `SIZES.md` reflects the new CSS after a real `dist/` build (not a stale local
  measure), and both workflows that enforce it stay green.

## Downstream Contract for #303

`sk-boundary-page` (#303) composes this component's widened surface next (per #300's dependency
graph, `T4 --> T3`). This mission guarantees, as a stable public surface #303 may build against
without further negotiation:

1. The named size scale (existing `sm`/default plus the new larger size), each a
   `.sk-entity-marker--<name>` root-class modifier over `--sk-space-*` tokens.
2. Square (default) and circle (`.sk-entity-marker--circle`) shapes, composable with every size,
   token-driven radius (`--sk-radius-sm` / `--sk-radius-pill`).
3. The optional border modifier with a visually-proven unchanged outer box.
4. The image axis's documented authoring instruction (shadow-only, generic tie boundary) —
   #303 must author its own static image rule per that instruction rather than assuming
   equality with the shadow form.
5. The unchanged accessible-naming contract (`label` → `role="img"` + name; empty → `aria-hidden`).

## Non-Goals

`sk-avatar` (explicit non-goal of #212, reaffirmed in #300's excluded-work table);
Team/membership/identity model; a new component; image fetching, loading states or fallback
chains; generating initials from a name or email; a presence, status or notification dot; upload,
cropping or editing; stacked or grouped marks; hover cards; any identity or profile model. Route,
permission, domain-state, copy and i18n integration remain Team Kitty's — this mission delivers
library surface only.
