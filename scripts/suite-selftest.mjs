#!/usr/bin/env node
/**
 * The mutation harness (#71, FR-008, NFR-002).
 *
 * ADR-11 Confirmation #1 demands red-first *demonstrated, not asserted*. "Committed
 * evidence" is satisfied by a commit message containing a paste — which is exactly how
 * #70's NFR-003 degraded. This re-derives the red on every CI run.
 *
 * For each entry in mutations.json: restore an invocation-frozen temp repo (third-party
 * node_modules entries are SYMLINKED — copying 1.2 GB per mutation is not viable), apply one
 * string replacement, run every browser test Vitest's unmutated dependency graph says the source
 * can affect, and assert the NAMED test failed while every other behaviour test survived. Graph
 * errors and zero-file selections fall back to the complete suite rather than narrowing evidence.
 *
 * The guards plus a not-green-baseline check each exist because their failure mode was
 * demonstrated during review. Guard 4 is the one that will actually fire for product mutations.
 * The self-check count is derived from its JSON list at the end rather than duplicated in prose.
 *
 * Usage: node scripts/suite-selftest.mjs [--selftest]
 *   --selftest runs mutations.selftest.json: deliberately-bad entries, each of which must be
 *   REJECTED by the guard it NAMES — rejection by a different guard is a failure, because it
 *   means the guard under test never ran. Without this the harness re-derives the mutations
 *   while nothing re-derives the guards.
 *
 *   The list must cover every verdict this script can emit; that is asserted below. Note the
 *   honest limit: EMITTABLE is a hand-maintained literal, so a NEW verdict string added
 *   without touching it is still unexercised — the assertion catches a missing entry for a
 *   KNOWN verdict, not a new one. Guards 6, 7, 8 and 9 exit before the loop and have no entry
 *   at all — guard 9 additionally CANNOT have one, because --selftest disables the impact filter
 *   it checks; guard 7 is disabled in selftest mode because the ids there name guards, not
 *   behaviours, which is defensible but means it is unproven here. Since #75 WP04 guard 7 also
 *   applies a registry FILTER (applicable !== false) that --selftest likewise cannot reach.
*   Its fail-closed property rests on guard 7's own `unknown` arm: over-filter and every
 *   mutation becomes unknown; under-filter and the inapplicable id becomes uncovered. Both
 *   exit 1, so there is no green-over-empty path — recorded so the next reader need not
 *   re-derive it.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync,
  readdirSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { createVitest } from 'vitest/node';

const selftestMode = process.argv.includes('--selftest');
const LIST = selftestMode ? 'mutations.selftest.json' : 'mutations.json';
const repo = process.cwd();

const controlBytes = new Map([
  [LIST, readFileSync(LIST)],
  ['behaviours.json', readFileSync('behaviours.json')],
  ['scripts/suite-selftest.mjs', readFileSync('scripts/suite-selftest.mjs')],
  ['suite-budget.json', readFileSync('suite-budget.json')],
]);
const list = JSON.parse(controlBytes.get(LIST).toString('utf8'));
const mutations = list.mutations ?? [];
const budget = JSON.parse(controlBytes.get('suite-budget.json').toString('utf8'));
// APPLICABLE behaviours only, matching floor-reporter.mjs:121.
//
// The two consumers of behaviours.json disagreed about what `applicable` means: the floor
// reporter has always filtered on it, and this file did not — so a behaviour declared
// inapplicable satisfied the reporter and then failed guard 7 here, demanding a mutation for a
// behaviour that by definition has no test to mutate. #75 WP04 surfaced it by declaring SC-016
// (generation determinism) inapplicable; the disagreement predates that and would have bitten
// whoever used the flag first.
//
// `applicable: false` is not an escape hatch: config-contract.test.ts asserts the applicable set
// equals ADR-11's list exactly, so an entry cannot be quietly demoted to dodge a mutation, and
// the same test asserts SC-016 is present and carries a reason.
const registry = JSON.parse(controlBytes.get('behaviours.json').toString('utf8')).behaviours.filter(
  (b) => b.applicable !== false
);
/** Every (behaviour, subject) pair the registry declares. Guard 7 compares against these. */
const behaviourSubjects = registry.flatMap((b) =>
  (b.subjects ?? [{ file: null }]).map((s) => ({ id: b.id, file: s.file ?? null }))
);
const behaviourPairs = behaviourSubjects.map(({ id, file }) => `${id}@${file ?? '*'}`);

/**
 * Every verdict this script can emit must have a self-check entry.
 *
 * Guards 6, 7, 8, 9 and guard 5's inverted arm had none, and guard 7 was additionally disabled
 * in selftest mode — so the guard binding the two registries was the one guard the
 * self-check provably never exercised. Asserting the SET closes the class: adding a guard
 * without a self-check entry now fails here rather than being noticed by a reader.
 */
