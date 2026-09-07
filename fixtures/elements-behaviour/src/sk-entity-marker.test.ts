/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
import { beforeEach, expect, test } from 'vitest';
import '../../../packages/elements/src/entity-marker/sk-entity-marker.js';
import skEntityMarkerSheet from '../../../packages/elements/src/entity-marker/sk-entity-marker.css.js';
import { assertThemesDiffered, contrast } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

type MarkerElement = HTMLElement & {
  label?: string;
  size?: 'sm';
  shape?: 'circle';
  updateComplete: Promise<unknown>;
};

const mount = async (label?: string, mark: string | Node = 'SK') => {
  const element = document.createElement('sk-entity-marker') as MarkerElement;
  if (label !== undefined) element.label = label;
  const supplied =
    typeof mark === 'string'
      ? Object.assign(document.createElement('span'), {
          textContent: mark,
        })
      : mark;
  if (supplied instanceof HTMLElement) supplied.dataset['consumerMark'] = 'true';
  element.append(supplied);
  document.body.append(element);
  await element.updateComplete;
  return { element, supplied };
};

const partOf = (element: Element, name: string) =>
  element.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

const px = (value: string): number => Number.parseFloat(value);

const tokenPx = (name: string): number => {
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.width = `var(${name})`;
  document.body.append(probe);
  const value = px(getComputedStyle(probe).width);
  probe.remove();
  return value;
};

const geometryOf = (element: Element) => {
  const marker = partOf(element, 'marker')!;
  const rect = marker.getBoundingClientRect();
  const style = getComputedStyle(marker);
  return {
    width: rect.width,
    height: rect.height,
    radius: style.borderRadius,
    paddingInline: px(style.paddingInlineStart) + px(style.paddingInlineEnd),
    paddingBlock: px(style.paddingBlockStart) + px(style.paddingBlockEnd),
  };
};

const loadedImage = async (width: number, height: number, label: string) => {
  const image = new Image();
  image.alt = '';
  image.dataset['fixture'] = label;
  image.src =
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="red"/></svg>`,
    )}`;
  await image.decode();
  return image;
};

test('a trimmed non-empty label exposes the supplied accessible name and exact mark', async () => {
  const { element, supplied } = await mount('  Spec Kitty  ', 'SP');
  const marker = partOf(element, 'marker')!;
  const slot = partOf(element, 'content')!.querySelector('slot') as HTMLSlotElement;
  expect(marker.getAttribute('role')).toBe('img');
  expect(marker.getAttribute('aria-label')).toBe('Spec Kitty');
  expect(marker.hasAttribute('aria-hidden')).toBe(false);
  expect(slot.assignedElements()).toEqual([supplied]);
  expect(supplied.textContent).toBe('SP');
});

test.each([undefined, '', '   '])('an absent or blank label makes the mark decorative (%s)', async (label) => {
  const { element } = await mount(label, '◇');
  const marker = partOf(element, 'marker')!;
  expect(marker.getAttribute('aria-hidden')).toBe('true');
  expect(marker.hasAttribute('role')).toBe(false);
  expect(marker.hasAttribute('aria-label')).toBe(false);
});

test('omitted axes preserve the current default square geometry', async () => {
  const { element } = await mount('Default marker');
  const geometry = geometryOf(element);
  const expected = tokenPx('--sk-space-7') + tokenPx('--sk-space-1') * 2;
  expect(element.hasAttribute('size')).toBe(false);
  expect(element.hasAttribute('shape')).toBe(false);
  expect(Math.round(geometry.width)).toBe(Math.round(expected));
  expect(Math.round(geometry.height)).toBe(Math.round(expected));
  expect(geometry.radius).toBe(`${tokenPx('--sk-radius-sm')}px`);
});

test('size and shape compose as two independent presentation axes', async () => {
  const cases = [
    { size: undefined, shape: undefined, compact: false, circle: false },
    { size: 'sm', shape: undefined, compact: true, circle: false },
    { size: undefined, shape: 'circle', compact: false, circle: true },
    { size: 'sm', shape: 'circle', compact: true, circle: true },
  ] as const;
  const measured = [];
  for (const current of cases) {
    const { element } = await mount('Axis marker', 'AX');
    if (current.size) element.setAttribute('size', current.size);
    if (current.shape) element.setAttribute('shape', current.shape);
    await element.updateComplete;
    measured.push({ ...current, geometry: geometryOf(element), content: element.textContent });
  }

  const defaultSquare = measured[0]!;
  const compactSquare = measured[1]!;
  const defaultCircle = measured[2]!;
  const compactCircle = measured[3]!;
  expect(compactSquare.geometry.width).toBeLessThan(defaultSquare.geometry.width);
  expect(compactSquare.geometry.height).toBeLessThan(defaultSquare.geometry.height);
  expect(defaultCircle.geometry.width).toBe(defaultSquare.geometry.width);
  expect(defaultCircle.geometry.height).toBe(defaultSquare.geometry.height);
  expect(compactCircle.geometry.width).toBe(compactSquare.geometry.width);
  expect(compactCircle.geometry.height).toBe(compactSquare.geometry.height);
  expect(defaultCircle.geometry.radius).not.toBe(defaultSquare.geometry.radius);
  expect(compactCircle.geometry.radius).not.toBe(compactSquare.geometry.radius);
  expect(measured.map(({ content }) => content)).toEqual(['AX', 'AX', 'AX', 'AX']);
});

