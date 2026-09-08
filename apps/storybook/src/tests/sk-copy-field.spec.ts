import { expect, test, type Locator, type Page } from '@playwright/test';

const story = async (page: Page, id = 'default'): Promise<Locator> => {
  await page.goto(`/iframe.html?id=elements-skcopyfield--${id}&viewMode=story`);
  const host = page.locator('sk-copy-field').first();
  await host.waitFor({ state: 'visible' });
  return host;
};

const installFocusSentinels = async (host: Locator): Promise<void> => {
  await host.evaluate((element) => {
    const before = document.createElement('button');
    before.type = 'button';
    before.textContent = 'Before copy field';
    before.dataset['copyFieldSentinel'] = 'before';
    const after = document.createElement('button');
    after.type = 'button';
    after.textContent = 'After copy field';
    after.dataset['copyFieldSentinel'] = 'after';
    element.before(before);
    element.after(after);
  });
};

test('the accessibility tree exposes the exact value, named control, and stable announced outcome', async ({ page }) => {
  const host = await story(page);
  const button = host.getByRole('button', { name: 'Copy value', exact: true });
  const liveStatus = host.getByRole('status');
  await expect(button).toBeVisible();
  await expect(liveStatus).toBeAttached();
  await expect(liveStatus).toHaveAttribute('aria-live', 'polite');
  await expect(liveStatus).toHaveAttribute('aria-atomic', 'true');
  const exactValue = await host.locator('[part="value"]').textContent();
  expect(exactValue).toBe('npm run quality:all');
  const before = await host.ariaSnapshot();
  expect(before).toContain(exactValue!);
  expect(before).toContain('button "Copy value"');
  expect(before).not.toContain('Value copied.');
  expect(await liveStatus.ariaSnapshot()).toMatch(/^- status\s*$/m);
  await liveStatus.evaluate((node) => {
    (node as HTMLElement & { __copyFieldIdentity?: boolean }).__copyFieldIdentity = true;
  });
  await host.evaluate((element) => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => undefined },
    });
    (element.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
  });
  await expect(liveStatus).toHaveText('Value copied.');
  expect(await liveStatus.ariaSnapshot()).toContain('status: Value copied.');
  expect(await liveStatus.evaluate(
    (node) => (node as HTMLElement & { __copyFieldIdentity?: boolean }).__copyFieldIdentity,
  )).toBe(true);
});

test('real Tab traversal has one native component stop when non-empty and zero when empty', async ({ page }) => {
  let host = await story(page);
  await installFocusSentinels(host);
  const before = page.getByRole('button', { name: 'Before copy field', exact: true });
  const after = page.getByRole('button', { name: 'After copy field', exact: true });
  const copy = host.getByRole('button', { name: 'Copy value', exact: true });

  await before.focus();
  await page.keyboard.press('Tab');
  await expect(copy).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();

  host = await story(page, 'disabled-empty');
  await installFocusSentinels(host);
  const emptyBefore = page.getByRole('button', { name: 'Before copy field', exact: true });
  const emptyAfter = page.getByRole('button', { name: 'After copy field', exact: true });
  await expect(host.getByRole('button', { name: 'Copy value', exact: true })).toBeDisabled();
  await emptyBefore.focus();
  await page.keyboard.press('Tab');
  await expect(emptyAfter).toBeFocused();
});

