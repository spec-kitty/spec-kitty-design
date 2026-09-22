import { test, expect, type Locator, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * WP04 — proof each distribution artifact is CONSUMABLE (FR-003, FR-004, FR-005).
 *
 * Every assertion here exists because the corresponding static check does not
 * actually establish the claim:
 *
 *   * grepping dist/elements.js for bare specifiers proves it has none; it does not
 *     prove a browser with no server and no bundler can run it (SC-001).
 *   * `lit` appearing as the ESM artifact's only import proves the import exists;
 *     it does not prove any bundler resolves it (SC-008) — hence the Vite fixture,
 *     built AND loaded.
 *   * reading define.ts proves it returns early on a duplicate; it does not prove
 *     the two real artifacts on one page warn instead of throwing (SC-003), which
 *     is the failure that takes down a consumer's whole page.
 *
 * NOTE ON WIRING: ci-quality.yml's playwright job runs `npx playwright test` over the whole
 * `testDir` (playwright.config.ts), so a spec added to this directory runs in CI without being
 * registered anywhere. This comment previously said the opposite — that specs had to be named
 * individually — which would have had a future author hand-registering files that need no
 * registration, or reading an unlisted spec as dead.
 */

const REPO_ROOT = resolve(__dirname, '../../../..');

/**
 * Read the IIFE from storybook-static, NOT from packages/elements/dist.
 *
 * Two reasons, and the first is fatal: CI's playwright job downloads only the
 * `storybook-static` artifact and never builds, so `packages/elements/dist` does
 * not exist there — a spec pointing at it passes locally and fails in CI, or worse
 * is quietly skipped. The second is that these are the exact bytes the HTTP tests
 * serve and hash, so the file:// case and the SRI case cannot drift apart.
 */
const IIFE_PATH = join(REPO_ROOT, 'apps/storybook/storybook-static/elements-dist/elements.js');

/** The element's own content, as the a11y gate defines "rendered" (#70). */
/** Parameterised over the tag so ADR-10 Confirmation #1 can be asserted for sk-card too. */
async function elementRendered(page: Page, tag = 'sk-stub') {
  return page.evaluate((t) => {
    const blank = { upgraded: false, text: '', markup: '', adopted: -1, styleTags: -1, reason: '' };
    const el = document.querySelector(t);
    if (!el) return { ...blank, reason: `no <${t}> on the page` };
    const sr = el.shadowRoot;
    if (!sr) return { ...blank, reason: `<${t}> did not upgrade — no shadow root` };
    return {
      upgraded: true,
      text: (sr.textContent ?? '').trim(),
      // THE DISCRIMINATING FIELD. `text` is shadow textContent, and a shadow root whose
      // only text sits behind a <slot> has none: sk-card's is `<div part="card"><slot>`,
      // so `text` is '' and comparing it across two builds asserted `'' === ''`. That
      // vacuous compare was written to close a blocker about a prose-only claim — the
      // programme's own certifying-absence defect, occurrence #9, inside its own fix.
      //
      // The shadow tree's markup is what could actually differ between the ESM build and
      // the IIFE: the part name, the class list the variant resolves to, the slot. Lit's
      // marker comments are stripped — they encode template identity, not rendered output.
      markup: sr.innerHTML.replace(/<!---->/g, '').trim(),
      adopted: sr.adoptedStyleSheets.length,
      styleTags: sr.querySelectorAll('style').length,
      reason: '',
    };
  }, tag);
}

async function stubRendered(page: Page) {
  return page.evaluate(() => {
    const blank = { upgraded: false, text: '', adopted: -1, styleTags: -1, reason: '' };
    const el = document.querySelector('sk-stub');
    if (!el) return { ...blank, reason: 'no <sk-stub> on the page' };
    const sr = el.shadowRoot;
    if (!sr) return { ...blank, reason: 'element did not upgrade — no shadow root' };
    return {
      upgraded: true,
      text: (sr.textContent ?? '').trim(),
      adopted: sr.adoptedStyleSheets.length,
      styleTags: sr.querySelectorAll('style').length,
      reason: '',
    };
  });
}

test.describe('distribution artifacts', () => {
  /**
   * ADR-10 Confirmation #1, stated about this component specifically:
   *
   *   "sk-card renders identically from the ESM build in a bundler app and from the
   *    classic-script build in a bundler-free file:// page, with adoptedStyleSheets.length
   *    === 1 and zero <style> elements in both."
   *
   * #72 originally claimed this confirmation in prose while `sk-card` appeared in this spec
   * ZERO times — the harness that already proves all three paths for sk-stub was left
   * untouched. Three pre-merge lenses caught it. This is the assertion.
   */
  test('[ADR-10 C#1] sk-card renders identically from the IIFE on file:// and the ESM bundle', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // Path 1 — bundler-free file://, classic script.
    const dir = mkdtempSync(join(tmpdir(), 'sk-card-iife-'));
    writeFileSync(join(dir, 'elements.js'), readFileSync(IIFE_PATH));
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><meta charset="utf-8"><sk-card variant="blue">Card content</sk-card>` +
        `<script src="./elements.js"></script>`,
    );
    await page.goto(pathToFileURL(join(dir, 'index.html')).href);
    await page.waitForFunction(() => !!document.querySelector('sk-card')?.shadowRoot);
    const viaFile = await elementRendered(page, 'sk-card');

    // Path 2 — the ESM build, through a real bundler (the Vite consumer). The fixture's
    // own `<sk-card variant="blue">` is the subject; the fold appended a SECOND one here,
    // which `querySelector` never returned, so that code asserted nothing at all.
    await page.goto('/vite-consumer/index.html');
    await page.waitForFunction(() => !!document.querySelector('sk-card')?.shadowRoot);
    const viaBundler = await elementRendered(page, 'sk-card');

    expect(errors, 'neither build may throw').toEqual([]);
    for (const [label, r] of [['file://', viaFile], ['bundler', viaBundler]] as const) {
      expect(r.upgraded, `${label}: ${r.reason}`).toBe(true);
      // The two halves ADR-10 names explicitly — kitty-desktop's CSP depends on the second.
      expect(r.adopted, `${label}: adoptedStyleSheets.length`).toBe(1);
      expect(r.styleTags, `${label}: <style> count`).toBe(0);
    }
    // "renders identically" — the same shadow tree from both builds, and a shadow tree
    // that actually carries the variant. Asserting the resolved class list FIRST means a
    // build rendering a bare `<div part="card">` down both paths cannot pass by agreeing
    // with itself.
    expect(viaFile.markup, 'file://: the variant must resolve to its modifier class').toContain(
      'sk-card--blue',
    );
    expect(viaFile.markup, 'file://: the ADR-9 part must be present').toContain('part="card"');
    expect(viaBundler.markup, 'the two builds must render the same shadow tree').toBe(
      viaFile.markup,
    );
  });

  test('IIFE upgrades an element from file:// — no server, no bundler (SC-001)', async ({
    page,
  }) => {
    // A real file:// page, not an HTTP one. This is the "drop a script tag on a
    // static page" claim in ADR-10 §2, and it is the only shape that proves the
    // artifact carries its own runtime.
    const dir = mkdtempSync(join(tmpdir(), 'sk-iife-'));
    writeFileSync(join(dir, 'elements.js'), readFileSync(IIFE_PATH));
    writeFileSync(
      join(dir, 'index.html'),
      `<!doctype html><meta charset="utf-8"><sk-stub></sk-stub><script src="./elements.js"></script>`,
    );

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(join(dir, 'index.html')).href);
    await page.waitForFunction(() => !!document.querySelector('sk-stub')?.shadowRoot);

    const result = await stubRendered(page);
    expect(errors, 'the IIFE must not throw on a file:// page').toEqual([]);
    expect(result.upgraded, result.reason).toBe(true);
    expect(result.text.length).toBeGreaterThan(0);

    // ADR-10 Confirmation #1, asserted against the BUILT artifact rather than the
    // source. kitty-desktop's CSP depends on the second half: a constructed
    // stylesheet, never an injected <style> tag.
    expect(result.adopted, 'adoptedStyleSheets.length').toBe(1);
    expect(result.styleTags, "shadowRoot <style> count").toBe(0);
  });

  test('IIFE over HTTP: a matching integrity hash executes, a wrong one is refused', async ({
    page,
  }) => {
    // SRI cannot be exercised from file:// at all, which is why this half is
    // separate. A literal CDN load is #80's — all three package names 404 on npm
    // today — so this serves the same bytes from the Storybook origin.
    const bytes = readFileSync(IIFE_PATH);
    const good = `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
    const bad = `sha384-${createHash('sha384').update('not the artifact').digest('base64')}`;

    for (const [label, integrity, shouldExecute] of [
      ['matching', good, true],
      ['wrong', bad, false],
    ] as const) {
      await page.goto('/iframe.html?viewMode=story&id=elements-skstub--default');
      const executed = await page.evaluate(
        ([src, hash]) =>
          new Promise<boolean>((resolveP) => {
            document.body.innerHTML = '<sk-stub id="sri"></sk-stub>';
            const s = document.createElement('script');
            s.src = src;
            s.integrity = hash;
            s.onload = () => resolveP(true);
            s.onerror = () => resolveP(false);
            document.head.appendChild(s);
          }),
        ['/elements-dist/elements.js', integrity] as const,
      );
      // Named `executed`, not `upgraded`: this observes whether the browser RAN the
      // script, which is what SRI governs. Both iterations request the SAME URL and
      // differ only in `integrity`, and the matching case asserts onload — so a 404
      // would fail that first, which is what makes the pair prove integrity-refusal
      // rather than a missing file.
      expect(executed, `${label} integrity hash: script executed?`).toBe(shouldExecute);
    }
  });

  test('both artifacts on one page warn and do not throw (FR-005, SC-003)', async ({ page }) => {
    // The duplicate-registration path. customElements.define throws on a repeat,
    // and a throw here takes down the consumer's whole page, not just the second
    // copy — so the guard must WARN. The ESM and IIFE artifacts on one page is
    // exactly this, and it is reachable in ordinary use.
    //
    // The ESM half is loaded as the VITE-BUILT bundle, not as dist/index.js
    // directly: that artifact leaves `lit` external (FR-003), so it has a bare
    // specifier a browser cannot resolve. Loading it raw would fail for a reason
    // that has nothing to do with the registration guard — and would pass this test
    // for the wrong reason if the assertion were only "did not throw".
    const warnings: string[] = [];
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    // First registration: the ESM artifact, via the consumer bundle.
    await page.goto('/vite-consumer/index.html');
    await page.waitForFunction(() => !!document.querySelector('sk-stub')?.shadowRoot);
    const before = await page.evaluate(() => customElements.get('sk-stub')?.name);
    // Cleared AFTER the first navigation: otherwise a warning emitted during the
    // initial load would satisfy the assertion below, and the test would pass without
    // the duplicate registration ever warning.
    warnings.length = 0;

    // Second registration of the same tag, from the other artifact.
    await page.evaluate(
      (iife) =>
        new Promise<void>((resolveP, rejectP) => {
          const s = document.createElement('script');
          s.src = iife;
          s.onload = () => resolveP();
          s.onerror = () => rejectP(new Error('IIFE failed to load'));
          document.head.appendChild(s);
        }),
      '/elements-dist/elements.js',
    );

    expect(errors, 'loading both artifacts must not throw').toEqual([]);
    expect(
      // Scoped to the package's own prefix — `already registered` alone could come
      // from anywhere on the page.
      warnings.some((w) => w.includes('[@spec-kitty/elements]') && w.includes('already registered')),
      `expected a duplicate-registration warning, got: ${JSON.stringify(warnings)}`,
    ).toBe(true);
    // The FIRST registration must survive — define() keeps the incumbent.
    expect(await page.evaluate(() => customElements.get('sk-stub')?.name)).toBe(before);
    // And the already-upgraded element must still be rendering, not blanked.
    const after = await stubRendered(page);
    expect(after.upgraded, after.reason).toBe(true);
    expect(after.text.length).toBeGreaterThan(0);
  });

  test('the Vite consumer builds AND the element upgrades in it (FR-003, SC-008)', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/vite-consumer/index.html');
    await page.waitForFunction(() => !!document.querySelector('sk-stub')?.shadowRoot);

    const result = await stubRendered(page);
    expect(errors, 'the bundled ESM artifact must not throw').toEqual([]);
    expect(result.upgraded, result.reason).toBe(true);
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.adopted, 'adoptedStyleSheets.length').toBe(1);
    expect(result.styleTags, "shadowRoot <style> count").toBe(0);
  });

  test('sk-stub renders in Storybook too (SC-008, #70 exit criterion 2)', async ({ page }) => {
    // Both halves are required. The fixture proves the published shape works; the
    // story proves the in-repo development shape does, and it is the story the a11y
    // and visual gates actually assess.
    await page.goto('/iframe.html?viewMode=story&id=elements-skstub--default');
    await page.waitForFunction(() => !!document.querySelector('sk-stub')?.shadowRoot);
    const result = await stubRendered(page);
    expect(result.upgraded, result.reason).toBe(true);
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.adopted, 'adoptedStyleSheets.length').toBe(1);
    expect(result.styleTags, "shadowRoot <style> count").toBe(0);
  });
});

const actionRowStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=elements-skactionrow--${id}&viewMode=story`);
  const host = page.locator('sk-action-row').first();
  await expect(host.locator('[part="row"]')).toBeVisible({ timeout: 20000 });
  return host;
};

test.describe('sk-action-row browser contract', () => {
  test('keeps real browser list roles, equal projections and trailing controls outside row activation', async ({ page }) => {
    await actionRowStory(page, 'native-list');
    const list = page.getByRole('list');
    await expect(list).toHaveCount(1);
    const items = list.getByRole('listitem');
    await expect(items).toHaveCount(2);
    for (const item of await items.all()) {
      await expect(item.locator(':scope > sk-action-row')).toHaveCount(1);
    }

    const rows = page.locator('ul > li > sk-action-row');
    await expect(rows).toHaveCount(2);
    expect(await rows.evaluateAll((hosts) =>
      hosts.map((host) => host.shadowRoot?.querySelectorAll('ul,li,[role="list"],[role="listitem"]').length),
    )).toEqual([0, 0]);
    const projections = await rows.evaluateAll((hosts) => hosts.map((host) => ({
      lightMarkup: host.innerHTML.replace(/\s+/g, ' ').trim(),
      shadowMarkup: host.shadowRoot?.innerHTML.replace(/<!---->/g, '').replace(/\s+/g, ' ').trim(),
      slots: Object.fromEntries(
        Array.from(host.shadowRoot?.querySelectorAll<HTMLSlotElement>('slot[name]') ?? []).map((slot) => [
          slot.name,
          slot.assignedNodes({ flatten: true }).map((node) => node.textContent).join('').replace(/\s+/g, ' ').trim(),
        ]),
      ),
    })));
    expect(projections).toHaveLength(2);
    expect(projections[1], 'equal supplied event content must produce an equal row projection').toEqual(projections[0]);
    await expect(page.locator('sk-section-header')).toHaveCount(1);
    await expect(page.locator('sk-status-indicator')).toHaveCount(2);
    await expect(page.locator('sk-entity-marker')).toHaveCount(2);

    const host = await actionRowStory(page, 'with-controls');
    await host.evaluate((element) => {
      const state = { controls: 0, rows: 0 };
      (window as typeof window & { __actionRowControls?: typeof state }).__actionRowControls = state;
      element.addEventListener('sk-action-row-activate', () => { state.rows += 1; });
      element.querySelector('[data-native-link]')!.addEventListener('click', (event) => {
        event.preventDefault();
        state.controls += 1;
      });
      element.querySelector('[data-native-button]')!.addEventListener('click', () => { state.controls += 1; });
      element.querySelector('[data-sk-button]')!.addEventListener('click', () => { state.controls += 1; });
    });
    await host.locator('[data-native-link]').click();
    await host.locator('[data-native-button]').click();
    await host.locator('[data-sk-button]').locator('button').click();
    expect(await page.evaluate(() =>
      (window as typeof window & { __actionRowControls: unknown }).__actionRowControls,
    )).toEqual({ controls: 3, rows: 0 });
  });

  test('emits the exact non-cancelable event once and suppresses repeat key activation', async ({ page }) => {
    const host = await actionRowStory(page, 'default');
    const trigger = host.locator('button[part="trigger"]');
    await host.evaluate((element) => {
      const trace = {
        events: [] as Array<{ detail: unknown; keys: string[]; bubbles: boolean; composed: boolean; cancelable: boolean }>,
        dispatches: [] as Array<{ result: boolean; defaultPrevented: boolean }>,
        keys: [] as Array<{ key: string; repeat: boolean; defaultPrevented: boolean }>,
      };
      (window as typeof window & { __actionRowTrace?: typeof trace }).__actionRowTrace = trace;
      const originalDispatch = element.dispatchEvent.bind(element);
      element.dispatchEvent = ((event: Event) => {
        const result = originalDispatch(event);
        trace.dispatches.push({ result, defaultPrevented: event.defaultPrevented });
        return result;
      }) as typeof element.dispatchEvent;
      element.addEventListener('sk-action-row-activate', (event) => {
        const custom = event as CustomEvent<unknown>;
        trace.events.push({
          detail: custom.detail,
          keys: Object.keys((custom.detail ?? {}) as object),
          bubbles: custom.bubbles,
          composed: custom.composed,
          cancelable: custom.cancelable,
        });
      });
      document.addEventListener('sk-action-row-activate', (event) => event.preventDefault());
      element.shadowRoot!.querySelector('button')!.addEventListener('keydown', (event) => {
        trace.keys.push({ key: event.key, repeat: event.repeat, defaultPrevented: event.defaultPrevented });
      });
    });

    await trigger.click();
    expect(await page.evaluate(() =>
      (window as typeof window & { __actionRowTrace: unknown }).__actionRowTrace,
    )).toMatchObject({
      events: [{ detail: { id: 'activity-17' }, keys: ['id'], bubbles: true, composed: true, cancelable: false }],
      dispatches: [{ result: true, defaultPrevented: false }],
    });

    await page.evaluate(() => {
      const trace = (window as typeof window & {
        __actionRowTrace: { events: unknown[]; dispatches: unknown[]; keys: unknown[] };
      }).__actionRowTrace;
      trace.events.length = 0;
      trace.dispatches.length = 0;
      trace.keys.length = 0;
    });
    await trigger.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    expect(await page.evaluate(() =>
      (window as typeof window & { __actionRowTrace: unknown }).__actionRowTrace,
    )).toMatchObject({
      events: [{ detail: { id: 'activity-17' } }],
      keys: expect.arrayContaining([{ key: 'Enter', repeat: true, defaultPrevented: true }]),
    });
    expect(await host.evaluate((element) => (element as HTMLElement & { selected: boolean }).selected)).toBe(false);
  });

  test('keeps controlled selection valid in both branches and fits the 320px story', async ({ page }) => {
    let host = await actionRowStory(page, 'selected');
    let row = host.locator('[part="row"]');
    let rowHandle = await row.elementHandle();
    expect(rowHandle).not.toBe(null);
    await expect(row).toHaveAttribute('aria-current', 'true');
    const selectableSnapshot = await host.ariaSnapshot();
    expect(selectableSnapshot).toMatch(/^- button /m);
    expect(selectableSnapshot).not.toMatch(/^- (checkbox|option|switch)\b/m);
    expect(await row.evaluate((node) => (node as HTMLElement).tabIndex)).toBe(-1);

    await host.locator('button[part="trigger"]').click();
    expect(await host.evaluate((element) => (element as HTMLElement & { selected: boolean }).selected)).toBe(true);
    await expect(row).toHaveAttribute('aria-current', 'true');

    await host.evaluate(async (element) => {
      const controlled = element as HTMLElement & { selected: boolean; updateComplete: Promise<unknown> };
      controlled.selected = false;
      await controlled.updateComplete;
    });
    expect(await row.evaluate((node, original) => node === original, rowHandle)).toBe(true);
    expect(await row.getAttribute('aria-current')).toBe(null);
    // Playwright 1.62 and Chromium's AX protocol omit aria-current even for native links.
    // The stable accessibility structure plus the DOM carrier transition are asserted separately.
    expect(await host.ariaSnapshot()).toBe(selectableSnapshot);

    host = await actionRowStory(page, 'non-selectable');
    row = host.locator('[part="row"]');
    rowHandle = await row.elementHandle();
    expect(rowHandle).not.toBe(null);
    await expect(row).toHaveAttribute('aria-current', 'true');
    await expect(host.locator('button[part="trigger"]')).toHaveCount(0);
    await expect(host.locator('[aria-selected],[aria-pressed],[role="checkbox"],[role="switch"]')).toHaveCount(0);
    const nonSelectableSnapshot = await host.ariaSnapshot();
    expect(nonSelectableSnapshot).not.toMatch(/^- (button|checkbox|option|switch)\b/m);
    expect(nonSelectableSnapshot).toContain('- img "Spec Kitty repository"');
    expect(await row.evaluate((node) => (node as HTMLElement).tabIndex)).toBe(-1);

    await host.evaluate(async (element) => {
      const controlled = element as HTMLElement & { selected: boolean; updateComplete: Promise<unknown> };
      controlled.selected = false;
      await controlled.updateComplete;
    });
    expect(await row.evaluate((node, original) => node === original, rowHandle)).toBe(true);
    expect(await row.getAttribute('aria-current')).toBe(null);
    expect(await host.ariaSnapshot()).toBe(nonSelectableSnapshot);

    await page.setViewportSize({ width: 320, height: 844 });
    host = await actionRowStory(page, 'long-content');
    const trigger = host.locator('button[part="trigger"]');
    const metadata = host.locator('time[slot="metadata"]');
    await expect(host.locator('sk-pill-tag[slot="tags"]')).toHaveCount(3);
    await expect(metadata).toBeVisible();
    await expect(metadata).toHaveText('2 hours ago');
    await trigger.focus();
    await expect(trigger).toBeFocused();

    const metrics = await host.evaluate((element) => {
      const row = element.shadowRoot!.querySelector<HTMLElement>('[part="row"]')!;
      const trigger = element.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
      const controls = element.shadowRoot!.querySelector<HTMLElement>('[part="controls"]')!;
      const metadata = element.querySelector<HTMLElement>('time[slot="metadata"]')!;
      const rowRect = row.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      const metadataRect = metadata.getBoundingClientRect();
      const focus = getComputedStyle(trigger);
      const metadataStyle = getComputedStyle(metadata);
      const focusOutset = Math.max(0, Number.parseFloat(focus.outlineWidth) + Number.parseFloat(focus.outlineOffset));
      const overlaps = !(
        metadataRect.right <= controlsRect.left || controlsRect.right <= metadataRect.left ||
        metadataRect.bottom <= controlsRect.top || controlsRect.bottom <= metadataRect.top
      );
      return {
        width: element.getBoundingClientRect().width,
        documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        rowOverflow: row.scrollWidth - row.clientWidth,
        triggerOverflow: trigger.scrollWidth - trigger.clientWidth,
        controlsInside: controlsRect.left >= rowRect.left && controlsRect.right <= rowRect.right + 0.5,
        metadataControlOverlap: overlaps,
        metadataReadable: metadataRect.width > 0 && metadataRect.height > 0 &&
          metadataStyle.display !== 'none' && metadataStyle.visibility === 'visible',
        focusVisible: focus.outlineStyle !== 'none' && Number.parseFloat(focus.outlineWidth) > 0,
        focusInsideViewport: triggerRect.left - focusOutset >= 0 &&
          triggerRect.right + focusOutset <= window.innerWidth &&
          triggerRect.top - focusOutset >= 0 && triggerRect.bottom + focusOutset <= window.innerHeight,
        focusInsideRow: triggerRect.left - focusOutset >= rowRect.left - 0.5 &&
          triggerRect.right + focusOutset <= rowRect.right + 0.5 &&
          triggerRect.top - focusOutset >= rowRect.top - 0.5 &&
          triggerRect.bottom + focusOutset <= rowRect.bottom + 0.5,
      };
    });
    expect(metrics.width).toBe(320);
    expect(metrics.documentOverflow, 'the 320px browser viewport must not scroll horizontally').toBeLessThanOrEqual(0);
    expect(metrics.rowOverflow).toBeLessThanOrEqual(0);
    expect(metrics.triggerOverflow).toBeLessThanOrEqual(0);
    expect(metrics.controlsInside).toBe(true);
    expect(metrics.metadataControlOverlap).toBe(false);
    expect(metrics.metadataReadable).toBe(true);
    expect(metrics.focusVisible).toBe(true);
    expect(metrics.focusInsideViewport).toBe(true);
    expect(metrics.focusInsideRow).toBe(true);
  });

  test('keeps selected, hover, pressed and focus affordances visible in dark and light forced colors', async ({ page }) => {
    const paint = (locator: Locator) => locator.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        borderInlineStartStyle: style.borderInlineStartStyle,
        borderInlineStartWidth: Number.parseFloat(style.borderInlineStartWidth),
      };
    });
    const hasVisibleOutline = (value: Awaited<ReturnType<typeof paint>>) =>
      value.outlineStyle !== 'none' && value.outlineWidth > 0;
    const outlineSignature = (value: Awaited<ReturnType<typeof paint>>) =>
      [value.outlineStyle, value.outlineWidth].join('|');
    const selectedEdgeSignature = (value: Awaited<ReturnType<typeof paint>>) =>
      [value.borderInlineStartStyle, value.borderInlineStartWidth].join('|');

    for (const colorScheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ forcedColors: 'active', colorScheme });
      await actionRowStory(page, 'selectable-states');
      const restHost = page.locator('sk-action-row[data-state-rest]');
      const selectedHost = page.locator('sk-action-row[data-state-selected]');
      const restRow = restHost.locator('[part="row"]');
      const selectedRow = selectedHost.locator('[part="row"]');
      const trigger = restHost.locator('button[part="trigger"]');
      const [restRowPaint, selectedRowPaint, restTriggerPaint] = await Promise.all([
        paint(restRow), paint(selectedRow), paint(trigger),
      ]);

      expect(selectedRowPaint.borderInlineStartStyle, `${colorScheme} selected edge`).not.toBe('none');
      expect(selectedRowPaint.borderInlineStartWidth, `${colorScheme} selected edge`).toBeGreaterThan(0);
      expect(selectedEdgeSignature(selectedRowPaint), `${colorScheme} selected must differ from rest`)
        .not.toBe(selectedEdgeSignature(restRowPaint));

      await trigger.hover();
      const hoverPaint = await paint(trigger);
      expect(hasVisibleOutline(restTriggerPaint), `${colorScheme} rest has no state outline`).toBe(false);
      expect(hasVisibleOutline(hoverPaint), `${colorScheme} hover outline`).toBe(true);
      expect(outlineSignature(hoverPaint), `${colorScheme} hover must differ from rest`)
        .not.toBe(outlineSignature(restTriggerPaint));

      await page.mouse.down();
      const pressedPaint = await paint(trigger);
      expect(hasVisibleOutline(pressedPaint), `${colorScheme} pressed outline`).toBe(true);
      expect(outlineSignature(pressedPaint), `${colorScheme} pressed must differ from hover`)
        .not.toBe(outlineSignature(hoverPaint));
      await page.mouse.up();
      await page.mouse.move(0, 0);

      await trigger.evaluate((node) => (node as HTMLElement).blur());
      await page.keyboard.press('Tab');
      await trigger.focus();
      await expect(trigger).toBeFocused();
      const focusPaint = await paint(trigger);
      expect(hasVisibleOutline(focusPaint), `${colorScheme} focus outline`).toBe(true);
      expect(outlineSignature(focusPaint), `${colorScheme} focus must differ from hover`)
        .not.toBe(outlineSignature(hoverPaint));
    }
  });

  test('removes both component-owned transitions under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const host = await actionRowStory(page, 'default');
    const transitions = await host.evaluate((element) => {
      const row = element.shadowRoot!.querySelector<HTMLElement>('[part="row"]')!;
      const trigger = element.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
      return [getComputedStyle(row).transitionProperty, getComputedStyle(trigger).transitionProperty];
    });
    expect(transitions).toEqual(['none', 'none']);
  });
});

/**
 * The static form (#307) has no `<sk-action-row>` element at all — it is `.sk-action-row-host` >
 * `.sk-action-row` light-DOM markup, rendered from the styles-layer story
 * (`packages/styles/src/action-row/sk-action-row-html.stories.ts`). Its forced-colors treatment
 * is inherited UNCHANGED from the shared, unmodified `sk-action-row.css` — this mission edits
 * neither the sheet nor its `@media (forced-colors: active)` block, only the markup module — so
 * this case is verification that the shared rule reaches the light-DOM form too, not new CSS.
 *
 * Same "measure twice, feature off then on, reload between" discipline as the `sk-card forced
 * colors` case below: `matchMedia(...).matches` answering `true` is not evidence an engine
 * performed the remap (WebKit measured answering `true` while leaving colors exactly as
 * authored), so this asks the observable question — did the edge actually widen and recolor —
 * against the SAME element rather than trusting the media-query answer alone.
 */
test.describe('sk-action-row static form forced colors', () => {
  test("the aria-current row keeps its forced-colors border treatment (#307)", async ({ page }) => {
    const measure = async (forcedColors: 'none' | 'active') => {
      await page.emulateMedia({ forcedColors });
      await page.goto('/iframe.html?id=primitives-skactionrow-html--current&viewMode=story');
      const row = page.locator('.sk-action-row[aria-current="true"]').first();
      await row.waitFor({ state: 'visible', timeout: 20000 });
      return row.evaluate((element) => {
        const style = getComputedStyle(element);
        return { width: style.borderInlineStartWidth, color: style.borderInlineStartColor };
      });
    };
    const off = await measure('none');
    const on = await measure('active');
    expect(
      Number.parseFloat(on.width),
      'the forced-colors edge must be strictly wider than the normal-mode border',
    ).toBeGreaterThan(Number.parseFloat(off.width));
    expect(on.color, 'the edge colour must change under forced colors').not.toBe(off.color);
  });
});

/**
 * #218. `sk-card`'s ForcedColors story emulated nothing, asserted nothing, and rendered bytes
 * identical to `AllStatuses`. The obligation it was discharging — "a forced-colors story or a
 * documented baseline" — was met by a docstring, which is exactly the shape this repo keeps
 * finding and removing.
 *
 * The claim worth pinning is the one the tone axis actually rests on: under
 * `forced-colors: active` the six tints collapse to one system ground and the tone is GONE, so
 * what still says "this card carries an operational status" has to be something forced colors
 * does not touch. That is the 4px `border-inline-start-width`, set outside any media query.
 * `sk-card.css` carried an `@media (forced-colors: active)` block that restated it, plus the
 * `CanvasText` the UA remap already computes — both no-ops, now removed, with this case standing
 * in their place.
 *
 * Same emulation as the `sk-action-row` case above, and the same both-schemes discipline.
 */
const cardStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=elements-skcard--${id}&viewMode=story`);
  const host = page.locator('sk-card').first();
  await expect(host.locator('[part="card"]')).toBeVisible({ timeout: 20000 });
};

