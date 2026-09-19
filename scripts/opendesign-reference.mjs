#!/usr/bin/env node
/**
 * Load OpenDesign's own reference code — REL4 (#396).
 *
 * WHY VENDORED RATHER THAN RE-IMPLEMENTED. The OpenDesign package this repository ships has to pass
 * OpenDesign's validator and carry the `components.manifest.json` OpenDesign itself would derive —
 * because OpenDesign REGENERATES that file on import (`apps/daemon/src/design-systems/import.ts:156`)
 * and silently discards anything it did not produce. A copy of the schema rewritten here would share
 * the blind spots of whoever rewrote it; the reference code cannot disagree with itself.
 *
 * Both upstream files have zero imports, so they run standalone. They are verified against the
 * sha256 recorded in `vendor/open-design/DIGESTS.json` BEFORE they are imported, so an edited copy
 * is refused rather than trusted — a vendored file anyone can hand-tweak is a re-implementation with
 * extra steps.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, cpSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const VENDOR_DIR = join(HERE, 'vendor', 'open-design');

/**
 * PURE over a directory: every file DIGESTS.json names exists and matches its sha256. Returns a list
 * of problems; empty means verified. Refuses an empty digest manifest — verifying zero files is not
 * verification.
 */
export function verifyVendor(dir = VENDOR_DIR) {
  const problems = [];
  let digests;
  try {
    digests = JSON.parse(readFileSync(join(dir, 'DIGESTS.json'), 'utf8'));
  } catch (e) {
    return [`cannot read ${join(dir, 'DIGESTS.json')}: ${e.message}`];
  }
  const entries = Object.entries(digests.files ?? {});
  if (entries.length === 0) return ['DIGESTS.json names no files — refusing to certify an empty vendor set'];
  if (!/^[0-9a-f]{40}$/.test(String(digests.commit ?? ''))) {
    problems.push(`DIGESTS.json commit ${JSON.stringify(digests.commit)} is not a full 40-character SHA`);
  }
  for (const [file, { sha256, upstreamPath }] of entries) {
    let actual;
    try {
      actual = createHash('sha256').update(readFileSync(join(dir, file))).digest('hex');
    } catch {
      problems.push(`${file} is missing (upstream ${upstreamPath})`);
      continue;
    }
    if (actual !== sha256) {
      problems.push(
        `${file} does not match upstream ${upstreamPath} at ${digests.commit}: sha256 ${actual} ` +
          `!= recorded ${sha256}. Vendored reference code must be byte-identical to upstream.`,
      );
    }
  }
  return problems;
}

/** Verify, then import. Throws on any digest problem so no caller can use an unverified copy. */
export async function loadReference(dir = VENDOR_DIR) {
  const problems = verifyVendor(dir);
  if (problems.length) throw new Error(`OpenDesign reference refused:\n  - ${problems.join('\n  - ')}`);
  const cm = await import(pathToFileURL(join(dir, 'components-manifest.ts')).href);
  const ms = await import(pathToFileURL(join(dir, 'manifest.schema.ts')).href);
  for (const [name, fn] of [
    ['extractComponentsManifest', cm.extractComponentsManifest],
    ['validateDesignSystemProjectManifest', ms.validateDesignSystemProjectManifest],
  ]) {
    if (typeof fn !== 'function') throw new Error(`OpenDesign reference is missing ${name}`);
  }
  return {
    extractComponentsManifest: cm.extractComponentsManifest,
    validateDesignSystemProjectManifest: ms.validateDesignSystemProjectManifest,
    COMPONENTS_MANIFEST_SCHEMA_VERSION: cm.COMPONENTS_MANIFEST_SCHEMA_VERSION,
    DESIGN_SYSTEM_PROJECT_SCHEMA_VERSION: ms.DESIGN_SYSTEM_PROJECT_SCHEMA_VERSION,
  };
}

export function isDirectInvocation(argv1, moduleUrl) {
  if (!argv1 || !moduleUrl) return false;
  const real = (x) => {
    try {
      return realpathSync(x);
    } catch {
      return resolve(x);
    }
  };
  return real(argv1) === real(fileURLToPath(moduleUrl));
}

