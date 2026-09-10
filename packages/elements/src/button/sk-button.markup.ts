// The AUTHORED markup source for sk-button (ADR-10 §3).
//
// EVALUATED IN A BARE NODE PROCESS by scripts/build-element-markup.mjs. It may import a LEAF —
// a module with no imports of its own, like status-indicator/status-tones.ts — and may NOT reach
// anything that needs a browser. It was a strict leaf until #216: the generator evaluated it from
// a `data:` URL, which has no module base, so no import resolved at all.
//
// THE CLASS PREFIX CHANGED IN THIS MISSION. `.sk-btn*` became `.sk-button*` under the operator
// ruling on #139: `check-adopted-css-boundaries.mjs` derives ownership from the component's own
// name, and that is the mechanism making ADR-9 Confirmation #1 checkable at all — so a
// component whose classes are prefixed differently from its name cannot be verified. The
// alternative was a hand-maintained prefix map, which is the shape this programme has removed
// from four other places.

// The generator treats this map as the component's VARIANTS and emits one static export per
// entry. Kept out of the doc comment below because that prose is published verbatim into
// custom-elements.json and a consumer's IDE hover, where "the generator's variants" means
// nothing — a lens found six such leaks across this batch's markup modules.
/** The button's tone modifiers. */
export const BUTTON_VARIANTS = {
  primary: 'sk-button--primary',
  secondary: 'sk-button--secondary',
  ghost: 'sk-button--ghost',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

/** Size modifiers. A separate axis from tone: a button has a tone AND a size. */
export const BUTTON_SIZES = {
  sm: 'sk-button--sm',
  icon: 'sk-button--icon',
} as const;

export type ButtonSize = keyof typeof BUTTON_SIZES;

function isButtonVariant(v: string): v is ButtonVariant {
  return Object.hasOwn(BUTTON_VARIANTS, v);
}

function isButtonSize(s: string): s is ButtonSize {
  return Object.hasOwn(BUTTON_SIZES, s);
}

const unknownVariantMessage = (v: string): string =>
  `unknown button variant "${v}" — expected one of ${Object.keys(BUTTON_VARIANTS).join(', ')}`;

const unknownSizeMessage = (s: string): string =>
  `unknown button size "${s}" — expected one of ${Object.keys(BUTTON_SIZES).join(', ')}`;

// Two callers, two failure policies — warn and degrade on the render path, throw on the
// authoring path. The split sk-card paid for and #77 reproduced once in a gap arm.

/** The button's class list. Warns and degrades on an unknown variant or size. `busy` is a
 *  plain boolean append — unlike variant/size there is no "unknown busy value" failure mode,
 *  so no validation function is needed for it. */
export function buttonClasses(variant?: string, size?: string, busy?: boolean): string {
  if (variant !== undefined && !isButtonVariant(variant)) {
    console.warn(`sk-button: ${unknownVariantMessage(variant)} — rendering the base button.`);
    variant = undefined;
  }
  if (size !== undefined && !isButtonSize(size)) {
    console.warn(`sk-button: ${unknownSizeMessage(size)} — rendering the default size.`);
    size = undefined;
  }
  return [
    'sk-button',
    variant ? BUTTON_VARIANTS[variant as ButtonVariant] : '',
    size ? BUTTON_SIZES[size as ButtonSize] : '',
    busy ? 'sk-button--busy' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export interface ButtonStaticOptions {
  variant?: string;
  size?: string;
  /** Accessible name forwarded to the real control. Required for the `icon` size. */
  label?: string;
  /** When set, the static form emits an ANCHOR rather than a button — see the note below. */
  href?: string;
  /** Appends `.sk-button--busy`. THE STATIC FORM RENDERS NO CUE MARKUP — see the note on
   *  `buttonStaticHtml` below. A static consumer wanting the visual activity indicator authors
   *  their own node against this same generated stylesheet; this option only gets the class
   *  that the shadow form's cue rules key on. */
  busy?: boolean;
}

// `href` is the only caller-supplied value this module puts in ATTRIBUTE position, and
// `buttonStaticHtml` is public API, so `buttonStaticHtml({ href: '" onfocus=alert(1) x="' })`
// would otherwise close the attribute and emit an event handler into committed markup. Asserted
// by parsing in sk-button.test.ts, not by substring — see the note there.
//
// WHAT THIS DOES NOT CLOSE, stated because an earlier revision of this comment claimed a wider
// audit than it had performed and two lenses called it:
//   * `content` (below) is also caller-supplied and is deliberately left RAW. It lands in
//     element-content position, where callers legitimately pass markup fragments — the ribbon
//     and icon options in sibling modules do the same. In-repo callers only ever pass plain
//     text. It is a latent issue, not a live one, and escaping it would break the fragment use.
//   * The `javascript:` SCHEME survives escaping intact — `href="javascript:alert(1)"` reaches
//     script execution without ever breaking out of the attribute. Escaping is not a URL
//     allowlist. Filed as #159.
//
// Local rather than shared — but no longer BECAUSE it must be. The generator evaluated this
// module from a `data:` URL until #216, so it could import nothing; it now evaluates from a real
// module URL and a markup module may import a leaf. #163 owns the shared escaper; this copy stays
// until that lands.
//
// `'` is escaped too. It is not strictly needed while the template below uses double quotes,
// but this helper carries a generic name and sits one edit away from a single-quoted attribute.
const attr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');


/**
 * The static form. Throws on an unknown variant or size.
 *
 * ANCHOR OR BUTTON, decided by `href`, and this is not a convenience — it is what the
 * catalogue already does. Every real use of this class in `apps/demo` is an `<a href>` styled
 * as a button; the stories use `<button>`. One primitive, two elements, and the class list is
 * identical on both. So the element switches on the same signal rather than forcing consumers
 * to choose between a working link and a styled one.
 *
 * `busy` (#305) THREADS THE CLASS ONLY. `.sk-button--busy` reaches this output the same way
 * variant/size do — one CSS source, shared (ADR-10 §3). But the decorative cue node
 * (`sk-button.ts`'s `<span part="busy-cue">`) is never emitted here: this function has no
 * shadow root and no `render()` to conditionally attach it to, so a static consumer who wants
 * the visual cue must author their own element against the same generated stylesheet. This is
 * the same pattern ADR-15 already establishes for other constructs a static consumer must
 * author instead of receiving generated — stated explicitly here so a future reader does not
 * assume this branch renders an equivalent cue automatically. It does not, by design.
 */
export function buttonStaticHtml(opts: ButtonStaticOptions = {}, content = 'Label'): string {
  const { variant, size, label, href, busy } = opts;
  if (variant !== undefined && !isButtonVariant(variant)) throw new Error(unknownVariantMessage(variant));
  if (size !== undefined && !isButtonSize(size)) throw new Error(unknownSizeMessage(size));
  const validLabel = typeof label === 'string' && label.trim() ? label : undefined;
  if (size === 'icon' && validLabel === undefined) {
    throw new Error('sk-button: size="icon" requires a non-empty label');
  }
  const cls = buttonClasses(variant, size, busy);
  const labelAttribute = validLabel === undefined ? '' : ` aria-label="${attr(validLabel)}"`;
  return href == null
    ? `<button class="${cls}" type="button"${labelAttribute}>${content}</button>`
    : `<a class="${cls}" href="${attr(href)}"${labelAttribute}>${content}</a>`;
}

// DECLARED, NOT DERIVED — and the previous revision's "DERIVED so the two tables cannot
// diverge (#77)" was false safety, because they are not the same table. `BUTTON_SIZES` is the
// set of size modifiers; `_AXES` is the set of static forms worth PUBLISHING, which is what
// sk-card.markup.ts argues at length. Deriving one from the other emitted
// `SkButtonSmHTML = "sk-button sk-button--sm"` — size only — and `.sk-button` sets no
// background and no colour, so that published export painted nothing. The mission measured
// exactly that and patched the symptom with a `withTone()` helper in the story instead of
// fixing the cause; a lens caught it. Both entries below carry a tone for that reason.
//
// `Link` gives the ANCHOR branch of `buttonStaticHtml` its first generated export. Until now
// the branch the docblock calls the one every real consumer uses — every use in apps/demo is an
// `<a href>` — was the one shape the no-JavaScript consumer had to retype by hand, which is the
// criterion-3 duplication ADR-10 §3 exists to remove.
//
// An earlier revision of this comment also claimed "and its first coverage", which was FALSE
// when written: the export had zero references repo-wide and no test called `buttonStaticHtml`
// with an href, so the axe run never rendered it either. Two lenses caught that. The coverage
// is real now and is named so this claim stays checkable — the `Link` and `AllVariants` stories
// in sk-button-html.stories.ts render it, and sk-button.test.ts asserts the branch's output and
// the escaper by parsing the result.
// `Busy` (#305) is DECLARED for the same reason `Sm`/`Link` are: a derived entry using only
// `BUTTON_SIZES`/`BUTTON_VARIANTS` would never see a `busy`-only axis, since `busy` is not a
// member of either map. This gives the static path its own published busy exemplar — a
// consumer inspecting the generated static exports sees the class the shadow form's cue rules
// key on, even though (per this file's own doc comments) no cue markup ships with it.
/**
 * The static forms this component publishes, beyond the base and one per variant.
 *
 * `Sm` is the small size in its primary tone; `Link` is the anchor form; `Busy` carries the
 * `.sk-button--busy` class with no cue markup (see `buttonStaticHtml`'s doc comment).
 */
export const BUTTON_AXES = {
  Sm: { size: 'sm', variant: 'primary' },
  Link: { href: '#', variant: 'primary' },
  Busy: { busy: true, variant: 'primary' },
} as const satisfies Record<string, ButtonStaticOptions>;
