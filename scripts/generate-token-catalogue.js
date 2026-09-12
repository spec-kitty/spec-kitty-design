#!/usr/bin/env node
// Parses --sk-* custom properties from tokens.css and writes token-catalogue.json
// Usage: node scripts/generate-token-catalogue.js           # regenerate
//        node scripts/generate-token-catalogue.js --check   # drift check (#438 F11)
// Output: packages/tokens/dist/token-catalogue.json

'use strict';

const fs = require('fs');
const path = require('path');

const cssPath = path.resolve('packages/tokens/src/tokens.css');
const outPath = path.resolve('packages/tokens/dist/token-catalogue.json');
const CHECK = process.argv.includes('--check');

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

// #438 F11: nothing verified that the COMMITTED `token-catalogue.json` matched a fresh build —
// `check-token-breaking-changes.sh` (release-gate) compares the committed CURRENT catalogue
// against a committed PREVIOUS one, and a hand-edited or stale committed catalogue would make
// that comparison silently commit-to-commit rather than source-to-source. `--check` closes that
// without changing the generator's normal (no-argument) behaviour at all.
//
// `generated_at` is EXCLUDED from the comparison on both sides: it is a timestamp that changes
// on every single run by design (see the field itself, three lines below), so comparing it would
// make `--check` fail on a byte-for-byte faithful regeneration — the exact "green over content
// that never actually changed, red over content that never actually drifted" shape a drift check
// must not have. Every OTHER field is compared, including `schema_version` and `generated_from`.
function withoutGeneratedAt(obj) {
  const { generated_at, ...rest } = obj;
  void generated_at;
  return rest;
}

if (CHECK) {
  if (!fs.existsSync(outPath)) {
    console.error(`❌ ${outPath} does not exist. Run: node scripts/generate-token-catalogue.js`);
    process.exit(1);
  }
  let committed;
  try {
    committed = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } catch (e) {
    console.error(`❌ ${outPath} is not valid JSON: ${e.message}. Run: node scripts/generate-token-catalogue.js`);
    process.exit(1);
  }
  const committedRest = JSON.stringify(withoutGeneratedAt(committed));
  const freshRest = JSON.stringify(withoutGeneratedAt(catalogue));
  if (committedRest !== freshRest) {
    console.error(
      `❌ ${outPath} is stale relative to ${cssPath} (ignoring the volatile 'generated_at' timestamp).`,
    );
    console.error('   Run: node scripts/generate-token-catalogue.js');
    process.exit(1);
  }
  console.log(`✅ ${outPath} matches a fresh build from ${cssPath} (${tokenCount} tokens, generated_at excluded).`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(catalogue, null, 2) + '\n');

console.log(`Generated token catalogue: ${tokenCount} tokens across ${Object.keys(categories).length} categories`);
console.log(`Output: ${outPath}`);
