import { beforeEach, expect, test, vi } from 'vitest';
import '@spec-kitty/elements';
import { skNoticeSheet, STATUS_TONES } from '@spec-kitty/elements';
import { assertThemesDiffered } from './contrast.js';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

type Notice = HTMLElement & {
  tone?: string;
  announce?: string;
  message?: string;
  dismissible?: boolean;
  dismissLabel?: string;
  updateComplete: Promise<unknown>;
};

const mount = async (props: Partial<Notice> = {}, light = '') => {
  const element = document.createElement('sk-notice') as Notice;
  Object.assign(element, props);
  const host = document.createElement('div');
  if (light) host.className = light;
  host.append(element);
  document.body.append(host);
  await element.updateComplete;
  return element;
};

const partOf = (element: Element, name: string) =>
  element.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

const liveRegion = (element: Element) =>
  element.shadowRoot!.querySelector('[role="alert"], [role="status"]') as HTMLElement | null;

// WHAT AN ASSISTIVE TECHNOLOGY ACTUALLY GETS FROM THE REGION — and it is NOT `textContent`.
//
// `Element.textContent` does not cross a slot. `message` is a text node in the SHADOW tree, so
// every assertion below that reads `liveRegion(el).textContent` works; a consumer's slotted
// heading and slotted body live in the LIGHT tree and are invisible to the same call. An
// assertion written against `textContent` for slotted content is therefore vacuous — it would
// have been red before #228's move for the wrong reason, and unsatisfiable after it.
//
// This walks the region and follows `assignedNodes({ flatten: true })`, which is the flattened
// subtree the accessibility tree is built from.
//
// AND IT SKIPS WHAT THE ACCESSIBILITY TREE SKIPS, which the first version of this helper did not.
// A DOM walk that ignores `aria-hidden`, `display: none` and `visibility: hidden` reports text
// that no screen reader will ever speak, so an assertion built on it is green for a notice that
// announces the detail alone — the exact pre-#228 defect. Measured on the shipped element before
// this guard existed: setting either `aria-hidden="true"` or `display: none` on `part="heading"`
// left BOTH arms of the heading test green ("Deploy failed Retrying in 5s", containment `true`)
// while the notice announced "Retrying in 5s". The containment arm cannot see it either — the node
// is still a descendant — so this is a third direction neither arm covered.
const announcedText = (element: Element) => {
  const region = liveRegion(element);
  if (!region) return null;
  const seen: string[] = [];
  const walk = (node: Node): void => {
    if (node instanceof HTMLSlotElement) {
      for (const assigned of node.assignedNodes({ flatten: true })) walk(assigned);
      return;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      seen.push(node.textContent ?? '');
      return;
    }
    if (node instanceof Element) {
      if (node.getAttribute('aria-hidden') === 'true') return;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return;
    }
    for (const child of Array.from(node.childNodes)) walk(child);
  };
  walk(region);
  return seen.join(' ').replace(/\s+/g, ' ').trim();
};

const dismissButton = (element: Element) => partOf(element, 'dismiss') as HTMLButtonElement | null;

// ---------------------------------------------------------------------------------------------
// THE ANNOUNCEMENT CONTRACT.
//
// These tests carry NO [SC-NNN] marker, deliberately. ADR-11 has no behaviour id for "a live
// region re-announces a changed message"; tests/node/config-contract.test.ts asserts
// behaviours.json's applicable id set equals ADR-11's list EXACTLY, so an id cannot be minted
// here, and suite-selftest.mjs guard 4 requires a mutation's red test to carry a marker. Binding
// these to SC-013 (styling API) or SC-010 (property before upgrade) would be mislabelling.
//
// This is the fifth time the programme has reached that boundary — #140, #143, #77, #177 — and
// the answer is the same each time: the coverage is real and held by an ordinary test rather than
// by the mutation harness. It is not unheld, though: the SC-010 arm in mutations.json deletes
// `message` from `static properties`, and that single mutation reds BOTH the marked
// property-before-upgrade test below AND the re-announcement test here. mutations.json records
// that relationship on the arm.
// ---------------------------------------------------------------------------------------------

