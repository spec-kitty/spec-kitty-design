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
 * and `llms-full.txt` carried three ADR range expressions plus a set-wide `Status of every ADR
 * below is Accepted`. None of it was gated.
 *
 * THE OPERATOR RULED on #197: point at `docs/architecture/README.md`'s table instead of
 * restating it, and gate it so no hand list can exist to drift. This gate refuses, per surface:
 *
 *   1. an ADR RANGE expression — `ADR-1 through ADR-13`, `ADRs 8–13`, `ADR-8–13`,
 *      `ADR-1 up to ADR-13`, `everything between ADR-1 and ADR-13`, `decisions 1 through 13`;
 *   2. a set-wide CARDINALITY, ENUMERATION or STATUS claim — "All Accepted architectural
 *      decision records", "Status of every ADR below is Accepted", "the complete list of ADRs
 *      follows", "the 15 ADRs";
 *   3. a record link set that does not match the branch that surface DECLARED (below);
 *   4. a per-record ANCHOR link into the index — a hand list aimed at the table's rows;
 *   5. the ABSENCE of the pointer that replaces all of the above.
 *
 * EACH SURFACE DECLARES ITS BRANCH, and the declaration is itself gated (`SURFACE_CONTRACTS`).
 * The rule #197 asked for is "empty OR complete, never a subset". Enforcing that as a disjunction
 * was not enough, and a pre-merge lens proved it twice:
 *
 *   - Collapsing the extractor (`sed` away the `.md` suffix in every backticked record path)
 *     took `llms-full.txt` from 15 references to 0, which the disjunction ACCEPTED as the empty
 *     branch — while the file still listed fifteen record paths in prose and a sixteenth record
 *     on disk stayed green. The gate that refuses empty sets on the RECORDS side had no floor on
 *     the REFERENCES side.
 *   - Deleting one entry from the surface list silently disabled half the gate. Flooring
 *     `length === 0` floors the wrong thing; the floor has to be the SET.
 *
 * So `llms.txt` declares `empty` and `llms-full.txt` declares `complete`, `checkConfiguration`
 * holds that manifest against a second literal copy of itself, and a declared-`complete` surface
 * whose reference count reaches ZERO is a FAILURE with its own message — an extractor that
 * stopped seeing anything cannot masquerade as a file that stopped listing anything.
 *
 * WHAT THIS GATE CANNOT SEE, stated because the alternative is a header that implies more
 * coverage than exists. **The empty-or-complete rule binds only PATH-BEARING lists** — a hand
 * list is caught when its items are written as `docs/architecture/decisions/<file>.md`. A prose
 * list that names records without ever writing a record path ("ADR-1 Token Distribution Format —
 * CSS custom properties", three bullets, no links) carries zero references, takes the empty
 * branch, and passes. That hole is closed for the one variant that has a structural signature —
 * links into the index's own per-record anchors (`README.md#adr-1`), refused by
 * `checkNoAnchorList` — and left open for the linkless variant deliberately. A general prose-list
 * detector is an arms race whose false positives would get this gate deleted (see the F-6 healthy
 * probes below, all of which a slightly greedier pattern set red-ed), and a gate someone deletes
 * protects nothing. What DOES still catch the linkless variant in practice is that such a list
 * almost always carries a range or a set-wide claim, and both of those are refused above.
 *
 * THE CHECKS ARE PURE FUNCTIONS over parsed inputs, so `--selftest` can feed them synthetic
 * defects without touching the filesystem — the shape `check-release-graph.mjs`,
 * `build-react-wrappers.mjs` and `check-adr-index.mjs` already use. Every probe declares
 * `expect`, a substring of the problem it is supposed to provoke, because #193's mutation sweep
 * found four of its own guards deletable while `--selftest` printed a tick.
 *
 * AND THE COMPOSITION IS PROBED, not just the parts. Every check being individually probed left
 * `main()` free to stop calling one: deleting `...checkPointer(name, lines)` from the spread kept
 * `--selftest` green AND passed the real gate with the pointer deleted, and three other spread
 * deletions red-ed only by collateral from a sibling check — the exact defect the `expect`
 * mechanism exists to prevent, one level up. So the whole run is a pure function too
 * (`runAll`), `main()` does IO and nothing else, and each spread element has a composition probe
 * that feeds `checkSurface` a surface healthy in every respect but one.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It takes no position on any record's Status, title or
 * content, and it never reads a record's body — `check-adr-index.mjs` owns status transcription.
 *
 * `classifyEntries` is IMPORTED from check-adr-index.mjs rather than reimplemented. What counts
 * as a record must have exactly one owner, and #193 owns it. That module carries a run-as-CLI
 * guard, so importing it runs no checks.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyEntries, DECISIONS_DIR, INDEX_FILE } from './check-adr-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The surfaces this gate owns, and WHICH BRANCH of the empty-or-complete rule each one took.
 *
 * `llms.txt` is a link index: its ADR entries were the index-shaped claim and nothing else, so it
 * references no record at all. `llms-full.txt` is prose whose per-record summaries are content —
 * the file's whole purpose for a reader who cannot open the record — so it references every
 * record, and the gate holds that set complete.
 *
 * Changing either value is a deliberate, reviewable act: `checkConfiguration` holds this manifest
 * against a second literal copy of itself, so flipping `llms-full.txt` to `empty` to dodge the
 * anti-vacuity floor reds rather than passes.
 */
export const SURFACE_CONTRACTS = Object.freeze({
  'llms.txt': 'empty',
  'llms-full.txt': 'complete',
});

