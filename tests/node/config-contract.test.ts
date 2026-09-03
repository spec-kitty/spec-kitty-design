import { expect, test } from 'vitest';
import { createVitest } from 'vitest/node';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, globSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
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

test('[config] the floor reporter is in the RESOLVED config', async () => {
  // The arm that was missing. Asserting the npm script's text would be weaker — this reads
  // what Vitest actually resolved, so moving the flag, renaming the file or dropping it
  // from `reporters` all fail here rather than silently disabling all five floor arms.
  const vitest = await createVitest('test', { watch: false });
  try {
    const configured = JSON.stringify(vitest.config.reporters ?? []);
    expect(configured, 'scripts/floor-reporter.mjs must be a configured reporter').toContain(
      'floor-reporter',
    );
  } finally {
    await vitest.close();
  }
});

test('[registry] behaviours.json declares exactly ADR-11\'s applicable behaviours', () => {
  // behaviours.json drives the floor's coverage arm AND the mutation harness's id check,
  // so both derive their expectations from it — deleting an entry deletes the expectation.
  // A lens demonstrated it: dropping SC-012 from the registry, the mutation list and the
  // test left everything green while printing the REDUCED count as if it were expected.
  //
  // expected-parts.json exists for exactly this reason on the parts side. Be precise about
  // what this is: ADR-11 states the behaviours as prose categories with no machine-readable
  // ids, so this list is a hand transcription — a SECOND COPY, not a derivation. It catches
  // a one-file edit (a rename fails three ways: here, floor arm 5, and harness guard 7);
  // it does not catch someone editing both in the same PR. That is a reviewer's job, and
  // saying so is better than claiming a binding this does not have.
  const expected = [
    'SC-002', 'SC-003', 'SC-004', 'SC-005', // form association
    'SC-006', 'SC-007', 'SC-008', 'SC-009', // event contract
    'SC-010',                               // property before upgrade
    'SC-011',                               // slot contract
    'SC-012',                               // focus and keyboard
    'SC-013',                               // styling API
    'SC-014',                               // style adoption
    'SC-015',                               // registry guard
    // The fifteenth, generation determinism, is deferred to #75 — its subject does not
    // exist and the artifacts that do already carry enforced drift checks.
  ];
  const registry = JSON.parse(readFileSync('behaviours.json', 'utf8')) as {
    behaviours: { id: string; applicable?: boolean }[];
  };
  const declared = registry.behaviours.filter((b) => b.applicable !== false).map((b) => b.id);
  expect([...declared].sort()).toEqual([...expected].sort());
});

test('[config] the BUILD EMITS assignment semantics, not a native class field', async () => {
  // Asserts the EMIT, not the key.
  //
  // An earlier version JSON.parsed tsconfig.base.json and checked one literal — which is
  // exactly the "near-vacuous" shape this file argues against twenty lines above, for
  // `retry`. The build's resolution is a chain: `esbuild packages/elements/src/index.ts`
  // walks up to packages/elements/tsconfig.json, which extends the base. The key check
  // stayed green if that intermediate set the flag true, dropped its `extends`, or if the
  // build command gained its own --tsconfig. A pre-merge lens pointed out the acceptance
  // matrix claimed this asserted "the value the BUILD resolves" and it did not.
  //
  // Transforming a probe through the SAME tsconfig the build resolves covers the whole
  // tsconfig chain — verified red at all three positions: the base flipped, the intermediate
  // overriding it, and the intermediate dropping its `extends`. It does NOT cover the build
  // command gaining its own `--tsconfig=` flag; an earlier comment claimed it did.
  const esbuild = await import('esbuild');
  // buildSync with a tsconfig PATH, not transformSync with raw content: only the path form
  // follows `extends`, and following it is the entire point — the flag lives in the base,
  // two files up from where the build starts.
  const probe = join(mkdtempSync(join(tmpdir(), 'ts-emit-')), 'probe.ts');
  writeFileSync(probe, 'export class P { declared = "x"; }');
  const out = esbuild.buildSync({
    entryPoints: [probe],
    tsconfig: 'packages/elements/tsconfig.json',
    write: false,
    format: 'esm',
  });
  const code = out.outputFiles[0].text;
  // Define semantics emit a bare `declared = "x"` class field, which shadows Lit's
  // prototype accessor. Assignment semantics hoist it into the constructor.
  expect(code, `esbuild emitted a native class field:\n${code}`).toContain('this.declared');
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

test('[config] every element is a declared behaviour SUBJECT, and every subject list is non-empty', () => {
  // THE HOLE THE SUBJECT DIMENSION LEFT OPEN.
  //
  // #73 gave behaviours.json a `subjects` list so the floor reporter could tell "the fixture
  // covers SC-006" from "sk-nav-pill covers SC-006". A pre-merge lens then added a real
  // element to the tree — wired into both distribution entries, own adopted sheet, reflected
  // property, public method — with NO registry entry and NO test file, and every gate went
  // green: entries, boundaries, CSS drift, manifest, part ratchet, typecheck, the floor, and
  // all 21 mutations. The registry that decides whether an element is tested at all was
  // itself the hand-maintained list this programme removed from the CSS pipeline in #71, from
  // the markup generator in #72, and from the IIFE entry one commit ago.
  //
  // So the obligation is DERIVED from the element glob. Adding an element now fails here
  // until it is entered as a subject of at least one behaviour.
  const elements = globSync('packages/elements/src/**/sk-*.ts', {})
    .filter((f) => /^sk-[a-z0-9-]+\.ts$/.test(basename(f)))
    .map((f) => basename(f).replace(/^sk-/, '').replace(/\.ts$/, ''))
    .sort();
  expect(elements.length, 'no elements found — the glob has drifted').toBeGreaterThan(0);

  const registry = JSON.parse(readFileSync('behaviours.json', 'utf8')) as {
    behaviours: { id: string; applicable?: boolean; subjects?: { name: string; file: string }[] }[];
  };
  const applicable = registry.behaviours.filter((b) => b.applicable !== false);

  // `subjects` is OPTIONAL in the reporter (`b.subjects ?? [null]`) so the mechanism could
  // land without rewriting every entry. That fallback is the old id-only check — the one that
  // was green with a whole behaviour file deleted — so nothing may be left on it.
  for (const b of applicable) {
    expect(b.subjects, `${b.id} declares no subjects — it falls back to the id-only check`).toBeDefined();
    expect(b.subjects!.length, `${b.id} declares an empty subjects list`).toBeGreaterThan(0);
  }

  const named = new Set(applicable.flatMap((b) => (b.subjects ?? []).map((s) => s.name)));
  for (const el of elements) {
    expect(
      named.has(`sk-${el}`),
      `<sk-${el}> exists but is not a subject of any behaviour in behaviours.json — ` +
        `it would ship with zero behaviour tests and every gate green`,
    ).toBe(true);
  }
});
