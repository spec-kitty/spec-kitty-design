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
 * ruling about it. An index that says `Accepted` where the record says `Proposed` has promoted a
 * decision the operator never ratified, which under the charter turns a descriptive record into a
 * binding constraint on every later mission spec. That is the one field whose drift changes what
 * the repo is allowed to do, so the gate refuses it. Titles and identifier styles are NOT
 * asserted: they are editorial, and a gate that reds on a harmless edit is a gate someone deletes.
 *
 * THE CHECKS ARE PURE FUNCTIONS over parsed inputs, so `--selftest` can feed them synthetic
 * defects. A gate observed green on a healthy tree has demonstrated nothing about what it can
 * see; the probes are the evidence, the way check-release-graph.mjs's are.
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
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The source of truth. Everything in here is a record and must be indexed. */
export const DECISIONS_DIR = 'docs/architecture/decisions';
/** The derived view. */
export const INDEX_FILE = 'docs/architecture/README.md';
/** The heading the table lives under. Scoping the parse here keeps the repo's other tables out. */
export const SECTION = '## Decisions (ADRs)';

/* ─────────────────────────────────── parsers ─────────────────────────────────── */

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
 */
export function parseAdrTable(readmeText) {
  const lines = String(readmeText ?? '').split('\n');
  const start = lines.findIndex((l) => l.trim() === SECTION);
  if (start === -1) return { sectionFound: false, rows: [], malformed: [] };

  const rows = [];
  const malformed = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) break;
    const t = lines[i].trim();
    if (!t.startsWith('|')) continue;
    const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
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

const TABLE = (...rows) => parseAdrTable([SECTION, '', '| ADR | Title | Status |', '|---|---|---|', ...rows].join('\n'));
const REC = (status) => new Map([['a.md', { title: 'A', status }]]);

const PROBES = [
  {
    what: 'a record on disk with no row in the table',
    run: () => checkIndexCoverage(['a.md', 'b.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |')),
  },
  {
    what: 'a row pointing at a record that does not exist',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| [ADR-2](decisions/gone.md) | B | Accepted |')),
  },
  {
    what: 'coverage asserted over ZERO record files',
    run: () => checkIndexCoverage([], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |')),
  },
  {
    what: 'coverage asserted over a table with ZERO rows',
    run: () => checkIndexCoverage(['a.md'], TABLE()),
  },
  {
    what: 'an index file with no Decisions section at all',
    run: () => checkIndexCoverage(['a.md'], parseAdrTable('# Architecture\n\n## Research\n')),
  },
  {
    what: 'a hand-typed row that links to nothing',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| ADR-2 | B | Accepted |')),
  },
  {
    what: 'a row linking outside the decisions directory',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| [ADR-2](research/002.md) | B | Accepted |')),
  },
  {
    what: 'two rows for the same record',
    run: () => checkIndexCoverage(['a.md'], TABLE('| [ADR-1](decisions/a.md) | A | Accepted |', '| [ADR-1 bis](decisions/a.md) | A | Accepted |')),
  },
  {
    what: 'a row promoting a Proposed record to Accepted',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Accepted |').rows, REC('Proposed')),
  },
  {
    what: 'a row still saying Proposed after the record was ratified',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Proposed |').rows, REC('Accepted (ratified by the operator, 2026-09-02)')),
  },
  {
    what: 'a record with no Status field at all',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Accepted |').rows, REC(null)),
  },
  {
    what: 'a row with an empty Status cell',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A |  |').rows, REC('Accepted')),
  },
  {
    what: 'status agreement asserted over ZERO records',
    run: () => checkStatusAgreement(TABLE('| [ADR-1](decisions/a.md) | A | Accepted |').rows, new Map()),
  },
  {
    // The qualifying-prose case must NOT trip, so its probe is the inverse: a status whose
    // leading token is unreadable. Without this, `statusToken` returning null on both sides
    // would compare null to null and pass.
    what: 'a record whose Status field starts with no comparable word',
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
];

function selftest() {
  let failed = 0;
  for (const probe of PROBES) {
    const problems = probe.run();
    if (problems.length === 0) {
      console.log(`❌ probe did NOT trip: ${probe.what}`);
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
  if (PROBES.length < 14 || NEGATIVE_PROBES.length < 5) {
    console.error(
      `❌ only ${PROBES.length} defect probe(s) and ${NEGATIVE_PROBES.length} healthy probe(s) — ` +
        `the selftest floor is 14 and 5`,
    );
    process.exit(1);
  }
  console.log(`\n✅ all ${PROBES.length} defect probes tripped and all ${NEGATIVE_PROBES.length} healthy shapes passed.`);
}

/* ──────────────────────────────────── main ──────────────────────────────────── */

function main() {
  const dir = join(ROOT, DECISIONS_DIR);
  if (!existsSync(dir)) {
    console.error(`❌ ${DECISIONS_DIR} does not exist — refusing to certify an index over a missing directory.`);
    process.exit(1);
  }
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .map((d) => d.name)
    .sort();

  const indexPath = join(ROOT, INDEX_FILE);
  if (!existsSync(indexPath)) {
    console.error(`❌ ${INDEX_FILE} does not exist — refusing to certify an index that is not there.`);
    process.exit(1);
  }

  const records = new Map(files.map((f) => [f, parseRecord(readFileSync(join(dir, f), 'utf8'))]));
  const table = parseAdrTable(readFileSync(indexPath, 'utf8'));

  console.log(`records:  ${files.length} in ${DECISIONS_DIR}`);
  console.log(`rows:     ${table.rows.length} under "${SECTION}" in ${INDEX_FILE}`);

  const problems = [...checkIndexCoverage(files, table), ...checkStatusAgreement(table.rows, records)];

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
