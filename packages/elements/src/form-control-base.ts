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

  declare name: string;
  declare label: string;
  declare description: string;
  declare disabled: boolean;
  declare required: boolean;
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
}
