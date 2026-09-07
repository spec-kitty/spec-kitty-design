/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
/**
 * <sk-check-bullet> — #79's primitives batch.
 *
 * SC-013 and SC-014, plus the claim that makes this component different from the rest of the
 * batch: it has to participate in a LIST, and a custom element inside a <ul> is not a list item.
 */
import { beforeEach, expect, test } from 'vitest';
import { SkCheckBullet } from '../../../packages/elements/src/check-bullet/sk-check-bullet.js';
import skCheckBulletSheet from '../../../packages/elements/src/check-bullet/sk-check-bullet.css.js';
import {
  checkBulletStaticHtml,
} from '../../../packages/elements/src/check-bullet/sk-check-bullet.markup.js';
import { installTokenSheet } from './token-sheet.js';
import { contrast, assertThemesDiffered } from './contrast.js';

beforeEach(installTokenSheet);

const mount = async (attrs: Record<string, string> = {}, text = 'Feature') => {
  const ul = document.createElement('ul');
  ul.setAttribute('role', 'list');
  const el = document.createElement('sk-check-bullet');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.textContent = text;
  ul.append(el);
  document.body.append(ul);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement;

type StatefulCheckBullet = HTMLElement & {
  icon?: string;
  state?: string;
  updateComplete: Promise<unknown>;
};

const stateLabelOf = (el: Element) =>
  el.shadowRoot!.querySelector('.sk-check-bullet__state') as HTMLElement;

test('[SC-013] every declared part is targetable from outside', async () => {
  const el = await mount();
  const cases: readonly (readonly [string, string])[] = [
    ['bullet', 'sk-check-bullet::part(bullet) { outline-style: dashed; }'],
    ['icon', 'sk-check-bullet::part(icon) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of cases) {
    const s = document.createElement('style');
    s.textContent = rule;
    document.head.append(s);
    try {
      const node = partOf(el, name);
      expect(node, `part="${name}" is declared but not rendered`).not.toBe(
        null,
      );
      expect(
        getComputedStyle(node).outlineStyle,
        `::part(${name}) is not targetable`,
      ).toBe('dashed');
    } finally {
      s.remove();
    }
  }
  expect(cases.length, 'the case table went empty').toBe(2);
});

test('[SC-014] the element adopts the GENERATED sheet by identity and injects no <style>', async () => {
  const el = await mount();
  const sr = el.shadowRoot!;
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(skCheckBulletSheet);
  expect(sr.querySelectorAll('style').length).toBe(0);
});

test('it participates in a LIST, which is the reason this component needed care', async () => {
  // A <ul> whose children are custom elements has no list items — a screen reader announces an
  // empty list. The static form is a real <li>; the element cannot be, so it sets the role.
  const el = await mount();
  expect(el.getAttribute('role'), 'the host must present as a list item').toBe(
    'listitem',
  );
  expect(el.parentElement!.tagName).toBe('UL');

  // AND IT DOES NOT OVERRIDE a role the consumer set. Someone using these outside a list must
  // be able to say so; silently forcing listitem would make their markup wrong instead of ours.
  const ul = document.createElement('ul');
  const custom = document.createElement('sk-check-bullet');
  custom.setAttribute('role', 'presentation');
  ul.append(custom);
  document.body.append(ul);
  await (custom as unknown as { updateComplete: Promise<unknown> })
    .updateComplete;
  expect(custom.getAttribute('role'), 'a consumer-set role must survive').toBe(
    'presentation',
  );
});

test('the tick is decorative and the text is the accessible content', async () => {
  const el = await mount({}, 'Requirements captured up front');
  const icon = partOf(el, 'icon');
  expect(
    icon.getAttribute('aria-hidden'),
    'the tick must not be announced',
  ).toBe('true');
  expect(icon.textContent).toBe('✓');
  const slot = el.shadowRoot!.querySelector('slot') as HTMLSlotElement;
  expect(
    slot
      .assignedNodes()
      .map((n) => n.textContent)
      .join(''),
  ).toBe('Requirements captured up front');
});

test('the tick meets AA contrast in BOTH themes — axe structurally cannot', async () => {
  // ASSERTED HERE BECAUSE THE A11Y GATE IS BLIND TO IT, permanently and silently. `✓` (U+2713)
  // and `★` (U+2605) both sit inside axe-core's non-BMP range, so `textIsEmojis` is true,
  // `colorContrastEvaluate` returns an INCOMPLETE instead of a violation, and
  // run-axe-storybook.js reads `getViolations`, which drops incompletes. So this component's
  // only coloured glyph has never been contrast-checked by the gate and would not be after a
  // regression either. Filed as #151; this arm is the local cover until it lands.
  //
  // Held to 4.5 (text contrast) even though an aria-hidden decorative glyph is arguably exempt
  // and 1.4.11's 3:1 would be the lenient floor. The tick is the component's only visual
  // signal for "checked", the fix clears 7.38:1, and the stricter floor catches a regression
  // sooner. Deliberately stricter, not accidentally.
  // Records the surface each theme resolved, so the loop can prove it saw TWO themes.
  const surfaces = new Map<string, string>();

  for (const theme of ['dark', 'light'] as const) {
    const wrap = document.createElement('div');
    if (theme === 'light') wrap.className = 'sk-light';
    // The tick has no background of its own, so the comparison surface is the page. Painting it
    // explicitly from the token makes the assertion independent of whatever the harness body
    // happens to be, and it resolves per theme because the wrapper carries the theme class.
    wrap.style.background = 'var(--sk-surface-page)';
    document.body.append(wrap);

    const ul = document.createElement('ul');
    ul.setAttribute('role', 'list');
    const el = document.createElement('sk-check-bullet');
    el.textContent = 'Requirements captured up front';
    ul.append(el);
    wrap.append(ul);
    await (el as unknown as { updateComplete: Promise<unknown> })
      .updateComplete;

    const fg = getComputedStyle(partOf(el, 'icon')).color;
    const bg = getComputedStyle(wrap).backgroundColor;
    surfaces.set(theme, bg);
    const ratio = contrast(fg, bg);
    expect(
      ratio,
      `the tick in ${theme} mode is ${ratio.toFixed(2)}:1 (${fg} on ${bg}) — AA needs 4.5`,
    ).toBeGreaterThanOrEqual(4.5);
  }

  // Without this, a light arm that silently rendered the dark palette would pass at 10.21:1.
  assertThemesDiffered(surfaces);
});

test('the icon is a property, and the class list matches the static path', async () => {
  const el = await mount({ icon: '★' });
  expect(partOf(el, 'icon').textContent).toBe('★');
  expect(partOf(el, 'bullet').className).toBe('sk-check-bullet');
  // One authored source (ADR-10 §3): same classes, and the static form keeps its real <li>.
  const html = checkBulletStaticHtml({ icon: '★' }, 'Feature');
  expect(html).toContain('<li class="sk-check-bullet">');
  expect(html).toContain('aria-hidden="true">★<');
  // The dead `__text` class is gone from the published markup — it styled nothing.
  expect(html).not.toContain('sk-check-bullet__text');
});

test('omitted and explicit complete state keep the original checked presentation without serializing omission', async () => {
  const omitted = (await mount(
    {},
    'Requirements captured',
  )) as StatefulCheckBullet;
  expect(omitted.state).toBeUndefined();
  expect(omitted.hasAttribute('state')).toBe(false);
  expect(partOf(omitted, 'bullet').className).toBe('sk-check-bullet');
  expect(partOf(omitted, 'icon').textContent).toBe('✓');
  expect(stateLabelOf(omitted).textContent).toBe('Complete');

  const complete = (await mount(
    { state: 'complete' },
    'Review accepted',
  )) as StatefulCheckBullet;
  expect(complete.state).toBe('complete');
  expect(complete.getAttribute('state')).toBe('complete');
  expect(partOf(complete, 'bullet').className).toBe('sk-check-bullet');
  expect(partOf(complete, 'icon').textContent).toBe('✓');
  expect(stateLabelOf(complete).textContent).toBe('Complete');
});

test('pending changes its decorative glyph and announced state while custom icon overrides only the glyph', async () => {
  const pending = (await mount(
    { state: 'pending' },
    'Review queued',
  )) as StatefulCheckBullet;
  expect(pending.state).toBe('pending');
  expect(pending.getAttribute('state')).toBe('pending');
  expect(
    partOf(pending, 'bullet').classList.contains('sk-check-bullet--pending'),
  ).toBe(true);
  expect(partOf(pending, 'icon').textContent).toBe('○');
  expect(partOf(pending, 'icon').getAttribute('aria-hidden')).toBe('true');
  expect(stateLabelOf(pending).textContent).toBe('Pending');
  expect(stateLabelOf(pending).hasAttribute('aria-hidden')).toBe(false);

  const custom = (await mount(
    { state: 'pending', icon: '★' },
    'Consumer-supplied marker',
  )) as StatefulCheckBullet;
  expect(partOf(custom, 'icon').textContent).toBe('★');
  expect(stateLabelOf(custom).textContent).toBe('Pending');
});

test('state text remains in the flattened content while its visual clipping does not hide it from AT', async () => {
  const el = (await mount(
    { state: 'pending' },
    'Tests still running',
  )) as StatefulCheckBullet;
  const state = stateLabelOf(el);
  const slot = el.shadowRoot!.querySelector('slot') as HTMLSlotElement;
  expect(state.getAttribute('aria-hidden')).toBe(null);
  expect(getComputedStyle(state).position).toBe('absolute');
  expect(getComputedStyle(state).clipPath).not.toBe('none');
  expect(
    [state.textContent, ...slot.assignedNodes().map((node) => node.textContent)]
      .join(' ')
      .trim(),
  ).toBe('Pending Tests still running');
});

test('unsupported runtime state fails open to complete without rewriting consumer input', async () => {
  const el = (await mount(
    { state: 'not-a-state' },
    'Still visible',
  )) as StatefulCheckBullet;
  expect(el.state).toBe('not-a-state');
  expect(el.getAttribute('state')).toBe('not-a-state');
  expect(partOf(el, 'bullet').className).toBe('sk-check-bullet');
  expect(partOf(el, 'icon').textContent).toBe('✓');
  expect(stateLabelOf(el).textContent).toBe('Complete');

  el.state = 'pending';
  await el.updateComplete;
  expect(el.getAttribute('state')).toBe('pending');
  expect(
    partOf(el, 'bullet').classList.contains('sk-check-bullet--pending'),
  ).toBe(true);
  expect(stateLabelOf(el).textContent).toBe('Pending');

  el.state = 'complete';
  await el.updateComplete;
  expect(el.getAttribute('state')).toBe('complete');
  expect(partOf(el, 'bullet').className).toBe('sk-check-bullet');
  expect(partOf(el, 'icon').textContent).toBe('✓');
  expect(stateLabelOf(el).textContent).toBe('Complete');
});

test('state remains passive listitem content with no checkbox or toggle contract', async () => {
  const el = (await mount(
    { state: 'pending' },
    'Awaiting review',
  )) as StatefulCheckBullet;
  const emitted: string[] = [];
  for (const type of ['change', 'toggle', 'sk-check-bullet-change']) {
    el.addEventListener(type, () => emitted.push(type));
  }
  el.click();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  await el.updateComplete;

  expect(el.getAttribute('role')).toBe('listitem');
  expect(el.hasAttribute('aria-checked')).toBe(false);
  expect(el.hasAttribute('tabindex')).toBe(false);
  expect(el.shadowRoot!.querySelector('button, input, [role="checkbox"]')).toBe(
    null,
  );
  expect(el.state).toBe('pending');
  expect(emitted).toEqual([]);
});

test('static markup is strict for authored state and shares state, glyph, and class presentation', () => {
  const implicit = checkBulletStaticHtml({}, 'Requirement');
  expect(implicit).toContain('<li class="sk-check-bullet">');
  expect(implicit).toContain('aria-hidden="true">✓</span>');
  expect(implicit).toContain(
    '<span class="sk-check-bullet__state">Complete</span> Requirement',
  );

  const pending = checkBulletStaticHtml({ state: 'pending' }, 'Review');
  expect(pending).toContain(
    '<li class="sk-check-bullet sk-check-bullet--pending">',
  );
  expect(pending).toContain('aria-hidden="true">○</span>');
  expect(pending).toContain(
    '<span class="sk-check-bullet__state">Pending</span> Review',
  );

  expect(() =>
    checkBulletStaticHtml({ state: 'unsupported' as 'pending' }, 'Bad'),
  ).toThrow(/unknown check-bullet state/i);
});

test('[SC-010] a pending state property assigned before definition survives upgrade and reflects', async () => {
  const tag = 'sk-check-bullet-state-late';
  const el = document.createElement(tag) as StatefulCheckBullet;
  el.state = 'pending';
  el.textContent = 'Queued before registration';
  document.body.append(el);
  customElements.define(tag, class extends SkCheckBullet {});
  await customElements.whenDefined(tag);
  await el.updateComplete;

  expect(el.state).toBe('pending');
  expect(el.getAttribute('state')).toBe('pending');
  expect(
    (el.shadowRoot!.firstElementChild as HTMLElement).classList.contains(
      'sk-check-bullet--pending',
    ),
  ).toBe(true);
  expect(
    (el.shadowRoot!.querySelector('.sk-check-bullet__icon') as HTMLElement)
      .textContent,
  ).toBe('○');
  expect(stateLabelOf(el).textContent).toBe('Pending');
});
