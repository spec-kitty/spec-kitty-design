import "./sk-event-timeline.css";
import "../empty-state/sk-empty-state.css";
import type { Meta, StoryObj } from "@storybook/web-components";
import {
  SkEventTimelineCompactDefaultHTML,
  SkEventTimelineCompactDegradedHTML,
  SkEventTimelineCompactForcedColorsHTML,
  SkEventTimelineCompactLeadingMarkerHTML,
  SkEventTimelineCompactLinkedHTML,
  SkEventTimelineCompactLongContentHTML,
  SkEventTimelineCompactNarrowHTML,
  SkEventTimelineCompactOneEventHTML,
  SkEventTimelineCompactTwentyEventsHTML,
  SkEventTimelineForcedColorsHTML,
  SkEventTimelineLongTransitionHTML,
  SkEventTimelineNarrowHTML,
  SkEventTimelineOneEventHTML,
  SkEventTimelineTwentyEventsHTML,
  SkEventTimelineTwoEventsHTML,
  SkEventTimelineUnavailableRetentionHTML,
  SkEventTimelineVerifiedMarkerHTML,
} from "./index";

const frame = (html: string, light = false) => `
  <div${light ? ' class="sk-light"' : ""} style="box-sizing:border-box;inline-size:100%;padding:var(--sk-space-4);background:var(--sk-surface-page);color:var(--sk-fg-body);">
    ${html}
  </div>`;

const meta: Meta = {
  title: "Primitives/SkEventTimeline (HTML)",
  tags: ["autodocs"],
  parameters: { a11y: { disable: false }, layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => frame(SkEventTimelineTwoEventsHTML),
};
export const OneEvent: Story = {
  render: () => frame(SkEventTimelineOneEventHTML),
};
export const TwoEvents: Story = {
  render: () => frame(SkEventTimelineTwoEventsHTML),
};
export const TwentyEvents: Story = {
  render: () => frame(SkEventTimelineTwentyEventsHTML),
};
export const LongTransition: Story = {
  render: () => frame(SkEventTimelineLongTransitionHTML),
};
export const VerifiedMarker: Story = {
  render: () => frame(SkEventTimelineVerifiedMarkerHTML),
};
export const UnavailableRetention: Story = {
  render: () => frame(SkEventTimelineUnavailableRetentionHTML),
};
export const Narrow: Story = { render: () => frame(SkEventTimelineNarrowHTML) };
export const ForcedColors: Story = {
  render: () => frame(SkEventTimelineForcedColorsHTML),
};
export const LightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => frame(SkEventTimelineTwoEventsHTML, true),
};

export const CompactOneEvent: Story = {
  render: () => frame(SkEventTimelineCompactOneEventHTML),
};
export const CompactDefault: Story = {
  render: () => frame(SkEventTimelineCompactDefaultHTML),
};
export const CompactTwentyEvents: Story = {
  render: () => frame(SkEventTimelineCompactTwentyEventsHTML),
};
export const CompactLeadingMarker: Story = {
  render: () => frame(SkEventTimelineCompactLeadingMarkerHTML),
};
export const CompactLongContent: Story = {
  render: () => frame(SkEventTimelineCompactLongContentHTML),
};
export const CompactLinked: Story = {
  render: () => frame(SkEventTimelineCompactLinkedHTML),
};
export const CompactNarrow: Story = {
  render: () => frame(SkEventTimelineCompactNarrowHTML),
};
export const CompactDegraded: Story = {
  render: () => frame(SkEventTimelineCompactDegradedHTML),
};
export const CompactForcedColors: Story = {
  render: () => frame(SkEventTimelineCompactForcedColorsHTML),
};
export const CompactLightMode: Story = {
  parameters: { backgrounds: { default: "sk-light" } },
  render: () => frame(SkEventTimelineCompactDefaultHTML, true),
};
