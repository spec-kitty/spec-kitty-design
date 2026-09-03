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


// The media half of "this element rendered its own content", single-sourced.
//
// Only the SELECTOR is hoisted, and it travels to the browser as DATA. Both the
// render wait and the render assertion run in separate browser contexts, so the
// predicate itself has to be written out on each side -- but the list that
// actually drifts lives in one place.
//
// Do not "fix" the remaining two-line duplication by shipping the predicate as a
// source string and eval()-ing it in both contexts: that was tried and it made
// waitForFunction throw, which the existing .catch() swallowed, silently turning
// the wait into a no-op and reproducing the "3 of 57, different each run" flake
// this pairing exists to prevent. Measured: stable 0/0 render failures before,
// 0 then 4 after, different stories each run.
//
// Content means TEXT or MEDIA -- never "a descendant that also carries an sk-*
// class", which is the hole that let a host plus one empty BEM element pass.
// Each arm must be evidence that something WAS RENDERED, not merely that a tag
// exists. The first version of this list was too loose and made the gate WEAKER
// than the predicate it replaced, measured by the pre-merge squad over a 24-mutant
// build: it caught 8 of 24 blank stories where a text-only rule caught 24 of 24.
// Three shapes regressed to passing -- <img alt="">, an empty [aria-label]
// descendant, and a host whose only child is an empty <svg>.
//
//   img[alt]:not([alt=""])  an image with no alt text is not evidence of content
//                           (and would fail axe on its own merits)
//   svg > *                 a non-EMPTY svg; a bare <svg></svg> renders nothing
//   bare [aria-label] / [role="img"] are NOT here: an attribute on an empty
//                           element is a promise of content, not content
//   picture/video/canvas    likewise qualified. Bare tags were left in the first
//                           tightening and a pre-merge lens proved the gap: a story
//                           rendering <div class="sk-card"><picture></picture></div>
//                           passed green, and an empty <picture> paints nothing.
//
// This keeps the legitimate icon-only case green
// (<button class="sk-btn" aria-label="Close"><svg><path/></svg></button>) while
// closing all three regressions, and produces output identical to the looser list
// on all 74 real stories.
const CONTENT_MEDIA_SELECTOR =
  'img[alt]:not([alt=""]), svg > *, input, select, textarea, ' +
  'picture:has(img), video[src], video:has(source), canvas[width]:not([width="0"])';

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
  const verdict = await page.evaluate(([rootSelectors, mediaSelector]) => {
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
    // Evidence that the story's own content mounted, not just its wrappers.
    // Content means TEXT or MEDIA -- never "a descendant that also carries an sk-*
    // class". The earlier version accepted any sk-*-classed descendant, which let a
    // host plus one empty BEM element (<div class="sk-stub"><span
    // class="sk-stub__label"></span></div>) pass: the label satisfies the descendant
    // test, and BEM ELEMENT classes are exempt from the per-host emptiness check
    // below because they fail BLOCK_CLASS. The pre-merge squad demonstrated it by
    // emptying 8 form-field stories plus stub -- 12 blank stories, all 12 green.
    // That is verbatim the failure the comment above claims to have closed, so the
    // descendant arm is gone rather than patched.
    // Mirrors the wait predicate below; the selector is shared via
    // CONTENT_MEDIA_SELECTOR so the list cannot drift between them.
    // FLAT-TREE TRAVERSAL (#70). ADR-9 makes open shadow roots mandatory for every
    // component, and neither `textContent` nor `querySelector` crosses a shadow
    // boundary -- so before this, an element that rendered perfectly was reported as
    // "did not render". Demonstrated live on elements-skstub--default.
    //
    // Two traps, both hit by earlier attempts:
    //   * walk the shadow root INSTEAD of childNodes and slotted content becomes
    //     invisible -- <sk-x>text</sk-x> with a <slot> fails as a correct element.
    //     Walk BOTH.
    //   * check a node's children's shadow roots but not its own, and the host
    //     itself reports empty. Check `n.shadowRoot` FIRST.
    // SLOTS. A <slot>'s CHILDREN are its FALLBACK content -- shown only when nothing
    // is assigned to it. What actually paints is assignedNodes(), which live in the
    // light DOM of the host's ancestor. Walking `.childNodes` and calling that "the
    // flat tree" reports a correctly-slotted component as empty. Found by
    // scripts/gate-selftest.mjs (case `slotted-content`), not in production.
    //
    // Note the `return` after the shadow root below: once a host has one, its light
    // children are reachable ONLY through a <slot>. That is deliberate and it is
    // what the browser paints -- unslotted light children render nowhere, so a gate
    // that counted them as content would certify absence exactly as `textContent`
    // did. Locked by case `unslotted-light-children`.
    const flatChildren = (n) => {
      if (n.localName === 'slot' && n.assignedNodes) {
        const assigned = n.assignedNodes({ flatten: true });
        if (assigned.length) return assigned;
      }
      return n.childNodes;
    };
    const flatText = (node) => {
      let out = '';
      const visit = (n) => {
        if (n.nodeType === 3) { out += n.nodeValue; return; }
        if (n.nodeType !== 1) return;
        if (n.shadowRoot) { for (const c of n.shadowRoot.childNodes) visit(c); return; }
        for (const c of flatChildren(n)) visit(c);
      };
      visit(node);
      return out;
    };
    const flatMatch = (node, sel) => {
      const visit = (n) => {
        if (n.nodeType !== 1) return false;
        if (n !== node && n.matches && n.matches(sel)) return true;
        if (n.shadowRoot) {
          for (const c of n.shadowRoot.children) if (visit(c)) return true;
          return false;
        }
        for (const c of flatChildren(n)) if (visit(c)) return true;
        return false;
      };
      return visit(node);
    };
    const flatElements = (node) => {
      const acc = [];
      const visit = (n) => {
        if (n.nodeType !== 1) return;
        if (n !== node) acc.push(n);
        if (n.shadowRoot) { for (const c of n.shadowRoot.children) visit(c); return; }
        for (const c of flatChildren(n)) visit(c);
      };
      visit(node);
      return acc;
    };
    const hasOwnContent = (el) =>
      flatText(el).trim().length > 0 || flatMatch(el, mediaSelector);

    if (!hasOwnContent(root)) {
      return {
        ok: false,
        reason: 'story wrappers mounted but the component did not — no text and no media element',
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
    // Compared against tagName.toUpperCase(): SVG-namespaced elements report a
    // LOWERCASE tagName, so bare 'SVG'/'USE'/'PATH' entries never matched. That is not
    // cosmetic — <svg class="sk-icon-sun"> carries a BLOCK class and would have been
    // selected as a host with no text, failing the gate as "rendered nothing". Live in
    // apps/demo today, one story away from being live here. Found by the pre-merge squad.
    const VOID_OR_LEAF = new Set([
      'IMG', 'INPUT', 'BR', 'HR', 'TEXTAREA', 'SELECT', 'SVG', 'USE', 'PATH',
    ]);
    // A BEM block (`sk-card`), not an element (`sk-card__title`) or modifier
    // (`sk-card--blue`): blocks are the component hosts, and a block that rendered
    // nothing is the defect. Elements and modifiers are parts of an already-checked
    // block, so requiring content of each would fail on legitimately empty slots.
    const BLOCK_CLASS = /^sk-[a-z0-9]+(?:-[a-z0-9]+)*$/;
    // Enumerate across shadow boundaries as well: an sk-* host inside another
    // element's shadow root is invisible to querySelectorAll, which crosses nothing.
    const allDescendants = flatElements(root);
    const hostsByTag = allDescendants.filter((el) => /^sk-/i.test(el.tagName));
    const hostsByClass = allDescendants.filter(
      (el) =>
        el.classList &&
        !VOID_OR_LEAF.has(el.tagName.toUpperCase()) &&
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
  }, [selectors, CONTENT_MEDIA_SELECTOR]);

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
    let waitTimedOut = false;
    await page
      .waitForFunction(
        ([rootSelectors, mediaSelector]) => {
          const root = rootSelectors.map((s) => document.querySelector(s)).find(Boolean);
          // Must match assertStoryRendered's hasOwnContent EXACTLY -- text or a
          // media element, never "a descendant that also carries an sk-* class".
          // It used to wait on childElementCount > 0 — which is the *unmounted*
          // state, since the story host is always present once the preview boots —
          // so it resolved immediately, the timeout was never spent, and the
          // assertion then ran against a DOM nobody had waited for. That was the
          // "3 of 57, different each run" flake, and no retry can fix a wait that
          // does not wait. #69 broke this pairing once already by hardening the
          // assertion and leaving the wait behind, which made the wait STRICTLY
          // WEAKER than the assert: a story that paints its wrapper before filling
          // its text would satisfy the wait and then fail the assert. Caught by the
          // pre-merge squad. If you change one, change both.
          // #70: the same flat-tree walk as the assertion. ADR-9 mandates open
          // shadow roots, and neither textContent nor querySelector crosses one --
          // so a light-DOM-only wait NEVER satisfies for an element story, burns
          // the full RENDER_TIMEOUT_MS, and is then swallowed by the .catch below.
          // Shadow root BEFORE children, and walk BOTH (slotted content lives in
          // the light DOM). Written out here rather than shared as a source string
          // and eval()-ed: that was tried in #102 and made waitForFunction throw
          // into this same catch, silently disabling the wait.
          if (!root) return false;
          // Slot-aware, matching the assertion's flatChildren exactly. A wait that
          // walks a <slot>'s fallback children never satisfies for a slotted
          // component: it burns RENDER_TIMEOUT_MS and lands in the catch below.
          const flatChildren = (n) => {
            if (n.localName === 'slot' && n.assignedNodes) {
              const assigned = n.assignedNodes({ flatten: true });
              if (assigned.length) return assigned;
            }
            return n.childNodes;
          };
          const flatText = (node) => {
            let out = '';
            const visit = (n) => {
              if (n.nodeType === 3) { out += n.nodeValue; return; }
              if (n.nodeType !== 1) return;
              if (n.shadowRoot) { for (const c of n.shadowRoot.childNodes) visit(c); return; }
              for (const c of flatChildren(n)) visit(c);
            };
            visit(node);
            return out;
          };
          const flatMatch = (node, sel) => {
            const visit = (n) => {
              if (n.nodeType !== 1) return false;
              if (n !== node && n.matches && n.matches(sel)) return true;
              if (n.shadowRoot) {
                for (const c of n.shadowRoot.children) if (visit(c)) return true;
                return false;
              }
              for (const c of flatChildren(n)) if (visit(c)) return true;
              return false;
            };
            return visit(node);
          };
          return flatText(root).trim().length > 0 || flatMatch(root, mediaSelector);
        },
        [RENDER_ROOT_SELECTORS, CONTENT_MEDIA_SELECTOR],
        { timeout: RENDER_TIMEOUT_MS }
      )
      .catch((err) => {
        // #70: do NOT swallow silently. A wait that never resolves is the defect
        // this pairing exists to prevent, and the old bare catch made it invisible
        // -- the assertion still ran, still gave the right verdict, and the only
        // symptom was +8s per story. Record it so the self-test can assert on it.
        waitTimedOut = true;
        void err;
      });

    if (scriptErrors.length > 0) {
      throw new Error(`script error: ${scriptErrors[0]}`);
    }

    // #70: a wait that never resolved means the wait predicate and the assertion
    // have diverged -- the assertion may still return the right verdict, so the
    // ONLY symptom is a silent +RENDER_TIMEOUT_MS per story. That is exactly how
    // #69's divergence survived its own eight test cases. Surface it.
    if (waitTimedOut) {
      module.exports.waitTimeouts.push(storyId);
      console.error(
        `⚠  ${storyId}: render wait timed out after ${RENDER_TIMEOUT_MS}ms. ` +
          `The wait predicate and assertStoryRendered have diverged — fix both, ` +
          `not one (see the pairing note above waitForFunction).`
      );
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

// Exposed so the gate self-test can assert the wait actually waited. A wait that
// silently times out is invisible in the verdicts by construction (#69, #70).
module.exports = module.exports || {};
module.exports.waitTimeouts = [];
// Exported for scripts/gate-selftest.mjs, which drives it against fixture pages so
// the eleven shadow/light shapes are a standing regression guard rather than a
// one-off transcript in a PR body.
module.exports.assertStoryRendered = assertStoryRendered;
module.exports.CONTENT_MEDIA_SELECTOR = CONTENT_MEDIA_SELECTOR;
module.exports.RENDER_ROOT_SELECTORS = RENDER_ROOT_SELECTORS;

// ── Main ──────────────────────────────────────────────────────────────────────
//
// Guarded so the module can be required by scripts/gate-selftest.mjs without
// launching a full 76-story run as a side effect.

if (require.main === module) (async () => {
  if (!existsSync(STORYBOOK_DIR)) {
    console.error(`❌ Storybook build not found at ${STORYBOOK_DIR}`);
    console.error('   Run: npx nx run storybook:storybook:build');
    process.exit(2);
  }

  const { server, port } = await startStaticServer(STORYBOOK_DIR);
  BASE_URL = `http://127.0.0.1:${port}`;

  const storyIds = loadStoryManifest();

  if (!storyIds || storyIds.length === 0) {
    console.error('❌ No stories to assess — refusing to report green over an empty set.');
    console.error('   Either the manifest is missing/malformed, or it parsed to zero stories.');
    console.error('   index.json/stories.json is missing or malformed; rebuild Storybook.');
    console.error('   Guessing a story list is the certifying-absence failure this gate');
    console.error('   exists to prevent (#90).');
    server.close();
    process.exit(1);
  }

  // #69 deleted UNRENDERABLE_IMPORT_PATTERN, so there is no filtered subset: every
  // story in the manifest is assessed. The evidence of coverage is the per-story
  // result lines below, NOT this count -- a single number compared against itself
  // would prove nothing. If a skip mechanism is ever reintroduced, it must be
  // reported here explicitly and this comment deleted.
  const testable = storyIds;
  console.log(
    `Testing ${testable.length} stories for WCAG 2.1 AA compliance (serving ${BASE_URL})...`
  );

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

  // Reported unconditionally, INCLUDING the zero. "No warnings appeared" is
  // absence of evidence, and a wait that silently stopped waiting produces exactly
  // that -- it is how #69's divergence survived. State the number.
  console.log(
    `   render wait: ${testable.length - module.exports.waitTimeouts.length}/${testable.length} ` +
      `satisfied, ${module.exports.waitTimeouts.length} timed out.`
  );
  console.log(`\n✅ Zero WCAG 2.1 AA violations across all ${testable.length} rendered story/stories.`);
})();
