import { expect, test } from 'vitest';
import { SkFormInput } from '@spec-kitty/elements';

// Counterfactual: the PRE-FOLD shape — validate() in updated(), not willUpdate().
class OldShape extends SkFormInput {
  willUpdate(_c: Map<string, unknown>) { /* pre-fold: nothing here */ }
  updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('value') || changed.has('required')) (this as any).validate();
  }
}
customElements.define('zz-old-shape', OldShape);

test('COUNTERFACTUAL: updated()-based validate needs a second updateComplete', async () => {
  document.body.innerHTML = '';
  const form = document.createElement('form');
  const el = document.createElement('zz-old-shape') as any;
  el.setAttribute('name', 'email'); el.setAttribute('label', 'Email'); el.setAttribute('required', '');
  el.value = 'seed';
  form.append(el); document.body.append(form);
  await el.updateComplete;
  el.value = '';
  const settled = await el.updateComplete;
  console.log('OLD: updateComplete settled=', settled, 'aria-invalid=', el.shadowRoot.querySelector('input').getAttribute('aria-invalid'), 'hostAttr=', el.hasAttribute('invalid'));
  await el.updateComplete;
  console.log('OLD after 2nd await: aria-invalid=', el.shadowRoot.querySelector('input').getAttribute('aria-invalid'), 'hostAttr=', el.hasAttribute('invalid'));
});

test('NEW shape single await', async () => {
  document.body.innerHTML = '';
  const form = document.createElement('form');
  const el = document.createElement('sk-form-input') as any;
  el.setAttribute('name', 'email'); el.setAttribute('label', 'Email'); el.setAttribute('required', '');
  el.value = 'seed';
  form.append(el); document.body.append(form);
  await el.updateComplete;
  el.value = '';
  const settled = await el.updateComplete;
  console.log('NEW: updateComplete settled=', settled, 'aria-invalid=', el.shadowRoot.querySelector('input').getAttribute('aria-invalid'), 'hostAttr=', el.hasAttribute('invalid'));
});
