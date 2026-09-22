import "./sk-breadcrumbs.css";
import type { Meta, StoryObj } from "@storybook/web-components";
import {
  SkBreadcrumbsForcedColorsHTML,
  SkBreadcrumbsLongLabelsHTML,
  SkBreadcrumbsNarrowHTML,
  SkBreadcrumbsOneLevelHTML,
  SkBreadcrumbsSixLevelHTML,
  SkBreadcrumbsThreeLevelHTML,
} from "./index";

const frame = (html: string, light = false) => `
  <div${light ? ' class="sk-light"' : ""} style="box-sizing:border-box;inline-size:100%;padding:var(--sk-space-4);background:var(--sk-surface-page);color:var(--sk-fg-body);">
    ${html}
  </div>`;

const meta: Meta = {
  title: "Primitives/SkBreadcrumbs (HTML)",
  tags: ["autodocs"],
  parameters: { a11y: { disable: false }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => frame(SkBreadcrumbsThreeLevelHTML),
};
export const OneLevel: Story = {
  render: () => frame(SkBreadcrumbsOneLevelHTML),
};
export const ThreeLevel: Story = {
  render: () => frame(SkBreadcrumbsThreeLevelHTML),
};
export const SixLevel: Story = {
  render: () => frame(SkBreadcrumbsSixLevelHTML),
};
export const LongLabels: Story = {
  render: () => frame(SkBreadcrumbsLongLabelsHTML),
};
export const Narrow: Story = { render: () => frame(SkBreadcrumbsNarrowHTML) };
export const ForcedColors: Story = {
  render: () => frame(SkBreadcrumbsForcedColorsHTML),
};
export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => frame(SkBreadcrumbsThreeLevelHTML, true),
};
