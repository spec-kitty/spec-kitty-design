import { LitElement } from 'lit';

// NOT `sk-`-PREFIXED, AND CARRYING NO `@element` JSDoc — both deliberate, and both load-bearing.
//
// Five places glob `packages/elements/src/**/sk-*.ts` and filter on `/^sk-[a-z0-9-]+\.ts$/`:
// build-elements-css.mjs, check-adopted-css-boundaries.mjs, check-elements-entries.mjs,
// measure-elements-sizes.mjs and tests/node/config-contract.test.ts. A file named
// `sk-form-control-base.ts` would be treated as an element — it would demand a stylesheet
// directory of its own, a manifest tagName, and a behaviour subject, and would fail four gates.
// And config-contract asserts the manifest's registered tag set EQUALS the source glob, so an
// `@element` annotation here would break that equality in the other direction.
//
// WHAT LIVES HERE, AND WHAT DELIBERATELY DOES NOT.
//
// Only UNANCHORED plumbing. The four `mutations.json` anchors — the `updated()` sync guard, the
// `setValidity` arguments, the `formResetCallback` restore, and the `disabled ? null : value`
// expression — live in each ELEMENT's file, not here. A shared anchor reds both elements'
// `[SC-00x]` tests at once, and suite-selftest.mjs guard 5 rejects that as collateral: measured
// at 8 of 37 mutations failing, against 37/37 clean with per-element anchors. `expectCollateral`
// is not the escape hatch — its inverted arm asserts `collateral.length > 0` and nothing else,
// so it would trade a surgical assertion for a non-emptiness one.
//
// `static formAssociated` MAY sit here only because tests/node/config-contract.test.ts derives
// its check from custom-elements.json, and the analyzer propagates inherited statics. A
// source-text regex sees nothing through a superclass, and
// `Object.prototype.hasOwnProperty.call(Subclass, 'formAssociated')` is `false` — both measured.
// If that check is ever reimplemented any other way, the flag moves onto each element.
export abstract class FormControlBase extends LitElement {
  static formAssociated = true;

  // The JSDoc on these fields is PUBLISHED. normalise-manifest.mjs propagates a field's
  // description onto its attribute (the analyzer only does that for own fields, not inherited
  // ones), ADR-11's generator copies `attributes[].description` into the React prop docs, and
  // editors show it on hover. So it is written for a consumer, and anything a maintainer needs
  // to know goes in `//` — C-005, and the reason `invalid` below reads differently than it did.

  /** The name submitted with the form value. Required for the field to participate in
   *  submission at all: a form control with no name contributes no `FormData` entry. */
  declare name: string;

  /** The visible label. Also the accessible name, so it is not optional in practice. */
  declare label: string;

  /** Optional helper text rendered under the control and linked to it for screen readers. */
  declare description: string;

  /** Excludes the field from submission and from user interaction. */
  declare disabled: boolean;

  /** Marks the field required. An empty required field blocks submission and reports
   *  "&lt;label&gt; is required". */
  declare required: boolean;

  /** The current value, and what the form submits under `name`. */
  declare value: string;

  protected internals: ElementInternals;

