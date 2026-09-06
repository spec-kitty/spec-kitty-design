#!/usr/bin/env node
/**
 * Generate the static markup artifacts from the element's authored source (ADR-10 §3).
 *
 * ADR-8's criterion 3 — "no component markup exists twice" — was unachievable as written,
 * because the architecture REQUIRES a static copy: Django, Jekyll and Hugo consumers render
 * without JavaScript, and dropping their HTML strands the majority of named consumers. The
 * ADR ratified the resolution: the element's template is the sole AUTHORED source, and the
 * static forms become generated output, exempt from the criterion and required to be
 * regenerable.
 *
 * So this reads `packages/elements/src/<c>/sk-<c>.markup.ts` and emits the static `.html`
 * and the template-literal catalogue. `--check` fails CI on drift, the same contract
 * build-elements-css.mjs uses.
 *
 * Usage: node scripts/build-element-markup.mjs [--check]
 */
import { readFileSync, writeFileSync, existsSync, globSync, statSync, mkdirSync } from 'node:fs';
import { basename, dirname, resolve, relative } from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const check = process.argv.includes('--check');

// A REAL MODULE URL, so a markup module can consume a value another module owns (#216).
//
// This file used to transform each `*.markup.ts` with esbuild and `import()` the result from a
// `data:` URL. A `data:` URL has no hierarchical base, so ANY import from a markup module — bare
// or relative — died there, and the generator said so in a named error. The constraint was real
// and correctly reported, and its consequence was the defect: a markup module could not import a
// shared VOCABULARY, so `sk-card` restated `sk-status-indicator`'s six tones and pinned the copy
// with an order-sensitive assertion that nothing forced the next component to write. The operator
// ruled on 2026-09-06: fix the generator, so no component ever restates the vocabulary again.
//
// Each module is now imported from `pathToFileURL(src)` — its own path — which gives every import
// inside it a base to resolve against. Two hooks make that work against the source tree as this
// repository actually authors it:
//
//   resolve — every relative import in this repo carries a `.js` extension over a `.ts` source
//             (NodeNext style, and required: `allowImportingTsExtensions` conflicts with the
//             emit `packages/elements` performs). Node does NOT map `.js` back to `.ts` — it
//             reports ERR_MODULE_NOT_FOUND for a file that type-checks perfectly. So a relative
//             `.js` specifier with nothing behind it and a `.ts` sibling is retargeted, and
//             NOTHING else is: a specifier that resolves normally never reaches this branch.
//
//   load    — esbuild stays the transformer. Node 22.18+ strips types natively and would also
//             work here, but it is erasable-syntax-only and gated on the runner's Node MINOR
//             (`node-version: '22'` resolves to whatever 22.x is current). esbuild is pinned in
//             package.json, is already what this file used, and the reasoning below about not
//             hand-stripping types is unchanged. Evaluating from a different URL is the change;
//             what understands the language is not.
//
// Both hooks are installed once, in this process, and both fall through to the default for
// anything they do not recognise. `registerHooks` is the synchronous in-thread API (Node 22.15+),
// so there is no worker thread and no loader package to add.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
      const asWritten = new URL(specifier, context.parentURL);
      if (!existsSync(fileURLToPath(asWritten))) {
        const source = new URL(`${specifier.slice(0, -'.js'.length)}.ts`, context.parentURL);
        if (existsSync(fileURLToPath(source))) {
          return { url: source.href, format: 'module', shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const file = relative(process.cwd(), fileURLToPath(url));
      try {
        // Transformed by esbuild, not by regex. Hand-stripping types is a regex over a grammar
        // and it broke on the first optional parameter — the same class of mistake this repo has
        // already paid for once. esbuild is pinned here and understands the language.
        //
        // `sourcefile` is NOT decoration. Without it esbuild names the input `<stdin>`, and the
        // hook's caller only knows which markup module it asked for — so a syntax error in an
        // IMPORTED leaf was reported against the markup module, with the leaf held up two lines
        // later as the model to copy. With it the message carries the real file, line and column.
        const { code } = esbuild.transformSync(readFileSync(fileURLToPath(url), 'utf8'), {
          loader: 'ts',
          format: 'esm',
          sourcefile: file,
        });
        return { format: 'module', source: code, shortCircuit: true };
      } catch (err) {
        // TAGGED, so the catch around the import can tell a SYNTAX error from an IMPORT error.
        // They need different messages: esbuild's is already precise and multi-line and must be
        // printed whole, while the leaf-import advice below is about module resolution and is
        // actively misleading over a stray semicolon.
        err.skTransformOf = file;
        throw err;
      }
    }
    return nextLoad(url, context);
  },
});

