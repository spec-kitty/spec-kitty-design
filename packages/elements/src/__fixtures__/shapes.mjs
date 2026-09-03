/**
 * The shapes the render assertion must discriminate (#70, FR-007/SC-005).
 *
 * Counts are deliberately NOT stated here. Four earlier drafts of this header said
 * "eleven"/"twelve" and "six deliberately fail" and every one was wrong after the
 * list grew; scripts/gate-selftest.mjs derives and prints the real numbers instead.
 * A comment stating a falsifiable number, stated wrong, is worse than no comment —
 * it is how the reason for a line gets lost while looking preserved.
 *
 * These are NOT Storybook stories. Many of them deliberately fail the assertion,
 * which throws. What keeps them out of the a11y job is the story glob's SUFFIX —
 * `.storybook/main.ts` globs `packages/** /*.stories.@(ts|tsx)`, and this file is
 * not a `.stories.ts`. (An earlier version of this comment claimed they were
 * "outside that glob" by virtue of their directory; `packages/elements/src/` is
 * squarely inside `packages/**`. The exclusion is real, the stated reason was not.)
 * They are driven by scripts/gate-selftest.mjs so the four newly shadow-aware sites
 * have a standing regression guard instead of a transcript in a PR body.
 *
 * `want` is what assertStoryRendered must return: true = rendered, false = caught.
 */
