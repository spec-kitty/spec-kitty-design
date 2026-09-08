import { expect, test, type Locator, type Page } from '@playwright/test';
import { getViolations, injectAxe } from 'axe-playwright';

const story = (name: string) => `/iframe.html?id=elements-skappshell--${name}&viewMode=story`;

const load = async (page: Page, name: string, viewport = { width: 1200, height: 720 }) => {
  await page.setViewportSize(viewport);
  await page.goto(story(name));
  const shell = page.locator('sk-app-shell');
  await shell.waitFor({ state: 'visible' });
  await page.evaluate(() => customElements.whenDefined('sk-app-shell'));
  await shell.evaluate((element) => (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete);
  return shell;
};

const shadowPart = (shell: Locator, name: string) => shell.locator(`[part="${name}"]`);

const setFrameWidth = async (shell: Locator, width: number) => {
  await shell.locator('..').evaluate((element, nextWidth) => {
    element.style.width = `${nextWidth}px`;
  }, width);
  await expect.poll(() => shell.evaluate((element) => Math.round(element.getBoundingClientRect().width)))
    .toBe(width);
  await shell.evaluate((element) =>
    (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete);
};

const focusState = (root: Locator) => root.evaluate((element) => ({
  containsActive: element.contains(document.activeElement),
  focusWithin: element.matches(':focus-within'),
}));

for (const width of [390, 768, 860]) {
  test(`compact drawer is effective at the inclusive ${width}px shell boundary`, async ({ page }) => {
    const shell = await load(page, `compact-${width}`);
    await expect(shadowPart(shell, 'compact-header')).toBeVisible();
    await expect(shadowPart(shell, 'compact-navigation')).toBeVisible();
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Repository navigation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });
}

test('861px is noncompact and retains the controlled open value', async ({ page }) => {
  const shell = await load(page, 'compact-861');
  await expect(shadowPart(shell, 'compact-header')).toBeHidden();
  await expect(shadowPart(shell, 'compact-navigation')).toBeHidden();
  await expect(shell).toHaveAttribute('open', '');
  await expect(page.getByRole('navigation', { name: 'Product areas' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Repository navigation' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /menu/i })).toHaveCount(0);
});

test('a constrained shell uses its own inline size inside a wider viewport', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 1440, height: 900 });
  expect(Math.round((await shell.boundingBox())!.width)).toBe(390);
  await expect(shadowPart(shell, 'compact-navigation')).toBeVisible();
});

test('the 390px story frame remains contained when browser chrome reduces the CSS viewport', async ({ page }) => {
  const shell = await load(page, 'compact-390', { width: 380, height: 720 });
  const geometry = await shell.locator('..').evaluate((element) => ({
    frameWidth: element.getBoundingClientRect().width,
    pageClientWidth: document.documentElement.clientWidth,
    pageScrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.frameWidth).toBeLessThanOrEqual(geometry.pageClientWidth);
  expect(geometry.pageScrollWidth).toBeLessThanOrEqual(geometry.pageClientWidth);
});

test('compact Menu trigger uses an aria-hidden vector mark without the unsupported hamburger glyph', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 390, height: 720 });
  const trigger = shell.locator('[slot="compact-header"] button');
  const mark = trigger.locator('svg');

  await expect(trigger).toHaveAccessibleName('Menu');
  await expect(mark).toHaveCount(1);
  await expect(mark).toHaveAttribute('aria-hidden', 'true');
  await expect(mark).toHaveAttribute('focusable', 'false');
  await expect(mark.locator('line')).toHaveCount(3);
  expect(await trigger.textContent()).not.toContain('\u2630');
});

test('closed navigation is absent from focus order and the accessibility tree', async ({ page }) => {
  const shell = await load(page, 'compact-closed', { width: 390, height: 720 });
  const drawer = shadowPart(shell, 'compact-navigation');
  await expect(drawer).toBeHidden();
  await expect(drawer).toHaveAttribute('inert', '');
  await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  const assignedNavigation = shell.locator('[slot="compact-navigation"]');
  await expect(assignedNavigation).toHaveAttribute('inert', '');
  await expect(assignedNavigation).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByRole('navigation', { name: 'Repository navigation' })).toHaveCount(0);
  await page.getByRole('button', { name: /menu/i }).focus();
  await page.keyboard.press('Tab');
  expect(await shell.evaluate((element) =>
    element.querySelector('[slot="compact-navigation"]')?.contains(document.activeElement),
  )).toBe(false);
});

