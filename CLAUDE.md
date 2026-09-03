# CLAUDE.md — Agent guide for `spec-kitty-design`

Read this first. It is the canonical entry point for any LLM coding agent (Claude, Cursor, Codex, Copilot) working in this repo. Skim the rules; deep-dive linked docs only when needed.

## 1. What this repo is

A Nx monorepo for a token-driven, **elements-first** web design system. **Four** packages:

| package | what it is | you edit it |
|---|---|---|
| `@spec-kitty/tokens` | CSS custom properties — the single source of truth for every design value | yes |
| `@spec-kitty/styles` | the `.css` source of record, plus **generated** static HTML | yes |
| `@spec-kitty/elements` | the Lit **custom elements** — the component layer since ADR-8 — and the **authored** markup module every static form is generated from | yes |
| `@spec-kitty/react` | **generated** React wrappers, for JSX typing and typed refs | **never** |

Dependencies flow one direction: `tokens → styles → elements → react`. The token layer never
depends on anything; consumer packages never bypass it.

**`packages/react/src` is generated and committed.** Do not hand-edit it —
`scripts/build-react-wrappers.mjs --check` regenerates and fails CI on any drift, on a file the
generator no longer emits, and on a shrunken output set. You add nothing there for a new
component: get the element and its JSDoc right and the wrapper follows.

Angular is not a target. `packages/angular` was deleted in #102 and ADR-8 replaced hand-written
wrappers with generated ones; older documents that mention it are history.

