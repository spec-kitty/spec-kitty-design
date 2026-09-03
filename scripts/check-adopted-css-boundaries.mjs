#!/usr/bin/env node
/**
 * ADR-9 Confirmation #1 — no selector in an ADOPTED stylesheet may reach outside the
 * element's own root.
 *
 * ADR-9 requires this check by name ("a lint rule rejects `:root`, `html`, `body` and
 * `:host-context()` in packages/elements CSS, with a red-first test") and no mission had
 * landed it. #72 paid for its absence: `sk-card.css` carried
 * `:root[data-theme="light"] .sk-card--blue` and `.sk-light .sk-card--blue`, and BOTH went
 * inert the moment the sheet was adopted by `<sk-card>` — the themed ancestor is outside the
 * shadow root and a descendant combinator cannot reach in. No error. No warning. A LightMode
 * story rendering dark styling, found by hand.
 *
 * A custom property inherits through a shadow boundary. A selector does not.
 *
 * STRICTER THAN THE ENUMERATION, DELIBERATELY. Measured against #72's actual defect, ADR-9's
 * four tokens catch half of it: `:root[…]` fires, and `.sk-light .sk-card--blue` does not,
 * because a class on an ancestor is not in the list and is exactly as unreachable. So this
 * also applies the rule the enumeration was illustrating — ADR-9 Confirmation #4's "no
 * selector referencing an ancestor outside its own root": the LEFTMOST compound of every
 * selector must belong to the element.
 *
 * PARSED, NOT GREPPED — AND PARSED ALL THE WAY DOWN. The first version of this file parsed
 * the stylesheet with postcss and then extracted the leftmost compound with a regex split on
 * whitespace. Three pre-merge lenses independently broke it, and all three breaks were the
 * same shape: a functional pseudo-class hides its argument list from a regex.
 *
 *     :is(.sk-nav-pill, .sk-light) .x   passed — `.sk-light` is an outside ancestor
 *     :is(.sk-nav-pill, body) .x        passed — `body` is one of ADR-9's OWN four tokens,
 *                                       missed because the token regex's trailing character
 *                                       class did not include `)`
 *     sk-nav-pill .x                    passed — a bare TYPE selector naming the host, which
 *                                       cannot match the host from inside its own shadow tree
 *
 * For `:is()`-shaped selectors the check was therefore LOOSER than the enumeration it claims
 * to exceed. It now walks a real selector AST and recurses into every functional pseudo, so
 * a forbidden token anywhere in a selector is found, and every branch of an `:is()`/`:where()`
 * list must own the leftmost compound independently.
 *
 * SCOPE — the sheets an ELEMENT adopts, derived the same way scripts/build-elements-css.mjs
 * derives them. Not "all of packages/styles": thirteen stylesheets have no element yet, they
 * are consumed as plain CSS in a document, and `:root` is entirely legitimate there. Scoping
 * this to `packages/elements` (ADR-9's literal words) would check nothing at all — ADR-8
 * constraint 1 means that directory holds no CSS.
 *
 * Usage: node scripts/check-adopted-css-boundaries.mjs [--selftest]
 *
 * `--selftest` runs the committed probe table below instead of the repository, and asserts
 * each probe is accepted or rejected as recorded. ADR-9 asks for a red-first test by name;
 * the probes used to exist only as prose in this docstring and in a PR body, which is how
 * three holes survived review of a file whose whole subject is holes surviving review.
 */
import { readFileSync, globSync } from 'node:fs';
import { basename } from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const OUT_DIR = 'packages/elements/src';
const selftest = process.argv.includes('--selftest');

/**
 * Tokens that reach outside the root wherever they appear — not only leftmost.
 * `:host-context()` is here on ADR-9's evidence rather than on principle: Baseline
 * *limited*, Chromium-only, absent from Firefox and Safari.
 */
const forbiddenNode = (node) => {
  if (node.type === 'tag' && (node.value === 'html' || node.value === 'body')) {
    return `document-level type selector "${node.value}"`;
  }
  if (node.type === 'pseudo' && node.value === ':root') {
    return ':root — outside every shadow root; a descendant combinator cannot reach in';
  }
  if (node.type === 'pseudo' && node.value === ':host-context') {
    return ':host-context() — Baseline limited, Chromium-only (ADR-9)';
  }
  return null;
};

