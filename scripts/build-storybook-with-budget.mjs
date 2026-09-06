#!/usr/bin/env node
/**
 * Build Storybook under the product budget rather than GitHub's infrastructure ceiling.
 *
 * This is the only supported Storybook build entry point in CI. It forwards the child's
 * output and exit status, but owns a process group so a timed-out Nx build cannot leave
 * workers or browser helpers behind.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const DEFAULT_BUDGET_MS = 180_000;
const KILL_GRACE_MS = 1_000;
const BUILD_COMMAND = [
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['nx', 'run', 'storybook:storybook:build', '--skip-nx-cache'],
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function terminateTree(child, signal) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    const args = ['/pid', String(child.pid), '/t'];
    if (signal === 'SIGKILL') args.push('/f');
    const killer = spawn('taskkill', args, { stdio: 'ignore' });
    killer.once('error', () => child.kill(signal));
    killer.once('close', (code) => {
      if (code !== 0) child.kill(signal);
    });
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') child.kill(signal);
  }
}

function runBudgeted(
  command,
  args,
  { timeoutMs = DEFAULT_BUDGET_MS, budgetMs = timeoutMs, stdio = 'inherit' } = {},
) {
  return new Promise((resolve) => {
    const started = performance.now();
    let settled = false;
    let timedOut = false;
    let escalation;
    let timer;
    const child = spawn(command, args, {
      detached: process.platform !== 'win32',
      stdio,
    });

    const settle = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(escalation);
      resolve({
        ...result,
        elapsedMs: performance.now() - started,
        timedOut,
        overBudget: result.kind === 'over-budget',
        pid: child.pid,
      });
    };

    child.once('error', (error) => settle({ kind: 'spawn-error', code: 1, error }));
    child.once('close', (code, signal) => {
      if (timedOut) settle({ kind: 'timeout', code: 124, signal });
      else if (signal) settle({ kind: 'signal', code: 1, signal });
      else if (code !== 0) settle({ kind: 'failure', code: code ?? 1 });
      else if (performance.now() - started > budgetMs) {
        settle({ kind: 'over-budget', code: 1, childCode: 0, budgetMs });
      } else settle({ kind: 'success', code: 0, budgetMs });
    });

    timer = setTimeout(() => {
      timedOut = true;
      terminateTree(child, 'SIGTERM');
      escalation = setTimeout(() => terminateTree(child, 'SIGKILL'), KILL_GRACE_MS);
    }, timeoutMs);
  });
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    throw error;
  }
}

async function waitForExit(pid, timeoutMs = 1_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!processExists(pid)) return true;
    await delay(20);
  }
  return !processExists(pid);
}

async function selftest() {
  const success = await runBudgeted(process.execPath, ['-e', 'process.exit(0)'], {
    timeoutMs: 1_000,
    stdio: 'ignore',
  });
  if (
    success.kind !== 'success' ||
    success.code !== 0 ||
    !Number.isFinite(success.elapsedMs) ||
    success.elapsedMs < 0 ||
    success.timedOut ||
    success.overBudget
  ) {
    throw new Error(`short-lived child did not pass: ${JSON.stringify(success)}`);
  }

  const nonzero = await runBudgeted(process.execPath, ['-e', 'process.exit(7)'], {
    timeoutMs: 1_000,
    stdio: 'ignore',
  });
  if (nonzero.kind !== 'failure' || nonzero.code !== 7 || nonzero.timedOut || nonzero.overBudget) {
    throw new Error(`nonzero child did not fail closed: ${JSON.stringify(nonzero)}`);
  }

  const overBudget = await runBudgeted(
    process.execPath,
    ['-e', 'setTimeout(() => process.exit(0), 60)'],
    { timeoutMs: 1_000, budgetMs: 20, stdio: 'ignore' },
  );
  if (
    overBudget.kind !== 'over-budget' ||
    overBudget.code === 0 ||
    overBudget.childCode !== 0 ||
    overBudget.elapsedMs <= 20 ||
    overBudget.timedOut ||
    !overBudget.overBudget
  ) {
    throw new Error(`completed-over-budget child did not fail closed: ${JSON.stringify(overBudget)}`);
  }

  const scratch = mkdtempSync(join(tmpdir(), 'storybook-budget-selftest-'));
  const pidFile = join(scratch, 'descendant.pid');
  const program = [
    "const { spawn } = require('node:child_process');",
    "const { writeFileSync } = require('node:fs');",
    "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });",
    `writeFileSync(${JSON.stringify(pidFile)}, String(child.pid));`,
    'setInterval(() => {}, 1000);',
  ].join('\n');

  try {
    const timeout = await runBudgeted(process.execPath, ['-e', program], {
      timeoutMs: 250,
      stdio: 'ignore',
    });
    if (timeout.kind !== 'timeout' || timeout.code === 0) {
      throw new Error(`deadline child did not fail closed: ${JSON.stringify(timeout)}`);
    }
    if (!timeout.timedOut || timeout.overBudget || timeout.elapsedMs < 250) {
      throw new Error(`deadline classification or timing was wrong: ${JSON.stringify(timeout)}`);
    }
    if (!existsSync(pidFile)) throw new Error('deadline child never created its descendant probe');
    const descendantPid = Number(readFileSync(pidFile, 'utf8'));
    if (!Number.isInteger(descendantPid) || descendantPid <= 0) {
      throw new Error(`invalid descendant pid probe: ${String(descendantPid)}`);
    }
    if (!(await waitForExit(descendantPid))) {
      throw new Error(`timed-out process tree left descendant ${descendantPid} running`);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  console.log('✅ Storybook budget wrapper selftest 4/4: success, nonzero exit, completed-over-budget, and timeout/process-tree cleanup proved.');
}

async function main() {
  if (process.argv.includes('--selftest')) {
    if (process.argv.length !== 3) throw new Error('--selftest accepts no additional arguments');
    await selftest();
    return;
  }
  if (process.argv.length !== 2) {
    throw new Error('usage: node scripts/build-storybook-with-budget.mjs [--selftest]');
  }

  const [command, args] = BUILD_COMMAND;
  const result = await runBudgeted(command, args, {
    timeoutMs: DEFAULT_BUDGET_MS,
    budgetMs: DEFAULT_BUDGET_MS,
  });
  const elapsed = (result.elapsedMs / 1_000).toFixed(2);
  if (result.kind === 'timeout') {
    console.error(`❌ Storybook build timed out at ${elapsed}s (ceiling 180s); terminated its process tree.`);
  } else if (result.kind === 'over-budget') {
    console.error(`❌ Storybook build completed in ${elapsed}s, over the 180s ceiling.`);
  } else if (result.kind === 'spawn-error') {
    console.error(`❌ Storybook build could not start after ${elapsed}s: ${result.error.message}`);
  } else if (result.kind === 'signal') {
    console.error(`❌ Storybook build ended from signal ${result.signal} after ${elapsed}s.`);
  } else if (result.kind === 'failure') {
    console.error(`❌ Storybook build failed after ${elapsed}s (exit ${result.code}).`);
  } else {
    console.log(`✅ Storybook build completed in ${elapsed}s (ceiling 180s).`);
  }
  process.exitCode = result.code;
}

main().catch((error) => {
  console.error(`❌ Storybook budget wrapper: ${error.message}`);
  process.exitCode = 1;
});
