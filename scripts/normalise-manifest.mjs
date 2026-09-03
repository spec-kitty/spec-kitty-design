#!/usr/bin/env node
/**
 * Make `custom-elements.json` byte-stable across analyzer runs.
 *
 * `ci-quality.yml` asserts the committed manifest is current with
 * `git diff --exit-code -- packages/elements/custom-elements.json`, and ADR-11 generates the
 * React wrapper FROM that manifest — so it has to be committed and it has to be checkable.
 *
 * But `cem analyze` does not emit a stable order. Measured: two consecutive runs on an
 * unchanged tree swapped `SkFormInput` and `SkFormTextarea`, producing a 219-line diff over
 * identical content. That makes the ENFORCED gate FLAKY — it fails at random, and each failure
 * looks like "someone forgot to regenerate".
 *
 * It has been latent since #70 and surfaced in #74, which is simply the first mission to add
 * two elements whose declarations sort adjacently. With one more component per batch in
 * #77–#79, it would have started firing constantly.
 *
 * So: sort what the analyzer leaves unordered — modules by path, declarations and exports by
 * name — and leave everything else exactly as emitted. Sorting is safe because every consumer
 * reads by name: check-manifest-content.mjs, check-part-ratchet.mjs, and the FR-009 arm in
 * config-contract.test.ts all look declarations up rather than indexing them.
 *
 * IT ALSO CORRECTS ONE THING THE ANALYZER GETS WRONG: Lit's `state: true`.
 *
 * `state: true` declares an INTERNAL reactive property — Lit observes no attribute for it.
 * The analyzer does not honour the flag, so it records the field in `attributes[]` anyway,
 * with nothing structurally distinguishing it from a real attribute (measured: `errorMessage`
 * and `value` on `sk-form-input` are byte-identical in shape; only `reflects` marks `invalid`).
 *
 * That is not a cosmetic inaccuracy. ADR-11 generates the React wrapper FROM this manifest,
 * and #75's wrapper defers element registration (`ssrSafe`), so React delivers first-render
 * props as ATTRIBUTES. A prop whose attribute does not exist is dropped silently — no error,
 * no warning. #126's pre-merge squad found the new "every prop has an attribute" gate reporting
 * GREEN over exactly that: `errorMessage` is `state: true`, the manifest claimed an attribute,
 * and the gate believed it.
 *
 * The fix belongs HERE rather than in any one gate, because the manifest is the shared input.
 * Fixing it once means every present and future generator inherits the truth instead of
 * re-deriving it — the canonical-source rule.
 *
 * The declaration is mapped back to its source file by TAG NAME (`sk-form-input` ->
 * `packages/elements/src/form-input/sk-form-input.ts`), because the manifest itself cannot say:
 * it carries a single module whose `path` is `./dist/index.js`, the bundled entry. The first
 * version of this correction read `mod.path`, hit ENOENT, and swallowed it in a try/catch —
 * a silent no-op that looked like a working fix. Hence the hard failure below when a tagged
 * declaration has no readable source: absence must not read as "no state fields".
 *
 * PARSED WITH THE TYPESCRIPT COMPILER, not matched as text. A regex over `static properties`
 * is defeated by a comment or a string containing `state: true`, which is this repo's most
 * frequently re-learned lesson (see check-elements-entries.mjs's probe table, and
 * check-element-css-hygiene.mjs moving to postcss-selector-parser). `typescript` is already a
 * dependency; there is no reason to guess.
 *
 * Usage: node scripts/normalise-manifest.mjs [path]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

/**
 * Field names declared `state: true` in a module's `static properties` initialiser.
 * Returns an empty set for a module with no such block, which is the common case.
 */