// `timeout` IS EMITTABLE AND IS DELIBERATELY NOT LISTED — the exemption is written down rather
// than left silent, which is the whole point of the paragraph above.
//
// #81 added the verdict when it bounded the per-mutation spawn. Two lenses caught that EMITTABLE
// was not updated, making the newest guard the one the self-check provably never exercised. The
// honest fix is an entry that hangs; I wrote one, could not verify it (this workstation's /tmp is a
// near-full tmpfs and the browser lane will not run reliably), and removed it rather than ship
// unverified machinery into the harness that guards everything else.
//
// So it is exempt like guards 6/7/8, for a stated reason: an entry exercising this arm must
// actually hang, and a real 180s hang would consume a third of the harness's own ceiling. Closing
// it properly needs a per-entry timeout override plus a mutation that reliably blocks the browser's
// main thread — worth doing, and worth doing where it can be measured.
const EMITTABLE = ['pattern', 'ambiguous', 'noop', 'absent', 'collection', 'green', 'collateral'];
if (selftestMode) {
  const covered = new Set(mutations.map((m) => m.expectRejectedBy));
  const missing = EMITTABLE.filter((v) => !covered.has(v));
  if (missing.length) {
    console.error(`❌ ${LIST} has no entry exercising: ${missing.join(', ')}`);
    console.error('   Every verdict this harness can emit needs one, or the guard is unproven.');
    process.exit(1);
  }
}

/** Guard 8 — an empty list makes the loop body never run and prints "all mutations red". */
if (mutations.length === 0) {
  console.error(`❌ ${LIST} declares no mutations — refusing to report green over an empty set.`);
  process.exit(1);
}

/** Guard 7 — ids ⊇ behaviours, and every mutation names a known behaviour. */
if (!selftestMode) {
  // The pair set is now FILTERED, so it can reach [] by editing `applicable` flags rather than
  // by deleting entries — and `uncovered` over an empty set is vacuously satisfied.
  // floor-reporter.mjs refuses the same shape by name. Guard 8 already does this for mutations;
  // this is its mirror.
  if (behaviourPairs.length === 0) {
    console.error('❌ behaviours.json declares no applicable behaviours — refusing to pass vacuously.');
    process.exit(1);
  }
  const ids = new Set(mutations.map((m) => `${m.id}@${m.subject ?? '*'}`));
  const uncovered = behaviourPairs.filter((b) => !ids.has(b));
  const unknown = [...ids].filter((i) => !behaviourPairs.includes(i));
  if (uncovered.length || unknown.length) {
    console.error('❌ mutations.json and behaviours.json disagree:');
    for (const b of uncovered) console.error(`   behaviour ${b} has no mutation — its red-first claim is unproven`);
    for (const i of unknown) console.error(`   mutation ${i} names no declared behaviour`);
    process.exit(1);
  }
}

const SUITE_TIMEOUT_MS = 180_000;
const activeChildren = new Set();
const childProcessTrees = new WeakMap();
const childContainmentTokens = new WeakMap();

