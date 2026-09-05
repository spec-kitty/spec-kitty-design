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
 * IT ALSO CORRECTS TWO THINGS THE ANALYZER GETS WRONG. The first is Lit's `state: true`.
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

/** `{...} as const` / `{...} satisfies X` still wrap the expression we need to inspect. */
const unwrap = (node) => {
  let current = node;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression;
  }
  return current;
};

/** Static `properties = {}` and `static get properties() { return {}; }` share this path. */
const propertiesObject = (member) => {
  if (ts.isGetAccessorDeclaration(member)) {
    const returned = member.body?.statements?.find(ts.isReturnStatement);
    return returned?.expression ? unwrap(returned.expression) : null;
  }
  return member.initializer ? unwrap(member.initializer) : null;
};

const plainName = (name, sourceFile) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.getText(sourceFile).replace(/^['"]|['"]$/g, '');
  }
  return null;
};

const sourceLocation = (node, sourceFile) => {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${sourceFile.fileName}:${line + 1}:${character + 1}`;
};

const hasModifier = (node, kind) => node.modifiers?.some((modifier) => modifier.kind === kind);

const isPublicSettableField = (member) =>
  ts.isPropertyDeclaration(member) &&
  !ts.isPrivateIdentifier(member.name) &&
  !hasModifier(member, ts.SyntaxKind.PrivateKeyword) &&
  !hasModifier(member, ts.SyntaxKind.ProtectedKeyword) &&
  !hasModifier(member, ts.SyntaxKind.ReadonlyKeyword) &&
  !hasModifier(member, ts.SyntaxKind.StaticKeyword);

const isReadonlyArrayTypeNode = (type) => {
  if (!type) return false;
  if (ts.isTypeReferenceNode(type) && type.typeName.getText() === 'ReadonlyArray') return true;
  return (
    ts.isTypeOperatorNode(type) &&
    type.operator === ts.SyntaxKind.ReadonlyKeyword &&
    ts.isArrayTypeNode(type.type)
  );
};

const hasFrozenEmptyArrayInitializer = (member) => {
  const initializer = unwrap(member.initializer);
  if (!initializer || !ts.isCallExpression(initializer) || initializer.arguments.length !== 1) {
    return false;
  }
  if (initializer.expression.getText() !== 'Object.freeze') return false;
  const argument = unwrap(initializer.arguments[0]);
  return ts.isArrayLiteralExpression(argument) && argument.elements.length === 0;
};

const normalizedTypeIsReadonlyArray = (member) => {
  const text = String(member?.type?.text ?? '').trim();
  return /^ReadonlyArray\s*</.test(text) || /^readonly\s+.+\[\]$/.test(text);
};

/**
 * Field names declared `state: true` in a module's `static properties` initialiser.
 * Returns an empty set for a module with no such block, which is the common case.
 */
function stateFields(modulePath) {
  const found = new Set();
  // No try/catch: an unreadable source for a tagged declaration is a failure, not an empty set.
  const src = readFileSync(modulePath, 'utf8');
  const sf = ts.createSourceFile(modulePath, src, ts.ScriptTarget.ES2022, true);

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
          if (!plainName(prop.name, sf)) {
            sawUnresolvable = `${modulePath}: \`static properties\` contains a computed key`;
            continue;
          }
          const value = unwrap(prop.initializer);
          if (!ts.isObjectLiteralExpression(value)) continue;
          const isState = value.properties.some(
            (opt) =>
              (ts.isPropertyAssignment(opt) &&
                opt.name.getText(sf) === 'state' &&
                opt.initializer.kind === ts.SyntaxKind.TrueKeyword) ||
              // shorthand `{ type: String, state }`
              (ts.isShorthandPropertyAssignment(opt) && opt.name.getText(sf) === 'state'),
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
        const expr = ts.isCallExpression(dec.expression)
          ? dec.expression.expression
          : dec.expression;
        if (expr.getText(sf) === 'state')
          found.add(node.name.getText(sf).replace(/^['"]|['"]$/g, ''));
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
        '   Extend stateFields() to handle it rather than letting it pass.',
    );
    process.exit(1);
  }
  return found;
}

/**
 * Explicit public `attribute: false` fields proven from one tagged class's TypeScript source.
 * The returned reset flag is source-side proof only; normalized CEM type proof is checked where
 * the marker is applied, so neither representation can authorize a reset by itself.
 */
function propertyOnlyFields(modulePath, className) {
  const source = readFileSync(modulePath, 'utf8');
  const sourceFile = ts.createSourceFile(modulePath, source, ts.ScriptTarget.ES2022, true);
  const classDeclaration = sourceFile.statements.find(
    (statement) => ts.isClassDeclaration(statement) && statement.name?.text === className,
  );
  if (!classDeclaration) {
    throw new Error(
      `${modulePath}: cannot find class ${className} for property-only classification`,
    );
  }

  const publicFields = new Map();
  for (const member of classDeclaration.members) {
    if (!isPublicSettableField(member)) continue;
    const name = plainName(member.name, sourceFile);
    if (name) publicFields.set(name, member);
  }

  const explicit = new Set();
  const fail = (message) => {
    throw new Error(`${modulePath}: ${message}`);
  };
  const inspectLiteralOptions = (fieldName, value, origin) => {
    let attributeFalse = false;
    let stateTrue = false;
    for (const option of value.properties) {
      if (ts.isSpreadAssignment(option)) fail(`${origin} for ${fieldName} spreads options`);
      if (!ts.isPropertyAssignment(option) && !ts.isShorthandPropertyAssignment(option)) {
        fail(`${origin} for ${fieldName} contains an unsupported option`);
      }
      const optionName = plainName(option.name, sourceFile);
      if (!optionName) fail(`${origin} for ${fieldName} contains a computed option`);
      if (ts.isShorthandPropertyAssignment(option)) {
        if (optionName === 'attribute' || optionName === 'state') {
          const accepted =
            optionName === 'attribute' ? 'true, false, or a string' : 'true or false';
          fail(
            `${sourceLocation(option, sourceFile)}: ${origin} for ${fieldName} has an ` +
              `unresolved ${optionName} option; use a literal ${accepted}`,
          );
        }
        continue;
      }
      const optionValue = unwrap(option.initializer);
      if (optionName === 'attribute') {
        if (optionValue.kind === ts.SyntaxKind.FalseKeyword) {
          attributeFalse = true;
        } else if (
          optionValue.kind !== ts.SyntaxKind.TrueKeyword &&
          !ts.isStringLiteral(optionValue)
        ) {
          fail(
            `${sourceLocation(option.initializer, sourceFile)}: ${origin} for ${fieldName} has ` +
              'an unresolved attribute option; use a literal true, false, or a string',
          );
        }
      }
      if (optionName === 'state') {
        if (optionValue.kind === ts.SyntaxKind.TrueKeyword) {
          stateTrue = true;
        } else if (optionValue.kind !== ts.SyntaxKind.FalseKeyword) {
          fail(
            `${sourceLocation(option.initializer, sourceFile)}: ${origin} for ${fieldName} has ` +
              'an unresolved state option; use a literal true or false',
          );
        }
      }
    }
    return { attributeFalse, stateTrue };
  };
  const inspectOptions = (fieldName, options, origin) => {
    const value = unwrap(options);
    if (!ts.isObjectLiteralExpression(value)) {
      fail(`${origin} for ${fieldName} does not resolve to an object literal`);
    }
    const { attributeFalse, stateTrue } = inspectLiteralOptions(fieldName, value, origin);
    if (attributeFalse && !stateTrue) explicit.add(fieldName);
  };

  for (const member of classDeclaration.members) {
    const isStaticProperties =
      (ts.isPropertyDeclaration(member) || ts.isGetAccessorDeclaration(member)) &&
      hasModifier(member, ts.SyntaxKind.StaticKeyword) &&
      plainName(member.name, sourceFile) === 'properties';
    if (isStaticProperties) {
      const object = propertiesObject(member);
      if (!object || !ts.isObjectLiteralExpression(object)) {
        fail('`static properties` does not resolve to an object literal');
      }
      for (const property of object.properties) {
        if (ts.isSpreadAssignment(property)) fail('`static properties` spreads another object');
        if (!ts.isPropertyAssignment(property)) {
          fail('`static properties` contains an unsupported declaration');
        }
        const fieldName = plainName(property.name, sourceFile);
        if (!fieldName) fail('`static properties` contains a computed key');
        inspectOptions(fieldName, property.initializer, '`static properties`');
      }
    }

    if (!ts.isPropertyDeclaration(member)) continue;
    const propertyDecorators = (ts.getDecorators?.(member) ?? []).filter((decorator) => {
      if (!ts.isCallExpression(decorator.expression)) return false;
      const called = decorator.expression.expression.getText(sourceFile);
      return called === 'property' || called.endsWith('.property');
    });
    if (propertyDecorators.length === 0 || !isPublicSettableField(member)) continue;

    const fieldName = plainName(member.name, sourceFile);
    if (!fieldName) {
      for (const decorator of propertyDecorators) {
        if (decorator.expression.arguments.length !== 1) {
          fail(
            `${sourceLocation(member.name, sourceFile)}: computed @property declaration must ` +
              'carry one literal options object',
          );
        }
        const options = unwrap(decorator.expression.arguments[0]);
        if (!ts.isObjectLiteralExpression(options)) {
          fail(
            `${sourceLocation(member.name, sourceFile)}: computed @property options do not ` +
              'resolve to an object literal',
          );
        }
        const { attributeFalse, stateTrue } = inspectLiteralOptions(
          'computed field',
          options,
          '@property',
        );
        if (attributeFalse && !stateTrue) {
          fail(
            `${sourceLocation(member.name, sourceFile)}: @property({ attribute: false }) ` +
              'decorates a computed field name; use an identifier or string-literal name so ' +
              'the property-only public API can be classified',
          );
        }
      }
      continue;
    }
    for (const decorator of propertyDecorators) {
      if (decorator.expression.arguments.length !== 1) {
        fail(`@property for ${fieldName} must carry one literal options object`);
      }
      inspectOptions(fieldName, decorator.expression.arguments[0], '@property');
    }
  }

  const result = new Map();
  for (const name of explicit) {
    const field = publicFields.get(name);
    if (!field) continue;
    result.set(name, {
      resetToEmptyArray:
        isReadonlyArrayTypeNode(field.type) && hasFrozenEmptyArrayInitializer(field),
    });
  }
  return result;
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
let propertyOnly = 0;
let emptyArrayResets = 0;
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
          '  errorMessage in the first place.',
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

    let properties;
    try {
      properties = propertyOnlyFields(source, decl.name);
    } catch (error) {
      console.error(`❌ ${error.message}.`);
      console.error(
        '   Refusing to normalise: intentional property-only inputs must be proven from a\n' +
          '   literal TypeScript declaration. Extend the AST walk instead of publishing a guess.',
      );
      process.exit(1);
    }
    const memberByName = new Map((decl.members ?? []).map((member) => [member.name, member]));
    for (const [name, facts] of properties) {
      const member = memberByName.get(name);
      if (
        !member ||
        member.kind !== 'field' ||
        member.readonly ||
        member.static ||
        member.name.startsWith('#') ||
        member.privacy === 'protected' ||
        member.privacy === 'private'
      ) {
        continue;
      }
      member['x-spec-kitty-property-only'] = true;
      propertyOnly++;
      if (facts.resetToEmptyArray && normalizedTypeIsReadonlyArray(member)) {
        member['x-spec-kitty-property-reset'] = 'empty-array';
        emptyArrayResets++;
      }
      if (Array.isArray(decl.attributes)) {
        const before = decl.attributes.length;
        decl.attributes = decl.attributes.filter(
          (attribute) => (attribute.fieldName ?? attribute.name) !== name,
        );
        corrected += before - decl.attributes.length;
      }
      delete member.attribute;
    }
  }
}
if (tagged === 0) {
  console.error(`❌ ${path} declares no tagged element — refusing to normalise.`);
  process.exit(1);
}

