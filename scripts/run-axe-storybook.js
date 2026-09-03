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


// The media half of "this element rendered its own content".
//
// It travels to the browser as DATA, in the argument array of computeRenderVerdict.
// There is no longer a second copy to drift from: the wait and the assertion are one
// function (see computeRenderVerdict below).
//
// Do NOT reintroduce a predicate shipped as a source string and eval()-ed in the
// browser context. That was tried in #102: eval throws inside waitForFunction, the
// existing .catch() swallowed it, and the wait silently became a no-op — the
// "3 of 57, different each run" flake, measured as a stable 0/0 before and 0-then-4
// after, different stories each run. Passing a function REFERENCE, as this file now
// does, is a different mechanism and is safe.
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
 * THE render verdict. One function, one copy, used by BOTH the wait and the assertion.
 *
 * This replaces two hand-maintained copies of the flat-tree traversal. The pairing
 * note this file used to carry -- "if you change one, change both" -- was a process
 * rule standing where a structural constraint belongs, and it had already failed
 * twice: #69 hardened the assertion and left the wait behind, and the pre-merge squad
 * on #106 MEASURED the wait satisfying two shapes the assertion rejects. Equivalence
 * is now by construction; there is nothing left to keep in sync.
 *
 * It is NOT the stringified-source hoist that #102 got wrong. Playwright serializes a
 * function REFERENCE exactly as it serializes an inline arrow -- no `eval`, no global
 * installed on the page. `page.evaluate` wants the object; `waitForFunction` wants a
 * boolean and would treat `{ok:false}` as satisfied, so the caller passes
 * `booleanOnly` and gets the right shape back.
 *
 * THE ONE RULE THAT MAKES THIS SAFE: this function must stay SELF-CONTAINED. It may
 * close over nothing from this module -- everything arrives through its argument
 * array. A reference to any module-scope identifier throws a ReferenceError inside
 * the browser context, and waitForFunction would swallow it into the wait's catch.
 */
const computeRenderVerdict = ([rootSelectors, mediaSelector, booleanOnly]) => {
  const verdict = (() => {
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
  })();
  return booleanOnly ? verdict.ok : verdict;
};

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
  const verdict = await page.evaluate(computeRenderVerdict, [
    selectors,
    CONTENT_MEDIA_SELECTOR,
    false,
  ]);

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
        computeRenderVerdict,
        [RENDER_ROOT_SELECTORS, CONTENT_MEDIA_SELECTOR, true],
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
          `The page never satisfied computeRenderVerdict within the timeout. Since the ` +
          `wait and the assertion are ONE function, this is not a divergence: the story ` +
          `genuinely did not render in time (slow boot, script error, or a real failure ` +
          `the assertion below will name).`
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

