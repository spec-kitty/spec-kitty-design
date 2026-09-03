import { html } from 'lit';
import { define } from '../define.js';
import { FormControlBase } from '../form-control-base.js';
import sheet from './sk-form-input.css.js';

// EVERYTHING IN THE `/** */` BELOW IS PUBLISHED API — the analyzer copies the class description
// and every `@csspart` / `@slot` / `@fires` description verbatim into custom-elements.json.
// Rationale for maintainers belongs here, in `//` comments.
//
// ARRANGEMENT B, AND WHY IT IS NOT A CHOICE THIS FILE MAKES.
//
// ADR-9 §4 built four arrangements as real elements and ran axe over each:
//   A  light DOM, element renders label + control into itself   pass   submits
//   B  shadow root owns both; label is a property               pass   does NOT submit
//   C  consumer supplies <label>, control in shadow             FAIL   —
//   D  form-associated host labelled by a light-DOM <label for> FAIL   submits
// C and D fail because axe resolves aria-labelledby from the ATTRIBUTE and scopes ID lookups to
// getRootNode(), so no cross-root reference resolves — labelling the host does not label the
// inner control. B passes the gate and submits nothing on its own: the probe form produced keys
// ["a","d"] and B contributed none. Hence B **plus** formAssociated and ElementInternals, which
// is the only combination that both passes and submits.
//
// The same reasoning is why `description` is a property rather than a slot: it reaches the
// control through aria-describedby, which resolves exactly the way aria-labelledby does. That
// extension is an INFERENCE from ADR-9's measurement rather than something the ADR measured —
// recorded as this mission's decision, and raised on #74 as an operator question.
//
// SINCE #129 THAT INCLUDES EVERY REACTIVE PROPERTY'S OWN `/** */`, and every public
// method's: normalise-manifest.mjs propagates a field's description onto its attribute,
// and the React generator copies it into the prop docs. check-manifest-content.mjs now
// refuses a manifest where any of them is missing, so this is enforced, not advisory.
/**
 * A labelled text input that participates in a native form.
 *
 * @element sk-form-input
 *
 * @csspart field - the field wrapper
 * @csspart label - the label
 * @csspart control - the input
 * @csspart description - the helper text
 * @csspart error - the validation message
 */
export class SkFormInput extends FormControlBase {
  static styles = [sheet];

  static properties = {
    name: { type: String, reflect: true },
    label: { type: String },
    description: { type: String },
    value: { type: String },
    type: { type: String },
    placeholder: { type: String },
    // NOT REFLECTED, and this is the difference between SC-005 asserting something and
    // asserting nothing. A form-associated element carrying the `disabled` ATTRIBUTE is
    // excluded from the entry list by the USER AGENT, unaided — so with reflection on,
    // `formDisabledCallback(true)` sets the attribute, the UA excludes it, and the element's
    // own `setFormValue(null)` becomes unobservable: the SC-005 mutation ran green.
    //
    // Without reflection the property is the element's own state, the UA does nothing, and the
    // exclusion is ours to get right or wrong. `<sk-form-input disabled>` in markup still works
    // — attribute→property is what `type: Boolean` does; `reflect` is the other direction — and
    // the control's own `:disabled` styling is driven by `?disabled=${this.disabled}`, not by a
    // host attribute selector.
    disabled: { type: Boolean },
    required: { type: Boolean, reflect: true },
    invalid: { type: Boolean, reflect: true },
    // INTERNAL STATE, not an attribute. The rendered error node used to interpolate
    // `this.validationMessage` — a getter over ElementInternals, which Lit cannot observe. So a
    // message that changed WITHOUT flipping `invalid` never repainted: a pass-2 lens measured
    // `validationMessage` reading "That address is already registered." while the DOM still
    // said "Field is required". `aria-describedby` points at that node, so the stale text IS
    // the programmatic message (WCAG 3.3.1), and `role="alert"` never re-announced either.
    errorMessage: { type: String, state: true },
  };

  /** The native input type — `text`, `email`, `password`, and so on. */
  declare type: string;

  /** Placeholder text. Not a substitute for `label`: it disappears on input and is not a
   *  reliable accessible name. */
  declare placeholder: string;

  constructor() {
    super();
    this.type = 'text';
    this.placeholder = '';
    this.invalid = false;
    this.errorMessage = '';
  }