  /** Captured on connect, restored by `formResetCallback`. `protected`, not `#private`: a
   *  `#`-private field is not visible to a subclass, and the reset anchor lives in the
   *  subclass so its mutation reds exactly one element's test. */
  protected initialValue = '';

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.name = '';
    this.label = '';
    this.description = '';
    this.disabled = false;
    this.required = false;
    this.value = '';
  }

  /**
   * A property assigned before the definition loaded shadows the accessor the class installs on
   * upgrade. Lit handles its own reactive properties; this covers the same ground explicitly so
   * the behaviour is the element's rather than a framework detail nothing asserts.
   */
  protected upgradeProperty(prop: 'value' | 'disabled' | 'required'): void {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete (this as unknown as Record<string, unknown>)[prop];
      (this as unknown as Record<string, unknown>)[prop] = value;
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    for (const p of ['value', 'disabled', 'required'] as const) this.upgradeProperty(p);
    this.initialValue = this.value;
  }

  /** The element's own id for its error node. Shadow-internal, so it never collides across
   *  instances and never appears in the consumer's light DOM. */
  protected get errorId(): string {
    return 'error';
  }

  get validity(): ValidityState {
    return this.internals.validity;
  }

  get validationMessage(): string {
    return this.internals.validationMessage;
  }

  checkValidity(): boolean {
    return this.internals.checkValidity();
  }

  reportValidity(): boolean {
    return this.internals.reportValidity();
  }

  /** READ-ONLY, derived from validity — never a settable property.
   *
   *  A settable `error` alongside `setValidity` is two sources of truth: `error="…"` would paint
   *  the error state on an element that still matches `:valid` and submits happily, the story
   *  would render red, axe would pass, and nothing would notice. */
  get error(): string {
    return this.internals.validationMessage;
  }

  /**
   * Set or clear a validation error the element cannot derive itself — a server-side rejection,
   * a cross-field rule. Pass `null` to clear it.
   *
   * This exists because a lens found the only lever a consumer HAD was `el.invalid = true`,
   * and that produced the worst possible state: `:host([invalid])` painted the field red,
   * `aria-invalid` said `true`, `aria-describedby` pointed at an error node rendering the
   * EMPTY string — because `setValidity` had never been called — and `internals.validity.valid`
   * stayed `true`, so the form submitted anyway. An error identified visually with no
   * programmatic text, on a control that still submits (WCAG 3.3.1).
   *
   * Routing through `setValidity` keeps the one-source-of-truth the `error` getter above
   * argues for: validity is the state, `invalid` and the message are both derived from it.
   */
  setCustomError(message: string | null): void {
    // RE-DERIVES, never resets. `setValidity` flags are a FULL REPLACEMENT, not a layer — so
    // the first version's `setValidity({})` on clear wiped `valueMissing` too, and an empty
    // required field then submitted with `aria-invalid="false"` and no host `[invalid]`. That
    // is precisely the failure this method exists to prevent, reintroduced through the clear
    // path, and the test missed it because it cleared on a field that was never `required`.
    //
    // Routing through `validate()` means the element recomputes the whole flag set from its
    // current state, so a consumer error and a derived rule can both be true at once and
    // neither erases the other.
    this.customError = message ?? '';
    this.validate();
  }

  /**
   * Recompute validity from every source and reflect it.
   *
   * Abstract because the base cannot know a subclass's derived rules — and declaring it
   * abstract is deliberate: an `abstract` class with no abstract members enforces nothing, and
   * a lens pointed out the real contract on a subclass was documented only in comments. An
   * abstract declaration has no body, so it adds no mutation anchor.
   */
  protected abstract validate(): void;

  /** Non-empty while a consumer-supplied error is active. Read by each element's `validate()`
   *  so a derived rule cannot silently clobber a server-side one. */
  protected customError = '';

  // Declared here so `setCustomError` can set it; each element registers it as a reactive
  // property so the adopted sheet's `:host([invalid])` can see it. That is maintainer
  // rationale and it used to sit in the `/** */` below — where, once descriptions began
  // propagating to attributes, it would have shipped into React consumers' editors verbatim.
  /** Whether the field is currently showing an error. Derived from validity — set it through
   *  `setCustomError()` rather than assigning this directly. */
  declare invalid: boolean;

  // A reactive property rather than a read through `internals.validationMessage`, because Lit
  // cannot observe a getter over internals — see each element's `static properties`. It is also
  // `state: true` there, so it is deliberately NOT a React prop (#126): the element observes no
  // attribute for it, and under `ssrSafe` a first render could never deliver it.
  /** The error message currently shown. Read it; set it with `setCustomError()`. */
  declare errorMessage: string;
}
