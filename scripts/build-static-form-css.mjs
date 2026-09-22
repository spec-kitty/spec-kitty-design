#!/usr/bin/env node
/**
 * Generate the LIGHT-DOM STATIC FORM of an element-backed stylesheet (ADR-15 kinds 1 and 2, #309).
 *
 * WHAT THIS EMITS AND WHY IT IS A WHOLE SHEET RATHER THAN A FRAGMENT
 *
 * ADR-15 ruled that two shipped shadow-DOM CSS constructs — a host-attribute variant axis inside a
 * host-owned `@container`, and a host-owned `container-type` — get a generated static form, and
 * that the static form only works as TWO elements:
 *
 *     <div class="sk-<name>-host"><div class="sk-<name>">…</div></div>
 *
 * because an element is never its own query container. Collapsing the host onto the root makes
 * every rule ON that element answer some outer ancestor instead, while its descendants keep
 * working — which is why the defect is silent.
 *
 * The output is the WHOLE sheet, not just the rewritten `:host` rules, and that is deliberate.
 * A fragment linked after `sk-<name>.css` would sit at the END of the document's cascade, so any
 * equal-specificity pair the authored sheet had ordered one way could resolve the other way. The
 * static form preserves SOURCE ORDER exactly by carrying every rule, so a static consumer links
 *
 *     @spec-kitty/styles/<name>/static/sk-<name>.static.css
 *
 * INSTEAD OF `sk-<name>.css`, never in addition to it.
 *
 * WHY `static/` AND NOT `sk-<name>.static.css` BESIDE THE SOURCE
 *
 * `build-elements-css.mjs` globs `packages/styles/src/<name>/sk-*.css` and CONCATENATES every
 * match into the sheet the element adopts; `check-adopted-css-boundaries.mjs` globs the same
 * shape. A generated static form sitting beside its source would be adopted into the shadow root
 * — where `.sk-<name>-host` matches nothing — and would then be reported by the boundary gate as
 * a cross-root selector. Both globs are non-recursive, so a subdirectory keeps the static form
 * out of the adopted set without teaching either gate a filename exemption, which is an escape
 * hatch a future sheet could take deliberately.
 *
 * THE WRAPPER RULE IS READ FROM EACH COMPONENT'S OWN `:host`, NEVER TEMPLATED
 *
 * ADR-15 measured both failure directions and they point opposite ways. `sk-app-shell`'s `:host`
 * declares `width: 100%`; a wrapper abbreviated to `container-type: inline-size` makes the whole
 * component compute `0px` as a flex item, because size containment on a width-less box
 * contributes nothing to intrinsic sizing. `sk-action-row`'s `:host` declares no `width` at all,
 * so a wrapper copied from app-shell would ADD one the element never had. Hence: whatever that
 * component's `:host` declared, moved verbatim onto the wrapper, per component.
 *
 * SPECIFICITY IS PRESERVED EXACTLY, AND ASSERTED RATHER THAN ARGUED
 *
 * `:host` is a pseudo-class, so `:host` weighs (0,1,0) and `:host(S)` weighs (0,1,0) + S. An
 * attribute selector and a class selector weigh the same, so mapping
 * `[presentation="compact"]` -> `.sk-<name>-host--compact` inside the argument and prefixing the
 * whole thing with `.sk-<name>-host` reproduces the original weight node for node. That matters
 * concretely: `sk-app-shell.css`'s last rule is
 * `:host(:is([presentation="compact"], [presentation="rail-preserving"])) .sk-app-shell__compact-navigation[hidden]`
 * at (0,4,0), and it is what beats the `@container`-gated `display: block` at (0,3,0) — a rewrite
 * that landed below (0,3,0) would leave a closed drawer visible. Every rewrite is checked against
 * its source's computed specificity here, and a mismatch is a hard error rather than a comment.
 *
 * `::slotted()` IS DROPPED, LOUDLY
 *
 * ADR-15 kind 3 is SHADOW-ONLY: an outer-tree declaration beats a `::slotted()` declaration from
 * the inner tree regardless of specificity and regardless of order (ADR-16 corrects the
 * attribution — that property belongs to the tree-order cascade, not to `::slotted()`), and no
 * document-context selector reproduces it. So there is no static form to emit. The rules are
 * omitted and the count is stated in the generated header, because a silently shorter sheet is
 * the failure mode ADR-15 objects to everywhere else. #311 owns the written instruction.
 *
 * Usage: node scripts/build-static-form-css.mjs [--check] [--selftest]
 *
 * `--check` fails on drift, the same contract build-element-markup.mjs and build-elements-css.mjs
 * use. `--selftest` runs the committed rewrite probe table instead of the repository.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, globSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const STYLES = 'packages/styles/src';
const check = process.argv.includes('--check');
const selftest = process.argv.includes('--selftest');

// RUN ONLY AS THE ENTRY POINT. `check-static-form-equivalence.mjs` imports `staticFormSources`,
// `hostClass` and `specificityOf` from this file so the gate derives its scope from the SAME
// function the generator does — a gate with its own copy of the derivation is a gate that can
// stop covering a component the generator still emits. Without this guard that import would also
// rewrite four committed files as a side effect of running the gate.
const IS_ENTRY = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

// ---------------------------------------------------------------------------
// Specificity — computed, because the rewrite's whole claim rests on it.
// ---------------------------------------------------------------------------

/** `:is()`/`:not()`/`:has()` take the specificity of their most specific argument; `:where()` takes none. */
const MOST_SPECIFIC_ARG = new Set([':is', ':not', ':has', ':matches', ':-webkit-any', ':any']);

