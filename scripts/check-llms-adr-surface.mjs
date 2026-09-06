#!/usr/bin/env node
/**
 * The LLM context surfaces, held to carrying NO hand-maintained ADR index (#197).
 *
 * WHY THIS EXISTS. `llms.txt` and `llms-full.txt` are the two files this repo publishes for a
 * model that cannot browse it. Both restated `docs/architecture/decisions/` by hand, and both
 * rotted. Measured on `train/elements-first` @ 65a92f6, before this gate existed:
 *
 *     records on disk:                        15
 *     record paths referenced by llms.txt:     3   ("All Accepted architectural decision records")
 *     record paths referenced by llms-full.txt: 14   (ADR-14, added four days earlier, missing)
 *
 * Nine of the fifteen are Accepted; five are Proposed and one is Complete. So `llms.txt` was
 * wrong twice in one clause — about which records exist and about whether they were ratified —
 * and `llms-full.txt` carried three ADR range expressions (`ADR-1 through ADR-13`,
 * `ADR-1 through ADR-7`, `ADR-8 through ADR-13`) plus a set-wide `Status of every ADR below is
 * Accepted`. None of it was gated: `grep -rn llms` over `.github/` and `scripts/` returned
 * nothing.
 *
 * THE OPERATOR RULED on #197: point at `docs/architecture/README.md`'s table instead of
 * restating it. Three hand-maintained copies of one fact is exactly the drift #193 measured, and
 * the fix is one owner. This gate is the second half of that ruling — so that no hand list can
 * exist to drift. It refuses, in either surface:
 *
 *   1. an ADR RANGE expression — `ADR-1 through ADR-13`, `ADRs 8–13`, `ADR-8–13`;
 *   2. a set-wide CARDINALITY or STATUS claim — "all ADRs", "every ADR", "15 ADRs",
 *      "All Accepted architectural decision records";
 *   3. a PARTIAL link list — the set of records a surface references must be EMPTY or COMPLETE.
 *      A subset is the failure mode: it reads as an index and rots one record at a time.
 *   4. the ABSENCE of the pointer that replaces all of the above.
 *
 * WHY "EMPTY OR COMPLETE" RATHER THAN "EMPTY". The two surfaces are different shapes.
 * `llms.txt` is a link index, so its ADR entries were the index-shaped claim and nothing else;
 * it now references zero records. `llms-full.txt` is prose: each summary states a decision and
 * its rationale, which is the file's entire purpose for a reader who cannot open the record. That
 * content stays — but the SET of summaries is also an index, so it is held complete. Substantive
 * prose that names a record while explaining a rule (`a custom element (ADR-8)`) is content, not
 * an index, and the negative probes below assert this gate does not trip on it.
 *
 * THE CHECKS ARE PURE FUNCTIONS over parsed inputs, so `--selftest` can feed them synthetic
 * defects without touching the filesystem — the shape `check-release-graph.mjs`,
 * `build-react-wrappers.mjs` and `check-adr-index.mjs` already use. Every probe declares
 * `expect`, a substring of the problem it is supposed to provoke, because #193's mutation sweep
 * found four of its own guards deletable while `--selftest` printed a tick: a probe satisfied by
 * ANY problem is satisfied by the WRONG check firing. That defect was found and fixed one gate
 * ago; it is not reintroduced here.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It takes no position on any record's Status, title or
 * content, and it never reads a record's body — `check-adr-index.mjs` owns status transcription
 * and this gate would be a second, disagreeing owner. It asserts nothing about
 * `docs/architecture/README.md` beyond the pointer naming it.
 *
 * `classifyEntries` is IMPORTED from check-adr-index.mjs rather than reimplemented. What counts
 * as a record — `.md` files at the top level, symlinks resolved, a non-empty subdirectory
 * REFUSED rather than silently skipped — is a decision that must have exactly one owner, and
 * #193 owns it. A second copy here would be a second definition of "the record set", which is
 * the class of defect this whole file is about. That module carries a run-as-CLI guard, so
 * importing it runs no checks.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyEntries, DECISIONS_DIR, INDEX_FILE } from './check-adr-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The surfaces this gate owns. Both are hand-written, both are published to consumers who cannot
 * check them, and neither is generated from anything.
 */
