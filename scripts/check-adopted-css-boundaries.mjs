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
import * as esbuild from 'esbuild';
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
// `:is()` / `:where()` / `:matches()` only. `:not()` is DELIBERATELY absent, and a pass-2 lens
// showed why: with `:not` in this set, "every branch owns it" is semantically inverted. A
// branch that owns guarantees the compound is NOT the component, so `:not(.sk-nav-pill) .x`
// was ACCEPTED — an outside ancestor, the exact `:is(.sk-nav-pill, .sk-light)` laundering
// shape one pseudo over — while `:not(.sk-light) .x` was rejected. A `:not()` argument now
// confers nothing and vetoes nothing; it is simply not evidence of ownership either way.
const FUNCTIONAL = new Set([':is', ':where', ':matches', ':-webkit-any']);

function compoundOwns(nodes, name) {
  // `__` / `--` / end only. `\b` matched before a HYPHEN too, so `.sk-nav-pill-wrapper`
  // laundered — and would launder for any future sibling element named `sk-nav-pill-menu`.
  const classRe = new RegExp(`^sk-${name}($|__|--)`);
  let owned = false;
  for (const n of nodes) {
    if (n.type === 'class' && classRe.test(n.value)) owned = true;
    // NO attribute-value ownership. It tested the attribute's VALUE and ignored its NAME, so
    // any outside ancestor carrying `[data-component="sk-nav-pill"]` was credited with owning
    // the compound. A class is the only thing that names a component here.
    if (n.type === 'tag' && n.value === 'slot') owned = true;
    if (n.type === 'pseudo' && (n.value === ':host' || n.value === '::slotted')) owned = true;
    if (n.type === 'pseudo' && FUNCTIONAL.has(n.value) && n.nodes?.length) {
      // ADDITIVE, never a veto. `:is()` confers ownership only when EVERY branch owns — that
      // is what rejects `:is(.sk-nav-pill, .sk-light) .x`, since neither the list nor anything
      // else in that compound owns. But an earlier version RETURNED FALSE when a branch did
      // not own, which vetoed compounds that were already owned by their own class:
      // `.sk-nav-pill__item:is(a, button)` is perfectly in-root and was rejected.
      if (n.nodes.every((sel) => compoundOwns(leadingCompound(sel.nodes), name))) owned = true;
    }
  }
  return owned;
}

/**
 * `::slotted()` matches an assigned child and is a PSEUDO-ELEMENT, so nothing can follow it:
 * `::slotted(a) .x` is dropped by every engine. That is the same inert-selector class as the
 * bare type selector this file already rejects, so it is rejected too rather than silently
 * accepted as "owned".
 */
