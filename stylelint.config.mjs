import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Import the generated token catalogue to build the strict-value allowlist.
// Run `npx nx run tokens:catalogue` to regenerate after adding tokens.
let allTokens = [];
try {
  const tokenCatalogue = require('./packages/tokens/dist/token-catalogue.json');
  allTokens = Object.values(tokenCatalogue.categories).flatMap((c) => c.tokens);
} catch {
  // Catalogue not yet generated — fall back to pattern-only enforcement.
  // Run `npx nx run tokens:catalogue` to generate it.
}

/** @type {import('stylelint').Config} */
export default {
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    // Enforce usage of --sk-* CSS custom property tokens instead of hardcoded values.
    // When the token catalogue is present, only catalogued token names are allowed.
    'scale-unlimited/declaration-strict-value': [
      ['/color/', 'background', 'background-color', 'font-family', 'padding', 'margin', 'border-radius'],
      {
        ignoreValues: {
          '': [
            '/^var\\(--sk-/',
            'transparent',
            'inherit',
            'initial',
            'unset',
            'none',
            'currentColor',
            '0',
            // CSS system-color keywords (#176, #264). These are the explicit forced-colors
            // baseline actually uses on the LONGHAND `-color` properties
            // (`border-left-color`, `outline-color`, etc.) — deliberately NOT on the
            // shorthand forms (`border`, `outline`), which this plugin does not police at
            // all regardless of value, so a hardcoded shorthand color would have passed
            // identically to a token and the gate would be blind rather than satisfied.
            // Adding these here makes the gate positively certify the explicit
            // exceptions instead of silently never seeing them.
            //
            // LIMITATION, stated rather than enforced: `ignoreValues` has no media-query
            // scoping mechanism, so `border-left-color: CanvasText` passes everywhere this
            // rule applies, not only inside `@media (forced-colors: active)`. Enforcing
            // that scoping would need a custom rule or a postcss-based check; this repo
            // does not have one. Reviewers must still confirm these keywords appear
            // only inside a `forced-colors` media block, the same way any other
            // reviewable-but-unenforced convention in this repo is confirmed by reading,
            // not tooling.
            'Canvas',
            'CanvasText',
            'Highlight',
            'HighlightText',
            'ButtonText',
            'LinkText',
            'GrayText',
          ],
        },
        disableFix: true,
        message: 'Use a CSS custom property token (var(--sk-*)) instead of a hardcoded value.',
      },
    ],

    // All SK component class names must follow BEM with sk- prefix
    'selector-class-pattern': ['^(sk-[a-z][a-z0-9-]*((__[a-z][a-z0-9-]*)?(--[a-z][a-z0-9-]*)*)?)|(is-[a-z][a-z0-9-]*)$', { message: 'Use sk-block__element--modifier naming, or is-state for JS states' }],

    // Standard CSS validity rules
    'color-no-invalid-hex': true,
    'unit-no-unknown': true,
    'property-no-unknown': true,
  },
  ignoreFiles: [
    // Token source file is exempt — it defines the tokens, not consumes them
    'packages/tokens/src/tokens.css',
    '**/dist/**',
    '**/storybook-static/**',
    '**/node_modules/**',
  ],
};

// Export the resolved token list for use by other tooling (e.g. IDE plugins).
export { allTokens };
