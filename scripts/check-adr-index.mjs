#!/usr/bin/env node
/**
 * The ADR index, held to the directory it indexes (#193).
 *
 * WHY THIS EXISTS. `docs/architecture/README.md` carries a hand-maintained table of every
 * architectural decision record. Hand-maintained tables drift, and this one did. Measured on
 * `train/elements-first` @ 15c4abf, before this gate existed:
 *
 *     files on disk: 15
 *     table rows:     8
 *
 * Seven of fifteen records were unindexed — ADR-8, 9, 10, 11, 12, 13 and the ADR-003 addendum.
 * The three the elements-first programme cites most (ADR-9's label ownership, ADR-10's canonical
 * markup, ADR-11's verification stack) were all in the missing set, and had been for four days
 * of missions. The charter's `architectural_review_requirement` obliges every mission to review
 * the relevant ADRs before speccing; from that index, it was unsatisfiable.
 *
 * The instinct is already in this repo. `checkSubpathCoverage` in check-release-graph.mjs derives
 * coverage from a directory listing rather than a hand list, "precisely because hand lists drift",
 * and refuses to certify coverage over nothing. This is the same check one surface over: the
 * DIRECTORY is the source of truth, the table is the derived view, and both directions are
 * asserted — a stale row pointing at a deleted record is as bad as a record with no row.
 *
 * IT ALSO ASSERTS STATUS, and that is deliberate. A row is a transcription of a record, not a
 * ruling about it. An index that says `Accepted` where the record says `Proposed` reports a
 * ratification that did not happen, and the recorded status of a decision is the thing a reader
 * consults this table for. What a given status obliges is settled elsewhere — by the charter, the
 * workflow, and the records themselves — and this gate takes no position on it; it only holds the
 * table to what the records say. Titles and identifier styles are NOT asserted: they are
 * editorial, and a gate that reds on a harmless edit is a gate someone deletes.
 *
 * THE CHECKS ARE PURE FUNCTIONS over parsed inputs, so `--selftest` can feed them synthetic
 * defects. A gate observed green on a healthy tree has demonstrated nothing about what it can
 * see; the probes are the evidence, the way check-release-graph.mjs's are.
 *
 * EACH PROBE NAMES THE PROBLEM IT EXPECTS, and that is not decoration. The first version asserted
 * only `problems.length > 0`, and a mutation sweep found four guards whose deletion left the
 * selftest GREEN because a different problem in the same probe tripped instead — the floors for
 * zero files, zero rows and a missing section, and the missing-Status-field branch. A probe table
 * that cannot tell which check fired is a smoke test wearing a probe table's clothes, which is
 * this file's own defect class one level up.
 *
 * EVERY CHECK HAS AN EMPTY-SET FLOOR. Zero record files, zero parsed rows, a missing
 * `## Decisions (ADRs)` section, zero records to compare statuses against — each is a FAILURE,
 * not a vacuous pass. A green line over an empty set is the defect this file exists to prevent,
 * and this repo has shipped that defect at least three times (`checkTarballsNonEmpty`'s
 * unreachable floor, `expected-docs.json`'s counting-declarations-not-items, `check-gate-wiring`
 * certifying the absence of the job it guards).
 *
 * WIRING is asserted by scripts/check-gate-wiring.mjs, which carries this gate's two CI lines in
 * its REQUIRED_LINT registry — the repo's single place for "this gate must still be running".
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The source of truth. Every `.md` FILE directly in here is a record and must be indexed —
 * including one reached through a symlink, which `Dirent.isFile()` alone reports as false.
 *
 * The old comment read "Everything in here is a record", and the filter under it saw strictly
 * less than that: no symlinks, and nothing under a subdirectory. `decisions/superseded/` is a
 * common ADR convention, so that gap would have hidden a whole class of record from a gate whose
 * entire subject is unindexed records. Rather than recurse — which would need a rule about how a
 * nested record is named in the table, and this mission is not the place to invent one — a
 * non-empty subdirectory is REFUSED, so the next mission that wants one has to decide
 * deliberately instead of silently getting no coverage. See `classifyEntries`.
 */
export const DECISIONS_DIR = 'docs/architecture/decisions';
/** The derived view. */
export const INDEX_FILE = 'docs/architecture/README.md';
/** The heading the table lives under. Scoping the parse here keeps the repo's other tables out. */
export const SECTION = '## Decisions (ADRs)';

