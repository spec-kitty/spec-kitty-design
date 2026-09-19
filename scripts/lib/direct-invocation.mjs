/**
 * "Was this module run, or imported?" — one definition, imported by every script that has a CLI.
 *
 * There were five copies with three different bodies (REL3 pass 5, architect), and the differences
 * mattered: `bump-prerelease.mjs` compared with plain `resolve`, so an invocation through a symlink
 * compared unequal, the module went inert, and `--selftest` printed nothing and exited 0 — a
 * fail-open entry point, indistinguishable from a green run. This is the strict form: realpath BOTH
 * sides, fall back to `resolve` for a path that does not exist, and never throw.
 */
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function isDirectInvocation(argv1, moduleUrl) {
  if (!argv1 || !moduleUrl) return false;
  const real = (x) => {
    try {
      return realpathSync(x);
    } catch {
      return resolve(x);
    }
  };
  try {
    return real(argv1) === real(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