/**
 * Whether a compound belongs to the component.
 *
 * A `.sk-<name>…` class, `:host`, `::slotted(…)`, or a `slot` element — the last because
 * `slot[name="cta"]::slotted(a)` is the canonical form for a named slot and matches strictly
 * INSIDE the element's own root. A bare type selector is otherwise rejected: `nav`, `svg` and
 * `sk-nav-pill` all match nothing useful here, and the last cannot match the host at all.
 *
 * For `:is()`/`:where()`/`:matches()`/`:not()`, EVERY branch must own it. One branch naming
 * the component used to launder the rest.
 */
const FUNCTIONAL = new Set([':is', ':where', ':matches', ':-webkit-any', ':not']);

function compoundOwns(nodes, name) {
  const classRe = new RegExp(`^sk-${name}(\\b|__|--|$)`);
  let owned = false;
  for (const n of nodes) {
    if (n.type === 'class' && classRe.test(n.value)) owned = true;
    if (n.type === 'attribute' && classRe.test(String(n.value ?? ''))) owned = true;
    if (n.type === 'tag' && n.value === 'slot') owned = true;
    if (n.type === 'pseudo' && (n.value === ':host' || n.value === '::slotted')) owned = true;
    if (n.type === 'pseudo' && FUNCTIONAL.has(n.value) && n.nodes?.length) {
      // Every branch, not any: `:is(.sk-nav-pill, .sk-light)` must NOT pass.
      if (n.nodes.every((sel) => compoundOwns(leadingCompound(sel.nodes), name))) owned = true;
      else return false;
    }
  }
  return owned;
}

/** The nodes up to the first top-level combinator. */
const leadingCompound = (nodes) => {
  const out = [];
  for (const n of nodes) {
    if (n.type === 'combinator') break;
    if (n.type !== 'comment') out.push(n);
  }
  return out;
};

