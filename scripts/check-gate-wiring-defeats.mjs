#!/usr/bin/env node
/**
 * The defeat table for scripts/check-gate-wiring.mjs (#202, #205).
 *
 * WHY THIS FILE EXISTS
 *
 * check-gate-wiring.mjs is the gate that asserts every other gate can block a merge, and it has
 * now been defeated twice by edits that still read as correct — #202 (the `gate` job's failure
 * disjunction matched as shell TEXT) and #205 (`neutered()`'s ENUMERATED swallow list). Both
 * arrived as PROSE reproductions in an issue. Prose is not a probe: it cannot be re-run, so
 * nothing stopped the next refactor of the checker from reopening either hole — and a pre-merge
 * review of the first fix found seven more mutations that left both files green, five of them
 * logic errors in the fix itself. Those five are cases F1-F5 below.
 *
 * SHAPE. Each case mutates the workflow through the YAML PARSE, not through literal file text,
 * and runs the unmodified checker against the re-serialised copy in a temp directory (the
 * checker's workflow path is relative, so the copy is what it reads). No environment variable,
 * argument or seam is added to check-gate-wiring.mjs for this: a seam would be a new way to
 * point the real CI step at a benign file, which is the class of defect this table exists to
 * close.
 *
 * ANCHORING THROUGH THE PARSE IS ITSELF A FIX (F8). The first version anchored on literal
 * indentation and on the disjunct ORDER, and assumed the clause it targeted was never the last
 * one. Reordering the disjunction is something check-gate-wiring.mjs explicitly blesses —
 * "realignment is free" — and it made this table die with an unhandled Node stack trace instead
 * of a verdict. Every mutation now locates its target semantically, and every case is wrapped so
 * a missed anchor surfaces as a table FAILURE rather than a crash.
 *
 * A CONTROL case requires the unmodified workflow to pass, so a checker that reds on everything
 * cannot pass a table of red expectations by being broken. A COUNT FLOOR refuses a shrunken
 * table: `if (!CASES.length)` caught only the empty set, so deleting seven of eight cases still
 * printed a tick and the only trace was a digit (F6). This repo has recorded that
 * shrinking-input-set shape twice before.
 */
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse, stringify } from 'yaml';

const ROOT = resolve(import.meta.dirname, '..');
const WORKFLOW = join(ROOT, '.github/workflows/ci-quality.yml');
const CHECKER = join(ROOT, 'scripts/check-gate-wiring.mjs');
const source = readFileSync(WORKFLOW, 'utf8');

/** The `gate` job's [ENFORCED] step, located by role rather than by position. */
const gateStep = (wf) => {
  const step = (wf.jobs?.gate?.steps ?? []).find((s) => String(s.name ?? '').includes('[ENFORCED]'));
  if (!step) throw new Error('no [ENFORCED] step in the `gate` job');
  return step;
};

/** A `lint-code` step whose command contains `needle` — used to neuter a REGISTERED gate. */
const lintStep = (wf, needle) => {
  const step = (wf.jobs?.['lint-code']?.steps ?? []).find((s) => String(s.run ?? '').includes(needle));
  if (!step) throw new Error(`no lint-code step running \`${needle}\``);
  return step;
};

/** Replace exactly once inside a string, and fail loudly if the anchor moved — a probe that no
 *  longer applies its mutation is a probe that certifies nothing. */
const once = (text, needle, replacement) => {
  const at = text.indexOf(needle);
  if (at === -1) throw new Error(`anchor not found, the probe would be vacuous: ${needle}`);
  if (text.indexOf(needle, at + 1) !== -1) throw new Error(`anchor is ambiguous: ${needle}`);
  return text.slice(0, at) + replacement + text.slice(at + needle.length);
};

/**
 * #202 — append a conjunct that can never be true to one job's disjunct.
 *
 * Targeted by CONTENT, so it works whether that clause is first, last or in the middle, and
 * whether the line ends `|| \` or `; then`. The disjunct is dead; the substring the old
 * assertion looked for is still there, verbatim, for a diff reader to nod at.
 */
