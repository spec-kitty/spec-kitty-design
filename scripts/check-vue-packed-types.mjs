#!/usr/bin/env node
/**
 * Compile the generated Vue declaration from the package a consumer actually receives (#149).
 *
 * The source fixture extends tsconfig.base.json, whose @spec-kitty/elements aliases point at
 * source. That once hid a published-only failure: vue.d.ts imported the package root, the
 * tarball's dist/index.d.ts referenced declarations that were not packed, and the fixture stayed
 * green because it never resolved that declaration. This post-build probe packs and extracts the
 * real @spec-kitty/elements tarball into an isolated node_modules tree, then compiles a strict
 * consumer with no tsconfig and no paths. Run it only after the publishable graph is built.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILT_MATRIX_TYPE = join(
  ROOT,
  'packages/elements/dist/transition-matrix/sk-transition-matrix.d.ts',
);

if (!existsSync(BUILT_MATRIX_TYPE)) {
  console.error(
    '❌ Packed Vue types: packages/elements/dist is missing — build the publishable graph before running this gate.',
  );
  process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), 'vue-packed-types-'));
try {
  const modules = join(scratch, 'node_modules');
  const packed = join(modules, '@spec-kitty', 'elements');
  mkdirSync(packed, { recursive: true });

  const raw = execFileSync('npm', ['pack', '--pack-destination', scratch, '--json'], {
    cwd: join(ROOT, 'packages/elements'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  });
  const tarball = join(scratch, JSON.parse(raw)[0].filename);
  execFileSync('tar', ['-xzf', tarball, '-C', packed, '--strip-components=1'], {
    timeout: 120_000,
  });

  // Vue is deliberately not a dependency of @spec-kitty/elements. The consuming app supplies
  // it; these symlinks model that peer-owned installation without invoking the registry.
  for (const dependency of [
    'vue',
    'lit',
    'lit-html',
    'lit-element',
    '@lit/reactive-element',
    '@lit-labs/ssr-dom-shim',
  ]) {
    const installed = join(ROOT, 'node_modules', ...dependency.split('/'));
    if (!existsSync(installed)) {
      throw new Error(`${dependency} is not installed, so the packed Vue declaration cannot be checked`);
    }
    const staged = join(modules, ...dependency.split('/'));
    mkdirSync(dirname(staged), { recursive: true });
    symlinkSync(installed, staged, 'dir');
  }

  const consumer = join(scratch, 'consumer.ts');
  writeFileSync(
    consumer,
    `/// <reference types="@spec-kitty/elements/vue" />\n` +
      `import type { GlobalComponents } from 'vue';\n` +
      `type Matrix = InstanceType<GlobalComponents['sk-transition-matrix']>['$props'];\n` +
      `const columns: NonNullable<Matrix['columns']> = [{ id: 'today', label: 'Today' }];\n` +
      `export { columns };\n`,
  );

  execFileSync(
    process.execPath,
    [
      join(ROOT, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      'false',
      '--moduleResolution',
      'bundler',
      '--module',
      'esnext',
      '--target',
      'esnext',
      consumer,
    ],
    { cwd: scratch, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 },
  );
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
  console.error(
    `❌ Packed Vue types: the packed @spec-kitty/elements declaration does not compile with paths disabled` +
      `${output ? `:\n${output}` : `: ${error.message}`}`,
  );
  process.exitCode = 1;
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (!process.exitCode) {
  console.log('✅ Packed Vue types compile from the real tarball with paths disabled.');
}
