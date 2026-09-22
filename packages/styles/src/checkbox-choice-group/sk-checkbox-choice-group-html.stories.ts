import "./sk-checkbox-choice-group.css";
import "../button/sk-button.css";
import "../disclosure/sk-disclosure.css";
import type { Meta, StoryObj } from "@storybook/web-components";
import {
  SkCheckboxChoiceGroupDefaultHTML,
  SkCheckboxChoiceGroupDisabledHTML,
  SkCheckboxChoiceGroupLongHTML,
  SkCheckboxChoiceGroupNoneHTML,
  SkCheckboxChoiceGroupZeroCountsHTML,
} from "./index";

const meta: Meta = {
  title: "Form/SkCheckboxChoiceGroup (HTML)",
  tags: ["autodocs"],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const storyFrame = (html: string, light = false, narrow = false): string => `
  <div data-checkbox-choice-group-story-frame${light ? ' class="sk-light"' : ""} style="box-sizing: border-box; inline-size: 100%;${narrow ? " max-inline-size: calc(var(--sk-space-12) * 2);" : ""} padding: var(--sk-space-4); color: var(--sk-fg-body); background: var(--sk-surface-page);">
    ${html}
  </div>
`;

const k3Composition = (): string =>
  storyFrame(`
  <details class="sk-disclosure" open>
    <summary class="sk-disclosure__summary"><span>Detailed lane filters</span><span>2 of 15 work packages</span></summary>
    <div class="sk-disclosure__body">
      <form>
        ${SkCheckboxChoiceGroupDefaultHTML}
        <div style="display: flex; flex-wrap: wrap; gap: var(--sk-space-2); margin-block-start: var(--sk-space-4);">
          <button class="sk-button sk-button--primary sk-button--sm" type="button">Apply</button>
          <button class="sk-button sk-button--ghost sk-button--sm" type="button">Clear</button>
        </div>
      </form>
    </div>
  </details>
`);

export const Default: Story = {
  parameters: { layout: "fullscreen" },
  render: () => storyFrame(SkCheckboxChoiceGroupDefaultHTML),
};

export const K3DetailedLaneFilters: Story = {
  parameters: { layout: "fullscreen" },
  render: k3Composition,
};

export const NoneSelected: Story = {
  render: () => storyFrame(SkCheckboxChoiceGroupNoneHTML),
};

export const SeveralSelected: Story = {
  render: () => storyFrame(SkCheckboxChoiceGroupDefaultHTML),
};

export const ZeroCounts: Story = {
  render: () => storyFrame(SkCheckboxChoiceGroupZeroCountsHTML),
};

export const DisabledChoices: Story = {
  render: () => storyFrame(SkCheckboxChoiceGroupDisabledHTML),
};

export const LongContent: Story = {
  render: () => storyFrame(SkCheckboxChoiceGroupLongHTML),
};

export const Narrow: Story = {
  parameters: {
    viewport: {
      defaultViewport: "checkboxChoiceGroup390",
      options: {
        checkboxChoiceGroup390: {
          name: "Checkbox choice group at 390px",
          styles: { width: "390px", height: "844px" },
        },
      },
    },
  },
  render: () => storyFrame(SkCheckboxChoiceGroupDefaultHTML, false, true),
};

export const FocusStates: Story = {
  render: () => storyFrame(SkCheckboxChoiceGroupDefaultHTML),
  play: async ({ canvasElement }) => {
    canvasElement
      .querySelector<HTMLInputElement>(
        ".sk-checkbox-choice-group__control:not(:checked)",
      )
      ?.focus();
  },
};

export const ForcedColors: Story = {
  render: () => storyFrame(SkCheckboxChoiceGroupDisabledHTML),
};

export const DefaultDark: Story = {
  render: () => storyFrame(SkCheckboxChoiceGroupDefaultHTML),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => storyFrame(SkCheckboxChoiceGroupDefaultHTML, true),
};
