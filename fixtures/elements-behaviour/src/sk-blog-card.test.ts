/**
 * <sk-blog-card> — #78, the stylesheet-composition ruling.
 *
 * SC-013 and SC-014, plus the claims that ruling turns on: the element adopts BOTH sheets, the
 * frame comes from sk-card's, and there is exactly ONE root carrying both classes — so the two
 * consumption paths cannot diverge the way they would have under element nesting.
 */
import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';
import {
  PLACEHOLDER_THUMBNAIL,
  blogCardStaticHtml,
  skBlogCardSheet,
  skCardSheet,
} from '@spec-kitty/elements';
import { installTokenSheet } from './token-sheet.js';

beforeEach(installTokenSheet);

const mount = async (attrs: Record<string, string> = {}) => {
  const el = document.createElement('sk-blog-card');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML = '<h3 class="sk-blog-card__title">Title</h3><p class="sk-blog-card__excerpt">Body</p>';
  document.body.append(el);
  await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  return el;
};

const partOf = (el: Element, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;

test('[SC-013] every declared part is targetable from outside', async () => {
  // Mounted WITH a thumbnail, because that part is absent without one — asserted separately.
  const el = await mount({ thumbnail: PLACEHOLDER_THUMBNAIL, 'alt': 'diagram' });
  const cases: readonly (readonly [string, string])[] = [
    ['card', 'sk-blog-card::part(card) { outline-style: dashed; }'],
    ['content', 'sk-blog-card::part(content) { outline-style: dashed; }'],
    ['thumbnail', 'sk-blog-card::part(thumbnail) { outline-style: dashed; }'],
  ];
  for (const [name, rule] of cases) {
    const s = document.createElement('style');
    s.textContent = rule;
    document.head.append(s);
    try {
      const node = partOf(el, name);
      expect(node, `part="${name}" is declared but not rendered`).not.toBe(null);
      expect(getComputedStyle(node!).outlineStyle, `::part(${name}) is not targetable`).toBe('dashed');
    } finally {
      s.remove();
    }
  }
  expect(cases.length, 'the case table went empty').toBe(3);
});

test('[SC-014] the element adopts BOTH generated sheets by identity and injects no <style>', async () => {
  // TWO sheets, by identity, in order. This is the composition ruling's whole mechanism: the
  // frame is authored once in sk-card.css and IMPORTED here, never copied — which is the
  // distinction ADR-8 criterion 3 turns on. Order is load-bearing: sk-card first, so
  // blog-card's rules win where the two touch.
  const el = await mount();
  const sr = el.shadowRoot!;
  expect(sr.adoptedStyleSheets.length, 'both sheets must be adopted').toBe(2);
  expect(sr.adoptedStyleSheets[0], 'sk-card.css must be adopted FIRST').toBe(skCardSheet);
  expect(sr.adoptedStyleSheets[1]).toBe(skBlogCardSheet);
  expect(sr.querySelectorAll('style').length).toBe(0);
});

test('the FRAME comes from sk-card, and it is one box, not two', async () => {
  // The claim the ruling chose over nesting. If <sk-blog-card> had rendered a nested <sk-card>,
  // the bordered box would sit a shadow root deeper and `.sk-blog-card` could not name it —
  // every shared declaration would then have to be written twice, once plain and once through
  // ::part(card). Asserting the single root is what stops someone "fixing" this by nesting.
  const el = await mount();
  const card = partOf(el, 'card')!;
  expect(card.tagName, 'the root must be an article, as the static form is').toBe('ARTICLE');
  expect(el.shadowRoot!.querySelector('sk-card'), 'no nested element — the SHEETS compose').toBe(null);

  // BOTH classes on that one node.
  expect(card.classList.contains('sk-card'), 'the frame class is missing').toBe(true);
  expect(card.classList.contains('sk-blog-card'), 'the layout class is missing').toBe(true);

  // And the frame's own declarations are live, which only holds because sk-card.css is adopted.
  const cs = getComputedStyle(card);
  expect(cs.backgroundColor, 'sk-card.css is not adopted — the surface is unset').not.toBe('rgba(0, 0, 0, 0)');
  expect(parseFloat(cs.borderTopWidth), 'the frame border is missing').toBeGreaterThan(0);
  expect(parseFloat(cs.paddingLeft), 'the frame padding is missing').toBeGreaterThan(0);
  // blog-card's own layout is live on the SAME node.
  expect(cs.display, "blog-card's flex column is missing").toBe('flex');
  expect(cs.flexDirection).toBe('column');
});

test('the thumbnail is ABSENT without a src, not an empty image', async () => {
  // An empty <img> is a broken-image icon, not a neutral placeholder.
  const plain = await mount();
  expect(partOf(plain, 'thumbnail'), 'no thumbnail attribute must render no <img>').toBe(null);
  expect(plain.shadowRoot!.querySelectorAll('img').length).toBe(0);

  const withImage = await mount({ thumbnail: PLACEHOLDER_THUMBNAIL, 'alt': 'diagram' });
  const img = partOf(withImage, 'thumbnail') as HTMLImageElement;
  expect(img).not.toBe(null);
  expect(img.getAttribute('alt'), 'the alt text must reach the image').toBe('diagram');

  // Both paths agree.
  expect(blogCardStaticHtml({})).not.toContain('<img');
  expect(blogCardStaticHtml({ thumbnail: 'x.png', alt: 'y' })).toContain('alt="y"');
});

test('the eyebrow is absent without one, and precedes the slotted title when present', async () => {
  const plain = await mount();
  expect(plain.shadowRoot!.querySelector('.sk-blog-card__eyebrow')).toBe(null);

  const el = await mount({ eyebrow: 'Field notes' });
  const eyebrow = el.shadowRoot!.querySelector('.sk-blog-card__eyebrow')!;
  expect(eyebrow.textContent).toBe('Field notes');
  // Inside the content column, before the slot — the reading order the design depends on.
  const content = partOf(el, 'content')!;
  const kids = Array.from(content.children);
  expect(kids.indexOf(eyebrow), 'the eyebrow must come first in the content column').toBe(0);
  expect(kids[1]?.tagName, 'the slot must follow the eyebrow').toBe('SLOT');
});

test('the class list is identical on both paths', async () => {
  const el = await mount();
  expect(partOf(el, 'card')!.className).toBe('sk-card sk-blog-card');
  expect(blogCardStaticHtml({})).toContain('class="sk-card sk-blog-card"');
});
