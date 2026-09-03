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

// The job's ABSENCE is a failure, not a pass. `wf.jobs?.[JOB] && 'if' in ...` evaluated to
// false when the job was deleted, so the script printed green over a workflow with no test
// job at all — the certifying-absence shape check-part-ratchet.mjs goes out of its way to
// refuse two files over. Found by a pre-merge lens.
if (!wf.jobs?.[JOB]) problems.push(`there is no \`${JOB}\` job at all`);
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
  const toleranceMatch = script.match(toleranceRe);
  // FAIL CLOSED. `?? ''` meant that if the tolerance block were ever restructured — renamed
  // `$relevant`, switched to `if`/`[[ ]]`, split in two — the match returned null, the
  // haystack became empty, and the check silently passed. The one check the author called
  // "the one worth having" was guarded by a regex that disarms itself under exactly the
  // refactor that would motivate reopening the bypass.
  if (!toleranceMatch) {
    problems.push(
      'the skipped-tolerance block was not found — refusing to certify its absence. If it was ' +
        'restructured, update this pattern deliberately rather than letting the check pass.'
    );
  }
  const tolerance = toleranceMatch?.[0] ?? '';
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

  // 5. THE PAYLOAD, not just the edge.
  //
  // Checks 1-4 all ask whether the gate LOOKS AT `needs.test.result`. None asked whether the
  // job runs anything, or whether a failure can reach `result` at all. A pre-merge lens
  // defeated the gate four separate ways while this script printed green: gutting the job to
  // `echo ok`, and `continue-on-error: true` on the suite step, on the gate's own step, and
  // on the job. The first is the plainest possible form of this programme's defect class; the
  // second is this workflow's OWN IDIOM — ci-quality.yml already carries continue-on-error on
  // steps named [ENFORCED] in lint-code, so a contributor copying the house style disarms the
  // suite and the checker congratulates them.
  // Matched PER STEP, as whole commands. A joined blob was defeated five ways at the second
  // gate pass, and the first of them is the subtle one: `scripts/suite-selftest.mjs` is a
  // SUBSTRING of `scripts/suite-selftest.mjs --selftest`, so deleting the mutation-harness
  // step entirely — NFR-002's centrepiece — was satisfied by the self-check step's line.
  const REQUIRED = [
    [/node\s+scripts\/measure-suite-time\.mjs(\s|$)/, 'the behaviour suite', 'scripts/measure-suite-time.mjs'],
    [/node\s+scripts\/suite-selftest\.mjs(?!\s*--selftest)(\s|$)/, 'the mutation harness', 'scripts/suite-selftest.mjs'],
    [/node\s+scripts\/suite-selftest\.mjs\s+--selftest(\s|$)/, "the mutation harness's own guard self-check", 'scripts/suite-selftest.mjs --selftest'],
  ];

  /** A step that cannot fail the job is a step that is not running (B, C, D, E). */
  const neutered = (st) => {
    const why = [];
    if ('if' in st) why.push('carries an `if:`');
    if (st['continue-on-error']) why.push('carries continue-on-error');
    if (/\|\|\s*(true|:)\b/.test(String(st.run ?? ''))) why.push('swallows failure with `|| true`');
    return why;
  };

  /** Strip comments so a needle mentioned only in a `#` line does not count as running. */
  const commandLines = (st) =>
    String(st.run ?? '')
      .split('\n')
      .map((l) => l.replace(/^\s*#.*$/, ''))
      .join('\n');

  const steps = wf.jobs?.[JOB]?.steps ?? [];
  for (const [re, what, label] of REQUIRED) {
    const matching = steps.filter((st) => re.test(commandLines(st)));
    if (matching.length === 0) {
      problems.push(`the \`${JOB}\` job never runs ${what} (${label}) — the gate would guard an empty job`);
      continue;
    }
    for (const st of matching) {
      for (const why of neutered(st)) {
        problems.push(`the step running ${what} ${why} — it cannot fail the job, so the gate guards nothing`);
      }
    }
  }

  // The gate's OWN enforced step, and both jobs. `continue-on-error` or an `if:` anywhere in
  // this chain makes a failure unreachable. lint-code uses continue-on-error deliberately,
  // rescued by an explicit "Fail if lint errors" step; nothing here is.
  for (const [jobName, job] of Object.entries({ [JOB]: wf.jobs?.[JOB], gate })) {
    if (!job) continue;
    if (job['continue-on-error']) problems.push(`job \`${jobName}\` carries continue-on-error — its failure cannot reach the gate`);
    for (const st of job.steps ?? []) {
      const enforced = String(st.name ?? '').includes('[ENFORCED]');
      if (st['continue-on-error']) {
        problems.push(`step "${st.name ?? st.run}" in \`${jobName}\` carries continue-on-error — it cannot fail the job`);
      }
      if (enforced && 'if' in st) {
        problems.push(`[ENFORCED] step "${st.name}" in \`${jobName}\` carries an \`if:\` — it can be skipped`);
      }
      if (enforced && /\|\|\s*(true|:)\b/.test(String(st.run ?? ''))) {
        problems.push(`[ENFORCED] step "${st.name}" in \`${jobName}\` swallows failure with \`|| true\``);
      }
    }
  }
}

if (problems.length) {
  console.error(`❌ ${WORKFLOW}: the gate does not gate \`${JOB}\` (FR-014):`);
  for (const p of problems) console.error(`   ${p}`);
  process.exit(1);
}
console.log(`✅ gate wiring: \`${JOB}\` is in needs, tested strictly, absent from the skip tolerance, and unconditional.`);