const readLinuxProcessTable = () => {
  const processes = new Map();
  if (process.platform !== 'linux') return processes;
  try {
    for (const entry of readdirSync('/proc', { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) continue;
      try {
        const raw = readFileSync(join('/proc', entry.name, 'stat'), 'utf8');
        const commandEnd = raw.lastIndexOf(')');
        if (commandEnd < 0) continue;
        // Fields after the command begin at stat field 3: state, ppid, pgrp, session, ...
        const fields = raw.slice(commandEnd + 2).trim().split(/\s+/);
        const pid = Number(entry.name);
        const ppid = Number(fields[1]);
        const pgid = Number(fields[2]);
        const startTime = fields[19]; // /proc stat field 22, stable for the process lifetime.
        if (Number.isInteger(pid) && Number.isInteger(ppid) && Number.isInteger(pgid)) {
          processes.set(pid, { pgid, ppid, startTime });
        }
      } catch {
        // Processes can disappear while /proc is being read.
      }
    }
  } catch {
    // /proc can be absent or restricted even on Linux containers. The child group remains usable.
  }
  return processes;
};

// Playwright launches browsers as detached processes on POSIX. That gives Chromium a process
// group of its own: killing only Vitest's negative pid does not contain the browser on the forced
// timeout path. Snapshot Linux's descendant tree before signalling so the escalation can reach
// every process group even after Vitest exits and its children are reparented.
const snapshotChildProcessTree = (child) => {
  const tree = childProcessTrees.get(child) ?? {
    identities: new Map(),
  };
  if (process.platform !== 'linux' || !child?.pid) {
    childProcessTrees.set(child, tree);
    return tree;
  }

  const processes = readLinuxProcessTable();
  const containmentToken = childContainmentTokens.get(child);
  if (containmentToken) {
    const marker = `SUITE_SELFTEST_RUN_TOKEN=${containmentToken}`;
    for (const [pid, info] of processes) {
      try {
        const environment = readFileSync(join('/proc', String(pid), 'environ'), 'utf8');
        if (environment.split('\0').includes(marker)) {
          tree.identities.set(pid, info.startTime);
        }
      } catch {
        // Other users' environments can be unreadable; our child processes remain readable.
      }
    }
  }
  const childrenByParent = new Map();
  for (const [pid, info] of processes) {
    const children = childrenByParent.get(info.ppid) ?? [];
    children.push(pid);
    childrenByParent.set(info.ppid, children);
  }
  const pending = [child.pid];
  const visited = new Set();
  while (pending.length > 0) {
    const parent = pending.pop();
    if (visited.has(parent)) continue;
    visited.add(parent);
    const parentInfo = processes.get(parent);
    if (parentInfo) tree.identities.set(parent, parentInfo.startTime);
    for (const pid of childrenByParent.get(parent) ?? []) {
      const info = processes.get(pid);
      if (info) tree.identities.set(pid, info.startTime);
      pending.push(pid);
    }
  }
  childProcessTrees.set(child, tree);
  return tree;
};

const killChildTree = (child, signal) => {
  if (!child?.pid) return 0;
  if (process.platform === 'win32') {
    try { child.kill(signal); } catch { /* The child may already have exited. */ }
    return 1;
  }
  const tree = snapshotChildProcessTree(child);
  if (process.platform !== 'linux') {
    try { process.kill(-child.pid, signal); } catch { /* The group may already have exited. */ }
    return 1;
  }
  const live = readLinuxProcessTable();
  const ownGroup = live.get(process.pid)?.pgid;
  const groups = new Set();
  for (const [pid, startTime] of tree.identities) {
    const current = live.get(pid);
    // Revalidate /proc start time before every signal so a reused pid cannot redirect escalation.
    if (current?.startTime === startTime && current.pgid > 1 && current.pgid !== ownGroup) {
      groups.add(current.pgid);
    }
  }
  for (const pgid of groups) {
    try { process.kill(-pgid, signal); } catch { /* The group may already have exited. */ }
  }
  // If /proc is restricted, retain the original detached-group containment while the child is
  // demonstrably still alive. Never use this fallback after close, when a reused pgid is possible.
  if (groups.size === 0 && child.exitCode === null && child.signalCode === null) {
    try {
      process.kill(-child.pid, signal);
      return 1;
    } catch {
      // The child may have exited between the state check and the signal.
    }
  }
  return groups.size;
};

let cleanupSandbox = () => {};
process.on('exit', () => {
  for (const child of activeChildren) killChildTree(child, 'SIGKILL');
  cleanupSandbox();
});
for (const [signal, code] of [['SIGHUP', 129], ['SIGINT', 130], ['SIGTERM', 143]]) {
  process.once(signal, () => {
    // The parent exits synchronously, so there is no safe grace window to await here. Kill the
    // detached groups before deleting their working tree; timeout paths below retain TERM→KILL.
    for (const child of activeChildren) killChildTree(child, 'SIGKILL');
    cleanupSandbox();
    process.exit(code);
  });
}

function spawnCaptured(command, args, options = {}) {
  return new Promise((resolveSpawn) => {
    const { containmentToken, timeoutMs, ...spawnOptions } = options;
    const child = spawn(command, args, {
      ...spawnOptions,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    activeChildren.add(child);
    if (containmentToken) childContainmentTokens.set(child, containmentToken);
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;
    let forceKilled = false;
    let containedGroups = 0;
    let escalationTimer = null;
    const forceKill = () => {
      if (forceKilled) return;
      forceKilled = true;
      containedGroups += killChildTree(child, 'SIGKILL');
    };
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timer = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          killChildTree(child, 'SIGTERM');
          escalationTimer = setTimeout(() => {
            escalationTimer = null;
            forceKill();
          }, 5_000);
          escalationTimer.unref();
        }, timeoutMs)
      : null;
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (escalationTimer) clearTimeout(escalationTimer);
      forceKill();
      activeChildren.delete(child);
      childProcessTrees.delete(child);
      childContainmentTokens.delete(child);
      resolveSpawn({
        cleanupForced: containedGroups > 0,
        code: null,
        error,
        stderr,
        stdout,
        timedOut,
      });
    });
    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (escalationTimer) clearTimeout(escalationTimer);
      activeChildren.delete(child);
      if (timedOut) forceKill();
      else containedGroups += killChildTree(child, 'SIGKILL');
      childProcessTrees.delete(child);
      childContainmentTokens.delete(child);
      resolveSpawn({
        cleanupForced: containedGroups > 0,
        code,
        signal,
        stderr,
        stdout,
        timedOut,
      });
    });
  });
}

let suiteRunOrdinal = 0;
async function runSuite(dir, project, timeoutMs = SUITE_TIMEOUT_MS, subjects = []) {
  // Serialize browser files inside every sandbox. Cold- and warm-cache probes showed parallel
  // collection could silently lose modules. Source-impact filtering controls cost without
  // allowing test files within the dependency-derived set to execute concurrently.
  const ordinal = ++suiteRunOrdinal;
  const reportPath = join(dir, `.vitest-report-${process.pid}-${ordinal}.json`);
  const runTmp = join(runtimeTmp, `run-${ordinal}`);
  const playwrightCache = join(runTmp, 'playwright-cache');
  const containmentToken = `${process.pid}-${ordinal}-${Date.now()}`;
  mkdirSync(playwrightCache, { recursive: true });
  rmSync(reportPath, { force: true });
  const result = await spawnCaptured(
    process.execPath,
    [
      join(dir, 'node_modules/vitest/vitest.mjs'), 'run', ...subjects, '--project', project,
      '--browser.fileParallelism=false',
      '--reporter=./scripts/suite-selftest-reporter.mjs',
      `--outputFile=${reportPath}`,
    ],
    {
      cwd: dir,
      env: {
        ...process.env,
        CI: '',
        PWTEST_CACHE_DIR: playwrightCache,
        SUITE_SELFTEST_RUN_TOKEN: containmentToken,
        TEMP: runTmp,
        TMP: runTmp,
        TMPDIR: runTmp,
      },
      containmentToken,
      timeoutMs,
    }
  );
  const diagnostics = {
    __exitCode: result.code,
    __signal: result.signal,
    __spawnError: result.error ? String(result.error) : '',
    __stderr: (result.stderr || String(result.error ?? '')).slice(-1_600),
    __stdoutPrefix: result.stdout.slice(-1_600),
    __timedOut: result.timedOut,
  };
  try {
    if (!existsSync(reportPath)) {
      return {
        testResults: [],
        __noReport: true,
        ...diagnostics,
      };
    }
    return { ...JSON.parse(readFileSync(reportPath, 'utf8')), ...diagnostics };
  } catch (error) {
    return {
      testResults: [],
      __noReport: true,
      __reportError: String(error),
      ...diagnostics,
    };
  } finally {
    rmSync(reportPath, { force: true });
    // A timeout retains its private directory until invocation cleanup so forced browser exit
    // never races profile deletion. Successful/ordinary-red runs release theirs immediately.
    if (!result.timedOut && !result.cleanupForced) {
      rmSync(runTmp, { recursive: true, force: true });
    }
  }
}

