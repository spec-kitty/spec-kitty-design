import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  SkActionRow,
  type ActionRowActivateDetail,
  type SkActionRowElement,
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

test('[SC-006] the generated action-row wrapper delivers one exact non-cancelable event', async () => {
  const received: CustomEvent<ActionRowActivateDetail>[] = [];
  act(() => {
    root.render(
      <React.StrictMode>
        <SkActionRow
          rowId="sentinel-row"
          selectable
          selected
          onSkActionRowActivate={(event) => {
            received.push(event);
            event.preventDefault();
            return false;
          }}
        />
      </React.StrictMode>,
    );
  });

  const element = host.querySelector('sk-action-row') as SkActionRowElement;
  expect(element, 'the generated wrapper rendered no custom element').toBeTruthy();

  const detail = Object.freeze({ id: 'sentinel-row' }) satisfies ActionRowActivateDetail;
  const event = new CustomEvent<ActionRowActivateDetail>('sk-action-row-activate', {
    detail,
    bubbles: true,
    composed: true,
    cancelable: false,
  });

  let dispatchResult = false;
  await act(async () => {
    dispatchResult = element.dispatchEvent(event);
  });

  expect(received, 'StrictMode installed a duplicate listener').toHaveLength(1);
  expect(received[0], 'the wrapper changed the event identity').toBe(event);
  expect(received[0]?.detail, 'the wrapper changed the detail identity').toBe(detail);
  expect(received[0]?.detail).toEqual({ id: 'sentinel-row' });
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
  expect(event.cancelable).toBe(false);
  expect(event.defaultPrevented, 'preventDefault canceled a non-cancelable request').toBe(false);
  expect(dispatchResult, 'preventDefault or the callback return value canceled dispatch').toBe(true);
});
