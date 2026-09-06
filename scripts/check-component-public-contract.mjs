#!/usr/bin/env node

/**
 * Assert exact per-component ::part() contracts from a Custom Elements Manifest.
 *
 * Usage:
 *   node scripts/check-component-public-contract.mjs --manifest path \
 *     --tag sk-example=root,label --tag sk-other=list,item
 *   node scripts/check-component-public-contract.mjs --selftest
 *
 * The aggregate ratchet deliberately permits shrinkage. This gate is the exact, local
 * counterpart: missing, extra, duplicated, and vacuously empty part sets all fail.
 */

import { readFileSync } from 'node:fs';

const declarations = (manifest) =>
  (manifest.modules ?? []).flatMap((module) => module.declarations ?? []);

const checkTag = (manifest, tagName, expectedParts) => {
  const errors = [];
  const matches = declarations(manifest).filter((declaration) => declaration.tagName === tagName);
  if (matches.length !== 1) {
    return [`${tagName}: expected exactly one tagged declaration, found ${matches.length}`];
  }

  const actual = (matches[0].cssParts ?? []).map((part) => part.name);
  if (expectedParts.length === 0) errors.push(`${tagName}: expected part set must not be empty`);
  if (actual.length === 0) errors.push(`${tagName}: manifest declares zero parts`);

  for (const [label, values] of [['expected', expectedParts], ['manifest', actual]]) {
    const duplicates = [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
    if (duplicates.length > 0) errors.push(`${tagName}: duplicate ${label} part(s): ${duplicates.join(', ')}`);
  }

  const expected = new Set(expectedParts);
  const present = new Set(actual);
  const missing = [...expected].filter((part) => !present.has(part)).sort();
  const extra = [...present].filter((part) => !expected.has(part)).sort();
  if (missing.length > 0) errors.push(`${tagName}: missing part(s): ${missing.join(', ')}`);
  if (extra.length > 0) errors.push(`${tagName}: extra part(s): ${extra.join(', ')}`);
  return errors;
};

const parseArgs = (args) => {
  let manifestPath;
  const expectations = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--manifest') manifestPath = args[++index];
    else if (arg === '--tag') {
      const value = args[++index] ?? '';
      const equals = value.indexOf('=');
      if (equals < 1) throw new Error(`invalid --tag value ${JSON.stringify(value)}; expected name=part,...`);
      const tagName = value.slice(0, equals);
      const parts = value.slice(equals + 1).split(',').filter(Boolean);
      expectations.push([tagName, parts]);
    } else throw new Error(`unknown argument: ${arg}`);
  }
  if (!manifestPath) throw new Error('--manifest is required');
  if (expectations.length === 0) throw new Error('at least one --tag expectation is required');
  return { manifestPath, expectations };
};

const selftest = () => {
  const manifest = {
    modules: [{ declarations: [{ tagName: 'sk-probe', cssParts: [{ name: 'root' }, { name: 'label' }] }] }],
  };
  const probes = [
    ['exact contract passes', ['root', 'label'], 0],
    ['missing declaration is detected', ['root', 'label', 'value'], 1],
    ['extra declaration is detected', ['root'], 1],
    ['duplicate expectation is detected', ['root', 'root', 'label'], 1],
    ['zero expected parts is detected', [], 2],
  ];
  let failures = 0;
  for (const [label, expected, minimumErrors] of probes) {
    const errors = checkTag(manifest, 'sk-probe', expected);
    if (minimumErrors === 0 ? errors.length !== 0 : errors.length < minimumErrors) {
      console.error(`  ✗ ${label}: ${JSON.stringify(errors)}`);
      failures++;
    }
  }
  const duplicateManifest = {
    modules: [{ declarations: [{ tagName: 'sk-probe', cssParts: [{ name: 'root' }, { name: 'root' }] }] }],
  };
  if (!checkTag(duplicateManifest, 'sk-probe', ['root']).some((error) => error.includes('duplicate manifest'))) {
    console.error('  ✗ duplicate manifest declaration was not detected');
    failures++;
  }
  if (failures > 0) process.exit(1);
  console.log(`✅ ${probes.length + 1} exact public-contract probes passed (including missing and extra parts).`);
};

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  try {
    const { manifestPath, expectations } = parseArgs(process.argv.slice(2));
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const errors = expectations.flatMap(([tagName, parts]) => checkTag(manifest, tagName, parts));
    if (errors.length > 0) {
      console.error(`❌ exact component public contract failed:\n${errors.map((error) => `   ${error}`).join('\n')}`);
      process.exit(1);
    }
    console.log(`✅ ${expectations.length} component part contract(s) match the manifest exactly.`);
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
