/**
 * <sk-button> — #79's primitives batch.
 *
 * SC-013 and SC-014, plus the claims specific to this primitive: it renders a REAL interactive
 * element (an anchor when given href, a button otherwise), the two axes are independent, and
 * both degrade paths work.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  SkButton,
  buttonClasses,
  buttonStaticHtml,
  skButtonSheet,
} from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (attrs: Record<string, string> = {}, label = 'Label') => {
  const el = document.createElement('sk-button');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.textContent = label;
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element) => el.shadowRoot!.querySelector('[part="button"]') as HTMLElement;

test('icon button and link branches expose the supplied label as their accessible name', async () => {
  const button = await mount({ variant: 'primary', size: 'icon', label: 'Notifications' }, '●');
  const buttonControl = partOf(button);
  expect(buttonControl.tagName).toBe('BUTTON');
  expect(buttonControl.getAttribute('aria-label')).toBe('Notifications');
  await expect.element(buttonControl).toHaveAccessibleName('Notifications');

  const link = await mount(
    { variant: 'ghost', size: 'icon', label: 'Open settings', href: '#settings' },
    '★',
  );
  const linkControl = partOf(link);
  expect(linkControl.tagName).toBe('A');
  expect(linkControl.getAttribute('aria-label')).toBe('Open settings');
  await expect.element(linkControl).toHaveAccessibleName('Open settings');

  expect(button.textContent).toBe('●');
  expect(link.textContent).toBe('★');
  expect(button.shadowRoot!.querySelector('svg')).toBe(null);
  expect(link.shadowRoot!.querySelector('svg')).toBe(null);
});

test('invalid icon labels warn once per invalid value transition without swallowing content', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  try {
    const el = await mount({ variant: 'primary', size: 'icon' }, '●');
    expect(warnings).toHaveLength(1);
    expect(String(warnings[0]?.[0])).toMatch(/sk-button.*icon.*label/i);
    const slot = el.shadowRoot!.querySelector('slot') as HTMLSlotElement;
    expect(slot.assignedNodes().map((node) => node.textContent).join('').trim()).toBe('●');

    el.setAttribute('variant', 'secondary');
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(warnings, 'an unrelated update must not repeat the same invalid-label warning').toHaveLength(1);

    el.setAttribute('label', '   ');
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(warnings, 'a distinct blank label is a new invalid value transition').toHaveLength(2);
    expect(partOf(el).hasAttribute('aria-label')).toBe(false);

    el.setAttribute('label', 'Notifications');
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(warnings, 'recovery to a valid label must not warn').toHaveLength(2);
    expect(partOf(el).getAttribute('aria-label')).toBe('Notifications');

    el.setAttribute('label', '   ');
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(warnings, 'the same invalid value must warn again after a valid recovery').toHaveLength(3);
    expect(partOf(el).hasAttribute('aria-label')).toBe(false);
  } finally {
    console.warn = realWarn;
  }
});

test('strict static icon authoring requires a label and escapes valid label bytes', () => {
  expect(() => buttonStaticHtml({ variant: 'primary', size: 'icon' })).toThrow(/icon.*label/i);
  expect(() => buttonStaticHtml({ variant: 'primary', size: 'icon', label: '   ' })).toThrow(
    /icon.*label/i,
  );

  const exact = '  Alerts & "mentions"  ';
  const markup = buttonStaticHtml({ variant: 'primary', size: 'icon', label: exact }, '●');
  const parsed = new DOMParser().parseFromString(markup, 'text/html');
  const control = parsed.querySelector('button')!;
  expect(control.getAttribute('aria-label')).toBe(exact);
  expect(control.textContent).toBe('●');
  expect(markup).toContain('aria-label="  Alerts &amp; &quot;mentions&quot;  "');
});

test('[SC-010] a whitespace-bearing label assigned before definition survives upgrade exactly', async () => {
  const exact = '  Pre-upgrade button label  ';
  const el = document.createElement('sk-button-late') as SkButton;
  el.setAttribute('size', 'icon');
  el.label = exact;
  el.textContent = '●';
  document.body.append(el);

  customElements.define('sk-button-late', class extends SkButton {});
  await customElements.whenDefined('sk-button-late');
  await el.updateComplete;

  expect(el.label).toBe(exact);
  expect(el.getAttribute('label')).toBe(exact);
  const control = partOf(el);
  expect(control.getAttribute('aria-label')).toBe(exact);
  await expect.element(control).toHaveAccessibleName('Pre-upgrade button label');
});

test('host focus delegates to one real native control without adding a host tab stop', async () => {
  for (const attrs of [
    { variant: 'primary', size: 'icon', label: 'Notifications' },
    { variant: 'ghost', size: 'icon', label: 'Settings', href: '#settings' },
  ]) {
    const el = await mount(attrs, '●');
    (el as HTMLElement).focus();
    expect(el.shadowRoot!.activeElement).toBe(partOf(el));
    expect(el.hasAttribute('tabindex'), 'delegation must not create a second host tab stop').toBe(false);
    expect((el as HTMLElement).tabIndex).toBe(-1);
  }
});

test('icon controls are exactly 40px square and token-focus-visible in both themes', async () => {
  for (const theme of ['dark', 'light']) {
    for (const attrs of [
      { variant: 'primary', size: 'icon', label: `${theme} notifications` },
      { variant: 'ghost', size: 'icon', label: `${theme} settings`, href: '#settings' },
    ]) {
      const frame = document.createElement('div');
      if (theme === 'light') frame.className = 'sk-light';
      document.body.append(frame);
      const el = document.createElement('sk-button');
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
      el.textContent = '●';
      frame.append(el);
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

      const control = partOf(el);
      const bounds = control.getBoundingClientRect();
      expect(Math.round(bounds.width), `${theme} ${control.tagName} width`).toBe(40);
      expect(Math.round(bounds.height), `${theme} ${control.tagName} height`).toBe(40);

      (el as HTMLElement).focus();
      const computed = getComputedStyle(control);
      const tokenProbe = document.createElement('span');
      tokenProbe.style.borderTop =
        'var(--sk-border-width-2) solid var(--sk-border-focus)';
      frame.append(tokenProbe);
      const resolvedTokens = getComputedStyle(tokenProbe);
      expect(computed.outlineStyle, `${theme} ${control.tagName} focus style`).toBe('solid');
      expect(computed.outlineWidth, `${theme} ${control.tagName} focus width token`).toBe(
        resolvedTokens.borderTopWidth,
      );
      expect(computed.outlineColor, `${theme} ${control.tagName} focus colour token`).toBe(
        resolvedTokens.borderTopColor,
      );
      expect(computed.outlineOffset, `${theme} ${control.tagName} focus offset token`).toBe(
        resolvedTokens.borderTopWidth,
      );
      frame.remove();
    }
  }
});

test('[SC-013] the declared part is targetable from outside, on BOTH branches', async () => {
  // BOTH BRANCHES, because this element renders two different nodes. An earlier version mounted
  // only the button branch, which made the mutation covering the ANCHOR branch semantically
  // inert — the harness caught that, and it is the same hole in reverse: a part declared once
  // but rendered by two code paths needs both exercised or half of it is unheld.
  const s = document.createElement('style');
  s.textContent = 'sk-button::part(button) { outline-style: dashed; }';
  document.head.append(s);
  try {
    for (const attrs of [{ variant: 'primary' }, { variant: 'primary', href: '#x' }]) {
      const el = await mount(attrs);
      const node = partOf(el);
      const branch = 'href' in attrs ? 'anchor' : 'button';
      expect(node, `part="button" is not rendered on the ${branch} branch`).not.toBe(null);
      expect(
        getComputedStyle(node).outlineStyle,
        // INTERPOLATED, and that is load-bearing. check-part-ratchet.mjs greps the
        // concatenated test sources for the literal `::part(<name>)`; a failure message
        // carrying that literal is a second, non-selector occurrence, so deleting the real
        // rule above would leave the ratchet arm green over nothing. A lens caught this.
        `::part(${'button'}) is not targetable on the ${branch} branch`,
      ).toBe('dashed');
    }
  } finally {
    s.remove();
  }
});

test('removing href reverts the anchor to a button', async () => {
  // THE REGRESSION THIS ARM EXISTS FOR. `render()` tested `this.href === undefined`, but Lit
  // assigns a String property `null` when its attribute is removed — so the anchor branch was
  // taken with `href=${null}`, which lit-html commits as `href=""`. The element stayed an <a>,
  // a click reloaded the page, and AT still announced "link".
  //
  // Nothing in the suite could see it: `mount()` only ever setAttribute's and never mutates
  // after mount, so no arm exercised a property going BACK to absent. A lens found it by
  // reading Lit's converter. This asserts the transition, not just the two static states.
  const el = await mount({ variant: 'primary', href: '/docs' });
  expect(partOf(el).tagName, 'href should render an anchor').toBe('A');

  el.removeAttribute('href');
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

  const node = partOf(el);
  expect(node.tagName, 'removing href should revert to a <button>').toBe('BUTTON');
  // ASSERTED ON THE SHADOW ROOT, because that is the thing that regresses. The first version
  // of this line checked `node.hasAttribute('href')` and justified it as belt-and-braces
  // against `<a href="">` — but the assertion above already pins tagName to BUTTON, which
  // `<a href="">` cannot satisfy, and a `<button>` never carries href. It could not fail. A
  // lens called it a wiring-only assertion with an incorrect reason, and it was right.
  expect(
    el.shadowRoot!.querySelector('a'),
    'no anchor may survive in the shadow root after href is removed',
  ).toBe(null);
});

test('[SC-014] the element adopts the GENERATED sheet by identity and injects no <style>', async () => {
  const el = await mount();
  const sr = el.shadowRoot!;
  expect(sr.adoptedStyleSheets.length).toBe(1);
  expect(sr.adoptedStyleSheets[0]).toBe(skButtonSheet);
  expect(sr.querySelectorAll('style').length).toBe(0);
});

test('it renders a REAL button, and a REAL anchor when given href', async () => {
  // The decision this component turns on. Every use of this primitive in apps/demo is an
  // <a href> styled as a button; the stories use <button>. A component that could only be one
  // of those would force consumers to choose between a working link and a styled one — so the
  // element switches on the same signal the catalogue already switches on.
  const button = await mount({ variant: 'primary' });
  const b = partOf(button);
  expect(b.tagName, 'no href must render a real <button>').toBe('BUTTON');
  expect(b.getAttribute('type'), 'a button in a form defaults to submit unless typed').toBe('button');
  expect(button.shadowRoot!.querySelector('a'), 'a button must not also render an anchor').toBe(null);

  const link = await mount({ variant: 'primary', href: '#posts' });
  const a = partOf(link);
  expect(a.tagName, 'href must render a real <a>').toBe('A');
  expect(a.getAttribute('href')).toBe('#posts');
  // The accessible ROLE follows from the element, which is the point of rendering a real one.
  expect(link.shadowRoot!.querySelector('button'), 'a link must not also render a button').toBe(null);
});

test('the class list is identical on both paths', async () => {
  // One CSS source (ADR-10 §3). The element puts the same classes on its shadow node that the
  // static form puts on its own root, so the sheet needs no second spelling — the divergence
  // #78 had to repair after the fact.
  const el = await mount({ variant: 'secondary', size: 'sm' });
  // toBe, not toContain: the test is named "identical", and three toContain calls would pass
  // on an extra or reordered class. The sibling pill-tag test already does this.
  expect(partOf(el).className).toBe('sk-button sk-button--secondary sk-button--sm');
  expect(buttonStaticHtml({ variant: 'secondary', size: 'sm' })).toContain(
    'class="sk-button sk-button--secondary sk-button--sm"',
  );
});

test('the static ANCHOR branch renders, and href cannot break out of the attribute', async () => {
  // FIRST COVERAGE OF THIS BRANCH. `buttonStaticHtml`'s anchor arm and the `attr()` escaper
  // beside it were both added by #79's fold and a lens found them shipping untested — with a
  // comment in the markup module claiming the opposite. The docblock calls the anchor the form
  // every real consumer uses, so it was also the one arm with no assertion at all.
  const plain = buttonStaticHtml({ variant: 'primary', href: '/docs' });
  expect(plain).toBe('<a class="sk-button sk-button--primary" href="/docs">Label</a>');

  // ATTRIBUTE-POSITION INJECTION. This is the only caller-supplied value any markup module
  // interpolates into an attribute, and the module is public API, so an unescaped quote would
  // let a caller emit an event handler into committed markup.
  //
  // ASSERTED BY PARSING, not by substring. The first version of this arm checked that the
  // output did `not.toContain('onfocus=alert')` and failed against a CORRECTLY escaped string:
  // the quotes become `&quot;`, so nothing breaks out, but the characters `onfocus=alert` are
  // still there as inert text inside the value. The question is whether the parser sees an
  // ATTRIBUTE, so the test asks the parser.
  const hostile = buttonStaticHtml({ href: '" onfocus=alert(1) x="' });
  const parsed = new DOMParser().parseFromString(hostile, 'text/html');
  const anchor = parsed.querySelector('a')!;
  expect(anchor, 'the hostile input must still produce exactly one anchor').not.toBe(null);
  expect(anchor.getAttributeNames().sort(), 'no attribute may be injected').toEqual([
    'class',
    'href',
  ]);
  // The whole hostile string survives as the href's VALUE — escaped, not executed, not dropped.
  expect(anchor.getAttribute('href')).toBe('" onfocus=alert(1) x="');

  // A legitimate URL with an ampersand must round-trip: `&amp;` in the markup, `&` once parsed.
  const amp = buttonStaticHtml({ href: '/s?a=1&b=2' });
  expect(amp).toContain('href="/s?a=1&amp;b=2"');
  expect(
    new DOMParser().parseFromString(amp, 'text/html').querySelector('a')!.getAttribute('href'),
  ).toBe('/s?a=1&b=2');
});

test('the primary tone PAINTS, and the three tones are distinct', async () => {
  // RENAMED AND STRENGTHENED. The old name said "every tone PAINTS" and no assertion proved any
  // tone painted: deleting `background: var(--sk-color-yellow)` from --primary left three still
  // distinct triples, so the component's whole visual contract was deletable green. A lens
  // caught it. `secondary` and `ghost` are transparent BY DESIGN, so a blanket paint assertion
  // is impossible — primary is the one with a fill and it is asserted directly.
  // Derived from the module's own map with a literal floor, per #78's finding that a hardcoded
  // list lets a fourth value ship with no coverage.
  const variants = Object.keys(BUTTON_VARIANTS);
  expect(variants.length, 'the tone map went empty or grew uncovered').toBe(3);
  const seen = new Map<string, string>();
  for (const variant of variants) {
    const el = await mount({ variant });
    const cs = getComputedStyle(partOf(el));
    if (variant === 'primary') {
      expect(cs.backgroundColor, 'the primary button has no fill').not.toBe('rgba(0, 0, 0, 0)');
      expect(cs.backgroundColor, 'the primary fill is transparent').not.toBe('transparent');
    }
    seen.set(variant, `${cs.backgroundColor}|${cs.color}|${cs.borderColor}`);
  }
  expect(
    new Set(seen.values()).size,
    `the tones are not distinct: ${[...seen].map(([k, v]) => `${k}=${v}`).join(', ')}`,
  ).toBe(variants.length);
});

test('size is an axis independent of tone', async () => {
  const sizes = Object.keys(BUTTON_SIZES);
  expect(sizes, 'the size map went empty or grew uncovered').toEqual(['sm', 'icon']);
  const base = await mount({ variant: 'primary' });
  const small = await mount({ variant: 'primary', size: 'sm' });
  const icon = await mount({ variant: 'primary', size: 'icon', label: 'Notifications' }, '●');
  const basePad = parseFloat(getComputedStyle(partOf(base)).paddingLeft);
  const smallPad = parseFloat(getComputedStyle(partOf(small)).paddingLeft);
  expect(smallPad, 'size="sm" did not change the padding').toBeLessThan(basePad);
  // And it leaves the tone alone — the other direction of the coupling check.
  expect(getComputedStyle(partOf(small)).backgroundColor).toBe(
    getComputedStyle(partOf(base)).backgroundColor,
  );
  expect(getComputedStyle(partOf(icon)).backgroundColor).toBe(
    getComputedStyle(partOf(base)).backgroundColor,
  );
});

test('disabled reaches the real button, and is not faked on a link', async () => {
  const el = await mount({ variant: 'primary', disabled: '' });
  const b = partOf(el) as HTMLButtonElement;
  expect(b.disabled, 'the disabled attribute must reach the real button').toBe(true);
  // A disabled LINK is not a thing HTML has; faking one with pointer-events hides it from
  // assistive technology, so `disabled` is deliberately ignored when href is set.
  const link = await mount({ variant: 'primary', href: '#', disabled: '' });
  expect(partOf(link).hasAttribute('disabled'), 'an anchor must not carry a disabled attribute').toBe(false);
});

test('an unknown variant or size degrades on RENDER and throws on AUTHORING', async () => {
  const warnings: unknown[][] = [];
  const realWarn = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args);
  let el: Element;
  try {
    el = await mount({ variant: 'nope', size: 'also-nope' });
  } finally {
    console.warn = realWarn;
  }
  expect(partOf(el!).className.trim()).toBe('sk-button');
  expect(el!.shadowRoot!.querySelector('slot'), 'the slot must survive').not.toBe(null);
  expect(warnings.length, 'both arms must warn').toBe(2);

  expect(() => buttonStaticHtml({ variant: 'nope' })).toThrow(/unknown button variant/);
  expect(() => buttonStaticHtml({ size: 'nope' })).toThrow(/unknown button size/);
  for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    expect(() => buttonStaticHtml({ variant: key })).toThrow(/unknown button variant/);
    expect(() => buttonStaticHtml({ size: key })).toThrow(/unknown button size/);
    expect(buttonClasses(key).trim()).toBe('sk-button');
    expect(buttonClasses(undefined, key).trim()).toBe('sk-button');
  }
});
