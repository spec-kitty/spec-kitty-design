#!/usr/bin/env node
/**
 * Vue template types, GENERATED from custom-elements.json (#81, ADR-8 confirmation #4).
 *
 * THE POINT OF THIS FILE IS ITS SIZE. #81 asks whether adding a framework target is additive and
 * cheap, and requires the answer be measured rather than asserted. The React target needed an
 * 843-line generator and a published package because React below 19 set every prop as an
 * attribute, so non-string values never reached the element. Vue 3 needs neither: measured in a
 * real render, properties, attributes and hyphenated custom events all work with no wrapper at
 * all (fixtures/vue-consumer). What is left is editor completion, and that is a `.d.ts`.
 *
 * NOT A PACKAGE, DELIBERATELY. #81 names "no package needed, the manifest sufficed" as a
 * legitimate and expected outcome and warns against manufacturing one to justify the exercise.
 * The output is a single declaration file shipped inside @spec-kitty/elements and referenced
 * opt-in, so a consumer who does not use Vue pays nothing and no `vue` dependency is added to a
 * package every other consumer installs.
 *
 * Same generated-artifact contract as the CSS, markup and React generators: output is committed,
 * `--check` fails CI on drift, and the emitted set is reconciled against the manifest so a
 * component cannot silently drop out.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = 'packages/elements/custom-elements.json';
const OUT = 'packages/elements/vue.d.ts';
const PROPERTY_ONLY_MARKER = 'x-spec-kitty-property-only';

function tags() {
  const m = JSON.parse(readFileSync(join(ROOT, MANIFEST), 'utf8'));
  const out = [];
  for (const mod of m.modules ?? []) {
    for (const d of mod.declarations ?? []) {
      if (!d.tagName) continue;
      const attributes = (d.attributes ?? []).map((a) => ({
        name: a.name,
        type: a.type?.text ?? 'string',
        description: (a.description ?? '').trim(),
      }));
      const attributeFields = new Set(
        (d.attributes ?? []).map((a) => a.fieldName).filter((name) => typeof name === 'string'),
      );
      const propertyOnly = (d.members ?? [])
        .filter((member) => member[PROPERTY_ONLY_MARKER] === true)
        .map((member) => {
          if (
            member.kind !== 'field' ||
            (member.privacy !== undefined && member.privacy !== 'public') ||
            member.attribute !== undefined ||
            typeof member.name !== 'string' ||
            !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(member.name)
          ) {
            throw new Error(
              `${d.tagName}: ${PROPERTY_ONLY_MARKER} must identify a public settable field with an emittable name`,
            );
          }
          if (typeof d.name !== 'string' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(d.name)) {
            throw new Error(`${d.tagName}: property-only fields require an emittable declaration name`);
          }
          if (attributeFields.has(member.name)) {
            throw new Error(`${d.tagName}.${member.name} is both property-only and an observed attribute`);
          }
          return {
            name: member.name,
            // Index the exported element class instead of re-parsing type.text. This preserves
            // structured and future generic types without manufacturing an import list, works in
            // this repo through tsconfig paths, and resolves through the package's own export for
            // published consumers.
            type: `import('@spec-kitty/elements').${d.name}[${JSON.stringify(member.name)}]`,
            description: (member.description ?? '').trim(),
          };
        });
      const props = [...attributes, ...propertyOnly];
      const duplicateProps = props
        .map((prop) => prop.name)
        .filter((name, index, names) => names.indexOf(name) !== index);
      if (duplicateProps.length) {
        throw new Error(
          `${d.tagName}: duplicate emitted prop name(s): ${[...new Set(duplicateProps)].join(', ')}`,
        );
      }
      out.push({
        tag: d.tagName,
        // FULL text, not `.split('\n')[0]`. Taking the first line truncated 23 of 45 attribute
        // descriptions and 9 of 14 class descriptions mid-sentence — and each one broke exactly
        // where the caveat began ("Ignored when `href` is set — a disabled link is not a thing
        // HTML"). build-react-wrappers.mjs reads the same manifest and emits the whole thing, so
        // this was a regression against an existing generator, not a house pattern. A lens
        // measured the counts.
        description: (d.description ?? '').trim(),
        props,
      });
    }
  }
  // FAIL CLOSED. An empty manifest would otherwise emit a valid, empty declaration file that
  // type-checks perfectly and gives a consumer completion on nothing.
  if (out.length === 0) throw new Error(`${MANIFEST} declares no tagName — refusing to emit an empty declaration`);

  // A DUPLICATE tagName emits a duplicate interface key, which `--check` happily calls up to date.
  const dupes = out.map((t) => t.tag).filter((t, i, a) => a.indexOf(t) !== i);
  if (dupes.length) throw new Error(`${MANIFEST} declares duplicate tagName(s): ${[...new Set(dupes)].join(', ')}`);

  for (const t of out) {
    for (const a of t.props) {
      if (!a.name || !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(a.name)) {
        throw new Error(`${t.tag}: prop name ${JSON.stringify(a.name)} is not emittable`);
      }
    }
  }
  // CODEPOINT ORDER, not localeCompare: ICU treats `-` as ignorable at primary strength, so a
  // future tag could sort differently between a workstation and a runner and red `--check` with
  // nothing wrong. A lens verified the then-current tag set across five locales — latent, and
  // cheap to close.
  return out.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
}

/** A JSDoc block that survives multi-line text, and cannot be closed early by its own content. */
const jsdoc = (text, indent) => {
  if (!text) return '';
  const safe = text.replace(/\*\//g, '*\\/');
  const lines = safe.split('\n');
  if (lines.length === 1) return `${indent}/** ${lines[0]} */\n`;
  return `${indent}/**\n${lines.map((l) => `${indent} * ${l}`.trimEnd()).join('\n')}\n${indent} */\n`;
};

const propLine = (a) => `${jsdoc(a.description, '      ')}      '${a.name}'?: ${a.type};`;

/**
 * DefineComponent, NOT a bare props object.
 *
 * A props object is neither callable nor constructable, so Volar cannot extract props from it and
 * falls through to an unchecked signature — the declaration file type-checks perfectly and gives a
 * template nothing. Every entry in Vue's own GlobalComponents is a component type for this reason.
 *
 * The first version shipped the bare object and the fixture could not see it: types.test-d.ts
 * indexes the INTERFACE, which is enforced either way. A lens compiled a real .vue with vue-tsc and
 * found a bad prop raising no error at all. Verified guard, wrong call site — the same shape this
 * repo keeps paying for, one altitude up.
 */
const render = (list) => `// GENERATED by scripts/build-vue-types.mjs — DO NOT EDIT BY HAND.
// Regenerate: npx nx run elements:analyze && node scripts/build-vue-types.mjs
//
// Vue template types for the Spec Kitty custom elements (#81).
//
// OPT-IN. Reference this file from your project so it is not loaded for consumers who do not use
// Vue — it augments the 'vue' module, and a package that always did so would force a \`vue\`
// dependency on every consumer:
//
//     /// <reference types="@spec-kitty/elements/vue" />
//
// You still need one line of build configuration for SFCs. Full integration guide:
// https://github.com/spec-kitty/spec-kitty-design/blob/main/docs/consuming-from-vue.md

import type { DefineComponent, HTMLAttributes, ReservedProps } from 'vue';

type SkElement<P> = DefineComponent<P & Partial<HTMLAttributes> & ReservedProps>;

declare module 'vue' {
  export interface GlobalComponents {
${list
  .map(
    (t) => `${jsdoc(t.description || t.tag, '    ')}    '${t.tag}': SkElement<{
${t.props.length ? t.props.map(propLine).join('\n') : '      // no declared props'}
    }>;`,
  )
  .join('\n')}
  }
}

export {};
`;

/**
 * THE GENERATOR COMPILES ITS OWN OUTPUT.
 *
 * Manifest text is interpolated straight into source — a description, and an attribute's
 * `type.text`. A lens put `'it's'` into a `type.text` and got `'q'?: 'it's';`, a file that does not
 * parse, with `--check` reporting ✅ over it; a description containing `*​/` closes the JSDoc block
 * early. I first tried to validate the input against a safe charset and got it wrong on the second
 * attempt — enumerating what may appear in a TypeScript type is the losing side of that problem.
 *
 * So the output is parsed instead. `ts.createSourceFile` runs the real TypeScript parser over the
 * rendered text before it is written or compared, which catches every injection shape without
 * anyone predicting them. It is a syntax check, not a type check — the semantic half is
 * `scripts/check-vue-template-types.mjs`, which compiles a real SFC against these declarations.
 *
 * `createSourceFile`, not `transpileModule`: a declaration file emits nothing, and transpiling one
 * fails with "Output generation failed" before any diagnostic is reported.
 */
async function assertParses(text) {
  const ts = (await import('typescript')).default;
  const sf = ts.createSourceFile('vue.d.ts', text, ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);
  // `parseDiagnostics` is INTERNAL — `typescript.d.ts` does not declare it. A `?? []` fallback here
  // would turn "TypeScript renamed or hid this" into "no syntax errors" and write the file anyway:
  // green over an empty set, in the guard that gates the write. A lens caught it. Fail closed on the
  // API instead, so an upgrade that moves it breaks loudly rather than silently disarming this.
  if (!Array.isArray(sf.parseDiagnostics)) {
    console.error('❌ typescript no longer exposes parseDiagnostics — the emitter would be unguarded.');
    console.error('   Switch to ts.createProgram + getSyntacticDiagnostics, which is public API.');
    process.exit(1);
  }
  const syntax = sf.parseDiagnostics;
  if (syntax.length) {
    console.error(`❌ the generated declaration does not parse — ${syntax.length} syntax error(s):`);
    for (const d of syntax.slice(0, 5)) {
      const { line } = sf.getLineAndCharacterOfPosition(d.start ?? 0);
      console.error(`   line ${line + 1}  TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`);
    }
    console.error('   This is manifest text reaching source unescaped. Fix the manifest or the emitter.');
    process.exit(1);
  }
  return sf;
}

/**
 * RECONCILED AGAINST THE PARSED AST, which is a different thing from the count this file used to
 * carry and rightly deleted.
 *
 * A parse check is not enough on its own. A lens put a BALANCED fragment in an attribute's
 * `type.text` — `string; }>;\n    'sk-injected': SkElement<{ 'p'?: string` — and the emitted file
 * parsed cleanly, declared a FIFTEENTH component that is in no manifest, silently dropped the
 * attribute it was attached to, and `--check` reported "14 elements".
 *
 * The old reconciliation counted a regex over the rendered text and could only ever agree with
 * itself. This reads the member names TypeScript actually parsed out of `GlobalComponents` and
 * compares that set with the manifest's tags — so anything the emitter produced that the manifest
 * did not ask for, or dropped that it did, is a mismatch.
 */
function assertMembersMatch(ts, sf, expected) {
  const found = [];
  const visit = (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'GlobalComponents') {
      for (const member of node.members) {
        const n = member.name;
        if (n && (ts.isStringLiteral(n) || ts.isIdentifier(n))) found.push(n.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  const want = [...expected].sort();
  const got = [...new Set(found)].sort();
  const extra = got.filter((t) => !want.includes(t));
  const missing = want.filter((t) => !got.includes(t));
  if (found.length !== got.length) {
    console.error(`❌ the generated declaration has duplicate GlobalComponents members`);
    process.exit(1);
  }
  if (extra.length || missing.length) {
    console.error('❌ the generated declaration does not match the manifest:');
    if (extra.length) console.error(`   declared but NOT in the manifest: ${extra.join(', ')}`);
    if (missing.length) console.error(`   in the manifest but NOT declared: ${missing.join(', ')}`);
    console.error('   Manifest text reached source as syntax. Fix the manifest or the emitter.');
    process.exit(1);
  }
}

/**
 * Reconcile every generated component's prop keys with the manifest-derived model.
 *
 * The tag-level audit above cannot see a generator that emits the component while silently
 * dropping its property-only inputs. Parse the actual type literal so a render regression,
 * balanced manifest injection, or duplicate prop cannot hide behind a byte-current file.
 */
function assertPropsMatch(ts, sf, expected) {
  const found = new Map();
  const problems = [];
  const memberName = (member) => {
    const name = member.name;
    return name && (ts.isStringLiteral(name) || ts.isIdentifier(name)) ? name.text : null;
  };

  const visit = (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'GlobalComponents') {
      for (const member of node.members) {
        const tag = memberName(member);
        if (!tag || !ts.isPropertySignature(member) || !member.type || !ts.isTypeReferenceNode(member.type)) {
          problems.push('GlobalComponents contains an unreadable component member');
          continue;
        }
        const props = member.type.typeArguments?.[0];
        if (!props || !ts.isTypeLiteralNode(props)) {
          problems.push(`${tag}: SkElement does not contain a readable prop type literal`);
          continue;
        }
        const names = props.members.map(memberName).filter((name) => name !== null);
        if (names.length !== props.members.length) {
          problems.push(`${tag}: generated prop set contains an unreadable member`);
        }
        if (new Set(names).size !== names.length) {
          problems.push(`${tag}: generated prop set contains duplicate keys`);
        }
        found.set(tag, names.sort());
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  for (const component of expected) {
    const want = component.props.map((prop) => prop.name).sort();
    const got = found.get(component.tag) ?? [];
    const extra = got.filter((name) => !want.includes(name));
    const missing = want.filter((name) => !got.includes(name));
    if (extra.length || missing.length) {
      problems.push(
        `${component.tag}: generated prop set differs from the manifest` +
          `${missing.length ? `; missing ${missing.join(', ')}` : ''}` +
          `${extra.length ? `; extra ${extra.join(', ')}` : ''}`,
      );
    }
  }

  if (problems.length) {
    console.error('❌ the generated declaration prop surface is inconsistent:');
    problems.forEach((problem) => console.error(`   ${problem}`));
    process.exit(1);
  }
}

const list = tags();
const body = render(list);
const ts = (await import('typescript')).default;
const parsed = await assertParses(body);
assertMembersMatch(ts, parsed, list.map((t) => t.tag));
assertPropsMatch(ts, parsed, list);
const check = process.argv.includes('--check');
const path = join(ROOT, OUT);

if (check) {
  if (!existsSync(path)) {
    console.error(`❌ ${OUT} is missing — run: node scripts/build-vue-types.mjs`);
    process.exit(1);
  }
  const current = readFileSync(path, 'utf8');
  if (current !== body) {
    console.error(`❌ ${OUT} is stale. Run: node scripts/build-vue-types.mjs`);
    process.exit(1);
  }
  // NO SEPARATE RECONCILIATION, deliberately, and the PR body originally advertised one. It could
  // not fire: the byte-compare above already exits unless `current === render(list)`, so a count
  // derived from `current` always equalled `list.length`. build-react-wrappers.mjs needs an orphan
  // sweep because it emits 31 files into a directory it does not clean; a single committed file
  // has no orphan to sweep. A lens caught the dead branch — presenting it as live coverage was the
  // defect, not its absence.
  console.log(`✅ ${OUT} is up to date (${list.length} elements).`);
} else {
  writeFileSync(path, body);
  console.log(`build-vue-types: wrote ${OUT} (${list.length} elements)`);
}
