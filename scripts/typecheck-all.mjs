#!/usr/bin/env node
/**
 * Run EVERY project's `typecheck` target, and refuse to report green over none.
 *
 * CI ran `npx nx run elements:typecheck` — one project, named literally. A second project
 * (`elements-behaviour-fixture`) declared the same target and was never invoked, so its
 * typecheck sat RED on a green pipeline: `tsc` could not resolve the `?raw` specifier the
 * test suite's own anti-fabrication fix introduced. Nothing noticed, because nothing looked.
 *
 * That is this programme's recurring defect in its purest form — a gate that exists, passes
 * review, and is not executed. Naming projects one at a time cannot survive a monorepo that
 * adds one project per mission for the next ten missions, so this derives the set instead,
 * and applies the floor the run prompt requires of every gate: an empty set is a failure,
 * not a pass.
 *
 * Usage: node scripts/typecheck-all.mjs
 */
import { execFileSync } from 'node:child_process';

const npx = (args) =>
  execFileSync('npx', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

let projects;
try {
  projects = JSON.parse(npx(['nx', 'show', 'projects', '--with-target', 'typecheck', '--json']));
} catch {
  // `--json` is the documented flag but the plain form already prints JSON on this version;
  // fall back rather than let a flag change silently reduce the set to nothing.
  projects = JSON.parse(npx(['nx', 'show', 'projects', '--with-target', 'typecheck']));
}

if (!Array.isArray(projects) || projects.length === 0) {
  console.error(
    '❌ No project declares a `typecheck` target. Refusing to report green over an empty set —\n' +
      '   this step exists precisely because a declared-but-unrun typecheck is invisible.'
  );
  process.exit(1);
}

console.log(`typecheck-all: ${projects.length} project(s) — ${projects.join(', ')}`);
try {
  execFileSync('npx', ['nx', 'run-many', '-t', 'typecheck', '--projects', projects.join(',')], {
    stdio: 'inherit',
  });
} catch {
  // A NAMED failure. `execFileSync` throws an Error whose message is the whole spawn record,
  // so an unhandled one buried the tsc diagnostics — which nx has already printed above —
  // under `status: 1, stdout: null, pid: …` and a Node banner. The useful output is already
  // on screen; all this needs to add is which gate failed and why it matters.
  console.error(
    `\n❌ typecheck failed for one of ${projects.length} project(s): ${projects.join(', ')}.\n` +
      '   The tsc diagnostics are above. This step exists because CI once ran ONE project by\n' +
      '   name while a second declared the same target and sat red on a green pipeline.'
  );
  process.exit(1);
}
console.log(`✅ typecheck passed for ${projects.length} project(s).`);
