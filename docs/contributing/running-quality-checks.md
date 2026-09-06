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
| Token breaking changes | `bash scripts/check-token-breaking-changes.sh` | Removed or renamed `--sk-*` tokens | Before bumping package version |
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

After renaming or removing a `--sk-*` token, verify no breaking changes were
introduced before publishing:

```bash
bash scripts/check-token-breaking-changes.sh
# Compares current token-catalogue.json against the most recent git tag
# Exits 1 with a list of removed tokens if a breaking change is detected
```

This check requires a previous git tag to exist. On the first release, it will
report "No previous tag found" and exit 0 — that is correct behavior.

## CI parity note

CI uses `npm ci --ignore-scripts` (never `npm install`). Run locally with:
```bash
npm ci --ignore-scripts
```
If `npm install` is needed for a new dependency, commit the updated lockfile before
pushing — a lockfile drift failure in CI means the lockfile does not match `package.json`.