test('native presentation attribute removal restores the omitted legacy state without a null warning', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 390, height: 720 });
  const result = await shell.evaluate(async (element) => {
    const appShell = element as HTMLElement & {
      presentation: 'compact' | undefined;
      updateComplete: Promise<unknown>;
    };
    const navigation = appShell.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
    const link = navigation.querySelector<HTMLAnchorElement>('a[href="#missions"]')!;
    const warnings: unknown[][] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args);
    try {
      const compactNavigation = appShell.shadowRoot!
        .querySelector<HTMLElement>('[part="compact-navigation"]')!;
      const startedCompactOpen = appShell.presentation === 'compact'
        && appShell.getAttribute('presentation') === 'compact'
        && appShell.hasAttribute('open')
        && !compactNavigation.hidden;
      link.focus();
      appShell.removeAttribute('presentation');
      await appShell.updateComplete;
      return {
        startedCompactOpen,
        presentationIsUndefined: appShell.presentation === undefined,
        openRetained: appShell.hasAttribute('open'),
        warnings,
        legacyVisible: [
          getComputedStyle(appShell.shadowRoot!.querySelector<HTMLElement>('[part="personal"]')!)
            .display !== 'none',
          getComputedStyle(appShell.shadowRoot!.querySelector<HTMLElement>('[part="context"]')!)
            .display !== 'none',
        ],
        compactHeaderHidden:
          appShell.shadowRoot!.querySelector<HTMLElement>('[part="compact-header"]')!
            .getBoundingClientRect().width === 0,
        compactNavigationHidden: compactNavigation.hidden,
        navigationFocused: navigation.contains(document.activeElement),
      };
    } finally {
      console.warn = originalWarn;
    }
  });

  expect(result).toEqual({
    startedCompactOpen: true,
    presentationIsUndefined: true,
    openRetained: true,
    warnings: [],
    legacyVisible: [true, true],
    compactHeaderHidden: true,
    compactNavigationHidden: true,
    navigationFocused: false,
  });
});

test('native pointer and keyboard activation control state while route close remains consumer-owned', async ({ page }) => {
  const shell = await load(page, 'compact-closed', { width: 390, height: 720 });
  const trigger = page.getByRole('button', { name: /menu/i });
  await trigger.click();
  await expect(shell).toHaveAttribute('open', '');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('link', { name: 'Missions' }).click();
  await expect(shell).not.toHaveAttribute('open', '');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(await shell.evaluate((element) =>
    element.querySelector('[slot="compact-navigation"]')?.contains(document.activeElement),
  )).toBe(false);
  await expect(trigger).not.toBeFocused();

  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(shell).toHaveAttribute('open', '');
});

test('accepted Escape closes before restoring focus to the same-root light-DOM trigger', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 390, height: 720 });
  const trigger = page.getByRole('button', { name: /menu/i });
  const link = shell.locator('[slot="compact-navigation"] a[href="#missions"]');
  const events = await shell.evaluateHandle((element) => {
    const received: Array<{ detail: unknown; bubbles: boolean; composed: boolean; cancelable: boolean }> = [];
    element.addEventListener('sk-app-shell-dismiss', (event) => {
      const custom = event as CustomEvent;
      received.push({
        detail: custom.detail,
        bubbles: custom.bubbles,
        composed: custom.composed,
        cancelable: custom.cancelable,
      });
    });
    return received;
  });
  await link.focus();
  await page.keyboard.press('Escape');
  await expect(shadowPart(shell, 'compact-navigation')).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await events.jsonValue()).toEqual([
    { detail: { reason: 'escape' }, bubbles: true, composed: true, cancelable: false },
  ]);
});

