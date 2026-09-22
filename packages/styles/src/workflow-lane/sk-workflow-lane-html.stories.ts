import "./sk-workflow-lane.css";
import "../empty-state/sk-empty-state.css";
import type { Meta, StoryObj } from "@storybook/web-components";
import { SkWorkflowLaneDefaultHTML, SkWorkflowLaneEmptyHTML } from "./index";

const meta: Meta = {
  title: "Primitives/SkWorkflowLane (HTML)",
  tags: ["autodocs"],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => SkWorkflowLaneDefaultHTML };

export const Empty: Story = { render: () => SkWorkflowLaneEmptyHTML };

export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => `
    <div class="sk-light" style="padding: var(--sk-space-4); color: var(--sk-fg-body); background: var(--sk-surface-page);">
      ${SkWorkflowLaneDefaultHTML}
    </div>
  `,
};