const slottedIsNotLast = (sel) => {
  const compounds = [];
  let current = [];
  for (const n of sel.nodes) {
    if (n.type === 'combinator') {
      compounds.push(current);
      current = [];
    } else current.push(n);
  }
  compounds.push(current);
  return compounds.some((c, i) => {
    const at = c.findIndex((n) => n.type === 'pseudo' && n.value === '::slotted');
    if (at === -1) return false;
    // Something follows it in a LATER compound — `::slotted(a) .x`.
    if (i < compounds.length - 1) return true;
    // Or a PSEUDO-CLASS follows it within the same compound — `::slotted(a):hover`. This arm
    // was missing, and the omission cost a real defect: #78 shipped
    // `::slotted(.sk-blog-card__read-more):hover`, which both Chromium and Firefox drop, taking
    // the comma-listed static-path half with it — while this function's own message already
    // said "nothing may follow it". postcss accepts what the engines reject, so neither this
    // gate nor check-element-css-hygiene noticed. A lens measured the dropped rule.
    //
    // A PSEUDO-ELEMENT may follow, and rejecting it was over-broad. CSS Scoping L1 permits a
    // tree-abiding pseudo-element after `::slotted()` — `::slotted(span)::before` parses and
    // applies. The first revision of this arm rejected those too, and the prose generalised to
    // "nothing may follow it", which is simply not the rule. Two lenses caught it; nothing in
    // packages/styles used the form, so it was latent rather than live.
    return c.slice(at + 1).some((n) => !(n.type === 'pseudo' && n.value.startsWith('::')));
  });
};

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
    // 2. A pseudo-element with something after it never matches.
    if (slottedIsNotLast(sel)) {
      found.push('::slotted() is a pseudo-element — nothing may follow it; this never matches');
    }
    // 3. The general rule.
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
    // --- pass 2 finds. Each of these was measured ACCEPTED before this table grew. ---
    [':not(.sk-nav-pill) .sk-nav-pill__items', 'reject', ':not() inverts "every branch owns"'],
    ['[data-component="sk-nav-pill"] .sk-nav-pill__items', 'reject', 'attribute VALUE is not ownership'],
    ['.sk-nav-pill-wrapper .sk-nav-pill__items', 'reject', 'a hyphen is not a name boundary'],
    ['::slotted(a) .sk-nav-pill__items', 'reject', 'nothing may follow a pseudo-element'],
    // --- and these exercise the FORBIDDEN-TOKEN walk in isolation. Every reject probe above
    //     is also caught by the leftmost rule, so deleting the token walk entirely left the
    //     table green — a red-first test that did not test the rule ADR-9 names. ---
    ['.sk-nav-pill body', 'reject', 'ADR-9 token, NOT leftmost — token walk only'],
    ['.sk-nav-pill :is(html)', 'reject', 'ADR-9 token nested and not leftmost'],
    ['.sk-nav-pill__items :root', 'reject', ':root not leftmost'],
    // --- the ::slotted() arm — two rejects the engines drop, then the forms that must still pass. ---
    ['::slotted(.sk-nav-pill__item):hover', 'reject', 'pseudo-class AFTER ::slotted — engines drop the rule (#78)'],
    ['::slotted(.sk-nav-pill__item):focus-visible', 'reject', 'same shape, second spelling'],
    ['::slotted(.sk-nav-pill__item)::before', 'accept', 'a tree-abiding pseudo-ELEMENT may follow — CSS Scoping L1'],
    ['::slotted(.sk-nav-pill__item)::first-line', 'accept', 'second pseudo-element spelling'],
    ['::slotted(.sk-nav-pill__item:hover)', 'accept', 'the CORRECT inside form must still pass'],
    ['.sk-nav-pill__item:not(.is-active)', 'accept', ':not() must not veto an owned compound'],
    ['.sk-nav-pill:not([hidden])', 'accept', 'attribute :not() on an owned compound'],
    ['.sk-nav-pill__item:is(a, button)', 'accept', ':is() of element types on an owned compound'],
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
  // A FLOOR, not just "both kinds present". Cutting the table to one reject and one accept
  // passed the earlier guard, which put the regression protection for every hole this gate has
  // had one careless edit away. Shrink-only, the same shape as expected-parts.json.
  const rejects = PROBES.filter(([, e]) => e === 'reject').length;
  const accepts = PROBES.length - rejects;
  const FLOOR = { rejects: 21, accepts: 15 };
  if (rejects < FLOOR.rejects || accepts < FLOOR.accepts) {
    console.error(
      `❌ Probe table shrank: ${rejects} reject / ${accepts} accept, floor is ` +
        `${FLOOR.rejects} / ${FLOOR.accepts}. Every form this gate was ever defeated by must\n` +
        '   stay in the table — the table IS the regression protection. Raise the floor when\n' +
        '   you add probes; lower it only with a reason in the commit message.'
    );
    process.exit(1);
  }
  // -------------------------------------------------------------------------
  // OWNERSHIP DERIVATION PROBES. The selector table above never reaches
  // `adoptedSheets()`, so before these existed the file's only new logic — deriving the adopted
  // set from the element's own imports — shipped with no red-first coverage at all, while the
  // docstring claimed otherwise. These drive the real function against the real tree.
  // -------------------------------------------------------------------------
  const owners = (name) => adoptedSheets(name).map((x) => `${x.owner}:${basename(x.file)}`).sort();

  const OWNERSHIP = [
    // [component, expected entries, note]
    ['blog-card',
     ['blog-card:sk-blog-card.css', 'card:sk-card.css'],
     'composes a FOREIGN sheet — each is attributed to the component that AUTHORED it (#78)'],
    ['card',
     ['card:sk-card.css'],
     'a component adopting only its own sheet enrols only its own'],
    ['nav-pill',
     ['nav-pill:sk-nav-pill-drawer.css', 'nav-pill:sk-nav-pill.css'],
     'ONE generated module, TWO source sheets — why ownership globs the directory'],
  ];

  // RECONCILIATION PROBES — the reject path, which had no coverage at all. Two lenses caught
  // that: the ownership table below resolves cleanly for every real component, so the arm that
  // actually stops a barrel-imported sheet going unchecked was never exercised. These drive
  // `adoptedSheets` with SYNTHETIC sources so the failing spellings are committed, not narrated.
  const RECONCILE = [
    ['a barrel import cannot be traced',
     "import { skCardSheet as cardSheet } from '../index.js';\nimport sheet from './sk-x.css.js';\nclass X { static styles = [cardSheet, sheet]; }",
     true],
    ['a TYPE-ANNOTATED declaration is still read',
     "import sheet from './sk-x.css.js';\nclass X { static styles: CSSResultGroup[] = [sheet]; }",
     false],
    ['an `override` modifier is still read',
     "import sheet from './sk-x.css.js';\nclass X { static override styles = [sheet]; }",
     false],
    ['a trailing comment inside the array is not mistaken for an ident',
     "import sheet from './sk-x.css.js';\nclass X { static styles = [\n  sheet, // the only one\n]; }",
     false],
    ['a spread cannot be followed',
     "import sheet from './sk-x.css.js';\nclass X { static styles = [...Base.styles, sheet]; }",
     true],
    ['`super.styles` is refused with an accurate message, not "use a relative import"',
     "import sheet from './sk-x.css.js';\nclass X { static styles = [super.styles, sheet]; }",
     true],
    ['an inline css`` template is refused',
     "import sheet from './sk-x.css.js';\nclass X { static styles = [sheet, css`:host{display:block}`]; }",
     true],
    ['no readable `static styles` fails CLOSED',
     "import sheet from './sk-x.css.js';\nclass X { static get styles() { return [sheet]; } }",
     true],
  ];
  let rbad = 0;
  for (const [note, source, shouldReject] of RECONCILE) {
    const got = adoptedSheets('x', source).some((e) => e.unresolved);
    const ok = got === shouldReject;
    if (!ok) rbad += 1;
    console.log(`${ok ? '✅' : '❌'} ${(shouldReject ? 'reject' : 'accept').padEnd(6)} ${note}`);
  }
  if (rbad) {
    console.error(`\n❌ ${rbad} of ${RECONCILE.length} reconciliation probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  if (RECONCILE.length < 8) {
    console.error('❌ Reconciliation probe table shrank below its floor of 8.');
    process.exit(1);
  }

  let obad = 0;
  for (const [name, expected, note] of OWNERSHIP) {
    const got = owners(name);
    const ok = got.length === expected.length && got.every((v, i) => v === expected[i]);
    if (!ok) obad += 1;
    console.log(
      `${ok ? '✅' : '❌'} owns   ${`<sk-${name}>`.padEnd(52)} ${note}` +
        (ok ? '' : `\n     expected ${JSON.stringify(expected)}\n     got      ${JSON.stringify(got)}`)
    );
  }
  if (obad) {
    console.error(`\n❌ ${obad} of ${OWNERSHIP.length} ownership probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  // A floor here too, for the same reason the selector table has one: a table trimmed to the
  // single easy case is regression protection in name only.
  if (OWNERSHIP.length < 3) {
    console.error('❌ Ownership probe table shrank below its floor of 3.');
    process.exit(1);
  }

  console.log(
    `\n✅ All ${PROBES.length} selector probes behaved as recorded ` +
      `(${rejects} reject, ${accepts} accept), all ${RECONCILE.length} reconciliation probes, ` +
      `and all ${OWNERSHIP.length} ownership probes.`
  );
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

/**
 * The sheets an element adopts, and WHICH COMPONENT OWNS EACH.
 *
 * Ownership follows the component that AUTHORED a sheet, not the element adopting it. That
 * distinction is what ADR-9 Confirmation #1 actually turns on: the invariant is that nothing an
 * element adopts reaches outside its own root, and `sk-card.css`'s rules satisfy that wherever
 * the sheet is adopted, because they only ever name `.sk-card*`.
 *
 * Before #78 this was `packages/styles/src/<element>/sk-*.css` — the adopting element's own
 * directory — which made declared REUSE inexpressible. sk-blog-card's own CSS states the
 * contract its component has always had ("apply both classes; sk-card owns the frame"), and
 * under the operator ruling on #78 it composes the two STYLESHEETS rather than nesting the two
 * elements, so the bordered box stays one box and no declaration is written twice.
 *
 * DERIVED FROM THE ELEMENT'S OWN IMPORTS, not a hand-maintained map. The element already names
 * every sheet it adopts — `import sheet from './sk-blog-card.css.js'`,
 * `import cardSheet from '../card/sk-card.css.js'` — so the adopted set is readable from the
 * source of truth and cannot drift from what Lit actually adopts. A declared map would be the
 * fifth hand-maintained list this programme has removed.
 *
 * This does NOT widen what is accepted. Every rule is still checked, still against a component
 * that owns it, and a rule naming a class no participating sheet owns is still rejected.
 *
 * THE OWNERSHIP DERIVATION HAS ITS OWN PROBES, in the --selftest table's second half. An earlier
 * revision of this docstring claimed "the --selftest probes below cover exactly that" while every
 * probe in the table called `violationsFor(sel, 'nav-pill')` and none reached this function — so
 * the only new logic in the file shipped unexercised by the gate's own red-first table, which is
 * precisely the certifying-absence shape this gate exists to refuse. A lens caught it.
 *
 * THE DIRECTORY GLOB IS DELIBERATE, not a coarse shortcut, and the same lens read it the other
 * way. One generated `.css.js` can be built from SEVERAL source sheets: sk-nav-pill.css.js
 * carries both `sk-nav-pill.css` and `sk-nav-pill-drawer.css`, and the element imports one
 * module. Selecting by the captured basename instead would silently stop checking the drawer
 * sheet — the glob is what keeps every source sheet behind an adopted module in scope.
 */
function adoptedSheets(name, srcOverride) {
  const elementFile = `${OUT_DIR}/${name}/sk-${name}.ts`;
  const out = [];
  const seen = new Set();
  let src = srcOverride ?? '';
  if (srcOverride === undefined) {
    try {
      src = readFileSync(elementFile, 'utf8');
    } catch {
      return out;
    }
  }
  // Local identifier -> owning component, for every sheet imported by a direct relative path.
  const bound = new Map();
  for (const m of src.matchAll(
    /import\s+([A-Za-z_$][\w$]*)\s+from\s+'(\.{1,2}\/(?:([a-z0-9-]+)\/)?)sk-([a-z0-9-]+)\.css\.js'/g
  )) {
    // `./sk-x.css.js` -> this component; `../other/sk-other.css.js` -> that one.
    const owner = m[3] ?? name;
    bound.set(m[1], owner);
    for (const file of globSync(`packages/styles/src/${owner}/sk-*.css`, {}).sort()) {
      if (seen.has(file)) continue;
      seen.add(file);
      out.push({ file, owner });
    }
  }

  // EVERY ENTRY IN `static styles` MUST BE ACCOUNTED FOR, or this function fails OPEN.
  //
  // The derivation above reads import SPECIFIERS. An element that adopts a sheet some other way
  // — `import { skCardSheet } from '../index.js'`, or from '@spec-kitty/elements' — matches
  // nothing here, so that sheet is never checked; and because the element still imports its own
  // `./sk-x.css.js`, the "adopts no stylesheet" guard below does not fire either. Silent, and
  // in the accepting direction.
  //
  // That is not hypothetical: #78 made `skCardSheet` a PUBLIC BARREL EXPORT for the first time,
  // which makes the invisible spelling the ergonomic one. A lens found the hole in the same
  // change that opened it. So the identifiers are reconciled against the array rather than
  // trusted.
  // ESBUILD, NOT A REGEX OVER A GRAMMAR. The first version of this reconciliation matched
  // `/static\s+styles\s*=\s*\[([^\]]*)\]/`, and a lens measured what that misses: BOTH
  // `static styles: CSSResultGroup[] = [...]` and `static override styles = [...]` fail to
  // match, so the check silently did not run and the barrel-import hole it exists to close was
  // still open — with the comment above claiming it failed closed. It also FALSE-REJECTED a
  // trailing `// comment` inside the array, splitting it into nonsense idents and blaming a
  // barrel import that was not there.
  //
  // This repo had already ruled against the construction twice in its own words —
  // build-element-markup.mjs ("Transformed by esbuild, not by regex. Hand-stripping types is a
  // regex over a grammar … the same class of mistake this repo has already paid for once") and
  // check-elements-entries.mjs. Stripping types with the pinned compiler removes the type
  // annotation, the `override` modifier and the comments in one step.
  let js = '';
  try {
    js = esbuild.transformSync(src, {
      loader: 'ts',
      format: 'esm',
      // Drops comments too, so a `// sk-card first` inside the array cannot be mistaken for an
      // identifier — which the first esbuild revision still did, caught by its own new probe.
      minifyWhitespace: true,
    }).code;
  } catch {
    out.push({
      file: null,
      owner: null,
      unresolved: `<sk-${name}> could not be parsed by esbuild, so its \`static styles\` could ` +
        `not be reconciled and its sheets may be UNCHECKED. Fix the syntax error; a component ` +
        `this gate cannot read is a component ADR-9 Confirmation #1 does not cover.`,
    });
    return out;
  }

  const styles = /static\s+styles\s*=\s*\[([^\]]*)\]/.exec(js);
  if (!styles) {
    // FAILS CLOSED. An element with no readable `static styles` adopts nothing this gate can
    // account for, and the previous revision treated that as "nothing to check" rather than as
    // the hole it is.
    out.push({
      file: null,
      owner: null,
      unresolved: `<sk-${name}> has no \`static styles = [...]\` this gate can read, so nothing ` +
        `reconciles the sheets it adopts against the sheets it imports. Declare it as an array ` +
        `literal of identifiers imported by relative path.`,
    });
    return out;
  }

  for (const raw of styles[1].split(',').map((x) => x.trim()).filter(Boolean)) {
    // EACH REFUSAL SAYS WHAT IS ACTUALLY WRONG. The first revision emitted one message —
    // "import the sheet by relative path rather than through a barrel" — for every unresolved
    // entry, which is wrong advice for a spread, for `super.styles`, and for an inline `css`
    // template, and would have sent an author to fix imports that were already correct. A lens
    // called it, and named `super.styles` specifically: it is Lit's documented subclass form,
    // and `sk-form-input`/`sk-form-textarea` already extend a shared base, so hoisting a sheet
    // there is a plausible next edit. None of these is a barrel import.
    if (raw.startsWith('...')) {
      out.push({
        file: null,
        owner: null,
        unresolved: `<sk-${name}> spreads \`${raw}\` into \`static styles\`. This gate resolves ` +
          `identifiers to relative \`./sk-*.css.js\` imports and cannot follow a spread, so ` +
          `those sheets would go UNCHECKED. List them explicitly, or extend this gate to walk ` +
          `the spread's source.`,
      });
      continue;
    }
    if (raw.includes('.') || raw.startsWith('css`')) {
      out.push({
        file: null,
        owner: null,
        unresolved: `<sk-${name}> adopts \`${raw}\` in \`static styles\`, which this gate cannot ` +
          `resolve to a source stylesheet — a member expression such as \`super.styles\` or an ` +
          `inline \`css\`\`\` template. Its rules would go UNCHECKED. Either import the sheet by ` +
          `relative path so this gate can attribute it, or extend the gate to follow this form. ` +
          `Refusing rather than skipping is deliberate: a sheet this gate cannot see is a sheet ` +
          `ADR-9 Confirmation #1 does not cover.`,
      });
      continue;
    }
    if (!/^[A-Za-z_$][\w$]*$/.test(raw) || !bound.has(raw)) {
      out.push({
        file: null,
        owner: null,
        unresolved: `<sk-${name}> adopts \`${raw}\` in \`static styles\`, but this gate cannot ` +
          `trace it to a direct \`./sk-*.css.js\` import — so its rules would go UNCHECKED. ` +
          `Import the sheet by relative path rather than through a barrel; a sheet this gate ` +
          `cannot see is a sheet ADR-9 Confirmation #1 does not cover.`,
      });
    }
  }
  return out;
}

for (const name of components) {
  const sheets = adoptedSheets(name);
  for (const u of sheets.filter((x) => x.unresolved)) violations.push(u.unresolved);
  // PER ELEMENT, not once globally. A global floor counted an element whose sheets it never
  // opened and still printed a green coverage line.
  if (sheets.filter((x) => x.file).length === 0) {
    violations.push(
      `<sk-${name}> adopts no stylesheet that this gate can find — nothing was checked for it, ` +
        `and a green line over zero sheets is the shape this file exists to refuse. The adopted ` +
        `set is derived from the element's own \`sk-*.css.js\` imports, so either it imports ` +
        `none or the sheet it names does not exist.`
    );
    continue;
  }
  sheetCount += sheets.filter((x) => x.file).length;
  for (const { file, owner } of sheets.filter((x) => x.file)) {
    const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
    root.walkRules((rule) => {
      // `@keyframes` steps are `0%`/`from`/`to`, not selectors.
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      ruleCount += 1;
      const line = rule.source?.start?.line ?? 0;
      // `owner`, not `name`: the sheet's author owns its rules.
      for (const why of violationsFor(rule.selector, owner)) {
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