export const SURFACE_FILES = ['llms.txt', 'llms-full.txt'];

/** The path a pointer must name. The table under it is #193's, and it is gated against the directory. */
export const POINTER_PATH = INDEX_FILE;

/* ─────────────────────────────────── parsers ─────────────────────────────────── */

/**
 * Every reference to a record file, wherever it appears and in whatever syntax.
 *
 * A markdown link, a bare path, a backticked path and a full `https://github.com/…/blob/main/…`
 * URL are all references: each one tells a reader that this file knows about that record, and
 * each one goes stale the same way. Narrowing this to markdown links would have missed all
 * fourteen of `llms-full.txt`'s, which are backticked paths — and a narrowed extractor makes the
 * partial-list check pass vacuously, since an empty reference set is legitimate. That is why
 * `THE EXTRACTOR SEES` below is a probe and not a comment.
 *
 * A path is only seen when CONTIGUOUS on one line. `llms-full.txt` wraps at 80 columns, and a
 * record path broken across two lines would silently leave the set — reported by the
 * incomplete-set check rather than tolerated, which is the safe direction.
 *
 * The trailing `.md` is required and the character class excludes `#` and `?`, so an anchored or
 * query-suffixed link resolves to the record it points at. A bare directory mention
 * (`docs/architecture/decisions/`, no filename) is NOT a reference — the pointer sentence names
 * the directory, and naming a directory is not indexing its contents.
 */
export function extractRecordRefs(lines) {
  const re = new RegExp(`${DECISIONS_DIR.replace(/\//g, '\\/')}\\/([A-Za-z0-9._~+-]+\\.md)`, 'g');
  const refs = [];
  (lines ?? []).forEach((line, i) => {
    for (const m of String(line).matchAll(re)) refs.push({ file: m[1], line: i + 1, text: String(line).trim() });
  });
  return refs;
}

/* ──────────────────────────────── the pattern sets ──────────────────────────────── */

const NUMBER_WORD = '\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty';

/**
 * ADR RANGE expressions. A range is the most durable form of the defect: it survives every new
 * record silently, because nothing about `ADR-1 through ADR-13` becomes syntactically wrong when
 * ADR-14 lands. All three of `llms-full.txt`'s were written that way and none was updated by #194.
 *
 * THE HARD CASE IS THE TITLE DASH. `llms-full.txt`'s summary headings read
 * `### ADR-7 — Storybook 10.x Adoption (Angular 21 Compatibility)`, and a naive
 * `ADR-\d+\s*[-–—]\s*\d+` matches that via `ADR-7 — 10`. A gate that reds on a heading is a gate
 * someone deletes, so the dash forms are split by what actually distinguishes them:
 *
 *   - a WORD separator (`through`, `to`, `..`) is unambiguous, so the second operand may be bare;
 *   - a dash separator with BOTH operands ADR-prefixed is unambiguous whatever the spacing;
 *   - `ADRs 8–13` is unambiguous because of the plural;
 *   - `ADR-8–13` is unambiguous because there is NO whitespace around the dash — which is exactly
 *     what a title dash always has.
 *
 * Both directions are probed: each form trips, and the title dash does not.
 */
export const RANGE_PATTERNS = [
  { name: 'word-range', re: new RegExp('\\bADRs?[\\s-]*0*\\d+\\s*(?:through|thru|to|\\.\\.\\.?)\\s*(?:ADRs?[\\s-]*)?0*\\d+\\b', 'i') },
  { name: 'dash-range-both-sides', re: /\bADRs?[\s-]*0*\d+\s*[-–—]\s*ADRs?[\s-]*0*\d+\b/i },
  { name: 'plural-numeric-range', re: /\bADRs\s+0*\d+\s*[-–—]\s*0*\d+\b/i },
  { name: 'tight-dash-range', re: /\bADRs?-0*\d+[-–—]0*\d+\b/i },
];

