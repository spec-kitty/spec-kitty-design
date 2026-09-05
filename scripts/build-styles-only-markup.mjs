#!/usr/bin/env node
/**
 * The styles barrel for components that have NO element (#141, ADR-10 §3).
 *
 * WHY THIS EXISTS. `build-element-markup.mjs` generates
 * `packages/styles/src/<c>/index.ts` from `packages/elements/src/<c>/sk-<c>.markup.ts` — one
 * authored source per component, drift-gated. A component with no element has no `.markup.ts`, so
 * its barrel was hand-written, and that made it a SECOND authored source alongside the `.html`
 * files beside it.
 *
 * `form-field` is the case, and the operator has recorded it as deliberately styles-only: the
 * element path for a labelled field is `sk-form-input` / `sk-form-textarea`, which render the whole
 * field themselves, so no `<sk-form-field>` element exists or should. #66's completion criterion
 * allows exactly this — "styles-only except by a recorded, deliberate decision" — and the decision
 * is recorded on #141 and in ADR-10.
 *
 * WHAT WENT WRONG WITHOUT IT. The hand-written barrel exported EIGHT HTML strings while the
 * directory held FIVE `.html` files. Three — `SkFormInputFocusHTML`, `SkFormInputDisabledHTML`,
 * `SkFormInputFilledHTML` — shipped to consumers backed by nothing on disk, so the `.html` files
 * were not the source of truth and nothing said so. The five that did have files happened to agree,
 * which is the reassuring half of a two-source arrangement and the reason it survives review.
 *
 * FAILS CLOSED, like its sibling: refuses an empty component set, refuses a component whose
 * directory contains no `.html`, and `--check` fails on drift.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STYLES = join(ROOT, 'packages/styles/src');
const ELEMENTS = join(ROOT, 'packages/elements/src');

/** Components with CSS but no element — derived, never listed. */
function stylesOnly() {
  const dirs = readdirSync(STYLES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    // A .css is what makes a directory a COMPONENT. The docstring said "components with CSS but
    // no element" and the code only checked the second half, so any future `__tests__` or `_shared`
    // directory would hard-fail this gate with a message reading like a component defect.
    .filter((n) => !existsSync(join(ELEMENTS, n)) && readdirSync(join(STYLES, n)).some((f) => f.endsWith('.css')))
    .sort();
  if (dirs.length === 0) {
    throw new Error(
      'no styles-only component found. If every component now has an element this script is ' +
        'obsolete — delete it and its CI step rather than leaving a gate that checks nothing.',
    );
  }
  return dirs;
}

/** `sk-form-input-error.html` -> `SkFormInputErrorHTML` */
const exportName = (file) =>
  basename(file, '.html')
    .split('-')
    .filter(Boolean) // a `--` or a leading/trailing dash yields an empty segment; `p[0]` then throws
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('') + 'HTML';

function render(name) {
  const dir = join(STYLES, name);
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.html')).sort();
  if (files.length === 0) throw new Error(`packages/styles/src/${name} has no .html to generate from`);

  // PARSE-SAFE NAMES, AND NO DUPLICATES — lifted from build-element-markup.mjs, which carries both
  // guards and a comment explaining why. This script's own docstring claimed "FAILS CLOSED, like
  // its sibling" while carrying neither, and a lens showed what that bought: `2col.html` emits
  // `export const 2colHTML`, which does not parse, and `--check` reports it CURRENT because a byte
  // comparison cannot tell valid TypeScript from invalid. The repo has already paid for this class
  // once — `SkGridCols-2HTML`, recorded at build-element-markup.mjs:73-78.
  const names = files.map(exportName);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length) {
    throw new Error(
      `packages/styles/src/${name}: two .html files produce the same export ${[...new Set(dupes)].join(', ')} — ` +
        `rename one, or the second silently shadows the first`,
    );
  }
  for (const n of names) {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(n)) {
      throw new Error(
        `packages/styles/src/${name}: "${n}" is not a valid identifier, so the generated barrel would ` +
          `not parse. Rename the source file.`,
      );
    }
  }

  const body = files
    .map((f) => {
      // LEADING comments are the published header; a comment AFTER markup begins is content.
      //
      // Scanned over the JOINED text, not line by line, and with a LAZY quantifier. Three lenses'
      // worth of near-misses live in this one regex:
      //   - filtering every `<!--` line ate `<!-- input or textarea goes here -->`, which is not a
      //     header but the wrapper's own instruction saying where the control goes
      //   - enumerating the known header texts missed a third one on the error variants
      //   - a per-line `^<!--[\s\S]*-->$` with a GREEDY quantifier spanned an interior `-->`, so
      //     `<!-- h --><div>REAL MARKUP</div><!-- t -->` dropped the markup silently
      //   - and a line-at-a-time loop could not see a multi-line `<!--\n … \n-->` header at all,
      //     emitting it as markup — the shape every CSS file in this repo already uses
      const raw = readFileSync(join(dir, f), 'utf8');
      const html = raw.replace(/^(?:\s*<!--[\s\S]*?-->)+\s*/, '').trim();
      if (!html) {
        throw new Error(`packages/styles/src/${name}/${f} has no markup after its header comments`);
      }

      return `export const ${exportName(f)} = ${JSON.stringify(html)};`;
    })
    .join('\n');

  return `// GENERATED by scripts/build-styles-only-markup.mjs — DO NOT EDIT.
// Authored source: packages/styles/src/${name}/*.html
// Regenerate: node scripts/build-styles-only-markup.mjs
//
// ${name} is deliberately styles-only — it has no custom element. See ADR-10 and #141.
${body}
`;
}

const check = process.argv.includes('--check');
let stale = 0;
for (const name of stylesOnly()) {
  const path = join(STYLES, name, 'index.ts');
  const body = render(name);
  if (check) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (current !== body) {
      console.error(`❌ packages/styles/src/${name}/index.ts is stale. Run: node scripts/build-styles-only-markup.mjs`);
      stale++;
    }
  } else {
    writeFileSync(path, body);
    console.log(`build-styles-only-markup: wrote packages/styles/src/${name}/index.ts`);
  }
}
if (stale) process.exit(1);
if (check) console.log(`✅ styles-only barrels are current (${stylesOnly().join(', ')}).`);
