#!/usr/bin/env node
/**
 * The charter's served surface, held to what it duplicates (#436).
 *
 * WHAT #436 ORIGINALLY FILED, AND WHY THAT FRAMING WAS WRONG
 *
 * `.kittify/charter/charter.md` states several policies twice: `Testing Standards`,
 * `Quality Gates`, `Performance Benchmarks` and part of `Branch Strategy` are byte-identical (or,
 * for the Branch Strategy pair whose bullet also wraps other prose, contained-within) their
 * `## Policy Summary` counterparts. The issue as filed treated the two copies as co-equal — "hand
 * duplication, nothing enforces agreement" — and proposed either merging them or deriving one
 * from the other.
 *
 * A correction to the issue itself, posted after the four-lens gate on #433, replaced that
 * framing: the two halves are NOT co-equal. `charter.activation.charter_md_parsing
 * ._extract_policy_summary` (imported by `context_result_builders.py`) reads `charter.md` and
 * collects only the bullets under `## Policy Summary`, stopping at the next `## `. Bootstrap mode
 * (`context_renderers/bootstrap_text.py`) renders those bullets plus the verbatim bodies of
 * exactly three ACTION_CRITICAL_SECTIONS (`section_bodies.py`: Terminology Canon, Code Review
 * Checklist, Regression Vigilance — none of which this repo's charter currently carries, and none
 * of which overlap the four sections named above). Compact mode renders section ANCHORS with no
 * bodies. Nothing in the installed CLI (`spec-kitty-cli`, verified against
 * `charter/activation/context_renderers/bootstrap_text.py` and `context_result_builders.py` in
 * this checkout's `uv tool` install) ever emits the raw file body. So `Policy Summary` is the
 * governance surface every agent actually receives; `Testing Standards`, `Quality Gates`,
 * `Performance Benchmarks` and `Branch Strategy` are display-only prose for a human reader.
 *
 * THE CONSEQUENCE: drift between the two halves is not cosmetic, and it is not symmetric. A
 * correction applied only to a top section looks done — a reviewer reading the diff sees the
 * fix — and changes nothing an agent will ever load. That is how this charter drifted from the
 * repository in the first place (the Angular/SCSS fossil #433 corrected), and it nearly happened
 * again inside #433 itself: the corrected three-branch model was written into `Branch Strategy`
 * alone in an early round and reached no agent until a later round folded a summary into Policy
 * Summary's `Review Policy` bullet (`context_result_builders.py`'s F6 fold, PR #433).
 *
 * THE DIRECTION THAT MATTERS, AND THE ONE THAT DOES NOT. Policy-bearing content present in a top
 * section but ABSENT from Policy Summary is a defect — an agent will never see it. The converse is
 * not: Policy Summary may legitimately carry MORE than any one top-section paragraph (the `Review
 * Policy` bullet wraps the `Branch Strategy` screenshot/sign-off paragraph inside additional
 * branch-targeting prose the top section states elsewhere), and content that was never meant to
 * be duplicated verbatim — the `Branch Strategy` branch-model paragraph, deliberately SUMMARIZED
 * rather than mirrored, per the F6 fold above — is not this check's business either.
 *
 * WHY A CURATED PAIR LIST, NOT A GENERIC HEURISTIC. An earlier draft of this check tried to infer
 * "policy-bearing" generically (e.g. "every paragraph over N characters must appear verbatim
 * in Policy Summary") and it is a bad idea: `Branch Strategy`'s branch-model paragraph is long,
 * genuinely policy-bearing, and — by design, not defect — only reaches Policy Summary as a
 * paraphrase, so a length-based heuristic reds on the very charter this Op corrected. What makes a
 * paragraph "policy-bearing" for THIS check is narrower and unambiguous: today's charter authors
 * already chose to draft it as a duplicate of a named Policy Summary bullet. KNOWN_DUPLICATE_PAIRS
 * below is that curated list — the same shape as check-gate-wiring.mjs's REQUIRED_LINT (a growing,
 * explicitly-registered set, not an inferred one) and ACTION_CRITICAL_SECTIONS itself (a named
 * heading list, not a heuristic over heading text). A future author who duplicates a NEW section
 * into Policy Summary registers the pair here in the same commit; one who only paraphrases (like
 * the branch-model paragraph) registers nothing, because there is nothing here to keep in sync.
 *
 * THE SECOND DEFECT: THE CAP. `_append_policy_summary_lines` (`bootstrap_text.py:208`, verified
 * against the installed CLI) truncates at `summary[:8]` with no error and no notice — an eighth
 * bullet renders, a ninth is silently dropped. Policy Summary holds exactly 7 bullets today. That
 * is one below the boundary, not "safely under it": nothing stops a future edit from pushing it to
 * 9 in the ordinary course of correcting drift the FIRST check above catches, and the failure mode
 * is the same one this whole file exists to close — content that looks served and is not.
 * `checkPolicySummaryCap` asserts the count never exceeds the cap, and warns (without failing) at
 * the boundary itself, naming the consequence so the next author folds into an existing bullet
 * instead of appending a ninth.
 *
 * REGENERATION IS NOT A BACKSTOP. `specify_cli.cli.commands.charter.generate._seed_charter_md`
 * (`generate.py:189-192`, the #2772/IC-03 never-clobber invariant, verified against the installed
 * CLI) seeds `charter.md` only when the file is ABSENT and never overwrites an existing one. There
 * is no `--check`-and-regenerate path for this file the way there is for e.g. the token catalogue;
 * a drifted charter.md stays drifted until a human (or this gate) catches it.
 *
 * PROBES ARE PURE. `checkServedSurfaceDrift` and `checkPolicySummaryCap` take a charter.md
 * CONTENT STRING and return problems — no filesystem access — so `--selftest` can mutate a real
 * copy of this repository's own charter.md (via `replaceSectionBody`, a line-range splice, never
 * a global string replace that could hit the same duplicated text twice) and assert the checker
 * reacts for the NAMED reason, the way check-gate-wiring-defeats.mjs mutates a parsed workflow
 * rather than asserting against a hand-written fixture that could quietly stop resembling the
 * real file.
 *
 * WIRING is asserted by scripts/check-gate-wiring.mjs, which carries this gate's two CI lines in
 * its REQUIRED_LINT registry, and scripts/check-gate-wiring-defeats.mjs, which proves that
 * registration actually catches a neutered step in `ci-quality.yml`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
export const CHARTER_PATH = join(ROOT, '.kittify', 'charter', 'charter.md');

/** `_append_policy_summary_lines`, bootstrap_text.py:208 (installed spec-kitty-cli, verified
 *  2026-09-13): `for item in summary[:8]`. Bullet 9 onward is silently dropped, not an error. */
