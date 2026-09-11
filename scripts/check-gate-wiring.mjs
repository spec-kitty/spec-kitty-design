#!/usr/bin/env node
/**
 * Assert the `gate` job actually gates the behaviour suite (#71, FR-014, SC-021).
 *
 * WHY THIS IS A SCRIPT AND NOT A DEMONSTRATION
 *
 * The obvious evidence for "a test job set to `if: false` fails the gate" is to push a
 * deliberately broken workflow and link the red run. That produces a CI-run URL in a
 * commit message — precisely the transcript NFR-002 rejects — and, worse, it does not
 * protect against the regression that will actually happen: a later PR adding
 * `test_ok="${{ needs.test.result }}"` to the skipped-tolerance block, quietly making
 * `skipped` acceptable for a job that never legitimately skips.
 *
 * A static assertion covers both. Same shape as scripts/gate-selftest.mjs, which this repo
 * already ships for the a11y gate.
 *
 * NOTE the gate's workflow-level `if:` is `always()` and MUST stay that way — it is what
 * lets the job report on failed dependencies at all. The actual gating is the shell
 * disjunction inside its [ENFORCED] step, which is what this checks.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';

const WORKFLOW = '.github/workflows/ci-quality.yml';
// A LIST, not a name. This was `const JOB = 'test'` — one job, hard-coded — in the script whose
// entire purpose is noticing a job that cannot block a merge. #80 added `release-gate`, which the
// single-name version could not have seen: the gate could have gone red while the merge stayed
// green, the exact condition this file exists to refuse. Every job that runs unconditionally and
// must be strictly required belongs here. NOT `lint-code`: it is strictly required by the gate, but
// its steps deliberately use continue-on-error (ESLint and Stylelint report into a summary and are
// failed by a final step), so the whole-job payload audit below does not describe it. REQUIRED_LINT
// is how a step in that job is held to running — see #193's two entries there, and the
// `lint-code` EDGE assertions below, which hold the job itself to being able to block a merge.
const JOBS = ['test', 'release-gate'];
// REL1 (#362): the relevant-change predicate gained a `promote/*`-skip conjunct
// (research.md R15) so a promotion PR's already-fully-gated content doesn't redundantly
// re-run the ~30-minute browser suite. Updated here WITH that edit, not left stale — a stale
// exact-string comparison would have reported this job's `if:` as wrong forever, which is a
// checker that reds on a correct file, exactly the failure mode this file's own header warns
// about one level up.
const STORYBOOK_PREDICATE =
  "(needs.changes.outputs.tokens == 'true' || needs.changes.outputs.components == 'true') && " +
  "!startsWith(github.head_ref, 'promote/')";
const STORYBOOK_WRAPPER = 'node scripts/build-storybook-with-budget.mjs';

// ── READING A `run:` BODY AS SHAPE RATHER THAN AS TEXT (#202, #205) ───────────────────
//
// Every assertion below used to inspect the workflow's shell by matching SUBSTRINGS, at two
// independent levels, and both were defeated by an edit that still reads as correct:
//
//   * #202, one level up — the `gate` job's failure disjunction. Appending a conjunct
//     (`[ "${{ needs.lint-code.result }}" != "success" ] && [ 1 = 2 ] || \`) or wrapping the
//     whole disjunction in `if false && [ … ]` kills the disjunct while the substring the
//     assertion looked for is still there, verbatim, for a diff reader to nod at.
//   * #205, one level down — `neutered()`'s ENUMERATED list of swallow spellings, which
//     `|| /bin/true`, `|| cmp /dev/null /dev/null` and a `set +e` … `exit 0` body all walk past.
//
// NOT A SHELL PARSER, deliberately: vendoring a POSIX grammar to audit one workflow is the
// disproportionate machinery that got #202 declined once already. What these helpers do is
// read the body as LOGICAL LINES and assert STRUCTURE over them, with every unrecognised
// construct reported rather than accepted. The rules below are stated positively for the same
// reason the `[ENFORCED]` rule further down already is: enumerating the ways to defeat a check
// is a game the enumerator loses, one spelling at a time.
//
// `scripts/check-gate-wiring-defeats.mjs` is the probe table for all of it. Both issues arrived
// as PROSE reproductions, which cannot be re-run — so nothing stopped the next refactor of this
// file from silently reopening either hole. It is registered in REQUIRED_LINT below, beside
// this file's own self-registration.

/** GitHub expressions masked to one keyword-free token, so `${{ … }}` can neither move the
 *  block depth nor look like a shell word. */
const masked = (text) =>
  String(text)
    .replace(/\$\{\{[\s\S]*?\}\}/g, 'GHEXPR')
    // Shell parameter expansion too, or `${VAR}`'s brace moves the block depth counted below.
    .replace(/\$\{[^{}]*\}/g, 'SHVAR');

/** Whole-line `#` comments dropped, `\` continuations joined, blanks removed. A continued
 *  disjunction is ONE line here, which is what lets it be read as one condition. */