/* ─────────────────────────────────── parsers ─────────────────────────────────── */

/**
 * Blank out every HTML comment span, preserving newlines so line structure survives.
 *
 * A commented-out row RENDERS NOTHING. Read literally, it satisfied coverage: the gate printed
 * `15/15` over a table that showed fourteen rows to a reader — a record with no visible row,
 * which is exactly the #193 defect this gate exists to prevent, smuggled past the gate in the
 * gate's own syntax. Unterminated comments are swallowed to end-of-file here for the same reason
 * a renderer swallows them.
 */
function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?(?:-->|$)/g, (m) => m.replace(/[^\n]/g, ''));
}

/**
 * Which lines are inside a fenced code block, computed from the TOP of the document.
 *
 * Same defect as the comment case: a row inside ``` fences renders as literal text and indexes
 * nothing, but parsed naively it counted as coverage. Computed from line 0 rather than from the
 * section heading because a heading inside a fence is not a heading either.
 */
function fenceMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(`{3,}|~{3,})/);
    if (open === null) {
      if (m) open = m[1][0];
    } else {
      mask[i] = true;
      if (m && m[1][0] === open) open = null;
    }
  }
  return mask;
}

/**
 * Split a table row into cells on UNESCAPED pipes.
 *
 * GFM writes a literal pipe inside a cell as `\|`. Splitting on every `|` shifted every cell
 * after it by one, so a title containing one reported a STATUS violation naming a field the
 * author never touched — a true failure with a message pointing at the wrong place, which is
 * worse than no message.
 */
export function splitRow(line) {
  const inner = line.replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  return inner.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim());
}

/**
 * Parse the ADR table out of the index.
 *
 * Returns `{ sectionFound, rows, malformed }` rather than just rows, so the caller can tell
 * "the section is gone" from "the section is empty" from "the section is fine". Collapsing those
 * into an empty array is how a parser certifies an absence.
 *
 * A data row whose first cell is not a markdown link goes to `malformed`, not silently to the
 * floor: a row typed by hand with no link is a row pointing at no record, which is precisely one
 * of the two drift directions.
 *
 * ONLY RENDERED ROWS COUNT. Comment spans are blanked and fenced blocks are skipped before
 * anything is matched — see the two helpers above for what each one cost.
 */
export function parseAdrTable(readmeText) {
  const lines = stripHtmlComments(String(readmeText ?? '')).split('\n');
  const fenced = fenceMask(lines);
  const start = lines.findIndex((l, i) => !fenced[i] && l.trim() === SECTION);
  if (start === -1) return { sectionFound: false, rows: [], malformed: [] };

  const rows = [];
  const malformed = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (fenced[i]) continue;
    if (/^##\s/.test(lines[i])) break;
    const t = lines[i].trim();
    if (!t.startsWith('|')) continue;
    const cells = splitRow(t);
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue; // separator
    if (cells[0] === 'ADR') continue; // header
    const link = cells[0].match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!link) {
      malformed.push(t);
      continue;
    }
    rows.push({
      id: link[1],
      // An anchor or query suffix is a link decoration, not part of the path.
      target: link[2].split(/[#?]/)[0].replace(/^\.\//, ''),
      title: cells[1] ?? '',
      status: cells[2] ?? '',
      raw: t,
    });
  }
  return { sectionFound: true, rows, malformed };
}

/**
 * Read a record's own self-description: its H1 and its Status field.
 *
 * Both punctuations in the tree are accepted — `**Status:** Accepted` (thirteen records) and
 * `**Status**: Complete` (the ADR-003 addendum). Returns nulls rather than guesses; a record with
 * no Status field is a problem the caller reports, not a value the parser invents.
 */
export function parseRecord(text) {
  const src = String(text ?? '');
  const h1 = src.match(/^#\s+(.+?)\s*$/m);
  const status = src.match(/^\*\*Status(?:\*\*)?\s*:(?:\*\*)?\s*(.*)$/m);
  return { title: h1 ? h1[1] : null, status: status ? status[1].trim() : null };
}

/**
 * The comparable part of a Status field.
 *
 * Four records qualify their status with prose — `Accepted (ratified by the operator,
 * 2026-09-02)`, `Proposed. Descriptive record only …` — and the table records the bare word. So
 * both sides are reduced to their leading word before comparison. Anything that is not a word is
 * null, which the caller reports rather than treating as a match.
 */
export function statusToken(raw) {
  if (typeof raw !== 'string') return null;
  // Emphasis is stripped first. A table cell reading `**Accepted**` says the same thing as
  // `Accepted`, and a gate that reds on that is a gate someone turns off — the failure mode this
  // file's header names for titles applies to formatting too.
  const m = raw.replace(/[*_`]/g, '').trim().match(/^[A-Za-z][A-Za-z-]*/);
  return m ? m[0] : null;
}