/**
 * SET-WIDE cardinality and status claims. `llms.txt`'s "All Accepted architectural decision
 * records" is the whole class in one clause: it says how many (all) and what status (Accepted)
 * about a set it then lists three members of.
 *
 * These are deliberately about the SET, not about a record. "ADR-8 is Accepted" is a fact a
 * reader can check against one file; "every ADR is Accepted" is an index claim, and it was false
 * for six records the day it was written.
 */
export const CARDINALITY_PATTERNS = [
  { name: 'all-or-every-adrs', re: /\b(?:all|every|each)\s+(?:of\s+the\s+)?ADRs?\b/i },
  { name: 'all-or-every-decision-records', re: /\b(?:all|every|each)\s+(?:\w+\s+){0,3}?decision\s+records?\b/i },
  { name: 'counted-adrs', re: new RegExp(`\\b(?:${NUMBER_WORD})\\s+(?:of\\s+the\\s+)?ADRs\\b`, 'i') },
  { name: 'counted-decision-records', re: new RegExp(`\\b(?:${NUMBER_WORD})\\s+(?:of\\s+the\\s+)?(?:\\w+\\s+){0,2}?decision\\s+records?\\b`, 'i') },
  { name: 'set-wide-status-claim', re: /\bstatus\s+of\s+(?:every|all|each|the)\s+(?:\w+\s+){0,3}?(?:ADRs?|records?|decisions?)\b/i },
];

/* ─────────────────────────── the checks, as pure functions ─────────────────────────── */

/**
 * THE CONFIGURATION FLOOR. Every check below iterates something; empty any of those lists and the
 * whole gate prints green over an untouched defect. `SURFACE_FILES = []` examines no file;
 * `RANGE_PATTERNS = []` finds no range in any text. Both are one-line deletions that leave a tick
 * on the console, which is the shape this repo has been bitten by repeatedly
 * (`checkTarballsNonEmpty`, `checkSubpathCoverage`, `expected-docs.json`'s `$comment`).
 */
export function checkConfiguration(surfaceNames, rangePatterns, cardinalityPatterns) {
  const problems = [];
  if (!surfaceNames || surfaceNames.length === 0) {
    problems.push(
      `the surface list is empty — this gate would examine no file and report success. An empty ` +
        `subject is a broken gate, not a clean tree.`,
    );
  }
  if (!rangePatterns || rangePatterns.length === 0) {
    problems.push(
      `the ADR range pattern set is empty — every range expression in every surface would pass ` +
        `unseen. A check with no patterns is a check that cannot fail.`,
    );
  }
  if (!cardinalityPatterns || cardinalityPatterns.length === 0) {
    problems.push(
      `the ADR cardinality pattern set is empty — every set-wide claim would pass unseen. A check ` +
        `with no patterns is a check that cannot fail.`,
    );
  }
  return problems;
}

/**
 * The decisions directory is the source of truth for "complete". Its absence is a failure, not a
 * vacuous pass — asserted as a pure function rather than an `existsSync` in `main()` so that the
 * floor itself is probed.
 */
export function checkDecisionsDirPresence(exists) {
  if (exists === true) return [];
  return [
    `${DECISIONS_DIR} does not exist — refusing to certify an ADR surface against a directory ` +
      `that is not there. "Complete" over a missing set is every set.`,
  ];
}

/** A surface that is not on disk is a surface this gate is silently not checking. */
export function checkSurfacePresence(name, exists) {
  if (exists === true) return [];
  return [
    `${name} does not exist — refusing to report a clean ADR surface for a file that is not ` +
      `there. If it moved or was deleted, point this gate at the new set deliberately.`,
  ];
}

/** An empty file satisfies every "must not contain" check by construction. */
export function checkSurfaceRead(name, text) {
  if (typeof text === 'string' && text.trim() !== '') return [];
  return [
    `${name} is empty — refusing to certify an ADR surface with no content. Every prohibition ` +
      `in this gate is trivially satisfied by an empty file, and the pointer is not.`,
  ];
}

/**
 * FR-007/FR-012 — the referenced record set is EMPTY or COMPLETE, and every reference resolves.
 *
 * The subset is the defect. A file referencing three of fifteen records reads exactly like an
 * index to someone who cannot count the directory, and it degrades one record at a time with
 * nothing ever becoming syntactically wrong. Empty is fine — that is what a pointer replaces a
 * list with. Complete is fine — that is a list a gate can hold. Between them there is nothing
 * legitimate, which is why this is one check and not two.
 *
 * A reference to a file that does not exist is reported separately and first: it is a different
 * failure (a renamed or withdrawn record leaving a corpse) with a different fix.
 */
