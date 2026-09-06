import type { Meta, StoryObj } from '@storybook/web-components';
import { expect, fn, userEvent, within } from 'storybook/test';
import './sk-bar-chart.js';
import type { BarChartSelectDetail, BarDatum, SkBarChart } from './sk-bar-chart.js';

const approvedSeries = Object.freeze([
  Object.freeze({ id: 'aug-11', label: 'Aug 11', value: 320, displayValue: '€320' }),
  Object.freeze({ id: 'aug-18', label: 'Aug 18', value: 510, displayValue: '€510' }),
  Object.freeze({ id: 'aug-25', label: 'Aug 25', value: 440, displayValue: '€440' }),
  Object.freeze({ id: 'sep-1', label: 'Sep 1', value: 604, displayValue: '€604' }),
] satisfies ReadonlyArray<BarDatum>);

type StoryArgs = {
  onSelect: (detail: BarChartSelectDetail) => void;
};

type ChartOptions = Partial<Pick<
  SkBarChart,
  'description' | 'label' | 'selectable' | 'selectedId'
>>;

const chart = (
  series: ReadonlyArray<BarDatum>,
  options: ChartOptions = {},
): SkBarChart => {
  const element = document.createElement('sk-bar-chart') as SkBarChart;
  element.series = series;
  element.label = options.label ?? 'Return over time';
  element.description = options.description ?? 'Attributed value by observation date';
  element.selectable = options.selectable ?? false;
  element.selectedId = options.selectedId ?? '';
  return element;
};

const frame = (element: HTMLElement, light = false): HTMLElement => {
  const wrapper = document.createElement('div');
  if (light) wrapper.className = 'sk-light';
  wrapper.style.cssText = [
    'box-sizing:border-box',
    'width:min(720px,100vw)',
    'background:var(--sk-surface-page)',
    'padding:var(--sk-space-6)',
  ].join(';');
  wrapper.append(element);
  return wrapper;
};

const meta = {
  title: 'Elements/SkBarChart',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: {
      description: {
        component:
          'A controlled, property-fed bar chart whose native list text carries meaning and whose SVG provides proportional geometry.',
      },
    },
  },
  args: { onSelect: fn() },
  render: () => frame(chart(approvedSeries)),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CloseValues: Story = {
  render: () => frame(chart(Object.freeze([
    Object.freeze({ id: 'close-510', label: 'Observed', value: 510, displayValue: '€510' }),
    Object.freeze({ id: 'close-570', label: 'Attributed', value: 570, displayValue: '€570' }),
  ]))),
};

export const ZeroValues: Story = {
  render: () => frame(chart(Object.freeze([
    Object.freeze({ id: 'zero', label: 'No attributed value', value: 0, displayValue: '€0' }),
    Object.freeze({ id: 'measured', label: 'Measured value', value: 604, displayValue: '€604' }),
  ]))),
};

export const Empty: Story = {
  render: () => frame(chart(Object.freeze([]))),
};

export const LongLabels: Story = {
  render: () => frame(chart(Object.freeze([
    Object.freeze({ id: 'long-a', label: 'Monday 11 August — first recorded observation', value: 320, displayValue: '€320 attributed' }),
    Object.freeze({ id: 'long-b', label: 'Monday 18 August — second recorded observation', value: 510, displayValue: '€510 attributed' }),
    Object.freeze({ id: 'long-c', label: 'Monday 25 August — third recorded observation', value: 440, displayValue: '€440 attributed' }),
    Object.freeze({ id: 'long-d', label: 'Monday 1 September — fourth recorded observation', value: 604, displayValue: '€604 attributed' }),
  ]), { selectable: true })),
};

export const ControlledSelection: Story = {
  render: ({ onSelect }) => {
    const wrapper = document.createElement('div');
    const element = chart(approvedSeries, { selectable: true, selectedId: 'aug-18' });
    element.dataset['controlled'] = 'true';
    const log = document.createElement('output');
    log.dataset['eventLog'] = 'true';
    log.style.color = 'var(--sk-fg-body)';
    log.textContent = 'Selected: aug-18';
    element.addEventListener('sk-bar-chart-select', (event) => {
      const detail = (event as CustomEvent<BarChartSelectDetail>).detail;
      onSelect(detail);
      element.selectedId = detail.id;
      log.textContent = `Selected: ${detail.id}`;
    });
    wrapper.append(element, log);
    return frame(wrapper);
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: '€440 Aug 25' }));
    await expect(args.onSelect).toHaveBeenCalledWith({ id: 'aug-25' });
  },
};

export const SelectableStates: Story = {
  render: () => {
    const stack = document.createElement('div');
    stack.style.cssText = 'display:grid;gap:var(--sk-space-6)';
    const selectable = chart(approvedSeries, { selectable: true });
    selectable.dataset['selectableStates'] = 'true';
    const selected = chart(approvedSeries, { selectable: true, selectedId: 'aug-18' });
    selected.dataset['selectedState'] = 'true';
    const nonSelectable = chart(approvedSeries, { selectedId: 'aug-18' });
    nonSelectable.dataset['nonSelectableState'] = 'true';
    stack.append(selectable, selected, nonSelectable);
    return frame(stack);
  },
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, a11y: { disable: false } },
  render: () => frame(chart(approvedSeries), true),
};
