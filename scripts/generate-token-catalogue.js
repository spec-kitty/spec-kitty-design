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

// #438 pass 4: the verdict kinds `compareCatalogue` can return — the single declaration the CODE
// reads. Every return site goes through `mkVerdict`, which refuses a kind absent from this list,
// and the `--selftest` coverage guard reads the same list. (The docstring above documents what
// each kind MEANS; this constant is what is enforced.)
//
// What this does and does not buy, stated precisely — an earlier version of this comment, and the
// commit message that shipped it, claimed the class was closed "by construction", and the pass-4
// gate disproved that. Pass 3's review shrank the guard's then-hardcoded copy to `['match']` in
// the same edit that swapped the stale-content probe away, and the suite stayed green. That
// two-edit mutation now reds: `compareCatalogue` throws on the first non-match probe it reaches
// (the process dies there; the remaining probes never run). But a THREE-edit variant still
// passes — drop the kind, delete the stale probe, and add another non-match probe, and nothing
// reaches the branch that would throw. A fourth variant leaves production untouched by swapping
// one `mkVerdict('stale', …)` for a bare object literal. So the honest claim is: this raises the
// cost of the shrink-and-swap from two coordinated edits to three, and forces the third to be a
// visible production edit. It does not make the guard unbreakable, and the `--selftest` probe
// below that drives `mkVerdict` with a bogus kind is what keeps the one load-bearing `if` alive.
const VERDICT_KINDS = Object.freeze(['invalid-json', 'invalid-generated_at', 'stale', 'reformatted', 'match']);

function mkVerdict(kind, message) {
  if (!VERDICT_KINDS.includes(kind)) {
    throw new Error(`internal: '${kind}' is not a declared verdict kind (VERDICT_KINDS: ${VERDICT_KINDS.join(', ')})`);
  }
  return { verdict: kind, message };
}

