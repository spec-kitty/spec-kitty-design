#!/usr/bin/env node
/**
 * Build step: component `.css` -> a constructed-stylesheet module (ADR-10 §1).
 *
 * The CSS is authored ONCE, as a real `.css` file in `@spec-kitty/styles`
 * (ADR-8 constraint 1), and adopted by the element. It is never copied into
 * `packages/elements`, and never inlined into TypeScript — that is what keeps
 * stylelint/SK-D01 binding to it.
 *
 * WHY THE OUTPUT IS COMMITTED UNDER src/ RATHER THAN EMITTED TO dist/
 *
 * Two reasons, both measured rather than assumed:
 *
 *   1. `dist/` is gitignored (.gitignore:5-6), so emitting there leaves a fresh
 *      CI clone with no CSS and `storybook-build` fails.
 *   2. Vite's *default* CSS import cannot produce this — rollup rejects it with
 *      `"default" is not exported by ...css`. Vite CAN do it via `?inline`, and
 *      an earlier draft of this mission wrongly claimed a blanket impossibility.
 *      The real objection is narrower: `?inline` is Vite-specific syntax, and the
 *      same source must also feed the esbuild ESM/IIFE build, which does not
 *      understand it. Pre-generating keeps `packages/elements/src` free of any
 *      bundler-specific specifier.
 *
 * The generated file is committed and checked: `--check` exits non-zero if the
 * committed output has drifted from the source, per ADR-10's generated-artifact
 * contract.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, globSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const OUT_DIR = 'packages/elements/src';

/**
 * Components whose CSS the elements package adopts — DERIVED from the ELEMENTS that
 * exist, not from a hand-maintained array and not from the stylesheets.
 *
 * A hand-maintained array does not survive twelve batch missions, and could not
 * detect an ORPHAN: drop a component from the list and its generated `.css.js` stays
 * committed under src/ forever, still importable, with no source of record and
 * nothing that notices.
 *
 * Deriving from `packages/styles/*.css` instead would be worse in the other
 * direction: it generates a module for all fourteen stylesheets, thirteen of which
 * have no element yet (C-003 scopes migration OUT of this mission). The element is
 * the thing that adopts a sheet, so the element is the source of truth. Adding
 * `packages/elements/src/card/sk-card.ts` in #72 automatically requires
 * `packages/styles/src/card/sk-card.css` to exist, and fails loudly if it does not.
 */
