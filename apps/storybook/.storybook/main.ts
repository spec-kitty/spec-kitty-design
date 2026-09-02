import type { StorybookConfig } from '@storybook/web-components-vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: [
    '../../../packages/**/*.stories.@(ts|tsx)',
    '../src/**/*.mdx',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/web-components-vite', options: {} },
  docs: { defaultName: 'Docs' },
  staticDirs: [
    {
      from: path.resolve(__dirname, '../../../packages/tokens/assets'),
      to: '/tokens-assets',
    },
  ],
};

export default config;