export function checkRefSet(name, refs, records) {
  if (!records || records.length === 0) {
    return [
      `${DECISIONS_DIR} yielded no decision records — refusing to certify ${name}'s ADR ` +
        `reference set over nothing. An empty glob is a broken gate, not a clean tree.`,
    ];
  }
  const problems = [];
  const referenced = [...new Set((refs ?? []).map((r) => r.file))].sort();

  const stale = referenced.filter((f) => !records.includes(f));
  for (const f of stale) {
    problems.push(
      `${name} references ${DECISIONS_DIR}/${f}, which does not exist — a stale reference reads ` +
        `as an index entry until someone follows it`,
    );
  }

  const live = referenced.filter((f) => records.includes(f));
  if (live.length === 0 && stale.length === 0) return problems; // the empty branch: a pure pointer

  const missing = records.filter((f) => !referenced.includes(f));
  if (missing.length > 0) {
    problems.push(
      `${name} references ${live.length} of ${records.length} records under ${DECISIONS_DIR} — a ` +
        `hand-maintained ADR list must be EMPTY or COMPLETE, never a subset that silently rots. ` +
        `Not referenced: ${missing.join(', ')}. Either drop every record reference and point at ` +
        `${POINTER_PATH}'s table, or reference the missing record(s).`,
    );
  }
  return problems;
}

/** FR-008 — no ADR range expression. The line is quoted so the fix needs no second command. */
export function checkNoRanges(name, lines, patterns) {
  const problems = [];
  (lines ?? []).forEach((line, i) => {
    for (const p of patterns ?? []) {
      const m = String(line).match(p.re);
      if (m) {
        problems.push(
          `${name}:${i + 1} carries an ADR range expression (${p.name}): "${m[0]}" — in ` +
            `"${String(line).trim()}". A range does not become wrong when a record is added, it ` +
            `just becomes silently incomplete. Name the records you mean, or point at ` +
            `${POINTER_PATH}'s table.`,
        );
      }
    }
  });
  return problems;
}

/** FR-009 — no set-wide claim about how many ADRs there are or what status they hold. */
export function checkNoCardinality(name, lines, patterns) {
  const problems = [];
  (lines ?? []).forEach((line, i) => {
    for (const p of patterns ?? []) {
      const m = String(line).match(p.re);
      if (m) {
        problems.push(
          `${name}:${i + 1} carries a set-wide ADR claim (${p.name}): "${m[0]}" — in ` +
            `"${String(line).trim()}". This file does not own the ADR set and cannot report its ` +
            `size or its statuses; ${POINTER_PATH}'s table does, and it is gated against the ` +
            `directory.`,
        );
      }
    }
  });
  return problems;
}

/**
 * FR-010 — the pointer that replaces everything above.
 *
 * A THREE-TOKEN CONJUNCTION rather than a fixed sentence, on purpose. A required sentence is a
 * magic string: any rewording reds the gate, and the next person deletes the check rather than
 * the reword. A bare `README.md` mention is too weak in the other direction — `llms.txt` already
 * links the architecture index for an unrelated reason, and that mention would have satisfied a
 * looser rule while the partial list sat three lines below it. So one line must carry all three
 * of: the path, the word ADR, and the claim that the table is `authoritative`. Both directions
 * are probed.
 */
export function checkPointer(name, lines) {
  const ok = (lines ?? []).some(
    (l) => String(l).includes(POINTER_PATH) && /\bADRs?\b/.test(String(l)) && /\bauthoritative\b/i.test(String(l)),
  );
  if (ok) return [];
  return [
    `${name} carries no pointer to the authoritative ADR index — one line must name ` +
      `${POINTER_PATH}, name ADRs, and say that table is authoritative. Without it, removing the ` +
      `hand list leaves a reader who cannot browse this repo with no route to the decisions at ` +
      `all, which is a worse file than the stale one this gate replaced.`,
  ];
}