/**
 * Which directory entries are records, and which are refusals.
 *
 * `entries` are `{ name, isFile, isDirectory, childCount }`, with symlinks already resolved by
 * the caller — keeping this a pure function over plain descriptors is what lets `--selftest`
 * feed it a subdirectory without creating one on disk.
 */
export function classifyEntries(entries) {
  const files = [];
  const problems = [];
  for (const e of entries ?? []) {
    if (e.isDirectory) {
      if ((e.childCount ?? 0) > 0) {
        problems.push(
          `${DECISIONS_DIR}/${e.name}/ is a non-empty subdirectory holding ${e.childCount} ` +
            `entr${e.childCount === 1 ? 'y' : 'ies'}. This gate indexes the top level only, so ` +
            `anything in there is invisible to it — an unindexed record that reports as coverage. ` +
            `Flatten it, or teach this gate and the table how a nested record is addressed.`,
        );
      }
      continue;
    }
    if (!e.isFile) {
      problems.push(
        `${DECISIONS_DIR}/${e.name} is neither a file nor a directory — refusing to guess whether ` +
          `it is a record`,
      );
      continue;
    }
    // Non-markdown files are assets (diagrams, exports), not records.
    if (!e.name.endsWith('.md')) continue;
    files.push(e.name);
  }
  return { files: files.sort(), problems };
}

/* ─────────────────────────── the checks, as pure functions ─────────────────────────── */

/**
 * FR-001/FR-006 — the table and the directory hold the same set, in both directions.
 *
 * BOTH DIRECTIONS, because they fail for different reasons and only one of them was live when
 * this was written. A record with no row is the drift #193 measured. A row with no record is what
 * happens when a record is renamed or withdrawn and the table keeps the corpse — a link that
 * 404s, which reads as an index entry until someone clicks it.
 */
export function checkIndexCoverage(files, table) {
  const problems = [];

  if (!table || table.sectionFound !== true) {
    return [
      `${INDEX_FILE} has no "${SECTION}" section — refusing to certify an index that is not ` +
        `there. If the section moved, point this gate at it deliberately.`,
    ];
  }
  // THE FLOORS. Either of these makes every loop below iterate zero times and report success,
  // which is the shape this gate exists to refuse.
  if (files.length === 0) {
    problems.push(
      `${DECISIONS_DIR} yielded no decision records — refusing to certify index coverage over ` +
        `nothing. An empty glob is a broken gate, not a clean tree.`,
    );
  }
  if (table.rows.length === 0) {
    problems.push(
      `the "${SECTION}" table parsed to ZERO rows — refusing to report a coherent index over an ` +
        `empty table. Either the table was emptied or this parser stopped matching it; both are ` +
        `failures.`,
    );
  }
  for (const raw of table.malformed ?? []) {
    problems.push(`index row links to no record: ${raw}`);
  }

  const rowFor = new Map();
  for (const r of table.rows) {
    if (!r.target.startsWith('decisions/')) {
      problems.push(
        `row ${r.id} links to "${r.target}", which is not a record under ${DECISIONS_DIR} — the ` +
          `ADR table indexes decision records and nothing else`,
      );
      continue;
    }
    const file = r.target.slice('decisions/'.length);
    if (!files.includes(file)) {
      problems.push(
        `row ${r.id} points at ${DECISIONS_DIR}/${file}, which does not exist — a stale row is as ` +
          `bad as a missing one; it reads as an index entry until someone clicks it`,
      );
    }
    if (rowFor.has(file)) {
      problems.push(`${DECISIONS_DIR}/${file} has two rows (${rowFor.get(file)} and ${r.id})`);
    } else {
      rowFor.set(file, r.id);
    }
  }

  for (const f of files) {
    if (!rowFor.has(f)) {
      problems.push(
        `${DECISIONS_DIR}/${f} has no row in the ${INDEX_FILE} ADR table — an ADR nobody can find ` +
          `from an index is discoverable only by already knowing it exists, which defeats the ` +
          `point of the record`,
      );
    }
  }

  return problems;
}

