import nx from '@nx/eslint-plugin';
import security from 'eslint-plugin-security';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // nx module boundary enforcement (ADR-002: token-first dependency rule)
  ...nx.configs['flat/base'],
  {
    files: ['packages/**/*.ts', 'apps/**/*.ts', 'fixtures/**/*.ts', 'fixtures/**/*.js', 'fixtures/**/*.mjs'],
    plugins: { '@typescript-eslint': tsPlugin, security },
    languageOptions: { parser: tsParser },
    rules: {
      // Enforce package boundaries per project tags
      '@nx/enforce-module-boundaries': ['error', {
        depConstraints: [
          { sourceTag: 'scope:styles',     onlyDependOnLibsWithTags: ['scope:tokens'] },
          { sourceTag: 'scope:elements',   onlyDependOnLibsWithTags: ['scope:styles', 'scope:tokens'] },
          { sourceTag: 'scope:storybook',  onlyDependOnLibsWithTags: ['scope:tokens', 'scope:styles', 'scope:elements'] },
          // Consumability fixtures may reach the published packages and nothing else.
          //
          // For this to BIND, three things had to be true and only the rule was: the
          // ESLint `files` glob had to reach fixtures/ (it globbed packages/**/*.ts and
          // apps/**/*.ts only), the fixture needed a lint target (nx affected --target=lint
          // is the sole ESLint invocation in CI), and a graph edge had to exist for
          // enforce-module-boundaries to constrain. All three are now in place. A
          // depConstraint that binds nothing is worse than none, because the next reader
          // believes it — which is exactly what tsconfig.base.json's empty `paths` did to
          // the scope:styles rule for the whole life of this repo.
          { sourceTag: 'scope:fixture',    onlyDependOnLibsWithTags: ['scope:elements', 'scope:styles', 'scope:tokens'] },
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
