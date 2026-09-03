#!/usr/bin/env node
/**
 * Assert the `gate` job actually gates the behaviour suite (#71, FR-014, SC-021).
 *
 * WHY THIS IS A SCRIPT AND NOT A DEMONSTRATION
 *
 * The obvious evidence for "a test job set to `if: false` fails the gate" is to push a
 * deliberately broken workflow and link the red run. That produces a CI-run URL in a
 * commit message — precisely the transcript NFR-002 rejects — and, worse, it does not
 * protect against the regression that will actually happen: a later PR adding
 * `test_ok="${{ needs.test.result }}"` to the skipped-tolerance block, quietly making
 * `skipped` acceptable for a job that never legitimately skips.
 *
 * A static assertion covers both. Same shape as scripts/gate-selftest.mjs, which this repo
 * already ships for the a11y gate.
 *
 * NOTE the gate's workflow-level `if:` is `always()` and MUST stay that way — it is what
 * lets the job report on failed dependencies at all. The actual gating is the shell
 * disjunction inside its [ENFORCED] step, which is what this checks.
 */
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const WORKFLOW = '.github/workflows/ci-quality.yml';
const JOB = 'test';

const raw = readFileSync(WORKFLOW, 'utf8');
const wf = parse(raw);
const gate = wf.jobs?.gate;
const problems = [];

if (!gate) problems.push('there is no `gate` job');
else {
  // 1. the job is a dependency at all
  if (!(gate.needs ?? []).includes(JOB)) {
    problems.push(`\`${JOB}\` is not in gate.needs — its result is not even visible to the gate`);
  }

  const step = (gate.steps ?? []).find((s) => String(s.name ?? '').includes('[ENFORCED]'));
  const script = String(step?.run ?? '');

  // 2. a STRICT clause in the failure disjunction
  const strict = new RegExp(String.raw`\[\s*"\$\{\{\s*needs\.${JOB}\.result\s*\}\}"\s*!=\s*"success"\s*\]`);
  if (!strict.test(script)) {
    problems.push(
      `the gate's [ENFORCED] step has no strict \`needs.${JOB}.result != success\` clause — ` +
        `the job can fail without blocking the merge`
    );
  }

  // 3. NOT in the skipped-tolerance block. This is the one a future PR will get wrong.
  const toleranceRe = /case\s+"\$relevant"[\s\S]*?esac/;
  const tolerance = script.match(toleranceRe)?.[0] ?? '';
  if (tolerance.includes(JOB)) {
    problems.push(
      `\`${JOB}\` appears in the skipped-tolerance block. It runs UNCONDITIONALLY, so ` +
        `'skipped' is never legitimate for it — tolerating it reopens the green-by-skip ` +
        `bypass the workflow's own comments record closing for a11y.`
    );
  }
  const okVar = new RegExp(String.raw`${JOB}_ok\s*=`);
  if (okVar.test(script)) {
    problems.push(`\`${JOB}_ok\` normalisation found — that is how 'skipped' becomes acceptable`);
  }

  // 4. the job itself must have no `if:`, or "unconditional" is a claim rather than a fact
  if (wf.jobs?.[JOB] && 'if' in wf.jobs[JOB]) {
    problems.push(`the \`${JOB}\` job carries an \`if:\` — FR-003 requires it to run unconditionally`);
  }
}

if (problems.length) {
  console.error(`❌ ${WORKFLOW}: the gate does not gate \`${JOB}\` (FR-014):`);
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}
console.log(`✅ gate wiring: \`${JOB}\` is in needs, tested strictly, absent from the skip tolerance, and unconditional.`);
