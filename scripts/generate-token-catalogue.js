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
// (the process dies there; the remaining probes never run).
//
// The cost of defeating it, RE-DERIVED against this tree after the pass-5 gate falsified two
// earlier attempts at this same sentence — first by overstating ("closed by construction"), then
// by understating. Both were written against a tree they no longer described. Executed here:
//   · drop the kind + swap the pure stale probe ............ REDS (mkVerdict throws)
//   · + delete the stale probe entirely .................... REDS — the `--check` subprocess row
//     drives production into `mkVerdict('stale', …)` inside the spawned process, so `--check`
//     exits 2 where the probe expects 1. The CLI table below is what kills this one.
//   · drop the kind + swap `return mkVerdict('stale', …)` for a bare object literal + swap the
//     pure stale probe ...................................... PASSES.
// So the minimum surviving path is three edits, TWO OF THEM IN PRODUCTION (`VERDICT_KINDS`, and
// the return site inside `compareCatalogue`, which is what `--check` calls). The bare-literal
// swap leaves VERDICT_KINDS untouched — not production. This guard is not unbreakable; it makes
// the break visible in a production diff instead of hiding it in a test table. The `[guard]`
// probe below keeps the one load-bearing `if` alive.
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
  // against a scratch tree — the shape check-token-breaking-changes.sh already uses one file over.
  //
  // SCOPE, stated precisely (pass 5, reviewer lens): the fixture catalogue is built by the script
  // under test, so both sides of every comparison come from the same binary. This table therefore
  // pins the COMPARISON CONTRACT — verdict, message and exit code — and NOT the content the
  // generator extracts. A generator that corrupts extraction consistently passes here; what
  // catches that is `release-gate` running `--check` against the repo's real committed catalogue.
  //
  // No test hook is added to production code to make this possible: cssPath/outPath are
  // `path.resolve` of RELATIVE paths, so setting `cwd` alone redirects both. That property is the
  // seam the whole table rests on, so the `scratch-cwd` row below ASSERTS it rather than trusting
  // this comment (pass 5, architect lens).
  const { spawnSync } = require('child_process');
  const os = require('os');

  const FIXTURE_CSS = ':root {\n  --sk-color-a: #000;\n  --sk-color-b: #fff;\n}\n';
  const CAT_REL = path.join('packages', 'tokens', 'dist', 'token-catalogue.json');
  const mkTree = (cssText) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokcat-selftest-'));
    fs.mkdirSync(path.join(dir, 'packages', 'tokens', 'src'), { recursive: true });
    if (cssText !== null) fs.writeFileSync(path.join(dir, 'packages', 'tokens', 'src', 'tokens.css'), cssText);
    return dir;
  };
  // Pinned so a mutant cannot point the table at a different file and certify that instead
  // (pass 5, debugger lens: two added lines spawning `git show HEAD:…` gave a green selftest and a
  // real fail-open).
  const SPAWN_TARGET = __filename;
  // Whatever is spawned must be BYTE-IDENTICAL to the file under test, checked at each spawn.
  //
  // Pass 6, debugger lens: the previous form (`SPAWN_TARGET === __filename`) guarded the CONSTANT,
  // not the spawn. Leaving both the constant and its assertion untouched and repointing `run()`'s
  // own argument at a pristine copy was green while production's stale arm exited 0 — a real
  // fail-open, and the assertion added zero cost against anyone who noticed. A name cannot express
  // "the code under test"; content can. A repoint to a byte-identical copy is harmless by
  // definition, and any other file — pristine, older, or `git show HEAD:…` — reds here.
  const crypto = require('crypto');
  const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
  const SELF_HASH = sha(fs.readFileSync(__filename));
  // PURE and testable, and it inspects THE PATH ACTUALLY SPAWNED. The first attempt at this hashed
  // the SPAWN_TARGET constant and then spawned whatever the call site passed, so replacing the
  // `spawnSync` line alone still certified a pristine copy — a name guard wearing a hash costume,
  // the very class this was meant to close. Returns a problem string rather than exiting, so the
  // meta-probes below can drive it.
  const spawnTargetProblem = (target) =>
    sha(fs.readFileSync(target)) === SELF_HASH
      ? null
      : `spawned ${target}, whose contents differ from the file under test`;
  const run = (dir, args) => {
    const target = SPAWN_TARGET;
    const problem = spawnTargetProblem(target);
    if (problem) {
      console.error(`\n❌ refusing to report green: the --check probe table ${problem}.`);
      process.exit(1);
    }
    return spawnSync(process.execPath, [target, ...args], { cwd: dir, encoding: 'utf8' });
  };

  // Every row declares the CAUSE it drives and a `sig` the shipped script must actually print for
  // it, so the cause is OBSERVED rather than merely declared. Coverage below is asserted over
  // causes, NOT exit codes — the pass-5 gate blocked on exactly that distinction: `stale` and
  // `reformatted` both exit 1, so an exit-code guard let the stale row be swapped for another
  // exit-1 row with everything green, and two edits then reopened the fail-open (mutant `--check`
  // rc=0 over a genuinely stale catalogue, control rc=1). Two lenses reached that independently.
  //
  // `mutate: null` == delete the committed catalogue. `build: false` == the generate step cannot
  // run for this fixture, so skip it. Both the zero-token and cwd rows live IN this table rather
  // than beside it, so the count is observed; a `+ 1` standing in for an out-of-table probe let
  // that probe be deleted while the floor and the summary still reported the old number (three
  // lenses, independently).
  // The expected exit is derived from the CAUSE through this frozen map, which lives OUTSIDE the
  // table. Pass 6, debugger lens: while each row declared the exit it would accept, inverting
  // production's stale arm (exit 1 -> 0) together with that row's `exit` was TWO edits, green, and
  // a real fail-open — `--check` rc=0 over a genuinely stale catalogue against a control of rc=1
  // (reproduced independently before folding). A row must not get to say what counts as correct
  // for its own cause.
  const CAUSE_EXIT = Object.freeze({
    match: 0,
    stale: 1,
    reformatted: 1,
    'invalid-generated_at': 2,
    'invalid-json': 2,
    absent: 2,
    'zero-token': 1,
    'scratch-cwd': 1,
  });

  const CLI_PROBES = [
    { note: 'fresh, byte-identical committed catalogue -> exit 0', mutate: (raw) => raw, cause: 'match', sig: 'matches a fresh, canonical build' },
    {
      note: 'THE BLOCKER THIS TABLE EXISTS FOR: a token genuinely removed from the committed catalogue -> exit 1',
      mutate: (raw) => {
        const o = JSON.parse(raw);
        o.categories.color.tokens = o.categories.color.tokens.slice(0, 1);
        return JSON.stringify(o, null, 2) + '\n';
      },
      cause: 'stale',
      sig: 'is stale relative to',
    },
    { note: 'content identical but minified -> exit 1 (reformatted, NFR-006)', mutate: (raw) => JSON.stringify(JSON.parse(raw)), cause: 'reformatted', sig: 'not byte-identical to a canonical regeneration' },
    {
      note: 'generated_at is not a real date -> exit 2 (cannot compare — NOT a content verdict)',
      mutate: (raw) => {
        const o = JSON.parse(raw);
        o.generated_at = 'not-a-date';
        return JSON.stringify(o, null, 2) + '\n';
      },
      cause: 'invalid-generated_at',
      sig: 'generated_at is absent or invalid',
    },
    { note: 'committed catalogue is not valid JSON -> exit 2', mutate: () => 'not json {', cause: 'invalid-json', sig: 'not valid JSON' },
    { note: 'committed catalogue absent entirely -> exit 2', mutate: null, cause: 'absent', sig: 'does not exist' },
    {
      // Cited by check-token-breaking-changes.sh in PROSE as the justification for its own
      // zero-token floor, but nothing asserted it: deleting the refusal left every suite green.
      note: 'source CSS defines no --sk-* tokens -> refuse (exit 1), never certify an empty catalogue',
      css: '/* no --sk-* tokens at all */\n:root { color: red; }\n',
      build: false,
      cause: 'zero-token',
      sig: 'No --sk-* tokens found',
    },
    {
      // Asserts the seam itself: the subprocess must read the SCRATCH tree, so its refusal has to
      // name the scratch path. Resolving paths from `__dirname` — a plausible "improvement" —
      // breaks the table and, before this row existed, did so by writing the tracked catalogue.
      note: 'the subprocess reads the SCRATCH tree, not the repo (the cwd-relativity seam, asserted)',
      css: null,
      build: false,
      cause: 'scratch-cwd',
      sig: 'Source file not found',
      expectScratchPath: true,
    },
  ];

  // Schema validation BEFORE the table runs. A `sig` is the entire observation mechanism, so a
  // weak one silently converts "observed" back into "declared": pass 6, reviewer lens weakened one
  // row's sig to '❌' — printed by four of five verdict branches — and that row then certified
  // cause 'stale' while never reaching the stale branch. Dead config is rejected too (architect
  // lens: `mutate` on a `build: false` row was silently ignored).
  const SIG_MIN = 12;
  for (const p of CLI_PROBES) {
    const bad = [];
    if (typeof p.sig !== 'string' || p.sig.trim().length < SIG_MIN) bad.push(`sig must be a specific string of at least ${SIG_MIN} chars`);
    if (CAUSE_EXIT[p.cause] === undefined) bad.push(`cause '${p.cause}' has no entry in CAUSE_EXIT`);
    if (p.build === false && p.mutate !== undefined) bad.push('mutate is dead config on a build:false row');
    if (bad.length > 0) {
      console.error(`\n❌ malformed --check probe row (${p.cause}): ${bad.join('; ')}.`);
      process.exit(1);
    }
  }

  // The assertion is a PURE function so it can be meta-probed, and every call site registers its
  // own expectation so the reach invariant stays correct as callers are added. Pass 6, reviewer
  // lens: this logic was an inline block with no meta-probes and no reach guard, so a single
  // `if (problems.length > 0)` -> `if (false)` left the whole suite green over any production
  // fail-open — the pass-5 shell defect, un-ported, one file over.
  let assertCliCalls = 0;
  let expectedAssertCliCalls = 0;
  const assertCliProbe = (p, status, out, dir) => {
    assertCliCalls++;
    const problems = [];
    const expectExit = CAUSE_EXIT[p.cause];
    if (status !== expectExit) problems.push(`expected exit ${expectExit} for cause '${p.cause}', got ${status}`);
    if (!out.includes(p.sig)) problems.push(`output does not contain ${JSON.stringify(p.sig)}`);
    if (p.expectScratchPath && !out.includes(dir)) problems.push('output does not name the scratch dir');
    return problems;
  };

  // A content hash CANNOT stop a mutant from replacing the spawn statement itself and pointing it
  // at a pristine copy — verified twice, it survived both times, and the honest conclusion is that
  // no check preceding a separately-editable spawn line can prevent this. What this does is make
  // `spawnSync` provably single-site, so ADDING a call site reds unless the count is edited too.
  // DISCLOSED RESIDUAL: editing the one existing call site plus this constant is still a two-edit
  // test-side defeat. Cost raised, class not closed; said plainly rather than dressed up.
  const SPAWN_SITES = (fs.readFileSync(__filename, 'utf8').match(/spawnSync\(/g) || []).length;
  const EXPECTED_SPAWN_SITES = 1;
  if (SPAWN_SITES !== EXPECTED_SPAWN_SITES) {
    console.error(`\n❌ refusing to report green: ${SPAWN_SITES} spawnSync call site(s), expected ${EXPECTED_SPAWN_SITES}.`);
    console.error('   Probes must exercise the file under test through exactly one spawn.');
    process.exit(1);
  }

  // Registration belongs at the CALL SITE, not in the meta loop. Incrementing once per meta row
  // assumed every row calls the asserter — the two spawnTargetProblem rows do not, so the
  // invariant demanded 14 calls against 12 and reddened correct code. Third time I have made this
  // exact arithmetic mistake; a wrapper that registers as it calls cannot make it a fourth.
  const metaAssert = (...a) => {
    expectedAssertCliCalls++;
    return assertCliProbe(...a);
  };

  const stub = (over) => ({ note: 'meta', cause: 'stale', sig: 'is stale relative to', ...over });
  const CLI_METAS = [
    ['spawnTargetProblem accepts the file under test', () => spawnTargetProblem(__filename) === null],
    [
      'spawnTargetProblem rejects a file with different contents',
      () => {
        const p = path.join(os.tmpdir(), `st-${process.pid}.js`);
        fs.writeFileSync(p, '// deliberately not this file\n');
        const r = spawnTargetProblem(p);
        fs.rmSync(p, { force: true });
        return typeof r === 'string';
      },
    ],
    ['matching exit + matching sig -> no problems', () => metaAssert(stub(), 1, 'is stale relative to', '/d').length === 0],
    ['exit differs from the cause map -> problem', () => metaAssert(stub(), 0, 'is stale relative to', '/d').length > 0],
    ['sig absent from output -> problem', () => metaAssert(stub(), 1, 'nothing matching here', '/d').length > 0],
    ['expectScratchPath unmet -> problem', () => metaAssert(stub({ expectScratchPath: true }), 1, 'is stale relative to', '/scratch-abc').length > 0],
    ['expectScratchPath met -> no problems', () => metaAssert(stub({ expectScratchPath: true }), 1, 'is stale relative to /scratch-abc/x', '/scratch-abc').length === 0],
  ];
  let cliMetaBad = 0;
  for (const [note, fn] of CLI_METAS) {
    if (fn()) {
      console.log(`  ✓ [cli-meta] ${note}`);
    } else {
      console.error(`  ✗ [cli-meta] ${note}`);
      cliMetaBad++;
    }
  }
  const CLI_META_FLOOR = 7;
  if (CLI_METAS.length < CLI_META_FLOOR || cliMetaBad > 0) {
    console.error(`\n❌ assertCliProbe meta-probes: ${cliMetaBad} of ${CLI_METAS.length} failed (floor ${CLI_META_FLOOR}) —`);
    console.error('   the CLI table\'s own assertion is not trustworthy, so its probes prove nothing.');
    process.exit(1);
  }

  let cliBad = 0;
  let cliRan = 0;
  const seenCauses = new Set();
  const capturedOut = new Map();

  // The loop body is a function so the CALLER can be meta-probed. Proving `assertCliProbe` returns
  // the right problems, and proving it was called, are both satisfied while the caller ignores the
  // answer: `if (problems.length > 0)` -> `if (false)` survived both. Consumption is only
  // demonstrable by driving this function with a row that MUST fail and watching cliBad move —
  // the same shape that works on the shell side.
  const reportCliProbe = (p, status, out, dir) => {
    expectedAssertCliCalls++;
    const problems = assertCliProbe(p, status, out, dir);
    if (problems.length > 0) {
      console.error(`  ✗ [cli] ${p.note}: ${problems.join('; ')}`);
      console.error(`      ${out.trim().split('\n')[0]}`);
      cliBad++;
      return false;
    }
    seenCauses.add(p.cause);
    console.log(`  ✓ [cli] ${p.note}`);
    return true;
  };

  for (const p of CLI_PROBES) {
    const dir = mkTree(p.css === undefined ? FIXTURE_CSS : p.css);
    cliRan++;
    try {
      if (p.build !== false) {
        const build = run(dir, []);
        if (build.status !== 0) throw new Error(`fixture build failed (${build.status}): ${build.stderr}`);
        const catAbs = path.join(dir, CAT_REL);
        if (p.mutate === null) fs.rmSync(catAbs);
        else fs.writeFileSync(catAbs, p.mutate(fs.readFileSync(catAbs, 'utf8')));
      }
      const r = run(dir, ['--check']);
      const out = `${r.stderr || ''}${r.stdout || ''}`;
      capturedOut.set(p.cause, out);
      reportCliProbe(p, r.status, out, dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // ── The caller must CONSUME the verdict (pass 6 fold, self-caught) ───────────────────────────
  // Drive reportCliProbe with a row that cannot pass, and require it to have counted a failure.
  // Restores the counters afterwards so the visible tally is unchanged.
  {
    const bad0 = cliBad;
    const ran0 = seenCauses.size;
    const silence = console.error;
    console.error = () => {};
    const reported = reportCliProbe(stub(), 99, 'nothing matching at all', '/d');
    console.error = silence;
    if (reported !== false || cliBad !== bad0 + 1) {
      console.error('\n❌ reportCliProbe did not count a guaranteed-failing probe as a failure —');
      console.error('   the CLI table reports results without consuming them. Every ✓ is meaningless.');
      process.exit(1);
    }
    cliBad = bad0;
    if (seenCauses.size !== ran0) {
      console.error('\n❌ a failing CLI probe recorded its cause as observed.');
      process.exit(1);
    }
    console.log('  ✓ [cli-meta] reportCliProbe counts a guaranteed-failing probe as a failure');
  }

  // Cross-row signature disjointness: a row's sig must not appear in ANY other row's real output.
  // Without this, a sig can be weakened to something several branches print and the row certifies
  // a cause it never reached. Checked against captured output, so it keys on what the shipped
  // script emits rather than on what this table claims.
  for (const a of CLI_PROBES) {
    for (const b of CLI_PROBES) {
      if (a.cause === b.cause) continue;
      const other = capturedOut.get(b.cause);
      if (other !== undefined && other.includes(a.sig)) {
        console.error(`\n❌ sig for cause '${a.cause}' also appears in the output of '${b.cause}' —`);
        console.error('   it cannot distinguish the branch it claims to observe.');
        process.exit(1);
      }
    }
  }

  // Reach invariant: every registered call must have happened. The counter lives INSIDE
  // assertCliProbe and each caller registers its own expectation, so adding a caller cannot make
  // this red on correct code (the arithmetic mistake the shell side shipped one pass earlier).
  if (assertCliCalls !== expectedAssertCliCalls) {
    console.error(`\n❌ ${expectedAssertCliCalls} CLI assertion(s) were registered but assertCliProbe ran`);
    console.error(`   ${assertCliCalls} time(s) — results are being reported without being asserted.`);
    process.exit(1);
  }

  // `mkVerdict`'s single `if` is the one load-bearing line behind the kind-coverage guard below.
  // Deleting it left the pure table 8/8 green, after which the whole pass-3 defect returns in one
  // edit. Counted in `cliRan` and required in REQUIRED_CAUSES, because when this probe sat outside
  // both it could simply be deleted (pass 5: deleting it AND neutering the throw stayed green).
  cliRan++;
  let mkVerdictRefusedBogus = false;
  try {
    mkVerdict('not-a-real-kind', 'should never be constructed');
  } catch {
    mkVerdictRefusedBogus = true;
  }
  if (mkVerdictRefusedBogus) {
    seenCauses.add('mkverdict-guard');
    console.log('  ✓ [guard] mkVerdict refuses a kind absent from VERDICT_KINDS');
  } else {
    console.error('  ✗ [guard] mkVerdict accepted a bogus verdict kind — the kind-coverage guard is inert');
    cliBad++;
  }
  const CLI_TOTAL = cliRan;

  // Floors OUTSIDE their tables (check-develop-ruleset-parity.mjs's PROBE_FLOOR shape).
  const PROBE_FLOOR = 8;
  if (PROBES.length < PROBE_FLOOR) {
    console.error(`\n❌ the probe table has shrunk: ${PROBES.length} probe(s) against a floor of ${PROBE_FLOOR}.`);
    process.exit(1);
  }
  const CLI_PROBE_FLOOR = 9;
  if (CLI_TOTAL < CLI_PROBE_FLOOR) {
    console.error(`\n❌ the --check probe set has shrunk: ${CLI_TOTAL} probe(s) against a floor of ${CLI_PROBE_FLOOR}.`);
    process.exit(1);
  }
  // CAUSE coverage — the CLI analogue of VERDICT_KINDS, and the pass-5 blocker fix.
  //
  // This replaces an exit-code coverage guard, which was too coarse to do the job: four distinct
  // causes collapse into exits 1 and 2, so swapping the stale row for any other exit-1 row kept
  // coverage satisfied and reopened the fail-open. Cause coverage strictly subsumes exit-code
  // coverage (every cause pins an exit code), so nothing was lost by dropping it — and the
  // debugger lens showed it was never the sole detector of anything anyway, which also means an
  // earlier commit message of mine that credited it with a kill was wrong.
  const REQUIRED_CAUSES = [
    'match', 'stale', 'reformatted', 'invalid-generated_at', 'invalid-json',
    'absent', 'zero-token', 'scratch-cwd', 'mkverdict-guard',
  ];
  const missingCauses = REQUIRED_CAUSES.filter((c) => !seenCauses.has(c));
  if (missingCauses.length > 0) {
    console.error(`\n❌ refusing to report green: no --check probe observes cause(s): ${missingCauses.join(', ')}.`);
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
    console.error(`\n❌ ${bad} of ${PROBES.length} compareCatalogue probe(s) and ${cliBad} of ${CLI_TOTAL} CLI probe(s) did not behave as recorded.`);
    process.exit(1);
  }
  console.log(
    `\n✅ All ${PROBES.length} compareCatalogue probes (${passKind} expect-match, ${failKind} expect-non-match) ` +
      `and all ${CLI_TOTAL} CLI probes (${CLI_PROBES.length} --check subprocess + 1 guard) behaved as recorded.`,
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