const addSpec = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const cmpSpec = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const maxSpec = (list) => list.reduce((best, s) => (cmpSpec(s, best) > 0 ? s : best), [0, 0, 0]);
const specText = (s) => `(${s[0]},${s[1]},${s[2]})`;

function specificityOfNodes(nodes) {
  let total = [0, 0, 0];
  for (const n of nodes) {
    switch (n.type) {
      case 'id':
        total = addSpec(total, [1, 0, 0]);
        break;
      case 'class':
      case 'attribute':
        total = addSpec(total, [0, 1, 0]);
        break;
      case 'tag':
        // The universal selector contributes nothing; postcss-selector-parser calls it a tag.
        if (n.value !== '*') total = addSpec(total, [0, 0, 1]);
        break;
      case 'pseudo': {
        const args = (n.nodes ?? []).map((sel) => specificityOfNodes(sel.nodes));
        if (n.value.startsWith('::')) {
          // A pseudo-ELEMENT is a c-count. `::slotted(S)` additionally takes S's specificity.
          total = addSpec(total, addSpec([0, 0, 1], maxSpec(args)));
        } else if (n.value === ':where') {
          // and nothing else — :where() is specificity-zero by definition.
        } else if (MOST_SPECIFIC_ARG.has(n.value)) {
          total = addSpec(total, maxSpec(args));
        } else {
          // Every other pseudo-class is a b-count. `:host(S)` and `:nth-child(… of S)` also
          // take their argument's specificity, which `maxSpec` supplies for free.
          total = addSpec(total, addSpec([0, 1, 0], maxSpec(args)));
        }
        break;
      }
      default:
        break; // combinator, comment, string, universal handled above
    }
  }
  return total;
}

/** Specificity of ONE complex selector (no comma). */
export const specificityOf = (selector) =>
  specificityOfNodes(selectorParser().astSync(selector).nodes[0].nodes);

// ---------------------------------------------------------------------------
// The rewrite.
// ---------------------------------------------------------------------------

export const hostClass = (name) => `sk-${name}-host`;

class RewriteError extends Error {}