export const POLICY_SUMMARY_CAP = 8;

/* ───────────────────────────────── markdown parsing ─────────────────────────────────
 * Deliberately minimal: this file only ever needs "the body of a `## Heading`" and "the
 * top-level `-` paragraphs inside it". No nested-heading, table, or inline-markup handling —
 * charter.md carries none of that inside the sections this check reads. */

/** The body of `## <heading>`: everything after the heading line up to (not including) the next
 *  `## ` line, or end of file. `null` when the heading itself is not found — a MISSING section is
 *  a distinct, reportable problem from an empty one, so callers must check for `null` explicitly
 *  rather than treating it as an empty string. */
export function sectionBody(content, heading) {
  const lines = content.split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const endRel = rest.findIndex((l) => l.trim().startsWith('## '));
  return (endRel === -1 ? rest : rest.slice(0, endRel)).join('\n');
}

/** Splits a section body into paragraphs on blank-line boundaries, trimmed, empties dropped. */
export function paragraphsOf(body) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Strips a leading markdown bullet marker (`- `), not the label prose that may follow it. */
export function stripBulletMarker(paragraph) {
  return paragraph.replace(/^-\s+/, '');
}

/** Strips a leading `label` (a literal string this caller already knows is there, e.g.
 *  `"Deployment constraints:"`) plus the whitespace after it. A no-op if `label` is falsy or the
 *  text does not start with it — callers pass `null` for paragraphs that carry no such label,
 *  rather than this function guessing at one (an earlier draft used a generic leading-Title-Case
 *  regex and it false-matched "A component is done when:" inside Quality Gates' own prose, which
 *  is not a label at all — see the file header). */
