import nx from '@nx/eslint-plugin';
import security from 'eslint-plugin-security';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // nx module boundary enforcement (ADR-002: token-first dependency rule)
  ...nx.configs['flat/base'],
  {
    // `.tsx` included: #75 added the first TSX in the repo (a React consumer fixture and a
    // type-test), and without it those files matched no config block and were linted by
    // nothing — the same three-part hole (glob, lint target, graph edge) this file's
    // depConstraints comment records being closed once for fixtures/elements-behaviour.
    files: [
      'packages/**/*.ts',
      'packages/**/*.tsx',
      'apps/**/*.ts',
      'fixtures/**/*.ts',
      'fixtures/**/*.tsx',
      'fixtures/**/*.js',
      'fixtures/**/*.mjs',
    ],
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
          { sourceTag: 'scope:fixture',    onlyDependOnLibsWithTags: ['scope:react', 'scope:elements', 'scope:styles', 'scope:tokens'] },
          // #75. The generated React wrappers are a publishable package that wraps the
          // elements, so it gets the same shape as scope:storybook: it may reach down the
          // stack and nothing may reach into it except a fixture.
          //
          // `scope:react` was ADDED to the scope:fixture allowlist above rather than left out:
          // fixtures/react-consumer depends on @spec-kitty/react, so tagging that fixture
          // scope:fixture without this entry would have FAILED — and the tempting way out is to
          // leave both projects untagged, which is how #126 first shipped them. An untagged
          // project is not exempt from the rule, it is invisible to it, which reads the same
          // from outside and is worse.
          { sourceTag: 'scope:react',      onlyDependOnLibsWithTags: ['scope:elements', 'scope:styles', 'scope:tokens'] },
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
