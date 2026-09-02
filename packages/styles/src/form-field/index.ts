/* @spec-kitty/html-js — form-field HTML string exports */

export const SkFormFieldHTML = `<div class="sk-form-field">
  <label class="sk-form-field__label" for="field-id">Label</label>
  <!-- input or textarea goes here -->
  <span class="sk-form-field__description">Helper text</span>
</div>`;

export const SkFormInputDefaultHTML = `<div class="sk-form-field">
  <label class="sk-form-field__label" for="field-default">Email address</label>
  <input
    class="sk-input"
    id="field-default"
    type="email"
    placeholder="you@team.com"
  />
  <span class="sk-form-field__description">We'll never share your email.</span>
</div>`;

export const SkFormInputFocusHTML = `<div class="sk-form-field">
  <label class="sk-form-field__label" for="field-focus">Workspace name</label>
  <input
    class="sk-input is-focused"
    id="field-focus"
    type="text"
    value="Acme Robotics"
  />
  <span class="sk-form-field__description">Your team's workspace identifier.</span>
</div>`;

export const SkFormInputErrorHTML = `<div class="sk-form-field sk-form-field--error">
  <label class="sk-form-field__label" for="field-email-error">Email address</label>
  <input
    class="sk-input"
    id="field-email-error"
    type="email"
    value=""
    aria-invalid="true"
    aria-describedby="field-email-error-msg"
  />
  <span
    id="field-email-error-msg"
    class="sk-form-field__description"
    role="alert"
  >Please enter a valid email address.</span>
</div>`;

export const SkFormInputDisabledHTML = `<div class="sk-form-field">
  <label class="sk-form-field__label" for="field-disabled">Email address</label>
  <input
    class="sk-input"
    id="field-disabled"
    type="email"
    placeholder="you@team.com"
    disabled
  />
  <span class="sk-form-field__description">This field is currently unavailable.</span>
</div>`;

export const SkFormInputFilledHTML = `<div class="sk-form-field">
  <label class="sk-form-field__label" for="field-filled">Email address</label>
  <input
    class="sk-input"
    id="field-filled"
    type="email"
    value="ada@team.com"
  />
  <span class="sk-form-field__description">We'll never share your email.</span>
</div>`;

export const SkFormTextareaDefaultHTML = `<div class="sk-form-field">
  <label class="sk-form-field__label" for="field-textarea-default">What are you trying to ship?</label>
  <textarea
    class="sk-textarea"
    id="field-textarea-default"
    rows="4"
    placeholder="Describe your goal..."
  ></textarea>
  <span class="sk-form-field__description">Keep it brief — one or two sentences.</span>
</div>`;

export const SkFormTextareaErrorHTML = `<div class="sk-form-field sk-form-field--error">
  <label class="sk-form-field__label" for="field-textarea-error">What are you trying to ship?</label>
  <textarea
    class="sk-textarea"
    id="field-textarea-error"
    rows="4"
    aria-invalid="true"
    aria-describedby="field-textarea-error-msg"
  ></textarea>
  <span
    id="field-textarea-error-msg"
    class="sk-form-field__description"
    role="alert"
  >This field is required.</span>
</div>`;
