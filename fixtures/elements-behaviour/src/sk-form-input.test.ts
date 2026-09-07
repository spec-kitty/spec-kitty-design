import { beforeEach, expect, test } from 'vitest';
import { userEvent } from '@vitest/browser/context';
import '@spec-kitty/elements';

/**
 * <sk-form-input> — the first REAL subject SC-002…SC-005 have ever had.
 *
 * Those four ids were written in #71 for this mission and have only ever been carried by the
 * synthetic `sk-behaviour-fixture`. Since #73 the registry has a `subjects` dimension and
 * `tests/node/config-contract.test.ts` derives the obligation from the element glob, so an
 * element that reaches neither fails the node lane — which it did, at WP01's commit, by name.
 *
 * EACH TEST DEPENDS ONLY ON ITS OWN BEHAVIOUR. That is not style: a lens's first [SC-005] test
 * asserted the *enabled* FormData entry before disabling, and SC-002's mutation redded it —
 * twice — so guard 5 rejected a perfectly good mutation as collateral. The coupling is
 * intra-file and it is easy to write by accident.
 */

type Input = HTMLElement & {
  name: string;
  readonly validity: ValidityState;
  setCustomError(message: string | null): void;
  value: string;
  label: string;
  description: string;
  disabled: boolean;
  required: boolean;
  readonly error: string;
  readonly validationMessage: string;
  checkValidity(): boolean;
  formDisabledCallback(disabled: boolean): void;
  updateComplete: Promise<unknown>;
  // #180 additions
  type: string;
  pattern: string | undefined;
  min: string | undefined;
  max: string | undefined;
  step: string | undefined;
  inputmode: string | undefined;
  autocomplete: string | undefined;
  readonly: boolean;
  options: ReadonlyArray<{ value: string; label?: string }>;
};

const mount = async (attrs: Record<string, string> = {}, seed = ''): Promise<[HTMLFormElement, Input]> => {
  const form = document.createElement('form');
  const el = document.createElement('sk-form-input') as Input;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (seed) el.value = seed;
  form.append(el);
  document.body.append(form);
  await el.updateComplete;
  return [form, el];
};

const control = (el: Input) => el.shadowRoot!.querySelector('input') as HTMLInputElement;

/**
 * THE FIVE FLAGS THIS ELEMENT DOES NOT COMPUTE ITSELF (SC-016, #196).
 *
 * Each is read off the permanently detached probe `<input>` ADR-14 describes, never off the
 * control the user actually interacts with — so each is a claim about a SECOND object that this
 * element is responsible for keeping in correspondence with the first.
 *
 * `badInput` is deliberately NOT in this list, and the exclusion is the point rather than an
 * oversight: ADR-14 records it as the one flag with TWO writers, and the second of them (the
 * programmatic-divergence branch, `sk-form-input.ts:401`) sets it on the host in exactly the
 * states where the rendered control legitimately does not — a property-assigned value the UA
 * sanitizes away raises no `badInput` on any real control. Asserting correspondence on it would
 * assert the opposite of the shipped design.
 */
const DELEGATED = [
  'patternMismatch',
  'rangeUnderflow',
  'rangeOverflow',
  'stepMismatch',
  'typeMismatch',
] as const;

const delegated = (v: ValidityState): Record<string, boolean> =>
  Object.fromEntries(DELEGATED.map((k) => [k, v[k]]));

/** The full five-flag shape with only the named flags true — so a case can pin the shared ANSWER
 *  and not merely the agreement. A correspondence assertion alone passes when both sources are
 *  wrong in the same way, and a single-flag anchor leaves the other four pinned by nobody. */
const onlyFlags = (...on: string[]): Record<string, boolean> =>
  Object.fromEntries(DELEGATED.map((k) => [k, on.includes(k)]));

beforeEach(() => {
  document.body.innerHTML = '';
});

test('[SC-002] a native form submit produces the expected FormData entry', async () => {
  // THREE WITNESSES, because one is not enough and the repo has the receipts.
  //
  //   1. The FormData entry itself.
  //   2. That the value arrived through `internals.setFormValue` — spied on the prototype.
  //      Without this the criterion does not witness FORM ASSOCIATION at all.
  //   3. That there is no light-DOM control. ADR-9 §4 records arrangement A — a plain
  //      <input name> rendered into the light DOM — as ALSO passing both axe and submission.
  //      Witness 1 alone is satisfied by it, so this is what makes the test about arrangement B.
  const seen: unknown[] = [];
  const real = ElementInternals.prototype.setFormValue;
  ElementInternals.prototype.setFormValue = function (v: never) {
    seen.push(v);
    return real.call(this, v);
  };
  try {
    const [form, el] = await mount({ name: 'email' }, 'ada@team.com');
    expect(new FormData(form).get('email')).toBe('ada@team.com');
    expect(seen, 'the value must arrive through ElementInternals').toContain('ada@team.com');
    expect(el.querySelector('[name]'), 'arrangement B: no light-DOM control').toBe(null);

    // And it must TRACK the property, not just the initial state. `el.value = 'x'` submitting
    // the old value is a real failure the synthetic fixture records.
    el.value = 'grace@team.com';
    await el.updateComplete;
    expect(new FormData(form).get('email'), 'the entry must be re-read after a change').toBe(
      'grace@team.com',
    );
  } finally {
    ElementInternals.prototype.setFormValue = real;
  }
});

test('[SC-003] setValidity blocks submission and the message reaches the accessibility tree', async () => {
  const [form, el] = await mount({ name: 'email', label: 'Email address', required: '' });
  await el.updateComplete;

  expect(el.checkValidity(), 'an empty required field must not be valid').toBe(false);
  expect(form.checkValidity(), 'and must block the form').toBe(false);

  // THE ACCESSIBILITY TREE, not `internals.validationMessage`. Those are different claims, and
  // SC-003 exists because the second can hold while the first does not: setValidity alone makes
  // the element match :invalid, but the MESSAGE only reaches a screen reader if something in
  // the same root is referenced by aria-describedby. Cross-root does not resolve (ADR-9 §4).
  await expect.element(control(el)).toHaveAccessibleDescription(/is required/);

  el.value = 'ada@team.com';
  await el.updateComplete;
  expect(el.checkValidity(), 'clearing the value clears the block').toBe(true);
  await expect.element(control(el)).not.toHaveAccessibleDescription(/is required/);
});

