import { expect, test } from 'vitest';
import { createVitest } from 'vitest/node';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Node-lane assertions on the harness's own contract (WP01).
 *
 * Everything here is about the CONFIGURATION rather than a component, which is why it is
 * the node lane's only reason to exist at this point in the sequence — and both SC-001
 * and the floor require that lane to execute at least one test.
 */

test('[config] retry is 0 for every project, on the RESOLVED config', async () => {
  // Asserting the raw config object is near-vacuous: `retry` defaults to 0, so the
  // assertion passes whether or not anyone set it, and a per-project override would slip
  // straight past. Resolve it instead.
  const vitest = await createVitest('test', { watch: false });
  try {
    const retries = vitest.projects.map((p) => [p.name, p.config.retry] as const);
    expect(retries.length).toBeGreaterThan(0);
    for (const [name, retry] of retries) {
      expect(retry, `project "${name}" must not retry — a flake is diagnosed, not absorbed`).toBe(0);
    }
  } finally {
    await vitest.close();
  }
});

test('[config] the BUILD resolves useDefineForClassFields:false', () => {
  // Not a lane-local override. esbuild at target ES2022 with this flag unset emits native
  // class fields, which shadow Lit's accessors and break property-before-upgrade — and
  // packages/elements/project.json's bare `esbuild --bundle` resolves this same base
  // config, so the SHIPPED artifact carries the hazard too. Setting it only for the test
  // lane would give a green lane over a broken artifact.
  const base = JSON.parse(
    readFileSync('tsconfig.base.json', 'utf8').replace(/^\s*\/\/.*$/gm, ''),
  );
  expect(base.compilerOptions.useDefineForClassFields).toBe(false);
});

test('[floor] the CI arm fails when webkit did not execute', async () => {
  // FR-005's clause. It cannot be exercised locally — Playwright's webkit build targets
  // Ubuntu and will not launch on this project's Fedora workstation — so the arm is unit
  // tested here rather than left to be discovered in CI. Gating webkit on CI without
  // asserting it ran is a quieter way of not running it.
  const { default: FloorReporter } = await import(
    pathToFileURL(join(process.cwd(), 'scripts/floor-reporter.mjs')).href
  );
  const reporter = new FloorReporter();
  reporter.onInit({ projects: [{ name: 'browser (chromium)' }] });

  const errors: string[] = [];
  const realError = console.error;
  const hadCI = process.env['CI'];
  console.error = (m: unknown) => errors.push(String(m));
  process.env['CI'] = '1';
  try {
    reporter.onTestRunEnd(
      [{ project: { name: 'browser (chromium)' }, children: { allTests: () => [{ fullName: 'a test', result: () => ({ state: 'passed' }) }] } }],
      [],
      'passed',
    );
  } finally {
    console.error = realError;
    if (hadCI === undefined) delete process.env['CI']; else process.env['CI'] = hadCI;
    process.exitCode = 0;
  }
  expect(errors.join('\n')).toContain('no browser lane executed on webkit');
});

test('[floor] the per-behaviour arm fails when a declared id has no covering test', async () => {
  // Proves the floor's registry arm at the commit that BUILDS it, rather than at the
  // commit that first uses it. WP03 owns the real behaviours.json; this points the same
  // reporter logic at a throwaway two-id registry.
  const dir = mkdtempSync(join(tmpdir(), 'floor-'));
  try {
    writeFileSync(
      join(dir, 'behaviours.json'),
      JSON.stringify({ behaviours: [{ id: 'SC-999', applicable: true }] }),
    );
    const { default: FloorReporter } = await import(
      pathToFileURL(join(process.cwd(), 'scripts/floor-reporter.mjs')).href
    );
    const reporter = new FloorReporter();
    reporter.onInit({ projects: [{ name: 'browser (chromium)' }] });

    const cwd = process.cwd();
    const errors: string[] = [];
    const realError = console.error;
    console.error = (m: unknown) => errors.push(String(m));
    process.chdir(dir);
    try {
      reporter.onTestRunEnd(
        [{ project: { name: 'browser (chromium)' }, children: { allTests: () => [{ fullName: 'something unrelated', result: () => ({ state: 'passed' }) }] } }],
        [],
        'passed',
      );
    } finally {
      process.chdir(cwd);
      console.error = realError;
      process.exitCode = 0; // the reporter sets this on violation; do not leak it
    }
    expect(errors.join('\n')).toContain('SC-999');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
