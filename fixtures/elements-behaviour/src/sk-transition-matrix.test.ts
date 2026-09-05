import { beforeEach, expect, test } from 'vitest';
import { SkTransitionMatrix, skTransitionMatrixSheet } from '@spec-kitty/elements';
// eslint-disable-next-line @nx/enforce-module-boundaries -- raw authored CSS is the token-contract test subject
import transitionMatrixCss from '../../../packages/styles/src/transition-matrix/sk-transition-matrix.css?raw';
// eslint-disable-next-line @nx/enforce-module-boundaries -- raw authored source is the public-boundary test subject
import transitionMatrixSource from '../../../packages/elements/src/transition-matrix/sk-transition-matrix.ts?raw';
// eslint-disable-next-line @nx/enforce-module-boundaries -- raw authored story is the fixture-copy test subject
import transitionMatrixStorySource from '../../../packages/elements/src/transition-matrix/sk-transition-matrix.stories.ts?raw';
import type {
  TransitionColumn,
  TransitionMatrixProperties,
  TransitionMatrixSelectDetail,
  TransitionRoute,
  TransitionTone,
} from '@spec-kitty/elements';

type Matrix = SkTransitionMatrix & { updateComplete: Promise<unknown> };

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

const mount = async (
  columns: ReadonlyArray<TransitionColumn> = approvedColumns,
  routes: ReadonlyArray<TransitionRoute> = approvedRoutes,
): Promise<Matrix> => {
  const element = document.createElement('sk-transition-matrix') as Matrix;
  element.columns = columns;
  element.routes = routes;
  document.body.append(element);
  await element.updateComplete;
  return element;
};

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.querySelectorAll('[data-transition-matrix-test]').forEach((node) => node.remove());
});