test('[SC-004] form reset restores the initial value', async () => {
  // SEEDED NON-EMPTY, deliberately. The initial value is captured in connectedCallback, so a
  // field mounted without one has `''` as both the correct restored value AND what any blanking
  // regression produces — `formResetCallback() { this.value = ''; }` passed the old assertion.
  const [form, el] = await mount({ name: 'email' }, 'ada@team.com');
  el.value = 'typo@team.com';
  await el.updateComplete;

  form.reset();
  await el.updateComplete;

  expect(el.value, 'reset restores the SEEDED value, not empty').toBe('ada@team.com');
  expect(new FormData(form).get('email')).toBe('ada@team.com');
});

test('[SC-005] a disabled control is excluded from submission', async () => {
  const [form, el] = await mount({ name: 'email' }, 'ada@team.com');

  // THE DIRECT CALLBACK CALL, and this is measured rather than stylistic. Four routes:
  //   setAttribute('disabled','')  → fires the callback, but the UA excludes a disabled
  //                                  form-associated element unaided, so the element's own
  //                                  exclusion is UNOBSERVABLE and the mutation is inert
  //   ancestor fieldset.disabled   → same
  //   el.disabled = true           → observable, but never fires the callback at all
  //   formDisabledCallback(true)   → observable AND exercises the element's own line
  // Only the last one tests what SC-005 names.
  el.formDisabledCallback(true);
  await el.updateComplete;

  // ABSENT, not present-and-empty — `get()` returns null for both a missing key and a null
  // value, so `has()` is the discriminating call.
  expect(new FormData(form).has('email'), 'the name must be ABSENT from the submission').toBe(false);

  el.formDisabledCallback(false);
  await el.updateComplete;
  expect(new FormData(form).get('email'), 're-enabling restores the entry').toBe('ada@team.com');
});

test('[SC-013] every declared ::part() is present and targetable from outside', async () => {
  const [, el] = await mount({ name: 'email', label: 'Email', description: 'Helper' });
  // Literal selectors, one per part: check-part-ratchet.mjs scans test SOURCES for the literal
  // `::part(name)` string, so a dynamically built selector passes at runtime while leaving the
  // ratchet reporting the part as untested.
  const style = document.createElement('style');
  style.textContent = `
    sk-form-input::part(field) { outline-style: dashed; }
    sk-form-input::part(label) { outline-style: dotted; }
    sk-form-input::part(control) { outline-style: double; }
    sk-form-input::part(description) { outline-style: groove; }
    sk-form-input::part(error) { outline-style: ridge; }
  `;
  document.head.append(style);
  try {
    const seen = (name: string) => {
      const node = el.shadowRoot!.querySelector(`[part~="${name}"]`) as HTMLElement | null;
      expect(node, `part "${name}" is declared but absent from the shadow tree`).not.toBe(null);
      return getComputedStyle(node!).outlineStyle;
    };
    // A distinct value per part, so one rule matching everything cannot pass for five.
    expect(seen('field')).toBe('dashed');
    expect(seen('label')).toBe('dotted');
    expect(seen('control')).toBe('double');
    expect(seen('description')).toBe('groove');
    expect(seen('error')).toBe('ridge');
  } finally {
    style.remove();
  }
});

test('the label names the CONTROL in the accessibility tree (SC-207)', async () => {
  // The accessible NAME, not an aria-label attribute string. #73 shipped exactly that mistake:
  // a raw-attribute assertion stayed green while the element it described had stopped being a
  // landmark at all. `label` is a property here precisely because a consumer-supplied <label>
  // cannot reach across the root (ADR-9 §4, arrangements C and D).
  const [, el] = await mount({ name: 'email', label: 'Email address' });
  await expect.element(control(el)).toHaveAccessibleName('Email address');
});

test('two instances in one form do not collide (SC-208)', async () => {
  // "No collision" is trivially true across two shadow roots, so the real claim is the one a
  // consumer would notice: both submit, under their own names, and neither writes an id into
  // the consumer's light DOM on upgrade.
  const form = document.createElement('form');
  const mk = (name: string, value: string) => {
    const el = document.createElement('sk-form-input') as Input;
    el.setAttribute('name', name);
    el.value = value;
    form.append(el);
    return el;
  };
  const a = mk('email', 'ada@team.com');
  const b = mk('backup', 'grace@team.com');
  document.body.append(form);
  await a.updateComplete;
  await b.updateComplete;

  const data = new FormData(form);
  expect(data.get('email')).toBe('ada@team.com');
  expect(data.get('backup')).toBe('grace@team.com');
  expect(form.querySelectorAll('[id]').length, 'no id may reach the light DOM').toBe(0);
});

/**
 * THE CONSUMER SURFACE — everything above this line is form association, and a pre-merge lens
 * showed that was all these tests covered.
 *
 * It applied 43 mutations and 15 survived a green 54-test suite, then proved ten of them were
 * coverage gaps rather than equivalent mutants by writing the missing probe and showing it
 * reds one-to-one. Every test below corresponds to one of those survivors. They are the parts
 * of the element a consumer touches first: typing, the displayed value, the description, the
 * invalid state, and the property routes for `name` and `disabled`.
 */

test('typing into the control updates the value and the submission', async () => {
  // SURVIVOR: deleting `@input=${this.#onInput}`. SC-002 only ever writes `el.value = …` from
  // script, so the round trip `user types → property → FormData` had no witness at all — on the
  // element's primary interaction.
  const [form, el] = await mount({ name: 'email' });
  const c = control(el);
  c.value = 'typed@team.com';
  c.dispatchEvent(new Event('input', { bubbles: true }));
  await el.updateComplete;

  expect(el.value, 'the property must follow the control').toBe('typed@team.com');
  expect(new FormData(form).get('email'), 'and so must the submission').toBe('typed@team.com');
});

