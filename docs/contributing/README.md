# Contributing to the Spec Kitty Design System

Welcome. This guide helps you get oriented quickly.

## What's here

| Guide | For |
|---|---|
| [Adding a token](adding-a-token.md) | Extending the `--sk-*` token namespace |
| [Adding a component](adding-a-component.md) | New Angular and HTML primitive components |
| [Running quality checks](running-quality-checks.md) | Local CI parity |

## Quick start

```bash
git clone https://github.com/stijn-dejongh/spec-kitty-design.git
cd spec-kitty-design
npm ci --ignore-scripts
npx nx show projects   # should list: tokens, angular, styles, storybook
npx nx run storybook:storybook   # opens at http://localhost:6006
```

## Before you submit a PR

- Run `npm run quality:all` — must exit 0
- Add a screenshot or visual diff for any component change
- Follow conventional commit format: `feat(scope): description`

## Architecture

See [docs/architecture/sad-lite.md](../architecture/sad-lite.md) for the system context,
package topology, and bounded context map. All architectural decisions are documented
as ADRs in [docs/architecture/decisions/](../architecture/decisions/).

**Charter requirement**: all mission specs must be checked against the ADRs before
planning begins. The charter's `architectural_review_requirement` enforces this.
