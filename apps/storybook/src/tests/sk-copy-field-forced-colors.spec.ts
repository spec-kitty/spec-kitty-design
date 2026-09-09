import { expect, test } from '@playwright/test';

test('forced colors preserves a visible field boundary, focus, value, and textual result', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/iframe.html?id=elements-skcopyfield--forced-colors&viewMode=story');
  const host = page.locator('sk-copy-field').first();
  await host.waitFor({ state: 'visible' });
  const button = host.locator('button');
  await button.focus();
  await expect(button).toBeFocused();
  await expect(host.locator('[part="value"]')).not.toBeEmpty();
  await expect(host.locator('[part="status"]')).toHaveText('Value copied.');
  const presentation = await host.evaluate((element) => {
    const field = element.shadowRoot!.querySelector('[part="field"]')!;
    const control = element.shadowRoot!.querySelector('button')!;
    return {
      fieldBorder: getComputedStyle(field).borderTopStyle,
      outline: getComputedStyle(control).outlineStyle,
    };
  });
  expect(presentation.fieldBorder).not.toBe('none');
  expect(presentation.outline).not.toBe('none');
});
