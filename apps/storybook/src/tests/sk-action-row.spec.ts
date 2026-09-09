import { expect, test, type Locator, type Page } from '@playwright/test';

const story = (name: string) => `/iframe.html?id=elements-skactionrow--${name}&viewMode=story`;

const load = async (page: Page, name = 'default'): Promise<Locator> => {
  await page.goto(story(name));
  const host = page.locator('sk-action-row').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  await page.evaluate(() => customElements.whenDefined('sk-action-row'));
  await host.evaluate((element) =>
    (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete,
  );
  return host;
};

const setPublicState = async (
  host: Locator,
  state: { href?: string; presentation?: string; selectable?: boolean; selected?: boolean },
) => {
  await host.evaluate(async (element, next) => {
    const row = element as HTMLElement & {
      href?: string;
      presentation?: string;
      selectable: boolean;
      selected: boolean;
      updateComplete: Promise<unknown>;
    };
    row.href = next.href;
    row.presentation = next.presentation;
    if (next.selectable !== undefined) row.selectable = next.selectable;
    if (next.selected !== undefined) row.selected = next.selected;
    await row.updateComplete;
  }, state);
};

test('route mode preserves native destination, keyboard, modified-click, and context-menu semantics', async ({
  page,
}) => {
  const host = await load(page, 'with-controls');
  await setPublicState(host, { href: '#native-destination', selectable: false });
  const anchor = host.locator('[part="trigger"]');

  await expect(anchor).toHaveJSProperty('tagName', 'A');
  await expect(anchor).toHaveAttribute('href', '#native-destination');
  await expect(anchor).toHaveAccessibleName('team-landing-pivots');
  const accessibilityTree = await anchor.ariaSnapshot();
  expect(accessibilityTree).toContain('link "team-landing-pivots"');
  for (const suppliedText of [
    'spec-kitty/e2e-team-landing',
    'WP status changed',
    'Fresh',
    '2 hours ago',
    'Consumer-supplied supporting context',
  ]) {
    await expect(host.getByText(suppliedText, { exact: true })).toBeVisible();
    expect(accessibilityTree).toContain(suppliedText);
  }
  expect(await anchor.evaluate((trigger) =>
    Array.from(trigger.querySelectorAll<HTMLSlotElement>('slot:not([name="title"])'))
      .flatMap((slot) => slot.assignedElements({ flatten: true }))
      .every((element) =>
        !element.hasAttribute('aria-hidden') && !element.matches('a,button,[tabindex],[role="button"],[role="link"]'),
      ),
  )).toBe(true);
  await expect(anchor).not.toHaveAttribute('target', /.*/);
  await expect(anchor).not.toHaveAttribute('rel', /.*/);
  expect(await host.evaluate((element) => element.hasAttribute('tabindex'))).toBe(false);
  expect(accessibilityTree.match(/\b(?:link|button) "/g)).toHaveLength(1);

  await anchor.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe('#native-destination');

  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search));
  await anchor.focus();
  await page.keyboard.press('Space');
  expect(new URL(page.url()).hash).toBe('');

  const gestures = await anchor.evaluate((element) => ({
    ctrl: element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })),
    meta: element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true })),
    shift: element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true })),
    context: element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
  }));
  expect(gestures).toEqual({ ctrl: true, meta: true, shift: true, context: true });
  await expect(page.getByRole('link', { name: 'Details' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pin', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Inspect' })).toBeVisible();

  const routeExample = page.locator('sk-action-row[data-route-controls]');
  await expect(routeExample).toHaveAttribute('href', '#activity-route-controls');
  await expect(routeExample).toHaveAttribute('presentation', 'flush');
  await expect(routeExample.locator('[part="trigger"]')).toHaveAccessibleName(
    'Native route with independent controls',
  );
  await expect(routeExample.getByRole('button', { name: 'Pin route' })).toBeVisible();
  expect(await routeExample.locator('[part="trigger"]').evaluate((trigger) =>
    trigger.contains(trigger.parentElement!.querySelector('[part="controls"]')),
  )).toBe(false);
});

