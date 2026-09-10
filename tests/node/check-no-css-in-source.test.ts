import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * #332 — the "parsed" rendition of check-no-css-in-source.mjs was not actually
 * comment-stripped: `esbuild.transformSync` only drops comments when minifying, and the
 * checker called it with neither `minify` nor `minifyWhitespace`. A doc comment naming a
 * CSS file in backticks — `` `sk-button.css` `` — survived into the "parsed" text and
 * tripped the member-expression pattern (`\.css\``), which exists to catch
 * `lit.css\`…\``, not prose.
 *
 * The fix scopes `minifyWhitespace: true` to the `parsed` rendition only. This is a
 * two-directional proof, run against the real script in a throwaway `packages/elements`
 * tree, because a one-directional fix here is exactly how #332 was introduced in the
 * first place (the narrowing that fixed the false positive could just as easily have
 * quietly defeated the real check).
 */

const CHECKER = resolve(import.meta.dirname, '../../scripts/check-no-css-in-source.mjs');

function runChecker(fileName: string, contents: string): { code: number; out: string } {
  const dir = mkdtempSync(join(tmpdir(), 'check-no-css-in-source-'));
  try {
    const srcDir = join(dir, 'packages/elements/src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, fileName), contents, 'utf8');
    try {
      const stdout = execFileSync(process.execPath, [CHECKER], {
        cwd: dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { code: 0, out: stdout };
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('[gate] check-no-css-in-source — #332 parsed-rendition comment stripping', () => {
  it('a CSS filename in backticks in a doc comment, preceding an object-literal property, passes', () => {
    const { code, out } = runChecker(
      'config.ts',
      [
        '/**',
        ' * Loads styles from `sk-button.css` before constructing the element.',
        ' */',
        'export const options = {',
        '  foo: 1,',
        '};',
        '',
      ].join('\n')
    );
    expect(code, out).toBe(0);
  });

  it('a real `lit.css`…`` member expression still fails', () => {
    const { code, out } = runChecker(
      'bad-styles.ts',
      [
        "import * as lit from 'lit';",
        '',
        'export class Foo {',
        "  static styles = lit.css`:host { display: block; }`;",
        '}',
        '',
      ].join('\n')
    );
    expect(code).toBe(1);
    expect(out).toContain('member expression');
  });
});
