#!/usr/bin/env node
/**
 * The defeat table for scripts/check-gate-wiring.mjs (#202, #205).
 *
 * WHY THIS FILE EXISTS
 *
 * check-gate-wiring.mjs is the gate that asserts every other gate can block a merge. Twice now
 * a lens has defeated it with an edit that still reads as correct — #202 (the `gate` job's
 * failure disjunction matched as shell TEXT, so a conjunct or an `if false &&` wrapper leaves
 * the substring intact and the disjunct dead) and #205 (`neutered()`'s ENUMERATED swallow list,
 * which `|| /bin/true` and a `set +e` … `exit 0` body walk straight past).
 *
 * Both were reported as prose reproductions in a GitHub issue. Prose is not a probe: it cannot
 * be re-run, so nothing stops the next refactor of the checker from silently reopening either
 * hole. Every other gate in this repository that survived a defeat carries its probe table
 * beside it (`--selftest` on the CSS, entry, manifest, wrapper, release, ADR-index and
 * llms-surface gates); this is that table for the wiring checker, and it is registered in
 * REQUIRED_LINT beside the checker itself so its CI line cannot be deleted for free.
 *
 * SHAPE. Each case writes a mutated COPY of the workflow into a temp directory laid out like the
 * repo, and runs the UNMODIFIED checker with that directory as `cwd` — the checker's workflow
 * path is relative, so the copy is what it reads. No environment variable, argument or seam is
 * added to check-gate-wiring.mjs for this: a seam would be a new way to point the real CI step at
 * a benign file, which is the class of defect this table exists to close.
 *
 * A CONTROL case runs the unmodified workflow and requires exit 0, so a checker that reds on
 * everything cannot pass a table of red expectations by being broken. The empty-set failure is
 * refused explicitly at the bottom.
 */
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WORKFLOW = join(ROOT, '.github/workflows/ci-quality.yml');
const CHECKER = join(ROOT, 'scripts/check-gate-wiring.mjs');
const source = readFileSync(WORKFLOW, 'utf8');

/** Replace exactly once, and fail loudly if the anchor moved — a probe that no longer
 *  applies its mutation is a probe that certifies nothing. */
const once = (text, needle, replacement) => {
  const at = text.indexOf(needle);
  if (at === -1) throw new Error(`anchor not found, the probe would be vacuous:\n${needle}`);
  if (text.indexOf(needle, at + 1) !== -1) throw new Error(`anchor is ambiguous:\n${needle}`);
  return text.slice(0, at) + replacement + text.slice(at + needle.length);
};

const disjunct = (job) => `[ "\${{ needs.${job}.result }}"`;

/** #202 — append a conjunct that can never be true. The disjunct is dead; the substring the
 *  old assertion looked for is still there, verbatim, for a diff reader to nod at. */
const conjunct = (job) => (text) => {
  const line = text.split('\n').find((l) => l.includes(disjunct(job)) && l.includes('!= "success"'));
  if (!line) throw new Error(`no strict clause for ${job}`);
  return once(text, line, line.replace(/\]\s*\|\|\s*\\$/, '] && [ 1 = 2 ] || \\'));
};

const CASES = [
  ['#202 conjunct on the lint-code disjunct', conjunct('lint-code')],
  ['#202 conjunct on the test disjunct', conjunct('test')],
  ['#202 conjunct on the release-gate disjunct', conjunct('release-gate')],
  [
    '#202 the whole disjunction wrapped in `if false && …`',
    (text) => once(text, `          if ${disjunct('changes')}`, `          if false && ${disjunct('changes')}`),
  ],
  [
    '#202 the failure branch weakened to `exit 0`',
    (text) => once(text, '            echo "One or more hard gates failed. Merge blocked."\n            exit 1\n',
      '            echo "One or more hard gates failed. Merge blocked."\n            exit 0\n'),
  ],
  [
    '#205 `|| /bin/true` on a registered gate step',
    (text) => once(text, '        run: node scripts/check-adr-index.mjs\n', '        run: node scripts/check-adr-index.mjs || /bin/true\n'),
  ],
  [
    '#205 a `set +e` body with a trailing `exit 0`',
    (text) => once(text, '        run: node scripts/check-adr-index.mjs\n',
      '        run: |\n          set +e\n          node scripts/check-adr-index.mjs\n          exit 0\n'),
  ],
  [
    '#205 an unenumerated swallow: `|| cmp /dev/null /dev/null`',
    (text) => once(text, '        run: node scripts/check-adr-index.mjs\n',
      '        run: node scripts/check-adr-index.mjs || cmp /dev/null /dev/null\n'),
  ],
];

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
  // expectations while certifying nothing — the same vacuity the gates it audits refuse.
  writeFileSync(scratch, source);
  const control = run();
  if (control.code !== 0) {
    failures.push(`CONTROL: the unmodified workflow must pass, got exit ${control.code}:\n${control.out}`);
  } else {
    console.log('✓ control — the unmodified workflow passes');
  }

  for (const [name, mutate] of CASES) {
    writeFileSync(scratch, mutate(source));
    const { code, out } = run();
    if (code === 0) failures.push(`${name}: DEFEATED the checker — it exited 0 over a neutered gate`);
    else {
      console.log(`✓ ${name} — refused (exit ${code})`);
      if (VERBOSE) console.log(out.replace(/^/gm, '      '));
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (!CASES.length) {
  console.error('❌ the defeat table is empty — a probe table with no probes certifies nothing');
  process.exit(1);
}
if (failures.length) {
  console.error('❌ check-gate-wiring.mjs is defeatable:');
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}
console.log(`✅ check-gate-wiring defeat table: ${CASES.length} defeats refused, control passes.`);
