import "./sk-workflow-board.css";
import "../workflow-lane/sk-workflow-lane.css";
import "../empty-state/sk-empty-state.css";
import type { Meta, StoryObj } from "@storybook/web-components";
import {
  SkWorkflowBoardAllEmptyHTML,
  SkWorkflowBoardFiftyItemsHTML,
  SkWorkflowBoardFittingHTML,
  SkWorkflowBoardLongLabelsAndItemsHTML,
  SkWorkflowBoardOneEmptyLaneHTML,
  SkWorkflowBoardPopulatedHTML,
  SkWorkflowBoardSingleLaneNarrowHTML,
} from "./index";

const meta: Meta = {
  title: "Primitives/SkWorkflowBoard (HTML)",
  tags: ["autodocs"],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const storyFrame = (html: string, light = false): string => `
  <div${light ? ' class="sk-light"' : ""} style="box-sizing: border-box; max-inline-size: 100%; padding: var(--sk-space-4); color: var(--sk-fg-body); background: var(--sk-surface-page);">
    ${html}
  </div>
`;

/** Canonical five-lane dark reference; the scroller is measured to overflow. */
export const Default: Story = {
  render: () => storyFrame(SkWorkflowBoardPopulatedHTML),
};

/** Separately addressable T10 five-lane evidence state. */
export const Populated: Story = {
  render: () => storyFrame(SkWorkflowBoardPopulatedHTML),
};

/** Wide control: the same five-lane density fits and therefore omits the scroller triad. */
export const Fitting: Story = {
  render: () => storyFrame(SkWorkflowBoardFittingHTML),
};

/** Five named lanes, five empty ordered lists, five sibling supplied empty treatments. */
export const AllEmpty: Story = {
  render: () => storyFrame(SkWorkflowBoardAllEmptyHTML),
};

/** Exactly one lane is empty; its empty treatment remains outside its ordered list. */
export const OneEmptyLane: Story = {
  render: () => storyFrame(SkWorkflowBoardOneEmptyLaneHTML),
};

/** Fifty source-ordered native list items; no filter or virtualization. */
export const FiftyItems: Story = {
  render: () => storyFrame(SkWorkflowBoardFiftyItemsHTML),
};

/** Long opaque content and a focusable descendant exercise wrapping and focus containment. */
export const LongLabelsAndItems: Story = {
  render: () => storyFrame(SkWorkflowBoardLongLabelsAndItemsHTML),
};

/** Consumer supplies exactly one selected lane; the styles hold no hidden peers or state. */
export const SingleLaneNarrow: Story = {
  render: () => storyFrame(SkWorkflowBoardSingleLaneNarrowHTML),
};

/** Uses the real overflowing/empty composition; the visual and browser gates emulate forced colors. */
export const ForcedColors: Story = {
  render: () => storyFrame(SkWorkflowBoardOneEmptyLaneHTML),
};

/** Paired with LightMode for non-vacuous token-theme evidence. */
export const DefaultDark: Story = {
  render: () => storyFrame(SkWorkflowBoardPopulatedHTML),
};

/** Real light mode uses the inherited `.sk-light` token override, never a component theme selector. */
export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => storyFrame(SkWorkflowBoardPopulatedHTML, true),
};