/**
 * The modifier class an attribute simple selector inside `:host(...)` becomes.
 *
 * `[presentation="compact"]` -> `sk-app-shell-host--compact`; a valueless `[sticky]` ->
 * `sk-page-header-host--sticky`. Anything else — a `~=`/`^=`/`$=`/`*=`/`|=` operator, a case
 * sensitivity flag, a value that is not a plain identifier — is REFUSED rather than approximated,
 * because a wrong rewrite here is silent: the class simply never matches and the rule vanishes.
 */
function modifierFor(name, node, collisions) {
  if (node.operator !== undefined && node.operator !== '=') {
    throw new RewriteError(
      `\`${String(node).trim()}\` uses the \`${node.operator}\` operator inside :host(). Only ` +
        `\`[attr]\` and \`[attr="value"]\` have a class rewrite; a substring or word match does not.`,
    );
  }
  if (node.insensitive) {
    throw new RewriteError(
      `\`${String(node).trim()}\` carries a case-sensitivity flag, which a class selector cannot ` +
        `reproduce — class matching is always case-sensitive in a standards-mode document.`,
    );
  }
  const raw = node.operator === '=' ? String(node.value ?? '') : node.attribute;
  const modifier = `${hostClass(name)}--${raw}`;
  if (!/^sk-[a-z][a-z0-9-]*--[a-z][a-z0-9-]*$/.test(modifier)) {
    throw new RewriteError(
      `\`${String(node).trim()}\` would emit the class \`${modifier}\`, which is not a lowercase ` +
        `BEM modifier. stylelint's selector-class-pattern would reject it, and a static consumer ` +
        `cannot author a class this generator will not name.`,
    );
  }
  // TWO ATTRIBUTES, ONE MODIFIER is a real hazard and it is silent: a sheet carrying both
  // `[layout="card"]` and `[presentation="card"]` would emit one class for two independent axes,
  // so setting either would apply both rule sets. Value-derived names are what ADR-15 prescribes,
  // so the collision is refused here rather than the naming scheme being changed.
  const source = node.operator === '=' ? `[${node.attribute}="${raw}"]` : `[${node.attribute}]`;
  const seen = collisions.get(modifier);
  if (seen !== undefined && seen !== source) {
    throw new RewriteError(
      `\`${source}\` and \`${seen}\` both rewrite to \`.${modifier}\` — two independent host ` +
        `attributes would share one modifier class, so setting either would apply both rule sets.`,
    );
  }
  collisions.set(modifier, source);
  return modifier;
}

function renderNodes(nodes, name, collisions, insideHostArg) {
  return nodes.map((n) => renderNode(n, name, collisions, insideHostArg)).join('');
}

function renderNode(node, name, collisions, insideHostArg) {
  if (node.type === 'pseudo' && node.value === ':host') {
    if (insideHostArg) {
      throw new RewriteError('`:host` nested inside `:host(...)` — that selector matches nothing.');
    }
    const argument = (node.nodes ?? [])
      .map((sel) => renderNodes(sel.nodes, name, collisions, true).trim())
      .filter(Boolean)
      .join(', ');
    // `:host(A, B)` is not a thing the parser can hand back as more than one selector in
    // practice, but if it ever does the comma has to live inside an `:is()` or the compound
    // splits into two rules with different weights.
    const suffix = (node.nodes ?? []).length > 1 ? `:is(${argument})` : argument;
    return `.${hostClass(name)}${suffix}`;
  }
  if (node.type === 'attribute' && insideHostArg) {
    // `node.spaces.before` is dropped on purpose: inside a functional pseudo's argument list the
    // parser hands back `" [presentation=…]"` for the second branch, and a leading space there
    // would emit `:is(.a, .b)` as `:is(.a,  .b)` — harmless, but the output is compared byte for
    // byte by --check, so it is normalised rather than left to the parser's whitespace.
    return `.${modifierFor(name, node, collisions)}`;
  }
  if (node.type === 'pseudo' && (node.nodes ?? []).length) {
    const args = node.nodes
      .map((sel) => renderNodes(sel.nodes, name, collisions, insideHostArg).trim())
      .join(', ');
    return `${node.spaces?.before ?? ''}${node.value}(${args})${node.spaces?.after ?? ''}`;
  }
  if (insideHostArg && node.type === 'combinator') {
    throw new RewriteError(
      '`:host(...)` may only take a compound selector; a combinator inside it matches nothing.',
    );
  }
  return String(node);
}