test('approved fixture derives 24 intersections, six route totals, and 62 moves (FR-003 FR-004 SC-001)', async () => {
  const element = await mount();
  const cells = Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[data-value]'));
  expect(cells).toHaveLength(24);
  expect(Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[data-route-total]')).map((node) => Number(node.dataset['routeTotal']))).toEqual([21, 17, 11, 6, 4, 3]);
  expect(element.shadowRoot!.querySelector('[data-overall-total]')?.textContent).toContain('62 moves');
});

test('bar ratios use the current global maximum and recompute after replacement (FR-006 SC-003)', async () => {
  const element = await mount();
  const ratios = Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[data-ratio]')).map((node) => Number(node.dataset['ratio']));
  const values = approvedRoutes.flatMap((route) => approvedColumns.map((column) => route.values[column.id]));
  expect(ratios).toEqual(values.map((value) => value / 7));
  expect(ratios.filter((ratio) => ratio === 0)).toHaveLength(3);

  element.routes = Object.freeze([
    Object.freeze({ id: 'changed', label: 'Changed', tone: 'forward' as const, values: Object.freeze({ 'tue-1': 2, 'wed-2': 4, 'thu-3': 8, 'fri-4': 16 }) }),
  ]);
  await element.updateComplete;
  expect(Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[data-ratio]')).map((node) => Number(node.dataset['ratio']))).toEqual([0.125, 0.25, 0.5, 1]);
  expect(element.shadowRoot!.querySelector('[data-route-total]')?.textContent).toBe('30');
  expect(element.shadowRoot!.querySelector('[data-overall-total]')?.textContent).toContain('30 moves');
});

test('stable ids preserve values when routes and columns reorder without mutating inputs (FR-005 SC-002)', async () => {
  const beforeColumns = JSON.stringify(approvedColumns);
  const beforeRoutes = JSON.stringify(approvedRoutes);
  const columns = Object.freeze([...approvedColumns].reverse());
  const routes = Object.freeze([...approvedRoutes].reverse());
  const element = await mount(columns, routes);
  const firstRow = element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="backward"]')!;
  expect(Array.from(firstRow.querySelectorAll<HTMLElement>('[data-value]')).map((node) => Number(node.dataset['value']))).toEqual([1, 1, 1, 0]);
  expect(JSON.stringify(approvedColumns)).toBe(beforeColumns);
  expect(JSON.stringify(approvedRoutes)).toBe(beforeRoutes);
});

test('legend filters supplied tones in fixed semantic order and group runs preserve route labels (FR-007 FR-008 SC-004)', async () => {
  const subset = Object.freeze([approvedRoutes[0], approvedRoutes[3], approvedRoutes[4]]);
  const element = await mount(approvedColumns, subset);
  expect(Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[part~="legend"] [data-tone]')).map((node) => node.dataset['tone'])).toEqual(['forward', 'blocked', 'recovery']);
  expect(element.shadowRoot!.querySelector('[part~="group"]')?.textContent).toContain('Exceptions & recovery');
  expect(Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[part~="route"]')).map((node) => node.textContent?.trim())).toEqual(subset.map((route) => route.label));
});

test.each([
  ['no columns', Object.freeze([]), approvedRoutes],
  ['no routes', approvedColumns, Object.freeze([])],
  ['duplicate column id', Object.freeze([approvedColumns[0], approvedColumns[0]]), approvedRoutes],
  [
    'empty column id',
    Object.freeze([{ id: '', label: 'Empty id' }]),
    Object.freeze([{ id: 'route', label: 'Route', tone: 'forward' as const, values: Object.freeze({ '': 1 }) }]),
  ],
  ['empty route id', approvedColumns, Object.freeze([{ ...approvedRoutes[0], id: '' }])],
  ['duplicate route id', approvedColumns, Object.freeze([approvedRoutes[0], approvedRoutes[0]])],
  ['unknown runtime tone', approvedColumns, Object.freeze([{ ...approvedRoutes[0], tone: 'warning' as TransitionTone }])],
  ['missing value key', approvedColumns, Object.freeze([{ ...approvedRoutes[0], values: { 'tue-1': 1 } }])],
  ['unknown value key', approvedColumns, Object.freeze([{ ...approvedRoutes[0], values: { ...approvedRoutes[0].values, unknown: 1 } }])],
  ['negative value', approvedColumns, Object.freeze([{ ...approvedRoutes[0], values: { ...approvedRoutes[0].values, 'tue-1': -1 } }])],
  ['fractional value', approvedColumns, Object.freeze([{ ...approvedRoutes[0], values: { ...approvedRoutes[0].values, 'tue-1': 1.5 } }])],
  ['NaN value', approvedColumns, Object.freeze([{ ...approvedRoutes[0], values: { ...approvedRoutes[0].values, 'tue-1': Number.NaN } }])],
  ['infinite value', approvedColumns, Object.freeze([{ ...approvedRoutes[0], values: { ...approvedRoutes[0].values, 'tue-1': Number.POSITIVE_INFINITY } }])],
] as const)('invalid or empty data fails closed: %s (FR-014 FR-017)', async (_label, columns, routes) => {
  const element = await mount(columns as ReadonlyArray<TransitionColumn>, routes as ReadonlyArray<TransitionRoute>);
  expect(element.shadowRoot!.querySelector('[part~="empty-state"]')?.textContent ?? '').toContain('No transition data');
  expect(element.shadowRoot!.querySelectorAll('[data-value]')).toHaveLength(0);
  expect(element.shadowRoot!.querySelectorAll('[data-tone]')).toHaveLength(0);
  expect(element.shadowRoot!.querySelectorAll('[tabindex]')).toHaveLength(0);
});

test('all-zero rectangular data renders numeric zero ratios and derived totals (FR-006 FR-017)', async () => {
  const routes = Object.freeze([{ id: 'zero', label: 'Zero route', tone: 'backward' as const, values: Object.freeze({ 'tue-1': 0, 'wed-2': 0, 'thu-3': 0, 'fri-4': 0 }) }]);
  const element = await mount(approvedColumns, routes);
  expect(Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[data-ratio]')).map((node) => Number(node.dataset['ratio']))).toEqual([0, 0, 0, 0]);
  expect(element.shadowRoot!.querySelector('[data-route-total]')?.textContent).toBe('0');
  expect(element.shadowRoot!.querySelector('[data-overall-total]')?.textContent).toContain('0 moves');
});

test('[SC-006] selectable pointer, Enter, and Space each emit exactly one intent while repeat emits none', async () => {
  const element = await mount();
  element.selectable = true;
  await element.updateComplete;
  const row = element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="progress-review"]')!;
  const events: CustomEvent<TransitionMatrixSelectDetail>[] = [];
  element.addEventListener('sk-transition-matrix-select', (event) => events.push(event as CustomEvent<TransitionMatrixSelectDetail>));

  row.click();
  row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
  const repeatedSpace = new KeyboardEvent('keydown', {
    key: ' ', bubbles: true, cancelable: true, repeat: true,
  });
  row.dispatchEvent(repeatedSpace);
  expect(events).toHaveLength(3);
  expect(repeatedSpace.defaultPrevented, 'held Space must remain scroll-safe without reactivating').toBe(true);
});

test('[SC-007] selection intent carries exactly the stable route id', async () => {
  const element = await mount();
  element.selectable = true;
  await element.updateComplete;
  let detail: TransitionMatrixSelectDetail | null = null;
  element.addEventListener('sk-transition-matrix-select', (event) => { detail = (event as CustomEvent<TransitionMatrixSelectDetail>).detail; }, { once: true });
  element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="blocked"]')!.click();
  expect(detail).toEqual({ routeId: 'blocked' });
  expect(Object.keys(detail!)).toEqual(['routeId']);
});

test('[SC-008] intent bubbles across a shadow boundary, is composed, and is explicitly non-cancelable', async () => {
  const wrapper = document.createElement('div');
  document.body.append(wrapper);
  const outerRoot = wrapper.attachShadow({ mode: 'open' });
  const element = document.createElement('sk-transition-matrix') as Matrix;
  element.columns = approvedColumns;
  element.routes = approvedRoutes;
  element.selectable = true;
  outerRoot.append(element);
  await element.updateComplete;
  let seen: CustomEvent | null = null;
  document.addEventListener('sk-transition-matrix-select', (event) => { seen = event as CustomEvent; }, { once: true });
  element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="planned-progress"]')!.click();
  expect(seen).not.toBe(null);
  expect(seen!.bubbles).toBe(true);
  expect(seen!.composed).toBe(true);
  expect(seen!.cancelable).toBe(false);
});

test('selection stays consumer-controlled and unknown selected ids select nothing (FR-011 SC-007)', async () => {
  const element = await mount();
  element.selectable = true;
  element.selectedRouteId = 'planned-progress';
  await element.updateComplete;
  element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="blocked"]')!.click();
  await element.updateComplete;
  expect(element.selectedRouteId).toBe('planned-progress');
  expect(element.shadowRoot!.querySelector('[aria-selected="true"]')?.getAttribute('data-route-id')).toBe('planned-progress');
  element.selectedRouteId = 'absent';
  await element.updateComplete;
  expect(element.shadowRoot!.querySelector('[aria-selected="true"]')).toBe(null);
});

