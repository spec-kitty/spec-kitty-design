# Research — `sk-theme-toggle`

Audience: the architect and implementer who must turn issue #323 into a single reviewable work package without inventing product scope.

## Authority and current state

- Functional authority: https://github.com/spec-kitty/spec-kitty-design/issues/323 (open; no comments as of 2026-09-10).
- Implementation authority: `origin/train/elements-first` at starting SHA `4d4031fa2416ceaadcb0c51f313386c3dee3db36`.
- Consumer contract: https://github.com/spec-kitty/factory-dashboard/issues/14 (open; consumer integration remains outside this mission).
- Related design-system work: #76 closed (current component recipe), #177 closed (status-tone tokens/API), #259 closed (public-surface Factory-pattern composition), #93 open (two remaining inert LightMode wrappers), and #183 open (parent epic).
- No open PR implements `sk-theme-toggle`, theme persistence, a system preference listener, or a pre-paint bootstrap. PR #325 is an independent base-train fix for unrelated hard-coded global story totals and must not be absorbed.
- No local doc-kitty checkout is available. The verified precedent is the evidence recorded by #323 and factory-dashboard #14: `starlight-theme`, root `data-theme`, OS emulation plus storage seeding, and luminance assertions.

## Terms and product decisions

1. **Preference** is exactly one of `system`, `light`, or `dark`. Missing or invalid storage means `system`; no fourth value exists.
2. **Resolved theme** is exactly `light` or `dark`. In `system`, it follows `prefers-color-scheme`; a manual preference overrides the OS.
3. **Root application** means both `document.documentElement.dataset.theme` and the root `color-scheme` agree with the resolved theme. A nested `data-theme` wrapper is not evidence.
4. **Theme control semantics** are a labelled three-option single choice, not a binary switch. Native radio-group/segmented-choice semantics supply arrow-key and direct-option operation without misrepresenting the model.
5. **Persistence** uses one documented design-system namespaced key. Storage failures degrade in-memory and must not stop root application.
6. **System lifecycle** means one safe media-query subscription while connected and selected as `system`, no subscription in manual modes, and complete cleanup on mode change or disconnect.
7. **No-JS degradation** means tokens continue to follow the system default through CSS and no broken interactive affordance is presented; enhancement owns persistence and manual selection.
8. **Forced-colors** keeps the semantic control operable and state text/selection perceivable while authored palette theming yields to system colors.

## One-authority contract to carry into planning

The element and the pre-paint mechanism must share a single contract for the namespaced key, accepted values, invalid fallback, system resolution, and root application. Current demo scripts in `apps/demo/blog-demo.html` and `apps/demo/dashboard-demo.html` are older two-state, post-body implementations and are not the authority. The plan must select a repository-compatible shape that gives the inline head bootstrap pre-paint behavior without copying those rules into an independently maintained resolver.

Required observable cases:

- no storage + system light/dark;
- stored light over dark OS and stored dark over light OS;
- returning to system and reacting to later OS changes;
- manual mode ignoring later OS changes;
- persistence across reload/reattachment;
- invalid or throwing storage;
- matching root attribute and `color-scheme`;
- listener install/remove without leaks;
- SSR-safe module import;
- bootstrap before stylesheets and behavior parity with the element.

## Repository precedents and constraints

- Follow `docs/contributing/adding-a-component.md`: CSS source in styles, element/markup source in elements, generated static form/barrels/manifest/React/Vue wrappers from repository generators, exact doc/part/story ratchets, behavior registration, and one red-first mutation per subject.
- `packages/tokens/src/tokens.css` already owns dark defaults plus `:root[data-theme="light"], .sk-light` overrides. No palette or new color tokens are licensed.
- Factory composition lineage is `packages/elements/src/patterns/operational-status.ts` and its stories/tests; `scripts/check-pattern-composition.mjs` polices public-surface-only composition.
- #323 must extend or add a generic Factory-pattern proof using `sk-theme-toggle`, operationally toned `sk-card`, a facts primitive, and public tokens/APIs. Factory vocabulary, auth, routing, refresh, jobs, queues, and data remain consumer-owned.
- #93 remains open. Current inert wrappers are recorded in `expected-inert-theme-wrappers.json`; #323 proves its own root resolver and does not claim repository-wide LightMode repair.
- Issue #286 prohibits consumer-visible fallback literals in element rendering. Visible labels must be consumer-supplied or use an established translatable public surface, while accessibility cannot depend on color alone.

## Evidence obligations

Use discriminating tests, including system-light/system-dark, manual overrides, invalid/throwing storage, live media changes, cleanup, SSR import, semantics/keyboard behavior, textual state, forced colors, no-JS, bootstrap ordering, exact luminance distinction, AA contrast in both themes, story isolation, narrow width, 200% zoom, generated artifact checks, React typing, and absence of unauthorized fallback copy. Register behavior/mutation coverage under ADR-11.

## Scope boundary and risks

- Do not change token values merely to make a proof pass; record a genuine missing semantic token as a follow-up.
- Do not repair the two remaining #93 wrappers unless the smallest #323 composition seam strictly requires it.
- Shared generated files will conflict with currently open component PRs; regenerate after the final train rebase.
- PR #325 must land or its base failure must be classified with base evidence before this story-adding mission can be green.
- Exact-head adversarial review is a project merge gate: all architecture, runtime-failure, acceptance/accessibility, and semantic-compression lenses must report against the same final SHA, with a second pass after folded findings.

No unresolved product decision remains. Storage-key spelling and code layout are architectural decisions for the plan, constrained by the single-authority contract above.
