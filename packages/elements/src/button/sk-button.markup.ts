// The AUTHORED markup source for sk-button (ADR-10 §3).
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL.
//
// THE CLASS PREFIX CHANGED IN THIS MISSION. `.sk-btn*` became `.sk-button*` under the operator
// ruling on #139: `check-adopted-css-boundaries.mjs` derives ownership from the component's own
// name, and that is the mechanism making ADR-9 Confirmation #1 checkable at all — so a
// component whose classes are prefixed differently from its name cannot be verified. The
// alternative was a hand-maintained prefix map, which is the shape this programme has removed
// from four other places.

/** Tone modifiers — the button's own root classes, so these are the generator's variants. */
export const BUTTON_VARIANTS = {
  primary: 'sk-button--primary',
  secondary: 'sk-button--secondary',
  ghost: 'sk-button--ghost',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

/** Size modifiers. A separate axis from tone: a button has a tone AND a size. */
export const BUTTON_SIZES = { sm: 'sk-button--sm' } as const;

export type ButtonSize = keyof typeof BUTTON_SIZES;

export function isButtonVariant(v: string): v is ButtonVariant {
  return Object.hasOwn(BUTTON_VARIANTS, v);
}

export function isButtonSize(s: string): s is ButtonSize {
  return Object.hasOwn(BUTTON_SIZES, s);
}

export const unknownVariantMessage = (v: string): string =>
  `unknown button variant "${v}" — expected one of ${Object.keys(BUTTON_VARIANTS).join(', ')}`;

export const unknownSizeMessage = (s: string): string =>
  `unknown button size "${s}" — expected one of ${Object.keys(BUTTON_SIZES).join(', ')}`;

// Two callers, two failure policies — warn and degrade on the render path, throw on the
// authoring path. The split sk-card paid for and #77 reproduced once in a gap arm.

/** The button's class list. Warns and degrades on an unknown variant or size. */
export function buttonClasses(variant?: string, size?: string): string {
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
  ]
    .filter(Boolean)
    .join(' ');
}

export interface ButtonStaticOptions {
  variant?: string;
  size?: string;
  /** When set, the static form emits an ANCHOR rather than a button — see the note below. */
  href?: string;
}

/**
 * The static form. Throws on an unknown variant or size.
 *
 * ANCHOR OR BUTTON, decided by `href`, and this is not a convenience — it is what the
 * catalogue already does. Every real use of this class in `apps/demo` is an `<a href>` styled
 * as a button; the stories use `<button>`. One primitive, two elements, and the class list is
 * identical on both. So the element switches on the same signal rather than forcing consumers
 * to choose between a working link and a styled one.
 */
export function buttonStaticHtml(opts: ButtonStaticOptions = {}, content = 'Label'): string {
  const { variant, size, href } = opts;
  if (variant !== undefined && !isButtonVariant(variant)) throw new Error(unknownVariantMessage(variant));
  if (size !== undefined && !isButtonSize(size)) throw new Error(unknownSizeMessage(size));
  const cls = buttonClasses(variant, size);
  return href === undefined
    ? `<button class="${cls}" type="button">${content}</button>`
    : `<a class="${cls}" href="${href}">${content}</a>`;
}

/** The non-variant axes, DERIVED from BUTTON_SIZES so the two tables cannot diverge (#77). */
export const BUTTON_AXES = Object.fromEntries(
  Object.keys(BUTTON_SIZES).map((s) => [`${s.charAt(0).toUpperCase()}${s.slice(1)}`, { size: s }]),
) as Record<string, ButtonStaticOptions>;