/* ──────────────────────────────────── selftest ──────────────────────────────────── */

const REC = ['a.md', 'b.md'];
const ref = (file, line = 1) => ({ file, line, text: '' });
const POINTER_LINE = `The authoritative ADR index is the table in \`${POINTER_PATH}\`.`;

/**
 * Every probe declares `expect`: a substring of the problem it is supposed to provoke, and the
 * inputs are narrowed so each provokes its own check as directly as it can.
 *
 * WITHOUT `expect` a probe passes when ANY check fires, and #193's mutation sweep proved that is
 * not a theoretical concern — four of its guards were individually deletable while its selftest
 * printed a tick, because a neighbouring check tripped on the same synthetic input. A probe table
 * that cannot tell which check fired is a smoke test wearing a probe table's clothes.
 */
const PROBES = [
  // ── configuration floors ───────────────────────────────────────────────────────
  {
    what: 'an emptied surface list',
    expect: 'the surface list is empty',
    run: () => checkConfiguration([], RANGE_PATTERNS, CARDINALITY_PATTERNS),
  },
  {
    what: 'an emptied range pattern set',
    expect: 'the ADR range pattern set is empty',
    run: () => checkConfiguration(SURFACE_FILES, [], CARDINALITY_PATTERNS),
  },
  {
    what: 'an emptied cardinality pattern set',
    expect: 'the ADR cardinality pattern set is empty',
    run: () => checkConfiguration(SURFACE_FILES, RANGE_PATTERNS, []),
  },
  // ── presence floors ────────────────────────────────────────────────────────────
  {
    what: 'a missing decisions directory',
    expect: 'refusing to certify an ADR surface against a directory',
    run: () => checkDecisionsDirPresence(false),
  },
  {
    what: 'a surface file that is not on disk',
    expect: 'refusing to report a clean ADR surface for a file that is not there',
    run: () => checkSurfacePresence('llms.txt', false),
  },
  {
    what: 'a surface file that is empty',
    expect: 'refusing to certify an ADR surface with no content',
    run: () => checkSurfaceRead('llms.txt', '   \n\n'),
  },
  // ── the reference set ──────────────────────────────────────────────────────────
  {
    what: 'a reference set over an empty decisions directory',
    expect: 'refusing to certify llms.txt\'s ADR reference set over nothing',
    run: () => checkRefSet('llms.txt', [ref('a.md')], []),
  },
  {
    what: 'a partial reference list — one of two records',
    expect: 'must be EMPTY or COMPLETE',
    run: () => checkRefSet('llms.txt', [ref('a.md')], REC),
  },
  {
    what: 'a reference to a record that does not exist',
    // Narrowed to a COMPLETE live set plus one corpse, so the incomplete-set branch cannot carry
    // this probe. With an incomplete live set it did, which is why deleting the stale branch was
    // green on the first draft of this table.
    expect: 'which does not exist — a stale reference',
    run: () => checkRefSet('llms.txt', [ref('a.md'), ref('b.md'), ref('gone.md')], REC),
  },
  // ── ranges: one probe per pattern, so deleting any single pattern reds ──────────
  {
    what: 'a word range (ADR-1 through ADR-13)',
    expect: '(word-range)',
    run: () => checkNoRanges('llms-full.txt', ['ADRs (ADR-1 through ADR-13 + ADR-3 addendum)'], RANGE_PATTERNS),
  },
  {
    what: 'a word range with a bare second operand (ADR-8 to 13)',
    expect: '(word-range)',
    run: () => checkNoRanges('llms-full.txt', ['see ADR-8 to 13 for the current architecture'], RANGE_PATTERNS),
  },
  {
    what: 'a spaced dash range with both operands ADR-prefixed',
    expect: '(dash-range-both-sides)',
    run: () => checkNoRanges('llms-full.txt', ['the elements-first set is ADR-8 — ADR-13 inclusive'], RANGE_PATTERNS),
  },
  {
    what: 'a plural numeric range (ADRs 8–13)',
    expect: '(plural-numeric-range)',
    run: () => checkNoRanges('llms-full.txt', ['ADRs 8–13 are committed'], RANGE_PATTERNS),
  },
  {
    what: 'a tight dash range (ADR-8–13)',
    expect: '(tight-dash-range)',
    run: () => checkNoRanges('llms-full.txt', ['governing decisions: ADR-8–13'], RANGE_PATTERNS),
  },
  // ── cardinality: one probe per pattern ─────────────────────────────────────────
  {
    what: '"All Accepted architectural decision records"',
    expect: '(all-or-every-decision-records)',
    run: () => checkNoCardinality('llms.txt', ['ADR directory: All Accepted architectural decision records.'], CARDINALITY_PATTERNS),
  },
  {
    what: '"Status of every ADR below is Accepted"',
    expect: '(all-or-every-adrs)',
    run: () => checkNoCardinality('llms-full.txt', ['Status of every ADR below is **Accepted**.'], CARDINALITY_PATTERNS),
  },
  {
    what: 'a numeric ADR count ("the 15 ADRs")',
    expect: '(counted-adrs)',
    run: () => checkNoCardinality('llms-full.txt', ['the 15 ADRs summarised here'], CARDINALITY_PATTERNS),
  },
  {
    what: 'a spelled-out decision-record count ("fifteen decision records")',
    expect: '(counted-decision-records)',
    run: () => checkNoCardinality('llms-full.txt', ['there are fifteen decision records'], CARDINALITY_PATTERNS),
  },
  {
    what: 'a set-wide status claim phrased without "ADR" ("the status of the records below")',
    expect: '(set-wide-status-claim)',
    run: () => checkNoCardinality('llms-full.txt', ['The status of the records below is Accepted.'], CARDINALITY_PATTERNS),
  },
  // ── the pointer ────────────────────────────────────────────────────────────────
  {
    what: 'a surface with no pointer at all',
    expect: 'carries no pointer to the authoritative ADR index',
    run: () => checkPointer('llms.txt', ['# spec-kitty-design', 'some prose about tokens']),
  },
  {
    what: 'a surface naming the README but not calling its table authoritative',
    expect: 'carries no pointer to the authoritative ADR index',
    run: () => checkPointer('llms.txt', [`[Architecture index](${POINTER_PATH}): reading order, including ADRs.`]),
  },
  {
    what: 'a surface calling something authoritative without naming the README',
    expect: 'carries no pointer to the authoritative ADR index',
    run: () => checkPointer('llms.txt', ['The authoritative ADR index lives somewhere in docs/.']),
  },
  {
    what: 'a surface with an authoritative README pointer that never mentions ADRs',
    expect: 'carries no pointer to the authoritative ADR index',
    run: () => checkPointer('llms.txt', [`${POINTER_PATH} is the authoritative reading order.`]),
  },
];

