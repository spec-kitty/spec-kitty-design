// The AUTHORED markup source for sk-check-bullet (ADR-10 §3).
//
// LEAF MODULE, no relative imports: the generator evaluates it from a `data:` URL.
//
// NO RENAME HERE. `.sk-check-bullet*` already matches the component's own name, so the #139
// ownership problem that forced the button and pill-tag renames does not apply.
//
// `.sk-check-bullet__text` IS DROPPED. It appeared in the published markup and is defined in
// no stylesheet anywhere in this repo — a class that styles nothing, on the element whose text
// is slotted in the element path anyway. A pre-merge lens on #138 flagged it while auditing
// this batch in advance. There are no in-repo consumers.

/** No colour or shape variants — a check bullet is one thing. Declared explicitly because the
 *  generator cannot distinguish an absent export from an empty one. */
export const CHECK_BULLET_VARIANTS = {} as const;

/** No non-variant axes either, declared for the same reason. */
export const CHECK_BULLET_AXES = {} as const;

export interface CheckBulletStaticOptions {
  /** The tick glyph. A component-owned mark rather than content, so it has a default. */
  icon?: string;
}

export const DEFAULT_ICON = '✓';

export function checkBulletClasses(): string {
  return 'sk-check-bullet';
}

/**
 * The static form — an `<li>`, because the static path sits inside a real `<ul>`.
 *
 * The ELEMENT cannot be an `<li>`: a custom element inside a `<ul>` is not a list item, so it
 * carries `role="listitem"` on the host instead. That is the one place these two paths differ
 * structurally, and it is unavoidable rather than an oversight — recorded on the element.
 */
export function checkBulletStaticHtml(
  opts: CheckBulletStaticOptions = {},
  content = 'Feature description here',
): string {
  const icon = opts.icon ?? DEFAULT_ICON;
  return (
    `<li class="${checkBulletClasses()}">` +
    `<span class="sk-check-bullet__icon" aria-hidden="true">${icon}</span>` +
    content +
    `</li>`
  );
}
