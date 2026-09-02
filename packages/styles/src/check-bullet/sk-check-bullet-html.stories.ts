import './sk-check-bullet.css';
import type { Meta, StoryObj } from '@storybook/html';
import { SkCheckBulletHTML } from './index';

const meta: Meta = {
  title: 'Primitives/SkCheckBullet (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => `<ul style="list-style:none;padding:0;margin:0">${SkCheckBulletHTML}</ul>`,
};

export const ListOfThree: Story = {
  render: () => `<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
    <li class="sk-check-bullet"><span class="sk-check-bullet__icon" aria-hidden="true">✓</span><span class="sk-check-bullet__text">Developers spend time building, not being blocked on finalized requirements.</span></li>
    <li class="sk-check-bullet"><span class="sk-check-bullet__icon" aria-hidden="true">✓</span><span class="sk-check-bullet__text">Works with Jira, Linear, GitHub, GitLab, and Slack.</span></li>
    <li class="sk-check-bullet"><span class="sk-check-bullet__icon" aria-hidden="true">✓</span><span class="sk-check-bullet__text">Zero-config setup — connect your repo and you're ready to go.</span></li>
  </ul>`,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      <ul style="list-style:none;padding:0;margin:0">${SkCheckBulletHTML}</ul>
    </div>
  `,
};
