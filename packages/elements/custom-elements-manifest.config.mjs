/**
 * Custom Elements Manifest config (FR-006, ADR-11).
 *
 * The manifest is a GENERATED artifact under ADR-10's contract: committed, and
 * checked for drift in CI (`npx nx run elements:analyze` + `git diff --exit-code`).
 * ADR-11 generates the React wrapper from it, so an error here does not stay here.
 *
 * `globs` deliberately excludes `src/define.ts` and the generated `*.css.js`
 * modules. See the `no-bogus-tag-definition` plugin below for why the first
 * exclusion is not enough on its own.
 */
export default {
  globs: ['packages/elements/src/**/*.ts'],
  exclude: [
    // The guarded registration helper. Its `define(tag, ctor)` parameter is what
    // the analyzer mistakes for an element declaration named `tag`.
    'packages/elements/src/define.ts',
    // Generated constructed-stylesheet modules and their declarations — no element
    // declarations, and the .d.ts would duplicate every class.
    'packages/elements/src/**/*.css.js',
    'packages/elements/src/**/*.css.d.ts',
    // Storybook stories and the gate self-test fixtures are not part of the
    // public element surface.
    'packages/elements/src/**/*.stories.ts',
    'packages/elements/src/__fixtures__/**',
  ],
  outdir: 'packages/elements',
  litelement: true,
  plugins: [
    {
      /**
       * Rewrite module paths to what a CONSUMER can actually resolve.
       *
       * `cem analyze` runs from the workspace root, so it bakes in cwd-relative
       * paths: `packages/elements/src/stub/sk-stub.ts`. A consumer joins
       * `modules[].path` onto the package name — and that path is workspace-relative,
       * names a `.ts` file, and is not in `package.json`'s `files` at all, so nothing
       * resolves. The same document already emitted `"./define.js"` for an export's
       * module, package-relative and correct, so it was internally inconsistent too.
       *
       * ADR-11 generates the React wrapper FROM this manifest, and CI now asserts the
       * committed copy byte-for-byte — so the wrong shape would have become the
       * baseline, and fixing it later a manifest-breaking change rather than a fix.
       * Found by the pre-merge squad.
       *
       * Everything the package publishes is bundled into `dist/index.js`, which is
       * what `exports["."]` points at, so that is the honest target for every module.
       */
      name: 'package-relative-module-paths',
      packageLinkPhase({ customElementsManifest }) {
        const PUBLISHED = './dist/index.js';
        for (const mod of customElementsManifest.modules ?? []) {
          mod.path = PUBLISHED;
          for (const exp of mod.exports ?? []) {
            if (exp.declaration?.module) exp.declaration.module = PUBLISHED;
          }
          for (const dec of mod.declarations ?? []) {
            if (dec.module) dec.module = PUBLISHED;
          }
        }
      },
    },
    {
      name: 'assert-no-bogus-tag-definition',
      packageLinkPhase({ customElementsManifest }) {
        const bogus = [];
        for (const mod of customElementsManifest.modules ?? []) {
          for (const exp of mod.exports ?? []) {
            if (exp.kind === 'custom-element-definition' && exp.name === 'tag') {
              bogus.push(mod.path);
            }
          }
        }
        if (bogus.length) {
          throw new Error(
            `custom-elements-manifest: ${bogus.length} bogus definition(s) named "tag":\n` +
              bogus.map((p) => `   ${p}`).join('\n') +
              `\n\nThe analyzer cannot follow the guarded define() helper (ADR-10 §5) and ` +
              `records its\nPARAMETER as an element name. ADR-11 generates the React wrapper ` +
              `from this manifest,\nso this would ship a component called <tag>. Either exclude ` +
              `the module that calls\ncustomElements.define directly, or teach this config to ` +
              `follow the indirection.`
          );
        }
      },
    },
  ],
};