test.describe('sk-card forced colors', () => {
  test('keeps the widened status edge when every tone collapses to one ground', async ({ page, browserName }) => {
    const paint = (locator: Locator) => locator.evaluate((node) => {
      const card = node.shadowRoot!.querySelector('[part="card"]')!;
      const style = getComputedStyle(card);
      return {
        edge: Number.parseFloat(style.borderInlineStartWidth),
        edgeStyle: style.borderInlineStartStyle,
        background: style.backgroundColor,
      };
    });

    for (const colorScheme of ['dark', 'light'] as const) {
      // MEASURED TWICE, with the media feature OFF and then ON, and the two halves of the claim
      // are held to different evidence.
      //
      // `matchMedia('(forced-colors: active)').matches` is NOT evidence that an engine performs
      // the remap. WebKit answers `true` to it under Playwright's emulation and then leaves author
      // backgrounds exactly as authored — this case was first written to trust that answer and
      // WebKit failed it, six distinct tints under a media query claiming forced colors. So the
      // guard below asks the observable question instead: did the BASE card's own background move
      // when the feature came on? That is the same element, the same adopted stylesheet and the
      // same shadow root as the tone cards, so an engine that moved it must move them too.
      // The story is LOADED ONCE PER MEDIA STATE, not measured twice on one load: switching
      // `emulateMedia` under a live page does move some computed values and not others, which read
      // as a partial remap and made this case fail on engines that in fact remap correctly.
      const measure = async (forcedColors: 'none' | 'active') => {
        await page.emulateMedia({ forcedColors, colorScheme });
        await cardStory(page, 'forced-colors');
        const toneHosts = await page.locator('sk-card[status]').all();
        expect(toneHosts.length, 'the story must render every tone beside the base card').toBe(6);
        return {
          base: await paint(page.locator('sk-card[data-forced-colors-base]')),
          tones: await Promise.all(toneHosts.map((host) => paint(host))),
        };
      };

      const normal = await measure('none');
      // THE FLOOR under the collapse claim: the six tones must be genuinely distinct BEFORE
      // forced colors, or "they collapse to one ground" is a green line over nothing.
      expect(new Set(normal.tones.map((t) => t.background)).size,
        `${colorScheme}: the six tones must be distinct before forced colors, or the collapse asserts nothing`)
        .toBe(6);

      const forced = await measure('active');
      const baseForced = forced.base;
      const tones = forced.tones;
      const remaps = baseForced.background !== normal.base.background;
      // THE FLOOR'S OWN FLOOR. The next assertion is keyed on a hard-coded project name, and
      // nothing made that name real: rename or drop `chromium` in playwright.config.ts and the
      // branch below never runs, the collapse half goes quiet on all three engines, and the suite
      // still reports green. Assert the project exists rather than trusting the string.
      expect(test.info().config.projects.map((project) => project.name),
        'the chromium floor below is keyed on this project name')
        .toContain('chromium');
      // Chromium MUST remap. Without this the guard could go quiet everywhere and the case would
      // still pass, which is the shape this spec exists to refuse.
      if (browserName === 'chromium') {
        expect(remaps, 'chromium must actually apply the forced-colors remap, not just report the media feature').toBe(true);
      }

      // THE MECHANISM, asserted in every engine and in both schemes, remap or no remap: forced
      // colors never touches width, so the widened inline-start step is what distinguishes a
      // status card from a plain one here.
      for (const tone of tones) {
        expect(tone.edgeStyle, `${colorScheme}: the status edge must be drawn`).not.toBe('none');
        expect(tone.edge, `${colorScheme}: the widened inline-start edge is the mechanism, and it must survive`)
          .toBeGreaterThan(baseForced.edge);
      }

      // THE COLLAPSE, only where the engine demonstrably remapped — otherwise the assertion is
      // about the engine, not about sk-card.
      if (remaps) {
        expect(new Set(tones.map((t) => t.background)).size,
          `${colorScheme}: the six tints must collapse to one system ground`).toBe(1);
        expect(tones[0]!.background,
          `${colorScheme}: a status card's ground must be indistinguishable from the base card's`)
          .toBe(baseForced.background);
      }
    }
  });
});