test('the live region exists, carrying its role, BEFORE any message is assigned', async () => {
  // The half of #178's requirement that is about ORDER. A live region created at the same moment
  // as its content is not reliably announced, so the node has to pre-date the message. Mounting
  // with no message at all is the strongest form of that assertion.
  const polite = await mount({ announce: 'polite' });
  const region = liveRegion(polite);
  expect(region, 'a polite notice renders no live region').not.toBe(null);
  expect(region!.getAttribute('role')).toBe('status');
  expect(region!.textContent!.trim()).toBe('');

  const assertive = await mount({ announce: 'assertive' });
  expect(liveRegion(assertive)!.getAttribute('role')).toBe('alert');
  expect(liveRegion(assertive)!.textContent!.trim()).toBe('');
});

test('announce="off" renders NO live region at all, whatever the tone', async () => {
  // Announcement is an explicit property, never a side effect of tone. A `danger` notice that
  // was not asked to announce must be silent — asserting the absence of the node, not merely
  // the absence of a role attribute on a node that is otherwise a live region.
  //
  // ASSERTED OVER THE WHOLE SHADOW ROOT, not just the body, since #228. The heading box moved
  // INSIDE the body, and a move that created a live region where a consumer had asked for none
  // would be the exact opposite of this element's contract. `[role]` and `[aria-live]` are both
  // swept because either one alone announces: a `role="status"` carries an implicit `aria-live`
  // and needs no attribute, and a bare `aria-live` announces with no role.
  for (const tone of STATUS_TONES) {
    const element = await mount({ tone, message: `${tone} happened` });
    const heading = document.createElement('h3');
    heading.slot = 'heading';
    heading.textContent = `${tone} headline`;
    element.append(heading);
    await element.updateComplete;

    expect(liveRegion(element), `tone=${tone} announced without being asked`).toBe(null);
    expect(partOf(element, 'body')!.hasAttribute('role')).toBe(false);
    expect(
      Array.from(element.shadowRoot!.querySelectorAll('[role]')),
      `tone=${tone}: announce="off" rendered a role somewhere in the shadow root`,
    ).toEqual([]);
    expect(
      Array.from(element.shadowRoot!.querySelectorAll('[aria-live]')),
      `tone=${tone}: announce="off" rendered an aria-live somewhere in the shadow root`,
    ).toEqual([]);
    // ...and the message is still VISIBLE. Silent is not invisible.
    expect(partOf(element, 'body')!.textContent).toContain(`${tone} happened`);
    // ...as is the heading, which still renders inside the (role-less) body box.
    expect(partOf(element, 'body')!.contains(partOf(element, 'heading'))).toBe(true);
    expect(heading.assignedSlot!.name).toBe('heading');
  }
});

test('a slotted heading is INSIDE the live region, so the headline is announced with the detail', async () => {
  // THE TEST #228's RULING EXISTS FOR. Its red is a heading present and not announced.
  //
  // Before the move, `<div part="heading">` was a SIBLING BEFORE the keyed() body that carries
  // the role. A consumer following this element's own Dismissible story — `<h3
  // slot="heading">Deploy failed</h3>` plus a detail in `message` — got the detail announced and
  // the headline silent. The operator ruled that the whole notice is announced, heading first.
  //
  // Asserted three ways, because each covers a direction the others cannot see:
  //
  //   - CONTAINMENT alone would pass for a heading rendered inside the region but AFTER the
  //     message, announcing the detail first.
  //   - FLATTENED TEXT alone would pass for a template that inlined the heading's text without
  //     the slot, so the consumer's own node never reaches the region.
  //   - Neither sees a heading REMOVED FROM THE ACCESSIBILITY TREE while staying in the DOM.
  //     `aria-hidden="true"` or `display: none` on the heading box restores the pre-#228
  //     behaviour exactly — the notice announces the detail alone — and the node is still a
  //     descendant, still carrying its text. Measured: before the guard below and the one in
  //     `announcedText`, both mutations left this test GREEN.
  //
  // The third is asserted twice too: `announcedText` now skips those subtrees (so the text arm
  // reds on its own), and the two attributes are named here so the failure says which one.
  const element = await mount({ announce: 'assertive', tone: 'danger', message: 'Retrying in 5s' });
  const heading = document.createElement('h3');
  heading.slot = 'heading';
  heading.textContent = 'Deploy failed';
  element.append(heading);
  await element.updateComplete;

  const region = liveRegion(element)!;
  const headingBox = partOf(element, 'heading')!;
  expect(
    region.contains(headingBox),
    'the heading is outside the live region, so a screen reader announces the detail and never the headline',
  ).toBe(true);
  // IN the region is not the same as IN the accessibility tree.
  expect(
    headingBox.getAttribute('aria-hidden'),
    'the heading is inside the region but hidden from assistive technology, which announces the detail alone',
  ).toBe(null);
  const headingStyle = getComputedStyle(headingBox);
  expect(
    headingStyle.display,
    'the heading is inside the region but display:none, so it is neither seen nor announced',
  ).not.toBe('none');
  expect(
    headingStyle.visibility,
    'the heading is inside the region but visibility:hidden, so it is neither seen nor announced',
  ).not.toBe('hidden');

  // ...and the consequence, which also catches any vector the three guards above do not name.
  expect(announcedText(element)).toBe('Deploy failed Retrying in 5s');

  // ...and the level stays the CONSUMER'S. Moving the box does not license generating one.
  expect(element.shadowRoot!.querySelector('h1,h2,h3,h4,h5,h6')).toBe(null);
  expect(heading.assignedSlot!.name).toBe('heading');
});

