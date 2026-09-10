/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../../packages/elements/src/confirm-dialog/sk-confirm-dialog.js';
import buttonSheet from '../../../packages/elements/src/button/sk-button.css.js';
import skConfirmDialogSheet from '../../../packages/elements/src/confirm-dialog/sk-confirm-dialog.css.js';
import { define } from '../../../packages/elements/src/define.js';
import { SkConfirmDialog } from '../../../packages/elements/src/confirm-dialog/sk-confirm-dialog.js';
import { assertThemesDiffered } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

type ConfirmDialog = SkConfirmDialog & { updateComplete: Promise<unknown> };

const ATTRS = {
  'dialog-title': 'Revoke this link?',
  message: "Anyone with this link will lose access immediately. This can't be undone.",
  'confirm-label': 'Revoke link',
  'cancel-label': 'Keep link',
};

const mount = async (attrs: Record<string, string> = ATTRS): Promise<ConfirmDialog> => {
  const element = document.createElement('sk-confirm-dialog') as ConfirmDialog;
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  document.body.append(element);
  await element.updateComplete;
  return element;
};

const dialogOf = (element: ConfirmDialog): HTMLDialogElement =>
  element.shadowRoot!.querySelector('[part="dialog"]') as HTMLDialogElement;
const confirmButton = (element: ConfirmDialog): HTMLButtonElement =>
  element.shadowRoot!.querySelector('[part="confirm"]') as HTMLButtonElement;
const cancelButton = (element: ConfirmDialog): HTMLButtonElement =>
  element.shadowRoot!.querySelector('[part="cancel"]') as HTMLButtonElement;

/** Mounts a real invoking button, focuses it, and opens the dialog the way a real consumer
 *  does — `showModal()` called from that invoker's own click handler. */
const mountWithInvoker = async (
  attrs: Record<string, string> = ATTRS,
): Promise<{ element: ConfirmDialog; invoker: HTMLButtonElement }> => {
  const invoker = document.createElement('button');
  invoker.textContent = 'Open';
  document.body.append(invoker);
  const element = await mount(attrs);
  invoker.focus();
  element.showModal();
  await element.updateComplete;
  return { element, invoker };
};

beforeEach(async () => {
  // AWAITED, deliberately. `installTokenSheet()` is async (a dynamic import) and its own body
  // does `document.body.innerHTML = ''` only after that import resolves. An un-awaited call here
  // races that wipe against this file's own showModal()/mount() calls: on a slow or first-ever
  // resolution the wipe can land MID-TEST, tearing the open <dialog> (and its close watcher) out
  // from under an in-flight Escape-key assertion with no error — measured directly against
  // this file's own [SC-005] Escape test, which timed out waiting for a `close` it could no
  // longer receive until this await was added.
  await installTokenSheet();
});