/**
 * FR-002/FR-007 — each row's Status is a transcription of its record's, not a ruling about it.
 *
 * `records` is a Map of filename → parseRecord() result. Rows whose file is absent are skipped
 * here; checkIndexCoverage already reports them, and reporting the same defect twice trains
 * people to skim the output.
 */
export function checkStatusAgreement(rows, records) {
  if (!records || records.size === 0) {
    return [
      `no decision records were read — refusing to certify status agreement over nothing`,
    ];
  }
  const problems = [];
  for (const r of rows) {
    if (!r.target.startsWith('decisions/')) continue;
    const file = r.target.slice('decisions/'.length);
    const rec = records.get(file);
    if (!rec) continue; // reported by checkIndexCoverage

    if (rec.status === null) {
      problems.push(
        `${DECISIONS_DIR}/${file} states no **Status:** field — the index cannot transcribe what ` +
          `the record does not say`,
      );
      continue;
    }
    const want = statusToken(rec.status);
    const got = statusToken(r.status);
    if (got === null) {
      problems.push(`row ${r.id} has no Status value — every row states the record's status`);
      continue;
    }
    if (want === null) {
      problems.push(
        `${DECISIONS_DIR}/${file}'s Status field ("${rec.status}") begins with no word this gate ` +
          `can compare — state a status token first, then any qualifying prose`,
      );
      continue;
    }
    if (want.toLowerCase() !== got.toLowerCase()) {
      problems.push(
        `row ${r.id} says Status "${got}" but ${DECISIONS_DIR}/${file} says "${want}". The index ` +
          `does not ratify records: transcribe the record, or change the record deliberately and ` +
          `say so in the same commit.`,
      );
    }
  }
  return problems;
}

/* ──────────────────────────────────── selftest ──────────────────────────────────── */

const SECTION_DOC = (...lines) =>
  [SECTION, '', '| ADR | Title | Status |', '|---|---|---|', ...lines].join('\n');
const TABLE = (...rows) => parseAdrTable(SECTION_DOC(...rows));
const REC = (status) => new Map([['a.md', { title: 'A', status }]]);

/**
 * Every probe declares `expect`: a substring of the problem it is supposed to provoke.
 *
 * Without it a probe passes when ANY check fires, and a mutation sweep proved that is not a
 * theoretical gap here — deleting the zero-files floor, the zero-rows floor, the missing-section
 * floor or the missing-Status branch each left this selftest green, because a neighbouring check
 * tripped on the same input. The inputs below are also narrowed so each probe provokes its own
 * check as directly as it can; `expect` is what makes that provable rather than intended.
 */