for (const mode of [
  { name: 'static', state: { selectable: false } },
  { name: 'static flush', state: { selectable: false, presentation: 'flush' } },
  { name: 'button', state: { selectable: true } },
  { name: 'button flush', state: { selectable: true, presentation: 'flush' } },
  { name: 'route', state: { selectable: false, href: '#row-route' } },
  { name: 'route flush', state: { selectable: false, href: '#row-route', presentation: 'flush' } },
] as const) {
  test(`${mode.name} keeps external controls on their own Tab and activation paths`, async ({ page }) => {
    const host = await load(page, 'with-controls');
    await setPublicState(host, mode.state);
    const trigger = host.locator('[part="trigger"]');
    const details = host.getByRole('link', { name: 'Details' });
    const pin = host.getByRole('button', { name: 'Pin', exact: true });
    const inspect = host.getByRole('button', { name: 'Inspect' });

    await host.evaluate((element) => {
      const row = element as HTMLElement & {
        __controlsProbe?: { details: number; pin: number; inspect: number; row: number };
      };
      const probe = { details: 0, pin: 0, inspect: 0, row: 0 };
      row.__controlsProbe = probe;
      row.addEventListener('sk-action-row-activate', () => probe.row += 1);
      row.querySelector('[data-native-link]')!.addEventListener('click', () => probe.details += 1);
      row.querySelector('[data-native-button]')!.addEventListener('click', () => probe.pin += 1);
      row.querySelector('[data-sk-button]')!.addEventListener('click', () => probe.inspect += 1);
    });
    await page.evaluate(() => {
      history.replaceState(null, '', location.pathname + location.search);
      document.body.tabIndex = -1;
      document.body.focus();
    });

    await page.keyboard.press('Tab');
    if (mode.name.startsWith('static')) {
      await expect(details).toBeFocused();
      await expect(trigger).toHaveJSProperty('tagName', 'DIV');
    } else {
      await expect(trigger).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(details).toBeFocused();
    }

    await page.keyboard.press('Enter');
    expect(new URL(page.url()).hash).toBe('#details');
    await pin.click();
    await page.keyboard.press('Tab');
    await expect(inspect).toBeFocused();
    await page.keyboard.press('Enter');

    const result = await host.evaluate((element) => {
      const row = element as HTMLElement & {
        __controlsProbe?: { details: number; pin: number; inspect: number; row: number };
      };
      const primary = row.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
      const controls = row.shadowRoot!.querySelector<HTMLElement>('[part="controls"]')!;
      return {
        probe: row.__controlsProbe,
        controlsInside: primary.contains(controls),
        hostTabIndex: row.getAttribute('tabindex'),
        primaryInteractive: row.shadowRoot!.querySelectorAll('a,button,[tabindex]').length,
      };
    });
    expect(result).toEqual({
      probe: { details: 1, pin: 1, inspect: 1, row: 0 },
      controlsInside: false,
      hostTabIndex: null,
      primaryInteractive: mode.name.startsWith('static') ? 0 : 1,
    });
    expect(new URL(page.url()).hash).not.toBe('#row-route');
  });
}

test('route mode has one primary tab stop, keeps controls outside it, and emits no custom activation', async ({
  page,
}) => {
  const host = await load(page, 'with-controls');
  const result = await host.evaluate(async (element) => {
    const row = element as HTMLElement & {
      href: string;
      selectable: boolean;
      updateComplete: Promise<unknown>;
    };
    let activations = 0;
    row.addEventListener('sk-action-row-activate', () => activations += 1);
    row.href = '#details-route';
    row.selectable = true;
    await row.updateComplete;
    const trigger = row.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    const controls = row.shadowRoot!.querySelector<HTMLElement>('[part="controls"]')!;
    return {
      activations,
      primaryInteractive: row.shadowRoot!.querySelectorAll('a,button,[tabindex]').length,
      controlsInside: trigger.contains(controls),
      hostTabIndex: row.getAttribute('tabindex'),
    };
  });
  expect(result).toEqual({
    activations: 0,
    primaryInteractive: 1,
    controlsInside: false,
    hostTabIndex: null,
  });
});