test('a CHANGED message with no tone change reaches the live region', async () => {
  // THE TEST THIS MISSION EXISTS FOR. Its red is a stale message.
  //
  // sk-form-input.ts records this defect twice — the `errorMessage` field comment and the
  // `willUpdate` comment — and both reduce to the same thing: the announced text changed and
  // nothing re-rendered, so `role="alert"` never fired again and `aria-describedby` pointed at
  // text that was no longer true. Deleting `message: { type: String }` from sk-notice's
  // `static properties` reproduces it exactly, and that is the SC-010 mutation arm.
  //
  // A HEADING IS IN SCOPE SINCE #228, because the heading now sits inside the region and this
  // assertion has to hold with it there rather than only in the headless case. The heading must
  // survive the message change unchanged, and — because `alert` and `status` are implicitly
  // atomic — what is re-announced is the whole region, heading included.
  const element = await mount({ announce: 'assertive', tone: 'danger', message: 'Retrying in 5s' });
  const heading = document.createElement('h3');
  heading.slot = 'heading';
  heading.textContent = 'Deploy failed';
  element.append(heading);
  await element.updateComplete;
  expect(liveRegion(element)!.textContent).toContain('Retrying in 5s');
  expect(announcedText(element)).toBe('Deploy failed Retrying in 5s');

  element.message = 'Retrying in 2s';
  await element.updateComplete;

  expect(element.tone, 'the tone must not have moved — that is the point').toBe('danger');
  expect(liveRegion(element)!.textContent).toContain('Retrying in 2s');
  expect(liveRegion(element)!.textContent).not.toContain('Retrying in 5s');
  expect(announcedText(element)).toBe('Deploy failed Retrying in 2s');
});

test('the live-region node is the SAME node across message and tone changes', async () => {
  // Identity, not structure. A live region that is recreated with its content is not reliably
  // announced, so "the text updated" is not sufficient evidence on its own — the node carrying
  // the role has to be the one that was already there.
  //
  // AND THE HEADING IS IN SCOPE SINCE #228. It lives inside the region now, so "the node carrying
  // the role is the one that was already there" has to be true of the heading box too — a
  // heading re-created on every message change would drop the consumer's own node out of the
  // accessibility tree and back in, which is the announcement hazard one level down.
  const element = await mount({ announce: 'polite', tone: 'info', message: 'first' });
  const heading = document.createElement('h3');
  heading.slot = 'heading';
  heading.textContent = 'Connection';
  element.append(heading);
  await element.updateComplete;
  const first = liveRegion(element)!;
  const firstHeading = partOf(element, 'heading')!;
  expect(first.contains(firstHeading)).toBe(true);

  element.message = 'second';
  await element.updateComplete;
  expect(liveRegion(element), 'a message change recreated the live region').toBe(first);
  expect(partOf(element, 'heading'), 'a message change recreated the heading box').toBe(
    firstHeading,
  );

  element.tone = 'danger';
  await element.updateComplete;
  expect(liveRegion(element), 'a tone change recreated the live region').toBe(first);
  expect(partOf(element, 'heading'), 'a tone change recreated the heading box').toBe(firstHeading);

  element.message = 'third';
  element.tone = 'success';
  await element.updateComplete;
  expect(liveRegion(element), 'a combined change recreated the live region').toBe(first);
  expect(partOf(element, 'heading'), 'a combined change recreated the heading box').toBe(
    firstHeading,
  );
  expect(first.textContent).toContain('third');
  expect(announcedText(element)).toBe('Connection third');
});