const runnerFailure = (result) => {
  if (result.__spawnError) return `spawn failed: ${result.__spawnError}`;
  if (result.__signal) return `runner exited from signal ${result.__signal}`;
  if (!Array.isArray(result.unhandledErrors)) {
    return 'report omitted the structured unhandledErrors channel';
  }
  if (result.unhandledErrors.length > 0) {
    const first = result.unhandledErrors[0];
    return `runner reported ${result.unhandledErrors.length} unhandled error(s): ` +
      `${first?.message ?? first?.name ?? 'unknown error'}`;
  }
  if (typeof result.success !== 'boolean') return 'report omitted its boolean success verdict';
  const expectedExit = result.success ? 0 : 1;
  if (result.__exitCode !== expectedExit) {
    return `report success=${result.success} requires exit ${expectedExit}, got ${result.__exitCode}`;
  }
  if (/error during close|Unhandled (?:Error|Rejection)|uncaughtException/i.test(result.__stderr)) {
    return `runner emitted an out-of-band error: ${result.__stderr.split('\n').slice(-3).join(' ')}`;
  }
  return null;
};

/** Every assertion in the report, flattened. */
// The module FILE travels with each test. Behaviour ids are no longer unique across the
// suite — `sk-nav-pill` and the synthetic fixture both carry [SC-006] — so an id-only match
// would let a mutation red the fixture's test and be credited for the element's.
const allTests = (report) =>
  (report.testResults ?? []).flatMap((f) => (f.assertionResults ?? []).map((a) => ({
    name: a.fullName ?? a.title ?? '', status: a.status, file: f.name ?? '',
  })));
const isBehaviourTest = (test) => /\[SC-\d+\]/.test(test.name);

