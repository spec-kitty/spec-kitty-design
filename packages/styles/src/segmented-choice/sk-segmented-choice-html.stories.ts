import "./sk-segmented-choice.css";
import type { Meta, StoryObj } from "@storybook/web-components";
import {
  SkSegmentedChoiceAllDisabledHTML,
  SkSegmentedChoiceDefaultHTML,
  SkSegmentedChoiceFiveItemsHTML,
  SkSegmentedChoiceLongLabelsHTML,
  SkSegmentedChoiceNoSelectionHTML,
  SkSegmentedChoiceOneDisabledHTML,
  SkSegmentedChoiceSecondSelectedHTML,
  SkSegmentedChoiceThirdSelectedHTML,
  SkSegmentedChoiceTwoItemsHTML,
} from "./index";

const meta: Meta = {
  title: "Components/SkSegmentedChoice (HTML)",
  tags: ["autodocs"],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const storyFrame = (
  html: string,
  light = false,
  constrainForWrap = false,
): string => `
  <div data-segmented-choice-story-frame${light ? ' class="sk-light"' : ""} style="box-sizing: border-box; inline-size: 100%;${constrainForWrap ? " max-inline-size: calc(var(--sk-space-10) * 2);" : ""} padding: var(--sk-space-4); color: var(--sk-fg-body); background: var(--sk-surface-page);">
    ${html}
  </div>
`;

export const Default: Story = {
  render: () => storyFrame(SkSegmentedChoiceDefaultHTML),
};

export const SecondSelected: Story = {
  render: () => storyFrame(SkSegmentedChoiceSecondSelectedHTML),
};

export const ThirdSelected: Story = {
  render: () => storyFrame(SkSegmentedChoiceThirdSelectedHTML),
};

export const TwoItems: Story = {
  render: () => storyFrame(SkSegmentedChoiceTwoItemsHTML),
};

export const FiveItems: Story = {
  render: () => storyFrame(SkSegmentedChoiceFiveItemsHTML),
};

export const LongLabels: Story = {
  render: () => storyFrame(SkSegmentedChoiceLongLabelsHTML),
};

export const NoSelection: Story = {
  render: () => storyFrame(SkSegmentedChoiceNoSelectionHTML),
};

export const AllDisabled: Story = {
  render: () => storyFrame(SkSegmentedChoiceAllDisabledHTML),
};

export const OneDisabled: Story = {
  render: () => storyFrame(SkSegmentedChoiceOneDisabledHTML),
};

export const Narrow: Story = {
  parameters: {
    viewport: {
      defaultViewport: "segmentedChoice1024",
      options: {
        segmentedChoice1024: {
          name: "Segmented choice at 1024px",
          styles: { width: "1024px", height: "768px" },
        },
      },
    },
  },
  render: () => storyFrame(SkSegmentedChoiceDefaultHTML, false, true),
};

export const ForcedColors: Story = {
  render: () => storyFrame(SkSegmentedChoiceOneDisabledHTML),
};

export const DefaultDark: Story = {
  render: () => storyFrame(SkSegmentedChoiceDefaultHTML),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => storyFrame(SkSegmentedChoiceDefaultHTML, true),
};