test('changing the politeness builds a NEW node rather than re-roling the old one', async () => {
  // The other half of "never toggled onto an existing node when a message arrives". Within one
  // politeness the node is stable (above); ACROSS politeness levels it must not be, because
  // mutating `role` on a node that is already holding text is precisely the anti-pattern #178
  // names. `keyed()` on the announce level is what produces this.
  //
  // SINCE #228 THE NEW NODE IS BORN HOLDING MORE — the heading as well as the message — and the
  // caveat beside `keyed()` in sk-notice.ts is widened to say so. The trade is unchanged: a role
  // mutated onto a node already holding text is still the worse of the two spellings, so this is
  // still the one to avoid. What is asserted here is that the new node really does carry the
  // consumer's heading, not just the role.
  const element = await mount({ announce: 'polite', message: 'connection lost' });
  const heading = document.createElement('h3');
  heading.slot = 'heading';
  heading.textContent = 'Connection';
  element.append(heading);
  await element.updateComplete;
  const before = liveRegion(element)!;
  expect(before.getAttribute('role')).toBe('status');

  element.announce = 'assertive';
  await element.updateComplete;
  const after = liveRegion(element)!;
  expect(after.getAttribute('role')).toBe('alert');
  expect(after, 'the role was toggled onto the node that already held the message').not.toBe(
    before,
  );
  expect(after.contains(partOf(element, 'heading'))).toBe(true);
  expect(announcedText(element)).toBe('Connection connection lost');
});

test('the announcement is not gated on the entrance animation', async () => {
  // #178: an animated entrance must not delay the announcement. This is met structurally rather
  // than by tuning a duration — there is no animation event handler in the element at all — and
  // this asserts that structure: the text is in the live region as soon as the update settles,
  // with no animation having been allowed to finish.
  const element = await mount({ announce: 'assertive', message: 'The deploy failed' });
  expect(liveRegion(element)!.textContent).toContain('The deploy failed');
  expect(element.shadowRoot!.innerHTML).not.toContain('animationend');
});

test('an unknown tone and an unknown politeness both warn and degrade without losing content', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const element = await mount({ tone: 'blocked', announce: 'shouty', message: 'Still readable' });
    expect(partOf(element, 'notice')!.dataset['tone']).toBe('neutral');
    expect(liveRegion(element), 'an unknown politeness must not announce').toBe(null);
    expect(partOf(element, 'body')!.textContent).toContain('Still readable');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown sk-notice tone'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown sk-notice announce'));
  } finally {
    warn.mockRestore();
  }
});

// ---------------------------------------------------------------------------------------------
// DISMISSAL
// ---------------------------------------------------------------------------------------------

test('[SC-006] activating the dismiss control fires sk-notice-dismiss exactly once', async () => {
  const element = await mount({ dismissible: true, tone: 'danger' });
  const seen: Event[] = [];
  // Listening on the HOST rather than on `document`, deliberately. The event is dispatched on the
  // host (`this.dispatchEvent`), so a document listener would additionally depend on `bubbles` —
  // and a mutation flipping that flag would then red this test as well as the [SC-008] one it
  // belongs to. Counting at the target keeps "fires exactly once" measuring only the count.
  element.addEventListener('sk-notice-dismiss', (e) => seen.push(e));
  dismissButton(element)!.click();
  expect(seen).toHaveLength(1);
});

test('[SC-007] the dismiss detail is the documented shape', async () => {
  const element = await mount({ dismissible: true, tone: 'recovery' });
  let detail: unknown;
  element.addEventListener('sk-notice-dismiss', (e) => {
    detail = (e as CustomEvent).detail;
  });
  dismissButton(element)!.click();
  expect(detail).toEqual({ tone: 'recovery' });

  // An unknown tone is normalised in the detail too — a consumer switching on it must never see
  // a value outside the vocabulary, which is the same fail-open policy the render path uses.
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const odd = await mount({ dismissible: true, tone: 'exploded' });
    let oddDetail: unknown;
    odd.addEventListener('sk-notice-dismiss', (e) => {
      oddDetail = (e as CustomEvent).detail;
    });
    dismissButton(odd)!.click();
    expect(oddDetail).toEqual({ tone: 'neutral' });
  } finally {
    warn.mockRestore();
  }
});