export const SHAPES = [
  // --- the shape the mission exists to support -----------------------------
  { id: 'shadow-real', want: true,
    html: '<div id="storybook-root"><x-a></x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"><span class="sk-thing__label">hello</span></div>' } },

  // --- the six NFR-002 shapes, as the ENTIRE content of an open shadow root --
  { id: 'shadow-empty', want: false,
    html: '<div id="storybook-root"><x-a></x-a></div>', shadow: { 'x-a': '' } },
  { id: 'shadow-wrapper-only', want: false,
    html: '<div id="storybook-root"><x-a></x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"></div>' } },
  { id: 'shadow-bem-element-only', want: false,
    html: '<div id="storybook-root"><x-a></x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"><span class="sk-thing__label"></span></div>' } },
  { id: 'shadow-empty-svg', want: false,
    html: '<div id="storybook-root"><x-a></x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"><svg></svg></div>' } },
  { id: 'shadow-img-empty-alt', want: false,
    html: '<div id="storybook-root"><x-a></x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"><img alt=""></div>' } },
  { id: 'shadow-empty-aria-label', want: false,
    html: '<div id="storybook-root"><x-a></x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"><span aria-label="x"></span></div>' } },

  // --- per-host discrimination inside a shadow tree -------------------------
  { id: 'shadow-empty-block-beside-text', want: false,
    html: '<div id="storybook-root"><x-a></x-a></div>',
    shadow: { 'x-a': '<span>sibling text</span><div class="sk-thing"></div>' } },

  // --- the three a real component hits (post-tasks squad) -------------------
  // Slotted content lives in the LIGHT dom. A traversal that walks the shadow
  // root INSTEAD of childNodes makes this invisible and fails a correct element.
  { id: 'slotted-content', want: true,
    html: '<div id="storybook-root"><x-a>slotted text</x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"><slot></slot></div>' } },
  { id: 'slot-nothing-assigned', want: false,
    html: '<div id="storybook-root"><x-a></x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"><slot></slot></div>' } },
  // Host nested inside ANOTHER element's shadow root: querySelectorAll crosses
  // nothing, so enumeration must recurse arbitrarily, not just at depth 1.
  // Light children with NO <slot> to receive them paint nowhere. Counting them as
  // content is the same certifying-absence failure as reading `textContent`: the
  // gate would report a blank component green.
  //
  // NOTE this one does NOT lock flatText's strict `return` after shadowRoot, though
  // an earlier comment here claimed it did. Host `x-a` matches neither /^sk-/i nor
  // BLOCK_CLASS, so the shape is rejected by the PER-HOST arm on the inner
  // div.sk-thing, not by flatText at all. Dropping that `return` leaves this shape
  // green. The sk-* twin below is what actually locks it — found by mutation, by
  // the pre-merge squad, not by reading.
  { id: 'unslotted-light-children', want: false,
    html: '<div id="storybook-root"><x-a>never painted</x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"></div>' } },

  // --- the sk-* host arm, which the twelve batch missions depend on entirely -----
  // Every shape above hosts on `x-a`/`x-outer`, so the hostsByTag arm of the
  // per-host check was dead code as far as this harness was concerned: it could be
  // deleted outright without a single red. That arm is what will carry the whole
  // catalogue once #71/#72 land real custom elements, whose shadow markup has no
  // reason to keep BEM block classes.
  //
  // This pair also locks flatText's strict `return`: light text that paints nowhere,
  // with no shadow content, must still be REJECTED.
  { id: 'sk-host-unslotted-light', want: false,
    html: '<div id="storybook-root"><sk-x>never painted</sk-x></div>',
    shadow: { 'sk-x': '<div class="sk-x__body"></div>' } },
  { id: 'sk-host-shadow-text', want: true,
    html: '<div id="storybook-root"><sk-x></sk-x></div>',
    shadow: { 'sk-x': '<div class="sk-x__body">hi</div>' } },

  // The picture/video/canvas tightening in CONTENT_MEDIA_SELECTOR. Loosening those
  // three arms to bare `picture, video, canvas` survived all 22 shapes — the fix
  // shipped and the fixture that keeps it from being undone did not. An empty
  // <picture> is a wrapper, not content, and this is the certifying-absence
  // direction: without it the gate reports a blank card green. Found by mutation at
  // the re-run gate.
  { id: 'empty-picture-in-shadow', want: false,
    html: '<div id="storybook-root"><sk-x></sk-x></div>',
    shadow: { 'sk-x': '<div class="sk-x__body"><picture></picture><video></video><canvas width="0"></canvas></div>' } },
  // ...and the legitimate half, so the arms cannot simply be deleted either.
  { id: 'real-picture-in-shadow', want: true,
    html: '<div id="storybook-root"><sk-x></sk-x></div>',
    shadow: { 'sk-x': '<div class="sk-x__body"><picture><img alt="a cat"></picture></div>' } },

  // The icon-only case run-axe-storybook.js explicitly promises to keep green:
  // "<button class=\"sk-btn\" aria-label=\"Close\"><svg><path/></svg></button>".
  // No other shape puts MEDIA as the sole content of a shadow root, so flatMatch's
  // shadow-crossing could be removed silently. That failure is fail-CLOSED rather
  // than green — but it would red-line every icon component in #72 and be
  // misattributed to the story rather than to the gate.
  { id: 'icon-only-in-shadow', want: true,
    html: '<div id="storybook-root"><sk-x></sk-x></div>',
    shadow: { 'sk-x': '<button class="sk-btn" aria-label="Close"><svg><path/></svg></button>' } },

  // --- the SAME six shapes, in LIGHT DOM (NFR-002) --------------------------
  // The list runs twice on purpose. Piercing shadow roots is a widening change,
  // and the cheapest way to make every shadow case pass is to weaken the content
  // test itself — which would silently un-gate the 60-odd light-DOM stories that
  // are most of the catalogue today. These are the regression half.
  { id: 'light-empty-root', want: false,
    html: '<div id="storybook-root"></div>' },
  { id: 'light-wrapper-only', want: false,
    html: '<div id="storybook-root"><div class="sk-thing"></div></div>' },
  { id: 'light-bem-element-only', want: false,
    html: '<div id="storybook-root"><div class="sk-thing"><span class="sk-thing__label"></span></div></div>' },
  { id: 'light-empty-svg', want: false,
    html: '<div id="storybook-root"><div class="sk-thing"><svg></svg></div></div>' },
  { id: 'light-img-empty-alt', want: false,
    html: '<div id="storybook-root"><div class="sk-thing"><img alt=""></div></div>' },
  { id: 'light-empty-aria-label', want: false,
    html: '<div id="storybook-root"><div class="sk-thing"><span aria-label="x"></span></div></div>' },
  // Control: without this the light half is satisfiable by an assertion that
  // rejects everything, which is a gate that fails closed on the whole catalogue.
  { id: 'light-real', want: true,
    html: '<div id="storybook-root"><div class="sk-thing"><span class="sk-thing__label">hello</span></div></div>' },

  { id: 'nested-host-empty', want: false,
    html: '<div id="storybook-root"><x-outer></x-outer></div>',
    shadow: { 'x-outer': '<span>outer text</span><x-a></x-a>',
              'x-a': '<div class="sk-thing"></div>' } },
];
