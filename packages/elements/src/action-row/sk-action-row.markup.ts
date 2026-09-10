// The AUTHORED markup source for sk-action-row (ADR-10 §3, #307).
//
// EVALUATED IN A BARE NODE PROCESS by scripts/build-element-markup.mjs. It may import a LEAF —
// a module with no imports of its own, like status-indicator/status-tones.ts — and may NOT reach
// anything that needs a browser. This module needs no shared vocabulary, so it imports nothing.
//
// THE TWO-ELEMENT WRAPPER, and why this file emits it even though no shipped stylesheet defines
// `.sk-action-row-host` yet. ADR-15 ruled on the shape for any component whose `:host` carries
// `container-type` — this is one of the four (`sk-action-row.css`'s own header comment names the
// other three) — and the ruling is: freeze the wrapper markup and its CSS CONTRACT together, but
// the generated `.sk-action-row-host` RULE is #309/#310's scope, gated on the equivalence check
// #310 adds. So `actionRowStaticHtml` below always emits
// `<div class="sk-action-row-host"><div class="sk-action-row">…</div></div>`, and this mission's
// own tests/docs author the CSS block locally — the same block `sk-action-row.css`'s header
// comment already documents — until #309 replaces the hand-authored copy with a generated one.
// NEVER a single-element collapse: an element is never its own container-query container.
//
// THE WRAPPER'S CSS IS NOT THIS FILE'S TO STATE AS A FIXED LIST. `sk-action-row.css`'s `:host`
// today declares `display: block; min-width: 0; container-type: inline-size`, and the contract is
// "whatever `:host` declares", not a copy frozen here. This module does not restate it — see
// `docs/design-system/using-components.md` and `fixtures/elements-behaviour/src/sk-action-row.test.ts`
// for the two places that recite the literal block, both textually pinned to the sheet's own
// header comment so they cannot silently diverge from it.

/**
 * `sk-action-row` has no mutually-exclusive variant enum — unlike `sk-card`'s `blue`/`purple`,
 * `layout` and `presentation` are independent boolean axes (both, either or neither may apply).
 * Required by the generator even when empty: `?? {}` cannot distinguish "this component has no
 * variants" from "I looked for the wrong export name" (see `sk-grid.markup.ts`'s comment on
 * exactly this).
 */
export const ACTION_ROW_VARIANTS = {} as const;

/** The `layout` axis. Only `card` is a recognised value; anything else degrades to the row layout. */
export const ACTION_ROW_LAYOUTS = { card: 'sk-action-row--card' } as const;

export type ActionRowLayoutValue = keyof typeof ACTION_ROW_LAYOUTS;

/** The `presentation` axis. Only `flush` is recognised; anything else keeps the bordered card. */
export const ACTION_ROW_PRESENTATIONS = { flush: 'sk-action-row--flush' } as const;

export type ActionRowPresentationValue = keyof typeof ACTION_ROW_PRESENTATIONS;

// `Object.hasOwn`, never `in` and never a truthiness test on the lookup. `in` reaches the
// PROTOTYPE CHAIN — `'constructor' in ACTION_ROW_LAYOUTS` is true, and
// `ACTION_ROW_LAYOUTS['constructor']` is a function, which `actionRowClasses` would then push
// into the class list as `class="sk-action-row function Object() { [native code] }"`. This
// module also generates server-rendered HTML, so that string would reach real markup. sk-card
// and sk-grid both record paying for this once; it is not repeated here.
export function isActionRowLayout(value: string): value is ActionRowLayoutValue {
  return Object.hasOwn(ACTION_ROW_LAYOUTS, value);
}

export function isActionRowPresentation(value: string): value is ActionRowPresentationValue {
  return Object.hasOwn(ACTION_ROW_PRESENTATIONS, value);
}

export const unknownLayoutMessage = (value: string): string =>
  `unknown action-row layout "${value}" — expected one of ${Object.keys(ACTION_ROW_LAYOUTS).join(', ')}`;

export const unknownPresentationMessage = (value: string): string =>
  `unknown action-row presentation "${value}" — expected one of ${Object.keys(ACTION_ROW_PRESENTATIONS).join(', ')}`;

// TWO CALLERS, TWO FAILURE POLICIES, and collapsing them is a regression this repo has already
// had and reverted (see sk-card.markup.ts and sk-grid.markup.ts). `actionRowClasses` runs on the
// RENDER path — in a browser today only implicitly (`sk-action-row.ts` still inlines its own
// ternary; refactoring it to call this helper is not required by this WP and is left alone
// rather than restating ADR-10 §3's "no markup authored twice" outside markup itself). Throwing
// there would make Lit reject `updateComplete` and paint an empty shadow root with no `<slot>` —
// silently eating the row's own light-DOM children. So it warns and degrades to the base row.
// `actionRowStaticHtml` runs on the AUTHORING path at build time, where a bad value must never
// reach committed output, so it throws.