test('non-selectable mode has no tab stops, prompt, event, or interaction affordance even when selected (FR-013 NFR-002 SC-008)', async () => {
  const element = await mount();
  element.selectedRouteId = 'planned-progress';
  element.selectionHint = 'Consumer-only prompt';
  await element.updateComplete;
  let count = 0;
  element.addEventListener('sk-transition-matrix-select', () => { count += 1; });
  const row = element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="planned-progress"]')!;
  const route = row.querySelector<HTMLElement>('[part~="route"]')!;
  const rest = getComputedStyle(route).backgroundColor;
  row.click();
  row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  expect(row.hasAttribute('tabindex')).toBe(false);
  expect(element.shadowRoot!.querySelector('[id$="-selection-hint"]')).toBe(null);
  expect(count).toBe(0);
  expect(getComputedStyle(row).cursor).not.toBe('pointer');
  expect(getComputedStyle(route).backgroundColor).toBe(rest);
});

test('pointer press is cleared across disable, release, and re-enable without residue', async () => {
  const element = await mount();
  element.selectable = true;
  await element.updateComplete;
  const row = element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="planned-progress"]')!;

  row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await element.updateComplete;
  expect(row.getAttribute('data-pressed')).toBe('true');

  element.selectable = false;
  await element.updateComplete;
  expect(row.hasAttribute('data-pressed')).toBe(false);
  row.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

  element.selectable = true;
  await element.updateComplete;
  expect(row.hasAttribute('data-pressed')).toBe(false);
});