/** Assertion multiset, normalized away from the stable sandbox's absolute path. */
const assertionCounts = (tests, dir) => {
  const counts = new Map();
  for (const test of tests) {
    const key = `${relative(dir, test.file)}\0${test.name}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

const sameAssertionCounts = (left, right) =>
  left.size === right.size && [...left].every(([key, count]) => right.get(key) === count);

const SANDBOX_INPUTS = [
  'fixtures', 'packages', 'scripts', 'tests', 'vitest.config.mts',
  'behaviours.json', 'package.json', 'tsconfig.base.json', 'tsconfig.json',
];
const sandboxRoot = mkdtempSync(join(tmpdir(), 'suite-selftest-'));
const pristine = join(sandboxRoot, 'pristine');
const sandbox = join(sandboxRoot, 'repo');
const runtimeTmp = join(sandboxRoot, 'runtime-tmp');
mkdirSync(pristine);
mkdirSync(sandbox);
mkdirSync(runtimeTmp);

const cleanup = (() => {
  let complete = false;
  return () => {
    if (complete) return;
    complete = true;
    rmSync(sandboxRoot, { recursive: true, force: true });
  };
})();
cleanupSandbox = cleanup;

// Freeze authored inputs once. Every arm resets from these bytes, never from a live checkout that
// another editor could change halfway through the 128-mutation run.
for (const entry of SANDBOX_INPUTS) {
  if (existsSync(join(repo, entry))) {
    cpSync(join(repo, entry), join(pristine, entry), { recursive: true });
  }
}

function prepare() {
  for (const entry of readdirSync(sandbox)) {
    if (entry !== 'node_modules') rmSync(join(sandbox, entry), { recursive: true, force: true });
  }
  for (const entry of SANDBOX_INPUTS) {
    if (existsSync(join(pristine, entry))) {
      cpSync(join(pristine, entry), join(sandbox, entry), { recursive: true });
    }
  }
  for (const cache of ['.vite', '.vite-temp', '.cache']) {
    rmSync(join(sandbox, 'node_modules', cache), { recursive: true, force: true });
    mkdirSync(join(sandbox, 'node_modules', cache));
  }
  rmSync(join(sandbox, '.vitest-attachments'), { recursive: true, force: true });
  return sandbox;
}

// Keep third-party dependencies symlinked, but never node_modules or its mutable tool caches as a
// whole. Repository workspaces are rebound to the frozen sandbox copies; an uncopied workspace is
// omitted rather than silently resolving back into the live checkout.
const sourceModules = join(repo, 'node_modules');
const targetModules = join(sandbox, 'node_modules');
mkdirSync(targetModules);
prepare();
const within = (parent, candidate) => {
  const path = relative(parent, candidate);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
};
const CACHE_NAMES = new Set(['.vite', '.vite-temp', '.cache']);

function linkModuleEntry(source, target) {
  const sourceStat = lstatSync(source);
  if (!sourceStat.isSymbolicLink()) {
    symlinkSync(source, target, sourceStat.isDirectory() ? 'dir' : 'file');
    return;
  }
  const real = realpathSync(source);
  if (within(repo, real) && !within(sourceModules, real)) {
    const sandboxTarget = join(sandbox, relative(repo, real));
    if (!existsSync(sandboxTarget)) return;
    symlinkSync(relative(dirname(target), sandboxTarget), target);
    return;
  }
  // Dependency-internal links (notably node_modules/.bin) keep their package-relative target.
  symlinkSync(readlinkSync(source), target);
}

for (const name of readdirSync(sourceModules)) {
  if (CACHE_NAMES.has(name) || name.startsWith('.vite-')) continue;
  const source = join(sourceModules, name);
  const target = join(targetModules, name);
  const sourceStat = lstatSync(source);
  if (name.startsWith('@') && sourceStat.isDirectory() && !sourceStat.isSymbolicLink()) {
    mkdirSync(target);
    for (const child of readdirSync(source)) {
      linkModuleEntry(join(source, child), join(target, child));
    }
  } else {
    linkModuleEntry(source, target);
  }
}
for (const cache of CACHE_NAMES) mkdirSync(join(targetModules, cache), { recursive: true });

const expectedSandboxWorkspaces = [
  '@spec-kitty/elements', '@spec-kitty/react', '@spec-kitty/styles', '@spec-kitty/tokens',
  '@spec-kitty/react-consumer-fixture', '@spec-kitty/vue-consumer-fixture',
  'elements-behaviour-fixture', 'vite-consumer-fixture',
];
for (const workspace of expectedSandboxWorkspaces) {
  const workspacePath = join(targetModules, workspace);
  if (!existsSync(workspacePath) || !within(sandbox, realpathSync(workspacePath))) {
    throw new Error(`sandbox workspace ${workspace} does not resolve inside the frozen copy`);
  }
}
if (existsSync(join(targetModules, '@spec-kitty/storybook'))) {
  throw new Error('uncopied @spec-kitty/storybook must not resolve into the live checkout');
}
for (const cache of CACHE_NAMES) {
  if (lstatSync(join(targetModules, cache)).isSymbolicLink()) {
    throw new Error(`sandbox cache node_modules/${cache} must not be a symlink`);
  }
}
const fingerprintPaths = (root, inputs) => {
  const hash = createHash('sha256');
  const visit = (path, label) => {
    const info = lstatSync(path);
    hash.update(`${label}\0${info.mode}\0`);
    if (info.isSymbolicLink()) {
      hash.update(readlinkSync(path));
    } else if (info.isDirectory()) {
      for (const child of readdirSync(path).sort()) visit(join(path, child), `${label}/${child}`);
    } else {
      hash.update(readFileSync(path));
    }
  };
  for (const entry of inputs) {
    const path = join(root, entry);
    if (existsSync(path)) visit(path, entry);
  }
  return hash.digest('hex');
};
if (fingerprintPaths(repo, SANDBOX_INPUTS) !== fingerprintPaths(pristine, SANDBOX_INPUTS)) {
  throw new Error('authored sandbox inputs changed while the invocation snapshot was created');
}
for (const [path, bytes] of controlBytes) {
  if (!readFileSync(path).equals(bytes)) {
    throw new Error(`${path} changed while mutation controls were being frozen`);
  }
}
const fingerprintInputs = [...SANDBOX_INPUTS, LIST, 'suite-budget.json'];
const inputFingerprint = () => fingerprintPaths(repo, fingerprintInputs);
const startingFingerprint = inputFingerprint();
const harnessStarted = Date.now();

let failures = 0;
const report = (ok, id, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${String(id).padEnd(26)} ${msg}`);
};

// ── Baseline ────────────────────────────────────────────────────────────────────────
// Retry zero means retry zero here too: the single, serialized baseline is authoritative and any
// collection failure, pending assertion, or missing registry pair stops the run immediately.
const baseDir = prepare();
const baseline = await runSuite(baseDir, 'browser');
const baseTests = allTests(baseline);
const baseBehaviourTests = baseTests.filter(isBehaviourTest);
const incompleteBaselineFiles = (baseline.testResults ?? []).filter((file) =>
  file.status === 'failed' || file.message || (file.assertionResults ?? []).length === 0
);
const missingBehaviourSubjects = behaviourSubjects.filter(({ id, file }) =>
  !baseTests.some((test) =>
    test.name.includes(`[${id}]`) && (!file || test.file.endsWith(file))
  )
);
/** Guard 6 — zero/partial/skipped collection must not become a mutation authority. */
if (baseline.__timedOut) {
  console.error(
    `❌ baseline HUNG (>${SUITE_TIMEOUT_MS / 1000}s) ` +
      `${baseline.__noReport ? 'before producing a JSON report' : 'after tests produced a JSON report; teardown did not finish'}.`
  );
  if (baseline.__stderr) console.error(baseline.__stderr);
  process.exit(1);
}
if (baseline.__noReport) {
  console.error('❌ baseline produced no valid JSON report; refusing mutation authority.');
  if (baseline.__reportError) console.error(baseline.__reportError);
  if (baseline.__stderr) console.error(baseline.__stderr);
  process.exit(1);
}
const baselineRunnerFailure = runnerFailure(baseline);
if (baselineRunnerFailure) {
  console.error(`❌ baseline runner failed: ${baselineRunnerFailure}`);
  process.exit(1);
}
if (baseline.success !== true || baseTests.length === 0
    || baseTests.some((test) => test.status !== 'passed')
    || incompleteBaselineFiles.length > 0 || missingBehaviourSubjects.length > 0) {
  console.error('❌ baseline is incomplete or not green; refusing mutation authority.');
  if (baseline.__stderr) console.error(baseline.__stderr);
  for (const { id, file } of missingBehaviourSubjects) {
    console.error(`   missing behaviour [${id}] in ${file ?? 'the browser suite'}`);
  }
  process.exit(1);
}
console.log(
  `baseline: ${baseTests.length} assertion(s), all passed; ` +
    `${behaviourSubjects.length} registry pair(s) present\n`
);

