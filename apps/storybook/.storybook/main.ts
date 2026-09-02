import type { StorybookConfig } from '@storybook/angular';
import { fileURLToPath } from 'url';
import path from 'path';
import type { Configuration } from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: [
    '../../../packages/**/*.stories.@(ts|tsx)',
    '../src/**/*.mdx',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/angular', options: {} },
  docs: { defaultName: 'Docs' },
  staticDirs: [
    {
      from: path.resolve(__dirname, '../../../packages/tokens/assets'),
      to: '/tokens-assets',
    },
  ],
  webpackFinal: async (webpackConfig: Configuration) => {
    const rules = webpackConfig.module?.rules ?? [];
    const stylesPath = path.resolve(__dirname, '../../../packages/styles');
    const tokensPath = path.resolve(__dirname, '../../../packages/tokens');
    // Allow direct CSS imports (ES module style) from styles stories and tokens preview.
    // Angular component CSS files (packages/angular) go through the Angular pipeline — do NOT include them here.
    rules.push({
      test: /\.css$/,
      use: [
        'style-loader',
        { loader: 'css-loader', options: { sourceMap: false, url: false, import: false } },
      ],
      include: [stylesPath, tokensPath],
    });
    if (webpackConfig.module) {
      webpackConfig.module.rules = rules;
    }
    return webpackConfig;
  },
};

export default config;
