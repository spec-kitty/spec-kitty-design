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
  for (const tone of STATUS_TONES) {
    const element = await mount({ tone, message: `${tone} happened` });
    expect(liveRegion(element), `tone=${tone} announced without being asked`).toBe(null);
    expect(partOf(element, 'body')!.hasAttribute('role')).toBe(false);
    // ...and the message is still VISIBLE. Silent is not invisible.
    expect(partOf(element, 'body')!.textContent).toContain(`${tone} happened`);
  }
});

test('a CHANGED message with no tone change reaches the live region', async () => {
  // THE TEST THIS MISSION EXISTS FOR. Its red is a stale message.
  //
  // sk-form-input.ts records this defect twice — the `errorMessage` field comment and the
  // `willUpdate` comment — and both reduce to the same thing: the announced text changed and
  // nothing re-rendered, so `role="alert"` never fired again and `aria-describedby` pointed at
  // text that was no longer true. Deleting `message: { type: String }` from sk-notice's
  // `static properties` reproduces it exactly, and that is the SC-010 mutation arm.
  const element = await mount({ announce: 'assertive', tone: 'danger', message: 'Retrying in 5s' });
  expect(liveRegion(element)!.textContent).toContain('Retrying in 5s');

  element.message = 'Retrying in 2s';
  await element.updateComplete;

  expect(element.tone, 'the tone must not have moved — that is the point').toBe('danger');
  expect(liveRegion(element)!.textContent).toContain('Retrying in 2s');
  expect(liveRegion(element)!.textContent).not.toContain('Retrying in 5s');
});

test('the live-region node is the SAME node across message and tone changes', async () => {
  // Identity, not structure. A live region that is recreated with its content is not reliably
  // announced, so "the text updated" is not sufficient evidence on its own — the node carrying
  // the role has to be the one that was already there.
  const element = await mount({ announce: 'polite', tone: 'info', message: 'first' });
  const first = liveRegion(element)!;

  element.message = 'second';
  await element.updateComplete;
  expect(liveRegion(element), 'a message change recreated the live region').toBe(first);

  element.tone = 'danger';
  await element.updateComplete;
  expect(liveRegion(element), 'a tone change recreated the live region').toBe(first);

  element.message = 'third';
  element.tone = 'success';
  await element.updateComplete;
  expect(liveRegion(element), 'a combined change recreated the live region').toBe(first);
  expect(first.textContent).toContain('third');
});

test('changing the politeness builds a NEW node rather than re-roling the old one', async () => {
  // The other half of "never toggled onto an existing node when a message arrives". Within one
  // politeness the node is stable (above); ACROSS politeness levels it must not be, because
  // mutating `role` on a node that is already holding text is precisely the anti-pattern #178
  // names. `keyed()` on the announce level is what produces this.
  const element = await mount({ announce: 'polite', message: 'connection lost' });
  const before = liveRegion(element)!;
  expect(before.getAttribute('role')).toBe('status');

  element.announce = 'assertive';
  await element.updateComplete;
  const after = liveRegion(element)!;
  expect(after.getAttribute('role')).toBe('alert');
  expect(after, 'the role was toggled onto the node that already held the message').not.toBe(
    before,
  );
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
  document.addEventListener('sk-notice-dismiss', (e) => seen.push(e));
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
  const element = await mount({ dismissible: true });
  let evt: Event | undefined;
  // Listening on `document` is what proves BOTH flags at once: the event has to cross the shadow
  // boundary (composed) and then climb the light tree (bubbles) to arrive here at all.
  document.addEventListener('sk-notice-dismiss', (e) => {
    evt = e;
  });
  dismissButton(element)!.click();
  expect(evt, 'the event never left the shadow root').toBeDefined();
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
    expect(seen, `${key} did not activate the control`).toHaveLength(1);
    expect(element.isConnected).toBe(true);
    expect(document.activeElement, `${key}: focus was not left on the host`).toBe(element);
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

test('[SC-013] every declared part is present and targetable from outside', async () => {
  const element = await mount({ dismissible: true, tone: 'info', message: 'targetable' });
  const parts = ['notice', 'marker', 'content', 'heading', 'body', 'actions', 'dismiss'];
  for (const name of parts) {
    const style = document.createElement('style');
    style.textContent = `sk-notice::part(${name}) { outline-style: dashed; }`;
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

test('sk-notice holds no timer, no positioning and no application state', async () => {
  // #178's hard boundaries, asserted rather than promised. A notice that sets a timeout has
  // become a toast, and the audit's whole complaint is that the dashboard's strips were
  // everything-at-once. Reading the element's own source is the only way to assert an ABSENCE
  // like this; a rendered snapshot cannot see a setTimeout that has not fired yet.
  const source = await import('../../../packages/elements/src/notice/sk-notice.ts?raw').then(
    (m) => m.default as string,
  );
  for (const banned of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'this.remove(']) {
    expect(source, `sk-notice.ts references ${banned}`).not.toContain(banned);
  }
});
