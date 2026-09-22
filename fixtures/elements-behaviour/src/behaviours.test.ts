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
  // ...and it must be ANCHORED to a focusable element, which is what actually puts it in
  // front of a user. Dropping setValidity's third argument left every assertion above green
  // — found at the second gate pass. reportValidity() focuses the anchor, so this is the
  // arm that notices.
  const trigger = el.shadowRoot!.querySelector('[part="trigger"]') as HTMLElement;
  const panel = el.shadowRoot!.querySelector('[part="panel"]') as HTMLElement;
  panel.tabIndex = -1;
  panel.focus();                       // focus is elsewhere first, or "moves to" proves nothing
  form.reportValidity();
  expect(el.shadowRoot!.activeElement, 'the validity message is not anchored to a control').toBe(
    trigger,
  );
});

test('[SC-004] a form reset restores the initial value', async () => {
  // Seeded NON-EMPTY on purpose. `#initialValue` is captured in connectedCallback, and
  // beforeEach appends without a value — so the initial value was always '', which is both
  // the correct restored value AND what any blanking regression produces. A lens showed
  // `formResetCallback() { this.value = ''; }` passing the old assertion.
  const seeded = document.createElement('sk-behaviour-fixture') as SkBehaviourFixture;
  seeded.setAttribute('name', 'seeded');
  seeded.setAttribute('value', 'seed');
  form.append(seeded);
  await seeded.updateComplete;

  seeded.value = 'changed';
  await seeded.updateComplete;
  // Deliberately NOT asserting the FormData entry here. That would depend on the
  // value-TRACKING sync, which is SC-002's subject — and it made SC-002's mutation red this
  // test too, which the harness's collateral bound correctly refused. A criterion should
  // depend on its own behaviour and nothing else.
  expect(seeded.value).toBe('changed');

  form.reset();
  await seeded.updateComplete;
  expect(seeded.value).toBe('seed');
  expect(new FormData(form).get('seeded')).toBe('seed');
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
  // `label` is VARIED from the constructor default on purpose. With it left at 'fixture',
  // hardcoding `label: 'fixture'` in the detail passed — the test read back a constant
  // rather than the property. Found at the second gate pass.
  el.label = 'varied';
  await el.updateComplete;
  let detail: unknown;
  el.addEventListener('sk-toggle', (e) => { detail = (e as CustomEvent).detail; });
  el.toggle();
  expect(detail).toEqual({ open: true, label: 'varied' });
});

test('[SC-008] the event crosses a shadow boundary, as composed+bubbles promise', async () => {
  // ACROSS A REAL BOUNDARY. The earlier version listened on document.body with the fixture
  // in the light DOM — no boundary was crossed, so `bubbles` alone delivered it and
  // `expect(seen.composed).toBe(true)` merely read back the flag that had been set. A lens
  // pointed out the comment claimed a demonstration the test did not perform.
  const host = document.createElement('div');
  document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  const inner = document.createElement('sk-behaviour-fixture') as SkBehaviourFixture;
  root.append(inner);
  await inner.updateComplete;

  let seen: Event | undefined;
  document.addEventListener('sk-toggle', (e) => { seen = e; }, { once: true });
  inner.toggle();

  // Reaching `document` at all is only possible with composed:true — a bubbling but
  // non-composed event stops at the shadow root.
  expect(seen, 'the event did not escape the shadow root').toBeDefined();
  expect(seen!.composed).toBe(true);
  expect(seen!.bubbles).toBe(true);
  host.remove();
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
  // The real no-build shape: the element is in markup and script order is not controlled,
  // so the property lands on a plain HTMLElement first.
  //
  // Asserted on `hint`, which Lit does NOT manage. A reactive property would test Lit's own
  // upgrade handling — forbidden by C-003, and the mutation harness proved it: breaking the
  // element's dance for a reactive property changes nothing observable.
  const raw = document.createElement('sk-behaviour-fixture-late');
  (raw as unknown as Record<string, unknown>)['hint'] = 'set-before-upgrade';
  document.body.append(raw);

  class Late extends (customElements.get('sk-behaviour-fixture') as CustomElementConstructor) {}
  customElements.define('sk-behaviour-fixture-late', Late);
  customElements.upgrade(raw);
  await (raw as unknown as SkBehaviourFixture).updateComplete;

  // The value survives...
  expect((raw as unknown as { hint?: string }).hint).toBe('set-before-upgrade');
  // ...and it is reached through the prototype ACCESSOR, not a stale own property. That
  // second assertion is what makes this falsifiable: without the upgrade dance the own
  // property shadows the accessor, the setter never runs, and every later write is lost.
  expect(Object.prototype.hasOwnProperty.call(raw, 'hint')).toBe(false);
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

  // Focus must LEAVE first, or "returns to the invoker" is untested — nothing focuses
  // anything when the panel opens, so the old assertion proved only "Escape focuses the
  // trigger", which is strictly weaker than the criterion's name.
  const panel = el.shadowRoot!.querySelector('[part="panel"]') as HTMLElement;
  panel.tabIndex = -1;
  panel.focus();
  expect(el.shadowRoot!.activeElement).toBe(panel);

  const control = el.shadowRoot!.querySelector('[part="control"]') as HTMLElement;
  control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await el.updateComplete;

  expect(el.open).toBe(false);
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(el.shadowRoot!.activeElement, 'focus did not return to the invoker').toBe(trigger);
});

test('[SC-013] every declared ::part() is present and targetable from outside', async () => {
  // Targetable, not merely present: a document-level rule must reach through the shadow
  // boundary. That is the regression an internal rename causes, and nothing else in the
  // pipeline detects it.
  const style = document.createElement('style');
  style.textContent = `sk-behaviour-fixture::part(label) { outline-style: dotted; }`;
  document.head.append(style);
  try {
    const label = el.shadowRoot!.querySelector('[part="label"]') as HTMLElement;
    expect(label).toBeTruthy();
    expect(getComputedStyle(label).outlineStyle).toBe('dotted');
  } finally {
    style.remove();
  }
});
