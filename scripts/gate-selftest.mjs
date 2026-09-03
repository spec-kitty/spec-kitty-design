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
const { assertStoryRendered, RENDER_ROOT_SELECTORS } = require('./run-axe-storybook.js');

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

  const ok = got === shape.want;
  if (!ok) failed++;
  const verdict = got ? 'rendered' : 'caught';
  console.log(
    `${ok ? '✅' : '❌'} ${shape.id.padEnd(32)} want=${String(shape.want).padEnd(5)} ${verdict}` +
      (ok ? '' : `\n     ${got ? 'the assertion let this through' : `unexpectedly caught: ${reason}`}`),
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
console.log(`\n✅ All ${SHAPES.length} gate self-test shapes classified correctly.`);