test('keyboard press is cleared when its route disappears and cannot resurrect on reintroduction', async () => {
  const element = await mount();
  element.selectable = true;
  await element.updateComplete;
  const row = element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="progress-review"]')!;

  row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
  await element.updateComplete;
  expect(row.getAttribute('data-pressed')).toBe('true');

  element.routes = Object.freeze(approvedRoutes.filter((route) => route.id !== 'progress-review'));
  await element.updateComplete;
  expect(element.shadowRoot!.querySelector('[data-pressed]')).toBe(null);
  row.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));

  element.routes = approvedRoutes;
  await element.updateComplete;
  expect(element.shadowRoot!.querySelector('[data-route-id="progress-review"]')?.hasAttribute('data-pressed')).toBe(false);
});

test('pointer press is cleared when data becomes invalid and cannot resurrect after valid data returns', async () => {
  const element = await mount();
  element.selectable = true;
  await element.updateComplete;
  const row = element.shadowRoot!.querySelector<HTMLElement>('[data-route-id="planned-progress"]')!;

  row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await element.updateComplete;
  expect(row.getAttribute('data-pressed')).toBe('true');

  element.routes = Object.freeze([
    Object.freeze({ ...approvedRoutes[0], values: Object.freeze({ 'tue-1': 3 }) }),
    ...approvedRoutes.slice(1),
  ]) as ReadonlyArray<TransitionRoute>;
  await element.updateComplete;
  expect(element.shadowRoot!.querySelector('[part~="empty-state"]')).not.toBe(null);
  expect(element.shadowRoot!.querySelector('[data-pressed]')).toBe(null);

  element.routes = approvedRoutes;
  await element.updateComplete;
  expect(element.shadowRoot!.querySelector('[data-route-id="planned-progress"]')?.hasAttribute('data-pressed')).toBe(false);
});

test('the authored element contract pins exactly five attribute mappings and keeps structured inputs property-only', async () => {
  expect([...SkTransitionMatrix.observedAttributes].sort()).toEqual([
    'description',
    'selectable',
    'selected-route-id',
    'selection-hint',
    'window-label',
  ]);

  const element = await mount();
  element.setAttribute('selected-route-id', 'blocked');
  element.setAttribute('selectable', '');
  element.setAttribute('window-label', 'consumer window');
  element.setAttribute('description', 'Consumer description.');
  element.setAttribute('selection-hint', 'Consumer hint.');
  await element.updateComplete;
  expect({
    selectedRouteId: element.selectedRouteId,
    selectable: element.selectable,
    windowLabel: element.windowLabel,
    description: element.description,
    selectionHint: element.selectionHint,
  }).toEqual({
    selectedRouteId: 'blocked',
    selectable: true,
    windowLabel: 'consumer window',
    description: 'Consumer description.',
    selectionHint: 'Consumer hint.',
  });

  element.selectable = false;
  await element.updateComplete;
  expect(element.hasAttribute('selectable')).toBe(false);
  element.selectable = true;
  await element.updateComplete;
  expect(element.hasAttribute('selectable')).toBe(true);
  expect(element.hasAttribute('columns')).toBe(false);
  expect(element.hasAttribute('routes')).toBe(false);
});

