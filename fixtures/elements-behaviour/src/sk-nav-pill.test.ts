import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';

/**
 * <sk-nav-pill> — the first BEHAVIOURAL component on the ADR-8 base layer.
 *
 * These carry `behaviours.json` ids with `sk-nav-pill` as the SUBJECT. The synthetic
 * `sk-behaviour-fixture` already covers every one of these ids, so before the registry gained
 * a subject dimension this whole file could have been deleted with the floor reporter still
 * green — the certifying-absence shape this programme has hit ten times. See FR-010.
 */

type Pill = HTMLElement & {
  isOpen: boolean;
  open(invoker?: HTMLElement | null): void;
  close(): void;
  toggle(invoker?: HTMLElement | null): void;
  updateComplete: Promise<unknown>;
};

const mount = async (items = 4): Promise<Pill> => {
  const el = document.createElement('sk-nav-pill') as Pill;
  for (let i = 0; i < items; i += 1) {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = `Item ${i + 1}`;
    el.append(a);
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
};

const hamburger = (el: Pill) => el.shadowRoot!.querySelector('#hamburger') as HTMLButtonElement;

beforeEach(() => {
  document.body.innerHTML = '';
});

test('[SC-006] the toggle event fires exactly once per change, and not at all on a non-change', async () => {
  const el = await mount();
  const seen: unknown[] = [];
  el.addEventListener('sk-nav-pill-toggle', (e) => seen.push(e));

  el.open();
  await el.updateComplete;
  expect(seen.length, 'one open, one event').toBe(1);

  // Idempotence. Reflection plus a change event is the classic re-entry shape; a setter that
  // loops back through the attribute callback shows up here as a second event.
  el.open();
  await el.updateComplete;
  expect(seen.length, 'open() on an open panel must fire nothing').toBe(1);

  el.close();
  await el.updateComplete;
  expect(seen.length, 'one close, one more event').toBe(2);
});

test('[SC-007] the event carries the documented detail shape', async () => {
  const el = await mount();
  const details: Array<Record<string, unknown>> = [];
  el.addEventListener('sk-nav-pill-toggle', (e) => details.push((e as CustomEvent).detail));

  el.open();
  el.close();
  await el.updateComplete;

  expect(details.map((d) => d['open'])).toEqual([true, false]);
  // The REQUESTED state, documented as such — the event fires before the change so that
  // preventDefault has something to prevent.
  for (const d of details) expect(Object.keys(d)).toEqual(['open']);
});

test('[SC-008] the event is composed and bubbles as documented', async () => {
  const el = await mount();
  let evt: CustomEvent | null = null;
  // Listening on DOCUMENT, not on the element: a non-bubbling or non-composed event never
  // arrives here, which is the only way to tell the two flags actually hold.
  document.addEventListener('sk-nav-pill-toggle', (e) => void (evt = e as CustomEvent), {
    once: true,
  });
  hamburger(el).click();
  await el.updateComplete;

  expect(evt, 'the event must escape the shadow root and reach the document').not.toBe(null);
  expect(evt!.composed).toBe(true);
  expect(evt!.bubbles).toBe(true);
});

test('[SC-009] preventDefault demonstrably prevents the change', async () => {
  const el = await mount();
  el.addEventListener('sk-nav-pill-toggle', (e) => e.preventDefault());

  el.open();
  await el.updateComplete;

  // THE STATE, not the event. Asserting `defaultPrevented` proves the listener ran; it does
  // not prove the element honoured it.
  expect(el.isOpen, 'the panel must stay shut').toBe(false);
  expect(el.hasAttribute('open'), 'the attribute must not reflect an unmade change').toBe(false);
  expect(hamburger(el).getAttribute('aria-expanded')).toBe('false');
});

test('[SC-010] a property assigned before the definition loads is applied on upgrade', async () => {
  // A plain element the registry has not seen yet. Assigning creates an OWN property that
  // shadows the accessor the class installs on upgrade.
  const el = document.createElement('sk-nav-pill-late') as Pill;
  el.isOpen = true;
  document.body.append(el);

  const { SkNavPill } = (await import('@spec-kitty/elements')) as unknown as {
    SkNavPill: CustomElementConstructor;
  };
  customElements.define('sk-nav-pill-late', class extends SkNavPill {});
  await customElements.whenDefined('sk-nav-pill-late');
  await el.updateComplete;

  expect(el.isOpen, 'the pre-upgrade assignment must survive').toBe(true);
  expect(el.hasAttribute('open'), 'and must reach the reflected attribute').toBe(true);
});

test('[SC-012] Escape closes, focus returns to the recorded invoker, aria-expanded tracks state', async () => {
  const el = await mount();
  const outside = document.createElement('button');
  outside.textContent = 'consumer control';
  document.body.append(outside);

  // Opened from a CONSUMER's control, not the internal hamburger. `open()` is public, so
  // returning focus to the hamburger would be wrong here — and is the assumption the old
  // global helper baked in.
  outside.focus();
  el.open();
  await el.updateComplete;
  expect(el.isOpen).toBe(true);
  expect(hamburger(el).getAttribute('aria-expanded')).toBe('true');

  // Focus inside the panel, as a keyboard user would have it.
  (el.querySelector('a') as HTMLAnchorElement).focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await el.updateComplete;

  expect(el.isOpen, 'Escape must close').toBe(false);
  expect(hamburger(el).getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement, 'focus returns to the invoker').toBe(outside);
});

test('[SC-012] Escape on a closed panel does nothing and does not steal focus', async () => {
  const el = await mount();
  const outside = document.createElement('button');
  document.body.append(outside);
  outside.focus();

  const seen: unknown[] = [];
  el.addEventListener('sk-nav-pill-toggle', (e) => seen.push(e));
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await el.updateComplete;

  expect(seen.length, 'no state change, no event').toBe(0);
  expect(document.activeElement, 'focus must not move').toBe(outside);
});

test('the items are authored once and reach the one slot (FR-006)', async () => {
  const el = await mount(4);
  const slot = el.shadowRoot!.querySelector('slot') as HTMLSlotElement;
  expect(slot.assignedElements().length, 'all four links reach the single slot').toBe(4);
  expect(el.shadowRoot!.querySelectorAll('slot').length, 'exactly one slot').toBe(1);
  // The control names a target in ITS OWN ROOT — ADR-9's cross-root finding.
  const target = hamburger(el).getAttribute('aria-controls')!;
  expect(el.shadowRoot!.getElementById(target), 'aria-controls resolves within the root').not.toBe(
    null,
  );
});

test('two pills on one page are independent — there is no document-level singleton', async () => {
  const a = await mount();
  const b = await mount();
  a.open();
  await a.updateComplete;
  await b.updateComplete;
  expect(a.isOpen).toBe(true);
  expect(b.isOpen, 'the second pill must be untouched').toBe(false);
});

test('the invoker leaving the DOM while open does not throw on close', async () => {
  const el = await mount();
  const outside = document.createElement('button');
  document.body.append(outside);
  outside.focus();
  el.open();
  await el.updateComplete;

  outside.remove();
  expect(() => el.close()).not.toThrow();
  await el.updateComplete;
  expect(el.isOpen).toBe(false);
});

test('[SC-013] every declared ::part() is present and targetable from outside', async () => {
  const el = await mount();
  // LITERAL selectors, one per part, not a loop over a name list. scripts/check-part-ratchet.mjs
  // scans test sources for the literal `::part(<name>)` string, so a dynamically built selector
  // satisfies the assertion at runtime and leaves the ratchet reporting the part as untested —
  // measured, and the reason this test is written out rather than parameterised.
  const style = document.createElement('style');
  style.textContent = `
    sk-nav-pill::part(nav) { outline-style: dashed; }
    sk-nav-pill::part(items) { outline-style: dotted; }
    sk-nav-pill::part(hamburger) { outline-style: double; }
  `;
  document.head.append(style);
  try {
    const seen = (name: string) => {
      const node = el.shadowRoot!.querySelector(`[part~="${name}"]`) as HTMLElement | null;
      expect(node, `part "${name}" is declared but absent from the shadow tree`).not.toBe(null);
      return getComputedStyle(node!).outlineStyle;
    };
    // Targetable, not merely present: a distinct value per part, so one rule matching
    // everything cannot pass for three.
    expect(seen('nav'), '::part(nav) is not reachable from outside').toBe('dashed');
    expect(seen('items'), '::part(items) is not reachable from outside').toBe('dotted');
    expect(seen('hamburger'), '::part(hamburger) is not reachable from outside').toBe('double');
  } finally {
    style.remove();
  }
});
