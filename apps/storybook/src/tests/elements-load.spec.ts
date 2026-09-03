import { test, expect, type Page } from '@playwright/test';
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
 * NOTE ON WIRING: ci-quality.yml's playwright job runs NAMED spec files, not
 * `testDir`. This spec is listed there explicitly. If you add a spec to this
 * directory it does not run in CI until you name it too.
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
