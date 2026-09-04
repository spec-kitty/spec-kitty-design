#!/usr/bin/env node
/**
 * The Subresource Integrity hash for the classic-script bundle (#80, FR-005, SC-007).
 *
 * A consumer loading `dist/elements.js` from a CDN needs a hash to pin what their page executes.
 * ADR-10 §2 makes that bundle a first-class distribution entry; without a published integrity
 * value the CDN path is the one distribution route with no way to detect substitution.
 *
 * GENERATED AND COMMITTED, with a `--check` that re-derives — the same contract as SIZES.md and
 * every other generated artifact here. A hash written into prose is precisely the "companion
 * number that nothing re-derives" suite-budget.json argues against at length, and it would go
 * stale on the first rebuild with nothing to notice.
 *
 * BUILD BEFORE YOU MEASURE. `nx` serves `build` from cache, so a `--check` can compare a stale
 * dist/ against a hash derived from that same stale dist/ — self-consistent and wrong. #140 and
 * #143 were both bitten by it. CI runs this after an explicit build; locally, pass
 * --skip-nx-cache to the build first.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = 'packages/elements/dist/elements.js';
const RECORD = 'packages/elements/INTEGRITY.json';
const ALGO = 'sha384'; // the SRI default; sha256 is permitted but weaker, sha512 is longer for no gain

function derive() {
  const abs = join(ROOT, BUNDLE);
  if (!existsSync(abs)) {
    console.error(
      `❌ ${BUNDLE} does not exist. It is the IIFE build output and dist/ is gitignored, so this ` +
        `must run AFTER \`nx run elements:build\`. Refusing to record a hash of nothing.`,
    );
    process.exit(1);
  }
  const bytes = readFileSync(abs);
  if (bytes.length === 0) {
    console.error(`❌ ${BUNDLE} is empty — a hash of zero bytes is not an integrity guarantee`);
    process.exit(1);
  }
  return {
    file: BUNDLE,
    bytes: bytes.length,
    integrity: `${ALGO}-${createHash(ALGO).update(bytes).digest('base64')}`,
  };
}

const derived = derive();
const check = process.argv.includes('--check');

if (!check) {
  writeFileSync(join(ROOT, RECORD), JSON.stringify(derived, null, 2) + '\n');
  console.log(`✅ ${RECORD}\n   ${derived.integrity}\n   ${derived.bytes} bytes`);
} else {
  if (!existsSync(join(ROOT, RECORD))) {
    console.error(`❌ ${RECORD} is missing — run \`node scripts/build-elements-integrity.mjs\``);
    process.exit(1);
  }
  const recorded = JSON.parse(readFileSync(join(ROOT, RECORD), 'utf8'));
  const drift = ['file', 'bytes', 'integrity'].filter((k) => recorded[k] !== derived[k]);
  if (drift.length) {
    console.error(`❌ ${RECORD} is stale — ${drift.join(', ')} differ from the built bundle:`);
    for (const k of drift) console.error(`   ${k}: recorded ${recorded[k]}  built ${derived[k]}`);
    console.error(`\n   Run: npx nx run elements:build --skip-nx-cache && node scripts/build-elements-integrity.mjs`);
    process.exit(1);
  }
  console.log(`✅ ${RECORD} matches the built bundle (${derived.bytes} bytes, ${derived.integrity.slice(0, 24)}…)`);
}
