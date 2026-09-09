import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  SkCopyField,
  type SkCopyFieldResultDetail,
  type SkCopyFieldElement,
} from '@spec-kitty/react';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

test('[SC-010] the generated wrapper maps every public property and resets removed string props', async () => {
  act(() => {
    root.render(
      <SkCopyField
        value={'  npm run test  '}
        label="Copy test command"
        successMessage="Copied test command."
        manualMessage="Select and copy the test command."
        failureMessage="Could not select the test command."
      />,
    );
  });
  const element = host.querySelector('sk-copy-field') as SkCopyFieldElement;
  await customElements.whenDefined('sk-copy-field');
  await element.updateComplete;
  expect(element.value).toBe('  npm run test  ');
  expect(element.label).toBe('Copy test command');
  expect(element.successMessage).toBe('Copied test command.');
  expect(element.manualMessage).toBe('Select and copy the test command.');
  expect(element.failureMessage).toBe('Could not select the test command.');

  act(() => root.render(<SkCopyField value="next" />));
  await element.updateComplete;
  expect(element.value).toBe('next');
  expect(element.label).toBe('Copy value');
  expect(element.successMessage).toBe('Value copied.');
  expect(element.manualMessage).toContain('system copy shortcut');
  expect(element.failureMessage).toContain('Unable to copy');
});

test('[SC-006] StrictMode delivers one exact typed result event without leaking the value', async () => {
  const received: CustomEvent<SkCopyFieldResultDetail>[] = [];
  act(() => {
    root.render(
      <React.StrictMode>
        <SkCopyField
          value="private"
          onSkCopyFieldResult={(event) => {
            const outcome: 'copied' | 'manual' | 'failed' = event.detail.outcome;
            expect(outcome).toBe('manual');
            received.push(event);
          }}
        />
      </React.StrictMode>,
    );
  });
  const element = host.querySelector('sk-copy-field') as SkCopyFieldElement;
  await customElements.whenDefined('sk-copy-field');
  const detail = Object.freeze({ outcome: 'manual' as const });
  const event = new CustomEvent<SkCopyFieldResultDetail>('sk-copy-field-result', {
    detail,
    bubbles: true,
    composed: true,
  });
  await act(async () => { element.dispatchEvent(event); });
  expect(received).toEqual([event]);
  expect(received[0]!.detail).toBe(detail);
  expect(Object.keys(received[0]!.detail)).toEqual(['outcome']);
});