afterEach(async () => {
  // Force-close any dialog left open by a test that didn't reach its own close path. A modal
  // <dialog> removed from the DOM while still open can leave the platform's close-watcher stack
  // in a state where a LATER test's Escape press is consumed by a stale entry instead of the new
  // dialog under test — closing explicitly first avoids that class of cross-test flake outright.
  for (const el of Array.from(document.querySelectorAll('sk-confirm-dialog'))) {
    (el.shadowRoot?.querySelector('[part="dialog"]') as HTMLDialogElement | null)?.close();
  }
  document.body.replaceChildren();
  // The native `close` event fires via a QUEUED task, not synchronously — including for the
  // force-closes just above and for any `.close()` a test called on an element it already
  // removed itself. Settling here, once per test, keeps a delayed close's resulting re-render
  // (and any console.warn it triggers) inside THIS test's teardown window rather than bleeding
  // into an unrelated later test that asserts an exact call count (e.g. [SC-015]).
  await new Promise((resolve) => setTimeout(resolve, 100));
  // `vi.spyOn` on an already-spied method returns the SAME mock and its call history is
  // cumulative across every `vi.spyOn(console, 'warn')` call in this file until restored —
  // measured directly: without this, [SC-015]'s spy inherited every prior test's "required
  // property omitted" warnings and counted 7 calls instead of the 1 it actually triggered.
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------------------------
// FR-001 / FR-017 / FR-018 — NO LIBRARY-AUTHORED LITERAL EVER SUBSTITUTES FOR AN OMITTED STRING.
//
// UNMARKED — no [SC-NNN] id. ADR-11 has no id for "a required string is never given a fallback
// value"; this is this component's OWN subject, following sk-notice's unmarked
// re-announcement-test precedent (#178) exactly, per research.md's "Decision: component-scoped
// 'no literal text' test". It must not be generalized into a repo-wide gate — that is #286's own,
// separate, not-yet-built deliverable, and this test scans nothing beyond this one component.
// ---------------------------------------------------------------------------------------------

/** Every user-visible text node in the shadow root, in document order, trimmed and with empty
 *  strings dropped — a TreeWalker over TEXT_NODEs is what "bare text node" means here, so an
 *  empty text node (which Lit's `nothing` never creates in the first place) would show up too,
 *  if one existed. */
function visibleTextNodes(root: ShadowRoot): string[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out: string[] = [];
  let node = walker.nextNode();
  while (node) {
    const text = node.textContent?.trim();
    if (text) out.push(text);
    node = walker.nextNode();
  }
  return out;
}

test('all four strings supplied: the shadow tree carries exactly those four strings and nothing else', async () => {
  const element = await mount();
  element.showModal();
  await element.updateComplete;
  const texts = visibleTextNodes(element.shadowRoot!);
  expect(texts.sort()).toEqual(
    [ATTRS['dialog-title'], ATTRS.message, ATTRS['confirm-label'], ATTRS['cancel-label']].sort(),
  );
});

test('an omitted required string renders no substituted literal and warns exactly once per omission', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const element = await mount({
    'dialog-title': ATTRS['dialog-title'],
    message: ATTRS.message,
    'cancel-label': ATTRS['cancel-label'],
    // confirm-label deliberately omitted
  });
  element.showModal();
  await element.updateComplete;
  const texts = visibleTextNodes(element.shadowRoot!);
  // The confirm label never appears, and — the sharpest part of this assertion — NEITHER does
  // any library-authored placeholder ("Confirm", "OK", "Submit", …). No fallback exists to leak
  // in the first place, so this is really just re-confirming the omitted string contributes
  // nothing, but it is stated as its own expectation because that is precisely the defect class
  // FR-001/FR-017 exist to prevent.
  expect(texts).not.toContain('Confirm');
  expect(texts).not.toContain('OK');
  expect(texts.sort()).toEqual(
    [ATTRS['dialog-title'], ATTRS.message, ATTRS['cancel-label']].sort(),
  );
  expect(confirmButton(element).textContent?.trim()).toBe('');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0]?.[0]).toContain('confirmLabel');

  // Re-rendering with the SAME omission does not warn again (dedupe, not a storm)...
  element.cancelLabel = 'Still keep it';
  await element.updateComplete;
  expect(warn).toHaveBeenCalledTimes(1);

  // ...but supplying it and then omitting it again is a NEW integration defect, and warns again.
  element.confirmLabel = 'Revoke link';
  await element.updateComplete;
  element.confirmLabel = undefined;
  await element.updateComplete;
  expect(warn).toHaveBeenCalledTimes(2);
});

test('every one of the four required strings independently omits with no fallback and no throw', async () => {
  for (const omit of ['dialog-title', 'message', 'confirm-label', 'cancel-label'] as const) {
    const attrs = { ...ATTRS };
    delete (attrs as Record<string, string>)[omit];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const element = await mount(attrs);
    expect(() => element.showModal()).not.toThrow();
    await element.updateComplete;
    // The shadow root still renders a real dialog with the OTHER three strings — an omission
    // never blanks the whole shadow root (the warn-and-degrade precedent, not the throw one).
    expect(dialogOf(element)).toBeTruthy();
    expect(warn).toHaveBeenCalled();
    dialogOf(element).close();
    element.remove();
  }
});

// ---------------------------------------------------------------------------------------------
// [SC-005] Focus and keyboard: Escape closes as cancel, focus returns to the invoker, and the
// `open` state attribute tracks the dialog's real state.
// ---------------------------------------------------------------------------------------------

