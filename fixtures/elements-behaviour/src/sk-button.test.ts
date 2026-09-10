/* eslint-disable @nx/enforce-module-boundaries -- #225: this file imports the element modules
   it EXERCISES, not the package barrel. The mutation harness selects each arm's tests from
   Vitest's dependency graph, and one barrel import puts every element source in every behaviour
   test's graph — which is what made that filter inert. */
/**
 * <sk-button> — #79's primitives batch, plus #305's busy axis.
 *
 * SC-013 and SC-014, plus the claims specific to this primitive: it renders a REAL interactive
 * element (an anchor when given href, a button otherwise), the two axes are independent, and
 * both degrade paths work.
 */
import { beforeEach, expect, test } from 'vitest';
import '../../../packages/elements/src/button/sk-button.js';
import skButtonSheet from '../../../packages/elements/src/button/sk-button.css.js';
import skButtonCssRaw from '../../../packages/styles/src/button/sk-button.css?raw';
import { SkButton } from '../../../packages/elements/src/button/sk-button.js';
import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  buttonClasses,
  buttonStaticHtml,
} from '../../../packages/elements/src/button/sk-button.markup.js';
import skButtonCss from '../../../packages/styles/src/button/sk-button.css?raw';
import skButtonElementSource from '../../../packages/elements/src/button/sk-button.ts?raw';
import skButtonMarkupSource from '../../../packages/elements/src/button/sk-button.markup.ts?raw';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

// AUTHORED sheet, parsed directly — the same technique sk-action-row.test.ts uses for a
// pseudo-class rule (`:hover`/`:active`) that `getComputedStyle` cannot answer without actually
// simulating the state. `sk-button--danger-secondary`'s hover fill and active transform are
// both asserted this way below.
const authoredButtonSheet = new CSSStyleSheet();
authoredButtonSheet.replaceSync(skButtonCss);

const rootStyleRuleFor = (selector: string): CSSStyleRule | undefined =>
  Array.from(authoredButtonSheet.cssRules).find(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === selector,
  );

const mount = async (attrs: Record<string, string> = {}, label = 'Label') => {
  const el = document.createElement('sk-button');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.textContent = label;
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element) => el.shadowRoot!.querySelector('[part="button"]') as HTMLElement;
const busyCueOf = (el: Element) =>
  el.shadowRoot!.querySelector('[part="busy-cue"]') as HTMLElement;

// The busy-axis (#305) authored CSS, parsed the way sk-status-indicator.test.ts's
// `authoredStatusSheet`/`mediaRuleFor` pair already does: asserting the AUTHORED sheet itself
// carries the guard, independent of any one browser's runtime media-query interpretation.
const authoredButtonSheet = new CSSStyleSheet();
authoredButtonSheet.replaceSync(skButtonCssRaw);

