/**
 * The wrapper generator's contract, in the NODE lane (NFR-002).
 *
 * ADR-11 §"a second, browserless subject" names manifest analysis, wrapper generation and its
 * drift check as node-lane work. These assertions have no DOM in them and no reason to pay for
 * a browser.
 *
 * Why this file exists rather than folding into config-contract.test.ts: FR-003, NFR-001 and
 * SC-302 all say "asserted", and the post-tasks squad found no WP owned a test file at all —
 * so the assertions would have landed in a file whose declared subject is the Vitest config.
 * floor-reporter.mjs's arm 5 keys on (id, subject file); pointing this at the wrong file is
 * the kind of miswiring #74's textarea header already got wrong once.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';

const OUTDIR = 'packages/react/src';
const MANIFEST = 'packages/elements/custom-elements.json';

function gate(...args: string[]): { code: number; out: string } {
  try {
    const out = execFileSync(process.execPath, ['scripts/build-react-wrappers.mjs', ...args], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status: number; stdout?: string; stderr?: string };
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

/**
 * This spawns the gate as a child process, and the gate generates the whole wrapper tree twice
 * for `--check` (it asserts FR-003 by generating a second time).
 *
 * That is well past Vitest's 5s default. It passed locally at ~2.3s and timed out in CI at
 * 6.2s, which is the shape of every wall-clock assumption in this repo: fine on a warm
 * workstation, red on a cold runner. Generous rather than tuned — the number is not evidence
 * of anything, it just must not be the thing that fails.
 */
const GATE_TIMEOUT_MS = 120_000;

