import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './sk-theme-toggle.js';
import { isolateThemeStory } from './theme-story-environment.js';
import type { ThemePreference } from './theme-preference.js';

const frame = (
  preference: ThemePreference,
  options: Readonly<{ light?: boolean; greyscale?: boolean }> = {},
) => html`
  <div
    class=${options.light ? 'sk-light' : ''}
    data-theme-toggle-story
    style=${[
      'box-sizing:border-box',
      'display:grid',
      'gap:var(--sk-space-4)',
      'max-width:calc(var(--sk-space-12) * 5)',
      'padding:var(--sk-space-6)',
      'color:var(--sk-fg-body)',
      'background:var(--sk-surface-page)',
      options.greyscale ? 'filter:grayscale(1)' : '',
    ].filter(Boolean).join(';')}
  >
    <sk-theme-toggle
      data-theme-control
      .preference=${preference}
      label="Theme preference"
      system-label="System"
      light-label="Light"
      dark-label="Dark"
    ></sk-theme-toggle>
    <p style="margin:0;font-family:var(--sk-font-sans);font-size:var(--sk-text-base);">
      Choose whether this page follows your system or uses a manual theme.
    </p>
  </div>
`;

const parameters = (preference: ThemePreference, description: string) => ({
  themePreference: preference,
  docs: { description: { story: description } },
});

const meta = {
  title: 'Elements/SkThemeToggle',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'A labelled native three-choice preference control for System, Light, and Dark. ' +
          'The consumer supplies every visible label; the selected text and radio semantics ' +
          'remain understandable without colour.',
      },
    },
  },
  beforeEach: isolateThemeStory,
  render: () => frame('dark'),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: parameters('dark', 'The default example uses a persisted manual Dark preference.'),
};

export const System: Story = {
  parameters: parameters('system', 'System follows the current prefers-color-scheme value.'),
  render: () => frame('system'),
};

export const ManualLight: Story = {
  parameters: parameters('light', 'A manual Light preference overrides the operating system.'),
  render: () => frame('light'),
};

export const Greyscale: Story = {
  parameters: parameters(
    'dark',
    'The selected option remains explicit through text, checked state, weight, and border style.',
  ),
  render: () => frame('dark', { greyscale: true }),
};

export const ForcedColors: Story = {
  parameters: parameters(
    'system',
    'Use forced-colors emulation to verify all three native choices remain visible and operable.',
  ),
  render: () => frame('system'),
};

export const Narrow: Story = {
  parameters: {
    ...parameters('system', 'The choices wrap without clipping at a narrow viewport.'),
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => frame('system'),
};

export const LightMode: Story = {
  parameters: {
    ...parameters('light', 'The required LightMode variant resolves Light on the document root.'),
    backgrounds: { default: 'sk-light' },
  },
  render: () => frame('light', { light: true }),
};
