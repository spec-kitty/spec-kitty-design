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
const { existsSync, readFileSync, createReadStream, statSync } = require('fs');
const http = require('http');
const path = require('path');

const STORYBOOK_DIR = path.resolve('apps/storybook/storybook-static');
const AXE_TAGS = ['wcag2a', 'wcag2aa'];


// ── Static server ─────────────────────────────────────────────────────────────
//
// The gate used to load stories as `file://…/iframe.html`. Storybook 10 bootstraps
// its whole preview from an inline `<script type="module">import './sb-preview/
// runtime.js'`, and Chromium blocks module imports from a file:// opaque origin,
// so NOTHING rendered and the gate failed every story with the unhelpful
// "render root is empty". See #90. Serving over HTTP is the fix; port 0 takes an
// ephemeral port so parallel jobs cannot collide.

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.otf': 'font/otf', '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function startStaticServer(root) {
  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const resolved = path.join(root, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
    if (!resolved.startsWith(root)) { res.writeHead(403).end(); return; }
    let target = resolved;
    try {
      if (statSync(target).isDirectory()) target = path.join(target, 'index.html');
    } catch { res.writeHead(404).end(); return; }
    if (!existsSync(target)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(target)] || 'application/octet-stream' });
    createReadStream(target).pipe(res);
  });
  return new Promise((resolve, reject) => {
    const onError = (e) => { server.off('error', onError); reject(e); };
    server.on('error', onError);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', onError);
      resolve({ server, port: server.address().port });
    });
  });
}

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
        .filter(e => e.id)
        .map(e => ({ id: e.id, importPath: e.importPath || '' }));
    }
  }
  return null;
}

// ── Run axe on a single story ─────────────────────────────────────────────────

// Storybook 7+ renders into #storybook-root; older builds used #root.
const RENDER_ROOT_SELECTORS = ['#storybook-root', '#root'];
const RENDER_TIMEOUT_MS = 8000;
let BASE_URL = null;

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
 *   3. a render root containing only the story's host element and nothing inside
 *      it — the framework booted and mounted the host, but the story itself
 *      never rendered into it.
 *
 * A previous version also flagged any hyphenated tag not registered with
 * customElements, as an "un-upgraded custom element" detector. That failed every
 * Angular story by construction — sk-button-primary and friends are Angular
 * component selectors, hyphenated by convention and never registered — and it is
 * removed rather than narrowed (#90). It will be worth reinstating, scoped to
 * genuinely unregistered elements with no children and no shadow root, when
 * ADR-8 makes these real custom elements.
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
    // The story's own host element always exists once the preview boots, so
    // "root has a child" is not evidence the story rendered — an unmounted story
    // has exactly that and nothing else. Requiring a descendant OF the host is
    // what separates the two: measured over HTTP, rendered stories carry 3-4
    // descendants, an unmounted one carries exactly 1 (the host).
    //
    // This replaces a check that flagged any hyphenated tag not registered with
    // customElements. Angular component selectors — sk-button-primary,
    // sk-form-field — are hyphenated by convention and are never registered, so
    // that check failed every Angular story by construction, on a page that had
    // rendered correctly. See #90.
    // Counting descendants is not enough. It was calibrated on the unmounted
    // html-js shape (exactly one descendant: the story host) — and those stories
    // are excluded by UNRENDERABLE_IMPORT_PATTERN, so the count discriminated
    // nothing about the population actually assessed. An Angular story nests the
    // story host AND the component host, so it clears 2 descendants even when the
    // component renders nothing: a story whose whole output is an empty <ul>
    // passed this gate green.
    //
    // Every component in this design system emits an sk-* class, so requiring one
    // (or any text) is evidence the story's own content mounted, not just its
    // wrappers. Survives #69: the web-components renderer emits the same classes.
    const hasOwnContent = (el) =>
      el.querySelector('[class^="sk-"], [class*=" sk-"]') !== null ||
      el.textContent.trim().length > 0;

    if (!hasOwnContent(root)) {
      return {
        ok: false,
        reason: 'story wrappers mounted but the component did not — no sk-* element and no text',
      };
    }

    // Per component host, not just per root. An existential check over the whole
    // render root passes as long as ANY component rendered: emptying
    // sk-form-input's template left all 8 form stories green, because the parent
    // sk-form-field still emitted its class. That is the same certifying-absence
    // failure this gate exists to close, one nesting level down.
    //
    // TWO host shapes, because the repo has two. The tagName filter below was
    // written when every component was an Angular element (<sk-card>). #69 deletes
    // those: the packages/styles stories emit PLAIN HTML carrying sk-* CLASSES and
    // no sk-* tagName at all, so on its own this filter would match zero elements
    // after the migration and silently degrade the gate back to the existential
    // root check above — the exact failure the block comment rejects. The class
    // arm keeps it discriminating. Found by the post-tasks squad on #69.
    const VOID_OR_LEAF = new Set([
      'IMG', 'INPUT', 'BR', 'HR', 'AREA', 'EMBED', 'SOURCE', 'TRACK', 'WBR', 'COL',
      'SVG', 'USE', 'PATH', 'TEXTAREA', 'SELECT', 'IFRAME', 'CANVAS', 'VIDEO', 'AUDIO',
    ]);
    // A BEM block (`sk-card`), not an element (`sk-card__title`) or modifier
    // (`sk-card--blue`): blocks are the component hosts, and a block that rendered
    // nothing is the defect. Elements and modifiers are parts of an already-checked
    // block, so requiring content of each would fail on legitimately empty slots.
    const BLOCK_CLASS = /^sk-[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const hostsByTag = Array.from(root.querySelectorAll('*')).filter((el) =>
      /^sk-/i.test(el.tagName)
    );
    const hostsByClass = Array.from(root.querySelectorAll('[class]')).filter(
      (el) =>
        !VOID_OR_LEAF.has(el.tagName) &&
        Array.from(el.classList).some((c) => BLOCK_CLASS.test(c))
    );
    const hosts = [...new Set([...hostsByTag, ...hostsByClass])];
    if (hosts.length === 0) {
      return {
        ok: false,
        reason:
          'no component host found — no sk-* element and no sk-* block class; ' +
          'the story mounted wrappers only',
      };
    }
    const empty = hosts
      .filter((el) => !hasOwnContent(el))
      .map((el) =>
        /^sk-/i.test(el.tagName)
          ? el.tagName.toLowerCase()
          : `${el.tagName.toLowerCase()}.${Array.from(el.classList).find((c) => BLOCK_CLASS.test(c))}`
      );
    if (empty.length > 0) {
      return {
        ok: false,
        reason: `component host(s) rendered nothing: ${[...new Set(empty)].join(', ')}`,
      };
    }
    return { ok: true };
  }, selectors);

  if (!verdict.ok) {
    throw new Error(verdict.reason);
  }
}