test('the visible control displays the value', async () => {
  // SURVIVOR: deleting `.value=${this.value}`. The field submitted correctly while rendering
  // EMPTY — SC-002 reads FormData and the setFormValue spy, and neither looks at what the user
  // sees.
  const [, el] = await mount({ name: 'email' }, 'ada@team.com');
  expect(control(el).value, 'a field that submits but shows nothing passes every other gate').toBe(
    'ada@team.com',
  );

  // AND AFTER A LATER ASSIGNMENT, on a control the user has already dirtied. The seed alone is
  // witnessed by an ATTRIBUTE binding too, so `.value=` → `value=` would have passed — a
  // pass-2 lens found that weaker substitution uncovered. A dirty control ignores the
  // attribute, so only the property binding can update it.
  control(el).value = 'typed-by-user';
  control(el).dispatchEvent(new Event('input', { bubbles: true }));
  await el.updateComplete;
  el.value = 'set-from-script@team.com';
  await el.updateComplete;
  expect(control(el).value, 'the property binding must survive a dirtied control').toBe(
    'set-from-script@team.com',
  );
});

test('[SC-005] setting the disabled PROPERTY excludes the field from submission', async () => {
  // SURVIVOR: dropping `changed.has('disabled')` from the updated() sync guard. The other
  // [SC-005] test uses the direct callback, which is the only route that both fires the callback
  // and leaves the exclusion observable — but `el.disabled = true` is the ORDINARY consumer API
  // (a declared reactive property), and line 81 is the only thing that serves it.
  const [form, el] = await mount({ name: 'email' }, 'ada@team.com');
  el.disabled = true;
  await el.updateComplete;
  expect(new FormData(form).has('email'), 'the property route must exclude too').toBe(false);
});

test('setting the name PROPERTY produces the FormData key', async () => {
  // SURVIVOR: dropping `reflect: true` from `name`. Every other test sets it with setAttribute,
  // so reflection — which is what makes the JS route reach ElementInternals — was never
  // exercised.
  const form = document.createElement('form');
  const el = document.createElement('sk-form-input') as Input;
  form.append(el);
  document.body.append(el.parentElement!);
  el.name = 'email';
  el.value = 'ada@team.com';
  await el.updateComplete;
  expect(new FormData(form).get('email')).toBe('ada@team.com');
});

test('the description reaches the control accessible description', async () => {
  // SURVIVOR: dropping `description` from the describedBy computation.
  //
  // This is the element's own headline rationale — "`description` is a property rather than a
  // slot: it reaches the control through aria-describedby" — and it was the one claim in the
  // file with no test. SC-003 asserts the ERROR path only; SC-013 asserts the description PART
  // exists, not that anything references it. It is also the inference raised as operator
  // question 3 on #74, so it is the last thing that should have been unasserted.
  const [, el] = await mount({ name: 'email', description: "We'll never share it." });
  await expect.element(control(el)).toHaveAccessibleDescription(/never share it/);
});

test('the invalid state reaches the accessibility tree and the host attribute', async () => {
  // TWO SURVIVORS in one behaviour, both of which break the rendering as well as the a11y tree:
  //   * `aria-invalid` hard-coded to "false" — and the adopted sheet paints the error border
  //     with `[aria-invalid="true"]`, so the invalid state disappears visually too.
  //   * dropping `reflect: true` from `invalid` — `:host(:not([invalid])) .…__error` is what
  //     HIDES the error text, so without reflection it is permanently visible. The declaration
  //     says reflection exists because a descendant selector would be inert once adopted (#72);
  //     the fix for #72 was itself unguarded.
  const [, el] = await mount({ name: 'email', label: 'Field', required: '' });
  await el.updateComplete;

  expect(control(el).getAttribute('aria-invalid'), 'the a11y tree AND the error border').toBe('true');
  expect(el.hasAttribute('invalid'), 'reflected, or the error text never hides').toBe(true);

  el.value = 'something';
  await el.updateComplete;
  expect(control(el).getAttribute('aria-invalid')).toBe('false');
  expect(el.hasAttribute('invalid')).toBe(false);
});

test('disabled and required reach the inner control', async () => {
  // SURVIVORS: dropping `?disabled` / `?required`. Without them the field is excluded from
  // submission while still being typeable, and loses `required` from the accessibility tree.
  const [, a] = await mount({ name: 'email', disabled: '' });
  expect(control(a).disabled, 'excluded but still typeable is worse than either').toBe(true);
  const [, b] = await mount({ name: 'backup', required: '' });
  expect(control(b).required).toBe(true);
});

test('the error node announces, and carries the message text', async () => {
  // SURVIVORS: removing `role="alert"`, and blanking the error span's text. The live-region
  // announcement is the half of SC-003 that toHaveAccessibleDescription does not cover.
  const [, el] = await mount({ name: 'email', label: 'Field', required: '' });
  await el.updateComplete;
  const err = el.shadowRoot!.querySelector('[part~="error"]') as HTMLElement;
  expect(err.getAttribute('role'), 'the message must be announced, not just referenced').toBe('alert');
  expect(err.textContent!.trim()).toMatch(/Field is required/);
});

test('a consumer can set a server-side error, and it reaches the a11y tree AND blocks submission', async () => {
  // The hole a pre-merge lens found: `el.invalid = true` was the ONLY lever a consumer had, and
  // it produced the worst state available — red border, `aria-invalid="true"`,
  // `aria-describedby` pointing at an EMPTY error node, and `validity.valid === true` so the
  // form submitted anyway. An error identified visually with no programmatic text, on a control
  // that still submits.
  const [form, el] = await mount({ name: 'email' }, 'taken@team.com');
  expect(form.checkValidity(), 'precondition: valid before the server speaks').toBe(true);

  el.setCustomError('That address is already registered.');
  await el.updateComplete;

  expect(form.checkValidity(), 'a server error must block submission').toBe(false);
  expect(el.hasAttribute('invalid'), 'and reach the sheet through the host attribute').toBe(true);
  await expect.element(control(el)).toHaveAccessibleDescription(/already registered/);

  // And it must survive a keystroke — a derived rule may not clobber the server's message.
  el.value = 'taken2@team.com';
  await el.updateComplete;
  expect(el.hasAttribute('invalid'), 'typing must not silently clear a server error').toBe(true);

  el.setCustomError(null);
  await el.updateComplete;
  expect(form.checkValidity(), 'clearing it restores validity').toBe(true);
});

