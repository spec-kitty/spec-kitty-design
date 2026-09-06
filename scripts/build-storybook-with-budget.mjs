#!/usr/bin/env node

/** Build the real Storybook and fail closed when its 180-second production budget is exceeded. */

import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const runChild = (command, args, { timeoutMs, budgetMs = timeoutMs, stdio = 'inherit' }) =>
  new Promise((resolve) => {
    const started = performance.now();
    const child = spawn(command, args, { stdio });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 250).unref();
    }, timeoutMs);
    child.once('error', (error) => {
      clearTimeout(timer);
      resolve({ ok: false, timedOut, elapsedMs: performance.now() - started, error });
    });
    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      const elapsedMs = performance.now() - started;
      resolve({
        ok: !timedOut && code === 0 && elapsedMs <= budgetMs,
        timedOut,
        overBudget: !timedOut && code === 0 && elapsedMs > budgetMs,
        elapsedMs,
        code,
        signal,
      });
    });
  });

const selftest = async () => {
  const probes = [
    ['success', ['-e', 'process.exit(0)'], { timeoutMs: 500, budgetMs: 500 }, (result) => result.ok],
    ['nonzero', ['-e', 'process.exit(7)'], { timeoutMs: 500, budgetMs: 500 }, (result) => !result.ok && result.code === 7],
    ['timeout', ['-e', 'setTimeout(() => {}, 1000)'], { timeoutMs: 40, budgetMs: 500 }, (result) => !result.ok && result.timedOut],
    ['completed over budget', ['-e', 'setTimeout(() => process.exit(0), 60)'], { timeoutMs: 500, budgetMs: 20 }, (result) => !result.ok && result.overBudget],
  ];
  let failures = 0;
  for (const [label, args, options, assertion] of probes) {
    const result = await runChild(process.execPath, args, { ...options, stdio: 'ignore' });
    if (!assertion(result)) {
      console.error(`  ✗ ${label}: ${JSON.stringify(result)}`);
      failures++;
    }
  }
  if (failures > 0) process.exit(1);
  console.log(`✅ all ${probes.length} Storybook budget-wrapper probes passed.`);
};

if (process.argv.includes('--selftest')) {
  await selftest();
} else {
  const ceilingMs = 180_000;
  const result = await runChild('npx', ['nx', 'run', 'storybook:storybook:build'], {
    timeoutMs: ceilingMs,
    budgetMs: ceilingMs,
  });
  const elapsed = (result.elapsedMs / 1000).toFixed(2);
  if (!result.ok) {
    if (result.timedOut) console.error(`❌ Storybook build timed out at ${elapsed}s (ceiling 180s).`);
    else if (result.overBudget) console.error(`❌ Storybook build completed in ${elapsed}s, over the 180s ceiling.`);
    else if (result.error) console.error(`❌ Storybook build could not start after ${elapsed}s: ${result.error.message}`);
    else console.error(`❌ Storybook build failed after ${elapsed}s (exit ${result.code}, signal ${result.signal ?? 'none'}).`);
    process.exit(1);
  }
  console.log(`✅ Storybook build completed in ${elapsed}s (ceiling 180s).`);
}