async function checkStory(page, storyId) {
  const url = `${BASE_URL}/iframe.html?id=${storyId}&viewMode=story`;

  const scriptErrors = [];
  const onPageError = (err) => scriptErrors.push(err.message);
  page.on('pageerror', onPageError);

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (response && !response.ok() && response.status() !== 0) {
      throw new Error(`iframe.html returned HTTP ${response.status()}`);
    }

    // Wait for the story to actually render rather than guessing at a fixed
    // delay. A cold preview bundle takes longer than any constant short enough
    // to be worth using across a whole catalogue — measured at over 500ms for
    // the first story of a run, and well under it for every story after. On
    // timeout we fall through: assertStoryRendered reports the precise reason.
    await page
      .waitForFunction(
        (rootSelectors) => {
          const root = rootSelectors.map((s) => document.querySelector(s)).find(Boolean);
          // Must match assertStoryRendered exactly. It used to wait on
          // childElementCount > 0 — which is the *unmounted* state, since the
          // story host is always present once the preview boots — so it resolved
          // immediately, the timeout was never spent, and the assertion then ran
          // against a DOM nobody had waited for. That was the "3 of 57, different
          // each run" flake, and no retry can fix a wait that does not wait.
          return (
            !!root &&
            (root.querySelector('[class^="sk-"], [class*=" sk-"]') !== null ||
              root.textContent.trim().length > 0)
          );
        },
        RENDER_ROOT_SELECTORS,
        { timeout: RENDER_TIMEOUT_MS }
      )
      .catch(() => {});

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

  const { server, port } = await startStaticServer(STORYBOOK_DIR);
  BASE_URL = `http://127.0.0.1:${port}`;

  const storyIds = loadStoryManifest();

  // Fallback: if manifest not found, test the known stub stories directly
  const idsToTest = storyIds ?? [
    { id: 'primitives-skstub-angular--default', importPath: '' },
    { id: 'primitives-skstub-html--default', importPath: '' },
  ];

  // #69 deleted UNRENDERABLE_IMPORT_PATTERN: the web-components renderer mounts
  // the string-returning packages/styles stories natively, so all of them are
  // assessed. Every story in the manifest is now testable; there is no skip list,
  // and therefore no way for this gate to quietly review a subset.
  const testable = idsToTest;

  if (!storyIds) {
    console.error('❌ Story manifest not found — refusing to report on a guessed story list.');
    console.error('   index.json/stories.json is missing or malformed; rebuild Storybook.');
    console.error('   Passing over two hardcoded stubs is the certifying-absence failure');
    console.error('   this gate exists to prevent (#90).');
    server.close();
    process.exit(1);
  } else {
    console.log(
      `Testing ${testable.length} of ${idsToTest.length} stories for WCAG 2.1 AA ` +
        `compliance (serving ${BASE_URL})...`
    );
    if (testable.length !== idsToTest.length) {
      console.error('❌ Refusing to run: the assessed set is smaller than the manifest.');
      server.close();
      process.exit(1);
    }
  }

  // The server is in-process on purpose. This script calls process.exit(), which
  // does not reap spawned children, so an http-server child would be orphaned on
  // exactly the failing runs this gate exists to produce; and listen(0) gives a
  // collision-free port, where the repo's other two static servers both hardcode
  // 6006 and would fight a local run.
  const browser = await chromium.launch();
  const context = await browser.newContext();

  let totalViolations = 0;
  const failingStories = [];
  const loadFailures = [];

  for (const { id: storyId } of testable) {
    // A fresh page per story. The runner used to share one page across all 131,
    // so a story that left the preview wedged reported every LATER story as
    // "did not render" — form-forminput-angular--form-input-focus renders in
    // 68ms on its own and was being blamed on a timeout. See #90.
    const page = await context.newPage();
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
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.closeAllConnections?.();
  server.close();

  if (loadFailures.length > 0) {
    console.error(`\n❌ ${loadFailures.length} of ${testable.length} story/stories did not render:`);
    loadFailures.forEach(({ storyId, reason }) => console.error(`   ${storyId} — ${reason}`));
    console.error('   A story that does not render cannot be assessed for accessibility.');
  }

  if (totalViolations > 0) {
    console.error(`\n❌ ${totalViolations} WCAG 2.1 AA violation(s) across ${failingStories.length} story/stories.`);
  }

  if (loadFailures.length > 0 || totalViolations > 0) {
    process.exit(1);
  }

  console.log(`\n✅ Zero WCAG 2.1 AA violations across all ${testable.length} rendered story/stories.`);
})();