const mediaRuleFor = (query: string): CSSMediaRule | undefined =>
  Array.from(authoredButtonSheet.cssRules).find(
    (rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.media.mediaText === query,
  );

const styleRuleFor = (rules: CSSRuleList | readonly CSSRule[], selector: string): CSSStyleRule | undefined =>
  Array.from(rules).find(
    (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === selector,
  );

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

test('[SC-013] the declared parts are targetable from outside, on BOTH branches', async () => {
  // BOTH BRANCHES, because this element renders two different nodes on both. An earlier
  // version mounted only the button branch for `part="button"`, which made the mutation
  // covering the ANCHOR branch semantically inert — the harness caught that, and it is the
  // same hole in reverse: a part declared once but rendered by two code paths needs both
  // exercised or half of it is unheld. `busy-cue` (#305) joins the SAME loop for the identical
  // reason, rather than a separate test that could drift out of sync with this one.
  const s = document.createElement('style');
  s.textContent =
    'sk-button::part(button) { outline-style: dashed; } ' +
    'sk-button::part(busy-cue) { outline-style: dotted; }';
  document.head.append(s);
  try {
    for (const attrs of [{ variant: 'primary' }, { variant: 'primary', href: '#x' }]) {
      const el = await mount(attrs);
      const node = partOf(el);
      const cue = busyCueOf(el);
      const branch = 'href' in attrs ? 'anchor' : 'button';
      expect(node, `part="button" is not rendered on the ${branch} branch`).not.toBe(null);
      expect(cue, `part="busy-cue" is not rendered on the ${branch} branch`).not.toBe(null);
      expect(
        getComputedStyle(node).outlineStyle,
        // INTERPOLATED, and that is load-bearing. check-part-ratchet.mjs greps the
        // concatenated test sources for the literal `::part(<name>)`; a failure message
        // carrying that literal is a second, non-selector occurrence, so deleting the real
        // rule above would leave the ratchet arm green over nothing. A lens caught this.
        `::part(${'button'}) is not targetable on the ${branch} branch`,
      ).toBe('dashed');
      expect(
        getComputedStyle(cue).outlineStyle,
        `::part(${'busy-cue'}) is not targetable on the ${branch} branch`,
      ).toBe('dotted');
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
  expect(variants.length, 'the tone map went empty or grew uncovered').toBe(4);
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

test('danger-secondary fills on hover and does not otherwise change its border or text colour', async () => {
  // `:hover` cannot be simulated by getComputedStyle here — the same limitation
  // sk-action-row.test.ts's own hover assertions work around — so the AUTHORED rule is read
  // directly from the parsed sheet, matching that file's `rootStyleRuleFor` technique.
  const el = await mount({ variant: 'danger-secondary' });
  const resting = getComputedStyle(partOf(el));
  expect(resting.backgroundColor, 'danger-secondary is transparent at rest').toBe('rgba(0, 0, 0, 0)');

  const hoverRule = rootStyleRuleFor('.sk-button--danger-secondary:hover');
  expect(hoverRule, 'the danger-secondary hover rule was not parsed').not.toBeUndefined();
  expect(hoverRule!.style.background, 'hover must set a background').not.toBe('');
  expect(hoverRule!.style.borderColor, 'hover must not touch border-color').toBe('');
  expect(hoverRule!.style.color, 'hover must not touch text colour').toBe('');

  const probe = document.createElement('span');
  probe.style.background = hoverRule!.style.background;
  document.body.append(probe);
  const resolvedHoverFill = getComputedStyle(probe).backgroundColor;
  probe.remove();

  const dangerSurfaceProbe = document.createElement('span');
  dangerSurfaceProbe.style.background = 'var(--sk-status-danger)';
  document.body.append(dangerSurfaceProbe);
  const resolvedDangerSurface = getComputedStyle(dangerSurfaceProbe).backgroundColor;
  dangerSurfaceProbe.remove();

  expect(resolvedHoverFill, 'hover resolves to the danger surface token').toBe(resolvedDangerSurface);
  expect(resolvedHoverFill, 'hover fill must not equal the resting (transparent) fill').not.toBe(
    resting.backgroundColor,
  );
});

test('danger-secondary declares :active { transform: scale(0.97) }, scoped to itself only', () => {
  const activeRule = rootStyleRuleFor('.sk-button--danger-secondary:active');
  expect(activeRule, 'the danger-secondary active rule was not parsed').not.toBeUndefined();
  expect(activeRule!.style.transform).toBe('scale(0.97)');

  // C-003: secondary/ghost are NOT retrofitted with :active — this WP adds the rule to
  // danger-secondary only, and this assertion is the proof, not just the CSS comment.
  expect(rootStyleRuleFor('.sk-button--secondary:active'), 'secondary must not gain :active').toBeUndefined();
  expect(rootStyleRuleFor('.sk-button--ghost:active'), 'ghost must not gain :active').toBeUndefined();
});

test('danger-secondary border and text colour resolve to --sk-on-status-danger, in both themes', async () => {
  // Same two-theme token-boundary probe pattern as "icon controls are exactly 40px square and
  // token-focus-visible in both themes" above, applied to the new tone's own boundary token.
  for (const theme of ['dark', 'light'] as const) {
    const frame = document.createElement('div');
    if (theme === 'light') frame.className = 'sk-light';
    document.body.append(frame);

    const el = document.createElement('sk-button');
    el.setAttribute('variant', 'danger-secondary');
    el.textContent = 'Deny';
    frame.append(el);
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    const computed = getComputedStyle(partOf(el));
    const tokenProbe = document.createElement('span');
    tokenProbe.style.color = 'var(--sk-on-status-danger)';
    frame.append(tokenProbe);
    const resolvedToken = getComputedStyle(tokenProbe).color;

    expect(computed.borderColor, `${theme} danger-secondary border colour`).toBe(resolvedToken);
    expect(computed.color, `${theme} danger-secondary text colour`).toBe(resolvedToken);
    frame.remove();
  }
});

test('danger-secondary has no new copy default anywhere in source (FR-017)', () => {
  // The generated static default stays the shared 'Label' placeholder — the label is always
  // consumer-supplied (#286), even for a tone whose real-world use is a deny/decline action.
  expect(buttonStaticHtml({ variant: 'danger-secondary' })).toBe(
    '<button class="sk-button sk-button--danger-secondary" type="button">Label</button>',
  );

  // A TARGETED assertion (not #286's repo-wide gate): the two source files this WP authors must
  // not smuggle in a hardcoded "Deny"/"Decline" default. Stories and docs are allowed to use
  // those words as EXAMPLE values — only the two authored source modules are checked here.
  for (const [name, source] of [
    ['sk-button.ts', skButtonElementSource],
    ['sk-button.markup.ts', skButtonMarkupSource],
  ] as const) {
    expect(/deny|decline/i.test(source), `${name} must not hardcode a copy default`).toBe(false);
  }
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

  // danger-secondary composed with each size: same padding/dimension behaviour as any other
  // tone at that size, and the tone's own boundary colour is unaffected by size.
  const dangerBase = await mount({ variant: 'danger-secondary' });
  const dangerSmall = await mount({ variant: 'danger-secondary', size: 'sm' });
  const dangerIcon = await mount(
    { variant: 'danger-secondary', size: 'icon', label: 'Deny' },
    '✕',
  );
  const dangerBasePad = parseFloat(getComputedStyle(partOf(dangerBase)).paddingLeft);
  const dangerSmallPad = parseFloat(getComputedStyle(partOf(dangerSmall)).paddingLeft);
  expect(dangerSmallPad, 'danger-secondary size="sm" padding must match primary size="sm" padding').toBe(
    smallPad,
  );
  expect(dangerBasePad, 'danger-secondary default padding must match primary default padding').toBe(
    basePad,
  );
  const dangerIconBounds = partOf(dangerIcon).getBoundingClientRect();
  expect(Math.round(dangerIconBounds.width), 'danger-secondary icon width').toBe(40);
  expect(Math.round(dangerIconBounds.height), 'danger-secondary icon height').toBe(40);
  // Size leaves the tone's own colours alone — the same coupling check as the primary tone
  // above, applied to danger-secondary's border colour instead of background (it has no fill
  // at rest, so background is uninformative here; border-color is the tone's carrier).
  expect(getComputedStyle(partOf(dangerSmall)).borderColor).toBe(
    getComputedStyle(partOf(dangerBase)).borderColor,
  );
  expect(getComputedStyle(partOf(dangerIcon)).borderColor).toBe(
    getComputedStyle(partOf(dangerBase)).borderColor,
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

// ============================================================================================
// Busy axis (#305). FR-001 through FR-011, User Stories 1-4.
// ============================================================================================

test('[FR-001/FR-006] the cue is out-of-flow BY MECHANISM, in both idle and busy, not merely by an unshifted result', async () => {
  // `::part(busy-cue)` styling from OUTSIDE (the [SC-013] test above) and a geometry
  // before/after comparison ([FR-006] below) both hold even if the cue's OWN internal class
  // never matched anything at all — an empty, entirely unstyled inline `<span>` also
  // contributes ~0 to a flex row's box, so a missing `class="sk-button__busy-cue"` on the
  // rendered node would pass both of those checks while the CSS in sk-button.css never
  // actually applied. This test closes that gap directly: `position: absolute` is asserted on
  // the REAL element, in BOTH states, which only holds if the class is actually present and
  // the base (idle) rule is actually matching — the mechanism FR-006 depends on, not an
  // unshifted number that could arise by accident.
  const el = await mount({ variant: 'primary' });
  const cue = busyCueOf(el);
  expect(cue.classList.contains('sk-button__busy-cue'), 'the cue must carry its own class').toBe(true);
  expect(getComputedStyle(cue).position, 'idle: the cue must be out of flow').toBe('absolute');
  expect(getComputedStyle(cue).visibility, 'idle: the cue must be hidden').toBe('hidden');
  expect(getComputedStyle(cue).opacity, 'idle: the cue must be transparent').toBe('0');

  el.setAttribute('busy', '');
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  expect(getComputedStyle(cue).position, 'busy: the cue must still be out of flow').toBe('absolute');
  expect(getComputedStyle(cue).visibility, 'busy: the cue must be visible').toBe('visible');
  expect(getComputedStyle(cue).opacity, 'busy: the cue must be opaque').toBe('1');
});

test('[FR-006] idle -> busy -> idle geometry is pixel-identical for every tone/size/label length', async () => {
  // THREE MEASUREMENTS, NOT TWO (R-07, the #308 closed-dialog lesson). A defect that only
  // breaks the RETURN to idle cannot be caught by a test that only ever measures entry.
  const variants = [undefined, 'primary', 'secondary', 'ghost'] as const;
  const sizes = [undefined, 'sm'] as const;
  const labels: Record<string, string> = {
    long: 'A considerably longer label that approaches the wrapping boundary',
    short: 'Go',
  };

  for (const variant of variants) {
    for (const size of sizes) {
      for (const [labelKind, text] of Object.entries(labels)) {
        const attrs: Record<string, string> = {};
        if (variant) attrs['variant'] = variant;
        if (size) attrs['size'] = size;
        const el = await mount(attrs, text);
        const control = partOf(el);
        const ctx = `${variant ?? 'base'}/${size ?? 'default'}/${labelKind}`;

        const idleBefore = control.getBoundingClientRect();
        el.setAttribute('busy', '');
        await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
        const busy = control.getBoundingClientRect();
        expect(busy.width, `${ctx}: width shifted entering busy`).toBe(idleBefore.width);
        expect(busy.height, `${ctx}: height shifted entering busy`).toBe(idleBefore.height);

        el.removeAttribute('busy');
        await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
        const idleAfter = control.getBoundingClientRect();
        // ASSERTED EXPLICITLY, not inferred from the busy measurement holding — the NOT-busy
        // state after the cycle is its own claim (User Story 3, Acceptance Scenario 2).
        expect(idleAfter.width, `${ctx}: width did not restore on return to idle`).toBe(idleBefore.width);
        expect(idleAfter.height, `${ctx}: height did not restore on return to idle`).toBe(idleBefore.height);
        el.remove();
      }
    }
  }
});

test('[FR-006] the fixed-size icon variant is measured like every other size, not assumed safe', async () => {
  // `.sk-button--icon` is ALREADY a fixed box before this mission (see the existing "icon
  // controls are exactly 40px square" test above) — that existing fixed-ness must not be
  // mistaken for automatic zero-shift immunity to a NEW axis; it is measured explicitly.
  const el = await mount({ variant: 'primary', size: 'icon', label: 'Send invitation' }, '✉');
  const control = partOf(el);
  const idleBefore = control.getBoundingClientRect();

  el.setAttribute('busy', '');
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  const busy = control.getBoundingClientRect();
  expect(busy.width).toBe(idleBefore.width);
  expect(busy.height).toBe(idleBefore.height);
  expect(Math.round(busy.width)).toBe(40);

  el.removeAttribute('busy');
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  const idleAfter = control.getBoundingClientRect();
  expect(idleAfter.width).toBe(idleBefore.width);
  expect(idleAfter.height).toBe(idleBefore.height);
});

test('[FR-006] a sibling element does not move across the idle -> busy -> idle cycle', async () => {
  const row = document.createElement('div');
  row.style.display = 'flex';
  document.body.append(row);
  const first = document.createElement('sk-button');
  first.setAttribute('variant', 'primary');
  first.textContent = 'First';
  const sibling = document.createElement('sk-button');
  sibling.setAttribute('variant', 'secondary');
  sibling.textContent = 'Sibling';
  row.append(first, sibling);
  await (first as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  await (sibling as unknown as { updateComplete: Promise<unknown> }).updateComplete;

  const before = sibling.getBoundingClientRect();
  first.setAttribute('busy', '');
  await (first as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  const during = sibling.getBoundingClientRect();
  first.removeAttribute('busy');
  await (first as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  const after = sibling.getBoundingClientRect();

  expect(during.left, 'the sibling moved while its neighbour became busy').toBe(before.left);
  expect(during.top).toBe(before.top);
  expect(after.left, 'the sibling did not return to its original position').toBe(before.left);
  expect(after.top).toBe(before.top);
  row.remove();
});

test('[FR-003/004/005] busy composes independently of either disabling mechanism, or neither', async () => {
  // busy + native disabled: the existing dimmed/not-allowed treatment applies EXACTLY as it
  // does today without busy, the cue is still visible, and the control is excluded from the
  // tab order — platform default, unmodified by this mission.
  const disabledEl = await mount({ variant: 'primary', busy: '', disabled: '' });
  const disabledControl = partOf(disabledEl) as HTMLButtonElement;
  const disabledCue = busyCueOf(disabledEl);
  expect(getComputedStyle(disabledControl).opacity).toBe('0.4');
  expect(getComputedStyle(disabledControl).cursor).toBe('not-allowed');
  expect(getComputedStyle(disabledCue).visibility, 'the cue must still be visible').toBe('visible');
  expect(getComputedStyle(disabledCue).opacity).toBe('1');
  expect(disabledControl.disabled).toBe(true);
  // `.tabIndex` itself is NOT the exclusion mechanism — a disabled button's IDL `tabIndex`
  // still reads its element-default (0); the platform excludes it from focus/tab order via
  // the separate "disabled" focusing flag. So the exclusion is asserted the way it actually
  // manifests: focus() does not move focus onto a disabled control.
  disabledControl.focus();
  expect(
    disabledEl.shadowRoot!.activeElement,
    'native disabled must still exclude the control from receiving focus',
  ).not.toBe(disabledControl);

  // busy + focusable aria-disabled (no native disabled): no CSS this mission adds dims the
  // control, the cue is still visible, and the control remains focusable and in the tab order
  // — the shape Team Kitty SaaS #1520's double-submit prevention relies on (C-006, FR-018).
  const ariaEl = document.createElement('sk-button');
  ariaEl.setAttribute('variant', 'primary');
  ariaEl.setAttribute('busy', '');
  ariaEl.setAttribute('aria-disabled', 'true');
  ariaEl.textContent = 'Label';
  document.body.append(ariaEl);
  await (ariaEl as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  const ariaControl = partOf(ariaEl) as HTMLButtonElement;
  const ariaCue = busyCueOf(ariaEl);
  expect(getComputedStyle(ariaControl).opacity, 'aria-disabled alone must not dim the button').toBe('1');
  expect(getComputedStyle(ariaControl).cursor).not.toBe('not-allowed');
  expect(getComputedStyle(ariaCue).visibility).toBe('visible');
  expect(getComputedStyle(ariaCue).opacity).toBe('1');
  expect(ariaControl.disabled).toBe(false);
  (ariaEl as HTMLElement).focus();
  expect(ariaEl.shadowRoot!.activeElement, 'aria-disabled alone must not block focus delegation').toBe(ariaControl);
  expect(ariaControl.tabIndex, 'aria-disabled alone must not remove the control from tab order').not.toBe(-1);

  // busy with NEITHER disabling mechanism present (Edge Case): the cue renders identically —
  // the component does not infer or impose a disabling mechanism from busy alone.
  const plainEl = await mount({ variant: 'primary', busy: '' });
  const plainCue = busyCueOf(plainEl);
  expect(getComputedStyle(plainCue).visibility).toBe('visible');
  expect(getComputedStyle(plainCue).opacity).toBe('1');
});

test('[R-03] the busy rule selectors never reference a disabling attribute, read from the parsed sheet', () => {
  // STATIC HALF of the two-way independence check (R-03) — the dynamic half is the test
  // immediately above. A selector-only check alone would miss a JS-level coupling (e.g.
  // render() suppressing the cue on aria-disabled); a rendering-only check alone would miss a
  // selector that happens not to collide in the fixtures tested without proving the general
  // rule. Both are required.
  const busySelectors: string[] = [];
  const collect = (rules: CSSRuleList | readonly CSSRule[]) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes('busy')) {
        busySelectors.push(rule.selectorText);
      }
      if (rule instanceof CSSMediaRule) collect(rule.cssRules);
    }
  };
  collect(authoredButtonSheet.cssRules);
  expect(busySelectors.length, 'no busy-scoped rule was found to check').toBeGreaterThan(0);
  for (const selector of busySelectors) {
    expect(selector, `busy rule "${selector}" must not reference a disabling attribute`).not.toMatch(
      /:disabled|\[disabled\]|\[aria-disabled\]/,
    );
  }
});

test('[FR-007/FR-008/FR-011] accessible name is unchanged by busy, and no live region exists', async () => {
  // Text fixture.
  const textEl = await mount({ variant: 'primary' }, 'Save changes');
  await expect.element(partOf(textEl)).toHaveAccessibleName('Save changes');
  textEl.setAttribute('busy', '');
  await (textEl as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  await expect.element(partOf(textEl)).toHaveAccessibleName('Save changes');

  // Icon-only fixture — the accessible name comes solely from `label`.
  const iconEl = await mount({ variant: 'primary', size: 'icon', label: 'Send invitation' }, '✉');
  await expect.element(partOf(iconEl)).toHaveAccessibleName('Send invitation');
  iconEl.setAttribute('busy', '');
  await (iconEl as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  await expect.element(partOf(iconEl)).toHaveAccessibleName('Send invitation');

  // No live region, role="status", or aria-live in EITHER state, on either fixture (C-003,
  // FR-008) — the component reports state; it never narrates it.
  for (const el of [textEl, iconEl]) {
    for (const busyState of [true, false]) {
      if (busyState) el.setAttribute('busy', '');
      else el.removeAttribute('busy');
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      const tree = el.shadowRoot!;
      expect(tree.querySelector('[role="status"]')).toBe(null);
      expect(tree.querySelector('[aria-live]')).toBe(null);
    }
  }
});

test('[FR-009/FR-010] reduced motion stops the animation while the cue stays visible; the base rule is solid-bordered', () => {
  // Mirrors sk-status-indicator.test.ts's "authored pulse CSS has ... fallbacks" technique
  // exactly: assert the AUTHORED sheet carries the guard, not a single browser's runtime
  // interpretation of the media query.
  const busySelector = '.sk-button--busy .sk-button__busy-cue, :host([busy]) .sk-button__busy-cue';
  const busyRule = styleRuleFor(authoredButtonSheet.cssRules, busySelector)!;
  expect(busyRule, 'the busy-visible rule was not found').not.toBeUndefined();
  expect(busyRule.style.visibility).toBe('visible');
  expect(busyRule.style.opacity).toBe('1');
  expect(busyRule.style.animationName).toBe('sk-button-busy-spin');

  const reduced = mediaRuleFor('(prefers-reduced-motion: reduce)')!;
  expect(reduced, 'no (prefers-reduced-motion: reduce) block was found').not.toBeUndefined();
  const reducedBusy = styleRuleFor(reduced.cssRules, busySelector)!;
  expect(reducedBusy, 'the reduced-motion block does not scope the busy-cue selector').not.toBeUndefined();
  expect(reducedBusy.style.animationName).toBe('none');
  // NOT RESET to the idle-hidden values — the frozen frame stays visible. This rule restates
  // no visibility/opacity of its own, so the busy-visible rule's cascade values remain in
  // effect, which the idle (non-busy) base rule below proves are distinguishable from absent.
  expect(reducedBusy.style.visibility, 'reduced motion must not restate visibility').toBe('');
  expect(reducedBusy.style.opacity, 'reduced motion must not restate opacity').toBe('');

  const idleCue = styleRuleFor(authoredButtonSheet.cssRules, '.sk-button__busy-cue')!;
  expect(idleCue, 'the idle (at-rest) cue rule was not found').not.toBeUndefined();
  expect(idleCue.style.visibility, 'idle must be hidden for the busy state to be distinguishable').toBe('hidden');
  expect(idleCue.style.opacity).toBe('0');
  expect(idleCue.style.borderStyle, 'the resting ring must be solid-bordered').toBe('solid');

  // No forced-colors override exists for the cue (T001 Activity Log: checked, not assumed
  // absent) — a plain `border` survives forced-colors automatically with zero author CSS
  // (docs/contributing/adding-a-component.md), and this cue is entirely border-drawn. The base
  // rule's solid border-style, asserted above, is the only thing FR-010 needs from this file.
  expect(mediaRuleFor('(forced-colors: active)'), 'no forced-colors override should exist for the cue').toBeUndefined();
});

test('[FR-002] the static markup module threads busy through to the shared class list', () => {
  expect(buttonClasses('primary', undefined, true)).toContain('sk-button--busy');
  expect(buttonClasses(undefined, undefined, false)).not.toContain('sk-button--busy');
  expect(buttonClasses(undefined, undefined, undefined)).not.toContain('sk-button--busy');

  const buttonMarkup = buttonStaticHtml({ busy: true, variant: 'primary' });
  expect(buttonMarkup).toContain('sk-button--busy');
  const parsedButton = new DOMParser().parseFromString(buttonMarkup, 'text/html').querySelector('button')!;
  expect(parsedButton.className.split(' ')).toContain('sk-button--busy');

  const anchorMarkup = buttonStaticHtml({ busy: true, href: '/x' });
  expect(anchorMarkup).toContain('sk-button--busy');
  const parsedAnchor = new DOMParser().parseFromString(anchorMarkup, 'text/html').querySelector('a')!;
  expect(parsedAnchor.className.split(' ')).toContain('sk-button--busy');

  // `busy` is a plain boolean, never interpolated as a string into an attribute — unlike
  // `href` (tested above in "the static ANCHOR branch renders..."), it introduces no new
  // escaping question. Stated explicitly rather than left unstated (T006 step 5).
  expect(parsedAnchor.getAttributeNames().sort()).toEqual(['class', 'href']);

  // THE STATIC FORM RENDERS NO CUE MARKUP — this is the whole point of the boundary recorded
  // in both sk-button.css's header comment and sk-button.markup.ts's doc comment.
  expect(buttonMarkup).not.toContain('busy-cue');
  expect(anchorMarkup).not.toContain('busy-cue');
});