test('a changed message repaints the error node, not just internals', async () => {
  // A pass-2 lens found the rendered node interpolated `this.validationMessage` — a getter over
  // ElementInternals, which Lit cannot observe. A message that changed WITHOUT flipping
  // `invalid` left the DOM stale: internals said one thing, the node the user hears said
  // another. `aria-describedby` points at that node, so the stale text IS the programmatic
  // message, and `role="alert"` never re-announced.
  const [, el] = await mount({ name: 'email', label: 'Field', required: '' });
  await el.updateComplete;
  const err = () => (el.shadowRoot!.querySelector('[part~="error"]') as HTMLElement).textContent!.trim();
  expect(err()).toMatch(/Field is required/);

  // `invalid` stays true across this change — which is exactly why the old code never repainted.
  el.setCustomError('That address is already registered.');
  await el.updateComplete;
  expect(el.hasAttribute('invalid'), 'precondition: invalid did NOT flip').toBe(true);
  expect(err(), 'the node must follow the message').toMatch(/already registered/);
  await expect.element(control(el)).toHaveAccessibleDescription(/already registered/);

  el.setCustomError('A second, different problem.');
  await el.updateComplete;
  expect(err(), 'and again, with invalid still true throughout').toMatch(/second, different/);
});

test('clearing a server error does NOT wipe a live required violation', async () => {
  // THE FAKEABLE ASSERTION THIS REPLACES. The test above clears on a field that was never
  // `required`, so `form.checkValidity() === true` holds both under the correct implementation
  // AND under "wipe all validity unconditionally" — which is what the first version did, because
  // setValidity flags are a full REPLACEMENT rather than a layer. An empty required field then
  // submitted, with aria-invalid="false" and no host [invalid]. A pass-2 lens measured it.
  const [form, el] = await mount({ name: 'email', label: 'Email', required: '' });
  await el.updateComplete;
  expect(form.checkValidity(), 'precondition: empty + required is invalid').toBe(false);

  el.setCustomError('That address is already registered.');
  await el.updateComplete;
  // BOTH flags, not one replacing the other — a consumer branching on `validity.valueMissing`
  // must not be told `false` merely because a server error arrived.
  expect(el.validity.valueMissing, 'the derived flag survives underneath').toBe(true);
  expect(el.validity.customError).toBe(true);

  el.setCustomError(null);
  await el.updateComplete;

  expect(form.checkValidity(), 'still empty and still required — must NOT submit').toBe(false);
  expect(el.validity.valueMissing, 'the required violation is re-derived, not erased').toBe(true);
  expect(el.hasAttribute('invalid')).toBe(true);
  await expect.element(control(el)).toHaveAccessibleDescription(/is required/);
});

/**
 * #180 — native constraint forwarding, merged UA validity, corrected readonly semantics, and a
 * shadow-root datalist. WP01 T001 (forwarding), T002 (readonly + merged validity), T003
 * (datalist) — merged with their tests per the coordinator's DIRECTIVE_034 fold-in: each test
 * below sits in the same subtask as the code it covers, not a later one.
 */

test('[SC-013] pattern/min/max/step/inputmode/autocomplete reach the inner control', async () => {
  // SIX ATTRIBUTES, ONE TEST — a dropped forwarding for any one of them is a distinguishable
  // mutation target (the render() binding line for that attribute), so a single parameterized
  // assertion set still gives per-attribute mutation coverage.
  const cases: Array<[keyof Input, string]> = [
    ['pattern', '[a-z]+'],
    ['min', '3'],
    ['max', '9'],
    ['step', '2'],
    ['inputmode', 'numeric'],
    ['autocomplete', 'off'],
  ];
  const [, el] = await mount({ name: 'signal' });
  for (const [prop, value] of cases) {
    (el as unknown as Record<string, unknown>)[prop] = value;
  }
  await el.updateComplete;
  const inner = control(el);
  for (const [prop, value] of cases) {
    expect(
      inner.getAttribute(prop as string),
      `${String(prop)} must reach the inner control as a real attribute`,
    ).toBe(value);
    // PROPERTY -> ATTRIBUTE on the HOST, not the inner control — the other half of `reflect:
    // true`, and previously unasserted: this test's other checks all read the INNER control, so
    // deleting `reflect: true` from all six properties reds nothing here. `reflect: true` is
    // also what the forwarding assertion above depends on transitively (Lit re-runs the render
    // binding on the property write either way), but the HOST attribute itself is a separate,
    // directly observable fact this loop was not checking.
    expect(el.hasAttribute(prop as string), `${String(prop)} must reflect onto the HOST`).toBe(true);
  }
  // Attribute -> property also works, for every one of them (Lit's own `type: String` handles
  // this; asserted once as a precondition the rest of the test relies on).
  const [, el2] = await mount({ pattern: '[0-9]+', min: '1', max: '5', step: '1', inputmode: 'tel', autocomplete: 'on' });
  expect(el2.pattern).toBe('[0-9]+');
  expect(el2.min).toBe('1');
  expect(el2.max).toBe('5');
  expect(el2.step).toBe('1');
  expect(el2.inputmode).toBe('tel');
  expect(el2.autocomplete).toBe('on');

  // UNSET must OMIT the attribute entirely on the rendered control, not forward an empty
  // string. This is not merely cosmetic: an empty `pattern=""` is not "no pattern" — it compiles
  // to a regex that matches ONLY the empty string, so a plain input like "x" would fail it.
  // Measured directly while building the merge (below): the same trap exists internally for the
  // detached validation probe, and is guarded there for the same reason.
  const [, el3] = await mount({ name: 'plain' });
  const inner3 = control(el3);
  for (const attr of ['pattern', 'min', 'max', 'step']) {
    expect(inner3.hasAttribute(attr), `unset ${attr} must be ABSENT, not empty`).toBe(false);
  }
});

