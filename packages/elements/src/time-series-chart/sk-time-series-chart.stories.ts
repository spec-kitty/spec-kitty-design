import type { Meta, StoryObj } from '@storybook/web-components';
import { expect, fn, userEvent, within } from 'storybook/test';
import './sk-time-series-chart.js';
import type {
  SkTimeSeriesChart,
  TimeSeriesChartSelectDetail,
  TimeSeriesDatum,
  TimeSeriesPoint,
  TimeSeriesResolution,
} from './sk-time-series-chart.js';

const HOUR = 3_600_000;
// A FIXED epoch, never Date.now(). The element reads no clock and neither does its evidence:
// a story seeded from the runtime clock renders differently on every visual-regression run.
const START = 1_767_225_600_000;

const point = (
  id: string,
  index: number,
  value: number | null,
  resolution: TimeSeriesResolution = 'raw',
): TimeSeriesPoint =>
  Object.freeze({
    id,
    at: START + index * HOUR,
    value,
    displayValue: value === null ? 'unused' : `${value} req/s`,
    label: `${String(index).padStart(2, '0')}:00`,
    resolution,
  });

const seriesOf = (
  id: string,
  name: string,
  values: ReadonlyArray<number | null>,
  resolution: TimeSeriesResolution = 'raw',
): TimeSeriesDatum =>
  Object.freeze({
    id,
    name,
    points: Object.freeze(values.map((value, index) => point(`${id}-${index}`, index, value, resolution))),
  });

const evenly = Object.freeze([seriesOf('throughput', 'Throughput', [40, 55, 51, 62, 58, 61])]);
const outage = Object.freeze([seriesOf('throughput', 'Throughput', [40, 55, null, null, 62, 58])]);

type StoryArgs = {
  onSelect: (detail: TimeSeriesChartSelectDetail) => void;
};

type ChartOptions = Partial<
  Pick<SkTimeSeriesChart, 'description' | 'gapThreshold' | 'label' | 'selectable' | 'selectedId'>
>;

const chart = (series: ReadonlyArray<TimeSeriesDatum>, options: ChartOptions = {}): SkTimeSeriesChart => {
  const element = document.createElement('sk-time-series-chart') as SkTimeSeriesChart;
  element.series = series;
  element.label = options.label ?? 'Throughput over time';
  element.description = options.description ?? 'Requests per second, by hour, as collected';
  element.selectable = options.selectable ?? false;
  element.selectedId = options.selectedId ?? '';
  element.gapThreshold = options.gapThreshold ?? 0;
  return element;
};

const frame = (element: HTMLElement, light = false, width = 'min(880px,100vw)'): HTMLElement => {
  const wrapper = document.createElement('div');
  if (light) wrapper.className = 'sk-light';
  wrapper.style.cssText = [
    'box-sizing:border-box',
    `width:${width}`,
    'background:var(--sk-surface-page)',
    'padding:var(--sk-space-6)',
  ].join(';');
  wrapper.append(element);
  return wrapper;
};

const meta = {
  title: 'Elements/SkTimeSeriesChart',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'A controlled line chart over a time axis. A missing interval breaks the line and is published as "No data" — never interpolated and never drawn to the baseline. Every value is present in the paired table without hover or focus, and series are told apart by ink, dash pattern and marker shape, so differentiation survives greyscale and forced colors.',
      },
    },
  },
  args: { onSelect: fn() },
  render: () => frame(chart(evenly)),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InteriorGap: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Two hours with no observation. The line breaks, the interval is drawn as a gap, and both rows read "No data" — the defect this element exists to refuse is a single smooth line across the same points.',
      },
    },
  },
  render: () => frame(chart(outage)),
};

export const AnnotatedGap: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The same outage with a consumer-supplied three-hour threshold. The note below the plot appears only because a threshold was supplied; the element infers none.',
      },
    },
  },
  render: () => frame(chart(outage, { gapThreshold: 3 * HOUR })),
};

export const LeadingAndTrailingGaps: Story = {
  render: () =>
    frame(chart(Object.freeze([seriesOf('throughput', 'Throughput', [null, null, 51, 62, null, null])]))),
};

