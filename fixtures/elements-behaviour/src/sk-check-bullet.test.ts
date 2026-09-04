/**
 * <sk-check-bullet> — #79's primitives batch.
 *
 * SC-013 and SC-014, plus the claim that makes this component different from the rest of the
 * batch: it has to participate in a LIST, and a custom element inside a <ul> is not a list item.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import { checkBulletStaticHtml, skCheckBulletSheet } from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

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
      expect(node, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(node).outlineStyle, `::part(${name}) is not targetable`).toBe('dashed');
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
  expect(el.getAttribute('role'), 'the host must present as a list item').toBe('listitem');
  expect(el.parentElement!.tagName).toBe('UL');

  // AND IT DOES NOT OVERRIDE a role the consumer set. Someone using these outside a list must
  // be able to say so; silently forcing listitem would make their markup wrong instead of ours.
  const ul = document.createElement('ul');
  const custom = document.createElement('sk-check-bullet');
  custom.setAttribute('role', 'presentation');
  ul.append(custom);
  document.body.append(ul);
  await (custom as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  expect(custom.getAttribute('role'), 'a consumer-set role must survive').toBe('presentation');
});

test('the tick is decorative and the text is the accessible content', async () => {
  const el = await mount({}, 'Requirements captured up front');
  const icon = partOf(el, 'icon');
  expect(icon.getAttribute('aria-hidden'), 'the tick must not be announced').toBe('true');
  expect(icon.textContent).toBe('✓');
  const slot = el.shadowRoot!.querySelector('slot') as HTMLSlotElement;
  expect(slot.assignedNodes().map((n) => n.textContent).join('')).toBe('Requirements captured up front');
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
