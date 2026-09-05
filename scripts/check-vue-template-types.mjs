#!/usr/bin/env node
/**
 * The generated Vue types, checked where a consumer actually meets them (#81).
 *
 * WHY THIS EXISTS AND `tsc` DOES NOT SUFFICE. `packages/elements/vue.d.ts` augments Vue's
 * `GlobalComponents`, and the only place that augmentation does any work is inside a TEMPLATE,
 * which only Volar (`vue-tsc`) compiles. The first version of the generator emitted bare props
 * objects instead of `DefineComponent<...>`. Those declarations type-checked perfectly under
 * `tsc`, the fixture's type-test passed, and `<sk-button variant="chartreuse">` in a real `.vue`
 * raised NO ERROR AT ALL — the file did nothing, and nothing in the repo could see it, because
 * nothing compiled a template. A lens found it by installing vue-tsc and trying.
 *
 * IT ASSERTS BOTH DIRECTIONS. A `vue-tsc` run over this fixture is EXPECTED to report exactly one
 * error, in `Bad.vue`. Green would mean the types stopped reaching templates; two errors would
 * mean `Good.vue` broke. Neither an exit code nor an error count alone distinguishes those, so
 * this checks which file the error is in and what it says.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'fixtures/vue-consumer/tsconfig.vue.json';

// A named refusal, not a Node stack trace — the house rule typecheck-all.mjs documents. A lens
// deleted the fixture and got a raw ENOENT dump.
for (const required of ['fixtures/vue-consumer/src/Good.vue', 'fixtures/vue-consumer/src/Bad.vue', PROJECT]) {
  if (!existsSync(join(ROOT, required))) {
    console.error(`❌ ${required} is missing — this gate cannot certify template types without it.`);
    process.exit(1);
  }
}

let out = '';
try {
  out = execFileSync('npx', ['vue-tsc', '-p', PROJECT, '--noEmit'], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    // BOUNDED, because this PR's whole subject is that an unbounded spawn burns a job. A lens
    // pointed out this gate shipped with the defect it was added alongside the fix for. The gate
    // runs in ~1.7s; 120s is a hang, not a slow machine.
    timeout: 120_000,
  });
} catch (err) {
  out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
}

const lines = out.split('\n').filter((l) => /error TS\d+/.test(l));
const problems = [];

/**
 * EXACTLY ONE DIAGNOSTIC, IN Bad.vue. Nothing is filtered away.
 *
 * The first version filtered `lines` to those mentioning Good.vue or Bad.vue and ignored the rest.
 * A lens showed the consequence: a bad `type.text` in the manifest emits a declaration referencing
 * an unresolvable type, `vue-tsc` reports `packages/elements/vue.d.ts(39,15): error TS2304: Cannot
 * find name 'BlogCardAltText'` — and this gate dropped it and exited 0, while `--check` byte-compared
 * the file against the generator's own output and `assertParses` found it syntactically fine.
 * TypeScript degrades an unresolvable name to `any`, so that prop was unchecked in every consumer
 * template, behind two green ENFORCED gates.
 *
 * `tsconfig.vue.json` sets `skipLibCheck: false` precisely so that error is produced. Discarding it
 * made the setting buy nothing — the same "verified guard, wrong call site" that produced the
 * blocker this gate was written to close.
 */
const unexpected = lines.filter((l) => !l.includes('Bad.vue'));
if (unexpected.length) {
  problems.push(
    `vue-tsc reported ${unexpected.length} error(s) outside Bad.vue — including any in the ` +
      `GENERATED declaration itself, which is what skipLibCheck: false exists to surface:\n   ` +
      unexpected.join('\n   '),
  );
}

const inBad = lines.filter((l) => l.includes('Bad.vue'));
if (inBad.length === 0) {
  problems.push(
    'Bad.vue reported NO error. The generated types are not reaching templates — this is exactly ' +
      'the state that shipped once, where the .d.ts type-checked and did nothing.',
  );
} else if (!inBad.some((l) => /chartreuse/.test(l) && /is not assignable/.test(l))) {
  problems.push(`Bad.vue errored, but not on the declared variant union:\n   ${inBad.join('\n   ')}`);
}

/**
 * AND Good.vue MUST ACTUALLY HAVE BEEN COMPILED. "No errors in Good.vue" is indistinguishable from
 * "vue-tsc never read Good.vue" — a lens deleted it from the tsconfig's `include` and this gate
 * stayed green while still printing that all 14 elements reach a real SFC. The coverage check above
 * is a grep over the file's text and cannot tell the difference either.
 */
const compiled = (() => {
  try {
    const listed = execFileSync('npx', ['vue-tsc', '-p', PROJECT, '--listFilesOnly'], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000,
    });
    return listed.split('\n').some((l) => l.includes('Good.vue'));
  } catch (err) {
    return String(err.stdout ?? '').split('\n').some((l) => l.includes('Good.vue'));
  }
})();
if (!compiled) {
  problems.push('vue-tsc never read Good.vue — the project does not include it, so its clean result means nothing');
}

if (problems.length) {
  console.error('❌ Vue template types:');
  problems.forEach((p) => console.error(`   ${p}`));
  process.exit(1);
}
console.log(`✅ Vue template types reach a real SFC: Good.vue clean, Bad.vue rejects an undeclared variant.`);