export function stripLiteralLabel(text, label) {
  if (!label || !text.startsWith(label)) return text;
  return text.slice(label.length).trimStart();
}

/** The top-level `- Label: ...` bullets directly under `## Policy Summary` — the HTML comment
 *  block at the top of that section is a paragraph too, but does not start with `-`, so the
 *  filter excludes it without needing to special-case markdown comments. `null` propagates from
 *  `sectionBody` when the section itself is missing. */
export function policySummaryBullets(content) {
  const body = sectionBody(content, '## Policy Summary');
  if (body === null) return null;
  return paragraphsOf(body).filter((p) => p.startsWith('-'));
}

/** The one bullet (if any) whose label matches, with its marker and label already stripped. */
function findBulletTextByLabel(bullets, label) {
  const bullet = bullets.find((b) => stripBulletMarker(b).startsWith(`${label}:`));
  if (bullet === undefined) return undefined;
  return stripLiteralLabel(stripBulletMarker(bullet), `${label}:`);
}

/* ───────────────────────────── the curated duplicate-pair registry ─────────────────────────── */

/**
 * Every top-section paragraph today's charter drafts as a duplicate of a Policy Summary bullet.
 * See the file header for why this is curated rather than inferred, and why the branch-model
 * paragraph (Branch Strategy paragraph 0) is deliberately absent from it.
 *
 * `mode: 'contains'` for every pair (never bare equality): the assertion is that the top-section
 * text is REACHABLE inside the Policy Summary bullet, not that the two are identical — Policy
 * Summary may legitimately wrap more around it (Review Policy's bullet prepends branch-targeting
 * prose the Branch Strategy paragraph itself does not restate). For the four pairs that today
 * happen to be exactly equal, "contains" still holds (a string contains itself); the mode is
 * chosen for the direction that matters, not for today's exact byte count.
 */
export const KNOWN_DUPLICATE_PAIRS = [
  {
    section: '## Testing Standards',
    paragraphIndex: 0,
    topLabel: null,
    summaryLabel: 'Testing',
  },
  {
    section: '## Quality Gates',
    paragraphIndex: 0,
    topLabel: null,
    summaryLabel: 'Quality Gates',
  },
  {
    section: '## Performance Benchmarks',
    paragraphIndex: 0,
    topLabel: null,
    summaryLabel: 'Performance Targets',
  },
  {
    // Branch Strategy paragraph 0 (the branch-model prose) is NOT registered here — see the file
    // header: it is deliberately paraphrased into Review Policy's bullet, not duplicated.
    section: '## Branch Strategy',
    paragraphIndex: 1,
    topLabel: null,
    summaryLabel: 'Review Policy',
  },
  {
    section: '## Branch Strategy',
    paragraphIndex: 2,
    // The paragraph's OWN prose opens "Deployment constraints: ..." (sentence case, part of the
    // paragraph's content); Policy Summary's bullet label is "Deployment Constraints:" (title
    // case, the bullet's own label). Stripping each side's own label is what makes the remaining
    // substance comparable at all — without it, a real, harmless case difference in an
    // unrelated four characters would read as total non-containment.
    topLabel: 'Deployment constraints:',
    summaryLabel: 'Deployment Constraints',
  },
];

