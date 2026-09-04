#!/usr/bin/env node
/**
 * The no-build consumer, proven by interception (#80, NFR-002, SC-006).
 *
 * ADR-10 §2's second distribution entry is the classic-script bundle: a `<script>` tag, no
 * bundler, no npm install, no network. #82's whole premise. This opens a real `file://` page in
 * chromium, intercepts EVERY request, and asserts the elements upgraded and that nothing left
 * the machine.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS PROBE IS RED-FIRST AND NOT MERELY GREEN
 *
 * This criterion currently passes BY ACCIDENT, and a probe that only observes the healthy tree
 * would prove nothing while looking authoritative.
 *
 * The one network dependency in the graph is tokens.css's
 *   @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono…')
 * and it is INVALID: it sits at line 162 while `:root {` opens at line 3, and CSS requires
 * @import to precede every style rule. Measured in chromium — 32 rules parsed, 0 import rules,
 * and a route watching fonts.googleapis.com never fired. So the mono font has never loaded for
 * anyone, and "zero network requests" has been true because the only request was dead code.
 *
 * `--selftest` therefore plants a page that DOES fetch something and asserts this probe reds on
 * it. Without that, the day someone repositions the @import — the obvious "fix" — this check
 * would go on passing or start failing for reasons no one could attribute.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
import { chromium } from 'playwright';
import { mkdtempSync, writeFileSync, copyFileSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = join(ROOT, 'packages/elements/dist/elements.js');
const TOKENS = join(ROOT, 'packages/tokens/dist/tokens.css');
const FONTS = join(ROOT, 'packages/tokens/fonts');

// Asserted, not enumerated for display: if the page renders none of these the probe must fail,
// and if the list itself were emptied the assertion below would pass over nothing.
const TAGS = ['sk-button', 'sk-card', 'sk-grid', 'sk-site-footer', 'sk-pill-tag'];

function stage(extraHead = '') {
  for (const f of [BUNDLE, TOKENS]) {
    if (!existsSync(f)) {
      console.error(`❌ ${f} does not exist — build first (nx run-many --target=build --skip-nx-cache)`);
      process.exit(1);
    }
  }
  const dir = mkdtempSync(join(tmpdir(), 'sk-offline-'));
  copyFileSync(BUNDLE, join(dir, 'elements.js'));
  copyFileSync(TOKENS, join(dir, 'tokens.css'));
  // tokens.css resolves its @font-face urls relative to itself, so the fonts must sit beside it
  // or every face 404s — which on file:// is silent and would look like a pass.
  if (existsSync(FONTS)) cpSync(FONTS, join(dir, 'fonts'), { recursive: true });
  const html = `<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="./tokens.css">
${extraHead}
<script src="./elements.js"></script>
${TAGS.map((t) => `<${t}></${t}>`).join('\n')}
`;
  const page = join(dir, 'index.html');
  writeFileSync(page, html);
  return page;
}

async function run(pagePath) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const offsite = [];
  // EVERY request, then filtered by scheme. `file:` requests are the page loading its own
  // sibling assets and are what "no network" means here; anything else is a request that left
  // the machine, and http(s), ws(s) and data-exfiltrating schemes all count.
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('file://')) offsite.push(url);
  });
  await page.goto(pathToFileURL(pagePath).href, { waitUntil: 'load' });
  await page.evaluate(() => customElements.whenDefined('sk-button'));

  const result = await page.evaluate((tags) => {
    const out = { upgraded: [], notUpgraded: [], styled: null };
    for (const t of tags) {
      const el = document.querySelector(t);
      // An unupgraded custom element is an HTMLElement with no shadow root. Upgraded means the
      // class was applied, which for these is exactly "it has a shadowRoot".
      if (el && el.shadowRoot) out.upgraded.push(t);
      else out.notUpgraded.push(t);
    }
    const btn = document.querySelector('sk-button');
    // Proof the ADOPTED sheet arrived, not just that the element exists: adoptedStyleSheets is
    // how ADR-10 §1 delivers CSS, so a non-empty list is the styling assertion.
    out.styled = btn?.shadowRoot ? btn.shadowRoot.adoptedStyleSheets.length : 0;
    return out;
  }, TAGS);

  await browser.close();
  return { offsite, ...result };
}

function report(r, { expectOffsite }) {
  const problems = [];
  if (TAGS.length === 0) problems.push('the TAGS list is empty — this probe would assert nothing');
  if (r.notUpgraded.length) problems.push(`did not upgrade: ${r.notUpgraded.join(', ')}`);
  if (!r.styled) problems.push('sk-button adopted ZERO stylesheets — the bundle loaded but carries no CSS');
  if (!expectOffsite && r.offsite.length) {
    problems.push(`${r.offsite.length} off-machine request(s): ${[...new Set(r.offsite)].join(', ')}`);
  }
  if (expectOffsite && r.offsite.length === 0) {
    problems.push('the fixture was built to make an off-machine request and none was seen — this probe is blind');
  }
  return problems;
}

const selftest = process.argv.includes('--selftest');

if (selftest) {
  // A page that deliberately reaches off-machine. If the probe cannot see this, it cannot see
  // a repositioned @import either, and its green means nothing.
  const page = stage('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap">');
  const r = await run(page);
  const problems = report(r, { expectOffsite: true });
  if (problems.length) {
    console.error('❌ the offline probe is blind:');
    problems.forEach((p) => console.error(`   ${p}`));
    process.exit(1);
  }
  console.log(`✅ probe sees an off-machine request when one is planted (${r.offsite.length} seen)`);
  console.log(`   ${[...new Set(r.offsite)].join('\n   ')}`);
} else {
  const page = stage();
  const r = await run(page);
  const problems = report(r, { expectOffsite: false });
  if (problems.length) {
    console.error('❌ file:// load failed:');
    problems.forEach((p) => console.error(`   ${p}`));
    process.exit(1);
  }
  console.log(
    `✅ file:// load: ${r.upgraded.length}/${TAGS.length} elements upgraded, ` +
      `${r.styled} adopted sheet(s) on sk-button, ZERO off-machine requests.`,
  );
}