/**
 * The inverse table: shapes that MUST be accepted. Four of these are the reason this gate is
 * usable at all — a range check that reds on `### ADR-7 — Storybook 10.x Adoption` or on
 * `a custom element (ADR-8)` would be deleted within a mission, and deleting it would take the
 * real check with it.
 *
 * The last two are ASSERTIONS ABOUT THE EXTRACTOR, not about a check, and they are the load-
 * bearing ones. An extractor narrowed to nothing makes every surface's reference set empty, and
 * the empty set is LEGITIMATE — so `checkRefSet` would print green over a three-of-fifteen list.
 * Nothing else in this table would notice.
 */
const NEGATIVE_PROBES = [
  {
    what: 'a summary heading with a title dash (### ADR-7 — Storybook 10.x Adoption)',
    run: () => checkNoRanges('llms-full.txt', ['### ADR-7 — Storybook 10.x Adoption (Angular 21 Compatibility)'], RANGE_PATTERNS),
  },
  {
    what: 'two records named with "and" (ADR-6 and ADR-7 are superseded)',
    run: () => checkNoRanges('llms-full.txt', ['**ADR-6 and ADR-7 are superseded on the framework question.**'], RANGE_PATTERNS),
  },
  {
    what: 'a citation inside prose (the component layer is a custom element (ADR-8))',
    run: () => checkNoRanges('llms-full.txt', ['The component layer is a **custom element** (ADR-8): behaviour lives in a Lit'], RANGE_PATTERNS),
  },
  {
    what: 'the addendum identifier (ADR-003-addendum-token-values.md)',
    run: () => checkNoRanges('llms-full.txt', ['`docs/architecture/decisions/ADR-003-addendum-token-values.md`. Records that'], RANGE_PATTERNS),
  },
  {
    what: 'a count of something that is not ADRs (behaviours.json — 15 ids, 14 applicable)',
    run: () => checkNoCardinality('llms-full.txt', ['  behaviours.json        # the behaviour id registry (ADR-11) — 15 ids, 14 applicable'], CARDINALITY_PATTERNS),
  },
  {
    what: 'a cardinality claim about tokens rather than decisions (All design tokens grouped by category)',
    run: () => checkNoCardinality('llms.txt', ['[Token catalogue (JSON)](…): All design tokens grouped by category.'], CARDINALITY_PATTERNS),
  },
  {
    what: 'prose naming three records while explaining a rule (points at the ADRs (ADR-001 …, ADR-002 …))',
    run: () => [
      ...checkNoRanges('llms-full.txt', ['points at the ADRs (ADR-001 token-only CSS, ADR-002 dependency direction,'], RANGE_PATTERNS),
      ...checkNoCardinality('llms-full.txt', ['points at the ADRs (ADR-001 token-only CSS, ADR-002 dependency direction,'], CARDINALITY_PATTERNS),
    ],
  },
  {
    what: 'an empty reference set (the pointer landing)',
    run: () => checkRefSet('llms.txt', [], REC),
  },
  {
    what: 'a complete reference set (the prose landing)',
    run: () => checkRefSet('llms-full.txt', [ref('a.md'), ref('b.md'), ref('b.md')], REC),
  },
  {
    what: 'a pointer worded differently but carrying all three tokens',
    run: () => checkPointer('llms-full.txt', [`For the full set of ADRs see the authoritative table in ${POINTER_PATH}.`]),
  },
  {
    what: 'THE EXTRACTOR SEES a backticked path, a markdown link, an absolute URL and an anchor',
    run: () => {
      const refs = extractRecordRefs([
        '`docs/architecture/decisions/a.md`. **Decision:** something.',
        '- [ADR-1](https://github.com/x/y/blob/main/docs/architecture/decisions/b.md): a description.',
        'see docs/architecture/decisions/c.md#context and docs/architecture/decisions/d.md?plain=1',
      ]);
      const seen = refs.map((r) => r.file);
      const want = ['a.md', 'b.md', 'c.md', 'd.md'];
      return want.filter((w) => !seen.includes(w)).map((w) => `${w} was NOT extracted — the reference pattern is too narrow, and a narrow extractor makes every partial list look empty`);
    },
  },
  {
    what: 'THE EXTRACTOR DOES NOT SEE a bare directory mention or a non-record path',
    run: () => {
      const refs = extractRecordRefs([
        'The records live under `docs/architecture/decisions/`; the index is elsewhere.',
        'See docs/architecture/README.md and docs/architecture/sad-lite.md.',
      ]);
      return refs.map((r) => `${r.file} was extracted from a line that references no record — the pattern is too wide, and a wide extractor invents an incomplete set out of a pointer`);
    },
  },
];