test('[SC-005] Escape closes as cancel, focus returns to the invoker, and `open` tracks real state', async () => {
  const { element, invoker } = await mountWithInvoker();
  expect(element.hasAttribute('open')).toBe(true);
  expect(dialogOf(element).hasAttribute('open')).toBe(true);

  const closed = new Promise<void>((resolve) => {
    dialogOf(element).addEventListener('close', () => resolve(), { once: true });
  });
  await userEvent.keyboard('{Escape}');
  await closed;
  await element.updateComplete;

  expect(dialogOf(element).returnValue).toBe('cancel');
  expect(element.hasAttribute('open')).toBe(false);
  expect(dialogOf(element).hasAttribute('open')).toBe(false);
  expect(document.activeElement).toBe(invoker);
});

test('[SC-005] an explicit showModal(invoker) argument overrides the platform-tracked previously-focused element', async () => {
  // This is the case that actually EXERCISES this element's own invoker tracking, as opposed to
  // the platform's own built-in "restore focus to whatever had it before showModal()" behaviour.
  // A decoy element holds real focus when showModal() is called; the explicit `invoker` argument
  // names something else entirely. Only this element's own #invoker capture can make focus land
  // on the DOCUMENTED target rather than wherever the platform would have picked by itself.
  const element = await mount();
  const explicitInvoker = document.createElement('button');
  explicitInvoker.textContent = 'Explicit invoker';
  document.body.append(explicitInvoker);
  const decoy = document.createElement('button');
  decoy.textContent = 'Decoy — has real focus at showModal() time';
  document.body.append(decoy);
  decoy.focus();
  element.showModal(explicitInvoker);
  await element.updateComplete;
  const closed = waitForClose(dialogOf(element));
  cancelButton(element).click();
  await closed;
  expect(document.activeElement).toBe(explicitInvoker);
});

test('[SC-005] initial focus lands on the documented target and is consumer-overridable', async () => {
  const defaultFocus = await mount();
  defaultFocus.showModal();
  await defaultFocus.updateComplete;
  expect(defaultFocus.shadowRoot!.activeElement).toBe(cancelButton(defaultFocus));
  dialogOf(defaultFocus).close();
  defaultFocus.remove();

  const overridden = await mount({ ...ATTRS, 'initial-focus': 'confirm' });
  overridden.showModal();
  await overridden.updateComplete;
  expect(overridden.shadowRoot!.activeElement).toBe(confirmButton(overridden));
});

test('[SC-005] an unknown initial-focus value warns and falls back to cancel', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const element = await mount({ ...ATTRS, 'initial-focus': 'destroy-everything' });
  element.showModal();
  await element.updateComplete;
  expect(element.shadowRoot!.activeElement).toBe(cancelButton(element));
  expect(warn).toHaveBeenCalled();
  expect(warn.mock.calls.some((call) => String(call[0]).includes('initial-focus'))).toBe(true);
});

// ---------------------------------------------------------------------------------------------
// [SC-006][SC-007] Event contract: the native `close` event fires exactly once per close, and
// `returnValue` carries the documented shape for every path in contracts/sk-confirm-dialog.md's
// table. FR-006/FR-007 are this mission's crux — every path below is asserted independently.
// ---------------------------------------------------------------------------------------------

// The native `close` event fires via a QUEUED task (WHATWG HTML "close the dialog" steps), not
// synchronously within the call to `.close()` — so every assertion below waits for the event
// itself rather than checking a counter immediately after the triggering action.
const observeCloses = (dialog: HTMLDialogElement): (() => number) => {
  let count = 0;
  dialog.addEventListener('close', () => {
    count += 1;
  });
  return () => count;
};

const waitForClose = (dialog: HTMLDialogElement): Promise<void> =>
  new Promise((resolve) => dialog.addEventListener('close', () => resolve(), { once: true }));

test('[SC-006][SC-007] confirm activation fires close exactly once with returnValue "confirm"', async () => {
  const { element } = await mountWithInvoker();
  const dialog = dialogOf(element);
  const closeCount = observeCloses(dialog);
  const closed = waitForClose(dialog);
  confirmButton(element).click();
  await closed;
  // Nothing else can fire a SECOND close from this one activation — give any errant extra queued
  // task a chance to land before asserting the count is final.
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(closeCount()).toBe(1);
  expect(dialog.returnValue).toBe('confirm');
});