function compareCatalogue(freshCatalogue, committedRaw) {
  let committed;
  try {
    committed = JSON.parse(committedRaw);
  } catch (e) {
    return mkVerdict('invalid-json', `not valid JSON: ${e.message}`);
  }
  if (!isValidTimestamp(committed && committed.generated_at)) {
    return mkVerdict(
      'invalid-generated_at',
      'generated_at is absent or invalid (must be a string Date.parse accepts)',
    );
  }
  const contentMatches =
    JSON.stringify(sortKeysDeep(withoutGeneratedAt(committed))) ===
    JSON.stringify(sortKeysDeep(withoutGeneratedAt(freshCatalogue)));
  if (!contentMatches) {
    return mkVerdict('stale', 'content differs from a fresh build, ignoring generated_at');
  }
  // Content matches, order-independent. Now require BYTE-IDENTICAL against the canonical form
  // this generator itself writes, with only the committed timestamp spliced in (the sole field
  // allowed to differ) — `{ ...freshCatalogue, generated_at: ... }` preserves freshCatalogue's
  // own key order, which is the order this generator always writes.
  const canonical = JSON.stringify({ ...freshCatalogue, generated_at: committed.generated_at }, null, 2) + '\n';
  if (committedRaw !== canonical) {
    return mkVerdict(
      'reformatted',
      'content matches but the file is not byte-identical to a canonical regeneration (hand-edited, reordered, or reformatted)',
    );
  }
  return mkVerdict('match', 'matches a fresh, canonical build');
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
  const seenVerdicts = new Set();
  for (const [note, fresh, committedRaw, expectVerdict] of PROBES) {
    if (expectVerdict === 'match') passKind++; else failKind++;
    const { verdict } = compareCatalogue(fresh, committedRaw);
    // Pass 4: record the OBSERVED verdict, not the row's declared expectation. Recording the
    // declaration meant a failing table could print a satisfied coverage guard for a kind no
    // probe actually produced. `bad++` rescued it substantively, but the report was misleading.
    seenVerdicts.add(verdict);
    if (verdict !== expectVerdict) {
      console.error(`  ✗ ${note}: expected verdict '${expectVerdict}', got '${verdict}'`);
      bad++;
    } else {
      console.log(`  ✓ ${note}`);
    }
  }

  // ── Subprocess probes: the `--check` CLI contract (#438 pass 4 — the gate's BLOCKER) ─────────
  // The table above drives `compareCatalogue` as a PURE FUNCTION and never executes the
  // verdict -> EXIT CODE mapping — which is the only part `release-gate` actually consumes. The
  // pass-4 debugger lens found six independent mutations of that mapping that left this file's
  // own --selftest 8/8 green while the real gate passed over a genuinely stale catalogue:
  //
  //   `case 'stale'` -> exit 0 ....... --selftest 8/8 green; --check exit 0 (control: exit 1)
  //   delete the `--check` block ..... --selftest 8/8 green; --check exit 0 AND it SILENTLY
  //                                    REWROTE packages/tokens/dist/token-catalogue.json — the
  //                                    step still present, still green, self-healing the very
  //                                    evidence it exists to police, inside the runner
  //
  // That is the #362 fail-open/silent-fallback shape this PR exists to close, sitting on the PR's
  // own newly-shipped release-gate surface. These probes spawn THIS FILE as a real subprocess
  // against a scratch tree — the shape check-token-breaking-changes.sh already uses one file
  // over — so they exercise the shipped exit codes, not a reimplementation of them (#434).
  //
  // No test hook is added to production code to make this possible: cssPath/outPath are
  // `path.resolve` of RELATIVE paths, so setting `cwd` alone redirects both.
  const { spawnSync } = require('child_process');
  const os = require('os');

  const FIXTURE_CSS = ':root {\n  --sk-color-a: #000;\n  --sk-color-b: #fff;\n}\n';
  const CAT_REL = path.join('packages', 'tokens', 'dist', 'token-catalogue.json');
  const mkTree = (cssText) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokcat-selftest-'));
    fs.mkdirSync(path.join(dir, 'packages', 'tokens', 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'packages', 'tokens', 'src', 'tokens.css'), cssText);
    return dir;
  };
  const run = (dir, args) =>
    spawnSync(process.execPath, [__filename, ...args], { cwd: dir, encoding: 'utf8' });

  // `null` mutate == delete the committed catalogue entirely.
  const CLI_PROBES = [
    ['fresh, byte-identical committed catalogue -> exit 0', (raw) => raw, 0],
    [
      'THE BLOCKER THIS TABLE EXISTS FOR: a token genuinely removed from the committed catalogue -> exit 1',
      (raw) => {
        const o = JSON.parse(raw);
        o.categories.color.tokens = o.categories.color.tokens.slice(0, 1);
        return JSON.stringify(o, null, 2) + '\n';
      },
      1,
    ],
    ['content identical but minified -> exit 1 (reformatted, NFR-006)', (raw) => JSON.stringify(JSON.parse(raw)), 1],
    [
      'generated_at is not a real date -> exit 2 (cannot compare — NOT a content verdict)',
      (raw) => {
        const o = JSON.parse(raw);
        o.generated_at = 'not-a-date';
        return JSON.stringify(o, null, 2) + '\n';
      },
      2,
    ],
    ['committed catalogue is not valid JSON -> exit 2', () => 'not json {', 2],
    ['committed catalogue absent entirely -> exit 2', null, 2],
  ];

  let cliBad = 0;
  const seenExits = new Set();
  for (const [note, mutate, expectExit] of CLI_PROBES) {
    const dir = mkTree(FIXTURE_CSS);
    try {
      const build = run(dir, []);
      if (build.status !== 0) throw new Error(`fixture build failed (${build.status}): ${build.stderr}`);
      const catAbs = path.join(dir, CAT_REL);
      if (mutate === null) fs.rmSync(catAbs);
      else fs.writeFileSync(catAbs, mutate(fs.readFileSync(catAbs, 'utf8')));
      const r = run(dir, ['--check']);
      seenExits.add(r.status);
      if (r.status !== expectExit) {
        console.error(`  ✗ [cli] ${note}: expected exit ${expectExit}, got ${r.status}`);
        console.error(`      ${(r.stderr || r.stdout || '').trim().split('\n')[0]}`);
        cliBad++;
      } else {
        console.log(`  ✓ [cli] ${note}`);
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // The zero-token refusal (`tokenCount === 0`) is cited by check-token-breaking-changes.sh in
  // PROSE as the justification for its own zero-token floor, but nothing asserted it — deleting it
  // left every suite green (pass 4, debugger lens). A cross-file invariant that lives only in a
  // comment is not an invariant.
  {
    const dir = mkTree('/* no --sk-* tokens at all */\n:root { color: red; }\n');
    try {
      const r = run(dir, ['--check']);
      seenExits.add(r.status);
      if (r.status !== 1) {
        console.error(`  ✗ [cli] source CSS defines no --sk-* tokens -> refuse: expected exit 1, got ${r.status}`);
        cliBad++;
      } else {
        console.log('  ✓ [cli] source CSS defines no --sk-* tokens -> refuse (exit 1), never certify an empty catalogue');
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  const CLI_TOTAL = CLI_PROBES.length + 1;

  // `mkVerdict`'s single `if` is the one load-bearing line behind the coverage guard below.
  // Deleting it left the pure table 8/8 green, after which the whole pass-3 defect returns in one
  // edit. The guard's own guard is now a probe rather than a comment.
  let mkVerdictRefusedBogus = false;
  try {
    mkVerdict('not-a-real-kind', 'should never be constructed');
  } catch {
    mkVerdictRefusedBogus = true;
  }
  if (mkVerdictRefusedBogus) {
    console.log('  ✓ [guard] mkVerdict refuses a kind absent from VERDICT_KINDS');
  } else {
    console.error('  ✗ [guard] mkVerdict accepted a bogus verdict kind — the coverage guard is inert');
    cliBad++;
  }

  // Floors OUTSIDE their tables (check-develop-ruleset-parity.mjs's PROBE_FLOOR shape).
  const PROBE_FLOOR = 8;
  if (PROBES.length < PROBE_FLOOR) {
    console.error(`\n❌ the probe table has shrunk: ${PROBES.length} probe(s) against a floor of ${PROBE_FLOOR}.`);
    process.exit(1);
  }
  const CLI_PROBE_FLOOR = 7;
  if (CLI_TOTAL < CLI_PROBE_FLOOR) {
    console.error(`\n❌ the --check probe table has shrunk: ${CLI_TOTAL} probe(s) against a floor of ${CLI_PROBE_FLOOR}.`);
    process.exit(1);
  }
  // Exit-code coverage, the CLI analogue of the verdict-kind guard: all three documented outcomes
  // (0 clean, 1 content verdict, 2 cannot compare) must be observed from a real subprocess, so
  // the table cannot drift into asserting only one of them.
  const missingExits = [0, 1, 2].filter((e) => !seenExits.has(e));
  if (missingExits.length > 0) {
    console.error(`\n❌ refusing to report green: no --check probe observes exit code(s): ${missingExits.join(', ')}.`);
    process.exit(1);
  }
  // #438 pass 2, finding F8, corrected in pass 3: a pass/fail SPLIT floor alone does not protect
  // any one verdict kind. Swapping the single stale-content probe — the ENTIRE reason this table
  // exists (pass 2, finding A) — for another non-match probe (e.g. a second 'invalid-json' case)
  // keeps the split non-degenerate (still 2 match / 6 non-match) and the total unchanged, so that
  // guard alone would go green with the one probe the table exists for gone. Asserting every
  // VERDICT KIND `compareCatalogue` can return is covered is what actually prevents that swap.
  // Pass 4: this is no longer a second hardcoded copy of the kind list. It reads VERDICT_KINDS —
  // the same declaration `mkVerdict` validates every `compareCatalogue` return against — so the
  // "shrink the guard and swap the probe in one edit" mutation now reds (see VERDICT_KINDS).
  const missingVerdicts = VERDICT_KINDS.filter((v) => !seenVerdicts.has(v));
  if (missingVerdicts.length > 0) {
    console.error(`\n❌ refusing to report green: no probe covers verdict kind(s): ${missingVerdicts.join(', ')}.`);
    process.exit(1);
  }
  if (bad || cliBad) {
    console.error(`\n❌ ${bad} of ${PROBES.length} compareCatalogue probe(s) and ${cliBad} of ${CLI_TOTAL} --check subprocess probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(
    `\n✅ All ${PROBES.length} compareCatalogue probes (${passKind} expect-match, ${failKind} expect-non-match) ` +
      `and all ${CLI_TOTAL} --check subprocess probes behaved as recorded.`,
  );
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
  let verdict;
  let message;
  try {
    ({ verdict, message } = compareCatalogue(catalogue, committedRaw));
  } catch (e) {
    // Pass 4: `mkVerdict`'s throw was uncaught here, so an internal wiring error exited 1 with a
    // raw stack trace — and 1 is documented above as "a real content verdict (stale, or
    // byte-non-canonical)". An internal error was therefore indistinguishable, by exit code, from
    // a legitimately stale catalogue. It is a precondition failure, so it exits 2, matching the
    // `default:` arm it sits beside.
    console.error(`❌ Cannot compare: internal error in compareCatalogue: ${e.message}`);
    process.exit(2);
  }
  switch (verdict) {
    case 'invalid-json':
    case 'invalid-generated_at':
      console.error(`❌ Cannot compare: ${outPath}: ${message}.`);
      process.exit(2);
      break; // unreachable after process.exit; kept so every arm reads the same
    case 'stale':
      console.error(`❌ ${outPath} is stale relative to ${cssPath} (${message}).`);
      console.error('   Run: node scripts/generate-token-catalogue.js');
      process.exit(1);
      break; // unreachable after process.exit; kept so every arm reads the same
    case 'reformatted':
      console.error(`❌ ${outPath} is NOT stale, but ${message}.`);
      console.error('   NFR-006 requires generated outputs to regenerate byte-identically; run: node scripts/generate-token-catalogue.js');
      process.exit(1);
      break; // unreachable after process.exit; kept so every arm reads the same
    case 'match':
      console.log(`✅ ${outPath} ${message} from ${cssPath} (${tokenCount} tokens, generated_at excluded).`);
      process.exit(0);
      break; // unreachable after process.exit; kept so every arm reads the same
    default:
      // Pass 4: 'match' used to BE this `default:`, which made the success path the fallback —
      // any verdict kind added later without a branch here would have printed ✅ and exited 0.
      // Unreachable while `mkVerdict` guards every return; failing closed regardless.
      console.error(`❌ internal: unhandled verdict '${verdict}' from compareCatalogue.`);
      process.exit(2);
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(catalogue, null, 2) + '\n');

console.log(`Generated token catalogue: ${tokenCount} tokens across ${Object.keys(categories).length} categories`);
console.log(`Output: ${outPath}`);