Storybook publishes everything to [`https://stijn-dejongh.github.io/spec-kitty-design/`](https://stijn-dejongh.github.io/spec-kitty-design/). Two static demo pages — `blog-demo.html` and `dashboard-demo.html` — live at the deploy root and showcase realistic compositions of the components against the live token CSS.

## 2. Repo map

| Path | What lives here |
|------|-----------------|
| `packages/tokens/src/tokens.css` | Every design token. Touch this when adding/changing design values. |
| `packages/tokens/dist/token-catalogue.json` | Generated catalogue consumed by stylelint. Regenerate after token changes. |
| `packages/styles/src/<component>/` | `sk-<name>.css` (styles), `sk-<name>.js` (optional ES module), `sk-<name>.stories.ts` (Storybook), `index.ts` (re-export). |
| `packages/elements/src/<component>/` | `sk-<name>.ts` (the element), `sk-<name>.markup.ts` (**authored** markup — the `.html` and the styles module are generated from it), `sk-<name>.stories.ts`. |
| `packages/react/src/` | **Generated** wrappers. Never hand-edited; CI fails on drift. |
| `behaviours.json`, `mutations.json` | The behaviour registry (ADR-11) and one red-first mutation per subject. |
| `expected-parts.json`, `expected-docs.json` | Ratchets: `::part()` (shrink-only) and documented attributes/methods (**exact**). |
| `apps/storybook/` | Storybook 10.x config; auto-emits `index.json` at build. |
| `apps/demo/{blog-demo,dashboard-demo,index}.html` | Composed example pages served at the deploy root. |
| `docs/architecture/` | ADRs (`decisions/`), `sad-lite.md`, `system-context-canvas.md`, `quality-attribute-assessment.md`, `risk-register.md`, `adversarial-squad-gate.md`, `research/`, `validation/`. |
| `docs/contributing/` | `adding-a-component.md`, `adding-a-token.md`, `running-quality-checks.md`. |
| `docs/design-system/` | `using-tokens.md`, `using-components.md`, `brand-guidelines.md`, `changelog.md`. |
| `docs/learnings/` | Post-mission retrospectives. |
| `kitty-specs/` | Spec Kitty mission governance (specs, plans, work packages). |
| `.kittify/` | Spec Kitty runtime state and `charter/charter.md`. |
| `skills/spec-kitty-design/SKILL.md` | Project-local Claude Code skill (component scaffolding). |
| `scripts/` | Quality/security scripts (`npm-audit-gate.sh`, `generate-token-catalogue.js`, `check-action-pins.sh`, `assert-lockfile-clean.sh`, `check-token-breaking-changes.sh`). |
| `.github/workflows/{ci-quality.yml,storybook-deploy.yml,pr-preview.yml,release.yml}` | CI, deploy, PR preview, release. |
| `llms.txt` | Sectioned link index for agents. |

## 3. Hard rules (non-negotiable)

1. **Tokens first.** Every CSS value (colour, spacing, font-size, radius, shadow, motion, z-index) must reference a `var(--sk-*)` token defined in `packages/tokens/src/tokens.css`. No raw `rgba()`, `#hex`, or `Npx` literals in component CSS. Stylelint enforces via `stylelint-declaration-strict-value` against the generated catalogue.
2. **One-directional dependency boundary.** `packages/styles` imports only from `packages/tokens`; `elements` from styles and tokens; `react` from elements, styles and tokens. ESLint `@nx/enforce-module-boundaries` enforces it via `scope:` tags — and a project with **no** tag is not exempt, it is invisible to the rule, which reads the same from outside and is worse.
3. **Semantic pairing.** Surface and foreground tokens come in pairs (e.g. `--sk-surface-page` ↔ `--sk-on-page`). Don't mix across pairs.
4. **BEM naming.** `sk-block__element--modifier`. Block prefix is always `sk-`.
5. **Conventional commits** with scopes: `tokens`, `storybook`, `doctrine`, `ci`, `docs`, `release`, `deps`, `security`, `styles`, `elements`, `react`. Note the Spec Kitty CLI's own bookkeeping commits are exempted by pattern in `commitlint.config.cjs`; yours are not. Packages not yet created (ADR-8). Subject lowercase. `commitlint` runs on PRs.
6. **Every story has a `LightMode` variant.** Wraps output in `<div data-theme="light" style="background: var(--sk-surface-page); padding: var(--sk-space-6); display: inline-block;">` and sets `parameters.backgrounds.default: 'sk-light'`.
7. **Don't break the demo pages.** `apps/demo/*.html` link component CSS via relative paths (`../../packages/...`) for local file:// dev; `scripts/assemble-demo-dist.sh` rewrites those paths via `sed` before publishing (called by `storybook-deploy.yml`, and by `ci-quality.yml` so it is checked per PR). Verify both paths still resolve when adding a new component.

## 4. Common commands

| Task | Command |
|------|---------|
| Install | `npm ci --ignore-scripts` |
| Lint everything (eslint + stylelint + htmlhint) | `npm run quality:all` |
| Lint one Nx project | `npx nx run <project>:lint` |
| Stylelint only | `npm run quality:stylelint` |
| Build tokens + catalogue | `npx nx run tokens:build && npx nx run tokens:catalogue` |
| Regenerate token catalogue only | `npx nx run tokens:catalogue` (or `npm run tokens:catalogue`) |
| Build styles | `npx nx run styles:build` |
| Build elements | `npx nx run elements:build` |
| Regenerate the manifest | `npx nx run elements:analyze` |
| Regenerate the React wrappers | `node scripts/build-react-wrappers.mjs` |
| Build Storybook | `npx nx run storybook:storybook:build` |
| Run Storybook locally | `npx nx run storybook:storybook` |
| Security gate (npm audit) | `bash scripts/npm-audit-gate.sh` |
| Lockfile drift check | `npm run security:lockfile-check` |
| Action pin check | `bash scripts/check-action-pins.sh` |

> Stylelint requires `packages/tokens/dist/token-catalogue.json` to exist. Run `npx nx run tokens:catalogue` before lint if you've changed `tokens.css`, otherwise the strict-value rule fails on the missing catalogue.

## 5. Adding a new component (decision tree)

- **Need a new design value?** Add it to `packages/tokens/src/tokens.css`, then run `npx nx run tokens:catalogue`. If introducing a new token category (e.g. a new prefix), also update [`./docs/contributing/adding-a-token.md`](./docs/contributing/adding-a-token.md).
- **New component?** The CSS source of record goes in `packages/styles/src/<name>/`, and the
  custom element in `packages/elements/src/<name>/`. There is no third choice: since ADR-8 the
  element *is* the component, and its static HTML is generated from the element's own markup
  module.
- **A framework wrapper?** You do not write one. `@spec-kitty/react` is generated from the
  manifest, and a wrapper package exists only where a consumer needs one.

**Follow the recipe rather than this list:**
[`./docs/contributing/adding-a-component.md`](./docs/contributing/adding-a-component.md). It
names every gate a new component must pass — there are fourteen, several of which reject exactly
what a first attempt looks like — and the three ratchets (`expected-parts.json`,
`expected-docs.json`, `behaviours.json`) that a new component must be registered in. This section
deliberately does not restate them: two copies of a procedure drift.

Migrated to custom elements so far: `sk-card`, `sk-nav-pill`, `sk-form-input`, `sk-form-textarea`,
`sk-stub`. Everything else is still CSS-only in `packages/styles` — #77, #78 and #79 move the
rest. Use a migrated one as the pattern.

## 6. Storybook conventions

- **Title taxonomy** — pick the closest existing root: `Components/`, `Form/`, `Navigation/`, `Primitives/`, `Tags/`, `Tokens/`. Don't invent new top-level groups without a reason.
- **Required exports per story file:** `Default`, plus variants for state/size/etc., plus `LightMode`. The `LightMode` story is enforced by review, not lint — don't skip it.
- **Docs strings:** `parameters.docs.description.story` is encouraged for non-obvious behaviour.
- **JS-dependent components:** when a component depends on a JS module function (e.g. drawer toggling), attach it via a story decorator. Reference pattern: `packages/elements/src/nav-pill/sk-nav-pill.stories.ts` (`Elements/SkNavPill`) — behaviour belongs in a custom element on the ADR-8 base layer, not in a story decorator that assigns to `window`. The `CollapsedHamburger` story this line used to name was removed in #73 along with the helper it wired.
- **Backgrounds:** the `sk-light` and default backgrounds are configured in the Storybook preview; use `parameters.backgrounds.default: 'sk-light'` for the LightMode variant.

## 7. Spec Kitty governance

This repo uses Spec Kitty for structured spec-driven development.

- Missions live in `kitty-specs/<mission-slug>/` (current: `post-review-remediation-and-demo-deploy-01KQM7XS`, plus three completed missions).
- Charter (governance baseline) is at [`./.kittify/charter/charter.md`](./.kittify/charter/charter.md).
- Runtime state lives in `.kittify/runtime/` and `.kittify/workspaces/`.
- New work usually starts with `/spec-kitty.specify` → `/spec-kitty.plan` → `/spec-kitty.tasks`.
- Implementation runs via `/spec-kitty.implement` (per WP) or the `spec-kitty-implement-review` orchestration skill for the full loop.
- **Don't edit `kitty-specs/` artefacts manually** — use the CLI / skills. Manual edits desync runtime state.

## 8. LLM resources for this project

- [`./llms.txt`](./llms.txt) — sectioned link index (compact, ~4 KB). Start here for orientation.
- [`./llms-full.txt`](./llms-full.txt) — comprehensive context bundle (~40 KB) with token catalogue, component manifest, ADR summaries, install snippets.
- Storybook `index.json` (auto-emitted at build): `https://stijn-dejongh.github.io/spec-kitty-design/index.json`.
- Token catalogue JSON: `https://stijn-dejongh.github.io/spec-kitty-design/token-catalogue.json` (also at `packages/tokens/dist/token-catalogue.json` locally).
- ADR index: [`./docs/architecture/decisions/`](./docs/architecture/decisions/) (eight ADRs covering token format, monorepo topology, naming, doctrine distribution, supply chain, Storybook 10.x, multi-framework rendering).
- Component-usage doc: [`./docs/design-system/using-components.md`](./docs/design-system/using-components.md). Token-usage doc: [`./docs/design-system/using-tokens.md`](./docs/design-system/using-tokens.md).
- Project-local Claude Code skill: [`./skills/spec-kitty-design/SKILL.md`](./skills/spec-kitty-design/SKILL.md) — copy into your `~/.claude/skills/spec-kitty-design/` (or symlink) if you want a slash command for component scaffolding.

## 9. Common pitfalls

- **Forgetting `LightMode` story** — CI lint won't catch it; reviewers will. Always add it.
- **Cross-package import** — `@nx/enforce-module-boundaries` will fail with a clear error pointing to the rule. Re-route through `@spec-kitty/tokens` or compose at the consumer level.
- **Hardcoded colour / spacing in CSS** — stylelint fails with `Expected ... to be a token`. Add to `tokens.css` first, regenerate catalogue, then reference via `var(--sk-*)`.
- **Stale token catalogue** — symptoms are stylelint failures on tokens you just added. Run `npx nx run tokens:catalogue`.
- **Demo page path drift** — when adding a new component, check both (a) the local-dev relative path inside `apps/demo/<file>.html` resolves from disk, and (b) `scripts/assemble-demo-dist.sh`'s `sed` rewrite covers the new path mapping — it derives the copied component set from the demo pages, so a new component needs no allowlist edit.
- **Conventional-commit scope mismatch** — sticking a tokens change in a `styles`-scoped commit will pass commitlint but confuses release tooling. Match the scope to the package you actually changed.
- **Manual `kitty-specs/` edits** — break runtime state. Always go through skills / CLI.
