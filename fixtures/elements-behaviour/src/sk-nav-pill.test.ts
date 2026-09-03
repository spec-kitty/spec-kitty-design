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
  // Listening on DOCUMENT proves `bubbles` STRUCTURALLY — a non-bubbling event dispatched on
  // the host never arrives here. It proves nothing about `composed`: the host is in the light
  // DOM, so the event reaches `document` either way. An earlier comment claimed the structural
  // check was "the only way to tell the two flags actually hold", which had it backwards, and
  // a lens measured it: flipping `composed` to false with the direct assertion removed left
  // the suite green. `composed` is proven by dispatching from INSIDE a shadow root below.
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

test('[SC-008] the event escapes a shadow boundary — the composed flag, proven structurally', async () => {
  // The host is in the light DOM, so listening on `document` cannot distinguish composed from
  // non-composed. Nesting the pill inside ANOTHER shadow root can: a non-composed event stops
  // at that boundary and never reaches the outer document.
  const wrapper = document.createElement('div');
  document.body.append(wrapper);
  const root = wrapper.attachShadow({ mode: 'open' });
  const el = document.createElement('sk-nav-pill') as Pill;
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = 'Item';
  el.append(a);
  root.append(el);
  await el.updateComplete;

  let reached = false;
  document.addEventListener('sk-nav-pill-toggle', () => void (reached = true), { once: true });
  el.open();
  await el.updateComplete;

  expect(reached, 'a non-composed event would stop at the wrapper shadow boundary').toBe(true);
});

test('[SC-006] toggle() closes an open panel — the one behaviour skToggleDrawer existed to provide', async () => {
  const el = await mount();
  const seen: unknown[] = [];
  el.addEventListener('sk-nav-pill-toggle', (e) => seen.push(e));

  // From the element's own control, the way a user reaches it.
  hamburger(el).click();
  await el.updateComplete;
  expect(el.isOpen, 'the first activation opens').toBe(true);

  hamburger(el).click();
  await el.updateComplete;
  expect(el.isOpen, 'the SECOND activation must close — this survived deletion untested').toBe(false);
  expect(hamburger(el).getAttribute('aria-expanded')).toBe('false');
  expect(seen.length, 'one event per change, two changes').toBe(2);

  // And directly, so the method is covered independently of the control.
  el.toggle();
  await el.updateComplete;
  expect(el.isOpen).toBe(true);
  el.toggle();
  await el.updateComplete;
  expect(el.isOpen).toBe(false);
});

test('[SC-009] the event is dispatched BEFORE the state changes', async () => {
  // Documented in `@fires`, in the README table and in the class comment — and asserted
  // nowhere until a lens mutated the element to change state first and revert on cancel,
  // which every existing test survived because they only read the FINAL state.
  const el = await mount();
  const stateAtDispatch: boolean[] = [];
  el.addEventListener('sk-nav-pill-toggle', () => stateAtDispatch.push(el.isOpen));

  el.open();
  await el.updateComplete;
  el.close();
  await el.updateComplete;

  // Opening: still closed when the listener runs. Closing: still open.
  expect(stateAtDispatch, 'a listener must see the state it can still prevent').toEqual([false, true]);
});

test('[SC-012] Escape on a closed panel does not CONSUME the key', async () => {
  // The guard at sk-nav-pill.ts's #onKeydown says why: "Consumers nest these inside dialogs;
  // stealing the key from an outer handler is the easy bug here." Deleting that guard left
  // the older test green — #setOpen is idempotent, so close() on a closed panel fires nothing
  // and never focuses. The property that was never asserted is that the key is not consumed.
  const el = await mount();

  const closed = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  el.dispatchEvent(closed);
  await el.updateComplete;
  expect(closed.defaultPrevented, 'a closed panel must leave Escape for an outer handler').toBe(false);

  el.open();
  await el.updateComplete;
  const open = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  el.dispatchEvent(open);
  await el.updateComplete;
  expect(open.defaultPrevented, 'an open panel consumes the key it acts on').toBe(true);
  expect(el.isOpen).toBe(false);
});

