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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW = '.github/workflows/release.yml';
const REUSABLE_WORKFLOW = '.github/workflows/publish-packages.yml';

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
export const PAYLOAD_PERMISSIONS = { contents: 'read', packages: 'write' };
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
 *  sanctioned holdout until REL3 (#364) converts it into a caller. */
const INLINE_PUBLISH_EXEMPT = new Set(['.github/workflows/publish-packages.yml', '.github/workflows/release.yml']);

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
        // state the reshape undid. `release.yml` is the one sanctioned holdout until REL3 folds it
        // in; anything else re-inlining a payload is a regression that must not pass silently.
        const inline = Object.values(job?.steps ?? [])
          .map((s) => (typeof s?.run === 'string' ? s.run : ''))
          .join('\n');
        // Two exemptions, both deliberate. `publish-packages.yml` IS the payload — it is supposed
        // to publish inline, and flagging it would make the check reject the thing it protects.
        // `release.yml` is the sanctioned holdout until REL3 folds it in.
        // EXACT paths. A suffix test exempted `nightly-release.yml` too, because
        // `'nightly-release.yml'.endsWith('release.yml')` is true — so any workflow whose name
        // happened to end that way could publish inline, unnoticed.
        const isPayloadOrProd = INLINE_PUBLISH_EXEMPT.has(file);
        if (/npm\s+publish\b/.test(inline) && !isPayloadOrProd) {
          inlinePublishers.push(`${file} job \`${jobName}\``);
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
      const publishes = steps.some((st) => /npm\s+publish\b/.test(String(st?.run ?? '')));
      if (!publishes) continue;
      for (const st of steps) {
        const url = String(st?.uses ?? '').startsWith('actions/setup-node@') ? st?.with?.['registry-url'] : null;
        if (typeof url === 'string' && url.trim() !== '') declared.add(url.trim().replace(/\/+$/, ''));
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
    // route to dropping the publish.
    [/npm\s+publish\b/, 'a publish step'],
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
    // ANCHORED ON THE ASSIGNMENT, not the bare command. My own fix introduced the defeat: the new
    // `echo "::error::$NAME: npm dist-tag ls exited $RC"` satisfies a bare `/npm\s+dist-tag\s+ls/`,
    // so the real invocation could be deleted and the error message alone kept the gate green.
    // That is the prose-satisfies-the-guard class this file closed two passes ago, reintroduced by
    // the very line meant to make the report honest.
    [/OUT="\$\(npm\s+dist-tag\s+ls/, 'the published dist-tag report'],
  ];
  const REQUIRED_STEPS = jobName === 'release' ? [...PROD_ONLY_STEPS, ...EVERY_STREAM_STEPS] : EVERY_STREAM_STEPS;
  for (const [re, what] of REQUIRED_STEPS) {
    if (!re.test(commands)) problems.push(`${label} has no step running ${what}`);
  }
  // DRIFT CHECKS MUST BE THEIR OWN UNCONDITIONAL STEP, RUN EXACTLY. The presence patterns above
  // are substring matches, and REL4 review measured all three defeats GREEN on the publishing path:
  // `… --check || true`, `echo … --check`, and an `if: false` on the step. (The size check had
  // the same hole from REL2; it is closed with the OpenDesign one.) An exact `run` cannot be
  // chained, echoed or piped, and a step with no `if:` cannot be skipped.
  for (const exact of ['node scripts/measure-elements-sizes.mjs --check', 'node scripts/build-opendesign-package.mjs --check']) {
    const own = steps.filter((st) => typeof st.run === 'string' && stripShellComments(st.run).trim() === exact);
    if (!own.length) {
      problems.push(`${label} has no step whose run is exactly \`${exact}\` — a chained, echoed or wrapped form passes without gating anything`);
    } else if (own.every((st) => st.if !== undefined)) {
      problems.push(`${label} runs \`${exact}\` only under an \`if:\` — a condition can skip the check while the release proceeds`);
    }
  }
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
    // ...AND `npm dist-tag` IS REFUSED OUTRIGHT. Closing the `npm publish --tag` route left the
    // OTHER documented way to write a dist-tag wide open: a plausible "Promote to latest" step
    // running `npm dist-tag add @spec-kitty/tokens@1.0.0 latest` passed every gate and claimed the
    // prod channel. Unlike the `--tag` arms race this closes in one line rather than a pattern to
    // be excused, because the command has no legitimate use in a prerelease payload at all.
    if (/npm\s+dist-tag\s+add\b/.test(commands)) {
      problems.push(
        `${label} runs \`npm dist-tag add\`, which writes a dist-tag directly and bypasses the ` +
          'publish script entirely — there is no legitimate use for it in a prerelease payload',
      );
    }
    // ...AND NOTHING ELSE MAY PUBLISH. The script is only a guarantee if it is the sole route.
    for (const line of commands.split('\n')) {
      if (/npm\s+publish\b/.test(line) || /\bnpm\b(?=[^\n;|&]*\bpublish\b)/.test(line)) {
        problems.push(
          `${label} runs \`${line.trim()}\` directly instead of going through ` +
            'scripts/publish-derived-set.mjs, which is where the `latest` refusal lives',
        );
      }
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
    const FORGEABLE = ['GITHUB_REF', 'GITHUB_REF_TYPE', 'GITHUB_EVENT_PATH', 'GITHUB_RUN_ATTEMPT'];
    const envBlocks = [wf?.env, wf?.jobs?.[jobName]?.env, ...steps.map((st) => st?.env)];
    for (const block of envBlocks) {
      if (typeof block !== 'object' || block === null) continue;
      for (const key of Object.keys(block)) {
        if (FORGEABLE.includes(key)) {
          problems.push(
            `${label} sets \`${key}\` in an \`env:\` block — that is the evidence the publish ` +
              'guard weighs, and a payload that can author it is a payload that can authorise itself',
          );
        }
      }
    }

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
const VALID_RELEASE_WORKFLOW = `jobs:
  release:
    steps:
      - name: Security
        run: bash scripts/npm-audit-gate.sh
      - name: Report
        run: OUT="$(npm dist-tag ls "@spec-kitty/tokens" 2>/tmp/e)"
      - name: Resolve the publishable package set
        id: graph
        run: |
          PROJECTS="$(node scripts/release-graph.mjs --projects)"
          DIRS="$(node scripts/release-graph.mjs --dirs)"
          echo "projects=$PROJECTS" >> "$GITHUB_OUTPUT"
          echo "dirs=$DIRS" >> "$GITHUB_OUTPUT"
      - name: Build
        run: npx nx run-many --target=build --projects=\${{ steps.graph.outputs.projects }}
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
        run: npx @cyclonedx/cyclonedx-npm --output-file sbom.json
      - name: Publish
        run: |
          for pkg in \${{ steps.graph.outputs.dirs }}; do ( cd "packages/$pkg" && npm publish ); done
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
    steps:
      - name: Resolve
        id: graph
        run: |
          PROJECTS="$(node scripts/release-graph.mjs --projects)"
          DIRS="$(node scripts/release-graph.mjs --dirs)"
          echo "projects=\${PROJECTS}" >> "$GITHUB_OUTPUT"
          echo "dirs=\${DIRS}" >> "$GITHUB_OUTPUT"
      - name: Build
        run: npx nx run-many --target=build --projects=\${{ steps.graph.outputs.projects }}
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
        run: OUT="$(npm dist-tag ls "@spec-kitty/tokens" 2>/tmp/e)"
      - name: Bump
        run: node scripts/bump-prerelease.mjs --from-registry
      - name: Publish
        env:
          DIST_TAG: \${{ inputs.dist-tag }}
        run: node scripts/publish-derived-set.mjs
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
const PROBE_FLOOR = 71;

const PROBES = [
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
        withDefect(/for pkg in [^\n]*npm publish[^\n]*done/, 'echo "release complete"'),
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
          /      - name: Publish\n        run: \|\n          for pkg in[^\n]*\n/,
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
    ...checkWorkflowUsesDerivedSet(readFileSync(join(ROOT, WORKFLOW), 'utf8'), pkgs.map((p) => p.name), pkgs.map((p) => p.dir), 'release', WORKFLOW),
    ...(existsSync(join(ROOT, REUSABLE_WORKFLOW))
      ? checkWorkflowUsesDerivedSet(
          readFileSync(join(ROOT, REUSABLE_WORKFLOW), 'utf8'),
          pkgs.map((p) => p.name),
          pkgs.map((p) => p.dir),
          'publish',
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
