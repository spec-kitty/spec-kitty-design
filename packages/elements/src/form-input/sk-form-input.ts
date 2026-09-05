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
  declare pattern: string | null | undefined;

  /** The minimum value, for numeric and date/time input types. A string, matching the native
   *  HTML attribute's own contract. */
  declare min: string | null | undefined;

  /** The maximum value, for numeric and date/time input types. A string, matching the native
   *  HTML attribute's own contract. */
  declare max: string | null | undefined;

  /** The granularity the value must adhere to, for numeric and date/time input types. `"any"`
   *  is a legal value the platform itself interprets. */
  declare step: string | null | undefined;

  /** A hint to the browser about the kind of on-screen keyboard to display. Hinting only — it
   *  carries no validation semantics. */
  declare inputmode: string | null | undefined;

  /** Forwarded to the inner control's `autocomplete` attribute, verbatim. */
  declare autocomplete: string | null | undefined;

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
  // #180: this is also why merged UA flags are read from the `#probe` field above rather than
  // the rendered control — see that field's comment. Moving `validate()` to `updated()` would
  // reintroduce the exact bug this comment already describes, one level up.
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
      changed.has('type') ||
      // `label` feeds the required-empty MESSAGE text (`${this.label || 'This field'} is
      // required`, below) but was missing here — changing `label` on an already-invalid field
      // left the `role="alert"` node and `internals.validationMessage` showing the OLD label
      // until some UNRELATED trigger happened to re-run validate() next.
      changed.has('label')
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
   *  it is "the empty string is the only valid value."
   *
   *  BOTH `undefined` AND `null` mean "removed" — measured, not assumed: Lit's default `String`
   *  converter hands a REMOVED reflected attribute's `fromAttribute` result straight through,
   *  which is `null` (from `getAttribute`), not `undefined` — so a consumer's
   *  `el.removeAttribute('pattern')` delivers `this.pattern === null` here, a value the
   *  ORIGINAL `string | undefined` declaration did not admit at all. Checking only `undefined`
   *  let `null` fall to the `else` branch: `target.setAttribute('pattern', null)` stringifies
   *  to the literal text `"null"`, which compiles to `^(?:null)$` — a field permanently invalid
   *  for every value except the four characters "null", with NO visible `pattern` attribute in
   *  the shadow DOM at all to explain why. */
  #syncOptionalAttribute(
    target: HTMLInputElement,
    name: string,
    value: string | null | undefined,
  ): void {
    if (value === undefined || value === null) {
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
    // MUTATION ANCHOR SC-003 (readonly barring arm, #180) — barred from constraint validation,
    // value still submitted (`syncFormValue` above has no `readonly` branch, deliberately). See
    // the `readonly` property declaration for why it stays unreflected.
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
    // MUTATION ANCHOR SC-003 (post-reset arm, #180 — re-sited from SC-004, see research.md R6).
    // `formResetCallback()`'s `this.value` assignment reaches THIS line the ordinary way, so a
    // reset restoring a satisfying value must report valid immediately, not the stale prior
    // state.
    // ORDER MATTERS — `type` MUST be assigned before `value`, matching `render()`'s own
    // `.type`-then-`.value` binding order six lines below in that method. The probe is
    // long-lived (one instance, reused across every `validate()` call), so assigning in the
    // other order lets a same-update `type`+`value` change validate the NEW value against the
    // STALE (pre-update) type. Measured: `type` number->text with `value` '123'->'abc' and
    // `pattern="\d+"` in one update, assigned value-then-type — setting `probe.value = 'abc'`
    // while `probe.type` was still `'number'` SILENTLY SANITIZES an unparseable number-typed
    // assignment to `''` (a property assignment, unlike user typing, raises no flag at all, not
    // even `badInput`); `probe.type` then flips to `'text'`, but the value stays the ALREADY
    // -sanitized `''`, and an empty value never mismatches a pattern — so the merge saw no flags
    // and the host reported valid while the real, rendered control (type text, value 'abc')
    // genuinely mismatched `\d+`. Assigning `type` first means `value` is sanitized against the
    // type it will actually hold, closing the gap.
    this.#probe.type = this.type;
    this.#probe.value = this.value;
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
    // OPERATOR RULING (#180, fork resolved 2026-09 — see research.md R9 "value authority" for
    // the full three-option writeup): `setFormValue(this.value)` stays RAW and untouched — this
    // element still submits exactly what the consumer set, not a sanitized substitute. What
    // changed is DETECTION: a non-empty `this.value` that the CURRENT type cannot represent is
    // the PROGRAMMATIC analogue of `badInput` — the probe above has already been synced to
    // `this.type`/`this.value` (and pattern/min/max/step), so an empty probe value against a
    // non-empty property means the UA silently sanitized the property's value away entirely
    // (measured: `type="date"`, `value="2026-13-45"` — an out-of-range/malformed date — leaves
    // `probe.value === ''`; `type="number"`, `value="1,5"` — a UA-unparseable numeral — does the
    // same). A type that does NOT sanitize on an invalid value (`type="email"` with
    // `value="notanemail"`) leaves `probe.value` non-empty, so this branch does not fire there —
    // `typeMismatch` from the merge loop above already covers that case. `type="text"` does NOT
    // "always" leave `probe.value` non-empty, corrected post-merge: `text`/`search`/`password`
    // strip `\r`/`\n` from the sanitized value, so a value that is ENTIRELY newline (or, for
    // `tel`, `\r\n`; for `email`/`url`, all-whitespace) sanitizes to `''` too — measured across
    // 22 type/value pairs. `this.value.trim() !== ''` (below), not a bare non-empty check, is
    // what keeps those pure-whitespace cases from firing: a value that trims to empty is not
    // meaningfully "content the type cannot represent," it is whitespace the UA discarded the
    // same way it would discard leading/trailing whitespace generally. A value with REAL content
    // plus incidental whitespace (`"Acme Corp\n"`) is unaffected either way — the strip removes
    // only the newline, `probe.value` stays `"Acme Corp"` (non-empty), and this branch never
    // sees it.
    // Does not double-report against the REAL user-typing branch immediately above: while a
    // user is actively typing an unparseable value, `#onInput` deliberately does NOT write
    // `this.value` (see that handler), so `this.value` stays the last GOOD value during the
    // edit and `this.#probe.value` (synced from that same stale-but-valid `this.value`) is
    // non-empty — this branch is silent for the exact duration the real-control branch already
    // has it covered, and picks up only the property-assignment path that branch cannot reach.
    if (this.value.trim() !== '' && this.#probe.value === '') flags.badInput = true;
    // The consumer's message WINS the announcement when both hold — it is the more specific
    // one — while the derived flag stays set underneath. TRIMMED, not a bare truthy check: a
    // whitespace-only `customError` (e.g. `setCustomError(' ')`) is truthy as a string, so the
    // untrimmed check set `invalid`/`aria-describedby` for a message that RENDERED as visually
    // blank — `invalid: true` with nothing a user could read. Falling through when trimmed-empty
    // lets the fallback-message step below (or the plain "no flags" branch) take over instead.
    if (this.customError.trim() !== '') {
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
        aria-describedby=${describedBy || nothing}
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
    const control = e.target as HTMLInputElement;
    // DO NOT COPY A SANITIZED VALUE BACK ONTO THE CONTROL THE USER IS STILL EDITING (#180).
    // While `badInput` is true the UA has sanitized `.value` (often to `''`, sometimes to a
    // best-effort partial) but keeps the user's RAW, unparsed text in the control's own
    // internal edit buffer — measured: `type="date"` starting `2026-12-25`, deleting only the
    // year and typing `2027`, produced `.value === ''` mid-edit with `badInput` true. Assigning
    // that sanitized value to `this.value` and letting the NEXT render's `.value=` binding
    // commit it back to the SAME control (which Lit will do the moment any OTHER reactive
    // property changes, e.g. `invalid`) overwrites that raw buffer — the field then resolves to
    // a value the user never typed once editing finishes, rather than what they actually typed.
    // Skipping the `this.value` write here means the `.value=` binding never re-commits (its
    // last committed value is unchanged, so Lit's own dirty-check skips it), leaving the
    // control's buffer untouched. `badInput` still merges — see the unconditional `validate()`
    // call below, which reads it off THIS SAME control (not the probe — see the merge loop
    // above) regardless of whether `this.value` changes.
    if (!control.validity.badInput) {
      this.value = control.value;
    }
    // ALWAYS RE-RUN VALIDATE() DIRECTLY (#180 pass 2, debugger-found regression). `validate()`
    // is otherwise reachable only from `willUpdate` on a CHANGED reactive property (plus
    // `firstUpdated`) — but the badInput-guarded write above means `this.value = control.value`
    // can be a NO-OP: when the user types a bad character and then undoes it back to the
    // IDENTICAL prior value (e.g. `"5"` -> `"5e"` -> Backspace -> `"5"` again), Lit's own
    // dirty-check sees `this.value` unchanged, schedules no update, `willUpdate` never runs, and
    // the invalid state computed while `badInput` was momentarily true is left standing FOREVER
    // — measured: an untouched-looking `type="number"` field the user merely mistyped into and
    // corrected stays permanently `invalid`, blocking its whole form, with no property change to
    // recover from (only assigning a genuinely DIFFERENT value did). Calling `validate()`
    // unconditionally here closes that gap regardless of whether the assignment above actually
    // changed anything — it is idempotent and cheap (see the probe-based merge above), so paying
    // for it on every keystroke is the correct trade against a field that can otherwise lock.
    this.validate();
  };
}

define('sk-form-input', SkFormInput);
