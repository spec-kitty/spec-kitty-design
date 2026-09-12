#!/usr/bin/env node
// Parses --sk-* custom properties from tokens.css and writes token-catalogue.json
// Usage: node scripts/generate-token-catalogue.js           # regenerate
//        node scripts/generate-token-catalogue.js --check   # drift check (#438 F11)
//        node scripts/generate-token-catalogue.js --selftest # probe table (#438 pass 2, finding A)
// Output: packages/tokens/dist/token-catalogue.json

'use strict';

const fs = require('fs');
const path = require('path');

const cssPath = path.resolve('packages/tokens/src/tokens.css');
const outPath = path.resolve('packages/tokens/dist/token-catalogue.json');

/** `generated_at` must be a string `Date.parse` accepts. Matches the ratified read-only
 *  comparator's own contract (NFR-006): `kitty-specs/team-overview-shell-elements-01M1S8R8/
 *  plan.md:383-386` throws `'token catalogue generated_at is absent or invalid'` for exactly
 *  this. #438 pass 2, finding B: a garbage or missing timestamp must not be silently stripped
 *  and then certify as "matches" — it never reached a Date.parse check at all before this. */
function isValidTimestamp(v) {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

/** `{ ...obj }` minus `generated_at` — the one field a drift check must never compare, because
 *  it changes on every single run by design. */
function withoutGeneratedAt(obj) {
  const { generated_at, ...rest } = obj;
  void generated_at;
  return rest;
}

/** Recursively sort object keys (arrays keep their element order — only key ORDER within an
 *  object is normalized). Used to tell "the content actually differs" apart from "the content
 *  is the same but a key got reordered by hand" — #438 pass 2, finding C. */
function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeysDeep(value[key]);
    return out;
  }
  return value;
}

/**
 * Compare a freshly-built catalogue object against the COMMITTED file's raw text. Pure — no
 * disk I/O — so `--selftest` can drive it directly with fixtures, exercising the real
 * comparison code rather than a reimplementation of it (the #434 mistake this mission keeps
 * being warned about; #438 pass 2 finding A: this had zero probes and its own neutered-
 * comparison mutant survived silently).
 *
 * Returns `{ verdict, message }`, where `verdict` is one of:
 *   'invalid-json'         — committedRaw does not parse as JSON
 *   'invalid-generated_at' — committed.generated_at is missing or not Date.parse-able
 *   'stale'                — the CONTENT (every field except generated_at, order-independent)
 *                             differs from a fresh build — a real regeneration is needed
 *   'reformatted'          — the content is identical, but committedRaw is not byte-identical
 *                             to the canonical serialization this generator itself writes
 *                             (hand-edited, key-reordered, minified, re-indented, ...) — #438
 *                             pass 2 finding C: NOT the same claim as 'stale', so it gets its
 *                             own message; every sibling drift gate in this repo compares
 *                             bytes, and a parsed-object-only compare would pass a minified
 *                             copy of a real catalogue even though `git diff` shows it fully
 *                             rewritten.
 *   'match'                — genuinely a fresh, canonical build (generated_at aside)
 */
function compareCatalogue(freshCatalogue, committedRaw) {
  let committed;
  try {
    committed = JSON.parse(committedRaw);
  } catch (e) {
    return { verdict: 'invalid-json', message: `not valid JSON: ${e.message}` };
  }
  if (!isValidTimestamp(committed && committed.generated_at)) {
    return {
      verdict: 'invalid-generated_at',
      message: 'generated_at is absent or invalid (must be a string Date.parse accepts)',
    };
  }
  const contentMatches =
    JSON.stringify(sortKeysDeep(withoutGeneratedAt(committed))) ===
    JSON.stringify(sortKeysDeep(withoutGeneratedAt(freshCatalogue)));
  if (!contentMatches) {
    return { verdict: 'stale', message: 'content differs from a fresh build, ignoring generated_at' };
  }
  // Content matches, order-independent. Now require BYTE-IDENTICAL against the canonical form
  // this generator itself writes, with only the committed timestamp spliced in (the sole field
  // allowed to differ) — `{ ...freshCatalogue, generated_at: ... }` preserves freshCatalogue's
  // own key order, which is the order this generator always writes.
  const canonical = JSON.stringify({ ...freshCatalogue, generated_at: committed.generated_at }, null, 2) + '\n';
  if (committedRaw !== canonical) {
    return {
      verdict: 'reformatted',
      message: 'content matches but the file is not byte-identical to a canonical regeneration (hand-edited, reordered, or reformatted)',
    };
  }
  return { verdict: 'match', message: 'matches a fresh, canonical build' };
}