/** Derived, so the two can never disagree about which files exist. */
export const SURFACE_FILES = Object.keys(SURFACE_CONTRACTS);

/** The path a pointer must name. The table under it is #193's, and it is gated against the directory. */
export const POINTER_PATH = INDEX_FILE;

/* ─────────────────────────────────── parsers ─────────────────────────────────── */

/**
 * Every reference to a record file, wherever it appears and in whatever syntax.
 *
 * A markdown link, a bare path, a backticked path and a full `https://github.com/…/blob/main/…`
 * URL are all references: each one tells a reader that this file knows about that record, and
 * each one goes stale the same way. Narrowing this to markdown links would have missed all
 * fourteen of `llms-full.txt`'s, which are backticked paths.
 *
 * A NARROWED EXTRACTOR IS THE DANGEROUS DIRECTION, because an empty reference set is legitimate
 * for a surface that declared `empty` — so a collapsed extractor reads as a clean file. Two
 * things stand against that: the positive/negative extractor probes below, and the declared
 * `complete` contract, which makes zero references on `llms-full.txt` a failure rather than a
 * branch.
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

const NUMBER_WORD =
  '\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty';

/** What a record is called. Ranges are written over any of these nouns. */
const SUBJECT = '(?:ADRs?|decisions?|records?)';
/** The subject for set claims. */
const SET_SUBJECT = '(?:ADRs?|decision\\s+records?|records?)';
/** STATUS VALUES ONLY. The bare word "Status" is deliberately absent: "each ADR carries its own
 *  Status field" is a statement about record FORMAT, and a gate that reds on it gets deleted. */
const STATUS_VALUE = '(?:Accepted|Proposed|Complete|Completed|Superseded|Deprecated|Rejected|Withdrawn|ratified)';
/** Words that quantify over the WHOLE set. "two" is not one of them, on purpose. */
const TOTALITY = '(?:all|every|each|the\\s+(?:entire|whole|complete|full))';
/**
 * The gap a set claim may span — anything but a SENTENCE OR CLAUSE BOUNDARY.
 *
 * `[^\n]` was too greedy in exactly the way F-6 warns about, and it was caught by putting F-6's
 * own five healthy sentences into the real file rather than only into probes: "Every ADR lives in
 * its own file. Two decision records were superseded in 2026." red-ed as one claim, because the
 * quantifier of the first sentence reached the status value of the second across the full stop.
 * Each sentence passes alone; only their adjacency on one wrapped line failed. Excluding `.;!?`
 * costs nothing real — every claim this gate must catch is a single clause — and the two-sentence
 * line is now a healthy probe.
 */
const GAP = '[^\\n.;!?]';

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
 *   - a WORD separator (`through`, `to`, `up to`, `..`) is unambiguous, so the second operand may
 *     be bare, and the subject may be `decisions` or `records` rather than `ADR`;
 *   - a dash separator with BOTH operands ADR-prefixed is unambiguous whatever the spacing;
 *   - `ADRs 8–13` is unambiguous because of the plural subject;
 *   - `ADR-8–13` and `ADR 1-13` are unambiguous because there is NO whitespace around the dash —
 *     which is exactly what a title dash always has;
 *   - `between X and Y` is a range in words, and `and` alone is not (`ADR-6 and ADR-7`).
 *
 * Both directions are probed: each form trips its own pattern, and the title dash does not.
 */
export const RANGE_PATTERNS = [
  {
    name: 'word-range',
    re: new RegExp(`\\b${SUBJECT}[\\s-]*0*\\d+\\s*(?:through|thru|up\\s+to|to|\\.\\.\\.?)\\s*(?:${SUBJECT}[\\s-]*)?0*\\d+\\b`, 'i'),
  },
  { name: 'dash-range-both-sides', re: /\bADRs?[\s-]*0*\d+\s*[-–—]\s*ADRs?[\s-]*0*\d+\b/i },
  { name: 'plural-numeric-range', re: /\b(?:ADRs|decisions|records)\s+0*\d+\s*[-–—]\s*0*\d+\b/i },
  { name: 'tight-dash-range', re: /\bADRs?[-\s]0*\d+[-–—]0*\d+\b/i },
  {
    name: 'between-range',
    re: new RegExp(`\\bbetween\\s+${SUBJECT}[\\s-]*0*\\d+\\s+and\\s+(?:${SUBJECT}[\\s-]*)?0*\\d+\\b`, 'i'),
  },
];

/**
 * SET-WIDE cardinality, enumeration and status claims. `llms.txt`'s "All Accepted architectural
 * decision records" is the whole class in one clause: it says how many (all) and what status
 * (Accepted) about a set it then lists three members of.
 *
 * THESE ARE ABOUT THE SET, NOT ABOUT A RECORD, and the distinction is load-bearing rather than
 * decorative. A pre-merge lens red-ed this gate on five sentences these files are entitled to
 * contain — `one decision record per file.`, `all decision records live under …`, `each ADR
 * carries its own Status field.`, `every ADR lives in its own file.`, `two decision records were
 * superseded in 2026.` — every one of them a statement about record FORMAT or about a named
 * subset. The current shape is what tells those apart from an index claim:
 *
 *   - a TOTALITY quantifier alone is not enough; it must land in the same sentence as a STATUS
 *     VALUE ("all decision records live under …" is fine, "all decision records are Accepted"
 *     is not);
 *   - the bare word "Status" is NOT a status value, so describing the field is fine;
 *   - a COUNT is only a claim when it sits in a total-assertion frame (`there are N`, `the N`,
 *     `all N`, `contains N`), so "two decision records were superseded" passes and "the 15 ADRs"
 *     does not. This is the one place a legitimate sentence can still red: "the three ADRs that
 *     govern the styles layer" is refused. That is deliberate — this file does not own the ADR
 *     set and has no business counting any part of it — and it is stated here rather than
 *     discovered.
 *
 * All five healthy sentences are probes below, so they stay passing.
 */