test('selected flush removes the forced-colors row edge without hiding focus', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const host = await load(page);
  await setPublicState(host, { presentation: 'flush', selected: true });
  const row = host.locator('[part="row"]');
  const trigger = host.locator('[part="trigger"]');
  await expect(row).toHaveCSS('border-inline-start-width', '0px');
  await trigger.focus();
  await expect(trigger).toBeFocused();
  expect(await trigger.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('forced colors gives the route-flush anchor a visible system-color focus boundary', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, 'forced-colors');
  const host = page.locator('sk-action-row[data-forced-colors-route-flush]').first();
  await host.waitFor({ state: 'visible', timeout: 20000 });
  const trigger = host.locator('[part="trigger"]');
  await expect(trigger).toHaveJSProperty('tagName', 'A');
  await expect(trigger).toHaveAttribute('href', '#forced-colors-route-flush');
  await trigger.focus();
  const boundary = await trigger.evaluate((element) => {
    const probe = document.createElement('span');
    probe.style.color = 'Highlight';
    document.body.append(probe);
    const style = getComputedStyle(element);
    const result = {
      forcedColors: matchMedia('(forced-colors: active)').matches,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      systemHighlight: getComputedStyle(probe).color,
    };
    probe.remove();
    return result;
  });
  expect(boundary.forcedColors).toBe(true);
  expect(boundary.outlineStyle).toBe('solid');
  expect(boundary.outlineWidth).not.toBe('0px');
  expect(boundary.outlineColor).toBe(boundary.systemHighlight);
});

const requiredResponsiveStates = [
  { name: 'route', story: 'route' },
  { name: 'route-flush', story: 'route-flush' },
  { name: 'button-flush', story: 'button-flush' },
  { name: 'selected-flush', story: 'selected-flush' },
  {
    name: 'card-flush long content',
    story: 'card-long-content',
    publicState: { presentation: 'flush' },
  },
  {
    name: 'route long content',
    story: 'long-content',
    publicState: { href: '#long-content-route', selectable: false },
  },
  { name: 'route-selected', story: 'route-selected' },
  { name: 'unknown-presentation', story: 'unknown-presentation' },
  {
    name: 'forced-colors route-flush',
    story: 'forced-colors',
    selector: 'sk-action-row[data-forced-colors-route-flush]',
    forcedColors: true,
  },
  {
    name: 'route-flush light',
    story: 'light-mode',
    selector: 'sk-action-row[data-light-route-flush]',
  },
] as const;

const loadResponsiveState = async (
  page: Page,
  state: (typeof requiredResponsiveStates)[number],
): Promise<Locator> => {
  if ('forcedColors' in state) await page.emulateMedia({ forcedColors: 'active' });
  const first = await load(page, state.story);
  if ('publicState' in state) await setPublicState(first, state.publicState);
  if (!('selector' in state)) return first;
  const selected = page.locator(state.selector).first();
  await selected.waitFor({ state: 'visible', timeout: 20000 });
  return selected;
};

