/**
 * ADR-8 confirmation criterion #4, measured (#81).
 *
 * The claim the elements-first programme rests on is that adding a framework target is ADDITIVE
 * AND CHEAP. #81 requires that be measured rather than asserted, with the target chosen and
 * written down BEFORE the work so the result is not shaped by what turned out easy. Vue 3 was
 * declared on the issue at 2026-09-04T22:53:20Z, deliberately as the harder of the two candidates:
 * Solid compiles element creation directly and would have flattered the result.
 *
 * WHAT THIS FILE IS FOR. It answers one question empirically — what does a Vue consumer actually
 * need? — in a real Vue render against the real bundle. Reading Vue's docs would produce an
 * assertion; #75's own fixture makes the point for React: "an ergonomics claim has to be exercised
 * rather than asserted."
 *
 * THE BARE `@spec-kitty/elements` SPECIFIER, like every other browser test. The subpath
 * `@spec-kitty/elements/elements.js` resolves through package `exports` to `dist/elements.js`,
 * which DOES NOT EXIST in the `test` job — that job never builds, and `dist/` is gitignored.
 * vitest.config.mts carries an alias mapping the bare specifier to `src/index.ts` for exactly this
 * reason, and its comment records that the same mistake cost #70 two CI failures. The alias does
 * not cover subpaths. My local run was green only because I had built; a local green with `dist/`
 * present proves nothing about this lane.
 *
 * The full `vue/dist/vue.esm-bundler.js` build is imported deliberately, not the runtime-only
 * default: `app.config.compilerOptions.isCustomElement` is a RUNTIME-COMPILER option, so a
 * runtime-only build would silently ignore the very configuration this file exists to measure,
 * and every assertion about it would pass for the wrong reason.
 */
import { describe, expect, it } from 'vitest';
import { createApp, h, ref } from 'vue/dist/vue.esm-bundler.js';
import '@spec-kitty/elements';

/** Mount a Vue app on a detached host and return it, with a disposer. */
function mount(options: Record<string, unknown>, configure?: (app: any) => void) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = createApp(options);
  configure?.(app);
  const vm = app.mount(host);
  return { host, app, vm, destroy: () => { app.unmount(); host.remove(); } };
}

describe('[SC-401] a Vue consumer needs no wrapper package for the elements to work', () => {
  it('renders and upgrades a custom element from a Vue template', async () => {
    const { host, destroy } = mount(
      { template: `<sk-button>Click</sk-button>` },
      (app) => { app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith('sk-'); },
    );
    await customElements.whenDefined('sk-button');
    const el = host.querySelector('sk-button');
    expect(el, 'the element is in the DOM').toBeTruthy();
    expect(el!.shadowRoot, 'the element upgraded — Vue did not swallow it').toBeTruthy();
    // DELIBERATELY NOT asserting adoptedStyleSheets here. It was, and the mutation harness caught
    // the consequence: a mutation targeting SC-014 ("button adopts its generated sheet") also
    // failed this test, so the harness reported collateral and could no longer attribute the red.
    // The elements' styling contract is SC-014's, tested exhaustively in the behaviour suite; this
    // file's subject is what VUE does with the element, and asserting someone else's contract here
    // buys no coverage and costs attribution.
    destroy();
  });

  it('passes a STRING through as an attribute, and Vue does not mangle it', async () => {
    const { host, destroy } = mount(
      { template: `<sk-pill-tag variant="green">Ready</sk-pill-tag>` },
      (app) => { app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith('sk-'); },
    );
    await customElements.whenDefined('sk-pill-tag');
    const el = host.querySelector('sk-pill-tag')!;
    expect(el.getAttribute('variant')).toBe('green');
    destroy();
  });

  /**
   * THE ONE THAT MATTERS. React needed generated wrappers because pre-19 React set everything as
   * an attribute, so a non-string prop never reached the element. Vue 3's `.prop` modifier and its
   * DOM-property heuristic are what would make a wrapper unnecessary here — so this asserts the
   * PROPERTY route, which is the capability a wrapper would otherwise have to provide.
   */
  it('binds a reactive value to a DOM PROPERTY, which is what a wrapper would exist to do', async () => {
    const legal = ref('© 2026 First');
    const { host, destroy } = mount(
      {
        setup: () => ({ legal }),
        template: `<sk-site-footer :legal.prop="legal"></sk-site-footer>`,
      },
      (app) => { app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith('sk-'); },
    );
    await customElements.whenDefined('sk-site-footer');
    const el = host.querySelector('sk-site-footer')! as HTMLElement & { legal?: string };
    expect(el.legal, 'the property, not the attribute, carries the value').toBe('© 2026 First');

    legal.value = '© 2026 Second';
    await new Promise((r) => setTimeout(r, 0));
    expect(el.legal, 'and it stays reactive across updates').toBe('© 2026 Second');
    destroy();
  });

  it('receives a custom event dispatched by the element', async () => {
    const seen: string[] = [];
    const { host, destroy } = mount(
      {
        setup: () => ({ onPing: (e: Event) => seen.push(e.type) }),
        template: `<sk-button @sk-ping="onPing">Go</sk-button>`,
      },
      (app) => { app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith('sk-'); },
    );
    await customElements.whenDefined('sk-button');
    const el = host.querySelector('sk-button')!;
    el.dispatchEvent(new CustomEvent('sk-ping', { bubbles: true, composed: true }));
    expect(seen, 'Vue attached a listener for a hyphenated custom event').toEqual(['sk-ping']);
    destroy();
  });
});

describe('[SC-402] the measured cost — and it is NOT the one predicted', () => {
  /**
   * PREDICTION 2 ON #81 WAS WRONG, and the correction is the useful part of this mission.
   *
   * I predicted the cost would be `compilerOptions.isCustomElement` configuration, on the standard
   * advice that Vue warns on unresolved `<sk-*>` tags. Measured, it does not — and the reason is
   * specific: Vue 3.5 consults the CustomElementRegistry AT RUNTIME. A probe matrix separated the
   * variables:
   *
   *   REGISTERED   <sk-button>          0 warnings
   *   UNREGISTERED <not-registered-el>  1 warning
   *   UNREGISTERED <NotAThing>          1 warning
   *   unknown      <blahtag>            1 warning
   *
   * (Vue was confirmed to be in DEV mode first — a production build strips warnings entirely and
   * would have produced this same silence for a reason that had nothing to do with the elements.)
   *
   * So for the RUNTIME compiler the config is unnecessary, and the real requirement is import
   * ORDER: the elements must be registered before the template is compiled.
   */
  it('does NOT warn for a registered custom element, without any configuration', async () => {
    const warnings: string[] = [];
    const { destroy } = mount(
      { template: `<sk-button>Click</sk-button>` },
      (app) => { app.config.warnHandler = (msg: string) => warnings.push(msg); },
    );
    await customElements.whenDefined('sk-button');
    expect(warnings, 'the registry is consulted at runtime, so no isCustomElement is needed here').toEqual([]);
    destroy();
  });

  it('DOES warn for a hyphenated tag that is not registered — proving the registry is the discriminator', async () => {
    const warnings: string[] = [];
    const { destroy } = mount(
      { template: `<sk-not-a-real-element>x</sk-not-a-real-element>` },
      (app) => { app.config.warnHandler = (msg: string) => warnings.push(msg); },
    );
    expect(
      warnings.some((w) => /Failed to resolve component/.test(w)),
      'an identical tag shape warns when unregistered, so the silence above is not blanket tolerance',
    ).toBe(true);
    destroy();
  });
});