test('rejected Escape followed by ordinary route close releases hidden focus without restoring the trigger', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 390, height: 720 });
  const result = await shell.evaluate(async (element) => {
    const appShell = element as HTMLElement & { open: boolean; updateComplete: Promise<unknown> };
    const trigger = appShell.querySelector<HTMLButtonElement>('[slot="compact-header"] button')!;
    const navigation = appShell.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
    const link = navigation.querySelector<HTMLAnchorElement>('a[href="#missions"]')!;
    appShell.addEventListener('sk-app-shell-dismiss', (event) => event.stopImmediatePropagation(), {
      capture: true,
      once: true,
    });

    link.focus();
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    await appShell.updateComplete;
    await Promise.resolve();
    const rejected = { open: appShell.open, linkFocused: document.activeElement === link };

    appShell.open = false;
    trigger.setAttribute('aria-expanded', 'false');
    await appShell.updateComplete;
    return {
      rejected,
      hidden: appShell.shadowRoot!.querySelector<HTMLElement>('[part="compact-navigation"]')!.hidden,
      navigationFocused: navigation.contains(document.activeElement),
      triggerFocused: document.activeElement === trigger,
    };
  });

  expect(result).toEqual({
    rejected: { open: true, linkFocused: true },
    hidden: true,
    navigationFocused: false,
    triggerFocused: false,
  });
});

test('focus return follows actual slot assignment for direct, wrapped, and falsely slotted controls', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 1000, height: 720 });
  const results = await shell.evaluate(async (element) => {
    const appShell = element as HTMLElement & {
      compactTrigger: HTMLElement | null;
      open: boolean;
      updateComplete: Promise<unknown>;
    };
    const trigger = appShell.querySelector<HTMLButtonElement>('[slot="compact-header"] button')!;
    const navigation = appShell.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
    const link = navigation.querySelector<HTMLAnchorElement>('a[href="#missions"]')!;
    const run = async () => {
      appShell.open = true;
      trigger.setAttribute('aria-expanded', 'true');
      await appShell.updateComplete;
      link.focus();
      link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
      await appShell.updateComplete;
      await Promise.resolve();
      return document.activeElement === trigger;
    };

    const wrapper = trigger.parentElement!;
    trigger.slot = 'compact-header';
    appShell.append(trigger);
    wrapper.remove();
    appShell.compactTrigger = trigger;
    const direct = await run();

    const validWrapper = document.createElement('div');
    validWrapper.slot = 'compact-header';
    trigger.removeAttribute('slot');
    trigger.replaceWith(validWrapper);
    validWrapper.append(trigger);
    const wrapped = await run();

    const falseWrapper = document.createElement('section');
    trigger.slot = 'compact-header';
    validWrapper.replaceWith(falseWrapper);
    falseWrapper.append(trigger);
    const falseTriggerAssignedSlot = trigger.assignedSlot;
    const falselySlottedTrigger = await run();

    const restoredHeader = document.createElement('div');
    restoredHeader.slot = 'compact-header';
    trigger.removeAttribute('slot');
    falseWrapper.replaceWith(restoredHeader);
    restoredHeader.append(trigger);
    const falseNavigationWrapper = document.createElement('section');
    navigation.replaceWith(falseNavigationWrapper);
    falseNavigationWrapper.append(navigation);
    const falseTargetAssignedSlot = navigation.assignedSlot;
    const falselySlottedTarget = await run();

    return {
      direct,
      wrapped,
      falseTriggerAssignedSlot: Boolean(falseTriggerAssignedSlot),
      falselySlottedTrigger,
      falseTargetAssignedSlot: Boolean(falseTargetAssignedSlot),
      falselySlottedTarget,
    };
  });

  expect(results).toEqual({
    direct: true,
    wrapped: true,
    falseTriggerAssignedSlot: false,
    falselySlottedTrigger: false,
    falseTargetAssignedSlot: false,
    falselySlottedTarget: false,
  });
});