// ── --selftest: fixture pairs, no disk I/O, floor outside the table (#438 pass 2, finding A) ──
if (process.argv.includes('--selftest')) {
  const base = {
    schema_version: '1.0.0',
    generated_at: '2026-01-01T00:00:00.000Z',
    generated_from: 'packages/tokens/src/tokens.css',
    categories: { color: { prefix: '--sk-color-', tokens: ['--sk-color-a', '--sk-color-b'] } },
  };
  const canon = (obj) => JSON.stringify(obj, null, 2) + '\n';

  const PROBES = [
    ['a fresh, byte-identical build', base, canon(base), 'match'],
    [
      'generated_at differs (both valid) but content is otherwise identical -> still a match',
      base,
      canon({ ...base, generated_at: '2099-12-31T23:59:59.000Z' }),
      'match',
    ],
    [
      'THE MUTANT THIS PROBE EXISTS FOR: stale content (a token genuinely removed) -> must NOT match',
      base,
      canon({ ...base, categories: { color: { prefix: '--sk-color-', tokens: ['--sk-color-a'] } } }),
      'stale',
    ],
    [
      'content identical, top-level keys reordered by hand -> "reformatted", not "stale"',
      base,
      JSON.stringify(
        { generated_from: base.generated_from, categories: base.categories, schema_version: base.schema_version, generated_at: base.generated_at },
        null,
        2,
      ) + '\n',
      'reformatted',
    ],
    [
      'content identical, minified (no drift a parsed-object compare alone would see) -> "reformatted"',
      base,
      JSON.stringify(base),
      'reformatted',
    ],
    ['generated_at missing entirely -> refuse before comparing content', base, canon({ ...base, generated_at: undefined }), 'invalid-generated_at'],
    ['generated_at is not a real date -> refuse before comparing content', base, canon({ ...base, generated_at: 'not-a-date' }), 'invalid-generated_at'],
    ['committed file is not valid JSON at all -> refuse', base, 'not json {', 'invalid-json'],
  ];

  let bad = 0;
  let passKind = 0;
  let failKind = 0;
  for (const [note, fresh, committedRaw, expectVerdict] of PROBES) {
    if (expectVerdict === 'match') passKind++; else failKind++;
    const { verdict } = compareCatalogue(fresh, committedRaw);
    if (verdict !== expectVerdict) {
      console.error(`  ✗ ${note}: expected verdict '${expectVerdict}', got '${verdict}'`);
      bad++;
    } else {
      console.log(`  ✓ ${note}`);
    }
  }

  // Floor OUTSIDE the table (check-develop-ruleset-parity.mjs's PROBE_FLOOR shape), AND #438 F8's
  // degenerate-split refusal: the total floor alone lets the single stale-content probe — the
  // ENTIRE reason this table exists (pass 2, finding A) — be swapped out for another match-kind
  // probe with the total unchanged.
  const FLOOR = 8;
  if (PROBES.length < FLOOR) {
    console.error(`\n❌ the probe table has shrunk: ${PROBES.length} probe(s) against a floor of ${FLOOR}.`);
    process.exit(1);
  }
  if (passKind === 0 || failKind === 0) {
    console.error(`\n❌ refusing to report green over a degenerate probe set: ${passKind} expect-match, ${failKind} expect-non-match.`);
    process.exit(1);
  }
  if (bad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(`\n✅ All ${PROBES.length} generate-token-catalogue.js --check probes behaved as recorded (${passKind} expect-match, ${failKind} expect-non-match).`);
  process.exit(0);
}

if (!fs.existsSync(cssPath)) {
  console.error(`ERROR: Source file not found: ${cssPath}`);
  process.exit(1);
}

const css = fs.readFileSync(cssPath, 'utf8');
const categories = {};

// Match --sk-<category>-<name> property declarations.
// The regex captures the full property name and the category prefix.
// Property names may contain letters, digits and hyphens after the prefix.
for (const match of css.matchAll(/\s(--sk-([a-z][a-z0-9]*)(?:-[a-z0-9]+)+)\s*:/g)) {
  const propName = match[1];          // e.g. --sk-color-yellow
  const category = match[2];          // e.g. color

  if (!categories[category]) {
    categories[category] = {
      prefix: `--sk-${category}-`,
      tokens: [],
    };
  }

  if (!categories[category].tokens.includes(propName)) {
    categories[category].tokens.push(propName);
  }
}

const tokenCount = Object.values(categories).reduce((sum, c) => sum + c.tokens.length, 0);

if (tokenCount === 0) {
  console.error('ERROR: No --sk-* tokens found. Check the CSS file path and content.');
  process.exit(1);
}

const catalogue = {
  schema_version: '1.0.0',
  generated_at: new Date().toISOString(),
  generated_from: 'packages/tokens/src/tokens.css',
  categories,
};

if (process.argv.includes('--check')) {
  // #438 F11: nothing verified that the COMMITTED `token-catalogue.json` matched a fresh build —
  // `check-token-breaking-changes.sh` (release-gate) compares the committed CURRENT catalogue
  // against a committed PREVIOUS one, and a hand-edited or stale committed catalogue would make
  // that comparison silently commit-to-commit rather than source-to-source. `--check` closes
  // that without changing the generator's normal (no-argument) behaviour at all.
  //
  // Exit codes deliberately mirror check-token-breaking-changes.sh's convention (#438 pass 2,
  // "smaller" finding): 2 is "cannot compare" (missing/unparseable committed file, or a
  // generated_at that fails its own contract) — a precondition failure, not a content verdict.
  // 1 is a real content verdict (stale, or byte-non-canonical).
  if (!fs.existsSync(outPath)) {
    console.error(`❌ Cannot compare: ${outPath} does not exist. Run: node scripts/generate-token-catalogue.js`);
    process.exit(2);
  }
  const committedRaw = fs.readFileSync(outPath, 'utf8');
  const { verdict, message } = compareCatalogue(catalogue, committedRaw);
  switch (verdict) {
    case 'invalid-json':
    case 'invalid-generated_at':
      console.error(`❌ Cannot compare: ${outPath}: ${message}.`);
      process.exit(2);
      break; // unreachable, kept for clarity
    case 'stale':
      console.error(`❌ ${outPath} is stale relative to ${cssPath} (${message}).`);
      console.error('   Run: node scripts/generate-token-catalogue.js');
      process.exit(1);
      break;
    case 'reformatted':
      console.error(`❌ ${outPath} is NOT stale, but ${message}.`);
      console.error('   NFR-006 requires generated outputs to regenerate byte-identically; run: node scripts/generate-token-catalogue.js');
      process.exit(1);
      break;
    default:
      console.log(`✅ ${outPath} ${message} from ${cssPath} (${tokenCount} tokens, generated_at excluded).`);
      process.exit(0);
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(catalogue, null, 2) + '\n');

console.log(`Generated token catalogue: ${tokenCount} tokens across ${Object.keys(categories).length} categories`);
console.log(`Output: ${outPath}`);
