// The AUTHORED markup source for sk-blog-card (ADR-10 §3).
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL.
//
// THIS COMPONENT COMPOSES sk-card, and the operator ruling on #78 is that it composes the
// STYLESHEETS rather than nesting the elements.
//
// Why that matters here more than anywhere else. `sk-blog-card.css` has always stated the
// contract in its own header: "apply both classes, e.g. class='sk-card sk-blog-card'. sk-card
// owns the frame, surface, border, radius, padding and transition; sk-blog-card adds only
// blog-specific layout and slots." Statically that is ONE box, so `.sk-blog-card { display:
// flex }` and `.sk-blog-card:hover { border-color }` both name the bordered element directly.
//
// Nesting a real <sk-card> would move that bordered box one shadow root deeper, where
// `.sk-blog-card` cannot name it — reaching it would need `::part(card)`, which the static path
// has no equivalent for, so the same declarations would have to be written twice in the file
// whose job is to be the single source. Adopting both sheets keeps it one box on both paths.
// `sk-card.css` stays authored exactly once and is IMPORTED, not copied, which is the
// distinction ADR-8 criterion 3 is actually about.

/** No colour or shape variants — a blog card is one thing. Declared explicitly because the
 *  generator cannot distinguish an absent export from an empty one. */
export const BLOG_CARD_VARIANTS = {} as const;

export interface BlogCardStaticOptions {
  /** The thumbnail's `src`. Omitted entirely when absent — an empty <img> is a broken image
   *  icon, not a neutral placeholder. */
  thumbnail?: string;
  /** Alt text for the thumbnail. Required whenever `thumbnail` is set. */
  alt?: string;
  eyebrow?: string;
}