test('attributes and properties reflect and remain independently toggleable after upgrade', async () => {
  const { element } = await mount('Toggle marker');
  element.setAttribute('size', 'sm');
  await element.updateComplete;
  expect(element.size).toBe('sm');
  expect(element.hasAttribute('shape')).toBe(false);

  element.setAttribute('shape', 'circle');
  await element.updateComplete;
  expect(element.shape).toBe('circle');
  expect(element.getAttribute('size')).toBe('sm');

  element.size = undefined;
  await element.updateComplete;
  expect(element.size == null).toBe(true);
  expect(element.getAttribute('shape')).toBe('circle');
  const restored = geometryOf(element);
  expect(restored.width).toBeGreaterThan(tokenPx('--sk-space-5'));

  element.shape = undefined;
  await element.updateComplete;
  expect(element.shape == null).toBe(true);
});

test('unknown values warn and fail open on only their own axis without losing content', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  try {
    const { element, supplied } = await mount('Fail-open marker', 'KEPT');

    element.setAttribute('size', '');
    element.setAttribute('shape', 'circle');
    await element.updateComplete;
    const emptySize = geometryOf(element);
    expect(emptySize.width).toBeGreaterThan(tokenPx('--sk-space-5'));
    expect(emptySize.radius).not.toBe(`${tokenPx('--sk-radius-sm')}px`);

    element.setAttribute('size', 'sm');
    element.setAttribute('shape', '');
    await element.updateComplete;
    const emptyShape = geometryOf(element);
    expect(emptyShape.width).toBeLessThan(emptySize.width);
    expect(emptyShape.radius).toBe(`${tokenPx('--sk-radius-sm')}px`);
    expect(warnings).toHaveLength(0);

    element.setAttribute('size', 'huge');
    element.setAttribute('shape', 'circle');
    await element.updateComplete;
    const invalidSize = geometryOf(element);
    expect(invalidSize.radius).not.toBe(`${tokenPx('--sk-radius-sm')}px`);
    expect(supplied.textContent).toBe('KEPT');

    element.setAttribute('size', 'sm');
    element.setAttribute('shape', 'hexagon');
    await element.updateComplete;
    const invalidShape = geometryOf(element);
    expect(invalidShape.width).toBeLessThan(invalidSize.width);
    expect(invalidShape.radius).toBe(`${tokenPx('--sk-radius-sm')}px`);
    expect(warnings.map((entry) => String(entry[0]))).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/unknown entity-marker size "huge"; using default/i),
        expect.stringMatching(/unknown entity-marker shape "hexagon"; using square/i),
      ]),
    );
    expect(warnings).toHaveLength(2);
  } finally {
    console.warn = realWarn;
  }
});

test.each([
  { tag: 'sk-entity-marker-size-late', axis: 'size', value: 'sm' },
  { tag: 'sk-entity-marker-shape-late', axis: 'shape', value: 'circle' },
] as const)('[SC-010] $axis property assigned before definition survives upgrade independently', async ({
  tag,
  axis,
  value,
}) => {
  const element = document.createElement(tag) as MarkerElement;
  if (axis === 'size') element.size = 'sm';
  else element.shape = 'circle';
  element.textContent = axis;
  document.body.append(element);
  const { SkEntityMarker } = await import('@spec-kitty/elements');
  customElements.define(tag, class extends SkEntityMarker {});
  await customElements.whenDefined(tag);
  await element.updateComplete;

  expect(axis === 'size' ? element.size : element.shape).toBe(value);
  expect(element.getAttribute(axis)).toBe(value);
  expect(element.textContent).toBe(axis);
  expect(element.hasAttribute(axis === 'size' ? 'shape' : 'size')).toBe(false);
});

