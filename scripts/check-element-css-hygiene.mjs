#!/usr/bin/env node
/**
 * Two assertions over ADOPTED stylesheets, made over PARSED CSS rather than raw text.
 *
 *   1. No `is-focused`-style class that simulates a state the browser owns. The static sheets
 *      needed one to show focus in a screenshot; an element that can have real focus has no
 *      business shipping a simulation, and it tells the accessibility tree something untrue.
 *   2. No `var()` reference to a custom property that @spec-kitty/tokens does not define.
 *
 * SCOPE: the sheets an ELEMENT adopts. The two examples below both live in
 * `packages/styles/src/form-field/sk-form-field.css`, which has no element and is therefore
 * NEVER OPENED by this gate — it is published `@spec-kitty/styles@1.0.0` surface that #74
 * deliberately left untouched. A lens pointed out the docstring read as repository-wide.
 *      `min-height: var(--sk-space-30, 120px)` in the legacy form-field sheet is a hardcoded
 *      120px wearing a token's clothes — `--sk-space-30` exists nowhere, the scale runs 1..12,
 *      and `min-height` is not in stylelint's strict-value property list so nothing objected.
 *
 * PARSED, NOT GREPPED — and this one was found the hard way. The first version of these checks
 * was `grep -c is-focused`, run against a sheet whose header comment EXPLAINS why is-focused was
 * excluded. The grep returned 3 and the check "failed" over prose describing its own success.
 * That is this repo's `::part()`-mention-in-a-comment looseness, arriving as a false positive
 * instead of a false negative. postcss sees declarations and selectors; comments are not either.
 *
 * Usage: node scripts/check-element-css-hygiene.mjs
 */
import { readFileSync, globSync } from 'node:fs';
import { basename } from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

/**
 * States the BROWSER owns. A class or data-attribute spelling one of these is simulating
 * something the platform already exposes as a pseudo-class or a real attribute — and it lies to
 * the accessibility tree, because only the platform state reaches it.
 */
const STATES = [
  'focus', 'focused', 'hover', 'hovered', 'disabled', 'checked', 'readonly', 'indeterminate',
  'placeholder-shown',
];

// DELIBERATELY NOT IN THE LIST, each for a measured reason. A first draft included them and
// the gate immediately failed on this repo's own legitimate CSS:
//
//   active     `.sk-nav-pill__item--active` means the CURRENT page (aria-current), not
//              `:active`, which is mousedown. BEM uses `--active` for "current" constantly.
//   open       `:open` exists only for <details>/<dialog>. `.sk-nav-pill__drawer.is-open` is a
//              consumer-toggled class on a <div>, and there is no platform state to use instead.
//   selected, expanded, collapsed, pressed
//              same shape — ARIA concepts with no CSS pseudo-class for arbitrary elements.
//   invalid, valid, required
//              too close to legitimate styling vocabulary to flag on the name alone.
//
// The rule only fires where a pseudo-class genuinely exists and the author used a class instead.

/**
 * Attributes that ARE the platform surface rather than a simulation of it. `aria-*` reflects
 * state into the accessibility tree; the rest are real HTML attributes a native control inside
 * the shadow root genuinely carries — these elements set them with `?disabled=${…}`. Flagging
 * them was a false positive a lens caught.
 */
const PLATFORM_ATTRS = new Set([
  'disabled', 'required', 'checked', 'readonly', 'open', 'hidden', 'selected', 'multiple',
  'inert', 'contenteditable',
]);

/** A state token, bounded by a separator or the ends — so `interactive` does not match `active`
 *  and `sk-form-input__disabled` does. */
const spellsState = (name) =>
  STATES.some((st) => new RegExp(`(^|[-_])${st}($|[-_])`, 'i').test(name));