function selftest() {
  let failed = 0;
  for (const probe of PROBES) {
    if (typeof probe.expect !== 'string' || probe.expect.length === 0) {
      console.log(`❌ probe declares no expected problem: ${probe.what}`);
      failed++;
      continue;
    }
    const problems = probe.run();
    if (problems.length === 0) {
      console.log(`❌ probe did NOT trip: ${probe.what}`);
      failed++;
    } else if (!problems.some((p) => p.includes(probe.expect))) {
      console.log(
        `❌ probe tripped the WRONG check: ${probe.what} — expected a problem containing ` +
          `"${probe.expect}", got: ${problems.join(' | ')}`,
      );
      failed++;
    } else {
      console.log(`✅ ${probe.what} — rejected (${problems.length})`);
    }
  }
  for (const probe of NEGATIVE_PROBES) {
    const problems = probe.run();
    if (problems.length > 0) {
      console.log(`❌ healthy shape REJECTED: ${probe.what} — ${problems.join('; ')}`);
      failed++;
    } else {
      console.log(`✅ ${probe.what} — accepted`);
    }
  }
  if (failed) {
    console.error(`\n❌ ${failed} probe(s) failed. The gate cannot see what it claims to.`);
    process.exit(1);
  }
  // The floors are asserted, not implied: a probe list that silently emptied would print nothing
  // and exit 0 — the defect class this whole script is about, one level up in the harness that is
  // supposed to be the evidence. The pattern-set floors are separate for the same reason: a
  // deleted RANGE_PATTERNS entry must cost a probe, not just a pattern.
  if (PROBES.length < 23 || NEGATIVE_PROBES.length < 12) {
    console.error(
      `❌ only ${PROBES.length} defect probe(s) and ${NEGATIVE_PROBES.length} healthy probe(s) — ` +
        `the selftest floor is 23 and 12`,
    );
    process.exit(1);
  }
  if (PROBES.filter((p) => p.expect.startsWith('(')).length < RANGE_PATTERNS.length + CARDINALITY_PATTERNS.length) {
    console.error(
      `❌ ${RANGE_PATTERNS.length + CARDINALITY_PATTERNS.length} pattern(s) are declared but fewer ` +
        `probes name one — every pattern must cost a probe, or a deleted pattern is free`,
    );
    process.exit(1);
  }
  console.log(`\n✅ all ${PROBES.length} defect probes tripped their own check and all ${NEGATIVE_PROBES.length} healthy shapes passed.`);
}