test('consumer initials, icons, and images project verbatim with no derived identity content', async () => {
  const initials = await mount('Initials', 'SK');
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('aria-hidden', 'true');
  icon.append(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
  const iconMarker = await mount('Icon', icon);
  const image = await loadedImage(8, 4, 'verbatim-image');
  const imageMarker = await mount('Image', image);

  for (const { element, supplied } of [initials, iconMarker, imageMarker]) {
    const slot = partOf(element, 'content')!.querySelector('slot') as HTMLSlotElement;
    expect(slot.assignedNodes({ flatten: true })).toEqual([supplied]);
    expect(element.children).toHaveLength(1);
  }
  expect(initials.element.textContent).toBe('SK');
  expect(iconMarker.element.querySelector('svg')).toBe(icon);
  expect(imageMarker.element.querySelector('img')).toBe(image);
});

test.each([
  { width: 4, height: 12, label: 'portrait' },
  { width: 12, height: 4, label: 'landscape' },
])('$label images cover and remain clipped in every size/shape combination', async ({ width, height, label }) => {
  for (const size of [undefined, 'sm'] as const) {
    for (const shape of [undefined, 'circle'] as const) {
      const image = await loadedImage(width, height, `${label}-${size ?? 'default'}-${shape ?? 'square'}`);
      const { element } = await mount(`${label} actor`, image);
      if (size) element.size = size;
      if (shape) element.shape = shape;
      await element.updateComplete;

      const marker = partOf(element, 'marker')!;
      const content = partOf(element, 'content')!;
      const markerRect = marker.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      expect(getComputedStyle(image).objectFit).toBe('cover');
      expect(getComputedStyle(marker).overflow).toBe('hidden');
      expect(Math.round(imageRect.width)).toBe(Math.round(contentRect.width));
      expect(Math.round(imageRect.height)).toBe(Math.round(contentRect.height));
      expect(imageRect.width).toBeLessThanOrEqual(markerRect.width);
      expect(imageRect.height).toBeLessThanOrEqual(markerRect.height);
      expect(Math.round(markerRect.width)).toBe(Math.round(markerRect.height));
    }
  }
});

test('host label is the single meaningful image name and consumer alt is never rewritten', async () => {
  const supported = await loadedImage(8, 4, 'supported-name');
  const { element } = await mount('  Ada Lovelace  ', supported);
  const marker = partOf(element, 'marker')!;
  expect(marker.getAttribute('role')).toBe('img');
  expect(marker.getAttribute('aria-label')).toBe('Ada Lovelace');
  expect(supported.getAttribute('alt')).toBe('');
  await expect.element(marker).toHaveAccessibleName('Ada Lovelace');

  const duplicate = await loadedImage(8, 4, 'duplicate-name');
  duplicate.alt = 'Portrait of Ada Lovelace';
  const duplicateMarker = await mount('Ada Lovelace', duplicate);
  expect(duplicate.alt).toBe('Portrait of Ada Lovelace');
  expect(partOf(duplicateMarker.element, 'marker')!.getAttribute('aria-label')).toBe('Ada Lovelace');

  const decorative = await loadedImage(8, 4, 'decorative-image');
  const decorativeMarker = await mount('   ', decorative);
  expect(partOf(decorativeMarker.element, 'marker')!.getAttribute('aria-hidden')).toBe('true');
  expect(decorative.alt).toBe('');
});

test('[SC-010] a label property assigned before definition survives upgrade and remains reactive', async () => {
  const element = document.createElement('sk-entity-marker-late') as HTMLElement & { label?: string; updateComplete: Promise<unknown> };
  element.label = 'Mission marker';
  element.textContent = 'M';
  document.body.append(element);
  const { SkEntityMarker } = await import('../../../packages/elements/src/entity-marker/sk-entity-marker.js');
  customElements.define('sk-entity-marker-late', class extends SkEntityMarker {});
  await customElements.whenDefined('sk-entity-marker-late');
  await element.updateComplete;

  expect(element.label).toBe('Mission marker');
  expect(element.getAttribute('label')).toBe('Mission marker');
  expect(partOf(element, 'marker')?.getAttribute('aria-label')).toBe('Mission marker');
  element.label = '   ';
  await element.updateComplete;
  expect(partOf(element, 'marker')?.getAttribute('aria-hidden')).toBe('true');
});

test('the mark remains readable in both themes', async () => {
  const surfaces = new Map<string, string>();
  for (const theme of ['dark', 'light'] as const) {
    const wrapper = document.createElement('div');
    if (theme === 'light') wrapper.className = 'sk-light';
    wrapper.style.background = 'var(--sk-surface-page)';
    document.body.append(wrapper);
    const { element } = await mount('Spec Kitty', 'SK');
    wrapper.append(element);
    await element.updateComplete;
    const marker = partOf(element, 'marker')!;
    const foreground = getComputedStyle(partOf(element, 'content')!).color;
    const background = getComputedStyle(marker).backgroundColor;
    surfaces.set(theme, background);
    expect(contrast(foreground, background), `marker text in ${theme}`).toBeGreaterThanOrEqual(4.5);
  }
  assertThemesDiffered(surfaces);
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const { element } = await mount('Spec Kitty');
  const cases: readonly (readonly [string, string])[] = [
    ['marker', 'sk-entity-marker::part(marker) { outline-style: dashed; }'],
    ['content', 'sk-entity-marker::part(content) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of cases) {
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.append(style);
    try {
      const part = partOf(element, name);
      expect(part, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(part!).outlineStyle, `part="${name}" is not targetable`).toBe('dashed');
    } finally {
      style.remove();
    }
  }
  expect(cases).toHaveLength(2);
});

test('[SC-014] the element adopts the generated sheet by identity and injects no style tag', async () => {
  const { element } = await mount();
  const root = element.shadowRoot!;
  expect(root.adoptedStyleSheets).toHaveLength(1);
  expect(root.adoptedStyleSheets[0]).toBe(skEntityMarkerSheet);
  expect(root.querySelectorAll('style')).toHaveLength(0);
});