test('[SC-003] readonly reaches the inner control but is NOT reflected on the host', async () => {
  // ATTRIBUTE -> PROPERTY works (markup authoring); PROPERTY -> ATTRIBUTE is DELIBERATELY absent
  // — reflecting `readonly` would let the UA bar constraint validation on the host attribute
  // alone, making the element's own barring branch an unobservable mutation anchor (research.md
  // R1). This test's second half is the one that would silently pass for the wrong reason if
  // `reflect: true` were mistakenly restored.
  const [, el] = await mount({ readonly: '' });
  expect(el.readonly, 'attribute -> property must still work').toBe(true);
  expect(control(el).readOnly, 'the inner control must be driven from the property').toBe(true);

  const [, el2] = await mount({});
  el2.readonly = true;
  await el2.updateComplete;
  expect(
    el2.hasAttribute('readonly'),
    'readonly is deliberately NOT reflected — this must stay false',
  ).toBe(false);
});

test('[SC-003] a merged UA validity flag blocks a real submit and carries a message — mount-time', async () => {
  const [form, el] = await mount({ name: 'branch', pattern: '[a-z]+' }, '123');
  await el.updateComplete;

  expect(el.validity.patternMismatch, 'the UA flag must be merged onto the host').toBe(true);
  expect(el.checkValidity()).toBe(false);

  let fired = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // never let a genuinely-firing submit actually navigate the test iframe
    fired += 1;
  });
  form.requestSubmit();
  expect(fired, 'a patternMismatch value must never reach a submit handler').toBe(0);

  // The message reaches the a11y tree, not merely the flag.
  const err = el.shadowRoot!.querySelector('[part~="error"]') as HTMLElement;
  expect(err.textContent!.trim().length, 'a UA-raised flag must carry a non-empty message').toBeGreaterThan(0);

  // And the valid path still works.
  el.value = 'abc';
  await el.updateComplete;
  form.requestSubmit();
  expect(fired, 'a valid value must still submit').toBe(1);
});

test('[SC-003] a constraint attribute changed AFTER mount reaches the host validity — the read-before-write ordering fix', async () => {
  // THE ARM THAT CATCHES THE CRITICAL DEFECT. Mount with a VALID value, THEN mutate — this is
  // what programmatic assignment (and the React wrapper) actually does, and it is the case
  // `willUpdate` running before `render()` commits bindings would otherwise miss: without the
  // sync-before-read step in validate(), `control.validity` here would still reflect the
  // PREVIOUS render's (valid) state.
  const [form, el] = await mount({ name: 'branch', pattern: '[a-z]+' }, 'abc');
  await el.updateComplete;
  expect(el.validity.valid, 'precondition: valid at mount').toBe(true);

  el.value = '123';
  await el.updateComplete;

  expect(el.validity.patternMismatch, 'the flag must be current after a post-mount mutation').toBe(true);
  expect(el.checkValidity()).toBe(false);

  let fired = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    fired += 1;
  });
  form.requestSubmit();
  expect(fired, 'a post-mount-mutated invalid value must still block submission').toBe(0);
});

test('[SC-003][SC-016] a `type` change and a `value` change in the SAME update validate against the NEW type — the probe-ordering fix', async () => {
  // THE ARM THAT CATCHES THE PROBE-ORDERING DEFECT. `pattern="\d+"` (digits only). Mount as a
  // number field with a satisfying value, then change BOTH `type` (number -> text) and `value`
  // ('123' -> 'abc') in one update, unawaited between the two assignments — exactly what a
  // consumer switching a field's kind and seeding a new value at once would do. Without probe
  // assigning `type` before `value`, the probe validated 'abc' against the STALE 'number' type
  // (silently sanitizing to '' with no flag at all), then flipped type — leaving the merge with
  // an empty, unmatched-by-\d+-because-empty value and a host that wrongly reported valid.
  const [form, el] = await mount({ name: 'branch', type: 'number', pattern: '\\d+' }, '123');
  await el.updateComplete;
  expect(el.validity.valid, 'precondition: valid as a number field').toBe(true);

  el.type = 'text';
  el.value = 'abc';
  await el.updateComplete;

  expect(el.validity.patternMismatch, 'text "abc" against \\d+ must mismatch').toBe(true);
  expect(el.checkValidity()).toBe(false);
  let fired = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    fired += 1;
  });
  form.requestSubmit();
  expect(fired, 'a same-update type+value change must not slip through as valid').toBe(0);
});

test('[SC-003][SC-016] the probe and the rendered control agree for the same intended state', async () => {
  // ADR-11 ITEM 10, WRITTEN FROM ADR-14'S THREE MEASURED BUGS RATHER THAN FROM THE ABSTRACTION.
  //
  // Every test above asserts what the HOST reports. None of them asserts that the object the host
  // merged from still agrees with the control the user can see — which is the thing that was
  // wrong all three times:
  //
  //   1. reading the rendered control's `.validity` from `willUpdate` read the PREVIOUS render,
  //      so `pattern="[a-z]+"` then `el.value = '123'` submitted `123`;
  //   2. `control.pattern = this.pattern ?? ''` compiled an UNSET pattern to `^(?:)$`, which
  //      matches only the empty string, so a plain unconstrained "x" reported patternMismatch;
  //   3. assigning the probe's `value` before its `type` validated the new value against the
  //      stale type, and the merge reported NO flags while the rendered control genuinely
  //      mismatched `\d+`.
  //
  // Bug 3 is two live sources disagreeing outright; bugs 1 and 2 are one source disagreeing with
  // the intended state. All three are visible as the SAME assertion — the host's delegated flags
  // against the rendered control's own — so that is what this test makes. Each case also pins the
  // shared answer — ALL FIVE flags, not just the one under test: correspondence alone is satisfied
  // by both sources being wrong together, and an anchor on one flag leaves the other four pinned by
  // nobody. A pre-merge lens caught that gap when only `patternMismatch` was anchored.
  //
  // THE MARKER CARRIES BOTH IDS on purpose (`[SC-002][SC-003]` above is the precedent). The merge
  // loop is how the probe's answer reaches `setValidity` at all, so an arm that deletes it breaks
  // this correspondence and SC-003's submission-blocking claim with one edit — measured, not
  // assumed: three existing arms red this test. Naming both ids keeps those arms surgical instead
  // of buying room for a new id by switching off guard 5's collateral bound on them.

  // Bug 1's shape, at mount: a field that mounts ALREADY violating a forwarded constraint.
  {
    const [, el] = await mount({ name: 'a', pattern: '[a-z]+' }, '123');
    expect(delegated(el.validity), 'at mount').toEqual(delegated(control(el).validity));
    expect(delegated(el.validity), 'and both must land on the RIGHT answer, all five flags')
      .toEqual(onlyFlags('patternMismatch'));
  }

  // Bug 1's shape, after mount: the read-before-write case the probe exists to close.
  {
    const [, el] = await mount({ name: 'b', pattern: '[a-z]+' }, 'abc');
    el.value = '123';
    await el.updateComplete;
    expect(delegated(el.validity), 'after a post-mount change').toEqual(
      delegated(control(el).validity),
    );
    expect(delegated(el.validity), 'and both must land on the RIGHT answer, all five flags')
      .toEqual(onlyFlags('patternMismatch'));
  }

  // Bug 3: `type` and `value` changed in ONE update. This is the case where the two sources
  // disagreed outright — the probe saw a silently sanitized '' and reported nothing while the
  // rendered control held 'abc' against `\d+`.
  {
    const [, el] = await mount({ name: 'c', type: 'number', pattern: '\\d+' }, '123');
    el.type = 'text';
    el.value = 'abc';
    await el.updateComplete;
    expect(delegated(el.validity), 'after a same-update type and value change').toEqual(
      delegated(control(el).validity),
    );
    expect(delegated(el.validity), 'and both must land on the RIGHT answer, all five flags')
      .toEqual(onlyFlags('patternMismatch'));
  }

  // Bug 2: NEITHER source may invent a constraint the element never declared. The positive cases
  // above cannot see this one — a delegate that reports a flag nobody asked for is a
  // correspondence failure in the other direction.
  {
    const [, el] = await mount({ name: 'd' }, 'x');
    expect(delegated(el.validity), 'an unconstrained field, on the host').toEqual(onlyFlags());
    expect(delegated(control(el).validity), 'an unconstrained field, on the control')
      .toEqual(onlyFlags());
  }
});