test('border-box padding keeps CSS presentation and Escape behavior aligned at 860/861 content px', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 1200, height: 720 });
  const result = await shell.evaluate(async (element) => {
    const appShell = element as HTMLElement & { open: boolean; updateComplete: Promise<unknown> };
    const header = appShell.shadowRoot!.querySelector<HTMLElement>('[part="compact-header"]')!;
    const drawer = appShell.shadowRoot!.querySelector<HTMLElement>('[part="compact-navigation"]')!;
    const link = appShell.querySelector<HTMLAnchorElement>('[slot="compact-navigation"] a[href="#missions"]')!;
    let dismissals = 0;
    appShell.addEventListener('sk-app-shell-dismiss', () => dismissals += 1);
    appShell.style.boxSizing = 'border-box';
    appShell.style.paddingInline = '1px';
    const settle = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await appShell.updateComplete;
    };
    const contentInlineSize = () => {
      const style = getComputedStyle(appShell);
      return appShell.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
    };

    appShell.style.width = '862px';
    appShell.open = true;
    await settle();
    const at860 = {
      contentInlineSize: contentInlineSize(),
      headerVisible: getComputedStyle(header).display !== 'none',
      drawerOpen: !drawer.hidden,
    };
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    const dismissalsAt860 = dismissals;

    appShell.style.width = '863px';
    appShell.open = true;
    await settle();
    const at861 = {
      contentInlineSize: contentInlineSize(),
      headerVisible: getComputedStyle(header).display !== 'none',
      drawerOpen: !drawer.hidden,
    };
    appShell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));

    return { at860, dismissalsAt860, at861, dismissalsAt861: dismissals, open: appShell.open };
  });

  expect(result).toEqual({
    at860: { contentInlineSize: 860, headerVisible: true, drawerOpen: true },
    dismissalsAt860: 1,
    at861: { contentInlineSize: 861, headerVisible: false, drawerOpen: false },
    dismissalsAt861: 1,
    open: true,
  });
});

test('vertical writing keeps CSS placement, JS visibility, exposure, and Escape aligned at 860/861 inline px', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 900, height: 900 });
  const result = await shell.evaluate(async (element) => {
    const appShell = element as HTMLElement & { open: boolean; updateComplete: Promise<unknown> };
    const header = appShell.shadowRoot!.querySelector<HTMLElement>('[part="compact-header"]')!;
    const drawer = appShell.shadowRoot!.querySelector<HTMLElement>('[part="compact-navigation"]')!;
    const personal = appShell.querySelector<HTMLElement>('[slot="personal-rail"]')!;
    const trigger = appShell.querySelector<HTMLElement>('[slot="compact-header"]')!;
    const navigation = appShell.querySelector<HTMLElement>('[slot="compact-navigation"]')!;
    const link = navigation.querySelector<HTMLAnchorElement>('a[href="#missions"]')!;
    let dismissals = 0;
    appShell.addEventListener('sk-app-shell-dismiss', () => dismissals += 1);
    appShell.style.writingMode = 'vertical-rl';
    appShell.style.blockSize = '390px';
    const settle = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await appShell.updateComplete;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    };
    const exposure = (root: Element) => [
      root.getAttribute('inert'),
      root.getAttribute('aria-hidden'),
    ];

    appShell.style.inlineSize = '860px';
    await settle();
    const at860 = {
      headerDisplay: getComputedStyle(header).display,
      drawerDisplay: getComputedStyle(drawer).display,
      drawerHidden: drawer.hidden,
      personal: exposure(personal),
      trigger: exposure(trigger),
      navigation: exposure(navigation),
    };
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    const dismissalsAt860 = dismissals;

    appShell.style.inlineSize = '861px';
    await settle();
    const at861 = {
      headerDisplay: getComputedStyle(header).display,
      drawerDisplay: getComputedStyle(drawer).display,
      drawerHidden: drawer.hidden,
      personal: exposure(personal),
      trigger: exposure(trigger),
      navigation: exposure(navigation),
    };
    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    return { at860, dismissalsAt860, at861, dismissalsAt861: dismissals, open: appShell.open };
  });

  expect(result).toEqual({
    at860: {
      headerDisplay: 'block',
      drawerDisplay: 'block',
      drawerHidden: false,
      personal: ['', 'true'],
      trigger: [null, null],
      navigation: [null, null],
    },
    dismissalsAt860: 1,
    at861: {
      headerDisplay: 'none',
      drawerDisplay: 'none',
      drawerHidden: true,
      personal: [null, null],
      trigger: ['', 'true'],
      navigation: ['', 'true'],
    },
    dismissalsAt861: 1,
    open: false,
  });
});