test('semantic table exposes route and column headers, route totals, and generic consumer-owned copy (FR-004 FR-009 FR-015)', async () => {
  const element = await mount();
  element.windowLabel = 'consumer window';
  element.description = 'Consumer description.';
  element.selectionHint = 'Consumer hint.';
  element.selectable = true;
  await element.updateComplete;
  const table = element.shadowRoot!.querySelector('table')!;
  expect(table.querySelectorAll('thead th')).toHaveLength(6);
  expect(table.querySelector('thead th:first-child')?.textContent).toBe('Route');
  expect(table.querySelector('thead th:last-child')?.textContent).toBe('Total');
  expect(table.querySelectorAll('th[scope="row"]')).toHaveLength(6);
  expect(table.querySelectorAll('td[headers]')).toHaveLength(30);
  expect(element.shadowRoot!.textContent).toContain('bar length ∝ moves');
  expect(element.shadowRoot!.textContent).toContain('consumer window');
  expect(element.shadowRoot!.textContent).toContain('Consumer description.');
  expect(element.shadowRoot!.textContent).toContain('Consumer hint.');
});

test('route totals describe magnitudes and visible group headings label their bodies across instances (FR-010 FR-015 SC-005)', async () => {
  const first = await mount();
  first.description = 'First description.';
  first.selectionHint = 'First hint.';
  first.selectable = true;
  await first.updateComplete;
  const second = await mount();
  second.description = 'Second description.';
  second.selectionHint = 'Second hint.';
  second.selectable = true;
  await second.updateComplete;

  const ids = [first, second].flatMap((element) =>
    Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[id]'), (node) => node.id),
  );
  expect(new Set(ids).size).toBe(ids.length);
  for (const element of [first, second]) {
    const describedBy = element.shadowRoot!.querySelector('section')!.getAttribute('aria-describedby')!.split(' ');
    expect(new Set(describedBy).size).toBe(describedBy.length);
    for (const id of describedBy) expect(element.shadowRoot!.getElementById(id)).not.toBe(null);
    for (const cell of Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('td[headers]'))) {
      const headerIds = cell.getAttribute('headers')!.split(' ');
      expect(new Set(headerIds).size).toBe(headerIds.length);
      for (const id of headerIds) {
        expect(element.shadowRoot!.getElementById(id)).not.toBe(null);
      }
    }

    for (const row of Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('tr[data-route-id]'))) {
      const total = row.querySelector<HTMLElement>('td[data-route-total]')!;
      expect(total.id, 'each route total has a component-owned id').not.toBe('');
      expect(element.shadowRoot!.getElementById(total.id)).toBe(total);
      for (const magnitude of Array.from(row.querySelectorAll<HTMLElement>('td[data-value]'))) {
        expect(magnitude.getAttribute('aria-describedby'), 'each magnitude is described by its route total').toBe(total.id);
        expect(element.shadowRoot!.getElementById(magnitude.getAttribute('aria-describedby')!)).toBe(total);
      }
    }

    const groupHeadings = Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[part~="group"]'));
    expect(groupHeadings).toHaveLength(1);
    for (const heading of groupHeadings) {
      expect(heading.id, 'each visible group heading has a component-owned id').not.toBe('');
      const body = heading.closest('tbody')!;
      expect(body.getAttribute('aria-labelledby'), 'the grouped body is labelled by its visible heading').toBe(heading.id);
      expect(element.shadowRoot!.getElementById(body.getAttribute('aria-labelledby')!)).toBe(heading);
    }
  }
});

