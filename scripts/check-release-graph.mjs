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

export function checkPublishingCallersDelegate(workflows) {
  const problems = [];
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
      if (!uses || !uses.includes('publish-packages.yml')) {
        // A workflow that publishes with its own inline steps instead of delegating is the exact
        // state the reshape undid. `release.yml` is the one sanctioned holdout until REL3 folds it
        // in; anything else re-inlining a payload is a regression that must not pass silently.
        const inline = Object.values(job?.steps ?? [])
          .map((s) => (typeof s?.run === 'string' ? s.run : ''))
          .join('\n');
        // Two exemptions, both deliberate. `publish-packages.yml` IS the payload — it is supposed
        // to publish inline, and flagging it would make the check reject the thing it protects.
        // `release.yml` is the sanctioned holdout until REL3 folds it in.
        const isPayloadOrProd = file.endsWith('publish-packages.yml') || file.endsWith('release.yml');
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
      } else if (tag.trim() === 'latest' && !/tags:/.test(text)) {
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
      for (const [scope, needed] of Object.entries(PAYLOAD_PERMISSIONS)) {
        const have = typeof granted === 'object' && granted !== null ? granted[scope] : undefined;
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
      if (typeof job?.uses === 'string' && job.uses.includes('publish-packages.yml')) {
        const r = job?.with?.registry;
        if (typeof r === 'string' && r.trim() !== '') declared.add(r.trim().replace(/\/+$/, ''));
      }
    }
  }
  for (const p of packages) {
    if (p.private) continue;
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
          `${p.name} publishes to \`${norm}\` via publishConfig, but a caller declares ` +
            `\`registry: ${d}\` — publishConfig wins, so that stream's registry input is decorative`,
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
    [/npm\s+publish\b[^\n]*--provenance[^\n]*--access\s+public/, 'publish with provenance'],
    [/cyclonedx/i, 'the SBOM'],
  ];
  const EVERY_STREAM_STEPS = [
    [/npm\s+pack\b/, 'the contents audit'],
    [/check-release-graph\.mjs(?!\s*--selftest)/, 'the release-graph assertion on the publishing path'],
    [/check-release-graph\.mjs\s+--selftest/, "the gate's own blindness check on the publishing path"],
    [/check-vue-packed-types\.mjs/, 'the packed Vue declaration check on the publishing path'],
    [/measure-elements-sizes\.mjs\s+--check/, 'the size and SRI drift check on the publishing path'],
    // BOTH ADDED AFTER REVIEW MEASURED THEIR DELETION AS GREEN. The audit gate carries an
    // `[ENFORCED]` label in the payload, and in this repo that prefix means "registered in a wiring
    // checker" — it was decoration until now. The bump is the mechanism that stops the second run
    // dying on EPUBLISHCONFLICT, and removing it silently reverted the fix for that.
    [/npm-audit-gate\.sh/, 'the ADR-005 security gate before publish'],
  ];
  const REQUIRED_STEPS = jobName === 'release' ? [...PROD_ONLY_STEPS, ...EVERY_STREAM_STEPS] : EVERY_STREAM_STEPS;
  for (const [re, what] of REQUIRED_STEPS) {
    if (!re.test(commands)) problems.push(`${label} has no step running ${what}`);
  }
  // The rc payload must still publish SOMETHING, or the five shared gates guard an empty act.
  if (jobName !== 'release' && !/npm\s+publish\b/.test(commands)) {
    problems.push(`${label} has no step running npm publish at all`);
  }
  // ...AND EVERY `npm publish` MUST CARRY `--tag`, ON ITS OWN LINE. Measured: deleting
  // `--tag "$TAG"` from the publish loop left every gate in the repository green, including this
  // one — the bare-`npm publish` assertion above still matched, because a tagless publish IS a
  // publish. That is the single irreversible mistake this whole reshape exists to prevent: with no
  // `--tag`, npm writes `latest`, and the first publish of a package with no existing versions
  // claims the prod channel from the rc stream.
  //
  // WHY EVERY LINE, not "does --tag appear anywhere". A job-wide test is satisfied by one tagged
  // publish while a second, tagless one rides along beside it — reproduced by a lens. The check has
  // to hold per invocation, and `--tag` has to be on the same physical line as the `npm publish` it
  // is meant to modify. `checkPublishingCallersDelegate` proves the CALLER passes a dist-tag;
  // this proves the payload forwards it on every publish. Prod is exempt: release.yml writes
  // `latest` by design.
  if (jobName !== 'release') {
    const taglessPublishes = commands
      .split('\n')
      .filter((l) => /npm\s+publish\b/.test(l) && !/--tag\b/.test(l));
    for (const line of taglessPublishes) {
      problems.push(
        `${label} runs \`${line.trim()}\` without \`--tag\` — npm defaults to \`latest\`, which ` +
          'claims the prod channel from the rc stream and cannot be undone',
      );
    }
    // AND THE TAG MUST COME FROM THE INPUT. A hard-coded `--tag latest` in the payload satisfies
    // the per-line rule above while doing exactly the damage it exists to prevent.
    if (/npm\s+publish\b[^\n]*--tag\s+["']?latest\b/.test(commands)) {
      problems.push(`${label} hard-codes \`--tag latest\` in a prerelease payload — that claims the prod channel`);
    }
    if (!/TAG=.*inputs\.dist-tag/.test(commands)) {
      problems.push(
        `${label} never assigns its publish tag from \`inputs.dist-tag\` — the caller's dist-tag is ` +
          'then decorative and the payload publishes under whatever it hard-codes',
      );
    }
    // THE BUMP, and its `--from-registry`. Deleting either was green. Nothing commits the bump
    // back to `develop`, so without `--from-registry` every run recomputes the same version and
    // publish #2 dies on EPUBLISHCONFLICT — the "it can publish exactly once" defect this mission
    // exists to fix, removable in one line with no gate reacting.
    if (!/bump-prerelease\.mjs/.test(commands)) {
      problems.push(`${label} has no step running the prerelease bump — the stream can publish exactly once`);
    } else if (!/bump-prerelease\.mjs[^\n]*--from-registry/.test(commands)) {
      problems.push(
        `${label} runs the bump without \`--from-registry\` — nothing commits the bump back, so ` +
          'every run recomputes the same version and the second publish dies on EPUBLISHCONFLICT',
      );
    }
    // ORDER IS LOAD-BEARING. The bump rewrites every publishable manifest, and `package.json` is
    // inside every tarball, so it moves each package's `unpackedSize`. A byte-exact size record
    // checked AFTER the bump compares the committed record against manifests just mutated — and
    // cannot be re-recorded to match, because the committed record must match the unbumped tree.
    // Measured: `@spec-kitty/styles` sat one byte below a rendering bucket and the bump added seven.
    const bumpAt = commandLines.findIndex((c) => /bump-prerelease\.mjs/.test(c));
    const sizeAt = commandLines.findIndex((c) => /measure-elements-sizes\.mjs\s+--check/.test(c));
    if (bumpAt !== -1 && sizeAt !== -1 && bumpAt < sizeAt) {
      problems.push(
        `${label} runs the prerelease bump BEFORE \`measure-elements-sizes.mjs --check\`; the bump ` +
          'mutates the manifests the size record measures, so the check compares the committed ' +
          'record against a tree it can never match. Move the bump below the verification steps.',
      );
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
      - name: Audit
        run: |
          for pkg in \${{ steps.graph.outputs.dirs }}; do ( cd "packages/$pkg" && npm pack --dry-run ); done
      - name: SBOM
        run: npx @cyclonedx/cyclonedx-npm --output-file sbom.json
      - name: Publish
        run: |
          for pkg in \${{ steps.graph.outputs.dirs }}; do ( cd "packages/$pkg" && npm publish --provenance --access public ); done
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
      - name: Audit
        run: npm pack --dry-run
      - name: Security
        run: bash scripts/npm-audit-gate.sh
      - name: Bump
        run: node scripts/bump-prerelease.mjs --from-registry
      - name: Publish
        run: |
          TAG="\${{ inputs.dist-tag }}"
          for pkg in \${{ steps.graph.outputs.dirs }}; do ( cd "packages/$pkg" && npm publish --tag "$TAG" ); done
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
const PROBE_FLOOR = 51;

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
          '      - name: "was: npm publish --provenance --access public over the derived set"\n        run: echo done\n',
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
        withDefect('      - name: SBOM', '      - name: Publish tokens\n        run: npm publish --provenance --access public\n        working-directory: packages/tokens\n      - name: SBOM'),
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
        withPayloadDefect('      - name: Audit\n        run: npm pack --dry-run\n', ''),
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
        withPayloadDefect(/npm publish --tag "\$TAG"/, 'npm publish'),
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
        withPayloadDefect(/npm publish --tag "\$TAG"/, 'echo "published"'),
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
    // Alphonso, Experiment A. `--tag` deleted for real, and a shell COMMENT left behind that
    // mentions it. The assertion regexed over the joined `run:` text, comments included, so prose
    // restored green over an irreversible `latest` claim.
    what: 'a tagless publish excused by a shell comment that merely MENTIONS --tag',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          /npm publish --tag "\$TAG"/,
          '# historical: npm publish --tag "$TAG" used to run here\n          npm publish',
        ),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // Renata, M19. The per-line rule alone is satisfied by `--tag latest` — presence was never the
    // dangerous part, the VALUE is.
    what: 'the payload hard-coding `--tag latest` instead of forwarding the input',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(/npm publish --tag "\$TAG"/, 'npm publish --tag latest'),
        ['@spec-kitty/tokens'],
        ['tokens'],
        'publish',
        'publish-packages.yml',
      ),
  },
  {
    // A SECOND, tagless publish beside the tagged one. A job-wide "does --tag appear" test passes
    // this; only a per-invocation test catches it.
    what: 'a second, tagless `npm publish` riding alongside a correctly tagged one',
    run: () =>
      checkWorkflowUsesDerivedSet(
        withPayloadDefect(
          /npm publish --tag "\$TAG"/,
          'npm publish --tag "$TAG" ); done\n          for pkg in $EXTRA; do ( cd "packages/$pkg" && npm publish',
        ),
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