test('[SC-012] the invoker is resolved through the composed path, not from document.activeElement', async () => {
  // `document.activeElement` reports the HOST at each shadow level, so a control inside
  // another element's shadow root reads as that element, not as the button. The walk in
  // #activeControl exists for this and was covered by nothing: the existing focus-return test
  // focuses a light-DOM button, where the walk never runs.
  const el = await mount();
  const wrapper = document.createElement('div');
  document.body.append(wrapper);
  const root = wrapper.attachShadow({ mode: 'open' });
  const inner = document.createElement('button');
  inner.textContent = 'consumer control in a shadow root';
  root.append(inner);
  inner.focus();

  expect(document.activeElement, 'precondition: activeElement reports the host').toBe(wrapper);

  el.open();
  await el.updateComplete;

  // MOVE FOCUS AWAY before closing. Without this the test is fakeable and a lens's mutation
  // proved it: drop the walk and #invoker becomes the WRAPPER host, whose .focus() silently
  // does nothing on a non-focusable <div> — so focus never left `inner` and the assertion
  // passed while the behaviour was gone. Focus has to be somewhere else for "returns" to mean
  // anything.
  const elsewhere = document.createElement('button');
  document.body.append(elsewhere);
  elsewhere.focus();
  expect(root.activeElement, 'precondition: focus has left the shadow control').not.toBe(inner);

  el.close();
  await el.updateComplete;

  expect(
    document.activeElement,
    'the recorded invoker must be the wrapper the button lives in, not something else',
  ).toBe(wrapper);
  expect(
    root.activeElement,
    'focus must return to the button itself, not stop at the wrapper host',
  ).toBe(inner);
});

test('[SC-013] the label reaches a real navigation LANDMARK, not just an attribute', async () => {
  // apps/demo/dashboard-demo.html sets label="Dashboard navigation" and expects it to land.
  //
  // The first version of this test asserted `nav.getAttribute('aria-label')` — a raw attribute
  // string, which a role-less <div> carries just as happily while contributing no accessible
  // name at all. A pass-2 lens changed the <nav> to a <div> and everything stayed green:
  // 45 tests, Playwright 10/10, axe zero across 83 stories, manifest no-drift. The landmark
  // and its name were both gone. Assert the element, not the attribute.
  const el = await mount();
  el.setAttribute('label', 'Dashboard navigation');
  await el.updateComplete;

  const nav = el.shadowRoot!.querySelector('[part="nav"]') as HTMLElement;
  expect(nav.tagName, 'the pill must be a navigation landmark').toBe('NAV');
  expect(nav.getAttribute('aria-label')).toBe('Dashboard navigation');
  // And reachable as a landmark from the composed tree, which is what a screen reader walks.
  expect(
    el.shadowRoot!.querySelector('nav[aria-label="Dashboard navigation"]'),
    'a named navigation landmark must exist in the shadow tree',
  ).not.toBe(null);
});

test('[SC-014] the element adopts its constructed sheet — no sheet is not "no styling"', async () => {
  // `static styles = []` survived every vitest lane: 44/44 green with the element shipping
  // completely unstyled, caught only by Playwright and axe downstream. SC-014 listed sk-stub
  // as its only subject, so nothing asserted adoption for this element.
  const el = await mount();
  const sheets = el.shadowRoot!.adoptedStyleSheets;
  expect(sheets.length, 'exactly one constructed sheet, per ADR-10 Confirmation #1').toBe(1);
  expect(el.shadowRoot!.querySelectorAll('style').length, "kitty-desktop's CSP forbids <style>").toBe(0);
  // PROVENANCE, not just presence: the sheet must be the one generated from @spec-kitty/styles.
  // Asserting `length === 1` alone passes for any sheet, including a hand-authored one.
  // Array.from, not spread: CSSRuleList is array-LIKE and has no Symbol.iterator in lib.dom.
  const text = Array.from(sheets[0]!.cssRules, (r) => r.cssText).join('\n');
  expect(text, 'the adopted sheet must be the nav-pill sheet').toContain('sk-nav-pill');
  expect(text, 'and must carry the drawer sheet too — the component ships two').toContain('sk-nav-pill__hamburger');
});

test('[SC-013] the hamburger keeps an accessible name in both states', async () => {
  // Its only child is aria-hidden, so without a label it is a nameless button. Nothing in
  // vitest covered it, and the axe gate cannot: no story renders below the 720px breakpoint,
  // so the collapsed control is never evaluated. Caught only by the Playwright spec.
  const el = await mount();
  const btn = hamburger(el);
  expect(btn.getAttribute('aria-label')).toBe('Open navigation');
  expect(btn.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');

  el.open();
  await el.updateComplete;
  expect(btn.getAttribute('aria-label'), 'the name must track state').toBe('Close navigation');
});