test('[SC-003] a UA flag with no required/customError still gets a non-empty message — the setValidity throw fix', async () => {
  // THE ARM THAT CATCHES THE OTHER CRITICAL DEFECT. `required` is NOT set here, so the only
  // source of a true flag is the merged UA flag — `setValidity(flags, '')` throws in that case
  // unless a fallback message is authored. The test simply completing (updateComplete resolving,
  // not rejecting) is part of the assertion.
  const [, el] = await mount({ name: 'branch', pattern: '[a-z]+' }, '123');
  // Reaching this line at all is part of the assertion: `setValidity(flags, '')` throwing would
  // reject `updateComplete` (awaited inside `mount`), failing the test before this line runs.
  const err = el.shadowRoot!.querySelector('[part~="error"]') as HTMLElement;
  expect(err.textContent!.trim().length, 'a bare UA flag must still get a message').toBeGreaterThan(0);
});

test('[SC-003] badInput reaches the host — REAL typing only, never a property assignment', async () => {
  // MEASURED, NOT ASSUMED: `el.value = '12e'` (property assignment) on a bare native
  // `<input type="number">` sanitizes silently to `''` with `badInput` staying `false` — even
  // with a dispatched `input` event. `badInput` is set ONLY by the UA's own response to genuine
  // user keystrokes into the widget. That is why this merge is read from the REAL rendered
  // control (not the detached validation probe every other flag in this file is merged from —
  // a probe driven by property assignment could never observe this flag at all) and why this
  // test uses `userEvent.type`, not `el.value = …`.
  const [, el] = await mount({ name: 'qty', type: 'number' });
  const inner = control(el);
  await userEvent.type(inner, '12');
  await userEvent.type(inner, 'e');
  await el.updateComplete;

  expect(el.validity.badInput, 'real typing of an unparseable number must merge badInput').toBe(true);
  expect(el.validity.valid).toBe(false);
});

test('[SC-003] a bad-input control keeps the user\'s buffer, rather than being overwritten mid-edit', async () => {
  // "12e4" IS a valid HTML number (exponential notation) — but IS badInput for the MIDDLE
  // keystroke, "12e", before the trailing "4" arrives. Measured on a bare native input: typing
  // the whole thing keystroke-by-keystroke ends at `value === '12e4'`, `badInput === false`.
  // The regression this guards: an EARLIER version of `#onInput` copied the sanitized `''` the
  // UA reports mid-typing into `this.value`, and the NEXT render's `.value=` binding committed
  // that `''` back onto the SAME control the user was still typing into — resetting its buffer,
  // so the trailing "4" landed in an EMPTIED field and the end result was just "4", not "12e4".
  const [, el] = await mount({ name: 'qty', type: 'number' });
  const inner = control(el);
  await userEvent.type(inner, '12e'); // badInput mid-sequence
  await el.updateComplete; // let a render happen WHILE badInput is true
  await userEvent.type(inner, '4'); // completes it to a valid exponential number

  expect(el.value, 'the control must keep every keystroke, not just the last one').toBe('12e4');
  expect(el.validity.badInput).toBe(false);
  expect(el.validity.valid).toBe(true);
});

test('[SC-003] undoing a bad keystroke back to the IDENTICAL prior value still re-validates — the unconditional validate() fix', async () => {
  // THE REGRESSION #187's pre-merge review pass 2 caught: the buffer-preservation fix above
  // skips `this.value = control.value` while `badInput` is true, which is correct for the
  // MIDDLE of a keystroke sequence — but if the user backs out to the EXACT prior value,
  // `this.value = control.value` becomes a NO-OP once badInput clears (Lit's dirty-check sees no
  // change and never reschedules `willUpdate`), so the invalid state computed while badInput was
  // momentarily true was left standing FOREVER — a field the user LEFT VALID reported invalid
  // with no property change able to recover it. `#onInput` calling `validate()`
  // unconditionally, not only inside the badInput branch, is the fix under test here.
  const [form, el] = await mount({ name: 'qty', type: 'number' }, '5');
  await el.updateComplete;
  expect(el.validity.valid, 'precondition: valid at mount').toBe(true);

  const inner = control(el);
  await userEvent.type(inner, '{End}e'); // "5e" — badInput mid-sequence
  await el.updateComplete;
  expect(el.validity.badInput, 'precondition: badInput while "5e" is on the control').toBe(true);

  await userEvent.keyboard('{Backspace}'); // undo back to "5" — IDENTICAL to this.value already
  await el.updateComplete;

  expect(el.value, 'the property must reflect the undone control value').toBe('5');
  expect(el.validity.badInput, 'badInput must clear once the control is valid again').toBe(false);
  expect(el.validity.valid, 'the host must recover — this is the regression').toBe(true);

  let fired = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    fired += 1;
  });
  form.requestSubmit();
  expect(fired, 'a recovered value must submit, not stay silently blocked').toBe(1);
});

