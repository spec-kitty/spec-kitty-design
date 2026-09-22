import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { SkFormInput, type SkFormInputElement } from '@spec-kitty/react';

/**
 * #180's answer to the React `ssrSafe` question for `options` — replicating, not re-deriving,
 * the mechanism `sk-transition-matrix` (#149) already shipped and proved for `columns`/`routes`
 * (see `fixtures/react-consumer/src/sk-transition-matrix.test.tsx`'s `[SC-010]` test, which this
 * file mirrors directly). Epic #183 asks whichever of #180/#179 resolves this boundary first to
 * record the answer for #147-#149; #149 already recorded a working answer, so this test confirms
 * the SAME mechanism (`attribute: false` + a literal field initializer earning
 * `x-spec-kitty-property-only`/`x-spec-kitty-property-reset`, routed through the generated
 * `useProperties` hook) applies to `sk-form-input` — a form-associated element, unlike
 * `sk-transition-matrix` — rather than inventing a second one.
 */

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options = Object.freeze([
  Object.freeze({ value: 'main' }),
  Object.freeze({ value: 'release/2026.09', label: 'Release 2026.09' }),
]) satisfies SkFormInputElement['options'];

const replacementOptions = Object.freeze([
  Object.freeze({ value: 'staging' }),
]) satisfies SkFormInputElement['options'];

let host: HTMLDivElement;
let root: Root;

type FormInputProbeElement = HTMLElement & Pick<SkFormInputElement, 'options'>;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function render(ui: React.ReactNode): void {
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>));
}

test('[SC-010] the generated form-input wrapper delivers and resets `options`, undefined before upgrade', async () => {
  expect(
    customElements.get('sk-form-input'),
    'the element loaded before React could exercise pre-definition property delivery',
  ).toBeUndefined();

  render(<SkFormInput name="branch" label="Branch" options={options} />);
  const element = host.querySelector('sk-form-input') as FormInputProbeElement;

  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();
  expect(element.options, 'the initial options did not reach the undefined element').toBe(options);
  expect(element.hasAttribute('options')).toBe(false);

  // Mirrors sk-transition-matrix.test.tsx's own probe class exactly — a manually defined
  // element carrying only the property this test cares about, standing in for the real
  // definition without pulling the whole element/Lit/form-association machinery into this
  // Node-adjacent probe.
  class FormInputProbeElementClass extends HTMLElement {
    declare options: SkFormInputElement['options'];

    constructor() {
      super();
      if (!Object.prototype.hasOwnProperty.call(this, 'options')) {
        this.options = Object.freeze([]);
      }
    }
  }
  customElements.define('sk-form-input', FormInputProbeElementClass);
  await customElements.whenDefined('sk-form-input');

  expect(element.options, 'custom-element upgrade replaced the options identity').toBe(options);
  expect(element.hasAttribute('options')).toBe(false);

  render(<SkFormInput name="branch" label="Branch" options={replacementOptions} />);

  expect(element.options, 'rerendering did not replace the options identity').toBe(
    replacementOptions,
  );
  expect(element.hasAttribute('options')).toBe(false);

  render(<SkFormInput name="branch" label="Branch" />);

  const resetOptions = element.options;
  expect(resetOptions).toEqual([]);
  expect(Object.isFrozen(resetOptions), 'removed options did not receive an immutable reset').toBe(
    true,
  );
  expect(resetOptions, 'removed options retained the consumer array').not.toBe(replacementOptions);
  expect(element.hasAttribute('options')).toBe(false);
});
