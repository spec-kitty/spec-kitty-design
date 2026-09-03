/**
 * The eleven shapes the render assertion must discriminate (#70, FR-007/SC-005).
 *
 * These are NOT Storybook stories. Six of them deliberately fail the assertion,
 * which throws — inside Storybook's `packages/**` story glob they would make the
 * a11y job permanently red. They live here, outside that glob, and are driven by
 * scripts/gate-selftest.mjs so the four newly shadow-aware sites have a standing
 * regression guard instead of a transcript in a PR body.
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
  // gate would report a blank component green. Locks the strict `return` after
  // shadowRoot in flatChildren's callers.
  { id: 'unslotted-light-children', want: false,
    html: '<div id="storybook-root"><x-a>never painted</x-a></div>',
    shadow: { 'x-a': '<div class="sk-thing"></div>' } },

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
