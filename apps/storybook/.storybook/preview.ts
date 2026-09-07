import '../../../packages/tokens/src/tokens.css';
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
import '../../../packages/styles/src/facts/sk-facts.css';
import '../../../packages/styles/src/disclosure/sk-disclosure.css';
import '../../../packages/styles/src/empty-state/sk-empty-state.css';
import '../../../packages/styles/src/breadcrumbs/sk-breadcrumbs.css';
import '../../../packages/styles/src/event-timeline/sk-event-timeline.css';
import '../../../packages/styles/src/form-field/sk-form-field.css';
import '../../../packages/styles/src/form-select/sk-form-select.css';
import '../../../packages/styles/src/progress/sk-progress.css';
import '../../../packages/styles/src/prose/sk-prose.css';
import '../../../packages/styles/src/workflow-board/sk-workflow-board.css';
import '../../../packages/styles/src/workflow-lane/sk-workflow-lane.css';
import type { Preview } from '@storybook/web-components';

const preview: Preview = {
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
    layout: 'centered',
  },
};

export default preview;
