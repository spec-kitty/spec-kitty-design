// The AUTHORED markup source for sk-check-bullet (ADR-10 §3).
//
// EVALUATED IN A BARE NODE PROCESS by scripts/build-element-markup.mjs. It may import a LEAF —
// a module with no imports of its own, like status-indicator/status-tones.ts — and may NOT reach
// anything that needs a browser. It was a strict leaf until #216: the generator evaluated it from
// a `data:` URL, which has no module base, so no import resolved at all.
//
// NO RENAME HERE. `.sk-check-bullet*` already matches the component's own name, so the #139
// ownership problem that forced the button and pill-tag renames does not apply.
//
// `.sk-check-bullet__text` IS DROPPED. It appeared in the published markup and is defined in
// no stylesheet anywhere in this repo — a class that styles nothing, on the element whose text
// is slotted in the element path anyway. A pre-merge lens on #138 flagged it while auditing
// this batch in advance. It had THREE in-repo consumers when that sentence was written:
// sk-check-bullet-html.stories.ts hand-wrote the whole <li> three times. Two pre-merge
// lenses caught the false claim; that story now renders the generated export.

// BOTH ARE DECLARED EMPTY ON PURPOSE, and omitting either is an error — the generator
// HARD-FAILS and exits, precisely so that it never has to read `?? {}`, which could not
// distinguish "this component has none" from "I looked for the wrong export name". An earlier
// revision of this comment said the generator *does* read `?? {}`, which contradicted its own
// next clause: if it did, omitting an export would be silently green rather than an error. That rationale is a maintainer's, so it lives here — the doc comments below go
// verbatim into custom-elements.json and IDE hovers, and one of them previously read "declared
// for the same reason", a cross-reference that dangles once it is read on its own in a hover.
/** No colour or shape variants — a check bullet is one thing. */
export const CHECK_BULLET_VARIANTS = {} as const;

/** Complete/pending presentation derived from one closed, immutable record. */
export const CHECK_BULLET_PRESENTATIONS = Object.freeze({
  complete: Object.freeze({ modifier: '', icon: '✓', label: 'Complete' }),
  pending: Object.freeze({
    modifier: 'sk-check-bullet--pending',
    icon: '○',
    label: 'Pending',
  }),
} as const);

export type CheckBulletState = keyof typeof CHECK_BULLET_PRESENTATIONS;

/** The state vocabulary, derived from the canonical presentation record. */
export const CHECK_BULLET_STATES: readonly CheckBulletState[] = Object.freeze(
  Object.keys(CHECK_BULLET_PRESENTATIONS) as CheckBulletState[],
);

/** Pending is the only additional generated static form; base markup stays complete. */
export const CHECK_BULLET_AXES = {
  Pending: { state: 'pending' },
} as const satisfies Record<string, CheckBulletStaticOptions>;

export interface CheckBulletStaticOptions {
  /** Decorative completion-state marker. Defaults to the selected state's canonical marker. */
  icon?: string;
  /** Read-only completion state. Omit for the backward-compatible complete presentation. */
  state?: CheckBulletState;
}

/** Whether a runtime value names a supported check-bullet state. */
export function isCheckBulletState(state: string): state is CheckBulletState {
  return Object.hasOwn(CHECK_BULLET_PRESENTATIONS, state);
}

/** Normalize untrusted runtime input without mutating or throwing. */
export function checkBulletPresentation(state?: string) {
  const entry = Object.entries(CHECK_BULLET_PRESENTATIONS).find(([name]) => name === state);
  return entry?.[1] ?? CHECK_BULLET_PRESENTATIONS.complete;
}

export function checkBulletClasses(state?: string): string {
  const { modifier } = checkBulletPresentation(state);
  return ['sk-check-bullet', modifier].filter(Boolean).join(' ');
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
  if (opts.state !== undefined && !isCheckBulletState(opts.state)) {
    throw new Error(
      `unknown check-bullet state "${opts.state}" — expected one of ${CHECK_BULLET_STATES.join(', ')}`,
    );
  }
  const presentation = checkBulletPresentation(opts.state);
  const icon = opts.icon ?? presentation.icon;
  return (
    `<li class="${checkBulletClasses(opts.state)}">` +
    `<span class="sk-check-bullet__icon" aria-hidden="true">${icon}</span>` +
    `<span class="sk-check-bullet__state">${presentation.label}</span> ` +
    content +
    `</li>`
  );
}
