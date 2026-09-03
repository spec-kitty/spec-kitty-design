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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

test('[react-wrappers] the committed output is current (FR-002, SC-301)', { timeout: GATE_TIMEOUT_MS }, () => {
  const r = gate('--check');
  expect(r.out, 'the drift gate is red — run: node scripts/build-react-wrappers.mjs').toContain('up to date');
  // AND the determinism half, which is the clause ONLY this gate proves. ADR-11 item 9 is two
  // clauses — regeneration is a no-op, and drift fails CI — and behaviours.json's SC-023 cites
  // this gate as discharging both. Asserting 'up to date' alone pins only the second: delete
  // the double-generate block and the gate still exits 0, still prints that string, and
  // nothing reds. This string is emitted only after the two runs are compared.
  expect(r.out, 'the double-generation determinism check did not run').toContain(
    'two runs are byte-identical'
  );
  expect(r.code).toBe(0);
});

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
  const tracked = execFileSync('git', ['ls-files', OUTDIR], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  expect(tracked.length, `${OUTDIR} has no git-tracked files — the artifact is not committed`)
    .toBeGreaterThan(0);
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
    (f) => f.endsWith('.js') && !['index.js', 'react-utils.js'].includes(f)
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
      new RegExp(`^\\s{2}${prop}\\?:`, 'm')
    );
  }
  // …and protected ones are not.
  for (const prop of ['internals', 'validate', 'upgradeProperty', 'customError']) {
    expect(dts, `${prop} is protected and must not be a prop`).not.toMatch(
      new RegExp(`^\\s{2}${prop}\\?:`, 'm')
    );
  }
});