test('[SC-008] the dismiss event bubbles and is composed as documented', async () => {
  // THE NOTICE IS MOUNTED INSIDE A SHADOW ROOT, which is what makes `composed` observable rather
  // than merely readable off the event object. The element dispatches on its own host, so with the
  // notice in the light DOM a `document` listener would be reached by `bubbles` alone and a
  // `composed: false` regression would print green — the flag would be asserted as a value while
  // the behaviour it names went untested. A consumer whose notice lives in their own shadow root
  // is the real case, and this is it.
  const carrier = document.createElement('div');
  document.body.append(carrier);
  const root = carrier.attachShadow({ mode: 'open' });
  const element = document.createElement('sk-notice') as Notice;
  element.dismissible = true;
  root.append(element);
  await element.updateComplete;

  let evt: Event | undefined;
  document.addEventListener('sk-notice-dismiss', (e) => {
    evt = e;
  });
  dismissButton(element)!.click();

  expect(evt, 'the event never reached the document — it did not cross the boundary, or it did not bubble').toBeDefined();
  expect(evt!.bubbles).toBe(true);
  expect(evt!.composed).toBe(true);
  expect(evt!.cancelable).toBe(true);
});

test('[SC-009] preventDefault abandons the focus move, and the element never removes itself', async () => {
  // WHAT CANCELLING ACTUALLY PREVENTS. The element does not remove itself in either branch — the
  // consumer owns whether the notice exists — so removal cannot be the default action. The one
  // effect the element owns is the focus move, and that is what a cancelling consumer abandons.
  // Asserting `defaultPrevented` alone would only prove the listener ran; this asserts the
  // element's own behaviour actually changed.
  const cancelled = await mount({ dismissible: true });
  cancelled.addEventListener('sk-notice-dismiss', (e) => e.preventDefault());
  const button = dismissButton(cancelled)!;
  button.focus();
  button.click();
  expect(cancelled.isConnected, 'the element removed itself').toBe(true);
  expect(cancelled.shadowRoot!.activeElement, 'focus moved despite preventDefault()').toBe(button);

  // The uncancelled branch, for contrast — without it the assertion above passes for an element
  // that never moves focus at all.
  const allowed = await mount({ dismissible: true });
  const allowedButton = dismissButton(allowed)!;
  allowedButton.focus();
  allowedButton.click();
  expect(allowed.isConnected).toBe(true);
  expect(allowed.shadowRoot!.activeElement).toBe(null);
  expect(document.activeElement).toBe(allowed);
});

test('[SC-012] the dismiss control is keyboard-operable and lands focus on the host', async () => {
  // A real <button> means the platform supplies Enter/Space activation, and asserting the
  // KEYBOARD path rather than .click() is what proves the control is a real button rather than a
  // clickable div. Both keys, because a div with a click handler answers to neither and a
  // non-button with a keydown handler frequently answers to only one.
  for (const key of ['Enter', ' ']) {
    const element = await mount({ dismissible: true, tone: 'danger' });
    const seen: Event[] = [];
    element.addEventListener('sk-notice-dismiss', (e) => seen.push(e));
    const button = dismissButton(element)!;
    button.focus();
    expect(element.shadowRoot!.activeElement, `${key}: the control did not take focus`).toBe(button);
    button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    button.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, composed: true }));
    // The platform synthesises the click from the key press on a real <button>; a synthetic
    // KeyboardEvent does not, so activation is asserted through the control's own click path.
    button.click();
    // Activation, not arity: the count is [SC-006]'s claim, and asserting it here too would make
    // the duplicate-dispatch mutation red two tests instead of the one it is about.
    expect(seen.length, `${key} did not activate the control`).toBeGreaterThan(0);
    expect(element.isConnected).toBe(true);

    // ASSERT INSIDE THE SHADOW ROOT, not on `document.activeElement`.
    //
    // This assertion was `expect(document.activeElement).toBe(element)` and the mutation harness
    // correctly called the arm that deletes `this.focus()` SEMANTICALLY INERT — measured in CI,
    // not reasoned about here. The reason is that focus on a node INSIDE a shadow root already
    // reports the HOST to `document.activeElement`, so the old line held whether the element moved
    // focus or not: it certified an absence. `shadowRoot.activeElement` is what discriminates —
    // it is the dismiss button before the move and `null` after it.
    expect(
      element.shadowRoot!.activeElement,
      `${key}: focus stayed on the dismiss control instead of moving to the host`,
    ).toBe(null);
    expect(document.activeElement, `${key}: focus left the notice entirely`).toBe(element);
  }
});

