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
    // The built distribution artifacts (ADR-10 §2), served so elements-load.spec.ts
    // can fetch them over HTTP. playwright.config.ts's webServer serves ONLY
    // storybook-static, so without these entries the spec has no HTTP origin to
    // load the IIFE from — and the SRI half of SC-001 cannot be exercised at all
    // from file://.
    //
    // These are build OUTPUTS, so `storybook:build` declares an explicit
    // dependsOn/inputs pair on them in apps/storybook/project.json. Do not remove
    // either: this repo has already shipped a Storybook build cached on inputs that
    // excluded its own stories.
    {
      from: path.resolve(__dirname, '../../../packages/elements/dist'),
      to: '/elements-dist',
    },
    // The Vite consumer's built app (FR-003 / SC-008). Building it proves the ESM
    // artifact is bundlable; only loading it proves the element actually upgrades.
    {
      from: path.resolve(__dirname, '../../../fixtures/vite-consumer/dist'),
      to: '/vite-consumer',
    },
  ],
};

export default config;
