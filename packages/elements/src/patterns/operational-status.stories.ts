/**
 * Stories for the #183 composition fixture (#259).
 *
 * THE STORIES ARE NOT THE PROOF. `expected-stories.json` ratchets story IDS — that a story
 * exists, at a stable id, so a silent deletion reds. It says nothing about whether the
 * composition still composes. The precedent this file deliberately does not copy is
 * `team-overview.stories.ts`: six ratcheted ids, no behaviour test.
 *
 * The proof is split three ways over ONE authored artefact, `./operational-status.js`:
 *
 *   * these stories               — visual, autodocs, axe, LightMode, narrow viewport
 *   * pattern-operational-status  — slot assignment, list semantics across the slot
 *     .test.ts (behaviour suite)    boundary, native disclosure state, the published gap literal
 *   * check-pattern-composition   — no reach-through, no undeclared part, no duplicated
 *     .mjs (lint-code, ENFORCED)    component CSS, with its own probe table
 *
 * `mutations.json` carries a red-first arm against the composition module, so the behaviour
 * test is known to go red when the composition breaks rather than assumed to.
 */
import type { Meta, StoryObj } from '@storybook/web-components';
import { OPERATIONAL_MODEL, renderOperationalStatus } from './operational-status.js';
import { isolateThemeStory } from '../theme-toggle/theme-story-environment.js';
import type { ThemePreference } from '../theme-toggle/theme-preference.js';

const themeParameters = (preference: ThemePreference, description: string) => ({
  themePreference: preference,
  docs: { description: { story: description } },
});

const meta = {
  title: 'Patterns/Operational Status',
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The #183 composition fixture. An operational page header, a live status region, ' +
          'toned status cards carrying fact blocks and collapsible detail, and a gap-aware time ' +
          'series — assembled from public slots, parts, attributes and tokens only. No element ' +
          'is subclassed, no shadow root is reached into, and no component CSS is restated.',
      },
    },
  },
  beforeEach: isolateThemeStory,
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'dark' }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: themeParameters('dark', 'The default operational composition resolved to Dark.'),
};

export const LightMode: Story = {
  parameters: {
    ...themeParameters('light', 'The required LightMode composition resolved on the document root.'),
    backgrounds: { default: 'sk-light' },
  },
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { light: true, preference: 'light' }),
};

export const SystemLight: Story = {
  parameters: themeParameters(
    'system',
    'System preference under a light operating-system preference; browser tests emulate the media query.',
  ),
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'system' }),
};

export const SystemDark: Story = {
  parameters: themeParameters(
    'system',
    'System preference under a dark operating-system preference; browser tests emulate the media query.',
  ),
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'system' }),
};

export const ManualLight: Story = {
  parameters: themeParameters('light', 'Manual Light remains selected against a dark OS preference.'),
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'light' }),
};

export const ManualDark: Story = {
  parameters: themeParameters('dark', 'Manual Dark remains selected against a light OS preference.'),
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'dark' }),
};

export const Greyscale: Story = {
  parameters: themeParameters(
    'dark',
    'Colour is removed while native checked state, visible labels, status text, and markers remain.',
  ),
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, {
    preference: 'dark',
    presentation: 'greyscale',
  }),
};

export const ForcedColors: Story = {
  parameters: themeParameters(
    'system',
    'Browser tests activate forced colours and verify the three labelled native choices remain operable.',
  ),
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'system' }),
};

/**
 * The compact sticky header (#182) and the auto-fit card grid at one column. The narrow
 * evidence #183's programme requirements ask every child for, taken over the composition
 * rather than over one element in isolation.
 */
export const Narrow: Story = {
  parameters: {
    ...themeParameters('dark', 'The theme control and operational cards reflow at a narrow viewport.'),
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'dark' }),
};

export const Zoom200: Story = {
  parameters: themeParameters(
    'dark',
    'An effective 200% zoom route (780 physical pixels / 390 CSS pixels); browser tests assert content containment and control operation.',
  ),
  render: () => renderOperationalStatus(OPERATIONAL_MODEL, { preference: 'dark' }),
};

/**
 * The live region carrying nothing.
 *
 * `banner: null` renders no `<sk-notice>` at all rather than an empty one — an empty live region
 * is announced as a change to nothing. The cards and the chart still compose, which is the point:
 * the composition degrades by omitting a surface, not by substituting a placeholder for it.
 */
export const WithoutBanner: Story = {
  parameters: themeParameters('dark', 'The optional live-status region is omitted without a placeholder.'),
  render: () => renderOperationalStatus({ ...OPERATIONAL_MODEL, banner: null }),
};

/**
 * Every series interval carrying an observation.
 *
 * The counterpart to `Default`, whose north series has two runs with no observation. Both
 * stories exist so the gap treatment is visible as a DIFFERENCE rather than as a claim about a
 * single picture — #179's contract is that a missing interval is a visible gap and a published
 * "No data", never an interpolation.
 */
export const CompleteSeries: Story = {
  parameters: themeParameters('dark', 'Every time-series interval carries an observation.'),
  render: () =>
    renderOperationalStatus({
      ...OPERATIONAL_MODEL,
      banner: null,
      series: OPERATIONAL_MODEL.series.map((datum) => ({
        ...datum,
        points: datum.points.map((point, index) =>
          point.value === null
            ? { ...point, value: 60 + index, displayValue: `${60 + index} units` }
            : point,
        ),
      })),
    }),
};
