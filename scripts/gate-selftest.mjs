#!/usr/bin/env node
/**
 * gate-selftest.mjs — regression guard for the render assertion itself (#70).
 *
 * WHY THIS EXISTS
 *
 * The a11y gate reports "N stories, zero violations". That sentence is true of a
 * gate that assesses nothing, and this repo has now shipped three separate
 * variants of exactly that: an import filter that skipped 74 of 131 stories, a
 * descendant test that passed 12 deliberately-emptied stories, and a wait
 * predicate whose eval() threw into a swallowing .catch(). Each was found by a
 * human emptying a template by hand and noticing the gate stayed green.
 *
 * ADR-9 makes open shadow roots mandatory, which moves every component's content
 * across a boundary that neither `textContent` nor `querySelectorAll` crosses.
 * That is a fourth chance to certify absence, and it cannot be guarded by adding
 * more stories: six of the eleven shapes below MUST fail the assertion, and a
 * story that fails the assertion makes the a11y job permanently red.
 *
 * So the shapes live outside Storybook's `packages/**` story glob, and this
 * harness drives the gate's OWN exported assertStoryRendered against them in a
 * real browser. Not a re-implementation — the import is the point. If someone
 * simplifies the flat-tree traversal back to `root.textContent`, five of these
 * go red here rather than going quietly green in production.
 *
 * Usage: node scripts/gate-selftest.mjs
 */
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { SHAPES } from '../packages/elements/src/__fixtures__/shapes.mjs';

const require = createRequire(import.meta.url);
const {
  assertStoryRendered,
  RENDER_ROOT_SELECTORS,
  CONTENT_MEDIA_SELECTOR,
  computeRenderVerdict,
  buildStoryIframeUrl,
} = require('./run-axe-storybook.js');

// ── External-scan isolation regression probe (#210) ──────────────────────────
//
// scripts/run-axe-storybook.js used to build each story's iframe URL with no globals
// override, which let @storybook/addon-a11y's own automatic afterEach axe scan race
// this gate's own axe-playwright getViolations call on the same axe-core singleton —
// one fatal "Axe is already running" among 252 stories, non-deterministic and
// story-independent. `buildStoryIframeUrl` is the ONE place that builds the URL the
// gate navigates to, and checkStory() calls it directly, so this probe drives the
// SAME function the real gate run uses, not a simulation that could drift from it.
//
// Non-vacuous by construction: it asserts on the DECODED query params via the
// WHATWG URL parser, not a substring match on the raw string, so a corruption that
// keeps the substring "a11y.manual" but flips or truncates the value
// (`a11y.manual:!false`, a dropped `!`, a `?` that shifts everything after it into
// the path) is caught even though `.includes('a11y.manual')` would still pass it.
const URL_PROBES = [
  { id: 'elements-skcard--default', label: 'a plain story id' },
  // Story ids come from Storybook's own built index.json, not user input, but the
  // contract this probe protects is: whatever reaches buildStoryIframeUrl must not
  // corrupt the query string it shares with the manual-scan override. An id
  // containing a query delimiter, left unescaped, would truncate or reparent
  // `globals`.
  { id: 'elements-skcard--edge&case=weird', label: 'a story id containing query-string metacharacters' },
];

let urlProbeFailed = 0;
for (const { id, label } of URL_PROBES) {
  const built = buildStoryIframeUrl('http://127.0.0.1:9', id);
  let parsed;
  try {
    parsed = new URL(built);
  } catch (err) {
    urlProbeFailed++;
    console.error(`❌ URL probe (${label}): buildStoryIframeUrl produced an unparseable URL: ${built} (${err.message})`);
    continue;
  }
  const globalsParam = parsed.searchParams.get('globals');
  const idParam = parsed.searchParams.get('id');
  const viewMode = parsed.searchParams.get('viewMode');
  if (globalsParam !== 'a11y.manual:!true') {
    urlProbeFailed++;
    console.error(
      `❌ URL probe (${label}): globals param is ${JSON.stringify(globalsParam)}, expected ` +
        `"a11y.manual:!true" — the addon's automatic scan is not disabled on this navigation, ` +
        `so it can race axe-playwright's getViolations again ("Axe is already running").`
    );
  }
  if (idParam !== id) {
    urlProbeFailed++;
    console.error(
      `❌ URL probe (${label}): id param round-tripped as ${JSON.stringify(idParam)}, expected ` +
        `${JSON.stringify(id)} — the story id is not encoded safely, so a story id containing its ` +
        `own delimiters can corrupt the query string.`
    );
  }
  if (viewMode !== 'story') {
    urlProbeFailed++;
    console.error(`❌ URL probe (${label}): viewMode param is ${JSON.stringify(viewMode)}, expected "story".`);
  }
}
if (urlProbeFailed > 0) {
  console.error(
    `\n❌ ${urlProbeFailed} URL probe assertion(s) failed. The a11y gate's story URLs no longer ` +
      `isolate the external axe scan from the addon's automatic one — see scripts/run-axe-storybook.js's ` +
      `buildStoryIframeUrl.`
  );
  process.exit(1);
}
console.log(
  `✅ URL probe: buildStoryIframeUrl sets globals=a11y.manual:!true and round-trips ${URL_PROBES.length} story id(s) safely.`
);