test('[SC-010] arrays assigned before a late definition survive upgrade', async () => {
  const element = document.createElement('sk-transition-matrix-late') as Matrix;
  element.columns = approvedColumns;
  element.routes = approvedRoutes;
  document.body.append(element);
  const { SkTransitionMatrix } = await import('@spec-kitty/elements');
  customElements.define('sk-transition-matrix-late', class extends SkTransitionMatrix {});
  await customElements.whenDefined('sk-transition-matrix-late');
  await element.updateComplete;
  expect(element.columns).toBe(approvedColumns);
  expect(element.routes).toBe(approvedRoutes);
  expect(element.shadowRoot!.querySelectorAll('[data-value]')).toHaveLength(24);
});

test('[SC-013] all ten declared parts are present and targetable from outside', async () => {
  const element = await mount();
  const style = document.createElement('style');
  style.dataset['transitionMatrixTest'] = 'parts';
  style.textContent = `
    sk-transition-matrix::part(header) { outline-style: dashed; }
    sk-transition-matrix::part(legend) { outline-style: dotted; }
    sk-transition-matrix::part(scroller) { outline-style: double; }
    sk-transition-matrix::part(table) { outline-style: solid; }
    sk-transition-matrix::part(group) { text-decoration-line: underline; }
    sk-transition-matrix::part(row) { text-decoration-line: overline; }
    sk-transition-matrix::part(route) { text-decoration-line: line-through; }
    sk-transition-matrix::part(bar) { border-style: dashed; }
    sk-transition-matrix::part(total) { border-style: dotted; }
    sk-transition-matrix::part(empty-state) { border-style: double; }
  `;
  document.head.append(style);
  const node = (part: string) => element.shadowRoot!.querySelector<HTMLElement>(`[part~="${part}"]`)!;
  expect(getComputedStyle(node('header')).outlineStyle).toBe('dashed');
  expect(getComputedStyle(node('legend')).outlineStyle).toBe('dotted');
  expect(getComputedStyle(node('scroller')).outlineStyle).toBe('double');
  expect(getComputedStyle(node('table')).outlineStyle).toBe('solid');
  expect(getComputedStyle(node('group')).textDecorationLine).toContain('underline');
  expect(getComputedStyle(node('row')).textDecorationLine).toContain('overline');
  expect(getComputedStyle(node('route')).textDecorationLine).toContain('line-through');
  expect(getComputedStyle(node('bar')).borderStyle).toBe('dashed');
  expect(getComputedStyle(node('total')).borderStyle).toBe('dotted');
  const empty = await mount([], []);
  expect(getComputedStyle(empty.shadowRoot!.querySelector<HTMLElement>('[part~="empty-state"]')!).borderStyle).toBe('double');
});

