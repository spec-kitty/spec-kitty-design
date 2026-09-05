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

describe('[SC-403] the cost that IS real, and it is build-time only', () => {
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
