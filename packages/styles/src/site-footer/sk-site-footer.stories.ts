import './sk-site-footer.css';
import type { Meta, StoryObj } from '@storybook/html';
import { SkSiteFooterHTML } from './index';

const meta: Meta = {
  title: 'Components/SiteFooter',
  tags: ['autodocs'],
  parameters: { a11y: { disable: false }, layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => SkSiteFooterHTML,
};

export const LightMode: Story = {
  parameters: { backgrounds: { default: 'sk-light' }, layout: 'fullscreen' },
  render: () => `
    <div data-theme="light" style="background: var(--sk-surface-page); display: block; width: 100%;">
      ${SkSiteFooterHTML}
    </div>
  `,
};