test('[SC-014] the named generated sheet is adopted exactly once with no style element', async () => {
  const element = await mount();
  expect(element.shadowRoot!.adoptedStyleSheets).toHaveLength(1);
  expect(element.shadowRoot!.adoptedStyleSheets[0]).toBe(skTransitionMatrixSheet);
  expect(element.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

test('published token dependencies exactly match authored CSS references (FR-018 NFR-007)', () => {
  const cssTokens = [...new Set(transitionMatrixCss.match(/--sk-[a-z0-9-]+/g) ?? [])].sort();
  const published = `${transitionMatrixSource}\n${transitionMatrixStorySource}`;
  for (const token of cssTokens) expect(published, `${token} is used but not published`).toContain(token);
  const classDoc = transitionMatrixSource.match(/Token dependencies:([\s\S]*?)\n \*\n \* @element/)?.[1] ?? '';
  const classTokens = [...new Set(classDoc.match(/--sk-[a-z0-9-]+/g) ?? [])].sort();
  expect(classTokens).toEqual(cssTokens);
  const storyDoc = transitionMatrixStorySource.match(/const tokenDependencies = \[([\s\S]*?)\]\.join/)?.[1] ?? '';
  const storyTokens = [...new Set(storyDoc.match(/--sk-[a-z0-9-]+/g) ?? [])].sort();
  expect(storyTokens).toEqual(cssTokens);
});

test('reusable element source contains no Team Kitty application ownership or clean-v4 copy (FR-022 C-003)', () => {
  expect(transitionMatrixSource).not.toMatch(/last 72 hours|Today · Fri 4|WPs|Date\.now|fetch\(|router|store|setInterval|setTimeout/);
  expect(transitionMatrixSource).not.toMatch(/current open|open WPs|50 open/i);
});

test('the public TypeScript contract accepts readonly data and rejects invalid values (FR-001 FR-012 NFR-004)', () => {
  const tone: TransitionTone = 'recovery';
  const detail: TransitionMatrixSelectDetail = { routeId: 'route' };
  const columns: ReadonlyArray<TransitionColumn> = approvedColumns;
  const routes: ReadonlyArray<TransitionRoute> = approvedRoutes;
  expect({ tone, detail, columns, routes }).toBeTruthy();

  // @ts-expect-error tone is a closed semantic set
  const invalidTone: TransitionTone = 'warning';
  // @ts-expect-error move counts are numbers
  const invalidCount: TransitionRoute = { id: 'x', label: 'X', tone: 'forward', values: { a: '1' } };
  // @ts-expect-error detail carries the stable route id
  const invalidDetail: TransitionMatrixSelectDetail = { id: 'route' };
  expect([invalidTone, invalidCount, invalidDetail]).toHaveLength(3);
});

type MatrixDeclaredPropertyNames = keyof typeof SkTransitionMatrix.properties;
type MatrixContractPropertyNames = keyof TransitionMatrixProperties;
type ExactMatrixPropertyNames =
  Exclude<MatrixDeclaredPropertyNames, MatrixContractPropertyNames> extends never
    ? Exclude<MatrixContractPropertyNames, MatrixDeclaredPropertyNames> extends never
      ? true
      : false
    : false;

test('TransitionMatrixProperties covers exactly the seven declared public properties', () => {
  const exactPropertyNames: ExactMatrixPropertyNames = true;
  const allProperties = {
    columns: approvedColumns,
    routes: approvedRoutes,
    selectedRouteId: 'planned-progress',
    selectable: true,
    windowLabel: 'consumer window',
    description: 'Consumer description.',
    selectionHint: 'Consumer hint.',
  } satisfies TransitionMatrixProperties;
  const requiredPropertiesOnly = {
    columns: approvedColumns,
    routes: approvedRoutes,
    selectable: false,
  } satisfies TransitionMatrixProperties;

  // @ts-expect-error columns remain structured readonly data
  const invalidColumns: TransitionMatrixProperties = { ...allProperties, columns: 'columns' };
  // @ts-expect-error routes remain structured readonly data
  const invalidRoutes: TransitionMatrixProperties = { ...allProperties, routes: 'routes' };
  // @ts-expect-error selectedRouteId remains optional consumer-authored text
  const invalidSelectedRouteId: TransitionMatrixProperties = { ...allProperties, selectedRouteId: 1 };
  // @ts-expect-error selectable remains boolean
  const invalidSelectable: TransitionMatrixProperties = { ...allProperties, selectable: 'true' };
  // @ts-expect-error windowLabel remains optional consumer-authored text
  const invalidWindowLabel: TransitionMatrixProperties = { ...allProperties, windowLabel: 1 };
  // @ts-expect-error description remains optional consumer-authored text
  const invalidDescription: TransitionMatrixProperties = { ...allProperties, description: 1 };
  // @ts-expect-error selectionHint remains optional consumer-authored text
  const invalidSelectionHint: TransitionMatrixProperties = { ...allProperties, selectionHint: 1 };

  expect({
    exactPropertyNames,
    allProperties,
    requiredPropertiesOnly,
    invalidColumns,
    invalidRoutes,
    invalidSelectedRouteId,
    invalidSelectable,
    invalidWindowLabel,
    invalidDescription,
    invalidSelectionHint,
  }).toBeTruthy();
});