const logicalLines = (body) => {
  const lines = String(body ?? '')
    .split('\n')
    .filter((l) => !/^\s*#/.test(l))
    .join('\n')
    .replace(/\\\n\s*/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  // `then` ON ITS OWN LINE is folded back onto its `if`. Requiring `; then` on one logical line
  // was a FALSE POSITIVE against ordinary POSIX style (F7): a perfectly intact gate written
  //     if [ ... ] || \
  //        [ ... ]
  //     then
  // was reported as having no top-level conditional that exits non-zero, while the shell still
  // blocked the merge. A checker that reds a correct gate gets the checker deleted, so this is
  // as load-bearing as any of the defeats below.
  const folded = [];
  for (const line of lines) {
    if (/^(then|do)$/.test(line) && folded.length) folded[folded.length - 1] += `; ${line}`;
    else folded.push(line);
  }
  return folded;
};

/** `;`-separated simple commands of one logical line. */
const fragments = (line) => line.split(';').map((f) => f.trim()).filter(Boolean);

/**
 * An `exit` whose status is PROVABLY non-zero.
 *
 * Stated over the argument rather than as a literal `exit 0` pattern (F3). The old rule was
 * `/exit\s+0\s*$/`, and three one-character neighbours walked past it — `exit 0;`, `exit 00`,
 * and `SKIP=0` … `exit $SKIP` — each an unconditional early exit that left the gate green.
 * Bare `exit` inherits the previous command's status and is not provable either. Anything the
 * rule cannot prove non-zero is refused, so the next spelling fails closed rather than being
 * added to a list.
 */
const RAISING_EXIT = /^exit\s+([1-9][0-9]*)$/;
const isExit = (fragment) => /^exit\b/.test(fragment);
const raisesFor = (fragment) => RAISING_EXIT.test(fragment.trim());

const OPENERS = new Set(['if', 'case', 'for', 'while', 'until']);
const CLOSERS = new Set(['fi', 'esac', 'done']);
/** Block depth, counted at WORD level over the masked line, so a one-liner `if … ; then … ; fi`
 *  is correctly net zero and a nested block is correctly not top level. */
const depthDelta = (line) => {
  const shape = masked(line);
  let delta = 0;
  for (const word of shape.split(/[\s;()]+/)) {
    if (OPENERS.has(word)) delta += 1;
    else if (CLOSERS.has(word)) delta -= 1;
  }
  // BRACES COUNT TOO (F1). Without this, `{` and `}` moved no depth and a function header was
  // just another word, so wrapping the entire failure disjunction in `gate_check() { ... }` and
  // never calling it read as TOP LEVEL: this file printed green, the probe table printed green,
  // and the shell printed "All hard gates passed." over a failed `test` job. A brace group is a
  // block whether or not it has a name, and a gating conditional inside one is not top level.
  delta += (shape.match(/\{/g) ?? []).length - (shape.match(/\}/g) ?? []).length;
  return delta;
};

/** Whitespace collapsed, INCLUDING inside `${{ … }}`, so realignment and reflow are free and
 *  a smuggled `-a 1 = 2` inside the brackets is not. */
const norm = (s) =>
  String(s)
    .replace(/\s+/g, ' ')
    .replace(/\$\{\{\s*([\s\S]*?)\s*\}\}/g, (_, inner) => `\${{ ${inner.trim()} }}`)
    .trim();

/**
 * A condition, accepted ONLY as a pure `||` chain of single bracket tests.
 *
 * Returns the normalised disjuncts, or `null` for anything else — a `&&`, a negation, a
 * subshell, a `[[ ]]`, a bare command. `null` is a PROBLEM at the call site, never a pass:
 * that one rule is what refuses both of #202's defeats at once, because an appended conjunct
 * and an `if false && …` wrapper are the same construct in different places.
 */
const disjunctsOf = (condition) => {
  const shape = masked(condition);
  if (shape.includes('&&') || /(^|\s)!(\s|$)/.test(shape) || /[()]/.test(shape)) return null;
  const parts = condition.split('||').map((p) => p.trim());
  for (const part of parts) {
    if (!/^\[\s[\s\S]*\s\]$/.test(part)) return null;
    if ((masked(part).match(/\[/g) ?? []).length !== 1) return null;
    if ((masked(part).match(/\]/g) ?? []).length !== 1) return null;
  }
  return parts.map(norm);
};

/**
 * The step's GATING conditionals: top-level `if … ; then` whose then-branch exits non-zero.
 *
 * That definition is the whole point. The gate's step also contains four top-level `if`s that
 * normalise `sb_ok`/`a11y_ok` and are not gating anything, so a rule over every `if` would be
 * wrong; and it makes two further defeats fail closed for free — weakening the branch to
 * `exit 0`, and nesting the disjunction inside `if false; then … fi`, both leave NO gating
 * conditional at all, which the caller treats as the gate not gating.
 */
const gatingConditionals = (body) => {
  const lines = logicalLines(body);
  const disjuncts = new Set();
  const malformed = [];
  let count = 0;
  let depth = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const opener = depth === 0 ? line.match(/^if\s+([\s\S]*?);\s*then\b([\s\S]*)$/) : null;
    if (opener) {
      const branch = [opener[2]];
      let inner = depthDelta(line);
      for (let j = i + 1; inner > 0 && j < lines.length; j += 1) {
        if (inner === 1 && /^(else|elif)\b/.test(lines[j])) break;
        branch.push(lines[j]);
        inner += depthDelta(lines[j]);
      }
      const exitsNonZero = branch.flatMap(fragments).some(raisesFor);
      if (exitsNonZero) {
        count += 1;
        const parsed = disjunctsOf(opener[1].trim());
        if (parsed === null) malformed.push(opener[1].trim());
        else for (const d of parsed) disjuncts.add(d);
      }
    }
    // UNREACHABLE CODE DOES NOT GATE (F1). An unconditional `exit` at top level ends the step,
    // so every conditional after it is dead — and the checker must not count a dead conditional
    // as the thing blocking a merge. Scanning stops here rather than reporting, because the
    // swallow rules below already name the exit itself; what this prevents is the gate LOOKING
    // gated because an unreachable disjunction is still present in the file.
    if (depth === 0 && !/^(if|elif|else|while|until|for|case)\b/.test(line) && fragments(line).some(isExit)) {
      break;
    }
    depth += depthDelta(line);
  }
  return { disjuncts, malformed, count };
};

/**
 * Ways a step body can pass over a failure. ONE rule, shared by `neutered()` (which audits the
 * registered gates in `lint-code`, `test` and `release-gate`) and by the `[ENFORCED]` sweep at
 * the bottom of this file. They used to be two rules — an enumeration and an inversion — and
 * #205 is exactly what that divergence cost: the enumeration reported a gate as enforced while
 * `|| /bin/true` held its exit status open.
 *
 * The `||` clause is an ALLOW-LIST OF ONE. A `||` whose right-hand side provably raises is a
 * fallback that STRENGTHENS the step, and the tree legitimately contains one — `lint-code`'s
 * manifest step is `git diff --exit-code … || { echo "::error::…"; exit 1; }`. Every other
 * right-hand side is refused, whatever it spells, so an unrecognised swallow fails closed.
 */
/**
 * A `||` right-hand side that provably raises.
 *
 * Either a bare non-zero `exit`, or a brace group whose FIRST exit is non-zero. "First", not
 * "last" (F5): the previous rule accepted any group ending in `exit 1`, so
 * `|| { echo "::warning::drift"; exit 0; exit 1; }` passed while the shell returned 0 at the
 * first `exit`. The tree's one legitimate fallback — `|| { echo "::error::…"; exit 1; }` —
 * still qualifies, because its first exit is the raising one; a leading `echo` is not an exit.
 */
const raisingRhs = (rhs) => {
  const group = rhs.match(/^\{([\s\S]*)\}$/);
  if (group) {
    const exits = fragments(group[1]).filter(isExit);
    return exits.length > 0 && raisesFor(exits[0]);
  }
  return raisesFor(rhs);
};

const swallows = (body) => {
  const text = String(body ?? '');
  const why = [];
  if (/(^|\n)\s*set\s+\+e\b/.test(text)) why.push('`set +e`');
  // A TRAP ON EXIT/ERR REWRITES THE STEP'S STATUS (F2). `trap 'exit 0' EXIT` at the top of the
  // gate step let it log "Merge blocked." and report success — every clause intact, every
  // assertion satisfied, the job green over a failed dependency. Nothing in this workflow has a
  // legitimate reason to trap either signal in an audited step, so the construct is refused
  // outright rather than having its handler inspected.
  if (/(^|\n)\s*trap\b[^\n]*\b(EXIT|ERR)\b/.test(text)) why.push('a `trap … EXIT/ERR`');
  for (const line of logicalLines(text)) {
    const shape = masked(line);
    const isCondition = /^(?:if|elif|while|until)\s/.test(shape);

    // A BACKGROUNDED COMMAND'S STATUS NEVER REACHES THE STEP. `node scripts/check-adr-index.mjs &`
    // returns immediately with 0 — `bash -e -c 'false &'` exits 0 — so the gate still RUNS, still
    // prints, and can no longer fail. Same family as the `||` rule below: the audited command's
    // exit status is severed from the job. Found by probing beyond the reported findings; the one
    // trailing `&` in this workflow serves Storybook for the advisory lighthouse job, which is
    // neither [ENFORCED] nor registered, so nothing legitimate is caught here.
    if (/(^|[^&])&\s*$/.test(shape)) why.push(`a backgrounded command (\`${line.slice(0, 50)}\`)`);

    // EVERY exit in the body, by ARGUMENT (F3) — not a literal `exit 0` pattern. Conditional
    // exits inside the line's own `if … ; then` are excluded: the gate's `exit 1` is one.
    if (!isCondition) {
      for (const fragment of fragments(shape)) {
        if (isExit(fragment) && !raisesFor(fragment)) {
          why.push(`an \`exit\` that is not provably non-zero (\`${fragment.slice(0, 40)}\`)`);
        }
      }
    }

    if (!shape.includes('||')) continue;
    if (isCondition) continue; // a condition, not a fallback
    // EVERY right-hand side in the chain, not just the last (F4). `lastIndexOf('||')` examined
    // only the final one, so `cmd || echo "::warning::…" || exit 1` and `cmd || true || exit 1`
    // both passed — and both return 0 under `bash -e`, because the FIRST fallback succeeds and
    // the `exit 1` is never reached. That reopened #205 on all of REQUIRED_LINT at once.
    //
    // KNOWN AND DELIBERATE: this splits on `||` as text, so a `||` inside a quoted string would
    // split wrongly. It fails CLOSED when it does — the fragment stops looking like a raise and
    // the step is reported — which is the safe direction and the reason this is a recorded
    // limitation rather than a quoting parser. Do not "fix" it by loosening the rule.
    const [, ...rhss] = shape.split('||').map((s) => s.trim());
    for (const rhs of rhss) {
      if (!raisingRhs(rhs)) {
        why.push(`a \`||\` fallback (${line.slice(0, 60)})`);
        break;
      }
    }
  }
  return why;
};

function inspectWorkflow(raw) {
const wf = parse(raw);
const gate = wf.jobs?.gate;
const problems = [];

// ── THE FILTERED STORYBOOK BUILD ────────────────────────────────────────────────────
//
// storybook-build is intentionally NOT in JOBS: it legitimately skips for unrelated changes.
// The guarantee here is narrower and source-structural. When relevant tokens/components select
// the job, exactly one unconditional, fail-closed wrapper invocation must own the 180 s budget.
const storybook = wf.jobs?.['storybook-build'];
if (!storybook) {
  problems.push('there is no `storybook-build` job at all');
} else {
  const jobIf = String(storybook.if ?? '').trim();
  if (!('if' in storybook)) {
    problems.push('the `storybook-build` job lost its deliberate relevant-change predicate');
  } else if (jobIf !== STORYBOOK_PREDICATE) {
    problems.push(
      `the \`storybook-build\` job condition is \`${jobIf}\`, not the exact deliberate relevant-change predicate`
    );
  }
  if (storybook['continue-on-error']) {
    problems.push('the `storybook-build` job carries continue-on-error — wrapper failure cannot reach the gate');
  }

  const buildSteps = (storybook.steps ?? []).filter((step) =>
    String(step.name ?? '').includes('[ENFORCED] Storybook build')
  );
  if (buildSteps.length !== 1) {
    problems.push(
      buildSteps.length === 0
        ? `the \`storybook-build\` job is missing the exact wrapper \`${STORYBOOK_WRAPPER}\` in an [ENFORCED] Storybook build step`
        : `the \`storybook-build\` job has ${buildSteps.length} [ENFORCED] Storybook build steps, expected exactly one`
    );
  }
  for (const buildStep of buildSteps) {
    if ('if' in buildStep) {
      problems.push('the enforced Storybook build step carries an `if:` — it must run whenever its job is selected');
    }
    if (buildStep['continue-on-error']) {
      problems.push('the enforced Storybook build step carries continue-on-error — wrapper failure is swallowed');
    }
    const body = String(buildStep.run ?? '');
    if (/(^|\n)\s*set\s+\+e\b/.test(body)) {
      problems.push('the enforced Storybook build step uses `set +e` — wrapper failure is swallowed');
    }
    if (/\|\|/.test(body)) {
      problems.push('the enforced Storybook build step uses a `||` fallback — wrapper failure is swallowed');
    }
    if (/(^|\n)\s*exit\s+0\s*(#.*)?$/m.test(body)) {
      problems.push('the enforced Storybook build step forces success with `exit 0` — wrapper failure is swallowed');
    }
    if (body.trim() !== STORYBOOK_WRAPPER) {
      problems.push(
        body.includes('build-storybook-with-budget.mjs')
          ? `the enforced Storybook build step does not invoke the exact wrapper \`${STORYBOOK_WRAPPER}\``
          : `the enforced Storybook build step is missing the exact wrapper \`${STORYBOOK_WRAPPER}\``
      );
    }
  }

  const rawNxSteps = (storybook.steps ?? []).filter((step) =>
    /(?:^|\s)(?:npx\s+)?nx\s+run\s+storybook:storybook:build(?:\s|$)/.test(String(step.run ?? ''))
  );
  if (rawNxSteps.length) {
    problems.push('raw `nx run storybook:storybook:build` remains in the Storybook job; only the budget wrapper may build it');
  }
}

// ── THE TRIGGER ITSELF ────────────────────────────────────────────────────────────────
//
// Every question below asks whether the `gate` job can block a merge. All of them are vacuous
// if the workflow never runs on the pull request, and NOTHING here referenced `wf.on` — the
// one-line neutering this file's own header claims to prevent. Reproduced with this script
// printing green (#193 final pass), three ways: deleting the `pull_request:` trigger outright,
// adding `paths: ['never/matches/**']` to it, and retargeting its `branches:` at a branch that
// does not exist.
//
// THIS REPO HAS ALREADY BEEN BITTEN BY THE CLASS. A PR based on a mission branch rather than
// `train/**` matched no branch filter here, ran zero quality jobs, and still showed a green
// preview check — so "CI is green" read as satisfied while nothing had run.
const on = wf.on ?? wf[true]; // YAML 1.1 parsers fold the `on` key to boolean true; this one does not.
// PRESENCE, not truthiness, and every shorthand `on:` admits. A bare `pull_request:` (null
// value), `on: pull_request` and `on: [pull_request, push]` all mean "every pull request, no
// filters" — WIDER than what this workflow declares, so they normalise to an empty filter set
// and are accepted. `on?.pull_request` alone treated the first of those as an absent trigger.
const onKeys =
  typeof on === 'string' ? [on] : Array.isArray(on) ? on.map(String) : on && typeof on === 'object' ? Object.keys(on) : [];
const hasPr = onKeys.includes('pull_request');
const pr = hasPr && on && typeof on === 'object' && !Array.isArray(on) ? (on.pull_request ?? {}) : {};
if (!hasPr) {
  problems.push(
    'the workflow has no `on.pull_request` trigger — it never runs on a pull request, so every ' +
      'assertion in this file is about a job that does not execute'
  );
} else {
  // A PATH FILTER is the quietest of the three. `paths:` narrows the trigger to a file set, and
  // a PR touching nothing in it gets NO run at all — not a failing one. There is no legitimate
  // path filter on a whole-repo quality workflow whose own jobs already fan out through the
  // `changes` job; that is where path scoping belongs, and it scopes JOBS, not the trigger.
  for (const key of ['paths', 'paths-ignore']) {
    if (key in pr) {
      problems.push(
        `\`on.pull_request\` carries \`${key}:\` — the workflow is skipped entirely for a PR that ` +
          `does not match it, and a skipped workflow reports nothing. Scope with the \`changes\` ` +
          `job, which gates jobs inside a run that actually happened.`
      );
    }
  }
  // BRANCH COVERAGE, tested by matching representative refs rather than by comparing strings, so
  // a rewrite to `'train/*'` or `'**'` is accepted and a narrowing is not. An ABSENT `branches:`
  // is a WIDER filter (every PR runs), so it is accepted deliberately; what is refused is a list
  // that does not cover the two lines this repo merges into.
  if ('branches' in pr) {
    const globToRe = (g) =>
      new RegExp(
        '^' +
          String(g)
            .replace(/[.+^${}()[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '\u0000')
            .replace(/\*/g, '[^/]*')
            .replace(/\u0000/g, '.*')
            .replace(/\?/g, '[^/]') +
          '$'
      );
    const entries = Array.isArray(pr.branches) ? pr.branches.map(String) : [String(pr.branches)];
    const covers = (ref) => {
      let hit = false;
      for (const e of entries) {
        if (e.startsWith('!')) {
          if (globToRe(e.slice(1)).test(ref)) hit = false;
        } else if (globToRe(e).test(ref)) hit = true;
      }
      return hit;
    };
    // `main` is where the train lands; `train/elements-first` stands for the integration line
    // every mission branch PRs into (ADR-8). `develop` is the RC line REL1 (#362) adds — the
    // promotion mechanism's own PRs target it, and a filter that misses any of the three is a
    // filter under which those PRs merge unchecked.
    for (const ref of ['main', 'train/elements-first', 'develop']) {
      if (!covers(ref)) {
        problems.push(
          `\`on.pull_request.branches\` (${entries.join(', ')}) does not match \`${ref}\` — a PR ` +
            `targeting it runs no job in this workflow and merges unchecked`
        );
      }
    }
  }
}

// The job's ABSENCE is a failure, not a pass. `wf.jobs?.[JOB] && 'if' in ...` evaluated to
// false when the job was deleted, so the script printed green over a workflow with no test
// job at all — the certifying-absence shape check-part-ratchet.mjs goes out of its way to
// refuse two files over. Found by a pre-merge lens.
for (const JOB of JOBS) {
  if (!wf.jobs?.[JOB]) problems.push(`there is no \`${JOB}\` job at all`);
}
if (!gate) problems.push('there is no `gate` job');
else {
  // THE GATE'S OWN `if:`. The header of this file names `always()` as a MUST and nothing
  // asserted it — deleting the line left this script green (#193 final pass). Without it the
  // `gate` job is SKIPPED the moment any of its ten needs fails, rather than running and
  // reporting the failure, and a skipped required check does not block a merge. The disjunction
  // below is the gating; this is what lets the gating run at all.
  //
  // EXACTLY `always()`, unwrapped from an optional `${{ }}`. A conjunct — `always() && ...` —
  // reintroduces a condition under which the gate does not report, so widening this is a
  // deliberate edit here rather than something a copied idiom does by accident.
  const gateIf = String(gate.if ?? '')
    .trim()
    .replace(/^\$\{\{\s*([\s\S]*?)\s*\}\}$/, '$1')
    .trim();
  if (gateIf !== 'always()') {
    problems.push(
      gate.if === undefined
        ? 'the `gate` job carries no `if:` — it is skipped as soon as any need fails, so a failed ' +
            'dependency produces a SKIPPED required check instead of a red one. It must be `always()`.'
        : `the \`gate\` job's \`if:\` is \`${String(gate.if)}\`, not \`always()\` — under any other ` +
            `condition the gate can decline to report, and a check that does not report does not block`
    );
  }

  const step = (gate.steps ?? []).find((s) => String(s.name ?? '').includes('[ENFORCED]'));
  const script = String(step?.run ?? '');

  // REL1 (#362), contracts/ci-quality-integration.md §3: the gate's promote/* skip-tolerance
  // exception may only fire INSIDE a conditional testing `head_ref` against a `promote/*`
  // pattern — never unconditionally. A promotion PR's tree legitimately sets `sb_ok`/`a11y_ok`/
  // `vr_ok`/`pw_ok` to "success" regardless of the four heavy jobs' real result (research.md
  // R15); widening that from a narrowly-scoped exception to an unconditional acceptance would
  // silently readmit the exact green-by-skip bypass this file exists to refuse, for every PR,
  // not only `promote/*` ones. This is real, new logic (plan.md names this the highest-risk
  // single edit in this mission) — scoped as narrowly as possible to the one assignment line,
  // never generalized into a check over every conditional in the step.
  const TOLERANCE_ASSIGNMENT = 'sb_ok="success"; a11y_ok="success"; vr_ok="success"; pw_ok="success"';
  if (!script.includes(TOLERANCE_ASSIGNMENT)) {
    problems.push(
      "the gate's [ENFORCED] step no longer contains the promote/* skip-tolerance assignment " +
        `(\`${TOLERANCE_ASSIGNMENT}\`) — if this exception was intentionally removed, this ` +
        'assertion must be removed in the same commit, not left to silently pass on its absence',
    );
  } else {
    // The nearest still-open `if ... ; then` at the point the assignment line appears must be
    // the one guarding it — tracked as a simple open/close stack over LOGICAL lines (so
    // realignment/reflow of the block is free, the same way every other structural check in
    // this file treats it), not a substring search over the raw text.
    const guardStack = [];
    let guardCondition;
    for (const line of logicalLines(script)) {
      const opener = line.match(/^if\s+([\s\S]*?);\s*then\b/);
      if (opener) guardStack.push(opener[1].trim());
      if (line.includes(TOLERANCE_ASSIGNMENT)) {
        guardCondition = guardStack.length ? guardStack[guardStack.length - 1] : null;
        break;
      }
      if (/^fi\b/.test(line) && guardStack.length) guardStack.pop();
    }
    if (!guardCondition || !/head_ref/.test(guardCondition) || !/promote\/\*/.test(guardCondition)) {
      problems.push(
        "the gate's promote/* skip-tolerance assignment is not scoped inside a conditional " +
          `testing \`head_ref\` against a \`promote/*\` pattern (nearest enclosing guard: ` +
          `${JSON.stringify(guardCondition ?? null)}) — this turns a narrowly-scoped exception ` +
          'into an unconditional acceptance of a skip that should be a failure',
      );
    }
  }

  // 3. NOT in the skipped-tolerance block. This is the one a future PR will get wrong.
  const toleranceRe = /case\s+"\$relevant"[\s\S]*?esac/;
  const toleranceMatch = script.match(toleranceRe);
  // FAIL CLOSED. `?? ''` meant that if the tolerance block were ever restructured — renamed
  // `$relevant`, switched to `if`/`[[ ]]`, split in two — the match returned null, the
  // haystack became empty, and the check silently passed. The one check the author called
  // "the one worth having" was guarded by a regex that disarms itself under exactly the
  // refactor that would motivate reopening the bypass.
  if (!toleranceMatch) {
    problems.push(
      'the skipped-tolerance block was not found — refusing to certify its absence. If it was ' +
        'restructured, update this pattern deliberately rather than letting the check pass.'
    );
  }
  const tolerance = toleranceMatch?.[0] ?? '';

  // THE FAILURE DISJUNCTION, read as shape (#202). Every `needs.<job>.result != "success"`
  // assertion below is now membership in this set — the disjuncts of the step's top-level
  // conditionals that actually exit non-zero — rather than a substring search over the whole
  // body. See the helpers at the top of this file for what is and is not accepted.
  const gating = gatingConditionals(script);
  if (gating.count === 0) {
    problems.push(
      "the gate's [ENFORCED] step has no top-level conditional that exits non-zero — whatever " +
        'clauses it contains, nothing in it can fail the job. This is what a weakened `exit 0`, ' +
        'or the disjunction nested inside another block, looks like from here.'
    );
  }
  for (const condition of gating.malformed) {
    problems.push(
      `the gate's failure condition is not a plain \`||\` chain of bracket tests: \`${condition}\`. ` +
        'A conjunct, a negation or a subshell can make a clause that is present unable to fire, so ' +
        'the shape is refused rather than searched for substrings. Widening this is a deliberate ' +
        'edit in scripts/check-gate-wiring.mjs, not something an idiom does by accident.'
    );
  }
  /** The clause a strictly-required job must contribute, as a WHOLE disjunct. */
  const strictlyRequired = (job) => {
    if (gating.disjuncts.has(norm(`[ "\${{ needs.${job}.result }}" != "success" ]`))) return;
    problems.push(
      `the gate's [ENFORCED] step has no strict \`needs.${job}.result != success\` clause standing ` +
        `as its own disjunct in a conditional that exits non-zero — the job can fail without ` +
        `blocking the merge`
    );
  };

  // Checks 1-4 hold for EVERY strictly-required job, not for one hard-coded name.
  for (const JOB of JOBS) {
    // 1. the job is a dependency at all
    if (!(gate.needs ?? []).includes(JOB)) {
      problems.push(`\`${JOB}\` is not in gate.needs — its result is not even visible to the gate`);
    }

    // 2. a STRICT clause in the failure disjunction, by SHAPE (#202)
    strictlyRequired(JOB);

    // 3 (continued)
    if (tolerance.includes(JOB)) {
      problems.push(
        `\`${JOB}\` appears in the skipped-tolerance block. It runs UNCONDITIONALLY, so ` +
          `'skipped' is never legitimate for it — tolerating it reopens the green-by-skip ` +
          `bypass the workflow's own comments record closing for a11y.`
      );
    }
    const okVar = new RegExp(String.raw`${JOB.replace(/-/g, '[-_]')}_ok\s*=`);
    if (okVar.test(script)) {
      problems.push(`\`${JOB}_ok\` normalisation found — that is how 'skipped' becomes acceptable`);
    }

    // 4. the job itself must have no `if:`, or "unconditional" is a claim rather than a fact
    if (wf.jobs?.[JOB] && 'if' in wf.jobs[JOB]) {
      problems.push(`the \`${JOB}\` job carries an \`if:\` — FR-003 requires it to run unconditionally`);
    }
  }

  // 4b. THE `lint-code` EDGE. `lint-code` is strictly required by the gate but is deliberately
  // absent from JOBS, because the whole-job payload audit below would red on ESLint's and
  // Stylelint's intentional continue-on-error. That exclusion cost the edge itself: every
  // REQUIRED_LINT assertion proves a STEP runs INSIDE `lint-code`, and none of them proved
  // `lint-code` can block a merge. Reproduced with this file printing green (#193 pre-merge
  // lens): deleting the strict clause from the gate's [ENFORCED] step, deleting `lint-code` from
  // `gate.needs`, and putting `if: false` or `continue-on-error: true` on the job were ALL
  // accepted — which made fourteen gates, including this file's own, unenforceable in one line.
  // Stated here rather than by adding `lint-code` to JOBS so the continue-on-error idiom stays
  // legal where it is deliberate (a step) and illegal where it is not (the job).
  const LINT_JOB = 'lint-code';
  const lintJob = wf.jobs?.[LINT_JOB];

  // i. the job is a dependency at all
  if (!(gate.needs ?? []).includes(LINT_JOB)) {
    problems.push(
      `\`${LINT_JOB}\` is not in gate.needs — its result is not even visible to the gate, so ` +
        `every gate in REQUIRED_LINT runs for information only`
    );
  }

  // ii. a STRICT clause in the failure disjunction. No skipped-tolerance entry is legitimate for
  // it: `lint-code` has no `if:` and is not behind the `changes` filter.
  //
  // #202 IS CLOSED HERE. This assertion, and the identical one for `test` and `release-gate`
  // above, used to match the clause as SHELL TEXT. Appending a conjunct
  // (`... != "success" ] && [ 1 = 2 ] || \`) or wrapping the disjunction in `if false && [ ... ]`
  // then defeated the real gate while the assertion still matched and a diff reader still saw
  // the clause they expected — both verified green against this file. `strictlyRequired` now
  // asks whether the clause stands as a WHOLE DISJUNCT of a top-level conditional that exits
  // non-zero, which is a question about the shell's shape rather than its spelling. The defeats
  // are re-run by scripts/check-gate-wiring-defeats.mjs rather than described in an issue.
  strictlyRequired(LINT_JOB);
  if (tolerance.includes(LINT_JOB)) {
    problems.push(
      `\`${LINT_JOB}\` appears in the skipped-tolerance block. It runs UNCONDITIONALLY, so ` +
        `'skipped' is never legitimate for it.`
    );
  }

  // iii. the job itself can fail. Step-level continue-on-error inside `lint-code` is deliberate;
  // JOB-level continue-on-error, or a job-level `if:`, is not — either one makes `result` unable
  // to carry a failure to the gate at all.
  if (lintJob && 'if' in lintJob) {
    problems.push(
      `the \`${LINT_JOB}\` job carries an \`if:\` — it can report 'skipped', which the gate's ` +
        `strict clause treats as a failure only if the clause is there at all; run it unconditionally`
    );
  }
  if (lintJob && lintJob['continue-on-error']) {
    problems.push(
      `the \`${LINT_JOB}\` job carries continue-on-error — its failure cannot reach the gate, ` +
        `and every gate in REQUIRED_LINT becomes advisory`
    );
  }

  // 5. THE PAYLOAD, not just the edge.
  //
  // Checks 1-4 all ask whether the gate LOOKS AT `needs.test.result`. None asked whether the
  // job runs anything, or whether a failure can reach `result` at all. A pre-merge lens
  // defeated the gate four separate ways while this script printed green: gutting the job to
  // `echo ok`, and `continue-on-error: true` on the suite step, on the gate's own step, and
  // on the job. The first is the plainest possible form of this programme's defect class; the
  // second is this workflow's OWN IDIOM — ci-quality.yml already carries continue-on-error on
  // steps named [ENFORCED] in lint-code, so a contributor copying the house style disarms the
  // suite and the checker congratulates them.
  // Matched PER STEP, as whole commands. A joined blob was defeated five ways at the second
  // gate pass, and the first of them is the subtle one: `scripts/suite-selftest.mjs` is a
  // SUBSTRING of `scripts/suite-selftest.mjs --selftest`, so deleting the mutation-harness
  // step entirely — NFR-002's centrepiece — was satisfied by the self-check step's line.
  const REQUIRED = [
    [/node\s+scripts\/measure-suite-time\.mjs(\s|$)/, 'the behaviour suite', 'scripts/measure-suite-time.mjs'],
    [/node\s+scripts\/suite-selftest\.mjs(?!\s*--selftest)(\s|$)/, 'the mutation harness', 'scripts/suite-selftest.mjs'],
    [/node\s+scripts\/suite-selftest\.mjs\s+--selftest(\s|$)/, "the mutation harness's own guard self-check", 'scripts/suite-selftest.mjs --selftest'],
  ];

  // The SECOND job. This checker only ever looked at `test`, so #73's four new element gates
  // — including the two self-checks that are the only thing catching a gutted checker — could
  // be deleted from lint-code with this script still printing green. A pass-2 lens deleted the
  // CSS gate's self-check step and watched exactly that happen. Same whole-command discipline:
  // `check-adopted-css-boundaries.mjs` is a SUBSTRING of the same line with `--selftest`.
  const REQUIRED_LINT = [
    [/node\s+scripts\/check-adopted-css-boundaries\.mjs(?!\s*--selftest)(\s|$)/, 'the cross-root selector gate', 'scripts/check-adopted-css-boundaries.mjs'],
    [/node\s+scripts\/check-adopted-css-boundaries\.mjs\s+--selftest(\s|$)/, "the cross-root gate's own probe table", 'scripts/check-adopted-css-boundaries.mjs --selftest'],
    [/node\s+scripts\/check-elements-entries\.mjs(?!\s*--selftest)(\s|$)/, 'the distribution-entry gate', 'scripts/check-elements-entries.mjs'],
    [/node\s+scripts\/check-elements-entries\.mjs\s+--selftest(\s|$)/, "the distribution-entry gate's own probe table", 'scripts/check-elements-entries.mjs --selftest'],
    [/node\s+scripts\/typecheck-all\.mjs(\s|$)/, 'the derived typecheck', 'scripts/typecheck-all.mjs'],
    [/node\s+scripts\/build-vue-types\.mjs\s+--check(\s|$)/, 'the Vue types drift check', 'scripts/build-vue-types.mjs --check'],
    [/node\s+scripts\/build-styles-only-markup\.mjs\s+--check(\s|$)/, 'the styles-only barrel drift check', 'scripts/build-styles-only-markup.mjs --check'],
    [/node\s+scripts\/check-vue-template-types\.mjs(\s|$)/, 'the Vue template-types gate', 'scripts/check-vue-template-types.mjs'],
    // Added with the gate itself this time. #74 shipped check-element-css-hygiene.mjs without an
    // entry here, and a lens demonstrated the consequence: delete both its CI lines and this
    // checker still printed green. That is the defect this list was created for, one gate later.
    [/node\s+scripts\/check-element-css-hygiene\.mjs(\s|$)/, 'the adopted-CSS hygiene gate', 'scripts/check-element-css-hygiene.mjs'],
    // #75, both entries with the gate itself. The gate's probe table is required separately
    // from the gate: a table that stops running is a gate whose defeated forms quietly reopen.
    [/node\s+scripts\/build-react-wrappers\.mjs\s+--check(?!\s*--selftest)(\s|$)/, 'the React wrapper drift gate', 'scripts/build-react-wrappers.mjs --check'],
    [/node\s+scripts\/build-react-wrappers\.mjs\s+--selftest(\s|$)/, "the wrapper gate's own probe table", 'scripts/build-react-wrappers.mjs --selftest'],
    [/node\s+scripts\/build-theme-bootstrap\.mjs\s+--check(\s|$)/, 'the pre-paint bootstrap drift gate', 'scripts/build-theme-bootstrap.mjs --check'],
    [/node\s+scripts\/build-theme-bootstrap\.mjs\s+--selftest(\s|$)/, "the pre-paint bootstrap gate's own probe table", 'scripts/build-theme-bootstrap.mjs --selftest'],
    [/node\s+scripts\/build-tokens-css\.mjs\s+--check(\s|$)/, 'the no-JS token fallback drift gate', 'scripts/build-tokens-css.mjs --check'],
    [/node\s+scripts\/build-tokens-css\.mjs\s+--selftest(\s|$)/, "the no-JS token fallback gate's own probe table", 'scripts/build-tokens-css.mjs --selftest'],
    // #129. check-manifest-content.mjs was an ENFORCED step with NO entry here at all, so
    // deleting its CI line was green — the exact episode the comment above records for
    // check-element-css-hygiene, in the gate that had just gained the description ratchet.
    [/node\s+scripts\/check-manifest-content\.mjs(?!\s*--selftest)(\s|$)/, 'the manifest content gate', 'scripts/check-manifest-content.mjs'],
    [/node\s+scripts\/check-manifest-content\.mjs\s+--selftest(\s|$)/, "the manifest gate's own probe table", 'scripts/check-manifest-content.mjs --selftest'],
    // #193, both entries with the gate itself, per the two comments above. The ADR index gate
    // is the only thing standing between `docs/architecture/decisions/` and an index that
    // silently omits seven of fifteen records again.
    [/node\s+scripts\/check-adr-index\.mjs(?!\s*--selftest)(\s|$)/, 'the ADR index gate', 'scripts/check-adr-index.mjs'],
    [/node\s+scripts\/check-adr-index\.mjs\s+--selftest(\s|$)/, "the ADR index gate's own probe table", 'scripts/check-adr-index.mjs --selftest'],
    // #197, both entries with the gate itself, per the three comments above. `llms.txt` and
    // `llms-full.txt` were a third and fourth hand-maintained ADR index — 3 of 15 records and
    // 14 of 15 respectively, plus three range expressions and two set-wide status claims — and
    // nothing in `.github/` or `scripts/` referenced either file. This gate is what keeps the
    // hand list from coming back; without an entry here its two CI lines are deletable free.
    [/node\s+scripts\/check-llms-adr-surface\.mjs(?!\s*--selftest)(\s|$)/, 'the LLM ADR-surface gate', 'scripts/check-llms-adr-surface.mjs'],
    [/node\s+scripts\/check-llms-adr-surface\.mjs\s+--selftest(\s|$)/, "the LLM ADR-surface gate's own probe table", 'scripts/check-llms-adr-surface.mjs --selftest'],
    // THIS FILE, registered against itself. Every comment above records the same episode — a
    // gate shipped with no entry here, and a lens then deleting its CI line with this checker
    // still green (#74's css-hygiene gate, #129's manifest gate) — and this file was the one
    // instance of it nobody had checked. Reproduced during #193's final fold: deleting the
    // `[ENFORCED] The gate actually gates the test job (FR-014)` step from ci-quality.yml left
    // BOTH this script and check-adr-index.mjs printing green, so the checker that catches
    // every other gate's deletion could not catch its own — and the three assertions #193 adds
    // above (the `on:` trigger, the gate's `if: always()`, the ADR index registry) all rest on
    // it running. Self-registration is not circular: the assertion is about the WORKFLOW
    // carrying the line, not about this process having been started.
    [/node\s+scripts\/check-gate-wiring\.mjs(?!\s*--selftest)(\s|$)/, 'this wiring checker itself', 'scripts/check-gate-wiring.mjs'],
    [/node\s+scripts\/check-gate-wiring\.mjs\s+--selftest(\s|$)/, "this wiring checker's Storybook probe table", 'scripts/check-gate-wiring.mjs --selftest'],
    // THIS FILE'S PROBE TABLE (#202, #205), registered with the table itself rather than a
    // mission later — the omission every comment above records. Both holes it re-runs arrived as
    // PROSE reproductions in an issue, which is why they survived: a reproduction nobody can run
    // does not stop the next refactor of this file from reopening the hole it describes. The
    // table is required SEPARATELY from the checker, for the reason #75's pair states — a probe
    // table that stops running is a gate whose defeated forms quietly reopen — and the two
    // command patterns cannot satisfy each other, because `check-gate-wiring-defeats.mjs` is not
    // `check-gate-wiring.mjs` followed by a space or an end of line.
    [/node\s+scripts\/check-gate-wiring-defeats\.mjs(\s|$)/, "the wiring checker's own defeat table", 'scripts/check-gate-wiring-defeats.mjs'],
    // #225, both entries with the gate itself, per every comment above. The behaviour-fixture
    // import gate is what keeps `selftestCeilingSeconds` describing the suite it bounds: one
    // `import '@spec-kitty/elements'` in that fixture puts its file back into EVERY element
    // arm's selection, and enough of them return the mutation harness to O(arms x elements) —
    // the exponent the ceiling's five raises were all about. Its own probe table is required
    // separately because it carries an end-to-end plant-and-detect arm, and a table that stops
    // running is a gate whose defeated forms quietly reopen.
    [/node\s+scripts\/check-behaviour-fixture-imports\.mjs(?!\s*--selftest)(\s|$)/, 'the behaviour-fixture barrel-import gate', 'scripts/check-behaviour-fixture-imports.mjs'],
    [/node\s+scripts\/check-behaviour-fixture-imports\.mjs\s+--selftest(\s|$)/, "the fixture-import gate's own probe table", 'scripts/check-behaviour-fixture-imports.mjs --selftest'],
    // #259, both entries with the gate itself, per every comment above. This gate carries epic
    // #183's last exit criterion, and it exists because the gate that was ASSUMED to carry half
    // of it does not reach a pattern fixture — measured with a planted violation, not reasoned
    // about. Its probe table is required separately because it carries an end-to-end
    // plant-and-detect arm against a copy of the real patterns directory, which is the arm that
    // proves scope; a table that stops running is a gate whose defeated forms quietly reopen.
    [/node\s+scripts\/check-pattern-composition\.mjs(?!\s*--selftest)(\s|$)/, 'the pattern-composition gate', 'scripts/check-pattern-composition.mjs'],
    [/node\s+scripts\/check-pattern-composition\.mjs\s+--selftest(\s|$)/, "the pattern-composition gate's own probe table", 'scripts/check-pattern-composition.mjs --selftest'],
    // #309/#310, all four entries with the gates themselves, per every comment above. The static
    // form is a GENERATED artifact a static consumer links instead of the authored sheet, so its
    // drift check is the same contract build-element-markup.mjs's is; the rewrite table is
    // required separately because it is the only thing holding the four `:host(...)` spellings
    // ADR-15 names, each of whose wrong rewrite is silent. `--static` here is HALF of #310 — the
    // rendered half needs a browser and lives in REQUIRED_RELEASE below, and both halves are
    // registered so neither can be deleted while the other reads as coverage.
    [/node\s+scripts\/build-static-form-css\.mjs\s+--check(\s|$)/, 'the static-form drift check', 'scripts/build-static-form-css.mjs --check'],
    [/node\s+scripts\/build-static-form-css\.mjs\s+--selftest(\s|$)/, "the static-form generator's own rewrite table", 'scripts/build-static-form-css.mjs --selftest'],
    [/node\s+scripts\/check-static-form-equivalence\.mjs\s+--static(\s|$)/, "the static form's structural and declaration-set checks", 'scripts/check-static-form-equivalence.mjs --static'],
    // REL1 (#362), both entries with the gates themselves, per every comment above. Without an
    // entry here, either self-test step could be deleted from `lint-code` with this checker
    // still green — precisely the defect class every comment in this list records.
    [/node\s+scripts\/promote-develop\.mjs\s+--selftest(\s|$)/, "the develop-promotion mechanism's own probe table", 'scripts/promote-develop.mjs --selftest'],
    [/node\s+scripts\/check-develop-ruleset-parity\.mjs\s+--selftest(\s|$)/, "the ruleset-parity checker's own probe table", 'scripts/check-develop-ruleset-parity.mjs --selftest'],
  ];

  /**
   * A step that cannot fail the job is a step that is not running (B, C, D, E).
   *
   * #205 IS CLOSED HERE. The third clause used to be an ENUMERATED list of swallow spellings —
   * `|| true`, `|| :`, `|| echo`, `|| cat`, `|| printf`, `|| exit 0` — and the run body was
   * examined for nothing else, so `|| /bin/true`, `|| cmp /dev/null /dev/null` and a
   * `set +e` … `exit 0` body all returned `[]` here while the gate they neuter was reported as
   * enforced. All three were reproduced against #193's own step: this was the audit's shape, not
   * any one gate's defect. It now delegates to `swallows()`, the same inverted rule the
   * `[ENFORCED]` sweep at the bottom of this file already used — ONE rule, so the two cannot
   * drift apart again, which is how the weaker of them survived seventeen registered gates.
   *
   * #202 was one level up (the `gate` job's strict clause matched as shell TEXT) and is closed
   * by `gatingConditionals`; the two were independent and both had to be fixed.
   */
  const neutered = (st) => {
    const why = [];
    if ('if' in st) why.push('carries an `if:`');
    if (st['continue-on-error']) why.push('carries continue-on-error');
    if ('shell' in st) why.push(`carries \`shell: ${st.shell}\``);
    for (const swallow of swallows(st.run)) why.push(`contains ${swallow}`);
    return why;
  };

  /** Strip comments so a needle mentioned only in a `#` line does not count as running. */
  const commandLines = (st) =>
    String(st.run ?? '')
      .split('\n')
      .map((l) => l.replace(/^\s*#.*$/, ''))
      .join('\n');

  const lintSteps = wf.jobs?.['lint-code']?.steps ?? [];
  if (lintSteps.length === 0) problems.push('the `lint-code` job has no steps — its gates cannot run');
  for (const [re, what, label] of REQUIRED_LINT) {
    const matching = lintSteps.filter((st) => re.test(commandLines(st)));
    if (matching.length === 0) {
      problems.push(`the \`lint-code\` job never runs ${what} (${label})`);
      continue;
    }
    for (const st of matching) {
      for (const why of neutered(st)) {
        problems.push(`the step running ${what} ${why} — it cannot fail the job`);
      }
    }
  }

  // REQUIRED describes the `test` job's payload specifically, so it is named rather than looped.
  const steps = wf.jobs?.test?.steps ?? [];
  for (const [re, what, label] of REQUIRED) {
    const matching = steps.filter((st) => re.test(commandLines(st)));
    if (matching.length === 0) {
      problems.push(`the \`test\` job never runs ${what} (${label}) — the gate would guard an empty job`);
      continue;
    }
    for (const st of matching) {
      for (const why of neutered(st)) {
        problems.push(`the step running ${what} ${why} — it cannot fail the job, so the gate guards nothing`);
      }
    }
  }

  // THE THIRD JOB, added with the job itself rather than one mission later. #74 shipped a gate
  // with no entry in this file and a lens proved the consequence: both its CI lines could be
  // deleted with this checker still green. `release-gate` exists to run a workflow that no PR had
  // ever executed, so a `release-gate` job reduced to `echo ok` would restore precisely the
  // condition it was built to end. Whole-command matching, because
  // `check-release-graph.mjs` is a SUBSTRING of the same line with `--selftest`.
  const REQUIRED_RELEASE = [
    [/node\s+scripts\/check-release-graph\.mjs(?!\s*--selftest)(\s|$)/, 'the release graph gate', 'scripts/check-release-graph.mjs'],
    [/node\s+scripts\/check-release-graph\.mjs\s+--selftest(\s|$)/, "the release gate's own probe table", 'scripts/check-release-graph.mjs --selftest'],
    [/node\s+scripts\/check-offline-load\.mjs(?!\s*--selftest)(\s|$)/, 'the file:// no-network probe', 'scripts/check-offline-load.mjs'],
    [/node\s+scripts\/check-offline-load\.mjs\s+--selftest(\s|$)/, "the offline probe's own blindness check", 'scripts/check-offline-load.mjs --selftest'],
    [/node\s+scripts\/measure-elements-sizes\.mjs\s+--check(\s|$)/, 'the size and SRI drift check', 'scripts/measure-elements-sizes.mjs --check'],
    [/node\s+scripts\/check-vue-packed-types\.mjs(\s|$)/, 'the packed Vue declaration gate', 'scripts/check-vue-packed-types.mjs'],
    // #310's rendered half. Registered here rather than in REQUIRED_LINT because it needs the
    // real built artifacts this job produces — and registered SEPARATELY from its probe table,
    // per #75's pair: a probe table that stops running is a gate whose defeated forms quietly
    // reopen, and this one's defeated forms are the collapsed transform and the abbreviated
    // wrapper ADR-15 measured. Whole-command matching, because `check-static-form-equivalence.mjs`
    // is a SUBSTRING of the same line with `--selftest`.
    [/node\s+scripts\/check-static-form-equivalence\.mjs(?!\s*--)(\s|$)/, 'the static-form rendered equivalence gate', 'scripts/check-static-form-equivalence.mjs'],
    [/node\s+scripts\/check-static-form-equivalence\.mjs\s+--selftest(\s|$)/, "the static-form gate's red-first probe table", 'scripts/check-static-form-equivalence.mjs --selftest'],
  ];
  const releaseSteps = wf.jobs?.['release-gate']?.steps ?? [];
  for (const [re, what, label] of REQUIRED_RELEASE) {
    const matching = releaseSteps.filter((st) => re.test(commandLines(st)));
    if (matching.length === 0) {
      problems.push(`the \`release-gate\` job never runs ${what} (${label}) — the gate would guard an empty job`);
      continue;
    }
    for (const st of matching) {
      for (const why of neutered(st)) {
        problems.push(`the step running ${what} ${why} — it cannot fail the job, so the gate guards nothing`);
      }
    }
  }

  // The gate's OWN enforced step, and both jobs. `continue-on-error` or an `if:` anywhere in
  // this chain makes a failure unreachable. lint-code uses continue-on-error deliberately,
  // rescued by an explicit "Fail if lint errors" step; nothing here is.
  const guarded = Object.fromEntries(JOBS.map((j) => [j, wf.jobs?.[j]]));
  for (const [jobName, job] of Object.entries({ ...guarded, gate })) {
    if (!job) continue;
    if (job['continue-on-error']) problems.push(`job \`${jobName}\` carries continue-on-error — its failure cannot reach the gate`);
    for (const st of job.steps ?? []) {
      const enforced = String(st.name ?? '').includes('[ENFORCED]');
      if (st['continue-on-error']) {
        problems.push(`step "${st.name ?? st.run}" in \`${jobName}\` carries continue-on-error — it cannot fail the job`);
      }
      if (enforced && 'if' in st) {
        problems.push(`[ENFORCED] step "${st.name}" in \`${jobName}\` carries an \`if:\` — it can be skipped`);
      }
      // A `shell:` OVERRIDE REPLACES THE COMMAND. `shell: bash -c "true" #` runs the step's body
      // as an argument to a shell that ignores it, so the registered gate never executes and the
      // step reports success — the `run:` line stays in the diff, matched by every assertion
      // above. NO step in this workflow carries `shell:`; they all use the job default, so
      // requiring its absence costs nothing and a deliberate future need is a deliberate edit
      // here. Same reasoning as the continue-on-error rule two lines up.
      if (enforced && 'shell' in st) {
        problems.push(
          `[ENFORCED] step "${st.name}" in \`${jobName}\` carries \`shell: ${st.shell}\` — the ` +
            `override decides what actually runs, so the command in \`run:\` is no longer evidence`
        );
      }
      // INVERTED, not enumerated — and now the SAME `swallows()` the registered-gate audit uses.
      // This was a list of swallows — `|| true`, then `|| :`, then `|| echo` — and a lens walked
      // past every version of it three ways: `set +e`, a trailing bare `exit 0`, and
      // `|| /bin/true`. Enforcing the inverted rule only here left `neutered()` on the old
      // enumeration, which is precisely what #205 measured; both call one helper now.
      //
      // The `||` half was previously excluded by "the line contains `[`", which reads the gate's
      // legitimate `[ ... ] || [ ... ]` disjunction as a condition — but also excuses
      // `[ -f x ] || rm -rf /`. `swallows()` joins continuations first and asks whether the
      // LOGICAL line opens a condition, so the disjunction still passes and a fallback dressed
      // up with a bracket does not.
      if (enforced) {
        for (const why of swallows(st.run)) {
          problems.push(`[ENFORCED] step "${st.name}" in \`${jobName}\` contains ${why} — it can pass over a failure`);
        }
      }
    }
  }
}
return problems;
}

function storybookStep(model) {
  return model.jobs?.['storybook-build']?.steps?.find((step) =>
    String(step.name ?? '').includes('[ENFORCED] Storybook build')
  );
}

function selftest() {
  const canonical = parse(readFileSync(WORKFLOW, 'utf8'));
  const probes = [
    {
      name: 'valid canonical fixture',
      expected: null,
      mutate: () => undefined,
    },
    {
      name: 'missing Storybook job',
      expected: 'no `storybook-build` job',
      mutate: (model) => { delete model.jobs['storybook-build']; },
    },
    {
      name: 'lost relevant-change predicate',
      expected: 'lost its deliberate relevant-change predicate',
      mutate: (model) => { delete model.jobs['storybook-build'].if; },
    },
    {
      name: 'wrong Storybook job condition',
      expected: 'not the exact deliberate relevant-change predicate',
      mutate: (model) => { model.jobs['storybook-build'].if = "needs.changes.outputs.tokens == 'true'"; },
    },
    {
      name: 'conditional build step',
      expected: 'build step carries an `if:`',
      mutate: (model) => { storybookStep(model).if = 'false'; },
    },
    {
      name: 'job continue-on-error',
      expected: 'job carries continue-on-error',
      mutate: (model) => { model.jobs['storybook-build']['continue-on-error'] = true; },
    },
    {
      name: 'step continue-on-error',
      expected: 'build step carries continue-on-error',
      mutate: (model) => { storybookStep(model)['continue-on-error'] = true; },
    },
    {
      name: 'or-true failure swallow',
      expected: '`||` fallback',
      mutate: (model) => { storybookStep(model).run = `${STORYBOOK_WRAPPER} || true`; },
    },
    {
      name: 'set-plus-e failure swallow',
      expected: '`set +e`',
      mutate: (model) => { storybookStep(model).run = `set +e\n${STORYBOOK_WRAPPER}`; },
    },
    {
      name: 'forced-success failure swallow',
      expected: 'forces success with `exit 0`',
      mutate: (model) => { storybookStep(model).run = `${STORYBOOK_WRAPPER}\nexit 0`; },
    },
    {
      name: 'missing wrapper',
      expected: 'missing the exact wrapper',
      mutate: (model) => { model.jobs['storybook-build'].steps = model.jobs['storybook-build'].steps.filter((step) => step !== storybookStep(model)); },
    },
    {
      name: 'wrong wrapper',
      expected: 'missing the exact wrapper',
      mutate: (model) => { storybookStep(model).run = 'node scripts/build-storybook.mjs'; },
    },
    {
      name: 'raw Nx build',
      expected: 'raw `nx run storybook:storybook:build` remains',
      mutate: (model) => { storybookStep(model).run = 'npx nx run storybook:storybook:build'; },
    },
  ];

  const scratch = mkdtempSync(join(tmpdir(), 'gate-wiring-selftest-'));
  const failures = [];
  try {
    for (const [index, probe] of probes.entries()) {
      const model = structuredClone(canonical);
      probe.mutate(model);
      const fixture = join(scratch, `${String(index).padStart(2, '0')}.yml`);
      writeFileSync(fixture, stringify(model));
      // This path-taking seam is deliberately private to --selftest. Normal invocation below
      // always reads WORKFLOW and accepts no path argument, so no production bypass exists.
      const found = inspectWorkflow(readFileSync(fixture, 'utf8'));
      if (probe.expected === null ? found.length !== 0 : !found.some((problem) => problem.includes(probe.expected))) {
        failures.push(`${probe.name}: expected ${probe.expected ?? 'green'}, got ${found.join(' | ') || 'green'}`);
      }
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  if (failures.length) {
    console.error('❌ gate wiring selftest:');
    for (const failure of failures) console.error(`   ${failure}`);
    process.exit(1);
  }
  console.log(`✅ gate wiring selftest: ${probes.length}/${probes.length} isolated fixtures passed.`);
}

if (process.argv.includes('--selftest')) {
  if (process.argv.length !== 3) {
    console.error('❌ --selftest accepts no additional arguments');
    process.exit(1);
  }
  selftest();
} else {
  if (process.argv.length !== 2) {
    console.error('❌ usage: node scripts/check-gate-wiring.mjs [--selftest]');
    process.exit(1);
  }
  const problems = inspectWorkflow(readFileSync(WORKFLOW, 'utf8'));
  if (problems.length) {
    console.error(`❌ ${WORKFLOW}: the gate does not gate \`${JOBS.join('`, `')}\`, \`lint-code\`, and the filtered Storybook build:`);
    for (const problem of problems) console.error(`   ${problem}`);
    process.exit(1);
  }
  console.log(`✅ gate wiring: \`${JOBS.join('`, `')}\` and \`lint-code\` gate strictly; the filtered Storybook job uses only its 180 s wrapper.`);
}
