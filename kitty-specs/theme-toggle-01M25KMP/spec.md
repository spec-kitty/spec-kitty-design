# Mission Specification: Theme Preference Toggle

**Mission Branch**: `mission/theme-toggle`  
**Created**: 2026-09-10  
**Status**: Ready for planning  
**Input**: [spec-kitty-design issue #323](https://github.com/spec-kitty/spec-kitty-design/issues/323)

## Purpose and scope

Deliver one reusable design-system element, `sk-theme-toggle`, that lets a person choose exactly `system`, `light`, or `dark`, applies the resolved theme to the document root without a wrong-theme flash, and proves the result in a generic Factory-pattern Storybook composition. The element owns generic theme preference and resolution only.

Out of scope are arbitrary palettes, account or server synchronization, cross-tab synchronization, application routes, authentication, navigation, fetching, refresh behavior, and any Factory-specific role, queue, job, agent, or data model. No new color palette or color token is authorized. Factory Dashboard adoption remains [factory-dashboard #14](https://github.com/spec-kitty/factory-dashboard/issues/14).

## User scenarios and testing

### User Story 1 — Choose and understand a theme preference (P1)

As a design-system consumer's user, I can choose System, Light, or Dark from a visibly labelled single-choice control and can always determine which preference is selected without relying on color.

**Independent test**: render the element with consumer-supplied labels, operate it using pointer and keyboard, and inspect its accessibility tree and visible selected-state text.

**Acceptance scenarios**:

1. **Given** the control is rendered, **when** assistive technology inspects it, **then** it exposes one labelled three-option single-choice group rather than binary switch semantics.
2. **Given** focus is within the control, **when** the user uses the native keyboard operations for a three-option choice, **then** exactly one of System, Light, or Dark becomes selected.
3. **Given** color is removed or forced colors are active, **when** any state is selected, **then** the selected preference remains identifiable from text and semantics and the control remains operable.
4. **Given** the consumer supplies localized visible labels, **when** the element renders, **then** those labels are used and the element introduces no consumer-visible fallback copy.

### User Story 2 — Resolve, persist, and follow theme preference (P1)

As a user, my manual preference wins over the operating system, System follows the operating system live, and the resolved result is applied consistently to the document root.

**Independent test**: vary stored values and the system media preference, select each option, simulate media changes and reattachment, and assert root theme state plus listener lifecycle.

**Acceptance scenarios**:

1. **Given** no valid stored preference and a light system preference, **when** theme state initializes, **then** the public preference is System and the resolved root theme and color scheme are light.
2. **Given** no valid stored preference and a dark system preference, **when** theme state initializes, **then** the public preference is System and the resolved root theme and color scheme are dark.
3. **Given** stored Light and a dark system preference, **when** state initializes, **then** Light is selected and the root resolves light.
4. **Given** stored Dark and a light system preference, **when** state initializes, **then** Dark is selected and the root resolves dark.
5. **Given** a manual preference, **when** the system preference later changes, **then** the root does not change.
6. **Given** System is selected, **when** the system preference later changes, **then** the root updates immediately to the new resolved theme and matching color scheme.
7. **Given** a manual preference is selected, **when** the element is reattached or the page reloads, **then** the documented namespaced stored preference restores it.
8. **Given** an invalid stored value, **when** state initializes, **then** it falls back safely to System.
9. **Given** storage access throws or is unavailable, **when** state initializes or changes, **then** current-page selection and root application continue without an uncaught error.
10. **Given** the element leaves System or disconnects, **when** listener state is inspected, **then** no obsolete media-query listener remains; reconnecting never accumulates listeners.

### User Story 3 — Start in the right theme before paint (P1)

As a consumer, I can install a documented pre-paint bootstrap in the document head so the same preference contract applies before stylesheets paint.

**Independent test**: load a consumer fixture whose bootstrap precedes stylesheet links, seed every valid/invalid/storage-failure case, and observe root state before stylesheet-driven rendering.

**Acceptance scenarios**:

1. **Given** the bootstrap is placed in `<head>` before stylesheets, **when** the document loads, **then** root theme and color scheme are resolved before the first styled render.
2. **Given** the same storage/system inputs, **when** bootstrap resolution and element initialization are compared, **then** they accept the same values, use the same key, apply the same root state, and have the same safe fallbacks.
3. **Given** JavaScript is disabled, **when** the page renders, **then** the existing token CSS follows the system default and no broken interactive control is presented.

### User Story 4 — Prove a real composed surface in both themes (P1)

As a design-system evaluator, I can use a generic Factory-pattern Storybook composition to see and mechanically verify the theme preference element re-theme operational cards and facts through public surfaces.

**Independent test**: exercise the composed story in system-light, system-dark, manual-light, and manual-dark cases and measure root state, luminance, and contrast.

**Acceptance scenarios**:

1. **Given** the composed Factory-pattern story, **when** Light and Dark resolve, **then** `document.documentElement.dataset.theme` equals the resolved mode and measured surface luminance distinguishes light from dark exactly.
2. **Given** either resolved theme, **when** surface foreground/background contrast is computed, **then** it meets WCAG AA for normal text.
3. **Given** System with light or dark OS emulation, **when** the story runs, **then** the root and surface match the emulated system theme.
4. **Given** manual Light or Dark opposing the OS, **when** the story runs, **then** the manual theme wins.
5. **Given** forced colors, grayscale, narrow width, or 200% zoom, **when** the story is exercised, **then** selection remains understandable and operable with no lost content or overlap.
6. **Given** multiple stories execute in any order, **when** each story completes or unmounts, **then** root attributes, storage, and listeners are restored so no story contaminates another.
7. **Given** the composition source, **when** public-surface enforcement runs, **then** it uses `sk-theme-toggle`, operationally toned `sk-card`, a facts primitive, public tokens, and public APIs only, with no Factory-specific vocabulary or private-root reach-through.

## Functional requirements

| ID | Requirement | Priority | Status |
|---|---|---:|---|
| FR-001 | Publish exactly one reusable element named `sk-theme-toggle` with the public preference values `system`, `light`, and `dark`; System is the default for missing or invalid storage. | High | Open |
| FR-002 | Expose the preference as a visibly labelled, keyboard-operable three-option single choice with textual and programmatic selected-state indication. | High | Open |
| FR-003 | Permit consumer-supplied/localizable visible option labels and emit no consumer-visible fallback copy contrary to repository i18n policy. | High | Open |
| FR-004 | Persist valid manual selection using one documented namespaced localStorage key; storage failure must not block current-page operation. | High | Open |
| FR-005 | Resolve System through `prefers-color-scheme`, subscribe to subsequent changes only in System, and clean listeners on mode change and disconnect. | High | Open |
| FR-006 | Apply the resolved value to `document.documentElement.dataset.theme` and matching root `color-scheme`. | High | Open |
| FR-007 | Provide one pre-paint bootstrap mechanism documented for `<head>` before stylesheets and governed by the same accepted values, key, resolution, root application, and failure behavior as the element. | High | Open |
| FR-008 | Remain safe to import without DOM globals and document degradation for unavailable JavaScript, localStorage, or matchMedia. | High | Open |
| FR-009 | Preserve control operation and preference persistence in forced colors while visual theming defers to system colors. | High | Open |
| FR-010 | Provide Default/dark, LightMode, system-light, system-dark, manual-light, manual-dark, grayscale, forced-colors, narrow-width, and 200%-zoom evidence with isolated cleanup. | High | Open |
| FR-011 | Extend the generic Factory composition lineage with the toggle, status-toned cards, a facts primitive, and only public design-system surfaces. | High | Open |
| FR-012 | Mechanically assert root resolved theme, distinct computed surface luminance, and AA foreground/background contrast in both themes. | High | Open |
| FR-013 | Generate and publish every current recipe artifact: package exports/barrels, custom-elements manifest, React wrapper and typing, Vue typing if generated by current recipe, static form where the recipe requires one, documentation/ratchets, and size records. | High | Open |
| FR-014 | Register behavior and red-first mutation coverage under ADR-11, including proof that the initial test fails before production behavior exists. | High | Open |

## Non-functional requirements

| ID | Requirement | Category | Priority | Status |
|---|---|---|---:|---|
| NFR-001 | Both resolved themes must meet WCAG 2.2 AA contrast: at least 4.5:1 for normal text and 3:1 where the standard permits large text or UI components. | Accessibility | High | Open |
| NFR-002 | Root updates occur synchronously with initialization, selection, and media changes; the pre-paint mechanism precedes every stylesheet link in its test fixture. | Visual stability | High | Open |
| NFR-003 | Repeated connect/disconnect and preference transitions leave zero leaked or duplicate media-query listeners. | Reliability | High | Open |
| NFR-004 | Importing the element produces no DOM-global exception in a DOM-free runtime. | Portability | High | Open |
| NFR-005 | Every applicable repository quality, build, browser, accessibility, visual, mutation, export, size, supply-chain, lockfile, and commit gate passes on the final rebased exact HEAD. | Release readiness | High | Open |

## Constraints

| ID | Constraint | Priority | Status |
|---|---|---:|---|
| C-001 | Use current `train/elements-first` code and issue #323 as authority; add no new color token or palette. | High | Open |
| C-002 | Maintain one authoritative theme contract; bootstrap and element must not be independent resolver copies. | High | Open |
| C-003 | Do not absorb or close #93; only the smallest shared Storybook change strictly needed by #323 is permitted. | High | Open |
| C-004 | Keep Factory Dashboard vocabulary and application state out of all public component APIs; factory-dashboard #14 remains consumer integration work. | High | Open |
| C-005 | Produce generated wrappers, manifests, barrels, static markup, and size reports with repository generators, never hand-edit them. | High | Open |
| C-006 | Use one bounded work package and one mission PR targeting `train/elements-first`; reference epic #183 without closing it. | High | Open |

## Key state concepts

- **Theme preference**: the public value `system`, `light`, or `dark`.
- **Resolved theme**: the applied `light` or `dark` result.
- **System source**: the current `prefers-color-scheme` result observed only while System is active.
- **Root theme state**: matching root `data-theme` and `color-scheme`.

## Measurable success criteria

- **SC-001**: all ten preference, storage, system, and lifecycle cases in User Story 2 pass with exact root assertions.
- **SC-002**: the accessibility tree exposes one labelled three-option selection model; keyboard, grayscale, and forced-colors checks all pass.
- **SC-003**: bootstrap ordering and parity checks pass for valid, missing, invalid, unavailable, and throwing storage inputs.
- **SC-004**: system-light, system-dark, manual-light, and manual-dark composition cases each assert root state, distinguish light/dark luminance, and meet AA contrast.
- **SC-005**: SSR import, story isolation, narrow-width, and 200% zoom tests pass without uncaught errors, contamination, clipping, overlap, or lost content.
- **SC-006**: current generator checks reproduce every committed artifact byte-for-byte and public wrapper/type tests expose the three-value preference accurately.
- **SC-007**: exact-head independent WP review and the required two-pass pre-merge adversarial squad report no unresolved High or Medium findings.

## Traceability and overlap

- FR-001–FR-012 derive from issue #323 and factory-dashboard #14's generic contract.
- FR-013–FR-014 and C-005 derive from the current component-authoring recipe and ADR-11.
- C-003 preserves open issue #93; #323's root and luminance proof is intentionally narrower.
- C-004 preserves open parent epic #183 and consumer ticket factory-dashboard #14.
- #177 and #259 are shipped dependencies and precedents, not scope to reimplement.