/** Whether a selector reaches a `::slotted()` pseudo-element anywhere. */
const usesSlotted = (selector) =>
  selectorParser().astSync(selector).nodes.some((sel) => {
    let found = false;
    sel.walk((n) => {
      if (n.type === 'pseudo' && n.value === '::slotted') found = true;
    });
    return found;
  });

/**
 * The static form of one selector list.
 *
 * Returns `{ selector, dropped }` — `dropped` counts the comma-branches removed for
 * `::slotted()`. A rule whose every branch is dropped is removed entirely by the caller.
 */
export function rewriteSelectorList(selectorList, name, collisions = new Map()) {
  const root = selectorParser().astSync(selectorList);
  const kept = [];
  let dropped = 0;
  for (const sel of root.nodes) {
    const original = String(sel).trim();
    if (usesSlotted(original)) {
      dropped += 1;
      continue;
    }
    const rewritten = renderNodes(sel.nodes, name, collisions, false).trim();
    const before = specificityOf(original);
    const after = specificityOf(rewritten);
    if (cmpSpec(before, after) !== 0) {
      throw new RewriteError(
        `the rewrite changed the selector's weight — \`${original}\` is ${specText(before)} and ` +
          `\`${rewritten}\` is ${specText(after)}. ADR-15 names one rule in this library whose ` +
          `whole job is out-weighing another (sk-app-shell's compact-navigation[hidden] rule at ` +
          `(0,4,0) beating an @container-gated rule at (0,3,0)); a rewrite that moves a weight ` +
          `reorders the cascade silently.`,
      );
    }
    kept.push(rewritten);
  }
  return { selector: kept.join(',\n'), dropped };
}

// ---------------------------------------------------------------------------
// Which sheets this reaches — derived, never listed.
// ---------------------------------------------------------------------------

/**
 * A sheet is in scope when its `:host` rule declares `container-type`.
 *
 * That single condition is exactly ADR-15's two generable construct kinds, and stating it as one
 * condition is the point. Kind 2 IS a host-owned `container-type`. Kind 1 is a host-attribute
 * axis *inside a host-owned `@container`*, and the qualifier is binding — ADR-15 says so twice:
 * a host-attribute axis in a sheet with no `container-type` (`sk-metric`, `sk-transition-matrix`,
 * `sk-nav-pill-drawer`, `sk-form-input`, `sk-form-textarea`) is a plain root-class modifier, the
 * collapsed transform is sound for it, and inserting a wrapper would be an unmeasured layout
 * change made for no reason. So the presence of `container-type` on `:host` is the whole test.
 */
export function hostDeclarations(cssText) {
  const root = postcss.parse(cssText);
  const declarations = [];
  root.walkRules((rule) => {
    if (rule.selector.trim() !== ':host') return;
    if (rule.parent?.type !== 'root') return;
    rule.walkDecls((decl) => declarations.push({ prop: decl.prop, value: decl.value.trim() }));
  });
  return declarations;
}

export function staticFormSources() {
  return globSync(`${STYLES}/*/sk-*.css`, {})
    .filter((file) => hostDeclarations(readFileSync(file, 'utf8')).some((d) => d.prop === 'container-type'))
    .sort()
    .map((file) => ({
      file,
      component: basename(dirname(file)),
      out: join(dirname(file), 'static', `${basename(file, '.css')}.static.css`),
    }));
}

// ---------------------------------------------------------------------------
// Emission.
// ---------------------------------------------------------------------------

