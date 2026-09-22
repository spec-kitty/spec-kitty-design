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
  const button = host.getByRole('button', { name: 'Copy quality command', exact: true });
  const liveStatus = host.getByRole('status');
  await expect(button).toBeVisible();
  await expect(liveStatus).toBeAttached();
  await expect(liveStatus).toHaveAttribute('aria-live', 'polite');
  await expect(liveStatus).toHaveAttribute('aria-atomic', 'true');
  const exactValue = await host.locator('[part="value"]').textContent();
  expect(exactValue).toBe('npm run quality:all');
  const before = await host.ariaSnapshot();
  expect(before).toContain(exactValue!);
  expect(before).toContain('button "Copy quality command"');
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
  const copy = host.getByRole('button', { name: 'Copy quality command', exact: true });

  await before.focus();
  await page.keyboard.press('Tab');
  await expect(copy).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused();

  host = await story(page, 'disabled-empty');
  await installFocusSentinels(host);
  const emptyBefore = page.getByRole('button', { name: 'Before copy field', exact: true });
  const emptyAfter = page.getByRole('button', { name: 'After copy field', exact: true });
  await expect(host.getByRole('button', { name: 'Copy empty value', exact: true })).toBeDisabled();
  await emptyBefore.focus();
  await page.keyboard.press('Tab');
  await expect(emptyAfter).toBeFocused();
});

test('multiple story controls have distinct names and truthful copied outcomes', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await story(page, 'repeated-and-multiple');
  const hosts = page.locator('sk-copy-field');
  await expect(hosts).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Copy repeated value', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy secondary value', exact: true })).toBeVisible();
  await expect(hosts.nth(0).getByRole('status')).toHaveText('Value copied.');
  await expect(hosts.nth(1).getByRole('status')).toHaveText('Value copied.');
  const snapshot = await page.locator('body').ariaSnapshot();
  expect(snapshot).toContain('button "Copy repeated value"');
  expect(snapshot).toContain('button "Copy secondary value"');
  expect(pageErrors).toEqual([]);
});

test('success stories use navigator.clipboard and expose only copied feedback', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  for (const id of ['copied-success', 'forced-colors']) {
    const host = await story(page, id);
    await expect(host.getByRole('status')).toHaveText('Value copied.');
    await expect(host.getByRole('status')).not.toContainText('selected');
    await expect(host.getByRole('status')).not.toContainText('Unable');
  }
  expect(pageErrors).toEqual([]);
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
  await page.evaluate(() => { document.documentElement.style.overflowY = 'scroll'; });
  const dimensions = await host.evaluate((element) => {
    const value = element.shadowRoot!.querySelector<HTMLElement>('[part="value"]')!;
    const frame = element.parentElement!;
    return {
      hostRight: element.getBoundingClientRect().right,
      frameRight: frame.getBoundingClientRect().right,
      innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      valueWidth: value.getBoundingClientRect().width,
      valueClientWidth: value.clientWidth,
      valueScrollWidth: value.scrollWidth,
    };
  });
  expect(dimensions.hostRight).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.frameRight).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.innerWidth).toBeGreaterThanOrEqual(dimensions.viewportWidth);
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

test('normal-flow, flex-item, and grid-item hosts retain usable inline sizing', async ({ page }) => {
  const source = await story(page, 'long-wrapping-command');
  const dimensions = await source.evaluate(async (element) => {
    const results: Array<{ layout: string; hostWidth: number; fieldWidth: number }> = [];
    for (const layout of ['normal', 'flex', 'grid']) {
      const container = document.createElement('div');
      container.style.inlineSize = '640px';
      if (layout !== 'normal') container.style.display = layout;
      const host = document.createElement('sk-copy-field') as HTMLElement & {
        label: string;
        updateComplete: Promise<unknown>;
        value: string;
      };
      host.label = `Copy ${layout} value`;
      host.value = element.getAttribute('value') ?? '';
      container.append(host);
      document.body.append(container);
      await host.updateComplete;
      results.push({
        layout,
        hostWidth: host.getBoundingClientRect().width,
        fieldWidth: host.shadowRoot!.querySelector('[part="field"]')!.getBoundingClientRect().width,
      });
      container.remove();
    }
    return results;
  });
  for (const result of dimensions) {
    expect(result.hostWidth, result.layout).toBeGreaterThan(300);
    expect(result.fieldWidth, result.layout).toBeGreaterThan(300);
    expect(result.fieldWidth, result.layout).toBeLessThanOrEqual(result.hostWidth);
  }
});

