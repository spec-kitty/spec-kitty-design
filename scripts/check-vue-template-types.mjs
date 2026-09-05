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
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'fixtures/vue-consumer/tsconfig.vue.json';

// Good.vue names every element by hand. Assert the COUNT against the manifest rather than deriving
// the template from it: a derived template would shrink with the manifest and prove nothing, which
// is the tautology build-react-wrappers.mjs documents. This way a new element fails here until
// someone adds it to the template a consumer's compiler actually sees.
const manifest = JSON.parse(readFileSync(join(ROOT, 'packages/elements/custom-elements.json'), 'utf8'));
const manifestTags = [
  ...new Set((manifest.modules ?? []).flatMap((m) => (m.declarations ?? []).map((d) => d.tagName).filter(Boolean))),
];
const good = readFileSync(join(ROOT, 'fixtures/vue-consumer/src/Good.vue'), 'utf8');
const uncovered = manifestTags.filter((t) => !new RegExp(`<${t}[\\s/>]`).test(good));
if (manifestTags.length === 0) {
  console.error('❌ the manifest declares no tags — refusing to certify template coverage over nothing');
  process.exit(1);
}

let out = '';
try {
  out = execFileSync('npx', ['vue-tsc', '-p', PROJECT, '--noEmit'], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (err) {
  out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
}

const lines = out.split('\n').filter((l) => /error TS\d+/.test(l));
const inGood = lines.filter((l) => l.includes('Good.vue'));
const inBad = lines.filter((l) => l.includes('Bad.vue'));
const problems = [];
if (uncovered.length) {
  problems.push(
    `Good.vue does not use ${uncovered.length} of ${manifestTags.length} declared elements ` +
      `(${uncovered.join(', ')}) — their generated declarations ship unchecked`,
  );
}

if (inGood.length) {
  problems.push(`Good.vue must compile clean, but reported ${inGood.length} error(s):\n   ${inGood.join('\n   ')}`);
}
if (inBad.length === 0) {
  problems.push(
    'Bad.vue reported NO error. The generated types are not reaching templates — this is exactly ' +
      'the state that shipped once, where the .d.ts type-checked and did nothing.',
  );
} else if (!inBad.some((l) => /chartreuse/.test(l) && /is not assignable/.test(l))) {
  problems.push(`Bad.vue errored, but not on the declared variant union:\n   ${inBad.join('\n   ')}`);
}
// A run that produced no diagnostics AT ALL means vue-tsc did not see the files.
if (lines.length === 0 && !/error/i.test(out)) {
  problems.push('vue-tsc produced no diagnostics at all — refusing to certify over an empty run');
}

if (problems.length) {
  console.error('❌ Vue template types:');
  problems.forEach((p) => console.error(`   ${p}`));
  process.exit(1);
}
console.log(`✅ Vue template types reach a real SFC: Good.vue clean, Bad.vue rejects an undeclared variant.`);
