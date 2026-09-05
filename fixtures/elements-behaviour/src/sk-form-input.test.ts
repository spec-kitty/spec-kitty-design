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
  // RE-SITED FROM SC-004 (CI collateral, both directions): the assertion this test makes is
  // about MERGED VALIDITY being current, not about the VALUE restoration SC-004's charter
  // ("reset restores the seeded value") already owns — `el.value` correctness after reset is
  // the EXISTING SC-004 test above, unaffected by anything here. This test's own precondition
  // (`validity.valid === false` before reset) depends on the merge for-loop, so mutating that
  // for-loop already reds this test the same way it reds the mount-time/post-mount-mutation
  // tests — correctly, as a fellow SC-003 arm, not as SC-004 collateral. And the shared
  // probe-value-sync line this test's own anchor targets is NOT reset-specific machinery: it
  // is the same sync every merge test above depends on, so anchoring it under a DIFFERENT id
  // than theirs was exactly what produced the two-directional collateral CI caught.
  // SAME ROOT CAUSE AS THE MERGE-TIMING FIX, different call site: formResetCallback assigns
  // `this.value` the normal reactive-property way, so without the sync-before-read step this
  // would read the PRE-reset (invalid) DOM state.
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
