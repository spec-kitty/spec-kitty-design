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
import { createApp, ref } from 'vue/dist/vue.esm-bundler.js';
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

  /**
   * THE REAL EVENT, not an invented one. This dispatched `sk-ping` — a name no element fires —
   * so it proved Vue's listener plumbing against a synthetic event and nothing about the elements.
   * `sk-nav-pill-toggle` is the one custom event the catalogue actually dispatches (it is the only
   * `events[]` entry in custom-elements.json), it is hyphenated, and it is `composed`, so it
   * exercises the same Vue plumbing AND the real event surface. A lens pointed out that using the
   * real one would likely have caught the `sk-change` invention in the docs; it would have.
   */
  it('receives the real hyphenated custom event an element dispatches', async () => {
    const seen: string[] = [];
    const { host, destroy } = mount(
      {
        setup: () => ({ onToggle: (e: Event) => seen.push(e.type) }),
        template: `<sk-nav-pill @sk-nav-pill-toggle="onToggle"></sk-nav-pill>`,
      },
      (app) => { app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith('sk-'); },
    );
    await customElements.whenDefined('sk-nav-pill');
    const el = host.querySelector('sk-nav-pill')! as HTMLElement & { open?: boolean };
    const toggle = el.shadowRoot?.querySelector('button');
    expect(toggle, 'the pill renders its toggle button').toBeTruthy();
    (toggle as HTMLButtonElement).click();
    expect(seen, 'Vue attached a listener for the hyphenated event the element really fires').toEqual([
      'sk-nav-pill-toggle',
    ]);
    destroy();
  });

  /**
   * THE PLAIN `:` BINDING, which the documentation described backwards until a lens checked it.
   *
   * Vue's `shouldSetAsProp` ends `return key in el`, so for an UPGRADED element `:legal="x"` takes
   * the DOM-property route, not the attribute route. The attribute appears too — but that is our
   * element reflecting (`legal: { type: String, reflect: true }`), not Vue setting it. The doc said
   * "Vue sets it as an attribute", which credited the wrong side.
   *
   * This is the behaviour the fixture existed to measure and did not: it only ever tested `.prop`.
   */
  it('a plain : binding takes the PROPERTY route on an upgraded element', async () => {
    const legal = ref('© plain');
    const { host, destroy } = mount(
      { setup: () => ({ legal }), template: `<sk-site-footer :legal="legal"></sk-site-footer>` },
      (app) => { app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith('sk-'); },
    );
    await customElements.whenDefined('sk-site-footer');
    const el = host.querySelector('sk-site-footer')! as HTMLElement & { legal?: string };
    expect(el.legal, 'Vue set the DOM property').toBe('© plain');
    expect(el.getAttribute('legal'), 'and the element reflected it back to the attribute').toBe('© plain');
    destroy();
  });

  /**
   * THE EVENT A FORM CONSUMER ACTUALLY NEEDS. The docs recommended `@sk-change`, an event NO
   * element dispatches — so the one copy-pasteable snippet in the page was inert and `text` would
   * never have updated. Measured: the inner `<input>`'s native event is `composed`, so it crosses
   * the shadow boundary, `$event.target` retargets to the host, and the host's `value` is already
   * in sync by then.
   */
  it('@input reaches Vue from sk-form-input, with the host as the retargeted source', async () => {
    const seen: Array<[string, string]> = [];
    const { host, destroy } = mount(
      {
        setup: () => ({ onIn: (e: Event) => seen.push([e.type, (e.target as HTMLInputElement & { value: string }).value]) }),
        template: `<sk-form-input name="f" label="L" @input="onIn"></sk-form-input>`,
      },
      (app) => { app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith('sk-'); },
    );
    await customElements.whenDefined('sk-form-input');
    const el = host.querySelector('sk-form-input')! as HTMLElement & { value?: string };
    const inner = el.shadowRoot!.querySelector('input')!;
    inner.value = 'typed';
    inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    expect(seen, 'Vue saw a native input event retargeted to the host, carrying the synced value').toEqual([
      ['input', 'typed'],
    ]);
    expect(el.value, "and the host's own property is in sync").toBe('typed');
    destroy();
  });
  /**
   * V-MODEL WORKS, and the documentation said it did not.
   *
   * The page carried a "what does not work the same as React" section claiming `v-model` needs a
   * `modelValue` prop and an `update:modelValue` event. That is true only when the compiler does
   * NOT know the tag is a custom element — i.e. exactly the misconfiguration the same page tells
   * you to fix. Once it does, `@vue/compiler-dom` emits `vModelText`, which drives the `value`
   * PROPERTY and listens for `input`; our form elements satisfy both.
   *
   * A lens caught it, and the correction matters beyond one paragraph: a point IN FAVOUR of the
   * mission's conclusion — that no wrapper package is needed — had been written down as a
   * shortcoming. It is asserted here because it is load-bearing for that conclusion.
   */
  it('v-model binds both directions on a form element, with no wrapper', async () => {
    const text = ref('start');
    const { host, destroy } = mount({
      setup: () => ({ text }),
      template: `<sk-form-input v-model="text" name="f" label="L"></sk-form-input>`,
    });
    await customElements.whenDefined('sk-form-input');
    const el = host.querySelector('sk-form-input')! as HTMLElement & { value?: string };
    expect(el.value, 'downward on mount').toBe('start');

    const inner = el.shadowRoot!.querySelector('input')!;
    inner.value = 'typed';
    inner.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(text.value, 'upward: typing reaches the ref').toBe('typed');

    text.value = 'fromParent';
    await new Promise((r) => setTimeout(r, 0));
    expect(el.value, 'downward: assigning the ref reaches the host').toBe('fromParent');
    expect(inner.value, 'and the inner control').toBe('fromParent');
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
