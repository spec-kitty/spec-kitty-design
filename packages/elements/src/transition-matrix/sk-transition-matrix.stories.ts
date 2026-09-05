import type { Meta, StoryObj } from '@storybook/web-components';
import './sk-transition-matrix.js';
import type { SkTransitionMatrix, TransitionColumn, TransitionRoute } from './sk-transition-matrix.js';

const tokenDependencies = [
  '--sk-border-default', '--sk-border-focus', '--sk-border-strong', '--sk-border-width-1',
  '--sk-border-width-2', '--sk-color-blue', '--sk-color-green', '--sk-color-purple',
  '--sk-color-red', '--sk-fg-body', '--sk-fg-default', '--sk-fg-muted', '--sk-fg-on-card',
  '--sk-font-mono', '--sk-font-sans', '--sk-radius-lg', '--sk-radius-sm', '--sk-space-1',
  '--sk-space-2', '--sk-space-3', '--sk-space-4', '--sk-space-5', '--sk-space-6',
  '--sk-space-10', '--sk-space-12', '--sk-surface-card',
  '--sk-surface-muted', '--sk-surface-pill', '--sk-text-lg', '--sk-text-sm', '--sk-text-xs',
  '--sk-weight-medium', '--sk-weight-semibold',
].join(', ');

const meta: Meta = {
  title: 'Elements/SkTransitionMatrix',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { disable: false },
    docs: {
      description: {
        component: `Aggregate route-by-time-bucket moves. Token dependencies: ${tokenDependencies}.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const approvedColumns = Object.freeze([
  Object.freeze({ id: 'tue-1', label: 'Tue 1' }),
  Object.freeze({ id: 'wed-2', label: 'Wed 2' }),
  Object.freeze({ id: 'thu-3', label: 'Thu 3' }),
  Object.freeze({ id: 'fri-4', label: 'Today · Fri 4' }),
] satisfies ReadonlyArray<TransitionColumn>);

const approvedRoutes = Object.freeze([
  Object.freeze({ id: 'planned-progress', label: 'Planned → In progress', tone: 'forward', values: Object.freeze({ 'tue-1': 3, 'wed-2': 6, 'thu-3': 7, 'fri-4': 5 }) }),
  Object.freeze({ id: 'progress-review', label: 'In progress → For review', tone: 'forward', values: Object.freeze({ 'tue-1': 2, 'wed-2': 5, 'thu-3': 6, 'fri-4': 4 }) }),
  Object.freeze({ id: 'review-done', label: 'For review → Done', tone: 'completed', values: Object.freeze({ 'tue-1': 1, 'wed-2': 3, 'thu-3': 4, 'fri-4': 3 }) }),
  Object.freeze({ id: 'blocked', label: 'Any lane → Blocked', tone: 'blocked', group: 'Exceptions & recovery', values: Object.freeze({ 'tue-1': 1, 'wed-2': 3, 'thu-3': 2, 'fri-4': 0 }) }),
  Object.freeze({ id: 'recovery', label: 'Blocked → In progress', tone: 'recovery', group: 'Exceptions & recovery', values: Object.freeze({ 'tue-1': 0, 'wed-2': 1, 'thu-3': 1, 'fri-4': 2 }) }),
  Object.freeze({ id: 'backward', label: 'Any lane → Any lane (backward)', tone: 'backward', group: 'Exceptions & recovery', values: Object.freeze({ 'tue-1': 0, 'wed-2': 1, 'thu-3': 1, 'fri-4': 1 }) }),
] satisfies ReadonlyArray<TransitionRoute>);

const compactColumns = Object.freeze([
  Object.freeze({ id: 'previous', label: 'Previous' }),
  Object.freeze({ id: 'current', label: 'Current' }),
] satisfies ReadonlyArray<TransitionColumn>);
const compactRoutes = Object.freeze([
  Object.freeze({ id: 'queued-active', label: 'Queued → Active', tone: 'forward', values: Object.freeze({ previous: 3, current: 5 }) }),
  Object.freeze({ id: 'active-complete', label: 'Active → Complete', tone: 'completed', values: Object.freeze({ previous: 2, current: 4 }) }),
  Object.freeze({ id: 'any-blocked', label: 'Any state → Blocked', tone: 'blocked', values: Object.freeze({ previous: 1, current: 0 }) }),
  Object.freeze({ id: 'blocked-active', label: 'Blocked → Active', tone: 'recovery', values: Object.freeze({ previous: 0, current: 2 }) }),
  Object.freeze({ id: 'any-previous', label: 'Any state → Previous state', tone: 'backward', values: Object.freeze({ previous: 1, current: 1 }) }),
] satisfies ReadonlyArray<TransitionRoute>);

type MatrixOptions = Partial<Pick<SkTransitionMatrix, 'selectedRouteId' | 'selectable' | 'windowLabel' | 'description' | 'selectionHint'>>;

const matrix = (
  columns: ReadonlyArray<TransitionColumn>,
  routes: ReadonlyArray<TransitionRoute>,
  options: MatrixOptions = {},
): SkTransitionMatrix => {
  const element = document.createElement('sk-transition-matrix') as SkTransitionMatrix;
  element.columns = columns;
  element.routes = routes;
  Object.assign(element, options);
  return element;
};

export const Default: Story = {
  render: () => matrix(compactColumns, compactRoutes),
};

export const ApprovedExample: Story = {
  render: () => matrix(approvedColumns, approvedRoutes, {
    selectable: true,
    windowLabel: 'last 72 hours',
    description: 'Moves grouped by route and day.',
    selectionHint: 'Select any row to inspect its WPs.',
  }),
};

export const FiftyActiveWPs: Story = {
  parameters: { docs: { description: { story: 'Counts aggregated from fifty active Work Packages remain bounded by routes and time buckets.' } } },
  render: () => matrix(approvedColumns, Object.freeze([
    Object.freeze({ ...approvedRoutes[0], values: Object.freeze({ 'tue-1': 12, 'wed-2': 15, 'thu-3': 18, 'fri-4': 13 }) }),
    Object.freeze({ ...approvedRoutes[1], values: Object.freeze({ 'tue-1': 9, 'wed-2': 11, 'thu-3': 16, 'fri-4': 14 }) }),
    approvedRoutes[2], approvedRoutes[3], approvedRoutes[4], approvedRoutes[5],
  ])),
};

export const SparseData: Story = {
  render: () => matrix(approvedColumns, Object.freeze([
    Object.freeze({ id: 'sparse-forward', label: 'Queued → Active', tone: 'forward', values: Object.freeze({ 'tue-1': 0, 'wed-2': 0, 'thu-3': 1, 'fri-4': 0 }) }),
    Object.freeze({ id: 'sparse-blocked', label: 'Any lane → Blocked', tone: 'blocked', values: Object.freeze({ 'tue-1': 0, 'wed-2': 1, 'thu-3': 0, 'fri-4': 0 }) }),
  ])),
};

export const EqualTotalsDifferentDistribution: Story = {
  render: () => matrix(approvedColumns, Object.freeze([
    Object.freeze({ id: 'early', label: 'Early movement', tone: 'forward', values: Object.freeze({ 'tue-1': 6, 'wed-2': 0, 'thu-3': 0, 'fri-4': 0 }) }),
    Object.freeze({ id: 'steady', label: 'Steady movement', tone: 'completed', values: Object.freeze({ 'tue-1': 1, 'wed-2': 2, 'thu-3': 1, 'fri-4': 2 }) }),
  ])),
};

export const Empty: Story = { render: () => matrix(Object.freeze([]), Object.freeze([])) };

export const ControlledSelection: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    const interactive = matrix(compactColumns, compactRoutes, { selectable: true, selectedRouteId: 'queued-active', selectionHint: 'Choose a route.' });
    interactive.dataset['controlled'] = 'true';
    const log = document.createElement('output');
    log.dataset['eventLog'] = 'true';
    log.textContent = 'No selection intent yet.';
    log.style.color = 'var(--sk-fg-body)';
    interactive.addEventListener('sk-transition-matrix-select', (event) => {
      const routeId = (event as CustomEvent<{ routeId: string }>).detail.routeId;
      log.textContent = `Selection intent: ${routeId}`;
      interactive.selectedRouteId = routeId;
    });
    const nonSelectable = matrix(compactColumns, compactRoutes, { selectedRouteId: 'queued-active' });
    nonSelectable.dataset['disabledAnalogue'] = 'true';
    wrapper.append(interactive, log, nonSelectable);
    return wrapper;
  },
};

export const SelectableStates: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    const selectable = matrix(approvedColumns, approvedRoutes, { selectable: true, selectionHint: 'Choose a route.' });
    selectable.dataset['selectableStates'] = 'true';
    const nonSelectable = matrix(approvedColumns, approvedRoutes, { selectedRouteId: 'planned-progress' });
    nonSelectable.dataset['disabledAnalogue'] = 'true';
    wrapper.append(selectable, nonSelectable);
    return wrapper;
  },
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'sk-light';
    wrapper.style.cssText = 'background: var(--sk-surface-page); padding: var(--sk-space-6);';
    wrapper.append(matrix(compactColumns, compactRoutes));
    return wrapper;
  },
};