/* ──────────────────────────────────── main ──────────────────────────────────── */

function main() {
  const dir = join(ROOT, DECISIONS_DIR);
  const problems = [...checkConfiguration(SURFACE_FILES, RANGE_PATTERNS, CARDINALITY_PATTERNS), ...checkDecisionsDirPresence(existsSync(dir))];
  if (problems.length) {
    console.error(`\n❌ ${problems.length} LLM ADR-surface problem(s):\n`);
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }

  // Symlinks resolved before classification, matching check-adr-index.mjs: `Dirent.isFile()` is
  // false for one, and a symlinked record is still a record.
  const entries = readdirSync(dir, { withFileTypes: true }).map((d) => {
    let isFile = d.isFile();
    let isDirectory = d.isDirectory();
    if (d.isSymbolicLink()) {
      try {
        const st = statSync(join(dir, d.name));
        isFile = st.isFile();
        isDirectory = st.isDirectory();
      } catch {
        isFile = false;
        isDirectory = false;
      }
    }
    return { name: d.name, isFile, isDirectory, childCount: isDirectory ? readdirSync(join(dir, d.name)).length : 0 };
  });
  const { files: records, problems: discoveryProblems } = classifyEntries(entries);
  problems.push(...discoveryProblems);

  console.log(`records: ${records.length} in ${DECISIONS_DIR}`);
  for (const name of SURFACE_FILES) {
    const path = join(ROOT, name);
    const presence = checkSurfacePresence(name, existsSync(path));
    if (presence.length) {
      problems.push(...presence);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    const read = checkSurfaceRead(name, text);
    if (read.length) {
      problems.push(...read);
      continue;
    }
    const lines = text.split('\n');
    const refs = extractRecordRefs(lines);
    console.log(`  ${name}: ${new Set(refs.map((r) => r.file)).size} record reference(s), ${lines.length} line(s)`);
    problems.push(
      ...checkRefSet(name, refs, records),
      ...checkNoRanges(name, lines, RANGE_PATTERNS),
      ...checkNoCardinality(name, lines, CARDINALITY_PATTERNS),
      ...checkPointer(name, lines),
    );
  }

  if (problems.length) {
    console.error(`\n❌ ${problems.length} LLM ADR-surface problem(s):\n`);
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log(
    `\n✅ neither LLM surface carries a hand-maintained ADR index: no range expression, no ` +
      `set-wide claim, every reference set empty or complete, and both point at ${POINTER_PATH}.`,
  );
}

// Run-as-CLI guard, matching check-adr-index.mjs — without it, importing this module for its
// exported checks runs main() and calls process.exit.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else main();
}
