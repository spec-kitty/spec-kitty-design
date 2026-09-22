/**
 * SC-403 — the build-time half of the Vue target's cost (#81).
 *
 * IN THE NODE LANE, DELIBERATELY, and it started in the browser lane. Compiling a template string
 * with `@vue/compiler-dom` needs no DOM, and putting it in the browser lane cost six hours of CI:
 * the assertion used a DYNAMIC import, which Vite's dependency scanner cannot see statically, so
 * the dependency was discovered mid-run. `vitest.config.mts` documents that exact failure for
 * React — "[vite] optimized dependencies changed. reloading", which killed two files — and under
 * webkit it did not merely fail, it HUNG. The behaviour-suite step ran to GitHub's 360-minute
 * default timeout and was cancelled with no diagnosis in the log.
 *
 * The lesson is narrower than "be careful with dynamic imports": a test that needs no browser has
 * no business in the browser lane, and the cost of getting that wrong is paid in a lane that
 * re-runs the whole suite once per mutation.
 */
import { describe, expect, it } from 'vitest';
import { compile } from '@vue/compiler-dom';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const memberName = (member: ts.TypeElement): string | null => {
  const name = member.name;
  return name && (ts.isStringLiteral(name) || ts.isIdentifier(name)) ? name.text : null;
};

const generatedVueProps = (): Map<string, string[]> => {
  const source = readFileSync('packages/elements/vue.d.ts', 'utf8');
  const file = ts.createSourceFile('vue.d.ts', source, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const result = new Map<string, string[]>();
  const visit = (node: ts.Node): void => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'GlobalComponents') {
      for (const component of node.members) {
        const tag = memberName(component);
        expect(tag, 'every generated component key is statically readable').not.toBe(null);
        expect(ts.isPropertySignature(component), `${tag} is a property signature`).toBe(true);
        if (!ts.isPropertySignature(component)) throw new Error(`${tag} is not a property signature`);
        expect(component.type && ts.isTypeReferenceNode(component.type)).toBe(true);
        const props = (component.type as ts.TypeReferenceNode).typeArguments?.[0];
        expect(props && ts.isTypeLiteralNode(props), `${tag} exposes a prop type literal`).toBe(true);
        result.set(
          tag!,
          (props as ts.TypeLiteralNode).members.map(memberName).filter((name): name is string => name !== null).sort(),
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return result;
};

const manifestVueProps = (): Map<string, string[]> => {
  const manifest = JSON.parse(readFileSync('packages/elements/custom-elements.json', 'utf8')) as {
    modules?: Array<{ declarations?: Array<{
      tagName?: string;
      attributes?: Array<{ name: string }>;
      members?: Array<{ name?: string; kind?: string; privacy?: string; 'x-spec-kitty-property-only'?: boolean }>;
    }> }>;
  };
  const result = new Map<string, string[]>();
  for (const module of manifest.modules ?? []) {
    for (const declaration of module.declarations ?? []) {
      if (!declaration.tagName) continue;
      const attributes = (declaration.attributes ?? []).map((attribute) => attribute.name);
      const propertyOnly = (declaration.members ?? [])
        .filter((member) => member['x-spec-kitty-property-only'] === true)
        .map((member) => member.name)
        .filter((name): name is string => typeof name === 'string');
      result.set(declaration.tagName, [...attributes, ...propertyOnly].sort());
    }
  }
  return result;
};

describe('[SC-403] the cost that IS real, and it is build-time only', () => {
  it('the generated Vue prop surface exactly includes manifest property-only fields', () => {
    const expected = manifestVueProps();
    const generated = generatedVueProps();
    expect(Object.fromEntries(generated), 'no component or public prop may disappear').toEqual(
      Object.fromEntries(expected),
    );
    expect(generated.get('sk-transition-matrix')).toEqual([
      'columns',
      'description',
      'routes',
      'selectable',
      'selected-route-id',
      'selection-hint',
      'window-label',
    ]);
  });

  /**
   * `@vitejs/plugin-vue` compiles an SFC at BUILD time, when no CustomElementRegistry exists — so
   * the runtime registry check that makes `isCustomElement` unnecessary for string templates
   * cannot help here, and the compiler emits a component resolution instead of an element.
   *
   * That one line of build config is the entire measured cost of adding this target. It is
   * asserted against the real compiler rather than described, because the distinction between the
   * two compile paths is exactly the kind that rots in prose.
   */
  it('emits resolveComponent without isCustomElement, and a direct element with it', () => {
    const tpl = '<sk-button>Click</sk-button>';
    const without = compile(tpl, { mode: 'module' }).code;
    const withCfg = compile(tpl, { mode: 'module', isCustomElement: (t: string) => t.startsWith('sk-') }).code;

    expect(without, 'unconfigured: Vue treats it as a component to resolve').toMatch(/resolveComponent/);
    expect(withCfg, 'configured: Vue creates the element directly').not.toMatch(/resolveComponent/);
    expect(withCfg, 'and takes the element block path').toMatch(/createElementBlock|createElementVNode/);
  });

  it('the two paths differ, so neither assertion above can pass vacuously', () => {
    const tpl = '<sk-button>Click</sk-button>';
    const without = compile(tpl, { mode: 'module' }).code;
    const withCfg = compile(tpl, { mode: 'module', isCustomElement: (t: string) => t.startsWith('sk-') }).code;
    expect(without, 'if these were identical the test above would prove nothing').not.toBe(withCfg);
  });
});
