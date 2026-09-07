import './sk-form-select.css';
import '../form-field/sk-form-field.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import {
  SkFormSelectCompactHTML,
  SkFormSelectDisabledHTML,
  SkFormSelectLongOptionsHTML,
  SkFormSelectOptgroupsHTML,
  SkFormSelectRequiredInvalidHTML,
  SkFormSelectT10LaneHTML,
  SkFormSelectT12FiltersHTML,
} from './index';

const meta: Meta = {
  title: 'Form/SkFormSelect (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

const storyFrame = (html: string, light = false): string => `
  <div data-form-select-story-frame${light ? ' class="sk-light"' : ''} style="box-sizing: border-box; inline-size: 100%; padding: var(--sk-space-4); color: var(--sk-fg-body); background: var(--sk-surface-page);">
    ${html}
  </div>
`;

/** T10 lane choice and the canonical default-dark, full-width route. */
export const Default: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => storyFrame(SkFormSelectT10LaneHTML),
};

/** T12 recurrence: two independently named native filters. */
export const T12TwoFilters: Story = {
  render: () => storyFrame(SkFormSelectT12FiltersHTML),
};

export const Compact: Story = {
  render: () => storyFrame(SkFormSelectCompactHTML),
};

export const LongOptions: Story = {
  render: () => storyFrame(SkFormSelectLongOptionsHTML),
};

export const Optgroups: Story = {
  render: () => storyFrame(SkFormSelectOptgroupsHTML),
};

export const RequiredInvalid: Story = {
  render: () => storyFrame(SkFormSelectRequiredInvalidHTML),
};

export const Disabled: Story = {
  render: () => storyFrame(SkFormSelectDisabledHTML),
};

/** Narrowness is a consumer viewport axis, so this reuses the T10 fixture. */
export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => storyFrame(SkFormSelectT10LaneHTML),
};

/** The browser tests activate forced colors; this route keeps the invalid cue in frame. */
export const ForcedColors: Story = {
  render: () => storyFrame(SkFormSelectRequiredInvalidHTML),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => storyFrame(SkFormSelectT10LaneHTML, true),
};