/* ─────────────────────────────── --selftest ─────────────────────────────── */

/** Copy the vendor dir, apply a mutation, and report what verifyVendor says. */
function mutated(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'od-vendor-'));
  try {
    cpSync(VENDOR_DIR, dir, { recursive: true });
    mutate(dir);
    return verifyVendor(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const PROBES = [
  ['the committed vendor set verifies (control)', () => verifyVendor().length === 0],
  [
    'a ONE-BYTE change to components-manifest.ts is refused',
    () =>
      mutated((d) => {
        const f = join(d, 'components-manifest.ts');
        const b = readFileSync(f);
        b[b.length - 2] = b[b.length - 2] === 0x20 ? 0x21 : 0x20;
        writeFileSync(f, b);
      }).length === 1,
  ],
  [
    'a ONE-BYTE change to manifest.schema.ts is refused',
    () =>
      mutated((d) => {
        const f = join(d, 'manifest.schema.ts');
        const b = readFileSync(f);
        b[10] = b[10] === 0x20 ? 0x21 : 0x20;
        writeFileSync(f, b);
      }).length === 1,
  ],
  ['a deleted vendored file is refused', () => mutated((d) => rmSync(join(d, 'manifest.schema.ts'))).length === 1],
  [
    'an empty digest manifest is refused, not certified',
    () =>
      mutated((d) => {
        const p = join(d, 'DIGESTS.json');
        const j = JSON.parse(readFileSync(p, 'utf8'));
        writeFileSync(p, JSON.stringify({ ...j, files: {} }));
      }).length === 1,
  ],
  [
    'an abbreviated commit SHA is refused',
    () =>
      mutated((d) => {
        const p = join(d, 'DIGESTS.json');
        const j = JSON.parse(readFileSync(p, 'utf8'));
        writeFileSync(p, JSON.stringify({ ...j, commit: j.commit.slice(0, 10) }));
      }).some((x) => x.includes('40-character')),
  ],
];
const PROBE_FLOOR = 6;

async function selftest() {
  let bad = 0;
  for (const [what, fn] of PROBES) {
    let ok = false;
    try {
      ok = fn() === true;
    } catch (e) {
      console.error(`  probe threw: ${what} — ${e.message}`);
    }
    console.log(`${ok ? '✅' : '❌'} ${what}`);
    if (!ok) bad++;
  }
  // And the loaded reference actually works: an effect probe over real code, not just its digest.
  try {
    const ref = await loadReference();
    const m = ref.extractComponentsManifest({
      brandId: 'probe',
      fixtureHtml: '<!doctype html><title>t</title><style>:root{--a:1}.x{color:var(--a)}</style><div class="x"></div>',
      tokensCss: ':root{--a:1}',
    });
    const ok = m.brandId === 'probe' && m.fixture.styleBlockCount === 1 && m.tokens.declared.includes('--a');
    console.log(`${ok ? '✅' : '❌'} the verified reference loads and derives a manifest from real HTML`);
    if (!ok) bad++;
  } catch (e) {
    console.log(`❌ the verified reference loads and derives a manifest from real HTML — ${e.message}`);
    bad++;
  }
  if (bad) {
    console.error(`\n❌ ${bad} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  if (PROBES.length < PROBE_FLOOR) {
    console.error(`\n❌ only ${PROBES.length} probes — the floor is ${PROBE_FLOOR}`);
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} vendor probes and the reference load behaved as recorded.`);
}

if (isDirectInvocation(process.argv[1], import.meta.url)) {
  const known = new Set(['--selftest', '--check']);
  const stray = process.argv.slice(2).filter((a) => !known.has(a));
  if (stray.length) {
    console.error(`::error::unrecognised argument(s): ${stray.join(' ')}`);
    process.exit(2);
  }
  if (process.argv.includes('--selftest')) {
    await selftest();
  } else {
    const problems = verifyVendor();
    if (problems.length) {
      console.error(`❌ vendored OpenDesign reference does not match upstream:\n  - ${problems.join('\n  - ')}`);
      process.exit(1);
    }
    console.log('✅ vendored OpenDesign reference matches upstream byte-for-byte.');
  }
}
