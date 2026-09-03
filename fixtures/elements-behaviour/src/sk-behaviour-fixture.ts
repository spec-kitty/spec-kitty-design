import { LitElement, html } from 'lit';

/**
 * The behaviour fixture (#71, FR-006).
 *
 * NOT a component. It ships nowhere, appears in no catalogue and has no story. It exists
 * so ADR-11's required behaviours have a subject: `sk-stub` owns none of them — no
 * `ElementInternals`, no `dispatchEvent`, no `part=`, no `formAssociated`.
 *
 * WHY IT LIVES IN `fixtures/` AND NOT IN `packages/elements`
 *
 * Five #70 scanners run over that package. Four are anchored on the literal path segment
 * `packages/elements/`, but Storybook's story glob is `packages/**` — so a sibling
 * package would be safe only for as long as nobody adds a `.stories.ts`. `fixtures/` is
 * safe by construction, and already carries the `scope:fixture` precedent, the eslint
 * glob and the `components` path-filter entry.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════
 * MUTATION CONTRACT — read before editing.
 *
 * `scripts/suite-selftest.mjs` breaks one behaviour at a time by replacing a single
 * string in this file, and asserts the matching test goes red. Its guards require every
 * anchor to be UNIQUE, SINGLE-OCCURRENCE, and non-no-op, and the harness cannot edit this
 * file to fix a collision.
 *
 * So each behaviour below has exactly one anchor, marked `MUTATION ANCHOR <id>`. In
 * particular `setFormValue` is called from ONE place (`#syncFormValue`) even though three
 * paths need it — calling it directly from each would give SC-002 two occurrences and
 * trip the harness's second guard.
 *
 * And each behaviour is OWNED here, not delegated to the user agent. SC-005 could rely on
 * the UA excluding a disabled form-associated element; then there would be no source line
 * to mutate and the first guard would fire. `#formDisabledCallback` owns it instead.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export class SkBehaviourFixture extends LitElement {
  static formAssociated = true;

  static properties = {
    label: { type: String },
    value: { type: String },
    open: { type: Boolean, reflect: true },
    // NOT reflected. With a `disabled` attribute present the USER AGENT excludes a
    // form-associated element from submission by itself, which makes the element's own
    // exclusion unobservable — SC-005's mutation was semantically inert and the harness
    // caught it. WP02's DoD requires the fixture to OWN each behaviour rather than
    // delegate it to the UA, and this is what that means in practice.
    disabled: { type: Boolean },
  };

  declare label: string;
  declare value: string;
  declare open: boolean;
  declare disabled: boolean;

  #internals: ElementInternals;
  #initialValue = '';

  /**
   * A NON-reactive property, deliberately.
   *
   * Lit re-applies *reactive* properties on upgrade by itself, and `declare` emits no
   * class field for them, so `useDefineForClassFields` cannot clobber them either — a
   * mutation there is inert, which the harness proved. Anything Lit does not manage is
   * the ELEMENT's problem, and that is the case #72's components will actually meet.
   */
  #hint?: string;

  /**
   * Backed by a real prototype ACCESSOR, which is the whole point.
   *
   * A plain data property survives upgrade trivially — there is nothing to shadow, so the
   * dance is unnecessary and a mutation removing it is inert. The harness proved that. An
   * accessor is what a pre-upgrade own property actually shadows, and reclaiming it is
   * what #upgradeHint exists to do.
   */
  get hint(): string | undefined {
    return this.#hint;
  }

  set hint(v: string | undefined) {
    this.#hint = v;
    this.requestUpdate();
  }

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.label = 'fixture';
    this.value = '';
    this.open = false;
    this.disabled = false;
    // Reactive properties: Lit re-applies these itself, but the dance is kept so the
    // fixture reads the way a real component does.
    this.#upgradeProperty('label');
    this.#upgradeProperty('value');
    // MUTATION ANCHOR SC-010 — property assigned before upgrade, on the property Lit does
    // NOT manage.
    this.#upgradeHint();
  }

  #upgradeHint() {
    if (Object.prototype.hasOwnProperty.call(this, 'hint')) {
      const value = (this as unknown as Record<string, unknown>)['hint'];
      // Delete the shadowing OWN property, then reassign so the value flows through the
      // prototype accessor. Without the delete, every later read returns the stale own
      // property and the setter never runs.
      delete (this as unknown as Record<string, unknown>)['hint'];
      this.hint = value as string | undefined;
    }
  }

  #upgradeProperty(prop: 'label' | 'value') {
    // Narrowed to a literal union rather than `string`, so the reads and writes below are
    // not dynamic property access — eslint's security/detect-object-injection flags the
    // generic form, and a warning nobody can act on is noise.
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete (this as Partial<Record<'label' | 'value', string>>)[prop];
      this[prop] = value;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.#initialValue = this.value;
    this.#syncFormValue();
  }

  updated(changed: Map<string, unknown>) {
    // The form value must track the property, not just the initial state — otherwise
    // `el.value = 'x'` submits the old value and SC-002 fails for a reason that has
    // nothing to do with setFormValue. Routed through #syncFormValue so setFormValue
    // still has exactly ONE call site (see the mutation contract).
    if (changed.has('value') || changed.has('disabled')) this.#syncFormValue();
  }

  /**
   * Proxy the internals' validity surface.
   *
   * `setValidity` alone makes the element match `:invalid` and blocks submission, but the
   * MESSAGE is only reachable through ElementInternals — and SC-003 requires the message
   * to reach the accessibility tree, not merely a flag to be set.
   */
  get validity(): ValidityState {
    return this.#internals.validity;
  }

  get validationMessage(): string {
    return this.#internals.validationMessage;
  }

  checkValidity(): boolean {
    return this.#internals.checkValidity();
  }

  /** The ONLY `setFormValue` call site. See the mutation contract above. */
  #syncFormValue() {
    // MUTATION ANCHOR SC-002 — native form submit produces the expected FormData entry.
    this.#internals.setFormValue(this.disabled ? null : this.value);
  }

  formResetCallback() {
    // MUTATION ANCHOR SC-004 — form reset restores the initial value.
    this.value = this.#initialValue;
    this.#syncFormValue();
  }

  formDisabledCallback(isDisabled: boolean) {
    // MUTATION ANCHOR SC-005 — a disabled control is excluded from submission.
    // Owned here rather than left to the UA, so there is a line to break.
    this.disabled = isDisabled;
    this.#syncFormValue();
  }

  /** Reject the sentinel value, so validity has something to refuse. */
  validate() {
    if (this.value === 'invalid') {
      // MUTATION ANCHOR SC-003 — setValidity blocks submission and the message reaches
      // the accessibility tree.
      this.#internals.setValidity({ customError: true }, 'value must not be "invalid"', this.#control);
    } else {
      this.#internals.setValidity({});
    }
  }

  /**
   * The validity anchor must be FOCUSABLE, or `reportValidity()` cannot put the message in
   * front of anyone — a non-focusable wrapper silently anchors to nothing. The trigger is
   * the control a user actually interacts with.
   */
  get #control(): HTMLElement {
    return this.renderRoot.querySelector('[part="trigger"]') as HTMLElement;
  }

  toggle() {
    this.open = !this.open;
    const detail = {
      // MUTATION ANCHOR SC-007 — the documented `detail` shape.
      open: this.open,
      label: this.label,
    };
    const event = new CustomEvent('sk-toggle', {
      detail,
      // MUTATION ANCHOR SC-008 — `composed` and `bubbles` as documented.
      composed: true,
      bubbles: true,
      // MUTATION ANCHOR SC-009 — cancelable, so preventDefault can demonstrably prevent.
      cancelable: true,
    });
    // MUTATION ANCHOR SC-006 — fires exactly once.
    const proceed = this.dispatchEvent(event);
    if (!proceed) this.open = !this.open;
  }

  #onKeydown = (e: KeyboardEvent) => {
    // MUTATION ANCHOR SC-012 — Escape closes and focus returns to the invoker.
    if (e.key === 'Escape' && this.open) {
      this.open = false;
      (this.renderRoot.querySelector('[part="trigger"]') as HTMLElement)?.focus();
    }
  };

  render() {
    return html`<div
      part="control"
      @keydown=${this.#onKeydown}
    >
      <button part="trigger" aria-expanded=${String(this.open)} @click=${() => this.toggle()}>
        <!-- MUTATION ANCHOR SC-013 — a part queried by no other behaviour. The trigger
             part is SC-012's focus target and the control part is SC-003's validity
             anchor, so renaming either is real coupling and the harness's collateral
             bound rightly refuses it. (No backticks in here: this comment is inside a
             tagged template literal, and one would terminate it.) -->
        <span part="label">${this.label}</span>
      </button>
      <!-- MUTATION ANCHOR SC-011 — content reaches the intended slot; fallback appears
           when it is empty. -->
      <div part="panel" ?hidden=${!this.open}><slot name="panel">no panel content</slot></div>
    </div>`;
  }
}

customElements.define('sk-behaviour-fixture', SkBehaviourFixture);