/** The row's class list. Warns and degrades on an unrecognised `layout` or `presentation`. */
export function actionRowClasses(layout?: string, presentation?: string): string {
  if (layout !== undefined && !isActionRowLayout(layout)) {
    console.warn(`sk-action-row: ${unknownLayoutMessage(layout)} — rendering the base row.`);
    layout = undefined;
  }
  if (presentation !== undefined && !isActionRowPresentation(presentation)) {
    console.warn(`sk-action-row: ${unknownPresentationMessage(presentation)} — rendering the bordered row.`);
    presentation = undefined;
  }
  return [
    'sk-action-row',
    layout ? ACTION_ROW_LAYOUTS[layout as ActionRowLayoutValue] : '',
    presentation ? ACTION_ROW_PRESENTATIONS[presentation as ActionRowPresentationValue] : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export interface ActionRowStaticOptions {
  layout?: 'card';
  presentation?: 'flush';
  /** A non-blank value selects the native `<a>` route trigger; blank/absent selects the static div. */
  href?: string;
  /**
   * The current-row presentation flag. Named `current`, not `selected`: the static form has no
   * activation concept to select FROM (there is no listener, no `rowId`, no `selectable`) — it is
   * a purely presentational marker, and the name should not imply a control that does not exist
   * statically. Drives `aria-current="true"` on the row (non-route) or `aria-current="page"` on
   * the anchor (route) — never both, mirroring the element's own
   * `route ? 'page' on the anchor : 'true' on the row` branch in `sk-action-row.ts`'s `render()`.
   */
  current?: boolean;
}

/**
 * The scan-content parts, each optional except `title` — the one part the issue never marks
 * optional (data-model.md). Each is caller-supplied and rendered RAW (element-content position,
 * not attribute position), matching every sibling markup module's `content` parameter — in-repo
 * callers only ever pass plain text/markup fragments, the same latent-not-live scope
 * `sk-button.markup.ts` records for its own `content` parameter.
 */
export interface ActionRowContent {
  mark?: string;
  title: string;
  reference?: string;
  tags?: string;
  metadata?: string;
  supporting?: string;
  /** Trailing controls markup. Rendered as a SIBLING of the trigger, never nested inside it
   *  (#272, load-bearing) — see the controls placement below. Omitted entirely, not merely
   *  hidden, when blank (FR-014): there is no slotchange script to un-hide it statically. */
  controls?: string;
}

const ACTION_ROW_TITLE_ID = 'sk-action-row-title';

/**
 * The placeholder content, so the generated `.html` demonstrates the anatomy it documents —
 * including trailing controls, so every generated exemplar (base, Card, Flush, Link) exercises
 * the sibling-not-descendant structure FR-006/FR-007 freeze, the same reasoning
 * `sk-feature-card.markup.ts` and `sk-grid.markup.ts` record for their own placeholders.
 */
const PLACEHOLDER_CONTENT: ActionRowContent = {
  mark: '<span aria-hidden="true">●</span>',
  title: 'Row title',
  reference: '/path/to/resource',
  tags: '<span class="sk-pill-tag">Tag</span>',
  metadata: '2 hours ago',
  supporting: 'Supporting detail about this row.',
  // Plain, dependency-free markup — never `sk-button` classes. `.sk-action-row__controls`
  // styles only layout (display/gap/padding); it does not colour its children, matching the
  // shadow form, where a real consumer's own button/link/`sk-button` owns its own contrast. An
  // earlier revision of this placeholder used `sk-button--ghost` classes with no `sk-button.css`
  // loaded alongside — the classes were inert, the UA default link colour took over, and axe
  // caught a real WCAG AA color-contrast failure against the dark surface on every generated
  // exemplar and story that rendered this default content. `color: inherit` picks up
  // `.sk-action-row`'s own `--sk-fg-body`, already used (and already passing axe) elsewhere on
  // this row.
  controls:
    '<button type="button" style="color:inherit;font:inherit;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;">Action</button>',
};

/** Omits the wrapper element entirely when `value` is blank — never an empty shell (FR-013). */
const part = (className: string, value: string | undefined, id?: string): string => {
  if (value === undefined || value.trim() === '') return '';
  const idAttr = id === undefined ? '' : ` id="${id}"`;
  return `<span${idAttr} class="${className}">${value}</span>`;
};

// `href` is the only caller-supplied value this module puts in ATTRIBUTE position, and
// `actionRowStaticHtml` is public API, so `actionRowStaticHtml({ href: '" onfocus=alert(1) x="' })`
// would otherwise close the attribute and emit an event handler into committed markup. Asserted
// by parsing in sk-action-row.test.ts, not by substring — matching `sk-button.markup.ts`'s own
// documented test approach.
//
// Local rather than shared, for the same reason `sk-button.markup.ts` gives: #163 owns the
// shared escaper; this copy stays until that lands.
const attr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * The static form. THROWS on an unrecognised `layout`/`presentation`, or on a missing/blank
 * `content.title` — the authoring-time policy: a bad value must not reach committed output.
 *
 * TWO TRIGGER SHAPES ONLY (FR-008/009/010) — never a `<button>`. `sk-action-row.ts`'s third
 * trigger shape emits `sk-action-row-activate` from a click listener the static form does not
 * have; promising it here would freeze an activation contract this form cannot keep. A non-blank
 * `href` selects the native `<a>` route trigger; otherwise the static, non-interactive div.
 *
 * CONTROLS ARE A SIBLING OF THE TRIGGER, never its descendant (#272) — both are children of the
 * outer `.sk-action-row` div, controls placed after the trigger, reproducing
 * `sk-action-row.ts`'s own DOM shape exactly. Omitted entirely (not `hidden`) when blank.
 */
export function actionRowStaticHtml(
  opts: ActionRowStaticOptions = {},
  content: ActionRowContent = PLACEHOLDER_CONTENT,
): string {
  const { layout, presentation, href, current } = opts;
  if (layout !== undefined && !isActionRowLayout(layout)) throw new Error(unknownLayoutMessage(layout));
  if (presentation !== undefined && !isActionRowPresentation(presentation)) {
    throw new Error(unknownPresentationMessage(presentation));
  }
  if (typeof content.title !== 'string' || content.title.trim() === '') {
    throw new Error('sk-action-row: content.title is required and must be non-blank');
  }

  const route = typeof href === 'string' && href.trim() !== '';
  const rowCurrentAttr = current === true && !route ? ' aria-current="true"' : '';
  const triggerCurrentAttr = current === true && route ? ' aria-current="page"' : '';

  const scanContent = [
    part('sk-action-row__marker', content.mark),
    part('sk-action-row__title', content.title, ACTION_ROW_TITLE_ID),
    part('sk-action-row__reference', content.reference),
    part('sk-action-row__tags', content.tags),
    part('sk-action-row__metadata', content.metadata),
    part('sk-action-row__supporting', content.supporting),
  ].join('');

  const trigger = route
    ? `<a class="sk-action-row__trigger" href="${attr(href!)}" aria-labelledby="${ACTION_ROW_TITLE_ID}"${triggerCurrentAttr}>${scanContent}</a>`
    : `<div class="sk-action-row__trigger sk-action-row__trigger--static">${scanContent}</div>`;

  const controls =
    content.controls !== undefined && content.controls.trim() !== ''
      ? `<div class="sk-action-row__controls">${content.controls}</div>`
      : '';

  const row = `<div class="${actionRowClasses(layout, presentation)}"${rowCurrentAttr}>${trigger}${controls}</div>`;

  return `<div class="sk-action-row-host">${row}</div>`;
}

/**
 * The static forms this component publishes, beyond the base.
 *
 * Required by the generator even when it would otherwise be sparse: `?? {}` cannot distinguish
 * "no axes" from "wrong export name" (`sk-grid.markup.ts`'s comment on exactly this).
 *
 * `Card` and `Flush` give each independent boolean axis its own generated export. `Link` gives
 * the ANCHOR branch of `actionRowStaticHtml` its coverage — mirroring `BUTTON_AXES.Link` in
 * `sk-button.markup.ts` — because the route trigger is the shape every real Team Kitty row uses
 * (Family 4's T1 workspace/invitation rows), not an edge case. `Current` and `RouteCurrent` give
 * the styles-layer story (which may not import this module directly — `scope:styles` may only
 * depend on `scope:tokens`) a generated export for each of `aria-current`'s two present shapes
 * (FR-011), since the generator's own opts-only axis mechanism is the only route a static export
 * can vary `current` through without the story hand-authoring the wrapper markup a second time.
 */
export const ACTION_ROW_AXES = {
  Card: { layout: 'card' },
  Flush: { presentation: 'flush' },
  Link: { href: '#' },
  Current: { current: true },
  RouteCurrent: { href: '#', current: true },
} as const satisfies Record<string, ActionRowStaticOptions>;
