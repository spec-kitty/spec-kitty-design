import "./sk-prose.css";
import "../data-table/sk-data-table.css";
import "../empty-state/sk-empty-state.css";
import type { Meta, StoryObj } from "@storybook/web-components";
import {
  SkProseAbsentPromptHTML,
  SkProseLongCodeHTML,
  SkProseNarrowHTML,
  SkProsePromptHTML,
  SkProseWideTableHTML,
} from "./index";

const frame = (html: string, light = false) => `
  <div${light ? ' class="sk-light"' : ""} style="box-sizing:border-box;inline-size:100%;padding:var(--sk-space-4);background:var(--sk-surface-page);color:var(--sk-fg-body);">
    ${html}
  </div>`;

const meta: Meta = {
  title: "Primitives/SkProse (HTML)",
  tags: ["autodocs"],
  parameters: { a11y: { disable: false }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => frame(SkProsePromptHTML) };
export const Prompt: Story = { render: () => frame(SkProsePromptHTML) };
export const LongCode: Story = { render: () => frame(SkProseLongCodeHTML) };
export const WideTable: Story = { render: () => frame(SkProseWideTableHTML) };
export const AbsentPrompt: Story = {
  render: () => frame(SkProseAbsentPromptHTML),
};
export const Narrow: Story = { render: () => frame(SkProseNarrowHTML) };
export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => frame(SkProsePromptHTML, true),
};