test('[SC-006][SC-007] cancel activation fires close exactly once with returnValue "cancel"', async () => {
  const { element } = await mountWithInvoker();
  const dialog = dialogOf(element);
  const closeCount = observeCloses(dialog);
  const closed = waitForClose(dialog);
  cancelButton(element).click();
  await closed;
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(closeCount()).toBe(1);
  expect(dialog.returnValue).toBe('cancel');
});

test('[SC-007] Escape resolves "cancel" even immediately after a prior confirming close', async () => {
  // Guards the exact FR-007 hazard research.md names: a stale `returnValue` from a PRIOR
  // confirmation must never leak into a later, unrelated close. showModal() re-defaults it.
  const { element, invoker } = await mountWithInvoker();
  confirmButton(element).click();
  await element.updateComplete;
  expect(dialogOf(element).returnValue).toBe('confirm');

  invoker.focus();
  element.showModal();
  await element.updateComplete;
  const closed = new Promise<void>((resolve) => {
    dialogOf(element).addEventListener('close', () => resolve(), { once: true });
  });
  await userEvent.keyboard('{Escape}');
  await closed;
  expect(dialogOf(element).returnValue).toBe('cancel');
});

test('[SC-007] backdrop dismissal resolves "cancel", and only when enabled', async () => {
  const disabled = await mount(ATTRS);
  disabled.showModal();
  await disabled.updateComplete;
  const closeCountDisabled = observeCloses(dialogOf(disabled));
  // A click whose target IS the <dialog> element itself is exactly what a real click landing on
  // the platform-drawn backdrop-adjacent box produces — the standard `event.target === dialog`
  // technique this element's own #handleBackdropClick relies on (see research.md).
  dialogOf(disabled).click();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(closeCountDisabled(), 'backdrop-dismiss defaults to false: a backdrop click must do nothing').toBe(0);
  expect(dialogOf(disabled).hasAttribute('open')).toBe(true);
  dialogOf(disabled).close();
  disabled.remove();

  const enabled = await mount({ ...ATTRS, 'backdrop-dismiss': '' });
  enabled.showModal();
  await enabled.updateComplete;
  const closed = new Promise<void>((resolve) => {
    dialogOf(enabled).addEventListener('close', () => resolve(), { once: true });
  });
  dialogOf(enabled).click();
  await closed;
  expect(dialogOf(enabled).returnValue).toBe('cancel');
});

test('[SC-007] a click inside the dialog content never dismisses, even with backdrop-dismiss enabled', async () => {
  const element = await mount({ ...ATTRS, 'backdrop-dismiss': '' });
  element.showModal();
  await element.updateComplete;
  const closeCount = observeCloses(dialogOf(element));
  element.shadowRoot!.querySelector('[part="title"]')!.dispatchEvent(
    new MouseEvent('click', { bubbles: true }),
  );
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(closeCount()).toBe(0);
  expect(dialogOf(element).hasAttribute('open')).toBe(true);
});

test('[SC-007] a programmatic close with no explicit outcome resolves "cancel", never an invented "confirm"', async () => {
  const element = await mount();
  element.showModal();
  await element.updateComplete;
  const closed = new Promise<void>((resolve) => {
    dialogOf(element).addEventListener('close', () => resolve(), { once: true });
  });
  dialogOf(element).close();
  await closed;
  expect(dialogOf(element).returnValue).toBe('cancel');
});

// ---------------------------------------------------------------------------------------------
// [SC-013] Every declared part is present and targetable from outside the shadow root.
// ---------------------------------------------------------------------------------------------

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const element = await mount();
  element.showModal();
  await element.updateComplete;
  // Written out in FULL rather than built from a template literal: scripts/check-part-ratchet.mjs
  // scans test sources for the literal text `::part(<name>)`.
  const parts: readonly (readonly [string, string])[] = [
    ['dialog', 'sk-confirm-dialog::part(dialog) { outline-style: dashed; }'],
    ['title', 'sk-confirm-dialog::part(title) { outline-style: dashed; }'],
    ['body', 'sk-confirm-dialog::part(body) { outline-style: dashed; }'],
    ['actions', 'sk-confirm-dialog::part(actions) { outline-style: dashed; }'],
    ['cancel', 'sk-confirm-dialog::part(cancel) { outline-style: dashed; }'],
    ['confirm', 'sk-confirm-dialog::part(confirm) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of parts) {
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.append(style);
    try {
      const part = element.shadowRoot!.querySelector(`[part="${name}"]`);
      expect(part, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(part!).outlineStyle, `part="${name}" is not targetable`).toBe('dashed');
    } finally {
      style.remove();
    }
  }
  expect(parts).toHaveLength(6);
});

