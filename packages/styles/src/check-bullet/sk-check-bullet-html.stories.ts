import './sk-check-bullet.css';
import type { Meta, StoryObj } from '@storybook/web-components';
import { SkCheckBulletHTML } from './index';

const meta: Meta = {
  title: 'Primitives/SkCheckBullet (HTML)',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => `<ul role="list" style="list-style:none;padding:0;margin:0">${SkCheckBulletHTML}</ul>`,
};

/**
 * Rendered from the GENERATED export, three times.
 *
 * This story hand-wrote three `<li>` blocks — including `sk-check-bullet__text`, a class defined
 * in no stylesheet anywhere — so the catalogue and the generated markup disagreed about this
 * component's own structure. #79's markup module then claimed there were "no in-repo consumers"
 * of that class while these three sat here; two pre-merge lenses caught it.
 *
 * `swap()` throws if the placeholder moves: String.replace returns its input unchanged on no
 * match, so a renamed default would silently render three identical rows.
 */
const PLACEHOLDER = 'Feature description here';
const swap = (text: string) => {
  if (!SkCheckBulletHTML.includes(PLACEHOLDER)) {
    throw new Error(
      'sk-check-bullet story: generated markup no longer contains ' +
        JSON.stringify(PLACEHOLDER) +
        ' — the replacement would have silently returned it unchanged. Update PLACEHOLDER ' +
        'alongside checkBulletStaticHtml()\'s default content.',
    );
  }
  return SkCheckBulletHTML.replace(PLACEHOLDER, text);
};

export const ListOfThree: Story = {
  render: () => [
    '<ul role="list" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">',
    swap('Developers spend time building, not being blocked on finalized requirements.'),
    swap('Works with Jira, Linear, GitHub, GitLab, and Slack.'),
    swap('Zero-config setup — connect your repo and you are ready to go.'),
    '</ul>',
  ].join(''),
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' } },
  render: () => `
    <div class="sk-light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">
      <ul role="list" style="list-style:none;padding:0;margin:0">${SkCheckBulletHTML}</ul>
    </div>
  `,
};