export const EntirelyUnobserved: Story = {
  render: () =>
    frame(chart(Object.freeze([seriesOf('throughput', 'Throughput', [null, null, null, null])]))),
};

export const MixedResolution: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Raw samples for the first half, hourly aggregates for the second. The heavier stroke and hollow markers mark the aggregate, the boundary rule marks the change, and the axis does not rescale.',
      },
    },
  },
  render: () =>
    frame(
      chart(
        Object.freeze([
          Object.freeze({
            id: 'throughput',
            name: 'Throughput',
            points: Object.freeze([
              point('r-0', 0, 40),
              point('r-1', 1, 55),
              point('r-2', 2, 51),
              point('h-3', 3, 62, 'hour'),
              point('h-4', 4, 58, 'hour'),
              point('h-5', 5, 61, 'hour'),
            ]),
          }),
        ]),
      ),
    ),
};

export const UnequalSpacing: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Position derives from the timestamp, so the long quiet stretch is visible as one.',
      },
    },
  },
  render: () =>
    frame(
      chart(
        Object.freeze([
          Object.freeze({
            id: 'latency',
            name: 'Latency',
            points: Object.freeze([
              point('u-0', 0, 12),
              point('u-1', 1, 14),
              point('u-2', 2, 13),
              point('u-3', 18, 31),
              point('u-4', 19, 28),
            ]),
          }),
        ]),
      ),
    ),
};

export const DenseSeries: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Five hundred points. Above the marker density limit the line and the legend carry the series; nothing is dropped from the published table, and a non-selectable chart contributes no tab stop other than the scroller it genuinely needs.',
      },
    },
  },
  render: () =>
    frame(
      chart(
        Object.freeze([
          seriesOf(
            'load',
            'Load',
            Array.from({ length: 500 }, (_, index) =>
              index % 61 === 0 ? null : 40 + Math.round(20 * Math.sin(index / 9)),
            ),
          ),
        ]),
      ),
    ),
};

export const MultipleSeries: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Four series told apart by three redundant channels. Ink is the one that collapses under forced colors and in greyscale; the dash pattern and the marker shape are the two that do not.',
      },
    },
  },
  render: () =>
    frame(
      chart(
        Object.freeze([
          seriesOf('a', 'Ingest', [40, 55, 51, 62, 58]),
          seriesOf('b', 'Transform', [62, 48, 44, 39, 41]),
          seriesOf('c', 'Publish', [22, 31, 28, 35, 30]),
          seriesOf('d', 'Archive', [12, 15, null, 18, 16]),
        ]),
        { label: 'Pipeline stages over time' },
      ),
    ),
};

export const SinglePoint: Story = {
  render: () => frame(chart(Object.freeze([seriesOf('throughput', 'Throughput', [47])]))),
};

export const Empty: Story = {
  render: () => frame(chart(Object.freeze([]))),
};

export const ControlledSelection: Story = {
  render: ({ onSelect }) => {
    const wrapper = document.createElement('div');
    const element = chart(outage, { selectable: true, selectedId: 'throughput-1' });
    element.dataset['controlled'] = 'true';
    const log = document.createElement('output');
    log.dataset['eventLog'] = 'true';
    log.style.color = 'var(--sk-fg-body)';
    log.textContent = 'Selected: throughput-1';
    element.addEventListener('sk-time-series-chart-select', (event) => {
      const detail = (event as CustomEvent<TimeSeriesChartSelectDetail>).detail;
      onSelect(detail);
      element.selectedId = detail.pointId;
      log.textContent = `Selected: ${detail.pointId}`;
    });
    wrapper.append(element, log);
    return frame(wrapper);
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: '04:00' }));
    await expect(args.onSelect).toHaveBeenCalledWith({
      seriesId: 'throughput',
      pointId: 'throughput-4',
    });
  },
};

export const NarrowViewport: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The table is the narrow-viewport treatment. It never reflows into stacked blocks; it scrolls, and it carries the region triad exactly because it genuinely overflows here.',
      },
    },
  },
  render: () => frame(chart(outage, { gapThreshold: 3 * HOUR }), false, 'min(360px,100vw)'),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => frame(chart(outage, { gapThreshold: 3 * HOUR }), true),
};
