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
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    invalid: { type: Boolean, reflect: true },
  };

  declare type: string;
  declare placeholder: string;
  /** Reflected so the adopted sheet can see the state from inside via `:host([invalid])` — a
   *  descendant selector on a state-carrying ancestor would be inert once adopted (#72). */
  declare invalid: boolean;

  constructor() {
    super();
    this.type = 'text';
    this.placeholder = '';
    this.invalid = false;
  }

  updated(changed: Map<string, unknown>) {
    // MUTATION ANCHOR SC-002 — a native form submit produces the expected FormData entry.
    // The form value must track the PROPERTY, not just the initial state: `el.value = 'x'`
    // submitting the old value is a real failure the fixture records.
    if (changed.has('value') || changed.has('disabled')) this.syncFormValue();
    if (changed.has('value') || changed.has('required')) this.validate();
  }

  /** The only `setFormValue` call site in this element. */
  private syncFormValue(): void {
    // MUTATION ANCHOR SC-005 — a disabled control is excluded from submission.
    // Owned here rather than left to the UA: with a `disabled` ATTRIBUTE present the user agent
    // excludes a form-associated element by itself, which makes the element's own exclusion
    // unobservable and the mutation semantically inert. Measured across four toggle routes.
    this.internals.setFormValue(this.disabled ? null : this.value);
  }

  formResetCallback(): void {
    // MUTATION ANCHOR SC-004 — form reset restores the initial value.
    this.value = this.initialValue;
    this.syncFormValue();
  }

  formDisabledCallback(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.syncFormValue();
  }

  private validate(): void {
    const control = this.shadowRoot?.querySelector('input') ?? undefined;
    if (this.required && this.value === '') {
      // MUTATION ANCHOR SC-003 — setValidity blocks submission and the message reaches the
      // accessibility tree.
      //
      // The third argument is the FOCUS ANCHOR for reportValidity() — it points the UA's own
      // validation bubble and puts nothing in the accessibility tree. The message gets there
      // through aria-describedby to the error node in THIS shadow root, which is why the node
      // is rendered rather than merely held in internals.validationMessage.
      this.internals.setValidity({ valueMissing: true }, `${this.label || 'This field'} is required`, control);
      this.invalid = true;
    } else {
      this.internals.setValidity({});
      this.invalid = false;
    }
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
        >${this.invalid ? this.validationMessage : ''}</span
      >
    </div>`;
  }

  #onInput = (e: Event): void => {
    this.value = (e.target as HTMLInputElement).value;
  };
}

define('sk-form-input', SkFormInput);