function simulatedStates(selector) {
  const found = [];
  let root;
  try {
    root = selectorParser().astSync(selector);
  } catch {
    return [`unparseable selector`];
  }
  root.walk((node) => {
    if (node.type === 'class' && spellsState(node.value)) {
      found.push(
        `the class ".${node.value}" spells a state the browser owns; use the pseudo-class`
      );
    }
    if (node.type === 'attribute') {
      const attr = String(node.attribute ?? '');
      if (attr.startsWith('aria-') || PLATFORM_ATTRS.has(attr)) return;
      // An attribute inside `:host(...)` is the ELEMENT'S OWN reflected state — the sanctioned
      // way for an adopted sheet to see ElementInternals-derived state from inside, and the
      // thing #72's inert-selector defect was repaired with. Never a simulation.
      for (let p = node.parent; p; p = p.parent) {
        if (p.type === 'pseudo' && String(p.value).startsWith(':host')) return;
      }
      const value = String(node.value ?? '');
      if (spellsState(attr) || spellsState(value)) {
        found.push(
          `the attribute "[${attr}${value ? `=${value}` : ''}]" spells a state the browser ` +
            `owns; use the pseudo-class`
        );
      }
    }
  });
  return found;
}

const OUT_DIR = 'packages/elements/src';

const elements = globSync(`${OUT_DIR}/**/sk-*.ts`, {})
  .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
  .map((f) => basename(f).replace(/^sk-/, '').replace(/\.ts$/, ''))
  .sort();

if (elements.length === 0) {
  console.error(`❌ Refusing to report green over an empty set: no elements under ${OUT_DIR}.`);
  process.exit(1);
}

/** Every custom property @spec-kitty/tokens defines. */
const tokenSource = readFileSync('packages/tokens/src/tokens.css', 'utf8');
const defined = new Set([...tokenSource.matchAll(/^\s*(--sk-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));
if (defined.size === 0) {
  console.error('❌ Parsed zero token definitions from packages/tokens/src/tokens.css.');
  process.exit(1);
}

const problems = [];
let sheetCount = 0;
let ruleCount = 0;

for (const name of elements) {
  const sheets = globSync(`packages/styles/src/${name}/sk-*.css`, {}).sort();
  if (sheets.length === 0) {
    problems.push(`<sk-${name}> has no adopted stylesheet — nothing was checked for it`);
    continue;
  }
  for (const file of sheets) {
    sheetCount += 1;
    const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
    root.walkRules((rule) => {
      ruleCount += 1;
      const line = rule.source?.start?.line ?? 0;
      // PARSED PER COMPOUND, not regexed over the whole selector string.
      //
      // The previous version stripped pseudo-classes with `:[a-z-]+(\([^)]*\))?` — which
      // removes a functional pseudo TOGETHER WITH ITS ARGUMENTS, so `:is(.is-disabled)`,
      // `:where(.is-focused)`, `:not(.is-hover)` and `:has(.is-disabled)` all disarmed the rule
      // entirely. It also could not cross `_`, so every `__`-separated BEM name — the
      // convention every sheet in this repo uses — escaped; and `interactive` matched because
      // it contains `active`. A lens measured all of it.
      //
      // postcss-selector-parser walks classes and attributes wherever they appear, including
      // inside functional pseudo arguments, and never sees a pseudo-class as text.
      for (const why of simulatedStates(rule.selector)) {
        problems.push(`${file}:${line} — ${rule.selector.trim()} — ${why}`);
      }
    });
    root.walkDecls((decl) => {
      const line = decl.source?.start?.line ?? 0;
      // EVERY `--sk-*` reference, not only those followed by a comma. The first version matched
      // `var(--sk-x, fallback)` alone, so `var(--sk-space-99)` with NO fallback passed — and
      // that is the worse defect the docstring describes, because the declaration silently
      // drops at computed-value time instead of quietly using a hardcoded number. Nested
      // `var(--a, var(--b))` was missed for the same reason.
      for (const m of decl.value.matchAll(/var\(\s*(--sk-[a-z0-9-]+)/g)) {
        if (!defined.has(m[1])) {
          problems.push(
            `${file}:${line} — ${decl.prop}: ${decl.value.trim()} — ${m[1]} is defined nowhere in ` +
              `@spec-kitty/tokens, so the fallback is the only live value: a hardcoded number ` +
              `wearing a token's clothes`
          );
        }
      }
    });
  }
}

if (ruleCount === 0) {
  console.error(`❌ Parsed ${sheetCount} stylesheet(s) and found zero rules.`);
  process.exit(1);
}

if (problems.length) {
  console.error('❌ Adopted stylesheet hygiene:');
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}

console.log(
  `✅ Adopted CSS hygiene: ${elements.length} element(s), ${sheetCount} sheet(s), ${ruleCount} ` +
    `rule(s) — no simulated states, no undefined-token fallbacks.`
);