if (KNOWN_DUPLICATE_PAIRS.length === 0) {
  // Gates must refuse empty sets: a checker with nothing registered would report a green line
  // over zero comparisons, which is indistinguishable from "everything matches" to a reader.
  throw new Error('KNOWN_DUPLICATE_PAIRS is empty — refusing to report a vacuous pass');
}

/* ───────────────────────────────────── the two checks ───────────────────────────────────── */

/**
 * Checks the direction that matters: every registered top-section paragraph's content (after its
 * own optional label is stripped) must be reachable inside its paired Policy Summary bullet. Pure
 * function of `content`; returns `{ problems }`, never throws on a malformed charter — a missing
 * section, missing bullet, or out-of-range paragraph index is itself a reported problem, not a
 * crash, so this can run inside `--selftest`'s deliberately-broken fixtures.
 */
export function checkServedSurfaceDrift(content) {
  const problems = [];
  const bullets = policySummaryBullets(content);

  for (const pair of KNOWN_DUPLICATE_PAIRS) {
    const body = sectionBody(content, pair.section);
    if (body === null) {
      problems.push(
        `the '${pair.section}' section is missing entirely — cannot verify its content reaches ` +
          `Policy Summary's '${pair.summaryLabel}' bullet`,
      );
      continue;
    }
    const paragraphs = paragraphsOf(body);
    if (pair.paragraphIndex >= paragraphs.length) {
      problems.push(
        `'${pair.section}' has ${paragraphs.length} paragraph(s), but paragraph ` +
          `${pair.paragraphIndex} is registered as the one that must reach Policy Summary's ` +
          `'${pair.summaryLabel}' bullet — the section has been restructured under this check`,
      );
      continue;
    }
    const top = stripLiteralLabel(stripBulletMarker(paragraphs[pair.paragraphIndex]), pair.topLabel);

    if (bullets === null) {
      problems.push(
        `## Policy Summary is missing entirely — '${pair.section}' paragraph ` +
          `${pair.paragraphIndex} reaches no agent at bootstrap (context_result_builders.py's ` +
          '_extract_policy_summary reads only that section)',
      );
      continue;
    }
    const summaryText = findBulletTextByLabel(bullets, pair.summaryLabel);
    if (summaryText === undefined) {
      problems.push(
        `Policy Summary carries no '${pair.summaryLabel}:' bullet — '${pair.section}' paragraph ` +
          `${pair.paragraphIndex} has nowhere registered to land`,
      );
      continue;
    }
    if (!summaryText.includes(top)) {
      problems.push(
        `'${pair.section}' paragraph ${pair.paragraphIndex} is not reflected in Policy Summary's ` +
          `'${pair.summaryLabel}' bullet — an agent reading only the bootstrap/compact-served ` +
          `surface will not see this content. First 100 chars of the unreflected paragraph: ` +
          `${JSON.stringify(top.slice(0, 100))}`,
      );
    }
  }

  return { problems };
}

/**
 * Checks the cap: Policy Summary must never exceed `POLICY_SUMMARY_CAP` bullets. Pure function of
 * `content`. A missing Policy Summary section reports zero bullets here (that absence is
 * `checkServedSurfaceDrift`'s problem to report, not this function's, so it is not double-counted
 * as a cap violation).
 */
export function checkPolicySummaryCap(content, cap = POLICY_SUMMARY_CAP) {
  const bullets = policySummaryBullets(content) ?? [];
  const count = bullets.length;
  const problems = [];
  const notices = [];

  if (count > cap) {
    problems.push(
      `Policy Summary carries ${count} bullets, past _append_policy_summary_lines's cap of ` +
        `${cap} (bootstrap_text.py:208) — bullet ${cap + 1} onward is silently dropped at ` +
        'bootstrap render and never reaches an agent, with no error and no notice',
    );
  } else if (count === cap) {
    notices.push(
      `Policy Summary carries exactly ${cap} bullets — the cap (bootstrap_text.py:208). One ` +
        'more silently drops off the end; fold new content into an existing bullet rather than ' +
        'appending a new one.',
    );
  }

  return { count, cap, problems, notices };
}