test('resizing both directions never mutates open or leaves focus in hidden navigation', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 1200, height: 720 });
  const frame = shell.locator('..');
  const link = shell.locator('[slot="compact-navigation"] a[href="#missions"]');
  await link.focus();
  await frame.evaluate((element) => element.style.width = '861px');
  await expect(shadowPart(shell, 'compact-navigation')).toBeHidden();
  await expect(shadowPart(shell, 'compact-navigation')).toHaveAttribute('aria-hidden', 'true');
  await expect(shell).toHaveAttribute('open', '');
  expect(await link.evaluate((element) => document.activeElement === element)).toBe(false);
  await frame.evaluate((element) => element.style.width = '860px');
  await expect(shadowPart(shell, 'compact-navigation')).toBeVisible();
  await expect(shell).toHaveAttribute('open', '');
});

for (const region of [
  { name: 'personal', slot: 'personal-rail', focusable: 'a[href="#work"]' },
  { name: 'context', slot: 'context-sidebar', focusable: 'a[href="#overview"]' },
] as const) {
  test(`861→860 releases focus from the ${region.name} region when it becomes inert`, async ({ page }) => {
    const shell = await load(page, 'compact-open', { width: 1200, height: 720 });
    await setFrameWidth(shell, 861);
    const root = shell.locator(`[slot="${region.slot}"]`);
    const focusable = root.locator(region.focusable);
    await expect(root).not.toHaveAttribute('inert', '');
    await focusable.focus();
    expect(await focusState(root)).toEqual({ containsActive: true, focusWithin: true });

    await setFrameWidth(shell, 860);
    await expect(root).toHaveAttribute('inert', '');
    await expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(await focusState(root)).toEqual({ containsActive: false, focusWithin: false });
    await expect(shell).toHaveAttribute('open', '');
  });
}

test('860→861 releases focus from the compact-header trigger when it becomes inert', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 1200, height: 720 });
  await setFrameWidth(shell, 860);
  const root = shell.locator('[slot="compact-header"]');
  const trigger = root.locator('button');
  await expect(root).not.toHaveAttribute('inert', '');
  await trigger.focus();
  expect(await focusState(root)).toEqual({ containsActive: true, focusWithin: true });

  await setFrameWidth(shell, 861);
  await expect(root).toHaveAttribute('inert', '');
  await expect(root).toHaveAttribute('aria-hidden', 'true');
  expect(await focusState(root)).toEqual({ containsActive: false, focusWithin: false });
  await expect(shell).toHaveAttribute('open', '');
});

for (const { storyName, viewport, drawerScrolls } of [
  { storyName: 'compact-short-viewport', viewport: { width: 390, height: 320 }, drawerScrolls: true },
  { storyName: 'compact-tall-viewport', viewport: { width: 390, height: 900 }, drawerScrolls: false },
] as const) {
  test(`${storyName} follows its real ${viewport.width}x${viewport.height} viewport`, async ({ page }) => {
    const shell = await load(page, storyName, viewport);
    const frame = shell.locator('..');
    const geometry = await frame.evaluate((element) => {
      const appShell = element.querySelector('sk-app-shell')!;
      const compactDrawer = appShell.shadowRoot!
        .querySelector<HTMLElement>('[part="compact-navigation"]')!;
      return {
        pageClientWidth: document.documentElement.clientWidth,
        pageClientHeight: document.documentElement.clientHeight,
        pageScrollWidth: document.documentElement.scrollWidth,
        frameWidth: element.getBoundingClientRect().width,
        frameMinHeight: Number.parseFloat(getComputedStyle(element).minHeight),
        frameInlineHeight: element.style.height,
        frameInlineOverflow: element.style.overflow,
        shellWidth: appShell.getBoundingClientRect().width,
        shellHeight: appShell.getBoundingClientRect().height,
        drawerClientHeight: compactDrawer.clientHeight,
        drawerScrollHeight: compactDrawer.scrollHeight,
        drawerOverflowY: getComputedStyle(compactDrawer).overflowY,
      };
    });

    expect(page.viewportSize()).toEqual(viewport);
    expect(geometry.pageClientWidth).toBe(viewport.width);
    expect(geometry.pageClientHeight).toBe(viewport.height);
    expect(geometry.frameWidth).toBe(viewport.width);
    expect(geometry.frameMinHeight).toBe(viewport.height);
    expect(geometry.frameInlineHeight).toBe('');
    expect(geometry.frameInlineOverflow).toBe('');
    expect(geometry.shellWidth).toBe(viewport.width);
    expect(geometry.shellHeight).toBeGreaterThanOrEqual(viewport.height);
    expect(geometry.pageScrollWidth).toBeLessThanOrEqual(geometry.pageClientWidth);
    expect(geometry.drawerOverflowY).toBe('auto');
    if (drawerScrolls) {
      expect(geometry.drawerScrollHeight).toBeGreaterThan(geometry.drawerClientHeight);
    } else {
      expect(geometry.drawerScrollHeight).toBeLessThanOrEqual(geometry.drawerClientHeight);
    }
  });
}