// ---------------------------------------------------------------------------------------------
// [SC-014] Style adoption: the button sheet precedes the generated local sheet; no <style> tag.
// ---------------------------------------------------------------------------------------------

test('[SC-014] the composed button sheet precedes the generated local sheet, and no style tag is injected', async () => {
  const element = await mount();
  const sheets = element.shadowRoot!.adoptedStyleSheets;
  expect(sheets).toHaveLength(2);
  expect(sheets[0]).toBe(buttonSheet);
  expect(sheets[1]).toBe(skConfirmDialogSheet);
  expect(element.shadowRoot!.querySelectorAll('style')).toHaveLength(0);
});

// ---------------------------------------------------------------------------------------------
// [SC-015] Registry guard: a second `define()` warns and no-ops rather than throwing.
// ---------------------------------------------------------------------------------------------

test('[SC-015] guarded module registration warns only for a different constructor', () => {
  const original = customElements.get('sk-confirm-dialog');
  expect(original).toBe(SkConfirmDialog);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  class Impostor extends HTMLElement {}
  define('sk-confirm-dialog', Impostor);
  expect(warn).toHaveBeenCalledOnce();
  expect(customElements.get('sk-confirm-dialog')).toBe(original);
  warn.mockClear();
  define('sk-confirm-dialog', SkConfirmDialog);
  expect(warn).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------------------------
// FR-004: the confirm control composes `.sk-button`; the consumer picks its tone. The element
// never applies or infers one itself.
// ---------------------------------------------------------------------------------------------

test('FR-004: the confirm control carries the consumer-chosen .sk-button tone; the element applies none by default', async () => {
  const noVariant = await mount(ATTRS);
  expect(confirmButton(noVariant).classList.contains('sk-button')).toBe(true);
  expect(confirmButton(noVariant).className).toBe('sk-confirm-dialog__confirm sk-button');
  noVariant.remove();

  const withVariant = await mount({ ...ATTRS, 'confirm-variant': 'primary' });
  expect(withVariant.confirmVariant).toBe('primary');
  expect(confirmButton(withVariant).classList.contains('sk-button--primary')).toBe(true);
});

// ---------------------------------------------------------------------------------------------
// FR-002: accessible name/description come from the supplied strings, within the same shadow
// root (ADR-9 §4 — a cross-root aria-describedby/aria-labelledby reference does not resolve).
// ---------------------------------------------------------------------------------------------

test('FR-002: aria-labelledby/aria-describedby resolve within the same shadow root', async () => {
  const element = await mount();
  const dialog = dialogOf(element);
  const labelledBy = dialog.getAttribute('aria-labelledby')!;
  const describedBy = dialog.getAttribute('aria-describedby')!;
  expect(element.shadowRoot!.getElementById(labelledBy)?.textContent).toBe(ATTRS['dialog-title']);
  expect(element.shadowRoot!.getElementById(describedBy)?.textContent).toBe(ATTRS.message);
});

// ---------------------------------------------------------------------------------------------
// FR-013 / NFR-004: LightMode actually renders light styling — asserted, not assumed (#93).
// ---------------------------------------------------------------------------------------------

test('LightMode: the dialog surface differs between the default and .sk-light themes', async () => {
  const seen = new Map<string, string>();
  for (const [theme, wrap] of [
    ['dark', false],
    ['light', true],
  ] as const) {
    const element = await mount();
    if (wrap) element.classList.add('sk-light');
    element.showModal();
    await element.updateComplete;
    seen.set(theme, getComputedStyle(dialogOf(element)).backgroundColor);
    element.remove();
  }
  assertThemesDiffered(seen);
});

// ---------------------------------------------------------------------------------------------
// NFR-001: interactive targets are at least 44x44px.
// ---------------------------------------------------------------------------------------------

test('NFR-001: the confirm and cancel controls each present at least a 44x44px target', async () => {
  const element = await mount();
  element.showModal();
  await element.updateComplete;
  for (const button of [confirmButton(element), cancelButton(element)]) {
    const box = button.getBoundingClientRect();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