test('pointer, Enter, and Space copy exact visible bytes once and keep focus', async ({ page }) => {
  const host = await story(page, 'quotes-and-unicode');
  const button = host.locator('button');
  await host.evaluate((element) => {
    const state = globalThis as typeof globalThis & {
      __copyFieldOutcomes: string[];
      __copyFieldWrites: string[];
    };
    state.__copyFieldOutcomes = [];
    state.__copyFieldWrites = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          state.__copyFieldWrites.push(value);
        },
      },
    });
    element.addEventListener('sk-copy-field-result', (event) => {
      state.__copyFieldOutcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
    });
  });
  const displayed = await host.locator('[part="value"]').textContent();

  await button.click();
  await button.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(host.locator('[part="status"]')).toHaveText('Value copied.');
  await expect(button).toBeFocused();
  const result = await host.evaluate(() => {
    const state = globalThis as typeof globalThis & {
      __copyFieldOutcomes: string[];
      __copyFieldWrites: string[];
    };
    return { outcomes: state.__copyFieldOutcomes, writes: state.__copyFieldWrites };
  });
  expect(result.writes).toEqual([displayed, displayed, displayed]);
  expect(result.outcomes).toEqual(['copied', 'copied', 'copied']);
});

test('empty is disabled while whitespace is copyable', async ({ page }) => {
  const empty = await story(page, 'disabled-empty');
  await expect(empty.locator('button')).toBeDisabled();
  await expect(empty.locator('[part="status"]')).toBeEmpty();
  await empty.evaluate((element: HTMLElement & { value: string }) => { element.value = '   '; });
  await expect(empty.locator('button')).toBeEnabled();
});

test('long values wrap without horizontal clipping at narrow responsive widths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  const host = await story(page, 'long-wrapping-command');
  const dimensions = await host.evaluate((element) => ({
    hostWidth: element.getBoundingClientRect().width,
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    valueWidth: element.shadowRoot!.querySelector('[part="value"]')!.getBoundingClientRect().width,
  }));
  expect(dimensions.hostWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.pageWidth).toBe(dimensions.viewportWidth);
  expect(dimensions.valueWidth).toBeLessThan(dimensions.hostWidth);
});

test('long values remain contained when fixed-window 400% zoom yields a 195px CSS viewport', async ({ page }) => {
  await page.setViewportSize({ width: 195, height: 253 });
  const host = await story(page, 'long-wrapping-command');
  const dimensions = await host.evaluate((element) => {
    const value = element.shadowRoot!.querySelector<HTMLElement>('[part="value"]')!;
    return {
      hostRight: element.getBoundingClientRect().right,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      valueWidth: value.getBoundingClientRect().width,
      valueClientWidth: value.clientWidth,
      valueScrollWidth: value.scrollWidth,
    };
  });
  expect(dimensions.hostRight).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.pageWidth).toBe(dimensions.viewportWidth);
  expect(dimensions.valueWidth).toBeGreaterThan(0);
  expect(dimensions.valueScrollWidth).toBeLessThanOrEqual(dimensions.valueClientWidth + 1);
});

test('a roughly 115px host reflows safely inside a wide page viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  const host = await story(page, 'long-wrapping-command');
  const dimensions = await host.evaluate((element) => {
    element.style.inlineSize = '115px';
    const field = element.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
    const value = element.shadowRoot!.querySelector<HTMLElement>('[part="value"]')!;
    const button = element.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
    const fieldRect = field.getBoundingClientRect();
    const valueRect = value.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    return {
      viewportWidth: document.documentElement.clientWidth,
      pageClientWidth: document.documentElement.clientWidth,
      pageScrollWidth: document.documentElement.scrollWidth,
      hostClientWidth: element.clientWidth,
      hostScrollWidth: element.scrollWidth,
      fieldClientWidth: field.clientWidth,
      fieldScrollWidth: field.scrollWidth,
      valueClientWidth: value.clientWidth,
      valueScrollWidth: value.scrollWidth,
      valueText: value.textContent,
      valueOverflow: getComputedStyle(value).overflow,
      gridTemplateColumns: getComputedStyle(field).gridTemplateColumns,
      buttonJustifySelf: getComputedStyle(button).justifySelf,
      valueWidth: valueRect.width,
      valueBottom: valueRect.bottom,
      buttonTop: buttonRect.top,
      buttonRight: buttonRect.right,
      fieldRight: fieldRect.right,
    };
  });
  expect(dimensions.viewportWidth).toBe(1000);
  expect(dimensions.hostClientWidth).toBe(115);
  expect(dimensions.valueWidth).toBeGreaterThan(0);
  expect(dimensions.valueText).toContain('spec-kitty implement copy-field-element');
  expect(dimensions.valueOverflow).toBe('visible');
  expect(dimensions.hostScrollWidth).toBeLessThanOrEqual(dimensions.hostClientWidth);
  expect(dimensions.fieldScrollWidth).toBeLessThanOrEqual(dimensions.fieldClientWidth);
  expect(dimensions.valueScrollWidth).toBeLessThanOrEqual(dimensions.valueClientWidth + 1);
  expect(dimensions.pageScrollWidth).toBe(dimensions.pageClientWidth);
  expect(dimensions.gridTemplateColumns).not.toContain(' ');
  expect(dimensions.buttonJustifySelf).toBe('end');
  expect(dimensions.buttonTop).toBeGreaterThanOrEqual(dimensions.valueBottom);
  expect(dimensions.buttonRight).toBeLessThanOrEqual(dimensions.fieldRight);
});