// ESCAPING. `blogCardStaticHtml` is public API and interpolates caller strings into ATTRIBUTE
// position, and an earlier revision did it raw — so
// `blogCardStaticHtml({ thumbnail: 'x.png" onerror="alert(1)' })` emitted a live event handler
// into committed markup, with no `javascript:` scheme needed. #140 closed exactly this class in
// sk-button one commit earlier and this component reopened it.
//
// WHAT IS AND IS NOT ESCAPED, stated fully because an earlier revision of this comment claimed
// "all three vectors" and a lens counted four. `thumbnail` and `alt` go through `attr()` into
// quoted attributes; `eyebrow` goes through `text()` into a text node. `content` is the fourth
// caller-supplied value and is deliberately RAW — it is the slot for the title, excerpt and
// meta markup, so escaping it would break the documented use. That is the same convention
// sk-button records for its own `content`, and it means "this module escapes caller input" is
// never wholly true. A consumer passing untrusted text should escape it themselves.
//
// Local rather than shared because the generator evaluates this module from a `data:` URL, which
// has no module base, so a relative import fails. Note that is a property of the CURRENT
// generator, not of the architecture — a lens showed `esbuild.build({ bundle: true })` would
// inline a shared helper, which is how the runtime bundle already ships this function. Both the
// bundling fix and a gate for the class are filed as #163; this is the second copy until then.
// ONE canonical list. `attr` is `text` plus the two quote characters — derived rather than
// respelled, because an earlier revision wrote the `& < >` chain twice inside eleven lines and
// a lens pointed out that two copies of one escaping rule is exactly what drifts.
const text = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const attr = (value: string): string =>
  text(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// The diagnostic is INLINED at its one call site below, not wrapped in a helper. An earlier
// revision declared `missingAltMessage()` — a zero-argument function returning a constant,
// documented as "shared" while being unexported with a single caller, so the element's warn
// re-typed the text and the two copies already disagreed. That is the same defect this fold's
// headline change removes (the element re-typing class strings), reintroduced one file over. A
// lens caught it. The leaf constraint means the element genuinely cannot import it, so the
// honest fix is one message per path with the SAME wording, not a helper that pretends to
// share.

/**
 * The class names this component renders, named once.
 *
 * `root` carries BOTH classes, which is the whole point of the composition ruling — one box
 * styled by two adopted sheets rather than a nested element.
 */
export const BLOG_CARD_CLASSES = {
  root: 'sk-card sk-blog-card',
  thumbnail: 'sk-blog-card__thumbnail',
  content: 'sk-blog-card__content',
  eyebrow: 'sk-blog-card__eyebrow',
} as const;

// A CONST, NOT A ZERO-ARGUMENT `blogCardClasses()`. The siblings export a function because they
// have variants to narrow; this component has none, so a function would be a call that can only
// ever return one string — the shape a lens flagged on sk-check-bullet's equivalent.
//
// WHY IT EXISTS AT ALL: the element used to re-type these four strings in its own `render()`,
// so `sk-blog-card` was the only component in the repo with a markup module its element did not
// render from — markup AUTHORED TWICE, which is exactly what ADR-8 criterion 3 forbids, on the
// component whose entire argument is that the two paths are one shape. Worse, the programme
// doc's measure of that criterion is "has a `*.markup.ts`", so blog-card counted as compliant
// while being the counter-example. A lens caught it.

/**
 * The static form.
 *
 * BOTH CLASSES ON ONE ELEMENT. The element renders from the same `BLOG_CARD_CLASSES` above, so
 * the two paths cannot diverge — that is now enforced by construction rather than asserted.
 */
export function blogCardStaticHtml(
  opts: BlogCardStaticOptions = {},
  content = '<h3 class="sk-blog-card__title">Article title</h3>' +
    '<p class="sk-blog-card__excerpt">What the article is about.</p>' +
    '<p class="sk-blog-card__meta">Date · reading time</p>',
): string {
  const { thumbnail, alt, eyebrow } = opts;

  // THROWS ON THE AUTHORING PATH. Every other static helper in this repo does — button, card,
  // feature-card, grid, pill-tag, ribbon-card, section-banner — and this one did neither that
  // nor the render path's warn, so `blogCardStaticHtml({ thumbnail: 'photo.png' })` emitted
  // `alt=""` into COMMITTED generated output with no signal. `alt=""` is not a missing label; it
  // is a positive assertion that the image is decorative, so a screen reader skips it entirely.
  // Both this module's own interface comment and the element's JSDoc already called `alt`
  // required whenever `thumbnail` is set; nothing enforced it. A lens measured it.
  // THE GUARD LIVES INSIDE THE BRANCH THAT EMITS THE IMAGE, so the two cannot disagree and the
  // narrowing is real. An earlier revision guarded separately on `thumbnail !== undefined` while
  // the image was emitted on truthiness — so `blogCardStaticHtml({ thumbnail: '' })`, which is
  // type-legal and documented to mean "no image", threw demanding alt text for an `<img>` that
  // would never be emitted: a behaviour regression in public API with an actively misleading
  // message. Two lenses caught it. The separate guard also left TypeScript unable to narrow
  // `alt`, which is why that revision carried an `alt ?? ''` fallback emitting the very
  // `alt=""` the throw exists to forbid.
  let image = '';
  if (thumbnail) {
    if (!alt) {
      throw new Error(
        'sk-blog-card: `thumbnail` is set but `alt` is missing or empty. An empty alt asserts ' +
          'the image is decorative and hides it from assistive technology — pass alt text, or ' +
          'omit the thumbnail.',
      );
    }
    image = `<img class="${BLOG_CARD_CLASSES.thumbnail}" src="${attr(thumbnail)}" alt="${attr(alt)}">`;
  }
  const lead = eyebrow
    ? `<p class="${BLOG_CARD_CLASSES.eyebrow}">${text(eyebrow)}</p>`
    : '';
  return (
    `<article class="${BLOG_CARD_CLASSES.root}">` +
    image +
    `<div class="${BLOG_CARD_CLASSES.content}">${lead}${content}</div>` +
    `</article>`
  );
}

/**
 * A placeholder thumbnail, carried here so the generated forms show a real image.
 *
 * The same inline SVG the hand-written builder used before #78 — recovered rather than
 * re-drawn, so the catalogue's committed visual baseline does not move.
 */
export const PLACEHOLDER_THUMBNAIL =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 675%22%3E%3Crect width=%221200%22 height=%22675%22 fill=%22%2314202E%22/%3E%3Cpath d=%22M0 520 C240 410 410 600 630 460 C810 344 980 390 1200 250 L1200 675 L0 675 Z%22 fill=%22%23F5C518%22 opacity=%220.45%22/%3E%3Cpath d=%22M0 330 C260 250 440 420 690 280 C910 156 1030 220 1200 96%22 fill=%22none%22 stroke=%22%23A9C7E8%22 stroke-width=%2244%22 stroke-linecap=%22round%22 opacity=%220.75%22/%3E%3C/svg%3E';

const PLACEHOLDER_ALT = 'Abstract yellow and blue architecture diagram';

/**
 * The axes, which are PRESENCE rather than colour.
 *
 * Before #78 these were four hand-written exports — Default, WithoutImage, WithoutEyebrow,
 * LongTitle — produced by a builder function taking booleans. Three of them are the two
 * optional regions in combination, so they are axes and the generator derives them. The fourth,
 * LongTitle, was a CONTENT variation and belongs in a story, which is where it now lives.
 */
export const BLOG_CARD_AXES = {
  WithImage: { thumbnail: PLACEHOLDER_THUMBNAIL, alt: PLACEHOLDER_ALT },
  WithEyebrow: { eyebrow: 'Field notes' },
  Full: { thumbnail: PLACEHOLDER_THUMBNAIL, alt: PLACEHOLDER_ALT, eyebrow: 'Field notes' },
} as const;
