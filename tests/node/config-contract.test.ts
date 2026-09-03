import { expect, test } from 'vitest';
import { createVitest } from 'vitest/node';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, globSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
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

  // THE NAME IS NOT ENOUGH. A pass-2 lens added a real element and pointed its subject entry
  // at the SYNTHETIC FIXTURE's own test file — the one behaviours.json's docstring says covers
  // every id — and everything went green: the floor arm and harness guard 7 both key on
  // (id, FILE) and that file already carried the id, while this test only checked that the
  // name appeared somewhere. So the subject's file must be about the element it names.
  for (const el of elements) {
    const subs = applicable.flatMap((b) =>
      (b.subjects ?? []).filter((s) => s.name === `sk-${el}`).map((s) => s.file),
    );
    expect(
      subs.length,
      `<sk-${el}> exists but is not a subject of any behaviour in behaviours.json — ` +
        `it would ship with zero behaviour tests and every gate green`,
    ).toBeGreaterThan(0);
    for (const file of subs) {
      expect(
        file.includes(`sk-${el}.`) || file.includes(`/${el}/`),
        `behaviours.json points subject "sk-${el}" at ${file}, which is not a test file about ` +
          `sk-${el}. Pointing at a file that already carries the id satisfies the floor and the ` +
          `mutation harness while asserting nothing about this element.`,
      ).toBe(true);
    }
  }

  // The element set and the MANIFEST's registered set must agree. FIVE scripts now derive
  // elements
  // from `src/**/sk-*.ts` (#75 added build-react-wrappers.mjs); check-manifest-content.mjs
  // derives them from the registrations the
  // analyzer found. An element file named otherwise — `widget/widget-element.ts` — is invisible
  // to all four and visible to the fifth, and nothing compared them. See #117.
  const manifest = JSON.parse(readFileSync('packages/elements/custom-elements.json', 'utf8')) as {
    modules: { declarations?: { tagName?: string }[] }[];
  };
  const registered = manifest.modules
    .flatMap((m) => m.declarations ?? [])
    .map((d) => d.tagName)
    .filter((t): t is string => Boolean(t))
    .sort();
  expect(
    registered,
    'the manifest registers a different set of elements than the source glob finds — one of ' +
      'the two derivations is blind to a file the other can see',
  ).toEqual(elements.map((e) => `sk-${e}`));
});

test('[config] every form-associated element is a subject of SC-002..SC-005 (FR-009)', () => {
  // THE ARM THAT MAKES THE FOUR-ID OBLIGATION REAL.
  //
  // #73's derived obligation is "at least one behaviour, in a file about the element". A lens
  // showed that is not enough here: declaring the new elements as subjects of SC-013 and SC-014
  // alone satisfies config-contract, the floor arm and harness guard 7 — with not one assertion
  // about FormData, validity, reset or disabled exclusion. The synthetic fixture keeps carrying
  // SC-002..SC-005, which is exactly the shape the subject dimension was built to close.
  //
  // MANIFEST-DERIVED, KEYED ON THE MEMBER NAME. Three things were measured:
  //   * a source-text regex for `static formAssociated` sees NOTHING when the flag is inherited
  //     from a base class — which is where it lives;
  //   * `Object.prototype.hasOwnProperty.call(Subclass, 'formAssociated')` is `false` for the
  //     same reason, so an own-property arm matches zero elements and reports green over an
  //     empty set;
  //   * the analyzer DOES propagate inherited statics, but records `static get formAssociated()`
  //     with no `default` — so keying on `default === "true"` is evaded and keying on the NAME
  //     fails closed.
  //
  // Post-hoc assignment still evades any static source. tests/browser/registered-elements.test.ts
  // is the runtime companion that closes it.
  const manifest = JSON.parse(readFileSync('packages/elements/custom-elements.json', 'utf8')) as {
    modules: { declarations?: { tagName?: string; members?: { name: string; static?: boolean }[] }[] }[];
  };
  const registry = JSON.parse(readFileSync('behaviours.json', 'utf8')) as {
    behaviours: { id: string; subjects?: { name: string; file: string }[] }[];
  };
  const subjectsOf = (id: string) =>
    (registry.behaviours.find((b) => b.id === id)?.subjects ?? []).map((s) => s.name);

  const formAssociated = manifest.modules
    .flatMap((m) => m.declarations ?? [])
    .filter((d) => d.tagName && (d.members ?? []).some((mem) => mem.static && mem.name === 'formAssociated'))
    .map((d) => d.tagName!);

  expect(
    formAssociated.length,
    'no form-associated element found in the manifest — if one exists, this arm has gone blind ' +
      'and would report green over an empty set',
  ).toBeGreaterThan(0);

  for (const tag of formAssociated) {
    for (const id of ['SC-002', 'SC-003', 'SC-004', 'SC-005']) {
      expect(
        subjectsOf(id),
        `<${tag}> declares static formAssociated but is not a subject of ${id}`,
      ).toContain(tag);
    }
  }
});