test('[SC-003] an untouched-looking empty number field survives a mistype-and-undo — the user-visible shape of the same regression', async () => {
  // The narrower, more alarming shape of the same bug: an OPTIONAL, EMPTY field a user merely
  // brushes against (types a stray character, then corrects it) must not end up vetoing its
  // whole form. Pre-fix-3 this was already valid; the buffer-preservation fix alone regressed
  // it to permanently invalid; this test proves the unconditional validate() fix restores it.
  const [form, el] = await mount({ name: 'qty', type: 'number' });
  await el.updateComplete;
  expect(el.validity.valid, 'precondition: an empty, non-required number field is valid').toBe(
    true,
  );

  const inner = control(el);
  await userEvent.type(inner, 'e');
  await el.updateComplete;
  await userEvent.keyboard('{Backspace}');
  await el.updateComplete;

  expect(el.value).toBe('');
  expect(el.validity.valid, 'an untouched-looking empty field must not lock invalid').toBe(true);

  let fired = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    fired += 1;
  });
  form.requestSubmit();
  expect(fired).toBe(1);
});

test('[SC-003] a value the current type cannot represent blocks a real submit — the programmatic badInput divergence (operator ruling)', async () => {
  // #180's value-authority fork, resolved by the operator: `this.value` stays RAW (still what
  // gets submitted on a valid path), but a non-empty value the UA sanitizes AWAY ENTIRELY for
  // the current type is now DETECTED and blocks the form, exactly like real-typing badInput
  // does. `2026-13-45` is not a real date (month 13); a bare native `<input type="date">`
  // sanitizes an unparseable value straight to `''`, which is what makes this the programmatic
  // analogue of badInput rather than a `typeMismatch`/`rangeOverflow` case.
  const [form, el] = await mount({ name: 'when', type: 'date', required: '' }, '2026-13-45');
  await el.updateComplete;

  expect(el.validity.valid, 'an unrepresentable date must not report valid').toBe(false);
  expect(el.value, 'the raw, unsanitized value must be preserved on the property').toBe(
    '2026-13-45',
  );

  let fired = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    fired += 1;
  });
  form.requestSubmit();
  expect(fired, 'an unrepresentable date must never reach a submit handler').toBe(0);

  const err = el.shadowRoot!.querySelector('[part~="error"]') as HTMLElement;
  expect(
    err.textContent!.trim().length,
    'the divergence must carry a non-empty message, not merely set a flag',
  ).toBeGreaterThan(0);
});

test('[SC-003] a comma-formatted number blocks a real submit — the programmatic badInput divergence (operator ruling)', async () => {
  // Same divergence, a different type: "1,5" is not a UA-parseable number (no thousands
  // separator, no locale comma-decimal support in the number input's own parser), so a bare
  // native `<input type="number">` sanitizes it to `''` on property assignment.
  const [form, el] = await mount({ name: 'qty', type: 'number' }, '1,5');
  await el.updateComplete;

  expect(el.validity.valid).toBe(false);
  expect(el.value, 'the raw value must be preserved, not silently cleared').toBe('1,5');

  let fired = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    fired += 1;
  });
  form.requestSubmit();
  expect(fired).toBe(0);
});

test('[SC-003] an unparseable-looking but non-sanitizing value reports typeMismatch, NOT the new divergence — proves the branch does not over-fire', async () => {
  // The negative case the operator ruling explicitly asked to be proven: `type="email"` does
  // NOT sanitize an invalid value away — the UA keeps the raw text on the control and reports
  // `typeMismatch` instead. If the new divergence branch fired here too, it would be
  // indistinguishable from `typeMismatch` and this test would still pass for the wrong reason —
  // so it asserts `badInput` is specifically FALSE, not merely that the field is invalid.
  const [, el] = await mount({ name: 'contact', type: 'email' }, 'notanemail');
  await el.updateComplete;

  expect(el.validity.typeMismatch, 'an invalid email is a typeMismatch, not badInput').toBe(true);
  expect(
    el.validity.badInput,
    'the programmatic divergence must not fire for a type that keeps the raw text',
  ).toBe(false);
  expect(el.validity.valid).toBe(false);
});

test('[SC-003] a value that sanitizes to empty ONLY because it is pure whitespace does not trigger the divergence — the `.trim()` fix', async () => {
  // #187's pre-merge review pass 2 measured that `text`/`search`/`password` inputs strip `\r`/
  // `\n` from their sanitized value, so a value that is ENTIRELY newline sanitizes to `''` too —
  // the same shape as `2026-13-45`/`1,5`, but not a genuine "unrepresentable content" case, just
  // whitespace the UA discarded. A bare `this.value !== ''` check would have merged this as
  // `badInput` and blocked the field; `.trim() !== ''` correctly stays silent for it.
  const [, el] = await mount({ name: 'notes', type: 'text' }, '\n');
  await el.updateComplete;

  expect(
    el.validity.badInput,
    'a pure-whitespace value must not read as an unrepresentable divergence',
  ).toBe(false);
  expect(el.validity.valid).toBe(true);
});

test('[SC-002][SC-003] a readonly control still submits but is barred from constraint validation', async () => {
  const [form, el] = await mount({ name: 'region', label: 'Region', required: '', readonly: '' });
  await el.updateComplete;

  expect(el.validity.valid, 'barred, not merely passing').toBe(true);
  expect(el.checkValidity()).toBe(true);
  // PRESENCE, not absence — the exact line that distinguishes readonly from disabled.
  expect(new FormData(form).has('region'), 'a readonly control still submits its (empty) value').toBe(true);

  // The subtlest arm: a pattern mismatch ALSO present must not leak through — proves the
  // readonly early return precedes the merge code, not merely that empty+required is barred.
  const [, el2] = await mount({ name: 'region2', required: '', readonly: '', pattern: '[a-z]+' }, '123');
  await el2.updateComplete;
  expect(el2.validity.valid, 'a failing pattern must also be barred when readonly').toBe(true);
});