export const CARDINALITY_PATTERNS = [
  {
    name: 'set-status-claim',
    re: new RegExp(`\\b${TOTALITY}\\b${GAP}{0,60}?\\b${SET_SUBJECT}\\b${GAP}{0,60}?\\b${STATUS_VALUE}\\b`, 'i'),
  },
  {
    // The same claim with the status ahead of the noun: "All Accepted architectural decision records".
    name: 'set-status-claim-inverted',
    re: new RegExp(`\\b${TOTALITY}\\b${GAP}{0,40}?\\b${STATUS_VALUE}\\b${GAP}{0,40}?\\b${SET_SUBJECT}\\b`, 'i'),
  },
  {
    // "the status of the records below is Accepted" — scoped by position rather than by quantifier.
    name: 'below-set-status',
    re: new RegExp(
      `\\b${SET_SUBJECT}\\s+(?:below|above|that\\s+follow|listed\\s+here|in\\s+this\\s+(?:file|section))\\b${GAP}{0,60}?\\b${STATUS_VALUE}\\b`,
      'i',
    ),
  },
  {
    // "the complete list of ADRs follows", "an exhaustive ADR list follows".
    name: 'enumeration-claim',
    re: new RegExp(
      `\\b(?:complete|exhaustive|full|entire)\\s+(?:(?:list|set|index|enumeration)\\s+of\\s+(?:the\\s+)?${SET_SUBJECT}|(?:ADR|decision[-\\s]record)s?\\s+(?:list|set|index))\\b`,
      'i',
    ),
  },
  {
    name: 'counted-set',
    re: new RegExp(
      `\\b(?:there\\s+are|the|all|these|contains?|holds?|totalling|totaling)\\s+(?:${NUMBER_WORD})\\s+(?:of\\s+the\\s+)?(?:ADRs?|decision\\s+records?)\\b`,
      'i',
    ),
  },
];

/**
 * A per-record anchor into the index — `docs/architecture/README.md#adr-1`.
 *
 * This is the one prose-list variant with a structural signature, and it is the shape the
 * pre-merge lens used to walk a hand list straight past the empty-or-complete rule: three bullets
 * linking to the table's own row anchors carry NO record path, so the reference set stayed empty
 * and the file passed. Nobody writes `#adr-<n>` for any reason other than pointing at one row, so
 * refusing it costs nothing. The section anchor this repo actually uses — `#decisions-adrs` — has
 * no digit after `adr` and is not matched; that is a negative probe.
 */
export const ANCHOR_PATTERN = /#adrs?-?0*\d+/i;

/* ─────────────────────────── the checks, as pure functions ─────────────────────────── */

/**
 * THE CONFIGURATION FLOOR — and it floors the SET, not its size.
 *
 * `surfaceNames.length === 0` was the original floor and it floored the wrong thing: deleting one
 * of the two entries left a non-empty list, so half the gate switched off while the console still
 * printed a tick. Reproduced by a pre-merge lens with `['llms-full.txt']` alone — a planted
 * one-of-fifteen list plus "all fifteen ADRs, ADR-1 through ADR-15, are Accepted" in `llms.txt`
 * passed green, where the control reds with three problems.
 *
 * The expected manifest below is a SECOND LITERAL COPY of `SURFACE_CONTRACTS`, on purpose. It is
 * not derived from it, because a floor derived from the thing it floors is not a floor. Changing
 * which surfaces this gate owns, or which branch one of them takes, now costs two edits in one
 * diff instead of one edit nobody notices.
 */