function stateFields(modulePath) {
  const found = new Set();
  // No try/catch: an unreadable source for a tagged declaration is a failure, not an empty set.
  const src = readFileSync(modulePath, 'utf8');
  const sf = ts.createSourceFile(modulePath, src, ts.ScriptTarget.ES2022, true);

  /** `{...} as const` / `{...} satisfies X` still wrap an object literal. Unwrap to it. */
  const unwrap = (node) => {
    let n = node;
    while (n && (ts.isAsExpression(n) || ts.isSatisfiesExpression(n) || ts.isParenthesizedExpression(n))) {
      n = n.expression;
    }
    return n;
  };

  /**
   * The object literal a `properties` member resolves to, for BOTH shapes the analyzer itself
   * handles — `static properties = {...}` and `static get properties() { return {...} }`.
   * Returns null when the member exists but does not resolve, which the caller treats as a
   * hard failure rather than as "no state fields".
   */
  const propertiesObject = (member) => {
    if (ts.isGetAccessorDeclaration(member)) {
      const ret = member.body?.statements?.find(ts.isReturnStatement);
      return ret?.expression ? unwrap(ret.expression) : null;
    }
    return member.initializer ? unwrap(member.initializer) : null;
  };

  let sawUnresolvable = null;
  const visit = (node) => {
    // (a) the `state: true` entry inside a static properties block
    const isStaticProps =
      (ts.isPropertyDeclaration(node) || ts.isGetAccessorDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword) &&
      node.name?.getText(sf) === 'properties';
    if (isStaticProps) {
      const obj = propertiesObject(node);
      if (!obj || !ts.isObjectLiteralExpression(obj)) {
        // A shape this walk cannot read must FAIL. Returning an empty set here is precisely how
        // the manifest came to claim an attribute for `errorMessage`: a silent miss reads
        // identically to "this element has no state fields".
        sawUnresolvable = `${modulePath}: \`static properties\` does not resolve to an object literal`;
      } else {
        for (const prop of obj.properties) {
          if (ts.isSpreadAssignment(prop)) {
            sawUnresolvable = `${modulePath}: \`static properties\` spreads another object`;
            continue;
          }
          if (!ts.isPropertyAssignment(prop)) continue;
          const value = unwrap(prop.initializer);
          if (!ts.isObjectLiteralExpression(value)) continue;
          const isState = value.properties.some(
            (opt) =>
              (ts.isPropertyAssignment(opt) &&
                opt.name.getText(sf) === 'state' &&
                opt.initializer.kind === ts.SyntaxKind.TrueKeyword) ||
              // shorthand `{ type: String, state }`
              (ts.isShorthandPropertyAssignment(opt) && opt.name.getText(sf) === 'state')
          );
          if (isState) found.add(prop.name.getText(sf).replace(/^['"]|['"]$/g, ''));
        }
      }
    }
    // (b) the `@state()` decorator form. cem's lit plugin only builds attributes from
    // `@property`, so this never produces a FALSE attribute today — collected anyway so the
    // two shapes cannot disagree if that ever changes.
    if (ts.isPropertyDeclaration(node)) {
      const decorated = ts.getDecorators?.(node) ?? [];
      for (const dec of decorated) {
        const expr = ts.isCallExpression(dec.expression) ? dec.expression.expression : dec.expression;
        if (expr.getText(sf) === 'state') found.add(node.name.getText(sf).replace(/^['"]|['"]$/g, ''));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (sawUnresolvable) {
    console.error(`❌ ${sawUnresolvable}.`);
    console.error(
      '   Refusing to normalise: this pass strips the attributes the analyzer wrongly records\n' +
        '   for Lit `state: true` fields, and a shape it cannot read would silently strip none.\n' +
        '   Extend stateFields() to handle it rather than letting it pass.'
    );
    process.exit(1);
  }
  return found;
}


const path = process.argv[2] ?? 'packages/elements/custom-elements.json';
const BASE_CLASS = 'packages/elements/src/form-control-base.ts';
const manifest = JSON.parse(readFileSync(path, 'utf8'));

const byName = (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''));

if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
  console.error(`❌ ${path} has no modules — refusing to normalise an empty manifest.`);
  process.exit(1);
}

// Correct `state: true` BEFORE sorting, so the two passes are independent.
let corrected = 0;
let tagged = 0;
for (const mod of manifest.modules) {
  for (const decl of mod.declarations ?? []) {
    if (!decl.tagName) continue;
    tagged++;
    const bare = decl.tagName.replace(/^sk-/, '');
    const source = `packages/elements/src/${bare}/${decl.tagName}.ts`;
    if (!existsSync(source)) {
      console.error(
        `❌ ${decl.tagName} declares a tag but ${source} does not exist, so its` +
          '  `state: true` fields cannot be read. Refusing to normalise: treating that as' +
          '  "no state fields" is how the manifest came to claim an attribute for' +
          '  errorMessage in the first place.'
      );
      process.exit(1);
    }
    // The element's own file AND the shared base. `form-control-base.ts` declares fields that
    // each element registers in its own `static properties`, so a `state: true` hoisted into the
    // base would otherwise be invisible here. Deeper chains are NOT followed — there is one base
    // class in this package, and a second would need this widened rather than assumed.
    const states = new Set([
      ...stateFields(source),
      ...(existsSync(BASE_CLASS) ? stateFields(BASE_CLASS) : []),
    ]);
    if (states.size === 0) continue;
    if (Array.isArray(decl.attributes)) {
      const before = decl.attributes.length;
      decl.attributes = decl.attributes.filter((a) => !states.has(a.fieldName ?? a.name));
      corrected += before - decl.attributes.length;
    }
    for (const mem of decl.members ?? []) {
      // The member STAYS — it is public API and reachable as a property after upgrade. Only the
      // false claim that an observed attribute exists for it is removed.
      if (states.has(mem.name)) delete mem.attribute;
    }
  }
}
if (tagged === 0) {
  console.error(`❌ ${path} declares no tagged element — refusing to normalise.`);
  process.exit(1);
}

manifest.modules.sort((a, b) => String(a.path ?? '').localeCompare(String(b.path ?? '')));
for (const mod of manifest.modules) {
  if (Array.isArray(mod.declarations)) mod.declarations.sort(byName);
  if (Array.isArray(mod.exports)) mod.exports.sort(byName);
  for (const decl of mod.declarations ?? []) {
    // Members, parts, slots and events are all name-keyed collections the analyzer emits in
    // source order. Sorting them removes the last source of churn when a class is reordered.
    for (const key of ['members', 'cssParts', 'cssProperties', 'slots', 'events', 'attributes']) {
      if (Array.isArray(decl[key])) decl[key].sort(byName);
    }
  }
}

writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`normalise-manifest: ${path} sorted (${manifest.modules.length} module(s), ${corrected} false attribute(s) removed)`);
