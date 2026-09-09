/* eslint-disable @nx/enforce-module-boundaries -- mutation subjects import their element directly. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../packages/elements/src/copy-field/sk-copy-field.js';
import skCopyFieldSheet from '../../../packages/elements/src/copy-field/sk-copy-field.css.js';
import buttonSheet from '../../../packages/elements/src/button/sk-button.css.js';
import { define } from '../../../packages/elements/src/define.js';
import { SkCopyField } from '../../../packages/elements/src/copy-field/sk-copy-field.js';
import { installTokenSheet } from './token-sheet.js';

type CopyField = SkCopyField & { updateComplete: Promise<unknown> };

const originalClipboard = Object.getOwnPropertyDescriptor(Navigator.prototype, 'clipboard');
const originalSecureContext = Object.getOwnPropertyDescriptor(globalThis, 'isSecureContext');

const setClipboard = (clipboard: unknown): void => {
  Object.defineProperty(Navigator.prototype, 'clipboard', { configurable: true, get: () => clipboard });
};

const setSecureContext = (secure: boolean): void => {
  Object.defineProperty(globalThis, 'isSecureContext', { configurable: true, value: secure });
};

const mockExactSelection = (text: string) => vi.spyOn(globalThis, 'getSelection').mockReturnValue({
  setBaseAndExtent: vi.fn(),
  toString: () => text,
} as unknown as Selection);

const mount = async (value = '', attrs: Record<string, string> = {}): Promise<CopyField> => {
  const element = document.createElement('sk-copy-field') as CopyField;
  element.value = value;
  for (const [name, content] of Object.entries(attrs)) element.setAttribute(name, content);
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const control = (element: CopyField): HTMLButtonElement =>
  element.shadowRoot!.querySelector('[part="copy-control"]') as HTMLButtonElement;
const valueNode = (element: CopyField): HTMLElement =>
  element.shadowRoot!.querySelector('[part="value"]') as HTMLElement;
const status = (element: CopyField): HTMLElement =>
  element.shadowRoot!.querySelector('[role="status"]') as HTMLElement;

beforeEach(() => {
  installTokenSheet();
  setSecureContext(true);
  setClipboard(undefined);
});

afterEach(() => {
  document.body.replaceChildren();
  if (originalClipboard) Object.defineProperty(Navigator.prototype, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(Navigator.prototype, 'clipboard');
  if (originalSecureContext) Object.defineProperty(globalThis, 'isSecureContext', originalSecureContext);
  else delete (globalThis as { isSecureContext?: boolean }).isSecureContext;
  vi.restoreAllMocks();
});

test('one exact value source drives the visible text, clipboard bytes, and empty disabled state', async () => {
  const exact = '  gh pr create --title="naïve 🚀"\n--body=\'line two\'  ';
  const writeText = vi.fn(async () => undefined);
  setClipboard({ writeText });
  const element = await mount(exact);

  expect(element.getAttribute('value')).toBe(exact);
  expect(valueNode(element).textContent).toBe(exact);
  expect(control(element).disabled).toBe(false);
  control(element).click();
  await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce());
  expect(writeText).toHaveBeenCalledWith(exact);

  element.value = '';
  await element.updateComplete;
  expect(valueNode(element).textContent).toBe('');
  expect(control(element).disabled).toBe(true);
  control(element).click();
  expect(writeText).toHaveBeenCalledOnce();
  expect(status(element).textContent).toBe('');
});

test('[SC-006][SC-007][SC-008] each activation emits one private, frozen, truthful success event', async () => {
  setClipboard({ writeText: vi.fn(async () => undefined) });
  const element = await mount('secret-token');
  const events: CustomEvent[] = [];
  element.addEventListener('sk-copy-field-result', (event) => events.push(event as CustomEvent));

  control(element).click();
  await vi.waitFor(() => expect(events).toHaveLength(1));
  const event = events[0]!;
  expect(event.detail).toEqual({ outcome: 'copied' });
  expect(Object.keys(event.detail)).toEqual(['outcome']);
  expect(Object.isFrozen(event.detail)).toBe(true);
  expect(JSON.stringify(event.detail)).not.toContain('secret-token');
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
  expect(event.cancelable).toBe(false);
  expect(status(element).textContent).toBe('Value copied.');
  expect(element.value).toBe('secret-token');
});

test('[SC-012] missing, rejected, throwing, and insecure clipboard paths select the full visible value manually', async () => {
  const clipboardCases: Array<unknown> = [
    undefined,
    {},
    { writeText: 'not callable' },
    { writeText: vi.fn(() => Promise.reject(new Error('denied'))) },
    { writeText: vi.fn(() => { throw new Error('blocked'); }) },
  ];
  for (const clipboard of clipboardCases) {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const setBaseAndExtent = vi.fn();
    const selection = {
      setBaseAndExtent,
      toString: () => 'manual bytes',
    } as unknown as Selection;
    const selectionSpy = vi.spyOn(globalThis, 'getSelection').mockReturnValue(selection);
    setSecureContext(true);
    setClipboard(clipboard);
    const element = await mount('manual bytes');
    const outcomes: string[] = [];
    element.addEventListener('sk-copy-field-result', (event) => {
      outcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
    });
    control(element).click();
    await vi.waitFor(() => expect(outcomes).toEqual(['manual']));
    expect(status(element).textContent).toBe(
      'Value selected. Use your system copy shortcut to copy it.',
    );
    expect(focus).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    const node = valueNode(element);
    expect(setBaseAndExtent).toHaveBeenCalledOnce();
    expect(setBaseAndExtent).toHaveBeenCalledWith(node, 0, node, node.childNodes.length);
    element.remove();
    selectionSpy.mockRestore();
    focus.mockRestore();
  }

  setSecureContext(false);
  const writeText = vi.fn(async () => undefined);
  setClipboard({ writeText });
  const selectionSpy = mockExactSelection('not sent');
  const insecure = await mount('not sent');
  control(insecure).click();
  await vi.waitFor(() => expect(status(insecure).textContent).toContain('system copy shortcut'));
  expect(writeText).not.toHaveBeenCalled();
  selectionSpy.mockRestore();
});

test('selection failure emits failed and never makes an untruthful success claim', async () => {
  setClipboard(undefined);
  vi.spyOn(globalThis, 'getSelection').mockReturnValue(null);
  const element = await mount('unselectable');
  const outcomes: string[] = [];
  element.addEventListener('sk-copy-field-result', (event) => {
    outcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
  });
  control(element).click();
  await vi.waitFor(() => expect(outcomes).toEqual(['failed']));
  expect(status(element).textContent).toBe('Unable to copy or select the value.');
});

test('every selection-fallback failure is contained and emits one failed result', async () => {
  const failures = [
    'focus verification',
    'selected text mismatch',
    'selection replacement unavailable',
    'selection replacement non-callable',
    'selection replacement throws',
  ] as const;

  for (const failure of failures) {
    const escaped: Event[] = [];
    const recordEscaped = (event: Event) => escaped.push(event);
    globalThis.addEventListener('error', recordEscaped);
    globalThis.addEventListener('unhandledrejection', recordEscaped);
    const element = await mount(`unselectable: ${failure}`);
    const node = valueNode(element);
    control(element).focus();
    let setBaseAndExtent: unknown = vi.fn(() => {
      if (failure === 'selection replacement throws') throw new Error('selection denied');
    });
    if (failure === 'selection replacement unavailable') setBaseAndExtent = undefined;
    if (failure === 'selection replacement non-callable') setBaseAndExtent = 'not callable';
    const selection = {
      setBaseAndExtent,
      toString: () => failure === 'selected text mismatch' ? 'different text' : node.textContent,
    } as unknown as Selection;
    vi.spyOn(globalThis, 'getSelection').mockReturnValue(selection);
    if (failure === 'focus verification') {
      vi.spyOn(node, 'focus').mockImplementation(() => undefined);
    }
    const outcomes: string[] = [];
    element.addEventListener('sk-copy-field-result', (event) => {
      outcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
    });

    control(element).click();
    await vi.waitFor(() => expect(outcomes).toEqual(['failed']));
    await Promise.resolve();
    expect(status(element).textContent).toBe('Unable to copy or select the value.');
    expect(escaped).toEqual([]);

    globalThis.removeEventListener('error', recordEscaped);
    globalThis.removeEventListener('unhandledrejection', recordEscaped);
    element.remove();
    vi.restoreAllMocks();
  }
});

test('missing and blank labels each warn once and fail open without hiding the control or value', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const missing = await mount('visible value');
  expect(missing.label).toBe('Copy value');
  expect(control(missing).getAttribute('aria-label')).toBe('Copy value');
  expect(control(missing)).toBeTruthy();
  expect(valueNode(missing).textContent).toBe('visible value');
  expect(warn).toHaveBeenCalledOnce();
  missing.successMessage = 'Unrelated update.';
  await missing.updateComplete;
  expect(warn).toHaveBeenCalledOnce();

  setClipboard({ writeText: vi.fn(async () => undefined) });
  const element = await mount('value', {
    label: 'Copy command',
    'success-message': 'Copied command.',
    'manual-message': 'Select and copy the command.',
    'failure-message': 'Command could not be selected.',
  });
  expect(control(element).getAttribute('aria-label')).toBe('Copy command');
  control(element).click();
  await vi.waitFor(() => expect(status(element).textContent).toBe('Copied command.'));

  element.label = '   ';
  await element.updateComplete;
  expect(control(element).getAttribute('aria-label')).toBe('Copy value');
  expect(warn).toHaveBeenCalledTimes(2);
  element.successMessage = 'Another message.';
  await element.updateComplete;
  expect(warn).toHaveBeenCalledTimes(2);
});

test('a blank label assigned before upgrade warns and preserves the public default and value', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const element = document.createElement('sk-copy-field-late-blank') as CopyField;
  element.value = 'pre-upgrade value';
  element.label = '   ';
  document.body.append(element);
  customElements.define('sk-copy-field-late-blank', class extends SkCopyField {});
  await customElements.whenDefined('sk-copy-field-late-blank');
  await element.updateComplete;

  expect(element.label).toBe('   ');
  expect(control(element).getAttribute('aria-label')).toBe('Copy value');
  expect(valueNode(element).textContent).toBe('pre-upgrade value');
  expect(warn).toHaveBeenCalledOnce();
});

test('blank result-message overrides fail open to each applicable default', async () => {
  setClipboard({ writeText: vi.fn(async () => undefined) });
  const success = await mount('success', { 'success-message': '   ' });
  control(success).click();
  await vi.waitFor(() => expect(status(success).textContent).toBe('Value copied.'));

  setClipboard(undefined);
  const selectionSpy = mockExactSelection('manual');
  const manual = await mount('manual', { 'manual-message': '\n' });
  control(manual).click();
  await vi.waitFor(() => expect(status(manual).textContent).toBe(
    'Value selected. Use your system copy shortcut to copy it.',
  ));
  selectionSpy.mockRestore();

  vi.spyOn(globalThis, 'getSelection').mockReturnValue(null);
  const failed = await mount('failed', { 'failure-message': '' });
  control(failed).click();
  await vi.waitFor(() => expect(status(failed).textContent).toBe(
    'Unable to copy or select the value.',
  ));
});

test('the stable status node and outcome remain isolated per instance', async () => {
  setClipboard({ writeText: vi.fn(async () => undefined) });
  const first = await mount('first');
  const second = await mount('second');
  const firstStatus = status(first);
  const secondStatus = status(second);

  expect(getComputedStyle(firstStatus).display).not.toBe('none');
  expect(firstStatus.getAttribute('role')).toBe('status');
  expect(firstStatus.getAttribute('aria-live')).toBe('polite');
  expect(firstStatus.getAttribute('aria-atomic')).toBe('true');
  control(first).click();
  await vi.waitFor(() => expect(firstStatus.textContent).toBe('Value copied.'));
  expect(first.shadowRoot!.querySelector('[part="field"]')!.hasAttribute('data-outcome')).toBe(false);
  expect(status(first)).toBe(firstStatus);
  expect(status(second)).toBe(secondStatus);
  expect(secondStatus.textContent).toBe('');
});

test('a value mutation clears stale status synchronously, including A to B to A', async () => {
  setClipboard({ writeText: vi.fn(async () => undefined) });
  const element = await mount('A');
  control(element).click();
  await vi.waitFor(() => expect(status(element).textContent).toBe('Value copied.'));

  element.value = 'B';
  expect(status(element).textContent).toBe('');
  element.value = 'A';
  expect(status(element).textContent).toBe('');
  await element.updateComplete;
  expect(valueNode(element).textContent).toBe('A');
});

test('stale async completions emit their attempt result but cannot overwrite current-value status', async () => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  setClipboard({ writeText: vi.fn(() => pending) });
  const element = await mount('old');
  const outcomes: string[] = [];
  element.addEventListener('sk-copy-field-result', (event) => {
    outcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
  });
  control(element).click();
  element.value = 'new';
  expect(status(element).textContent).toBe('');
  finish();
  await vi.waitFor(() => expect(outcomes).toEqual(['copied']));
  expect(status(element).textContent).toBe('');
  expect(valueNode(element).textContent).toBe('new');
});

test('a stale rejected attempt emits failed without focusing or selecting the newer value', async () => {
  let rejectWrite!: (reason?: unknown) => void;
  const pending = new Promise<void>((_resolve, reject) => { rejectWrite = reject; });
  setClipboard({ writeText: vi.fn(() => pending) });
  const element = await mount('old');
  const focus = vi.spyOn(valueNode(element), 'focus');
  const getSelection = vi.spyOn(globalThis, 'getSelection');
  const outcomes: string[] = [];
  element.addEventListener('sk-copy-field-result', (event) => {
    outcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
  });

  control(element).focus();
  control(element).click();
  element.value = 'new value';
  rejectWrite(new Error('denied'));

  await vi.waitFor(() => expect(outcomes).toEqual(['failed']));
  expect(focus).not.toHaveBeenCalled();
  expect(getSelection).not.toHaveBeenCalled();
  expect(element.shadowRoot!.activeElement).not.toBe(valueNode(element));
  expect(status(element).textContent).toBe('');
  expect(valueNode(element).textContent).toBe('new value');
});

test('overlapping same-value attempts each emit and status follows completion order', async () => {
  const resolvers: Array<() => void> = [];
  setClipboard({ writeText: vi.fn(() => new Promise<void>((resolve) => resolvers.push(resolve))) });
  const element = await mount('same');
  const outcomes: string[] = [];
  element.addEventListener('sk-copy-field-result', (event) => {
    outcomes.push((event as CustomEvent<{ outcome: string }>).detail.outcome);
  });
  control(element).click();
  control(element).click();
  expect(resolvers).toHaveLength(2);
  resolvers[1]!();
  await vi.waitFor(() => expect(outcomes).toHaveLength(1));
  resolvers[0]!();
  await vi.waitFor(() => expect(outcomes).toEqual(['copied', 'copied']));
  expect(status(element).textContent).toBe('Value copied.');
});

test('[SC-010] every public property assigned before upgrade survives exactly', async () => {
  const element = document.createElement('sk-copy-field-late') as CopyField;
  element.value = '  pre-upgrade  ';
  element.label = 'Copy exact value';
  element.successMessage = 'Done.';
  element.manualMessage = 'Selected.';
  element.failureMessage = 'Failed.';
  document.body.append(element);
  customElements.define('sk-copy-field-late', class extends SkCopyField {});
  await customElements.whenDefined('sk-copy-field-late');
  await element.updateComplete;
  expect(element.value).toBe('  pre-upgrade  ');
  expect(element.label).toBe('Copy exact value');
  expect(element.successMessage).toBe('Done.');
  expect(element.manualMessage).toBe('Selected.');
  expect(element.failureMessage).toBe('Failed.');
  expect(element.getAttribute('value')).toBe('  pre-upgrade  ');
  expect(valueNode(element).textContent).toBe('  pre-upgrade  ');
});

test('[SC-012][SC-013] a real native button owns focus and all four stable parts exist', async () => {
  const outside = document.createElement('style');
  outside.textContent = `
    sk-copy-field::part(field) { outline: 1px solid currentcolor; }
    sk-copy-field::part(value) { text-decoration: underline; }
    sk-copy-field::part(copy-control) { opacity: 0.91; }
    sk-copy-field::part(status) { letter-spacing: 1px; }
  `;
  document.head.append(outside);
  const element = await mount('keyboard value');
  const button = control(element);
  expect(button.tagName).toBe('BUTTON');
  expect(button.type).toBe('button');
  button.focus();
  expect(element.shadowRoot!.activeElement).toBe(button);
  expect(element.hasAttribute('tabindex')).toBe(false);
  expect(element.shadowRoot!.querySelector('[part="field"]')).toBeTruthy();
  expect(valueNode(element)).toBeTruthy();
  expect(button).toBeTruthy();
  const statusPart = element.shadowRoot!.querySelector('[part="status"]') as HTMLElement;
  expect(statusPart).toBeTruthy();
  expect(statusPart.getAttribute('role')).toBe('status');
  expect(statusPart.getAttribute('aria-live')).toBe('polite');
  expect(getComputedStyle(element.shadowRoot!.querySelector('[part="field"]')!).outlineStyle).toBe('solid');
  expect(getComputedStyle(valueNode(element)).textDecorationLine).toContain('underline');
  expect(getComputedStyle(button).opacity).toBe('0.91');
  expect(getComputedStyle(statusPart).letterSpacing).toBe('1px');
  outside.remove();
});

test('[SC-014] shared button CSS precedes the generated local sheet and no style tag is injected', async () => {
  const element = await mount('styled');
  const sheets = element.shadowRoot!.adoptedStyleSheets;
  expect(sheets).toHaveLength(2);
  expect(sheets[0]).toBe(buttonSheet);
  expect(sheets[1]).toBe(skCopyFieldSheet);
  expect(element.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

test('[SC-017] the 20rem available-inline-size threshold declares and applies the one-column reflow', async () => {
  const hostRule = Array.from(skCopyFieldSheet.cssRules)
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
    .find((rule) => rule.selectorText === ':host');
  expect(hostRule?.style.getPropertyValue('container-type').trim()).toBe('inline-size');
  expect(hostRule?.style.getPropertyValue('inline-size').trim()).toBe('100%');
  expect(hostRule?.style.getPropertyValue('max-inline-size').trim()).toBe('100%');
  const responsiveRules = Array.from(skCopyFieldSheet.cssRules)
    .filter((rule): rule is CSSContainerRule => rule instanceof CSSContainerRule)
    .filter((rule) => rule.conditionText.replace(/\s+/g, ' ') === '(max-inline-size: 20rem)');
  expect(responsiveRules).toHaveLength(1);
  const declarations = Array.from(responsiveRules[0]!.cssRules)
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);
  const field = declarations.find((rule) => rule.selectorText === '.sk-copy-field');
  const button = declarations.find((rule) => rule.selectorText === '.sk-copy-field .sk-button');
  expect(field?.style.getPropertyValue('grid-template-columns').trim()).toBe('minmax(0px, 1fr)');
  expect(button?.style.getPropertyValue('justify-self').trim()).toBe('end');
  const element = await mount('container-safe');
  element.style.inlineSize = '115px';
  expect(getComputedStyle(element.shadowRoot!.querySelector('[part="field"]')!).gridTemplateColumns)
    .not.toContain(' ');
  expect(getComputedStyle(control(element)).justifySelf).toBe('end');

  element.style.writingMode = 'vertical-rl';
  element.style.blockSize = '22rem';
  element.style.inlineSize = '19rem';
  expect(getComputedStyle(element.shadowRoot!.querySelector('[part="field"]')!).gridTemplateColumns)
    .not.toContain(' ');
  element.style.inlineSize = '21rem';
  expect(getComputedStyle(element.shadowRoot!.querySelector('[part="field"]')!).gridTemplateColumns)
    .toContain(' ');
});

test('[SC-015] guarded module registration warns only for a different constructor', () => {
  const original = customElements.get('sk-copy-field');
  expect(original).toBe(SkCopyField);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  class Impostor extends HTMLElement {}
  define('sk-copy-field', Impostor);
  expect(warn).toHaveBeenCalledOnce();
  expect(customElements.get('sk-copy-field')).toBe(original);
  warn.mockClear();
  define('sk-copy-field', SkCopyField);
  expect(warn).not.toHaveBeenCalled();
});