// A SECOND ANALYZER CORRECTION: a field's JSDoc does not reach its attribute when the field is
// INHERITED.
//
// The analyzer copies a field's description onto its attribute only for fields declared on the
// element itself. For an inherited field it records the description on `members[]` and leaves
// `attributes[]` bare. ADR-11's generator reads `attributes[].description`, so the prose a
// maintainer wrote on the base class never reaches a React consumer — the wrapper emits the
// literal `/** undefined */` instead.
//
// Measured on the merged #126 head: of 22 attributes across the five elements, ZERO carried a
// description and exactly two (`invalid`, on both form elements) had a member description the
// attribute lacked. That was BEFORE the JSDoc existed, and quoting only it invites the wrong
// conclusion, so measured again at the commit that adds this pass: it now supplies 14 of the
// 22, every inherited field on both form elements. Delete this loop and fourteen
// `/** undefined */` blocks come back. It is not a two-case edge.
//
// It matters because of what the alternative would have been. Without this, documenting an
// inherited property means REDECLARING it in every subclass with duplicated prose, in three
// files with nothing keeping them in sync, growing with every element #77-#79 adds. #75 raised
// that as a fork; this removes the need to choose.
//
// CONSEQUENCE, stated because it is easy to miss: base-class JSDoc is now consumer-facing API
// documentation. C-005 applies to it — write for the consumer and keep maintainer rationale in
// `//`, exactly as the element files already do.
// RUNS AFTER the `state: true` strip, and the two are output-independent: stripping only
// removes attributes[] entries, propagation only fills descriptions on the ones that remain,
// so reversing them yields a byte-identical manifest. What DOES change is the reported count:
// propagate first and `errorMessage` is described, then stripped, and the number rises by two
// for a reason nobody could reconstruct later. Stated so the third correction has an ordering
// note to imitate.
let propagated = 0;
for (const mod of manifest.modules) {
  for (const decl of mod.declarations ?? []) {
    if (!decl.tagName) continue;
    // PUBLIC fields only. `internals`, `customError`, `errorId` and `initialValue` are
    // protected and carry maintainer rationale; an attribute whose `fieldName` collided with
    // one would publish that prose as consumer API, which is the exact class this pass's own
    // note warns about. Not reachable today (Lit builds no attribute from a protected field),
    // so this closes it by construction rather than by the absence of a path.
    const fieldByName = new Map(
      (decl.members ?? [])
        .filter((m) => m.kind === 'field' && m.privacy !== 'protected' && m.privacy !== 'private')
        .map((m) => [m.name, m]),
    );
    for (const attr of decl.attributes ?? []) {
      // Never overwrite. An attribute that already carries a description was written for the
      // attribute; the member's is a fallback, not an override.
      if (attr.description) continue;
      const field = fieldByName.get(attr.fieldName ?? attr.name);
      if (field?.description) {
        attr.description = field.description;
        propagated++;
      }
    }
  }
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
console.log(
  `normalise-manifest: ${path} sorted (${manifest.modules.length} module(s), ` +
    `${corrected} false attribute(s) removed, ${propagated} description(s) propagated, ` +
    `${propertyOnly} property-only field(s), ${emptyArrayResets} empty-array reset(s))`,
);