export function checkConfiguration(contracts, rangePatterns, cardinalityPatterns) {
  const problems = [];
  const EXPECTED = { 'llms.txt': 'empty', 'llms-full.txt': 'complete' };
  const got = contracts ?? {};

  if (Object.keys(got).length === 0) {
    problems.push(
      `the surface manifest is empty — this gate would examine no file and report success. An ` +
        `empty subject is a broken gate, not a clean tree.`,
    );
  }
  for (const [name, branch] of Object.entries(EXPECTED)) {
    if (!(name in got)) {
      problems.push(
        `the surface manifest no longer covers ${name} — half this gate switches off with one ` +
          `deleted entry and the console still prints a tick. If that surface is genuinely gone, ` +
          `say so here deliberately.`,
      );
    } else if (got[name] !== branch) {
      problems.push(
        `${name} declares the "${got[name]}" branch but this gate was built against "${branch}" — ` +
          `flipping the branch is how an anti-vacuity floor gets dodged, so it is a two-edit ` +
          `change made in one reviewable diff, not a one-line change nobody sees.`,
      );
    }
  }
  for (const name of Object.keys(got)) {
    if (!(name in EXPECTED)) {
      problems.push(`the surface manifest carries an unexpected entry ${name} — this gate knows nothing about it`);
    }
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
 * FR-007/FR-012 — the referenced record set matches the branch this surface DECLARED.
 *
 * The subset is the original defect: a file referencing three of fifteen records reads exactly
 * like an index to someone who cannot count the directory, and it degrades one record at a time
 * with nothing ever becoming syntactically wrong.
 *
 * THE ZERO CASE IS THE SUBTLE ONE. Read as a plain disjunction ("empty or complete"), zero
 * references is always legitimate — which means a broken extractor is indistinguishable from a
 * file that took the pointer branch. A lens collapsed the extractor with one `sed` and watched
 * `llms-full.txt` go from 15 references to 0 and stay GREEN with fifteen record paths still in
 * the file. Because that surface declares `complete`, zero is now a named failure with its own
 * message: the anti-vacuity floor on the REFERENCES side, matching the one already on the
 * RECORDS side.
 */
export function checkRefSet(name, refs, records, contract) {
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

  if (contract === 'empty') {
    if (referenced.length > 0) {
      problems.push(
        `${name} declares the empty branch but references ${referenced.length} record(s) ` +
          `(${referenced.join(', ')}) — a hand list has reappeared in a file whose ADR entry is ` +
          `supposed to be a pointer at ${POINTER_PATH}'s table and nothing else`,
      );
    }
    return problems;
  }

  // contract === 'complete'
  if (referenced.length === 0) {
    problems.push(
      `${name} declares the complete branch but references ZERO records under ${DECISIONS_DIR} — ` +
        `refusing to read that as "this file took the pointer branch". A surface that lists every ` +
        `record does not silently stop listing them; a reference extractor that stopped matching ` +
        `does. Either the extractor broke or the branch changed, and the branch is declared in ` +
        `SURFACE_CONTRACTS, not inferred from a count.`,
    );
    return problems;
  }
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

/** FR-009 — no set-wide claim about how many ADRs there are, what statuses they hold, or that this file lists them. */
export function checkNoCardinality(name, lines, patterns) {
  const problems = [];
  (lines ?? []).forEach((line, i) => {
    for (const p of patterns ?? []) {
      const m = String(line).match(p.re);
      if (m) {
        problems.push(
          `${name}:${i + 1} carries a set-wide ADR claim (${p.name}): "${m[0]}" — in ` +
            `"${String(line).trim()}". This file does not own the ADR set and cannot report its ` +
            `size, its statuses, or that it enumerates it; ${POINTER_PATH}'s table does, and it ` +
            `is gated against the directory. A statement about record FORMAT ("one decision ` +
            `record per file") is fine and is probed to stay fine.`,
        );
      }
    }
  });
  return problems;
}

/** FR-017 — no per-record anchor link into the index. See ANCHOR_PATTERN for why this one variant. */
export function checkNoAnchorList(name, lines) {
  const problems = [];
  (lines ?? []).forEach((line, i) => {
    const m = String(line).match(ANCHOR_PATTERN);
    if (m) {
      problems.push(
        `${name}:${i + 1} links a per-record anchor into the ADR index ("${m[0]}") — in ` +
          `"${String(line).trim()}". A list of row anchors is a hand list that carries no record ` +
          `path, so the empty-or-complete rule never sees it. Link ${POINTER_PATH}'s table once, ` +
          `not its rows.`,
      );
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
 * of: the path, the word ADR, and the claim that the table is `authoritative`.
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

/**
 * ONE SURFACE, every check. Extracted from `main()` so the COMPOSITION is probeable: with the
 * spread inlined in `main()`, deleting `...checkPointer(name, lines)` left `--selftest` green and
 * passed the real gate with the pointer removed. Each element below now has a composition probe.
 */
export function checkSurface(name, text, records, contract) {
  const read = checkSurfaceRead(name, text);
  if (read.length) return read;
  const lines = String(text).split('\n');
  const refs = extractRecordRefs(lines);
  return [
    ...checkRefSet(name, refs, records, contract),
    ...checkNoRanges(name, lines, RANGE_PATTERNS),
    ...checkNoCardinality(name, lines, CARDINALITY_PATTERNS),
    ...checkNoAnchorList(name, lines),
    ...checkPointer(name, lines),
  ];
}

/**
 * THE WHOLE RUN, as a pure function over already-read inputs. `main()` below does IO and printing
 * and nothing else, so everything that decides pass or fail is reachable from `--selftest`.
 */
export function runAll({ contracts, decisionsDirExists, records, surfaceTexts }) {
  const upstream = [
    ...checkConfiguration(contracts, RANGE_PATTERNS, CARDINALITY_PATTERNS),
    ...checkDecisionsDirPresence(decisionsDirExists),
  ];
  // A broken manifest or a missing directory makes every per-surface answer meaningless, so they
  // are reported alone rather than buried under the noise they would cause.
  if (upstream.length) return upstream;

  const problems = [];
  for (const [name, contract] of Object.entries(contracts ?? {})) {
    const text = surfaceTexts?.[name];
    const presence = checkSurfacePresence(name, typeof text === 'string');
    if (presence.length) {
      problems.push(...presence);
      continue;
    }
    problems.push(...checkSurface(name, text, records, contract));
  }
  return problems;
}

/* ──────────────────────────────────── selftest ──────────────────────────────────── */

const REC = ['a.md', 'b.md'];
const ref = (file, line = 1) => ({ file, line, text: '' });
const POINTER_LINE = `The authoritative ADR index is the table in \`${POINTER_PATH}\`.`;
const CONTRACTS = { 'llms.txt': 'empty', 'llms-full.txt': 'complete' };

/** A surface healthy in every respect, plus whatever defect lines a probe wants to add. */
const surface = (...extra) => ['# synthetic surface', POINTER_LINE, 'Some prose about tokens.', ...extra].join('\n');

/**
 * Every probe declares `expect`: a substring of the problem it is supposed to provoke, and the
 * inputs are narrowed so each provokes its own check as directly as it can.
 *
 * WITHOUT `expect` a probe passes when ANY check fires, and #193's mutation sweep proved that is
 * not a theoretical concern. A later sweep of THIS file proved the same thing one level up, which
 * is what the `COMPOSITION:` probes at the end exist for.
 */
const PROBES = [
  // ── configuration floors ───────────────────────────────────────────────────────
  { what: 'an emptied surface manifest', expect: 'the surface manifest is empty', run: () => checkConfiguration({}, RANGE_PATTERNS, CARDINALITY_PATTERNS) },
  {
    what: 'a surface manifest shrunk to one file (F-3)',
    expect: 'no longer covers llms.txt',
    run: () => checkConfiguration({ 'llms-full.txt': 'complete' }, RANGE_PATTERNS, CARDINALITY_PATTERNS),
  },
  {
    what: "llms-full.txt's branch flipped to empty to dodge the anti-vacuity floor",
    expect: 'declares the "empty" branch but this gate was built against "complete"',
    run: () => checkConfiguration({ 'llms.txt': 'empty', 'llms-full.txt': 'empty' }, RANGE_PATTERNS, CARDINALITY_PATTERNS),
  },
  {
    what: 'an unexpected surface added to the manifest',
    expect: 'carries an unexpected entry',
    run: () => checkConfiguration({ ...CONTRACTS, 'README.md': 'empty' }, RANGE_PATTERNS, CARDINALITY_PATTERNS),
  },
  { what: 'an emptied range pattern set', expect: 'the ADR range pattern set is empty', run: () => checkConfiguration(CONTRACTS, [], CARDINALITY_PATTERNS) },
  { what: 'an emptied cardinality pattern set', expect: 'the ADR cardinality pattern set is empty', run: () => checkConfiguration(CONTRACTS, RANGE_PATTERNS, []) },
  // ── presence floors ────────────────────────────────────────────────────────────
  { what: 'a missing decisions directory', expect: 'refusing to certify an ADR surface against a directory', run: () => checkDecisionsDirPresence(false) },
  { what: 'a surface file that is not on disk', expect: 'refusing to report a clean ADR surface for a file that is not there', run: () => checkSurfacePresence('llms.txt', false) },
  { what: 'a surface file that is empty', expect: 'refusing to certify an ADR surface with no content', run: () => checkSurfaceRead('llms.txt', '   \n\n') },
  // ── the reference set ──────────────────────────────────────────────────────────
  {
    what: 'a reference set over an empty decisions directory',
    expect: "refusing to certify llms.txt's ADR reference set over nothing",
    run: () => checkRefSet('llms.txt', [ref('a.md')], [], 'empty'),
  },
  {
    what: 'a COLLAPSED EXTRACTOR — a declared-complete surface with zero references (F-2)',
    expect: 'declares the complete branch but references ZERO records',
    run: () => checkRefSet('llms-full.txt', [], REC, 'complete'),
  },
  {
    what: 'a partial reference list — one of two records',
    expect: 'must be EMPTY or COMPLETE',
    run: () => checkRefSet('llms-full.txt', [ref('a.md')], REC, 'complete'),
  },
  {
    what: 'a hand list reappearing in a declared-empty surface',
    expect: 'declares the empty branch but references 1 record(s)',
    run: () => checkRefSet('llms.txt', [ref('a.md')], REC, 'empty'),
  },
  {
    what: 'a reference to a record that does not exist',
    // Narrowed to a COMPLETE live set plus one corpse, so the incomplete-set branch cannot carry
    // this probe. With an incomplete live set it did, which is why deleting the stale branch was
    // green on the first draft of this table.
    expect: 'which does not exist — a stale reference',
    run: () => checkRefSet('llms-full.txt', [ref('a.md'), ref('b.md'), ref('gone.md')], REC, 'complete'),
  },
  // ── ranges: one probe per pattern, so deleting any single pattern reds ──────────
  { what: 'a word range (ADR-1 through ADR-13)', expect: '(word-range)', run: () => checkNoRanges('x', ['ADRs (ADR-1 through ADR-13 + ADR-3 addendum)'], RANGE_PATTERNS) },
  { what: 'a word range spelled "up to" (ADR-1 up to ADR-13)', expect: '(word-range)', run: () => checkNoRanges('x', ['see ADR-1 up to ADR-13 for the original design'], RANGE_PATTERNS) },
  { what: 'a word range over a non-ADR subject (decisions 1 through 13)', expect: '(word-range)', run: () => checkNoRanges('x', ['decisions 1 through 13 are the original design'], RANGE_PATTERNS) },
  { what: 'a spaced dash range with both operands ADR-prefixed', expect: '(dash-range-both-sides)', run: () => checkNoRanges('x', ['the elements-first set is ADR-8 — ADR-13 inclusive'], RANGE_PATTERNS) },
  { what: 'a plural numeric range (ADRs 8–13)', expect: '(plural-numeric-range)', run: () => checkNoRanges('x', ['ADRs 8–13 are committed'], RANGE_PATTERNS) },
  { what: 'a tight dash range (ADR-8–13)', expect: '(tight-dash-range)', run: () => checkNoRanges('x', ['governing decisions: ADR-8–13'], RANGE_PATTERNS) },
  { what: 'a tight dash range written with a space (see ADR 1-13)', expect: '(tight-dash-range)', run: () => checkNoRanges('x', ['see ADR 1-13'], RANGE_PATTERNS) },
  { what: 'a worded range (everything between ADR-1 and ADR-13)', expect: '(between-range)', run: () => checkNoRanges('x', ['everything between ADR-1 and ADR-13 is the original design'], RANGE_PATTERNS) },
  // ── cardinality: one probe per pattern ─────────────────────────────────────────
  { what: '"Status of every ADR below is Accepted"', expect: '(set-status-claim)', run: () => checkNoCardinality('x', ['Status of every ADR below is **Accepted**.'], CARDINALITY_PATTERNS) },
  { what: '"the full set of ADRs is Accepted"', expect: '(set-status-claim)', run: () => checkNoCardinality('x', ['the full set of ADRs is Accepted'], CARDINALITY_PATTERNS) },
  { what: '"All Accepted architectural decision records"', expect: '(set-status-claim-inverted)', run: () => checkNoCardinality('x', ['ADR directory: All Accepted architectural decision records.'], CARDINALITY_PATTERNS) },
  { what: '"the status of the records below is Accepted"', expect: '(below-set-status)', run: () => checkNoCardinality('x', ['The status of the records below is Accepted.'], CARDINALITY_PATTERNS) },
  { what: '"the complete list of ADRs follows"', expect: '(enumeration-claim)', run: () => checkNoCardinality('x', ['the complete list of ADRs follows'], CARDINALITY_PATTERNS) },
  { what: '"an exhaustive ADR list follows"', expect: '(enumeration-claim)', run: () => checkNoCardinality('x', ['an exhaustive ADR list follows'], CARDINALITY_PATTERNS) },
  { what: 'a framed ADR count ("the 15 ADRs summarised here")', expect: '(counted-set)', run: () => checkNoCardinality('x', ['the 15 ADRs summarised here'], CARDINALITY_PATTERNS) },
  { what: 'a framed record count ("there are fifteen decision records")', expect: '(counted-set)', run: () => checkNoCardinality('x', ['there are fifteen decision records'], CARDINALITY_PATTERNS) },
  // ── the anchor list ────────────────────────────────────────────────────────────
  {
    what: 'a hand list linking the index per-record anchors (F-1, the linked variant)',
    expect: 'links a per-record anchor into the ADR index',
    run: () => checkNoAnchorList('llms.txt', [`- [ADR-1 Token Distribution Format](${POINTER_PATH}#adr-1): CSS custom properties.`]),
  },
  // ── the pointer ────────────────────────────────────────────────────────────────
  { what: 'a surface with no pointer at all', expect: 'carries no pointer to the authoritative ADR index', run: () => checkPointer('llms.txt', ['# spec-kitty-design', 'some prose about tokens']) },
  { what: 'a surface naming the README but not calling its table authoritative', expect: 'carries no pointer to the authoritative ADR index', run: () => checkPointer('llms.txt', [`[Architecture index](${POINTER_PATH}): reading order, including ADRs.`]) },
  { what: 'a surface calling something authoritative without naming the README', expect: 'carries no pointer to the authoritative ADR index', run: () => checkPointer('llms.txt', ['The authoritative ADR index lives somewhere in docs/.']) },
  { what: 'a surface with an authoritative README pointer that never mentions ADRs', expect: 'carries no pointer to the authoritative ADR index', run: () => checkPointer('llms.txt', [`${POINTER_PATH} is the authoritative reading order.`]) },
  // ── COMPOSITION (F-4): one probe per element of checkSurface's spread ───────────
  //
  // Each feeds a surface healthy in EVERY respect but one, so deleting that element of the spread
  // reds here and nowhere else. Without these, four of the five spread elements were deletable —
  // one of them (checkPointer) with the real gate still passing on a pointerless llms.txt.
  {
    what: 'COMPOSITION: checkSurface runs the reference-set check',
    expect: 'declares the empty branch but references 1 record(s)',
    run: () => checkSurface('llms.txt', surface('See `docs/architecture/decisions/a.md` for the first one.'), REC, 'empty'),
  },
  {
    what: 'COMPOSITION: checkSurface runs the range check',
    expect: '(word-range)',
    run: () => checkSurface('llms.txt', surface('ADR-1 through ADR-13 are the original design.'), REC, 'empty'),
  },
  {
    what: 'COMPOSITION: checkSurface runs the cardinality check',
    expect: '(set-status-claim-inverted)',
    run: () => checkSurface('llms.txt', surface('All Accepted architectural decision records.'), REC, 'empty'),
  },
  {
    what: 'COMPOSITION: checkSurface runs the anchor-list check',
    expect: 'links a per-record anchor into the ADR index',
    run: () => checkSurface('llms.txt', surface(`- [ADR-1](${POINTER_PATH}#adr-1): the first one.`), REC, 'empty'),
  },
  {
    what: 'COMPOSITION: checkSurface runs the pointer check',
    expect: 'carries no pointer to the authoritative ADR index',
    run: () => checkSurface('llms.txt', ['# synthetic surface', 'Some prose about tokens.'].join('\n'), REC, 'empty'),
  },
  {
    what: 'COMPOSITION: checkSurface runs the empty-file floor',
    expect: 'refusing to certify an ADR surface with no content',
    run: () => checkSurface('llms.txt', '  \n \n', REC, 'empty'),
  },
  {
    what: 'COMPOSITION: runAll reaches every surface in the manifest, not just the first',
    expect: 'llms-full.txt declares the complete branch but references ZERO records',
    run: () =>
      runAll({
        contracts: CONTRACTS,
        decisionsDirExists: true,
        records: REC,
        surfaceTexts: { 'llms.txt': surface(), 'llms-full.txt': surface() },
      }),
  },
  {
    what: 'COMPOSITION: runAll reports a missing surface rather than skipping it',
    expect: 'refusing to report a clean ADR surface for a file that is not there',
    run: () =>
      runAll({
        contracts: CONTRACTS,
        decisionsDirExists: true,
        records: REC,
        surfaceTexts: { 'llms-full.txt': surface('`docs/architecture/decisions/a.md`, `docs/architecture/decisions/b.md`.') },
      }),
  },
  {
    what: 'COMPOSITION: runAll runs the configuration floor before anything else',
    expect: 'the surface manifest is empty',
    run: () => runAll({ contracts: {}, decisionsDirExists: true, records: REC, surfaceTexts: {} }),
  },
  {
    what: 'COMPOSITION: runAll runs the decisions-directory floor',
    expect: 'refusing to certify an ADR surface against a directory',
    run: () => runAll({ contracts: CONTRACTS, decisionsDirExists: false, records: REC, surfaceTexts: {} }),
  },
];

/**
 * The inverse table: shapes that MUST be accepted.
 *
 * The F-6 group is the reason this gate survives contact with an editor. Every one of those five
 * sentences RED-ed an earlier draft, and all five are things these files are entitled to say —
 * `llms-full.txt` currently opens the section with "The records live under …", and prefixing
 * "All" would have failed CI on a sentence that is true and is exactly what the ruling asks the
 * file to say.
 *
 * The extractor pair is the other load-bearing group. An extractor narrowed to nothing makes
 * every reference set empty, and empty is legitimate for `llms.txt` — the declared `complete`
 * contract catches it for `llms-full.txt`, and these probes catch it at the source.
 */
const NEGATIVE_PROBES = [
  { what: 'a summary heading with a title dash (### ADR-7 — Storybook 10.x Adoption)', run: () => checkNoRanges('x', ['### ADR-7 — Storybook 10.x Adoption (Angular 21 Compatibility)'], RANGE_PATTERNS) },
  { what: 'two records named with "and" (ADR-6 and ADR-7 are superseded)', run: () => checkNoRanges('x', ['**ADR-6 and ADR-7 are superseded on the framework question.**'], RANGE_PATTERNS) },
  { what: 'a citation inside prose (the component layer is a custom element (ADR-8))', run: () => checkNoRanges('x', ['The component layer is a **custom element** (ADR-8): behaviour lives in a Lit'], RANGE_PATTERNS) },
  { what: 'the addendum identifier (ADR-003-addendum-token-values.md)', run: () => checkNoRanges('x', ['`docs/architecture/decisions/ADR-003-addendum-token-values.md`. Records that'], RANGE_PATTERNS) },
  { what: 'a record dated 2026-05-01 (a date is not a range operand)', run: () => checkNoRanges('x', ['> **Reading order.** The records dated 2026-05-01 are the original design, and'], RANGE_PATTERNS) },
  { what: 'a count of something that is not ADRs (behaviours.json — 15 ids, 14 applicable)', run: () => [...checkNoRanges('x', ['  behaviours.json        # the behaviour id registry (ADR-11) — 15 ids, 14 applicable'], RANGE_PATTERNS), ...checkNoCardinality('x', ['  behaviours.json        # the behaviour id registry (ADR-11) — 15 ids, 14 applicable'], CARDINALITY_PATTERNS)] },
  { what: 'a cardinality claim about tokens rather than decisions (All design tokens grouped by category)', run: () => checkNoCardinality('x', ['[Token catalogue (JSON)](…): All design tokens grouped by category.'], CARDINALITY_PATTERNS) },
  { what: 'prose naming three records while explaining a rule (points at the ADRs (ADR-001 …, ADR-002 …))', run: () => [...checkNoRanges('x', ['points at the ADRs (ADR-001 token-only CSS, ADR-002 dependency direction,'], RANGE_PATTERNS), ...checkNoCardinality('x', ['points at the ADRs (ADR-001 token-only CSS, ADR-002 dependency direction,'], CARDINALITY_PATTERNS)] },
  // F-6: statements about record FORMAT or about a named subset. All of these red-ed an earlier draft.
  { what: 'F-6: "one decision record per file."', run: () => checkNoCardinality('x', ['one decision record per file.'], CARDINALITY_PATTERNS) },
  { what: 'F-6: "all decision records live under docs/architecture/decisions/."', run: () => checkNoCardinality('x', ['all decision records live under docs/architecture/decisions/.'], CARDINALITY_PATTERNS) },
  { what: 'F-6: "each ADR carries its own Status field."', run: () => checkNoCardinality('x', ['each ADR carries its own Status field.'], CARDINALITY_PATTERNS) },
  { what: 'F-6: "every ADR lives in its own file."', run: () => checkNoCardinality('x', ['every ADR lives in its own file.'], CARDINALITY_PATTERNS) },
  { what: 'F-6: "two decision records were superseded in 2026."', run: () => checkNoCardinality('x', ['two decision records were superseded in 2026.'], CARDINALITY_PATTERNS) },
  { what: 'F-6: "All records live under `docs/architecture/decisions/`."', run: () => checkNoCardinality('x', ['All records live under `docs/architecture/decisions/`.'], CARDINALITY_PATTERNS) },
  {
    what: 'F-6: two healthy sentences adjacent on one wrapped line do not combine into one claim',
    run: () =>
      checkNoCardinality(
        'x',
        [
          'Every ADR lives in its own file. Two decision records were superseded in 2026.',
          'All decision records live under `docs/architecture/decisions/`. One decision record per file.',
          'Each ADR carries its own Status field. Every ADR lives in its own file.',
        ],
        CARDINALITY_PATTERNS,
      ),
  },
  { what: 'the section anchor this repo uses (#decisions-adrs) is not a per-record anchor', run: () => checkNoAnchorList('x', [`- [ADR index](${POINTER_PATH}#decisions-adrs): the authoritative ADR index.`]) },
  { what: 'an empty reference set under the empty contract (the pointer landing)', run: () => checkRefSet('llms.txt', [], REC, 'empty') },
  { what: 'a complete reference set under the complete contract (the prose landing)', run: () => checkRefSet('llms-full.txt', [ref('a.md'), ref('b.md'), ref('b.md')], REC, 'complete') },
  { what: 'a pointer worded differently but carrying all three tokens', run: () => checkPointer('x', [`For the full set of ADRs see the authoritative table in ${POINTER_PATH}.`]) },
  { what: 'the healthy manifest passes the configuration floor', run: () => checkConfiguration(SURFACE_CONTRACTS, RANGE_PATTERNS, CARDINALITY_PATTERNS) },
  { what: 'a healthy surface passes every check in checkSurface', run: () => checkSurface('llms.txt', surface(), REC, 'empty') },
  {
    what: 'a healthy world passes runAll end to end',
    run: () =>
      runAll({
        contracts: CONTRACTS,
        decisionsDirExists: true,
        records: REC,
        surfaceTexts: {
          'llms.txt': surface(),
          'llms-full.txt': surface('`docs/architecture/decisions/a.md` and `docs/architecture/decisions/b.md`.'),
        },
      }),
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
      return ['a.md', 'b.md', 'c.md', 'd.md']
        .filter((w) => !seen.includes(w))
        .map((w) => `${w} was NOT extracted — the reference pattern is too narrow, and a narrow extractor makes every partial list look empty`);
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
      console.log(`❌ probe tripped the WRONG check: ${probe.what} — expected a problem containing "${probe.expect}", got: ${problems.join(' | ')}`);
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
  // supposed to be the evidence.
  if (PROBES.length < 45 || NEGATIVE_PROBES.length < 24) {
    console.error(`❌ only ${PROBES.length} defect probe(s) and ${NEGATIVE_PROBES.length} healthy probe(s) — the selftest floor is 45 and 24`);
    process.exit(1);
  }
  const named = PROBES.filter((p) => p.expect.startsWith('(')).length;
  if (named < RANGE_PATTERNS.length + CARDINALITY_PATTERNS.length) {
    console.error(`❌ ${RANGE_PATTERNS.length + CARDINALITY_PATTERNS.length} pattern(s) are declared but only ${named} probe(s) name one — every pattern must cost a probe, or a deleted pattern is free`);
    process.exit(1);
  }
  // The composition probes are the answer to a real mutation survivor, so their count is floored
  // separately from the total: folding them away would restore a deletable spread.
  const composition = PROBES.filter((p) => p.what.startsWith('COMPOSITION:')).length;
  if (composition < 10) {
    console.error(`❌ only ${composition} composition probe(s) — the floor is 10, one per element of checkSurface's spread plus runAll's own wiring`);
    process.exit(1);
  }
  console.log(`\n✅ all ${PROBES.length} defect probes tripped their own check (${composition} of them on composition) and all ${NEGATIVE_PROBES.length} healthy shapes passed.`);
}

/* ──────────────────────────────────── main ──────────────────────────────────── */

function main() {
  const dir = join(ROOT, DECISIONS_DIR);
  const decisionsDirExists = existsSync(dir);

  let records = [];
  let discoveryProblems = [];
  if (decisionsDirExists) {
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
    ({ files: records, problems: discoveryProblems } = classifyEntries(entries));
  }

  const surfaceTexts = {};
  for (const name of Object.keys(SURFACE_CONTRACTS)) {
    const path = join(ROOT, name);
    if (existsSync(path)) surfaceTexts[name] = readFileSync(path, 'utf8');
  }

  if (decisionsDirExists) {
    console.log(`records: ${records.length} in ${DECISIONS_DIR}`);
    for (const [name, contract] of Object.entries(SURFACE_CONTRACTS)) {
      const text = surfaceTexts[name];
      if (typeof text !== 'string') continue;
      const lines = text.split('\n');
      console.log(`  ${name}: ${new Set(extractRecordRefs(lines).map((r) => r.file)).size} record reference(s) [declared ${contract}], ${lines.length} line(s)`);
    }
  }

  const problems = [...discoveryProblems, ...runAll({ contracts: SURFACE_CONTRACTS, decisionsDirExists, records, surfaceTexts })];

  if (problems.length) {
    console.error(`\n❌ ${problems.length} LLM ADR-surface problem(s):\n`);
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log(
    `\n✅ neither LLM surface carries a hand-maintained ADR index: no range expression, no ` +
      `set-wide claim, no per-record anchor list, each reference set matching its declared branch, ` +
      `and both point at ${POINTER_PATH}.`,
  );
}

// Run-as-CLI guard, matching check-adr-index.mjs — without it, importing this module for its
// exported checks runs main() and calls process.exit.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else main();
}
