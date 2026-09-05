import { html, nothing } from 'lit';
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
    // FORWARDED CONSTRAINT/HINTING ATTRIBUTES (#180). Plain strings, reflected, forwarded
    // verbatim to the inner control — the platform validates them; this element does not
    // reinterpret them. Not gated on `type`: the platform itself ignores e.g. `min`/`max`/`step`
    // on a `type` they do not apply to, so element-side type-gating would be a second, possibly
    // -wrong source of truth.
    pattern: { type: String, reflect: true },
    min: { type: String, reflect: true },
    max: { type: String, reflect: true },
    step: { type: String, reflect: true },
    inputmode: { type: String, reflect: true },
    autocomplete: { type: String, reflect: true },
    // NOT REFLECTED — deliberately, and for the SAME reason `disabled` above is not. Measured
    // (#180): reflecting `readonly` to the HOST attribute of a form-associated custom element
    // makes the USER AGENT itself bar it from constraint validation on the attribute alone —
    // `willValidate` false, `checkValidity()` true, with no `setValidity` call needed from this
    // element's own code at all. That would make the `readonly` branch in `validate()` below an
    // UNOBSERVABLE, near-dead mutation anchor (three of its four assertions would still pass
    // with the branch deleted) — the exact SC-005 collateral shape `disabled`'s own
    // non-reflection already exists to avoid. Keeping `readonly` unreflected keeps THIS
    // element's own barring branch the sole, testable authority, exactly like `disabled`.
    // `<sk-form-input readonly>` in markup still works (attribute→property needs no `reflect`);
    // only the reverse direction is withheld.
    readonly: { type: Boolean },
    // PROPERTY-ONLY, deliberately, and declared with a LITERAL FIELD INITIALIZER below rather
    // than a `declare` field with a constructor default — see the field declaration for why
    // that specific shape is load-bearing for the generated React wrapper.
    options: { attribute: false },
  };

  /** The native input type — `text`, `email`, `password`, and so on. */
  declare type: string;

  /** Placeholder text. Not a substitute for `label`: it disappears on input and is not a
   *  reliable accessible name. */
  declare placeholder: string;

  /** A regular expression the value must match. Forwarded verbatim to the inner control; the
   *  platform performs the match, this element does not re-validate it. */
  declare pattern: string | undefined;

  /** The minimum value, for numeric and date/time input types. A string, matching the native
   *  HTML attribute's own contract. */
  declare min: string | undefined;

  /** The maximum value, for numeric and date/time input types. A string, matching the native
   *  HTML attribute's own contract. */
  declare max: string | undefined;

  /** The granularity the value must adhere to, for numeric and date/time input types. `"any"`
   *  is a legal value the platform itself interprets. */
  declare step: string | undefined;

  /** A hint to the browser about the kind of on-screen keyboard to display. Hinting only — it
   *  carries no validation semantics. */
  declare inputmode: string | undefined;

  /** Forwarded to the inner control's `autocomplete` attribute, verbatim. */
  declare autocomplete: string | undefined;

  /** Marks the field read-only. The value is still submitted with the form, unlike `disabled` —
   *  but the field is barred from constraint validation, so a `required` read-only field never
   *  blocks its form. */
  declare readonly: boolean;

  // PLAIN FIELD, LITERAL INITIALIZER — not `declare` + a constructor default, unlike every other
  // property above. scripts/normalise-manifest.mjs's hasFrozenEmptyArrayInitializer() reads this
  // field's AST initializer directly to mark the manifest's x-spec-kitty-property-reset, which
  // the generated React wrapper's useProperties() reset depends on (see sk-transition-matrix's
  // `columns`/`routes` for the precedent this mirrors). A `declare` field has no initializer at
  // all, so it would silently fail to earn that marker despite type-checking identically.
  /** Suggested values shown in a native datalist alongside the input. A typed value matching no
   *  option stays valid unless a forwarded constraint says otherwise — this is a suggestion
   *  list, not a closed set. */
  options: ReadonlyArray<{ value: string; label?: string }> = Object.freeze([]);

  // A DETACHED VALIDATION PROBE — never rendered, never connected to any document. See the
  // comment in `validate()` for why the RENDERED control cannot be the sole source of merged UA
  // flags: it does not exist yet on the very first `willUpdate` pass (mount), and repairing that
  // gap from `firstUpdated()` lands the fix a Lit update cycle too late for a single
  // `await el.updateComplete` to observe. Constraint validation (`patternMismatch`, range/step/
  // type/`badInput`) is a pure attribute+value computation — it needs no layout and no DOM
  // connection — so a private, permanently-detached `<input>` gives `validate()` a real
  // `ValidityState` to read on every pass, mount included, with no render dependency at all.
  #probe: HTMLInputElement = document.createElement('input');

  constructor() {
    super();
    this.type = 'text';
    this.placeholder = '';
    this.invalid = false;
    this.errorMessage = '';
    this.readonly = false;
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
  //
  // #180 ADDED A SECOND REASON THIS MUST STAY IN `willUpdate`, NOT MOVE TO `updated`: the merged
  // UA validity flags `validate()` now reads come from a DETACHED PROBE `<input>` (see the
  // `#probe` field and the comment in `validate()`), synced to the CURRENT update's constraint
  // properties before every read — never from the RENDERED control, which does not exist at all
  // during the very first pass (mount) and would reintroduce this exact historical bug through
  // `firstUpdated()`'s rescue call otherwise. Moving `validate()` itself to `updated()` was
  // considered and rejected for the same reason this comment already gives: a reactive-property
  // write from `updated()` (`this.invalid`, `this.errorMessage` below) schedules a SECOND update
  // cycle that a single `await el.updateComplete` does not wait for.
  willUpdate(changed: Map<string, unknown>) {
    if (
      changed.has('value') ||
      changed.has('required') ||
      changed.has('disabled') ||
      changed.has('readonly') ||
      changed.has('pattern') ||
      changed.has('min') ||
      changed.has('max') ||
      changed.has('step') ||
      changed.has('type')
    )
      this.validate();
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
    //
    // `readonly` DOES NOT APPEAR HERE, deliberately: unlike `disabled`, a readonly control's
    // value IS submitted — that is the one place #180's `readonly` and `disabled` paths
    // diverge. Resist adding a `this.readonly` branch to this predicate; there is none.
    this.internals.setFormValue(this.disabled ? null : this.value);
  }

  /** Sets `name` on `target` to `value` when defined, or REMOVES the attribute — never sets an
   *  empty string. See the call site in `validate()` for why: `pattern=""` is not "no pattern",
   *  it is "the empty string is the only valid value." */
  #syncOptionalAttribute(target: HTMLInputElement, name: string, value: string | undefined): void {
    if (value === undefined) {
      target.removeAttribute(name);
    } else {
      target.setAttribute(name, value);
    }
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
    // MUTATION ANCHOR SC-003 (readonly barring arm, #180) — readonly is barred from constraint
    // validation but its value IS still submitted (syncFormValue, unaffected above, deliberately
    // has no `readonly` branch of its own) — the one place this element's readonly and disabled
    // paths diverge. NOT REFLECTED, deliberately (see the `readonly` property declaration
    // above): reflecting it would let the UA itself bar constraint validation on the attribute
    // alone, making this branch an unobservable, near-dead mutation anchor.
    if (this.readonly) {
      this.internals.setValidity({});
      this.invalid = false;
      this.errorMessage = '';
      return;
    }
    const control = this.shadowRoot?.querySelector('input') ?? undefined;
    // A DETACHED PROBE, not the rendered control (#180, second measured defect in this area).
    // `willUpdate` runs BEFORE `render()` commits this update's bindings — including the VERY
    // FIRST render, where the rendered `<input>` does not exist at all yet (`control` above is
    // `undefined` on that pass). The obvious fix — sync the REAL control, then read its
    // `.validity` — works for every update AFTER the first, but not for a field that mounts
    // ALREADY invalid: `firstUpdated()` below re-runs `validate()` once the shadow root exists,
    // and that second call's `this.invalid`/`this.errorMessage` writes land in a SEPARATE
    // update cycle (Lit's own `updateComplete` resolves `false`, not "wait for the cascade,"
    // when a property changes inside `firstUpdated`/`updated`) — so a single
    // `await el.updateComplete` after mount sees the FIRST cycle's (merge-less) result, not the
    // corrected one. Measured directly: a real form submit on a field mounted with `pattern`
    // already failing passed through until a second `updateComplete` was awaited.
    //
    // A DETACHED `<input>` created once and kept in memory needs no render to exist and no DOM
    // connection to compute constraint validation correctly (patternMismatch/range/step/type/
    // badInput are pure attribute+value computations, not layout-dependent) — so syncing IT
    // instead makes the merge available on the SAME pass as every other property, mount
    // included, and removes the two-cycle gap rather than working around it.
    //
    // MUTATION ANCHOR SC-003 (post-reset arm, #180 — re-sited from SC-004 after CI found
    // two-directional mutation collateral between the two ids: this line is the SAME shared
    // sync every merge-dependent SC-003 arm below already depends on, not machinery specific to
    // reset, so it belongs under their id, not a separate one). `formResetCallback()` assigns
    // `this.value` the ordinary reactive-property way, which reaches THIS line through the
    // same `willUpdate` -> `validate()` path as any other value change; a reset that restores a
    // satisfying value must report valid immediately, not the stale pre-reset state.
    this.#probe.value = this.value;
    this.#probe.type = this.type;
    // SET-OR-REMOVE, never an empty string. `el.pattern = ''` does not mean "no pattern" — the
    // HTML pattern algorithm compiles the ATTRIBUTE VALUE into `^(?:<value>)$`, so an empty
    // string compiles to `^(?:)$`, which matches ONLY the empty string. Measured directly: a
    // probe with `pattern=""` reported `patternMismatch: true` for a plain, unconstrained "x".
    // `render()`'s own binding avoids this with Lit's `nothing` sentinel (omits the attribute
    // entirely); the probe needs the same omission, done by hand since it is plain DOM, not Lit.
    this.#syncOptionalAttribute(this.#probe, 'pattern', this.pattern);
    this.#syncOptionalAttribute(this.#probe, 'min', this.min);
    this.#syncOptionalAttribute(this.#probe, 'max', this.max);
    this.#syncOptionalAttribute(this.#probe, 'step', this.step);
    const flags: ValidityStateFlags = {};
    let message = '';
    if (this.required && this.value === '') {
      // MUTATION ANCHOR SC-003 — setValidity blocks submission and the message reaches the
      // accessibility tree.
      flags.valueMissing = true;
      message = `${this.label || 'This field'} is required`;
    }
    // MUTATION ANCHOR SC-003 (merged-validity arm, #180) — the UA's OWN validity flags are
    // MERGED, not read-and-discarded. Without this, forwarding pattern/min/max/step (see the
    // property declarations above) makes the INNER <input> invalid while the HOST still reports
    // valid — ElementInternals.setValidity REPLACES whatever this element passes it, and
    // nothing else consults control.validity. A field that looks fine and silently submits
    // rejected data is exactly the failure this line exists to prevent.
    //
    // `tooLong`/`tooShort` are DELIBERATELY ABSENT: this mission forwards no
    // `maxlength`/`minlength`, so neither flag is ever reachable — carrying them would be an
    // inert mutation target.
    for (const key of [
      'patternMismatch',
      'rangeUnderflow',
      'rangeOverflow',
      'stepMismatch',
      'typeMismatch',
    ] as const) {
      if (this.#probe.validity[key]) flags[key] = true;
    }
    // `badInput` is MERGED FROM THE REAL RENDERED CONTROL, not the probe above — measured
    // directly, this is not a stylistic choice. `badInput` reflects the browser's own
    // "unparseable raw text the user typed" state (e.g. `type="number"` with "12e"); it is only
    // ever set by the UA in response to genuine user typing, and property assignment SILENTLY
    // SANITIZES an unparseable value to `''` with `badInput` staying `false` — measured on a
    // bare native `<input type="number">`, not assumed. Copying `this.value` onto the detached
    // probe is therefore a property assignment and can NEVER reproduce it; only the control the
    // user actually typed into carries it. This is safe from the mount-time race the probe
    // exists to fix: a user cannot type into a control that has not rendered yet, so `control`
    // is never undefined when `badInput` could genuinely be true.
    if (control?.validity.badInput) flags.badInput = true;
    // The consumer's message WINS the announcement when both hold — it is the more specific
    // one — while the derived flag stays set underneath.
    if (this.customError) {
      flags.customError = true;
      message = this.customError;
    }
    // FALLBACK MESSAGE (#180) — `internals.setValidity(flags, message, anchor)` THROWS when any
    // flag is true and `message` is an empty string (measured, Chromium and Firefox both). A
    // form-associated custom element has no free UA-authored message the way a plain `<input>`'s
    // own `reportValidity()` bubble would supply — so if a UA flag merged above is the ONLY
    // reason `flags` is non-empty, author a message rather than let the call throw.
    if (Object.keys(flags).length > 0 && message === '') {
      const fallback: Partial<Record<string, string>> = {
        patternMismatch: 'Value does not match the required pattern.',
        rangeUnderflow: `Value must be ${this.min ?? 'a minimum value'} or more.`,
        rangeOverflow: `Value must be ${this.max ?? 'a maximum value'} or less.`,
        stepMismatch: 'Value does not match the allowed increment.',
        typeMismatch: 'Value is not in the correct format.',
        badInput: 'Value could not be interpreted.',
      };
      const firstTrueFlag = Object.keys(flags).find((key) => flags[key as keyof ValidityStateFlags]);
      message = (firstTrueFlag && fallback[firstTrueFlag]) || 'Value is invalid.';
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
    // THE DATALIST LIVES IN THIS SHADOW ROOT, and this is not a style choice.
    // <input list="x"> resolves "x" in the INPUT'S OWN TREE (MDN, "Reflected attributes §
    // Reflected element references" — the same resolution rule ADR-9 §4 already cites for why
    // aria-labelledby cannot cross a shadow boundary). The input lives in this shadow root under
    // Arrangement B, so neither a consumer's light-DOM <datalist> nor a slotted one can ever be
    // referenced by `list` — there is no tree in which both nodes are visible to each other. A
    // fixed id is safe here (unlike a light-DOM id) because each INSTANCE has its own shadow
    // root: "options" cannot collide with another <sk-form-input>'s own "options".
    const hasOptions = Boolean(this.options?.length);
    return html`<div part="field" class="sk-form-input">
      <label part="label" class="sk-form-input__label" for="control">${this.label}</label>
      <input
        part="control"
        class="sk-form-input__control"
        id="control"
        .type=${this.type}
        .value=${this.value}
        placeholder=${this.placeholder}
        pattern=${this.pattern ?? nothing}
        min=${this.min ?? nothing}
        max=${this.max ?? nothing}
        step=${this.step ?? nothing}
        inputmode=${this.inputmode ?? nothing}
        autocomplete=${this.autocomplete ?? nothing}
        ?disabled=${this.disabled}
        ?required=${this.required}
        ?readonly=${this.readonly}
        list=${hasOptions ? 'options' : nothing}
        aria-invalid=${this.invalid ? 'true' : 'false'}
        aria-describedby=${describedBy || undefined}
        @input=${this.#onInput}
      />
      ${hasOptions
        ? html`<datalist id="options">
            ${this.options.map(
              (o) => html`<option value=${o.value} label=${o.label ?? nothing}></option>`,
            )}
          </datalist>`
        : ''}
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