const PROBES = [
  {
    what: 'a record on disk with no row in the table',
    expect: 'has no row in the',
    run: () => checkIndexCoverage(['a.md', 'b.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |')),
  },
  {
    what: 'a row pointing at a record that does not exist',
    expect: 'which does not exist',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| [ADR-2](decisions/gone.md) | B | Accepted |')),
  },
  {
    // ZERO files AND an empty table, so the only thing this input can be about is the files
    // floor. The old version passed a populated table, whose row then tripped the stale-row
    // check — which is why deleting this floor was green.
    what: 'coverage asserted over ZERO record files',
    expect: 'yielded no decision records',
    run: () => checkIndexCoverage([], TABLE()),
  },
  {
    what: 'coverage asserted over a table with ZERO rows',
    expect: 'parsed to ZERO rows',
    run: () => checkIndexCoverage(['a.md'], TABLE()),
  },
  {
    // ZERO files as well, so the zero-rows floor a missing section also implies is not what
    // carries this probe. Deleting the section floor used to fall through to that one.
    what: 'an index file with no Decisions section at all',
    expect: `has no "${SECTION}" section`,
    run: () => checkIndexCoverage([], parseAdrTable('# Architecture\n\n## Research\n')),
  },
  {
    what: 'a hand-typed row that links to nothing',
    expect: 'index row links to no record',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| ADR-2 | B | Accepted |')),
  },
  {
    what: 'a row linking outside the decisions directory',
    expect: 'which is not a record under',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| [ADR-2](research/002.md) | B | Accepted |')),
  },
  {
    what: 'two rows for the same record',
    expect: 'has two rows',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| [ADR-1 bis](decisions/a.md) | A | Accepted |')),
  },
  {
    // A COMMENTED-OUT ROW RENDERS NOTHING. Before `stripHtmlComments`, this input reported full
    // coverage — the gate certifying an index a reader cannot see, which is #193 exactly.
    what: 'a row hidden inside an HTML comment',
    expect: 'decisions/b.md has no row in the',
    run: () =>
      checkIndexCoverage(
        ['a.md', 'b.md'],
        parseAdrTable(
          // The MULTI-LINE form, which is the one that got through: the row's own line still
          // starts with `|`, so a line-at-a-time parser sees a perfectly good row. A one-line
          // `<!-- | … | -->` never did, because it does not start with a pipe.
          SECTION_DOC('| [ADR-1](decisions/a.md) | A | Accepted |', '<!--', '| [ADR-2](decisions/b.md) | B | Accepted |', '-->'),
        ),
      ),
  },
  {
    // Same defect, the other syntax that renders a row as text instead of as a row.
    what: 'a row hidden inside a fenced code block',
    expect: 'decisions/b.md has no row in the',
    run: () =>
      checkIndexCoverage(
        ['a.md', 'b.md'],
        parseAdrTable(
          SECTION_DOC('| [ADR-1](decisions/a.md) | A | Accepted |', '', '```markdown', '| [ADR-2](decisions/b.md) | B | Accepted |', '```'),
        ),
      ),
  },
  {
    what: 'a non-empty subdirectory under the decisions directory',
    expect: 'is a non-empty subdirectory',
    run: () =>
      classifyEntries([
        { name: 'a.md', isFile: true, isDirectory: false },
        { name: 'superseded', isFile: false, isDirectory: true, childCount: 2 },
      ]).problems,
  },
  {
    what: 'a decisions entry that resolves to neither a file nor a directory',
    expect: 'neither a file nor a directory',
    run: () => classifyEntries([{ name: 'dangling.md', isFile: false, isDirectory: false }]).problems,
  },
  {
    what: 'a row promoting a Proposed record to Accepted',
    expect: 'says Status "Accepted"',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Accepted |').rows, REC('Proposed')),
  },
  {
    what: 'a row still saying Proposed after the record was ratified',
    expect: 'says Status "Proposed"',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Proposed |').rows, REC('Accepted (ratified by the operator, 2026-09-02)')),
  },
  {
    // The ROW has no status either, so the `got === null` branch cannot be what carries this
    // probe. With a populated cell it was, which is why deleting the record-side branch was green.
    what: 'a record with no Status field at all',
    expect: 'states no **Status:** field',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A |  |').rows, REC(null)),
  },
  {
    what: 'a row with an empty Status cell',
    expect: 'has no Status value',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A |  |').rows, REC('Accepted')),
  },
  {
    what: 'status agreement asserted over ZERO records',
    expect: 'refusing to certify status agreement over nothing',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Accepted |').rows, new Map()),
  },
  {
    // The qualifying-prose case must NOT trip, so its probe is the inverse: a status whose
    // leading token is unreadable. Without this, `statusToken` returning null on both sides
    // would compare null to null and pass.
    what: 'a record whose Status field starts with no comparable word',
    expect: 'begins with no word this gate',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Accepted |').rows, REC('— see below')),
  },
];