const MARK = 'GENERATED by scripts/build-static-form-css.mjs — DO NOT EDIT.';

export function staticFormOf(cssText, component, sourcePath) {
  const root = postcss.parse(cssText);
  const collisions = new Map();
  let droppedSlotted = 0;

  root.walkComments((comment) => comment.remove());
  root.walkRules((rule) => {
    let result;
    try {
      result = rewriteSelectorList(rule.selector, component, collisions);
    } catch (err) {
      if (err instanceof RewriteError) {
        throw new Error(
          `${sourcePath}: cannot rewrite \`${rule.selector.replace(/\s+/g, ' ')}\` — ${err.message}`,
          { cause: err },
        );
      }
      throw err;
    }
    droppedSlotted += result.dropped;
    if (result.selector === '') {
      rule.remove();
      return;
    }
    // Continuation lines of a selector LIST re-indented to the rule's own depth. postcss keeps
    // the original inter-selector whitespace in `raws.selector`, which no longer describes the
    // rewritten text, so the joined form would otherwise emit every branch after the first hard
    // against the left margin inside an `@container` block.
    const indent = /\n([ \t]*)$/.exec(rule.raws.before ?? '')?.[1] ?? '';
    rule.selector = result.selector.split(',\n').join(`,\n${indent}`);
  });
  // An at-rule left with nothing in it after the `::slotted()` branches went is noise, not a
  // rule. Removed AFTER the walk, and repeatedly, so a nested empty block is reached too.
  let removedOne = true;
  while (removedOne) {
    removedOne = false;
    root.walkAtRules((at) => {
      if ((at.nodes ?? []).length === 0) {
        at.remove();
        removedOne = true;
      }
    });
  }

  const wrapper = hostDeclarations(cssText);
  const slottedNote =
    droppedSlotted === 0
      ? '   This sheet declares no `::slotted()` rule, so nothing was omitted.'
      : `   ${droppedSlotted} \`::slotted()\` selector(s) in the authored sheet have NO static form and are\n` +
        `   OMITTED here. ADR-15 kind 3 is shadow-only: a declaration from the outer tree beats an\n` +
        `   inner-tree \`::slotted()\` declaration regardless of specificity AND regardless of order\n` +
        `   (ADR-16 attributes that to the tree-order cascade rather than to \`::slotted()\` itself),\n` +
        `   and no document-context selector reproduces it. A static consumer authors the rule\n` +
        `   themselves — see the authored sheet's own instruction block, and #311.`;

  const header = `/* ${MARK}
   Authored source: ${sourcePath}
   Regenerate: node scripts/build-static-form-css.mjs

   THE LIGHT-DOM STATIC FORM of the sheet above (ADR-15 kinds 1 and 2, #309).

   LINK THIS INSTEAD OF ${basename(sourcePath)}, never in addition to it. It carries every rule
   that sheet carries, in the same order, with \`:host\` rewritten onto a wrapper class — so a
   consumer who links both gets every declaration twice, at two different weights.

   THE MARKUP IS TWO ELEMENTS, and the outer one is not decoration:

       <div class="${hostClass(component)}">
         <div class="sk-${component}"> … </div>
       </div>

   An element is never its own query container. Collapse these two onto one and every rule ON
   that element starts answering some outer ancestor — or nothing — while its descendants keep
   working, which is what makes the defect silent. \`display: contents\` on the wrapper does the
   same thing a different way: it removes the principal box, and \`container-type\` needs one.

   The wrapper's declarations are ${basename(sourcePath)}'s own \`:host\` set, read from it and
   not templated from another component. ${
     wrapper.length === 0
       ? 'This sheet declares none.'
       : `Today: ${wrapper.map((d) => `${d.prop}: ${d.value}`).join('; ')}.`
   }

   THE CASCADE POSITION IS NOT REPRODUCED. THIS IS A RULED LIMIT, NOT AN OVERSIGHT (#375).

   \`:host\` declarations live in the element's INNER tree. Under CSS Cascade's tree-order sort a
   normal declaration from the OUTER tree wins over one from the inner tree BEFORE specificity and
   BEFORE source order are consulted — so ANY document rule matching \`<sk-${component}>\` beats
   \`:host\`, at any weight, in any order. Moved onto \`.${hostClass(component)}\` those same
   declarations are ordinary document declarations competing on ordinary terms. The wrapper
   reproduces \`:host\`'s LAYOUT and HARDENS its cascade position. Three consequences, measured on
   \`sk-action-row\` and identical in chromium and firefox — they are properties of the cascade, not
   of that component, and they hold here unchanged. Re-runnable with
   \`node scripts/check-static-form-equivalence.mjs\`:

     * a consumer's \`sk-action-row { display: flex }\` at (0,0,1) BEATS \`:host\`; the identical
       intent as \`div { display: flex }\`, at the same (0,0,1), LOSES to \`.sk-action-row-host\`;
     * \`sk-action-row { container-type: normal }\` destroys the element's container, so its
       \`@container\` rules stop firing — the same declaration on \`.sk-action-row-host\` at equal
       weight, authored first, does not;
     * the same declaration at strictly higher weight, or at equal weight in a LATER stylesheet,
       wins against both forms.

   SO THE BOUNDARY, COMPUTED FROM THE RULE ACTUALLY EMITTED BELOW RATHER THAN TRANSCRIBED: to
   change one of this component's wrapper declarations, a consumer needs specificity STRICTLY
   HIGHER than the rule below that declares it, or the same specificity in a stylesheet loaded
   LATER — and a bundler decides the second more often than a consumer does. It is not one number.
   \`.${hostClass(component)}\` is (0,1,0); a modifier rule such as
   \`.${hostClass(component)}.${hostClass(component)}--<axis>\` is (0,2,0), so a property declared
   there needs (0,3,0) to be outbid.

   \`:where(.${hostClass(component)})\` WAS MEASURED AND IS NOT EMITTED. At (0,0,0) it restores the
   element's deference for every property the BASE wrapper rule declares, and it moves no
   library-only outcome in either engine. It buys that by deferring to every document rule that
   matches the wrapper — including a page-wide \`div { … }\` reset, which cannot touch the custom
   element at all — and it leaves the modifier rules at their own weight, so a bare host-attribute
   axis like \`:host([sticky])\` keeps diverging anyway. A partial remedy carrying a new failure
   mode loses to a stated boundary. The candidate is re-measured on every
   \`check-static-form-equivalence.mjs --selftest\` run rather than left as an argument.

${slottedNote}
*/
`;

  // No separate wrapper rule is appended: the sheet's own `:host` rule IS the wrapper rule, and
  // `walkRules` above has already rewritten it in place — which is what keeps it "whatever
  // `:host` declares" rather than a copy this generator maintains, and what keeps it in the
  // sheet's original cascade position.
  return `${header}${root.toString().replace(/^\s+/, '').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

// ---------------------------------------------------------------------------
// --selftest — the rewrite's own probe table, committed rather than narrated.
// ---------------------------------------------------------------------------

if (IS_ENTRY && selftest) {
  // [selector, expected rewrite or null when it must be REFUSED, note]
  const PROBES = [
    [':host', '.sk-x-host', 'the bare host becomes the wrapper class'],
    [':host([sticky])', '.sk-x-host.sk-x-host--sticky', "the BARE host-attribute form ADR-15 names for sk-page-header"],
    [
      ':host([presentation="compact"]) .sk-x__panel',
      '.sk-x-host.sk-x-host--compact .sk-x__panel',
      'the ordinary axis form — the descendant combinator survives',
    ],
    [
      ':host(:is([presentation="compact"], [presentation="rail-preserving"])) .sk-x__nav[hidden]',
      '.sk-x-host:is(.sk-x-host--compact, .sk-x-host--rail-preserving) .sk-x__nav[hidden]',
      "sk-app-shell's last rule — the :is() argument list is rewritten too",
    ],
    [
      ':host(:not([invalid])) .sk-x__control',
      '.sk-x-host:not(.sk-x-host--invalid) .sk-x__control',
      "the :not() form sk-form-input and sk-form-textarea use",
    ],
    [
      ':host([presentation="compact"]) .sk-x__a, :host([presentation="compact"]) .sk-x__b',
      '.sk-x-host.sk-x-host--compact .sk-x__a,\n.sk-x-host.sk-x-host--compact .sk-x__b',
      'every branch of a selector list is rewritten',
    ],
    ['.sk-x__panel > .sk-x__item', '.sk-x__panel > .sk-x__item', 'a rule with no :host is copied unchanged'],
    [':host(:hover) .sk-x__panel', '.sk-x-host:hover .sk-x__panel', 'a state pseudo inside :host() is not a modifier'],
    ['::slotted(img)', '', '::slotted() has no static form — the branch is dropped (ADR-15 kind 3)'],
    [
      '.sk-x__content > img, ::slotted(img)',
      '.sk-x__content > img',
      'the #78 paired spelling keeps its document half and drops its slotted half',
    ],
    // --- REFUSALS. Each of these is a rewrite that would be SILENT if approximated: the class
    //     simply never matches, so the rule vanishes and nothing reports it. ---
    [':host([data-mode~="compact"])', null, 'a word-match operator has no class rewrite'],
    [':host([presentation="Compact" i])', null, 'a case-sensitivity flag cannot be reproduced by a class'],
    [':host([presentation="Compact"])', null, 'a value that is not a lowercase BEM modifier is refused'],
    [':host(:host)', null, ':host nested inside :host() matches nothing'],
  ];

  let bad = 0;
  for (const [selector, expected, note] of PROBES) {
    let got;
    try {
      got = rewriteSelectorList(selector, 'x').selector;
    } catch (err) {
      got = err instanceof RewriteError ? null : (() => { throw err; })();
    }
    const ok = got === expected;
    if (!ok) bad += 1;
    console.log(
      `${ok ? '✅' : '❌'} ${(expected === null ? 'refuse' : 'rewrite').padEnd(7)} ${selector}` +
        (ok ? `\n           ${note}` : `\n     expected ${JSON.stringify(expected)}\n     got      ${JSON.stringify(got)}`),
    );
  }

  // SPECIFICITY, driven directly. Every probe above also passes through the equality assertion
  // inside `rewriteSelectorList`, but that assertion compares the rewrite against ITSELF's source
  // — so a specificity function that returned a constant would satisfy every row of it. These
  // rows pin the function against selectors whose weights are stated in ADR-15 and #309.
  const SPECIFICITY = [
    [':host', [0, 1, 0], ':host is a pseudo-CLASS'],
    [':host([presentation="compact"]) .sk-app-shell__compact-navigation', [0, 3, 0], "#309's stated (0,3,0)"],
    [
      ':host(:is([presentation="compact"], [presentation="rail-preserving"])) .sk-app-shell__compact-navigation[hidden]',
      [0, 4, 0],
      "#309's stated (0,4,0) — the rule that must keep beating the one above",
    ],
    ['.sk-app-shell-host:is(.sk-app-shell-host--compact, .sk-app-shell-host--rail-preserving) .sk-app-shell__compact-navigation[hidden]', [0, 4, 0], 'and its rewrite, at the same weight'],
    [':where(.sk-x-host)', [0, 0, 0], ':where() is specificity-zero — the #375 candidate'],
    ['::slotted(.sk-x__item)', [0, 1, 1], 'a pseudo-ELEMENT plus its argument'],
    ['div', [0, 0, 1], 'the (0,0,1) a consumer override competes at'],
    ['*', [0, 0, 0], 'the universal selector contributes nothing'],
  ];
  for (const [selector, expected, note] of SPECIFICITY) {
    const got = specificityOf(selector);
    const ok = cmpSpec(got, expected) === 0;
    if (!ok) bad += 1;
    console.log(`${ok ? '✅' : '❌'} weight  ${specText(got)} ${selector}\n           ${note}`);
  }

  if (bad) {
    console.error(`\n❌ ${bad} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  // A FLOOR, the same shape check-adopted-css-boundaries.mjs carries. Every shape this rewrite
  // has to handle — ADR-15 names four `:host(...)` forms and #309 repeats them — must stay in
  // the table, or the table is regression protection in name only.
  const refusals = PROBES.filter(([, e]) => e === null).length;
  const FLOOR = { rewrites: 10, refusals: 4, weights: 8 };
  if (PROBES.length - refusals < FLOOR.rewrites || refusals < FLOOR.refusals || SPECIFICITY.length < FLOOR.weights) {
    console.error(
      `❌ Probe table shrank: ${PROBES.length - refusals} rewrite / ${refusals} refuse / ` +
        `${SPECIFICITY.length} weight, floor is ${FLOOR.rewrites} / ${FLOOR.refusals} / ${FLOOR.weights}.`,
    );
    process.exit(1);
  }
  console.log(
    `\n✅ All ${PROBES.length} rewrite probes and ${SPECIFICITY.length} specificity probes behaved as recorded.`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// The repository pass.
// ---------------------------------------------------------------------------

if (IS_ENTRY) {
const sources = staticFormSources();

// AN EMPTY SET IS A FAILURE. If the derivation stops finding sheets — a rename, a `container-type`
// moved, a glob that no longer matches — a green line over nothing is exactly the vacuous pass
// this repository has red-ed for twice. The four in scope today are named in ADR-15's "Which
// sheets this ruling reaches"; that table is prose and this is the derivation.
if (sources.length === 0) {
  console.error(
    `❌ No sheet under ${STYLES} declares \`container-type\` on \`:host\` — refusing to report green\n` +
      '   over an empty set. ADR-15 kinds 1 and 2 reach exactly the sheets that do; if the last one\n' +
      '   genuinely lost its host-owned container, delete this generator and its CI steps rather\n' +
      '   than leaving a gate that checks nothing.',
  );
  process.exit(1);
}

const drifted = [];
const orphans = [];
const expected = new Set(sources.map((s) => s.out));

for (const { file, component, out } of sources) {
  const next = staticFormOf(readFileSync(file, 'utf8'), component, file);
  if (check) {
    const current = existsSync(out) ? readFileSync(out, 'utf8') : null;
    if (current !== next) drifted.push(out);
    continue;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, next);
  console.log(`build-static-form-css: ${file} -> ${out}`);
}

// A generated static form whose source no longer declares a host container. Same reasoning
// build-elements-css.mjs records for its own orphan sweep: without it, a sheet that drops
// `container-type` leaves a committed static form behind forever, still linkable, with no source
// of record and nothing that notices.
for (const f of globSync(`${STYLES}/*/static/*.static.css`, {})) {
  if (!expected.has(f)) orphans.push(f);
}

if (check) {
  if (orphans.length) {
    console.error('❌ Generated static forms with no source of record:');
    for (const f of orphans) console.error(`   ${f}`);
    console.error("   Their sheet no longer declares `container-type` on `:host`. Delete them.");
    process.exit(1);
  }
  if (drifted.length) {
    console.error('❌ Generated static forms are stale — hand-edited, or the authored sheet changed:');
    for (const f of drifted) console.error(`   ${f}`);
    console.error('   Run: node scripts/build-static-form-css.mjs');
    process.exit(1);
  }
  console.log(`✅ Generated static forms are up to date (${sources.length} sheet(s)).`);
} else {
  for (const f of orphans) {
    rmSync(f);
    console.log(`build-static-form-css: removed orphan ${f}`);
  }
}
}