// THE LEAF PROPERTY IS ASSERTED, not trusted (#216, review round 1).
//
// The rule this generator now enforces at the import boundary is: a *.markup.ts may import a LEAF
// — a module with no imports of its own — and nothing else. Before this check the rule was a
// comment. A reviewer measured both halves of what that cost:
//
//   * `import { css } from 'lit'` added to status-tones.ts left `--check` GREEN, exit 0. Some
//     browser-facing modules happen to survive evaluation in Node, so "it blew up" is not a
//     mechanism.
//   * `import '../define.js'` added to the same file DID fail — with `customElements is not
//     defined` reported against sk-card.markup.ts, which is not the file that gained the import,
//     and on whichever unrelated PR touched a markup module next.
//
// So the property is checked BEFORE evaluation, on the file that actually holds the import.
// esbuild's metafile is what reads the import list, for the reason check-elements-entries.mjs
// records at length: a regex over source counts commented-out imports, legal comments and
// specifiers inside strings, and `external: ['*']` keeps the answer to this file's own list
// rather than a walk of the graph.
const importsOf = (file) => {
  let result;
  try {
    result = esbuild.buildSync({
      entryPoints: [file],
      bundle: true,
      write: false,
      metafile: true,
      format: 'esm',
      external: ['*'],
      packages: 'external',
      // SILENT, because this function OWNS the message. esbuild's default logging prints its own
      // formatted diagnostic and then the throw escapes as an uncaught `triggerUncaughtException`
      // stack — two renderings of one error, the second of them raw, in the file whose other
      // failures are all named.
      logLevel: 'silent',
    });
  } catch (err) {
    // esbuild's own text already carries file:line:column, which is the whole point of reading the
    // import list from the real parser. Printed WHOLE: the first line alone is
    // `Build failed with 1 error:` and says nothing.
    console.error(`❌ ${file} does not parse:`);
    console.error(String(err?.message ?? err).split('\n').map((l) => `   ${l}`).join('\n'));
    console.error('   The generator cannot read a module it cannot parse. Fix the syntax error above.');
    process.exit(1);
  }
  const inputs = Object.values(result.metafile.inputs);
  if (inputs.length !== 1) {
    // FAIL CLOSED on the API rather than on the assumption. `external: ['*']` makes the entry the
    // only input; if a future esbuild changes that, an empty import list would read as "this is a
    // leaf" and quietly disarm the whole check.
    console.error(`❌ ${file}: expected exactly one metafile input, got ${inputs.length}.`);
    console.error('   esbuild no longer keeps `external: [\'*\']` to a single input; this check is unguarded.');
    process.exit(1);
  }
  return (inputs[0].imports ?? []).map((i) => i.path);
};

/** Resolve a relative specifier the way the loader hook above does: `.js` over a `.ts` source. */
const resolveRelative = (fromFile, specifier) => {
  const direct = resolve(dirname(fromFile), specifier);
  if (existsSync(direct)) return relative(process.cwd(), direct);
  if (specifier.endsWith('.js')) {
    const source = `${direct.slice(0, -'.js'.length)}.ts`;
    if (existsSync(source)) return relative(process.cwd(), source);
  }
  return null;
};

const assertLeafImports = (src) => {
  for (const specifier of importsOf(src)) {
    if (!specifier.startsWith('.')) {
      console.error(`❌ ${src} imports \`${specifier}\` — a BARE specifier.`);
      console.error(
        `   The generator evaluates a *.markup.ts in a bare Node process, so a package import is\n` +
          `   one this generator has to be able to run headless. Import a relative LEAF module —\n` +
          `   one with no imports of its own, e.g. status-indicator/status-tones.ts — instead.`
      );
      process.exit(1);
    }
    const target = resolveRelative(src, specifier);
    if (target === null) {
      console.error(`❌ ${src} imports \`${specifier}\`, which resolves to no file on disk.`);
      console.error('   Check the path, and remember the repo writes `.js` over a `.ts` source.');
      process.exit(1);
    }
    const nested = importsOf(target);
    if (nested.length) {
      console.error(`❌ ${target} is imported by ${src}, and it is NOT a leaf.`);
      console.error(`   It imports: ${nested.join(', ')}`);
      console.error(
        `   A *.markup.ts is evaluated in a bare Node process, so anything it imports must have no\n` +
          `   imports of its own — one \`lit\` or \`./define.js\` two hops away either needs a browser\n` +
          `   or registers a custom element at module scope. Some browser-facing modules survive\n` +
          `   evaluation in Node by accident, which is why this is checked rather than left to fail.\n` +
          `   Move the shared value into a module that imports nothing.`
      );
      process.exit(1);
    }
  }
};

