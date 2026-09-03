import { beforeEach, expect, test } from 'vitest';
import '@spec-kitty/elements';

/**
 * <sk-form-textarea> — the same four behaviours against the multi-line control.
 *
 * DELIBERATELY A SEPARATE FILE WITH ITS OWN ANCHORS, not a parameterised sweep over both
 * elements. `suite-selftest.mjs` guard 5 computes collateral over every `[SC-…]` test outside a
 * mutation's declared `(id, subject)` pair, so a shared assertion — or a shared line in the
 * element to anchor on — reds both elements at once and is rejected. Measured by a post-plan
 * lens: 8 of 37 mutations failing with a shared base holding the anchors, against 37/37 clean
 * with per-element ones.
 *
 * The duplication is therefore a consequence of the verification design, not carelessness. It
 * buys one thing worth having: each element's four behaviours are proven INDEPENDENTLY, so
 * breaking the textarea cannot be masked by the input still working.
 *
 * EACH TEST DEPENDS ONLY ON ITS OWN BEHAVIOUR — a lens's first [SC-005] asserted the *enabled*
 * FormData entry before disabling, and SC-002's mutation redded it. That coupling is intra-file
 * and easy to write by accident.
 */

type Input = HTMLElement & {
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
  const el = document.createElement('sk-form-textarea') as Input;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (seed) el.value = seed;
  form.append(el);
  document.body.append(form);
  await el.updateComplete;
  return [form, el];
};

const control = (el: Input) => el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;

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

test('[SC-013] every declared ::part() is present and targetable from outside (textarea)', async () => {
  const [, el] = await mount({ name: 'email', label: 'Email', description: 'Helper' });
  // Literal selectors, one per part: check-part-ratchet.mjs scans test SOURCES for the literal
  // `::part(name)` string, so a dynamically built selector passes at runtime while leaving the
  // ratchet reporting the part as untested.
  const style = document.createElement('style');
  style.textContent = `
    sk-form-textarea::part(field) { outline-style: dashed; }
    sk-form-textarea::part(label) { outline-style: dotted; }
    sk-form-textarea::part(control) { outline-style: double; }
    sk-form-textarea::part(description) { outline-style: groove; }
    sk-form-textarea::part(error) { outline-style: ridge; }
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
    const el = document.createElement('sk-form-textarea') as Input;
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