test('the section-header action story upgrades the reused sk-button to a native control', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-sksectionheader--with-metadata-and-action&viewMode=story');
  const action = page.locator('sk-section-header sk-button[slot="action"]');
  await expect(action.locator('button')).toBeVisible();
  await expect(action).toHaveText('View all');
});

test('section-header preserves the consumer heading without adding a banner landmark', async ({ page }) => {
  await page.goto('/iframe.html?id=elements-sksectionheader--with-metadata-and-action&viewMode=story');
  await expect(page.getByRole('heading', { name: 'Repository activity', level: 3 })).toBeVisible();
  await expect(page.getByRole('banner')).toHaveCount(0);
});

/**
 * #302's forced-colors distinguishability claim (FR-016/NFR-002), the same class of assertion
 * `sk-card`'s forced-colors case above makes, scaled to this component's simpler mechanism.
 *
 * `sk-card` already had a border, and forced colors widens it; `sk-pill-tag` has NO border of
 * any kind outside `@media (forced-colors: active)` — this component's only edge is the one
 * `.sk-pill-tag--status-<tone>` adds inside that query. So the assertion is simpler too: a
 * status pill's computed border-width must be non-zero where a status-less pill's stays `0px`,
 * in both colour schemes.
 */
const pillTagStory = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=elements-skpilltag--${id}&viewMode=story`);
  const host = page.locator('sk-pill-tag').first();
  await expect(host.locator('[part="tag"]')).toBeVisible({ timeout: 20000 });
};

test.describe('sk-pill-tag forced colors', () => {
  test('a status pill gains a border where a status-less pill has none', async ({ page, browserName }) => {
    const borderWidth = (locator: Locator) => locator.evaluate((node) => {
      const tag = node.shadowRoot!.querySelector('[part="tag"]')!;
      return Number.parseFloat(getComputedStyle(tag).borderWidth);
    });

    for (const colorScheme of ['dark', 'light'] as const) {
      // Loaded once per media state, not measured twice on one load — the same discipline
      // `sk-card`'s equivalent case above records, for the same reason.
      const measure = async (forcedColors: 'none' | 'active') => {
        await page.emulateMedia({ forcedColors, colorScheme });
        await pillTagStory(page, 'forced-colors');
        const toneHosts = await page.locator('sk-pill-tag[status]').all();
        expect(toneHosts.length, 'the story must render every tone beside the base pill').toBe(6);
        return {
          base: await borderWidth(page.locator('sk-pill-tag[data-forced-colors-base]')),
          tones: await Promise.all(toneHosts.map((host) => borderWidth(host))),
        };
      };

      const normal = await measure('none');
      // THE FLOOR: outside forced-colors mode, nothing here has a border at all — the block
      // must be additive only inside the media query, never a visible change outside it.
      expect(normal.base, `${colorScheme}: the base pill must have no border outside forced-colors`).toBe(0);
      for (const width of normal.tones) {
        expect(width, `${colorScheme}: a status pill must have no border outside forced-colors`).toBe(0);
      }

      const forced = await measure('active');
      // Assert the project exists rather than trusting the string — the same guard `sk-card`'s
      // case takes against a silently-renamed or dropped Chromium project.
      expect(test.info().config.projects.map((project) => project.name),
        'the chromium floor below is keyed on this project name')
        .toContain('chromium');
      if (browserName === 'chromium') {
        expect(forced.base, `${colorScheme}: the base pill must stay borderless in forced-colors mode`).toBe(0);
        for (const width of forced.tones) {
          expect(width, `${colorScheme}: a status pill must gain a border in forced-colors mode`).toBeGreaterThan(0);
        }
      }
    }
  });
});

/**
 * WP01/#320's forced-colors distinguishability claim (FR-013/FR-014), T007 — a COMPARATIVE
 * case, not a presence check.
 *
 * `.sk-button--secondary` already carries an unconditional, non-transparent 1px border, so it
 * already gets the platform's automatic forced-colors colour remap with zero author CSS.
 * `.sk-button--danger-secondary` reuses that same bordered shape, so it would remap to the
 * IDENTICAL system colour as plain `secondary` — colour and border-PRESENCE therefore cannot
 * carry the distinction here, unlike `sk-pill-tag`'s case above, where the base pill has no
 * border at all. The mechanism is `border-width`, stepped from 1px to `--sk-border-width-2`
 * inside `@media (forced-colors: active)` only (`sk-button.css`) — so the assertion that
 * actually pins it down is a STRICT INEQUALITY between the two tones' computed border widths,
 * measured on the SAME page, in the SAME emulation and colour scheme. An independent-presence
 * check on either tone alone would pass even if a future regression stepped both tones' widths
 * equally and left them indistinguishable again — see `sk-button.stories.ts`'s `ForcedColors`
 * story, which renders both tones side by side for exactly this comparison.
 */
const buttonForcedColorsStory = async (page: Page) => {
  await page.goto('/iframe.html?id=elements-skbutton--forced-colors&viewMode=story');
  // `.first()`: the story now renders THREE danger-secondary hosts (default, sm, icon — added
  // for the size="icon"/size="sm" extension below), so the bare selector is a strict-mode
  // violation. This is only a readiness gate — the tests below each pick their own
  // size-qualified locator.
  await expect(page.locator('sk-button[variant="danger-secondary"] button').first()).toBeVisible({
    timeout: 20000,
  });
};

test.describe('sk-button forced colors', () => {
  test('danger-secondary keeps a strictly wider border than plain secondary under forced colors', async ({
    page,
    browserName,
  }) => {
    const borderWidth = (locator: Locator) =>
      locator.evaluate((node) => {
        const control = node.shadowRoot!.querySelector('[part="button"]')!;
        return Number.parseFloat(getComputedStyle(control).borderWidth);
      });

    for (const colorScheme of ['dark', 'light'] as const) {
      // Loaded once per media state, not measured twice on one load — the same discipline the
      // sk-card and sk-pill-tag cases above record, for the same reason.
      const measure = async (forcedColors: 'none' | 'active') => {
        await page.emulateMedia({ forcedColors, colorScheme });
        await buttonForcedColorsStory(page);
        return {
          secondary: await borderWidth(page.locator('sk-button[variant="secondary"]:not([size])')),
          dangerSecondary: await borderWidth(page.locator('sk-button[variant="danger-secondary"]:not([size])')),
        };
      };

      const normal = await measure('none');
      // THE FLOOR: outside forced-colors mode both tones share the same 1px base border — if
      // they were already unequal here, "danger-secondary widens under forced colors" would be
      // comparing two rules that were never equal to begin with.
      expect(
        normal.dangerSecondary,
        `${colorScheme}: outside forced-colors, danger-secondary must share the 1px base border with secondary`,
      ).toBe(normal.secondary);
      // THE ABSOLUTE ANCHOR (pre-merge squad finding #2): the two lines above are both purely
      // RELATIVE, so deleting `.sk-button`'s own `border: 1px solid transparent` — or zeroing
      // secondary's width some other way — keeps them green (0 === 0) while secondary silently
      // loses its only forced-colors affordance. Name the literal, matching the sk-pill-tag
      // precedent this case models itself on.
      expect(normal.secondary, `${colorScheme}: the base border is 1px, not merely equal to itself`).toBe(1);

      const forced = await measure('active');
      // THE FLOOR'S OWN FLOOR, matching the sk-card/sk-pill-tag cases' own guard against a
      // silently renamed or dropped chromium project quietly emptying the branch below.
      expect(
        test.info().config.projects.map((project) => project.name),
        'the chromium floor below is keyed on this project name',
      ).toContain('chromium');
      if (browserName === 'chromium') {
        // SECONDARY'S OWN FORCED-COLORS FLOOR (finding #2, continued): secondary must still
        // carry its 1px border under forced colors — this is what rules out "the comparator was
        // degraded to make danger-secondary look relatively wider" as a way to pass the
        // inequality below.
        expect(
          forced.secondary,
          `${colorScheme}: secondary must keep its 1px border under forced colors`,
        ).toBe(normal.secondary);
        // THE MECHANISM, comparative: danger-secondary's forced-colors border must be strictly
        // wider than plain secondary's, on the same page, same emulation, same colour scheme.
        expect(
          forced.dangerSecondary,
          `${colorScheme}: danger-secondary must be strictly wider than secondary under forced colors`,
        ).toBeGreaterThan(forced.secondary);
      }
    }
  });

  /**
   * Pre-merge squad finding #7: the layout consequence sk-button.css's own comment states
   * (`size="icon"`'s `box-sizing: border-box` absorbs the forced-colors width step; default and
   * `size="sm"` — both `content-box` — grow by 1px per side) was asserted in prose only. Proven
   * here at both sizes, on the SAME `ForcedColors` story extended with sm/icon pairs above.
   */
  test('the forced-colors width step is absorbed at size="icon" and grows the box at size="sm"', async ({
    page,
    browserName,
  }) => {
    expect(test.info().config.projects.map((project) => project.name), 'the chromium skip below is keyed on this project name').toContain('chromium');
    test.skip(browserName !== 'chromium', 'forced-colors emulation is asserted on chromium only, matching the case above');

    const boxSize = (locator: Locator) =>
      locator.evaluate((node) => {
        const control = node.shadowRoot!.querySelector('[part="button"]')!;
        const rect = control.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });

    const measure = async (forcedColors: 'none' | 'active') => {
      await page.emulateMedia({ forcedColors, colorScheme: 'dark' });
      await buttonForcedColorsStory(page);
      return {
        sm: await boxSize(page.locator('sk-button[variant="danger-secondary"][size="sm"]')),
        icon: await boxSize(page.locator('sk-button[variant="danger-secondary"][size="icon"]')),
      };
    };

    const normal = await measure('none');
    const forced = await measure('active');

    // ICON: box-sizing: border-box absorbs the extra pixel — the box must NOT grow.
    expect(forced.icon.width, 'size="icon" must not grow under forced colors').toBe(normal.icon.width);
    expect(forced.icon.height, 'size="icon" must not grow under forced colors').toBe(normal.icon.height);
    // A FLOOR under the "did not grow" claim: icon stays the documented 40px square in both
    // modes, so "did not grow" is not vacuously true over a box that was already zero.
    expect(Math.round(normal.icon.width), 'size="icon" width').toBe(40);
    expect(Math.round(normal.icon.height), 'size="icon" height').toBe(40);

    // SM: content-box, no compensation — the box grows by 1px per side (2px total) on each axis.
    expect(forced.sm.width, 'size="sm" must grow by 1px per side under forced colors').toBeCloseTo(
      normal.sm.width + 2,
      1,
    );
    expect(forced.sm.height, 'size="sm" must grow by 1px per side under forced colors').toBeCloseTo(
      normal.sm.height + 2,
      1,
    );
  });
});
