import nx from '@nx/eslint-plugin';
import security from 'eslint-plugin-security';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // nx module boundary enforcement (ADR-002: token-first dependency rule)
  ...nx.configs['flat/base'],
  {
    files: ['packages/**/*.ts', 'apps/**/*.ts'],
    plugins: { '@typescript-eslint': tsPlugin, security },
    languageOptions: { parser: tsParser },
    rules: {
      // Enforce package boundaries per project tags
      '@nx/enforce-module-boundaries': ['error', {
        depConstraints: [
          { sourceTag: 'scope:styles',     onlyDependOnLibsWithTags: ['scope:tokens'] },
          { sourceTag: 'scope:elements',   onlyDependOnLibsWithTags: ['scope:styles', 'scope:tokens'] },
          { sourceTag: 'scope:storybook',  onlyDependOnLibsWithTags: ['scope:tokens', 'scope:styles', 'scope:elements'] },
          { sourceTag: 'type:publishable', notDependOnLibsWithTags: ['type:internal'] },
        ],
      }],
      // Security plugin — catch common vulnerabilities
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-unsafe-regex': 'error',
    },
  },
  // Ignore build outputs and generated files
  { ignores: ['**/dist/**', '**/storybook-static/**', '**/*.js.map'] },
];