test('[SC-003] a form reset that restores a satisfying value reports valid immediately', async () => {
  // RE-SITED FROM SC-004 — this is a merged-validity claim, not the value-restoration SC-004
  // already owns (see the existing SC-004 test above); full story in research.md R6.
  const [form, el] = await mount({ name: 'branch', pattern: '[a-z]+' }, 'abc');
  await el.updateComplete;
  el.value = '123';
  await el.updateComplete;
  expect(el.validity.valid, 'precondition: invalid before reset').toBe(false);

  form.reset();
  await el.updateComplete;

  expect(el.validity.valid, 'a reset that restores a satisfying value must report valid').toBe(true);
  const err = el.shadowRoot!.querySelector('[part~="error"]') as HTMLElement;
  expect(err.textContent!.trim()).toBe('');
});

test('[SC-013] the datalist is reachable from the inner input by node identity', async () => {
  const [, el] = await mount({ name: 'branch' });
  el.options = Object.freeze([
    { value: 'main' },
    { value: 'release/2026.09', label: 'Release 2026.09' },
  ]);
  await el.updateComplete;

  const inner = control(el);
  const datalist = el.shadowRoot!.querySelector('datalist');
  // NODE IDENTITY, not attribute-string equality — a string match would pass even if `list`
  // pointed at a same-id node in the WRONG root, or at nothing.
  expect(inner.list, 'the input must resolve `list` to THIS datalist, by identity').toBe(datalist);
  expect(datalist!.children.length).toBe(2);
  expect((datalist!.children[1] as HTMLOptionElement).label).toBe('Release 2026.09');
});

test('[SC-013] no options means no list attribute and no datalist element', async () => {
  const [, el] = await mount({ name: 'branch' });
  await el.updateComplete;
  expect(control(el).list, 'absent, not pointing at nothing').toBe(null);
  expect(el.shadowRoot!.querySelector('datalist')).toBe(null);
});

test('[FR-006] a value matching no option stays valid', async () => {
  const [, el] = await mount({ name: 'branch' });
  el.options = Object.freeze([{ value: 'main' }]);
  el.value = 'not-in-the-list';
  await el.updateComplete;
  expect(el.validity.valid, 'the datalist is a suggestion, not a closed enum').toBe(true);
});

test('[SC-003] removing a constraint attribute clears it, rather than forwarding literal "null"', async () => {
  // Lit's default String converter hands a REMOVED reflected attribute's `fromAttribute` result
  // straight through as `null` (from `getAttribute`), not `undefined` — a value the original
  // `string | undefined` declaration did not admit. Checking only `undefined` for "removed"
  // let `null` fall to `setAttribute(name, null)`, which stringifies to the literal text
  // "null" — `pattern="null"` compiles to `^(?:null)$`, permanently invalid for anything else,
  // with NO visible `pattern` attribute in the shadow DOM to explain why.
  const [, el] = await mount({ name: 'branch', pattern: '[a-z]+' }, 'anything-with-digits-1');
  await el.updateComplete;
  expect(el.validity.valid, 'precondition: the pattern legitimately fails first').toBe(false);

  el.removeAttribute('pattern');
  await el.updateComplete;

  expect(el.pattern, 'Lit hands this property null on attribute removal, not undefined').toBe(null);
  expect(control(el).hasAttribute('pattern'), 'no attribute must reach the rendered control').toBe(false);
  expect(el.validity.valid, 'removing the constraint must clear the mismatch, not fossilize "null"').toBe(true);
});

test('[SC-003] changing `label` alone updates the required-field message', async () => {
  const [, el] = await mount({ name: 'email', label: 'Email', required: '' });
  await el.updateComplete;
  const err = () => (el.shadowRoot!.querySelector('[part~="error"]') as HTMLElement).textContent!.trim();
  expect(err()).toMatch(/Email is required/);

  el.label = 'Work email';
  await el.updateComplete;
  expect(err(), 'changing label alone must re-run validate(), not wait for value to also change').toMatch(
    /Work email is required/,
  );
});

test('[SC-013] no description and no error means aria-describedby is ABSENT, not empty', async () => {
  // `undefined` is not a removal sentinel in a Lit ATTRIBUTE binding (only `nothing` is) — the
  // original `aria-describedby=${describedBy || undefined}` rendered a literal
  // `aria-describedby=""` rather than omitting the attribute.
  const [, el] = await mount({ name: 'email', label: 'Email' });
  await el.updateComplete;
  expect(control(el).hasAttribute('aria-describedby'), 'must be absent, not an empty string').toBe(false);
});

test('[SC-003] a whitespace-only customError is treated as empty, not a blank visible error', async () => {
  const [, el] = await mount({ name: 'email', label: 'Email' });
  await el.updateComplete;
  expect(el.validity.valid, 'precondition: nothing else makes this invalid').toBe(true);

  el.setCustomError('   ');
  await el.updateComplete;

  expect(el.validity.valid, 'a whitespace-only error must not silently invalidate the field').toBe(true);
  expect(el.hasAttribute('invalid'), 'no visible error paint for a message with nothing to show').toBe(false);
});

test('a disabled required field does not veto its form', async () => {
  // The UA bars a disabled form-associated element from constraint validation — but `disabled`
  // is deliberately not reflected here (that is what makes SC-005's mutation observable), so
  // the UA cannot see it and the element has to do it itself. A pass-2 lens measured the
  // consequence: an empty required field, disabled, blocked submission forever, and the user
  // could not clear it because the field was disabled.
  const [form, el] = await mount({ name: 'email', label: 'Email', required: '' });
  await el.updateComplete;
  expect(form.checkValidity(), 'precondition: empty + required blocks').toBe(false);

  el.disabled = true;
  await el.updateComplete;
  expect(form.checkValidity(), 'disabling must release the veto').toBe(true);
  expect(el.hasAttribute('invalid')).toBe(false);

  el.disabled = false;
  await el.updateComplete;
  expect(form.checkValidity(), 're-enabling restores it').toBe(false);
});