const COMPONENTS = globSync(`${OUT_DIR}/**/sk-*.ts`, {})
  // ALLOW-list, not two suffix denials. `.stories.ts` and `.css.d.ts` were excluded
  // by name, which left `sk-card.spec.ts` yielding a component called "card.spec" and
  // a hard exit 1 — and the denials had to stay in sync with tsconfig.lib.json's own,
  // separate, exclude list. Only `sk-<name>.ts` is an element.
  .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
  .map((f) => {
    const name = basename(f).replace(/^sk-/, '').replace(/\.ts$/, '');
    const dir = basename(dirname(f));
    // The element's own DIRECTORY is where its generated module belongs. A first cut
    // discarded it and rebuilt the path from `name`, so `src/card/sk-tile.ts` wrote to
    // a phantom `src/tile/` that contained no element, while `src/card/`'s relative
    // import of `./sk-tile.css.js` failed to resolve. The orphan sweep could not catch
    // it either, because `expected` was built from the same wrong mapping.
    if (dir !== name) {
      console.error(
        `build-elements-css: ${f} sits in "${dir}/" but names component "${name}".\n` +
          `   The directory and the sk-<name> must agree — the generated module is a ` +
          `sibling import.`
      );
      process.exit(1);
    }
    // EVERY sk-*.css in the component's styles directory, not just sk-<name>.css.
    //
    // nav-pill ships two by design — sk-nav-pill.css (base pill layout) and
    // sk-nav-pill-drawer.css (hamburger + collapsible panel) — and the second file's own
    // header says "import this file IN ADDITION TO". A one-file mapping silently adopted
    // half the component: the element would render a hamburger with no styling and nothing
    // would report a thing.
    //
    // BASE FIRST, then the rest alphabetically. NOT a plain .sort(): '-' (0x2D) sorts before
    // '.' (0x2E), so `sk-nav-pill-drawer.css` would come out AHEAD of `sk-nav-pill.css` and
    // the cascade would land backwards — the drawer sheet's own header says "base pill layout
    // must be loaded first". A first draft of this line asserted the opposite in a comment and
    // was wrong; the ordering is now explicit rather than incidental.
    const base = `packages/styles/src/${name}/sk-${name}.css`;
    const css = globSync(`packages/styles/src/${name}/sk-*.css`, {}).sort((a, b) =>
      a === base ? -1 : b === base ? 1 : a.localeCompare(b)
    );
    return { name, dir: dirname(f), css };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const check = process.argv.includes('--check');

/**
 * A constructed stylesheet, not a `<style>` element. ADR-10 Confirmation #1
 * requires `adoptedStyleSheets.length === 1` AND zero `<style>` elements in the
 * shadow root — kitty-desktop's CSP depends on the second half.
 */
function moduleFor(cssText, sourcePaths) {
  // One `Source of record:` line per sheet. For a single source this is the exact header
  // this script emitted before multi-sheet support, which is what keeps sk-card.css.js
  // byte-identical — the property the --check on the committed module enforces.
  const provenance = sourcePaths.map((p) => `// Source of record: ${p}`).join('\n');
  return `// GENERATED by scripts/build-elements-css.mjs — DO NOT EDIT.
${provenance}
// Regenerate: node scripts/build-elements-css.mjs
const sheet = new CSSStyleSheet();
sheet.replaceSync(${JSON.stringify(cssText)});
export default sheet;
`;
}

/**
 * Declarations for the generated module.
 *
 * Without these `packages/elements` cannot be typechecked AT ALL: `sk-stub.ts` does
 * `import sheet from './sk-stub.css.js'`, tsconfig.base sets moduleResolution "node"
 * with no allowJs, and tsc fails on the CSS pipeline's own output. The package also
 * advertises `"types": "./dist/index.d.ts"`, which nothing was emitting. Found by the
 * pre-merge squad: this is the only TypeScript package in the repo with no type
 * checking, and it is the base layer for forty components.
 */
const TYPES = `// GENERATED by scripts/build-elements-css.mjs — DO NOT EDIT.
declare const sheet: CSSStyleSheet;
export default sheet;
`;

let drifted = [];
let orphans = [];
for (const { name, dir, css } of COMPONENTS) {
  // ZERO SHEETS IS A HARD EXIT, not an empty concatenation. An adopted stylesheet with no
  // rules is indistinguishable from a component that simply has no styling: no error, no
  // warning, and every visual assertion still passes because nothing asserts colour. The
  // one-file form exited here on a missing path and this must keep doing so.
  if (css.length === 0) {
    console.error(
      `build-elements-css: no sk-*.css under packages/styles/src/${name}/ — refusing to adopt an\n` +
        `   empty stylesheet for <sk-${name}>. The source of record lives in @spec-kitty/styles.`
    );
    process.exit(1);
  }
  // Joined with a newline, in the sorted order above: sk-<name>.css sorts before
  // sk-<name>-<ext>.css, which is also the cascade order the static consumers link them in
  // ("base pill layout must be loaded first").
  const cssText = css.map((f) => readFileSync(f, 'utf8')).join('\n');
  const outPath = join(dir, `sk-${name}.css.js`);
  const next = moduleFor(cssText, css);

  const typesPath = outPath.replace(/\.js$/, '.d.ts');
  if (check) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
    if (current !== next) drifted.push(outPath);
    // BOTH generated kinds. --check used to `continue` before the .d.ts was even
    // considered, so a drifted or deleted declaration was invisible here and only
    // surfaced as a typecheck failure elsewhere.
    const currentTypes = existsSync(typesPath) ? readFileSync(typesPath, 'utf8') : null;
    if (currentTypes !== TYPES) drifted.push(typesPath);
    continue;
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, next);
  writeFileSync(typesPath, TYPES);
  console.log(`build-elements-css: ${css.join(' + ')} -> ${outPath}`);
}

// A generated module with no source of record. See the COMPONENTS note above.
const expected = new Set(
  COMPONENTS.flatMap(({ name, dir }) => [
    join(dir, `sk-${name}.css.js`),
    join(dir, `sk-${name}.css.d.ts`),
  ])
);
for (const f of globSync(`${OUT_DIR}/**/*.css.{js,d.ts}`, {})) {
  if (!expected.has(f)) orphans.push(f);
}

if (check) {
  if (orphans.length) {
    console.error('❌ Generated CSS modules with no source of record:');
    for (const f of orphans) console.error(`   ${f}`);
    console.error('   Their component was removed from packages/styles. Delete them.');
    process.exit(1);
  }
  if (drifted.length) {
    console.error('❌ Generated CSS modules are stale:');
    for (const f of drifted) console.error(`   ${f}`);
    console.error('   Run: node scripts/build-elements-css.mjs');
    process.exit(1);
  }
  console.log(`✅ Generated CSS modules are up to date (${COMPONENTS.length} component(s)).`);
} else if (orphans.length) {
  for (const f of orphans) {
    rmSync(f);
    console.log(`build-elements-css: removed orphan ${f}`);
  }
}