// Resolve impact against the unmutated sandbox, before any arm can cut its own import edge. This
// is intentionally independent of mutations.json's subject metadata: Vitest follows the same
// aliases, transformed imports, and literal dynamic imports as the browser runner. A graph miss or
// error falls back to the complete suite, never to zero tests.
const baselineFiles = new Set(
  (baseline.testResults ?? []).map((file) => relative(baseDir, file.name ?? ''))
);
const subjectsBySource = new Map();
if (!selftestMode) {
  for (const source of new Set(mutations.map((mutation) => mutation.file))) {
    let vitest;
    try {
      vitest = await createVitest('test', {
        root: sandbox,
        config: join(sandbox, 'vitest.config.mts'),
        project: ['browser'],
        related: [join(sandbox, source)],
        reporters: [],
        run: true,
        watch: false,
      });
      const relevant = (await vitest.getRelevantTestSpecifications()).map((spec) =>
        relative(sandbox, spec.moduleId)
      );
      const unknown = relevant.filter((file) => !baselineFiles.has(file));
      if (unknown.length > 0) {
        throw new Error(`related tests absent from baseline: ${unknown.join(', ')}`);
      }
      subjectsBySource.set(source, relevant.length > 0 ? relevant : null);
    } catch (error) {
      console.warn(
        `impact graph fallback for ${source}: ${String(error).replace(/\s+/g, ' ').slice(-300)}`
      );
      subjectsBySource.set(source, null);
    } finally {
      await vitest?.close();
    }
  }
  const fullFallbacks = [...subjectsBySource.values()].filter((subjects) => subjects === null).length;
  console.log(
    `impact graph: ${subjectsBySource.size} source(s), ${fullFallbacks} full-suite fallback(s)\n`
  );

  /**
   * Guard 9 — a narrowed selection must be able to carry the named test.
   *
   * The graph decides which files an arm RUNS; mutations.json decides which test must go RED.
   * Nothing bound the two. A selection that excludes the arm's subject cannot fail the named test
   * at all, so guard 4 reports `absent` — the SAME verdict a syntax-breaking mutation produces.
   * A filter defect then arrives dressed as a mutation defect, which is the confusion this
   * harness exists to refuse. #225 made the filter narrow enough for that to be reachable, so it
   * is checked here rather than left to be read off a misleading verdict.
   *
   * Only sources the graph actually NARROWED are checked: a full-suite fallback runs everything
   * by definition, and the baseline has already proved every registry pair present in it.
   *
   * Both arms are fail-closed. A subject outside the selection is rejected; so is a MISSING
   * subject under a narrowed selection, because there is then nothing to check the narrowing
   * against. `subject` is optional in the file format and 157 of 157 entries carry one, so the
   * second arm is vacuous today and stays honest if that ever stops being true.
   *
   * Like guards 6, 7 and 8 this exits before the loop and has no self-check entry — and could not
   * have one, because --selftest disables the filter outright (`relatedSubjects = selftestMode ?
   * null : ...`), so mutations.selftest.json cannot reach this code at all. The exemption is
   * written down rather than left silent, exactly as the header records for the other three.
   */
  const unreachable = mutations
    .map((m) => ({ mutation: m, subjects: subjectsBySource.get(m.file) }))
    .filter(({ mutation, subjects }) => Array.isArray(subjects) && (
      !mutation.subject
        || !subjects.some((file) => file === mutation.subject || file.endsWith(mutation.subject))
    ));
  if (unreachable.length) {
    console.error('❌ the impact graph selects no file that could carry the named test:');
    for (const { mutation, subjects } of unreachable) {
      console.error(
        `   [${mutation.id}] ${mutation.arm}: subject ${mutation.subject ?? '<none declared>'} ` +
          `is absent from the ${subjects.length} file(s) resolved for ${mutation.file}`
      );
    }
    console.error(
      '   Such an arm can only ever report "absent" — a filter defect read as a mutation defect.'
    );
    process.exit(1);
  }

  prepare();
}

