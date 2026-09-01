const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGE-ERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });
  await page.goto('http://localhost:8899/audit/index.html', { waitUntil: 'networkidle' });
  await page.waitForFunction('window.__DONE__ === true', { timeout: 10000 });
  const results = await page.evaluate(() => window.__RESULTS__);
  await page.screenshot({ path: '/tmp/skd-eval/audit/render.png', fullPage: true });
  console.log(JSON.stringify(results, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
