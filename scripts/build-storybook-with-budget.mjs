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
    spawn('taskkill', ['/pid', String(child.pid), '/t', signal === 'SIGKILL' ? '/f' : ''], {
      stdio: 'ignore',
    }).on('error', () => child.kill(signal));
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') child.kill(signal);
  }
}

function runBudgeted(command, args, { timeoutMs = DEFAULT_BUDGET_MS, stdio = 'inherit' } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    let timedOut = false;
    let escalation;
    const child = spawn(command, args, {
      detached: process.platform !== 'win32',
      stdio,
    });

    const settle = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(escalation);
      resolve({ ...result, timedOut, pid: child.pid });
    };

    child.once('error', (error) => settle({ kind: 'spawn-error', code: 1, error }));
    child.once('close', (code, signal) => {
      if (timedOut) settle({ kind: 'timeout', code: 124, signal });
      else if (signal) settle({ kind: 'signal', code: 1, signal });
      else settle({ kind: code === 0 ? 'success' : 'failure', code: code ?? 1 });
    });

    const timer = setTimeout(() => {
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
  if (success.kind !== 'success' || success.code !== 0) {
    throw new Error(`short-lived child did not pass: ${JSON.stringify(success)}`);
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

  console.log('✅ Storybook budget wrapper selftest: success, timeout, nonzero exit, and process-tree cleanup proved.');
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
  const result = await runBudgeted(command, args);
  if (result.kind === 'timeout') {
    console.error(`❌ Storybook build exceeded the ${DEFAULT_BUDGET_MS} ms budget; terminated its process tree.`);
  } else if (result.kind === 'spawn-error') {
    console.error(`❌ Storybook build could not start: ${result.error.message}`);
  } else if (result.kind === 'signal') {
    console.error(`❌ Storybook build ended from signal ${result.signal}.`);
  } else if (result.kind === 'failure') {
    console.error(`❌ Storybook build exited ${result.code}.`);
  }
  process.exitCode = result.code;
}

main().catch((error) => {
  console.error(`❌ Storybook budget wrapper: ${error.message}`);
  process.exitCode = 1;
});
