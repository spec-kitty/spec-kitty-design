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
  expect(await anchor.ariaSnapshot()).toContain('link "team-landing-pivots"');
  for (const suppliedText of [
    'spec-kitty/e2e-team-landing',
    'WP status changed',
    'Fresh',
    '2 hours ago',
  ]) {
    await expect(host.getByText(suppliedText, { exact: true })).toBeVisible();
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

for (const name of ['route', 'route-flush', 'button-flush', 'selected-flush', 'unknown-presentation']) {
  for (const width of [220, 280, 360]) {
    test(`${name} remains contained at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 720 });
      const host = await load(page, name);
      await host.evaluate((element, nextWidth) => {
        const frame = element.parentElement!;
        frame.style.boxSizing = 'border-box';
        frame.style.width = `${nextWidth}px`;
        frame.style.padding = '0';
      }, width);
      const geometry = await host.evaluate((element) => {
        const trigger = element.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
        trigger.focus();
        const row = element.shadowRoot!.querySelector<HTMLElement>('[part="row"]')!;
        return {
          documentClient: document.documentElement.clientWidth,
          documentScroll: document.scrollingElement!.scrollWidth,
          rowClient: row.clientWidth,
          rowScroll: row.scrollWidth,
          triggerClient: trigger.clientWidth,
          triggerScroll: trigger.scrollWidth,
          outline: getComputedStyle(trigger).outlineStyle,
        };
      });
      expect(geometry.documentScroll).toBeLessThanOrEqual(geometry.documentClient);
      expect(geometry.rowScroll).toBeLessThanOrEqual(geometry.rowClient);
      expect(geometry.triggerScroll).toBeLessThanOrEqual(geometry.triggerClient);
      expect(geometry.outline).not.toBe('none');
    });
  }
}

test('the 640px viewport is explicitly the reflow proxy, not browser-UI zoom evidence', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 720 });
  const host = await load(page, 'route-flush');
  const geometry = await host.evaluate((element) => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.scrollingElement!.scrollWidth,
    hostWidth: element.getBoundingClientRect().width,
  }));
  expect(geometry.viewport).toBe(640);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport);
  expect(geometry.hostWidth).toBeLessThanOrEqual(geometry.viewport);
});

test('route focus transition is disabled under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const host = await load(page, 'route');
  await expect(host.locator('[part="trigger"]')).toHaveCSS('transition-property', 'none');
});