// Exposed for scripts/gate-selftest.mjs. A wait that silently stops waiting is
// invisible in the verdicts by construction (#69, #70), so the self-test drives
// `computeRenderVerdict` in BOTH shapes over the same fixtures and requires them to
// agree — which, now that there is only one implementation, they cannot fail to do
// unless the boolean/object plumbing itself breaks.
module.exports = module.exports || {};
module.exports.waitTimeouts = [];
module.exports.computeRenderVerdict = computeRenderVerdict;
// Exported for scripts/gate-selftest.mjs, which drives it against fixture pages so
// the shadow and light shapes are a standing regression guard rather than a
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

  // THE NAMED STORY SET (#74, expected-stories.json).
  //
  // The check above refuses a globally empty set and nothing else, so a component shipping one
  // `Default` story reported green over one state. NFR-003 named that defect and supplied no
  // mechanism; this is the mechanism. Shrink-only: adding stories is free, removing a listed
  // one fails here by name.
  const expectedPath = 'expected-stories.json';
  if (existsSync(expectedPath)) {
    const expected = JSON.parse(readFileSync(expectedPath, 'utf8'));
    const declared = Object.values(expected.byElement ?? {}).flat();
    if (declared.length === 0) {
      console.error(`❌ ${expectedPath} declares no stories — refusing to pass vacuously.`);
      server.close();
      process.exit(1);
    }
    if (declared.length !== expected.total) {
      console.error(
        `❌ ${expectedPath}: total says ${expected.total} but the lists hold ${declared.length}.`
      );
      server.close();
      process.exit(1);
    }
    const present = new Set(storyIds.map((s) => s.id));
    const missing = declared.filter((id) => !present.has(id));
    if (missing.length) {
      console.error('❌ Stories declared in expected-stories.json are absent from the build:');
      for (const id of missing) console.error(`   ${id}`);
      console.error(
        '   Adding a story is free; removing one requires editing that file. A component whose\n' +
          '   only story is its default state has had one of its states tested.'
      );
      server.close();
      process.exit(1);
    }
    console.log(`✅ All ${declared.length} declared story id(s) present in the build.`);
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
      // A story that does not render is a failure, not a warning. Treating it as skippable
      // is what let this gate pass on an empty page.
      //
      // But NOT everything thrown here is a render failure. This catch wraps
      // assertStoryRendered AND injectAxe/getViolations, so an axe-internal fault was
      // reported as "did not render" — observed in CI as
      //   ❌ elements-skstub--default: did not render (Axe is already running.)
      // on a run whose tree was byte-identical to a green one, and which passed on re-run.
      // Both are failures and both still fail the gate; conflating them sends the next
      // reader to debug a render path that is fine. Name the real cause.
      const axeFault = /\bAxe\b|axe-core/i.test(err.message);
      loadFailures.push({ storyId, reason: err.message, kind: axeFault ? 'axe' : 'render' });
      console.error(
        axeFault
          ? `❌ ${storyId}: the accessibility scanner itself faulted, the story rendered — ${err.message}`
          : `❌ ${storyId}: did not render (${err.message})`
      );
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.closeAllConnections?.();
  server.close();

  if (loadFailures.length > 0) {
    const rendersFailed = loadFailures.filter((f) => f.kind !== 'axe');
    const axeFaulted = loadFailures.filter((f) => f.kind === 'axe');
    if (rendersFailed.length) {
      console.error(`\n❌ ${rendersFailed.length} of ${testable.length} story/stories did not render:`);
      rendersFailed.forEach(({ storyId, reason }) => console.error(`   ${storyId} — ${reason}`));
      console.error('   A story that does not render cannot be assessed for accessibility.');
    }
    if (axeFaulted.length) {
      console.error(`\n❌ ${axeFaulted.length} story/stories rendered but the SCANNER faulted:`);
      axeFaulted.forEach(({ storyId, reason }) => console.error(`   ${storyId} — ${reason}`));
      console.error('   Still a failure — an unscanned story is an unassessed one — but the');
      console.error('   story is not the suspect. "Axe is already running" is a known flake here.');
    }
  }

  if (totalViolations > 0) {
    console.error(`\n❌ ${totalViolations} WCAG 2.1 AA violation(s) across ${failingStories.length} story/stories.`);
  }

  // FATAL, not advisory. A wait that never resolved means the predicate and the
  // assertion have diverged, and the assertion may still return the right verdict
  // -- so the verdicts cannot show you this and the only other symptom is
  // +RENDER_TIMEOUT_MS per story. Printing it and carrying on is what "silently
  // disabled the wait" looked like in #69. Exit non-zero.
  if (module.exports.waitTimeouts.length > 0) {
    console.error(
      `\n❌ ${module.exports.waitTimeouts.length} story/stories timed out waiting to render:`
    );
    module.exports.waitTimeouts.forEach((id) => console.error(`   ${id}`));
    console.error(
      '   These stories did not satisfy computeRenderVerdict within RENDER_TIMEOUT_MS.\n' +
        '   The wait and the assertion are one function, so this is a real render\n' +
        '   failure or a timing problem, not a drift between two copies.'
    );
  }

  // Printed on EVERY run, including a failing one, and including the zero. "No
  // warnings appeared" is absence of evidence, and a wait that silently stopped
  // waiting produces exactly that -- it is how #69's divergence survived. An earlier
  // cut of this block sat below the exit and called itself "unconditional", so the
  // census could never be taken on the runs where it would have mattered.
  console.log(
    `   render wait: ${testable.length - module.exports.waitTimeouts.length}/${testable.length} ` +
      `satisfied, ${module.exports.waitTimeouts.length} timed out.`
  );

  if (loadFailures.length > 0 || totalViolations > 0 || module.exports.waitTimeouts.length > 0) {
    process.exit(1);
  }
  console.log(`\n✅ Zero WCAG 2.1 AA violations across all ${testable.length} rendered story/stories.`);
})();
