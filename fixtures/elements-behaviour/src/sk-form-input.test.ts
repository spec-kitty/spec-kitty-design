import { beforeEach, expect, test } from 'vitest';
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