test('value mutation clears stale feedback and old completion cannot restore it', async ({ page }) => {
  const host = await story(page);
  await host.evaluate((element) => {
    const state = globalThis as typeof globalThis & { __finishCopyFieldWrite: () => void };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => new Promise<void>((resolve) => {
          state.__finishCopyFieldWrite = resolve;
        }),
      },
    });
    (element.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
  });
  await host.evaluate((element: HTMLElement & { value: string }) => { element.value = 'new bytes'; });
  await expect(host.locator('[part="status"]')).toBeEmpty();
  await host.evaluate(() => {
    (globalThis as typeof globalThis & { __finishCopyFieldWrite: () => void }).__finishCopyFieldWrite();
  });
  await page.waitForTimeout(0);
  await expect(host.locator('[part="status"]')).toBeEmpty();
  await expect(host.locator('[part="value"]')).toHaveText('new bytes');
});

test('a stale rejected attempt cannot focus or select the newer value', async ({ page }) => {
  const host = await story(page);
  const button = host.locator('button');
  await button.focus();
  await host.evaluate((element) => {
    const state = globalThis as typeof globalThis & {
      __copyFieldReject: (reason?: unknown) => void;
      __copyFieldStale: { focus: number; selection: number; outcomes: string[] };
    };
    state.__copyFieldStale = { focus: 0, selection: 0, outcomes: [] };
    const value = element.shadowRoot!.querySelector('[part="value"]') as HTMLElement;
    value.focus = () => { state.__copyFieldStale.focus += 1; };
    Object.defineProperty(globalThis, 'getSelection', {
      configurable: true,
      value: () => {
        state.__copyFieldStale.selection += 1;
        return null;
      },
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => new Promise<void>((_resolve, reject) => {
          state.__copyFieldReject = reject;
        }),
      },
    });
    element.addEventListener('sk-copy-field-result', (event) => {
      state.__copyFieldStale.outcomes.push(
        (event as CustomEvent<{ outcome: string }>).detail.outcome,
      );
    });
    (element.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
  });
  await host.evaluate((element: HTMLElement & { value: string }) => { element.value = 'new value'; });
  await host.evaluate(() => {
    (globalThis as typeof globalThis & { __copyFieldReject: (reason?: unknown) => void })
      .__copyFieldReject(new Error('denied'));
  });
  await expect.poll(() => host.evaluate(() => (
    globalThis as typeof globalThis & { __copyFieldStale: { outcomes: string[] } }
  ).__copyFieldStale.outcomes)).toEqual(['failed']);
  expect(await host.evaluate(() => (
    globalThis as typeof globalThis & {
      __copyFieldStale: { focus: number; selection: number; outcomes: string[] };
    }
  ).__copyFieldStale)).toEqual({ focus: 0, selection: 0, outcomes: ['failed'] });
  await expect(button).toBeFocused();
  await expect(host.locator('[part="status"]')).toBeEmpty();
  await expect(host.locator('[part="value"]')).toHaveText('new value');
});