test('the logical container threshold follows the host inline axis in vertical writing', async ({ page }) => {
  const host = await story(page, 'long-wrapping-command');
  const columns = await host.evaluate(async (element) => {
    const field = element.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
    element.style.writingMode = 'vertical-rl';
    element.style.blockSize = '22rem';
    element.style.inlineSize = '19rem';
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const narrow = getComputedStyle(field).gridTemplateColumns;
    element.style.inlineSize = '21rem';
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const wide = getComputedStyle(field).gridTemplateColumns;
    return { narrow, wide };
  });
  expect(columns.narrow.trim().split(/\s+/)).toHaveLength(1);
  expect(columns.wide.trim().split(/\s+/)).toHaveLength(2);
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
      __copyFieldSelectionAttempt: { exactBounds: boolean; set: number };
    };
    state.__copyFieldSelectionAttempt = { exactBounds: false, set: 0 };
    const value = element.shadowRoot!.querySelector('[part="value"]') as HTMLElement;
    const selection = {
      setBaseAndExtent: (
        anchorNode: Node,
        anchorOffset: number,
        focusNode: Node,
        focusOffset: number,
      ) => {
        state.__copyFieldSelectionAttempt.set += 1;
        state.__copyFieldSelectionAttempt.exactBounds =
          anchorNode === value &&
          anchorOffset === 0 &&
          focusNode === value &&
          focusOffset === value.childNodes.length;
      },
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
      __copyFieldSelectionAttempt: { exactBounds: boolean; set: number };
    }
  ).__copyFieldSelectionAttempt)).toEqual({ exactBounds: true, set: 1 });
});

for (const clipboardFailure of ['absent', 'non-callable', 'sync throw', 'reject'] as const) {
  test(`real pointer fallback contains ${clipboardFailure} clipboard failure`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const host = await story(page, 'quotes-and-unicode');
    await host.evaluate((element, failure) => {
      const state = globalThis as typeof globalThis & {
        __copyFieldFallback: { outcomes: string[]; unhandled: string[] };
      };
      state.__copyFieldFallback = { outcomes: [], unhandled: [] };
      globalThis.addEventListener('unhandledrejection', (event) => {
        state.__copyFieldFallback.unhandled.push(String(event.reason));
      });
      const clipboard = failure === 'absent'
        ? undefined
        : failure === 'non-callable'
          ? { writeText: 'not callable' }
          : failure === 'sync throw'
            ? { writeText: () => { throw new Error('blocked'); } }
            : { writeText: () => Promise.reject(new Error('denied')) };
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
      element.addEventListener('sk-copy-field-result', (event) => {
        state.__copyFieldFallback.outcomes.push(
          (event as CustomEvent<{ outcome: string }>).detail.outcome,
        );
      });
    }, clipboardFailure);

    const button = host.getByRole('button', { name: 'Copy quoted Unicode value', exact: true });
    await button.click();
    await expect(host.getByRole('status')).toHaveText(
      'Value selected. Use your system copy shortcut to copy it.',
    );
    const result = await host.evaluate((element) => {
      const value = element.shadowRoot!.querySelector<HTMLElement>('[part="value"]')!;
      const state = globalThis as typeof globalThis & {
        __copyFieldFallback: { outcomes: string[]; unhandled: string[] };
      };
      return {
        activePart: element.shadowRoot!.activeElement?.getAttribute('part'),
        outlineStyle: getComputedStyle(value).outlineStyle,
        outcomes: state.__copyFieldFallback.outcomes,
        selected: globalThis.getSelection()?.toString(),
        unhandled: state.__copyFieldFallback.unhandled,
        value: value.textContent,
      };
    });
    expect(result.activePart).toBe('value');
    expect(result.selected).toBe(result.value);
    expect(result.outcomes).toEqual(['manual']);
    expect(result.unhandled).toEqual([]);
    expect(result.outlineStyle).not.toBe('none');
    expect(pageErrors).toEqual([]);
  });
}

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
