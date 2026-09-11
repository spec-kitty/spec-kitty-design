import "./sk-radio-choice-group.css";
import type { Meta, StoryObj } from "@storybook/web-components";
import {
  SkRadioChoiceGroupDefaultHTML,
  SkRadioChoiceGroupDisabledGroupHTML,
  SkRadioChoiceGroupDisabledHTML,
  SkRadioChoiceGroupLongHTML,
  SkRadioChoiceGroupNoneHTML,
  SkRadioChoiceGroupOneHTML,
  SkRadioChoiceGroupRequiredInvalidHTML,
  SkRadioChoiceGroupTwoHTML,
} from "./index";

const meta: Meta = {
  title: "Form/SkRadioChoiceGroup (HTML)",
  tags: ["autodocs"],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const storyFrame = (
  html: string,
  light = false,
  narrow = false,
  rtl = false,
): string => `
  <div data-radio-choice-group-story-frame${light ? ' class="sk-light"' : ""}${rtl ? ' dir="rtl"' : ""} style="box-sizing: border-box; inline-size: 100%;${narrow ? " max-inline-size: calc(var(--sk-space-12) * 2);" : ""} padding: var(--sk-space-4); color: var(--sk-fg-body); background: var(--sk-surface-page);">
    ${html}
  </div>
`;

export const Default: Story = {
  parameters: { layout: "fullscreen" },
  render: () => storyFrame(SkRadioChoiceGroupDefaultHTML),
};

export const TwoChoice: Story = {
  render: () => storyFrame(SkRadioChoiceGroupTwoHTML),
};

export const OneOption: Story = {
  render: () => storyFrame(SkRadioChoiceGroupOneHTML),
};

export const NoneSelected: Story = {
  render: () => storyFrame(SkRadioChoiceGroupNoneHTML),
};

export const RequiredInvalid: Story = {
  render: () => storyFrame(SkRadioChoiceGroupRequiredInvalidHTML),
};

export const DisabledOption: Story = {
  render: () => storyFrame(SkRadioChoiceGroupDisabledHTML),
};

export const DisabledGroup: Story = {
  render: () => storyFrame(SkRadioChoiceGroupDisabledGroupHTML),
};

export const LongContent: Story = {
  render: () => storyFrame(SkRadioChoiceGroupLongHTML),
};

export const Narrow: Story = {
  parameters: {
    viewport: {
      defaultViewport: "radioChoiceGroup390",
      options: {
        radioChoiceGroup390: {
          name: "Radio choice group at 390px",
          styles: { width: "390px", height: "844px" },
        },
      },
    },
  },
  render: () => storyFrame(SkRadioChoiceGroupDefaultHTML, false, true),
};

export const RTL: Story = {
  parameters: { layout: "fullscreen" },
  render: () => storyFrame(SkRadioChoiceGroupDefaultHTML, false, false, true),
};

export const FocusStates: Story = {
  render: () => storyFrame(SkRadioChoiceGroupDefaultHTML),
  play: async ({ canvasElement }) => {
    canvasElement
      .querySelector<HTMLInputElement>(
        ".sk-radio-choice-group__control:not(:checked)",
      )
      ?.focus();
  },
};

export const ForcedColors: Story = {
  render: () => storyFrame(SkRadioChoiceGroupDisabledHTML),
};

export const DefaultDark: Story = {
  render: () => storyFrame(SkRadioChoiceGroupDefaultHTML),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => storyFrame(SkRadioChoiceGroupDefaultHTML, true),
};
