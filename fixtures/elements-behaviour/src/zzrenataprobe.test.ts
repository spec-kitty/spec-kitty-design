import { expect, test } from 'vitest';
import '@spec-kitty/elements';

type El = HTMLElement & {
  value: string; label: string; required: boolean; disabled: boolean; name: string;
  invalid: boolean;
  setCustomError(m: string | null): void;
  validity: ValidityState; validationMessage: string;
  updateComplete: Promise<unknown>;
};

const mount = async (tag: string, attrs: Record<string, string> = {}, seed = '') => {
  const form = document.createElement('form');
  const el = document.createElement(tag) as El;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (seed) el.value = seed;
  form.append(el);
  document.body.append(form);
  await el.updateComplete;
  return [form, el] as const;
};

test('PROBE A: clearing a custom error on an EMPTY REQUIRED field', async () => {
  document.body.innerHTML = '';
  const [form, el] = await mount('sk-form-input', { name: 'email', label: 'Email', required: '' });
  await el.updateComplete;
  console.log('A1 required+empty  valid=', el.validity.valid, 'valueMissing=', el.validity.valueMissing, 'msg=', JSON.stringify(el.validationMessage), 'formValid=', form.checkValidity(), 'hostInvalidAttr=', el.hasAttribute('invalid'));

  el.setCustomError('Server says no');
  await el.updateComplete;
  console.log('A2 after setCustomError valid=', el.validity.valid, 'valueMissing=', el.validity.valueMissing, 'customError=', el.validity.customError, 'msg=', JSON.stringify(el.validationMessage), 'formValid=', form.checkValidity());

  el.setCustomError(null);
  await el.updateComplete;
  console.log('A3 after CLEAR (still empty+required) valid=', el.validity.valid, 'valueMissing=', el.validity.valueMissing, 'msg=', JSON.stringify(el.validationMessage), 'formValid=', form.checkValidity(), 'hostInvalidAttr=', el.hasAttribute('invalid'), 'ariaInvalid=', el.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid'));
  console.log('A4 FormData submits key present=', new FormData(form).has('email'));
});

test('PROBE B: custom error then keystroke then required interaction', async () => {
  document.body.innerHTML = '';
  const [form, el] = await mount('sk-form-input', { name: 'email', label: 'Email', required: '' }, 'x');
  el.setCustomError('Server says no');
  await el.updateComplete;
  el.value = '';
  await el.updateComplete;
  console.log('B1 empty+required WITH customError active: valid=', el.validity.valid, 'valueMissing=', el.validity.valueMissing, 'msg=', JSON.stringify(el.validationMessage), 'errNode=', JSON.stringify(el.shadowRoot!.querySelector('[part~="error"]')!.textContent));
  el.setCustomError(null);
  await el.updateComplete;
  console.log('B2 after clear: valid=', el.validity.valid, 'formValid=', form.checkValidity(), 'msg=', JSON.stringify(el.validationMessage), 'invalidAttr=', el.hasAttribute('invalid'));
});

test('PROBE C: setValidity anchor on first render (willUpdate move)', async () => {
  document.body.innerHTML = '';
  const seen: unknown[][] = [];
  const real = ElementInternals.prototype.setValidity;
  (ElementInternals.prototype as any).setValidity = function (...args: unknown[]) {
    seen.push([JSON.stringify(args[0]), args[1], args[2] === undefined ? 'UNDEFINED-ANCHOR' : (args[2] as Element).tagName]);
    return (real as any).apply(this, args);
  };
  try {
    const [, el] = await mount('sk-form-input', { name: 'email', label: 'Email', required: '' });
    await el.updateComplete;
    console.log('C1 setValidity calls at first render:', JSON.stringify(seen));
    seen.length = 0;
    el.value = 'a';
    await el.updateComplete;
    el.value = '';
    await el.updateComplete;
    console.log('C2 setValidity calls after later updates:', JSON.stringify(seen));
  } finally { (ElementInternals.prototype as any).setValidity = real; }
});

test('PROBE D: does willUpdate eliminate a second render pass?', async () => {
  document.body.innerHTML = '';
  const [, el] = await mount('sk-form-input', { name: 'email', label: 'Email', required: '' }, 'seed');
  await el.updateComplete;
  let renders = 0;
  const proto = Object.getPrototypeOf(el);
  const realRender = proto.render;
  proto.render = function (...a: unknown[]) { renders += 1; return realRender.apply(this, a); };
  try {
    el.value = '';
    const done = await (el.updateComplete as Promise<boolean>);
    console.log('D1 updateComplete resolved value (false => another update pending):', done, 'renders during that await:', renders);
    console.log('D2 aria-invalid immediately after single await:', el.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid'), 'hostAttr=', el.hasAttribute('invalid'));
    await el.updateComplete;
    console.log('D3 renders after a second await:', renders);
  } finally { proto.render = realRender; }
});

test('PROBE E: registeredTags mutability / textarea parity', async () => {
  document.body.innerHTML = '';
  const mod = await import('@spec-kitty/elements');
  console.log('E1 registeredTags=', JSON.stringify((mod as any).registeredTags), 'isArray=', Array.isArray((mod as any).registeredTags), 'frozen=', Object.isFrozen((mod as any).registeredTags));
  const [form, el] = await mount('sk-form-textarea', { name: 'bio', label: 'Bio', required: '' });
  el.setCustomError('nope');
  await el.updateComplete;
  el.setCustomError(null);
  await el.updateComplete;
  console.log('E2 textarea after clear on empty+required: valid=', el.validity.valid, 'formValid=', form.checkValidity());
});
