import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  SkTransitionMatrix,
  type SkTransitionMatrixElement,
  type TransitionMatrixSelectDetail,
} from '@spec-kitty/react';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const columns = Object.freeze([
  Object.freeze({ id: 'previous', label: 'Previous' }),
  Object.freeze({ id: 'current', label: 'Current' }),
]) satisfies SkTransitionMatrixElement['columns'];

const routes = Object.freeze([
  Object.freeze({
    id: 'planned-progress',
    label: 'Planned → In progress',
    tone: 'forward' as const,
    values: Object.freeze({ previous: 3, current: 5 }),
  }),
]) satisfies SkTransitionMatrixElement['routes'];

const replacementColumns = Object.freeze([
  Object.freeze({ id: 'today', label: 'Today' }),
]) satisfies SkTransitionMatrixElement['columns'];

const replacementRoutes = Object.freeze([
  Object.freeze({
    id: 'review-done',
    label: 'For review → Done',
    tone: 'completed' as const,
    values: Object.freeze({ today: 7 }),
  }),
]) satisfies SkTransitionMatrixElement['routes'];

let host: HTMLDivElement;
let root: Root;

type TransitionMatrixProbeElement = HTMLElement &
  Pick<SkTransitionMatrixElement, 'columns' | 'routes'>;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function render(ui: React.ReactNode): void {
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>));
}

test('[SC-010] the generated transition-matrix wrapper preserves and resets structured properties', async () => {
  expect(
    customElements.get('sk-transition-matrix'),
    'the element loaded before React could exercise pre-definition property delivery',
  ).toBeUndefined();

  render(<SkTransitionMatrix columns={columns} routes={routes} />);
  const element = host.querySelector('sk-transition-matrix') as TransitionMatrixProbeElement;

  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();
  expect(element.columns, 'the initial columns did not reach the undefined element').toBe(columns);
  expect(element.routes, 'the initial routes did not reach the undefined element').toBe(routes);
  expect(element.hasAttribute('columns')).toBe(false);
  expect(element.hasAttribute('routes')).toBe(false);

  class TransitionMatrixProbeElementClass extends HTMLElement {
    declare columns: SkTransitionMatrixElement['columns'];
    declare routes: SkTransitionMatrixElement['routes'];

    constructor() {
      super();
      if (!Object.prototype.hasOwnProperty.call(this, 'columns')) {
        this.columns = Object.freeze([]);
      }
      if (!Object.prototype.hasOwnProperty.call(this, 'routes')) {
        this.routes = Object.freeze([]);
      }
    }
  }
  customElements.define('sk-transition-matrix', TransitionMatrixProbeElementClass);
  await customElements.whenDefined('sk-transition-matrix');

  expect(element.columns, 'custom-element upgrade replaced the columns identity').toBe(columns);
  expect(element.routes, 'custom-element upgrade replaced the routes identity').toBe(routes);
  expect(element.hasAttribute('columns')).toBe(false);
  expect(element.hasAttribute('routes')).toBe(false);

  render(<SkTransitionMatrix columns={replacementColumns} routes={replacementRoutes} />);

  expect(element.columns, 'rerendering did not replace the columns identity').toBe(
    replacementColumns,
  );
  expect(element.routes, 'rerendering did not replace the routes identity').toBe(replacementRoutes);
  expect(element.hasAttribute('columns')).toBe(false);
  expect(element.hasAttribute('routes')).toBe(false);

  render(<SkTransitionMatrix />);

  const resetColumns = element.columns;
  const resetRoutes = element.routes;
  expect(resetColumns).toEqual([]);
  expect(resetRoutes).toEqual([]);
  expect(Object.isFrozen(resetColumns), 'removed columns did not receive an immutable reset').toBe(
    true,
  );
  expect(Object.isFrozen(resetRoutes), 'removed routes did not receive an immutable reset').toBe(
    true,
  );
  expect(resetColumns, 'removed columns retained the consumer array').not.toBe(replacementColumns);
  expect(resetRoutes, 'removed routes retained the consumer array').not.toBe(replacementRoutes);
  expect(resetColumns, 'the two removal resets must be fresh arrays').not.toBe(resetRoutes);
  expect(element.hasAttribute('columns')).toBe(false);
  expect(element.hasAttribute('routes')).toBe(false);
});

test('[SC-006] the generated transition-matrix wrapper delivers one typed sentinel event', async () => {
  const received: TransitionMatrixSelectDetail[] = [];
  render(
    <SkTransitionMatrix
      onSkTransitionMatrixSelect={(event) => {
        received.push(event.detail);
      }}
    />,
  );

  const element = host.querySelector('sk-transition-matrix') as SkTransitionMatrixElement;
  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();

  const detail = Object.freeze({ routeId: 'sentinel-route' });
  await act(async () => {
    element.dispatchEvent(
      new CustomEvent<TransitionMatrixSelectDetail>('sk-transition-matrix-select', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  });

  expect(received).toHaveLength(1);
  expect(received[0], 'the wrapper changed the event detail identity').toBe(detail);
});