function violationsFor(selector, name) {
  const found = [];
  let root;
  try {
    root = selectorParser().astSync(selector);
  } catch (err) {
    return [`unparseable selector — ${String(err?.message ?? err).split('\n')[0]}`];
  }
  for (const sel of root.nodes) {
    // 1. Forbidden tokens ANYWHERE, including inside a functional pseudo's argument list.
    sel.walk((n) => {
      const why = forbiddenNode(n);
      if (why) found.push(why);
    });
    // 2. The general rule.
    if (!compoundOwns(leadingCompound(sel.nodes), name)) {
      found.push(
        `the leftmost compound "${String(sel).trim().split(/\s|>|\+|~/)[0]}" is not part of ` +
          `sk-${name}, so it is an ancestor this sheet cannot reach once adopted`
      );
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// --selftest — the red-first table ADR-9 asks for, committed rather than narrated.
// ---------------------------------------------------------------------------
if (selftest) {
  const PROBES = [
    // [selector, expected: 'reject' | 'accept', note]
    [':root[data-theme="light"] .sk-nav-pill--blue', 'reject', "#72's defect, half 1"],
    ['.sk-light .sk-nav-pill__items', 'reject', "#72's defect, half 2 — NOT in ADR-9's list"],
    ['body .sk-nav-pill', 'reject', 'ADR-9 token'],
    ['html.dark .sk-nav-pill', 'reject', 'ADR-9 token'],
    [':host-context(.dark) .sk-nav-pill', 'reject', 'ADR-9 token'],
    ['.dash-header .sk-nav-pill', 'reject', "a consumer's ancestor"],
    [':is(.sk-nav-pill, .sk-light) .sk-nav-pill__items', 'reject', 'mixed :is() list — lens find'],
    [':is(.sk-nav-pill,.sk-light)>.sk-nav-pill__items', 'reject', 'no spaces, child combinator'],
    [':is(.sk-nav-pill, body) .sk-nav-pill__items', 'reject', 'ADR-9 token inside :is()'],
    [':where(.theme-dark) .sk-nav-pill__items', 'reject', 'wholly outside :where()'],
    ['sk-nav-pill .sk-nav-pill__items', 'reject', 'bare type selector naming the host — lens find'],
    ['nav .sk-nav-pill__items', 'reject', 'bare type selector'],
    ['.sk-nav-pill', 'accept', 'the component itself'],
    ['.sk-nav-pill--blue:hover', 'accept', 'modifier plus state'],
    ['.sk-nav-pill__drawer .sk-nav-pill__item', 'accept', 'intra-component descendant'],
    [':host', 'accept', 'the host'],
    [':host([open]) .sk-nav-pill__items', 'accept', 'host with an attribute'],
    ['::slotted(.sk-nav-pill__item)', 'accept', 'slotted light-DOM child'],
    ['slot[name="cta"]::slotted(a)', 'accept', 'named slot — lens find, was rejected'],
    ['slot', 'accept', 'the slot element — lens find, was rejected'],
    [':is(.sk-nav-pill, .sk-nav-pill__item) .sk-nav-pill__x', 'accept', 'every branch owns'],
  ];
  let bad = 0;
  for (const [sel, expected, note] of PROBES) {
    const got = violationsFor(sel, 'nav-pill').length ? 'reject' : 'accept';
    const ok = got === expected;
    if (!ok) bad += 1;
    console.log(`${ok ? '✅' : '❌'} ${expected.padEnd(6)} ${sel.padEnd(52)} ${note}`);
  }
  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  // A probe table with no rejections would pass vacuously.
  const rejects = PROBES.filter(([, e]) => e === 'reject').length;
  const accepts = PROBES.length - rejects;
  if (rejects === 0 || accepts === 0) {
    console.error('❌ Degenerate probe table — it must contain both accepted and rejected shapes.');
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} probes behaved as recorded (${rejects} reject, ${accepts} accept).`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// The repository pass.
// ---------------------------------------------------------------------------
const components = globSync(`${OUT_DIR}/**/sk-*.ts`, {})
  .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
  .map((f) => basename(f).replace(/^sk-/, '').replace(/\.ts$/, ''))
  .sort();

if (components.length === 0) {
  console.error(
    `❌ Refusing to report green over an empty set: no sk-<name>.ts found under ${OUT_DIR}.`
  );
  process.exit(1);
}

const violations = [];
let ruleCount = 0;
let sheetCount = 0;

for (const name of components) {
  const sheets = globSync(`packages/styles/src/${name}/sk-*.css`, {}).sort();
  // PER ELEMENT, not once globally. A global floor counted an element whose sheets it never
  // opened and still printed a green coverage line.
  if (sheets.length === 0) {
    violations.push(
      `<sk-${name}> has no stylesheet under packages/styles/src/${name}/ — nothing was checked ` +
        `for it, and a green line over zero sheets is the shape this file exists to refuse`
    );
    continue;
  }
  sheetCount += sheets.length;
  for (const file of sheets) {
    const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
    root.walkRules((rule) => {
      // `@keyframes` steps are `0%`/`from`/`to`, not selectors.
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      ruleCount += 1;
      const line = rule.source?.start?.line ?? 0;
      for (const why of violationsFor(rule.selector, name)) {
        violations.push(`${file}:${line} — ${rule.selector.trim()} — ${why}`);
      }
    });
  }
}

if (ruleCount === 0) {
  console.error(
    `❌ Refusing to report green over ${sheetCount} stylesheet(s) containing zero rules.\n` +
      '   A parse that yields nothing reads exactly like a clean sheet.'
  );
  process.exit(1);
}

if (violations.length) {
  console.error('❌ Adopted CSS reaches outside the element root (ADR-9 Confirmation #1):');
  for (const v of violations) console.error(`   ${v}`);
  console.error(
    '\n   These selectors are INERT once the sheet is adopted — silently, with no error.\n' +
      '   Move the variance into a token: a custom property inherits through the boundary,\n' +
      '   a selector does not. See #72 and SK-D01.'
  );
  process.exit(1);
}

console.log(
  `✅ No cross-root selectors: ${components.length} of ${components.length} element(s) checked, ` +
    `${sheetCount} adopted stylesheet(s), ${ruleCount} rule(s).`
);