// ── Mutations ───────────────────────────────────────────────────────────────────────
for (const m of mutations) {
  const expectGuard = m.expectRejectedBy; // selftest mode only
  const dir = prepare();
  const target = join(dir, m.file);
  let verdict = null;

  try {
    const before = existsSync(target) ? readFileSync(target, 'utf8') : null;

    if (before === null) {
      verdict = ['pattern', `file not found: ${m.file}`];
    } else {
      const occurrences = before.split(m.from).length - 1;
      /** Guard 1 — a mutation that applies nothing leaves the test green. */
      if (occurrences === 0) verdict = ['pattern', `PATTERN NOT FOUND — the mutation would apply nothing`];
      /** Guard 2 — String.replace(string) replaces only the first occurrence. */
      else if (occurrences > 1) verdict = ['ambiguous', `pattern occurs ${occurrences}× — replace() would change only the first`];
      else {
        const after = before.replace(m.from, m.to);
        /** Guard 3 — a replacement that changes nothing. */
        if (after === before) verdict = ['noop', 'replacement is a no-op'];
        else {
          writeFileSync(target, after);
          const relatedSubjects = selftestMode ? null : subjectsBySource.get(m.file);
          const affectedSubjects = relatedSubjects ?? [];
          const res = await runSuite(
            dir, 'browser', m.timeoutMs ?? SUITE_TIMEOUT_MS, affectedSubjects
          );

          // A HANG IS ITS OWN OUTCOME, and it now says which mutation caused it. `__noReport` was
          // set in three places and read in none, so a timed-out suite fell through to "the named
          // test is ABSENT from the report" — indistinguishable from a syntax-breaking mutation,
          // and silent about which entry hung. A lens spent a 25-minute hang diffing a tmpdir by
          // hand to find out.
          if (res.__timedOut) {
            const mutationTimeoutMs = m.timeoutMs ?? SUITE_TIMEOUT_MS;
            verdict = [
              'timeout',
              `the suite HUNG (>${mutationTimeoutMs / 1000}s) under this mutation ` +
                `${res.__noReport ? 'before producing a JSON report' : 'after producing its JSON report during teardown'} — ${m.file}`,
            ];
          } else {

          // `__noReport` was set in three places and read in none, so a spawn that crashed without
          // emitting JSON fell through to "the named test is ABSENT" with its stderr discarded. A
          // lens noted the fold closed only the timeout sub-case.
          if (res.__noReport && !res.__timedOut) {
            verdict = ['absent', `the suite produced no report — ${res.__stderr ? res.__stderr.split('\n').slice(-3).join(' ') : 'no stderr captured'}`];
          }
          const mutationRunnerFailure = res.__noReport ? null : runnerFailure(res);
          if (!verdict && mutationRunnerFailure) {
            verdict = ['collection', `runner/report failure: ${mutationRunnerFailure}`];
          }
          const tests = allTests(res);
          let behaviourTests = tests.filter(isBehaviourTest);
          const expectedTests = affectedSubjects.length === 0
            ? baseBehaviourTests
            : baseBehaviourTests.filter((test) =>
                affectedSubjects.some((subject) => test.file.endsWith(subject))
              );
          const expectedAssertions = assertionCounts(expectedTests, baseDir);
          const expectedFiles = new Set(expectedTests.map((test) => relative(baseDir, test.file)));
          const mismatchedFiles = [...expectedFiles].map((file) => {
            const expected = expectedTests.filter((test) => relative(baseDir, test.file) === file);
            const actual = behaviourTests.filter((test) => relative(dir, test.file) === file);
            return { actual, expected, file, matches: sameAssertionCounts(
              assertionCounts(expected, baseDir), assertionCounts(actual, dir)
            ) };
          }).filter(({ matches }) => !matches);
          const partiallyCollected = mismatchedFiles.filter(({ actual }) => actual.length > 0);
          const filesNeedingCompletion = mismatchedFiles
            .filter(({ actual }) => actual.length === 0)
            .map(({ file }) => file);
          if (!verdict && partiallyCollected.length > 0) {
            verdict = [
              'collection',
              `partially collected behaviour file(s) cannot be retried: ` +
                partiallyCollected.map(({ file }) => file).join(', ')
            ];
          }

          // Vitest browser can occasionally report a file-level import failure while every file
          // around it executes. Do not retry an executed assertion and do not retry a red baseline:
          // run each UNCOLLECTED behaviour file once, by itself, then replace only that file's
          // partial report. A real mutation-induced import failure repeats and remains rejected;
          // an orchestration miss is completed without hiding any test result.
          const completions = [];
          let authoritativeFileResults = res.testResults ?? [];
          for (const file of verdict ? [] : filesNeedingCompletion) {
            const completion = await runSuite(
              dir, 'browser', m.timeoutMs ?? SUITE_TIMEOUT_MS, [file]
            );
            completions.push(completion);
            if (!completion.__noReport && !completion.__timedOut && !runnerFailure(completion)) {
              behaviourTests = behaviourTests
                .filter((test) => relative(dir, test.file) !== file)
                .concat(allTests(completion).filter(isBehaviourTest));
              authoritativeFileResults = authoritativeFileResults
                .filter((result) => relative(dir, result.name ?? '') !== file)
                .concat(completion.testResults ?? []);
            }
          }

          const mutationAssertions = assertionCounts(behaviourTests, dir);
          const assertionSetStable = sameAssertionCounts(expectedAssertions, mutationAssertions);
          const incompleteFiles = authoritativeFileResults.filter(
            (file) => expectedFiles.has(relative(dir, file.name ?? ''))
              && (file.message || (file.assertionResults ?? []).length === 0)
          );
          if (!verdict && (!assertionSetStable || incompleteFiles.length > 0
              || completions.some((completion) =>
                completion.__noReport || completion.__timedOut || runnerFailure(completion)
              ))) {
            const missing = [...expectedAssertions].filter(
              ([key, count]) => mutationAssertions.get(key) !== count
            ).slice(0, 3).map(([key]) => key.replace('\0', ' :: '));
            const brokenFiles = incompleteFiles.slice(0, 3).map((file) =>
              `${relative(dir, file.name ?? '<unknown file>')}` +
                (file.message ? ` (${String(file.message).replace(/\s+/g, ' ').slice(-240)})` : '')
            );
            verdict = [
              'collection',
              `the complete assertion set differs from the baseline ` +
                `(${behaviourTests.length}/${expectedTests.length}) or a behaviour file failed ` +
                `to collect` +
                (missing.length ? `; missing: ${missing.join(', ')}` : '') +
                (brokenFiles.length ? `; failed files: ${brokenFiles.join(', ')}` : '') +
                (res.__stdoutPrefix
                  ? ` — ${res.__stdoutPrefix.replace(/\s+/g, ' ').slice(-500)}`
                  : '') +
                (res.__stderr ? ` — ${res.__stderr.split('\n').slice(-3).join(' ')}` : '') +
                (completions.some((completion) => completion.__stderr)
                  ? ` — completion: ${completions.map((completion) => completion.__stderr ?? '')
                      .join(' ').split('\n').slice(-3).join(' ')}`
                  : '')
            ];
          }
          // In --selftest mode the id names a GUARD, not a behaviour, so there is no
          // "named test" to find. The entry declares which behaviour test it should red
          // via `redTest`, so guards 4 and 5 can still be exercised honestly.
          const key = selftestMode ? (m.redTest ?? '__none__') : m.id;
          // `subject` narrows the match to one test file. Optional: entries predating the
          // subject dimension match on the id alone, exactly as before.
          const inSubject = (t) => !m.subject || t.file.endsWith(m.subject);
          const isNamed = (t) => t.name.includes(`[${key}]`) && inSubject(t);
          const named = behaviourTests.filter(isNamed);
          const others = behaviourTests.filter((t) => !isNamed(t));

          /** Guard 4 — THE ONE THAT FIRES. A syntax-breaking mutation exits non-zero with
           *  the named test ABSENT from the report; an exit-code assertion reads that as
           *  success. Require the named test to be PRESENT and FAILED. */
          const where = m.subject ? `[${key}] in ${m.subject}` : `[${key}]`;
          if (!verdict && named.length === 0) verdict = ['absent', `named test ${where} is ABSENT from the report — red for the wrong reason`];
          else if (!verdict && !named.some((t) => t.status === 'failed')) verdict = ['green', `named test ${where} still PASSED — the mutation is semantically inert`];
          /** Guard 5 — collateral bound: the mutation must be surgical.
           *
           * A mutation may DECLARE broad collateral (`expectCollateral`), for a subject
           * whose blast radius is inherently wide — a compiler flag, say. That is not an
           * exemption: the guard INVERTS, and the harness then requires other tests to
           * fail. A declared expectation that does not hold is still a failure. */
          else if (!verdict) {
            const collateral = others.filter((t) => t.status === 'failed');
            if (m.expectCollateral && collateral.length === 0)
              verdict = ['collateral', `declared expectCollateral but no other behaviour test failed — the mutation is narrower than claimed`];
            else if (!m.expectCollateral && collateral.length > 0)
              verdict = ['collateral', `other behaviour test(s) also failed: ${collateral.map((t) => t.name.match(/\[SC-\d+\]/)?.[0]).join(' ')}`];
          }
          }
        }
      }
    }
  } finally {
    // prepare() restores frozen authored inputs and fresh local tool caches before the next arm.
  }

  if (selftestMode) {
    // Each bad entry must be rejected BY THE GUARD IT NAMES — not merely rejected.
    const got = verdict?.[0] ?? null;
    report(got === expectGuard, m.id, got === expectGuard
      ? `rejected by guard "${expectGuard}" as expected`
      : `expected rejection by "${expectGuard}", got ${got ? `"${got}"` : 'ACCEPTED'}` +
        (verdict?.[1] ? `: ${verdict[1]}` : ''));
  } else {
    // An arm that DECLARED collateral and got it was reported as "no collateral", which is
    // the opposite of what guard 5's inverted arm just proved.
    report(!verdict, m.id, verdict ? verdict[1] : `${m.arm} — named test went red, `
      + (m.expectCollateral ? 'with the declared collateral' : 'no collateral'));
  }
}