test('manual fallback makes exactly one selection attempt per activation', async ({ page }) => {
  const host = await story(page);
  await host.evaluate((element) => {
    const state = globalThis as typeof globalThis & {
      __copyFieldSelectionCounts: { remove: number; add: number };
    };
    state.__copyFieldSelectionCounts = { remove: 0, add: 0 };
    const value = element.shadowRoot!.querySelector('[part="value"]') as HTMLElement;
    const selection = {
      removeAllRanges: () => { state.__copyFieldSelectionCounts.remove += 1; },
      addRange: () => { state.__copyFieldSelectionCounts.add += 1; },
      toString: () => value.textContent ?? '',
    };
    Object.defineProperty(globalThis, 'getSelection', {
      configurable: true,
      value: () => selection,
    });
    Object.defineProperty(globalThis, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    (element.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
  });
  await expect(host.locator('[part="status"]')).toHaveText(
    'Value selected. Use your system copy shortcut to copy it.',
  );
  expect(await host.evaluate(() => (
    globalThis as typeof globalThis & {
      __copyFieldSelectionCounts: { remove: number; add: number };
    }
  ).__copyFieldSelectionCounts)).toEqual({ remove: 1, add: 1 });
});

test('the Active story proves native :active only while a trusted pointer is held', async ({ page }) => {
  const host = await story(page, 'active');
  const button = host.locator('button');
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  expect(await button.evaluate((node) => node.matches(':active'))).toBe(true);
  await page.mouse.up();
  expect(await button.evaluate((node) => node.matches(':active'))).toBe(false);
});

test('manual and failed stories never claim clipboard success', async ({ page }) => {
  for (const [id, expected] of [
    ['manual-fallback', 'Value selected. Use your system copy shortcut to copy it.'],
    ['failure', 'Unable to copy or select the value.'],
  ] as const) {
    const host = await story(page, id);
    await expect(host.locator('[part="status"]')).toHaveText(expected);
    await expect(host.locator('[part="status"]')).not.toContainText('Value copied.');
    if (id === 'manual-fallback') {
      const selection = await host.evaluate((element) => ({
        activePart: element.shadowRoot!.activeElement?.getAttribute('part'),
        selected: globalThis.getSelection()?.toString(),
        value: element.shadowRoot!.querySelector('[part="value"]')?.textContent,
      }));
      expect(selection.activePart).toBe('value');
      expect(selection.selected).toBe(selection.value);
    }
  }
});

test('dark and LightMode resolve distinct token surfaces with one native tab stop', async ({ page }) => {
  const dark = await story(page, 'default-dark');
  const darkSurface = await dark.locator('[part="field"]').evaluate((field) => getComputedStyle(field).backgroundColor);
  await expect(dark.locator('button')).toBeEnabled();
  expect(await dark.evaluate((element) => ({
    hostTabIndex: (element as HTMLElement).tabIndex,
    buttonTabIndex: (element.shadowRoot!.querySelector('button') as HTMLButtonElement).tabIndex,
    valueTabIndex: (element.shadowRoot!.querySelector('[part="value"]') as HTMLElement).tabIndex,
  }))).toEqual({ hostTabIndex: -1, buttonTabIndex: 0, valueTabIndex: -1 });

  const light = await story(page, 'light-mode');
  const lightSurface = await light.locator('[part="field"]').evaluate((field) => getComputedStyle(field).backgroundColor);
  expect(lightSurface).not.toBe(darkSurface);
});

test('reduced motion removes component-local animation and transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const host = await story(page);
  const motion = await host.locator('button').evaluate((button) => {
    const style = getComputedStyle(button);
    return { animation: style.animationDuration, transition: style.transitionDuration };
  });
  expect(motion.animation).toBe('0s');
  expect(motion.transition).toBe('0s');
});