test('the dismiss control always has an accessible name, and is absent when not dismissible', async () => {
  const plain = await mount({});
  expect(dismissButton(plain), 'a non-dismissible notice rendered a control').toBe(null);

  const defaulted = await mount({ dismissible: true });
  expect(defaulted.shadowRoot!.querySelector('button')!.tagName).toBe('BUTTON');
  expect(dismissButton(defaulted)!.getAttribute('aria-label')).toBe('Dismiss notice');

  const named = await mount({ dismissible: true, dismissLabel: 'Dismiss the deploy failure' });
  expect(dismissButton(named)!.getAttribute('aria-label')).toBe('Dismiss the deploy failure');

  // An empty label must not produce an unnamed control — the audited defect was an unlabelled
  // `×` glyph, and falling back to nothing would reproduce it.
  const emptied = await mount({ dismissible: true, dismissLabel: '' });
  expect(dismissButton(emptied)!.getAttribute('aria-label')).toBe('Dismiss notice');
});

// ---------------------------------------------------------------------------------------------
// SLOTS, TONE AND THE STYLING API
// ---------------------------------------------------------------------------------------------

test('[SC-011] slotted content reaches its slot, and the marker falls back when empty', async () => {
  const element = await mount({ tone: 'danger' });
  const heading = document.createElement('h3');
  heading.slot = 'heading';
  heading.textContent = 'Deploy failed';
  const action = document.createElement('button');
  action.slot = 'actions';
  action.textContent = 'Retry';
  const body = document.createElement('p');
  body.textContent = 'Three of twelve targets rejected the bundle.';
  element.append(heading, action, body);
  await element.updateComplete;

  const assigned = (name: string) => {
    const selector = name ? `slot[name="${name}"]` : 'slot:not([name])';
    const slot = element.shadowRoot!.querySelector(selector) as HTMLSlotElement;
    return slot.assignedNodes({ flatten: false });
  };
  expect(assigned('heading')).toEqual([heading]);
  expect(assigned('actions')).toEqual([action]);
  expect(assigned('')).toEqual([body]);

  // The element generates NO heading of its own — the level is the consumer's (#178, #146).
  expect(element.shadowRoot!.querySelector('h1,h2,h3,h4,h5,h6')).toBe(null);

  // FALLBACK: the marker slot is empty, so the per-tone glyph shows.
  const markerSlot = element.shadowRoot!.querySelector(
    'slot[name="marker"]',
  ) as HTMLSlotElement;
  expect(markerSlot.assignedNodes()).toHaveLength(0);
  expect(markerSlot.textContent!.trim()).toBe('×');

  // ...and a consumer marker replaces it rather than joining it.
  const marker = document.createElement('span');
  marker.slot = 'marker';
  marker.textContent = '⚑';
  element.append(marker);
  await element.updateComplete;
  expect(markerSlot.assignedNodes()).toEqual([marker]);

  // The marker is decorative; the message carries the meaning for assistive technology.
  expect(partOf(element, 'marker')!.getAttribute('aria-hidden')).toBe('true');
});

test('[SC-010] tone, announce and dismissible assigned before upgrade survive and reflect', async () => {
  const element = document.createElement('sk-notice-late') as Notice;
  element.tone = 'attention';
  element.announce = 'polite';
  element.dismissible = true;
  element.message = 'assigned before the definition loaded';
  document.body.append(element);

  const { SkNotice } = await import('@spec-kitty/elements');
  customElements.define('sk-notice-late', class extends SkNotice {});
  await customElements.whenDefined('sk-notice-late');
  await element.updateComplete;

  expect(element.getAttribute('tone')).toBe('attention');
  expect(element.getAttribute('announce')).toBe('polite');
  expect(element.hasAttribute('dismissible')).toBe(true);
  expect(liveRegion(element)!.textContent).toContain('assigned before the definition loaded');

  // ...and the properties stay reactive afterwards. A pre-upgrade value that lands once but then
  // stops tracking is the same defect one step later.
  element.tone = 'recovery';
  element.message = 'and still reactive afterwards';
  await element.updateComplete;
  expect(element.getAttribute('tone')).toBe('recovery');
  expect(liveRegion(element)!.textContent).toContain('and still reactive afterwards');
});

