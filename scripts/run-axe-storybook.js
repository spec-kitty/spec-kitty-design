#!/usr/bin/env node
/**
 * run-axe-storybook.js — WCAG 2.1 AA accessibility gate for all Storybook stories.
 *
 * FR-021: automated accessibility checks against ALL Storybook stories.
 *
 * Strategy:
 *   1. Read storybook-static/index.json (or stories.json) for the full story inventory.
 *   2. For each story, load its iframe URL and run axe with wcag2a + wcag2aa tags.
 *   3. Exit 1 if any violation is found across any story; exit 0 if all pass.
 *
 * Usage: node scripts/run-axe-storybook.js
 * Requires: Storybook must be built first (npx nx run storybook:storybook:build)
 */
'use strict';

const { chromium } = require('playwright');
const { injectAxe, getViolations } = require('axe-playwright');
const { existsSync, readFileSync } = require('fs');
const path = require('path');

const STORYBOOK_DIR = path.resolve('apps/storybook/storybook-static');
const AXE_TAGS = ['wcag2a', 'wcag2aa'];

// ── Load story manifest ───────────────────────────────────────────────────────

function loadStoryManifest() {
  // Storybook 10.x: index.json  |  Storybook 8.x: stories.json
  for (const filename of ['index.json', 'stories.json']) {
    const p = path.join(STORYBOOK_DIR, filename);
    if (existsSync(p)) {
      const data = JSON.parse(readFileSync(p, 'utf8'));
      // Storybook index.json shape: { entries: { [id]: { type, name, ... } } }
      // Filter to only 'story' entries (not docs pages)
      const entries = data.entries || data; // stories.json has flat map
      return Object.values(entries)
        .filter(e => e.type === 'story' || !e.type) // older format has no type field
        .map(e => e.id)
        .filter(Boolean);
    }
  }
  return null;
}

// ── Run axe on a single story ─────────────────────────────────────────────────

// Storybook 7+ renders into #storybook-root; older builds used #root.
const RENDER_ROOT_SELECTORS = ['#storybook-root', '#root'];

/**
 * Assert the story actually rendered something.
 *
 * axe reports zero violations for a blank page, so without this check a story
 * that fails to load is indistinguishable from a story that is clean — the
 * gate certifies absence. Three failure shapes are caught:
 *
 *   1. no render root at all (the iframe never booted);
 *   2. a render root with no element and no text (the framework booted but
 *      rendered nothing);
 *   3. a custom element present in the DOM whose tag was never defined in the
 *      registry — the elements-era shape. An unupgraded custom element is an
 *      inert unknown tag: it has no shadow root, no content, and no semantics,
 *      and axe is perfectly happy with it.
 */
async function assertStoryRendered(page, selectors) {
  const verdict = await page.evaluate((rootSelectors) => {
    const root = rootSelectors.map((s) => document.querySelector(s)).find(Boolean);
    if (!root) {
      return { ok: false, reason: `no render root (looked for ${rootSelectors.join(', ')})` };
    }
    if (root.childElementCount === 0 && root.textContent.trim() === '') {
      return { ok: false, reason: 'render root is empty' };
    }
    const undefinedTags = [
      ...new Set(
        Array.from(root.querySelectorAll('*'))
          .map((el) => el.tagName.toLowerCase())
          .filter((tag) => tag.includes('-'))
          .filter((tag) => !window.customElements.get(tag))
      ),
    ];
    if (undefinedTags.length > 0) {
      return { ok: false, reason: `custom element(s) never upgraded: ${undefinedTags.join(', ')}` };
    }
    return { ok: true };
  }, selectors);

  if (!verdict.ok) {
    throw new Error(verdict.reason);
  }
}

async function checkStory(page, storyId) {
  const url = `file://${STORYBOOK_DIR}/iframe.html?id=${storyId}&viewMode=story`;

  const scriptErrors = [];
  const onPageError = (err) => scriptErrors.push(err.message);
  page.on('pageerror', onPageError);

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (response && !response.ok() && response.status() !== 0) {
      throw new Error(`iframe.html returned HTTP ${response.status()}`);
    }

    // Wait briefly for the story framework to bootstrap.
    await page.waitForTimeout(500);

    if (scriptErrors.length > 0) {
      throw new Error(`script error: ${scriptErrors[0]}`);
    }

    await assertStoryRendered(page, RENDER_ROOT_SELECTORS);

    await injectAxe(page);
    return getViolations(page, 'body', {
      runOnly: { type: 'tag', values: AXE_TAGS },
    });
  } finally {
    page.off('pageerror', onPageError);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  if (!existsSync(STORYBOOK_DIR)) {
    console.error(`❌ Storybook build not found at ${STORYBOOK_DIR}`);
    console.error('   Run: npx nx run storybook:storybook:build');
    process.exit(2);
  }

  const storyIds = loadStoryManifest();

  // Fallback: if manifest not found, test the known stub stories directly
  const idsToTest = storyIds ?? [
    'primitives-skstub-angular--default',
    'primitives-skstub-html--default',
  ];

  if (!storyIds) {
    console.warn('⚠  Story manifest not found — testing known stub stories only.');
    console.warn('   Rebuild Storybook to enable full story iteration.');
  } else {
    console.log(`Testing ${idsToTest.length} stories for WCAG 2.1 AA compliance...`);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let totalViolations = 0;
  const failingStories = [];
  const loadFailures = [];

  for (const storyId of idsToTest) {
    try {
      const violations = await checkStory(page, storyId);
      if (violations.length > 0) {
        totalViolations += violations.length;
        failingStories.push({ storyId, violations });
        console.error(`❌ ${storyId}: ${violations.length} violation(s)`);
        violations.forEach(v => console.error(`   ${v.id}: ${v.description}`));
      } else {
        console.log(`✅ ${storyId}`);
      }
    } catch (err) {
      // A story that does not render is a failure, not a warning. Treating it
      // as skippable is what let this gate pass on an empty page.
      loadFailures.push({ storyId, reason: err.message });
      console.error(`❌ ${storyId}: did not render (${err.message})`);
    }
  }

  await browser.close();

  if (loadFailures.length > 0) {
    console.error(`\n❌ ${loadFailures.length} of ${idsToTest.length} story/stories did not render:`);
    loadFailures.forEach(({ storyId, reason }) => console.error(`   ${storyId} — ${reason}`));
    console.error('   A story that does not render cannot be assessed for accessibility.');
  }

  if (totalViolations > 0) {
    console.error(`\n❌ ${totalViolations} WCAG 2.1 AA violation(s) across ${failingStories.length} story/stories.`);
  }

  if (loadFailures.length > 0 || totalViolations > 0) {
    process.exit(1);
  }

  console.log(`\n✅ Zero WCAG 2.1 AA violations across all ${idsToTest.length} rendered story/stories.`);
})();
