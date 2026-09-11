import "../../../packages/tokens/src/tokens.css";
// #176's content primitives, loaded globally for the same reason tokens.css is: they style
// LIGHT-DOM markup. #177 composes facts and disclosure inside an <sk-card>'s default slot, and
// #213 composes empty-state beside check bullets when there are no subtasks — all stay in the
// document's cascade rather than an element's shadow root.
//
// It has to be here rather than in the story file, and the reason is two rules meeting:
// packages/elements may not import a stylesheet at all (scripts/check-no-css-in-source.mjs,
// ADR-10 §1 Confirmation #4), and packages/styles may not import an element
// (@nx/enforce-module-boundaries: scope:styles depends on scope:tokens only). A story that
// composes an element with a styles-layer class therefore has no layer of its own to import
// from. `scope:storybook` is the one project allowed to reach both.
//
// Both rulesets are class-scoped, so this changes nothing for any story that does not use the
// classes — which is what keeps it out of the axe gate's way.
import "../../../packages/styles/src/facts/sk-facts.css";
import "../../../packages/styles/src/disclosure/sk-disclosure.css";
import "../../../packages/styles/src/empty-state/sk-empty-state.css";
import "../../../packages/styles/src/breadcrumbs/sk-breadcrumbs.css";
import "../../../packages/styles/src/checkbox-choice-group/sk-checkbox-choice-group.css";
import "../../../packages/styles/src/radio-choice-group/sk-radio-choice-group.css";
import "../../../packages/styles/src/section-nav/sk-section-nav.css";
// #338's connectors pattern renders native `<button>`/`<a class="sk-button sk-button--*">` light-DOM
// markup (ADR-9 §4: a `<button>` inside `sk-button`'s shadow root cannot participate in an ancestor
// `<form>`). Verified missing by the pre-merge squad against the BUILT preview, not by reasoning:
// the linked stylesheet carried zero `.sk-button` rules and the connectors chunk loads no CSS chunk
// at all — every connectors canvas painted UA-default buttons, including #320's
// `.sk-button--danger-secondary` at the two places this pattern actually needs it (C8, C9a).
import "../../../packages/styles/src/button/sk-button.css";
import "../../../packages/styles/src/context-nav/sk-context-nav.css";
import "../../../packages/styles/src/data-table/sk-data-table.css";
import "../../../packages/styles/src/event-timeline/sk-event-timeline.css";
import "../../../packages/styles/src/form-field/sk-form-field.css";
import "../../../packages/styles/src/form-select/sk-form-select.css";
import "../../../packages/styles/src/collection/sk-collection.css";
import "../../../packages/styles/src/segmented-choice/sk-segmented-choice.css";
import "../../../packages/styles/src/progress/sk-progress.css";
import "../../../packages/styles/src/prose/sk-prose.css";
import "../../../packages/styles/src/workflow-board/sk-workflow-board.css";
import "../../../packages/styles/src/workflow-lane/sk-workflow-lane.css";
// FOUR MORE, ADDED BY #355 FOR THE SAME REASON AND UNDER THE SAME INVARIANT. The account /
// front-door pattern (packages/elements/src/patterns/account-front-door.stories.ts) composes
// custom elements with four STYLES-ONLY families that ship no custom element of their own
// (ADR-10 §3): public-header (#353), boundary-page (#303), radio-choice-group and skip-link. The
// pattern story cannot import their CSS itself — `scripts/check-no-css-in-source.mjs` rejects a
// bare stylesheet import anywhere under packages/elements/src (FR-009, ADR-10 §1 Confirmation
// #4), and it rejected exactly that, which is how this landed here instead. The block above is
// the documented route for the case, and this is that case.
//
// Without them every class in those four families paints with the browser's UNSTYLED default —
// measured: an unstyled <a> under a dark `color-scheme` renders rgb(158, 158, 255), an axe
// colour-contrast violation.
//
// The line-14 invariant holds for all four: every top-level selector in the four sheets is a
// `.sk-<family>` class or a `:where(.sk-<family>__*) ...` descendant of one, so a story that does
// not use the classes is unaffected and the axe gate sees no change.
import "../../../packages/styles/src/public-header/sk-public-header.css";
import "../../../packages/styles/src/boundary-page/sk-boundary-page.css";
import "../../../packages/styles/src/radio-choice-group/sk-radio-choice-group.css";
import "../../../packages/styles/src/skip-link/sk-skip-link.css";
// #303's sk-boundary-page is the mirror-image case of the block above: a styles-only, no-element
// FRAME (packages/styles, scope:styles) composing an already-shipped CUSTOM ELEMENT
// (sk-entity-marker #304) as an opaque child in its own plain HTML exemplars — never the other
// way around. Its own CSS sets no default size/shape/border on it (research.md Decision 2) and
// reaches into it via no `::part()` (spec C-005). sk-pill-tag is NOT registered here: after this
// mission's review-remediation pass, the composed status pill is authored as the STYLES-LAYER
// span form (`<span class="sk-pill-tag sk-pill-tag--status-<tone>">`, exactly what
// packages/styles/src/pill-tag/sk-pill-tag.html ships), not `<sk-pill-tag status="...">` — the
// custom element's `status` is a PROPERTY, and `pillTagClasses()` puts the tone modifier on the
// SHADOW `<span part="tag">`, so a class on the light-DOM `<sk-pill-tag>` host never reaches it.
// sk-boundary-page-html.stories.ts imports packages/styles/src/pill-tag/sk-pill-tag.css directly
// instead (an intra-project import within the single `styles` nx project, not a cross-project
// one `@nx/enforce-module-boundaries` would constrain), so no element registration is needed for
// it at all.
//
// sk-entity-marker still needs registering here, and the reason is checked, not assumed: a
// styles-only component has no layer of its own to import a custom element's definition from,
// and `scope:storybook` is the one project allowed to reach both scope:styles and scope:elements
// (see the depConstraints in eslint.config.mjs). Probed directly (this mission's review pass) —
// a bare `import "@spec-kitty/elements"` from inside packages/styles fails as a CIRCULAR
// DEPENDENCY (`Circular dependency between "styles" and "elements" detected: styles -> elements
// -> styles`), not the `scope:styles` depConstraint an earlier revision of this comment implied
// (elements itself depends on styles, so styles importing elements closes a cycle, and nx's
// circular-dependency check fires before the depConstraints check gets a chance to); a relative
// path (`import "../../elements/src/..."`) fails separately, with "Projects cannot be imported
// by a relative or absolute path, and must begin with a npm scope"; and a deep subpath import
// (`@spec-kitty/elements/entity-marker/...`) raises NO lint error at all, because it is simply
// unmapped in `tsconfig.base.json`'s `paths` (only the package root and a `/dist/*` alias exist
// there) — it would fail at resolution time, not at lint time. None of the three is a route
// packages/styles can take; `scope:storybook` importing the built element module, here, is the
// only one that works.
import "../../../packages/elements/src/entity-marker/sk-entity-marker.js";
// #303's own styles-layer sheet — its stories load it via an intra-project import (see
// sk-boundary-page-html.stories.ts), but #329's CLI Auth pattern lives in packages/elements
// (scope:elements), which may not import a stylesheet at all, so it needs the same
// scope:storybook global-import route as the sk-button.css case directly below.
import "../../../packages/styles/src/boundary-page/sk-boundary-page.css";
// #329's CLI Auth pattern renders its three native form actions as
// `<button type="submit" class="sk-button sk-button--*">` rather than `<sk-button>`: a
// shadow-root `<button>` cannot submit an enclosing form (`type="button"` is hard-coded in
// sk-button.ts), so a story proving a native-form flow composes the styles-layer class
// directly — the same two-rule reach this file's own header comment explains.
import "../../../packages/styles/src/button/sk-button.css";
import type { Preview } from "@storybook/web-components";

const preview: Preview = {
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
    layout: "centered",
  },
};

export default preview;
