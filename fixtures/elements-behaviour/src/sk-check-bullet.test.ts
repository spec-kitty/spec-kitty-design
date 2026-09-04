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
  const contrast = (fg: string, bg: string) => {
    const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const lum = (c: string) => {
      const [r, g, b] = c.match(/\d+/g)!.slice(0, 3).map((n) => channel(Number(n) / 255));
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const [a, z] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a! + 0.05) / (z! + 0.05);
  };

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
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    const fg = getComputedStyle(partOf(el, 'icon')).color;
    const bg = getComputedStyle(wrap).backgroundColor;
    const ratio = contrast(fg, bg);
    expect(
      ratio,
      `the tick in ${theme} mode is ${ratio.toFixed(2)}:1 (${fg} on ${bg}) — AA needs 4.5`,
    ).toBeGreaterThanOrEqual(4.5);
  }
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
