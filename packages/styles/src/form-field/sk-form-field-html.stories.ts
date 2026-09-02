import './sk-form-field.css';
import type { Meta, StoryObj } from '@storybook/html';
import {
  SkFormInputDefaultHTML,
  SkFormInputFocusHTML,
  SkFormInputErrorHTML,
  SkFormInputDisabledHTML,
  SkFormInputFilledHTML,
  SkFormTextareaDefaultHTML,
  SkFormTextareaErrorHTML,
} from './index';

const meta: Meta = {
  title: 'Form/FormField (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const FormInputDefault: Story = {
  name: 'FormInput Default',
  render: () => SkFormInputDefaultHTML,
};

export const FormInputFocus: Story = {
  name: 'FormInput Focus',
  render: () => SkFormInputFocusHTML,
};

export const FormInputError: Story = {
  name: 'FormInput Error',
  render: () => SkFormInputErrorHTML,
};

export const FormInputDisabled: Story = {
  name: 'FormInput Disabled',
  render: () => SkFormInputDisabledHTML,
};

export const FormInputFilled: Story = {
  name: 'FormInput Filled',
  render: () => SkFormInputFilledHTML,
};

export const FormTextareaDefault: Story = {
  name: 'FormTextarea Default',
  render: () => SkFormTextareaDefaultHTML,
};

export const FormTextareaError: Story = {
  name: 'FormTextarea Error',
  render: () => SkFormTextareaErrorHTML,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      ${SkFormInputDefaultHTML}
    </div>
  `,
};