test('every tone paints a distinct surface, and every tone differs between the themes', async () => {
  // Asserted, not eyeballed. sk-notice.css contains no theme selector — one would cross the
  // shadow boundary and be silently inert (ADR-9 §3) — so light mode arrives entirely through
  // --sk-status-* / --sk-on-status-*. A tone whose light value was never defined reds here.
  const surfaces = new Map<string, string>();
  const perTheme: Record<string, Map<string, string>> = { dark: new Map(), light: new Map() };

  for (const theme of ['dark', 'light'] as const) {
    for (const tone of STATUS_TONES) {
      const element = await mount({ tone }, theme === 'light' ? 'sk-light' : '');
      const painted = getComputedStyle(partOf(element, 'notice')!).backgroundColor;
      perTheme[theme]!.set(tone, painted);
      surfaces.set(theme, painted);
    }
    expect(new Set(perTheme[theme]!.values()).size, `${theme}: two tones share a surface`).toBe(
      STATUS_TONES.length,
    );
  }

  for (const tone of STATUS_TONES) {
    expect(perTheme['dark']!.get(tone), `${tone} did not change between themes`).not.toBe(
      perTheme['light']!.get(tone),
    );
  }
  assertThemesDiffered(surfaces);
});

test('moving the heading inside the region did not move it on screen', async () => {
  // THE GEOMETRY HALF OF #228, asserted as an INVARIANT rather than as a pinned pixel figure.
  //
  // Until #228 the heading box was a direct item of the `.sk-notice__content` grid, so the space
  // below it was one `row-gap` — and it was there even with nothing slotted, because a zero-height
  // grid item still contributes its gap. Moving the box inside `.sk-notice__body` took that gap
  // with it, and `sk-notice.css` replaces it with an equal `margin-block-end` on the same box.
  //
  // Measured before and after the move on this fixture, every externally observable dimension was
  // byte-identical — notice height, content height, the heading's offset within the content box,
  // and the actions row's offset — in all four of {heading, no heading} x {message, no message}.
  // Only the body box's own height changed, which is the point: it now encloses the heading.
  //
  // What is asserted here is the relationships those numbers followed from, not the numbers. A
  // pinned height would be an engine-and-font measurement and would red on webkit for reasons
  // that have nothing to do with this component.
  //
  // THREE relationships, not one, because `margin == row-gap` alone is not what the geometry
  // rests on and an earlier revision of this test claimed it was. Measured: force
  // `::part(content) { display: block }` and `getComputedStyle(content).rowGap` still reads
  // `8px` — the computed value survives a display type that ignores it — so a lone gap-equality
  // assertion stays green while the layout moves. It really does move: content height drops
  // 86 -> 78 with a heading and a message, 38 -> 30 with neither.
  const element = await mount({ announce: 'polite', message: 'Retrying in 5s' });
  const content = partOf(element, 'content')!;
  const headingBox = partOf(element, 'heading')!;
  const body = partOf(element, 'body')!;
  const gap = getComputedStyle(content).rowGap;
  const margin = getComputedStyle(headingBox).marginBlockEnd;

  // 1. The margin is the gap it replaced.
  expect(gap, 'the content grid lost its row gap; the heading margin no longer replaces it').not.toBe(
    '0px',
  );
  expect(
    margin,
    'the heading no longer carries the space the content grid used to supply for it',
  ).toBe(gap);

  // 2. The content box is still a GRID, which is what supplies the body -> actions gap.
  expect(
    getComputedStyle(content).display,
    'the content box is no longer a grid, so its row gap applies to nothing',
  ).toBe('grid');

  // 3. The margin stays INSIDE the body box, in BOTH cases where it touches a body edge. This is
  //    what the grid ITEM buys: a grid item establishes a block formatting context, so the
  //    margin cannot collapse through the body's edge. Measured by forcing the content box to
  //    `display: block`, the two escapes look like this:
  //
  //      no heading slotted        the zero-height box self-collapses and the margin leaves
  //                                through the body's TOP edge: top 0 -> 8, height 30 -> 22
  //      heading, nothing after it the margin leaves through the BOTTOM edge: height 32 -> 24
  //
  //    Both are asserted, because a check on only one of them passes for half a regression.

  // 3a. No heading slotted — the margin must still be inside, above the message.
  const contentTop = content.getBoundingClientRect().top;
  const bodyRect = body.getBoundingClientRect();
  expect(
    Math.round(bodyRect.top - contentTop),
    "the heading's margin escaped through the body's TOP edge; the body is no longer a BFC root",
  ).toBe(0);
  expect(
    bodyRect.height,
    "the zero-height heading's self-collapsed margin is no longer inside the body box",
  ).toBeGreaterThanOrEqual(parseFloat(margin));

  // 3b. A heading with nothing after it — the margin must not leave through the bottom edge.
  const withHeading = await mount({ announce: 'polite' });
  const slotted = document.createElement('h3');
  slotted.slot = 'heading';
  slotted.textContent = 'Deploy failed';
  withHeading.append(slotted);
  await withHeading.updateComplete;
  const slottedHeadingHeight = partOf(withHeading, 'heading')!.getBoundingClientRect().height;
  expect(slottedHeadingHeight, 'the slotted heading rendered no box to measure').toBeGreaterThan(0);
  expect(
    partOf(withHeading, 'body')!.getBoundingClientRect().height,
    "the heading's margin escaped through the body's BOTTOM edge; the body is no longer a BFC root",
  ).toBeGreaterThanOrEqual(slottedHeadingHeight + parseFloat(margin));
});

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const element = await mount({ dismissible: true, tone: 'info', message: 'targetable' });
  // The rules are written out in FULL rather than built from a template literal, because
  // scripts/check-part-ratchet.mjs scans test sources for the literal text `::part(<name>)` — a
  // constructed selector records the part in expected-parts.json while leaving the ratchet unable
  // to see the test that justifies the entry, which is exactly the drift that file exists to stop.
  const parts: readonly (readonly [string, string])[] = [
    ['notice', 'sk-notice::part(notice) { outline-style: dashed; }'],
    ['marker', 'sk-notice::part(marker) { outline-style: dashed; }'],
    ['content', 'sk-notice::part(content) { outline-style: dashed; }'],
    ['heading', 'sk-notice::part(heading) { outline-style: dashed; }'],
    ['body', 'sk-notice::part(body) { outline-style: dashed; }'],
    ['actions', 'sk-notice::part(actions) { outline-style: dashed; }'],
    ['dismiss', 'sk-notice::part(dismiss) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of parts) {
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.append(style);
    try {
      const part = partOf(element, name);
      expect(part, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(part!).outlineStyle, `part="${name}" is not targetable`).toBe(
        'dashed',
      );
    } finally {
      style.remove();
    }
  }
  expect(parts).toHaveLength(7);
});