  // VALIDATION RUNS BEFORE RENDER, not after.
  //
  // It was in `updated()`, which meant `validate()` set the reactive `invalid` property AFTER
  // the render that reads it — scheduling a second pass. A consumer doing
  // `el.value = x; await el.updateComplete` then reading the DOM got a STALE `aria-invalid`,
  // and since the adopted sheet paints the error border with `[aria-invalid="true"]` and hides
  // the message with `:host(:not([invalid]))`, the visible state lagged too. Found by the test
  // added for the `aria-invalid` mutation survivor, which failed on the second half.
  //
  // `willUpdate` is the Lit-sanctioned place to derive state from changed properties: setting a
  // reactive property here is folded into the same update rather than queueing another.
  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('value') || changed.has('required') || changed.has('disabled')) this.validate();
  }

  updated(changed: Map<string, unknown>) {
    // MUTATION ANCHOR SC-002 — a native form submit produces the expected FormData entry.
    // The form value must track the PROPERTY, not just the initial state: `el.value = 'x'`
    // submitting the old value is a real failure the fixture records.
    if (changed.has('value') || changed.has('disabled')) this.syncFormValue();
  }

  /** The only `setFormValue` call site in this element. */
  private syncFormValue(): void {
    // MUTATION ANCHOR SC-005 — a disabled control is excluded from submission.
    // Owned here rather than left to the UA: with a `disabled` ATTRIBUTE present the user agent
    // excludes a form-associated element by itself, which makes the element's own exclusion
    // unobservable and the mutation semantically inert. Measured across four toggle routes.
    this.internals.setFormValue(this.disabled ? null : this.value);
  }

  /** Called by the browser when the containing form resets. Restores the value the
   *  field had on connect. */
  formResetCallback(): void {
    // MUTATION ANCHOR SC-004 — form reset restores the initial value.
    this.value = this.initialValue;
    this.syncFormValue();
  }

  /** Called by the browser when a containing fieldset is disabled or re-enabled. */
  formDisabledCallback(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.syncFormValue();
  }

  protected validate(): void {
    // FLAGS ARE MERGED, not replaced. `valueMissing` and `customError` can be true at the same
    // time — an empty required field the server also rejected — and a consumer branching on
    // `el.validity.valueMissing` must not be told `false` just because a custom error arrived.
    // A DISABLED CONTROL IS NEVER INVALID. The UA normally handles this by barring a disabled
    // form-associated element from constraint validation — but `disabled` is deliberately NOT
    // reflected here (that is what makes SC-005's mutation observable), so the UA cannot see it
    // and the element must do it itself. Without this a disabled, required, empty field vetoes
    // its whole form forever, and the user cannot clear it because the field is disabled.
    if (this.disabled) {
      this.internals.setValidity({});
      this.invalid = false;
      this.errorMessage = '';
      return;
    }
    const control = this.shadowRoot?.querySelector('input') ?? undefined;
    const flags: ValidityStateFlags = {};
    let message = '';
    if (this.required && this.value === '') {
      // MUTATION ANCHOR SC-003 — setValidity blocks submission and the message reaches the
      // accessibility tree.
      flags.valueMissing = true;
      message = `${this.label || 'This field'} is required`;
    }
    // The consumer's message WINS the announcement when both hold — it is the more specific
    // one — while the derived flag stays set underneath.
    if (this.customError) {
      flags.customError = true;
      message = this.customError;
    }
    if (Object.keys(flags).length > 0) {
      // The third argument is the FOCUS ANCHOR for reportValidity() — it points the UA's own
      // validation bubble and puts nothing in the accessibility tree. The message gets there
      // through aria-describedby to the error node in THIS shadow root, which is why the node
      // is rendered rather than merely held in internals.validationMessage.
      this.internals.setValidity(flags, message, control);
      this.invalid = true;
      this.errorMessage = message;
    } else {
      this.internals.setValidity({});
      this.invalid = false;
      this.errorMessage = '';
    }
  }

  /** Re-run validation once the shadow root exists, so `setValidity`'s focus anchor is a real
   *  element. `willUpdate` runs BEFORE first render, where `querySelector` returns null — an
   *  element that mounts already-invalid would otherwise report validity with no anchor. */
  firstUpdated(): void {
    this.validate();
  }

  render() {
    const describedBy = [this.description ? 'description' : '', this.invalid ? this.errorId : '']
      .filter(Boolean)
      .join(' ');
    return html`<div part="field" class="sk-form-input">
      <label part="label" class="sk-form-input__label" for="control">${this.label}</label>
      <input
        part="control"
        class="sk-form-input__control"
        id="control"
        .type=${this.type}
        .value=${this.value}
        placeholder=${this.placeholder}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-invalid=${this.invalid ? 'true' : 'false'}
        aria-describedby=${describedBy || undefined}
        @input=${this.#onInput}
      />
      ${this.description
        ? html`<span part="description" class="sk-form-input__description" id="description"
            >${this.description}</span
          >`
        : ''}
      <span part="error" class="sk-form-input__error" id=${this.errorId} role="alert"
        >${this.errorMessage}</span
      >
    </div>`;
  }

  #onInput = (e: Event): void => {
    this.value = (e.target as HTMLInputElement).value;
  };
}

define('sk-form-input', SkFormInput);
