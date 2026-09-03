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
    disabled: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare value: string;
  declare open: boolean;
  declare disabled: boolean;

  #internals: ElementInternals;
  #initialValue = '';

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.label = 'fixture';
    this.value = '';
    this.open = false;
    this.disabled = false;
    // MUTATION ANCHOR SC-010 — property assigned before upgrade.
    // A property set on the element before its definition loads becomes an own data
    // property that shadows Lit's accessor. This reclaims it. Load-bearing for the
    // no-build dashboard, where script order is not controlled.
    for (const p of ['label', 'value']) this.#upgradeProperty(p);
  }

  #upgradeProperty(prop: string) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const v = (this as never as Record<string, unknown>)[prop];
      delete (this as never as Record<string, unknown>)[prop];
      (this as never as Record<string, unknown>)[prop] = v;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.#initialValue = this.value;
    this.#syncFormValue();
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

  get #control(): HTMLElement {
    return this.renderRoot.querySelector('[part="control"]') as HTMLElement;
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
        ${this.label}
      </button>
      <!-- MUTATION ANCHOR SC-011 — content reaches the intended slot; fallback appears
           when it is empty. -->
      <div part="panel" ?hidden=${!this.open}><slot name="panel">no panel content</slot></div>
    </div>`;
  }
}

customElements.define('sk-behaviour-fixture', SkBehaviourFixture);