/* ──────────────────────────────────────── CLI: --check ──────────────────────────────────────── */

function cliCheck() {
  const content = readFileSync(CHARTER_PATH, 'utf8');
  const drift = checkServedSurfaceDrift(content);
  const cap = checkPolicySummaryCap(content);

  for (const n of cap.notices) console.log(`::notice::${n}`);

  const problems = [...drift.problems, ...cap.problems];
  if (problems.length) {
    console.error(
      '::error::charter.md\'s served surface (Policy Summary) has drifted from a top section, ' +
        'or the summary has grown past its render cap:',
    );
    for (const p of problems) console.error(`   ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `✅ all ${KNOWN_DUPLICATE_PAIRS.length} registered top-section/Policy-Summary pairs match, ` +
      `and Policy Summary holds ${cap.count}/${cap.cap} bullets.`,
  );
}

/* ─────────────────────────────────────── CLI: --selftest ────────────────────────────────────── */

/**
 * Splices a NEW body into `## <heading>` inside `content`, by line range rather than a global
 * string replace — several of the strings this file mutates (the duplicated policy prose itself)
 * appear more than once across the whole document by design, so a `content.replace(...)` could
 * silently hit the Policy Summary copy instead of the top-section one, or vice versa, and the
 * probe would certify nothing. Throws if the heading is not found, so a probe whose anchor moved
 * fails loudly rather than silently applying no mutation.
 */
function replaceSectionBody(content, heading, transformBody) {
  const lines = content.split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) throw new Error(`heading not found, the probe would be vacuous: ${heading}`);
  const rest = lines.slice(start + 1);
  const endRel = rest.findIndex((l) => l.trim().startsWith('## '));
  const end = endRel === -1 ? lines.length : start + 1 + endRel;
  const body = lines.slice(start + 1, end).join('\n');
  const newBody = transformBody(body);
  return [...lines.slice(0, start + 1), ...newBody.split('\n'), ...lines.slice(end)].join('\n');
}

/** Replaces `needle` with `replacement` exactly once inside `text` — throws on zero or multiple
 *  occurrences, the same discipline check-gate-wiring-defeats.mjs's `once()` uses, for the same
 *  reason: an anchor that does not match exactly once is a probe that has stopped testing what it
 *  claims to. */
function onceReplace(text, needle, replacement) {
  const at = text.indexOf(needle);
  if (at === -1) throw new Error(`anchor not found, the probe would be vacuous: ${JSON.stringify(needle)}`);
  if (text.indexOf(needle, at + 1) !== -1) throw new Error(`anchor is ambiguous: ${JSON.stringify(needle)}`);
  return text.slice(0, at) + replacement + text.slice(at + needle.length);
}

function realCharter() {
  return readFileSync(CHARTER_PATH, 'utf8');
}

function runProbes() {
  const results = [];
  const record = (n, name, expect, ok, detail) => results.push({ n, name, expect, ok, detail });

  const base = realCharter();

  // Probe 1 — the real, committed charter.md: no drift, within the cap. This is the control: a
  // checker that reds on everything would "pass" every expect-fail probe below by being broken.
  {
    const drift = checkServedSurfaceDrift(base);
    const cap = checkPolicySummaryCap(base);
    record(
      1,
      "the real charter.md: zero drift problems, and the cap (7/8) is not exceeded",
      'pass',
      drift.problems.length === 0 && cap.problems.length === 0,
      { drift, cap },
    );
  }

  // Probe 2 — THE REPRODUCTION. New content appended to Testing Standards only, mirroring the
  // exact failure mode #433's F6 fold closed for Branch Strategy: a correction lands in a top
  // section and Policy Summary is never told.
  {
    const fixture = replaceSectionBody(base, '## Testing Standards', (body) =>
      onceReplace(
        body,
        'There is no minimum line-coverage threshold.',
        'There is no minimum line-coverage threshold. A fourth browser (Edge) is now also required.',
      ),
    );
    const drift = checkServedSurfaceDrift(fixture);
    const flagged = drift.problems.some((p) => p.includes('Testing Standards') && p.includes('Testing'));
    record(2, 'new content added to Testing Standards alone -> caught, naming the pair', 'fail', flagged, drift);
  }

  // Probe 3 — THE CONVERSE, TOLERATED. New content appended to Policy Summary's Testing bullet
  // only (the top section is untouched, i.e. a strict subset of the bullet). Must NOT be a defect.
  {
    const fixture = replaceSectionBody(base, '## Policy Summary', (body) =>
      onceReplace(
        body,
        'There is no minimum line-coverage threshold.',
        'There is no minimum line-coverage threshold. Also see docs/contributing/running-quality-checks.md.',
      ),
    );
    const drift = checkServedSurfaceDrift(fixture);
    record(3, 'Policy Summary carrying MORE than the top section -> not a defect', 'pass', drift.problems.length === 0, drift);
  }

  // Probe 4 — Quality Gates pair drift caught.
  {
    const fixture = replaceSectionBody(base, '## Quality Gates', (body) =>
      onceReplace(
        body,
        'may self-merge if CI passes.',
        'may self-merge if CI passes. A fifth criterion is now required for release branches.',
      ),
    );
    const drift = checkServedSurfaceDrift(fixture);
    const flagged = drift.problems.some((p) => p.includes('Quality Gates'));
    record(4, 'new content added to Quality Gates alone -> caught', 'fail', flagged, drift);
  }

  // Probe 5 — Performance Benchmarks pair drift caught.
  {
    const fixture = replaceSectionBody(base, '## Performance Benchmarks', (body) =>
      onceReplace(
        body,
        'these are static/presentational components, not application logic.',
        'these are static/presentational components, not application logic. A new NFR-006 caps first paint.',
      ),
    );
    const drift = checkServedSurfaceDrift(fixture);
    const flagged = drift.problems.some((p) => p.includes('Performance Benchmarks'));
    record(5, 'new content added to Performance Benchmarks alone -> caught', 'fail', flagged, drift);
  }

  // Probe 6 — Branch Strategy's screenshot/sign-off paragraph (Review Policy pair) drift caught.
  {
    const fixture = replaceSectionBody(base, '## Branch Strategy', (body) =>
      onceReplace(
        body,
        'plan-phase architecture on risky missions.',
        'plan-phase architecture on risky missions. A sixth tier now exists for security fixes.',
      ),
    );
    const drift = checkServedSurfaceDrift(fixture);
    const flagged = drift.problems.some((p) => p.includes('Branch Strategy') && p.includes('Review Policy'));
    record(6, "new content added to Branch Strategy's screenshot paragraph alone -> caught", 'fail', flagged, drift);
  }

  // Probe 7 — Branch Strategy's deployment paragraph (Deployment Constraints pair) drift caught.
  // Exercises the label-stripping path (`topLabel: 'Deployment constraints:'`), the one pair whose
  // own prose and bullet label differ in case.
  {
    const fixture = replaceSectionBody(base, '## Branch Strategy', (body) =>
      onceReplace(
        body,
        'none are distributed in any published package.',
        'none are distributed in any published package. A new registry mirror is now required.',
      ),
    );
    const drift = checkServedSurfaceDrift(fixture);
    const flagged = drift.problems.some((p) => p.includes('Branch Strategy') && p.includes('Deployment Constraints'));
    record(7, "new content added to Branch Strategy's deployment paragraph alone -> caught", 'fail', flagged, drift);
  }

  // Probe 8 — Policy Summary missing entirely: every registered pair must be reported, not
  // silently treated as agreement.
  {
    const fixture = onceReplace(base, '## Policy Summary', '## Policy Overview');
    const drift = checkServedSurfaceDrift(fixture);
    record(
      8,
      '## Policy Summary missing entirely -> every registered pair flagged',
      'fail',
      drift.problems.length === KNOWN_DUPLICATE_PAIRS.length,
      drift,
    );
  }

  // Probe 9 — a registered top section renamed out from under the check: reported, not silently
  // skipped.
  {
    const fixture = onceReplace(base, '## Quality Gates', '## Quality Gate Notes');
    const drift = checkServedSurfaceDrift(fixture);
    const flagged = drift.problems.some((p) => p.includes("'## Quality Gates' section is missing"));
    record(9, 'a registered top section renamed away -> caught, not silently skipped', 'fail', flagged, drift);
  }

  // Probe 10 — the cap, at today's real count (7): not exceeded, no failure.
  {
    const cap = checkPolicySummaryCap(base);
    record(10, `the real Policy Summary (${cap.count} bullets) does not exceed the cap`, 'pass', cap.problems.length === 0, cap);
  }

  // Probe 11 — the cap's boundary (exactly 8): still not a failure, but a notice fires.
  {
    const fixture = replaceSectionBody(
      base,
      '## Policy Summary',
      (body) => `${body}\n\n- Selftest Boundary: a synthetic eighth bullet for --selftest coverage only.`,
    );
    const cap = checkPolicySummaryCap(fixture);
    record(
      11,
      'exactly 8 bullets (the boundary) -> not a failure, but a notice names the consequence',
      'pass',
      cap.count === 8 && cap.problems.length === 0 && cap.notices.length === 1,
      cap,
    );
  }

  // Probe 12 — past the cap (9): a failure, naming the render-time consequence.
  {
    const fixture = replaceSectionBody(
      base,
      '## Policy Summary',
      (body) =>
        `${body}\n\n- Selftest Eighth: a synthetic eighth bullet.\n\n- Selftest Ninth: a synthetic ninth bullet that must be caught.`,
    );
    const cap = checkPolicySummaryCap(fixture);
    const flagged = cap.problems.some((p) => p.includes('silently dropped'));
    record(12, '9 bullets, past the cap -> a failure naming the silent-drop consequence', 'fail', cap.count === 9 && flagged, cap);
  }

  return results;
}

const PROBE_FLOOR = 12;

function selftest() {
  const results = runProbes();

  if (results.length < PROBE_FLOOR) {
    console.error(`❌ the probe table has shrunk: ${results.length} probe(s) against a floor of ${PROBE_FLOOR}.`);
    process.exitCode = 1;
    return;
  }

  const expectedPass = results.filter((r) => r.expect === 'pass');
  const expectedFail = results.filter((r) => r.expect === 'fail');
  if (expectedPass.length === 0 || expectedFail.length === 0) {
    console.error(
      'Refusing to report green over a degenerate probe set: ' +
        `${expectedPass.length} expect-pass, ${expectedFail.length} expect-fail.`,
    );
    process.exitCode = 1;
    return;
  }

  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} probe ${r.n} (expect: ${r.expect}): ${r.name}`);
  }
  const matched = results.filter((r) => r.ok);
  if (matched.length !== results.length) {
    console.error(`\n❌ ${results.length - matched.length} of ${results.length} probes did not match:`);
    for (const r of results) {
      if (!r.ok) console.error(`   probe ${r.n}: ${r.name} — ${JSON.stringify(r.detail)}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `\n✅ ${results.length}/${results.length} probes matched (${expectedPass.length} expect-pass, ` +
      `${expectedFail.length} expect-fail).`,
  );
}

/* ──────────────────────────────────────── entry point ───────────────────────────────────────── */

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) {
    selftest();
    return;
  }
  if (args.includes('--check') || args.length === 0) {
    cliCheck();
    return;
  }
  console.error('usage: node scripts/check-charter-served-surface.mjs [--check|--selftest]');
  process.exitCode = 1;
}

main();
