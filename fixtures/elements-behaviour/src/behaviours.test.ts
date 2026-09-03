import { beforeEach, expect, test, vi } from 'vitest';
import './sk-behaviour-fixture.js';
import type { SkBehaviourFixture } from './sk-behaviour-fixture.js';

/**
 * The twelve fixture-owned required behaviours (ADR-11, FR-007).
 *
 * Every test name carries its `behaviours.json` id in brackets — the floor reporter reads
 * those, and the mutation harness matches on them. Rename a title freely; do not touch the
 * id.
 *
 * Not here, deliberately: "it renders" assertions, shadow-DOM snapshots, tests of Lit's own
 * reactivity, assertions on internal class names (C-003). Each test below breaks when the
 * behaviour breaks, and the mutation harness proves that rather than asserting it.
 */

let el: SkBehaviourFixture;
let form: HTMLFormElement;

beforeEach(async () => {
  document.body.innerHTML = '';
  form = document.createElement('form');
  el = document.createElement('sk-behaviour-fixture') as SkBehaviourFixture;
  el.setAttribute('name', 'fixture');
  form.append(el);
  document.body.append(form);
  await el.updateComplete;
});

const submitData = () => new FormData(form);

test('[SC-002] a native form submit produces the expected FormData entry', async () => {
  el.value = 'hello';
  await el.updateComplete;
  expect(submitData().get('fixture')).toBe('hello');
});

test('[SC-003] setValidity blocks submission and the message reaches the a11y tree', async () => {
  el.value = 'invalid';
  await el.updateComplete;
  el.validate();
  expect(el.matches(':invalid')).toBe(true);
  expect(form.checkValidity()).toBe(false);
  // The message must be readable, not merely set — this is the half a validity flag alone
  // does not give you.
  expect(el.validationMessage).toContain('must not be');
});

test('[SC-004] a form reset restores the initial value', async () => {
  el.value = 'changed';
  await el.updateComplete;
  form.reset();
  await el.updateComplete;
  expect(el.value).toBe('');
  expect(submitData().get('fixture')).toBe('');
});

test('[SC-005] a disabled control is excluded from submission', async () => {
  el.value = 'hello';
  await el.updateComplete;
  el.formDisabledCallback(true);
  await el.updateComplete;
  expect(submitData().get('fixture')).toBeNull();
});

test('[SC-006] the documented event fires exactly once', async () => {
  const spy = vi.fn();
  el.addEventListener('sk-toggle', spy);
  el.toggle();
  // toHaveBeenCalledTimes(1), NOT toHaveBeenCalled() — the latter passes on 1 AND on 2,
  // which is the defect this criterion exists to catch.
  expect(spy).toHaveBeenCalledTimes(1);
});

test('[SC-007] the event carries the documented detail shape', async () => {
  let detail: unknown;
  el.addEventListener('sk-toggle', (e) => { detail = (e as CustomEvent).detail; });
  el.toggle();
  expect(detail).toEqual({ open: true, label: 'fixture' });
});

test('[SC-008] the event is composed and bubbles, as documented', async () => {
  let seen: Event | undefined;
  document.body.addEventListener('sk-toggle', (e) => { seen = e; });
  el.toggle();
  // Observed from OUTSIDE the element, which is what composed+bubbles actually buys.
  expect(seen).toBeDefined();
  expect(seen!.composed).toBe(true);
  expect(seen!.bubbles).toBe(true);
});

test('[SC-009] preventDefault demonstrably prevents', async () => {
  el.addEventListener('sk-toggle', (e) => e.preventDefault());
  expect(el.open).toBe(false);
  el.toggle();
  await el.updateComplete;
  // Not "the event was cancelable" — the state must actually be unchanged.
  expect(el.open).toBe(false);
});

test('[SC-010] a property assigned BEFORE the definition loads is applied on upgrade', async () => {
  // The real no-build shape: the element exists in markup and script order is not
  // controlled, so a property lands on a plain HTMLElement first.
  const raw = document.createElement('sk-behaviour-fixture-late');
  (raw as unknown as Record<string, unknown>)['label'] = 'set-before-upgrade';
  document.body.append(raw);

  class Late extends (customElements.get('sk-behaviour-fixture') as CustomElementConstructor) {}
  customElements.define('sk-behaviour-fixture-late', Late);
  customElements.upgrade(raw);
  await (raw as unknown as SkBehaviourFixture).updateComplete;

  expect((raw as unknown as SkBehaviourFixture).label).toBe('set-before-upgrade');
  expect(raw.shadowRoot!.textContent).toContain('set-before-upgrade');
});

test('[SC-011] content reaches the intended slot, and fallback appears when it is empty', async () => {
  el.open = true;
  await el.updateComplete;
  const slot = el.shadowRoot!.querySelector('slot[name="panel"]') as HTMLSlotElement;

  // Empty: NOTHING is assigned, and the fallback is what paints. Note the two calls are
  // not interchangeable — `{flatten: true}` RETURNS the fallback when nothing is assigned,
  // so it can never be 0 here and asserting that it is tests nothing about assignment.
  expect(slot.assignedNodes().length).toBe(0);
  expect(slot.assignedNodes({ flatten: true }).map((n) => n.textContent).join('')).toContain(
    'no panel content',
  );

  // Filled: the assigned node is the one that paints, in the intended slot.
  const panel = document.createElement('span');
  panel.slot = 'panel';
  panel.textContent = 'real panel';
  el.append(panel);
  await el.updateComplete;
  expect(slot.assignedNodes()).toContain(panel);
});

test('[SC-012] Escape closes, focus returns to the invoker, and aria-expanded tracks state', async () => {
  const trigger = el.shadowRoot!.querySelector('[part="trigger"]') as HTMLButtonElement;
  el.toggle();
  await el.updateComplete;
  expect(trigger.getAttribute('aria-expanded')).toBe('true');

  const control = el.shadowRoot!.querySelector('[part="control"]') as HTMLElement;
  control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await el.updateComplete;

  expect(el.open).toBe(false);
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(el.shadowRoot!.activeElement).toBe(trigger);
});

test('[SC-013] every declared ::part() is present and targetable from outside', async () => {
  // Targetable, not merely present: a document-level rule must reach through the shadow
  // boundary. That is the regression an internal rename causes, and nothing else in the
  // pipeline detects it.
  const style = document.createElement('style');
  style.textContent = `sk-behaviour-fixture::part(trigger) { outline-style: dotted; }`;
  document.head.append(style);
  try {
    const trigger = el.shadowRoot!.querySelector('[part="trigger"]') as HTMLElement;
    expect(trigger).toBeTruthy();
    expect(getComputedStyle(trigger).outlineStyle).toBe('dotted');
  } finally {
    style.remove();
  }
});