if (inputFingerprint() !== startingFingerprint) {
  failures++;
  console.error('❌ authored harness inputs changed during this run; discard mixed-revision evidence.');
}

if (failures) {
  console.error(`\n❌ ${failures} of ${mutations.length} ${selftestMode ? 'guard self-check' : 'mutation'}(s) did not behave as specified.`);
  process.exit(1);
}
const elapsed = Math.round(((Date.now() - harnessStarted) / 1000) * 10) / 10;
console.log(
  `\n✅ All ${mutations.length} ${selftestMode ? 'guard self-checks passed' : 'mutations produced their named red, with a green baseline'}.` +
    `  (${elapsed}s, ceiling ${budget.selftestCeilingSeconds}s)`
);
// The harness resolves every mutated source through Vitest's dependency graph before applying any
// arm, then checks the complete affected assertion multiset. Broad package barrels deliberately
// remain broad; graph errors fall back to the full suite rather than reducing evidence. Since #225
// guard 9 binds that selection to mutations.json: a narrowed set that cannot carry the arm's named
// test is rejected before the loop instead of surfacing later as guard 4's "absent".
// `selftestCeilingSeconds` was described in suite-budget.json as an enforced ceiling and was
// read by nothing — an inert key documented as a gate, which is the class this mission
// exists to close, introduced by its own fold. Found at the second gate pass.
if (elapsed > budget.selftestCeilingSeconds) {
  console.error(
    `❌ the harness took ${elapsed}s, over its committed ceiling of ${budget.selftestCeilingSeconds}s.\n` +
      `   Raise it deliberately in suite-budget.json with the run that justifies it.`
  );
  process.exit(1);
}