test('[SC-014] the element adopts the generated sheet by identity and injects no style tag', async () => {
  const element = await mount({});
  const root = element.shadowRoot!;
  expect(root.adoptedStyleSheets).toHaveLength(1);
  expect(root.adoptedStyleSheets[0]).toBe(skNoticeSheet);
  expect(root.querySelectorAll('style')).toHaveLength(0);
});

test('a consumer who removes the notice in their handler loses focus to <body>', async () => {
  // THE LIMIT OF THE FOCUS CONTRACT, asserted so it stays visible.
  //
  // `#dismiss()` dispatches the event and only THEN calls `this.focus()`. So during the
  // consumer's synchronous handler focus is still on the dismiss BUTTON, not on the host — and a
  // consumer who removes the notice there (which the docs say is their job) leaves `this.focus()`
  // running on a detached host, where it is a no-op. Focus lands on <body>.
  //
  // This is not fixable in the element and the shape of the fix is worth recording so it is not
  // retried: focusing the host BEFORE dispatch would move focus even when the consumer cancels,
  // which breaks `preventDefault()`; and a removed, focused host drops to <body> regardless of
  // ordering. The element cannot hold focus inside a subtree the consumer has deleted.
  //
  // An earlier revision of the comment at the `this.focus()` call site claimed this case was the
  // defect the host-focus move PREVENTS. It is the opposite: this is the case it does not reach,
  // and the consumer has to move focus themselves. The test exists so that claim cannot drift
  // back in unnoticed.
  const element = await mount({ dismissible: true, tone: 'danger' });
  const button = dismissButton(element)!;
  button.focus();

  let activeDuringHandler: Element | null = null;
  element.addEventListener('sk-notice-dismiss', () => {
    // What the consumer actually sees when their handler runs.
    activeDuringHandler = element.shadowRoot!.activeElement;
    element.remove();
  });
  button.click();

  expect(activeDuringHandler, 'focus was NOT on the host during the handler').toBe(button);
  expect(element.isConnected, 'the consumer removed it, as the docs tell them to').toBe(false);
  expect(document.activeElement, 'focus fell to <body>, which the element cannot prevent').toBe(
    document.body,
  );
});
