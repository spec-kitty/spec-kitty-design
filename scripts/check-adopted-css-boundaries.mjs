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
 * SCOPE — the sheets an ELEMENT adopts, derived the same way scripts/build-elements-css.mjs
 * derives them. Not "all of packages/styles": thirteen stylesheets have no element yet, they
 * are consumed as plain CSS in a document, and `:root` is entirely legitimate there. Scoping
 * this to `packages/elements` (ADR-9's literal words) would check nothing at all — ADR-8
 * constraint 1 means that directory holds no CSS.
 *
 * PARSED, NOT GREPPED. `body` is a substring of `.sk-card__body`, `:root` of `:rootish`, and
 * a regex over a whole stylesheet also matches inside comments and strings. postcss gives the
 * selector text of real rules; the token match then runs over a selector, not a file. This
 * repo has already paid twice for regexing a grammar.
 *
 * Usage: node scripts/check-adopted-css-boundaries.mjs
 */
import { readFileSync, globSync } from 'node:fs';
import { basename } from 'node:path';
import postcss from 'postcss';

const OUT_DIR = 'packages/elements/src';

// Derived from the ELEMENTS that exist — the same derivation, and the same reason, as the CSS
// pipeline: a hand-maintained list does not survive twelve batch missions.
const components = globSync(`${OUT_DIR}/**/sk-*.ts`, {})
  .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
  .map((f) => basename(f).replace(/^sk-/, '').replace(/\.ts$/, ''))
  .sort();

const componentOf = new Map();
const sheets = components.flatMap((name) => {
  const found = globSync(`packages/styles/src/${name}/sk-*.css`, {}).sort();
  for (const f of found) componentOf.set(f, name);
  return found;
});

if (sheets.length === 0) {
  console.error(
    '❌ Refusing to report green over an empty set: no adopted stylesheet found for any element.\n' +
      '   Either no element exists, or the derivation above has drifted from\n' +
      '   scripts/build-elements-css.mjs. Both are failures, neither is a pass.'
  );
  process.exit(1);
}

/**
 * A selector reaching outside the element's own root.
 *
 * `:host-context()` is included on ADR-9's evidence rather than on principle: Baseline
 * *limited*, Chromium-only, absent from Firefox and Safari. It is not a legal escape hatch
 * even though it is the one every search result suggests.
 */
const FORBIDDEN = [
  [/:root\b/, ':root — outside every shadow root; a descendant combinator cannot reach in'],
  [/:host-context\s*\(/, ':host-context() — Baseline limited, Chromium-only (ADR-9)'],
  // Bare TYPE selectors only. The boundaries keep `.sk-card__body` and `#html-panel` out.
  [/(^|[\s>+~,(])(html|body)($|[\s>+~,.:#[])/, 'a document-level type selector (html/body)'],
];

/**
 * THE GENERAL RULE, and the reason the enumeration above is not enough.
 *
 * ADR-9 names four tokens. Measured against #72's actual defect, they catch HALF of it:
 * `:root[data-theme="light"] .sk-card--blue` fires, and `.sk-light .sk-card--blue` — the
 * other selector that mission deleted, equally inert, and the one a `.sk-light` wrapper
 * documented in the tokens README makes tempting — does not. A class on an ancestor is not
 * in ADR-9's list and is exactly as unreachable across the boundary.
 *
 * ADR-9's Confirmation #4 states the rule the enumeration was illustrating: *no selector
 * referencing an ancestor outside its own root*. So: the LEFTMOST compound of every selector
 * must belong to the component — a `.sk-<name>…` class, or `:host`. Anything else is either
 * an ancestor the sheet cannot reach or a document-level type selector.
 *
 * Intra-component descendants are unaffected: `.sk-nav-pill__drawer .sk-nav-pill__item` has a
 * component class leftmost and passes.
 */
const leftmostCompound = (selector) =>
  selector.trim().split(/\s*[\s>+~]\s*/).filter(Boolean)[0] ?? '';

const ownsLeftmost = (compound, name) =>
  compound.startsWith(':host') ||
  // `::slotted()` reaches the element's own directly-assigned children — inward through the
  // composed tree, never outward to an ancestor. It is how an adopted sheet styles light-DOM
  // content at all: an ordinary `.sk-nav-pill__item` selector in a shadow sheet matches
  // nothing, which is why <sk-nav-pill>'s first a11y run reported colour-contrast failures on
  // links the static stylesheet styles perfectly well in a document.
  compound.startsWith('::slotted(') ||
  new RegExp(`(^|[.:\\[])sk-${name}(\\b|__|--)`).test(compound) ||
  compound === '*';

const violations = [];
let ruleCount = 0;

for (const file of sheets) {
  const name = componentOf.get(file);
  const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
  root.walkRules((rule) => {
    // `@keyframes` steps are `0%`/`from`/`to`, not selectors — `from` would otherwise never
    // match anything here, but walking them is meaningless and one day a token will collide.
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    ruleCount += 1;
    for (const raw of rule.selectors) {
      const line = rule.source?.start?.line ?? 0;
      let named = false;
      for (const [re, why] of FORBIDDEN) {
        if (re.test(raw)) {
          violations.push(`${file}:${line} — ${raw.trim()} — ${why}`);
          named = true;
        }
      }
      // Only when no enumerated token already named it, so one selector yields one message.
      if (!named && !ownsLeftmost(leftmostCompound(raw), name)) {
        violations.push(
          `${file}:${line} — ${raw.trim()} — the leftmost compound ` +
            `"${leftmostCompound(raw)}" is not part of sk-${name}, so it is an ancestor this ` +
            `sheet cannot reach once adopted`
        );
      }
    }
  });
}

if (ruleCount === 0) {
  console.error(
    `❌ Refusing to report green over ${sheets.length} stylesheet(s) containing zero rules.\n` +
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
  `✅ No cross-root selectors in ${sheets.length} adopted stylesheet(s), ${ruleCount} rule(s) ` +
    `across ${components.length} element(s).`
);
