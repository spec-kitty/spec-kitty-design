import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { SkEvidenceChain, type SkEvidenceChainElement } from '@spec-kitty/react';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const firstStages = Object.freeze([
  Object.freeze({ id: 'first', label: 'First', displayValue: '1', tone: 'info' as const }),
]);
const secondStages = Object.freeze([
  Object.freeze({ id: 'second', label: 'Second', displayValue: '2', annotation: 'Fresh' }),
]);
const firstSnapshot = JSON.stringify(firstStages);
const secondSnapshot = JSON.stringify(secondStages);

let host: HTMLDivElement;
let root: Root;

type EvidenceChainProbeElement = HTMLElement & Pick<SkEvidenceChainElement, 'stages'>;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (ui: React.ReactNode): void => {
  act(() => root.render(<React.StrictMode>{ui}</React.StrictMode>));
};

test('[property-only] the generated evidence-chain wrapper preserves identity and resets omitted stages', async () => {
  expect(
    customElements.get('sk-evidence-chain'),
    'the element loaded before React could exercise pre-definition property delivery',
  ).toBeUndefined();

  render(<SkEvidenceChain stages={firstStages} />);
  const element = host.querySelector('sk-evidence-chain') as EvidenceChainProbeElement;
  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();
  expect(element.stages, 'the frozen sentinel did not reach the undefined element').toBe(firstStages);
  expect(element.hasAttribute('stages'), 'structured stages were serialized').toBe(false);

  class EvidenceChainProbeElementClass extends HTMLElement {
    declare stages: SkEvidenceChainElement['stages'];

    constructor() {
      super();
      if (!Object.prototype.hasOwnProperty.call(this, 'stages')) {
        this.stages = Object.freeze([]);
      }
    }
  }
  customElements.define('sk-evidence-chain', EvidenceChainProbeElementClass);
  await customElements.whenDefined('sk-evidence-chain');

  expect(element.stages, 'custom-element upgrade replaced the sentinel identity').toBe(firstStages);
  expect(element.hasAttribute('stages'), 'upgrade created a stages attribute').toBe(false);

  render(<SkEvidenceChain stages={secondStages} />);
  expect(element.stages, 'rerender did not replace the stages reference').toBe(secondStages);
  expect(element.hasAttribute('stages'), 'rerender serialized stages').toBe(false);

  render(<SkEvidenceChain />);
  const resetStages = element.stages;
  expect(resetStages).toEqual([]);
  expect(Object.isFrozen(resetStages), 'omission did not assign a frozen empty array').toBe(true);
  expect(resetStages, 'omission retained the consumer array').not.toBe(secondStages);
  expect(resetStages, 'omission must create a fresh reset array').not.toBe(firstStages);
  expect(element.hasAttribute('stages'), 'omission created a stages attribute').toBe(false);

  expect(JSON.stringify(firstStages), 'the wrapper mutated the first caller array').toBe(firstSnapshot);
  expect(JSON.stringify(secondStages), 'the wrapper mutated the replacement caller array').toBe(secondSnapshot);
  expect(Object.isFrozen(firstStages) && Object.isFrozen(firstStages[0])).toBe(true);
  expect(Object.isFrozen(secondStages) && Object.isFrozen(secondStages[0])).toBe(true);
});