test('[config] the browser lane pre-bundles React, including the DEV jsx runtime', async () => {
  // THE ARM THAT WAS PROSE. #126 shipped `optimizeDeps.include` with a long comment and nothing
  // asserting it — the same shape vitest.config.mts:50-61 records for the floor reporter ("all
  // five of its arms hung off those 38 characters with nothing asserting they were present").
  // Removing an entry does not fail loudly: Vite discovers the dep mid-run, reloads the page,
  // and kills whichever module was mid-collection. CI caches ~/.npm but `npm ci` wipes
  // node_modules, so `.vite` is cold on EVERY CI run and the discovery always happens. It cost
  // one red cycle where two unrelated suites died with "Vitest failed to find the current suite"
  // while passing locally on a warm cache.
  //
  // `react/jsx-dev-runtime` specifically: the automatic JSX transform imports a runtime no
  // source file names, and in dev mode that is the DEV entry. Pinning only the production one
  // left the hole.
  //
  // ASSERTED ON THE CONFIG MODULE, not the resolved config, and that limit is deliberate rather
  // than lazy. For browser mode Vitest hands `optimizeDeps` to the BROWSER Vite server, which
  // does not exist until a run starts: `createVitest()` reports the project's node-side
  // `vite.config.optimizeDeps.include` as `[]` and `project.browser` as null. So the resolvable
  // surface here is the declaration itself. Importing the module rather than grepping the file
  // means a rename, a move between projects, or a typo in the key all fail — everything except
  // Vite silently ceasing to honour the field, which the three cold-run measurements in the
  // commit that added it cover instead.
  const mod = (await import(pathToFileURL(resolve('vitest.config.mts')).href)) as {
    default: {
      test?: { projects?: { test?: { name?: string }; optimizeDeps?: { include?: string[] } }[] };
    };
  };
  const projects = mod.default.test?.projects ?? [];
  expect(projects.length, 'vitest.config.mts must declare projects').toBeGreaterThan(0);
  const browser = projects.find((p) => p.test?.name === 'browser');
  expect(browser, 'the browser project must be declared in vitest.config.mts').toBeTruthy();
  const include = browser!.optimizeDeps?.include ?? [];
  for (const dep of ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime']) {
    expect(include, `${dep} must be pre-bundled or Vite reloads mid-run`).toContain(dep);
  }
});

test('[config] every project that should be typechecked is (SC-310)', () => {
  // MEMBERSHIP, not a count. SC-310 said "the project list grows from 2 to 3, asserted" and
  // nothing asserted it; the PR body said 4, the matrix said 3. A count rots on the next
  // project added, and typecheck-all.mjs floors only at zero — so a project dropping out of
  // `nx show projects --with-target typecheck` (renamed target, malformed project.json) left
  // the gate green over a smaller set. That is the defect typecheck-all.mjs itself was written
  // to close, one level up.
  // `--json`, AND a parse that survives either shape. Without the flag, nx printed a
  // newline-separated list in CI while printing JSON on this workstation, so `JSON.parse` threw
  // `Unexpected token 'e', "elements-b"...` on the runner and passed locally — a difference in
  // the tool's output format between environments, not in the projects. scripts/typecheck-all.mjs
  // already carries the `--json`-then-fallback pair for the same reason; this mirrors it rather
  // than extracting a shared helper, because #117 owns that extraction and it should not be
  // smuggled in here.
  const run = (args: string[]) =>
    execFileSync('npx', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  let out: string;
  try {
    out = run(['nx', 'show', 'projects', '--with-target', 'typecheck', '--json']);
  } catch {
    out = run(['nx', 'show', 'projects', '--with-target', 'typecheck']);
  }
  let projects: string[];
  try {
    projects = JSON.parse(out) as string[];
  } catch {
    projects = out.split('\n').map((l) => l.trim()).filter(Boolean);
  }
  expect(projects.length, 'nx reported no typecheck projects at all').toBeGreaterThan(0);
  for (const name of ['elements', 'elements-behaviour-fixture', 'react', 'react-consumer-fixture']) {
    expect(projects, `${name} declares a typecheck target and must be picked up`).toContain(name);
  }
});

test('[config] React is not a dependency of @spec-kitty/elements (NFR-003)', () => {
  // "Green before and after" is exactly the kind of requirement that rots unnoticed, and the
  // acceptance matrix called this a regression guard while nothing guarded it. React reaching
  // the element package would put a framework in the base layer ADR-8 exists to keep framework
  // -free.
  const pkg = JSON.parse(readFileSync('packages/elements/package.json', 'utf8')) as Record<
    string,
    Record<string, string> | undefined
  >;
  for (const field of ['dependencies', 'peerDependencies', 'devDependencies']) {
    const names = Object.keys(pkg[field] ?? {});
    expect(
      names.filter((n) => n === 'react' || n.startsWith('react-') || n === '@types/react'),
      `@spec-kitty/elements must not declare React in ${field}`
    ).toEqual([]);
  }
});