const measureContainment = async (host: Locator) =>
  host.evaluate((element) => {
    const trigger = element.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
    trigger.focus();
    const row = element.shadowRoot!.querySelector<HTMLElement>('[part="row"]')!;
    const controls = element.shadowRoot!.querySelector<HTMLElement>('[part="controls"]')!;
    const triggerRect = trigger.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    const assigned = Array.from(trigger.querySelectorAll<HTMLSlotElement>('slot'))
      .flatMap((slot) => slot.assignedElements({ flatten: true }).map((node, index) => ({
        label: `${slot.name}:${index}`,
        rect: node.getBoundingClientRect(),
      })))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0);
    const overlaps = (
      left: { left: number; right: number; top: number; bottom: number },
      right: { left: number; right: number; top: number; bottom: number },
    ) => Math.min(left.right, right.right) - Math.max(left.left, right.left) > 0.5 &&
      Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 0.5;
    const collisions: string[] = [];
    for (const [leftIndex, left] of assigned.entries()) {
      for (const right of assigned.slice(leftIndex + 1)) {
        if (overlaps(left.rect, right.rect)) collisions.push(`${left.label}/${right.label}`);
      }
    }
    const outsideTrigger = assigned
      .filter(({ rect }) =>
        rect.left < triggerRect.left - 0.5 || rect.right > triggerRect.right + 0.5 ||
        rect.top < triggerRect.top - 0.5 || rect.bottom > triggerRect.bottom + 0.5,
      )
      .map(({ label }) => label);
    const triggerStyle = getComputedStyle(trigger);
    const outlineExpansion = Math.max(
      0,
      Number.parseFloat(triggerStyle.outlineWidth) + Number.parseFloat(triggerStyle.outlineOffset),
    );
    return {
      documentClient: document.documentElement.clientWidth,
      documentScroll: document.scrollingElement!.scrollWidth,
      rowClient: row.clientWidth,
      rowScroll: row.scrollWidth,
      triggerClient: trigger.clientWidth,
      triggerScroll: trigger.scrollWidth,
      outline: triggerStyle.outlineStyle,
      focusLeft: triggerRect.left - outlineExpansion,
      focusRight: triggerRect.right + outlineExpansion,
      collisions,
      outsideTrigger,
      controlsCollision: controlsRect.width > 0 && controlsRect.height > 0 && overlaps(triggerRect, controlsRect),
      forcedColors: matchMedia('(forced-colors: active)').matches,
    };
  });

const expectContained = (
  geometry: Awaited<ReturnType<typeof measureContainment>>,
  forcedColors: boolean,
) => {
  expect(geometry.documentScroll).toBeLessThanOrEqual(geometry.documentClient);
  expect(geometry.rowScroll).toBeLessThanOrEqual(geometry.rowClient);
  expect(geometry.triggerScroll).toBeLessThanOrEqual(geometry.triggerClient);
  expect(geometry.outline).not.toBe('none');
  expect(geometry.focusLeft).toBeGreaterThanOrEqual(-0.5);
  expect(geometry.focusRight).toBeLessThanOrEqual(geometry.documentClient + 0.5);
  expect(geometry.collisions).toEqual([]);
  expect(geometry.outsideTrigger).toEqual([]);
  expect(geometry.controlsCollision).toBe(false);
  expect(geometry.forcedColors).toBe(forcedColors);
};

for (const state of requiredResponsiveStates) {
  for (const width of [220, 280, 360]) {
    test(`${state.name} remains contained at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 720 });
      const host = await loadResponsiveState(page, state);
      await host.evaluate((element, nextWidth) => {
        const frame = element.parentElement!;
        frame.style.boxSizing = 'border-box';
        frame.style.width = `${nextWidth}px`;
        frame.style.padding = '0';
      }, width);
      expectContained(await measureContainment(host), 'forcedColors' in state);
    });
  }

  test(`${state.name} remains contained at the 640px reflow proxy`, async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 720 });
    const host = await loadResponsiveState(page, state);
    const geometry = await measureContainment(host);
    expect(geometry.documentClient).toBe(640);
    await expect(host).toBeVisible();
    expectContained(geometry, 'forcedColors' in state);
  });
}

test('route focus transition is disabled under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const host = await load(page, 'route');
  await expect(host.locator('[part="trigger"]')).toHaveCSS('transition-property', 'none');
});