/**
 * Attach the fixture's shadow roots imperatively, in declaration order.
 *
 * Not declarative shadow DOM: `<template shadowrootmode>` is parser-only, and
 * whether it survives a given setContent path is a browser-version detail this
 * harness should not depend on. Selectors are resolved across the flat tree so a
 * host nested inside an already-attached shadow root (case 11) is reachable.
 */
async function buildFixture(page, shape) {
  await page.setContent(`<!doctype html><html><body>${shape.html}</body></html>`);
  if (shape.shadow) {
    await page.evaluate((entries) => {
      const findAll = (sel) => {
        const acc = [];
        const visit = (n) => {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches(sel)) acc.push(n);
          if (n.shadowRoot) for (const c of n.shadowRoot.children) visit(c);
          for (const c of n.children) visit(c);
        };
        for (const c of document.body.children) visit(c);
        return acc;
      };
      for (const [sel, html] of entries) {
        for (const host of findAll(sel)) {
          const sr = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
          sr.innerHTML = html;
        }
      }
    }, Object.entries(shape.shadow));
  }
}

// The floor. Without it, `export const SHAPES = []` prints "✅ All 0 shapes
// classified correctly" and exits 0 -- a guard against certifying absence that
// certifies absence. The sibling gate already refuses this
// (run-axe-storybook.js: "refusing to report green over an empty set"); this file
// shipped with only a comment on the FAILURE path, which the person emptying the
// array never sees. A process rule defers the next occurrence; this closes it.
const passShapes = SHAPES.filter((s) => s.want);
const failShapes = SHAPES.filter((s) => !s.want);
if (passShapes.length === 0 || failShapes.length === 0) {
  console.error(
    `❌ Refusing to report green over a degenerate shape set: ` +
      `${passShapes.length} expected-render, ${failShapes.length} expected-reject.\n` +
      `   Both kinds are required. An all-reject set is satisfied by an assertion that\n` +
      `   rejects everything; an all-render set by one that accepts everything.`,
  );
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

let failed = 0;
for (const shape of SHAPES) {
  await buildFixture(page, shape);

  let got, reason = '';
  try {
    await assertStoryRendered(page, RENDER_ROOT_SELECTORS);
    got = true;
  } catch (err) {
    got = false;
    reason = String(err.message).split('\n')[0];
  }

  // The WAIT's copy of the traversal, over the same shape. `waitTimeouts` in
  // production can only ever catch a wait that is too STRICT; this catches one that
  // is too LOOSE, which is the direction that reproduces #69 with no signal at all.
  let waited;
  try {
    await page.waitForFunction(
      computeRenderVerdict,
      [RENDER_ROOT_SELECTORS, CONTENT_MEDIA_SELECTOR, true],
      { timeout: 250 },
    );
    waited = true;
  } catch {
    waited = false;
  }

  const ok = got === shape.want && waited === shape.want;
  if (!ok) failed++;
  const verdict = got ? 'rendered' : 'caught';
  let why = '';
  if (!ok) {
    if (got !== shape.want) {
      why = got ? 'the assertion let this through' : `unexpectedly caught: ${reason}`;
    } else {
      why =
        `assertion and wait DISAGREE — assertion says ${got}, wait says ${waited}. ` +
        `They are the SAME function (computeRenderVerdict), so this is the ` +
        `boolean/object plumbing or the timeout, not a logic drift.`;
    }
  }
  console.log(
    `${ok ? '✅' : '❌'} ${shape.id.padEnd(30)} want=${String(shape.want).padEnd(5)} ` +
      `assert=${verdict.padEnd(8)} wait=${waited ? 'satisfied' : 'timed out'}` +
      (ok ? '' : `\n     ${why}`),
  );
}

await browser.close();

if (failed) {
  console.error(
    `\n❌ ${failed} of ${SHAPES.length} gate self-test shapes misclassified.\n` +
      `   The a11y gate's render assertion is not discriminating what it claims to.\n` +
      `   Do NOT edit packages/elements/src/__fixtures__/shapes.mjs to make this pass —\n` +
      `   the shapes are the specification; scripts/run-axe-storybook.js is the code.`,
  );
  process.exit(1);
}
console.log(
  `\n✅ All ${SHAPES.length} gate self-test shapes classified correctly ` +
    `(${passShapes.length} expected-render, ${failShapes.length} expected-reject), ` +
    `assertion and wait agreeing on every one.`,
);