test('dark and LightMode use distinct token surfaces', async ({ page }) => {
  const dark = await load(page, 'compact-open', { width: 390, height: 720 });
  const darkSurface = await shadowPart(dark, 'compact-navigation').evaluate((el) => getComputedStyle(el).backgroundColor);
  const light = await load(page, 'light-mode', { width: 390, height: 720 });
  const lightSurface = await shadowPart(light, 'compact-navigation').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(lightSurface).not.toBe(darkSurface);
});

test('forced colors preserves a system-color outline and reduced motion preserves drawer operation', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const forced = await load(page, 'forced-colors', { width: 390, height: 720 });
  const forcedStyle = await shadowPart(forced, 'compact-navigation').evaluate((el) => ({
    outlineStyle: getComputedStyle(el).outlineStyle,
    outlineWidth: getComputedStyle(el).outlineWidth,
  }));
  expect(forcedStyle.outlineStyle).toBe('solid');
  expect(Number.parseFloat(forcedStyle.outlineWidth)).toBeGreaterThan(0);

  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
  const reduced = await load(page, 'reduced-motion', { width: 390, height: 320 });
  const reducedDrawer = shadowPart(reduced, 'compact-navigation');
  const reducedHeader = reduced.locator('[slot="compact-header"]');
  const reducedNavigation = reduced.locator('[slot="compact-navigation"]');
  await reducedNavigation.evaluate((navigation) => {
    for (let index = 0; index < 20; index += 1) {
      const link = document.createElement('a');
      link.href = `#extra-${index}`;
      link.textContent = `Extra navigation destination ${index}`;
      navigation.append(link);
    }
  });
  await expect(reducedDrawer).toBeVisible();
  await expect(reducedDrawer).not.toHaveAttribute('inert', '');
  await expect(reducedDrawer).toHaveAttribute('aria-hidden', 'false');
  await expect(reducedNavigation).not.toHaveAttribute('inert', '');
  await expect(reducedNavigation).not.toHaveAttribute('aria-hidden', 'true');
  await expect(reduced.locator('[slot="personal-rail"]')).toHaveAttribute('inert', '');
  await expect(reduced.locator('[slot="context-sidebar"]')).toHaveAttribute('inert', '');
  const trigger = reducedHeader.locator('button');
  await trigger.click();
  await expect(reduced).not.toHaveAttribute('open', '');
  await expect(reducedDrawer).toBeHidden();
  await expect(reducedNavigation).toHaveAttribute('inert', '');
  await trigger.click();
  await expect(reduced).toHaveAttribute('open', '');
  await expect(reducedDrawer).toBeVisible();
  await expect(reducedNavigation).not.toHaveAttribute('inert', '');
  const firstLink = reducedNavigation.locator('a').first();
  await firstLink.focus();
  await expect(firstLink).toBeFocused();
  const scrolling = await reducedDrawer.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  expect(scrolling.overflowY).toBe('auto');
  expect(scrolling.scrollHeight).toBeGreaterThan(scrolling.clientHeight);
});