test('[property-only] the normalizer marks only explicit public attribute:false fields', () => {
  const dir = mkdtempSync(join(tmpdir(), 'property-only-normalizer-'));
  try {
    const sourceDir = join(dir, 'packages/elements/src/probe');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, 'sk-probe.ts'),
      `
        import { property } from 'lit/decorators.js';

        export class SkProbe {
          static properties = {
            structured: { attribute: false },
            scalar: { attribute: false },
            stateFalseStructured: { attribute: false, state: false },
            stateOnly: { state: true },
            stateAndFalseAttribute: { state: true, attribute: false },
            observed: { type: String },
            trueObserved: { attribute: true },
            renamedObserved: { attribute: 'renamed-observed' },
            readonlyField: { attribute: false },
            staticField: { attribute: false },
            protectedField: { attribute: false },
            privateField: { attribute: false },
            secret: { attribute: false },
            sourceOnly: { attribute: false },
          };

          structured: ReadonlyArray<string> = Object.freeze([]);
          scalar = 0;
          stateFalseStructured: ReadonlyArray<string> = Object.freeze([]);
          stateOnly = '';
          stateAndFalseAttribute = '';
          observed = '';
          trueObserved = '';
          renamedObserved = '';
          readonly readonlyField: ReadonlyArray<string> = Object.freeze([]);
          static staticField: ReadonlyArray<string> = Object.freeze([]);
          protected protectedField: ReadonlyArray<string> = Object.freeze([]);
          private privateField: ReadonlyArray<string> = Object.freeze([]);
          #secret: ReadonlyArray<string> = Object.freeze([]);
          sourceOnly: ReadonlyArray<string> = Object.freeze([]);

          @property({ attribute: false })
          decorated: ReadonlyArray<string> = Object.freeze([]);

          @property({ attribute: false, state: false })
          decoratedStateFalse: ReadonlyArray<string> = Object.freeze([]);

          @property({ attribute: 'decorated-observed', state: false })
          decoratedObserved = '';

          @property({ attribute: false })
          readonly decoratedReadonly: ReadonlyArray<string> = Object.freeze([]);

          @property({ attribute: false })
          protected decoratedProtected: ReadonlyArray<string> = Object.freeze([]);

          @property({ attribute: false })
          private decoratedPrivate: ReadonlyArray<string> = Object.freeze([]);

          @property({ attribute: false })
          static decoratedStatic: ReadonlyArray<string> = Object.freeze([]);
        }
      `,
    );
    const getterSourceDir = join(dir, 'packages/elements/src/probe-getter');
    mkdirSync(getterSourceDir, { recursive: true });
    writeFileSync(
      join(getterSourceDir, 'sk-probe-getter.ts'),
      `export class SkProbeGetter {
         static get properties() { return { getterStructured: { attribute: false } }; }
         getterStructured: readonly string[] = Object.freeze([]);
       }`,
    );

    const fields = [
      ['structured', 'ReadonlyArray<string>'],
      ['scalar', 'number'],
      ['stateFalseStructured', 'ReadonlyArray<string>'],
      ['stateOnly', 'string'],
      ['stateAndFalseAttribute', 'string'],
      ['observed', 'string'],
      ['trueObserved', 'string'],
      ['renamedObserved', 'string'],
      ['readonlyField', 'ReadonlyArray<string>'],
      ['staticField', 'ReadonlyArray<string>'],
      ['protectedField', 'ReadonlyArray<string>'],
      ['privateField', 'ReadonlyArray<string>'],
      ['secret', 'ReadonlyArray<string>'],
      ['manifestOnly', 'ReadonlyArray<string>'],
      ['decorated', 'ReadonlyArray<string>'],
      ['decoratedStateFalse', 'ReadonlyArray<string>'],
      ['decoratedObserved', 'string'],
      ['decoratedReadonly', 'ReadonlyArray<string>'],
      ['decoratedProtected', 'ReadonlyArray<string>'],
      ['decoratedPrivate', 'ReadonlyArray<string>'],
      ['decoratedStatic', 'ReadonlyArray<string>'],
    ].map(([name, text]) => ({
      kind: 'field',
      name,
      type: { text },
      description: `${name} docs`,
    }));
    const manifestPath = join(dir, 'manifest.json');
    writeFileSync(
      manifestPath,
      JSON.stringify({
        schemaVersion: '1.0.0',
        modules: [
          {
            kind: 'javascript-module',
            path: './dist/index.js',
            declarations: [
              {
                kind: 'class',
                name: 'SkProbe',
                tagName: 'sk-probe',
                customElement: true,
                members: fields,
                attributes: [
                  { name: 'structured', fieldName: 'structured' },
                  {
                    name: 'state-false-structured',
                    fieldName: 'stateFalseStructured',
                  },
                  { name: 'state-only', fieldName: 'stateOnly' },
                  {
                    name: 'state-and-false-attribute',
                    fieldName: 'stateAndFalseAttribute',
                  },
                  { name: 'observed', fieldName: 'observed' },
                  { name: 'true-observed', fieldName: 'trueObserved' },
                  { name: 'renamed-observed', fieldName: 'renamedObserved' },
                  {
                    name: 'decorated-observed',
                    fieldName: 'decoratedObserved',
                  },
                ],
              },
              {
                kind: 'class',
                name: 'SkProbeGetter',
                tagName: 'sk-probe-getter',
                customElement: true,
                members: [
                  {
                    kind: 'field',
                    name: 'getterStructured',
                    type: { text: 'readonly string[]' },
                    description: 'Getter-form structured data.',
                  },
                ],
                attributes: [],
              },
            ],
          },
        ],
      }),
    );

    execFileSync(process.execPath, [resolve('scripts/normalise-manifest.mjs'), manifestPath], {
      cwd: dir,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const normalized = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      modules: {
        declarations: {
          members: Record<string, unknown>[];
          attributes: { fieldName: string }[];
        }[];
      }[];
    };
    const declaration = normalized.modules[0].declarations[0];
    const member = (name: string) => declaration.members.find((item) => item['name'] === name)!;

    expect(member('structured')['x-spec-kitty-property-only']).toBe(true);
    expect(member('structured')['x-spec-kitty-property-reset']).toBe('empty-array');
    expect(member('scalar')['x-spec-kitty-property-only']).toBe(true);
    expect(member('scalar')).not.toHaveProperty('x-spec-kitty-property-reset');
    expect(member('stateFalseStructured')['x-spec-kitty-property-only']).toBe(true);
    expect(member('stateFalseStructured')['x-spec-kitty-property-reset']).toBe('empty-array');
    expect(member('decorated')['x-spec-kitty-property-only']).toBe(true);
    expect(member('decoratedStateFalse')['x-spec-kitty-property-only']).toBe(true);
    expect(member('decoratedStateFalse')['x-spec-kitty-property-reset']).toBe('empty-array');
    expect(declaration.attributes.map((attribute) => attribute.fieldName)).toEqual([
      'decoratedObserved',
      'observed',
      'renamedObserved',
      'trueObserved',
    ]);
    for (const name of [
      'stateOnly',
      'stateAndFalseAttribute',
      'observed',
      'trueObserved',
      'renamedObserved',
      'decoratedObserved',
      'readonlyField',
      'staticField',
      'protectedField',
      'privateField',
      'secret',
      'manifestOnly',
      'decoratedReadonly',
      'decoratedProtected',
      'decoratedPrivate',
      'decoratedStatic',
    ]) {
      expect(
        member(name),
        `${name} must stay outside the property-only public seam`,
      ).not.toHaveProperty('x-spec-kitty-property-only');
    }
    const getterDeclaration = normalized.modules[0].declarations[1];
    const getterMember = getterDeclaration.members.find(
      (item) => item['name'] === 'getterStructured',
    )!;
    expect(getterMember['x-spec-kitty-property-only']).toBe(true);
    expect(getterMember['x-spec-kitty-property-reset']).toBe('empty-array');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test.each([
  ['a spread', 'static properties = { ...shared };'],
  ['a computed key', 'static properties = { [key]: { attribute: false } };'],
  ['an indirect object', 'static properties = shared;'],
])('[property-only] the normalizer fails closed on %s', (_label, declaration) => {
  const dir = mkdtempSync(join(tmpdir(), 'property-only-normalizer-unsafe-'));
  try {
    const sourceDir = join(dir, 'packages/elements/src/probe');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, 'sk-probe.ts'),
      `const key = 'structured'; const shared = { structured: { attribute: false } };
       export class SkProbe { ${declaration} structured: ReadonlyArray<string> = Object.freeze([]); }`,
    );
    const manifestPath = join(dir, 'manifest.json');
    writeFileSync(
      manifestPath,
      JSON.stringify({
        modules: [
          {
            declarations: [
              {
                name: 'SkProbe',
                tagName: 'sk-probe',
                customElement: true,
                members: [
                  {
                    kind: 'field',
                    name: 'structured',
                    type: { text: 'ReadonlyArray<string>' },
                  },
                ],
              },
            ],
          },
        ],
      }),
    );
    expect(() =>
      execFileSync(process.execPath, [resolve('scripts/normalise-manifest.mjs'), manifestPath], {
        cwd: dir,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
    ).toThrow();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test.each([
  [
    '`static properties`',
    'state',
    `const isInternal = true;
     export class SkProbe {
       static properties = { structured: { attribute: false, state: isInternal } };
       structured: ReadonlyArray<string> = Object.freeze([]);
     }`,
  ],
  [
    '`static properties`',
    'attribute',
    `const shouldObserve = false;
     export class SkProbe {
       static properties = { structured: { attribute: shouldObserve } };
       structured: ReadonlyArray<string> = Object.freeze([]);
     }`,
  ],
  [
    '@property',
    'state',
    `import { property } from 'lit/decorators.js';
     const isInternal = true;
     export class SkProbe {
       @property({ attribute: false, state: isInternal })
       structured: ReadonlyArray<string> = Object.freeze([]);
     }`,
  ],
  [
    '@property',
    'attribute',
    `import { property } from 'lit/decorators.js';
     const shouldObserve = false;
     export class SkProbe {
       @property({ attribute: shouldObserve })
       structured: ReadonlyArray<string> = Object.freeze([]);
     }`,
  ],
])(
  '[property-only] the normalizer source-locates unresolved %s %s metadata',
  (origin, option, source) => {
    const dir = mkdtempSync(join(tmpdir(), 'property-only-normalizer-unresolved-'));
    try {
      const sourceDir = join(dir, 'packages/elements/src/probe');
      mkdirSync(sourceDir, { recursive: true });
      writeFileSync(join(sourceDir, 'sk-probe.ts'), source);
      const manifestPath = join(dir, 'manifest.json');
      writeFileSync(
        manifestPath,
        JSON.stringify({
          modules: [
            {
              declarations: [
                {
                  name: 'SkProbe',
                  tagName: 'sk-probe',
                  customElement: true,
                  members: [
                    {
                      kind: 'field',
                      name: 'structured',
                      type: { text: 'ReadonlyArray<string>' },
                      description: 'Structured data.',
                    },
                  ],
                  attributes: [{ name: 'structured', fieldName: 'structured' }],
                },
              ],
            },
          ],
        }),
      );
      const originalManifest = readFileSync(manifestPath, 'utf8');

      let output = '';
      expect(() => {
        try {
          execFileSync(
            process.execPath,
            [resolve('scripts/normalise-manifest.mjs'), manifestPath],
            {
              cwd: dir,
              encoding: 'utf8',
              stdio: 'pipe',
            },
          );
        } catch (error) {
          const failure = error as { stdout?: string; stderr?: string };
          output = `${failure.stdout ?? ''}${failure.stderr ?? ''}`;
          throw error;
        }
      }).toThrow();
      expect(output).toContain('sk-probe.ts:');
      expect(output).toContain(`${origin} for structured has an unresolved ${option} option`);
      expect(output).toContain('use a literal');
      expect(readFileSync(manifestPath, 'utf8')).toBe(originalManifest);
      const unchangedMember = JSON.parse(originalManifest).modules[0].declarations[0].members[0];
      expect(unchangedMember).not.toHaveProperty('x-spec-kitty-property-only');
      expect(unchangedMember).not.toHaveProperty('x-spec-kitty-property-reset');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test('[property-only] the normalizer source-locates a computed decorated attribute:false field', () => {
  const dir = mkdtempSync(join(tmpdir(), 'property-only-normalizer-computed-decorator-'));
  try {
    const sourceDir = join(dir, 'packages/elements/src/probe');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, 'sk-probe.ts'),
      `import { property } from 'lit/decorators.js';
       const fieldName = 'structured';
       export class SkProbe {
         @property({ attribute: false })
         [fieldName]: ReadonlyArray<string> = Object.freeze([]);
       }`,
    );
    const manifestPath = join(dir, 'manifest.json');
    writeFileSync(
      manifestPath,
      JSON.stringify({
        modules: [
          {
            declarations: [
              {
                name: 'SkProbe',
                tagName: 'sk-probe',
                customElement: true,
                members: [
                  {
                    kind: 'field',
                    name: 'structured',
                    type: { text: 'ReadonlyArray<string>' },
                  },
                ],
              },
            ],
          },
        ],
      }),
    );

    let output = '';
    expect(() => {
      try {
        execFileSync(process.execPath, [resolve('scripts/normalise-manifest.mjs'), manifestPath], {
          cwd: dir,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error) {
        const failure = error as { stdout?: string; stderr?: string };
        output = `${failure.stdout ?? ''}${failure.stderr ?? ''}`;
        throw error;
      }
    }).toThrow();
    expect(output).toContain(
      'sk-probe.ts:5:10: @property({ attribute: false }) decorates a computed field name',
    );
    expect(output).toContain(
      'use an identifier or string-literal name so the property-only public API can be classified',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test.each([
  [
    'attribute',
    'const shouldObserve = false;',
    '{ attribute: shouldObserve }',
  ],
  [
    'state',
    'const isInternal = true;',
    '{ attribute: false, state: isInternal }',
  ],
])(
  '[property-only] the normalizer source-locates unresolved computed-decorator %s metadata',
  (option, setup, options) => {
    const dir = mkdtempSync(
      join(tmpdir(), 'property-only-normalizer-computed-decorator-unresolved-'),
    );
    try {
      const sourceDir = join(dir, 'packages/elements/src/probe');
      mkdirSync(sourceDir, { recursive: true });
      writeFileSync(
        join(sourceDir, 'sk-probe.ts'),
        `import { property } from 'lit/decorators.js';
         const fieldName = 'structured';
         ${setup}
         export class SkProbe {
           @property(${options})
           [fieldName]: ReadonlyArray<string> = Object.freeze([]);
         }`,
      );
      const manifestPath = join(dir, 'manifest.json');
      writeFileSync(
        manifestPath,
        JSON.stringify({
          modules: [
            {
              declarations: [
                {
                  name: 'SkProbe',
                  tagName: 'sk-probe',
                  customElement: true,
                  members: [
                    {
                      kind: 'field',
                      name: 'structured',
                      type: { text: 'ReadonlyArray<string>' },
                      description: 'Structured data.',
                    },
                  ],
                  attributes: [{ name: 'structured', fieldName: 'structured' }],
                },
              ],
            },
          ],
        }),
      );
      const originalManifest = readFileSync(manifestPath, 'utf8');

      let output = '';
      expect(() => {
        try {
          execFileSync(process.execPath, [resolve('scripts/normalise-manifest.mjs'), manifestPath], {
            cwd: dir,
            encoding: 'utf8',
            stdio: 'pipe',
          });
        } catch (error) {
          const failure = error as { stdout?: string; stderr?: string };
          output = `${failure.stdout ?? ''}${failure.stderr ?? ''}`;
          throw error;
        }
      }).toThrow();
      expect(output).toContain('sk-probe.ts:');
      expect(output).toContain(
        `@property for computed field has an unresolved ${option} option`,
      );
      expect(output).toContain('use a literal');
      expect(readFileSync(manifestPath, 'utf8')).toBe(originalManifest);
      const unchangedMember = JSON.parse(originalManifest).modules[0].declarations[0].members[0];
      expect(unchangedMember).not.toHaveProperty('x-spec-kitty-property-only');
      expect(unchangedMember).not.toHaveProperty('x-spec-kitty-property-reset');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test(
  '[react-wrappers] the committed output is current (FR-002, SC-301)',
  { timeout: GATE_TIMEOUT_MS },
  () => {
    const r = gate('--check');
    expect(r.out, 'the drift gate is red — run: node scripts/build-react-wrappers.mjs').toContain(
      'up to date',
    );
    // AND the determinism half, which is the clause ONLY this gate proves. ADR-11 item 9 is two
    // clauses — regeneration is a no-op, and drift fails CI — and behaviours.json's SC-023 cites
    // this gate as discharging both. Asserting 'up to date' alone pins only the second: delete
    // the double-generate block and the gate still exits 0, still prints that string, and
    // nothing reds. This string is emitted only after the two runs are compared.
    expect(r.out, 'the double-generation determinism check did not run').toContain(
      'two runs are byte-identical',
    );
    expect(r.code).toBe(0);
  },
);

// DELIBERATELY NOT RE-RUN HERE: `--selftest`.
//
// It is an ENFORCED step in the `lint-code` job (ci-quality.yml), and `check-gate-wiring.mjs`
// has a REQUIRED_LINT entry making deletion of that step red. Both jobs are unconditional, so
// there is no trigger under which one runs and the other does not — the copy bought no
// coverage. It cost 5.7s of the node lane against `suite-budget.json`'s 25s `ceilingSeconds`
// for `npm run test`, which is 23% of a ceiling this mission would then have had to re-measure
// to justify. `--check` stays: it is the cheap arm and the one a developer wants locally.

test('[react-wrappers] the output directory is committed, not gitignored (NFR-001)', () => {
  // A TypeScript package's natural outdir is packages/react/dist/, and .gitignore ignores
  // `dist` at the root and one level inside any package. That would make `git diff` green
  // forever and leave a fresh CI clone with no wrappers. build-elements-css.mjs's docstring
  // records this repo already paying that price once.
  expect(OUTDIR).not.toMatch(/(^|\/)dist(\/|$)/);
  const tracked = execFileSync('git', ['ls-files', OUTDIR], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
  expect(
    tracked.length,
    `${OUTDIR} has no git-tracked files — the artifact is not committed`,
  ).toBeGreaterThan(0);
});

test('[react-wrappers] every tagged declaration has a wrapper, and nothing else does', () => {
  // The third of the three counts. tests/node/config-contract.test.ts:236-252 ties the source
  // glob to the manifest; this ties the manifest to the emitted files. Deriving the expected
  // set here from the manifest and comparing against the DIRECTORY is the point — a comparison
  // where both sides read the same predicate cannot disagree.
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
    modules: { declarations?: { name: string; tagName?: string }[] }[];
  };
  const expected = manifest.modules
    .flatMap((m) => m.declarations ?? [])
    .filter((d) => d.tagName)
    .map((d) => d.name)
    .sort();
  const emitted = readdirSync(OUTDIR)
    .filter((f) => f.endsWith('.d.ts') && !['index.d.ts'].includes(f))
    .map((f) => f.replace(/\.d\.ts$/, ''))
    .sort();
  expect(emitted).toEqual(expected);
  expect(expected.length, 'refusing to report green over zero declarations').toBeGreaterThan(0);
});

test('[react-wrappers] no abstract or non-element declaration reaches the output', () => {
  // FormControlBase is emitted off the shelf: an abstract class src/index.ts does not export,
  // so the generated import is a TYPE ERROR, and its .js emits React.createElement("undefined").
  // Asserted as a set above; named here because it is the concrete thing that shipped.
  expect(existsSync(`${OUTDIR}/FormControlBase.d.ts`)).toBe(false);
  expect(existsSync(`${OUTDIR}/FormControlBase.js`)).toBe(false);
});

test('[react-wrappers] the SSR decision is in the output, not in prose (FR-009, SC-309)', () => {
  const wrappers = readdirSync(OUTDIR).filter(
    (f) => f.endsWith('.js') && !['index.js', 'react-utils.js'].includes(f),
  );
  expect(wrappers.length).toBeGreaterThan(0);
  for (const f of wrappers) {
    expect(readFileSync(`${OUTDIR}/${f}`, 'utf8').startsWith('"use client"'), `${f}`).toBe(true);
  }
});

test('[react-wrappers] public inherited members ARE props (FR-004, as corrected)', () => {
  // The requirement said "protected and inheritedFrom-base members do not become props" through
  // every draft and all three review lenses. It is wrong: value/label/name/required/disabled/
  // description/invalid are all inheritedFrom FormControlBase with privacy public,
  // and a form wrapper without `value` is not a form wrapper. privacy is the discriminator.
  const dts = readFileSync(`${OUTDIR}/SkFormInput.d.ts`, 'utf8');
  for (const prop of ['value', 'label', 'name', 'required', 'disabled']) {
    expect(dts, `${prop} is public and inherited — it must be a prop`).toMatch(
      new RegExp(`^\\s{2}${prop}\\?:`, 'm'),
    );
  }
  // …and protected ones are not.
  for (const prop of ['internals', 'validate', 'upgradeProperty', 'customError']) {
    expect(dts, `${prop} is protected and must not be a prop`).not.toMatch(
      new RegExp(`^\\s{2}${prop}\\?:`, 'm'),
    );
  }
});
