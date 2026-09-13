# Running quality checks locally

Match CI behavior locally before pushing. All checks below run in CI on every PR.

## Full check suite

```bash
npm run quality:all    # ESLint + Stylelint + HTMLHint
```

## Individual checks

| Check | Command | What it catches | When to run |
|---|---|---|---|
| ESLint | `npm run quality:lint` | TS errors, module boundary violations, security issues | Before every commit |
| Stylelint | `npm run quality:stylelint` | Hardcoded CSS values (must use `--sk-*`) | After editing any CSS |
| HTMLHint | `npm run quality:htmlhint` | HTML validity, missing `alt` attributes | After editing any HTML template |
| commitlint | `npm run quality:commitlint` | Conventional commit format | After the final commit on a branch |
| npm audit | `bash scripts/npm-audit-gate.sh` | Known CVEs in dependencies | After adding or updating dependencies |
| Lockfile | `npm ci --dry-run --ignore-scripts` | Lockfile drift detection | After any `package.json` change |
| Action SHA pins | `bash scripts/check-action-pins.sh` | Mutable `@v*` tags in workflows | After editing `.github/workflows/` |
| Token breaking changes | `bash scripts/check-token-breaking-changes.sh` | Removed or renamed `--sk-*` tokens | Automated in CI's `release-gate` job on every PR (#435, #438); run locally to reproduce a failure |
| Token catalogue drift | `node scripts/generate-token-catalogue.js --check` | The committed `token-catalogue.json` not matching a fresh build from `tokens.css` | Automated in CI's `release-gate` job (#438 F11); run after editing `tokens.css` if you forgot to regenerate |
| ADR index | `node scripts/check-adr-index.mjs` | A record in `docs/architecture/decisions/` with no row in the architecture README's ADR table, a row pointing at no record, or a row whose Status disagrees with the record's own | After adding, renaming or ratifying an ADR |

## Storybook-specific

```bash
npx nx run storybook:storybook:build    # build to storybook-static/
node scripts/run-axe-storybook.js       # WCAG 2.1 AA check — iterates ALL stories
npx playwright test                     # cross-browser + visual regression + CDN smoke test
```

The `run-axe-storybook.js` script reads `storybook-static/index.json` to discover all story
IDs and runs axe against each story's iframe URL. A missing build will print a clear error
and exit non-zero rather than silently passing.

## Visual regression

On a clean run:
```bash
npx playwright test apps/storybook/src/tests/visual.spec.ts
```

To update baselines after an intentional visual change:
```bash
npx playwright test --update-snapshots
git add apps/storybook/src/tests/visual.spec.ts-snapshots/
```

Baseline snapshots must be committed alongside the component change so that CI
can compare against the correct reference.

### macOS contributors: platform-specific baselines

Visual regression snapshots are **platform-specific**. The committed baselines
in `apps/storybook/src/tests/visual.spec.ts-snapshots/` were generated on
Linux (CI uses `ubuntu-latest`). If you are on macOS or Windows, Playwright
will produce screenshots with different pixel renders and your local tests will
fail with "screenshot does not match."

**This is expected.** To run visual regression locally on macOS:

```bash
# 1. Build Storybook first
npx nx run storybook:storybook:build

# 2. Generate macOS-specific baselines (stored alongside the Linux ones)
npx playwright test apps/storybook/src/tests/visual.spec.ts --update-snapshots

# 3. Verify the new platform snapshots look correct, then commit them
git add apps/storybook/src/tests/visual.spec.ts-snapshots/
git commit -m "test(visual): add macOS baseline snapshots"
```

Playwright will automatically use the correct platform baseline at test time
(it keys snapshots by `<name>-<browser>-<platform>.png`). The Linux baselines
used by CI remain intact alongside your macOS baselines.

**Do not delete the Linux baselines** — they are used by the CI `visual-regression` job.

## Breaking token change check

**Automated** since #435/#438: `ci-quality.yml`'s `release-gate` job runs this on every PR —
it is no longer a manual pre-publish step. Run it locally to reproduce a CI failure, or after
renaming/removing a `--sk-*` token to check before pushing:

```bash
bash scripts/check-token-breaking-changes.sh
# Compares the current committed token-catalogue.json against the most recent RELEASE tag
# (a `v*.*.*` tag — the same glob release.yml's own trigger uses, not merely the nearest
# reachable tag of any kind: this repo also carries non-release tags such as
# `parity-anchor/relN`, and the nearest one of THOSE is not a release)
# Exits 1 with a list of removed tokens if a breaking change is detected
```

Exit codes: `0` no breaking changes (including the legitimate "nothing to compare against yet"
cases: first release, or the release tag predates the catalogue's existence); `1` breaking
changes detected; `2` cannot compare — the ref/tag does not resolve or is unreachable (e.g. a
shallow clone), or a catalogue that should be comparable is not well-formed.

In CI, `release-gate`'s checkout uses `fetch-depth: 0` specifically so this check's tag
resolution has real history to work with. Locally, if your own clone is shallow, run
`git fetch --tags --unshallow` first. `node scripts/generate-token-catalogue.js --check` (also
wired into `release-gate`, and its own `--selftest` before it) verifies the committed catalogue
matches a fresh build from `tokens.css` before this check trusts it as the CURRENT side of the
comparison.

## CI parity note

CI uses `npm ci --ignore-scripts` (never `npm install`). Run locally with:
```bash
npm ci --ignore-scripts
```
If `npm install` is needed for a new dependency, commit the updated lockfile before
pushing — a lockfile drift failure in CI means the lockfile does not match `package.json`.