test('compact composition has one consumer navigation landmark, one main, and no axe violations', async ({ page }) => {
  const shell = await load(page, 'compact-open', { width: 390, height: 720 });
  await expect(shell.locator('[slot="personal-rail"]')).toHaveAttribute('inert', '');
  await expect(shell.locator('[slot="personal-rail"]')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByRole('navigation', { name: 'Product areas' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Repository navigation' })).toHaveCount(1);
  await expect(page.getByRole('navigation')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> = [];
  await expect.poll(async () => {
    try {
      violations = await getViolations(page, 'body', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
      return 'ready';
    } catch (error) {
      if (String(error).includes('Axe is already running')) return 'busy';
      throw error;
    }
  }).toBe('ready');
  expect(violations).toEqual([]);
});

for (const { width, effective } of [
  { width: 1280, effective: false },
  { width: 1101, effective: false },
  { width: 1100, effective: true },
  { width: 1024, effective: true },
  { width: 768, effective: true },
  { width: 390, effective: true },
] as const) {
  test(`rail-preserving has the required region geometry at ${width}px`, async ({ page }) => {
    const shell = await load(
      page,
      `rail-preserving-${width === 1280 ? 'wide' : width}`,
      { width: Math.max(width, 1280), height: 720 },
    );
    const personal = shadowPart(shell, 'personal');
    const context = shadowPart(shell, 'context');
    const compactHeader = shadowPart(shell, 'compact-header');
    const navigation = shadowPart(shell, 'compact-navigation');
    const content = shadowPart(shell, 'content');

    await expect(personal).toBeVisible();
    if (effective) {
      await expect(context).toBeHidden();
      await expect(compactHeader).toBeVisible();
      await expect(navigation).toBeVisible();
      expect(Math.round((await personal.boundingBox())!.width)).toBe(56);
      const personalBox = (await personal.boundingBox())!;
      const contentBox = (await content.boundingBox())!;
      expect(Math.round(contentBox.x)).toBe(Math.round(personalBox.x + personalBox.width));
      await expect(shell.locator('[slot="personal-rail"]')).not.toHaveAttribute('inert', '');
      await expect(shell.locator('[slot="context-sidebar"]')).toHaveAttribute('inert', '');
    } else {
      await expect(context).toBeVisible();
      await expect(compactHeader).toBeHidden();
      await expect(navigation).toBeHidden();
      await expect(shell.locator('[slot="personal-rail"]')).not.toHaveAttribute('inert', '');
      await expect(shell.locator('[slot="context-sidebar"]')).not.toHaveAttribute('inert', '');
      await expect(shell.locator('[slot="compact-header"]')).toHaveAttribute('inert', '');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });
}

test('rail-preserving is shell-relative inside a wider viewport and respects content-box padding', async ({ page }) => {
  const shell = await load(page, 'rail-preserving-open', { width: 1440, height: 900 });
  const result = await shell.evaluate(async (element) => {
    const appShell = element as HTMLElement & { updateComplete: Promise<unknown> };
    const header = appShell.shadowRoot!.querySelector<HTMLElement>('[part="compact-header"]')!;
    appShell.style.boxSizing = 'border-box';
    appShell.style.paddingInline = '1px';
    const settle = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await appShell.updateComplete;
    };
    appShell.style.width = '1102px';
    await settle();
    const at1100 = getComputedStyle(header).display;
    appShell.style.width = '1103px';
    await settle();
    return { at1100, at1101: getComputedStyle(header).display };
  });
  expect(result).toEqual({ at1100: 'block', at1101: 'none' });
});

test('rail-preserving uses logical inline size in vertical writing mode', async ({ page }) => {
  const shell = await load(page, 'rail-preserving-open', { width: 900, height: 1200 });
  const result = await shell.evaluate(async (element) => {
    const appShell = element as HTMLElement & { updateComplete: Promise<unknown> };
    const header = appShell.shadowRoot!.querySelector<HTMLElement>('[part="compact-header"]')!;
    appShell.style.writingMode = 'vertical-rl';
    appShell.style.blockSize = '390px';
    const settle = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await appShell.updateComplete;
    };
    appShell.style.inlineSize = '1100px';
    await settle();
    const at1100 = getComputedStyle(header).display;
    appShell.style.inlineSize = '1101px';
    await settle();
    return { at1100, at1101: getComputedStyle(header).display };
  });
  expect(result).toEqual({ at1100: 'block', at1101: 'none' });
});

test('rail-preserving closed/open navigation reuses the controlled dismissal seam', async ({ page }) => {
  const closed = await load(page, 'rail-preserving-closed', { width: 1024, height: 720 });
  await expect(shadowPart(closed, 'compact-header')).toBeVisible();
  await expect(shadowPart(closed, 'compact-navigation')).toBeHidden();
  await expect(closed.locator('[slot="compact-navigation"]')).toHaveAttribute('inert', '');

  const open = await load(page, 'rail-preserving-open', { width: 1024, height: 720 });
  const trigger = open.locator('[slot="compact-header"] button');
  const link = open.locator('[slot="compact-navigation"] a[href="#missions"]');
  await link.focus();
  await link.press('Escape');
  await expect(open).not.toHaveAttribute('open', '');
  await expect(shadowPart(open, 'compact-navigation')).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const { name, viewport, shouldScroll } of [
  { name: 'rail-preserving-short-viewport', viewport: { width: 1024, height: 320 }, shouldScroll: true },
  { name: 'rail-preserving-tall-viewport', viewport: { width: 1024, height: 900 }, shouldScroll: false },
] as const) {
  test(`${name} bounds long navigation inside the shell`, async ({ page }) => {
    const shell = await load(page, name, viewport);
    const drawer = shadowPart(shell, 'compact-navigation');
    const geometry = await drawer.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowY: getComputedStyle(element).overflowY,
    }));
    expect(geometry.overflowY).toBe('auto');
    if (shouldScroll) expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
    else expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth),
    );
  });
}