// Derived from the ELEMENTS that have an authored markup module — the same derivation the
// CSS pipeline uses, and for the same reason: a hand-maintained list does not survive
// twelve batch missions and cannot detect an orphan.
const sources = globSync('packages/elements/src/*/sk-*.markup.ts', {}).filter((f) => statSync(f).isFile());

if (sources.length === 0) {
  console.error('❌ no *.markup.ts found under packages/elements/src — refusing to report green over nothing.');
  process.exit(1);
}

const MARK = '<!-- GENERATED by scripts/build-element-markup.mjs — DO NOT EDIT. -->';
let drifted = [];

for (const src of sources) {
  const name = basename(src).replace(/^sk-/, '').replace(/\.markup\.ts$/, '');
  // STILL NAMED, and the constraint it names is now the true one. The old message said a
  // *.markup.ts "must be a leaf module with no relative imports", which was accurate about the
  // data: URL it no longer runs from. What remains is narrower and worth stating exactly,
  // because it is what a reader will hit: this runs in a bare Node process, so a markup module
  // may import a LEAF — a module with no imports of its own, like
  // status-indicator/status-tones.ts — and may not reach a module that needs a browser. Every
  // element file does: they import `lit`, and `define.js` patches `customElements.define` at
  // module scope, which throws before any export is read.
  //
  // Without this the failure is a raw ERR_MODULE_NOT_FOUND or a `customElements is not defined`
  // stack on someone else's PR — the unnamed-failure class the errors below exist to close.
  assertLeafImports(src);

  let mod;
  try {
    mod = await import(pathToFileURL(resolve(src)).href);
  } catch (err) {
    // TWO FAILURES, TWO MESSAGES. They used to share one, and the shared one truncated at the
    // first line and appended import advice — so a stray semicolon in an imported leaf printed
    // `Transform failed with 1 error:` with the line and column GONE, blamed on the markup module
    // rather than the leaf, and then recommended the leaf as the pattern to follow. The base
    // generator's raw esbuild throw was more useful than that, which makes it a regression rather
    // than a trade.
    if (err?.skTransformOf) {
      console.error(`❌ ${err.skTransformOf} does not parse:`);
      console.error(String(err.message ?? err).split('\n').map((l) => `   ${l}`).join('\n'));
      console.error(`   (Reached while the generator was evaluating ${src}.)`);
      process.exit(1);
    }
    console.error(`❌ ${src} could not be loaded by the generator:`);
    console.error(`   ${String(err?.message ?? err).split('\n')[0]}`);
    console.error(
      `   The generator evaluates a *.markup.ts in a bare Node process. It may import a LEAF\n` +
        `   module — one with no imports of its own, e.g. status-indicator/status-tones.ts — and\n` +
        `   it may NOT import anything that needs a browser: every sk-*.ts element reaches \`lit\`\n` +
        `   and registers a custom element at module scope. Point the import at a leaf, or move\n` +
        `   the shared part into one.`
    );
    process.exit(1);
  }

  // Resolved by CONVENTION, with a named error. The loop iterates every component but used
  // to call `mod.cardStaticHtml` by name, so the first non-card *.markup.ts would have died
  // with `TypeError: mod.cardStaticHtml is not a function` and a raw stack — on someone
  // else's PR. #73 lands sk-nav-pill.
  // Two name transforms, derived once from the component directory and used everywhere
  // below. Deriving them once is the point: pass 2 found `${name.toUpperCase()}_VARIANTS`
  // computed inline, which yields `NAV-PILL_VARIANTS` — a hyphen, never a valid export
  // name — for the very component the comment below says lands next.
  const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const screaming = name.replace(/-/g, '_').toUpperCase();
  // `[a-z0-9]`, NOT `[a-z]`. With the letter-only class, a variant key whose segment starts
  // with a DIGIT does not match, the hyphen is never consumed, and the emitted line is
  // `export const SkGridCols-2HTML = ...` — a hyphen in an identifier, which is a TypeScript
  // syntax error. It was written to a committed file and `--check` then reported "up to date",
  // because --check compares bytes and cannot parse what it emits. #77's `cols-2`/`cols-3`/
  // `cols-4` are the first variant keys in the repo with a digit segment.
  const pascal = (x) => x.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
  const comp = pascal(name);

  const staticHtml = mod[`${camel}StaticHtml`];
  if (typeof staticHtml !== 'function') {
    console.error(
      `❌ ${src} does not export ${camel}StaticHtml().\n` +
        `   Every *.markup.ts must export <component>StaticHtml(opts, content) — that is the\n` +
        `   contract this generator drives, and the element renders from the same module.`
    );
    process.exit(1);
  }

  // ABSENCE IS AN ERROR, not an empty map. `?? {}` cannot distinguish "this component has
  // no variants" from "I looked for the wrong export name and found nothing" — and the
  // second is what happened: the lookup fell through a `?? mod.CARD_VARIANTS` cross-module
  // fallback to `{}`, dropped every variant export, and reported --check GREEN. A component
  // with genuinely no variants exports an empty object explicitly.
  const variantMap = mod[`${screaming}_VARIANTS`];
  if (variantMap === null || typeof variantMap !== 'object') {
    console.error(
      `❌ ${src} does not export ${screaming}_VARIANTS.\n` +
        `   Every *.markup.ts must export <COMPONENT>_VARIANTS as a variant→class map — the\n` +
        `   generator derives one export per key from it. A component with no variants\n` +
        `   exports an empty object; omitting it would silently emit no variant exports.`
    );
    process.exit(1);
  }

  // THE AXES ARE THE MODULE'S, NOT THE GENERATOR'S.
  //
  // This file used to emit `Sk${comp}InsetHTML` unconditionally, and fix the authored contract
  // at `staticHtml(variant, inset, content)`. `inset` is a CARD axis: it swaps the surface token
  // for the input surface, and nothing about nav-pill, grid, site-footer, button or pill-tag has
  // one. For any of those the generator would have committed
  // `class="sk-grid sk-grid--inset"` — a class in no stylesheet — as generated output, exit 0.
  //
  // That is the same defect the variant table already cost this repo once: a hardcoded list one
  // line below the one that was removed. #72 and #73 both declined a *.markup.ts because of it.
  // The generator now derives base + one per variant, and the module names everything else.
  const axes = mod[`${screaming}_AXES`];
  if (axes === null || typeof axes !== 'object') {
    console.error(
      `❌ ${src} does not export ${screaming}_AXES.\n` +
        `   Every *.markup.ts must export <COMPONENT>_AXES as a map of export-name-suffix to the\n` +
        `   options that produce it — e.g. { Inset: { inset: true } }. A component whose only\n` +
        `   static forms are the base and its variants exports an empty object; omitting it\n` +
        `   cannot be distinguished from "I looked for the wrong export name".`
    );
    process.exit(1);
  }

  const htmlPath = `packages/styles/src/${name}/sk-${name}.html`;
  const indexPath = `packages/styles/src/${name}/index.ts`;

  // THE PLACEHOLDER IS THE MODULE'S, like the variants and the axes above.
  //
  // This call used to pass `'\n  Card content\n'` — a hardcoded second argument, in the loop
  // that runs for EVERY component, one line below three guards that exist because a
  // card-shaped constant leaked into the derived path. It did two wrong things at once: it
  // put the noun "Card" into `sk-grid.html` and `sk-site-footer.html`, and it padded the
  // `.html` while `index.ts` (which calls `staticHtml(opts)`) went unpadded, so the two
  // generated artifacts of the same component disagreed about their own content.
  //
  // Both outputs now take the module's default parameter, which is the single place the
  // placeholder is written. `sk-card.html` loses its indentation in this commit as a result;
  // it is generated output and regenerates.
  // NAMED, like every other failure in this file. Static helpers THROW on bad input by design
  // (#78 added the first one that can throw on a missing `alt`), and both call sites sat outside
  // any try/catch — so a bad axis would die with a raw Error whose stack frames point into a
  // `data:text/javascript,…` URL: no filename, no component, no axis. That is the same
  // unnamed-failure class the two errors above exist to close, and a lens spotted it before it
  // could land on someone else's PR.
  const call = (opts, what) => {
    try {
      return staticHtml(opts);
    } catch (err) {
      throw new Error(
        `${src}: ${what} threw while generating.\n   ${err instanceof Error ? err.message : String(err)}\n\n` +
          `The component's own static helper refused these options. Fix the options (usually a ` +
          `<COMPONENT>_AXES entry), or the helper's contract.`,
        { cause: err },
      );
    }
  };

  const html = `${MARK}
<!-- Authored source: ${src} — regenerate with: node scripts/build-element-markup.mjs -->
<!-- Requires @spec-kitty/tokens to be loaded -->
${call({}, 'the base form')}
`;

  // DERIVED from the module's own <COMPONENT>_VARIANTS, not a hardcoded table.
  //
  // The table was the hand-maintained list #71 removed from the CSS pipeline, reintroduced
  // one file over — and worse than passing on absence: a lens added a variant and got NO
  // export with a green --check, then removed one and got `SkCardPurpleHTML` emitted with no
  // purple class, also green. The gate certified actively wrong output.
  const forms = [
    [`Sk${comp}HTML`, {}],
    ...Object.keys(variantMap).map((v) => [`Sk${comp}${pascal(v)}HTML`, { variant: v }]),
    ...Object.entries(axes).map(([suffix, opts]) => [`Sk${comp}${suffix}HTML`, opts]),
  ];
  const index = `// GENERATED by scripts/build-element-markup.mjs — DO NOT EDIT.
// Authored source: ${src}
// Regenerate: node scripts/build-element-markup.mjs
${forms.map(([n, opts]) => `export const ${n} = ${JSON.stringify(call(opts, n))};`).join('\n')}
`;

  // PARSE WHAT WE EMIT. The hyphen defect above reached a committed file and survived
  // `--check` green, because --check is a byte comparison and byte comparison cannot tell
  // valid TypeScript from invalid. Every emitted export name is checked against the
  // identifier grammar before the file is written, in BOTH modes — a generator that cannot
  // produce a loadable module has failed whether or not the bytes match what is on disk.
  // COLLISION, not just shape. A _VARIANTS key and an _AXES suffix that PascalCase to the same
  // string emit two `export const SkXFooHTML` lines: both are valid identifiers, both pass the
  // regex below, the file is written, and `--check` reports byte-identical green while the
  // module does not compile. That is the same "a generator that cannot produce a loadable
  // module has failed" standard the shape check is held to, and it is not hypothetical — this
  // repo already ships a `SkRibbonCardWithRibbonHTML`, so a `with-ribbon` variant beside a
  // `WithRibbon` axis is one edit away. #77's derived GRID_AXES makes the two tables adjacent.
  const names = forms.map(([n]) => n);
  const duplicates = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
  if (duplicates.length) {
    console.error(
      `❌ ${src} would emit the same export name twice: ${duplicates.join(', ')}.\n` +
        `   A ${screaming}_VARIANTS key and a ${screaming}_AXES suffix have collided after the\n` +
        `   PascalCase transform. Both names are valid identifiers, so the module would be\n` +
        `   written and --check would report it up to date, but it would not compile.`
    );
    process.exit(1);
  }

  for (const [exportName] of forms) {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(exportName)) {
      console.error(
        `❌ ${src} would emit \`export const ${exportName}\` — not a valid identifier.\n` +
          `   The name is derived from a ${screaming}_VARIANTS key or a ${screaming}_AXES\n` +
          `   suffix; one of them contains a character that survives the PascalCase transform.`
      );
      process.exit(1);
    }
  }

  for (const [path, next] of [[htmlPath, html], [indexPath, index]]) {
    if (check) {
      const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
      if (current !== next) drifted.push(path);
    } else {
      // A new component reaches this line before `packages/styles/src/<name>/` exists, and
      // writeFileSync then throws a raw ENOENT stack naming node:fs — the unnamed-failure
      // class this file's other errors exist to close. The styles directory is a derived
      // location, so deriving it is correct.
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, next);
      console.log(`build-element-markup: ${src} -> ${path}`);
    }
  }
}

if (check) {
  if (drifted.length) {
    console.error('❌ Generated markup is stale — it was hand-edited, or the authored source changed:');
    for (const f of drifted) console.error(`   ${f}`);
    console.error('   Run: node scripts/build-element-markup.mjs');
    process.exit(1);
  }
  console.log(`✅ Generated markup is up to date (${sources.length} component(s)).`);
}
