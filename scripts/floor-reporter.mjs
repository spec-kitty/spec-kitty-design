/**
 * The suite floor (FR-009, FR-010, FR-005's CI clause).
 *
 * WHY A CUSTOM REPORTER AND NOT `--reporter=json`
 *
 * The spec originally said to build this over `vitest run --reporter=json`. That was
 * measured and it does not work — in two ways, the second of which is the defect class
 * this whole mission exists to close:
 *
 *   1. The JSON carries NO project attribution. `testResults[].name` is an absolute file
 *      path and there is no project key anywhere in the document. With two browser
 *      instances the same file emits two byte-identical entries.
 *   2. When webkit failed to launch, that JSON reported `success: true`,
 *      `numFailedTests: 0`, and two browser files `status: "passed"` with ZERO
 *      assertions. A floor built on it reports green over a lane that never ran a test.
 *
 * The reporter API has what the JSON lacks: `vitest.projects` enumerates DECLARED
 * projects (including ones whose glob matched nothing, which vanish from every other
 * output), and `testModule.project.name` attributes what actually executed.
 *
 * `passWithNoTests` does not help. It is per-RUN: an empty lane beside a populated one
 * exits 0, and the empty lane is not named, not warned about, and absent from
 * `vitest list --json`. Measured.
 */
import { readFileSync, existsSync } from 'node:fs';

const REGISTRY = 'behaviours.json';

export default class FloorReporter {
  onInit(vitest) {
    this.vitest = vitest;
  }

  onTestRunEnd(testModules, unhandledErrors, reason) {
    const problems = [];

    const declared = this.vitest.projects.map((p) => p.name);
    const executed = new Map();
    const skipped = [];
    const coveredIds = new Set();

    for (const mod of testModules ?? []) {
      const project = mod.project?.name ?? '<unknown>';
      let n = 0;
      for (const test of mod.children?.allTests?.() ?? []) {
        const state = test.result?.()?.state;
        if (state === 'skipped') {
          skipped.push(`${project} › ${test.fullName}`);
          // A SKIPPED test does not cover its behaviour. Harvesting its id let a
          // `test.skip('[SC-012] …')` satisfy arm 5, coupling it to arm 4 — harmless while
          // arm 4 catches every skip, but the two arms are supposed to be independent.
          continue;
        }
        n++;
        // Behaviour ids are carried in the test name as [SC-0xx]; tests are keyed by id,
        // never by title, so a rename does not silently drop coverage.
        for (const m of String(test.fullName).matchAll(/\[([A-Z]+-\d+)\]/g)) coveredIds.add(m[1]);
      }
      executed.set(project, (executed.get(project) ?? 0) + n);
    }

    // --- 1. every DECLARED lane executed something -----------------------------------
    for (const name of declared) {
      if (!executed.get(name)) {
        problems.push(
          `lane "${name}" executed 0 tests — declared but empty. This is the shape that ` +
            `exits 0 without this check: passWithNoTests is per-RUN, not per-project.`
        );
      }
    }

    // --- 2. the run itself did not fall over -----------------------------------------
    // `reason` and unhandled errors are the launch-failure signal the JSON reporter lacks.
    if (reason && reason !== 'passed') problems.push(`test run ended with reason "${reason}"`);
    if (unhandledErrors?.length) problems.push(`${unhandledErrors.length} unhandled error(s)`);

    // --- 3. webkit actually ran in CI (FR-005) ---------------------------------------
    // Gating webkit on CI without asserting it executed there is a quieter way of not
    // running it — and the JSON reporter demonstrably calls an unlaunched lane "passed".
    if (process.env['CI']) {
      for (const engine of ['chromium', 'webkit']) {
        const lane = [...executed.keys()].find((k) => k.includes(engine));
        if (!lane || !executed.get(lane)) {
          problems.push(`CI is set but no browser lane executed on ${engine}`);
        }
      }
    }

    // --- 4. zero skips (FR-010) -------------------------------------------------------
    // Reported AFTER the run-level failure above: a module that fails to load has its
    // tests counted as skipped, and that must not be reported as a skip-discipline
    // violation when the real problem is the load.
    for (const s of skipped) {
      problems.push(
        `skipped test: ${s} — the enforced suite allows zero skips. A behaviour with no ` +
          `applicable subject belongs out of ${REGISTRY}, not in a skip.`
      );
    }

    // --- 5. every declared behaviour id has a covering test ---------------------------
    // Reads the registry if it exists. Until WP03 declares ids there is nothing to check,
    // which is honest — the arm is proven at the commit that builds it, by pointing this
    // reporter at a fixture registry (see tests/node/config-contract.test.ts).
    if (existsSync(REGISTRY)) {
      const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
      const ids = (registry.behaviours ?? []).filter((b) => b.applicable !== false).map((b) => b.id);
      for (const id of ids) {
        if (!coveredIds.has(id)) problems.push(`behaviour ${id} is declared in ${REGISTRY} but no test carries it`);
      }
      if (ids.length === 0) problems.push(`${REGISTRY} declares no applicable behaviours — refusing to pass vacuously`);
    }

    if (problems.length) {
      console.error('\n❌ Suite floor violated:');
      for (const p of problems) console.error(`   ${p}`);
      process.exitCode = 1;
    } else {
      const summary = [...executed.entries()].map(([k, v]) => `${k}=${v}`).join(' ');
      console.log(`\n✅ Suite floor: ${declared.length} lane(s) all non-empty, 0 skipped  [${summary}]`);
    }
  }
}