test('rail-preserving theme, forced-colors, reduced-motion, and axe contracts hold', async ({ page }) => {
  const surface = async (storyName: string) => {
    const shell = await load(page, storyName, { width: 1024, height: 720 });
    return shadowPart(shell, 'compact-navigation').evaluate((element) => {
      const reference = document.createElement('div');
      reference.style.background = 'var(--sk-surface-card)';
      element.getRootNode().appendChild(reference);
      const values = {
        drawer: getComputedStyle(element).backgroundColor,
        reference: getComputedStyle(reference).backgroundColor,
      };
      reference.remove();
      return values;
    });
  };
  const dark = await surface('rail-preserving-open');
  const light = await surface('rail-preserving-light-mode');
  expect(dark.drawer).toBe(dark.reference);
  expect(light.drawer).toBe(light.reference);
  expect(light.drawer).not.toBe(dark.drawer);

  await page.emulateMedia({ forcedColors: 'active' });
  const forced = await load(page, 'rail-preserving-forced-colors', { width: 1024, height: 720 });
  const forcedStyle = await shadowPart(forced, 'compact-navigation').evaluate((element) => ({
    outlineStyle: getComputedStyle(element).outlineStyle,
    outlineWidth: Number.parseFloat(getComputedStyle(element).outlineWidth),
  }));
  expect(forcedStyle.outlineStyle).toBe('solid');
  expect(forcedStyle.outlineWidth).toBeGreaterThan(0);

  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' });
  const reduced = await load(page, 'rail-preserving-reduced-motion', { width: 1024, height: 720 });
  expect(await shadowPart(reduced, 'compact-navigation').evaluate((element) => ({
    animationName: getComputedStyle(element).animationName,
    transitionDuration: getComputedStyle(element).transitionDuration,
  }))).toEqual({ animationName: 'none', transitionDuration: '0s' });

  await injectAxe(page);
  let violations: Awaited<ReturnType<typeof getViolations>> = [];
  await expect.poll(async () => {
    try {
      violations = await getViolations(page, 'body', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
      return 'ready';
    } catch (error) {
      if (String(error).includes('Axe is already running')) return 'busy';
      throw error;
    }
  }).toBe('ready');
  expect(violations).toEqual([]);
});
