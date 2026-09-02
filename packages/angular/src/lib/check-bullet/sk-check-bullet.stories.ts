import type { Meta, StoryObj } from '@storybook/angular';
import { SkCheckBulletComponent } from './sk-check-bullet';

const meta: Meta<SkCheckBulletComponent> = {
  title: 'Primitives/SkCheckBullet (Angular)',
  component: SkCheckBulletComponent,
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
  },
  argTypes: {
    text: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<SkCheckBulletComponent>;

// The host carries role="listitem" (see sk-check-bullet.ts), so it needs a list
// parent to be valid — axe's aria-required-parent is right to insist. Rendering a
// bare bullet showed the component outside the context it requires; the <ul> is
// how a consumer is meant to use it, and matches ListOfThree below.
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ul style="list-style:none;padding:0;margin:0">
        <sk-check-bullet [text]="text"></sk-check-bullet>
      </ul>
    `,
    moduleMetadata: { imports: [SkCheckBulletComponent] },
  }),
  args: {
    text: 'Feature description here',
  },
};

export const ListOfThree: Story = {
  render: () => ({
    template: `
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
        <sk-check-bullet text="Developers spend time building, not being blocked on finalized requirements."></sk-check-bullet>
        <sk-check-bullet text="Works with Jira, Linear, GitHub, GitLab, and Slack."></sk-check-bullet>
        <sk-check-bullet text="Zero-config setup — connect your repo and you're ready to go."></sk-check-bullet>
      </ul>
    `,
    moduleMetadata: { imports: [SkCheckBulletComponent] },
  }),
};

export const LightMode: Story = {
  render: () => ({
    template: `
      <div data-theme="light" style="background:var(--sk-surface-page);padding:var(--sk-space-6);display:inline-block;">
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
          <sk-check-bullet text="Cross-theme verification of check-bullet on light surface."></sk-check-bullet>
          <sk-check-bullet text="Token colours pick up the light-mode overrides automatically."></sk-check-bullet>
        </ul>
      </div>
    `,
    moduleMetadata: { imports: [SkCheckBulletComponent] },
  }),
};