const conjunct = (job) => (wf) => {
  const step = gateStep(wf);
  const line = String(step.run).split('\n').find(
    (l) => l.includes(`needs.${job}.result`) && l.includes('!= "success"'),
  );
  if (!line) throw new Error(`no strict clause for \`${job}\``);
  step.run = once(String(step.run), line, line.replace('!= "success" ]', '!= "success" ] && [ 1 = 2 ]'));
};

/** Prepend a line to the gate step's body — an unconditional early statement. */
const prependToGate = (line) => (wf) => {
  const step = gateStep(wf);
  step.run = `${line}\n${String(step.run)}`;
};

/** Append a fallback to a registered gate's command. */
const fallback = (needle, tail) => (wf) => {
  const step = lintStep(wf, needle);
  step.run = `${String(step.run).trimEnd()} ${tail}\n`;
};

const CASES = [
  // ── #202: the gate job's failure disjunction, matched as shell TEXT ──────────────────
  ['#202 conjunct on the lint-code disjunct', conjunct('lint-code')],
  ['#202 conjunct on the test disjunct', conjunct('test')],
  ['#202 conjunct on the release-gate disjunct', conjunct('release-gate')],
  ['#202 the whole disjunction wrapped in `if false && …`', (wf) => {
    const step = gateStep(wf);
    // The line that OPENS the failure disjunction, not merely the first `if [` — the gate step
    // also contains four `sb_ok`/`a11y_ok` normalisation one-liners, and wrapping one of those
    // in `false &&` neuters nothing, so a probe that hit them would report a hole that is not
    // there. The opener is the `if` that tests a `needs.*.result`.
    const line = String(step.run).split('\n').find((l) => /^\s*if\s+\[/.test(l) && l.includes('needs.'));
    if (!line) throw new Error('no `if [ … needs.*.result … ]` opening the disjunction');
    step.run = once(String(step.run), line, line.replace(/^(\s*)if\s+/, '$1if false && '));
  }],
  ['#202 the failure branch weakened to `exit 0`', (wf) => {
    const step = gateStep(wf);
    step.run = once(String(step.run), 'exit 1', 'exit 0');
  }],

  // ── #205: the per-step neutering test ────────────────────────────────────────────────
  ['#205 `|| /bin/true` on a registered gate step',
    fallback('check-adr-index.mjs', '|| /bin/true')],
  ['#205 a `set +e` body with a trailing `exit 0`', (wf) => {
    const step = lintStep(wf, 'check-adr-index.mjs');
    step.run = `set +e\n${String(step.run).replace(/^\s*run:\s*/, '').trim()}\nexit 0\n`;
  }],
  ['#205 an unenumerated swallow: `|| cmp /dev/null /dev/null`',
    fallback('check-element-css-hygiene.mjs', '|| cmp /dev/null /dev/null')],

  // ── The five a pre-merge review found in the FIX for the two above ───────────────────
  //
  // Each is a logic error rather than a spelling, and each was verified three ways: this
  // checker, this table, and a simulation of the gate body under `bash -e` with
  // `needs.test.result` substituted to `failure`.
  ['F1 a gating `if` inside a defined-but-never-called function', (wf) => {
    const step = gateStep(wf);
    const body = String(step.run);
    const start = body.search(/^\s*if\s+\[/m);
    if (start === -1) throw new Error('no `if [` opening the disjunction');
    const end = body.indexOf('fi', body.indexOf('exit 1', start));
    if (end === -1) throw new Error('no `fi` closing the disjunction');
    const block = body.slice(start, end + 2);
    // Never called. The shell reports "All hard gates passed." over a failed `test` job.
    step.run = `${body.slice(0, start)}gate_check() {\n${block}\n}\n${body.slice(end + 2)}`;
  }],
  ["F2 `trap 'exit 0' EXIT` rewrites the step's status", prependToGate("trap 'exit 0' EXIT")],
  ['F3a `exit 0;` — one character past a literal `exit 0` rule', prependToGate('exit 0;')],
  ['F3b `exit 00` — likewise', prependToGate('exit 00')],
  ['F3c `SKIP=0` then `exit $SKIP` — an exit status the rule cannot read',
    prependToGate('SKIP=0\nexit $SKIP')],
  ['F4a `|| echo … || exit 1` — the raise is unreachable',
    fallback('check-element-css-hygiene.mjs', '|| echo "::warning::drift" || exit 1')],
  ['F4b `|| true || exit 1` — likewise',
    fallback('typecheck-all.mjs', '|| true || exit 1')],
  ['F5 `|| { echo …; exit 0; exit 1; }` — the group exits 0 first',
    fallback('check-adr-index.mjs', '|| { echo "::warning::drift"; exit 0; exit 1; }')],

  // ── Two more of the same class, found by probing past the reported findings ──────────
  ['F9  a registered gate backgrounded with `&`',
    fallback('check-adr-index.mjs', '&')],
  ['F10 a registered gate with a `shell:` override that replaces the command', (wf) => {
    const step = lintStep(wf, 'check-adr-index.mjs');
    step.shell = 'bash -c "true" #';
  }],
];

/**
 * THE COUNT FLOOR (F6). Raise this deliberately when a case is added; a case may only be
 * REMOVED by lowering it in the same commit, which is a reviewable edit rather than a deletion
 * that hides in a digit.
 */
const MIN_CASES = 18;

const dir = mkdtempSync(join(tmpdir(), 'gate-wiring-defeats-'));
mkdirSync(join(dir, '.github/workflows'), { recursive: true });
const scratch = join(dir, '.github/workflows/ci-quality.yml');
const run = () => {
  try {
    const stdout = execFileSync(process.execPath, [CHECKER], {
      cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out: stdout };
  } catch (err) {
    return { code: err.status ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
};

/** `--verbose` prints the checker's own message for each refusal. The table asserts the exit
 *  status; a reader auditing whether the message actually NAMES the defeat needs the text. */
const VERBOSE = process.argv.includes('--verbose');

const failures = [];
try {
  // THE CONTROL, first. A checker that reds on everything would "pass" a table of red
  // expectations while certifying nothing — the same vacuity the gates it audits refuse. It
  // also proves the YAML round-trip below is faithful.
  writeFileSync(scratch, stringify(parse(source)));
  const control = run();
  if (control.code !== 0) {
    failures.push(`CONTROL: the unmodified workflow must pass, got exit ${control.code}:\n${control.out}`);
  } else {
    console.log('✓ control — the unmodified workflow passes');
  }

  for (const [name, mutate] of CASES) {
    // EVERY case is wrapped. A mutation whose target moved is a table that has stopped
    // testing something, which must be reported as a failure — never as a stack trace, and
    // never silently (F8).
    let code;
    let out;
    try {
      const wf = parse(source);
      mutate(wf);
      writeFileSync(scratch, stringify(wf));
      ({ code, out } = run());
    } catch (err) {
      failures.push(`${name}: the probe could not be applied — ${err.message}`);
      continue;
    }
    if (code === 0) failures.push(`${name}: DEFEATED the checker — it exited 0 over a neutered gate`);
    else {
      console.log(`✓ ${name} — refused (exit ${code})`);
      if (VERBOSE) console.log(out.replace(/^/gm, '      '));
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (CASES.length < MIN_CASES) {
  console.error(
    `❌ the defeat table has shrunk: ${CASES.length} case(s) against a floor of ${MIN_CASES}. ` +
      'Removing a probe is a deliberate edit to MIN_CASES in the same commit, not a deletion ' +
      'whose only trace is a digit in a green line.'
  );
  process.exit(1);
}
if (failures.length) {
  console.error('❌ check-gate-wiring.mjs is defeatable:');
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}
console.log(`✅ check-gate-wiring defeat table: ${CASES.length} defeats refused, control passes.`);