/** The healthy shapes that must NOT trip. A gate that reds on a correct tree gets deleted. */
const NEGATIVE_PROBES = [
  {
    what: 'a table that matches the directory exactly',
    run: () => checkIndexCoverage(['a.md', 'b.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| [ADR-2](decisions/b.md) | B | Proposed |')),
  },
  {
    what: 'a link carrying an anchor suffix',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md#context) | A | Accepted |')),
  },
  {
    // THE SECTION BOUNDARY. The `break` on the next `##` heading survived mutation against the
    // real tree — the README's Research table happens to sit further down than anything the old
    // probes fed the parser. Delete the break and this input reds: the Research header and its
    // row are parsed as ADR rows, one malformed and one pointing outside decisions/.
    what: 'a Research table after the section is not part of the index',
    run: () =>
      checkIndexCoverage(
        ['a.md'],
        parseAdrTable(
          [
            SECTION,
            '',
            '| ADR | Title | Status |',
            '|---|---|---|',
            '| [ADR-1](decisions/a.md) | A | Accepted |',
            '',
            '## Research',
            '',
            '| Document | Topic |',
            '|---|---|',
            '| [001-eval.md](research/001-eval.md) | Distribution |',
          ].join('\n'),
        ),
      ),
  },
  {
    what: 'a status qualified with prose after the token',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Accepted |').rows, REC('Accepted (ratified by the operator, 2026-09-02)')),
  },
  {
    what: 'a status cell and a record status wrapped in emphasis',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | **Accepted** |').rows, REC('**Accepted**')),
  },
  {
    what: 'the addendum punctuation, `**Status**: Complete`',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Complete |').rows, new Map([['a.md', parseRecord('# A\n\n**Status**: Complete (WP01 delivered)\n')]])),
  },
  {
    // A GFM-escaped pipe in a title used to shift every cell right, so the STATUS check reported
    // a violation of a field the author never edited — a true failure naming the wrong place.
    what: 'a title containing a GFM-escaped pipe',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | Tokens \\| Type | Accepted |').rows, REC('Accepted')),
  },
  {
    what: 'an empty subdirectory and a non-markdown asset are not refused',
    run: () =>
      classifyEntries([
        { name: 'a.md', isFile: true, isDirectory: false },
        { name: 'diagram.png', isFile: true, isDirectory: false },
        { name: 'drafts', isFile: false, isDirectory: true, childCount: 0 },
      ]).problems,
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
      // The mutation-sweep finding, made structural: a probe satisfied by ANY problem is
      // satisfied by the WRONG check firing, and four guards in this file were deletable
      // for exactly that reason while the line below printed a tick.
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
  // The floor is asserted, not implied: a probe list that silently emptied would print nothing
  // and exit 0, which is the defect class this whole script is about — one level up, in the
  // harness that is supposed to be the evidence.
  if (PROBES.length < 18 || NEGATIVE_PROBES.length < 8) {
    console.error(
      `❌ only ${PROBES.length} defect probe(s) and ${NEGATIVE_PROBES.length} healthy probe(s) — ` +
        `the selftest floor is 18 and 8`,
    );
    process.exit(1);
  }
  console.log(`\n✅ all ${PROBES.length} defect probes tripped their own check and all ${NEGATIVE_PROBES.length} healthy shapes passed.`);
}

/* ──────────────────────────────────── main ──────────────────────────────────── */

function main() {
  const dir = join(ROOT, DECISIONS_DIR);
  if (!existsSync(dir)) {
    console.error(`❌ ${DECISIONS_DIR} does not exist — refusing to certify an index over a missing directory.`);
    process.exit(1);
  }
  // Symlinks are resolved here rather than filtered out: `Dirent.isFile()` is false for one, and
  // a symlinked record is still a record. A broken link resolves to neither, which
  // `classifyEntries` refuses rather than skips.
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
    return {
      name: d.name,
      isFile,
      isDirectory,
      childCount: isDirectory ? readdirSync(join(dir, d.name)).length : 0,
    };
  });
  const { files, problems: discoveryProblems } = classifyEntries(entries);

  const indexPath = join(ROOT, INDEX_FILE);
  if (!existsSync(indexPath)) {
    console.error(`❌ ${INDEX_FILE} does not exist — refusing to certify an index that is not there.`);
    process.exit(1);
  }

  const records = new Map(files.map((f) => [f, parseRecord(readFileSync(join(dir, f), 'utf8'))]));
  const table = parseAdrTable(readFileSync(indexPath, 'utf8'));

  console.log(`records:  ${files.length} in ${DECISIONS_DIR}`);
  console.log(`rows:     ${table.rows.length} under "${SECTION}" in ${INDEX_FILE}`);

  const problems = [...discoveryProblems, ...checkIndexCoverage(files, table), ...checkStatusAgreement(table.rows, records)];

  if (problems.length) {
    console.error(`\n❌ ${problems.length} ADR index problem(s):\n`);
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log(`\n✅ ADR index is coherent: ${files.length} record(s), ${table.rows.length} row(s), every row's status transcribed from its record.`);
}

// Run-as-CLI guard, matching check-release-graph.mjs — without it, importing this module for its
// exported checks runs main() and calls process.exit.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else main();
}
